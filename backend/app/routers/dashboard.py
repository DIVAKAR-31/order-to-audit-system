from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Order, OrderStatus, Product, ProductionBatch, Customer, Invoice, InventoryItem, Payment
from ..schemas import DashboardStats
from ..auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Total sales from all invoices
    total_sales = db.query(func.coalesce(func.sum(Invoice.grand_total), 0.0)).scalar()
    
    # Today's orders count
    today_orders_count = db.query(Order).filter(Order.created_at >= today_start).count()
    
    # Total available finished packets in stock
    available_stock_packets = db.query(func.coalesce(func.sum(Product.stock_quantity), 0)).scalar()
    
    # Pending orders count
    pending_orders_count = db.query(Order).filter(Order.status == OrderStatus.PENDING.value).count()
    
    # Approved orders count
    approved_orders_count = db.query(Order).filter(Order.status == OrderStatus.APPROVED.value).count()
    
    # Today's production packets produced
    today_prod = db.query(func.coalesce(func.sum(ProductionBatch.actual_packets), 0))\
        .filter(ProductionBatch.batch_date >= today_start).scalar()
    
    # Outstanding receivables
    total_receivables = db.query(func.coalesce(func.sum(Customer.outstanding_balance), 0.0)).scalar()
    
    # Low stock items alert count (products + inventory below threshold)
    low_product_stock = db.query(Product).filter(Product.stock_quantity <= Product.min_threshold).count()
    low_inv_stock = db.query(InventoryItem).filter(InventoryItem.current_stock <= InventoryItem.min_threshold).count()
    low_stock_alerts = low_product_stock + low_inv_stock
    
    # Recent orders
    recent_orders_db = db.query(Order).order_by(Order.created_at.desc()).limit(5).all()
    recent_orders = [
        {
            "id": o.id,
            "order_number": o.order_number,
            "customer_name": o.customer.name if o.customer else "Unknown",
            "city": o.customer.city if o.customer else "",
            "state": o.customer.state if o.customer else "",
            "status": o.status,
            "total_amount": o.total_amount,
            "created_at": o.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for o in recent_orders_db
    ]

    # Category distribution for snacks
    cat_query = db.query(
        Product.category,
        func.count(Product.id).label("product_count"),
        func.coalesce(func.sum(Product.stock_quantity), 0).label("total_stock")
    ).group_by(Product.category).all()
    
    category_sales = [
        {
            "category": cat[0],
            "product_count": cat[1],
            "total_stock": cat[2]
        }
        for cat in cat_query
    ]

    # Recent batches
    recent_batches_db = db.query(ProductionBatch).order_by(ProductionBatch.batch_date.desc()).limit(4).all()
    recent_batches = [
        {
            "id": b.id,
            "batch_number": b.batch_number,
            "product_name": b.product.name if b.product else "N/A",
            "expected_packets": b.expected_packets,
            "actual_packets": b.actual_packets,
            "wastage_percentage": b.wastage_percentage,
            "wastage_kg": b.wastage_kg,
            "status": b.status,
            "date": b.batch_date.strftime("%d %b %Y")
        }
        for b in recent_batches_db
    ]

    # Monthly Trend (Simulated realistic 6 month timeline)
    months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]
    monthly_trend = [
        {"month": "Jun", "sales": 185000, "production": 3200, "wastage": 2.4},
        {"month": "Jul", "sales": 210000, "production": 3800, "wastage": 2.1},
        {"month": "Aug", "sales": 260000, "production": 4500, "wastage": 1.9},
        {"month": "Sep", "sales": 295000, "production": 4900, "wastage": 1.8},
        {"month": "Oct", "sales": 410000, "production": 6800, "wastage": 1.6}, # Diwali surge
        {"month": "Nov", "sales": 340000, "production": 5600, "wastage": 1.7},
    ]

    return {
        "total_sales": total_sales,
        "today_orders_count": today_orders_count,
        "available_stock_packets": available_stock_packets,
        "pending_orders_count": pending_orders_count,
        "approved_orders_count": approved_orders_count,
        "today_production_packets": today_prod,
        "total_receivables": total_receivables,
        "low_stock_alerts": low_stock_alerts,
        "recent_orders": recent_orders,
        "category_sales": category_sales,
        "monthly_trend": monthly_trend,
        "recent_batches": recent_batches
    }
