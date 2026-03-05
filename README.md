# 🚛 STIKO TRANS — Générateur de Facture
**Stack : FastAPI (Python) + React (Vite)**

---

## 📁 Structure du projet

```
stiko-app/
├── backend/
│   ├── main.py              ← API FastAPI (parsing PDF + génération Excel)
│   └── requirements.txt
└── frontend/
    ├── src/
│   │   ├── App.jsx          ← Interface React
│   │   ├── App.css          ← Styles dark theme
│   │   ├── main.jsx
│   │   └── index.css
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Lancement

### 1. Backend (FastAPI)

```bash
cd backend

# Créer un environnement virtuel (recommandé)
python -m venv venv
source venv/bin/activate        # Linux/Mac
# venv\Scripts\activate         # Windows

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur
uvicorn main:app --reload --port 8000
```

L'API sera disponible sur **http://localhost:8000**  
Documentation Swagger : **http://localhost:8000/docs**

---

### 2. Frontend (React + Vite)

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de dev
npm run dev
```

L'application sera disponible sur **http://localhost:3000**

---

## 📦 Dépendances

### Backend
| Package | Rôle |
|---|---|
| `fastapi` | Framework API REST |
| `uvicorn` | Serveur ASGI |
| `pdfplumber` | Extraction texte PDF |
| `openpyxl` | Génération fichier Excel |
| `python-multipart` | Upload de fichiers |
| `pydantic` | Validation des données |

### Frontend
| Package | Rôle |
|---|---|
| `react` | UI framework |
| `vite` | Build tool rapide |
| `axios` | Requêtes HTTP vers l'API |
| `react-dropzone` | Zone drag & drop fichiers |

---

## 🔌 Endpoints API

### `POST /api/parse-pdf`
Upload d'un relevé PDF TRANSFRET → retourne les lignes extraites.

**Body** : `multipart/form-data` avec champ `file`

**Réponse** :
```json
{
  "lignes": [...],
  "date_debut": "02/02/2026",
  "date_fin": "06/02/2026",
  "facture_num_detecte": "ST122",
  "total_ht": 7006.80,
  "total_tva": 1401.36,
  "total_ttc": 8408.16
}
```

### `POST /api/generate-excel`
Génère et télécharge le fichier Excel facture.

**Body** :
```json
{
  "lignes": [...],
  "facture_num": "ST122",
  "facture_date": "2026-02-13",
  "client_nom": "TRANSFRET ME"
}
```

**Réponse** : fichier `.xlsx` en téléchargement direct.

---

## 🧩 Évolutions possibles

- **OCR** : ajouter `pytesseract` pour les PDF scannés (images)
- **Auth** : JWT avec `python-jose` pour sécuriser l'API
- **BDD** : stocker l'historique des factures avec `SQLAlchemy` + PostgreSQL
- **Docker** : `docker-compose` pour déployer backend + frontend ensemble
- **Export PDF** : générer la facture en PDF avec `reportlab` ou `weasyprint`
