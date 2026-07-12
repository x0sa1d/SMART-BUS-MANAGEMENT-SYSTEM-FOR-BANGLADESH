#!/usr/bin/env python3
"""Generate FYP proposal PPTX and PDF for Smart Bus Management System."""

from pathlib import Path

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from fpdf import FPDF

OUTPUT_DIR = Path(__file__).resolve().parents[1] / "docs"
PPTX_PATH = OUTPUT_DIR / "FYP-Proposal-Smart-Bus-Management-System.pptx"
PDF_PATH = OUTPUT_DIR / "FYP-Proposal-Smart-Bus-Management-System.pdf"

PRIMARY = RGBColor(0x0F, 0x4C, 0x81)
ACCENT = RGBColor(0x00, 0x96, 0xC7)
DARK = RGBColor(0x1E, 0x29, 0x3B)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
MUTED = RGBColor(0x64, 0x74, 0x8B)

SLIDES = [
    {
        "type": "title",
        "title": "Smart Bus Management System for Bangladesh",
        "subtitle": "Final Year Project (FYP) Proposal",
        "lines": [
            "Submitted By:",
            "• Your Name",
            "• ID: XXXXXXX",
            "",
            "Department of Computer Science and Engineering",
            "",
            "Supervisor:",
            "• Supervisor Name",
            "",
            "University Name",
        ],
    },
    {
        "title": "Introduction",
        "bullets": [
            "The transportation sector in Bangladesh serves millions of passengers every day.",
            "Most bus management activities — ticket booking, route management, and company operations — are still handled manually or through isolated systems.",
            "This project aims to develop a centralized Smart Bus Management System that connects passengers, bus companies, drivers, and administrators on a single digital platform.",
        ],
    },
    {
        "title": "Problem Statement",
        "bullets": [
            "Manual ticket booking processes",
            "Lack of centralized bus information",
            "Difficulty finding available routes and schedules",
            "Limited access to online ticket purchasing",
            "Inefficient fleet management",
            "Poor route and schedule monitoring",
            "Lack of real-time operational analytics",
        ],
    },
    {
        "title": "Project Objectives",
        "bullets": [
            "Develop a centralized bus management platform",
            "Digitize ticket booking and payment processes",
            "Manage buses, routes, schedules, and drivers",
            "Support multiple bus companies",
            "Provide real-time operational monitoring",
            "Improve passenger convenience",
            "Generate reports and business analytics",
        ],
    },
    {
        "title": "Proposed Solution",
        "intro": "The Smart Bus Management System will provide:",
        "bullets": [
            "Online ticket booking",
            "Route and destination search",
            "Bus company management",
            "Driver management",
            "Schedule management",
            "Payment processing",
            "Passenger management",
            "Maintenance tracking",
            "Reporting and analytics",
            "Administrative control panel",
        ],
    },
    {
        "title": "System Users",
        "sections": [
            ("Super Admin", [
                "Manage companies",
                "Approve company registrations",
                "Manage routes and schedules",
                "View system-wide reports",
            ]),
            ("Company Admin", [
                "Manage buses",
                "Manage drivers",
                "Manage schedules",
                "View bookings",
            ]),
            ("Passenger", [
                "Register and log in",
                "Search routes",
                "Book tickets",
                "Make payments",
            ]),
            ("Driver", [
                "View assigned trips",
                "Update trip status",
            ]),
        ],
    },
    {
        "title": "Key Features",
        "bullets": [
            "User Registration and Login",
            "Company Registration and Approval",
            "Bus Management",
            "Route Management",
            "Schedule Management",
            "Driver Management",
            "Passenger Management",
            "Online Ticket Booking",
            "Cart and Checkout System",
            "Online Payment Gateway",
            "Maintenance Management",
            "Reporting and Analytics",
        ],
    },
    {
        "title": "Bangladesh Transport Coverage",
        "intro": "The system will support:",
        "bullets": [
            "8 Divisions",
            "64 Districts",
            "67+ Major Bus Terminals",
            "258+ Major Routes",
            "Major Tourist Destinations",
            "Intercity Transportation Services",
        ],
        "footer": "The platform will maintain route and destination information across Bangladesh.",
    },
    {
        "title": "Bus Company Integration",
        "intro": "The system will support approximately 486 registered bus operators, including:",
        "bullets": [
            "Green Line Paribahan",
            "Shohagh Paribahan",
            "Shyamoli Paribahan",
            "Hanif Enterprise",
            "Eagle Paribahan",
            "Ena Transport",
            "Sakura Paribahan",
            "Saint Martin Paribahan",
            "Keya Paribahan",
            "Golden Line Paribahan",
            "and many other registered operators.",
        ],
    },
    {
        "title": "Technology Stack",
        "sections": [
            ("Frontend", ["Next.js", "TypeScript", "Tailwind CSS"]),
            ("Backend", ["Node.js", "Next.js API Routes"]),
            ("Database", ["PostgreSQL"]),
            ("Authentication", ["NextAuth.js"]),
            ("Payments", ["bKash", "Nagad", "Rocket", "SSLCommerz"]),
        ],
    },
    {
        "title": "Main Modules",
        "bullets": [
            "Users",
            "Bus Companies",
            "Buses",
            "Routes",
            "Stops",
            "Drivers",
            "Passengers",
            "Schedules",
            "Bookings",
            "Payments",
            "Maintenance",
            "Reports",
        ],
    },
    {
        "title": "Work Completed So Far",
        "bullets": [
            "Project title finalized",
            "System requirements collected",
            "Functional requirements analyzed",
            "User roles identified",
            "System modules planned",
            "Bangladesh route coverage planned",
            "Bus company database structure designed",
            "Ticket booking workflow designed",
            "Fare calculation model defined",
            "Initial project documentation prepared",
        ],
    },
    {
        "title": "Future Work",
        "bullets": [
            "Database implementation",
            "UI/UX design development",
            "Authentication system implementation",
            "Company registration module",
            "Bus management module",
            "Route management module",
            "Ticket booking module",
            "Payment gateway integration",
            "Reporting dashboard",
            "Testing and debugging",
            "Deployment and evaluation",
        ],
    },
    {
        "title": "Expected Outcomes",
        "intro": "The project will provide:",
        "bullets": [
            "Centralized transportation management",
            "Improved passenger experience",
            "Efficient ticket booking",
            "Better fleet management",
            "Real-time monitoring",
            "Business analytics and reporting",
            "Scalable support for multiple bus operators across Bangladesh",
        ],
    },
    {
        "type": "closing",
        "title": "Conclusion",
        "body": (
            "The Smart Bus Management System aims to modernize the transportation sector of "
            "Bangladesh by providing a comprehensive digital platform for passengers, bus "
            "operators, and administrators. The system will improve operational efficiency, "
            "enhance user convenience, and support data-driven decision-making."
        ),
        "footer": "Thank You.",
    },
]


def set_run_font(run, size=18, bold=False, color=DARK):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = "Calibri"


def add_title_bar(slide, title_text):
    bar = slide.shapes.add_shape(1, Inches(0), Inches(0), Inches(10), Inches(1.05))
    bar.fill.solid()
    bar.fill.fore_color.rgb = PRIMARY
    bar.line.fill.background()

    accent = slide.shapes.add_shape(1, Inches(0), Inches(1.05), Inches(10), Inches(0.08))
    accent.fill.solid()
    accent.fill.fore_color.rgb = ACCENT
    accent.line.fill.background()

    box = slide.shapes.add_textbox(Inches(0.5), Inches(0.18), Inches(9), Inches(0.7))
    tf = box.text_frame
    tf.clear()
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.LEFT
    run = p.add_run()
    run.text = title_text
    set_run_font(run, size=30, bold=True, color=WHITE)


def add_bullets(text_frame, items, size=20, top_margin=0):
    text_frame.clear()
    text_frame.word_wrap = True
    text_frame.margin_left = Inches(0.15)
    text_frame.margin_top = Inches(top_margin)

    for i, item in enumerate(items):
        p = text_frame.paragraphs[0] if i == 0 else text_frame.add_paragraph()
        p.level = 0
        p.space_after = Pt(8)
        p.line_spacing = 1.15
        run = p.add_run()
        run.text = f"• {item}" if not item.startswith("•") else item
        set_run_font(run, size=size, color=DARK)


def build_pptx():
    prs = Presentation()
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(7.5)
    blank = prs.slide_layouts[6]

    for slide_data in SLIDES:
        slide = prs.slides.add_slide(blank)

        if slide_data.get("type") == "title":
            bg = slide.shapes.add_shape(1, Inches(0), Inches(0), Inches(10), Inches(7.5))
            bg.fill.solid()
            bg.fill.fore_color.rgb = PRIMARY
            bg.line.fill.background()

            accent = slide.shapes.add_shape(1, Inches(0), Inches(6.8), Inches(10), Inches(0.7))
            accent.fill.solid()
            accent.fill.fore_color.rgb = ACCENT
            accent.line.fill.background()

            title_box = slide.shapes.add_textbox(Inches(0.7), Inches(1.2), Inches(8.6), Inches(1.8))
            tf = title_box.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            run = p.add_run()
            run.text = slide_data["title"]
            set_run_font(run, size=36, bold=True, color=WHITE)

            sub = tf.add_paragraph()
            sub.alignment = PP_ALIGN.CENTER
            sub.space_before = Pt(12)
            run = sub.add_run()
            run.text = slide_data["subtitle"]
            set_run_font(run, size=22, color=WHITE)

            info = slide.shapes.add_textbox(Inches(1.2), Inches(3.3), Inches(7.6), Inches(3.2))
            itf = info.text_frame
            itf.word_wrap = True
            for i, line in enumerate(slide_data["lines"]):
                p = itf.paragraphs[0] if i == 0 else itf.add_paragraph()
                p.alignment = PP_ALIGN.CENTER
                p.space_after = Pt(4)
                run = p.add_run()
                run.text = line
                bold = line.endswith(":") and line != ""
                set_run_font(run, size=18, bold=bold, color=WHITE)
            continue

        if slide_data.get("type") == "closing":
            add_title_bar(slide, slide_data["title"])
            body = slide.shapes.add_textbox(Inches(0.7), Inches(1.5), Inches(8.6), Inches(3.5))
            btf = body.text_frame
            btf.word_wrap = True
            p = btf.paragraphs[0]
            run = p.add_run()
            run.text = slide_data["body"]
            set_run_font(run, size=22, color=DARK)

            thanks = slide.shapes.add_textbox(Inches(0.7), Inches(5.5), Inches(8.6), Inches(0.8))
            ttf = thanks.text_frame
            p = ttf.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            run = p.add_run()
            run.text = slide_data["footer"]
            set_run_font(run, size=28, bold=True, color=PRIMARY)
            continue

        add_title_bar(slide, slide_data["title"])
        content_top = 1.35

        if "sections" in slide_data:
            box = slide.shapes.add_textbox(Inches(0.55), Inches(content_top), Inches(8.9), Inches(5.8))
            tf = box.text_frame
            tf.clear()
            tf.word_wrap = True
            first = True
            for heading, items in slide_data["sections"]:
                p = tf.paragraphs[0] if first else tf.add_paragraph()
                first = False
                p.space_before = Pt(6)
                p.space_after = Pt(4)
                run = p.add_run()
                run.text = heading
                set_run_font(run, size=20, bold=True, color=PRIMARY)
                for item in items:
                    bp = tf.add_paragraph()
                    bp.level = 0
                    bp.space_after = Pt(3)
                    run = bp.add_run()
                    run.text = f"• {item}"
                    set_run_font(run, size=17, color=DARK)
        else:
            y = content_top
            if slide_data.get("intro"):
                intro = slide.shapes.add_textbox(Inches(0.7), Inches(y), Inches(8.6), Inches(0.5))
                ip = intro.text_frame.paragraphs[0]
                run = ip.add_run()
                run.text = slide_data["intro"]
                set_run_font(run, size=20, color=DARK)
                y += 0.45

            bullets_box = slide.shapes.add_textbox(Inches(0.7), Inches(y), Inches(8.6), Inches(5.2))
            add_bullets(bullets_box.text_frame, slide_data.get("bullets", []), size=19)

            if slide_data.get("footer"):
                foot = slide.shapes.add_textbox(Inches(0.7), Inches(6.5), Inches(8.6), Inches(0.6))
                fp = foot.text_frame.paragraphs[0]
                run = fp.add_run()
                run.text = slide_data["footer"]
                set_run_font(run, size=17, bold=True, color=PRIMARY)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    prs.save(PPTX_PATH)
    print(f"PPTX: {PPTX_PATH}")


class PresentationPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.show_header = True

    def header(self):
        if not self.show_header:
            return
        self.set_fill_color(15, 76, 129)
        self.rect(0, 0, 210, 18, "F")
        self.set_fill_color(0, 150, 199)
        self.rect(0, 18, 210, 2, "F")
        self.set_y(6)
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(255, 255, 255)
        if hasattr(self, "slide_title"):
            self.cell(0, 8, self.slide_title, align="C", new_x="LMARGIN", new_y="NEXT")
        self.ln(8)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(100, 116, 139)
        self.cell(0, 8, f"Smart Bus Management System - FYP Proposal  |  Page {self.page_no()}/15", align="C")


def pdf_add_bullets(pdf, items, size=11):
    pdf.set_font("Helvetica", size=size)
    pdf.set_text_color(30, 41, 59)
    for item in items:
        text = item.lstrip("• ").strip()
        pdf.multi_cell(0, 6, f"- {text}")
        pdf.ln(1)


def sanitize_pdf_text(text: str) -> str:
    return (
        text.replace("\u2014", "-")
        .replace("\u2013", "-")
        .replace("\u2022", "-")
        .replace("\u2019", "'")
    )


def build_pdf():
    pdf = PresentationPDF()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.set_margins(18, 28, 18)

    for slide_data in SLIDES:
        is_title = slide_data.get("type") == "title"
        pdf.show_header = not is_title
        pdf.add_page()

        if is_title:
            pdf.set_fill_color(15, 76, 129)
            pdf.rect(0, 0, 210, 297, "F")
            width = pdf.w - pdf.l_margin - pdf.r_margin
            pdf.set_y(45)
            pdf.set_x(pdf.l_margin)
            pdf.set_font("Helvetica", "B", 22)
            pdf.set_text_color(255, 255, 255)
            pdf.multi_cell(width, 10, sanitize_pdf_text(slide_data["title"]), align="C")
            pdf.ln(4)
            pdf.set_x(pdf.l_margin)
            pdf.set_font("Helvetica", "", 14)
            pdf.multi_cell(width, 8, sanitize_pdf_text(slide_data["subtitle"]), align="C")
            pdf.ln(8)
            pdf.set_font("Helvetica", "", 12)
            for line in slide_data["lines"]:
                if line == "":
                    pdf.ln(3)
                else:
                    pdf.set_x(pdf.l_margin)
                    pdf.multi_cell(width, 6, sanitize_pdf_text(line), align="C")
            continue

        pdf.slide_title = sanitize_pdf_text(slide_data.get("title", "Slide"))
        pdf.set_y(32)

        if slide_data.get("type") == "closing":
            pdf.set_font("Helvetica", "", 12)
            pdf.set_text_color(30, 41, 59)
            pdf.multi_cell(0, 7, sanitize_pdf_text(slide_data["body"]))
            pdf.ln(10)
            pdf.set_font("Helvetica", "B", 18)
            pdf.set_text_color(15, 76, 129)
            pdf.cell(0, 10, sanitize_pdf_text(slide_data["footer"]), align="C")
            continue

        if "sections" in slide_data:
            for heading, items in slide_data["sections"]:
                pdf.set_font("Helvetica", "B", 12)
                pdf.set_text_color(15, 76, 129)
                pdf.cell(0, 7, sanitize_pdf_text(heading), new_x="LMARGIN", new_y="NEXT")
                pdf_add_bullets(pdf, [sanitize_pdf_text(i) for i in items], size=11)
                pdf.ln(2)
        else:
            if slide_data.get("intro"):
                pdf.set_font("Helvetica", "", 11)
                pdf.set_text_color(30, 41, 59)
                pdf.multi_cell(0, 6, sanitize_pdf_text(slide_data["intro"]))
                pdf.ln(2)
            pdf_add_bullets(pdf, [sanitize_pdf_text(i) for i in slide_data.get("bullets", [])], size=11)
            if slide_data.get("footer"):
                pdf.ln(4)
                pdf.set_font("Helvetica", "B", 11)
                pdf.set_text_color(15, 76, 129)
                pdf.multi_cell(0, 6, sanitize_pdf_text(slide_data["footer"]))

    pdf.output(PDF_PATH)
    print(f"PDF:  {PDF_PATH}")


if __name__ == "__main__":
    build_pptx()
    build_pdf()
