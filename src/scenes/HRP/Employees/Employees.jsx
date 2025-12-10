
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useAuth } from "../../../contexts/AuthContext";

const API_BASE =
  "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/* ---------------- Shared brand styles (Nory style) ---------------- */
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
  .r-sub { margin:0; color:#64748b; font-size:12px; }
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
  .r-actions { text-align:right; white-space:nowrap; }
  .r-chk { width:16px; height:16px; }
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
  .r-muted { color:#64748b; font-size:12px; }

  .r-toolbar { padding:12px 16px; border-bottom:1px solid #e5e7eb; background:#fff; display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
  .r-input {
    min-width:220px; flex:1; padding:10px 12px; border:1px solid #e5e7eb; border-radius:10px; outline:none; background:#fff;
  }
  .r-input:focus { border-color:#7C3AED; box-shadow:0 0 0 4px rgba(124,58,237,.18); }

  /* Modal */
  .r-modal-dim { position:fixed; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; z-index:999; padding:16px;}
  .r-modal {
    background:#fff; border-radius:14px; width:100%; max-width:640px; max-height:90vh;
    overflow:hidden; box-shadow:0 10px 30px rgba(2,6,23,.22); display:flex; flex-direction:column;
  }
  .r-mhdr { padding:14px 16px; border-bottom:1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between; }
  .r-mbody { padding:16px; overflow-y:auto; background:#f8fafc; }
  .r-mfooter { padding:12px 16px; border-top:1px solid #e5e7eb; background:#f8fafc; display:flex; justify-content:flex-end; gap:10px; }

  .g-grid {
    display:grid;
    grid-template-columns:repeat(12, minmax(0, 1fr));
    gap:16px;
  }
  .col-12 { grid-column: span 12; }
  .col-6 { grid-column: span 6; }
  .col-4 { grid-column: span 4; }
  .col-3 { grid-column: span 3; }

  @media (max-width: 900px) {
    .col-6, .col-4, .col-3 { grid-column: span 12; }
  }

  .g-field { display:flex; flex-direction:column; }
  .g-label { font-size:13px; font-weight:600; color:#334155; margin-bottom:6px; }
  .g-input, .g-select, .g-textarea {
    background:#fff; border:1px solid #e5e7eb; border-radius:12px;
    padding:10px 12px; font-size:14px; outline:none;
  }
  .g-textarea { min-height:80px; resize:vertical; }
  .g-input:focus, .g-select:focus, .g-textarea:focus {
    border-color:#7C3AED; box-shadow:0 0 0 4px rgba(124,58,237,0.18);
  }
`}</style>
);

/* ---------------- Icons (inline SVG) ---------------- */
const Svg = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" {...p} />
);
const EditIcon = (props) => (
  <Svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </Svg>
);
const DeleteIcon = (props) => (
  <Svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);
const PlusIcon = (props) => (
  <Svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </Svg>
);

/* ---------------- Modal for Add/Edit Employee ---------------- */
const EmployeeModal = ({ open, onClose, onSave, initial }) => {
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
          employment_type: "full_time",
          status: "active",
          start_date: "",
          probation_end: "",
          default_role_name: "",
          hourly_rate: "",
          pay_type: "hourly",
          notes: "",
        }
      );
    }
  }, [open, initial]);

  if (!open || !form) return null;

  const setField = (k, v) =>
    setForm((prev) => ({
      ...prev,
      [k]: v,
    }));

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <div className="r-modal-dim">
      <div className="r-modal">
        <div className="r-mhdr">
          <h2 className="r-title" style={{ fontSize: 18 }}>
            {isEdit ? "Edit Employee" : "Add Employee"}
          </h2>
          <button className="r-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="r-mbody">
          <div className="g-grid">
            <div className="g-field col-6">
              <label className="g-label">Full Name</label>
              <input
                className="g-input"
                type="text"
                value={form.full_name}
                onChange={(e) => setField("full_name", e.target.value)}
              />
            </div>
            <div className="g-field col-6">
              <label className="g-label">Short Name (Roster label)</label>
              <input
                className="g-input"
                type="text"
                value={form.short_name || ""}
                onChange={(e) => setField("short_name", e.target.value)}
                placeholder="e.g. Conor S."
              />
            </div>

            <div className="g-field col-6">
              <label className="g-label">Email</label>
              <input
                className="g-input"
                type="email"
                value={form.email || ""}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>
            <div className="g-field col-6">
              <label className="g-label">Phone</label>
              <input
                className="g-input"
                type="tel"
                value={form.phone || ""}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </div>

            <div className="g-field col-4">
              <label className="g-label">Employment Type</label>
              <select
                className="g-select"
                value={form.employment_type || "full_time"}
                onChange={(e) => setField("employment_type", e.target.value)}
              >
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="casual">Casual</option>
                <option value="contractor">Contractor</option>
              </select>
            </div>
            <div className="g-field col-4">
              <label className="g-label">Status</label>
              <select
                className="g-select"
                value={form.status || "active"}
                onChange={(e) => setField("status", e.target.value)}
              >
                <option value="active">Active</option>
                <option value="on_leave">On leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            <div className="g-field col-4">
              <label className="g-label">Pay Type</label>
              <select
                className="g-select"
                value={form.pay_type || "hourly"}
                onChange={(e) => setField("pay_type", e.target.value)}
              >
                <option value="hourly">Hourly</option>
                <option value="salary">Salary</option>
              </select>
            </div>

            <div className="g-field col-4">
              <label className="g-label">Start Date</label>
              <input
                className="g-input"
                type="date"
                value={form.start_date || ""}
                onChange={(e) => setField("start_date", e.target.value)}
              />
            </div>
            <div className="g-field col-4">
              <label className="g-label">Probation End</label>
              <input
                className="g-input"
                type="date"
                value={form.probation_end || ""}
                onChange={(e) => setField("probation_end", e.target.value)}
              />
            </div>
            <div className="g-field col-4">
              <label className="g-label">Hourly Rate (€)</label>
              <input
                className="g-input"
                type="number"
                step="0.01"
                value={form.hourly_rate ?? ""}
                onChange={(e) =>
                  setField("hourly_rate", e.target.value === "" ? null : parseFloat(e.target.value))
                }
              />
            </div>

            <div className="g-field col-12">
              <label className="g-label">Notes</label>
              <textarea
                className="g-textarea"
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
  );
};

/* ---------------- Delete Confirm Modal ---------------- */
const DeleteConfirmModal = ({ open, count, onClose, onConfirm }) => {
  if (!open || count === 0) return null;
  return (
    <div className="r-modal-dim">
      <div className="r-modal" style={{ maxWidth: 420 }}>
        <div className="r-mhdr">
          <h2 className="r-title" style={{ fontSize: 18 }}>
            Delete {count} employee{count > 1 ? "s" : ""}?
          </h2>
          <button className="r-btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="r-mbody" style={{ textAlign: "center" }}>
          <div
            className="r-badge"
            style={{
              width: 52,
              height: 52,
              alignItems: "center",
              justifyContent: "center",
              background: "#fee2e2",
              color: "#dc2626",
              border: "none",
              margin: "0 auto",
              borderRadius: 999,
              display: "flex",
            }}
          >
            <DeleteIcon />
          </div>
          <p className="r-muted" style={{ marginTop: 10 }}>
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

/* ---------------- Main Employees Component ---------------- */
const Employees = () => {
  const { cognitoId } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const fetchEmployees = useCallback(async () => {
    if (!cognitoId) return;
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch(
        `${API_BASE}/employees?cognito_id=${encodeURIComponent(cognitoId)}`
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Failed to fetch employees (${res.status})`);
      }
      const data = await res.json();
      const list = (Array.isArray(data) ? data : []).map((e) => ({
        id: e.id,
        full_name: e.full_name,
        short_name: e.short_name,
        email: e.email,
        phone: e.phone,
        employment_type: e.employment_type,
        status: e.status,
        start_date: e.start_date,
        probation_end: e.probation_end,
        hourly_rate: e.hourly_rate,
        pay_type: e.pay_type,
        notes: e.notes,
      }));
      setEmployees(list);
    } catch (err) {
      console.error("[Employees] fetch error:", err);
      setApiError(err?.message || "Failed to load employees.");
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
      [
        e.full_name,
        e.short_name,
        e.email,
        e.phone,
        e.employment_type,
        e.status,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [employees, search]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(filtered.map((e) => e.id)));
    } else {
      setSelectedIds(new Set());
    }
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
      const payload = {
        cognito_id: cognitoId,
        full_name: form.full_name,
        short_name: form.short_name,
        email: form.email,
        phone: form.phone,
        employment_type: form.employment_type,
        status: form.status,
        start_date: form.start_date || null,
        probation_end: form.probation_end || null,
        hourly_rate:
          form.hourly_rate === null || form.hourly_rate === ""
            ? null
            : Number(form.hourly_rate),
        pay_type: form.pay_type,
        notes: form.notes,
      };

      if (form.id) {
        // update
        const res = await fetch(`${API_BASE}/employees/${encodeURIComponent(form.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Update failed");
        }
      } else {
        // create
        const res = await fetch(`${API_BASE}/employees`, {
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
    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        const res = await fetch(`${API_BASE}/employees/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          console.warn("Delete failed for employee", id);
        }
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
  const allVisibleSelected =
    filtered.length > 0 && filtered.every((e) => selectedIds.has(e.id));

  return (
    <div className="r-wrap">
      <BrandStyles />

      <div className="r-card">
        {/* Header */}
        <div className="r-head">
          <div>
            <h2 className="r-title">Employees</h2>
            <p className="r-sub">Manage your team and roster-ready profiles.</p>
          </div>

          <div className="r-actions-right">
            {numSelected > 0 && (
              <div
                className="r-actions-right"
                style={{
                  background: "#eef2ff",
                  padding: "6px 10px",
                  borderRadius: 10,
                }}
              >
                <span className="r-pill">{numSelected} selected</span>
                <button
                  className="r-btn-icon"
                  onClick={() => setDeleteOpen(true)}
                  aria-label="Delete selected"
                >
                  <DeleteIcon />
                </button>
              </div>
            )}

            <button className="r-btn-add" onClick={openAddModal}>
              <PlusIcon /> Add Employee
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="r-toolbar">
          <input
            className="r-input"
            type="text"
            placeholder="Search by name, email, status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {loading && (
            <span className="r-muted">Loading employees…</span>
          )}
          {apiError && !loading && (
            <span className="r-muted" style={{ color: "#b91c1c" }}>
              {apiError}
            </span>
          )}
        </div>

        {/* Table */}
        <div className="r-table-wrap">
          <table className="r-table">
            <thead className="r-thead">
              <tr>
                <th className="r-td">
                  <input
                    className="r-chk"
                    type="checkbox"
                    onChange={(e) => selectAll(e.target.checked)}
                    checked={allVisibleSelected}
                  />
                </th>
                <th className="r-td">Name</th>
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
                  <td className="r-td r-td--name">
                    {e.full_name}
                    {e.short_name ? (
                      <span className="r-muted"> · {e.short_name}</span>
                    ) : null}
                  </td>
                  <td className="r-td">
                    {e.employment_type
                      ? e.employment_type.replace("_", " ")
                      : "—"}
                  </td>
                  <td className="r-td">
                    {e.status
                      ? e.status.replace("_", " ")
                      : "—"}
                  </td>
                  <td className="r-td">
                    {e.start_date || "—"}
                  </td>
                  <td className="r-td">
                    {e.email || "—"}
                    <br />
                    <span className="r-muted">{e.phone || ""}</span>
                  </td>
                  <td className="r-td r-actions">
                    <button
                      className="r-btn-ghost"
                      onClick={() => openEditModal(e)}
                    >
                      <EditIcon /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr className="r-row">
                  <td className="r-td" colSpan={7} style={{ textAlign: "center" }}>
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
            Showing <strong>{filtered.length}</strong> employee
            {filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Modals */}
      <EmployeeModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={saveEmployee}
        initial={editing}
      />

      <DeleteConfirmModal
        open={deleteOpen}
        count={selectedIds.size}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Employees;
