// src/scenes/recipes/Recipes.jsx
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";

/* MUI bits to mirror Goods In behaviour */
import Autocomplete from "@mui/material/Autocomplete";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/* ---------------- Unit options (local) ---------------- */
const UNIT_OPTIONS = [
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "kg", label: "Kilograms (Kg)" },
  { value: "l", label: "Litres (L)" },
  { value: "units", label: "Units" },
];

/* ---------------- Icons ---------------- */
const Svg = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" {...p} />
);
const EditIcon = (props) => (
  <Svg
    width="20"
    height="20"
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
    width="20"
    height="20"
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
const MenuIcon = (props) => (
  <Svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </Svg>
);
const CloseIcon = (props) => (
  <Svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);
const CheckIcon = (props) => (
  <Svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="20 6 9 17 4 12" />
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

/* ---------------- Scoped styles (kept identical + Nory-style form bits) ---------------- */
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

  /* Drawer */
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
  .r-input {
    width:100%; padding:10px 12px; border:1px solid #e5e7eb; border-radius:10px; outline:none;
  }
  .r-input:focus { border-color:#7C3AED; box-shadow:0 0 0 4px rgba(124,58,237,.18); }
  .r-list { list-style:none; margin:10px 0 0; padding:0; display:grid; gap:8px; }
  .r-item { display:flex; align-items:center; justify-content:space-between; background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; }
  .r-chip { font-size:12px; font-weight:800; background:#f1f5f9; color:#334155; padding:4px 8px; border-radius:999px; }

  /* Modal (shared) */
  .r-modal-dim { position:fixed; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; z-index:60; padding:16px;}
  .r-modal { background:#fff; border-radius:14px; width:100%; max-width:640px; max-height:90vh; overflow:hidden; box-shadow:0 10px 30px rgba(2,6,23,.22); display:flex; flex-direction:column; }
  .r-mhdr { padding:14px 16px; border-bottom:1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between; }
  .r-mbody { padding:16px; overflow:auto; background:#f8fafc; }
  .r-mfooter { padding:12px 16px; border-top:1px solid #e5e7eb; background:#f8fafc; display:flex; justify-content:flex-end; gap:10px; }

  /* Small helpers */
  .r-flex { display:flex; align-items:center; gap:10px; }
  .r-badge { background:#ede9fe; color:#7C3AED; border:1px solid #eee; border-radius:999px; padding:4px; display:inline-flex; }
  .r-muted { color:#64748b; font-size:12px; }
  .r-strong { font-weight:900; color:#0f172a; }

  /* ===================== Nory-style form bits (copied from Production form) ===================== */

  .gof-grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 20px;
  }
  .col-12 { grid-column: span 12; }
  .col-6 { grid-column: span 6; }
  .col-4 { grid-column: span 4; }
  .col-3 { grid-column: span 3; }

  @media (max-width: 900px) {
    .col-6, .col-4, .col-3 { grid-column: span 12; }
  }

  .gof-field {
    display: flex;
    flex-direction: column;
  }
  .gof-label {
    font-size: 13px;
    font-weight: 600;
    color: #334155;
    margin-bottom: 6px;
  }
  .gof-input,
  .gof-select {
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px 14px;
    font-size: 14px;
    outline: none;
    transition: border-color .15s ease, box-shadow .15s ease;
  }
  .gof-input:focus,
  .gof-select:focus {
    border-color: #7C3AED;
    box-shadow: 0 0 0 4px rgba(124,58,237,0.18);
  }

  .gof-multi-row {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 12px;
    margin-bottom: 12px;
    background: #f8fafc;
  }

  .gof-multi-add-btn {
    border-radius: 999px;
    border: 1px dashed #e5e7eb;
    background: #f1f5f9;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    color: #64748b;
  }

  .gof-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border-radius: 999px;
    padding: 12px 18px;
    border: 0;
    cursor: pointer;
    font-weight: 800;
    color: #fff;
    background: linear-gradient(180deg, #7C3AED, #5B21B6);
    box-shadow: 0 8px 16px rgba(29,78,216,0.25), 0 2px 4px rgba(15,23,42,0.06);
    transition: transform .2s ease;
  }
  .gof-pill[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  .gof-pill:not([disabled]):hover {
    transform: scale(1.03);
    background: linear-gradient(180deg, #5B21B6, #5B21B6);
  }
`}</style>
);

/* ---------------- Recipe Table ---------------- */
const RecipeTable = ({
  recipes,
  onOpenDrawer,
  onEdit,
  selectedRecipeIds,
  setSelectedRecipeIds,
  onDelete,
  onAdd,
}) => {
  const checkboxRef = useRef(null);
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRecipeIds(new Set(recipes.map((r) => r.id)));
    else setSelectedRecipeIds(new Set());
  };
  const handleSelectRow = (id) => {
    const next = new Set(selectedRecipeIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedRecipeIds(next);
  };

  const numSelected = selectedRecipeIds.size;
  const rowCount = recipes.length;

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = numSelected > 0 && numSelected < rowCount;
    }
  }, [numSelected, rowCount]);

  return (
    <div className="r-card">
      <div className="r-head">
        <h2 className="r-title">Recipes</h2>
        <div className="r-actions-right">
          {numSelected > 0 && (
            <div
              className="r-flex"
              style={{ background: "#eef2ff", padding: "6px 10px", borderRadius: 10 }}
            >
              <span className="r-pill">{numSelected} selected</span>
              <button className="r-btn-icon" onClick={onDelete} aria-label="Delete selected">
                <DeleteIcon />
              </button>
            </div>
          )}
          <button className="r-btn-add" onClick={onAdd}>
            <PlusIcon /> Add Recipe
          </button>
        </div>
      </div>

      <div className="r-table-wrap">
        <table className="r-table">
          <thead className="r-thead">
            <tr>
              <th className="r-td">
                <input
                  ref={checkboxRef}
                  className="r-chk"
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={rowCount > 0 && numSelected === rowCount}
                />
              </th>
              <th className="r-td">Recipe</th>
              <th className="r-td">Units per Batch</th>
              <th className="r-td">Ingredients</th>
              <th className="r-td">Quantities</th>
              <th className="r-td r-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((r) => (
              <tr key={r.id} className="r-row">
                <td className="r-td">
                  <input
                    className="r-chk"
                    type="checkbox"
                    checked={selectedRecipeIds.has(r.id)}
                    onChange={() => handleSelectRow(r.id)}
                  />
                </td>
                <td className="r-td r-td--name">{r.name}</td>
                <td className="r-td">{r.unitsPerBatch}</td>
                <td className="r-td">
                  <button
                    className="r-link"
                    onClick={() => onOpenDrawer(r.id, "ingredients")}
                  >
                    View ({r.ingredients.length})
                  </button>
                </td>
                <td className="r-td">
                  <button
                    className="r-link"
                    onClick={() => onOpenDrawer(r.id, "quantities")}
                  >
                    View Quantities
                  </button>
                </td>
                <td className="r-td r-actions">
                  <button
                    className="r-btn-ghost"
                    onClick={() => onEdit(r)}
                    aria-label={`Edit ${r.name}`}
                  >
                    <EditIcon /> Edit
                  </button>
                </td>
              </tr>
            ))}
            {recipes.length === 0 && (
              <tr className="r-row">
                <td className="r-td" colSpan={6} style={{ textAlign: "center" }}>
                  <span className="r-muted">No recipes found.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------------- Drawer ---------------- */
const RecipeDrawer = ({ isOpen, onClose, recipe, type }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const displayItems = useMemo(() => {
    if (!recipe) return [];
    return recipe.ingredients.map((ing) => ({
      name: ing.name,
      details: type === "quantities" ? `${ing.quantity} ${ing.unit}` : ing.name,
      fullText: `${ing.name} ${ing.quantity} ${ing.unit}`.toLowerCase(),
    }));
  }, [recipe, type]);

  const filtered = useMemo(() => {
    const q = (searchTerm || "").toLowerCase();
    return displayItems.filter((it) => it.fullText.includes(q));
  }, [displayItems, searchTerm]);

  const exportCsv = () => {
    if (!recipe) return;
    const headers =
      type === "quantities" ? ["Ingredient", "Quantity", "Unit"] : ["Ingredient"];
    const rows = recipe.ingredients.map((ing) =>
      type === "quantities" ? [ing.name, String(ing.quantity), ing.unit] : [ing.name]
    );
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(recipe?.name || "recipe").replace(/\s+/g, "_")}_${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className={`r-dim ${isOpen ? "open" : ""}`} onClick={onClose} />
      <div className={`r-drawer ${isOpen ? "open" : ""}`}>
        <div className="r-dhdr">
          <div className="r-flex">
            <span className="r-badge">
              <MenuIcon />
            </span>
            <div>
              <h3 className="r-dhdr-title">
                {type === "ingredients" ? "Ingredients" : "Quantities"}
              </h3>
              <p className="r-dhdr-sub">{recipe?.name || "No recipe selected"}</p>
            </div>
          </div>
          <button className="r-btn-ghost" onClick={onClose}>
            <CloseIcon /> Close
          </button>
        </div>

        <div className="r-dbody">
          <div className="r-summary r-flex" style={{ justifyContent: "space-between" }}>
            <div>
              <div
                className="r-muted"
                style={{ textTransform: "uppercase", fontWeight: 800 }}
              >
                Recipe
              </div>
              <div className="r-strong">{recipe?.name || "—"}</div>
              <div className="r-muted">
                Units per batch: {recipe?.unitsPerBatch ?? "N/A"}
              </div>
            </div>
            <div className="r-stat">
              <div
                className="r-muted"
                style={{ textTransform: "uppercase", fontWeight: 800 }}
              >
                Items
              </div>
              <div
                className="r-strong"
                style={{ color: "#7C3AED", fontSize: 24 }}
              >
                {filtered.length}
              </div>
            </div>
          </div>

          <div className="r-filter">
            <input
              className="r-input"
              type="text"
              placeholder="Filter items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ul className="r-list">
            {filtered.map((it, i) => (
              <li key={i} className="r-item">
                <div className="r-flex">
                  <span className="r-badge">
                    <CheckIcon />
                  </span>
                  <span className="r-strong" style={{ fontWeight: 700 }}>
                    {it.name}
                  </span>
                </div>
                {type === "quantities" && (
                  <span className="r-chip">{it.details}</span>
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
          <button className="r-btn-ghost" onClick={exportCsv} disabled={!recipe}>
            Export CSV
          </button>
          <button className="r-btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </>
  );
};

/* ---------------- Shared ingredient source (same as Goods In) ---------------- */
const useIngredientOptions = (cognitoId, refreshKey = 0) => {
  const [masterIngredients, setMasterIngredients] = useState([]);
  const [customIngredients, setCustomIngredients] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!cognitoId) return;
    setLoading(true);
    try {
      const [mRes, cRes] = await Promise.all([
        fetch(
          `${API_BASE}/ingredients?cognito_id=${encodeURIComponent(
            cognitoId
          )}`
        ),
        fetch(
          `${API_BASE}/custom-ingredients?cognito_id=${encodeURIComponent(
            cognitoId
          )}`
        ),
      ]);

      const m = mRes.ok ? await mRes.json() : [];
      const c = cRes.ok ? await cRes.json() : [];
      setMasterIngredients(Array.isArray(m) ? m : []);
      setCustomIngredients(
        Array.isArray(c)
          ? c.map((ci) => ({ id: `c-${ci.id}`, name: ci.name }))
          : []
      );
    } catch (e) {
      console.error("Ingredient load error:", e);
      setMasterIngredients([]);
      setCustomIngredients([]);
    } finally {
      setLoading(false);
    }
  }, [cognitoId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const ingredients = useMemo(
    () => [
      ...masterIngredients.map((i) => ({ ...i, source: "master" })),
      ...customIngredients.map((i) => ({ ...i, source: "custom" })),
    ],
    [masterIngredients, customIngredients]
  );

  return { ingredients, reload: load, loading };
};

/* ---------------- Add custom ingredient dialog (shared) ---------------- */
const AddIngredientDialog = ({ open, onClose, onAdd, adding }) => {
  const [name, setName] = useState("");
  useEffect(() => {
    if (!open) setName("");
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      PaperProps={{ sx: { borderRadius: 14, border: "1px solid #e5e7eb" } }}
    >
      <DialogTitle sx={{ fontWeight: 800, color: "#0f172a" }}>
        Add New Ingredient
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Ingredient Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          disabled={adding}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => onAdd(name)}
          disabled={adding || !name.trim()}
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 800,
            borderRadius: 999,
            px: 3,
            background: "linear-gradient(180deg, #7C3AED, #5B21B6)",
            "&:hover": { background: "#5B21B6" },
          }}
          startIcon={
            adding ? (
              <CircularProgress size={18} sx={{ color: "#fff" }} />
            ) : null
          }
        >
          {adding ? "Adding…" : "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ---------------- Edit Modal (Nory-style form) ---------------- */
const EditRecipeModal = ({ isOpen, onClose, onSave, recipe }) => {
  const { cognitoId } = useAuth();
  const { ingredients, reload } = useIngredientOptions(
    cognitoId,
    isOpen ? 1 : 0
  );

  const [edited, setEdited] = useState(null);
  const [saving, setSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addTargetIndex, setAddTargetIndex] = useState(null); // which ingredient row to auto-select into

  useEffect(() => {
    if (recipe) setEdited(JSON.parse(JSON.stringify(recipe)));
    else setEdited(null);
  }, [recipe]);

  if (!isOpen || !edited) return null;

  const handleField = (k, v) => setEdited((p) => ({ ...p, [k]: v }));
  const handleIngredient = (idx, k, v) => {
    const arr = [...(edited?.ingredients || [])];
    arr[idx] = { ...(arr[idx] || {}), [k]: v };
    setEdited((p) => ({ ...p, ingredients: arr }));
  };
  const addIngredientRow = () => {
    setEdited((p) => ({
      ...p,
      ingredients: [
        ...(p?.ingredients || []),
        {
          id: `new_${Date.now()}`,
          name: "",
          quantity: 0,
          unit: UNIT_OPTIONS[0].value,
        },
      ],
    }));
  };
  const removeIngredient = (idx) => {
    const arr = (edited?.ingredients || []).filter((_, i) => i !== idx);
    setEdited((p) => ({ ...p, ingredients: arr }));
  };
  const save = async () => {
    setSaving(true);
    await onSave(edited);
    setSaving(false);
  };

  const openAddCustom = (index) => {
    setAddTargetIndex(index);
    setAddOpen(true);
  };
  const doAddCustom = async (name) => {
    if (!cognitoId || !name?.trim()) return;
    setAdding(true);
    try {
      const resp = await fetch(`${API_BASE}/custom-ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cognito_id: cognitoId,
          name: name.trim(),
        }),
      });
      if (!resp.ok) throw new Error("Failed to add ingredient");
      await reload();
      // auto-select newly added (name match)
      const just = (ingredients || []).find(
        (i) => i.name?.toLowerCase() === name.trim().toLowerCase()
      );
      if (just && addTargetIndex != null) {
        handleIngredient(addTargetIndex, "name", just.name);
      }
      setAddOpen(false);
      setAddTargetIndex(null);
    } catch (e) {
      console.error("add ingredient failed:", e);
      alert("Could not add ingredient");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="r-modal-dim">
      <div className="r-modal">
        <div className="r-mhdr">
          <h2 className="r-title" style={{ fontSize: 18 }}>
            Edit Recipe
          </h2>
          <button className="r-btn-ghost" onClick={onClose}>
            <CloseIcon /> Close
          </button>
        </div>

        <div className="r-mbody">
          {/* Top grid - Nory style */}
          <div className="gof-grid">
            <div className="gof-field col-6">
              <label className="gof-label">Recipe Name</label>
              <input
                type="text"
                className="gof-input"
                value={edited?.name || ""}
                onChange={(e) => handleField("name", e.target.value)}
              />
            </div>
            <div className="gof-field col-6">
              <label className="gof-label">Units per Batch</label>
              <input
                type="number"
                className="gof-input"
                value={edited?.unitsPerBatch ?? 0}
                onChange={(e) =>
                  handleField(
                    "unitsPerBatch",
                    parseInt(e.target.value || "0", 10)
                  )
                }
              />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <h3 className="r-strong" style={{ marginBottom: 8 }}>
              Ingredients
            </h3>
            <div style={{ display: "grid", gap: 8 }}>
              {(edited?.ingredients || []).map((ing, idx) => (
                <div key={ing.id || idx} className="gof-multi-row">
                  <div className="gof-grid">
                    {/* Ingredient dropdown */}
                    <div className="gof-field col-6">
                      <label className="gof-label">
                        Ingredient
                      </label>
                      <Autocomplete
                        options={ingredients}
                        value={
                          ingredients.find((i) => i.name === ing.name) ||
                          null
                        }
                        onChange={(_, val) =>
                          handleIngredient(idx, "name", val ? val.name : "")
                        }
                        getOptionLabel={(opt) =>
                          typeof opt === "string" ? opt : opt?.name ?? ""
                        }
                        isOptionEqualToValue={(opt, val) =>
                          (opt?.id ?? opt) === (val?.id ?? val)
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Select an ingredient"
                          />
                        )}
                        disableClearable={false}
                      />
                      <div style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          className="r-btn-ghost"
                          onClick={() => openAddCustom(idx)}
                        >
                          Add Ingredient +
                        </button>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="gof-field col-3">
                      <label className="gof-label">
                        Quantity
                      </label>
                      <input
                        type="number"
                        className="gof-input"
                        placeholder="Quantity"
                        value={ing.quantity}
                        onChange={(e) =>
                          handleIngredient(
                            idx,
                            "quantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>

                    {/* Unit */}
                    <div className="gof-field col-3">
                      <label className="gof-label">
                        Unit
                      </label>
                      <select
                        className="gof-select"
                        value={ing.unit}
                        onChange={(e) =>
                          handleIngredient(idx, "unit", e.target.value)
                        }
                      >
                        {UNIT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: 8, textAlign: "right" }}>
                    <button
                      type="button"
                      className="r-btn-icon"
                      onClick={() => removeIngredient(idx)}
                      title="Remove"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="gof-multi-add-btn"
              style={{ marginTop: 10 }}
              onClick={addIngredientRow}
            >
              + Add Ingredient
            </button>
          </div>
        </div>

        <div className="r-mfooter">
          <button className="r-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="gof-pill"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <AddIngredientDialog
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setAddTargetIndex(null);
        }}
        onAdd={doAddCustom}
        adding={adding}
      />
    </div>
  );
};

/* ---------------- Add Recipe Modal (popup form, Nory-style) ---------------- */
const AddRecipeModal = ({ isOpen, onClose, onSave }) => {
  const { cognitoId } = useAuth();
  const { ingredients, reload } = useIngredientOptions(
    cognitoId,
    isOpen ? 1 : 0
  );

  const [newRecipe, setNewRecipe] = useState({
    name: "",
    unitsPerBatch: 1,
    ingredients: [
      {
        id: `new_${Date.now()}`,
        name: "",
        quantity: 0,
        unit: UNIT_OPTIONS[0].value,
      },
    ],
  });
  const [saving, setSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addTargetIndex, setAddTargetIndex] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      // reset when closing
      setNewRecipe({
        name: "",
        unitsPerBatch: 1,
        ingredients: [
          {
            id: `new_${Date.now()}`,
            name: "",
            quantity: 0,
            unit: UNIT_OPTIONS[0].value,
          },
        ],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleField = (k, v) =>
    setNewRecipe((p) => ({
      ...p,
      [k]: v,
    }));
  const handleIngredient = (idx, k, v) => {
    const arr = [...newRecipe.ingredients];
    arr[idx] = { ...arr[idx], [k]: v };
    setNewRecipe((p) => ({ ...p, ingredients: arr }));
  };
  const addIngredientRow = () => {
    setNewRecipe((p) => ({
      ...p,
      ingredients: [
        ...p.ingredients,
        {
          id: `new_${Date.now()}`,
          name: "",
          quantity: 0,
          unit: UNIT_OPTIONS[0].value,
        },
      ],
    }));
  };
  const removeIngredient = (idx) => {
    setNewRecipe((p) => ({
      ...p,
      ingredients: p.ingredients.filter((_, i) => i !== idx),
    }));
  };
  const create = async () => {
    setSaving(true);
    await onSave(newRecipe);
    setSaving(false);
  };

  const openAddCustom = (index) => {
    setAddTargetIndex(index);
    setAddOpen(true);
  };
  const doAddCustom = async (name) => {
    if (!cognitoId || !name?.trim()) return;
    setAdding(true);
    try {
      const resp = await fetch(`${API_BASE}/custom-ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cognito_id: cognitoId,
          name: name.trim(),
        }),
      });
      if (!resp.ok) throw new Error("Failed to add ingredient");
      await reload();
      const just = (ingredients || []).find(
        (i) => i.name?.toLowerCase() === name.trim().toLowerCase()
      );
      if (just && addTargetIndex != null) {
        handleIngredient(addTargetIndex, "name", just.name);
      }
      setAddOpen(false);
      setAddTargetIndex(null);
    } catch (e) {
      console.error("add ingredient failed:", e);
      alert("Could not add ingredient");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="r-modal-dim">
      <div className="r-modal">
        <div className="r-mhdr">
          <h2 className="r-title" style={{ fontSize: 18 }}>
            Add New Recipe
          </h2>
          <button className="r-btn-ghost" onClick={onClose}>
            <CloseIcon /> Close
          </button>
        </div>

        <div className="r-mbody">
          {/* Top grid - Nory style */}
          <div className="gof-grid">
            <div className="gof-field col-6">
              <label className="gof-label">Recipe Name</label>
              <input
                type="text"
                className="gof-input"
                value={newRecipe.name}
                onChange={(e) => handleField("name", e.target.value)}
                placeholder="e.g., Chocolate Chip Cookies"
              />
            </div>
            <div className="gof-field col-6">
              <label className="gof-label">Units per Batch</label>
              <input
                type="number"
                className="gof-input"
                value={newRecipe.unitsPerBatch}
                onChange={(e) =>
                  handleField(
                    "unitsPerBatch",
                    parseInt(e.target.value || "0", 10)
                  )
                }
              />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <h3 className="r-strong" style={{ marginBottom: 8 }}>
              Ingredients
            </h3>
            <div style={{ display: "grid", gap: 8 }}>
              {newRecipe.ingredients.map((ing, idx) => (
                <div key={ing.id} className="gof-multi-row">
                  <div className="gof-grid">
                    {/* Ingredient dropdown */}
                    <div className="gof-field col-6">
                      <label className="gof-label">
                        Ingredient
                      </label>
                      <Autocomplete
                        options={ingredients}
                        value={
                          ingredients.find((i) => i.name === ing.name) ||
                          null
                        }
                        onChange={(_, val) =>
                          handleIngredient(idx, "name", val ? val.name : "")
                        }
                        getOptionLabel={(opt) =>
                          typeof opt === "string" ? opt : opt?.name ?? ""
                        }
                        isOptionEqualToValue={(opt, val) =>
                          (opt?.id ?? opt) === (val?.id ?? val)
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Select an ingredient"
                          />
                        )}
                        disableClearable={false}
                      />
                      <div style={{ marginTop: 8 }}>
                        <button
                          type="button"
                          className="r-btn-ghost"
                          onClick={() => openAddCustom(idx)}
                        >
                          Add Ingredient +
                        </button>
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="gof-field col-3">
                      <label className="gof-label">
                        Quantity
                      </label>
                      <input
                        type="number"
                        className="gof-input"
                        placeholder="Qty"
                        value={ing.quantity}
                        onChange={(e) =>
                          handleIngredient(
                            idx,
                            "quantity",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>

                    {/* Unit */}
                    <div className="gof-field col-3">
                      <label className="gof-label">
                        Unit
                      </label>
                      <select
                        className="gof-select"
                        value={ing.unit}
                        onChange={(e) =>
                          handleIngredient(idx, "unit", e.target.value)
                        }
                      >
                        {UNIT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: 8, textAlign: "right" }}>
                    <button
                      type="button"
                      className="r-btn-icon"
                      onClick={() => removeIngredient(idx)}
                      title="Remove"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="gof-multi-add-btn"
              style={{ marginTop: 10 }}
              onClick={addIngredientRow}
            >
              + Add Ingredient
            </button>
          </div>
        </div>

        <div className="r-mfooter">
          <button className="r-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="gof-pill"
            onClick={create}
            disabled={saving}
          >
            {saving ? "Creating..." : "Create Recipe"}
          </button>
        </div>
      </div>

      <AddIngredientDialog
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setAddTargetIndex(null);
        }}
        onAdd={doAddCustom}
        adding={adding}
      />
    </div>
  );
};

/* ---------------- Delete Modal ---------------- */
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, count }) => {
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
            }}
          >
            <DeleteIcon />
          </div>
          <h3
            className="r-strong"
            style={{ marginTop: 10, fontSize: 18 }}
          >
            Delete {count} recipe{count > 1 ? "s" : ""}?
          </h3>
          <p className="r-muted" style={{ marginTop: 6 }}>
            This action cannot be undone.
          </p>
        </div>
        <div
          className="r-mfooter"
          style={{ justifyContent: "flex-end" }}
        >
          <button className="r-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="r-btn-primary r-btn-danger"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Main Screen ---------------- */
const Recipes = () => {
  const { cognitoId } = useAuth();
  const { setRows } = useData();

  const [recipes, setRecipes] = useState([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState("ingredients");
  const [drawerRecipe, setDrawerRecipe] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [addOpen, setAddOpen] = useState(false);

  const fetchRecipeData = useCallback(async () => {
    if (!cognitoId) return;
    try {
      const res = await fetch(
        `${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`
      );
      if (!res.ok) throw new Error("Failed to fetch Recipe data");
      const data = await res.json();

      const grouped = data.reduce((acc, row) => {
        let entry = acc.find((r) => r.id === row.recipe_id);
        if (entry) {
          entry.ingredients.push(row.ingredient);
          entry.quantities.push(row.quantity);
          entry.units.push(row.unit);
        } else {
          acc.push({
            id: row.recipe_id,
            recipe: row.recipe,
            upb: row.units_per_batch,
            ingredients: [row.ingredient],
            quantities: [row.quantity],
            units: [row.unit],
          });
        }
        return acc;
      }, []);
      setRows(grouped);

      const asRecipes = grouped.map((g) => ({
        id: g.id,
        name: g.recipe,
        unitsPerBatch: g.upb,
        ingredients: (g.ingredients || []).map((ing, i) => ({
          id: `${g.id}_${i}`,
          name: ing,
          quantity: g.quantities?.[i] ?? "",
          unit: g.units?.[i] ?? "",
        })),
      }));
      setRecipes(asRecipes);
    } catch (err) {
      console.error("Error fetching recipes:", err);
      setRows([]);
      setRecipes([]);
    }
  }, [cognitoId, setRows]);

  useEffect(() => {
    fetchRecipeData();
  }, [fetchRecipeData]);

  const handleOpenDrawer = (recipeId, type) => {
    const r = recipes.find((x) => x.id === recipeId);
    setDrawerRecipe(r || null);
    setDrawerType(type);
    setDrawerOpen(true);
  };
  const handleCloseDrawer = () => setDrawerOpen(false);

  const handleEdit = async (recipe) => {
    try {
      const url = `${API_BASE}/recipes/${encodeURIComponent(
        recipe.id
      )}?cognito_id=${encodeURIComponent(cognitoId)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Failed to fetch recipe ${recipe.id}`);
      const payload = await resp.json();
      const r = {
        id: payload.recipe_id,
        name: payload.recipe_name,
        unitsPerBatch: payload.units_per_batch,
        ingredients: (payload.ingredients || []).map((it, i) => ({
          id: it.id ?? `${payload.recipe_id}_${i}`,
          name: it.ingredient_name,
          quantity: it.quantity,
          unit: it.unit,
        })),
      };
      setEditingRecipe(r);
      setEditOpen(true);
    } catch (e) {
      console.error("Failed to open editor:", e);
      alert("Could not open recipe editor.");
    }
  };

  const handleSaveEdited = async (edited) => {
    if (!edited || !cognitoId) return;
    try {
      const payload = {
        recipe: edited.name,
        upb: edited.unitsPerBatch,
        ingredients: edited.ingredients.map((i) => i.name),
        quantities: edited.ingredients.map((i) => i.quantity),
        units: edited.ingredients.map((i) => i.unit),
        cognito_id: cognitoId,
      };
      const resp = await fetch(
        `${API_BASE}/recipes/${encodeURIComponent(edited.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!resp.ok) {
        const t = await resp.text().catch(() => "");
        throw new Error(t || `Update failed (${resp.status})`);
      }
      await fetchRecipeData();
      setEditOpen(false);
      setEditingRecipe(null);
    } catch (e) {
      console.error("Save recipe failed:", e);
      alert("Save failed. See console for details.");
    }
  };

  const handleConfirmDelete = async () => {
    const ids = Array.from(selectedRecipeIds);
    if (!ids.length || !cognitoId) {
      setDeleteOpen(false);
      return;
    }
    try {
      for (const id of ids) {
        const rec = recipes.find((r) => r.id === id);
        if (!rec) continue;
        const resp = await fetch(`${API_BASE}/delete-recipe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipeName: rec.name,
            cognito_id: cognitoId,
          }),
        });
        if (!resp.ok) console.warn("Delete failed for", rec.name);
      }
      await fetchRecipeData();
      setSelectedRecipeIds(new Set());
    } catch (e) {
      console.error("Error deleting recipes:", e);
      alert("Could not delete recipes.");
    } finally {
      setDeleteOpen(false);
    }
  };

  const handleCreateRecipe = async (newRecipe) => {
    if (!cognitoId) return;
    try {
      const payload = {
        recipe: newRecipe.name,
        upb: newRecipe.unitsPerBatch,
        ingredients: newRecipe.ingredients.map((i) => i.name),
        quantities: newRecipe.ingredients.map((i) => i.quantity),
        units: newRecipe.ingredients.map((i) => i.unit),
        cognito_id: cognitoId,
      };
      const res = await fetch(`${API_BASE}/add-recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add recipe");
      await res.json();
      await fetchRecipeData();
      setAddOpen(false);
    } catch (err) {
      console.error("Error submitting recipe:", err);
      alert("Recipe submission failed");
    }
  };

  return (
    <div className="r-wrap">
      <BrandStyles />

      <RecipeTable
        recipes={recipes}
        onOpenDrawer={handleOpenDrawer}
        onEdit={handleEdit}
        selectedRecipeIds={selectedRecipeIds}
        setSelectedRecipeIds={setSelectedRecipeIds}
        onDelete={() => setDeleteOpen(true)}
        onAdd={() => setAddOpen(true)}
      />

      <RecipeDrawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        recipe={drawerRecipe}
        type={drawerType}
      />

      <DeleteConfirmationModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        count={selectedRecipeIds.size}
      />

      <EditRecipeModal
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingRecipe(null);
        }}
        onSave={handleSaveEdited}
        recipe={editingRecipe}
      />

      <AddRecipeModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleCreateRecipe}
      />
    </div>
  );
};

export default Recipes;
