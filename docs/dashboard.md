# Dashboard ThingSpeak

Dashboard chia 3 lớp: **xem nhanh giá trị hiện tại** (widget) → **diễn biến theo thời gian** (field chart) →
**phân tích** (MATLAB Visualization).

## 1. Widget xem nhanh
Channel → **Private View → Add Widgets**.

| Widget | Dữ liệu | Cấu hình |
|---|---|---|
| Gauge | Field 1 – Nhiệt độ | Min 0, Max 50, Units `°C`; dải 0–18 xanh dương, 18–30 xanh lá, 30–50 đỏ; Update 20 s |
| Gauge | Field 2 – Độ ẩm | Min 0, Max 100, Units `%`; dải 0–40 vàng, 40–70 xanh lá, 70–100 xanh dương |
| Numeric Display | Field 3 – Ánh sáng | Decimal Places 0 |
| Lamp Indicator | Field 3 – Tối / sáng | Condition `less than` ngưỡng tối (vd. 1000), màu vàng → đèn sáng khi trời tối |

## 2. Field chart (bút chì ✏️ trên từng chart)
| Chart | Type | Tùy chọn | Lý do |
|---|---|---|---|
| Nhiệt độ | `spline` | Average 10 phút, Days 1 | Nhiệt độ đổi chậm; trung bình bỏ nhiễu 0.1 °C |
| Độ ẩm | `spline` | Average 10 phút, Days 1 | Như trên |
| Ánh sáng | `column` hoặc `step` | Average 15 phút, Days 1 | Thấy rõ khối ngày / đêm |

Thêm một bản sao chart nhiệt độ với **Days 7** để xem xu hướng tuần (**Add Visualizations → Field 1 Chart**).

> Nhãn trục chart ánh sáng nên là **"Độ sáng (0–4095)"** — giá trị gửi lên là ADC thô, không phải %.

## 3. MATLAB Visualization
Tạo: **Apps → MATLAB Visualizations → New → Custom (no starter code) → Create** → dán code từ
`thingspeak/matlab/` → **Save and Run** → mục **Display Settings** tích **Private View** (và **Public View** nếu cần).

Mỗi file cần sửa `READ_API_KEY` (Channel → tab **API Keys → Read API Keys**). Code không hiện trên trang công khai,
chỉ hiện hình.

| File | Biểu đồ | Ý nghĩa |
|---|---|---|
| `01_nhiet_do_do_am_hai_truc.m` | Nhiệt độ + độ ẩm, 2 trục, 24 h | Quan hệ ngược chiều nóng ↔ khô |
| `02_nhiet_do_min_tb_max_theo_gio.m` | Min / trung bình / max mỗi giờ, 24 h | Biên độ dao động trong ngày |
| `03_histogram_nhiet_do.m` | Histogram nhiệt độ 7 ngày | Mức nhiệt hay gặp nhất |
| `04_tuong_quan_nhiet_do_do_am.m` | Scatter + hệ số `r`, 3 ngày | Mức độ tương quan |
| `05_nhiet_do_cam_nhan.m` | Nhiệt độ thật vs cảm nhận (Heat Index), 24 h | Mức nóng người cảm thấy (có ý nghĩa khi > 27 °C) |

## 4. Bố cục gợi ý
```
[Gauge Nhiệt độ] [Gauge Độ ẩm] [Số Ánh sáng] [Đèn Tối/Sáng]
[01 Nhiệt độ + Độ ẩm 2 trục]        [05 Nhiệt độ cảm nhận]
[Field 1 spline] [Field 2 spline] [Field 3 column]
[02 Min/TB/Max theo giờ] [03 Histogram 7 ngày] [04 Tương quan]
```

## 5. Public View
- Ô **Public View** ở MATLAB Visualization bị mờ khi Channel đang Private → Channel → tab **Sharing** →
  **Share channel view with everyone** → tải lại trang visualization → tích Public View → Save.
- Public View là trang riêng: widget / field chart ở Private View **không tự sang**, phải thêm lại ở tab Public View.
- Chỉ muốn nhóm / giảng viên xem: dùng **Share channel view only with the following users** (cần tài khoản
  MathWorks), giữ Channel Private.
