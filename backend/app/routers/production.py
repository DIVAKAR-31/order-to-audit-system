from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import ProductionBatch, ProductionMaterialUsed, Product, InventoryItem
from ..schemas import ProductionBatchCreate, ProductionBatchResponse, MaterialUsedResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/production", tags=["Production"])

def serialize_batch(b: ProductionBatch) -> ProductionBatchResponse:
    materials = [
        MaterialUsedResponse(
            id=m.id,
            inventory_item_id=m.inventory_item_id,
            item_name=m.inventory_item.name if m.inventory_item else "N/A",
            quantity_used=m.quantity_used,
            unit=m.unit
        )
        for m in b.materials_used
    ]
    return ProductionBatchResponse(
        id=b.id,
        batch_number=b.batch_number,
        product_id=b.product_id,
        product_name=b.product.name if b.product else "N/A",
        supervisor_id=b.supervisor_id,
        supervisor_name=b.supervisor.full_name if b.supervisor else "Plant Team",
        batch_date=b.batch_date,
        raw_material_weight_kg=b.raw_material_weight_kg,
        packet_size_g=b.packet_size_g,
        expected_packets=b.expected_packets,
        actual_packets=b.actual_packets,
        wastage_kg=b.wastage_kg,
        wastage_percentage=b.wastage_percentage,
        variance_packets=b.variance_packets,
        status=b.status,
        notes=b.notes,
        created_at=b.created_at,
        materials_used=materials
    )

@router.get("", response_model=List[ProductionBatchResponse])
def get_production_batches(
    product_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(ProductionBatch)
    if product_id:
        query = query.filter(ProductionBatch.product_id == product_id)
    batches = query.order_by(ProductionBatch.batch_date.desc()).all()
    return [serialize_batch(b) for b in batches]

@router.post("", response_model=ProductionBatchResponse)
def create_production_batch(
    batch_in: ProductionBatchCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    product = db.query(Product).filter(Product.id == batch_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Target product not found")

    # Generate Batch Number
    count = db.query(ProductionBatch).count() + 1
    batch_number = f"BAT-{datetime.utcnow().year}-{count:03d}"

    # Calculate metrics
    # e.g. 100 kg dough and 200g packet -> expected = 100 / 0.200 = 500 packets
    packet_weight_kg = (batch_in.packet_size_g or 200.0) / 1000.0
    expected_packets = batch_in.expected_packets or int(batch_in.raw_material_weight_kg / packet_weight_kg)
    actual_packets = batch_in.actual_packets

    variance_packets = actual_packets - expected_packets
    actual_weight_produced_kg = round(actual_packets * packet_weight_kg, 2)
    wastage_kg = round(max(0.0, batch_in.raw_material_weight_kg - actual_weight_produced_kg), 2)
    wastage_percentage = round((wastage_kg / batch_in.raw_material_weight_kg) * 100.0, 2) if batch_in.raw_material_weight_kg > 0 else 0.0

    batch = ProductionBatch(
        batch_number=batch_number,
        product_id=product.id,
        supervisor_id=batch_in.supervisor_id or current_user.id,
        batch_date=datetime.utcnow(),
        raw_material_weight_kg=batch_in.raw_material_weight_kg,
        packet_size_g=batch_in.packet_size_g,
        expected_packets=expected_packets,
        actual_packets=actual_packets,
        wastage_kg=wastage_kg,
        wastage_percentage=wastage_percentage,
        variance_packets=variance_packets,
        status="Completed",
        notes=batch_in.notes,
        created_at=datetime.utcnow()
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    # 1. Update Product Finished Stock
    product.stock_quantity = product.stock_quantity + actual_packets

    # 2. Record materials used and deduct from inventory stock
    for mat in batch_in.materials_used:
        inv_item = db.query(InventoryItem).filter(InventoryItem.id == mat.inventory_item_id).first()
        if inv_item:
            inv_item.current_stock = max(0.0, round(inv_item.current_stock - mat.quantity_used, 2))
            inv_item.last_updated = datetime.utcnow()
            mat_used = ProductionMaterialUsed(
                batch_id=batch.id,
                inventory_item_id=inv_item.id,
                quantity_used=mat.quantity_used,
                unit=mat.unit
            )
            db.add(mat_used)

    db.commit()
    db.refresh(batch)
    return serialize_batch(batch)
