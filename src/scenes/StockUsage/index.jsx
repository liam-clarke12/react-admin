// src/scenes/usage/StockUsage.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";

/* ===== API ===== */
const API_BASE =
  "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/* =========================================================================================
   Brand Styles (Light + Dark) — MATCH GoodsIn
   - Reads localStorage('theme-mode') + listens for window 'themeChanged'
   ========================================================================================= */
const BrandStyles = ({ isDark }) => (
  <style>{`
  :root{
    --bg: ${isDark ? "#0a0f1e" : "#f8fafc"};
    --card: ${isDark ? "#151b2e" : "#ffffff"};
    --card2: ${isDark ? "#1a2033" : "#ffffff"};
    --mutedCard: ${isDark ? "rgba(255,255,255,0.03)" : "#f9fafb"};
    --border: ${isDark ? "#1e2942" : "#e2e8f0"};
    --text: ${isDark ? "#f1f5f9" : "#0f172a"};
    --text2: ${isDark ? "#cbd5e1" : "#475569"};
    --muted: ${isDark ? "#94a3b8" : "#64748b"};
    --hover: ${isDark ? "rgba(99,102,241,0.08)" : "#f0f4ff"};
    --thead: ${isDark ? "rgba(99,102,241,0.05)" : "#f8fafc"};
    --chip: ${isDark ? "rgba(99,102,241,0.12)" : "#eff6ff"};
    --monoBg: ${isDark ? "rgba(99,102,241,0.15)" : "#eef2ff"};
    --primary: #6366f1;
    --primary-light: #818cf8;
    --primary-dark: #4f46e5;
    --primary2: #4338ca;
    --success: #10b981;
    --success-light: #34d399;
    --warning: #f59e0b;
    --danger: #ef4444;
    --danger2: #dc2626;
    --shadow-sm: ${isDark ? "0 1px 2px rgba(0,0,0,0.3)" : "0 1px 2px rgba(0,0,0,0.04)"};
    --shadow: ${isDark ? "0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -1px rgba(0,0,0,0.2)" : "0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.04)"};
    --shadow-lg: ${isDark ? "0 20px 25px -5px rgba(0,0,0,0.4), 0 10px 10px -5px rgba(0,0,0,0.3)" : "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"};
  }

  * { transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease; }

  .r-wrap { 
    padding: 24px; 
    background: var(--bg); 
    min-height: calc(100vh - 0px);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  }
  
  .r-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow);
    overflow: visible;
    color: var(--text2);
  }
  
  .r-head { 
    padding: 20px 24px; 
    display: flex; 
    flex-wrap: wrap; 
    gap: 16px; 
    align-items: center; 
    justify-content: space-between; 
    border-bottom: 1px solid var(--border);
    background: ${isDark ? "rgba(99,102,241,0.02)" : "rgba(99,102,241,0.01)"};
  }
  
  .r-title { 
    margin: 0; 
    font-weight: 700; 
    color: var(--text); 
    font-size: 24px;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }
  
  .r-sub { 
    margin: 4px 0 0 0; 
    color: var(--muted); 
    font-size: 14px;
    font-weight: 500;
  }
  
  .r-pill { 
    font-size: 13px; 
    font-weight: 700; 
    color: var(--primary);
    background: var(--chip);
    padding: 4px 12px;
    border-radius: 6px;
  }
  
  .r-flex { 
    display: flex; 
    align-items: center; 
    gap: 12px; 
  }

  .r-btn-ghost {
    display: inline-flex; 
    align-items: center; 
    gap: 8px; 
    padding: 10px 16px; 
    font-weight: 600; 
    font-size: 14px;
    color: var(--text); 
    border: 1px solid var(--border); 
    border-radius: 8px; 
    background: var(--card); 
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
  }
  .r-btn-ghost:hover { 
    background: var(--hover);
    border-color: var(--primary-light);
    transform: translateY(-1px);
    box-shadow: var(--shadow);
  }
  .r-btn-ghost:active { transform: translateY(0); }

  .r-btn-primary {
    padding: 10px 20px; 
    font-weight: 600; 
    font-size: 14px;
    color: #fff; 
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    border: 0; 
    border-radius: 8px;
    box-shadow: 0 4px 6px -1px rgba(99,102,241,0.3), 0 2px 4px -1px rgba(99,102,241,0.2);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .r-btn-primary:hover { 
    background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 10px -1px rgba(99,102,241,0.4), 0 4px 6px -1px rgba(99,102,241,0.3);
  }
  .r-btn-primary:active { transform: translateY(0); }

  .r-btn-danger { 
    background: linear-gradient(135deg, var(--danger) 0%, var(--danger2) 100%);
    box-shadow: 0 4px 6px -1px rgba(239,68,68,0.3), 0 2px 4px -1px rgba(239,68,68,0.2);
  }
  .r-btn-danger:hover { 
    background: linear-gradient(135deg, #f87171 0%, var(--danger) 100%);
    box-shadow: 0 6px 10px -1px rgba(239,68,68,0.4), 0 4px 6px -1px rgba(239,68,68,0.3);
  }

  /* Table */
  .r-table-wrap { overflow-x: auto; background: var(--card); }
  table.r-table { width: 100%; table-layout: auto; border-collapse: separate; border-spacing: 0; font-size: 14px; color: var(--text2); }
  .r-thead { background: var(--thead); text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px; font-weight: 700; color: var(--muted); }
  .r-thead th { padding: 16px 16px; text-align: left; white-space: nowrap; border-bottom: 2px solid var(--border); font-weight: 700; }
  .r-row { border-bottom: 1px solid var(--border); transition: all 0.15s ease; }
  .r-row:hover { background: var(--hover); }
  .r-td { padding: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border-bottom: 1px solid var(--border); font-size: 14px; }
  .r-td--name { font-weight: 700; color: var(--text); }
  .r-actions { text-align: right; }
  .r-chk { width: 18px; height: 18px; accent-color: var(--primary); cursor: pointer; }

  /* Toolbar (search) */
  .r-toolbar {
    background: var(--card2);
    padding: 16px 20px;
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    color: var(--text2);
    margin: 20px 24px 0 24px;
  }
  .r-input {
    min-width: 280px;
    flex: 1;
    padding: 11px 14px;
    border: 1px solid var(--border);
    border-radius: 8px;
    outline: none;
    background: ${isDark ? "rgba(255,255,255,0.04)" : "#fff"};
    color: var(--text);
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  .r-input::placeholder { color: var(--muted); }
  .r-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); background: var(--card); }

  /* Footer */
  .r-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: ${isDark ? "rgba(99,102,241,0.02)" : "rgba(99,102,241,0.01)"};
    color: var(--text2);
    font-size: 14px;
    font-weight: 500;
  }
  .r-muted { color: var(--muted); font-size: 13px; font-weight: 500; }

  /* Link-style button */
  .r-link {
    color: var(--primary);
    font-weight: 700;
    background: transparent;
    border: 0;
    cursor: pointer;
    padding: 0;
  }
  .r-link:hover { color: var(--primary2); text-decoration: underline; }

  /* Drawer (styled to match GoodsIn vibe) */
  .r-dim {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    opacity: 0;
    pointer-events: none;
    transition: opacity .2s ease;
    z-index: 9990;
  }
  .r-dim.open { opacity: 1; pointer-events: auto; }

  .r-drawer {
    position: fixed;
    top: 0; right: 0;
    height: 100%;
    width: 100%;
    max-width: 440px;
    background: var(--card);
    box-shadow: var(--shadow-lg);
    transform: translateX(100%);
    transition: transform .25s ease;
    z-index: 9995;
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--border);
  }
  .r-drawer.open { transform: translateX(0); }

  .r-dhdr {
    padding: 18px 18px;
    border-bottom: 1px solid var(--border);
    background: ${isDark ? "rgba(99,102,241,0.03)" : "rgba(99,102,241,0.02)"};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .r-dhdr-title { margin: 0; font-weight: 800; color: var(--text); font-size: 16px; letter-spacing: -0.01em; }
  .r-dhdr-sub { margin: 4px 0 0 0; font-size: 12px; color: var(--muted); font-weight: 600; }

  .r-dbody {
    padding: 16px 18px;
    overflow: auto;
    background: var(--mutedCard);
    flex: 1;
  }

  .r-summary {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 14px;
    box-shadow: var(--shadow-sm);
    margin-bottom: 12px;
    color: var(--text2);
  }

  .r-stat { text-align: right; }
  .r-strong { color: var(--text); font-weight: 800; }

  .r-filter { position: sticky; top: 0; padding: 8px 0 10px 0; background: var(--mutedCard); z-index: 1; }

  .r-list { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 10px; }
  .r-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 14px;
    color: var(--text2);
    box-shadow: var(--shadow-sm);
  }

  .r-chip {
    font-size: 12px;
    font-weight: 800;
    background: var(--chip);
    color: var(--primary);
    padding: 4px 10px;
    border-radius: 999px;
    white-space: nowrap;
  }

  .r-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px; height: 32px;
    border-radius: 999px;
    background: var(--monoBg);
    color: var(--primary);
    border: 1px solid ${isDark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.18)"};
    flex: 0 0 auto;
  }

  /* Modal (for DeleteConfirmationModal) */
  .r-modal-dim { 
    position: fixed; 
    inset: 0; 
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    display: flex; 
    align-items: center; 
    justify-content: center; 
    z-index: 10000; 
    padding: 20px;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .r-modal { 
    background: var(--card); 
    border-radius: 16px; 
    width: 100%; 
    max-height: 90vh; 
    overflow: hidden; 
    box-shadow: var(--shadow-lg);
    display: flex; 
    flex-direction: column; 
    z-index: 10001; 
    border: 1px solid var(--border);
    animation: slideUp 0.3s ease;
  }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  .r-mhdr { 
    padding: 20px 24px; 
    border-bottom: 1px solid var(--border); 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
    gap: 16px; 
    flex-wrap: wrap;
    background: ${isDark ? "rgba(99,102,241,0.03)" : "rgba(99,102,241,0.02)"};
  }
  .r-mbody { padding: 24px; overflow: auto; background: var(--card); color: var(--text2); }
  .r-mfooter { padding: 16px 24px; border-top: 1px solid var(--border); background: ${isDark ? "rgba(99,102,241,0.02)" : "rgba(99,102,241,0.01)"}; display: flex; justify-content: flex-end; gap: 12px; }

  /* Toast */
  .su-toast {
    position: fixed;
    top: 16px;
    right: 16px;
    transform: translateY(-20px);
    opacity: 0;
    transition: all .2s ease;
    z-index: 11000;
    pointer-events: none;
  }
  .su-toast.show { transform: translateY(0); opacity: 1; }
  .su-toast-inner {
    background: ${isDark ? "rgba(99,102,241,0.14)" : "#fff"};
    border: 1px solid ${isDark ? "rgba(99,102,241,0.25)" : "rgba(229,231,235,1)"};
    color: ${isDark ? "#e5e7eb" : "#0f172a"};
    padding: 10px 12px;
    border-radius: 12px;
    font-weight: 800;
    box-shadow: var(--shadow-lg);
  }
  `}</style>
);

/* ---------------- Tiny Icons (inline SVG) ---------------- */
const Svg = (p) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" {...p} />;
const DeleteIcon = (props) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);
const MenuIcon = (props) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
  </Svg>
);
const CloseIcon = (props) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);
const CheckIcon = (props) => (
  <Svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="20 6 9 17 4 12" />
  </Svg>
);
const DownloadIcon = (props) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </Svg>
);

/* ---------------- Toast ---------------- */
function Toast({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [open, onClose]);
  return (
    <div aria-live="polite" className={`su-toast ${open ? "show" : ""}`} role="status">
      <div className="su-toast-inner">{children}</div>
    </div>
  );
}

/* ---------------- Helpers ---------------- */
const formatToYYYYMMDD = (val) => {
  if (val === undefined || val === null) return "";
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  } catch (_) {}
  const s = String(val);
  const m = s.match(/\d{4}-\d{2}-\d{2}/);
  if (m) return m[0];
  return s.slice(0, 10);
};

/* ---------------- Drawer ---------------- */
const UsageDrawer = ({ isOpen, onClose, header, meta, mode, items, isDark }) => {
  const [q, setQ] = useState("");

  const parsed = useMemo(() => {
    // items is an array of strings like "Name: value"
    return (items || []).map((raw) => {
      if (typeof raw === "string" && raw.includes(":")) {
        const [left, right] = raw.split(":");
        return {
          name: (left || "").trim(),
          value: (right || "").trim(),
          full: raw.toLowerCase(),
        };
      }
      return { name: String(raw || ""), value: "", full: String(raw || "").toLowerCase() };
    });
  }, [items]);

  const filtered = useMemo(() => {
    const needle = (q || "").toLowerCase();
    return parsed.filter((it) => it.full.includes(needle));
  }, [parsed, q]);

  const exportCsv = () => {
    const rows = [["Item", "Value"]];
    (items || []).forEach((raw) => {
      if (typeof raw === "string" && raw.includes(":")) {
        const [l, r] = raw.split(":");
        rows.push([String(l).trim(), String(r || "").trim()]);
      } else {
        rows.push([String(raw || ""), ""]);
      }
    });
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filenameBase = (meta?.recipe || meta?.batchCode || "stock-usage")
      .replace(/\s+/g, "-")
      .toLowerCase();
    a.download = `${filenameBase}-${(header || mode || "items").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className={`r-dim ${isOpen ? "open" : ""}`} onClick={onClose} />
      <div className={`r-drawer ${isOpen ? "open" : ""}`} role="dialog" aria-modal="true">
        <div className="r-dhdr">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="r-badge">
              <MenuIcon />
            </span>
            <div>
              <h3 className="r-dhdr-title">
                {header || (mode === "barcodes" ? "Batchcodes" : "Ingredients")}
              </h3>
              <p className="r-dhdr-sub">
                {meta?.recipe ? `${meta.recipe} · ${meta?.date ?? ""}` : meta?.batchCode || ""}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="r-btn-ghost" onClick={exportCsv}>
              <DownloadIcon /> Export
            </button>
            <button className="r-btn-ghost" onClick={onClose}>
              <CloseIcon /> Close
            </button>
          </div>
        </div>

        <div className="r-dbody">
          <div className="r-summary" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div className="r-muted" style={{ textTransform: "uppercase", fontWeight: 800 }}>
                Source
              </div>
              <div className="r-strong">{meta?.recipe || "—"}</div>
              <div className="r-muted">Batch: {meta?.batchCode ?? "—"}</div>
            </div>
            <div className="r-stat">
              <div className="r-muted" style={{ textTransform: "uppercase", fontWeight: 800 }}>
                Items
              </div>
              <div className="r-strong" style={{ color: "var(--primary)", fontSize: 24 }}>
                {filtered.length}
              </div>
            </div>
          </div>

          <div className="r-filter">
            <input
              className="r-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter items..."
            />
          </div>

          <ul className="r-list">
            {filtered.map((it, i) => (
              <li key={i} className="r-item">
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span className="r-badge">
                    <CheckIcon />
                  </span>
                  <span className="r-strong" style={{ fontWeight: 800, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {it.name}
                  </span>
                </div>

                {mode === "ingredients" ? (
                  <span className="r-chip">{it.value}</span>
                ) : (
                  <span className="r-muted" style={{ wordBreak: "break-word", maxWidth: 180, textAlign: "right" }}>
                    {it.value}
                  </span>
                )}
              </li>
            ))}

            {filtered.length === 0 && (
              <li className="r-item" style={{ justifyContent: "center" }}>
                <span className="r-muted">No items found.</span>
              </li>
            )}
          </ul>
        </div>

        <div className="r-footer">
          <span className="r-muted">{filtered.length} items</span>
          <button className="r-btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </>
  );
};

/* ---------------- Delete Modal ---------------- */
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, count, isDark }) => {
  if (!isOpen || count === 0) return null;
  return (
    <div className="r-modal-dim">
      <div className="r-modal" style={{ maxWidth: 420 }}>
        <div className="r-mhdr">
          <h2 className="r-title" style={{ fontSize: 18 }}>
            Confirm Deletion
          </h2>
          <button className="r-btn-ghost" onClick={onClose}>
            <CloseIcon /> Close
          </button>
        </div>

        <div className="r-mbody" style={{ textAlign: "center" }}>
          <div
            className="r-flex"
            style={{
              width: 60,
              height: 60,
              margin: "0 auto",
              alignItems: "center",
              justifyContent: "center",
              background: isDark ? "rgba(220,38,38,0.18)" : "#fee2e2",
              color: isDark ? "#fecaca" : "#dc2626",
              borderRadius: 999,
              border: `1px solid ${isDark ? "rgba(220,38,38,0.35)" : "transparent"}`,
            }}
          >
            <DeleteIcon />
          </div>

          <h3
            style={{
              fontWeight: 900,
              color: isDark ? "#e5e7eb" : "#0f172a",
              marginTop: 10,
              fontSize: 18,
            }}
          >
            Delete {count} row{count > 1 ? "s" : ""}?
          </h3>
          <p className="r-muted" style={{ marginTop: 6 }}>
            This action cannot be undone.
          </p>
        </div>

        <div className="r-mfooter" style={{ justifyContent: "flex-end" }}>
          <button className="r-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="r-btn-primary r-btn-danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Main Component ---------------- */
const StockUsage = () => {
  // Theme (sync with Topbar)
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme-mode") === "dark");
  useEffect(() => {
    const onThemeChanged = () => setIsDark(localStorage.getItem("theme-mode") === "dark");
    window.addEventListener("themeChanged", onThemeChanged);
    return () => window.removeEventListener("themeChanged", onThemeChanged);
  }, []);

  const { cognitoId } = useAuth();

  const [rows, setRows] = useState([]); // grouped usage rows shown in table
  const [selectedIds, setSelectedIds] = useState(new Set()); // table selections (group ids)

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHeader, setDrawerHeader] = useState("");
  const [drawerMode, setDrawerMode] = useState("ingredients"); // 'ingredients' | 'barcodes'
  const [drawerItems, setDrawerItems] = useState([]);
  const [drawerMeta, setDrawerMeta] = useState(null);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // select-all checkbox ref to render indeterminate
  const selectAllRef = useRef(null);

  // filtered rows based on search
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.date, r.recipeName, r.batchCode, r.ingredients, r.barcodes].some((field) =>
        String(field ?? "").toLowerCase().includes(q)
      )
    );
  }, [rows, searchQuery]);

  const numSelected = selectedIds.size;
  const rowCount = filteredRows.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = numSelected > 0 && numSelected < rowCount;
    }
  }, [numSelected, rowCount]);

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(new Set(filteredRows.map((r) => r.id)));
    else setSelectedIds(new Set());
  };

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // flatten underlying stock_usage ids for selected groups
  const flatSelectedUsageIds = useMemo(() => {
    const map = new Map(rows.map((r) => [r.id, r]));
    const all = [];
    for (const id of selectedIds) {
      const r = map.get(id);
      if (r?.ids?.length) all.push(...r.ids);
    }
    return Array.from(new Set(all));
  }, [rows, selectedIds]);

  const openDrawer = (mode, list, meta) => {
    setDrawerMode(mode);
    setDrawerHeader(mode === "barcodes" ? "Batchcodes" : "Ingredients");
    // list can be string "name: x; name2: y" or array; normalize to array
    let items = [];
    if (Array.isArray(list)) items = list;
    else if (typeof list === "string") items = list.split("; ").filter(Boolean);
    setDrawerItems(items);
    setDrawerMeta(meta || null);
    setDrawerOpen(true);
  };

  const fetchStockUsage = useCallback(async () => {
    if (!cognitoId) return;
    try {
      const url = `${API_BASE}/stock-usage/${encodeURIComponent(cognitoId)}`;
      const response = await axios.get(url);
      if (!Array.isArray(response.data)) return;

      const grouped = {};
      response.data.forEach((item) => {
        const usageIds = item?.ids || item?.stock_usage_ids || [];
        const date = formatToYYYYMMDD(item.production_log_date ?? item.date ?? "");
        const recipeName = item.recipe_name ?? "";
        const batchCode = item.batchCode ?? "";
        const key = `${recipeName}-${date}-${batchCode}`;

        if (!grouped[key]) {
          grouped[key] = {
            id: key,
            date,
            recipeName,
            batchCode,
            batchesProduced: item.batchesProduced,
            ingredients: [],
            barcodes: [],
            ids: Array.isArray(usageIds) ? [...usageIds] : [],
          };
        } else {
          if (Array.isArray(usageIds)) grouped[key].ids.push(...usageIds);
        }

        if (!Array.isArray(item.ingredients)) return;
        item.ingredients.forEach((ingredient) => {
          const qty = Number(ingredient.quantity || 0);
          const produced = Number(item.batchesProduced || 0);
          const totalQuantity = qty * produced;

          const unit = ingredient.unit ?? ingredient.unit_name ?? ingredient.unitLabel ?? "";
          const unitSuffix = unit ? ` ${unit}` : "";
          grouped[key].ingredients.push(
            `${ingredient.ingredient_name}: ${totalQuantity}${unitSuffix}`
          );
          grouped[key].barcodes.push(
            `${ingredient.ingredient_name}: ${ingredient.ingredient_barcodes ?? ""}`
          );
        });
      });

      const formatted = Object.values(grouped).map((g) => ({
        ...g,
        ids: Array.from(new Set(g.ids)),
        ingredients: g.ingredients.join("; "),
        barcodes: g.barcodes.join("; "),
      }));

      setRows(formatted);
    } catch (e) {
      console.error("[StockUsage] fetch failed:", e);
    }
  }, [cognitoId]);

  useEffect(() => {
    fetchStockUsage();
  }, [fetchStockUsage]);

  const openDeletePrompt = () => {
    if (selectedIds.size === 0) return;
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (!cognitoId || flatSelectedUsageIds.length === 0) {
        setDeleteOpen(false);
        setToastMsg(
          flatSelectedUsageIds.length === 0
            ? "Selected rows have no deletable IDs."
            : "No user id."
        );
        setToastOpen(true);
        return;
      }
      const payload = { ids: flatSelectedUsageIds, cognito_id: cognitoId };
      const res = await axios.post(`${API_BASE}/stock-usage/delete`, payload);
      await fetchStockUsage();
      setSelectedIds(new Set());
      setDeleteOpen(false);
      setToastMsg(`Deleted ${res?.data?.deleted ?? flatSelectedUsageIds.length} usage row(s).`);
      setToastOpen(true);
    } catch (e) {
      console.error("[StockUsage] delete failed:", e);
      setDeleteOpen(false);
      setToastMsg("Delete failed. Please try again.");
      setToastOpen(true);
    }
  };

  return (
    <div className="r-wrap">
      <BrandStyles isDark={isDark} />

      <div className="r-card">
        <div className="r-head">
          <div>
            <h2 className="r-title">Stock Usage</h2>
            <p className="r-sub">View production runs and the ingredients/batchcodes consumed</p>
          </div>

          <div className="r-flex">
            {numSelected > 0 && (
              <div
                className="r-flex"
                style={{
                  background: isDark ? "rgba(124,58,237,0.12)" : "#eef2ff",
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: `1px solid ${isDark ? "rgba(124,58,237,0.25)" : "transparent"}`,
                }}
              >
                <span className="r-pill">{numSelected} selected</span>
                <button
                  className="r-btn-ghost"
                  onClick={openDeletePrompt}
                  aria-label="Delete selected"
                  title="Delete selected"
                  style={{
                    color: isDark ? "#fecaca" : "#dc2626",
                    borderColor: isDark ? "rgba(220,38,38,0.35)" : "#fecaca",
                  }}
                >
                  <DeleteIcon />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Toolbar (search) */}
        <div className="r-toolbar">
          <input
            className="r-input"
            type="text"
            placeholder="Search by recipe, date, batch code, ingredient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="r-table-wrap" style={{ marginTop: 16 }}>
          <table className="r-table">
            <thead className="r-thead">
              <tr>
                <th className="r-td" style={{ width: 40 }}>
                  <input
                    ref={selectAllRef}
                    className="r-chk"
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={rowCount > 0 && numSelected === rowCount}
                  />
                </th>
                <th className="r-td" style={{ width: 120 }}>Date</th>
                <th className="r-td" style={{ width: 220 }}>Recipe</th>
                <th className="r-td" style={{ width: 160 }}>Ingredients</th>
                <th className="r-td" style={{ width: 160 }}>Batch Code</th>
                <th className="r-td" style={{ width: 220 }}>Ingredient Batchcodes Used</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.id} className="r-row">
                  <td className="r-td">
                    <input
                      className="r-chk"
                      type="checkbox"
                      checked={selectedIds.has(r.id)}
                      onChange={() => toggleRow(r.id)}
                    />
                  </td>
                  <td className="r-td">{r.date}</td>
                  <td className="r-td r-td--name">{r.recipeName}</td>
                  <td className="r-td">
                    <button
                      className="r-link"
                      onClick={() =>
                        openDrawer("ingredients", r.ingredients, {
                          recipe: r.recipeName,
                          date: r.date,
                          batchCode: r.batchCode,
                        })
                      }
                    >
                      View Ingredients
                    </button>
                  </td>
                  <td className="r-td">{r.batchCode}</td>
                  <td className="r-td">
                    <button
                      className="r-link"
                      onClick={() =>
                        openDrawer("barcodes", r.barcodes, {
                          recipe: r.recipeName,
                          date: r.date,
                          batchCode: r.batchCode,
                        })
                      }
                    >
                      View Batchcodes
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr className="r-row">
                  <td className="r-td" colSpan={6} style={{ textAlign: "center" }}>
                    <span className="r-muted">No stock usage found.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="r-footer">
          <span className="r-muted">
            Showing <strong>{filteredRows.length}</strong> run{filteredRows.length === 1 ? "" : "s"}
          </span>
          <span className="r-muted">
            {numSelected > 0 ? (
              <>
                <strong>{numSelected}</strong> selected
              </>
            ) : (
              "Select rows to delete"
            )}
          </span>
        </div>
      </div>

      {/* Drawer */}
      <UsageDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        header={drawerHeader}
        mode={drawerMode}
        items={drawerItems}
        meta={drawerMeta}
        isDark={isDark}
      />

      {/* Delete confirmation */}
      <DeleteConfirmationModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        count={selectedIds.size}
        isDark={isDark}
      />

      {/* Toast */}
      <Toast open={toastOpen} onClose={() => setToastOpen(false)}>
        {toastMsg}
      </Toast>
    </div>
  );
};

export default StockUsage;
