const path = require("path");
const express = require("express");

const app = express();
const port = Number(process.env.PORT || 8889);
const backendBaseUrl = process.env.BACKEND_BASE_URL || "http://localhost:8080";
const publicDir = path.join(__dirname, "public");

app.use(express.static(publicDir));

app.get("/config.js", (req, res) => {
  res.type("application/javascript").send(
    `window.APP_CONFIG = { BACKEND_BASE_URL: ${JSON.stringify(backendBaseUrl)} };`
  );
});

app.get("/affichage", (req, res) => {
  res.sendFile(path.join(publicDir, "affichage.html"));
});

app.listen(port, () => {
  console.log(`Frontend listening on port ${port}`);
  console.log(`Backend target: ${backendBaseUrl}`);
});
