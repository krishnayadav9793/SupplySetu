import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable,
)
from reportlab.pdfgen import canvas
import pymupdf  # for visual validation

# ----------------------------------------------------------------------
# Page Geometry & Configuration (A4 standard: 595.275 x 841.889 pt)
# ----------------------------------------------------------------------
PAGE_WIDTH, PAGE_HEIGHT = A4
LEFT_MARGIN = 45
RIGHT_MARGIN = 45
TOP_MARGIN = 48
BOTTOM_MARGIN = 46
CONTENT_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN  # 505.275 pt -> 505 pt

# Enterprise Color Palette
PRIMARY = colors.HexColor("#0F172A")       # Slate 900 (Deep Corporate Navy)
SECONDARY = colors.HexColor("#1E293B")     # Slate 800 (Slate Blue)
TEAL_DARK = colors.HexColor("#0F766E")     # Teal 700
TEAL_ACCENT = colors.HexColor("#0D9488")   # Teal 600
EMERALD = colors.HexColor("#059669")       # Emerald 600
EMERALD_DARK = colors.HexColor("#047857")  # Emerald 700
AMBER = colors.HexColor("#D97706")         # Amber 600
ROSE = colors.HexColor("#E11D48")          # Rose 600
SLATE_BORDER = colors.HexColor("#CBD5E1")  # Slate 300
SLATE_LINE = colors.HexColor("#E2E8F0")    # Slate 200
BG_LIGHT = colors.HexColor("#F8FAFC")      # Slate 50
BG_TINT_TEAL = colors.HexColor("#F0FDFA")  # Teal 50
BG_TINT_EMERALD = colors.HexColor("#ECFDF5")# Emerald 50
BG_TINT_AMBER = colors.HexColor("#FFFBEB")  # Amber 50
BG_TINT_BLUE = colors.HexColor("#EFF6FF")   # Blue 50
TEXT_MUTED = colors.HexColor("#64748B")    # Slate 500
TEXT_DARK = colors.HexColor("#0F172A")     # Slate 900


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute total page count,
    running headers, and running footers with strict vertical separation.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        # Page 1 is the Title & Executive Overview page -> Suppress running headers/footers
        if self._pageNumber == 1:
            return

        self.saveState()
        # Running Header (y = 806 pt, well above TOP_MARGIN = 793 pt)
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#334155"))
        self.drawString(LEFT_MARGIN, PAGE_HEIGHT - 32, "SUPPLYSETU PLATFORM SPECIFICATION  |  ROLE ARCHITECTURE & RESPONSIBILITIES")
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawRightString(PAGE_WIDTH - RIGHT_MARGIN, PAGE_HEIGHT - 32, "B2B FMCG DISTRIBUTION SaaS")

        self.setStrokeColor(SLATE_BORDER)
        self.setLineWidth(0.6)
        self.line(LEFT_MARGIN, PAGE_HEIGHT - 38, PAGE_WIDTH - RIGHT_MARGIN, PAGE_HEIGHT - 38)

        # Running Footer (y = 26 pt, well below BOTTOM_MARGIN = 46 pt)
        self.setStrokeColor(SLATE_LINE)
        self.setLineWidth(0.6)
        self.line(LEFT_MARGIN, 36, PAGE_WIDTH - RIGHT_MARGIN, 36)

        self.setFont("Helvetica", 7.2)
        self.setFillColor(colors.HexColor("#94A3B8"))
        self.drawString(LEFT_MARGIN, 24, "CONFIDENTIAL & PROPRIETARY  *  STANDARD OPERATING PROCEDURES (SOP)  *  ENTERPRISE v2.4")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(PAGE_WIDTH - RIGHT_MARGIN, 24, page_str)
        self.restoreState()


def build_pdf(output_path: str):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=LEFT_MARGIN,
        rightMargin=RIGHT_MARGIN,
        topMargin=TOP_MARGIN,
        bottomMargin=BOTTOM_MARGIN,
    )

    styles = getSampleStyleSheet()

    # Meticulous Typography Styles with Strict Line Spacing (No Overlaps Guaranteed)
    body = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11.6,
        textColor=TEXT_DARK,
        spaceAfter=3,
    )

    body_bold = ParagraphStyle(
        'DocBodyBold',
        parent=body,
        fontName='Helvetica-Bold',
    )

    body_muted = ParagraphStyle(
        'DocBodyMuted',
        parent=body,
        textColor=TEXT_MUTED,
        fontSize=7.8,
        leading=10.8,
    )

    h1 = ParagraphStyle(
        'DocH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=12.5,
        leading=16.0,
        textColor=PRIMARY,
        spaceBefore=0,
        spaceAfter=2,
        keepWithNext=True,
    )

    h2 = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10.0,
        leading=13.5,
        textColor=SECONDARY,
        spaceBefore=4,
        spaceAfter=2,
        keepWithNext=True,
    )

    h3 = ParagraphStyle(
        'DocH3',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=8.8,
        leading=12.0,
        textColor=TEAL_DARK,
        spaceBefore=3,
        spaceAfter=1,
        keepWithNext=True,
    )

    cover_title = ParagraphStyle(
        'CoverTitle',
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=PRIMARY,
        spaceAfter=3,
    )

    cover_subtitle = ParagraphStyle(
        'CoverSubtitle',
        fontName='Helvetica',
        fontSize=10.5,
        leading=14.5,
        textColor=TEAL_DARK,
        spaceAfter=8,
    )

    badge_style = ParagraphStyle(
        'BadgeStyle',
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white,
    )

    table_header_cell = ParagraphStyle(
        'TableHeaderCell',
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10.0,
        textColor=colors.white,
    )

    table_cell = ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=7.2,
        leading=9.8,
        textColor=TEXT_DARK,
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        fontName='Helvetica-Bold',
        fontSize=7.2,
        leading=9.8,
        textColor=TEXT_DARK,
    )

    table_cell_center = ParagraphStyle(
        'TableCellCenter',
        parent=table_cell,
        alignment=1,  # Centered
    )

    table_cell_center_bold = ParagraphStyle(
        'TableCellCenterBold',
        parent=table_cell_bold,
        alignment=1,  # Centered
    )

    callout_text = ParagraphStyle(
        'CalloutText',
        fontName='Helvetica',
        fontSize=7.8,
        leading=11.0,
        textColor=SECONDARY,
    )

    # Helper: Callout Box
    def make_callout(text: str, title: str = "KEY ARCHITECTURAL RULE", bg_color=BG_TINT_TEAL, border_color=TEAL_ACCENT, pad=5):
        content = [
            Paragraph(f"<b>{title}:</b> {text}", callout_text)
        ]
        t = Table([[content]], colWidths=[CONTENT_WIDTH])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_color),
            ('BOX', (0,0), (-1,-1), 1, border_color),
            ('TOPPADDING', (0,0), (-1,-1), pad),
            ('BOTTOMPADDING', (0,0), (-1,-1), pad),
            ('LEFTPADDING', (0,0), (-1,-1), 7),
            ('RIGHTPADDING', (0,0), (-1,-1), 7),
        ]))
        return t

    # Helper: Section Banner
    def make_section_banner(section_num: str, title: str, subtitle: str = ""):
        content = [
            Paragraph(f"<font color='#0D9488'><b>SECTION {section_num}</b></font>  |  <font color='#0F172A'><b>{title.upper()}</b></font>", h1),
        ]
        if subtitle:
            content.append(Paragraph(subtitle, body_muted))
        content.append(HRFlowable(width="100%", thickness=1.2, color=TEAL_ACCENT, spaceBefore=2, spaceAfter=4))
        return KeepTogether(content)

    story = []

    # ==================================================================
    # PAGE 1: TITLE & EXECUTIVE OVERVIEW
    # ==================================================================
    banner_data = [[
        Paragraph("<font color='white'><b>SUPPLYSETU PLATFORM ARCHITECTURE SPECIFICATION</b></font>", badge_style),
        Paragraph("<font color='white'><b>CONFIDENTIAL - VERSION 2.4 (ENTERPRISE STANDARD)</b></font>", ParagraphStyle('BRight', parent=badge_style, alignment=2))
    ]]
    top_banner = Table(banner_data, colWidths=[265, 240])
    top_banner.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), PRIMARY),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 7),
        ('RIGHTPADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(top_banner)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Role-Based Working & Complete Operational Responsibilities Guide", cover_title))
    story.append(Paragraph("The Authoritative Operational Standard for B2B FMCG Distribution — From Core Mandates to Micro Possibilities", cover_subtitle))
    story.append(HRFlowable(width="100%", thickness=1.5, color=EMERALD, spaceBefore=0, spaceAfter=8))

    meta_data = [
        [
            Paragraph("<b>Target Platform:</b> SupplySetu AI-Powered B2B Distribution SaaS", table_cell),
            Paragraph("<b>Client Operational Cluster:</b> Jabalpur FMCG Hub (Madhya Pradesh, India)", table_cell),
        ],
        [
            Paragraph("<b>Network Scope:</b> 1,800+ Kirana Retailers & 18 Dedicated Sales Beats", table_cell),
            Paragraph("<b>Daily Order Throughput:</b> 600+ B2B FMCG Invoices / Rs 85-100 Cr GMV", table_cell),
        ],
        [
            Paragraph("<b>Integrated Tech:</b> React + Node/TS + Supabase + Dexie.js + Gemini AI", table_cell),
            Paragraph("<b>Document Classification:</b> Production Role Architecture Standard", table_cell),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[250, 255])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 0.8, SLATE_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, SLATE_LINE),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("1. Executive Summary & Operational Mandate", h2))
    story.append(Paragraph(
        "<b>SupplySetu</b> is an enterprise-grade B2B distribution management and intelligent order orchestration platform specifically engineered for Indian FMCG wholesale distribution ecosystems. In traditional trade networks such as Jabalpur, distributors manage 1,800+ independent kirana shops using heavily fragmented, manual communication channels—unstructured WhatsApp messages written in Hindi and Hinglish, photographed notebook pages, and verbal phone orders. This conventional mode causes chronic operational friction: frequent SKU misidentification, mismatched packaging units (cases vs. individual packs), out-of-stock ordering, unapplied trade schemes, and days of manual data entry into accounting systems like Tally ERP.",
        body
    ))
    story.append(Paragraph(
        "This official document establishes the <b>definitive role-based operating model</b> of SupplySetu. It specifies the boundaries, primary workflows, secondary tasks, and micro-level edge-case responsibilities for each human and automated role: <b>Kirana Retailer</b>, <b>Beat Salesman</b>, <b>Distributor Order Desk Admin</b>, and the <b>Automated System Engine</b>. Every possible scenario—from low-connectivity beat visits and offline idempotency to multi-tier dealer pricing and Tally RFC-4180 batch reconciliation—is systematically defined to ensure complete organizational clarity and zero operational ambiguity.",
        body
    ))

    story.append(Spacer(1, 6))
    story.append(Paragraph("1.1 Key Business Transformation Objectives", h2))
    story.append(Paragraph(
        "&bull; <b>Digital Capture Rate:</b> Transition >50% of monthly ordering volume to digital and AI-assisted channels within 120 days of deployment.<br/>"
        "&bull; <b>Error Elimination:</b> Slash order mismatch and return rates from ~5% down to under 0.8% through real-time stock validation and AI confirmation screens.<br/>"
        "&bull; <b>Processing Velocity:</b> Compress average order turnaround time from 18 hours (next-morning Tally entry) to under 30 minutes for picking and dispatch.<br/>"
        "&bull; <b>Financial Discipline:</b> Enforce real-time credit checks, eliminating unauthorized over-limit supply and automating khata collection follow-ups.",
        body
    ))

    story.append(Spacer(1, 6))
    story.append(make_callout(
        "SupplySetu enforces strict multi-tenant role isolation across the entire stack. Under no circumstance may a Retailer view competitor prices, credit profiles, or distributor queues. Beat Salesmen operate with retailer-delegated booking scopes strictly bounded by their daily beat itinerary. The Distributor Admin holds full fiscal, dispatch, and master catalogue sovereignty.",
        title="CORE ARCHITECTURAL GOVERNANCE PRINCIPLE",
        bg_color=BG_TINT_TEAL,
        border_color=TEAL_ACCENT
    ))

    story.append(PageBreak())

    # ==================================================================
    # PAGE 2: MASTER RBAC & OPERATIONAL BOUNDARIES MATRIX
    # ==================================================================
    story.append(make_section_banner(
        "2",
        "Master Role-Based Access Control (RBAC) & Scope Matrix",
        "Comparative Analysis of Capabilities, Interfaces, Data Visibility, and System Authority"
    ))

    story.append(Paragraph(
        "The matrix below contrasts the operational boundaries, data mutability, interface responsibilities, and system authority across all three primary human actors and the underlying automated system engine:",
        body
    ))
    story.append(Spacer(1, 4))

    matrix_headers = [
        Paragraph("<b>Dimension / Capability</b>", table_header_cell),
        Paragraph("<b>Kirana Retailer</b>", table_header_cell),
        Paragraph("<b>Beat Salesman</b>", table_header_cell),
        Paragraph("<b>Distributor Admin</b>", table_header_cell),
        Paragraph("<b>System / AI Engine</b>", table_header_cell),
    ]
    matrix_rows = [
        [
            Paragraph("<b>Core Operational Mission</b>", table_cell_bold),
            Paragraph("Self-service order booking, price discovery & khata balance tracking.", table_cell),
            Paragraph("Route field coverage, in-person booking & zero-network offline sync.", table_cell),
            Paragraph("Centralized order triage, inventory control, credit approval & ERP export.", table_cell),
            Paragraph("Autonomous NLP parsing, rate card calculation & data synchronization.", table_cell),
        ],
        [
            Paragraph("<b>Primary UI Channel</b>", table_cell_bold),
            Paragraph("Retailer Mobile/Desktop Portal + AI Order Pad Modal.", table_cell),
            Paragraph("Mobile Beat Pad + Dexie Offline Order Pad + Queue Modal.", table_cell),
            Paragraph("12-Column Live Order Desk + Financials + CRM + Tally Portal.", table_cell),
            Paragraph("Headless REST API + WebSocket Hub + Background Workers.", table_cell),
        ],
        [
            Paragraph("<b>Pricing & Schemes Visibility</b>", table_cell_bold),
            Paragraph("Assigned Tier Dealer Rate (Standard, Tier 1, 2, Wholesale) & active deals.", table_cell),
            Paragraph("Retailer-specific rates for assigned beat stores; deals catalogue.", table_cell),
            Paragraph("Full master rate matrix (Base, MRP, Tier discounts, Scheme rules).", table_cell),
            Paragraph("Programmatic access to rate cards, schemes, and tax slabs.", table_cell),
        ],
        [
            Paragraph("<b>Order Placement Scope</b>", table_cell_bold),
            Paragraph("Self-orders only. Restricted to personal merchant account.", table_cell),
            Paragraph("On-behalf orders for assigned beat merchants only.", table_cell),
            Paragraph("Manual order creation, modification, approval, or rejection.", table_cell),
            Paragraph("Validates payloads; creates immutable order records in database.", table_cell),
        ],
        [
            Paragraph("<b>Offline Operation Mode</b>", table_cell_bold),
            Paragraph("Read-only browsing cached; requires connection to submit.", table_cell),
            Paragraph("<b>100% Full Offline Punch</b> via IndexedDB; background auto-sync.", table_cell),
            Paragraph("Online enterprise portal connected to live PostgreSQL.", table_cell),
            Paragraph("IndexedDB storage layer on client; atomic sync on server.", table_cell),
        ],
        [
            Paragraph("<b>Credit & Khata Authority</b>", table_cell_bold),
            Paragraph("View own limit, balance, utilization; simulate UPI payments.", table_cell),
            Paragraph("View assigned store balance before visiting; soft collection reminders.", table_cell),
            Paragraph("Adjust credit limits, review holds, override hard stops, audit ledgers.", table_cell),
            Paragraph("Enforces credit checks; flags CREDIT_HOLD when order > limit.", table_cell),
        ],
        [
            Paragraph("<b>Inventory / SKU Mutability</b>", table_cell_bold),
            Paragraph("Strictly read-only; sees stock badges (In Stock / Out of Stock).", table_cell),
            Paragraph("Read-only cached catalogue; real-time stock alert on sync.", table_cell),
            Paragraph("Full CRUD: Add SKUs, adjust physical stock, update MRP/HSN/GST.", table_cell),
            Paragraph("Decrements available stock upon order dispatch transition.", table_cell),
        ],
        [
            Paragraph("<b>ERP / Accounting Link</b>", table_cell_bold),
            Paragraph("Download/Print GST Tax Invoices for internal accounting.", table_cell),
            Paragraph("None (focus on field throughput and route execution).", table_cell),
            Paragraph("1-Click Streaming RFC-4180 CSV export formatted for Tally ERP.", table_cell),
            Paragraph("Sanitizes and serializes approved orders into RFC-4180 CSV stream.", table_cell),
        ],
        [
            Paragraph("<b>Dispatch & Logistics</b>", table_cell_bold),
            Paragraph("View real-time delivery status (Pending, Dispatched, Delivered).", table_cell),
            Paragraph("View delivery commitments and route dispatch schedules.", table_cell),
            Paragraph("Print picking sheets, assign delivery tempo, mark delivered.", table_cell),
            Paragraph("Dispatches WebSocket/SSE delivery alerts to mobile clients.", table_cell),
        ],
        [
            Paragraph("<b>AI Assistance Scope</b>", table_cell_bold),
            Paragraph("Paste raw Hinglish notes; verify parsed cart items.", table_cell),
            Paragraph("Quick search and voice-to-text cart population.", table_cell),
            Paragraph("Review AI confidence scores and manual mapping overrides.", table_cell),
            Paragraph("Executes Gemini API extraction with fuzzy phonetic fallbacks.", table_cell),
        ],
    ]

    matrix_table = Table([matrix_headers] + matrix_rows, colWidths=[95, 100, 100, 105, 105])
    matrix_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, SLATE_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 4.5),
        ('RIGHTPADDING', (0,0), (-1,-1), 4.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
    ]))
    story.append(matrix_table)
    story.append(Spacer(1, 6))

    story.append(make_callout(
        "Role boundaries are hardcoded in server-side Express middleware (<code>middleware/auth.ts</code>) using JWT role claims. Client-side route protections exist solely for user experience. Any attempt by a client to submit unearned dealer prices, override credit holds, or access unassigned retailer records is trapped and rejected by server-side Prisma ORM queries.",
        title="SECURITY & ANTI-TAMPERING ENFORCEMENT PROTOCOL",
        bg_color=BG_TINT_AMBER,
        border_color=AMBER,
        pad=4
    ))

    story.append(PageBreak())

    # ==================================================================
    # PAGE 3: ROLE 1 - KIRANA RETAILER SPECIFICATION
    # ==================================================================
    story.append(make_section_banner(
        "3",
        "Role Specification: Kirana Retailer (Merchant Partner)",
        "Self-Service FMCG Procurement, Multilingual AI Ordering & Credit Management"
    ))

    story.append(Paragraph("3.1 Role Overview & Operational Mandate", h2))
    story.append(Paragraph(
        "The <b>Kirana Retailer</b> represents the vital customer endpoint of the SupplySetu network (e.g. Anil Patel of Shri Ganesh Kirana Store, Lordganj). Retailers are independent proprietary grocery owners seeking rapid inventory restocking, transparent tier rates, automated trade promotions, and reliable credit tracking without waiting for physical salesman visits.",
        body
    ))

    story.append(Paragraph("3.2 Primary (Macro) Responsibilities", h2))
    retailer_macros = [
        ("Catalogue Discovery & Live Stock Auditing", "Browse authorized FMCG inventory across packaged foods and home care. Check live stock indicators before ordering to eliminate customer-facing stockouts."),
        ("Multi-Modal Digital Order Placement", "Construct purchase orders via the visual digital catalogue cart or by pasting unstructured WhatsApp messages into the AI Order Pad."),
        ("AI Order Verification & Cart Confirmation", "Act as Human-in-the-Loop reviewer: inspecting AI-matched SKUs, adjusting pack quantities, resolving brand ambiguities, and accepting stock alerts."),
        ("Automated Trade Scheme Maximization", "Leverage dynamic schemes ('Buy 10 Cases Get 1 Free', volume percentage discounts) applied in the cart to maximize retail resale margins."),
        ("Khata & Credit Limit Governance", "Monitor outstanding trade credit against approved distributor limits (e.g. Rs 75,000 ceiling), track available headroom, and resolve credit hold situations."),
        ("Order Tracking & Tax Invoice Reconciliation", "Track order status progression (Pending -> Approved -> Dispatched -> Delivered). Download official B2B Tax Invoices with GST breakdowns for Input Tax Credit (ITC).")
    ]
    for title, desc in retailer_macros:
        story.append(Paragraph(f"&bull; <b>{title}:</b> {desc}", body))

    story.append(Spacer(1, 4))
    story.append(Paragraph("3.3 Granular Micro-Responsibilities & Subtle Operational Possibilities (Small-to-Small Details)", h2))

    ret_micro_headers = [
        Paragraph("<b>Operational Event / Feature</b>", table_header_cell),
        Paragraph("<b>Granular Responsibility & System Behavior</b>", table_header_cell),
        Paragraph("<b>Edge Case / Failure Prevention</b>", table_header_cell),
    ]
    ret_micro_rows = [
        [
            Paragraph("<b>Hinglish & Dialect AI Input</b>", table_cell_bold),
            Paragraph("Retailer pastes informal text (e.g., <i>'bhaiya 5 peti biscuit chhota, 2 bori detergent 1kg'</i>). Retailer must review parsed quantities and units before confirmation.", table_cell),
            Paragraph("If Gemini AI hallucinates or maps an incorrect pack size (80g vs 120g), retailer adjusts via dropdown before adding to cart.", table_cell),
        ],
        [
            Paragraph("<b>Tiered Pricing Margin Awareness</b>", table_cell_bold),
            Paragraph("Retailers are assigned to pricing tiers (STANDARD 0%, TIER_1 2%, TIER_2 4%, WHOLESALE 6.5%). Retailer must check dealer rate vs MRP to maintain healthy margins.", table_cell),
            Paragraph("Rates are filtered server-side; retailers cannot inspect competitor pricing tiers or negotiate unearned rates.", table_cell),
        ],
        [
            Paragraph("<b>Free Product Scheme Multipliers</b>", table_cell_bold),
            Paragraph("When ordering qualifying quantities (e.g. 25 cases on 'Buy 10 Get 1 Free'), retailer must recognize schemes use integer floor division (25 yields 2 free cases, with 5 remainder).", table_cell),
            Paragraph("Cart summary explicitly displays free units as separate Rs 0.00 line items with tax-exempt treatment.", table_cell),
        ],
        [
            Paragraph("<b>Credit Hold Exceedance Protocol</b>", table_cell_bold),
            Paragraph("If order total pushes balance beyond credit limit (e.g. Rs 22,000 order with Rs 15,000 available headroom), order enters <b>CREDIT_HOLD</b> status upon placement.", table_cell),
            Paragraph("Retailer can reduce order size or initiate an instant simulated UPI payment to immediately unlock credit headroom.", table_cell),
        ],
        [
            Paragraph("<b>UPI QR Payment Simulation</b>", table_cell_bold),
            Paragraph("Retailer enters payment amount on Khata screen, scans simulated dynamic QR, and submits reference. Instant credit reflection unlocks pending orders.", table_cell),
            Paragraph("Submitting a payment amount greater than outstanding debt is rejected with a validation warning.", table_cell),
        ],
        [
            Paragraph("<b>1-Click Repeat Order Mechanics</b>", table_cell_bold),
            Paragraph("Retailer can duplicate previous orders with a single tap. System checks current warehouse stock for each item before populating the cart.", table_cell),
            Paragraph("Any discontinued or out-of-stock SKUs are automatically pruned and flagged in a prominent warning toast.", table_cell),
        ],
        [
            Paragraph("<b>Wholesale Unit & MOQ Multiples</b>", table_cell_bold),
            Paragraph("Each SKU enforces wholesale box multiples (e.g. 1 BOX = 72 packets). Retailers cannot place orders for fractional cases or loose packets.", table_cell),
            Paragraph("Quantity spinners enforce MOQ steps automatically; typing invalid numbers snaps to the nearest valid case multiple.", table_cell),
        ],
    ]

    ret_micro_table = Table([ret_micro_headers] + ret_micro_rows, colWidths=[110, 245, 150])
    ret_micro_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), TEAL_DARK),
        ('GRID', (0,0), (-1,-1), 0.5, SLATE_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.2),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
    ]))
    story.append(ret_micro_table)

    story.append(PageBreak())

    # ==================================================================
    # PAGE 4: ROLE 2 - BEAT SALESMAN SPECIFICATION
    # ==================================================================
    story.append(make_section_banner(
        "4",
        "Role Specification: Beat Salesman (Field Sales Executive)",
        "Daily Route Execution, Zero-Network Offline Order Punching & Khata Collections"
    ))

    story.append(Paragraph("4.1 Role Overview & Operational Mandate", h2))
    story.append(Paragraph(
        "The <b>Beat Salesman</b> (e.g. Vikram Sharma, Beat #4 Lordganj & Sarafa) is the distributor's mobile field force. Salesmen visit 30-40 retail stores daily, punch on-behalf orders for non-tech-savvy merchants, conduct shelf audits, and monitor payment discipline. In dense bazars with severe network dead-zones, salesmen rely on a <b>100% offline-first Dexie.js IndexedDB order pad</b>.",
        body
    ))

    story.append(Paragraph("4.2 Primary (Macro) Responsibilities", h2))
    salesman_macros = [
        ("Beat Route Sequence Execution", "Follow daily assigned beat sequence. Visit mapped stores, log visit statuses ('Visited' vs 'Pending'), and maintain disciplined route pacing."),
        ("On-Behalf Order Punching for Kiranas", "Book commercial FMCG orders on behalf of kirana proprietors directly onto the mobile pad, selecting case quantities, confirming schemes, and noting merchant requests."),
        ("Pre-Order Khata & Overdue Auditing", "Inspect retailer debt and available credit headroom before entering the store. Flag overdue balances and negotiate payment promises before booking new stock."),
        ("Zero-Network Offline Order Booking", "Operate smoothly in complete network absence using local Dexie.js IndexedDB storage without UI lag, spinner timeouts, or data corruption."),
        ("Idempotent Synchronization Management", "Ensure all queued offline orders are successfully transmitted to the Jabalpur distribution cloud upon network restoration, verifying zero duplicate bookings."),
        ("Sales Targets & Performance Tracking", "Track daily Gross Merchandise Value (GMV), productive call counts (orders booked vs total visits), and monitor monthly incentive progress.")
    ]
    for title, desc in salesman_macros:
        story.append(Paragraph(f"&bull; <b>{title}:</b> {desc}", body))

    story.append(Spacer(1, 4))
    story.append(Paragraph("4.3 Granular Micro-Responsibilities & Subtle Operational Possibilities (Small-to-Small Details)", h2))

    sales_micro_headers = [
        Paragraph("<b>Operational Event / Feature</b>", table_header_cell),
        Paragraph("<b>Granular Responsibility & System Behavior</b>", table_header_cell),
        Paragraph("<b>Edge Case / Failure Prevention</b>", table_header_cell),
    ]
    sales_micro_rows = [
        [
            Paragraph("<b>Morning Catalogue Cache Priming</b>", table_cell_bold),
            Paragraph("Before leaving the central warehouse, salesman must open the app on depot Wi-Fi to prime Dexie.js IndexedDB with full active product lists, prices, and merchant records.", table_cell),
            Paragraph("If launched cold in a dead-zone without local cache, app warns the user to connect to cellular data to initialize local storage.", table_cell),
        ],
        [
            Paragraph("<b>UUID ClientOrderId Idempotency</b>", table_cell_bold),
            Paragraph("Every order created offline generates a cryptographically unique UUIDv4 <code>clientOrderId</code>. Salesman monitors sync status without fear of double billing.", table_cell),
            Paragraph("If cellular signal drops mid-transmission, backend deduplicates by <code>clientOrderId</code>, guaranteeing the retailer is never double-billed.", table_cell),
        ],
        [
            Paragraph("<b>Simulated Offline Testing Mode</b>", table_cell_bold),
            Paragraph("The app features an interactive 'Simulated Offline' toggle in the header. Salesman can test local queue storage and test offline workflows even when cellular signal is active.", table_cell),
            Paragraph("Enables hands-on field training of new salesmen without sending test orders to the warehouse picking line.", table_cell),
        ],
        [
            Paragraph("<b>Offline Queue Inspection & Purging</b>", table_cell_bold),
            Paragraph("Salesman opens 'Offline Queue Modal' to view pending unsynced orders, timestamps, merchant names, and amounts. Salesman can review or cancel an un-synced order before upload.", table_cell),
            Paragraph("Provides complete transparency so salesmen can assure kirana owners that their order is securely recorded on the device.", table_cell),
        ],
        [
            Paragraph("<b>Stock Depletion Conflict on Sync</b>", table_cell_bold),
            Paragraph("If warehouse stock for an ordered item depletes while the salesman is offline in Sarafa Bazar, the backend flags the discrepancy upon synchronization.", table_cell),
            Paragraph("The order is synced with a <code>PARTIAL_STOCK_WARNING</code>; salesman receives an alert to notify the retailer or substitute an alternative SKU.", table_cell),
        ],
        [
            Paragraph("<b>Special Operational Notes Logging</b>", table_cell_bold),
            Paragraph("Salesmen must log delivery constraints (e.g. <i>'Store in narrow alley, deliver via 2-wheeler tempo before 11 AM'</i> or <i>'Cheque ready on delivery'</i>).", table_cell),
            Paragraph("Notes are passed verbatim into the order record, printed on picking sheets, and displayed on the Admin Order Desk.", table_cell),
        ],
        [
            Paragraph("<b>In-Shop Khata Collection Reminders</b>", table_cell_bold),
            Paragraph("Salesman inspects <code>outstandingBalance</code>. If the merchant is nearing credit exhaustion, salesman collects cash or guides the shopkeeper to scan the UPI QR code.", table_cell),
            Paragraph("Prevents the salesman from booking large orders that will stall in distributor credit hold.", table_cell),
        ],
    ]

    sales_micro_table = Table([sales_micro_headers] + sales_micro_rows, colWidths=[110, 245, 150])
    sales_micro_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('GRID', (0,0), (-1,-1), 0.5, SLATE_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.2),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
    ]))
    story.append(sales_micro_table)

    story.append(PageBreak())

    # ==================================================================
    # PAGE 5: ROLE 3 - DISTRIBUTOR ADMIN SPECIFICATION
    # ==================================================================
    story.append(make_section_banner(
        "5",
        "Role Specification: Distributor Admin (Order Desk Operations)",
        "Centralized Command, Risk Management, Inventory Control & Tally ERP Export"
    ))

    story.append(Paragraph("5.1 Role Overview & Operational Mandate", h2))
    story.append(Paragraph(
        "The <b>Distributor Admin / Order Desk Manager</b> (e.g. Ramesh Gupta, Jabalpur Central Depot) is the primary operational and financial custodian of the entire distribution network. The Admin operates the central 12-column Order Desk, monitoring an average of 600 orders daily across 1,800 retail accounts. Responsibilities span reviewing orders, mitigating credit risk, managing stock and pricing tiers, and generating compliant RFC-4180 CSV exports for Tally ERP.",
        body
    ))

    story.append(Paragraph("5.2 Primary (Macro) Responsibilities", h2))
    admin_macros = [
        ("Central 12-Column Live Order Desk Operations", "Triage, inspect, and process high-volume order streams. Filter orders by status tabs: 'Pending Review', 'Credit Hold', 'Approved', and 'All Orders'. Real-time toast alerts notify admins of fresh bookings."),
        ("Financial Risk & Credit Hold Adjudication", "Evaluate orders flagged for exceeding merchant credit limits. Review retailer payment history and exercise authority to approve with override or reject with documented reasons."),
        ("FMCG Master Catalogue & Inventory Control", "Maintain master SKU definitions, packaging specs (pack sizes, units), MRP, dealer base prices, GST tax slabs (5%, 12%, 18%), and adjust physical warehouse stock counts in real time."),
        ("Dynamic Trade Promotion Scheme Engineering", "Configure and launch promotional schemes (Buy X Get Y Free, Percentage Bulk Discounts, Flat Discounts). Set minimum qualifying thresholds, free product mappings, and campaign validity dates."),
        ("Kirana Retailer CRM & Tier Assignments", "Manage retailer accounts, configure credit limits, assign price tiers (STANDARD, TIER_1, TIER_2, WHOLESALE), map shops to designated beat salesmen, and verify GSTIN tax numbers."),
        ("Tally ERP RFC-4180 Batch CSV Export", "Export approved order batches into standard accounting CSV templates with precise SKU codes, HSN numbers, dealer rates, tax breaks, and retailer ledger codes for zero-error Tally ERP import.")
    ]
    for title, desc in admin_macros:
        story.append(Paragraph(f"&bull; <b>{title}:</b> {desc}", body))

    story.append(Spacer(1, 4))
    story.append(Paragraph("5.3 Granular Micro-Responsibilities & Subtle Operational Possibilities (Small-to-Small Details)", h2))

    admin_micro_headers = [
        Paragraph("<b>Operational Event / Feature</b>", table_header_cell),
        Paragraph("<b>Granular Responsibility & System Behavior</b>", table_header_cell),
        Paragraph("<b>Edge Case / Failure Prevention</b>", table_header_cell),
    ]
    admin_micro_rows = [
        [
            Paragraph("<b>Credit Hold Adjudication & Override</b>", table_cell_bold),
            Paragraph("When an order exceeds credit ceiling, system flags it in amber. Admin reviews merchant khata ledger and decides whether to approve based on verbal payment promises.", table_cell),
            Paragraph("If approved, an audit flag records the admin user ID and timestamp; if rejected, a mandatory rejection reason is logged and pushed to the retailer.", table_cell),
        ],
        [
            Paragraph("<b>Order Rejection Reason Logging</b>", table_cell_bold),
            Paragraph("Admin cannot reject an order with a blank reason. Admin must select or enter structured rejection categories: <i>'Credit Limit Exhausted'</i>, <i>'Damaged Batch / Stockout'</i>, or <i>'Address Outside Beat Territory'</i>.", table_cell),
            Paragraph("The rejection reason immediately updates the order status in the retailer's app and salesman's beat list, preventing repeat ordering of bad lines.", table_cell),
        ],
        [
            Paragraph("<b>Dispatch Pipeline Progression</b>", table_cell_bold),
            Paragraph("Admin transitions orders through operational gates: <code>APPROVED</code> -> <code>DISPATCHED</code> (warehouse picking sheet printed) -> <code>DELIVERED</code> (driver proof of delivery).", table_cell),
            Paragraph("Transitioning to <code>DISPATCHED</code> automatically decrements warehouse inventory in PostgreSQL and reserves stock against pending orders.", table_cell),
        ],
        [
            Paragraph("<b>Tally CSV Formatting Compliance</b>", table_cell_bold),
            Paragraph("Admin triggers batch export for Tally ERP. Admin must ensure all exported orders are in <code>APPROVED</code> status, with valid HSN codes, correct dealer rates, and escaped text fields.", table_cell),
            Paragraph("Export engine enforces strict RFC-4180 CSV compliance: double-quotes commas, handles multi-line notes, and encodes in UTF-8 BOM to prevent Tally import crashes.", table_cell),
        ],
        [
            Paragraph("<b>Inactive Retailer Retention Triage</b>", table_cell_bold),
            Paragraph("Admin dashboard actively scans merchant ordering frequency and flags retailers with zero orders in the last 14 days. Admin reallocates beat routes or schedules salesman calls.", table_cell),
            Paragraph("Prevents kirana attrition to competitor FMCG distributors by catching churn early.", table_cell),
        ],
        [
            Paragraph("<b>Scheme Non-Stacking Guardrails</b>", table_cell_bold),
            Paragraph("When creating trade promotions, Admin must verify that multiple schemes do not inadvertently stack on the same SKU (e.g. 5% bulk discount PLUS Buy 10 Get 1 Free) unless intentionally authorized.", table_cell),
            Paragraph("Pricing engine applies schemes deterministically based on priority rules, protecting distributor gross margins.", table_cell),
        ],
        [
            Paragraph("<b>Channel Origin Auditing</b>", table_cell_bold),
            Paragraph("Admin inspects the <code>createdVia</code> badge on each order: <code>PORTAL</code>, <code>AI_CAPTURE</code>, <code>SALESMAN_APP</code>, or <code>OFFLINE_SYNC</code>.", table_cell),
            Paragraph("Enables admin to evaluate AI adoption rates, field salesman efficiency, and track which retailers are successfully transitioning to digital ordering.", table_cell),
        ],
    ]

    admin_micro_table = Table([admin_micro_headers] + admin_micro_rows, colWidths=[110, 245, 150])
    admin_micro_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, SLATE_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.2),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
    ]))
    story.append(admin_micro_table)

    story.append(PageBreak())

    # ==================================================================
    # PAGE 6: ROLE 4 - SYSTEM & AUTOMATED ENGINES
    # ==================================================================
    story.append(make_section_banner(
        "6",
        "Role Specification: System & Automated Architectural Engines",
        "The Non-Human Autonomous Actors Governing Logic, Data Integrity, and Interoperability"
    ))

    story.append(Paragraph("6.1 The System Actor: Autonomous Architectural Services", h2))
    story.append(Paragraph(
        "SupplySetu is powered by five mission-critical automated backend engines that act as non-human participants in the platform lifecycle. These engines execute deterministic calculations, probabilistic natural language parsing, and state synchronizations that eliminate manual office entry:",
        body
    ))
    story.append(Spacer(1, 4))

    engine_headers = [
        Paragraph("<b>Automated Engine / Service</b>", table_header_cell),
        Paragraph("<b>Core Execution Mandate & Logic Rules</b>", table_header_cell),
        Paragraph("<b>Safety Guardrails & Fallbacks</b>", table_header_cell),
    ]
    engine_rows = [
        [
            Paragraph("<b>Gemini AI Order Extraction Engine</b>", table_cell_bold),
            Paragraph("Ingests unstructured Hinglish/Hindi text notes from WhatsApp or voice transcripts. Uses Google Gemini API (<code>@google/genai</code>) to extract SKU codes, quantities, and packaging units.", table_cell),
            Paragraph("<b>Phonetic Fuzzy Fallback:</b> If AI API is unreachable or ambiguous, backend falls back to local Levenshtein/regex matching. Output is always presented to the user for confirmation.", table_cell),
        ],
        [
            Paragraph("<b>Dynamic Tier Pricing Engine</b>", table_cell_bold),
            Paragraph("Computes invoice line items: <code>BasePrice * (1 - TierDiscount)</code>, then adds applicable GST (5%, 12%, 18%). Evaluates dealer margins vs consumer MRP.", table_cell),
            Paragraph("<b>Server-Side Determinism:</b> Client-submitted prices are discarded; backend recalculates all line items against database rate cards to eliminate client tampering.", table_cell),
        ],
        [
            Paragraph("<b>Automated Trade Scheme Engine</b>", table_cell_bold),
            Paragraph("Evaluates order basket against active schemes. Calculates <code>BUY_X_GET_Y_FREE</code> bonus units using integer floor division; calculates percentage discounts on qualifying volumes.", table_cell),
            Paragraph("Free products are injected as Rs 0.00 line items with tax-exempt treatment according to Indian GST trade promotional rules.", table_cell),
        ],
        [
            Paragraph("<b>Dexie IndexedDB Sync Worker</b>", table_cell_bold),
            Paragraph("Monitors navigator online status. Automatically drains offline order queue upon reconnection, executing atomic POST requests with UUID idempotency keys.", table_cell),
            Paragraph("<b>Exponential Backoff & Dedup:</b> Prevents duplicate submissions on unstable connections and stores failed payloads for manual retry.", table_cell),
        ],
        [
            Paragraph("<b>Live Notification & SSE Hub</b>", table_cell_bold),
            Paragraph("Dispatches Server-Sent Events (SSE) and WebSocket alerts to connected Admin Order Desks when new orders arrive, accompanied by audio toasts and metric refreshes.", table_cell),
            Paragraph("Guarantees that warehouse pickers and office clerks receive instant visibility without manual browser page reloading.", table_cell),
        ],
    ]

    engine_table = Table([engine_headers] + engine_rows, colWidths=[110, 245, 150])
    engine_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#334155")),
        ('GRID', (0,0), (-1,-1), 0.5, SLATE_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.2),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
    ]))
    story.append(engine_table)

    story.append(Spacer(1, 6))
    story.append(Paragraph("6.2 Technical Failure Recovery & Exception Handling Protocols", h2))

    fail_headers = [
        Paragraph("<b>Failure Condition / Edge Case</b>", table_header_cell),
        Paragraph("<b>Autonomous System Response</b>", table_header_cell),
        Paragraph("<b>Human Operator Action</b>", table_header_cell),
    ]
    fail_rows = [
        [
            Paragraph("<b>Gemini AI API Network Timeout</b>", table_cell_bold),
            Paragraph("System engages local fuzzy regex parser; maps obvious keywords (e.g. 'parle g', 'surf excel') and flags unparsed lines.", table_cell),
            Paragraph("Retailer manually verifies unmapped items on interactive review screen.", table_cell),
        ],
        [
            Paragraph("<b>Simultaneous Out-of-Stock Race</b>", table_cell_bold),
            Paragraph("Prisma transaction fails on order approval if stock decrements below zero; order is automatically placed on stock hold.", table_cell),
            Paragraph("Admin contacts retailer to propose alternate pack size or partial delivery.", table_cell),
        ],
        [
            Paragraph("<b>Network Flicker During Offline Sync</b>", table_cell_bold),
            Paragraph("Sync worker traps HTTP failure, retains order in Dexie IndexedDB queue, and retries in 15 seconds using exponential backoff.", table_cell),
            Paragraph("Salesman sees amber 'Syncing' badge; no manual data re-entry required.", table_cell),
        ],
    ]
    fail_table = Table([fail_headers] + fail_rows, colWidths=[130, 225, 150])
    fail_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('GRID', (0,0), (-1,-1), 0.5, SLATE_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.2),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
    ]))
    story.append(fail_table)

    story.append(PageBreak())

    # ==================================================================
    # PAGE 7: CROSS-ROLE WORKFLOWS & END-TO-END SCENARIOS
    # ==================================================================
    story.append(make_section_banner(
        "7",
        "Cross-Role Workflows & End-to-End Operational Scenarios",
        "Step-by-Step Multi-Role Interaction Lifecycles Across Real-World Distribution Scenarios"
    ))

    story.append(Paragraph(
        "The power of SupplySetu lies in how these roles interact seamlessly across complete operational cycles. The following four real-world scenarios trace multi-role handoffs from initial demand capture through warehouse dispatch and accounting export:",
        body
    ))
    story.append(Spacer(1, 3))

    scenarios = [
        ("SCENARIO A: The Messy WhatsApp Natural Language AI Order Flow", [
            ("Step 1 (Ingestion)", "Kirana retailer receives a messy list on WhatsApp from shop assistant: <i>'bhaiya 10 peti parle g, 4 peti surf excel 1kg, 2 peti red label'</i>. Retailer copies text into SupplySetu AI Order Pad."),
            ("Step 2 (AI Parsing)", "Gemini AI parses text, resolving 'parle g' to <code>PARLE-G-80G</code> (10 boxes), 'surf excel 1kg' to <code>SURF-EXCEL-1KG</code> (4 boxes), and 'red label' to <code>RED-LABEL-TEA-250G</code> (2 boxes)."),
            ("Step 3 (Human Review)", "The review modal opens. Retailer sees Red Label Tea is out of stock in depot; replaces with Tata Tea. Verifies Parle-G triggered 'Buy 10 Get 1 Free' scheme (+1 free box). Confirms cart."),
            ("Step 4 (Admin Triage)", "Order lands on Admin Order Desk tagged as <code>createdVia: AI_CAPTURE</code>. Admin reviews line items, sees retailer has adequate credit, and clicks 'Approve Order'."),
            ("Step 5 (ERP Export)", "Approved order is included in the evening Tally ERP batch export, ready for accounting reconciliation.")
        ]),
        ("SCENARIO B: The Remote Beat Zero-Network Offline Punch & Sync", [
            ("Step 1 (Offline Arrival)", "Beat salesman arrives at Sarafa Bazar shop where mobile connectivity drops completely. App header switches to offline badge."),
            ("Step 2 (Local Booking)", "Salesman opens shop profile, selects 15 cases of detergent, and punches order. Order is written to local Dexie.js IndexedDB with UUID <code>clientOrderId: c7b3...</code>. Salesman receives local confirmation."),
            ("Step 3 (Queue Storage)", "Salesman checks 'Offline Queue'; sees the pending order timestamped and securely cached."),
            ("Step 4 (Sync Trigger)", "Salesman drives out of bazaar into 4G zone. The Sync Engine detects connection, initiates background upload, and clears the Dexie queue upon HTTP 201 receipt."),
            ("Step 5 (Depot Alert)", "Live sound alert sounds at distributor depot; order appears on live desk tagged <code>createdVia: OFFLINE_SYNC</code>.")
        ]),
        ("SCENARIO C: Credit Ceiling Exceedance & Instant QR Resolution", [
            ("Step 1 (Limit Exceedance)", "Retailer with Rs 75,000 credit ceiling and Rs 62,000 existing debt attempts to book a Rs 20,000 stock order. Total liability = Rs 82,000 (exceeds limit by Rs 7,000)."),
            ("Step 2 (Credit Hold)", "The system automatically places the order in <code>CREDIT_HOLD</code> status instead of clean approval."),
            ("Step 3 (Admin Review)", "Admin Order Desk receives the order in the 'Credit Hold' tab with amber highlighting. Admin inspects merchant khata history and contacts shopkeeper."),
            ("Step 4 (Instant Payment)", "Retailer opens Khata tab, clicks 'Pay via UPI', inputs Rs 10,000 payment, scans QR, and submits. Balance drops to Rs 52,000."),
            ("Step 5 (Order Release)", "Admin refreshes desk, verifies credit headroom is now Rs 23,000, and immediately approves the order for warehouse dispatch.")
        ]),
        ("SCENARIO D: Dormant Kirana Churn Detection & Field Recovery", [
            ("Step 1 (Churn Scan)", "Analytics Engine detects Shri Balaji Store has not placed an order in 16 days (exceeds 14-day threshold)."),
            ("Step 2 (Admin Alert)", "Admin overview dashboard flags Balaji Store under 'Inactive Retailers' with priority red badge."),
            ("Step 3 (Salesman Dispatch)", "Admin re-routes Beat #4 salesman Vikram Sharma to prioritize an in-person retention visit."),
            ("Step 4 (Retention Order)", "Salesman visits store, offers 3% volume promotional scheme on tea leaves, and punches an on-behalf order.")
        ])
    ]

    for sc_title, steps in scenarios:
        story.append(Paragraph(f"<b>{sc_title}</b>", h3))
        for step_name, step_text in steps:
            story.append(Paragraph(f"&nbsp;&nbsp;&bull; <b>{step_name}:</b> {step_text}", body))
        story.append(Spacer(1, 2))

    story.append(PageBreak())

    # ==================================================================
    # PAGE 8: RACI GOVERNANCE MATRIX & SYSTEM SIGN-OFF
    # ==================================================================
    story.append(make_section_banner(
        "8",
        "RACI Governance Matrix & Enterprise Sign-Off",
        "Responsibility Assignment, Security Protocols, and Production Verification Standard"
    ))

    story.append(Paragraph("8.1 Complete RACI Responsibility Assignment Matrix", h2))
    story.append(Paragraph(
        "The RACI matrix below governs all core operational actions (<b>R</b> = Responsible, <b>A</b> = Accountable, <b>C</b> = Consulted, <b>I</b> = Informed):",
        body
    ))
    story.append(Spacer(1, 3))

    raci_headers = [
        Paragraph("<b>Platform Capability / Operational Task</b>", table_header_cell),
        Paragraph("<b>Retailer</b>", table_header_cell),
        Paragraph("<b>Salesman</b>", table_header_cell),
        Paragraph("<b>Admin</b>", table_header_cell),
        Paragraph("<b>System / AI</b>", table_header_cell),
    ]
    raci_rows = [
        [
            Paragraph("Self-Service Digital Order Creation", table_cell_bold),
            Paragraph("<b>R / A</b>", table_cell_center),
            Paragraph("I", table_cell_center),
            Paragraph("I", table_cell_center),
            Paragraph("C (Validates)", table_cell_center),
        ],
        [
            Paragraph("On-Behalf Beat Order Booking", table_cell_bold),
            Paragraph("C (Approves)", table_cell_center),
            Paragraph("<b>R / A</b>", table_cell_center),
            Paragraph("I", table_cell_center),
            Paragraph("C (Calculates)", table_cell_center),
        ],
        [
            Paragraph("Unstructured Text / Hinglish AI Parsing", table_cell_bold),
            Paragraph("C (Reviews)", table_cell_center),
            Paragraph("C", table_cell_center),
            Paragraph("I", table_cell_center),
            Paragraph("<b>R / A (Parses)</b>", table_cell_center),
        ],
        [
            Paragraph("Offline Order Caching & Sync Execution", table_cell_bold),
            Paragraph("I", table_cell_center),
            Paragraph("<b>R</b>", table_cell_center),
            Paragraph("I", table_cell_center),
            Paragraph("<b>A (Atomic Sync)</b>", table_cell_center),
        ],
        [
            Paragraph("Credit Limit Overrun Adjudication", table_cell_bold),
            Paragraph("I", table_cell_center),
            Paragraph("C", table_cell_center),
            Paragraph("<b>R / A (Decides)</b>", table_cell_center),
            Paragraph("R (Flags Hold)", table_cell_center),
        ],
        [
            Paragraph("Master SKU Base Price & MRP Setup", table_cell_bold),
            Paragraph("I", table_cell_center),
            Paragraph("I", table_cell_center),
            Paragraph("<b>R / A</b>", table_cell_center),
            Paragraph("C", table_cell_center),
        ],
        [
            Paragraph("Trade Scheme Formulation & Activation", table_cell_bold),
            Paragraph("I", table_cell_center),
            Paragraph("I", table_cell_center),
            Paragraph("<b>R / A</b>", table_cell_center),
            Paragraph("R (Applies)", table_cell_center),
        ],
        [
            Paragraph("Tally ERP RFC-4180 Batch CSV Generation", table_cell_bold),
            Paragraph("N/A", table_cell_center),
            Paragraph("N/A", table_cell_center),
            Paragraph("<b>R / A</b>", table_cell_center),
            Paragraph("R (Formats)", table_cell_center),
        ],
        [
            Paragraph("Khata Debt Settlement & UPI Payment", table_cell_bold),
            Paragraph("<b>R / A</b>", table_cell_center),
            Paragraph("C (Follows Up)", table_cell_center),
            Paragraph("I (Audits)", table_cell_center),
            Paragraph("R (Credits)", table_cell_center),
        ],
        [
            Paragraph("Inactive Kirana Churn Detection & Re-Route", table_cell_bold),
            Paragraph("I", table_cell_center),
            Paragraph("R (Re-Visits)", table_cell_center),
            Paragraph("<b>A (Re-Routes)</b>", table_cell_center),
            Paragraph("R (Scans & Flags)", table_cell_center),
        ],
    ]

    raci_table = Table([raci_headers] + raci_rows, colWidths=[175, 75, 75, 85, 95])
    raci_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, SLATE_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3.2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.2),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
    ]))
    story.append(raci_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph("8.2 Security Boundaries, Access Control & Data Protection Mandates", h2))
    story.append(Paragraph(
        "&bull; <b>Database Multi-Tenant Isolation:</b> All retailer queries in Prisma ORM strictly scope by <code>where: { retailerId: user.retailer.id }</code>. Retailers cannot query or mutate records outside their shop foreign keys. Salesmen can only access merchants mapped in their assigned beat table.<br/>"
        "&bull; <b>Strict Server-Side Price Authority:</b> The frontend never dictates pricing or taxes. Any prices sent from the client are disregarded; the server reconstructs cart pricing using the retailer's assigned <code>PriceTier</code> and the current <code>Product</code> master table.<br/>"
        "&bull; <b>Idempotent Offline Guarantees:</b> Offline orders use client-generated UUID keys (<code>clientOrderId</code>). In case of duplicate HTTP POST attempts due to cellular retry storms, the backend enforces uniqueness constraints, returning the existing order record without double-debiting inventory.<br/>"
        "&bull; <b>Tally RFC-4180 CSV Hardening:</b> All exported fields are sanitized against formula injection (stripping leading '=', '+', '-'), enclosed in RFC-4180 quotes, and encoded in UTF-8 BOM to prevent corrupt imports into legacy Tally ERP versions.",
        body
    ))

    story.append(Spacer(1, 6))
    story.append(make_callout(
        "By enforcing deterministic roles, unambiguous boundaries, and automated safety fallbacks, SupplySetu eliminates over 95% of manual ordering errors, reduces order processing latency from 18 hours to under 30 minutes, and secures distributor cash flow across extensive FMCG distribution networks.",
        title="OPERATIONAL CONCLUSION & SYSTEM SIGN-OFF",
        bg_color=BG_TINT_EMERALD,
        border_color=EMERALD_DARK,
        pad=4
    ))

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated 8-page master PDF at: {output_path}")


if __name__ == "__main__":
    out_file = r"D:\CODING\AI-ML\SupplySetu\SupplySetu_Role_Based_Architecture_and_Responsibilities_Guide.pdf"
    build_pdf(out_file)
