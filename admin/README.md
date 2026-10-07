# 🎋 Nem Chả Mụ Ánh - Hướng Dẫn Bảng Điều Khiển Quản Trị (Admin Dashboard)

Hệ thống quản trị chuyên dụng được xây dựng trực tiếp trên máy chủ để điều chỉnh toàn bộ thông tin, bảng giá sản phẩm, chính sách sỉ và quản lý đơn hàng cho thương hiệu **Nem Chả Mụ Ánh**.

---

## 🌐 Thông Tin Truy Cập

- **Địa chỉ truy cập trực tiếp:** `http://203.24.92.98:8090/` (hoặc `http://localhost:8090/` qua VPN WireGuard)
- **Cổng dịch vụ (Port):** `8090` (Đã mở trên UFW Firewall)
- **Mã PIN đăng nhập mặc định:** `muanh2026`
- **Dịch vụ chạy ngầm (Systemd Service):** `nemcha-admin.service` (Tự động khởi động cùng hệ thống)

---

## 🛠️ Các Tính Năng Quản Trị Chính

### 1. 🏬 Điều Chỉnh Thông Tin Cơ Sở
- Tên thương hiệu, Tiêu đề phụ (Slogan).
- Địa chỉ lò sản xuất tại Huế (`25/135 Đặng Văn Ngữ, An Cựu, TP. Huế`).
- Hotline bán lẻ / tư vấn hiển thị và số điện thoại quay số.
- Đường dẫn Zalo tư vấn trực tiếp (`https://zalo.me/...`).
- Giờ phục vụ hàng ngày.
- Email nhận thông báo đơn hàng FormSubmit.

### 2. 🥩 Quản Lý Bảng Giá & Món Đặc Sản
- Danh mục món: Nem Chua Cố Đô, Chả Bò Đặc Biệt, Chả Lụa Quết Tay, Tré Cung Đình, Set Quà Biếu Tứ Quý, Chả Da Ớt Xiêm.
- Thao tác:
  - **Sửa giá bán (VNĐ):** Nhập giá mới, định dạng tiền tệ tự động.
  - **Đổi quy cách / đơn vị:** Cây 10 cái, Đòn 500g, Hộp quà...
  - **Thay đổi Badge nổi bật:** "Bán Chạy Nhất", "100% Thịt Bò Tươi", "Không Hàn The"...
  - **Thêm món mới:** Thêm bất kỳ món đặc sản nào vào menu.
  - **Xóa / Ẩn món ăn:** Tạm ngừng kinh doanh món theo mùa.

### 3. 📢 Biểu Ngữ Thông Báo & Chính Sách Sỉ
- Bật/Tắt thanh thông báo chạy đầu trang web.
- Thay đổi nội dung khuyến mãi, ưu đãi phí ship hỏa tốc toàn quốc.
- Điều chỉnh mức chiết khấu sỉ (10% - 25%), số lượng tối thiểu và phương thức đóng thùng xốp đá khô an toàn 48h.

### 4. 💳 Tài Khoản Ngân Hàng & VietQR
- Điều chỉnh thông tin chuyển khoản: Ngân hàng, Số tài khoản, Chủ tài khoản, Cú pháp chuyển khoản.
- Tự động sinh mã **VietQR** chuẩn NAPAS để khách quét mã thanh toán ngay trên ứng dụng ngân hàng.

### 5. 📋 Quản Lý Đơn Hàng & Khách Hàng (Mini-CRM)
- Tự động lưu trữ tất cả đơn hàng từ form đặt mua online trên website.
- Hỗ trợ nhập đơn hàng thủ công tại lò hoặc khách gọi hotline.
- Phân loại trạng thái: 🆕 Mới tiếp nhận ➔ 🚚 Đang giao hàng ➔ ✅ Đã hoàn tất ➔ ❌ Đã hủy.
- Nút bấm gọi điện thoại hoặc nhắn tin Zalo trực tiếp 1 chạm cho khách hàng.
- Xuất toàn bộ danh sách đơn hàng ra file Excel / CSV.

### 6. 🚀 Xuất Bản 1 Chạm Lên GitHub Pages (1-Click Publish)
- Nhấn nút **"Xuất Bản Lên Website Ngay Bây Giờ"** trong tab **Xuất Bản & Git**:
- Hệ thống tự động tạo Git commit và đẩy (Git Push) mã nguồn lên kho GitHub Pages `https://nemchahue.github.io/` bằng GitHub Token cấu hình sẵn trong `.env`.
- Có terminal log theo dõi tiến trình và tự động gửi thông báo xác nhận qua bot Telegram.

---

## ⚙️ Quản Trị Hệ Thống Qua Terminal (Dành Cho Kỹ Thuật Viên)

```bash
# Kiểm tra trạng thái dịch vụ admin
systemctl status nemcha-admin.service

# Khởi động lại dịch vụ admin
systemctl restart nemcha-admin.service

# Xem nhật ký hoạt động thời gian thực
journalctl -u nemcha-admin.service -f
```
