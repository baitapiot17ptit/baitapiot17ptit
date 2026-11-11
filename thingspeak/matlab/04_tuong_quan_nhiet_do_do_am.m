% Biểu đồ điểm nhiệt độ - độ ẩm 3 ngày, kèm hệ số tương quan r
% r gần -1: nóng lên thì khô đi; gần 0: không liên quan.
CHANNEL_ID = 3575274;
READ_API_KEY = 'VRMRZKO7EMU87FZH';

data = thingSpeakRead(CHANNEL_ID, 'Fields', [1 2], 'NumDays', 3, ...
    'ReadKey', READ_API_KEY);
scatter(data(:,1), data(:,2), 15, 'filled');
correlation = corrcoef(data(:,1), data(:,2), 'Rows', 'complete');
xlabel('Nhiệt độ (°C)'); ylabel('Độ ẩm (%)');
title(sprintf('Tương quan nhiệt độ - độ ẩm (r = %.2f)', correlation(1,2)));
grid on
