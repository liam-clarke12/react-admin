// src/scenes/recipes/Recipes.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";

/* ------------------------------
   Brand tailwind utility classes
   (expects your CSS tokens e.g. bg-brand-surface)
--------------------------------*/
const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/* Keep local unit options (no external dependency) */
const UNIT_OPTIONS = [
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "kg", label: "Kilograms (Kg)" },
  { value: "l", label: "Litres (L)" },
  { value: "units", label: "Units" },
];

/* ================= Icons ================= */
const Svg = (p) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" {...p} />;
const EditIcon = (props) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </Svg>
);
const DeleteIcon = (props) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);
const MenuIcon = (props) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
  </Svg>
);
const CloseIcon = (props) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);
const CheckIcon = (props) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="20 6 9 17 4 12" />
  </Svg>
);
const DownloadIcon = (props) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </Svg>
);
const AddIcon = (props) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </Svg>
);

/* ================= Types (JSDoc) ================= */
/**
 * @typedef {{ id: string, name: string, quantity: number, unit: string }} Ingredient
 * @typedef {{ id: string, recipe: string, upb: number, ingredients: string[], quantities: (string|number)[], units: string[] }} RowGroup
 * @typedef {{ id: string, name: string, unitsPerBatch: number, ingredients: Ingredient[] }} Recipe
 */

/* ================= Recipe Table ================= */
const RecipeTable = ({
  recipes,
  onOpenDrawer,
  onEdit,
  selectedRecipeIds,
  setSelectedRecipeIds,
  onDelete,
}) => {
  const checkboxRef = useRef(null);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRecipeIds(new Set(recipes.map((r) => r.id)));
    } else {
      setSelectedRecipeIds(new Set());
    }
  };
  const handleSelectRow = (id) => {
    const next = new Set(selectedRecipeIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
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
    <div className="bg-brand-surface rounded-xl border border-brand-border shadow-sm overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-brand-border">
        <h2 className="text-lg font-bold text-brand-text">Recipes</h2>
        {numSelected > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-brand-primary">{numSelected} selected</span>
            <button
              onClick={onDelete}
              className="p-2 rounded-full text-brand-danger hover:bg-red-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Delete selected recipes"
            >
              <DeleteIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-brand-subtext">
          <thead className="bg-brand-surface-muted text-xs text-brand-subtext uppercase tracking-wider">
            <tr>
              <th scope="col" className="p-4">
                <input
                  ref={checkboxRef}
                  type="checkbox"
                  className="w-4 h-4 text-brand-primary bg-gray-100 border-gray-300 rounded focus:ring-brand-primary"
                  onChange={handleSelectAll}
                  checked={rowCount > 0 && numSelected === rowCount}
                />
              </th>
              <th scope="col" className="px-6 py-3">Recipe</th>
              <th scope="col" className="px-6 py-3">Units per Batch</th>
              <th scope="col" className="px-6 py-3">Ingredients</th>
              <th scope="col" className="px-6 py-3">Quantities</th>
              <th scope="col" className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((r, idx) => (
              <tr
                key={r.id}
                className={`${idx % 2 === 0 ? "bg-brand-surface" : "bg-brand-surface-muted"} border-b border-brand-border hover:bg-violet-50 transition-colors`}
              >
                <td className="w-4 p-4">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-brand-primary bg-gray-100 border-gray-300 rounded focus:ring-brand-primary"
                    checked={selectedRecipeIds.has(r.id)}
                    onChange={() => handleSelectRow(r.id)}
                  />
                </td>
                <td className="px-6 py-4 font-semibold text-brand-text whitespace-nowrap">{r.name}</td>
                <td className="px-6 py-4">{r.unitsPerBatch}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onOpenDrawer(r.id, "ingredients")}
                    className="font-medium text-brand-primary hover:text-brand-primary-dark hover:underline"
                  >
                    View ({r.ingredients.length})
                  </button>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onOpenDrawer(r.id, "quantities")}
                    className="font-medium text-brand-primary hover:text-brand-primary-dark hover:underline"
                  >
                    View Quantities
                  </button>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onEdit(r)}
                    className="p-2 rounded-full text-brand-primary hover:bg-violet-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    aria-label={`Edit ${r.name}`}
                  >
                    <EditIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {recipes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-brand-subtext">
                  No recipes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ================= Drawer ================= */
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
    if (!searchTerm) return displayItems;
    const q = searchTerm.toLowerCase();
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
    const filename = `${(recipe?.name || "recipe").replace(/\s+/g, "_")}_${type}.csv`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-brand-surface shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <header className="p-4 text-white bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-white/20 flex items-center justify-center">
                <MenuIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{type === "ingredients" ? "Ingredients" : "Quantities"}</h2>
                <p className="text-sm opacity-90">{recipe?.name || "No recipe selected"}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors">
              <CloseIcon className="w-6 h-6" />
            </button>
          </header>

          {/* Summary */}
          <div className="p-4 flex-grow overflow-y-auto bg-slate-50">
            <div className="bg-white p-3 rounded-lg border border-brand-border shadow-sm mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold text-brand-subtext uppercase">Recipe</p>
                  <p className="text-lg font-bold text-brand-text">{recipe?.name || "—"}</p>
                  <p className="text-xs text-brand-subtext">Units per batch: {recipe?.unitsPerBatch ?? "N/A"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-brand-subtext uppercase">Items</p>
                  <p className="text-3xl font-black text-brand-primary">{filtered.length}</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="sticky top-0 bg-slate-50 py-2">
              <input
                type="text"
                placeholder="Filter items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
            </div>

            {/* Items */}
            <ul className="mt-4 space-y-2">
              {filtered.map((it, i) => (
                <li key={i} className="flex items-center justify-between bg-white p-3 rounded-md border border-brand-border">
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-violet-100 text-brand-primary rounded-full flex items-center justify-center">
                      <CheckIcon className="w-4 h-4" />
                    </span>
                    <span className="font-medium text-brand-text">{it.name}</span>
                  </div>
                  {type === "quantities" && (
                    <span className="text-sm font-semibold bg-slate-100 text-brand-subtext px-2.5 py-0.5 rounded-full">
                      {it.details}
                    </span>
                  )}
                </li>
              ))}
              {filtered.length === 0 && <li className="text-center text-brand-subtext py-8">No items found.</li>}
            </ul>
          </div>

          {/* Footer */}
          <footer className="p-4 border-t border-brand-border flex-shrink-0 flex items-center justify-between bg-brand-surface">
            <button
              onClick={exportCsv}
              disabled={!recipe}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-primary border border-brand-border rounded-lg hover:bg-violet-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DownloadIcon className="w-5 h-5" />
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-semibold text-white bg-brand-primary rounded-lg shadow-sm hover:bg-brand-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary"
            >
              Done
            </button>
          </footer>
        </div>
      </div>
    </>
  );
};

/* ================= Edit Modal ================= */
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-brand-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-brand-text">Edit Recipe</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <CloseIcon className="w-6 h-6 text-brand-subtext" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-subtext mb-1">Recipe Name</label>
              <input
                type="text"
                value={edited?.name || ""}
                onChange={(e) => handleField("name", e.target.value)}
                className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-subtext mb-1">Units per Batch</label>
              <input
                type="number"
                value={edited?.unitsPerBatch ?? 0}
                onChange={(e) => handleField("unitsPerBatch", parseInt(e.target.value || "0", 10))}
                className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-brand-text mb-2">Ingredients</h3>
            <div className="space-y-3">
              {(edited?.ingredients || []).map((ing, idx) => (
                <div
                  key={ing.id || idx}
                  className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,auto] gap-3 items-center bg-slate-50 p-3 rounded-md border border-brand-border"
                >
                  <input
                    type="text"
                    placeholder="Ingredient Name"
                    value={ing.name}
                    onChange={(e) => handleIngredient(idx, "name", e.target.value)}
                    className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={ing.quantity}
                    onChange={(e) => handleIngredient(idx, "quantity", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none"
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => handleIngredient(idx, "unit", e.target.value)}
                    className="w-full px-3 py-2 border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary focus:outline-none bg-white"
                  >
                    {UNIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeIngredient(idx)}
                    className="p-2 text-brand-danger hover:bg-red-100 rounded-full transition-colors"
                  >
                    <DeleteIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addIngredient}
              className="mt-4 flex items-center gap-2 px-3 py-2 text-sm font-semibold text-brand-primary rounded-lg hover:bg-violet-50 transition-colors border border-brand-border"
            >
              <AddIcon className="w-5 h-5" />
              Add Ingredient
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-brand-border flex justify-end gap-3 bg-slate-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-brand-subtext bg-white border border-brand-border rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-primary rounded-lg shadow-sm hover:bg-brand-primary-dark disabled:bg-slate-400"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= Delete Modal ================= */
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, count }) => {
  if (!isOpen || count === 0) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
        <div className="p-6 text-center">
          <div className="mx-auto w-12 h-12 flex items-center justify-center bg-red-100 rounded-full mb-4">
            <DeleteIcon className="w-6 h-6 text-brand-danger" />
          </div>
          <h3 className="text-lg font-semibold text-brand-text">Confirm Deletion</h3>
          <p className="text-sm text-brand-subtext mt-2">
            Delete {count} selected recipe{count > 1 ? "s" : ""}? This action cannot be undone.
          </p>
        </div>
        <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-brand-subtext bg-white border border-brand-border rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-danger rounded-lg shadow-sm hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= Main Screen ================= */
const Recipes = () => {
  const { cognitoId } = useAuth();
  const { rows, setRows } = useData(); // rows is grouped MUI shape in original file

  // Local derived "recipes" in Tailwind component shape
  const [recipes, setRecipes] = useState([]); // Array<Recipe>
  const [selectedRecipeIds, setSelectedRecipeIds] = useState(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState("ingredients"); // 'ingredients' | 'quantities'
  const [drawerRecipe, setDrawerRecipe] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);

  // Fetch & format (keeps original functionality) :contentReference[oaicite:1]{index=1}
  useEffect(() => {
    if (!cognitoId) return;
    const fetchRecipeData = async () => {
      try {
        const res = await fetch(`${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`);
        if (!res.ok) throw new Error("Failed to fetch Recipe data");
        const data = await res.json();

        // Group by recipe_id (original logic)
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

        // Convert to Tailwind view model
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
    };
    fetchRecipeData();
  }, [cognitoId, setRows]);

  /* Drawer handlers */
  const handleOpenDrawer = (recipeId, type) => {
    const r = recipes.find((x) => x.id === recipeId);
    setDrawerRecipe(r || null);
    setDrawerType(type);
    setDrawerOpen(true);
  };
  const handleCloseDrawer = () => setDrawerOpen(false);

  /* Edit handlers (fetch full details before opening, like original) */
  const handleEdit = async (recipe) => {
    try {
      const url = `${API_BASE}/recipes/${encodeURIComponent(recipe.id)}?cognito_id=${encodeURIComponent(cognitoId)}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Failed to fetch recipe ${recipe.id}`);
      const payload = await resp.json();
      // payload: { recipe_id, recipe_name, units_per_batch, ingredients: [{ ingredient_name, quantity, unit, id }] }
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

      // Refetch list to keep parity with server (original behavior) :contentReference[oaicite:2]{index=2}
      const r2 = await fetch(`${API_BASE}/recipes?cognito_id=${encodeURIComponent(cognitoId)}`);
      if (!r2.ok) throw new Error("Failed to refresh recipes");
      const data = await r2.json();

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

      setEditOpen(false);
      setEditingRecipe(null);
    } catch (e) {
      console.error("Save recipe failed:", e);
      alert("Save failed. See console for details.");
    }
  };

  /* Delete */
  const handleConfirmDelete = async () => {
    const ids = Array.from(selectedRecipeIds);
    if (!ids.length || !cognitoId) {
      setDeleteOpen(false);
      return;
    }
    try {
      // call API for each selected id
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
      // update local state
      const remaining = recipes.filter((r) => !selectedRecipeIds.has(r.id));
      setRecipes(remaining);
      setSelectedRecipeIds(new Set());
    } catch (e) {
      console.error("Error deleting recipes:", e);
      alert("Could not delete recipes.");
    } finally {
      setDeleteOpen(false);
    }
  };

  return (
    <div className="m-5 space-y-4">
      <RecipeTable
        recipes={recipes}
        onOpenDrawer={handleOpenDrawer}
        onEdit={handleEdit}
        selectedRecipeIds={selectedRecipeIds}
        setSelectedRecipeIds={setSelectedRecipeIds}
        onDelete={() => setDeleteOpen(true)}
      />

      <RecipeDrawer isOpen={drawerOpen} onClose={handleCloseDrawer} recipe={drawerRecipe} type={drawerType} />

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
    </div>
  );
};

export default Recipes;
