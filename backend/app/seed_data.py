from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .models import (
    User, UserRole, Product, Customer, Order, OrderItem, OrderStatus,
    InventoryItem, InventoryCategory, ProductionBatch, ProductionMaterialUsed,
    Invoice, InvoiceItem, Payment, PaymentStatus
)
from .auth import get_password_hash

def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).first():
        return

    print("Seeding Order-to-Audit South Indian Snacks Manufacturing database...")

    # 1. Users for each role
    users = [
        User(
            username="admin",
            email="admin@ordertoaudit.com",
            full_name="Rajesh Kumar (Managing Director)",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN.value,
        ),
        User(
            username="salesman",
            email="sales@ordertoaudit.com",
            full_name="Senthil Nathan (Senior Sales Executive)",
            hashed_password=get_password_hash("sales123"),
            role=UserRole.SALESMAN.value,
        ),
        User(
            username="supervisor",
            email="production@ordertoaudit.com",
            full_name="Muthuraman (Plant Supervisor)",
            hashed_password=get_password_hash("prod123"),
            role=UserRole.PRODUCTION_SUPERVISOR.value,
        ),
        User(
            username="accountant",
            email="accounts@ordertoaudit.com",
            full_name="Lakshmi Narayanan (Chief Accountant)",
            hashed_password=get_password_hash("acc123"),
            role=UserRole.ACCOUNTANT.value,
        ),
    ]
    for u in users:
        db.add(u)
    db.commit()

    # Retrieve created users for relationships
    admin_user = db.query(User).filter(User.username == "admin").first()
    sales_user = db.query(User).filter(User.username == "salesman").first()
    prod_user = db.query(User).filter(User.username == "supervisor").first()

    # 2. Products (Murukku, Mixture, Chips, Sweets)
    products = [
        # Murukku
        Product(
            name="Classic Kai Murukku 200g",
            code="PRD-MRK-001",
            category="Murukku",
            package_size="200g",
            unit="packets",
            price=65.0,
            cost_price=38.0,
            stock_quantity=450,
            min_threshold=50,
            description="Traditional hand-twisted crunchy rice & urad dal murukku made with pure butter and asafoetida."
        ),
        Product(
            name="Crispy Butter Murukku 200g",
            code="PRD-MRK-002",
            category="Murukku",
            package_size="200g",
            unit="packets",
            price=60.0,
            cost_price=35.0,
            stock_quantity=320,
            min_threshold=40,
            description="Melt-in-mouth soft and crispy butter murukku seasoned with cumin and sesame seeds."
        ),
        Product(
            name="Spicy Mullu Murukku 250g",
            code="PRD-MRK-003",
            category="Murukku",
            package_size="250g",
            unit="packets",
            price=75.0,
            cost_price=42.0,
            stock_quantity=280,
            min_threshold=35,
            description="Thorny spiky spicy star murukku prepared with premium gram flour and Guntur red chilli powder."
        ),
        Product(
            name="Ribbon Pakoda / Seeval 200g",
            code="PRD-MRK-004",
            category="Murukku",
            package_size="200g",
            unit="packets",
            price=55.0,
            cost_price=32.0,
            stock_quantity=500,
            min_threshold=50,
            description="Flat crunchy ribbon ribbons flavored with garlic, roasted gram and curry leaves."
        ),

        # Mixture
        Product(
            name="Madras Royal Mixture 200g",
            code="PRD-MIX-001",
            category="Mixture",
            package_size="200g",
            unit="packets",
            price=70.0,
            cost_price=40.0,
            stock_quantity=380,
            min_threshold=40,
            description="Famous Chennai style mixture packed with spicy boondi, sev, fried peanuts, roasted cashews, and crispy curry leaves."
        ),
        Product(
            name="Kara Boondi Spicy 200g",
            code="PRD-MIX-002",
            category="Mixture",
            package_size="200g",
            unit="packets",
            price=55.0,
            cost_price=31.0,
            stock_quantity=260,
            min_threshold=30,
            description="Spherical crispy golden gram flour droplets tempered with garlic, peanuts and fresh curry leaves."
        ),
        Product(
            name="Corn Flakes Mixture 200g",
            code="PRD-MIX-003",
            category="Mixture",
            package_size="200g",
            unit="packets",
            price=65.0,
            cost_price=36.0,
            stock_quantity=190,
            min_threshold=30,
            description="Sweet and spicy roasted corn flakes tossed with raisins, cashews, and mild masala."
        ),

        # Chips
        Product(
            name="Nendran Banana Chips Coconut Oil 200g",
            code="PRD-CHP-001",
            category="Chips",
            package_size="200g",
            unit="packets",
            price=85.0,
            cost_price=48.0,
            stock_quantity=420,
            min_threshold=40,
            description="Authentic yellow ripe raw Nendran bananas thinly sliced and deep fried in 100% pure cold-pressed coconut oil."
        ),
        Product(
            name="Tapioca / Maravalli Kizhangu Chips 200g",
            code="PRD-CHP-002",
            category="Chips",
            package_size="200g",
            unit="packets",
            price=50.0,
            cost_price=27.0,
            stock_quantity=310,
            min_threshold=35,
            description="Crispy Salem tapioca sticks sprinkled with sea salt and red chilli powder."
        ),
        Product(
            name="Spicy Potato Wafers 150g",
            code="PRD-CHP-003",
            category="Chips",
            package_size="150g",
            unit="packets",
            price=45.0,
            cost_price=24.0,
            stock_quantity=220,
            min_threshold=30,
            description="Golden thin-cut potato crisps tossed with Indian chat and peri-peri spices."
        ),

        # Sweets
        Product(
            name="Tirunelveli Ghee Halwa 250g",
            code="PRD-SWT-001",
            category="Sweets",
            package_size="250g",
            unit="packets",
            price=120.0,
            cost_price=72.0,
            stock_quantity=150,
            min_threshold=25,
            description="Famous South Indian wheat milk halwa simmered with Thamirabarani water, caramelized sugar, and pure ghee."
        ),
        Product(
            name="Royal Ghee Mysore Pak 250g",
            code="PRD-SWT-002",
            category="Sweets",
            package_size="250g",
            unit="packets",
            price=140.0,
            cost_price=85.0,
            stock_quantity=180,
            min_threshold=25,
            description="Rich melt-in-mouth traditional besan sweet prepared with generous pure cow ghee."
        ),
        Product(
            name="Traditional Athirasam 4 Pcs Box",
            code="PRD-SWT-003",
            category="Sweets",
            package_size="250g",
            unit="packets",
            price=90.0,
            cost_price=52.0,
            stock_quantity=110,
            min_threshold=20,
            description="Authentic fermented raw rice flour and organic jaggery deep fried delicacy flavored with cardamom."
        ),
        Product(
            name="Motichoor Laddu 250g",
            code="PRD-SWT-004",
            category="Sweets",
            package_size="250g",
            unit="packets",
            price=110.0,
            cost_price=64.0,
            stock_quantity=140,
            min_threshold=20,
            description="Fine gram pearls soaked in saffron sugar syrup with melon seeds and pistachio flakes."
        ),
    ]
    for p in products:
        db.add(p)
    db.commit()

    # 3. Inventory Items (Raw Materials & Packaging Materials)
    inventory_items = [
        # Raw Materials
        InventoryItem(name="Raw Rice Flour (Idiyappam / Murukku Grade)", item_code="RM-FLR-01", category=InventoryCategory.RAW_MATERIAL.value, unit="kg", current_stock=1850.0, min_threshold=300.0, unit_cost=36.0, supplier_name="Ponni Agro Mills, Erode"),
        InventoryItem(name="Bengal Gram Flour / Besan", item_code="RM-FLR-02", category=InventoryCategory.RAW_MATERIAL.value, unit="kg", current_stock=1420.0, min_threshold=250.0, unit_cost=78.0, supplier_name="Sri Krishna Dal Mills, Madurai"),
        InventoryItem(name="Roasted Gram Flour (Pottukadlai Maavu)", item_code="RM-FLR-03", category=InventoryCategory.RAW_MATERIAL.value, unit="kg", current_stock=680.0, min_threshold=150.0, unit_cost=92.0, supplier_name="Sri Krishna Dal Mills, Madurai"),
        InventoryItem(name="Refined Groundnut Oil", item_code="RM-OIL-01", category=InventoryCategory.RAW_MATERIAL.value, unit="litre", current_stock=950.0, min_threshold=200.0, unit_cost=155.0, supplier_name="VVS Refineries, Virudhunagar"),
        InventoryItem(name="Pure Coconut Oil (Cold Pressed)", item_code="RM-OIL-02", category=InventoryCategory.RAW_MATERIAL.value, unit="litre", current_stock=450.0, min_threshold=100.0, unit_cost=240.0, supplier_name="Kera Natural Oils, Kangeyam"),
        InventoryItem(name="Pure Cow Ghee", item_code="RM-GHEE-01", category=InventoryCategory.RAW_MATERIAL.value, unit="kg", current_stock=220.0, min_threshold=50.0, unit_cost=580.0, supplier_name="Aavin Dairy, Salem"),
        InventoryItem(name="Raw Nendran Bananas", item_code="RM-BAN-01", category=InventoryCategory.RAW_MATERIAL.value, unit="kg", current_stock=1200.0, min_threshold=200.0, unit_cost=32.0, supplier_name="Wayanad Farmers Produce, Kerala"),
        InventoryItem(name="Raw Tapioca / Cassava Roots", item_code="RM-TAP-01", category=InventoryCategory.RAW_MATERIAL.value, unit="kg", current_stock=850.0, min_threshold=150.0, unit_cost=18.0, supplier_name="Salem Sago & Starch Syndicate"),
        InventoryItem(name="Guntur Red Chilli Powder", item_code="RM-SPC-01", category=InventoryCategory.RAW_MATERIAL.value, unit="kg", current_stock=160.0, min_threshold=30.0, unit_cost=260.0, supplier_name="Andhra Spice Mandi, Guntur"),
        InventoryItem(name="Compounded Asafoetida (Hing Powder)", item_code="RM-SPC-02", category=InventoryCategory.RAW_MATERIAL.value, unit="kg", current_stock=45.0, min_threshold=10.0, unit_cost=850.0, supplier_name="LG Asafoetida Corp, Chennai"),
        InventoryItem(name="White Sesame Seeds (Ellu)", item_code="RM-SPC-03", category=InventoryCategory.RAW_MATERIAL.value, unit="kg", current_stock=95.0, min_threshold=20.0, unit_cost=190.0, supplier_name="Salem Oil Seeds Market"),
        InventoryItem(name="Ajwain / Omam", item_code="RM-SPC-04", category=InventoryCategory.RAW_MATERIAL.value, unit="kg", current_stock=35.0, min_threshold=8.0, unit_cost=280.0, supplier_name="Unjha Spices, Gujarat"),
        InventoryItem(name="Raw Peanuts (Bold Grade)", item_code="RM-NUT-01", category=InventoryCategory.RAW_MATERIAL.value, unit="kg", current_stock=480.0, min_threshold=100.0, unit_cost=110.0, supplier_name="Pollachi Groundnut Traders"),
        InventoryItem(name="Cashew Nut Splits (W320/splits)", item_code="RM-NUT-02", category=InventoryCategory.RAW_MATERIAL.value, unit="kg", current_stock=110.0, min_threshold=25.0, unit_cost=650.0, supplier_name="Panruti Cashew Processors"),
        InventoryItem(name="Refined Sugar Grade M-30", item_code="RM-SGR-01", category=InventoryCategory.RAW_MATERIAL.value, unit="kg", current_stock=750.0, min_threshold=150.0, unit_cost=42.0, supplier_name="Sakthi Sugars, Coimbatore"),
        InventoryItem(name="Organic Jaggery Powder (Vellam)", item_code="RM-SGR-02", category=InventoryCategory.RAW_MATERIAL.value, unit="kg", current_stock=350.0, min_threshold=80.0, unit_cost=68.0, supplier_name="Modakkurichi Jaggery Market"),

        # Packaging Materials
        InventoryItem(name="200g Metallized Foil Pouches (Murukku)", item_code="PK-PCH-200M", category=InventoryCategory.PACKAGING_MATERIAL.value, unit="pieces", current_stock=12500.0, min_threshold=2000.0, unit_cost=2.20, supplier_name="Sivakasi Flexo Prints"),
        InventoryItem(name="200g Metallized Foil Pouches (Mixture)", item_code="PK-PCH-200X", category=InventoryCategory.PACKAGING_MATERIAL.value, unit="pieces", current_stock=9800.0, min_threshold=2000.0, unit_cost=2.20, supplier_name="Sivakasi Flexo Prints"),
        InventoryItem(name="200g Nitrogen Flush Banana Chips Pouches", item_code="PK-PCH-200C", category=InventoryCategory.PACKAGING_MATERIAL.value, unit="pieces", current_stock=7400.0, min_threshold=1500.0, unit_cost=2.60, supplier_name="Sivakasi Flexo Prints"),
        InventoryItem(name="250g Rigid Food Grade Sweet Boxes", item_code="PK-BOX-250S", category=InventoryCategory.PACKAGING_MATERIAL.value, unit="pieces", current_stock=3200.0, min_threshold=800.0, unit_cost=6.50, supplier_name="Kovai Packagings"),
        InventoryItem(name="5-Ply Master Shipping Cartons (40 Packets)", item_code="PK-CTN-M40", category=InventoryCategory.PACKAGING_MATERIAL.value, unit="pieces", current_stock=640.0, min_threshold=120.0, unit_cost=34.0, supplier_name="Universal Corrugators, Tiruppur"),
        InventoryItem(name="Security Tamper Void Tape (50m)", item_code="PK-TPE-50M", category=InventoryCategory.PACKAGING_MATERIAL.value, unit="rolls", current_stock=85.0, min_threshold=20.0, unit_cost=110.0, supplier_name="3M Distributor, Chennai"),
    ]
    for inv in inventory_items:
        db.add(inv)
    db.commit()

    # 4. Customers (Retailers and Distributors - TN and Interstate)
    customers = [
        # Tamil Nadu Customers (CGST 2.5% + SGST 2.5%)
        Customer(
            name="Annachi Super Store (P) Ltd",
            contact_person="R. Shanmugasundaram",
            phone="9840123456",
            email="orders@annachisuper.com",
            customer_type="Distributor",
            gstin="33AAACA1234F1Z8",
            address="14, Ranganathan Street, T. Nagar",
            city="Chennai",
            state="Tamil Nadu",
            pincode="600017",
            credit_limit=150000.0,
            outstanding_balance=24500.0
        ),
        Customer(
            name="Murugan Departmental Stores",
            contact_person="M. Palaniappan",
            phone="9842187654",
            email="muruganstores.mdu@gmail.com",
            customer_type="Retailer",
            gstin="33AABCM9876C1ZG",
            address="45, West Masi Street",
            city="Madurai",
            state="Tamil Nadu",
            pincode="625001",
            credit_limit=75000.0,
            outstanding_balance=12400.0
        ),
        Customer(
            name="Kovai Nilgiris Supermarket",
            contact_person="K. Balakrishnan",
            phone="9894011223",
            email="cbe.nilgiris@retail.in",
            customer_type="Retailer",
            gstin="33AABCN5544B1ZH",
            address="112, D.B. Road, R.S. Puram",
            city="Coimbatore",
            state="Tamil Nadu",
            pincode="641002",
            credit_limit=90000.0,
            outstanding_balance=0.0
        ),
        Customer(
            name="Meenakshi Traders & Wholesale",
            contact_person="S. Karthikeyan",
            phone="9786044556",
            email="meenakshi.tirunelveli@yahoo.com",
            customer_type="Distributor",
            gstin="33AACMT7788P1ZX",
            address="28, High Ground Road",
            city="Tirunelveli",
            state="Tamil Nadu",
            pincode="627002",
            credit_limit=200000.0,
            outstanding_balance=46800.0
        ),

        # Other States Customers (IGST 5.0%)
        Customer(
            name="Bangalore Hot Chips & Sweets Hub",
            contact_person="V. R. Venkatesh",
            phone="9880145678",
            email="venkatesh@blrhotchips.com",
            customer_type="Distributor",
            gstin="29AABCB1122D1ZY",
            address="88, 8th Cross, Sampige Road, Malleswaram",
            city="Bengaluru",
            state="Karnataka",
            pincode="560003",
            credit_limit=180000.0,
            outstanding_balance=38200.0
        ),
        Customer(
            name="Malabar Spice & Snacks Corner",
            contact_person="P. K. Nambiar",
            phone="9847033445",
            email="malabar.snacks@rediffmail.com",
            customer_type="Retailer",
            gstin="32AABCM3322E1Z2",
            address="19, MG Road, Ernakulam",
            city="Kochi",
            state="Kerala",
            pincode="682011",
            credit_limit=80000.0,
            outstanding_balance=15300.0
        ),
        Customer(
            name="Sri Venkateswara Grand Bazaar",
            contact_person="Ch. Ramana Murthy",
            phone="9849055667",
            email="grandbazaar.tpt@gmail.com",
            customer_type="Retailer",
            gstin="37AABCS6655Q1ZU",
            address="104, Gandhi Road",
            city="Tirupati",
            state="Andhra Pradesh",
            pincode="517501",
            credit_limit=85000.0,
            outstanding_balance=0.0
        ),
    ]
    for c in customers:
        db.add(c)
    db.commit()

    all_products = db.query(Product).all()
    all_customers = db.query(Customer).all()
    all_inv = db.query(InventoryItem).all()

    # 5. Production Batches with raw material usage & wastage metrics
    # Kai Murukku Batch
    p_kai = next(p for p in all_products if "Kai Murukku" in p.name)
    b1 = ProductionBatch(
        batch_number="BAT-2026-001",
        product_id=p_kai.id,
        supervisor_id=prod_user.id,
        batch_date=datetime.utcnow() - timedelta(days=2),
        raw_material_weight_kg=105.0, # 105 kg prepared dough
        packet_size_g=200.0, # 200g per packet
        expected_packets=525, # 105 / 0.200 = 525 packets
        actual_packets=512, # 512 produced
        wastage_kg=2.6, # (525 - 512) * 0.200 = 2.6 kg broken/edge pieces
        wastage_percentage=2.48, # 2.6 / 105 * 100
        variance_packets=-13,
        status="Completed",
        notes="Batch run was clean. Minor breakage during conveyor cooling tray."
    )
    db.add(b1)
    db.commit()

    # Link materials used for Batch 1
    flour_rice = next(i for i in all_inv if "Rice Flour" in i.name)
    oil_gnut = next(i for i in all_inv if "Groundnut Oil" in i.name)
    pouch_mrk = next(i for i in all_inv if "Murukku" in i.name and "200g" in i.name)
    db.add(ProductionMaterialUsed(batch_id=b1.id, inventory_item_id=flour_rice.id, quantity_used=80.0, unit="kg"))
    db.add(ProductionMaterialUsed(batch_id=b1.id, inventory_item_id=oil_gnut.id, quantity_used=22.0, unit="litre"))
    db.add(ProductionMaterialUsed(batch_id=b1.id, inventory_item_id=pouch_mrk.id, quantity_used=515.0, unit="pieces"))

    # Banana Chips Batch
    p_chips = next(p for p in all_products if "Banana Chips" in p.name)
    b2 = ProductionBatch(
        batch_number="BAT-2026-002",
        product_id=p_chips.id,
        supervisor_id=prod_user.id,
        batch_date=datetime.utcnow() - timedelta(days=1),
        raw_material_weight_kg=85.0,
        packet_size_g=200.0,
        expected_packets=425,
        actual_packets=420,
        wastage_kg=1.0,
        wastage_percentage=1.18,
        variance_packets=-5,
        status="Completed",
        notes="High yield Nendran stock from Wayanad. Minimal crumbles."
    )
    db.add(b2)
    db.commit()

    raw_ban = next(i for i in all_inv if "Nendran" in i.name)
    oil_coco = next(i for i in all_inv if "Coconut Oil" in i.name)
    pouch_chp = next(i for i in all_inv if "Banana Chips Pouches" in i.name)
    db.add(ProductionMaterialUsed(batch_id=b2.id, inventory_item_id=raw_ban.id, quantity_used=80.0, unit="kg"))
    db.add(ProductionMaterialUsed(batch_id=b2.id, inventory_item_id=oil_coco.id, quantity_used=18.0, unit="litre"))
    db.add(ProductionMaterialUsed(batch_id=b2.id, inventory_item_id=pouch_chp.id, quantity_used=422.0, unit="pieces"))
    db.commit()

    # 6. Sample Orders with realistic workflow states
    cust_chennai = next(c for c in all_customers if c.city == "Chennai")
    cust_mdu = next(c for c in all_customers if c.city == "Madurai")
    cust_blr = next(c for c in all_customers if c.city == "Bengaluru") # Interstate!
    cust_cbe = next(c for c in all_customers if c.city == "Coimbatore")

    p1 = all_products[0]
    p2 = all_products[1]
    p4 = all_products[4] # Madras Mixture
    p7 = all_products[7] # Banana Chips

    # Order 1 (Dispatched - with generated Invoice)
    ord1 = Order(
        order_number="ORD-2026-001",
        customer_id=cust_chennai.id,
        salesman_id=sales_user.id,
        status=OrderStatus.DISPATCHED.value,
        total_amount=15750.0,
        notes="Urgent delivery to T. Nagar branch for weekend stocking",
        created_at=datetime.utcnow() - timedelta(days=3)
    )
    db.add(ord1)
    db.commit()

    item1 = OrderItem(order_id=ord1.id, product_id=p1.id, quantity=100, unit_price=65.0, total_price=6500.0)
    item2 = OrderItem(order_id=ord1.id, product_id=p4.id, quantity=75, unit_price=70.0, total_price=5250.0)
    item3 = OrderItem(order_id=ord1.id, product_id=p7.id, quantity=47, unit_price=85.0, total_price=3995.0) # subtotal ~ 15745 rounded
    ord1.total_amount = item1.total_price + item2.total_price + item3.total_price
    db.add_all([item1, item2, item3])
    db.commit()

    # Invoice for Order 1 (Tamil Nadu - CGST 2.5% + SGST 2.5%)
    subtotal1 = ord1.total_amount # 15745.0
    cgst1 = round(subtotal1 * 0.025, 2) # 393.63
    sgst1 = round(subtotal1 * 0.025, 2) # 393.63
    tax1 = round(cgst1 + sgst1, 2) # 787.26
    grand1 = round(subtotal1 + tax1, 2) # 16532.26

    inv1 = Invoice(
        invoice_number="INV-2026-001",
        order_id=ord1.id,
        customer_id=cust_chennai.id,
        invoice_date=datetime.utcnow() - timedelta(days=3),
        due_date=datetime.utcnow() + timedelta(days=27),
        subtotal=subtotal1,
        is_tamil_nadu=True,
        cgst_rate=2.5,
        cgst_amount=cgst1,
        sgst_rate=2.5,
        sgst_amount=sgst1,
        igst_rate=0.0,
        igst_amount=0.0,
        total_tax=tax1,
        grand_total=grand1,
        paid_amount=10000.0,
        balance_due=round(grand1 - 10000.0, 2),
        payment_status=PaymentStatus.PARTIALLY_PAID.value,
        notes="Standard 30 days credit terms. Delivery verified."
    )
    db.add(inv1)
    db.commit()

    inv1_i1 = InvoiceItem(invoice_id=inv1.id, product_id=p1.id, product_name=p1.name, hsn_code="21069099", quantity=item1.quantity, unit_price=item1.unit_price, tax_rate=5.0, amount=item1.total_price)
    inv1_i2 = InvoiceItem(invoice_id=inv1.id, product_id=p4.id, product_name=p4.name, hsn_code="21069099", quantity=item2.quantity, unit_price=item2.unit_price, tax_rate=5.0, amount=item2.total_price)
    inv1_i3 = InvoiceItem(invoice_id=inv1.id, product_id=p7.id, product_name=p7.name, hsn_code="21069099", quantity=item3.quantity, unit_price=item3.unit_price, tax_rate=5.0, amount=item3.total_price)
    db.add_all([inv1_i1, inv1_i2, inv1_i3])
    db.commit()

    # Payment for Order 1 partial payment
    pay1 = Payment(
        receipt_number="RCP-2026-001",
        customer_id=cust_chennai.id,
        invoice_id=inv1.id,
        amount=10000.0,
        payment_date=datetime.utcnow() - timedelta(days=1),
        payment_mode="Bank Transfer / NEFT",
        reference_number="HDFCN260549321",
        notes="Advance bank transfer for INV-2026-001"
    )
    db.add(pay1)

    # Order 2 (Dispatched - Interstate Karnataka: IGST 5.0%)
    ord2 = Order(
        order_number="ORD-2026-002",
        customer_id=cust_blr.id,
        salesman_id=sales_user.id,
        status=OrderStatus.DISPATCHED.value,
        total_amount=22100.0,
        notes="Interstate supply to Bangalore distributor with e-Way bill",
        created_at=datetime.utcnow() - timedelta(days=2)
    )
    db.add(ord2)
    db.commit()

    ord2_i1 = OrderItem(order_id=ord2.id, product_id=p7.id, quantity=160, unit_price=85.0, total_price=13600.0)
    ord2_i2 = OrderItem(order_id=ord2.id, product_id=p2.id, quantity=140, unit_price=60.0, total_price=8400.0)
    ord2.total_amount = ord2_i1.total_price + ord2_i2.total_price # 22000.0
    db.add_all([ord2_i1, ord2_i2])
    db.commit()

    subtotal2 = ord2.total_amount
    igst2 = round(subtotal2 * 0.05, 2) # 1100.0
    grand2 = round(subtotal2 + igst2, 2) # 23100.0

    inv2 = Invoice(
        invoice_number="INV-2026-002",
        order_id=ord2.id,
        customer_id=cust_blr.id,
        invoice_date=datetime.utcnow() - timedelta(days=2),
        due_date=datetime.utcnow() + timedelta(days=28),
        subtotal=subtotal2,
        is_tamil_nadu=False,
        cgst_rate=0.0,
        cgst_amount=0.0,
        sgst_rate=0.0,
        sgst_amount=0.0,
        igst_rate=5.0,
        igst_amount=igst2,
        total_tax=igst2,
        grand_total=grand2,
        paid_amount=0.0,
        balance_due=grand2,
        payment_status=PaymentStatus.UNPAID.value,
        notes="Interstate supply to Karnataka. IGST @ 5% applicable."
    )
    db.add(inv2)
    db.commit()

    inv2_i1 = InvoiceItem(invoice_id=inv2.id, product_id=p7.id, product_name=p7.name, hsn_code="21069099", quantity=ord2_i1.quantity, unit_price=ord2_i1.unit_price, tax_rate=5.0, amount=ord2_i1.total_price)
    inv2_i2 = InvoiceItem(invoice_id=inv2.id, product_id=p2.id, product_name=p2.name, hsn_code="21069099", quantity=ord2_i2.quantity, unit_price=ord2_i2.unit_price, tax_rate=5.0, amount=ord2_i2.total_price)
    db.add_all([inv2_i1, inv2_i2])

    # Order 3 (Approved - pending dispatch)
    ord3 = Order(
        order_number="ORD-2026-003",
        customer_id=cust_mdu.id,
        salesman_id=sales_user.id,
        status=OrderStatus.APPROVED.value,
        total_amount=8800.0,
        notes="Approved by sales manager. Packaging under preparation.",
        created_at=datetime.utcnow() - timedelta(hours=6)
    )
    db.add(ord3)
    db.commit()
    db.add(OrderItem(order_id=ord3.id, product_id=p1.id, quantity=60, unit_price=65.0, total_price=3900.0))
    db.add(OrderItem(order_id=ord3.id, product_id=p4.id, quantity=70, unit_price=70.0, total_price=4900.0))

    # Order 4 (Pending - newly received today)
    ord4 = Order(
        order_number="ORD-2026-004",
        customer_id=cust_cbe.id,
        salesman_id=sales_user.id,
        status=OrderStatus.PENDING.value,
        total_amount=12500.0,
        notes="New booking from Coimbatore distributor. Awaiting credit check.",
        created_at=datetime.utcnow() - timedelta(hours=2)
    )
    db.add(ord4)
    db.commit()
    db.add(OrderItem(order_id=ord4.id, product_id=p2.id, quantity=100, unit_price=60.0, total_price=6000.0))
    p_halwa = next(p for p in all_products if "Halwa" in p.name)
    db.add(OrderItem(order_id=ord4.id, product_id=p_halwa.id, quantity=50, unit_price=120.0, total_price=6000.0))

    db.commit()
    print("Database seeding completed successfully!")
