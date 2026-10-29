# Ninja Rebirth VN — Hồi Sinh Nhẫn Giả

Game nhập vai nhẫn giả theo lượt, chạy hoàn toàn trên trình duyệt bằng **HTML / CSS / JavaScript thuần**.
Không cần cài đặt, không cần build, không phụ thuộc thư viện hay dịch vụ bên ngoài.

🎮 Chơi tại: **https://ninjarebirthvn.github.io/**

> Toàn bộ nhân vật, tên gọi, cốt truyện và hình ảnh trong game là **sáng tác gốc của dự án**.
> Hình ảnh nhân vật được vẽ trực tiếp bằng SVG trong `assets/js/art.js`, không sử dụng bất kỳ tài sản,
> hình ảnh hay tên nhân vật nào của game/ bộ truyện khác.

---

## Nội dung

Bạn là người sống sót cuối cùng của gia tộc **Hắc Vũ**, trở về sau ba năm ẩn náu để dựng lại gia tộc
và truy đuổi **Huyết Nguyệt Giáo**.

- **4 chương hồi – 20 nhiệm vụ** với thủ lĩnh riêng cho từng chương.
- **8 nhẫn giả** có thể chiêu mộ, mỗi người có 3 kỹ năng + 1 bí kỹ riêng.
- **7 hệ nguyên tố**: Hỏa, Phong, Lôi, Thủy, Thổ, Mộc, Ám (vòng khắc chế, đánh đúng hệ +25% sát thương).
- **Chiến đấu theo lượt** dựa trên thanh tốc độ, chakra, nộ và bí kỹ.
- **Trang bị** 3 ô (vũ khí / giáp / bí bảo), rơi từ nhiệm vụ hoặc mua ở chợ đêm.
- **Vật phẩm** dùng trong trận: hồi máu, hồi chakra, hồi sinh, tẩy hiệu ứng, tăng công.
- **Đấu trường** xếp hạng với 6 bậc từ Nhẫn Đồ đến Nhẫn Thánh.
- **Ngoại trang**: 6 trang phục, 5 mũ, 5 vũ khí tự thiết kế — mua bằng vàng hoặc nhận từ nhiệm vụ.
- **Sổ tay nhiệm vụ**: chuỗi 7 nhiệm vụ cốt truyện + 3 nhiệm vụ hằng ngày (làm mới sau nửa đêm).
- **Hiệu ứng**: hạt cháy/nổ trên canvas, vệt chém, chưởng lực, chớp bí kỹ, rung màn hình, chuyển cảnh mờ dần.
- **Lưu tiến trình tự động** trong `localStorage` của trình duyệt.

## Cách chơi nhanh

1. Chọn một nhẫn giả khai môn (Tuyết Vũ / Hỏa Kỳ / Thạch Kiên).
2. Vào **Nhiệm vụ**, đánh trận đầu tiên để nhận thêm đồng đội.
3. Đến lượt mình, chọn kỹ năng rồi chọn mục tiêu. Nộ đầy 100 sẽ mở **Bí Kỹ**.
4. Dùng vàng (linh thạch) để chiêu mộ nhẫn giả mới và mua trang bị.
5. Vào **Nhẫn giả** → chọn nhân vật → bấm vào ô trang bị để mặc đồ.
6. Mở **Sổ tay** để nhận thưởng nhiệm vụ; nhiệm vụ cốt truyện mở khoá ngoại trang độc quyền.

Mẹo: bật **Tự động** và **Tốc độ ×2** ở màn hình chiến đấu khi muốn cày tài nguyên.

## Cấu trúc dự án

```
index.html              # khung màn hình: tiêu đề, tạo nhân vật, làng, chiến đấu
assets/css/style.css    # toàn bộ giao diện, responsive cho điện thoại
assets/js/data.js       # dữ liệu: nguyên tố, nhẫn giả, kỹ năng, kẻ địch, chương hồi
assets/js/art.js        # vẽ chân dung nhân vật bằng SVG (100% sáng tác gốc) + trang phục/mũ/vũ khí
assets/js/fx.js         # hiệu ứng hạt trên canvas (đòn đánh, kỹ năng, bí kỹ, hồi máu)
assets/js/sfx.js        # hiệu ứng âm thanh tổng hợp bằng Web Audio
assets/js/battle.js     # hệ thống chiến đấu theo lượt + điều khiển trận đấu
assets/js/game.js       # trạng thái, lưu game, tiến trình, trang bị, cửa hàng, đấu trường
assets/img/             # logo và icon
```

Mọi đường dẫn đều là **tương đối**, nên có thể chạy trực tiếp từ thư mục gốc của repo trên GitHub Pages.

## Chạy thử ở máy

Không cần server đặc biệt, nhưng nên chạy qua HTTP để tránh giới hạn của `file://`:

```bash
python3 -m http.server 8080
# mở http://localhost:8080
```

## Ghi chú kỹ thuật

- Không dùng framework, không có bước build, không gọi API bên ngoài.
- Chân dung nhân vật là SVG sinh tại chỗ (hàm `Art.portrait`), nên dung lượng trang rất nhẹ.
- Dữ liệu lưu trong `localStorage` với khoá `ninjarebirth.vn.save.v1`.
- Đã kiểm tra trên Chromium (desktop 1280×900 và điện thoại 390×844): không lỗi console,
  không tràn ngang ở cả 6 tab, chiến đấu tự động giữ 60 khung hình/giây khi bật hiệu ứng hạt.
