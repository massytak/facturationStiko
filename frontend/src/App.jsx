import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import "./App.css";

const API = process.env.NODE_ENV === "production" 
  ? ""           // même domaine en prod — pas besoin d'URL complète
  : "http://localhost:8000"

// ── Helpers
const euro = (n) =>
  Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

const today = () => new Date().toISOString().split("T")[0];

// ── Step indicator
function Steps({ current }) {
  const steps = ["Relevé PDF", "Paramètres", "Aperçu", "Export"];
  return (
    <div className="steps">
      {steps.map((label, i) => (
        <div
          key={i}
          className={`step ${i + 1 < current ? "done" : i + 1 === current ? "active" : ""}`}
        >
          <div className="step-num">
            {i + 1 < current ? "✓" : String(i + 1).padStart(2, "0")}
          </div>
          <div className="step-label">{label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Upload zone
function UploadZone({ onParsed, setLoading, setError }) {
  const onDrop = useCallback(
    async (files) => {
      const file = files[0];
      if (!file) return;
      setLoading("Lecture et analyse du PDF...");
      setError(null);
      const form = new FormData();
      form.append("file", file);
      try {
        const { data } = await axios.post(`${API}/api/parse-pdf`, form);
        onParsed(data);
      } catch (e) {
        setError(e.response?.data?.detail || "Erreur lors de l'analyse du PDF");
      } finally {
        setLoading(null);
      }
    },
    [onParsed, setLoading, setError]
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  return (
    <div className="card">
      <div className="card-title">
        <span className="dot" /> Importer le relevé de transports
      </div>
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "over" : ""} ${acceptedFiles.length ? "loaded" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="drop-icon">{acceptedFiles.length ? "✅" : "📄"}</div>
        <div className="drop-title">
          {acceptedFiles.length
            ? acceptedFiles[0].name
            : "Déposer votre relevé PDF ici"}
        </div>
        <div className="drop-sub">
          {acceptedFiles.length
            ? "PDF chargé avec succès"
            : "ou cliquer pour parcourir — Format TRANSFRET RELEVE"}
        </div>
      </div>
    </div>
  );
}

// ── Params form
function ParamsForm({ parsed, params, setParams, onAnalyse }) {
  return (
    <div className="card">
      <div className="card-title">
        <span className="dot" /> Informations de la facture
      </div>
      <div className="grid2">
        <div className="field">
          <label>Numéro de facture</label>
          <input
            value={params.factureNum}
            onChange={(e) => setParams((p) => ({ ...p, factureNum: e.target.value }))}
            placeholder="ST122"
          />
        </div>
        <div className="field">
          <label>Date d'émission</label>
          <input
            type="date"
            value={params.factureDate}
            onChange={(e) => setParams((p) => ({ ...p, factureDate: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Client</label>
          <input
            value={params.clientNom}
            onChange={(e) => setParams((p) => ({ ...p, clientNom: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Lignes détectées</label>
          <input
            value={`${parsed.lignes.length} transport(s)`}
            readOnly
            style={{ color: "var(--green)", cursor: "default" }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Data table
function DataTable({ lignes }) {
  return (
    <div className="card">
      <div className="card-title">
        <span className="dot" />
        Lignes extraites —{" "}
        <span style={{ color: "var(--accent)" }}>{lignes.length} transport(s)</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Commande</th>
              <th>Container</th>
              <th>Qté km</th>
              <th>Immob €</th>
              <th>Total HT</th>
              <th>TVA</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={i}>
                <td>{l.date_str}</td>
                <td className="accent">{l.commande}</td>
                <td className="muted small">{l.container}</td>
                <td className="center">{l.quantite.toLocaleString("fr")}</td>
                <td className="right">{l.immob > 0 ? euro(l.immob) : "—"}</td>
                <td className="right bold">
                  {l.total_ht > 0 ? (
                    euro(l.total_ht)
                  ) : (
                    <span className="warn">⚠ 0,00 €</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${l.is_exo ? "exo" : "taxable"}`}>
                    {l.is_exo ? "EXO" : "20%"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Totals
function Totals({ parsed }) {
  return (
    <div className="totals">
      <div className="tot">
        <div className="tot-label">Total HT</div>
        <div className="tot-val">{euro(parsed.total_ht)}</div>
      </div>
      <div className="tot">
        <div className="tot-label">Total TVA</div>
        <div className="tot-val">{euro(parsed.total_tva)}</div>
      </div>
      <div className="tot hi">
        <div className="tot-label">Total TTC</div>
        <div className="tot-val">{euro(parsed.total_ttc)}</div>
      </div>
    </div>
  );
}

// ── Main App
export default function App() {
  const [step, setStep]       = useState(1);
  const [parsed, setParsed]   = useState(null);
  const [loading, setLoading] = useState(null);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(null);
  const [params, setParams]   = useState({
    factureNum:  "ST122",
    factureDate: today(),
    clientNom:   "TRANSFRET ME",
  });

  const handleParsed = (data) => {
    setParsed(data);
    setParams((p) => ({
      ...p,
      factureNum:  data.facture_num_detecte || p.factureNum,
      factureDate: data.date_fin
        ? data.date_fin.split("/").reverse().join("-")
        : p.factureDate,
    }));
    setStep(2);
  };

  const handleGenerate = async () => {
    setLoading("Génération du fichier Excel...");
    setError(null);
    setSuccess(null);
    try {
      const res = await axios.post(
        `${API}/api/generate-excel`,
        {
          lignes:        parsed.lignes,
          facture_num:   params.factureNum,
          facture_date:  params.factureDate,
          client_nom:    params.clientNom,
        },
        { responseType: "blob" }
      );
      const url  = URL.createObjectURL(res.data);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `FACTURE_STIKO_TRANS_${params.factureNum}_${params.factureDate.replace(/-/g, "")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess(`✅ Facture téléchargée — ${parsed.lignes.length} lignes exportées`);
      setStep(4);
    } catch (e) {
      setError("Erreur lors de la génération Excel");
    } finally {
      setLoading(null);
    }
  };

  const handleAnalyse = () => setStep(3);

  const reset = () => {
    setStep(1); setParsed(null); setError(null); setSuccess(null);
  };

  return (
    <div className="app">
      {/* Header */}
      <header>
        <div>
          <div className="brand">Transport</div>
          <h1>STIKO <span>TRANS</span></h1>
        </div>
        <div className="header-right">
          <div className="ver-badge">FastAPI + React v1.0</div>
          {step > 1 && (
            <button className="btn-ghost" onClick={reset}>
              ↩ Nouveau relevé
            </button>
          )}
        </div>
      </header>

      <Steps current={step} />

      {/* Status bar */}
      {loading && (
        <div className="status-bar info">
          <div className="spinner" /> {loading}
        </div>
      )}
      {error && (
        <div className="status-bar err">
          ⚠ {error}
        </div>
      )}
      {success && (
        <div className="status-bar ok">
          {success}
        </div>
      )}

      {/* Step 1 — Upload */}
      {step === 1 && (
        <UploadZone
          onParsed={handleParsed}
          setLoading={setLoading}
          setError={setError}
        />
      )}

      {/* Step 2 — Params */}
      {step === 2 && parsed && (
        <>
          <ParamsForm
            parsed={parsed}
            params={params}
            setParams={setParams}
            onAnalyse={handleAnalyse}
          />
          <button className="btn-primary" onClick={handleAnalyse}>
            📊 Voir l'aperçu des données
          </button>
        </>
      )}

      {/* Step 3 — Preview + generate */}
      {step >= 3 && parsed && (
        <>
          <DataTable lignes={parsed.lignes} />
          <Totals parsed={parsed} />
          {step === 3 && (
            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={!!loading}
            >
              ⬇️ Générer le fichier Excel
            </button>
          )}
        </>
      )}

      {/* Step 4 — Done */}
      {step === 4 && (
        <div className="card done-card">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2>Facture générée avec succès</h2>
          <p>{parsed?.lignes.length} lignes de transport exportées</p>
          <button className="btn-primary" onClick={reset} style={{ marginTop: 24 }}>
            ↩ Générer une nouvelle facture
          </button>
        </div>
      )}
    </div>
  );
}
