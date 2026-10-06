#!/usr/bin/env python3
"""
Nem Chả Mụ Ánh - Weekly Business Metrics & Telegram Dispatcher
Calculates weekly e-commerce performance, product mix, channel attribution,
and dispatches an executive digest to Telegram.
"""

import os
import sys
import json
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timedelta
import csv
import io
import re

PRICE_CATALOG = {
    'nem chua': 75000,
    'chả bò': 180000,
    'cha bo': 180000,
    'chả lụa': 120000,
    'cha lua': 120000,
    'tré huế': 95000,
    'tre hue': 95000,
    'combo': 490000,
    'set quà': 490000,
    'quà biếu': 490000,
    'chả da': 130000,
    'cha da': 130000
}

def estimate_item_price(prod_name):
    lower = (prod_name or '').lower()
    for k, v in PRICE_CATALOG.items():
        if k in lower:
            return v
    return 100000

def format_vnd(amount):
    return f"{amount:,.0f}".replace(',', '.') + " đ"

def fetch_sheet_orders(csv_url):
    """Fetch order records from Google Sheets CSV export."""
    if not csv_url:
        return []
    try:
        req = urllib.request.Request(csv_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(content))
            return list(reader)
    except Exception as e:
        print(f"Notice: Could not fetch Sheet CSV: {e}", file=sys.stderr)
        return []

def calculate_metrics(rows):
    """Calculate core business KPIs from order records."""
    total_orders = len(rows)
    total_gmv = 0
    wholesale_count = 0
    product_breakdown = {
        'Nem Chua Mụ Ánh': 0,
        'Chả Bò Cố Đô': 0,
        'Chả Lụa Quết Tay': 0,
        'Tré Huế Cung Đình': 0,
        'Set Quà Biếu Tứ Quý': 0
    }
    channels = {}
    browsers = {}

    for row in rows:
        prod = row.get('Món Đặt') or row.get('Món chọn chính') or ''
        qty_str = row.get('Số Lượng') or row.get('Số lượng') or '1'
        try:
            qty = int(re.sub(r'[^\d]', '', str(qty_str))) if re.sub(r'[^\d]', '', str(qty_str)) else 1
        except Exception:
            qty = 1

        is_ws = 'sỉ' in prod.lower() or 'đại lý' in prod.lower() or 'si' in prod.lower()
        if is_ws:
            wholesale_count += 1
            total_gmv += 1500000
        else:
            total_gmv += estimate_item_price(prod) * qty

        # Product Mix
        if 'nem' in prod.lower():
            product_breakdown['Nem Chua Mụ Ánh'] += qty
        elif 'bò' in prod.lower() or 'bo' in prod.lower():
            product_breakdown['Chả Bò Cố Đô'] += qty
        elif 'lụa' in prod.lower() or 'lua' in prod.lower():
            product_breakdown['Chả Lụa Quết Tay'] += qty
        elif 'tré' in prod.lower() or 'tre' in prod.lower():
            product_breakdown['Tré Huế Cung Đình'] += qty
        elif 'combo' in prod.lower() or 'quà' in prod.lower():
            product_breakdown['Set Quà Biếu Tứ Quý'] += qty

        # Channel
        src = row.get('Nguồn / UTM') or row.get('Nguồn tiếp thị & Kênh đến') or 'Trực tiếp'
        src_tag = 'Facebook' if 'facebook' in src.lower() else (
            'Zalo' if 'zalo' in src.lower() else (
                'Google' if 'google' in src.lower() else 'Trực tiếp / Khác'
            )
        )
        channels[src_tag] = channels.get(src_tag, 0) + 1

        # App/Browser
        app = row.get('Ứng Dụng') or row.get('Ứng dụng & Trình duyệt') or 'Web'
        app_tag = 'Zalo In-App' if 'zalo' in app.lower() else (
            'Facebook Mobile' if 'facebook' in app.lower() or 'fb' in app.lower() else 'Trình duyệt Web'
        )
        browsers[app_tag] = browsers.get(app_tag, 0) + 1

    aov = int(total_gmv / total_orders) if total_orders > 0 else 0

    return {
        'total_orders': total_orders,
        'total_gmv': total_gmv,
        'aov': aov,
        'wholesale_count': wholesale_count,
        'product_breakdown': product_breakdown,
        'channels': channels,
        'browsers': browsers
    }

def build_report_message(metrics, date_str=None):
    now = datetime.now()
    if not date_str:
        start_date = (now - timedelta(days=7)).strftime('%d/%m')
        date_str = f"{start_date} – {now.strftime('%d/%m/%Y')}"

    orders = metrics['total_orders']
    gmv = metrics['total_gmv']
    aov = metrics['aov']
    ws = metrics['wholesale_count']
    prods = metrics['product_breakdown']
    channels = metrics['channels']

    lines = [
        "🎋 *BÁO CÁO KINH DOANH TUẦN - NEM CHẢ MỤ ÁNH* 🎋",
        f"⏱ *Kỳ báo cáo:* {date_str}",
        "📍 *Cơ sở:* 25/135 Đặng Văn Ngữ, An Cựu, TP. Huế\n",
        "📊 *1. HIỆU SUẤT BÁN HÀNG & DOANH THU*",
        f"• *Tổng đơn hàng đã chốt:* `{orders} đơn`",
        f"• *Doanh thu ước tính (GMV):* `{format_vnd(gmv)}`",
        f"• *Giá trị đơn trung bình (AOV):* `{format_vnd(aov)}`",
        f"• *Đăng ký sỉ & đại lý mới:* `{ws} đối tác`\n",
        "🥩 *2. PHÂN BỔ MÓN ĐẶC SẢN TIÊU THỤ*",
        f"• 🥇 Nem Chua Huế: `{prods.get('Nem Chua Mụ Ánh', 0)} xâu`",
        f"• 🥈 Chả Bò Tiêu Sọ: `{prods.get('Chả Bò Cố Đô', 0)} đòn`",
        f"• 🥉 Tré Huế Cung Đình: `{prods.get('Tré Huế Cung Đình', 0)} hộp`",
        f"• ⭐ Chả Lụa Quết Tay: `{prods.get('Chả Lụa Quết Tay', 0)} đòn`",
        f"• 🎁 Set Quà Biếu Tứ Quý: `{prods.get('Set Quà Biếu Tứ Quý', 0)} hộp`\n",
        "🌐 *3. KÊNH TIẾP THỊ & CHUYỂN ĐỔI*"
    ]

    if channels:
        for ch, count in channels.items():
            lines.append(f"• *{ch}:* `{count} đơn`")
    else:
        lines.append("• _(Kênh ghi nhận: Trực tiếp & Giới thiệu)_")

    lines.extend([
        "\n💡 *4. KHUYẾN NGHỊ VẬN HÀNH TUẦN MỚI*",
        "1. Theo dõi các khách mua sỉ để chăm sóc gửi mẫu thử và chính sách đại lý.",
        "2. Đăng bài Zalo/Facebook vào Thứ Năm - Thứ Bảy để đón đầu đơn tiệc cuối tuần.",
        "3. Đóng thùng xốp kèm đá khô chuẩn 2 lớp cho khách gửi đi Hà Nội, TP.HCM và mang lên máy bay.",
        "\n_Hệ thống báo cáo tự động của Nem Chả Mụ Ánh._"
    ])

    return "\n".join(lines)

def send_telegram(bot_token, chat_id, message_text):
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        'chat_id': chat_id,
        'text': message_text,
        'parse_mode': 'Markdown',
        'disable_web_page_preview': True
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data.get('ok'):
                print("✓ Successfully sent report to Telegram!")
                return True
            else:
                print(f"Telegram error: {data}", file=sys.stderr)
                return False
    except Exception as e:
        print(f"Error dispatching to Telegram: {e}", file=sys.stderr)
        return False

def main():
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID')
    csv_url = os.environ.get('SHEETS_CSV_URL')

    # Example sample data if running for demo
    if not csv_url:
        print("Note: SHEETS_CSV_URL not set. Running with demonstration data.")
        sample_rows = [
            {'Món Đặt': 'Nem Chua Mụ Ánh Truyền Thống', 'Số Lượng': '2', 'Nguồn / UTM': 'Facebook Ads'},
            {'Món Đặt': 'Chả Bò Mụ Ánh Cố Đô Đặc Biệt', 'Số Lượng': '1', 'Nguồn / UTM': 'Zalo'},
            {'Món Đặt': 'Set Quà Biếu Tứ Quý Mụ Ánh', 'Số Lượng': '1', 'Nguồn / UTM': 'Google'},
            {'Món Đặt': '📦 Đặt Mua Sỉ / Đại Lý', 'Số Lượng': '1', 'Nguồn / UTM': 'Facebook'},
            {'Món Đặt': 'Tré Huế Mụ Ánh Cung Đình', 'Số Lượng': '3', 'Nguồn / UTM': 'Zalo'},
        ]
        metrics = calculate_metrics(sample_rows)
    else:
        rows = fetch_sheet_orders(csv_url)
        metrics = calculate_metrics(rows)

    report = build_report_message(metrics)
    print("\n--- WEEKLY METRICS REPORT ---")
    print(report)
    print("-----------------------------\n")

    if bot_token and chat_id:
        send_telegram(bot_token, chat_id, report)
    else:
        print("Info: To send to Telegram, provide TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.")

if __name__ == '__main__':
    main()
