// src/scenes/HRP/Employees/Employees.jsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../../contexts/AuthContext";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/* =========================================================================================
   Brand Styles (Light + Dark) — matches GoodsIn design system
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

  .r-card{
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow);
    overflow: visible;
    color: var(--text2);
  }

  .r-head{
    padding: 20px 24px;
    display:flex;
    flex-wrap:wrap;
    gap:16px;
    align-items:center;
    justify-content:space-between;
    border-bottom:1px solid var(--border);
    background: ${isDark ? "rgba(99,102,241,0.02)" : "rgba(99,102,241,0.01)"};
  }

  .r-title{
    margin:0;
    font-weight:700;
    color:var(--text);
    font-size:24px;
    letter-spacing:-0.02em;
    line-height:1.2;
  }

  .r-sub{
    margin:4px 0 0 0;
    color:var(--muted);
    font-size:14px;
    font-weight:500;
  }

  .r-pill{
    font-size:13px;
    font-weight:700;
    color:var(--primary);
    background: var(--chip);
    padding:4px 12px;
    border-radius:6px;
  }

  .r-flex{ display:flex; align-items:center; gap:12px; }

  .r-btn-ghost{
    display:inline-flex;
    align-items:center;
    gap:8px;
    padding:10px 16px;
    font-weight:600;
    font-size:14px;
    color:var(--text);
    border:1px solid var(--border);
    border-radius:8px;
    background: var(--card);
    cursor:pointer;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
  }
  .r-btn-ghost:hover{
    background: var(--hover);
    border-color: var(--primary-light);
    transform: translateY(-1px);
    box-shadow: var(--shadow);
  }
  .r-btn-ghost:active{ transform: translateY(0); }

  .r-btn-primary{
    padding:10px 20px;
    font-weight:600;
    font-size:14px;
    color:#fff;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    border:0;
    border-radius:8px;
    box-shadow: 0 4px 6px -1px rgba(99,102,241,0.3), 0 2px 4px -1px rgba(99,102,241,0.2);
    cursor:pointer;
    transition: all 0.2s ease;
    display:inline-flex;
    align-items:center;
    gap:8px;
  }
  .r-btn-primary:hover{
    background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
    transform: translateY(-1px);
    box-shadow: 0 6px 10px -1px rgba(99,102,241,0.4), 0 4px 6px -1px rgba(99,102,241,0.3);
  }
  .r-btn-primary:active{ transform: translateY(0); }

  .r-btn-danger{
    background: linear-gradient(135deg, var(--danger) 0%, var(--danger2) 100%);
    box-shadow: 0 4px 6px -1px rgba(239,68,68,0.3), 0 2px 4px -1px rgba(239,68,68,0.2);
  }
  .r-btn-danger:hover{
    background: linear-gradient(135deg, #f87171 0%, var(--danger) 100%);
    box-shadow: 0 6px 10px -1px rgba(239,68,68,0.4), 0 4px 6px -1px rgba(239,68,68,0.3);
  }

  .r-table-wrap{ overflow-x:auto; background: var(--card); }
  table.r-table{
    width:100%;
    table-layout:auto;
    border-collapse:separate;
    border-spacing:0;
    font-size:14px;
    color:var(--text2);
  }
  .r-thead{
    background: var(--thead);
    text-transform:uppercase;
    letter-spacing:0.05em;
    font-size:11px;
    font-weight:700;
    color:var(--muted);
  }
  .r-thead th{
    padding:16px 16px;
    text-align:left;
    white-space:nowrap;
    border-bottom:2px solid var(--border);
    font-weight:700;
  }
  .r-row{ border-bottom:1px solid var(--border); transition: all 0.15s ease; }
  .r-row:hover{ background: var(--hover); }
  .r-td{
    padding:16px;
    overflow:hidden;
    text-overflow:ellipsis;
    white-space:nowrap;
    border-bottom:1px solid var(--border);
    font-size:14px;
  }
  .r-td--name{ font-weight:700; color: var(--text); }

  .r-chk{ width:18px; height:18px; accent-color: var(--primary); cursor:pointer; }

  .r-actions{ text-align:right; white-space:nowrap; }

  .r-toolbar{
    background: var(--card2);
    padding: 16px 20px;
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: var(--shadow-sm);
    display:flex;
    flex-wrap:wrap;
    gap:12px;
    align-items:center;
    color: var(--text2);
    margin: 16px 24px 0;
  }
  .r-input{
    min-width:280px;
    flex:1;
    padding:11px 14px;
    border:1px solid var(--border);
    border-radius:8px;
    outline:none;
    background: ${isDark ? "rgba(255,255,255,0.04)" : "#fff"};
    color: var(--text);
    font-size:14px;
    font-weight:500;
    transition: all 0.2s ease;
  }
  .r-input::placeholder{ color: var(--muted); }
  .r-input:focus{
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    background: var(--card);
  }

  .r-footer{
    padding:16px 24px;
    border-top:1px solid var(--border);
    display:flex;
    align-items:center;
    justify-content:space-between;
    background: ${isDark ? "rgba(99,102,241,0.02)" : "rgba(99,102,241,0.01)"};
    color: var(--text2);
    font-size:14px;
    font-weight:500;
  }
  .r-muted{ color: var(--muted); font-size:13px; font-weight:500; }

  /* Modal */
  .r-modal-dim{
    position:fixed;
    inset:0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    display:flex;
    align-items:center;
    justify-content:center;
    z-index: 9999;
    padding:20px;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }

  .r-modal{
    background: var(--card);
    border-radius:16px;
    width:100%;
    max-width:920px;
    max-height:90vh;
    overflow:hidden;
    box-shadow: var(--shadow-lg);
    display:flex;
    flex-direction:column;
    z-index:10000;
    border:1px solid var(--border);
    animation: slideUp 0.3s ease;
  }
  @keyframes slideUp{
    from{ opacity:0; transform: translateY(20px); }
    to{ opacity:1; transform: translateY(0); }
  }

  .r-mhdr{
    padding:20px 24px;
    border-bottom:1px solid var(--border);
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:16px;
    flex-wrap:wrap;
    background: ${isDark ? "rgba(99,102,241,0.03)" : "rgba(99,102,241,0.02)"};
  }
  .r-mbody{
    padding:24px;
    overflow:auto;
    background: var(--card);
    color: var(--text2);
  }
  .r-mfooter{
    padding:16px 24px;
    border-top:1px solid var(--border);
    background: ${isDark ? "rgba(99,102,241,0.02)" : "rgba(99,102,241,0.01)"};
    display:flex;
    justify-content:flex-end;
    gap:12px;
  }

  /* Form grid (GoodsIn-like) */
  .ag-grid{ display:grid; gap:16px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .ag-field{ grid-column: span 2; }
  .ag-field-1{ grid-column: span 1; }
  .ag-field-4{ grid-column: span 4; }

  .ag-label{
    font-size:13px;
    color: var(--text);
    font-weight:600;
    margin-bottom:8px;
    display:block;
    letter-spacing:-0.01em;
  }

  .ag-input, .ag-select, .ag-textarea{
    width:100%;
    padding:11px 14px;
    border:1px solid var(--border);
    border-radius:8px;
    outline:none;
    background: ${isDark ? "rgba(255,255,255,0.04)" : "#fff"};
    color: var(--text);
    font-size:14px;
    font-weight:500;
    transition: all 0.2s ease;
  }
  .ag-textarea{ min-height:100px; resize:vertical; }
  .ag-input::placeholder{ color: var(--muted); }
  .ag-input:focus, .ag-select:focus, .ag-textarea:focus{
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
    background: var(--card);
  }

  /* Small selected pill group */
  .sel-pill{
    display:inline-flex;
    align-items:center;
    gap:10px;
    padding:6px 10px;
    border-radius:10px;
    background: ${isDark ? "rgba(124,58,237,0.12)" : "#eef2ff"};
    border: 1px solid ${isDark ? "rgba(124,58,237,0.25)" : "transparent"};
  }

  /* responsive: stack grid fields */
  @media (max-width: 900px){
    .ag-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ag-field, .ag-field-4{ grid-column: span 2; }
    .ag-field-1{ grid-column: span 1; }
  }
  @media (max-width: 560px){
    .ag-grid{ grid-template-columns: 1fr; }
    .ag-field, .ag-field-4, .ag-field-1{ grid-column: span 1; }
    .r-toolbar{ margin: 16px 16px 0; }
    .r-head{ padding: 16px; }
    .r-footer{ padding: 14px 16px; }
  }
`}</style>
);

/* ---------------- Icons (inline SVG) ---------------- */
const Svg = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" {...p} />
);

const EditIcon = (props) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </Svg>
);

const TrashIcon = (props) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);

const PlusIcon = (props) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

/* =========================================================================================
   Portal helper
   ========================================================================================= */
const Portal = ({ children }) => {
  if (typeof window === "undefined") return null;
  return createPortal(children, document.body);
};

/* ---------------- Modal for Add/Edit Employee ---------------- */
const EmployeeModal = ({ open, onClose, onSave, initial, isDark }) => {
  const [form, setForm] = useState(initial || null);
  const isEdit = Boolean(initial?.id);

  useEffect(() => {
    if (open) {
      setForm(
        initial || {
          id: null,
          full_name: "",
          short_name: "",
          email: "",
          phone: "",
          title: "",
          employment_type: "full_time",
          status: "active",
          start_date: "",
          probation_end: "",
          default_role_name: "",
          pay_type: "hourly",
          hourly_rate: "",
          salary_amount: "",
          notes: "",
        }
      );
    }
  }, [open, initial]);

  if (!open || !form) return null;

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const handleSubmit = () => onSave(form);
  const isSalary = form.pay_type === "salary";

  return (
    <Portal>
      <div className="r-modal-dim" onClick={onClose}>
        <div className="r-modal" onClick={(e) => e.stopPropagation()}>
          <div className="r-mhdr">
            <h3 className="r-title" style={{ fontSize: 18 }}>
              {isEdit ? "Edit Employee" : "Add Employee"}
            </h3>
            <button className="r-btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="r-mbody">
            <div className="ag-grid">
              <div className="ag-field">
                <label className="ag-label">Full Name</label>
                <input
                  className="ag-input"
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setField("full_name", e.target.value)}
                />
              </div>

              <div className="ag-field">
                <label className="ag-label">Short Name (Roster label)</label>
                <input
                  className="ag-input"
                  type="text"
                  value={form.short_name || ""}
                  onChange={(e) => setField("short_name", e.target.value)}
                  placeholder="e.g. Conor S."
                />
              </div>

              <div className="ag-field">
                <label className="ag-label">Email</label>
                <input
                  className="ag-input"
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>

              <div className="ag-field">
                <label className="ag-label">Phone</label>
                <input
                  className="ag-input"
                  type="tel"
                  value={form.phone || ""}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </div>

              <div className="ag-field">
                <label className="ag-label">Title</label>
                <input
                  className="ag-input"
                  type="text"
                  value={form.title || ""}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder="e.g. Operations Manager"
                />
              </div>

              <div className="ag-field">
                <label className="ag-label">Employment Type</label>
                <select
                  className="ag-select"
                  value={form.employment_type || "full_time"}
                  onChange={(e) => setField("employment_type", e.target.value)}
                >
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="casual">Casual</option>
                  <option value="contractor">Contractor</option>
                </select>
              </div>

              <div className="ag-field">
                <label className="ag-label">Status</label>
                <select
                  className="ag-select"
                  value={form.status || "active"}
                  onChange={(e) => setField("status", e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="on_leave">On leave</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>

              <div className="ag-field">
                <label className="ag-label">Pay Type</label>
                <select
                  className="ag-select"
                  value={form.pay_type || "hourly"}
                  onChange={(e) => setField("pay_type", e.target.value)}
                >
                  <option value="hourly">Hourly</option>
                  <option value="salary">Salary</option>
                </select>
              </div>

              <div className="ag-field">
                <label className="ag-label">Start Date</label>
                <input
                  className="ag-input"
                  type="date"
                  value={form.start_date || ""}
                  onChange={(e) => setField("start_date", e.target.value)}
                />
              </div>

              <div className="ag-field">
                <label className="ag-label">Probation End</label>
                <input
                  className="ag-input"
                  type="date"
                  value={form.probation_end || ""}
                  onChange={(e) => setField("probation_end", e.target.value)}
                />
              </div>

              <div className="ag-field">
                <label className="ag-label">{isSalary ? "Annual Salary (€)" : "Hourly Rate (€)"}</label>
                <input
                  className="ag-input"
                  type="number"
                  step="0.01"
                  value={isSalary ? form.salary_amount ?? "" : form.hourly_rate ?? ""}
                  onChange={(e) => {
                    const v = e.target.value === "" ? "" : parseFloat(e.target.value);
                    if (isSalary) setField("salary_amount", v);
                    else setField("hourly_rate", v);
                  }}
                />
              </div>

              <div className="ag-field-4">
                <label className="ag-label">Notes</label>
                <textarea
                  className="ag-textarea"
                  value={form.notes || ""}
                  onChange={(e) => setField("notes", e.target.value)}
                  placeholder="Any notes about this employee..."
                />
              </div>
            </div>
          </div>

          <div className="r-mfooter">
            <button className="r-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="r-btn-primary" onClick={handleSubmit}>
              {isEdit ? "Save Changes" : "Create Employee"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

/* ---------------- Delete Confirm Modal ---------------- */
const DeleteConfirmModal = ({ open, count, onClose, onConfirm, isDark }) => {
  if (!open || count === 0) return null;
  return (
    <Portal>
      <div className="r-modal-dim" onClick={onClose}>
        <div className="r-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
          <div className="r-mhdr">
            <h3 className="r-title" style={{ fontSize: 18 }}>
              Confirm Deletion
            </h3>
            <button className="r-btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="r-mbody" style={{ textAlign: "center" }}>
            <div
              style={{
                width: 60,
                height: 60,
                margin: "0 auto",
                borderRadius: 999,
                background: isDark ? "rgba(220,38,38,0.18)" : "#fee2e2",
                border: `1px solid ${isDark ? "rgba(220,38,38,0.35)" : "transparent"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isDark ? "#fecaca" : "#dc2626",
              }}
            >
              <TrashIcon />
            </div>

            <h3
              style={{
                fontWeight: 900,
                color: isDark ? "#e5e7eb" : "#0f172a",
                marginTop: 12,
                fontSize: 18,
              }}
            >
              Delete {count} employee{count > 1 ? "s" : ""}?
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
    </Portal>
  );
};

/* ---------------- Main Employees Component ---------------- */
const Employees = () => {
  const { cognitoId } = useAuth();

  // Theme (sync with Topbar)
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme-mode") === "dark");
  useEffect(() => {
    const onThemeChanged = () => setIsDark(localStorage.getItem("theme-mode") === "dark");
    window.addEventListener("themeChanged", onThemeChanged);
    return () => window.removeEventListener("themeChanged", onThemeChanged);
  }, []);

  // employees state
  const [employees, setEmployees] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const selectAllCheckboxRef = useRef(null);

  const fetchEmployees = useCallback(async () => {
    if (!cognitoId) return;
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch(`${API_BASE}/employees/list?cognito_id=${encodeURIComponent(cognitoId)}`);
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Failed to fetch employees (status ${res.status})`);
      }
      const data = await res.json();
      const list = (Array.isArray(data) ? data : []).map((e) => ({
        id: e.id,
        full_name: e.full_name,
        short_name: e.short_name,
        email: e.email,
        phone: e.phone,
        title: e.title,
        employment_type: e.employment_type,
        status: e.status,
        start_date: e.start_date,
        probation_end: e.probation_end,
        pay_type: e.pay_type,
        hourly_rate: e.pay_type === "salary" ? null : e.hourly_rate,
        salary_amount: e.pay_type === "salary" ? e.hourly_rate : null,
        notes: e.notes,
      }));
      setEmployees(list);
    } catch (err) {
      console.error("[Employees] fetch error:", err);
      setApiError("Could not load employees. Please try again.");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [cognitoId]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.full_name, e.short_name, e.title, e.email, e.phone, e.employment_type, e.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [employees, search]);

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate =
        selectedIds.size > 0 && selectedIds.size < filtered.length;
    }
  }, [selectedIds, filtered]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = (checked) => {
    if (checked) setSelectedIds(new Set(filtered.map((e) => e.id)));
    else setSelectedIds(new Set());
  };

  const openAddModal = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (employee) => {
    setEditing(employee);
    setModalOpen(true);
  };

  const saveEmployee = async (form) => {
    if (!cognitoId) return;
    try {
      const isSalary = form.pay_type === "salary";
      const hourlyOrSalary = isSalary
        ? form.salary_amount === "" || form.salary_amount == null
          ? null
          : Number(form.salary_amount)
        : form.hourly_rate === "" || form.hourly_rate == null
        ? null
        : Number(form.hourly_rate);

      const payload = {
        cognito_id: cognitoId,
        full_name: form.full_name,
        short_name: form.short_name,
        email: form.email,
        phone: form.phone,
        title: form.title,
        employment_type: form.employment_type,
        status: form.status,
        start_date: form.start_date || null,
        probation_end: form.probation_end || null,
        pay_type: form.pay_type,
        hourly_rate: hourlyOrSalary,
        notes: form.notes,
      };

      if (form.id) {
        const res = await fetch(`${API_BASE}/employees/${encodeURIComponent(form.id)}/update`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Update failed");
        }
      } else {
        const res = await fetch(`${API_BASE}/employees/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Create failed");
        }
      }

      setModalOpen(false);
      setEditing(null);
      await fetchEmployees();
    } catch (err) {
      console.error("[Employees] save error:", err);
      alert(err?.message || "Could not save employee.");
    }
  };

  const confirmDelete = async () => {
    if (!cognitoId) return;
    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        const res = await fetch(
          `${API_BASE}/employees/${encodeURIComponent(id)}/delete?cognito_id=${encodeURIComponent(cognitoId)}`,
          { method: "DELETE" }
        );
        if (!res.ok) console.warn("Delete failed for employee", id);
      }
      setDeleteOpen(false);
      setSelectedIds(new Set());
      await fetchEmployees();
    } catch (err) {
      console.error("[Employees] delete error:", err);
      alert("Could not delete employees.");
    }
  };

  const numSelected = selectedIds.size;
  const allVisibleSelected = filtered.length > 0 && filtered.every((e) => selectedIds.has(e.id));

  const dangerCardStyle = {
    borderColor: isDark ? "rgba(220,38,38,0.55)" : "#fecaca",
    background: isDark ? "rgba(220,38,38,0.12)" : "#fff1f2",
    color: isDark ? "#fecaca" : "#b91c1c",
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    border: `1px solid ${isDark ? "rgba(220,38,38,0.55)" : "#fecaca"}`,
  };

  return (
    <div className="r-wrap">
      <BrandStyles isDark={isDark} />

      {!cognitoId && (
        <div style={dangerCardStyle}>
          <strong>Can’t load data:</strong> No cognito_id detected.
        </div>
      )}

      <div className="r-card">
        {/* Header */}
        <div className="r-head">
          <div>
            <h2 className="r-title">Employees</h2>
            <p className="r-sub">Manage your team and roster-ready profiles.</p>
          </div>

          <div className="r-flex">
            {numSelected > 0 && (
              <div className="sel-pill">
                <span className="r-pill">{numSelected} selected</span>
                <button
                  className="r-btn-ghost"
                  onClick={() => setDeleteOpen(true)}
                  aria-label="Delete selected"
                  title="Delete selected"
                  style={{
                    color: isDark ? "#fecaca" : "#dc2626",
                    borderColor: isDark ? "rgba(220,38,38,0.35)" : "#fecaca",
                    padding: "10px 14px",
                  }}
                >
                  <TrashIcon />
                  Delete
                </button>
              </div>
            )}

            <button className="r-btn-primary" onClick={openAddModal}>
              <PlusIcon /> Add Employee
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="r-toolbar">
          <input
            className="r-input"
            type="text"
            placeholder="Search by name, title, email, status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {loading && <span className="r-muted">Loading employees…</span>}
          {apiError && !loading && (
            <span className="r-muted" style={{ color: isDark ? "#fecaca" : "#b91c1c" }}>
              {apiError}
            </span>
          )}
        </div>

        {/* Table */}
        <div className="r-table-wrap" style={{ marginTop: 16 }}>
          <table className="r-table">
            <thead className="r-thead">
              <tr>
                <th className="r-td" style={{ width: 40 }}>
                  <input
                    ref={selectAllCheckboxRef}
                    className="r-chk"
                    type="checkbox"
                    onChange={(e) => selectAll(e.target.checked)}
                    checked={allVisibleSelected}
                  />
                </th>
                <th className="r-td">Name</th>
                <th className="r-td">Title</th>
                <th className="r-td">Employment</th>
                <th className="r-td">Status</th>
                <th className="r-td">Start Date</th>
                <th className="r-td">Contact</th>
                <th className="r-td r-actions">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="r-row">
                  <td className="r-td">
                    <input
                      className="r-chk"
                      type="checkbox"
                      checked={selectedIds.has(e.id)}
                      onChange={() => toggleSelect(e.id)}
                    />
                  </td>

                  <td className="r-td r-td--name" title={e.full_name}>
                    {e.full_name}
                    {e.short_name ? <span className="r-muted"> · {e.short_name}</span> : null}
                  </td>

                  <td className="r-td" title={e.title || ""}>{e.title || "—"}</td>

                  <td className="r-td" title={e.employment_type || ""}>
                    {e.employment_type ? String(e.employment_type).replace("_", " ") : "—"}
                  </td>

                  <td className="r-td" title={e.status || ""}>
                    {e.status ? String(e.status).replace("_", " ") : "—"}
                  </td>

                  <td className="r-td">{e.start_date || "—"}</td>

                  <td className="r-td" title={`${e.email || ""} ${e.phone || ""}`.trim()}>
                    {e.email || "—"}
                    <br />
                    <span className="r-muted">{e.phone || ""}</span>
                  </td>

                  <td className="r-td r-actions">
                    <button className="r-btn-ghost" onClick={() => openEditModal(e)}>
                      <EditIcon /> Edit
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && !loading && (
                <tr className="r-row">
                  <td className="r-td" colSpan={8} style={{ textAlign: "center" }}>
                    <span className="r-muted">
                      {search ? "No employees match your search." : "No employees yet."}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="r-footer">
          <span className="r-muted">
            Showing <strong>{filtered.length}</strong> employee{filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Modals */}
      <EmployeeModal
        open={modalOpen}
        isDark={isDark}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={saveEmployee}
        initial={editing}
      />

      <DeleteConfirmModal
        open={deleteOpen}
        isDark={isDark}
        count={selectedIds.size}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Employees;
