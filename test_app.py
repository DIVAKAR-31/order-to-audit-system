import os
import sys
import time
import subprocess
import urllib.request
import json

os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"
sys.path.insert(0, "backend")

from app.database import SessionLocal
from app.models import Product, Customer, Order, InventoryItem, ProductionBatch, Invoice, Payment

db = SessionLocal()
products_count = db.query(Product).count()
customers_count = db.query(Customer).count()
orders_count = db.query(Order).count()
inventory_count = db.query(InventoryItem).count()
batches_count = db.query(ProductionBatch).count()
invoices_count = db.query(Invoice).count()
payments_count = db.query(Payment).count()
db.close()

print(f"--- DATABASE AUDIT SUMMARY ---")
print(f"Products in DB: {products_count}")
print(f"Customers in DB: {customers_count}")
print(f"Orders in DB: {orders_count}")
print(f"Inventory Items in DB: {inventory_count}")
print(f"Production Batches in DB: {batches_count}")
print(f"Invoices in DB: {invoices_count}")
print(f"Payments in DB: {payments_count}")

# Start uvicorn server in background
proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
    cwd="backend",
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE
)

time.sleep(3)

try:
    endpoints = [
        ("Health Check", "http://127.0.0.1:8000/api/health"),
        ("Dashboard Stats", "http://127.0.0.1:8000/api/dashboard/stats"),
        ("Products List", "http://127.0.0.1:8000/api/products"),
        ("Customers List", "http://127.0.0.1:8000/api/customers"),
        ("Orders List", "http://127.0.0.1:8000/api/orders"),
        ("Inventory List", "http://127.0.0.1:8000/api/inventory"),
        ("Production Batches", "http://127.0.0.1:8000/api/production"),
        ("Invoices List", "http://127.0.0.1:8000/api/invoices"),
        ("Invoice 1 PDF Download", "http://127.0.0.1:8000/api/invoices/1/pdf"),
        ("Reports Summary", "http://127.0.0.1:8000/api/reports/summary"),
        ("Reports Excel Export", "http://127.0.0.1:8000/api/reports/export/excel"),
        ("Reports PDF Export", "http://127.0.0.1:8000/api/reports/export/pdf"),
        ("Frontend Single Page App Root", "http://127.0.0.1:8000/"),
    ]

    all_passed = True
    print("\n--- API & FRONTEND INTEGRATION TEST RESULTS ---")
    for name, url in endpoints:
        req = urllib.request.Request(url)
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                status = response.getcode()
                content_type = response.headers.get("content-type", "")
                length = len(response.read())
                print(f"[PASS] {name:<30} -> Status: {status} | Type: {content_type[:25]:<25} | Bytes: {length}")
        except Exception as e:
            all_passed = False
            print(f"[FAIL] {name:<30} -> Error: {e}")

    if all_passed:
        print("\nALL 13 ENDPOINT INTEGRATION TESTS PASSED SUCCESSFULLY!")
    else:
        print("\nSOME TESTS FAILED.")
finally:
    proc.terminate()
    proc.wait()
