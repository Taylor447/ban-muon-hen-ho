# Bạn Muốn Hẹn Hò Simulator 💖

> Web game mô phỏng gameshow mai mối kiểu truyền hình Việt Nam với 2 MC hư cấu: **Chú Tư Duyên** (hài hước) & **Chị Mai Hạnh** (dịu dàng).

## 🌟 Tính năng nổi bật
- **HTML5/CSS3/Vanilla JS thuần**: Không cần cài đặt framework nặng nề, tốc độ tải cực nhanh.
- **Web Audio API**: Tự động tổng hợp nhạc nền lãng mạn và hiệu ứng chuông đèn, tiếng vỗ tay, kèn chiến thắng (100% offline, không phụ thuộc file MP3 ngoài).
- **Hiệu ứng sân khấu**: Kéo rèm đỏ, đèn LED rực rỡ, pháo giấy chúc mừng (canvas confetti).
- **Chỉ số nhân vật & Nhiệt kế rung động**: Tính toán độ hảo cảm biến động theo từng câu trả lời.
- **4 Kết thúc khác nhau (Multiple Endings)**:
  1. *Ghép đôi hoàn hảo* (Cả hai cùng bật đèn)
  2. *Trật chìa phút chót* (Bạn bật, khách mời tắt)
  3. *Bỏ lỡ lương duyên* (Bạn tắt, khách mời bật)
  4. *Tình bạn trường tồn* (Cả hai cùng tắt đèn lịch sự)
- **Sổ tay Hẹn Hò**: Lưu trữ toàn bộ lịch sử các tập phát sóng vào `localStorage`.
- **Cài đặt âm thanh**: Tùy chỉnh bật/tắt nhạc nền, hiệu ứng và thanh trượt âm lượng.

## 🚀 Hướng dẫn triển khai (Deploy)

### Cách 1: Triển khai lên GitHub Pages (Miễn phí)
1. Tạo một repository mới trên [GitHub](https://github.com/) (ví dụ: `ban-muon-hen-ho`).
2. Mở terminal tại thư mục dự án và chạy các lệnh sau:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<tai-khoan-cua-ban>/ban-muon-hen-ho.git
   git push -u origin main
   ```
3. Trên GitHub, vào **Settings** > **Pages**.
4. Tại mục **Branch**, chọn `main` và thư mục `/ (root)`, sau đó nhấn **Save**.
5. Sau 1-2 phút, trang web của bạn sẽ hoạt động tại địa chỉ: `https://<tai-khoan-cua-ban>.github.io/ban-muon-hen-ho/`.

---

### Cách 2: Triển khai lên Vercel (Khuyên dùng)
1. Đăng ký/Đăng nhập tại [Vercel](https://vercel.com/).
2. Nhấn **Add New...** > **Project**.
3. Chọn repository GitHub vừa tạo ở trên (hoặc dùng Vercel CLI).
4. Giữ nguyên cấu hình mặc định (Framework Preset: Other) và nhấn **Deploy**.
5. Vercel sẽ tự động cấp một tên miền miễn phí cực nhanh dạng: `https://ban-muon-hen-ho.vercel.app`.
