const path = require("path");
const { spawn } = require("child_process");
const readline = require("readline");

function formatTimestamp(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  const mmm = String(date.getMilliseconds()).padStart(3, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}:${ss}.${mmm}`;
}

class SensorStore {
  constructor(name, maxHistory) {
    this.name = name;
    this.maxHistory = maxHistory;
    this.values = [];
  }

  push(value) {
    const rounded = Number(value.toFixed(1));
    this.values.push({
      timestamp: formatTimestamp(),
      value: rounded
    });
    if (this.values.length > this.maxHistory) {
      this.values.splice(0, this.values.length - this.maxHistory);
    }
  }

  latest() {
    if (this.values.length === 0) {
      return null;
    }
    return this.values[this.values.length - 1];
  }

  getHistory(n) {
    const safeN = Math.max(1, n);
    return this.values.slice(-safeN);
  }

  getAverage(n) {
    if (this.values.length === 0) {
      return null;
    }
    const history = this.getHistory(n);
    const total = history.reduce((sum, item) => sum + item.value, 0);
    return Number((total / history.length).toFixed(1));
  }
}

function startSensorProcess({ scriptPath, parser, store, pythonCmd }) {
  const resolvedScript = path.resolve(scriptPath);
  const child = spawn(pythonCmd, [resolvedScript], {
    stdio: ["ignore", "pipe", "pipe"]
  });

  child.on("error", (err) => {
    console.error(`[${store.name}] Failed to start process:`, err.message);
  });

  child.on("exit", (code, signal) => {
    console.error(
      `[${store.name}] Process exited (code=${code}, signal=${signal || "none"})`
    );
  });

  const stdoutReader = readline.createInterface({ input: child.stdout });
  stdoutReader.on("line", (line) => {
    const value = parser(line);
    if (value !== null) {
      store.push(value);
    }
  });

  const stderrReader = readline.createInterface({ input: child.stderr });
  stderrReader.on("line", (line) => {
    console.error(`[${store.name}] stderr: ${line}`);
  });

  return child;
}

function parseSound(line) {
  const match = line.match(/Value:\s*([+-]?\d+(?:\.\d+)?)/i);
  if (!match) {
    return null;
  }
  return Number(match[1]);
}

function parseUltrasonic(line) {
  const match = line.match(/([+-]?\d+(?:\.\d+)?)\s*cm/i);
  if (!match) {
    return null;
  }
  return Number(match[1]);
}

module.exports = {
  SensorStore,
  startSensorProcess,
  parseSound,
  parseUltrasonic
};
