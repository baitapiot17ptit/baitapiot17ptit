% Phân bố nhiệt độ 7 ngày: nhiệt độ hay nằm ở mức nào nhất
CHANNEL_ID = 3575274;
READ_API_KEY = 'VRMRZKO7EMU87FZH';

data = thingSpeakRead(CHANNEL_ID, 'Fields', 1, 'NumDays', 7, ...
    'ReadKey', READ_API_KEY);
histogram(data, 'BinWidth', 0.5);
xlabel('Nhiệt độ (°C)'); ylabel('Số lần đo');
title('Phân bố nhiệt độ - 7 ngày'); grid on
