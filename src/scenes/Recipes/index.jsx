// src/scenes/recipes/Recipes.jsx
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/* -------------------------------- Icons -------------------------------- */
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

const PlusIcon = (props) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
  </Svg>
);

/* ---------------------------- Shared constants ---------------------------- */
const UNIT_OPTIONS = [
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "kg", label: "Kilograms (Kg)" },
  { value: "l", label: "Litres (L)" },
  { value: "units", label: "Units" },
];

/* -------------------------------- Modal -------------------------------- */
const Modal = ({ isOpen, onClose, children, className = "max-w-2xl" }) => {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${className} flex flex-col max-h-[90vh] animate-slide-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
      {/* Animations */}
      <style>{`
        @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slide-up { from { transform: translateY(20px) scale(.98); opacity: 0 } to { transform: translateY(0) scale(1); opacity: 1 } }
        .animate-fade-in{animation:fade-in .2s ease-out forwards}
        .animate-slide-up{animation:slide-up .3s ease-out forwards}
      `}</style>
    </div>
  );
};

/* ----------------------------- Recipe Drawer ----------------------------- */
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

  const filteredItems = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return displayItems.filter((it) => it.fullText.includes(query));
  }, [displayItems, searchTerm]);

  const exportCsv = () => {
    if (!recipe) return;
    const headers = type === "quantities" ? ["Ingredient", "Quantity", "Unit"] : ["Ingredient"];
    const rows = recipe.ingredients.map((ing) =>
      type === "quantities" ? [ing.name, String(ing.quantity), ing.unit] : [ing.name]
    );
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${recipe.name.replace(/\s+/g, "_")}_${type}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-white/20 p-2 rounded-lg"><MenuIcon /></span>
            <div>
              <h3 className="text-lg font-bold">{type === "ingredients" ? "Ingredients" : "Quantities"}</h3>
              <p className="text-sm opacity-90">{recipe?.name || "No recipe selected"}</p>
            </div>
          </div>
          <button className="p-2 rounded-full text-white hover:bg-white/20 transition-colors" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="p-4 bg-slate-100 overflow-y-auto flex-1">
          <div className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center shadow-sm mb-4">
            <div>
              <div className="text-xs uppercase font-bold text-slate-500">Recipe</div>
              <div className="font-bold text-slate-800">{recipe?.name || "—"}</div>
              <div className="text-xs text-slate-500">Units per batch: {recipe?.unitsPerBatch ?? "N/A"}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase font-bold text-slate-500">Items</div>
              <div className="text-3xl font-extrabold text-indigo-600">{filteredItems.length}</div>
            </div>
          </div>

          <div className="sticky top-0 bg-slate-100 py-2">
            <input
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              type="text"
              placeholder="Filter items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ul className="mt-2 space-y-2">
            {filteredItems.map((item, index) => (
              <li key={index} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><CheckIcon className="w-3 h-3" /></span>
                  <span className="font-semibold text-slate-700">{item.name}</span>
                </div>
                {type === "quantities" && (
                  <span className="text-sm font-medium bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                    {item.details}
                  </span>
                )}
              </li>
            ))}
            {filteredItems.length === 0 && (
              <li className="flex justify-center bg-white border border-slate-200 rounded-lg p-3">
                <span className="text-slate-500">No items found.</span>
              </li>
            )}
          </ul>
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-white">
          <button
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition"
            onClick={exportCsv}
            disabled={!recipe}
          >
            <DownloadIcon /> Export CSV
          </button>
          <button
            className="px-5 py-2 font-semibold text-white bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-800 transition"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
};

/* ------------------------------ Edit Modal ------------------------------ */
const EditRecipeModal = ({ isOpen, onClose, onSave, recipe }) => {
  const [editedRecipe, setEditedRecipe] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (recipe) setEditedRecipe(JSON.parse(JSON.stringify(recipe)));
    else setEditedRecipe(null);
  }, [recipe]);

  if (!isOpen || !editedRecipe) return null;

  const handleFieldChange = (key, value) => {
    setEditedRecipe((prev) => ({ ...prev, [key]: value }));
  };

  const handleIngredientChange = (index, key, value) => {
    const newIngredients = [...editedRecipe.ingredients];
    newIngredients[index] = { ...newIngredients[index], [key]: value };
    setEditedRecipe({ ...editedRecipe, ingredients: newIngredients });
  };

  const addIngredient = () => {
    const newIngredient = {
      id: `new_${Date.now()}`,
      name: "",
      quantity: 0,
      unit: UNIT_OPTIONS[0].value,
    };
    setEditedRecipe({ ...editedRecipe, ingredients: [...editedRecipe.ingredients, newIngredient] });
  };

  const removeIngredient = (index) => {
    const newIngredients = editedRecipe.ingredients.filter((_, i) => i !== index);
    setEditedRecipe({ ...editedRecipe, ingredients: newIngredients });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(editedRecipe);
    setIsSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Edit Recipe</h2>
        <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition" onClick={onClose}><CloseIcon /></button>
      </div>

      <div className="p-6 overflow-y-auto space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600">Recipe Name</label>
            <input
              type="text"
              value={editedRecipe.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600">Units per Batch</label>
            <input
              type="number"
              value={editedRecipe.unitsPerBatch}
              onChange={(e) => handleFieldChange("unitsPerBatch", parseInt(e.target.value || "0", 10))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-3">Ingredients</h3>
          <div className="space-y-3">
            {editedRecipe.ingredients.map((ing, idx) => (
              <div
                key={ing.id}
                className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,auto] gap-3 items-center bg-slate-50 p-3 rounded-lg border border-slate-200"
              >
                <input
                  type="text"
                  placeholder="Ingredient Name"
                  value={ing.name}
                  onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={ing.quantity}
                  onChange={(e) => handleIngredientChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={ing.unit}
                  onChange={(e) => handleIngredientChange(idx, "unit", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  className="p-2 rounded-full text-red-500 hover:bg-red-100 transition"
                  onClick={() => removeIngredient(idx)}
                  title="Remove"
                >
                  <DeleteIcon />
                </button>
              </div>
            ))}
          </div>

          <button
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition"
            onClick={addIngredient}
          >
            <PlusIcon /> Add Ingredient
          </button>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-t border-gray-200 flex justify-end gap-3">
        <button className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition" onClick={onClose}>
          Cancel
        </button>
        <button
          className="px-5 py-2 font-semibold text-white bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </Modal>
  );
};

/* ---------------------------- Add Recipe Modal ---------------------------- */
const initialRecipeState = {
  name: "",
  unitsPerBatch: 1,
  ingredients: [{ id: `new_${Date.now()}`, name: "", quantity: 0, unit: UNIT_OPTIONS[0].value }],
};

const AddRecipeModal = ({ isOpen, onClose, onSave }) => {
  const [newRecipe, setNewRecipe] = useState(initialRecipeState);
  const [isSaving, setIsSaving] = useState(false);

  const handleFieldChange = (key, value) => {
    setNewRecipe((prev) => ({ ...prev, [key]: value }));
  };

  const handleIngredientChange = (index, key, value) => {
    const next = [...newRecipe.ingredients];
    next[index] = { ...next[index], [key]: value };
    setNewRecipe((prev) => ({ ...prev, ingredients: next }));
  };

  const addIngredient = () => {
    const ing = { id: `new_${Date.now()}`, name: "", quantity: 0, unit: UNIT_OPTIONS[0].value };
    setNewRecipe((prev) => ({ ...prev, ingredients: [...prev.ingredients, ing] }));
  };

  const removeIngredient = (index) => {
    setNewRecipe((prev) => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(newRecipe);
    setNewRecipe(initialRecipeState);
    setIsSaving(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Add New Recipe</h2>
        <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition" onClick={onClose}><CloseIcon /></button>
      </div>

      <div className="p-6 overflow-y-auto space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600">Recipe Name</label>
            <input
              type="text"
              placeholder="e.g., Chocolate Chip Cookies"
              value={newRecipe.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-600">Units per Batch</label>
            <input
              type="number"
              value={newRecipe.unitsPerBatch}
              onChange={(e) => handleFieldChange("unitsPerBatch", parseInt(e.target.value || "0", 10))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-3">Ingredients</h3>
          <div className="space-y-3">
            {newRecipe.ingredients.map((ing, idx) => (
              <div
                key={ing.id}
                className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,auto] gap-3 items-center bg-slate-50 p-3 rounded-lg border border-slate-200"
              >
                <input
                  type="text"
                  placeholder="Ingredient Name"
                  value={ing.name}
                  onChange={(e) => handleIngredientChange(idx, "name", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={ing.quantity}
                  onChange={(e) => handleIngredientChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={ing.unit}
                  onChange={(e) => handleIngredientChange(idx, "unit", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  className="p-2 rounded-full text-red-500 hover:bg-red-100 transition"
                  onClick={() => removeIngredient(idx)}
                  title="Remove"
                >
                  <DeleteIcon />
                </button>
              </div>
            ))}
          </div>
          <button
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition"
            onClick={addIngredient}
          >
            <PlusIcon /> Add Ingredient
          </button>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-t border-gray-200 flex justify-end gap-3">
        <button className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition" onClick={onClose}>
          Cancel
        </button>
        <button
          className="px-5 py-2 font-semibold text-white bg-gradient-to-br from-indigo-600 to-purple-700 rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Creating..." : "Create Recipe"}
        </button>
      </div>
    </Modal>
  );
};

/* ------------------------- Delete Confirmation Modal ------------------------- */
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, count }) => {
  if (!isOpen || count === 0) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Confirm Deletion</h2>
        <button className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition" onClick={onClose}><CloseIcon /></button>
      </div>
      <div className="p-8 text-center">
        <div className="w-16 h-16 inline-flex items-center justify-center bg-red-100 text-red-600 rounded-full mb-4">
          <DeleteIcon className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Delete {count} recipe{count > 1 ? "s" : ""}?</h3>
        <p className="mt-2 text-slate-600">This action is permanent and cannot be undone.</p>
      </div>
      <div className="p-4 bg-slate-50 border-t border-gray-200 flex justify-end gap-3">
        <button className="px-4 py-2 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition" onClick={onClose}>
          Cancel
        </button>
        <button className="px-5 py-2 font-semibold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition" onClick={onConfirm}>
          Delete
        </button>
      </div>
    </Modal>
  );
};

/* ------------------------------- Recipe Table ------------------------------ */
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
    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/40 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-extrabold text-slate-800">Recipes</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {numSelected > 0 && (
            <div className="flex items-center gap-3 bg-indigo-50 p-2 rounded-lg">
              <span className="text-sm font-bold text-indigo-600">{numSelected} selected</span>
              <button
                className="p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors"
                onClick={onDelete}
                aria-label="Delete selected"
              >
                <DeleteIcon />
              </button>
            </div>
          )}
          <button
            className="flex-grow sm:flex-grow-0 w-full justify-center inline-flex items-center gap-2 px-5 py-3 font-semibold text-white bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full shadow-md hover:from-indigo-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-105"
            onClick={onAdd}
            aria-label="Add Recipe"
          >
            <PlusIcon /> Add Recipe
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="p-4">
                <input
                  ref={checkboxRef}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={rowCount > 0 && numSelected === rowCount}
                />
              </th>
              <th className="p-4">Recipe</th>
              <th className="p-4">Units per Batch</th>
              <th className="p-4">Ingredients</th>
              <th className="p-4">Quantities</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {recipes.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <input
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    type="checkbox"
                    checked={selectedRecipeIds.has(r.id)}
                    onChange={() => handleSelectRow(r.id)}
                  />
                </td>
                <td className="p-4 font-bold text-slate-900 whitespace-nowrap">{r.name}</td>
                <td className="p-4">{r.unitsPerBatch}</td>
                <td className="p-4">
                  <button
                    className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    onClick={() => onOpenDrawer(r.id, "ingredients")}
                  >
                    View ({r.ingredients.length})
                  </button>
                </td>
                <td className="p-4">
                  <button
                    className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    onClick={() => onOpenDrawer(r.id, "quantities")}
                  >
                    View Quantities
                  </button>
                </td>
                <td className="p-4 text-center">
                  <button
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                    onClick={() => onEdit(r)}
                    aria-label={`Edit ${r.name}`}
                  >
                    <EditIcon className="w-4 h-4" /> Edit
                  </button>
                </td>
              </tr>
            ))}
            {recipes.length === 0 && (
              <tr>
                <td className="p-4 text-center text-slate-500" colSpan={6}>
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

/* --------------------------------- Screen --------------------------------- */
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
    <div className="p-5">
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
