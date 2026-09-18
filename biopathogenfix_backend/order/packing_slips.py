"""On-demand packing slips, available only to fulfillment staff."""
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes

from country.models import Country
from .models import Order
from .permissions import IsOrderAdmin


def address_lines(order, kind='shipping'):
    def field(name):
        return str(getattr(order, f'{kind}_{name}', '') or '').strip()

    company = getattr(order.user, 'Company_name', '') or ''
    if not company and getattr(order.user, 'laboratory_id', None):
        company = order.user.laboratory.name
    country = field('country')
    if country.isdigit():
        country = Country.objects.filter(pk=int(country)).values_list('name', flat=True).first() or ''
    city = ', '.join(filter(None, [field('city'), field('state_code') or field('state')]))
    lines = [f"{field('first_name')} {field('last_name')}".strip(), company,
             field('address_line1'), field('address_line2'),
             f"{city} {field('postal_code')}".strip(), country]
    return [line for line in lines if line]


def packing_items(order):
    rows = []
    for item in order.items.prefetch_related('orderItems_variants__variant_option__variant').all():
        options = []
        for variant in item.orderItems_variants.all():
            name = variant.variant_option.variant.name
            options.append(f'{name}: {variant.variant_option_name}')
        rows.append(dict(name=item.product_name, sku=item.sku_code,
                         quantity=item.quantity, options=options))
    return rows


def render_packing_slip(order):
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image

    stream = BytesIO()
    doc = SimpleDocTemplate(stream, pagesize=A4, leftMargin=42, rightMargin=42,
                            topMargin=30, bottomMargin=38,
                            title=f'Packing Slip ORD-{order.id:06d}', author='BioPathogenix')
    normal = ParagraphStyle('body', fontName='Helvetica', fontSize=9, leading=13)
    small = ParagraphStyle('small', parent=normal, fontSize=8, leading=12)
    heading = ParagraphStyle('heading', fontName='Helvetica-Bold', fontSize=17, leading=22)
    white = ParagraphStyle('white', parent=normal, fontName='Helvetica-Bold', textColor=colors.white)

    def paragraph(text, style=normal):
        return Paragraph(escape(str(text)).replace('\n', '<br/>'), style)

    logo_file = Path(settings.BASE_DIR) / 'static/images/email-logo.png'
    if logo_file.exists():
        logo = Image(str(logo_file), width=175, height=40, kind='proportional', hAlign='LEFT')
    else:
        logo = paragraph('BioPathogenix', heading)
    company = paragraph('BioPathogenix\n' + settings.PACKING_SLIP_COMPANY_ADDRESS)
    header = Table([[logo, company]], colWidths=[307, 204])
    header.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'),
                               ('LEFTPADDING', (0, 0), (-1, -1), 0)]))
    shipping = address_lines(order)
    shipping.extend(filter(None, [order.shipping_email or order.user.email, order.shipping_phone]))
    created = timezone.localtime(order.created_at) if timezone.is_aware(order.created_at) else order.created_at
    details = paragraph(f'Order Number:  ORD-{order.id:06d}\n'
                        f'Order Date:  {created.strftime("%B %d, %Y")}\nShipping Method:  UPS')
    addresses = Table([[paragraph('\n'.join(shipping)), details]], colWidths=[307, 204])
    addresses.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'),
                                  ('LEFTPADDING', (0, 0), (-1, -1), 0)]))
    rows = [[paragraph('Product', white), paragraph('Quantity', white)]]
    for item in packing_items(order):
        description = [paragraph(item['name']), Spacer(1, 6), paragraph(f"SKU: {item['sku']}", small)]
        description.extend(paragraph(option, small) for option in item['options'])
        rows.append([description, paragraph(item['quantity'])])
    table = Table(rows, colWidths=[411, 100], repeatRows=1, hAlign='LEFT')
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LINEBELOW', (0, 1), (-1, -1), .5, colors.HexColor('#d1d5db')),
    ]))

    def footer(canvas, document):
        canvas.saveState()
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor('#6b7280'))
        canvas.drawString(42, 22, f'ORD-{order.id:06d} | Packing slip')
        canvas.drawRightString(A4[0] - 42, 22, f'Page {document.page}')
        canvas.restoreState()

    doc.build([header, Spacer(1, 26), paragraph('PACKING SLIP', heading), Spacer(1, 16),
               addresses, Spacer(1, 28), table], onFirstPage=footer, onLaterPages=footer)
    return stream.getvalue()


@api_view(['GET'])
@permission_classes([IsOrderAdmin])
def PackingSlipView(request, order_id):
    order = get_object_or_404(Order.objects.select_related('user__laboratory'), pk=order_id)
    response = HttpResponse(render_packing_slip(order), content_type='application/pdf')
    response['Content-Disposition'] = f'inline; filename="packing-slip-ORD-{order.id:06d}.pdf"'
    response['Cache-Control'] = 'private, no-store'
    response['X-Content-Type-Options'] = 'nosniff'
    return response
