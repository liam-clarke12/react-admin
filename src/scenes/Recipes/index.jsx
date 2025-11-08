// src/scenes/recipes/Recipes.jsx
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import RecipeForm from "../form/Recipes"; // NEW: embed form in modal

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/* ---------------- Icons ---------------- */
const Svg = (p) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" {...p} />;
const EditIcon = (props) => (
  <Svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </Svg>
);
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
/* NEW: plus icon for "Add Recipe" */
const PlusIcon = (props) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
  </Svg>
);

/* Simple unit options used in the edit modal */
const UNIT_OPTIONS = [
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "kg", label: "Kilograms (Kg)" },
  { value: "l", label: "Litres (L)" },
  { value: "units", label: "Units" },
];

/* ---------------- Style shim (scoped) ---------------- */
const BrandStyles = () => (
  <style>{`
  .r-wrap { margin: 20px; }
  .r-card {
    background:#fff; border:1px solid #e5e7eb; border-radius:14px; box-shadow:0 1px 2px rgba(16,24,40,0.06),0 1px 3px rgba(16,24,40,0.08);
    overflow:hidden;
  }
  .r-head { padding:14px 16px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e5e7eb; }
  .r-title { margin:0; font-weight:800; color:#0f172a; font-size:16px; }
  .r-right { display:flex; align-items:center; gap:10px; }
  .r-pill { font-size:12px; font-weight:700; color:#7C3AED; }
  .r-btn-icon {
    border:0; background:transparent; cursor:pointer; padding:8px; border-radius:999px; color:#dc2626;
  }
  .r-btn-icon:hover { background:#fee2e2; }
  .r-table-wrap { overflow:auto; }
  table.r-table { width:100%; border-collapse:separate; border-spacing:0; font-size:14px; color:#334155; }
  .r-thead { background:#f8fafc; text-transform:uppercase; letter-spacing:.03em; font-size:12px; color:#64748b; }
  .r-thead th { padding:10px 12px; text-align:left; }
  .r-row { border-bottom:1px solid #e5e7eb; transition: background .15s ease; }
  .r-row:nth-child(odd) { background:#ffffff; }
  .r-row:nth-child(even) { background:#f8fafc; }
  .r-row:hover { background:#f4f1ff; }
  .r-td { padding:12px; }
  .r-td--name { font-weight:700; color:#0f172a; white-space:nowrap; }
  .r-actions { text-align:center; }
  .r-chk { width:16px; height:16px; }
  .r-link { color:#7C3AED; font-weight:600; background:transparent; border:0; cursor:pointer; }
  .r-link:hover { color:#5B21B6; text-decoration:underline; }
  .r-btn-ghost {
    display:inline-flex; align-items:center; gap:8px; padding:8px 12px; font-weight:700; font-size:14px;
    color:#7C3AED; border:1px solid #e5e7eb; border-radius:10px; background:#fff;
  }
  .r-btn-ghost:hover { background:#f4f1ff; }
  .r-btn-primary {
    display:inline-flex; align-items:center; gap:8px;
    padding:10px 14px; font-weight:800; color:#fff; background:linear-gradient(180deg, #7C3AED, #5B21B6);
    border:0; border-radius:999px;
    box-shadow:0 8px 16px rgba(29,78,216,0.18), 0 2px 4px rgba(15,23,42,0.06); cursor:pointer;
  }
  .r-btn-primary:hover { background:linear-gradient(180deg, #5B21B6, #5B21B6); }
  .r-btn-danger { background:#dc2626; }
  .r-btn-danger:hover { background:#b91c1c; }
  .r-footer { padding:12px 16px; border-top:1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between; background:#fff; }

  /* Drawer */
  .r-dim { position:fixed; inset:0; background:rgba(0,0,0,.4); opacity:0; pointer-events:none; transition:opacity .2s; z-index:40; }
  .r-dim.open { opacity:1; pointer-events:auto; }
  .r-drawer {
    position:fixed; top:0; right:0; height:100%; width:100%; max-width:420px; background:#fff; box-shadow:-8px 0 24px rgba(2,6,23,.18);
    transform:translateX(100%); transition:transform .25s ease; z-index:50; display:flex; flex-direction:column;
  }
  .r-drawer.open { transform:translateX(0); }
  .r-dhdr {
    padding:14px 16px; color:#fff; background:linear-gradient(180deg, #7C3AED, #5B21B6); display:flex; align-items:center; justify-content:space-between;
  }
  .r-dhdr-title { margin:0; font-weight:800; font-size:18px; }
  .r-dhdr-sub { margin:0; font-size:12px; opacity:.92; }
  .r-dbody { padding:14px; background:#f1f5f9; overflow:auto; flex:1; }
  .r-summary { background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:12px; box-shadow:0 1px 2px rgba(16,24,40,0.06); margin-bottom:10px; }
  .r-stat { text-align:right; }
  .r-filter { position:sticky; top:0; padding:8px 0; background:#f1f5f9; }
  .r-input {
    width:100%; padding:8px 10px; border:1px solid #e5e7eb; border-radius:8px; outline:none;
  }
  .r-input:focus { border-color:#7C3AED; box-shadow:0 0 0 4px rgba(124,58,237,.18); }
  .r-list { list-style:none; margin:10px 0 0; padding:0; display:grid; gap:8px; }
  .r-item { display:flex; align-items:center; justify-content:space-between; background:#fff; border:1px solid #e5e7eb; border-radius:10px; padding:10px 12px; }
  .r-chip { font-size:12px; font-weight:700; background:#f1f5f9; color:#334155; padding:4px 8px; border-radius:999px; }

  /* Modal */
  .r-modal-dim { position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:60; }
  .r-modal { background:#fff; border-radius:12px; width:100%; max-width:760px; max-height:90vh; overflow:hidden; box-shadow:0 10px 30px rgba(2,6,23,.22); display:flex; flex-direction:column; }
  .r-mhdr { padding:14px 16px; border-bottom:1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between; }
  .r-mbody { padding:16px; overflow:auto; }
  .r-mgrid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .r-field label { display:block; font-size:13px; color:#64748b; margin-bottom:6px; font-weight:600; }
  .r-field input, .r-field select {
    width:100%; padding:10px 12px; border:1px solid #e5e7eb; border-radius:10px; outline:none;
  }
  .r-field input:focus, .r-field select:focus { border-color:#7C3AED; box-shadow:0 0 0 4px rgba(124,58,237,.18); }
  .r-ing { display:grid; grid-template-columns:2fr 1fr 1fr auto; gap:10px; align-items:center; background:#f8fafc; border:1px solid #e5e7eb; border-radius:10px; padding:10px; }
  .r-mfooter { padding:12px 16px; border-top:1px solid #e5e7eb; background:#f8fafc; display:flex; justify-content:flex-end; gap:10px; }

  /* Small helpers */
  .r-flex { display:flex; align-items:center; gap:10px; }
  .r-badge { background:#ede9fe; color:#7C3AED; border:1px solid #eee; border-radius:999px; padding:2px 8px; font-size:12px; }
  .r-muted { color:#64748b; font-size:12px; }
  .r-strong { font-weight:800; color:#0f172a; }
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
  onAdd, // NEW
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
    if (!checkboxRef.current) return;
    checkboxRef.current.indeterminate = numSelected > 0 && numSelected < rowCount;
  }, [numSelected, rowCount]);

  return (
    <div className="r-card">
      <div className="r-head">
        <h2 className="r-title">Recipes</h2>
        <div className="r-right">
          {/* NEW: Add Recipe button */}
          <button className="r-btn-primary" onClick={onAdd} aria-label="Add Recipe">
            <PlusIcon /> Add Recipe
          </button>

          {numSelected > 0 && (
            <>
              <span className="r-pill">{numSelected} selected</span>
              <button className="r-btn-icon" onClick={onDelete} aria-label="Delete selected">
                <DeleteIcon />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="r-table-wrap">
        <table className="r-table">
          <thead className="r-thead">
            <tr>
              <th className="r-td">
                <input ref={checkboxRef} className="r-chk" type="checkbox" onChange={handleSelectAll}
                       checked={rowCount > 0 && numSelected === rowCount} />
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
                  <button className="r-link" onClick={() => onOpenDrawer(r.id, "ingredients")}>
                    View ({r.ingredients.length})
                  </button>
                </td>
                <td className="r-td">
                  <button className="r-link" onClick={() => onOpenDrawer(r.id, "quantities")}>
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
    const headers = type === "quantities" ? ["Ingredient", "Quantity", "Unit"] : ["Ingredient"];
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
            <span className="r-badge"><MenuIcon /></span>
            <div>
              <h3 className="r-dhdr-title">{type === "ingredients" ? "Ingredients" : "Quantities"}</h3>
              <p className="r-dhdr-sub">{recipe?.name || "No recipe selected"}</p>
            </div>
          </div>
          <button className="r-btn-ghost" onClick={onClose}><CloseIcon /> Close</button>
        </div>

        <div className="r-dbody">
          <div className="r-summary r-flex" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="r-muted" style={{ textTransform: "uppercase", fontWeight: 700 }}>Recipe</div>
              <div className="r-strong">{recipe?.name || "—"}</div>
              <div className="r-muted">Units per batch: {recipe?.unitsPerBatch ?? "N/A"}</div>
            </div>
            <div className="r-stat">
              <div className="r-muted" style={{ textTransform: "uppercase", fontWeight: 700 }}>Items</div>
              <div className="r-strong" style={{ color: "#7C3AED", fontSize: 24 }}>{filtered.length}</div>
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
                  <span className="r-badge"><CheckIcon /></span>
                  <span className="r-strong" style={{ fontWeight: 600 }}>{it.name}</span>
                </div>
                {type === "quantities" && <span className="r-chip">{it.details}</span>}
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
            <DownloadIcon /> Export CSV
          </button>
          <button className="r-btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </>
  );
};

/* ---------------- Edit Modal ---------------- */
const EditRecipeModal = ({ isOpen, onClose, onSave, recipe }) => {
  const [edited, setEdited] = useState(recipe);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEdited(JSON.parse(JSON.stringify(recipe || {})));
  }, [recipe]);

  if (!isOpen) return null;

  const handleField = (k, v) => setEdited((p) => ({ ...p, [k]: v }));
  const handleIngredient = (idx, k, v) => {
    const arr = [...(edited?.ingredients || [])];
    arr[idx] = { ...(arr[idx] || {}), [k]: v };
    setEdited((p) => ({ ...p, ingredients: arr }));
  };
  const addIngredient = () => {
    setEdited((p) => ({
      ...p,
      ingredients: [
        ...(p?.ingredients || []),
        { id: `new_${Date.now()}`, name: "", quantity: 0, unit: UNIT_OPTIONS[0].value },
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

  return (
    <div className="r-modal-dim">
      <div className="r-modal">
        <div className="r-mhdr">
          <h2 className="r-title" style={{ fontSize: 18 }}>Edit Recipe</h2>
          <button className="r-btn-ghost" onClick={onClose}><CloseIcon /> Close</button>
        </div>

        <div className="r-mbody">
          <div className="r-mgrid">
            <div className="r-field">
              <label>Recipe Name</label>
              <input
                type="text"
                value={edited?.name || ""}
                onChange={(e) => handleField("name", e.target.value)}
              />
            </div>
            <div className="r-field">
              <label>Units per Batch</label>
              <input
                type="number"
                value={edited?.unitsPerBatch ?? 0}
                onChange={(e) => handleField("unitsPerBatch", parseInt(e.target.value || "0", 10))}
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <h3 className="r-strong" style={{ marginBottom: 8 }}>Ingredients</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {(edited?.ingredients || []).map((ing, idx) => (
                <div key={ing.id || idx} className="r-ing">
                  <input
                    type="text"
                    placeholder="Ingredient Name"
                    value={ing.name}
                    onChange={(e) => handleIngredient(idx, "name", e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={ing.quantity}
                    onChange={(e) => handleIngredient(idx, "quantity", parseFloat(e.target.value) || 0)}
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => handleIngredient(idx, "unit", e.target.value)}
                  >
                    {UNIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button className="r-btn-icon" onClick={() => removeIngredient(idx)} title="Remove">
                    <DeleteIcon />
                  </button>
                </div>
              ))}
            </div>

            <button className="r-btn-ghost" style={{ marginTop: 10 }} onClick={addIngredient}>
              + Add Ingredient
            </button>
          </div>
        </div>

        <div className="r-mfooter">
          <button className="r-btn-ghost" onClick={onClose}>Cancel</button>
          <button className={`r-btn-primary ${saving ? "r-btn-disabled" : ""}`} onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
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
          <h2 className="r-title" style={{ fontSize: 18 }}>Confirm Deletion</h2>
          <button className="r-btn-ghost" onClick={onClose}><CloseIcon /> Close</button>
        </div>
        <div className="r-mbody" style={{ textAlign: "center" }}>
          <div className="r-badge" style={{ width: 48, height: 48, display:"inline-flex", alignItems:"center", justifyContent:"center", background:"#fee2e2", color:"#dc2626", border:"none" }}>
            <DeleteIcon />
          </div>
          <h3 className="r-strong" style={{ marginTop: 8 }}>Delete {count} recipe{count>1?"s":""}?</h3>
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

/* ---------------- Main Screen ---------------- */
const Recipes = () => {
  const { cognitoId } = useAuth();
  const { rows, setRows } = useData();

  const [recipes, setRecipes] = useState([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState("ingredients");
  const [drawerRecipe, setDrawerRecipe] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  /* NEW: Add modal state */
  const [addOpen, setAddOpen] = useState(false);

  const fetchRecipeData = useCallback(async () => {
    if (!cognitoId) return;
    try {
      const res = await fetch(`${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`);
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
      const url = `${API_BASE}/recipes/${encodeURIComponent(recipe.id)}?cognito_id=${encodeURIComponent(cognitoId)}`;
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
      const resp = await fetch(`${API_BASE}/recipes/${encodeURIComponent(edited.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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
          body: JSON.stringify({ recipeName: rec.name, cognito_id: cognitoId }),
        });
        if (!resp.ok) {
          console.warn("Delete failed for", rec.name);
        }
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
        onAdd={() => setAddOpen(true)} // NEW: open add modal
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

      {/* NEW: Add Recipe Modal with embedded form (stays on same page) */}
      {addOpen && (
        <div className="r-modal-dim">
          <div className="r-modal">
            <div className="r-mhdr">
              <h2 className="r-title" style={{ fontSize: 18 }}>Add Recipe</h2>
              <button className="r-btn-ghost" onClick={() => setAddOpen(false)}>
                <CloseIcon /> Close
              </button>
            </div>
            {/* Remove padding so the form's own card spacing looks tidy */}
            <div className="r-mbody" style={{ padding: 0 }}>
              {/* Pass a callback so we can close + refresh after save */}
              <RecipeForm onCreated={async () => {
                await fetchRecipeData();
                setAddOpen(false);
              }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recipes;
