#pragma once

// Chỉ chứa WiFi (không commit secrets.h). Cách tạo secrets.h:
//   - Bấm đúp tools/change-wifi.bat, nhập WiFi rồi bấm "Lưu" (khuyên dùng), hoặc
//   - Copy file này thành secrets.h rồi điền tay.
// Channel ID và API Key ThingSpeak nằm ở thingspeak_config.h.
const char* WIFI_SSID = "<dien-vao>";
const char* WIFI_PASSWORD = "<dien-vao>";
