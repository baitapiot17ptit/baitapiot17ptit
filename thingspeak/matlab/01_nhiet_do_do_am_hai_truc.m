% Nhiệt độ và độ ẩm trên cùng biểu đồ, hai trục Y - 24 giờ gần nhất
% Cho thấy quan hệ ngược chiều thường gặp: nóng lên thì độ ẩm giảm.
CHANNEL_ID = 3575274;
READ_API_KEY = 'VRMRZKO7EMU87FZH';  % tab API Keys -> Read API Keys

[data, time] = thingSpeakRead(CHANNEL_ID, 'Fields', [1 2], ...
    'NumMinutes', 1440, 'ReadKey', READ_API_KEY);

yyaxis left
plot(time, data(:,1), '-', 'LineWidth', 1.5);
ylabel('Nhiệt độ (°C)');
yyaxis right
plot(time, data(:,2), '-', 'LineWidth', 1.5);
ylabel('Độ ẩm (%)');
title('Nhiệt độ và độ ẩm - 24 giờ');
grid on
