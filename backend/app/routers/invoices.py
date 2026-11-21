import io
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from ..database import get_db
from ..models import Invoice, InvoiceItem, Order, Customer, PaymentStatus
from ..schemas import InvoiceResponse, InvoiceItemResponse, InvoiceCreate
from ..auth import get_current_user

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])

def serialize_invoice(inv: Invoice) -> InvoiceResponse:
    items = [
        InvoiceItemResponse(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product_name,
            hsn_code=item.hsn_code,
            quantity=item.quantity,
            unit_price=item.unit_price,
            tax_rate=item.tax_rate,
            amount=item.amount
        )
        for item in inv.items
    ]
    return InvoiceResponse(
        id=inv.id,
        invoice_number=inv.invoice_number,
        order_id=inv.order_id,
        customer_id=inv.customer_id,
        customer_name=inv.customer.name if inv.customer else "Unknown",
        customer_gstin=inv.customer.gstin if inv.customer else "N/A",
        customer_address=inv.customer.address if inv.customer else "",
        customer_state=inv.customer.state if inv.customer else "",
        invoice_date=inv.invoice_date,
        due_date=inv.due_date,
        subtotal=inv.subtotal,
        is_tamil_nadu=inv.is_tamil_nadu,
        cgst_rate=inv.cgst_rate,
        cgst_amount=inv.cgst_amount,
        sgst_rate=inv.sgst_rate,
        sgst_amount=inv.sgst_amount,
        igst_rate=inv.igst_rate,
        igst_amount=inv.igst_amount,
        total_tax=inv.total_tax,
        grand_total=inv.grand_total,
        paid_amount=inv.paid_amount,
        balance_due=inv.balance_due,
        payment_status=inv.payment_status,
        notes=inv.notes,
        created_at=inv.created_at,
        items=items
    )

@router.get("", response_model=List[InvoiceResponse])
def get_invoices(
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Invoice)
    if status and status != "All":
        query = query.filter(Invoice.payment_status == status)
    if customer_id:
        query = query.filter(Invoice.customer_id == customer_id)
    invoices = query.order_by(Invoice.invoice_date.desc()).all()
    return [serialize_invoice(i) for i in invoices]

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(invoice_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return serialize_invoice(invoice)

@router.get("/{invoice_id}/pdf")
def download_invoice_pdf(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CompanyTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#1e3a8a"),
        fontName="Helvetica-Bold"
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#475569")
    )
    inv_title_style = ParagraphStyle(
        'InvTitle',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1e40af"),
        alignment=2 # Right align
    )
    normal_style = ParagraphStyle(
        'NormalSmall',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#1e293b")
    )
    table_head_style = ParagraphStyle(
        'TableHead',
        parent=styles['Normal'],
        fontSize=9,
        leading=11,
        textColor=colors.white,
        fontName="Helvetica-Bold"
    )
    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1e293b")
    )

    story = []

    # Header Table
    company_info = [
        Paragraph("<b>ORDER-TO-AUDIT FOODS PVT LTD</b>", title_style),
        Paragraph("Authentic South Indian Snacks: Murukku | Mixture | Chips | Sweets", subtitle_style),
        Paragraph("Factory & Office: Plot 42, SIDCO Industrial Estate, Guindy, Chennai - 600032, Tamil Nadu", subtitle_style),
        Paragraph("GSTIN: <b>33AABCO9988Z1Z5</b> | FSSAI Lic: 12423001000542 | State Code: 33", subtitle_style),
    ]

    cust_state = invoice.customer.state if invoice.customer else "Tamil Nadu"
    inv_info = [
        Paragraph("<b>TAX INVOICE</b>", inv_title_style),
        Paragraph(f"<b>Invoice #:</b> {invoice.invoice_number}", ParagraphStyle('R1', parent=normal_style, alignment=2)),
        Paragraph(f"<b>Date:</b> {invoice.invoice_date.strftime('%d-%b-%Y')}", ParagraphStyle('R2', parent=normal_style, alignment=2)),
        Paragraph(f"<b>Place of Supply:</b> {cust_state}", ParagraphStyle('R3', parent=normal_style, alignment=2)),
        Paragraph(f"<b>Status:</b> {invoice.payment_status}", ParagraphStyle('R4', parent=normal_style, alignment=2, textColor=colors.HexColor("#15803d") if invoice.payment_status == "Paid" else colors.HexColor("#b91c1c"))),
    ]

    header_table = Table([[company_info, inv_info]], colWidths=[4.0 * inch, 3.2 * inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#2563eb"), spaceAfter=10))

    # Bill To Box
    cust = invoice.customer
    bill_to_content = [
        Paragraph("<b>BILLED TO (BUYER DETAILS):</b>", ParagraphStyle('B1', parent=normal_style, fontName="Helvetica-Bold", textColor=colors.HexColor("#1e3a8a"))),
        Paragraph(f"<b>{cust.name if cust else 'Cash Customer'}</b>", ParagraphStyle('B2', parent=normal_style, fontSize=10, fontName="Helvetica-Bold")),
        Paragraph(f"Address: {cust.address if cust else 'N/A'}, {cust.city if cust else ''} - {cust.pincode if cust else ''}", normal_style),
        Paragraph(f"State: <b>{cust_state}</b> | Phone: {cust.phone if cust else 'N/A'}", normal_style),
        Paragraph(f"GSTIN / UIN: <b>{cust.gstin if cust and cust.gstin else 'Unregistered'}</b>", normal_style),
    ]

    ship_terms = [
        Paragraph("<b>DISPATCH & PAYMENT TERMS:</b>", ParagraphStyle('B3', parent=normal_style, fontName="Helvetica-Bold", textColor=colors.HexColor("#1e3a8a"))),
        Paragraph(f"Order Ref: <b>{invoice.order.order_number if invoice.order else 'Direct Sale'}</b>", normal_style),
        Paragraph(f"Due Date: <b>{invoice.due_date.strftime('%d-%b-%Y') if invoice.due_date else 'Immediate'}</b>", normal_style),
        Paragraph(f"Payment Terms: 30 Days Credit", normal_style),
        Paragraph(f"Reverse Charge: No | HSN Snacks: 21069099", normal_style),
    ]

    buyer_table = Table([[bill_to_content, ship_terms]], colWidths=[4.0 * inch, 3.2 * inch])
    buyer_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(buyer_table)
    story.append(Spacer(1, 12))

    # Items Table
    headers = [
        Paragraph("#", table_head_style),
        Paragraph("Description of Goods", table_head_style),
        Paragraph("HSN Code", table_head_style),
        Paragraph("Qty (Pkts)", table_head_style),
        Paragraph("Rate (₹)", table_head_style),
        Paragraph("Tax %", table_head_style),
        Paragraph("Amount (₹)", table_head_style)
    ]
    data = [headers]

    for idx, itm in enumerate(invoice.items, start=1):
        data.append([
            Paragraph(str(idx), table_cell_style),
            Paragraph(f"<b>{itm.product_name}</b>", table_cell_style),
            Paragraph(itm.hsn_code, table_cell_style),
            Paragraph(str(itm.quantity), table_cell_style),
            Paragraph(f"{itm.unit_price:.2f}", table_cell_style),
            Paragraph(f"{itm.tax_rate:.1f}%", table_cell_style),
            Paragraph(f"{itm.amount:.2f}", table_cell_style),
        ])

    items_table = Table(data, colWidths=[0.4 * inch, 2.7 * inch, 0.9 * inch, 0.8 * inch, 0.8 * inch, 0.6 * inch, 1.0 * inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e40af")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 8))

    # Tax & Total Breakdown Box
    tax_rows = [
        [Paragraph("<b>Subtotal (Taxable Value):</b>", normal_style), Paragraph(f"<b>₹ {invoice.subtotal:,.2f}</b>", ParagraphStyle('R', parent=normal_style, alignment=2))]
    ]

    if invoice.is_tamil_nadu:
        tax_rows.append([Paragraph("<b>CGST @ 2.5%:</b>", normal_style), Paragraph(f"₹ {invoice.cgst_amount:,.2f}", ParagraphStyle('R', parent=normal_style, alignment=2))])
        tax_rows.append([Paragraph("<b>SGST @ 2.5%:</b>", normal_style), Paragraph(f"₹ {invoice.sgst_amount:,.2f}", ParagraphStyle('R', parent=normal_style, alignment=2))])
    else:
        tax_rows.append([Paragraph("<b>IGST @ 5.0% (Inter-State):</b>", normal_style), Paragraph(f"₹ {invoice.igst_amount:,.2f}", ParagraphStyle('R', parent=normal_style, alignment=2))])

    tax_rows.append([Paragraph("<b>Total GST (5%):</b>", normal_style), Paragraph(f"₹ {invoice.total_tax:,.2f}", ParagraphStyle('R', parent=normal_style, alignment=2))])
    tax_rows.append([Paragraph("<b>Invoice Grand Total:</b>", ParagraphStyle('GT', parent=normal_style, fontName="Helvetica-Bold", fontSize=11, textColor=colors.HexColor("#1e3a8a"))),
                     Paragraph(f"<b>₹ {invoice.grand_total:,.2f}</b>", ParagraphStyle('GTV', parent=normal_style, fontName="Helvetica-Bold", fontSize=11, alignment=2, textColor=colors.HexColor("#1e3a8a")))])
    tax_rows.append([Paragraph("Amount Paid:", normal_style), Paragraph(f"₹ {invoice.paid_amount:,.2f}", ParagraphStyle('R', parent=normal_style, alignment=2))])
    tax_rows.append([Paragraph("<b>Balance Due:</b>", ParagraphStyle('BD', parent=normal_style, fontName="Helvetica-Bold", textColor=colors.HexColor("#b91c1c"))),
                     Paragraph(f"<b>₹ {invoice.balance_due:,.2f}</b>", ParagraphStyle('BDV', parent=normal_style, fontName="Helvetica-Bold", alignment=2, textColor=colors.HexColor("#b91c1c")))])

    totals_table = Table(tax_rows, colWidths=[2.2 * inch, 1.5 * inch])
    totals_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
        ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor("#eff6ff")), # grand total row highlight
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))

    notes_bank = [
        Paragraph("<b>Bank Details for NEFT/RTGS/UPI:</b>", ParagraphStyle('N1', parent=normal_style, fontName="Helvetica-Bold")),
        Paragraph("Bank Name: HDFC Bank Ltd | Branch: Guindy, Chennai", normal_style),
        Paragraph("Account Name: Order-to-Audit Foods Pvt Ltd", normal_style),
        Paragraph("A/C No: 50200088991122 | IFSC: HDFC0000242", normal_style),
        Paragraph("UPI ID: ordertoaudit@hdfcbank", normal_style),
        Spacer(1, 5),
        Paragraph("<b>Declaration:</b> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.", subtitle_style),
    ]

    bottom_table = Table([[notes_bank, totals_table]], colWidths=[3.5 * inch, 3.7 * inch])
    bottom_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(bottom_table)
    story.append(Spacer(1, 25))

    # Signatures
    sign_table = Table([
        [
            Paragraph("Customer Signature & Seal", ParagraphStyle('S1', parent=normal_style, alignment=0)),
            Paragraph("For <b>Order-to-Audit Foods Pvt Ltd</b><br/><br/><br/><b>Authorized Signatory</b>", ParagraphStyle('S2', parent=normal_style, alignment=2))
        ]
    ], colWidths=[3.6 * inch, 3.6 * inch])
    sign_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(sign_table)

    doc.build(story)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Invoice_{invoice.invoice_number}.pdf"}
    )
