// src/scenes/usage/StockUsage.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";

/* ===== API ===== */
const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/* ---------------- Shared brand styles copied from Recipes ---------------- */
const BrandStyles = () => (
  <style>{`
  .r-wrap { padding: 20px; }
  .r-card {
    background:#fff; border:1px solid #e5e7eb; border-radius:16px;
    box-shadow:0 1px 2px rgba(16,24,40,0.06),0 1px 3px rgba(16,24,40,0.08);
    overflow:hidden;
  }
  .r-head { padding:16px; display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between; border-bottom:1px solid #e5e7eb; }
  .r-title { margin:0; font-weight:800; color:#0f172a; font-size:18px; }
  .r-pill { font-size:12px; font-weight:800; color:#7C3AED; }
  .r-btn-icon { border:0; background:transparent; cursor:pointer; padding:8px; border-radius:999px; color:#dc2626; }
  .r-btn-icon:hover { background:#fee2e2; }

  .r-actions-right { display:flex; align-items:center; gap:10px; }
  .r-btn-add {
    display:inline-flex; align-items:center; gap:8px; padding:10px 16px; font-weight:800; color:#fff;
    background:linear-gradient(180deg, #6366f1, #7c3aed); border:0; border-radius:999px;
    box-shadow:0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06); cursor:pointer;
  }
  .r-btn-add:hover { filter:brightness(.95); }

  .r-table-wrap { overflow:auto; }
  table.r-table { width:100%; border-collapse:separate; border-spacing:0; font-size:14px; color:#334155; }
  .r-thead { background:#f8fafc; text-transform:uppercase; letter-spacing:.03em; font-size:12px; color:#64748b; }
  .r-thead th { padding:12px; text-align:left; }
  .r-row { border-bottom:1px solid #e5e7eb; transition: background .15s ease; }
  .r-row:hover { background:#f4f1ff; }
  .r-td { padding:12px; }
  .r-td--name { font-weight:800; color:#0f172a; white-space:nowrap; }
  .r-actions { text-align:center; }
  .r-chk { width:16px; height:16px; }
  .r-link { color:#7C3AED; font-weight:700; background:transparent; border:0; cursor:pointer; }
  .r-link:hover { color:#5B21B6; text-decoration:underline; }
  .r-btn-ghost {
    display:inline-flex; align-items:center; gap:8px; padding:8px 12px; font-weight:800; font-size:14px;
    color:#0f172a; border:1px solid #e5e7eb; border-radius:10px; background:#fff; cursor:pointer;
  }
  .r-btn-ghost:hover { background:#f4f1ff; }
  .r-btn-primary {
    padding:10px 16px; font-weight:800; color:#fff; background:#7C3AED; border:0; border-radius:10px;
    box-shadow:0 1px 2px rgba(16,24,40,0.06),0 1px 3px rgba(16,24,40,0.08); cursor:pointer;
  }
  .r-btn-primary:hover { background:#5B21B6; }
  .r-btn-danger { background:#dc2626; }
  .r-btn-danger:hover { background:#b91c1c; }
  .r-footer { padding:12px 16px; border-top:1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between; background:#fff; }

  /* Drawer (shared) */
  .r-dim { position:fixed; inset:0; background:rgba(0,0,0,.45); opacity:0; pointer-events:none; transition:opacity .2s; z-index:40; }
  .r-dim.open { opacity:1; pointer-events:auto; }
  .r-drawer {
    position:fixed; top:0; right:0; height:100%; width:100%; max-width:420px; background:#fff; box-shadow:-8px 0 24px rgba(2,6,23,.18);
    transform:translateX(100%); transition:transform .25s ease; z-index:50; display:flex; flex-direction:column;
  }
  .r-drawer.open { transform:translateX(0); }
  .r-dhdr {
    padding:16px; color:#fff; background:linear-gradient(135deg, #6366f1, #7C3AED); display:flex; align-items:center; justify-content:space-between;
  }
  .r-dhdr-title { margin:0; font-weight:900; font-size:18px; }
  .r-dhdr-sub { margin:0; font-size:12px; opacity:.92; }
  .r-dbody { padding:14px; background:#f1f5f9; overflow:auto; flex:1; }
  .r-summary { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:12px; box-shadow:0 1px 2px rgba(16,24,40,0.06); margin-bottom:10px; }
  .r-stat { text-align:right; }
  .r-filter { position:sticky; top:0; padding:8px 0; background:#f1f5f9; }
  .r-input { width:100%; padding:10px 12px; border:1px solid #e5e7eb; border-radius:10px; outline:none; background:#fff; }
  .r-input:focus { border-color:#7C3AED; box-shadow:0 0 0 4px rgba(124,58,237,.18); }
  .r-list { list-style:none; margin:10px 0 0; padding:0; display:grid; gap:8px; }
  .r-item { display:flex; align-items:center; justify-content:space-between; background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; }
  .r-chip { font-size:12px; font-weight:800; background:#f1f5f9; color:#334155; padding:4px 8px; border-radius:999px; }

  /* Toast */
  .su-toast {
    position: fixed; top: 16px; right: 16px; transform: translateY(-20px); opacity: 0;
    transition: all .2s ease; z-index: 60; pointer-events: none;
  }
  .su-toast.show { transform: translateY(0); opacity: 1; }
  .su-toast-inner {
    background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46;
    padding: 10px 12px; border-radius: 10px; font-weight: 700;
    box-shadow:0 1px 2px rgba(16,24,40,0.06),0 1px 3px rgba(16,24,40,0.08);
  }
  `}</style>
);

/* ---------------- Tiny Icons (inline SVG to avoid MUI) ---------------- */
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
  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 3000);
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
const UsageDrawer = ({ isOpen, onClose, header, meta, mode, items }) => {
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
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filenameBase = (meta?.recipe || meta?.batchCode || "stock-usage").replace(/\s+/g, "-").toLowerCase();
    a.download = `${filenameBase}-${(header || mode || "items").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className={`r-dim ${isOpen ? "open" : ""}`} onClick={onClose} />
      <div className={`r-drawer ${isOpen ? "open" : ""}`}>
        <div className="r-dhdr">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="r-badge"><MenuIcon /></span>
            <div>
              <h3 className="r-dhdr-title">{header || (mode === "barcodes" ? "Batchcodes" : "Ingredients")}</h3>
              <p className="r-dhdr-sub">
                {meta?.recipe ? `${meta.recipe} · ${meta?.date ?? ""}` : (meta?.batchCode || "")}
              </p>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="r-btn-ghost" onClick={exportCsv}><DownloadIcon /> Export</button>
            <button className="r-btn-ghost" onClick={onClose}><CloseIcon /> Close</button>
          </div>
        </div>

        <div className="r-dbody">
          <div className="r-summary" style={{ display:"flex", justifyContent:"space-between" }}>
            <div>
              <div className="r-muted" style={{ textTransform:"uppercase", fontWeight:800 }}>Source</div>
              <div className="r-strong">{meta?.recipe || "—"}</div>
              <div className="r-muted">Batch: {meta?.batchCode ?? "—"}</div>
            </div>
            <div className="r-stat">
              <div className="r-muted" style={{ textTransform:"uppercase", fontWeight:800 }}>Items</div>
              <div className="r-strong" style={{ color:"#7C3AED", fontSize:24 }}>{filtered.length}</div>
            </div>
          </div>

          <div className="r-filter">
            <input className="r-input" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Filter items..." />
          </div>

          <ul className="r-list">
            {filtered.map((it, i) => (
              <li key={i} className="r-item">
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span className="r-badge"><CheckIcon /></span>
                  <span className="r-strong" style={{ fontWeight:700 }}>{it.name}</span>
                </div>
                {/* ingredients show qty as chip; barcodes show value as muted text */}
                {mode === "ingredients" ? (
                  <span className="r-chip">{it.value}</span>
                ) : (
                  <span className="r-muted" style={{ wordBreak:"break-word" }}>{it.value}</span>
                )}
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="r-item" style={{ justifyContent:"center" }}>
                <span className="r-muted">No items found.</span>
              </li>
            )}
          </ul>
        </div>

        <div className="r-footer">
          <span className="r-muted">{filtered.length} items</span>
          <button className="r-btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </>
  );
};

/* ---------------- Delete Modal (shared look) ---------------- */
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, count }) => {
  if (!isOpen || count === 0) return null;
  return (
    <div className="r-modal-dim">
      <div className="r-modal" style={{ maxWidth: 420 }}>
        <div className="r-mhdr">
          <h2 className="r-title" style={{ fontSize: 18 }}>Confirm Deletion</h2>
          <button className="r-btn-ghost" onClick={onClose}><CloseIcon /> Close</button>
        </div>
        <div className="r-mbody" style={{ textAlign: "center" }}>
          <div className="r-badge" style={{ width: 52, height: 52, alignItems:"center", justifyContent:"center", background:"#fee2e2", color:"#dc2626", border:"none", margin:"0 auto" }}>
            <DeleteIcon />
          </div>
          <h3 className="r-strong" style={{ marginTop: 10, fontSize:18 }}>
            Delete {count} row{count>1?"s":""}?
          </h3>
          <p className="r-muted" style={{ marginTop: 6 }}>This action cannot be undone.</p>
        </div>
        <div className="r-mfooter" style={{ justifyContent:"flex-end" }}>
          <button className="r-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="r-btn-primary r-btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Main Component ---------------- */
const StockUsage = () => {
  const { cognitoId } = useAuth();

  const [rows, setRows] = useState([]);          // grouped usage rows shown in table
  const [selectedIds, setSelectedIds] = useState(new Set()); // table selections (group ids)

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
  const numSelected = selectedIds.size;
  const rowCount = rows.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = numSelected > 0 && numSelected < rowCount;
    }
  }, [numSelected, rowCount]);

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(new Set(rows.map((r) => r.id)));
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
  const closeDrawer = () => setDrawerOpen(false);

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
        const key = `${item.recipe_name}-${date}-${item.batchCode}`;

        if (!grouped[key]) {
          grouped[key] = {
            id: key,
            date,
            recipeName: item.recipe_name,
            batchCode: item.batchCode,
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
          const totalQuantity = ingredient.quantity * item.batchesProduced;
          const unit = ingredient.unit ?? ingredient.unit_name ?? ingredient.unitLabel ?? "";
          const unitSuffix = unit ? ` ${unit}` : "";
          grouped[key].ingredients.push(`${ingredient.ingredient_name}: ${totalQuantity}${unitSuffix}`);
          grouped[key].barcodes.push(`${ingredient.ingredient_name}: ${ingredient.ingredient_barcodes ?? ""}`);
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
        setToastMsg(flatSelectedUsageIds.length === 0 ? "Selected rows have no deletable IDs." : "No user id.");
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
      <BrandStyles />

      <div className="r-card">
        <div className="r-head">
          <h2 className="r-title">Stock Usage</h2>
          <div className="r-actions-right">
            {numSelected > 0 && (
              <div className="r-actions-right" style={{ background:"#eef2ff", padding:"6px 10px", borderRadius:10 }}>
                <span className="r-pill">{numSelected} selected</span>
                <button className="r-btn-icon" onClick={openDeletePrompt} aria-label="Delete selected">
                  <DeleteIcon />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="r-table-wrap">
          <table className="r-table">
            <thead className="r-thead">
              <tr>
                <th className="r-td">
                  <input
                    ref={selectAllRef}
                    className="r-chk"
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={rowCount > 0 && numSelected === rowCount}
                  />
                </th>
                <th className="r-td">Date</th>
                <th className="r-td">Recipe</th>
                <th className="r-td">Ingredients</th>
                <th className="r-td">Batch Code</th>
                <th className="r-td">Ingredient Batchcodes Used</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
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
              {rows.length === 0 && (
                <tr className="r-row">
                  <td className="r-td" colSpan={6} style={{ textAlign: "center" }}>
                    <span className="r-muted">No stock usage found.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
      />

      {/* Delete confirmation */}
      <DeleteConfirmationModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        count={selectedIds.size}
      />

      {/* Toast */}
      <Toast open={toastOpen} onClose={() => setToastOpen(false)}>{toastMsg}</Toast>
    </div>
  );
};

export default StockUsage;
