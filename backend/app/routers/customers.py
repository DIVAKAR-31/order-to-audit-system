from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Customer
from ..schemas import CustomerCreate, CustomerUpdate, CustomerResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("", response_model=List[CustomerResponse])
def get_customers(
    customer_type: Optional[str] = None,
    state: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Customer).filter(Customer.is_active == True)
    if customer_type and customer_type != "All":
        query = query.filter(Customer.customer_type == customer_type)
    if state and state != "All":
        query = query.filter(Customer.state == state)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Customer.name.ilike(s)) |
            (Customer.contact_person.ilike(s)) |
            (Customer.city.ilike(s)) |
            (Customer.phone.ilike(s))
        )
    return query.order_by(Customer.name.asc()).all()

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.is_active == True).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("", response_model=CustomerResponse)
def create_customer(customer_in: CustomerCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    customer = Customer(**customer_in.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    update_data = customer_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
        
    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer.is_active = False
    db.commit()
    return {"message": "Customer deleted successfully", "id": customer_id}
