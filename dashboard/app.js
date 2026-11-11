(() => {
  const config = window.MONITOR_CONFIG;
  const THINGSPEAK_API = "https://api.thingspeak.com";
  const THINGSPEAK_WEB = "https://thingspeak.mathworks.com";

  // Bo gửi 20 s/lần: làm mới số liệu cùng nhịp, thống kê/biểu đồ thưa hơn
  const LATEST_REFRESH_MS = 20000;
  const HISTORY_REFRESH_MS = 60000;
  // Quá ~3 lượt gửi không có dữ liệu mới -> coi như trạm ngừng
  const STALE_AFTER_MS = 70000;
  const LOG_ROWS = 10;

  const TEMP_SCALE_MAX = 50;
  const HUMIDITY_SCALE_MAX = 100;
  const ADC_MAX = 4095;
  const RING_CIRCUMFERENCE = 2 * Math.PI * 50;
  // Trục biểu đồ ánh sáng: chia chẵn để nhãn gọn (ADC tối đa 4095)
  const LIGHT_AXIS_MAX = 4500;
  const LIGHT_AXIS_STEP = 1500;
  // Cùng ngưỡng với nhóm 14 để phân mức ánh sáng
  const LIGHT_DARK_THRESHOLD = 1500;
  const LIGHT_BRIGHT_THRESHOLD = 2000;

  const RANGE_QUERIES = {
    "1h": { query: "minutes=60", labelFormat: "time" },
    "24h": { query: "days=1&average=10", labelFormat: "time" },
    "7d": { query: "days=7&average=60", labelFormat: "dateTime" },
  };

  const $ = (id) => document.getElementById(id);
  const state = { range: "1h", charts: {} };

  const feedUrl = (suffix) => `${THINGSPEAK_API}/channels/${config.channelId}/${suffix}`;

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.json();
    if (body === -1) throw new Error("Kênh ThingSpeak chưa Public");
    return body;
  }

  const toNumber = (value) => {
    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? number : null;
  };
  const fixed = (value, digits) => (value === null ? "--" : value.toFixed(digits));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function formatTime(date, format) {
    const options = format === "dateTime"
      ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }
      : format === "full"
        ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }
        : { hour: "2-digit", minute: "2-digit" };
    return date.toLocaleString("vi-VN", options);
  }

  // ---------- Chỉ số tính toán ----------
  // Heat Index theo NOAA (Rothfusz); dưới ~27 °C dùng công thức đơn giản
  function heatIndexCelsius(tempC, humidity) {
    const tempF = tempC * 9 / 5 + 32;
    let heatF = 0.5 * (tempF + 61 + (tempF - 68) * 1.2 + humidity * 0.094);
    if (heatF >= 80) {
      heatF = -42.379 + 2.04901523 * tempF + 10.14333127 * humidity
        - 0.22475541 * tempF * humidity - 0.00683783 * tempF * tempF
        - 0.05481717 * humidity * humidity + 0.00122874 * tempF * tempF * humidity
        + 0.00085282 * tempF * humidity * humidity
        - 0.00000199 * tempF * tempF * humidity * humidity;
    }
    return (heatF - 32) * 5 / 9;
  }

  // Điểm sương theo công thức Magnus
  function dewPointCelsius(tempC, humidity) {
    const a = 17.62;
    const b = 243.12;
    const gamma = Math.log(humidity / 100) + (a * tempC) / (b + tempC);
    return (b * gamma) / (a - gamma);
  }

  function describeComfort(tempC, humidity) {
    if (tempC > 30) return "Nóng";
    if (tempC < 18) return "Lạnh";
    if (humidity > 70) return "Hơi ẩm";
    if (humidity < 30) return "Hơi khô";
    return "Dễ chịu";
  }

  function describeLight(level) {
    if (level === null) return "--";
    if (level < LIGHT_DARK_THRESHOLD) return "Tối";
    if (level > LIGHT_BRIGHT_THRESHOLD) return "Sáng";
    return "Chạng vạng";
  }

  // ---------- Hiển thị số liệu hiện tại ----------
  function setRing(element, ratio) {
    element.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - clamp(ratio, 0, 1)));
  }

  function renderLive(createdAt) {
    const ageMs = Date.now() - createdAt.getTime();
    const isOnline = ageMs < STALE_AFTER_MS;
    $("liveBadge").classList.toggle("online", isOnline);
    $("liveBadge").classList.toggle("offline", !isOnline);
    $("liveState").textContent = isOnline ? "Trạm đang hoạt động" : "Trạm tạm ngừng gửi";
    $("liveTime").textContent = `Bản ghi cuối: ${formatTime(createdAt, "full")}`;
  }

  function renderLatest(feed) {
    const temperature = toNumber(feed.field1);
    const humidity = toNumber(feed.field2);
    const light = toNumber(feed.field3);

    $("tempValue").textContent = fixed(temperature, 1);
    $("humValue").textContent = fixed(humidity, 1);
    $("lightValue").textContent = light === null ? "--" : String(Math.round(light));
    $("lightLevel").textContent = describeLight(light);
    setRing($("tempRing"), temperature === null ? 0 : temperature / TEMP_SCALE_MAX);
    setRing($("humRing"), humidity === null ? 0 : humidity / HUMIDITY_SCALE_MAX);
    $("lightBar").style.width = `${light === null ? 0 : clamp(light / ADC_MAX, 0, 1) * 100}%`;

    const hasClimate = temperature !== null && humidity !== null && humidity > 0;
    $("heatIndex").textContent = hasClimate ? fixed(heatIndexCelsius(temperature, humidity), 1) : "--";
    $("dewPoint").textContent = hasClimate ? fixed(dewPointCelsius(temperature, humidity), 1) : "--";
    $("comfort").textContent = hasClimate ? describeComfort(temperature, humidity) : "--";

    renderLive(new Date(feed.created_at));
  }

  function renderLog(feeds) {
    const body = $("logBody");
    body.replaceChildren();
    [...feeds].reverse().forEach((feed) => {
      const row = document.createElement("tr");
      const light = toNumber(feed.field3);
      [
        formatTime(new Date(feed.created_at), "full"),
        String(feed.entry_id),
        fixed(toNumber(feed.field1), 2),
        fixed(toNumber(feed.field2), 2),
        light === null ? "--" : String(Math.round(light)),
      ].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });
      body.appendChild(row);
    });
  }

  async function refreshLatest() {
    try {
      const body = await fetchJson(feedUrl(`feeds.json?results=${LOG_ROWS}`));
      const feeds = body.feeds || [];
      if (!feeds.length) throw new Error("Kênh chưa có dữ liệu");
      renderLatest(feeds[feeds.length - 1]);
      renderLog(feeds);
    } catch (error) {
      console.error("Lỗi tải số liệu mới nhất:", error);
      $("liveBadge").classList.remove("online");
      $("liveBadge").classList.add("offline");
      $("liveState").textContent = "Không tải được dữ liệu";
      $("liveTime").textContent = error.message;
    }
  }

  // ---------- Thống kê 24 giờ ----------
  function summarize(values) {
    const valid = values.filter((v) => v !== null);
    if (!valid.length) return null;
    const total = valid.reduce((sum, v) => sum + v, 0);
    return { min: Math.min(...valid), avg: total / valid.length, max: Math.max(...valid) };
  }

  function renderStats(feeds) {
    const rows = [
      ["Nhiệt độ (°C)", feeds.map((f) => toNumber(f.field1)), 1],
      ["Độ ẩm (%)", feeds.map((f) => toNumber(f.field2)), 1],
      ["Ánh sáng (0–4095)", feeds.map((f) => toNumber(f.field3)), 0],
    ];
    const body = $("statsBody");
    body.replaceChildren();
    for (const [label, values, digits] of rows) {
      const summary = summarize(values);
      const row = document.createElement("tr");
      [label, summary && fixed(summary.min, digits), summary && fixed(summary.avg, digits), summary && fixed(summary.max, digits)]
        .forEach((value) => {
          const cell = document.createElement("td");
          cell.textContent = value ?? "--";
          row.appendChild(cell);
        });
      body.appendChild(row);
    }
    $("statsNote").textContent = `Tính từ ${feeds.length} bản ghi trong 24 giờ qua.`;
  }

  async function refreshStats() {
    try {
      const body = await fetchJson(feedUrl("feeds.json?days=1"));
      renderStats(body.feeds || []);
    } catch (error) {
      console.error("Lỗi tải thống kê:", error);
      $("statsNote").textContent = `Không tải được thống kê: ${error.message}`;
    }
  }

  // ---------- Biểu đồ ----------
  function initCharts() {
    Chart.defaults.color = "#8ba3b4";
    Chart.defaults.font.family = "'Be Vietnam Pro', system-ui, sans-serif";
    const grid = { color: "rgba(148, 163, 184, 0.12)" };
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { labels: { boxWidth: 12, usePointStyle: true } } },
    };
    state.charts.climate = new Chart($("climateChart"), {
      type: "line",
      data: {
        labels: [],
        datasets: [
          { label: "Nhiệt độ (°C)", data: [], borderColor: "#fb7185", backgroundColor: "rgba(251,113,133,0.12)",
            yAxisID: "yTemp", tension: 0.35, pointRadius: 0, borderWidth: 2, fill: true, spanGaps: true },
          { label: "Độ ẩm (%)", data: [], borderColor: "#60a5fa", backgroundColor: "rgba(96,165,250,0.08)",
            yAxisID: "yHum", tension: 0.35, pointRadius: 0, borderWidth: 2, fill: false, spanGaps: true },
        ],
      },
      options: {
        ...baseOptions,
        scales: {
          x: { grid, ticks: { maxTicksLimit: 8 } },
          yTemp: { position: "left", grid, title: { display: true, text: "°C" } },
          yHum: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "%" } },
        },
      },
    });
    state.charts.light = new Chart($("lightChart"), {
      type: "bar",
      data: { labels: [], datasets: [{ label: "Ánh sáng (0–4095)", data: [], backgroundColor: "rgba(251,191,36,0.7)", borderRadius: 3 }] },
      options: {
        ...baseOptions,
        layout: { padding: { left: 12 } },
        scales: {
          x: { grid, ticks: { maxTicksLimit: 8 } },
          // Cố định thang ADC để nhãn trục không nhảy và đủ chỗ hiển thị
          y: { grid, min: 0, max: LIGHT_AXIS_MAX, ticks: { stepSize: LIGHT_AXIS_STEP, callback: (v) => String(v) } },
        },
      },
    });
  }

  async function refreshCharts() {
    const range = RANGE_QUERIES[state.range];
    try {
      const body = await fetchJson(feedUrl(`feeds.json?${range.query}`));
      const feeds = body.feeds || [];
      const labels = feeds.map((f) => formatTime(new Date(f.created_at), range.labelFormat));
      state.charts.climate.data.labels = labels;
      state.charts.climate.data.datasets[0].data = feeds.map((f) => toNumber(f.field1));
      state.charts.climate.data.datasets[1].data = feeds.map((f) => toNumber(f.field2));
      state.charts.climate.update();
      state.charts.light.data.labels = labels;
      state.charts.light.data.datasets[0].data = feeds.map((f) => toNumber(f.field3));
      state.charts.light.update();
    } catch (error) {
      console.error("Lỗi tải biểu đồ:", error);
    }
  }

  function initRangeTabs() {
    $("rangeTabs").addEventListener("click", (event) => {
      const button = event.target.closest("button[data-range]");
      if (!button || button.dataset.range === state.range) return;
      state.range = button.dataset.range;
      $("rangeTabs").querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === button));
      refreshCharts();
    });
  }

  // ---------- Thành viên + biểu đồ nhúng ----------
  function renderMembers() {
    const list = $("memberList");
    config.members.forEach((member) => {
      const item = document.createElement("li");
      const name = document.createElement("span");
      name.className = "member-name";
      name.textContent = member.name;
      const studentId = document.createElement("span");
      studentId.className = "member-id";
      studentId.textContent = member.studentId;
      item.append(name, studentId);
      list.appendChild(item);
    });
  }

  function createEmbed(title, src) {
    const figure = document.createElement("figure");
    figure.className = "embed";
    const caption = document.createElement("figcaption");
    caption.textContent = title;
    const frame = document.createElement("iframe");
    frame.src = src;
    frame.title = title;
    frame.loading = "lazy";
    figure.append(caption, frame);
    return figure;
  }

  function renderEmbeds() {
    const grid = $("embedGrid");
    config.fieldCharts.forEach((chart) => {
      const params = new URLSearchParams({
        bgcolor: "#ffffff", color: chart.color, dynamic: "true", results: "120",
        type: chart.type, title: chart.title, xaxis: "Thời gian", yaxis: chart.yAxis,
      });
      grid.appendChild(createEmbed(chart.title,
        `${THINGSPEAK_WEB}/channels/${config.channelId}/charts/${chart.field}?${params}`));
    });
    config.matlabVisualizations.forEach((viz) => {
      grid.appendChild(createEmbed(viz.title, `${THINGSPEAK_WEB}/apps/matlab_visualizations/${viz.id}`));
    });
  }

  async function init() {
    $("channelLink").href = `${THINGSPEAK_WEB}/channels/${config.channelId}`;
    $("channelLink").textContent = `ThingSpeak channel ${config.channelId}`;
    renderMembers();
    renderEmbeds();
    // Đợi font web tải xong: Chart.js đo độ rộng nhãn trục theo font lúc vẽ,
    // vẽ sớm bằng font dự phòng thì nhãn bị cắt khi font thật thay vào
    await document.fonts.ready;
    initCharts();
    initRangeTabs();
    refreshLatest();
    refreshStats();
    refreshCharts();
    setInterval(refreshLatest, LATEST_REFRESH_MS);
    setInterval(() => { refreshStats(); refreshCharts(); }, HISTORY_REFRESH_MS);
  }

  init();
})();
