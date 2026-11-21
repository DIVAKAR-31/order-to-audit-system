import io
from datetime import datetime
from fastapi import APIRouter, Depends, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from ..database import get_db
from ..models import Order, Invoice, Product, ProductionBatch, InventoryItem, Payment, Customer
from ..auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/summary")
def get_reports_summary(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    total_sales = db.query(func.coalesce(func.sum(Invoice.grand_total), 0.0)).scalar()
    total_tax_collected = db.query(func.coalesce(func.sum(Invoice.total_tax), 0.0)).scalar()
    total_collected = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).scalar()
    total_receivables = db.query(func.coalesce(func.sum(Customer.outstanding_balance), 0.0)).scalar()
    
    total_packets_produced = db.query(func.coalesce(func.sum(ProductionBatch.actual_packets), 0)).scalar()
    avg_wastage_pct = db.query(func.coalesce(func.avg(ProductionBatch.wastage_percentage), 0.0)).scalar()
    
    inventory_valuation = db.query(
        func.coalesce(func.sum(InventoryItem.current_stock * InventoryItem.unit_cost), 0.0)
    ).scalar()
    
    finished_goods_valuation = db.query(
        func.coalesce(func.sum(Product.stock_quantity * Product.cost_price), 0.0)
    ).scalar()

    return {
        "financial_summary": {
            "total_sales": total_sales,
            "total_tax_collected": total_tax_collected,
            "total_collected": total_collected,
            "total_receivables": total_receivables,
        },
        "manufacturing_summary": {
            "total_packets_produced": total_packets_produced,
            "average_wastage_percentage": round(avg_wastage_pct, 2),
            "raw_packaging_valuation": round(inventory_valuation, 2),
            "finished_goods_valuation": round(finished_goods_valuation, 2),
        }
    }

@router.get("/export/excel")
def export_excel_report(db: Session = Depends(get_db)):
    wb = openpyxl.Workbook()
    
    # Styles
    header_fill = PatternFill(start_color="1E40AF", end_color="1E40AF", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    title_font = Font(name="Calibri", size=14, bold=True, color="1E3A8A")
    thin_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )
    
    # 1. Sheet 1: Sales & Invoices
    ws1 = wb.active
    ws1.title = "Sales & Invoices"
    ws1["A1"] = "Order-to-Audit System: Sales & Invoices Audit"
    ws1["A1"].font = title_font
    
    invoices_headers = ["Invoice #", "Order Ref", "Customer Name", "State", "Taxable Value (₹)", "CGST (₹)", "SGST (₹)", "IGST (₹)", "Grand Total (₹)", "Paid (₹)", "Balance (₹)", "Status"]
    for col_num, h in enumerate(invoices_headers, start=1):
        cell = ws1.cell(row=3, column=col_num, value=h)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")
        
    invoices = db.query(Invoice).order_by(Invoice.invoice_date.desc()).all()
    for row_idx, inv in enumerate(invoices, start=4):
        ws1.cell(row=row_idx, column=1, value=inv.invoice_number).border = thin_border
        ws1.cell(row=row_idx, column=2, value=inv.order.order_number if inv.order else "Direct").border = thin_border
        ws1.cell(row=row_idx, column=3, value=inv.customer.name if inv.customer else "").border = thin_border
        ws1.cell(row=row_idx, column=4, value=inv.customer.state if inv.customer else "").border = thin_border
        ws1.cell(row=row_idx, column=5, value=inv.subtotal).border = thin_border
        ws1.cell(row=row_idx, column=6, value=inv.cgst_amount).border = thin_border
        ws1.cell(row=row_idx, column=7, value=inv.sgst_amount).border = thin_border
        ws1.cell(row=row_idx, column=8, value=inv.igst_amount).border = thin_border
        ws1.cell(row=row_idx, column=9, value=inv.grand_total).border = thin_border
        ws1.cell(row=row_idx, column=10, value=inv.paid_amount).border = thin_border
        ws1.cell(row=row_idx, column=11, value=inv.balance_due).border = thin_border
        ws1.cell(row=row_idx, column=12, value=inv.payment_status).border = thin_border

    # 2. Sheet 2: Production & Wastage
    ws2 = wb.create_sheet(title="Production & Wastage")
    ws2["A1"] = "Order-to-Audit System: Snack Production & Wastage Yield Log"
    ws2["A1"].font = title_font
    prod_headers = ["Batch #", "Product", "Raw Material (kg)", "Packet Size", "Expected (Pkts)", "Actual (Pkts)", "Variance", "Wastage (kg)", "Wastage %", "Status"]
    for col_num, h in enumerate(prod_headers, start=1):
        cell = ws2.cell(row=3, column=col_num, value=h)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")

    batches = db.query(ProductionBatch).order_by(ProductionBatch.batch_date.desc()).all()
    for row_idx, b in enumerate(batches, start=4):
        ws2.cell(row=row_idx, column=1, value=b.batch_number).border = thin_border
        ws2.cell(row=row_idx, column=2, value=b.product.name if b.product else "").border = thin_border
        ws2.cell(row=row_idx, column=3, value=b.raw_material_weight_kg).border = thin_border
        ws2.cell(row=row_idx, column=4, value=f"{b.packet_size_g}g").border = thin_border
        ws2.cell(row=row_idx, column=5, value=b.expected_packets).border = thin_border
        ws2.cell(row=row_idx, column=6, value=b.actual_packets).border = thin_border
        ws2.cell(row=row_idx, column=7, value=b.variance_packets).border = thin_border
        ws2.cell(row=row_idx, column=8, value=b.wastage_kg).border = thin_border
        ws2.cell(row=row_idx, column=9, value=f"{b.wastage_percentage}%").border = thin_border
        ws2.cell(row=row_idx, column=10, value=b.status).border = thin_border

    # 3. Sheet 3: Inventory Stock
    ws3 = wb.create_sheet(title="Inventory Stock")
    ws3["A1"] = "Order-to-Audit System: Materials & Packets Inventory Stock"
    ws3["A1"].font = title_font
    inv_headers = ["Item Code", "Item Name", "Category", "Current Stock", "Unit", "Unit Cost (₹)", "Stock Value (₹)", "Min Threshold", "Supplier"]
    for col_num, h in enumerate(inv_headers, start=1):
        cell = ws3.cell(row=3, column=col_num, value=h)
        cell.fill = header_fill
        cell.font = header_font

    inv_items = db.query(InventoryItem).order_by(InventoryItem.category.asc(), InventoryItem.name.asc()).all()
    for row_idx, itm in enumerate(inv_items, start=4):
        val = round(itm.current_stock * itm.unit_cost, 2)
        ws3.cell(row=row_idx, column=1, value=itm.item_code).border = thin_border
        ws3.cell(row=row_idx, column=2, value=itm.name).border = thin_border
        ws3.cell(row=row_idx, column=3, value=itm.category).border = thin_border
        ws3.cell(row=row_idx, column=4, value=itm.current_stock).border = thin_border
        ws3.cell(row=row_idx, column=5, value=itm.unit).border = thin_border
        ws3.cell(row=row_idx, column=6, value=itm.unit_cost).border = thin_border
        ws3.cell(row=row_idx, column=7, value=val).border = thin_border
        ws3.cell(row=row_idx, column=8, value=itm.min_threshold).border = thin_border
        ws3.cell(row=row_idx, column=9, value=itm.supplier_name or "").border = thin_border

    # Adjust column widths across sheets
    for ws in [ws1, ws2, ws3]:
        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = openpyxl.utils.get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M")
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=Order_to_Audit_Report_{timestamp}.xlsx"}
    )

@router.get("/export/pdf")
def export_pdf_audit_report(db: Session = Depends(get_db)):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(letter),
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'RepTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#1e3a8a"),
        fontName="Helvetica-Bold"
    )
    subtitle_style = ParagraphStyle(
        'RepSub',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569")
    )
    table_head = ParagraphStyle('TH', parent=styles['Normal'], fontSize=9, leading=11, textColor=colors.white, fontName="Helvetica-Bold")
    table_cell = ParagraphStyle('TC', parent=styles['Normal'], fontSize=8.5, leading=11, textColor=colors.HexColor("#1e293b"))

    story = []
    story.append(Paragraph("<b>ORDER-TO-AUDIT SYSTEM: EXECUTIVE AUDIT REPORT</b>", title_style))
    story.append(Paragraph(f"South Indian Snacks Manufacturing Unit | Generated: {datetime.utcnow().strftime('%d %B %Y, %H:%M UTC')}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#2563eb"), spaceAfter=12))

    # Production Performance Summary
    story.append(Paragraph("<b>1. Production Batches, Yield & Wastage Audit</b>", ParagraphStyle('H2', parent=styles['Heading2'], textColor=colors.HexColor("#1e40af"), fontSize=12)))
    
    prod_data = [[
        Paragraph("Batch #", table_head),
        Paragraph("Product Name", table_head),
        Paragraph("Dough (kg)", table_head),
        Paragraph("Pkt Size", table_head),
        Paragraph("Expected", table_head),
        Paragraph("Actual", table_head),
        Paragraph("Variance", table_head),
        Paragraph("Wastage (kg)", table_head),
        Paragraph("Wastage %", table_head),
        Paragraph("Date", table_head),
    ]]
    
    batches = db.query(ProductionBatch).order_by(ProductionBatch.batch_date.desc()).all()
    for b in batches:
        prod_data.append([
            Paragraph(b.batch_number, table_cell),
            Paragraph(b.product.name if b.product else "N/A", table_cell),
            Paragraph(f"{b.raw_material_weight_kg:.1f}", table_cell),
            Paragraph(f"{b.packet_size_g}g", table_cell),
            Paragraph(str(b.expected_packets), table_cell),
            Paragraph(str(b.actual_packets), table_cell),
            Paragraph(str(b.variance_packets), table_cell),
            Paragraph(f"{b.wastage_kg:.2f}", table_cell),
            Paragraph(f"{b.wastage_percentage:.2f}%", table_cell),
            Paragraph(b.batch_date.strftime("%d-%b-%Y"), table_cell),
        ])

    t1 = Table(prod_data, colWidths=[1.1*inch, 2.2*inch, 0.8*inch, 0.8*inch, 0.8*inch, 0.8*inch, 0.8*inch, 0.9*inch, 0.9*inch, 1.0*inch])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e40af")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(t1)
    story.append(Spacer(1, 14))

    # Sales & GST Revenue Audit
    story.append(Paragraph("<b>2. Sales & 5% GST Audit Ledger</b>", ParagraphStyle('H2_2', parent=styles['Heading2'], textColor=colors.HexColor("#1e40af"), fontSize=12)))
    
    inv_data = [[
        Paragraph("Invoice #", table_head),
        Paragraph("Customer Name", table_head),
        Paragraph("State", table_head),
        Paragraph("Taxable (₹)", table_head),
        Paragraph("CGST 2.5%", table_head),
        Paragraph("SGST 2.5%", table_head),
        Paragraph("IGST 5.0%", table_head),
        Paragraph("Grand Total", table_head),
        Paragraph("Status", table_head),
    ]]

    invoices = db.query(Invoice).order_by(Invoice.invoice_date.desc()).all()
    for inv in invoices:
        inv_data.append([
            Paragraph(inv.invoice_number, table_cell),
            Paragraph(inv.customer.name if inv.customer else "N/A", table_cell),
            Paragraph(inv.customer.state if inv.customer else "TN", table_cell),
            Paragraph(f"{inv.subtotal:,.2f}", table_cell),
            Paragraph(f"{inv.cgst_amount:,.2f}", table_cell),
            Paragraph(f"{inv.sgst_amount:,.2f}", table_cell),
            Paragraph(f"{inv.igst_amount:,.2f}", table_cell),
            Paragraph(f"<b>{inv.grand_total:,.2f}</b>", table_cell),
            Paragraph(inv.payment_status, table_cell),
        ])

    t2 = Table(inv_data, colWidths=[1.1*inch, 2.3*inch, 1.2*inch, 1.0*inch, 0.9*inch, 0.9*inch, 0.9*inch, 1.1*inch, 0.9*inch])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#2563eb")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(t2)

    doc.build(story)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=Order_to_Audit_Executive_Summary.pdf"}
    )
