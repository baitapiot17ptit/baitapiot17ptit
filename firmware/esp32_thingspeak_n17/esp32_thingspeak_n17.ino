#include <WiFi.h>
#include <Wire.h>
#include <ThingSpeak.h>
#include <Adafruit_AHTX0.h>
#include "secrets.h"
#include "thingspeak_config.h"

const int I2C_SDA_PIN = 21;
const int I2C_SCL_PIN = 22;
const int LIGHT_ANALOG_PIN = 32;
const int ADC_MAX_VALUE = 4095;

const unsigned long PUSH_INTERVAL_MS = 20000;
const unsigned long WIFI_CONNECT_TIMEOUT_MS = 20000;
const unsigned long WIFI_STATUS_POLL_MS = 500;
const int MAX_FAILED_WIFI_ROUNDS = 5;

Adafruit_AHTX0 aht;
WiFiClient client;
int failedWifiRounds = 0;
bool isAhtReady = false;

const char* describeWifiStatus(wl_status_t status) {
  switch (status) {
    case WL_CONNECTED:
      return "Đã kết nối";
    case WL_NO_SSID_AVAIL:
      return "Không thấy mạng (sai tên hoặc mạng 5 GHz)";
    case WL_CONNECT_FAILED:
      return "Kết nối thất bại (sai mật khẩu?)";
    case WL_CONNECTION_LOST:
      return "Mất kết nối";
    case WL_DISCONNECTED:
      return "Chưa kết nối / đang thử";
    case WL_IDLE_STATUS:
      return "Đang chờ";
    default:
      return "Trạng thái khác";
  }
}

const char* describeSignal(int rssi) {
  if (rssi >= -60) return "mạnh";
  if (rssi >= -70) return "khá";
  if (rssi >= -80) return "yếu";
  return "rất yếu";
}

void scanWifiNetworks() {
  Serial.println("Đang quét WiFi xung quanh...");
  int networkCount = WiFi.scanNetworks();
  if (networkCount <= 0) {
    Serial.println("  Không thấy mạng nào (ESP32 chỉ bắt 2.4 GHz)");
    return;
  }
  bool isTargetFound = false;
  for (int i = 0; i < networkCount; i++) {
    bool isTarget = WiFi.SSID(i) == WIFI_SSID;
    isTargetFound = isTargetFound || isTarget;
    Serial.printf("  %s [%s] RSSI %d dBm (%s), kênh %d\n",
                  isTarget ? "=>" : "  ",
                  WiFi.SSID(i).c_str(),
                  WiFi.RSSI(i),
                  describeSignal(WiFi.RSSI(i)),
                  WiFi.channel(i));
  }
  if (!isTargetFound) {
    Serial.printf("CẢNH BÁO: không thấy mạng [%s]\n", WIFI_SSID);
    Serial.println("  -> kiểm tra tên, hoặc dùng mạng 2.4 GHz");
  }
  WiFi.scanDelete();
}

bool connectWifi() {
  Serial.printf("Đang kết nối tới [%s]...\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startedAt = millis();
  wl_status_t lastStatus = WL_IDLE_STATUS;
  while (WiFi.status() != WL_CONNECTED &&
         millis() - startedAt < WIFI_CONNECT_TIMEOUT_MS) {
    wl_status_t status = WiFi.status();
    if (status != lastStatus) {
      Serial.printf("  Trạng thái: %s\n", describeWifiStatus(status));
      lastStatus = status;
    }
    delay(WIFI_STATUS_POLL_MS);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("WiFi OK - IP: %s\n",
                  WiFi.localIP().toString().c_str());
    Serial.printf("  Sóng %d dBm (%s)\n",
                  WiFi.RSSI(),
                  describeSignal(WiFi.RSSI()));
    return true;
  }
  Serial.printf("LỖI WiFi: %s\n", describeWifiStatus(WiFi.status()));
  return false;
}

bool ensureWifiConnected() {
  if (WiFi.status() == WL_CONNECTED) {
    failedWifiRounds = 0;
    return true;
  }
  Serial.println("Mất WiFi, đang kết nối lại...");
  WiFi.disconnect();
  if (connectWifi()) {
    failedWifiRounds = 0;
    return true;
  }
  failedWifiRounds++;
  if (failedWifiRounds >= MAX_FAILED_WIFI_ROUNDS) {
    Serial.println("Mất WiFi quá lâu - khởi động lại bo");
    delay(1000);
    ESP.restart();
  }
  return false;
}

const char* describeThingSpeakStatus(int status) {
  switch (status) {
    case 200:
      return "Gửi thành công";
    case 400:
      return "Sai dữ liệu gửi lên";
    case 401:
      return "Sai Write API Key hoặc Channel ID";
    case -301:
      return "Không tới được ThingSpeak (mạng không ra Internet?)";
    case -304:
      return "ThingSpeak không trả lời (hết thời gian chờ)";
    case -401:
      return "Gửi quá nhanh (free plan tối thiểu 15 giây)";
    default:
      return "Lỗi khác";
  }
}
bool ensureAhtReady() {
  if (isAhtReady) {
    return true;
  }
  isAhtReady = aht.begin();
  if (!isAhtReady) {
    Serial.println("Không thấy AHT20 (kiểm tra SDA chân 21, SCL chân 22)");
  }
  return isAhtReady;
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println();
  Serial.println("===== Nhóm 17: ESP32 -> ThingSpeak khởi động =====");

  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  ensureAhtReady();
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.disconnect();
  delay(100);

  scanWifiNetworks();
  connectWifi();
  ThingSpeak.begin(client);
}

void loop() {
  if (ensureWifiConnected() && ensureAhtReady()) {
    sensors_event_t humidityEvent;
    sensors_event_t temperatureEvent;
    bool isReadOk = aht.getEvent(&humidityEvent, &temperatureEvent);
    float temperature = temperatureEvent.temperature;
    float humidity = humidityEvent.relative_humidity;
    int lightLevel = ADC_MAX_VALUE - analogRead(LIGHT_ANALOG_PIN);

    if (!isReadOk || isnan(temperature) || isnan(humidity)) {
      Serial.println("Đọc AHT20 lỗi (kiểm tra dây SDA 21 / SCL 22)");
      isAhtReady = false;
    } else {
      ThingSpeak.setField(1, temperature);
      ThingSpeak.setField(2, humidity);
      ThingSpeak.setField(3, lightLevel);
      int status = ThingSpeak.writeFields(CHANNEL_ID, WRITE_API_KEY);
      Serial.printf("Nhiệt độ %.1f °C | Độ ẩm %.1f %% | Ánh sáng %d\n",
                    temperature, humidity, lightLevel);
      Serial.printf("  -> %s (%d)\n",
                    describeThingSpeakStatus(status), status);
    }
  }
  delay(PUSH_INTERVAL_MS);
}
