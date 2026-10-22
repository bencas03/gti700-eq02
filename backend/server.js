const path = require("path");
const express = require("express");
const {
  SensorStore,
  startSensorProcess,
  parseSound,
  parseHumidity
} = require("./sensors");

const app = express();
const port = Number(process.env.PORT || 8080);
const maxHistory = Number(process.env.MAX_HISTORY || 720);
const pythonCmd = process.env.PYTHON_CMD || "python3";
const soundScript =
  process.env.SOUND_SCRIPT || path.join(__dirname, "..", "python_examples", "sound.py");
const humScript =
  process.env.HUM_SCRIPT || path.join(__dirname, "..", "python_examples", "humid.py");

const soundStore = new SensorStore("sound", maxHistory);
const humStore = new SensorStore("hum", maxHistory);

const processes = [
  startSensorProcess({
    scriptPath: soundScript,
    parser: parseSound,
    store: soundStore,
    pythonCmd
  }),
  startSensorProcess({
    scriptPath: humScript,
    parser: parseHumidity,
    store: humStore,
    pythonCmd
  })
];

function parseN(req, res) {
  const n = Number(req.params.n);
  if (!Number.isInteger(n) || n < 1 || n > maxHistory) {
    res
      .status(400)
      .json({ error: `Le paramètre n doit être un entier entre 1 et ${maxHistory}.` });
    return null;
  }
  return n;
}

function sendLatest(res, store, withPercent) {
  const latest = store.latest();
  if (!latest) {
    res.status(503).json({ error: "Aucune donnée disponible pour le moment." });
    return;
  }
  const value = withPercent ? `${latest.value.toFixed(1)}%` : latest.value.toFixed(1);
  res.type("text/plain").send(value);
}

function sendHistory(res, store, n) {
  const history = store.getHistory(n).map((item) => [item.timestamp, item.value]);
  res.json(history);
}

function sendAverage(res, store, n, withPercent) {
  const avg = store.getAverage(n);
  if (avg === null) {
    res.status(503).json({ error: "Aucune donnée disponible pour le moment." });
    return;
  }
  const value = withPercent ? `${avg.toFixed(1)}%` : avg.toFixed(1);
  res.type("text/plain").send(value);
}

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/capteurs/sound", (req, res) => {
  sendLatest(res, soundStore, false);
});

app.get("/capteurs/sound/:n", (req, res) => {
  const n = parseN(req, res);
  if (n === null) {
    return;
  }
  sendHistory(res, soundStore, n);
});

app.get("/capteurs/sound/:n/moy", (req, res) => {
  const n = parseN(req, res);
  if (n === null) {
    return;
  }
  sendAverage(res, soundStore, n, false);
});

app.get("/capteurs/hum", (req, res) => {
  sendLatest(res, humStore, true);
});

app.get("/capteurs/hum/:n", (req, res) => {
  const n = parseN(req, res);
  if (n === null) {
    return;
  }
  sendHistory(res, humStore, n);
});

app.get("/capteurs/hum/:n/moy", (req, res) => {
  const n = parseN(req, res);
  if (n === null) {
    return;
  }
  sendAverage(res, humStore, n, true);
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    soundSamples: soundStore.values.length,
    humiditySamples: humStore.values.length
  });
});

const server = app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});

function shutdown() {
  server.close(() => {
    for (const child of processes) {
      if (child && !child.killed) {
        child.kill("SIGTERM");
      }
    }
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
