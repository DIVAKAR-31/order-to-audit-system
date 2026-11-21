from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Payment, Customer, Invoice, PaymentStatus
from ..schemas import PaymentCreate, PaymentResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/payments", tags=["Payments"])

def serialize_payment(p: Payment) -> PaymentResponse:
    return PaymentResponse(
        id=p.id,
        receipt_number=p.receipt_number,
        customer_id=p.customer_id,
        customer_name=p.customer.name if p.customer else "Unknown",
        invoice_id=p.invoice_id,
        invoice_number=p.invoice.invoice_number if p.invoice else None,
        amount=p.amount,
        payment_date=p.payment_date,
        payment_mode=p.payment_mode,
        reference_number=p.reference_number,
        notes=p.notes,
        created_at=p.created_at
    )

@router.get("", response_model=List[PaymentResponse])
def get_payments(
    customer_id: Optional[int] = None,
    invoice_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Payment)
    if customer_id:
        query = query.filter(Payment.customer_id == customer_id)
    if invoice_id:
        query = query.filter(Payment.invoice_id == invoice_id)
    payments = query.order_by(Payment.payment_date.desc()).all()
    return [serialize_payment(p) for p in payments]

@router.post("", response_model=PaymentResponse)
def record_payment(
    payment_in: PaymentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == payment_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    count = db.query(Payment).count() + 1
    receipt_number = f"RCP-{datetime.utcnow().year}-{count:03d}"

    payment = Payment(
        receipt_number=receipt_number,
        customer_id=customer.id,
        invoice_id=payment_in.invoice_id,
        amount=round(payment_in.amount, 2),
        payment_date=datetime.utcnow(),
        payment_mode=payment_in.payment_mode,
        reference_number=payment_in.reference_number,
        notes=payment_in.notes,
        created_at=datetime.utcnow()
    )
    db.add(payment)

    # Update Customer balance
    customer.outstanding_balance = max(0.0, round(customer.outstanding_balance - payment_in.amount, 2))

    # If linked to specific invoice, update invoice paid amount & balance
    if payment_in.invoice_id:
        inv = db.query(Invoice).filter(Invoice.id == payment_in.invoice_id).first()
        if inv:
            inv.paid_amount = round(inv.paid_amount + payment_in.amount, 2)
            inv.balance_due = max(0.0, round(inv.grand_total - inv.paid_amount, 2))
            if inv.balance_due <= 0.01:
                inv.payment_status = PaymentStatus.PAID.value
            else:
                inv.payment_status = PaymentStatus.PARTIALLY_PAID.value

    db.commit()
    db.refresh(payment)
    return serialize_payment(payment)
