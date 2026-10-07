#!/usr/bin/env python3
"""
Nem Chả Mụ Ánh - Dedicated Store Admin Server & Content Adjustment API
======================================================================
Provides an interactive high-aesthetic admin dashboard on port 8090 to:
  - Adjust brand, store details, hotline, Zalo, operating hours, dispatch email.
  - Manage product catalog, pricing, units, badges, descriptions, and availability.
  - Configure top announcement banner and wholesale pricing tiers.
  - Set up VietQR banking & payment instructions.
  - Manage orders and customer leads (Mini-CRM with status tracking & offline entry).
  - 1-Click Publish to GitHub Pages via Git commit & push with GITHUB_TOKEN.
  - Dispatch Telegram notifications for orders & status alerts.
"""

from __future__ import annotations

import argparse
import base64
from datetime import datetime, timezone
import http.cookies
import http.server
import json
import mimetypes
import os
from pathlib import Path
import re
import secrets
import socketserver
import subprocess
import sys
import threading
import time
import urllib.parse
import urllib.request
import urllib.error

# Root project paths
PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
CONFIG_FILE = DATA_DIR / "store_config.json"
ORDERS_FILE = DATA_DIR / "orders.json"
ENV_FILE = PROJECT_ROOT / ".env"
APP_JS_FILE = PROJECT_ROOT / "app.js"
INDEX_HTML_FILE = PROJECT_ROOT / "index.html"
ADMIN_DIR = PROJECT_ROOT / "admin"
UPLOADS_DIR = PROJECT_ROOT / "assets" / "images" / "uploads"

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Global Sessions
ACTIVE_SESSIONS: set[str] = set()
SERVER_START_TIME = time.time()

def load_env() -> dict[str, str]:
    env = {}
    if ENV_FILE.exists():
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip().strip("'\"")
    return env

ENV_VARS = load_env()
ADMIN_PIN = ENV_VARS.get("ADMIN_PIN", "muanh2026")
GITHUB_TOKEN = ENV_VARS.get("GITHUB_TOKEN", "")
TELEGRAM_BOT_TOKEN = ENV_VARS.get("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = ENV_VARS.get("TELEGRAM_CHAT_ID", "")
GIT_REMOTE_URL = f"https://x-access-token:{GITHUB_TOKEN}@github.com/nemchahue/nemchahue.github.io.git" if GITHUB_TOKEN else "origin"

# Fallback default configuration
DEFAULT_CONFIG = {
    "store": {
        "name": "Nem Chả Mụ Ánh",
        "tagline": "Đặc Sản Cố Đô Huế Gia Truyền - 100% Thịt Tươi Sạch",
        "address": "25/135 Đặng Văn Ngữ, Phường An Cựu, Thành phố Huế",
        "phone_display": "0912.515.329",
        "phone_raw": "0912515329",
        "zalo_url": "https://zalo.me/0912515329",
        "website_url": "https://nemchahue.github.io/",
        "hours": "06:00 - 21:30 hàng ngày (kể cả Lễ, Tết)",
        "dispatch_email": "shiroedwinda107@gmail.com",
        "map_link": "https://maps.google.com/?q=25/135+Dang+Van+Ngu+Hue"
    },
    "announcement": {
        "enabled": True,
        "badge": "🎋 ĐẶC SẢN CỐ ĐÔ",
        "text": "Nem Chả Mụ Ánh - 100% Thịt Tươi Sạch, Tuyệt Đối Không Hàn The",
        "subtext": "Giao Hỏa Tốc 24h Toàn Quốc • Ưu Đãi Phí Ship Cho Đơn Từ 300.000đ"
    },
    "wholesale_policy": {
        "discount_range": "10% - 25%",
        "min_order": "Từ 5kg hoặc 10 xâu",
        "shipping_method": "Đóng thùng xốp giữ nhiệt + đá khô an toàn 48h, giao hỏa tốc 24h đường bay hoặc xe mát chuyên dụng",
        "support_notes": "Chuyên cung cấp sỉ cho nhà hàng, quán bún bò Huế, tiệc cưới, đại lý và quà biếu doanh nghiệp toàn quốc."
    },
    "banking": {
        "enabled": False,
        "status": "unavailable",
        "notice": "Tạm thời chưa áp dụng chuyển khoản qua mã QR. Quý khách vui lòng thanh toán tiền mặt khi nhận hàng (COD) hoặc liên hệ trực tiếp Hotline/Zalo 0912.515.329.",
        "bank_name": "",
        "bank_code": "",
        "account_number": "",
        "account_holder": "",
        "transfer_syntax": ""
    },
    "products": [
        {
            "id": "nem-chua-mu-anh",
            "category": "nem",
            "categoryName": "Nem Chua Cố Đô",
            "name": "Nem Chua Mụ Ánh Truyền Thống",
            "price": 75000,
            "unit": "Xâu 10 cây (gói lá chuối)",
            "badge": "Bán Chạy Nhất",
            "image": "assets/images/nem-chua.jpg",
            "description": "Vị chua thanh tự nhiên, giòn sần sật từ bì và nạc heo tươi mới mổ. Kèm tép tỏi Lý Sơn và ớt xiêm xanh Cố Đô cay nồng.",
            "active": True
        },
        {
            "id": "cha-bo-mu-anh",
            "category": "cha",
            "categoryName": "Chả Đặc Sản",
            "name": "Chả Bò Mụ Ánh Cố Đô Đặc Biệt",
            "price": 180000,
            "unit": "Đòn 500g (Hút chân không)",
            "badge": "100% Thịt Bò Tươi",
            "image": "assets/images/cha-bo.jpg",
            "description": "Thịt bò đùi tươi nóng quết mịn, hòa quyện trọn vẹn vị thơm cay của tiêu sọ Phú Quốc. Đậm đà phong vị hoàng cung.",
            "active": True
        },
        {
            "id": "cha-lua-mu-anh",
            "category": "cha",
            "categoryName": "Chả Đặc Sản",
            "name": "Chả Lụa Heo Mụ Ánh Quết Tay",
            "price": 120000,
            "unit": "Đòn 500g",
            "badge": "Không Hàn The",
            "image": "assets/images/hero.jpg",
            "description": "Chả quết tay từ thịt nạc heo tươi dẻo, ướp nước mắm cốt nhĩ cá cơm thơm lừng. Giòn dai tự nhiên, ngọt vị thịt thật.",
            "active": True
        },
        {
            "id": "tre-hue-mu-anh",
            "category": "tre",
            "categoryName": "Tré Cố Đô",
            "name": "Tré Huế Mụ Ánh Cung Đình",
            "price": 95000,
            "unit": "Hộp 10 cây / Thấu 300g",
            "badge": "Món Nhắm Số 1",
            "image": "assets/images/tre-hue.jpg",
            "description": "Tai mũi heo giòn sần sật trộn thính gạo rang vàng rộm, củ riềng băm và tỏi ớt. Thơm nức mũi, nhắm cùng bia rượu tuyệt hảo.",
            "active": True
        },
        {
            "id": "combo-mu-anh",
            "category": "combo",
            "categoryName": "Hộp Quà Sang Trọng",
            "name": "Set Quà Biếu Tứ Quý Mụ Ánh",
            "price": 490000,
            "unit": "Hộp quà cao cấp 4 món",
            "badge": "Quà Tặng Thượng Hạng",
            "image": "assets/images/combo-qua-bieu.jpg",
            "description": "Hộp quà đỏ nhung son mạ vàng gồm: 10 Nem chua Huế + 1 Đòn Chả bò (500g) + 1 Đòn Chả lụa (500g) + 1 Hộp Tré Huế Mụ Ánh.",
            "active": True
        },
        {
            "id": "cha-da-mu-anh",
            "category": "cha",
            "categoryName": "Chả Đặc Sản",
            "name": "Chả Da Heo Ớt Xiêm Xanh",
            "price": 130000,
            "unit": "Đòn 500g",
            "badge": "Cay Thơm Độc Đáo",
            "image": "assets/images/cha-bo.jpg",
            "description": "Sự kết hợp độc đáo giữa da heo luộc giòn sần sật và ớt xiêm xanh nguyên trái. Vị cay thơm bùng nổ kích thích vị giác.",
            "active": True
        }
    ],
    "last_updated": datetime.now(timezone.utc).isoformat()
}

def get_config() -> dict:
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[Warn] Error loading config: {e}", file=sys.stderr)
    return DEFAULT_CONFIG.copy()

def save_config(config_data: dict) -> None:
    config_data["last_updated"] = datetime.now(timezone.utc).isoformat()
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config_data, f, ensure_ascii=False, indent=2)
    sync_to_app_files(config_data)

def get_orders() -> list[dict]:
    if ORDERS_FILE.exists():
        try:
            with open(ORDERS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[Warn] Error loading orders: {e}", file=sys.stderr)
    return []

def save_orders(orders_list: list[dict]) -> None:
    with open(ORDERS_FILE, "w", encoding="utf-8") as f:
        json.dump(orders_list, f, ensure_ascii=False, indent=2)

def sync_to_app_files(config_data: dict) -> None:
    """Keep app.js and index.html in sync with store_config for static site fallback."""
    try:
        # Sync PRODUCTS in app.js
        if APP_JS_FILE.exists() and "products" in config_data:
            with open(APP_JS_FILE, "r", encoding="utf-8") as f:
                content = f.read()

            active_prods = [p for p in config_data["products"] if p.get("active", True)]
            json_prods_str = json.dumps(active_prods, ensure_ascii=False, indent=2)
            
            # Pattern matching PRODUCTS = [...]
            pattern = re.compile(r'(const|let)\s+PRODUCTS\s*=\s*\[[\s\S]*?\];', re.MULTILINE)
            if pattern.search(content):
                replacement = f"let PRODUCTS = {json_prods_str};"
                new_content = pattern.sub(replacement, content, count=1)
                
                # Also ensure HOTLINE constant is synced
                if "store" in config_data and "phone_raw" in config_data["store"]:
                    raw_phone = config_data["store"]["phone_raw"].replace(".", "").replace(" ", "")
                    phone_pattern = re.compile(r"const\s+HOTLINE\s*=\s*['\"][0-9]+['\"];")
                    new_content = phone_pattern.sub(f"const HOTLINE = '{raw_phone}';", new_content)

                with open(APP_JS_FILE, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print("[Sync] Synced updated catalog and phone to app.js")
    except Exception as e:
        print(f"[Warn] sync_to_app_files app.js error: {e}", file=sys.stderr)

    try:
        # Sync hotline and address in index.html
        if INDEX_HTML_FILE.exists() and "store" in config_data:
            with open(INDEX_HTML_FILE, "r", encoding="utf-8") as f:
                html = f.read()

            store = config_data["store"]
            phone_disp = store.get("phone_display", "0912.515.329")
            phone_raw = store.get("phone_raw", "0912515329").replace(".", "").replace(" ", "")
            address = store.get("address", "25/135 Đặng Văn Ngữ, Phường An Cựu, TP. Huế")

            # Update tel links
            html = re.sub(r'href="tel:[0-9]+"', f'href="tel:{phone_raw}"', html)
            # Update zalo links
            html = re.sub(r'href="https://zalo\.me/[0-9]+"', f'href="https://zalo.me/{phone_raw}"', html)
            
            with open(INDEX_HTML_FILE, "w", encoding="utf-8") as f:
                f.write(html)
            print("[Sync] Synced contact info to index.html")
    except Exception as e:
        print(f"[Warn] sync_to_app_files index.html error: {e}", file=sys.stderr)

def send_telegram_alert(text: str) -> tuple[bool, str]:
    """Dispatch a markdown/html message to Telegram channel/owner."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return False, "Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong .env"
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "HTML"
    }
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("ok"):
                return True, "Gửi thông báo Telegram thành công!"
            return False, f"Telegram API lỗi: {data.get('description')}"
    except Exception as e:
        return False, f"Lỗi kết nối Telegram: {e}"

def execute_git_publish(commit_msg: str) -> dict:
    """Create commit and push changes to GitHub Pages repository."""
    if not commit_msg:
        commit_msg = f"Cập nhật nội dung & giá sản phẩm ({datetime.now().strftime('%d/%m/%Y %H:%M')})"

    try:
        # Check git status
        subprocess.run(["git", "config", "user.name", "Nem Chả Mụ Ánh Admin"], cwd=PROJECT_ROOT, check=True)
        subprocess.run(["git", "config", "user.email", "admin@nemchahue.github.io"], cwd=PROJECT_ROOT, check=True)
        
        # Add files
        subprocess.run(["git", "add", "data/", "app.js", "index.html", "admin/", "assets/"], cwd=PROJECT_ROOT, check=True)
        
        # Check if there are changes to commit
        status_proc = subprocess.run(["git", "status", "--porcelain"], cwd=PROJECT_ROOT, capture_output=True, text=True)
        has_changes = bool(status_proc.stdout.strip())

        if has_changes:
            commit_proc = subprocess.run(["git", "commit", "-m", commit_msg], cwd=PROJECT_ROOT, capture_output=True, text=True)
            commit_output = commit_proc.stdout + commit_proc.stderr
        else:
            commit_output = "Không có thay đổi mới cần commit. Tiến hành đồng bộ với kho từ xa..."

        # Push to remote
        remote_target = GIT_REMOTE_URL if GITHUB_TOKEN else "origin"
        push_proc = subprocess.run(["git", "push", remote_target, "main"], cwd=PROJECT_ROOT, capture_output=True, text=True, timeout=20)
        
        push_success = push_proc.returncode == 0
        push_output = push_proc.stdout + push_proc.stderr
        
        # Get latest commit sha
        sha_proc = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=PROJECT_ROOT, capture_output=True, text=True)
        commit_sha = sha_proc.stdout.strip()

        # Send Telegram notification of publish
        if push_success:
            tele_msg = (
                f"🚀 <b>Nem Chả Mụ Ánh - Đã Xuất Bản Website!</b>\n\n"
                f"• Bản cam kết: <code>{commit_sha}</code>\n"
                f"• Nội dung: <i>{commit_msg}</i>\n"
                f"• Thời gian: {datetime.now().strftime('%H:%M:%S %d/%m/%Y')}\n"
                f"• Xem trực tiếp: <a href='https://nemchahue.github.io/'>nemchahue.github.io</a>"
            )
            threading.Thread(target=send_telegram_alert, args=(tele_msg,), daemon=True).start()

        return {
            "success": push_success,
            "commit_sha": commit_sha,
            "commit_output": commit_output,
            "push_output": push_output,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


class AdminRequestHandler(http.server.BaseHTTPRequestHandler):
    server_version = "NemChaAdmin/2.0"

    def is_authenticated(self) -> bool:
        # Check Authorization header: Bearer <token>
        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
            if token in ACTIVE_SESSIONS:
                return True

        # Check Cookie: muanh_admin_session=<token>
        cookie_header = self.headers.get("Cookie", "")
        if cookie_header:
            cookie = http.cookies.SimpleCookie(cookie_header)
            if "muanh_admin_session" in cookie:
                token = cookie["muanh_admin_session"].value
                if token in ACTIVE_SESSIONS:
                    return True
        return False

    def send_json(self, data: dict | list, status_code: int = 200, cookie_token: str | None = None) -> None:
        raw = json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        if cookie_token:
            self.send_header("Set-Cookie", f"muanh_admin_session={cookie_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000")
        self.end_headers()
        self.wfile.write(raw)

    def send_error_json(self, message: str, status_code: int = 400) -> None:
        self.send_json({"error": message, "status": "error"}, status_code=status_code)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.end_headers()

    def do_HEAD(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Static assets and site preview
        if path == "/" or path == "/admin" or path == "/admin/":
            self.serve_admin_ui()
            return
        elif path.startswith("/static/"):
            self.serve_static_file(ADMIN_DIR / path.replace("/static/", "static/"))
            return
        elif path.startswith("/assets/"):
            self.serve_static_file(PROJECT_ROOT / path.lstrip("/"))
            return
        elif path == "/preview" or path.startswith("/preview/"):
            # Serve live site locally for real-time preview
            rel = path.replace("/preview", "").lstrip("/") or "index.html"
            self.serve_static_file(PROJECT_ROOT / rel)
            return

        # Public Store Config endpoint (used by both client app and admin)
        if path == "/api/config" or path == "/data/store_config.json":
            self.send_json(get_config())
            return

        # System health & status
        if path == "/api/status":
            uptime = int(time.time() - SERVER_START_TIME)
            sha_proc = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=PROJECT_ROOT, capture_output=True, text=True)
            self.send_json({
                "status": "online",
                "brand": "Nem Chả Mụ Ánh",
                "uptime_seconds": uptime,
                "git_commit": sha_proc.stdout.strip() or "unknown",
                "authenticated": self.is_authenticated(),
                "time": datetime.now(timezone.utc).isoformat()
            })
            return

        # Authenticated API endpoints
        if not self.is_authenticated():
            self.send_error_json("Yêu cầu đăng nhập quản trị viên (Chưa xác thực)", status_code=401)
            return

        if path == "/api/orders":
            orders = get_orders()
            # Summary stats
            total_rev = sum(o.get("total_price", 0) for o in orders if o.get("status") != "cancelled")
            new_cnt = sum(1 for o in orders if o.get("status") == "new")
            shipping_cnt = sum(1 for o in orders if o.get("status") == "shipping")
            completed_cnt = sum(1 for o in orders if o.get("status") == "completed")

            self.send_json({
                "orders": orders,
                "stats": {
                    "total_orders": len(orders),
                    "total_revenue": total_rev,
                    "new_orders": new_cnt,
                    "shipping_orders": shipping_cnt,
                    "completed_orders": completed_cnt
                }
            })
            return

        self.send_error_json(f"Không tìm thấy đường dẫn: {path}", status_code=404)

    def do_POST(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Read JSON body
        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b"{}"
        try:
            body = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception:
            body = {}

        # Public endpoints
        if path == "/api/login":
            pin = body.get("pin") or body.get("password") or ""
            if pin == ADMIN_PIN:
                token = secrets.token_hex(24)
                ACTIVE_SESSIONS.add(token)
                self.send_json({
                    "success": True,
                    "message": "Đăng nhập thành công!",
                    "token": token
                }, cookie_token=token)
            else:
                self.send_error_json("Mã PIN hoặc mật khẩu không chính xác!", status_code=401)
            return

        elif path == "/api/logout":
            auth_header = self.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ", 1)[1].strip()
                ACTIVE_SESSIONS.discard(token)
            self.send_json({"success": True, "message": "Đã đăng xuất"})
            return

        # New order submission from website or external webhook
        if path == "/api/orders/submit" or path == "/api/orders":
            new_order = {
                "id": f"ord-{datetime.now().strftime('%Y%m%d%H%M%S')}-{secrets.token_hex(2)}",
                "customer_name": body.get("customer_name") or body.get("name") or "Khách hàng",
                "customer_phone": body.get("customer_phone") or body.get("phone") or "",
                "customer_address": body.get("customer_address") or body.get("address") or "",
                "main_product": body.get("main_product") or "Đơn đặt trực tuyến",
                "quantity": int(body.get("quantity") or 1),
                "cart_items": body.get("cart_items") or "",
                "notes": body.get("notes") or "",
                "total_price": int(body.get("total_price") or 0),
                "status": "new",
                "source": body.get("source") or ("Admin" if self.is_authenticated() else "Website"),
                "created_at": datetime.now().isoformat()
            }
            orders = get_orders()
            orders.insert(0, new_order)
            save_orders(orders)

            # Auto notify Telegram
            tele_msg = (
                f"🔔 <b>CÓ ĐƠN HÀNG MỚI!</b> (Nem Chả Mụ Ánh)\n\n"
                f"👤 <b>Khách:</b> {new_order['customer_name']}\n"
                f"📞 <b>SĐT:</b> <code>{new_order['customer_phone']}</code>\n"
                f"📍 <b>Địa chỉ:</b> {new_order['customer_address']}\n"
                f"🥩 <b>Món chính:</b> {new_order['main_product']} (SL: {new_order['quantity']})\n"
                f"🛒 <b>Giỏ hàng:</b> {new_order['cart_items'] or 'Không có'}\n"
                f"💰 <b>Tổng tiền ước tính:</b> {new_order['total_price']:,} đ\n"
                f"📝 <b>Ghi chú:</b> {new_order['notes'] or 'Không có'}\n"
                f"🕒 <b>Lúc:</b> {datetime.now().strftime('%H:%M %d/%m/%Y')}"
            )
            threading.Thread(target=send_telegram_alert, args=(tele_msg,), daemon=True).start()

            self.send_json({"success": True, "order": new_order, "message": "Tiếp nhận đơn hàng thành công!"})
            return

        # Authenticated actions
        if not self.is_authenticated():
            self.send_error_json("Yêu cầu quyền quản trị viên!", status_code=401)
            return

        if path == "/api/config":
            # Save whole configuration
            if not isinstance(body, dict):
                self.send_error_json("Dữ liệu cấu hình không hợp lệ", status_code=400)
                return
            save_config(body)
            self.send_json({
                "success": True,
                "message": "Đã lưu thông tin cơ sở và bảng giá thành công!",
                "config": body
            })
            return

        elif path == "/api/upload" or path == "/api/upload-image":
            raw_data = body.get("image_data") or body.get("data") or ""
            filename = body.get("filename") or "dish_image.jpg"
            if not raw_data:
                self.send_error_json("Thiếu dữ liệu hình ảnh (image_data)", status_code=400)
                return

            # Clean base64 header (e.g. data:image/jpeg;base64,...)
            if "," in raw_data and "base64" in raw_data:
                raw_data = raw_data.split(",", 1)[1]

            try:
                img_bytes = base64.b64decode(raw_data)
            except Exception as e:
                self.send_error_json(f"Dữ liệu base64 không hợp lệ: {e}", status_code=400)
                return

            if len(img_bytes) > 25 * 1024 * 1024:
                self.send_error_json("Kích thước ảnh vượt quá giới hạn 25MB", status_code=400)
                return

            # Sanitize filename
            clean_name = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", Path(filename).name)
            ext = Path(clean_name).suffix.lower()
            if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
                ext = ".jpg"
            stem = Path(clean_name).stem[:30] or "dish"
            safe_filename = f"{stem}_{int(time.time())}_{secrets.token_hex(3)}{ext}"

            UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
            target_path = UPLOADS_DIR / safe_filename
            try:
                target_path.write_bytes(img_bytes)
            except Exception as e:
                self.send_error_json(f"Không thể lưu file trên máy chủ: {e}", status_code=500)
                return

            rel_url = f"assets/images/uploads/{safe_filename}"
            print(f"[Upload] Saved new cropped image to {target_path} ({len(img_bytes)} bytes)")
            self.send_json({
                "success": True,
                "url": rel_url,
                "filename": safe_filename,
                "size_bytes": len(img_bytes),
                "message": "Tải lên và lưu ảnh đã cắt thành công!"
            })
            return

        elif path == "/api/publish":
            msg = body.get("message", "").strip()
            res = execute_git_publish(msg)
            self.send_json(res)
            return

        elif path == "/api/test-telegram":
            ok, msg = send_telegram_alert(
                f"✅ <b>Thử nghiệm kết nối Telegram thành công!</b>\n"
                f"Hệ thống quản trị Nem Chả Mụ Ánh đã kết nối thông suốt với bot.\n"
                f"Thời gian: {datetime.now().strftime('%H:%M:%S %d/%m/%Y')}"
            )
            self.send_json({"success": ok, "message": msg})
            return

        self.send_error_json("Endpoint không tồn tại", status_code=404)

    def do_PUT(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if not self.is_authenticated():
            self.send_error_json("Yêu cầu quyền quản trị viên!", status_code=401)
            return

        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b"{}"
        try:
            body = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception:
            body = {}

        # Update order status / notes: /api/orders/<id>
        if path.startswith("/api/orders/"):
            order_id = path.replace("/api/orders/", "").strip()
            orders = get_orders()
            found = False
            for ord in orders:
                if ord.get("id") == order_id:
                    if "status" in body:
                        ord["status"] = body["status"]
                    if "notes" in body:
                        ord["notes"] = body["notes"]
                    if "total_price" in body:
                        ord["total_price"] = int(body["total_price"])
                    ord["updated_at"] = datetime.now().isoformat()
                    found = True
                    break

            if found:
                save_orders(orders)
                self.send_json({"success": True, "message": f"Đã cập nhật đơn hàng #{order_id}"})
            else:
                self.send_error_json(f"Không tìm thấy đơn hàng #{order_id}", status_code=404)
            return

        self.send_error_json("Endpoint không tồn tại", status_code=404)

    def do_DELETE(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if not self.is_authenticated():
            self.send_error_json("Yêu cầu quyền quản trị viên!", status_code=401)
            return

        if path.startswith("/api/orders/"):
            order_id = path.replace("/api/orders/", "").strip()
            orders = get_orders()
            initial_len = len(orders)
            orders = [o for o in orders if o.get("id") != order_id]
            if len(orders) < initial_len:
                save_orders(orders)
                self.send_json({"success": True, "message": f"Đã xóa đơn hàng #{order_id}"})
            else:
                self.send_error_json(f"Không tìm thấy đơn hàng #{order_id}", status_code=404)
            return

        self.send_error_json("Endpoint không tồn tại", status_code=404)

    def serve_admin_ui(self) -> None:
        index_file = ADMIN_DIR / "index.html"
        if not index_file.exists():
            self.send_error_json("Giao diện quản trị chưa được biên dịch", status_code=500)
            return
        with open(index_file, "rb") as f:
            content = f.read()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def serve_static_file(self, file_path: Path) -> None:
        if not file_path.exists() or not file_path.is_file():
            self.send_error_json(f"File không tồn tại: {file_path.name}", status_code=404)
            return

        mime_type, _ = mimetypes.guess_type(str(file_path))
        if not mime_type:
            mime_type = "application/octet-stream"

        with open(file_path, "rb") as f:
            data = f.read()

        self.send_response(200)
        self.send_header("Content-Type", mime_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format: str, *args) -> None:
        # Concise server request logs
        sys.stdout.write(f"[{datetime.now().strftime('%H:%M:%S')}] {args[0]} {args[1]} -> {args[2]}\n")
        sys.stdout.flush()


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def run_server(port: int = 8090) -> None:
    server_address = ("0.0.0.0", port)
    httpd = ThreadedHTTPServer(server_address, AdminRequestHandler)
    print(f"============================================================")
    print(f"🎋 Nem Chả Mụ Ánh - Máy Chủ Quản Trị Hệ Thống")
    print(f"• Địa chỉ lắng nghe: http://0.0.0.0:{port}")
    print(f"• Thư mục dự án:    {PROJECT_ROOT}")
    print(f"• Mã PIN quản trị:  {ADMIN_PIN}")
    print(f"• Kho GitHub:       https://github.com/nemchahue/nemchahue.github.io.git")
    print(f"============================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Admin] Máy chủ đang dừng...")
        httpd.server_close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Nem Chả Mụ Ánh Admin Server")
    parser.add_argument("--port", type=int, default=8090, help="Port to run admin server on (default: 8090)")
    args = parser.parse_args()
    run_server(args.port)
