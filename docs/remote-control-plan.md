# Kế hoạch: bật / tắt thiết bị từ xa qua ThingSpeak

> Trạng thái: **chưa làm** — đang chờ chốt các câu hỏi ở cuối file.

Không cần web riêng; ThingSpeak làm được bằng một trong hai cách.

| Cách | Hoạt động | Ưu | Nhược |
|---|---|---|---|
| **A. Kênh điều khiển** (khuyên dùng) | Channel riêng "Điều khiển": Field 1 = relay, Field 2 = LED; ghi `1`/`0`. ESP32 đọc giá trị mới nhất mỗi ~5 s | Đơn giản, bấm link trên điện thoại được; có biểu đồ lịch sử bật/tắt; tự động hóa được | Hai lần bấm cách nhau ≥ 15 s (free plan) |
| **B. TalkBack** | Hàng đợi lệnh (`RELAY_ON`...), ESP32 lấy và chạy lần lượt | Không mất lệnh, không giới hạn 15 s | Thêm lệnh phải POST, giao diện rối |

## Cách A
```
Điện thoại / máy tính ──ghi field1=1──► ThingSpeak (kênh Điều khiển)
                                              │  ESP32 đọc mỗi 5 s
                                              ▼
                                   ESP32 bật relay GPIO 26 / LED GPIO 2
```

Cách bấm:
1. **Bookmark link**:
   `https://api.thingspeak.com/update?api_key=<WRITE_KEY_KENH_DIEU_KHIEN>&field1=1` (bật) / `...&field1=0` (tắt).
2. **File HTML có nút** Bật/Tắt + hiện trạng thái — một file, không cần server (không public file vì chứa Write Key).
3. **Tự động**: ThingSpeak **React + MATLAB Analysis** — vd. ánh sáng < ngưỡng → `field2=1`; nhiệt độ > 30 °C → bật
   relay quạt.

Sửa phía ESP32:
- Thay `delay(20000)` bằng hẹn giờ `millis()`: gửi cảm biến mỗi 20 s, đọc lệnh mỗi 5 s.
- Đọc `https://api.thingspeak.com/channels/<ID>/feeds/last.json?api_key=<READ_KEY>` → ghi chân 26 / 2.
- Mất mạng: giữ nguyên trạng thái cũ.

Lưu ý:
- Độ trễ bấm → relay đổi ~5–10 s. Cần tức thì (< 1 s) thì phải MQTT.
- Ai có Write Key kênh điều khiển là bật/tắt được.
- Tách riêng khỏi kênh cảm biến của nhóm để không tranh giới hạn 15 s.

## Câu hỏi cần chốt trước khi làm
1. Điều khiển gì: relay (GPIO 26), LED trên bo (GPIO 2), hay cả hai? Relay nối thiết bị gì? Relay kích mức cao hay thấp?
2. Cách bấm: chỉ bookmark link, hay thêm file HTML có nút?
3. Có cần tự động hóa (tối bật đèn, nóng bật quạt) không?
4. Tạo sẵn Channel thứ hai trên ThingSpeak: Field 1 = Relay, Field 2 = LED.
