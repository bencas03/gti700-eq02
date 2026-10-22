const API_BASE = window.APP_CONFIG?.BACKEND_BASE_URL || "http://localhost:8080";
const HISTORY_SIZE = 30;
const REFRESH_MS = 3000;

const statusEl = document.getElementById("status");
const soundCurrentEl = document.getElementById("sound-current");
const soundAvgEl = document.getElementById("sound-avg");
const humCurrentEl = document.getElementById("hum-current");
const humAvgEl = document.getElementById("hum-avg");
const soundHistoryBody = document.getElementById("sound-history");
const humHistoryBody = document.getElementById("hum-history");

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
  chart.data.labels = history.map(([timestamp]) => extractTime(timestamp));
  chart.data.datasets[0].data = history.map(([, value]) => Number(value));
  chart.update();
}

async function getText(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`${path} -> HTTP ${response.status}`);
  }
  return response.text();
}

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`${path} -> HTTP ${response.status}`);
  }
  return response.json();
}

const soundChart = createChart("sound-chart", "Son (valeur brute)", "#2563eb");
const humChart = createChart("hum-chart", "Humidité (%)", "#059669");

async function refreshAll() {
  try {
    const [soundCurrent, soundAvg, soundHistory, humCurrent, humAvg, humHistory] =
      await Promise.all([
        getText("/capteurs/sound"),
        getText(`/capteurs/sound/${HISTORY_SIZE}/moy`),
        getJson(`/capteurs/sound/${HISTORY_SIZE}`),
        getText("/capteurs/hum"),
        getText(`/capteurs/hum/${HISTORY_SIZE}/moy`),
        getJson(`/capteurs/hum/${HISTORY_SIZE}`)
      ]);

    soundCurrentEl.textContent = soundCurrent;
    soundAvgEl.textContent = soundAvg;
    humCurrentEl.textContent = humCurrent;
    humAvgEl.textContent = humAvg;

    renderTable(soundHistoryBody, soundHistory, "");
    renderTable(humHistoryBody, humHistory, " %");

    updateChart(soundChart, soundHistory);
    updateChart(humChart, humHistory);
    setStatusOk();
  } catch (err) {
    setStatusError(err.message);
  }
}

refreshAll();
setInterval(refreshAll, REFRESH_MS);
