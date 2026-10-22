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
  - `sound.py` (son)
  - `ultrasonic.py` (ultrasonique)

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
- `SOUND_SCRIPT` (défaut: `../python_examples/sound.py`)
- `ULTRASONIC_SCRIPT` (défaut: `../python_examples/ultrasonic.py`)
- `MAX_HISTORY` (défaut: `720`)

Lancer:

```bash
npm start
```

API disponible sur `http://<ip_machine_a>:8080`:
- `GET /capteurs/sound`
- `GET /capteurs/sound/:n`
- `GET /capteurs/sound/:n/moy`
- `GET /capteurs/ultrasonic`
- `GET /capteurs/ultrasonic/:n`
- `GET /capteurs/ultrasonic/:n/moy`

## Démarrage du frontend (Machine B)

Depuis la racine du repo:

```bash
cd frontend
npm install
```

Configurer le frontend via le fichier `.env` dans `frontend/`:

```env
BACKEND_BASE_URL=http://192.168.1.50:8080
PORT=8889
```

`BACKEND_BASE_URL` pointe vers la machine A (backend).

Le frontend écoute sur `http://<ip_machine_b>:8889/affichage`.

## Notes

- Les scripts capteurs produisent une mesure par seconde.
- Le frontend rafraîchit toutes les 1 seconde pour mettre à jour le graphique à chaque nouvelle mesure.
- En cas d'erreur réseau/backend, un message d'erreur est affiché et les tentatives continuent.
- Librairie graphique utilisée: Chart.js (CDN officiel: https://www.chartjs.org/).