import io
import json
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf_report(entity_info, evidence_items, records):
    """
    Generates a PDF byte stream report using ReportLab.
    """
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
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=15
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=12,
        spaceAfter=6
    )

    normal_text = ParagraphStyle(
        'NormalText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#334155'),
        leading=12
    )

    story = []

    # Title Banner
    story.append(Paragraph("TruthTrail — Entity Audit Report", title_style))
    story.append(Paragraph("ML-Based Inconsistency & Cross-Record Integrity Analysis", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#4F46E5'), spaceAfter=15))

    # Entity Overview Table
    ent_id = entity_info.get("unified_entity_id", "N/A")
    name = entity_info.get("primary_name", "N/A")
    score = entity_info.get("inconsistency_score", 0)
    sev = entity_info.get("severity", "Clean")
    status = entity_info.get("investigation_status", "PENDING")

    score_color = colors.HexColor('#EF4444') if score >= 75 else (
        colors.HexColor('#F59E0B') if score >= 50 else (
            colors.HexColor('#3B82F6') if score >= 25 else colors.HexColor('#10B981')
        )
    )

    overview_data = [
        [Paragraph("<b>Unified Entity ID:</b>", normal_text), Paragraph(ent_id, normal_text),
         Paragraph("<b>Inconsistency Score:</b>", normal_text), Paragraph(f"<font color='{score_color.hexval()}'><b>{score} / 100 ({sev})</b></font>", normal_text)],
        [Paragraph("<b>Primary Name:</b>", normal_text), Paragraph(name, normal_text),
         Paragraph("<b>Investigation Status:</b>", normal_text), Paragraph(f"<b>{status}</b>", normal_text)],
        [Paragraph("<b>Total Source Records:</b>", normal_text), Paragraph(str(len(records)), normal_text),
         Paragraph("<b>National ID:</b>", normal_text), Paragraph(str(entity_info.get("national_id") or "N/A"), normal_text)]
    ]

    t_overview = Table(overview_data, colWidths=[1.5*inch, 2.1*inch, 1.5*inch, 2.1*inch])
    t_overview.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(t_overview)
    story.append(Spacer(1, 15))

    # Flagged Evidence Section
    story.append(Paragraph("Flagged Inconsistencies & Evidence Log", section_heading))
    if evidence_items:
        ev_data = [[Paragraph("<b>Type</b>", normal_text), Paragraph("<b>Severity</b>", normal_text), Paragraph("<b>Evidence Description</b>", normal_text)]]
        for ev in evidence_items:
            ev_data.append([
                Paragraph(ev.get("type", "General"), normal_text),
                Paragraph(f"<b>{ev.get('severity', 'Low')}</b>", normal_text),
                Paragraph(ev.get("description", ""), normal_text)
            ])
        t_ev = Table(ev_data, colWidths=[1.5*inch, 1.0*inch, 4.7*inch])
        t_ev.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#EEF2FF')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
            ('PADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(t_ev)
    else:
        story.append(Paragraph("No conflicting data or anomalies detected for this entity.", normal_text))

    story.append(Spacer(1, 15))

    # Side-by-side Source Records Comparison
    story.append(Paragraph("Source Records Comparison", section_heading))
    rec_headers = [Paragraph("<b>Field</b>", normal_text)] + [Paragraph(f"<b>{r.get('source_name', 'Source')}</b>", normal_text) for r in records[:3]]
    fields = [
        ("Full Name", "full_name"),
        ("National ID", "national_id"),
        ("DOB", "dob"),
        ("Email", "email"),
        ("Address", "address"),
        ("Credit Score", "credit_score"),
        ("Account Balance", "account_balance"),
        ("Status", "status"),
        ("Reg Date", "registration_date"),
        ("Ver Date", "verification_date"),
    ]

    rec_table_data = [rec_headers]
    for label, key in fields:
        row = [Paragraph(f"<b>{label}</b>", normal_text)]
        for r in records[:3]:
            val = r.get(key)
            val_str = "N/A" if val is None or pd.isna(val) else str(val)
            row.append(Paragraph(val_str, normal_text))
        rec_table_data.append(row)

    col_w = 7.2 / max(2, len(records[:3]) + 1)
    t_records = Table(rec_table_data, colWidths=[col_w * inch] * (len(records[:3]) + 1))
    t_records.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_records)

    story.append(Spacer(1, 20))
    story.append(Paragraph("<i>Report generated automatically by TruthTrail Auditing Engine. Treat detected inconsistencies as potential issues requiring human verification.</i>", subtitle_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
