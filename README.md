# gti700-eq02

Implémentation simple séparée en deux dossiers:
- `backend/` : API capteurs (port `8080`) qui lit les données via 2 scripts Python existants.
- `frontend/` : page web `/affichage` (port `8889`) qui consomme l'API du backend.

## Structure

- `backend/server.js`
- `backend/sensors.js`
- `backend/package.json`
- `frontend/server.js`
- `frontend/public/affichage.html`
- `frontend/public/app.js`
- `frontend/public/styles.css`
- `frontend/package.json`

## Prérequis

### Machine A (backend, Raspberry Pi A)
- Node.js 18+
- Python 3
- Dépendances capteurs Python installées (RPi.GPIO, etc.)
- Les scripts Python présents dans `python_examples/`:
  - `thermistor.py` (température)
  - `humid.py` (humidité)

### Machine B (frontend, Raspberry Pi B / ordinateur B)
- Node.js 18+
- Accès réseau à la machine A

## Démarrage du backend (Machine A)

Depuis la racine du repo:

```bash
cd backend
npm install
```

Variables optionnelles:
- `PORT` (défaut: `8080`)
- `PYTHON_CMD` (défaut: `python3`)
- `TEMP_SCRIPT` (défaut: `../python_examples/thermistor.py`)
- `HUM_SCRIPT` (défaut: `../python_examples/humid.py`)
- `MAX_HISTORY` (défaut: `720`)

Lancer:

```bash
npm start
```

API disponible sur `http://<ip_machine_a>:8080`:
- `GET /capteurs/temp`
- `GET /capteurs/temp/:n`
- `GET /capteurs/temp/:n/moy`
- `GET /capteurs/hum`
- `GET /capteurs/hum/:n`
- `GET /capteurs/hum/:n/moy`

## Démarrage du frontend (Machine B)

Depuis la racine du repo:

```bash
cd frontend
npm install
```

Configurer l'URL du backend:
- `BACKEND_BASE_URL` (défaut: `http://localhost:8080`)

Exemple (Linux/macOS):

```bash
BACKEND_BASE_URL=http://192.168.1.50:8080 npm start
```

Exemple (Windows PowerShell):

```powershell
$env:BACKEND_BASE_URL="http://192.168.1.50:8080"
npm start
```

Le frontend écoute sur `http://<ip_machine_b>:8889/affichage`.

## Notes

- Rafraîchissement automatique toutes les 3 secondes sans recharger la page.
- En cas d'erreur réseau/backend, un message d'erreur est affiché et les tentatives continuent.
- Librairie graphique utilisée: Chart.js (CDN officiel: https://www.chartjs.org/).