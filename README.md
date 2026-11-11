# ESP32 → ThingSpeak (IoT Nhóm 17 - PTIT)

ESP32-DevKitC V4 đọc nhiệt độ, độ ẩm (**AHT20**) và ánh sáng (**LM393**), gửi lên ThingSpeak mỗi 20 giây.

**Trang theo dõi (public):** https://baitapiot17ptit.github.io/baitapiot17ptit/ — số liệu hiện tại, thống kê 24 giờ, biểu đồ, bảng dữ liệu  
**ThingSpeak:** https://thingspeak.mathworks.com/channels/3575274

```
AHT20 SDA21/SCL22   ─┐
                     ├─► ESP32-DevKitC ──WiFi 2.4 GHz──► ThingSpeak Channel 3575274
LM393 AO (GPIO 32) ──┘                                    Field 1 Nhiệt độ (°C)
                                                          Field 2 Độ ẩm (%)
                                                          Field 3 Ánh sáng (ADC 0–4095)
```

## Nạp code nhanh
1. Bấm đúp **`tools/change-wifi.bat`** → nhập tên + mật khẩu WiFi **2.4 GHz** → **Lưu** (tạo `secrets.h`).
   Channel ID và Write API Key đã điền sẵn trong `thingspeak_config.h`.
2. Mở `firmware/esp32_thingspeak_n17/esp32_thingspeak_n17.ino` bằng Arduino IDE 2.x.
3. **Tools → Board: ESP32 Dev Module**, **Tools → Port: COMx** → **Upload**.
4. **Serial Monitor 115200 baud** → nhấn **EN**, thấy `-> Gửi thành công (200)` là chạy.

> **Mang bo đi nơi khác / đổi WiFi:** xem [`docs/change-wifi.md`](docs/change-wifi.md).

Lần đầu trên máy mới: Boards Manager cài **esp32 by Espressif Systems**; Library Manager cài **ThingSpeak**
(MathWorks) và **Adafruit AHTX0** (đồng ý cài kèm dependency).

## Phần cứng
| Linh kiện | Chân ESP32 | Ghi chú |
|---|---|---|
| AHT20 | SDA → GPIO 21, SCL → GPIO 22, VCC → 3.3 V, GND | Nhiệt độ + độ ẩm (I2C, địa chỉ 0x38) |
| LM393 (module quang trở) | AO → GPIO 32, VCC → 3.3 V, GND | Giá trị thấp khi sáng; sketch đảo lại để số lớn = sáng hơn |

## Cấu trúc thư mục
| Đường dẫn | Nội dung |
|---|---|
| `firmware/esp32_thingspeak_n17/` | Sketch Arduino + `thingspeak_config.h` (Channel ID, API Key) + `secrets.h` (WiFi, không commit) + `secrets.example.h` (mẫu) |
| `dashboard/` | Trang theo dõi public (GitHub Pages), chỉ hiển thị, không điều khiển |
| `tools/change-wifi.bat` | Cửa sổ nhập WiFi → tự tạo `secrets.h` |
| `docs/change-wifi.md` | Đổi WiFi khi mang bo đi nơi khác |
| `thingspeak/matlab/` | 5 MATLAB Visualization (đã điền sẵn kênh 3575274 + Read Key; đang chạy trên ThingSpeak) |
| `docs/dashboard.md` | Dựng dashboard: widget, field chart, MATLAB, Public View |
| `docs/troubleshooting.md` | Lỗi thường gặp và cách xử lý |
| `BaoCao.md` | Báo cáo theo phương pháp thiết kế IoT 10 bước (Chương 3) |

## Hành vi của sketch
- Khởi động: quét WiFi (đánh dấu `=>` mạng cần vào), kết nối có timeout 20 s.
- Mỗi 20 s: kiểm WiFi → đọc cảm biến → gửi 3 field → in mã kết quả.
- Mất WiFi: tự kết nối lại; hỏng 5 vòng liên tiếp (~3 phút) thì `ESP.restart()`.
- Không thấy AHT20 hoặc đọc lỗi: bỏ lượt đó, lượt sau tự khởi tạo lại cảm biến (cắm lại dây không cần reset).

Compile kiểm tra bằng dòng lệnh:
```powershell
& "$env:LOCALAPPDATA\Programs\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe" `
  compile --fqbn esp32:esp32:esp32 firmware\esp32_thingspeak_n17
```
