from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
import enum
from .database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    SALESMAN = "salesman"
    PRODUCTION_SUPERVISOR = "production_supervisor"
    ACCOUNTANT = "accountant"

class OrderStatus(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    DISPATCHED = "Dispatched"

class PaymentStatus(str, enum.Enum):
    UNPAID = "Unpaid"
    PARTIALLY_PAID = "Partially Paid"
    PAID = "Paid"

class InventoryCategory(str, enum.Enum):
    RAW_MATERIAL = "Raw Material"
    FINISHED_GOODS = "Finished Goods"
    PACKAGING_MATERIAL = "Packaging Material"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False, default=UserRole.SALESMAN.value)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="salesman")
    production_batches = relationship("ProductionBatch", back_populates="supervisor")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    code = Column(String(30), unique=True, nullable=False)
    category = Column(String(50), nullable=False) # Murukku, Mixture, Chips, Sweets
    unit = Column(String(20), default="packets")
    package_size = Column(String(30), default="200g") # 200g, 500g, 1kg
    price = Column(Float, nullable=False) # Selling price per packet
    cost_price = Column(Float, default=0.0) # Production cost per packet
    stock_quantity = Column(Integer, default=0) # Packets available
    min_threshold = Column(Integer, default=20)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order_items = relationship("OrderItem", back_populates="product")
    production_batches = relationship("ProductionBatch", back_populates="product")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    contact_person = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=False)
    email = Column(String(100), nullable=True)
    customer_type = Column(String(30), default="Retailer") # Retailer, Distributor
    gstin = Column(String(30), nullable=True)
    address = Column(Text, nullable=False)
    city = Column(String(50), nullable=False)
    state = Column(String(50), nullable=False, default="Tamil Nadu") # Crucial for 5% GST (TN = CGST+SGST, others = IGST)
    pincode = Column(String(10), nullable=True)
    credit_limit = Column(Float, default=50000.0)
    outstanding_balance = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="customer")
    invoices = relationship("Invoice", back_populates="customer")
    payments = relationship("Payment", back_populates="customer")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(30), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    salesman_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    status = Column(String(20), default=OrderStatus.PENDING.value)
    total_amount = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="orders")
    salesman = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    invoice = relationship("Invoice", back_populates="order", uselist=False)

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    item_code = Column(String(30), unique=True, nullable=False)
    category = Column(String(40), nullable=False) # Raw Material, Finished Goods, Packaging Material
    unit = Column(String(20), nullable=False) # kg, litre, packets, rolls, pieces
    current_stock = Column(Float, default=0.0)
    min_threshold = Column(Float, default=10.0)
    unit_cost = Column(Float, default=0.0)
    supplier_name = Column(String(100), nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    materials_used = relationship("ProductionMaterialUsed", back_populates="inventory_item")

class ProductionBatch(Base):
    __tablename__ = "production_batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_number = Column(String(30), unique=True, index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    supervisor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    batch_date = Column(DateTime, default=datetime.utcnow)
    
    # Input weight and target packet size in grams
    raw_material_weight_kg = Column(Float, nullable=False) # total dough/mix weight
    packet_size_g = Column(Float, nullable=False, default=200.0) # grams per packet
    
    expected_packets = Column(Integer, nullable=False)
    actual_packets = Column(Integer, nullable=False)
    
    # Wastage calculation
    wastage_kg = Column(Float, default=0.0)
    wastage_percentage = Column(Float, default=0.0)
    variance_packets = Column(Integer, default=0) # actual - expected
    
    status = Column(String(20), default="Completed")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="production_batches")
    supervisor = relationship("User", back_populates="production_batches")
    materials_used = relationship("ProductionMaterialUsed", back_populates="batch", cascade="all, delete-orphan")

class ProductionMaterialUsed(Base):
    __tablename__ = "production_materials_used"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("production_batches.id"), nullable=False)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity_used = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)

    batch = relationship("ProductionBatch", back_populates="materials_used")
    inventory_item = relationship("InventoryItem", back_populates="materials_used")

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(30), unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    invoice_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    
    subtotal = Column(Float, nullable=False)
    is_tamil_nadu = Column(Boolean, default=True)
    
    # 5% GST breakdown:
    # If Tamil Nadu: CGST 2.5% + SGST 2.5%
    # If Other States: IGST 5.0%
    cgst_rate = Column(Float, default=2.5)
    cgst_amount = Column(Float, default=0.0)
    sgst_rate = Column(Float, default=2.5)
    sgst_amount = Column(Float, default=0.0)
    igst_rate = Column(Float, default=5.0)
    igst_amount = Column(Float, default=0.0)
    total_tax = Column(Float, nullable=False)
    grand_total = Column(Float, nullable=False)
    
    paid_amount = Column(Float, default=0.0)
    balance_due = Column(Float, default=0.0)
    payment_status = Column(String(20), default=PaymentStatus.UNPAID.value)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="invoice")
    customer = relationship("Customer", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    product_name = Column(String(100), nullable=False)
    hsn_code = Column(String(20), default="21069099") # South Indian snacks HSN code
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    tax_rate = Column(Float, default=5.0)
    amount = Column(Float, nullable=False)

    invoice = relationship("Invoice", back_populates="items")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    receipt_number = Column(String(30), unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    amount = Column(Float, nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow)
    payment_mode = Column(String(40), default="Bank Transfer / NEFT") # Cash, UPI, Cheque, Bank Transfer / NEFT
    reference_number = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="payments")
    invoice = relationship("Invoice", back_populates="payments")
