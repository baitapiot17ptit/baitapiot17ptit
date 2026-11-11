% Nhiệt độ cảm nhận (Heat Index) từ nhiệt độ + độ ẩm - 24 giờ
CHANNEL_ID = 3575274;
READ_API_KEY = 'VRMRZKO7EMU87FZH';

[data, time] = thingSpeakRead(CHANNEL_ID, 'Fields', [1 2], ...
    'NumMinutes', 1440, 'ReadKey', READ_API_KEY);
tempF = data(:,1) * 9/5 + 32;
rh = data(:,2);
% Công thức Rothfusz (NOAA), chỉ chính xác khi trên ~27 °C
heatIndexF = -42.379 + 2.04901523*tempF + 10.14333127*rh ...
    - 0.22475541*tempF.*rh - 0.00683783*tempF.^2 ...
    - 0.05481717*rh.^2 + 0.00122874*tempF.^2.*rh ...
    + 0.00085282*tempF.*rh.^2 - 0.00000199*tempF.^2.*rh.^2;
heatIndexC = (heatIndexF - 32) * 5/9;
% Dưới 27 °C công thức không đúng -> coi cảm nhận bằng nhiệt độ thật
isBelowThreshold = data(:,1) < 27;
heatIndexC(isBelowThreshold) = data(isBelowThreshold, 1);

plot(time, data(:,1), time, heatIndexC, 'LineWidth', 1.5);
legend('Nhiệt độ thật', 'Nhiệt độ cảm nhận', 'Location', 'best');
ylabel('°C'); title('Nhiệt độ cảm nhận - 24 giờ'); grid on
