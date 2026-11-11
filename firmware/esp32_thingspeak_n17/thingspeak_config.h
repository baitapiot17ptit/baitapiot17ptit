#pragma once

// Cấu hình ThingSpeak cố định của Nhóm 17.
// Commit có chủ đích (repo demo) để clone về là nạp được ngay, không phải đi
// tìm key. Đổi sang kênh khác thì sửa trực tiếp ở đây.

// Kênh cảm biến: Field 1 nhiệt độ, Field 2 độ ẩm, Field 3 ánh sáng
const unsigned long CHANNEL_ID = 3575274;
const char* WRITE_API_KEY = "YJYNFI2MZOQFV53S";
