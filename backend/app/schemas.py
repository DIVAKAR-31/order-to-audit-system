from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

# Auth & User schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserResponse"

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Product schemas
class ProductBase(BaseModel):
    name: str
    code: str
    category: str
    unit: str = "packets"
    package_size: str = "200g"
    price: float
    cost_price: float = 0.0
    stock_quantity: int = 0
    min_threshold: int = 20
    description: Optional[str] = None
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    package_size: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    min_threshold: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Customer schemas
class CustomerBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: str
    email: Optional[str] = None
    customer_type: str = "Retailer"
    gstin: Optional[str] = None
    address: str
    city: str
    state: str = "Tamil Nadu"
    pincode: Optional[str] = None
    credit_limit: float = 50000.0
    outstanding_balance: float = 0.0
    is_active: bool = True

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    customer_type: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    credit_limit: Optional[float] = None
    outstanding_balance: Optional[float] = None
    is_active: Optional[bool] = None

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Order Schemas
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    unit_price: float
    total_price: float

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    customer_id: int
    salesman_id: Optional[int] = None
    notes: Optional[str] = None
    items: List[OrderItemCreate]

class OrderStatusUpdate(BaseModel):
    status: str # Pending, Approved, Rejected, Dispatched

class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_id: int
    customer_name: Optional[str] = None
    customer_city: Optional[str] = None
    customer_state: Optional[str] = None
    salesman_id: Optional[int] = None
    salesman_name: Optional[str] = None
    status: str
    total_amount: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True

# Inventory Schemas
class InventoryItemBase(BaseModel):
    name: str
    item_code: str
    category: str # Raw Material, Finished Goods, Packaging Material
    unit: str # kg, litre, packets, rolls, pieces
    current_stock: float
    min_threshold: float = 10.0
    unit_cost: float = 0.0
    supplier_name: Optional[str] = None

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryStockAdjust(BaseModel):
    quantity_change: float # positive for addition/purchase, negative for consumption/wastage
    reason: str

class InventoryItemResponse(InventoryItemBase):
    id: int
    last_updated: datetime

    class Config:
        from_attributes = True

# Production Schemas
class MaterialUsedInput(BaseModel):
    inventory_item_id: int
    quantity_used: float
    unit: str

class MaterialUsedResponse(BaseModel):
    id: int
    inventory_item_id: int
    item_name: Optional[str] = None
    quantity_used: float
    unit: str

    class Config:
        from_attributes = True

class ProductionBatchCreate(BaseModel):
    product_id: int
    supervisor_id: Optional[int] = None
    raw_material_weight_kg: float
    packet_size_g: float = 200.0
    expected_packets: int
    actual_packets: int
    notes: Optional[str] = None
    materials_used: List[MaterialUsedInput] = []

class ProductionBatchResponse(BaseModel):
    id: int
    batch_number: str
    product_id: int
    product_name: Optional[str] = None
    supervisor_id: Optional[int] = None
    supervisor_name: Optional[str] = None
    batch_date: datetime
    raw_material_weight_kg: float
    packet_size_g: float
    expected_packets: int
    actual_packets: int
    wastage_kg: float
    wastage_percentage: float
    variance_packets: int
    status: str
    notes: Optional[str] = None
    created_at: datetime
    materials_used: List[MaterialUsedResponse] = []

    class Config:
        from_attributes = True

# Invoice Schemas
class InvoiceItemResponse(BaseModel):
    id: int
    product_id: Optional[int]
    product_name: str
    hsn_code: str
    quantity: int
    unit_price: float
    tax_rate: float
    amount: float

    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    order_id: Optional[int] = None
    customer_id: int
    notes: Optional[str] = None

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    order_id: Optional[int] = None
    customer_id: int
    customer_name: Optional[str] = None
    customer_gstin: Optional[str] = None
    customer_address: Optional[str] = None
    customer_state: Optional[str] = None
    invoice_date: datetime
    due_date: Optional[datetime] = None
    subtotal: float
    is_tamil_nadu: bool
    cgst_rate: float
    cgst_amount: float
    sgst_rate: float
    sgst_amount: float
    igst_rate: float
    igst_amount: float
    total_tax: float
    grand_total: float
    paid_amount: float
    balance_due: float
    payment_status: str
    notes: Optional[str] = None
    created_at: datetime
    items: List[InvoiceItemResponse] = []

    class Config:
        from_attributes = True

# Payment Schemas
class PaymentCreate(BaseModel):
    customer_id: int
    invoice_id: Optional[int] = None
    amount: float
    payment_mode: str = "Bank Transfer / NEFT"
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    receipt_number: str
    customer_id: int
    customer_name: Optional[str] = None
    invoice_id: Optional[int] = None
    invoice_number: Optional[str] = None
    amount: float
    payment_date: datetime
    payment_mode: str
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Dashboard Stats Schema
class DashboardStats(BaseModel):
    total_sales: float
    today_orders_count: int
    available_stock_packets: int
    pending_orders_count: int
    approved_orders_count: int
    today_production_packets: int
    total_receivables: float
    low_stock_alerts: int
    recent_orders: List[dict] = []
    category_sales: List[dict] = []
    monthly_trend: List[dict] = []
    recent_batches: List[dict] = []
