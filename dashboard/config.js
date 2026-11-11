// Cấu hình trang giám sát Nhóm 17 (chỉ đọc dữ liệu, kênh ThingSpeak public).
window.MONITOR_CONFIG = {
  channelId: 3575274,
  groupName: "Nhóm 17",
  members: [
    { name: "Lê Thanh Tiến", studentId: "K24DTCN384" },
    { name: "Trần Công Tý", studentId: "K24DTCN247" },
    { name: "Nguyễn Ngọc Nam Anh", studentId: "K25DTCN005" },
    { name: "Bùi Đình Cương", studentId: "K24DTCN175" },
  ],
  // Biểu đồ field chart nhúng từ ThingSpeak
  fieldCharts: [
    { field: 1, title: "Nhiệt độ", yAxis: "Nhiệt độ (°C)", type: "spline", color: "#e53935" },
    { field: 2, title: "Độ ẩm", yAxis: "Độ ẩm (%)", type: "spline", color: "#1e88e5" },
    { field: 3, title: "Cường độ ánh sáng", yAxis: "Độ sáng (0–4095)", type: "column", color: "#f59e0b" },
  ],
  // MATLAB Visualization (đã bật public URL trên ThingSpeak)
  matlabVisualizations: [
    { id: 689237, title: "Nhiệt độ & độ ẩm (2 trục, 24 giờ)" },
    { id: 689238, title: "Nhiệt độ thấp nhất / trung bình / cao nhất theo giờ" },
    { id: 689239, title: "Histogram: mức nhiệt độ hay gặp nhất" },
    { id: 689240, title: "Tương quan nhiệt độ - độ ẩm" },
    { id: 689241, title: "Nhiệt độ thực tế và nhiệt độ cảm nhận" },
  ],
};
