from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..database import get_db
from ..models import InventoryItem
from ..schemas import InventoryItemCreate, InventoryStockAdjust, InventoryItemResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])

@router.get("", response_model=List[InventoryItemResponse])
def get_inventory(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(InventoryItem)
    if category and category != "All":
        query = query.filter(InventoryItem.category == category)
    if search:
        s = f"%{search}%"
        query = query.filter((InventoryItem.name.ilike(s)) | (InventoryItem.item_code.ilike(s)))
    return query.order_by(InventoryItem.category.asc(), InventoryItem.name.asc()).all()

@router.post("", response_model=InventoryItemResponse)
def create_inventory_item(
    item_in: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    existing = db.query(InventoryItem).filter(InventoryItem.item_code == item_in.item_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Item code already exists")
    item = InventoryItem(**item_in.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.post("/{item_id}/adjust", response_model=InventoryItemResponse)
def adjust_inventory_stock(
    item_id: int,
    adj: InventoryStockAdjust,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    new_stock = item.current_stock + adj.quantity_change
    if new_stock < 0:
        raise HTTPException(status_code=400, detail=f"Stock cannot be negative. Current stock is {item.current_stock} {item.unit}")

    item.current_stock = round(new_stock, 2)
    item.last_updated = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(
    item_id: int,
    item_in: InventoryItemCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    for k, v in item_in.model_dump().items():
        setattr(item, k, v)

    item.last_updated = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_inventory_item(item_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    db.delete(item)
    db.commit()
    return {"message": "Inventory item removed successfully", "id": item_id}
