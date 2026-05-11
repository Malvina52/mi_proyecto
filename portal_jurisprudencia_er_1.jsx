import { useState, useEffect, useRef } from "react";

const FUEROS = [
  {
    id: "civil",
    label: "Civil y Comercial",
    icon: "⚖",
    desc: "Cámara de Apelaciones · Paraná",
  },
  {
    id: "amparos",
    label: "Amparos — STJ",
    icon: "🏛",
    desc: "Superior Tribunal de Justicia",
  },
];

const PIPELINE_STEPS = [
  { id: "login",     label: "Ingreso al portal",        icon: "🔐" },
  { id: "captcha",   label: "Screenshot del CAPTCHA",   icon: "📷" },
  { id: "ocr",       label: "OCR · Resolución",         icon: "🔍" },
  { id: "scraping",  label: "Extracción de fallos",     icon: "📄" },
  { id: "analysis",  label: "Análisis IA (Groq)",       icon: "🤖" },
  { id: "report",    label: "Generación del informe",   icon: "📋" },
];

const MOCK_CAPTCHA = "efcKON";

const MOCK_REPORT = {
  titulo: "Estrategia Jurídica — Responsabilidad Objetiva",
  subtitulo: "Basada en Fallo Nº 2345/2020 · Cámara de Apelaciones de Paraná",
  rubros: [
    { nombre: "Daño emergente",      monto: "$850.000",   tendencia: "↑ Alta aceptación" },
    { nombre: "Lucro cesante",       monto: "$1.200.000", tendencia: "↑ Alta aceptación" },
    { nombre: "Daño moral",          monto: "$600.000",   tendencia: "↑ Media aceptación" },
    { nombre: "Daño psicológico",    monto: "$400.000",   tendencia: "→ Variable" },
  ],
  fundamentos: [
    "Responsabilidad objetiva acreditada bajo Art. 1757 CCyC — no se requiere culpa.",
    "El Fallo Nº 2345/2020 establece criterio vinculante sobre nexo causal en accidentes viales.",
    "Jurisprudencia local de las últimas 50 sentencias muestra otorgamiento promedio de $3.050.000.",
    "Recomendación: solicitar actualización por IPC desde fecha del hecho hasta efectivo pago.",
  ],
  fallosAnalizados: 50,
  fechaGeneracion: new Date().toLocaleDateString("es-AR", { day:"2-digit", month:"long", year:"numeric" }),
};

function useTypewriter(text, speed = 28, active = false) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!active) { setDisplayed(""); return; }
    let i = 0;
    setDisplayed("");
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, active]);
  return displayed;
}

function StepRow({ step, status, delay }) {
  const icons = { idle: "○", running: "◉", done: "✓", error: "✗" };
  const colors = {
    idle:    "#4a4a3a",
    running: "#c9a84c",
    done:    "#6abf7b",
    error:   "#e05c5c",
  };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 16px", borderRadius: 8,
      background: status === "running" ? "rgba(201,168,76,0.08)" : "transparent",
      transition: "background 0.4s",
      animationDelay: `${delay}ms`,
    }}>
      <span style={{
        fontSize: 13, fontFamily: "monospace",
        color: colors[status],
        transition: "color 0.4s",
        minWidth: 14, textAlign: "center",
        animation: status === "running" ? "pulse 1s ease-in-out infinite" : "none",
      }}>
        {icons[status]}
      </span>
      <span style={{ fontSize: 12, color: colors[status], transition: "color 0.4s", opacity: status === "idle" ? 0.35 : 1 }}>
        {step.icon}
      </span>
      <span style={{
        fontSize: 13, color: status === "idle" ? "#4a4a3a" : status === "done" ? "#888" : "#c9c9b8",
        fontFamily: "'Courier New', monospace",
        letterSpacing: "0.01em",
        transition: "color 0.4s",
      }}>
        {step.label}
      </span>
      {status === "running" && (
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#c9a84c", animation: "blink 1s step-end infinite" }}>
          procesando…
        </span>
      )}
      {status === "done" && (
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#6abf7b" }}>listo</span>
      )}
    </div>
  );
}

function CaptchaBox({ revealed }) {
  return (
    <div style={{
      margin: "16px 0",
      background: "rgba(0,0,0,0.4)",
      border: "1px solid #2a2a1e",
      borderRadius: 10,
      padding: 16,
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <span style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        CAPTCHA detectado
      </span>
      <div style={{
        background: "#1a1a14",
        borderRadius: 6,
        padding: "12px 20px",
        fontFamily: "'Courier New', monospace",
        fontSize: 26,
        letterSpacing: "0.35em",
        color: revealed ? "#c9a84c" : "#1a1a14",
        textShadow: revealed ? "0 0 18px rgba(201,168,76,0.4)" : "none",
        transition: "all 0.6s",
        textAlign: "center",
        userSelect: "none",
        filter: revealed ? "none" : "blur(6px)",
      }}>
        {MOCK_CAPTCHA}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: revealed ? "100%" : "0%",
          height: 2, borderRadius: 1,
          background: "linear-gradient(90deg, #c9a84c, #6abf7b)",
          transition: "width 1.2s ease",
        }}/>
      </div>
      {revealed && (
        <span style={{ fontSize: 11, color: "#6abf7b", fontFamily: "monospace" }}>
          ✓ OCR resuelto · confianza 94%
        </span>
      )}
    </div>
  );
}

function ReportCard({ report, visible }) {
  const [show, setShow] = useState(false);
  useEffect(() => { if (visible) setTimeout(() => setShow(true), 200); }, [visible]);

  return (
    <div style={{
      opacity: show ? 1 : 0,
      transform: show ? "translateY(0)" : "translateY(20px)",
      transition: "all 0.7s ease",
    }}>
      {/* Header del informe */}
      <div style={{
        borderLeft: "3px solid #c9a84c",
        paddingLeft: 16, marginBottom: 24,
      }}>
        <h2 style={{ margin: 0, fontSize: 18, color: "#e8e0c8", fontFamily: "'Georgia', serif", fontWeight: 400 }}>
          {report.titulo}
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888", fontFamily: "monospace" }}>
          {report.subtitulo}
        </p>
      </div>

      {/* Métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Fallos analizados", value: report.fallosAnalizados, unit: "sentencias" },
          { label: "Indemnización estimada", value: "$3.050.000", unit: "promedio histórico" },
        ].map(m => (
          <div key={m.label} style={{
            background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)",
            borderRadius: 8, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              {m.label}
            </div>
            <div style={{ fontSize: 22, color: "#c9a84c", fontFamily: "'Georgia', serif" }}>{m.value}</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{m.unit}</div>
          </div>
        ))}
      </div>

      {/* Tabla de rubros */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Rubros indemnizatorios
        </div>
        <div style={{ border: "1px solid #1e1e16", borderRadius: 8, overflow: "hidden" }}>
          {report.rubros.map((r, i) => (
            <div key={r.nombre} style={{
              display: "grid", gridTemplateColumns: "1fr auto auto",
              alignItems: "center", gap: 12,
              padding: "11px 16px",
              background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
              borderBottom: i < report.rubros.length - 1 ? "1px solid #1a1a12" : "none",
            }}>
              <span style={{ fontSize: 13, color: "#c9c9b8" }}>{r.nombre}</span>
              <span style={{ fontSize: 13, color: "#c9a84c", fontFamily: "monospace" }}>{r.monto}</span>
              <span style={{
                fontSize: 11, color: r.tendencia.startsWith("↑") ? "#6abf7b" : "#888",
                whiteSpace: "nowrap",
              }}>{r.tendencia}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fundamentos */}
      <div>
        <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
          Fundamentos jurídicos
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {report.fundamentos.map((f, i) => (
            <div key={i} style={{
              display: "flex", gap: 10,
              fontSize: 12, color: "#a0a090", lineHeight: 1.6,
            }}>
              <span style={{ color: "#c9a84c", flexShrink: 0, marginTop: 1 }}>—</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 24, paddingTop: 16,
        borderTop: "1px solid #1e1e16",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 11, color: "#444" }}>
          Generado el {report.fechaGeneracion} · Sistema Legal ER v0.1.0
        </span>
        <button
          onClick={() => {
            const blob = new Blob([`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${report.titulo}</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;color:#222;} h1{border-bottom:2px solid #c9a84c;padding-bottom:12px;} table{width:100%;border-collapse:collapse;} td,th{padding:10px;border:1px solid #ddd;text-align:left;} th{background:#f9f6ef;}</style></head><body><h1>${report.titulo}</h1><p>${report.subtitulo}</p><h2>Rubros Indemnizatorios</h2><table><tr><th>Rubro</th><th>Monto</th><th>Tendencia</th></tr>${report.rubros.map(r=>`<tr><td>${r.nombre}</td><td>${r.monto}</td><td>${r.tendencia}</td></tr>`).join("")}</table><h2>Fundamentos Jurídicos</h2><ul>${report.fundamentos.map(f=>`<li>${f}</li>`).join("")}</ul></body></html>`], { type: "text/html" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "estrategia_juridica.html";
            a.click();
          }}
          style={{
            background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)",
            color: "#c9a84c", borderRadius: 6, padding: "7px 14px",
            fontSize: 12, cursor: "pointer", fontFamily: "monospace",
          }}
        >
          ↓ Exportar HTML
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [fuero, setFuero] = useState("civil");
  const [phase, setPhase] = useState("idle"); // idle | running | done
  const [stepStatuses, setStepStatuses] = useState(
    Object.fromEntries(PIPELINE_STEPS.map(s => [s.id, "idle"]))
  );
  const [captchaRevealed, setCaptchaRevealed] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const timerRefs = useRef([]);

  function clearAll() {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
  }

  function runPipeline() {
    clearAll();
    setPhase("running");
    setCaptchaRevealed(false);
    setShowReport(false);
    setStepStatuses(Object.fromEntries(PIPELINE_STEPS.map(s => [s.id, "idle"])));

    const DURATIONS = [1200, 1000, 1600, 2000, 2400, 1200];
    let elapsed = 0;

    PIPELINE_STEPS.forEach((step, i) => {
      const start = elapsed;
      const dur = DURATIONS[i];

      timerRefs.current.push(setTimeout(() => {
        setStepStatuses(prev => ({ ...prev, [step.id]: "running" }));
        if (step.id === "captcha") setCaptchaRevealed(false);
        if (step.id === "ocr") setTimeout(() => setCaptchaRevealed(true), 800);
      }, start));

      timerRefs.current.push(setTimeout(() => {
        setStepStatuses(prev => ({ ...prev, [step.id]: "done" }));
      }, start + dur));

      elapsed += dur;
    });

    timerRefs.current.push(setTimeout(() => {
      setPhase("done");
      setShowReport(true);
    }, elapsed + 300));
  }

  const selectedFuero = FUEROS.find(f => f.id === fuero);
  const isRunning = phase === "running";
  const isDone = phase === "done";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0e0e0a",
      color: "#c9c9b8",
      fontFamily: "'Courier New', Courier, monospace",
      display: "grid",
      gridTemplateColumns: "280px 1fr",
      gridTemplateRows: "auto 1fr",
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0e0e0a; }
        ::-webkit-scrollbar-thumb { background: #2a2a1e; border-radius: 3px; }
        button:hover { opacity: 0.85; }
      `}</style>

      {/* ── TOPBAR ── */}
      <div style={{
        gridColumn: "1 / -1",
        borderBottom: "1px solid #1a1a12",
        padding: "14px 28px",
        display: "flex", alignItems: "center", gap: 14,
        background: "rgba(0,0,0,0.3)",
      }}>
        <span style={{ fontSize: 18 }}>⚖</span>
        <span style={{ fontSize: 15, color: "#e8e0c8", fontFamily: "'Georgia', serif", letterSpacing: "0.02em" }}>
          Portal de Jurisprudencia
        </span>
        <span style={{ fontSize: 13, color: "#3a3a2e" }}>·</span>
        <span style={{ fontSize: 12, color: "#555", letterSpacing: "0.06em" }}>ENTRE RÍOS</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 7, height: 7, borderRadius: "50%",
            background: isRunning ? "#c9a84c" : isDone ? "#6abf7b" : "#2a2a1e",
            animation: isRunning ? "pulse 1s ease-in-out infinite" : "none",
          }}/>
          <span style={{ fontSize: 11, color: "#555" }}>
            {isRunning ? "Ejecutando análisis…" : isDone ? "Análisis completado" : "Sistema listo"}
          </span>
        </div>
      </div>

      {/* ── SIDEBAR ── */}
      <div style={{
        borderRight: "1px solid #1a1a12",
        padding: "28px 20px",
        display: "flex", flexDirection: "column", gap: 28,
        overflowY: "auto",
      }}>
        {/* Selector de fuero */}
        <div>
          <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
            Fuero
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FUEROS.map(f => (
              <button
                key={f.id}
                onClick={() => { if (!isRunning) setFuero(f.id); }}
                style={{
                  background: fuero === f.id ? "rgba(201,168,76,0.10)" : "transparent",
                  border: `1px solid ${fuero === f.id ? "rgba(201,168,76,0.35)" : "#1a1a12"}`,
                  borderRadius: 8,
                  padding: "12px 14px",
                  textAlign: "left",
                  cursor: isRunning ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  width: "100%",
                  opacity: isRunning && fuero !== f.id ? 0.3 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 14 }}>{f.icon}</span>
                  <span style={{ fontSize: 12, color: fuero === f.id ? "#c9a84c" : "#888" }}>
                    {f.label}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#3a3a2e", paddingLeft: 22 }}>{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Botón ejecutar */}
        <button
          onClick={runPipeline}
          disabled={isRunning}
          style={{
            background: isRunning
              ? "rgba(201,168,76,0.06)"
              : "rgba(201,168,76,0.14)",
            border: "1px solid rgba(201,168,76,0.4)",
            borderRadius: 8, padding: "13px",
            color: isRunning ? "#666" : "#c9a84c",
            fontSize: 13, cursor: isRunning ? "not-allowed" : "pointer",
            fontFamily: "monospace",
            letterSpacing: "0.05em",
            transition: "all 0.2s",
          }}
        >
          {isRunning ? "▶ Ejecutando…" : "▶ Ejecutar análisis"}
        </button>

        {/* Pipeline steps */}
        <div>
          <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
            Pipeline
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {PIPELINE_STEPS.map((step, i) => (
              <StepRow
                key={step.id}
                step={step}
                status={stepStatuses[step.id]}
                delay={i * 60}
              />
            ))}
          </div>
        </div>

        {/* CAPTCHA box (aparece durante OCR) */}
        {(stepStatuses.captcha !== "idle" || stepStatuses.ocr !== "idle") && (
          <CaptchaBox revealed={captchaRevealed} />
        )}

        {/* Info del modelo */}
        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid #1a1a12" }}>
          <div style={{ fontSize: 10, color: "#333", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            Motor IA
          </div>
          <div style={{ fontSize: 11, color: "#444", lineHeight: 1.7 }}>
            <div>Groq · llama-3.3-70b</div>
            <div>CrewAI 1.14.4</div>
            <div>Playwright + EasyOCR</div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{
        padding: "32px 36px",
        overflowY: "auto",
        display: "flex", flexDirection: "column",
      }}>
        {phase === "idle" && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            gap: 16, opacity: 0.35,
          }}>
            <div style={{ fontSize: 48 }}>⚖</div>
            <div style={{ fontSize: 14, color: "#888", textAlign: "center", lineHeight: 1.6 }}>
              Seleccioná un fuero y presioná<br />
              <span style={{ color: "#c9a84c" }}>Ejecutar análisis</span> para iniciar.
            </div>
          </div>
        )}

        {isRunning && !showReport && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            gap: 20,
            animation: "fadeIn 0.4s ease",
          }}>
            <div style={{
              fontSize: 12, color: "#555",
              textTransform: "uppercase", letterSpacing: "0.12em",
            }}>
              {selectedFuero.icon} Fuero: {selectedFuero.label}
            </div>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              border: "2px solid #1e1e16",
              borderTop: "2px solid #c9a84c",
              animation: "spin 1.2s linear infinite",
            }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ fontSize: 13, color: "#666" }}>
              Automatizando el portal judicial…
            </div>
          </div>
        )}

        {showReport && (
          <div style={{ animation: "fadeIn 0.5s ease" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              marginBottom: 28,
            }}>
              <div style={{
                fontSize: 11, color: "#6abf7b",
                textTransform: "uppercase", letterSpacing: "0.1em",
                background: "rgba(106,191,123,0.08)",
                border: "1px solid rgba(106,191,123,0.2)",
                borderRadius: 4, padding: "4px 10px",
              }}>
                ✓ Análisis completado
              </div>
              <span style={{ fontSize: 12, color: "#444" }}>
                {selectedFuero.icon} {selectedFuero.label}
              </span>
            </div>
            <ReportCard report={MOCK_REPORT} visible={showReport} />
          </div>
        )}
      </div>
    </div>
  );
}
