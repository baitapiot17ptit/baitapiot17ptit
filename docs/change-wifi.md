# Đổi WiFi khi mang bo đi nơi khác

Tên và mật khẩu WiFi nằm trong `firmware/esp32_thingspeak_n17/secrets.h` và được nạp cứng vào ESP32.
Đến nơi có WiFi khác: **chạy công cụ đổi WiFi → nạp lại code** (khoảng 2 phút), không phải sửa file bằng tay —
hoặc dùng mẹo hotspot ở mục 1 để khỏi nạp lại.

| File | Nội dung | Trên GitHub? |
|---|---|---|
| `secrets.h` | Tên + mật khẩu WiFi — do `tools/change-wifi.bat` tạo | Không (`.gitignore`) |
| `thingspeak_config.h` | Channel ID + API Key ThingSpeak của nhóm 17, **điền sẵn** | Có — đổi kênh thì sửa trực tiếp file này |

> ESP32 **chỉ bắt WiFi 2.4 GHz**. Mạng chỉ có 5 GHz (tên thường có đuôi `_5G`) sẽ không kết nối được.

---

## 1. Cách nhanh nhất: không cần nạp lại code
Phát WiFi từ điện thoại **trùng đúng tên và mật khẩu** đã nạp trong bo. Bo tự kết nối như ở nhà.

| Điện thoại | Cách làm |
|---|---|
| Android | **Cài đặt → Điểm truy cập di động** → đặt *Tên* và *Mật khẩu* trùng với `WIFI_SSID`, `WIFI_PASSWORD`; *Băng tần* chọn **2.4 GHz** |
| iPhone | Tên hotspot = tên máy (**Cài đặt → Cài đặt chung → Giới thiệu → Tên**); mật khẩu ở **Điểm truy cập cá nhân**; bật **Tối đa hóa tương thích** (để phát 2.4 GHz) |

Phù hợp khi đi demo, thuyết trình: chỉ cần cắm điện cho bo và bật hotspot.

---

## 2. Đổi sang WiFi mới bằng công cụ (khuyên dùng)
1. Mở thư mục repo, bấm đúp **`tools/change-wifi.bat`**. Cửa sổ *Đổi WiFi cho ESP32* hiện ra
   (lần sau mở lại sẽ điền sẵn WiFi đang dùng).
2. **Tên WiFi:** bấm mũi tên để chọn trong danh sách mạng máy tính đang thấy (bấm *Quét lại* nếu thiếu),
   hoặc gõ tay. Phân biệt **chữ hoa / chữ thường** và **dấu cách**.
3. **Mật khẩu:** 8–63 ký tự; mạng không mật khẩu thì để trống. Tích *Hiện mật khẩu* để soát lại.
4. Bấm **Lưu** → dòng chữ xanh *"Đã lưu secrets.h ..."* là xong. Công cụ tự xử lý ký tự đặc biệt (`"`, `\`, tiếng Việt).
5. Bấm **Mở Arduino IDE** (hoặc tự mở `firmware/esp32_thingspeak_n17/esp32_thingspeak_n17.ino`).
6. Cắm bo vào máy, **Tools → Board: ESP32 Dev Module**, **Tools → Port: COMx** → bấm **Upload**.
   Kẹt ở `Connecting.....` thì giữ nút **BOOT** trên bo đến khi thấy `Writing at 0x...`.
7. Mở **Serial Monitor 115200 baud**, nhấn nút **EN** trên bo và kiểm tra (mục 4).

Dùng trong terminal (không mở cửa sổ):
```powershell
powershell -ExecutionPolicy Bypass -File tools\change-wifi.ps1 -Ssid "Ten_WiFi" -Password "mat_khau"
```

Sửa tay vẫn được: copy `secrets.example.h` thành `secrets.h` rồi điền `WIFI_SSID`, `WIFI_PASSWORD`.

---

## 3. Nạp từ máy tính khác (vừa clone repo về)
1. Cài Arduino IDE 2.x. **Boards Manager** cài *esp32 by Espressif Systems*; **Library Manager** cài
   *ThingSpeak* (MathWorks) và *DHT sensor library* (Adafruit, đồng ý cài kèm dependency).
2. Làm theo mục 2 — chỉ cần nhập WiFi. Channel ID và API Key đã có sẵn trong `thingspeak_config.h`.

> `thingspeak_config.h` chứa Write API Key và được commit có chủ đích (repo demo, Public): ai đọc repo cũng ghi
> được dữ liệu vào kênh. Muốn chặn thì vào ThingSpeak → kênh → **API Keys → Generate New Write API Key**, rồi sửa
> file này và nạp lại code.

---

## 4. Kiểm tra sau khi nạp
Serial Monitor (115200 baud) in ra theo thứ tự:

```
Đang quét WiFi xung quanh...
  => [Ten_WiFi_moi] RSSI -55 dBm (mạnh), kênh 6     ← dấu => là mạng cần vào: đã thấy
Đang kết nối tới [Ten_WiFi_moi]...
WiFi OK - IP: 192.168.1.23
Nhiệt độ 22.9 °C | Độ ẩm 68.1 % | Ánh sáng 4095
  -> Gửi thành công (200)
```

Mở dashboard <https://baitapiot17ptit.github.io/baitapiot17ptit/> → góc trên báo **Trạm đang hoạt động** là xong.

| Serial báo | Nguyên nhân | Cách xử lý |
|---|---|---|
| `CẢNH BÁO: không thấy mạng [...]` | Sai tên, hoặc mạng chỉ phát 5 GHz | Kiểm tra lại tên trong danh sách quét; dùng mạng 2.4 GHz / hotspot |
| `Kết nối thất bại (sai mật khẩu?)` | Sai mật khẩu, hoặc router chỉ bật WPA3 | Gõ lại mật khẩu; router chuyển sang WPA2/WPA3 |
| `WiFi OK` nhưng `-301` | WiFi cần **đăng nhập qua trang web** (WiFi trường, quán cà phê, khách sạn) | ESP32 không đăng nhập được kiểu này → dùng hotspot điện thoại |
| Sóng `rất yếu` (< -80 dBm) | Xa router | Đặt bo gần router hơn |

Thêm lỗi khác: xem [`troubleshooting.md`](troubleshooting.md).

---

## 5. Khi không có WiFi thì bo làm gì?
- Không gửi được dữ liệu; trang theo dõi báo *"Trạm tạm ngừng gửi"*.
- Thử kết nối lại liên tục; hỏng 5 lượt liên tiếp (~3 phút) thì tự khởi động lại. Khi WiFi trở lại, bo tự
  kết nối và chạy tiếp, không cần nạp lại code.
