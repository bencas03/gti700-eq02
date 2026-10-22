const API_BASE = window.APP_CONFIG?.BACKEND_BASE_URL || "http://localhost:8080";
const HISTORY_SIZE = 30;
const REFRESH_MS = 1000;

const statusEl = document.getElementById("status");
const soundCurrentEl = document.getElementById("sound-current");
const soundAvgEl = document.getElementById("sound-avg");
const ultrasonicCurrentEl = document.getElementById("ultrasonic-current");
const ultrasonicAvgEl = document.getElementById("ultrasonic-avg");
const soundHistoryBody = document.getElementById("sound-history");
const ultrasonicHistoryBody = document.getElementById("ultrasonic-history");

function extractTime(timestamp) {
  const parts = timestamp.split(" ");
  return parts.length > 1 ? parts[1] : timestamp;
}

function setStatusOk() {
  statusEl.classList.remove("error");
  statusEl.classList.add("ok");
  statusEl.textContent = "Connexion OK";
}

function setStatusError(message) {
  statusEl.classList.remove("ok");
  statusEl.classList.add("error");
  statusEl.textContent = `Erreur de communication: ${message}`;
}

function renderTable(targetBody, history, unitSuffix) {
  targetBody.innerHTML = "";
  for (const [timestamp, value] of history) {
    const tr = document.createElement("tr");
    const tdTimestamp = document.createElement("td");
    const tdValue = document.createElement("td");
    tdTimestamp.textContent = timestamp;
    tdValue.textContent = `${Number(value).toFixed(1)}${unitSuffix}`;
    tr.appendChild(tdTimestamp);
    tr.appendChild(tdValue);
    targetBody.appendChild(tr);
  }
}

function createChart(canvasId, label, borderColor) {
  const ctx = document.getElementById(canvasId);
  return new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label,
          data: [],
          borderColor,
          backgroundColor: borderColor,
          pointRadius: 3,
          tension: 0.2
        }
      ]
    },
    options: {
      animation: false,
      responsive: true,
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

function updateChart(chart, history) {
  const labels = history.map(([timestamp]) => extractTime(timestamp));
  const values = history.map(([, value]) => Number(value));

  chart.data.labels = labels;
  chart.data.datasets[0].data = values;

  if (values.length > 0) {
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;
    const padding = range > 0 ? range * 0.15 : Math.max(Math.abs(maxValue) * 0.1, 1);
    chart.options.scales.y.min = minValue - padding;
    chart.options.scales.y.max = maxValue + padding;
  } else {
    chart.options.scales.y.min = undefined;
    chart.options.scales.y.max = undefined;
  }

  chart.update();
}

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`${path} -> HTTP ${response.status}${message ? ` - ${message}` : ""}`);
  }
  return response.json();
}

const soundChart = createChart("sound-chart", "Son (valeur brute)", "#2563eb");
const ultrasonicChart = createChart("ultrasonic-chart", "Distance (cm)", "#059669");

function computeAverage(history) {
  if (history.length === 0) {
    return null;
  }
  const total = history.reduce((sum, [, value]) => sum + Number(value), 0);
  return (total / history.length).toFixed(1);
}

async function refreshSensor({
  key,
  currentEl,
  avgEl,
  historyEl,
  chart,
  unitSuffix
}) {
  const history = await getJson(`/capteurs/${key}/${HISTORY_SIZE}`);
  renderTable(historyEl, history, unitSuffix);
  updateChart(chart, history);

  if (history.length === 0) {
    currentEl.textContent = "--";
    avgEl.textContent = "--";
    return;
  }

  const latestValue = Number(history[history.length - 1][1]).toFixed(1);
  const avg = computeAverage(history);
  currentEl.textContent = `${latestValue}${unitSuffix}`;
  avgEl.textContent = `${avg}${unitSuffix}`;
}

async function refreshAll() {
  const results = await Promise.allSettled([
    refreshSensor({
      key: "sound",
      currentEl: soundCurrentEl,
      avgEl: soundAvgEl,
      historyEl: soundHistoryBody,
      chart: soundChart,
      unitSuffix: ""
    }),
    refreshSensor({
      key: "ultrasonic",
      currentEl: ultrasonicCurrentEl,
      avgEl: ultrasonicAvgEl,
      historyEl: ultrasonicHistoryBody,
      chart: ultrasonicChart,
      unitSuffix: " cm"
    })
  ]);

  const failures = results.filter((result) => result.status === "rejected");
  if (failures.length === 0) {
    setStatusOk();
    return;
  }
  if (failures.length < results.length) {
    setStatusError("Un capteur est indisponible, l'autre continue de se rafraîchir.");
    return;
  }
  setStatusError(failures[0].reason?.message || "Erreur inconnue.");
}

refreshAll();
setInterval(() => {
  refreshAll();
}, REFRESH_MS);
