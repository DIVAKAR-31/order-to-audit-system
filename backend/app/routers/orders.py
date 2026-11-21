from datetime import datetime, timedelta
import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Order, OrderItem, OrderStatus, Product, Customer, Invoice, InvoiceItem, PaymentStatus
from ..schemas import OrderCreate, OrderStatusUpdate, OrderResponse, OrderItemResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/orders", tags=["Orders"])

def serialize_order(o: Order) -> OrderResponse:
    items = []
    for item in o.items:
        items.append(OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name if item.product else "N/A",
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_price=item.total_price
        ))
    return OrderResponse(
        id=o.id,
        order_number=o.order_number,
        customer_id=o.customer_id,
        customer_name=o.customer.name if o.customer else "Unknown",
        customer_city=o.customer.city if o.customer else "",
        customer_state=o.customer.state if o.customer else "",
        salesman_id=o.salesman_id,
        salesman_name=o.salesman.full_name if o.salesman else "N/A",
        status=o.status,
        total_amount=o.total_amount,
        notes=o.notes,
        created_at=o.created_at,
        updated_at=o.updated_at,
        items=items
    )

@router.get("", response_model=List[OrderResponse])
def get_orders(
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Order)
    if status and status != "All":
        query = query.filter(Order.status == status)
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    orders = query.order_by(Order.created_at.desc()).all()
    return [serialize_order(o) for o in orders]

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return serialize_order(order)

@router.post("", response_model=OrderResponse)
def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == order_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if not order_in.items:
        raise HTTPException(status_code=400, detail="Order must have at least one product item")

    # Generate sequential order number
    count = db.query(Order).count() + 1
    order_number = f"ORD-{datetime.utcnow().year}-{count:03d}"

    salesman_id = order_in.salesman_id or current_user.id

    order = Order(
        order_number=order_number,
        customer_id=customer.id,
        salesman_id=salesman_id,
        status=OrderStatus.PENDING.value,
        total_amount=0.0,
        notes=order_in.notes,
        created_at=datetime.utcnow()
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    total_amount = 0.0
    for itm in order_in.items:
        product = db.query(Product).filter(Product.id == itm.product_id).first()
        if not product:
            continue
        line_total = itm.quantity * itm.unit_price
        total_amount += line_total
        order_item = OrderItem(
            order_id=order.id,
            product_id=itm.product_id,
            quantity=itm.quantity,
            unit_price=itm.unit_price,
            total_price=line_total
        )
        db.add(order_item)

    order.total_amount = round(total_amount, 2)
    db.commit()
    db.refresh(order)
    return serialize_order(order)

@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    status_update: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.status
    new_status = status_update.status
    order.status = new_status
    order.updated_at = datetime.utcnow()

    # When marked DISPATCHED, automatically:
    # 1. Deduct finished packets from stock
    # 2. Generate tax invoice with 5% GST (Tamil Nadu vs Interstate)
    # 3. Update customer outstanding balance
    if new_status == OrderStatus.DISPATCHED.value and old_status != OrderStatus.DISPATCHED.value:
        # 1. Update stock
        for itm in order.items:
            product = db.query(Product).filter(Product.id == itm.product_id).first()
            if product:
                product.stock_quantity = max(0, product.stock_quantity - itm.quantity)

        # 2. Create Invoice if not already created
        if not order.invoice:
            customer = order.customer
            is_tn = (customer.state.strip().lower() == "tamil nadu") if customer and customer.state else True
            subtotal = order.total_amount

            if is_tn:
                cgst_rate = 2.5
                sgst_rate = 2.5
                igst_rate = 0.0
                cgst_amt = round(subtotal * 0.025, 2)
                sgst_amt = round(subtotal * 0.025, 2)
                igst_amt = 0.0
                total_tax = round(cgst_amt + sgst_amt, 2)
            else:
                cgst_rate = 0.0
                sgst_rate = 0.0
                igst_rate = 5.0
                cgst_amt = 0.0
                sgst_amt = 0.0
                igst_amt = round(subtotal * 0.05, 2)
                total_tax = igst_amt

            grand_total = round(subtotal + total_tax, 2)
            inv_count = db.query(Invoice).count() + 1
            inv_num = f"INV-{datetime.utcnow().year}-{inv_count:03d}"

            invoice = Invoice(
                invoice_number=inv_num,
                order_id=order.id,
                customer_id=order.customer_id,
                invoice_date=datetime.utcnow(),
                due_date=datetime.utcnow() + timedelta(days=30),
                subtotal=subtotal,
                is_tamil_nadu=is_tn,
                cgst_rate=cgst_rate,
                cgst_amount=cgst_amt,
                sgst_rate=sgst_rate,
                sgst_amount=sgst_amt,
                igst_rate=igst_rate,
                igst_amount=igst_amt,
                total_tax=total_tax,
                grand_total=grand_total,
                paid_amount=0.0,
                balance_due=grand_total,
                payment_status=PaymentStatus.UNPAID.value,
                notes=f"Auto-generated on dispatch of order {order.order_number}"
            )
            db.add(invoice)
            db.commit()
            db.refresh(invoice)

            for itm in order.items:
                inv_item = InvoiceItem(
                    invoice_id=invoice.id,
                    product_id=itm.product_id,
                    product_name=itm.product.name if itm.product else "Snack Item",
                    hsn_code="21069099",
                    quantity=itm.quantity,
                    unit_price=itm.unit_price,
                    tax_rate=5.0,
                    amount=itm.total_price
                )
                db.add(inv_item)

            # 3. Update customer outstanding balance
            if customer:
                customer.outstanding_balance = round(customer.outstanding_balance + grand_total, 2)

    db.commit()
    db.refresh(order)
    return serialize_order(order)
