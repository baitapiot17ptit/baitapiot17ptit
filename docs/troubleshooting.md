# Khắc phục sự cố

Các lỗi đã gặp thực tế khi làm dự án, kèm cách xử lý.

## Nạp code
| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Failed uploading: no upload port provided` | Chưa chọn cổng | **Tools → Port → COM4** (CH340). Không thấy cổng → rút cắm lại cáp, kiểm driver CH340 |
| `Failed to connect to ESP32: Timed out... waiting for packet header` | Bo không vào chế độ nạp | Giữ nút **BOOT** khi hiện `Connecting.....`, thả khi thấy `Writing at 0x...` |
| `Access is denied` / `port is busy` | Chương trình khác giữ COM4 | Đóng Serial Monitor, web flasher, PuTTY... rồi nạp lại |
| `missing terminating " character` | Copy code từ terminal bị ngắt dòng giữa chuỗi | Mở file `.ino` trong repo, không copy từ chat / terminal |

## Serial Monitor
| Hiện tượng | Ý nghĩa / cách xử lý |
|---|---|
| `rst:0x1 (POWERON_RESET)... entry 0x400805b4` | **Không phải lỗi** — log ROM bootloader mỗi lần reset; output sketch nằm sau dòng `entry` |
| Ký tự tiếng Việt lỗi | Dùng Arduino IDE 2.x; baud 115200 |
| Không in gì sau `entry` | Sai baud, hoặc sketch chưa được nạp |

## WiFi
| Trạng thái in ra | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Không thấy mạng (sai tên hoặc mạng 5 GHz)` / mạng không có `=>` trong danh sách quét | ESP32 chỉ bắt **2.4 GHz** | Dùng mạng 2.4 GHz hoặc hotspot điện thoại (iPhone: bật *Maximize Compatibility*) |
| `Kết nối thất bại (sai mật khẩu?)` | Sai mật khẩu / router WPA3-only / lọc MAC | Kiểm mật khẩu (hoa thường, dấu cách), chuyển router sang WPA2/WPA3 mixed |
| Sóng `rất yếu` (< -80 dBm) | Xa router | Đưa bo lại gần, không che anten |

## ThingSpeak
| Mã | Nghĩa | Cách xử lý |
|---|---|---|
| `200` | Gửi thành công | — |
| `401` | Sai Write API Key / Channel ID | Lấy key trong tab **API Keys** của Channel (không phải User API Key) |
| `-301` | Không tới được ThingSpeak | Mạng có WiFi nhưng không ra Internet |
| `-304` | Hết thời gian chờ | Mạng chậm; thử lại |
| `-401` | Gửi quá nhanh | Free plan ≥ 15 s/lần; sketch đặt 20 s |

## MATLAB Visualization
| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Unrecognized table variable name 'temperature'` | Tên cột timetable do ThingSpeak tự đặt, khác tên trong code | Truy cập theo vị trí: `tt{:, 1}`, `tt.Properties.RowTimes` (đã sửa trong `02_...m`) |
| Biểu đồ trống / rất ít điểm | Kênh mới, chưa đủ dữ liệu trong khoảng thời gian đọc | Chờ thêm vài giờ, hoặc giảm `NumDays` |
| Ô Public View bị mờ | Channel đang Private | Tab **Sharing → Share channel view with everyone** |

## AHT20
| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `Không thấy AHT20 (kiểm tra SDA chân 21, SCL chân 22)` | Sai dây / đảo SDA–SCL / lỏng dây | SDA → 21, SCL → 22, VCC 3.3 V, GND chung; cắm chặt lại, sketch tự thử lại mỗi 20 s |
| `Đọc AHT20 lỗi` | Nhiễu I2C, dây dài | Rút ngắn dây (< 30 cm); lượt sau sketch tự khởi tạo lại |
| `fatal error: Adafruit_AHTX0.h: No such file` | Chưa cài thư viện | Library Manager → **Adafruit AHTX0** (cài kèm BusIO, Unified Sensor) |
