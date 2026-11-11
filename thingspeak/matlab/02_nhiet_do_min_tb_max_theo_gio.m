% Nhiệt độ thấp nhất / trung bình / cao nhất theo từng giờ - 24 giờ
CHANNEL_ID = 3575274;
READ_API_KEY = 'VRMRZKO7EMU87FZH';

% Đọc dạng timetable để gộp theo giờ bằng retime
tt = thingSpeakRead(CHANNEL_ID, 'Fields', 1, 'NumDays', 1, ...
    'ReadKey', READ_API_KEY, 'OutputFormat', 'timetable');

if isempty(tt)
    title('Chưa có dữ liệu trong 24 giờ qua');
    return
end

hourlyMin = retime(tt, 'hourly', 'min');
hourlyMean = retime(tt, 'hourly', 'mean');
hourlyMax = retime(tt, 'hourly', 'max');

% Lấy theo vị trí cột / RowTimes: tên biến do ThingSpeak tự đặt, không cố định
hours = hourlyMean.Properties.RowTimes;

plot(hours, hourlyMax{:, 1}, 'r-o', 'LineWidth', 1.2); hold on
plot(hours, hourlyMean{:, 1}, 'g-o', 'LineWidth', 1.2);
plot(hours, hourlyMin{:, 1}, 'b-o', 'LineWidth', 1.2); hold off
legend('Cao nhất', 'Trung bình', 'Thấp nhất', 'Location', 'best');
ylabel('°C'); title('Nhiệt độ theo giờ - 24 giờ'); grid on
