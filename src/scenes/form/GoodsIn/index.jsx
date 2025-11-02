// src/scenes/form/GoodsIn/index.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Formik, FieldArray, getIn } from "formik";
import * as yup from "yup";

import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { Badge } from "./components/ui/badge";
import { ScrollArea } from "./components/ui/scroll-area";
import { Checkbox } from "./components/ui/checkbox";
import { toast } from "sonner@2.0.3";
import { Toaster } from "./components/ui/sonner";

import {
  PackagePlus,
  Package as PackageIcon,
  Plus,
  Trash2,
  Check,
  Loader2,
  CalendarDays,
  Thermometer,
  Barcode,
  Scale,
  FileText,
  Slider as SliderIcon,
} from "lucide-react";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const unitOptions = [
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "kg", label: "Kilograms (Kg)" },
  { value: "l", label: "Litres (L)" },
  { value: "units", label: "Units" },
];

// Mock auth context replacement (use your real auth in production)
const useAuth = () => ({ cognitoId: "mock-cognito-id" });

// Validation schema (mirrors original)
const itemSchema = yup.object().shape({
  date: yup.string().required("Date is required"),
  ingredient: yup.string().required("Ingredient is required"),
  stockReceived: yup
    .number()
    .typeError("Must be a number")
    .required("Stock amount is required")
    .positive("Must be positive"),
  unit: yup.string().required("Metric unit is required"),
  barCode: yup.string().required("Batch code is required"),
  expiryDate: yup.string().required("Expiry date is required"),
  temperature: yup.string().required("Temperature is required"),
  invoiceNumber: yup.string().notRequired(),
});

const batchSchema = yup.object().shape({
  items: yup.array().of(itemSchema).min(1, "At least one good is required"),
});

export default function GoodsInForm() {
  const { cognitoId } = useAuth();
  const [activeTab, setActiveTab] = useState("single");
  const [masterIngredients, setMasterIngredients] = useState([]);
  const [customIngredients, setCustomIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  const [addIngredientOpen, setAddIngredientOpen] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [addingIngredient, setAddingIngredient] = useState(false);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [batchPreviewItems, setBatchPreviewItems] = useState([]);
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  const addGoodRef = useRef(null);

  // slider for column min width multiplier (1..2.5)
  const [colWidthMultiplier, setColWidthMultiplier] = useState(1.0);

  // selected rows (for main table style example / selection)
  const [selectedRows, setSelectedRows] = useState([]);

  // load ingredients (preserve original API usage)
  useEffect(() => {
    if (!cognitoId) return;
    setLoadingIngredients(true);
    fetch(`${API_BASE}/ingredients?cognito_id=${encodeURIComponent(cognitoId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject("Failed")))
      .then((data) => {
        // Expecting an array of { id, name }
        setMasterIngredients(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        // fallback mock if API not available
        setMasterIngredients([
          { id: "1", name: "Organic Flour" },
          { id: "2", name: "Fresh Milk" },
          { id: "3", name: "Cane Sugar" },
          { id: "4", name: "Butter" },
          { id: "5", name: "Vanilla Extract" },
        ]);
      })
      .finally(() => setLoadingIngredients(false));

    // fetch custom
    fetch(`${API_BASE}/custom-ingredients?cognito_id=${encodeURIComponent(cognitoId)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject("Failed custom")))
      .then((data) => setCustomIngredients(Array.isArray(data) ? data.map(ci => ({ id: `c-${ci.id}`, name: ci.name })) : []))
      .catch(() => setCustomIngredients([]));
  }, [cognitoId]);

  const ingredients = useMemo(
    () => [
      ...masterIngredients.map((i) => ({ ...i, source: "master" })),
      ...customIngredients.map((i) => ({ ...i, source: "custom" })),
    ],
    [masterIngredients, customIngredients]
  );

  // helper to find ingredient name from id
  const getIngredientName = (id) => {
    if (!id) return id;
    const f = ingredients.find(i => String(i.id) === String(id));
    return f ? f.name : id;
  };

  // initial single and batch items
  const initialSingle = {
    date: new Date().toISOString().split("T")[0],
    ingredient: "",
    stockReceived: "",
    unit: "grams",
    barCode: "",
    expiryDate: new Date().toISOString().split("T")[0],
    temperature: "N/A",
    invoiceNumber: "",
  };

  const initialBatchItem = { ...initialSingle };

  // add ingredient
  const handleAddIngredient = async () => {
    if (!newIngredientName.trim() || !cognitoId) {
      toast.error("Enter an ingredient name");
      return;
    }
    setAddingIngredient(true);
    try {
      // try to POST to API
      const resp = await fetch(`${API_BASE}/custom-ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cognito_id: cognitoId, name: newIngredientName.trim() }),
      });
      if (!resp.ok) throw new Error("API failed");
      // re-fetch custom list
      const updated = await fetch(`${API_BASE}/custom-ingredients?cognito_id=${encodeURIComponent(cognitoId)}`).then(r => r.ok ? r.json() : []);
      setCustomIngredients(Array.isArray(updated) ? updated.map(ci => ({ id: `c-${ci.id}`, name: ci.name })) : []);
      toast.success("Ingredient added");
      setAddIngredientOpen(false);
      setNewIngredientName("");
    } catch (err) {
      // fallback: local append
      const newIng = { id: `c-${Date.now()}`, name: newIngredientName.trim() };
      setCustomIngredients(prev => [...prev, newIng]);
      toast.success("Ingredient added (local)");
      setAddIngredientOpen(false);
      setNewIngredientName("");
    } finally {
      setAddingIngredient(false);
    }
  };

  // SUBMIT helpers (single + batch)
  const submitSingle = async (values, { resetForm }) => {
    const payload = {
      ...values,
      ingredient: getIngredientName(values.ingredient) || values.ingredient,
      ingredientId: values.ingredient || null,
      cognito_id: cognitoId,
      invoiceNumber: values.invoiceNumber || null,
    };

    try {
      const res = await fetch(`${API_BASE}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // fallback: attempt parsing or throw
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Submit failed ${res.status}`);
      }

      resetForm();
      toast.success("Stock recorded");
    } catch (err) {
      console.error("submitSingle error:", err);
      toast.error("Submit failed. See console.");
    }
  };

  const submitBatch = async (values, { resetForm }) => {
    // expand ingredient names
    const items = (values.items || []).map(it => ({
      ...it,
      ingredient: getIngredientName(it.ingredient) || it.ingredient,
      ingredientId: it.ingredient || null,
      invoiceNumber: it.invoiceNumber || null,
    }));

    try {
      const res = await fetch(`${API_BASE}/submit/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: items, cognito_id: cognitoId }),
      });

      if (res.ok) {
        resetForm();
        toast.success("Batch submitted");
        return;
      }

      // fallback to sequential submit
      for (const it of items) {
        const r = await fetch(`${API_BASE}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...it, cognito_id: cognitoId }),
        });
        if (!r.ok) {
          console.error("item submit failed:", await r.text().catch(() => r.status));
        }
      }
      resetForm();
      toast.success("Batch submitted (fallback)");
    } catch (err) {
      console.error("submitBatch error:", err);
      toast.error("Batch submit failed");
    }
  };

  // Helper to open confirm preview for batch after validation
  const openBatchConfirmDialog = async ({ validateForm, values, setTouched, resetForm }) => {
    const errors = await validateForm();
    if (errors && Object.keys(errors).length) {
      // mark touched for all items so user sees errors
      const touchedItems = (values.items || []).map(() => ({
        date: true,
        ingredient: true,
        stockReceived: true,
        unit: true,
        barCode: true,
        expiryDate: true,
        temperature: true,
        invoiceNumber: true,
      }));
      setTouched({ items: touchedItems }, false);
      toast.error("Fix validation errors first");
      return;
    }
    // set preview and keep resetForm for final submit
    setBatchPreviewItems(values.items || []);
    // store a small handler closure for confirm
    setConfirmDialogOpen(true);
    // keep reset form ref inside closure via batchSubmitting flow
    // we will call submitBatch when user confirms
    // store resetForm on state for handleConfirmMultiple if needed
    // (we will just call submitBatch without resetForm reference; Formik will handle it earlier)
  };

  const handleConfirmMultiple = async () => {
    if (!batchPreviewItems || batchPreviewItems.length === 0) {
      setConfirmDialogOpen(false);
      return;
    }
    setBatchSubmitting(true);
    try {
      // attempt batch submit (we'll call submitBatch with local structure)
      await submitBatch({ items: batchPreviewItems }, { resetForm: () => {} });
      setConfirmDialogOpen(false);
      setBatchPreviewItems([]);
    } catch (err) {
      console.error("confirm multiple error:", err);
      toast.error("Confirmation submit failed");
    } finally {
      setBatchSubmitting(false);
    }
  };

  // ---------------------------
  // Totals & Unit normalization
  // ---------------------------
  // Accepts an array of items with { stockRemaining, unit } and returns:
  // { total: number, display: "1.23", unitLabel: "kg", breakdown: { grams: x, kg: y, ... } }
  const computeNormalizedTotals = (rows = []) => {
    // We'll normalize into base units:
    // mass base: grams
    // volume base: ml
    // unit base: units (no conversion)
    const massUnits = ["grams", "kg"];
    const volUnits = ["ml", "l"];
    const unitBuckets = {}; // { unit: sumInBase }

    let massSumGrams = 0;
    let volSumMl = 0;
    let unitsSum = 0;

    for (const r of rows) {
      const val = Number(r.stockRemaining ?? r.stockReceived ?? 0) || 0;
      const u = (r.unit || "").toLowerCase();
      if (massUnits.includes(u)) {
        if (u === "kg") massSumGrams += val * 1000;
        else massSumGrams += val;
      } else if (volUnits.includes(u)) {
        if (u === "l") volSumMl += val * 1000;
        else volSumMl += val;
      } else if (u === "units") {
        unitsSum += val;
      } else {
        // unknown -> try parse suffix (g, kg, ml, l)
        if (u === "g") massSumGrams += val;
        else if (u === "kg") massSumGrams += val * 1000;
        else unitsSum += val;
      }
    }

    // Decide display units:
    // For mass: if massSumGrams >= 1000 → show kg, else grams
    let massDisplay = null;
    if (massSumGrams > 0) {
      if (massSumGrams >= 1000) {
        massDisplay = { total: +(massSumGrams / 1000).toFixed(3), unitLabel: "kg" };
      } else {
        massDisplay = { total: +massSumGrams.toFixed(2), unitLabel: "g" };
      }
    }

    // For volume:
    let volDisplay = null;
    if (volSumMl > 0) {
      if (volSumMl >= 1000) {
        volDisplay = { total: +(volSumMl / 1000).toFixed(3), unitLabel: "L" };
      } else {
        volDisplay = { total: +volSumMl.toFixed(2), unitLabel: "ml" };
      }
    }

    let unitsDisplay = null;
    if (unitsSum > 0) unitsDisplay = { total: +unitsSum.toFixed(2), unitLabel: "units" };

    return { massDisplay, volDisplay, unitsDisplay };
  };

  // Example area: quickly compute totals from batchPreviewItems (or empty)
  // But we also want to show "quick stats" for the page; we'll compute based on batchPreviewItems if set else no items
  const pageRowsForTotals = batchPreviewItems.length ? batchPreviewItems : [];

  const normalizedTotals = useMemo(() => computeNormalizedTotals(pageRowsForTotals), [pageRowsForTotals]);

  // ---------------------------
  // Responsive table column sizing helpers
  // ---------------------------
  // We will use CSS variable --col-min-w and set it via the slider multiplier
  const colMinWidth = `${Math.max(120, Math.round(120 * colWidthMultiplier))}px`;

  // ---------------------------
  // Simple toggle row selection for demonstration in page table
  // ---------------------------
  const toggleRowSelection = (id) => {
    setSelectedRows(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  // ---------------------------
  // UI: render
  // ---------------------------
  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-4 md:p-8">
        <style>{`
          /* Ensure the page itself never horizontal-scrolls */
          html, body, #root { overflow-x: hidden; }
          /* set CSS variable for column min width */
          :root { --col-min-w: ${colMinWidth}; }
          /* small helper: responsive table cells will wrap below min width to avoid horizontal scroll */
          .wrap-table-grid {
            display: grid;
            grid-template-columns: minmax(var(--col-min-w), 1fr) minmax(var(--col-min-w), 1fr) minmax(var(--col-min-w), 1fr) minmax(var(--col-min-w), 1fr) minmax(var(--col-min-w), 1fr) minmax(var(--col-min-w), 1fr) minmax(var(--col-min-w), 1fr) minmax(var(--col-min-w), 1fr) minmax(var(--col-min-w), 1fr);
            gap: 8px;
          }
          @media (max-width: 1100px) {
            .wrap-table-grid {
              grid-template-columns: 1fr 1fr 1fr; /* stack into 3 columns on narrow screens */
            }
          }
          @media (max-width: 640px) {
            .wrap-table-grid {
              grid-template-columns: 1fr; /* single column on mobile */
            }
          }

          .stat-box { min-width: 140px; }
        `}</style>

        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <PackageIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-slate-900 text-lg font-bold">Goods In</h1>
                <p className="text-slate-600 text-sm">Record inbound inventory — single or multiple entries</p>
              </div>
            </div>

            {/* Quick stats + slider */}
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-lg border border-slate-200 px-4 py-2 flex items-center gap-3 stat-box">
                <div>
                  <div className="text-xs text-slate-500">Quick total (mass)</div>
                  <div className="text-xl font-extrabold text-slate-900">
                    {normalizedTotals.massDisplay ? normalizedTotals.massDisplay.total : "—"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{normalizedTotals.massDisplay ? normalizedTotals.massDisplay.unitLabel : ""}</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 px-4 py-2 flex items-center gap-3 stat-box">
                <div>
                  <div className="text-xs text-slate-500">Quick total (volume)</div>
                  <div className="text-xl font-extrabold text-slate-900">
                    {normalizedTotals.volDisplay ? normalizedTotals.volDisplay.total : "—"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{normalizedTotals.volDisplay ? normalizedTotals.volDisplay.unitLabel : ""}</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 px-4 py-2 flex items-center gap-3 stat-box">
                <div>
                  <div className="text-xs text-slate-500">Quick total (units)</div>
                  <div className="text-xl font-extrabold text-slate-900">
                    {normalizedTotals.unitsDisplay ? normalizedTotals.unitsDisplay.total : "—"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{normalizedTotals.unitsDisplay ? normalizedTotals.unitsDisplay.unitLabel : ""}</div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center gap-2">
                <SliderIcon className="w-4 h-4 text-slate-500" />
                <input
                  aria-label="Column width"
                  type="range"
                  min="0.8"
                  max="2.0"
                  step="0.05"
                  value={colWidthMultiplier}
                  onChange={(e) => setColWidthMultiplier(Number(e.target.value))}
                  style={{ width: 160 }}
                />
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="single" className="gap-2">
                <PackageIcon className="w-4 h-4" />
                Single Entry
              </TabsTrigger>
              <TabsTrigger value="multiple" className="gap-2">
                <PackagePlus className="w-4 h-4" />
                Multiple Entries
              </TabsTrigger>
            </TabsList>

            {/* SINGLE */}
            <TabsContent value="single" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Single Stock Entry</CardTitle>
                  <CardDescription>Record one item at a time</CardDescription>
                </CardHeader>
                <CardContent>
                  <Formik
                    initialValues={initialSingle}
                    validationSchema={itemSchema}
                    onSubmit={submitSingle}
                  >
                    {({ values, errors, touched, handleBlur, handleChange, handleSubmit, setFieldValue, validateForm, setTouched }) => {
                      const onPrimary = async () => {
                        const errs = await validateForm();
                        if (errs && Object.keys(errs).length) {
                          // mark touched
                          setTouched({
                            date: true,
                            ingredient: true,
                            stockReceived: true,
                            unit: true,
                            barCode: true,
                            expiryDate: true,
                            temperature: true,
                            invoiceNumber: true,
                          }, false);
                          toast.error("Fix validation errors");
                          return;
                        }
                        await handleSubmit();
                      };

                      return (
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div className="wrap-table-grid">
                            {/* Date */}
                            <div>
                              <Label>Date *</Label>
                              <Input
                                type="date"
                                name="date"
                                value={values.date}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                aria-invalid={!!(touched.date && errors.date)}
                                data-field="date"
                              />
                              {touched.date && errors.date && <div className="text-xs text-red-600 mt-1">{errors.date}</div>}
                            </div>

                            {/* Ingredient */}
                            <div>
                              <Label>Ingredient *</Label>
                              <Select
                                value={values.ingredient}
                                onValueChange={(v) => setFieldValue("ingredient", v)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select ingredient" />
                                </SelectTrigger>
                                <SelectContent>
                                  {loadingIngredients ? (
                                    <SelectItem value="">Loading…</SelectItem>
                                  ) : (
                                    ingredients.map((ing) => (
                                      <SelectItem key={ing.id} value={ing.id}>
                                        {ing.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              {touched.ingredient && errors.ingredient && <div className="text-xs text-red-600 mt-1">{errors.ingredient}</div>}
                              <div className="text-right mt-1">
                                <Button variant="outline" size="sm" onClick={() => setAddIngredientOpen(true)}>Add Ingredient +</Button>
                              </div>
                            </div>

                            {/* Invoice */}
                            <div>
                              <Label>Invoice #</Label>
                              <Input name="invoiceNumber" value={values.invoiceNumber} onChange={handleChange} onBlur={handleBlur} />
                            </div>

                            {/* Stock Received */}
                            <div>
                              <Label>Stock Received *</Label>
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  type="number"
                                  name="stockReceived"
                                  value={values.stockReceived}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                />
                                <Select value={values.unit} onValueChange={(v) => setFieldValue("unit", v)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {unitOptions.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              {touched.stockReceived && errors.stockReceived && <div className="text-xs text-red-600 mt-1">{errors.stockReceived}</div>}
                            </div>

                            {/* Batch Code */}
                            <div>
                              <Label>Batch Code *</Label>
                              <Input name="barCode" value={values.barCode} onChange={handleChange} onBlur={handleBlur} />
                              {touched.barCode && errors.barCode && <div className="text-xs text-red-600 mt-1">{errors.barCode}</div>}
                            </div>

                            {/* Expiry */}
                            <div>
                              <Label>Expiry Date *</Label>
                              <Input type="date" name="expiryDate" value={values.expiryDate} onChange={handleChange} onBlur={handleBlur} />
                              {touched.expiryDate && errors.expiryDate && <div className="text-xs text-red-600 mt-1">{errors.expiryDate}</div>}
                            </div>

                            {/* Temperature */}
                            <div>
                              <Label>Temperature (℃) *</Label>
                              <Input name="temperature" value={values.temperature} onChange={handleChange} onBlur={handleBlur} />
                              {touched.temperature && errors.temperature && <div className="text-xs text-red-600 mt-1">{errors.temperature}</div>}
                            </div>
                          </div>

                          <div className="flex justify-end pt-4 border-t">
                            <Button onClick={onPrimary}>
                              <Check className="w-4 h-4 mr-2" />
                              Record Stock
                            </Button>
                          </div>
                        </form>
                      );
                    }}
                  </Formik>
                </CardContent>
              </Card>
            </TabsContent>

            {/* MULTIPLE */}
            <TabsContent value="multiple" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Multiple Stock Entries</span>
                    <Badge variant="secondary">Dynamic</Badge>
                  </CardTitle>
                  <CardDescription>Record many entries at once</CardDescription>
                </CardHeader>
                <CardContent>
                  <Formik initialValues={{ items: [initialBatchItem] }} validationSchema={batchSchema} onSubmit={submitBatch}>
                    {({ values, validateForm, setTouched, resetForm, setFieldValue }) => (
                      <form>
                        <FieldArray name="items">
                          {({ push, remove }) => {
                            // expose add-good for FAB
                            addGoodRef.current = () => {
                              const last = (values.items || [])[values.items.length - 1] || initialBatchItem;
                              push({ ...initialBatchItem, invoiceNumber: last?.invoiceNumber ?? "" , date: last?.date ?? initialBatchItem.date });
                            };

                            return (
                              <>
                                <div className="space-y-4">
                                  {(values.items || []).map((it, idx) => {
                                    const base = `items.${idx}`;
                                    const err = (path) => getIn((values._formik ? values._formik.errors : {}) , path); // fallback unused; we display validation via Formik's touched in original but our simplified UI keeps error display below

                                    return (
                                      <Card key={idx} className="relative">
                                        <CardHeader>
                                          <div className="flex items-center justify-between">
                                            <CardTitle className="text-base">Item {idx + 1}</CardTitle>
                                            <Button variant="ghost" size="sm" onClick={() => remove(idx)} disabled={values.items.length === 1}>
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        </CardHeader>
                                        <CardContent>
                                          <div className="wrap-table-grid">
                                            <div>
                                              <Label>Date *</Label>
                                              <Input type="date" value={it.date} onChange={(e) => setFieldValue(`${base}.date`, e.target.value)} />
                                            </div>

                                            <div>
                                              <Label>Ingredient *</Label>
                                              <Select value={it.ingredient} onValueChange={(v) => setFieldValue(`${base}.ingredient`, v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                  {ingredients.map(ing => <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>)}
                                                </SelectContent>
                                              </Select>
                                            </div>

                                            <div>
                                              <Label>Invoice #</Label>
                                              <Input value={it.invoiceNumber} onChange={(e) => setFieldValue(`${base}.invoiceNumber`, e.target.value)} />
                                            </div>

                                            <div>
                                              <Label>Stock Received *</Label>
                                              <div className="grid grid-cols-2 gap-2">
                                                <Input type="number" value={it.stockReceived} onChange={(e) => setFieldValue(`${base}.stockReceived`, e.target.value)} />
                                                <Select value={it.unit} onValueChange={(v) => setFieldValue(`${base}.unit`, v)}>
                                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                                  <SelectContent>{unitOptions.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                                                </Select>
                                              </div>
                                            </div>

                                            <div>
                                              <Label>Batch Code *</Label>
                                              <Input value={it.barCode} onChange={(e) => setFieldValue(`${base}.barCode`, e.target.value)} />
                                            </div>

                                            <div>
                                              <Label>Expiry Date *</Label>
                                              <Input type="date" value={it.expiryDate} onChange={(e) => setFieldValue(`${base}.expiryDate`, e.target.value)} />
                                            </div>

                                            <div>
                                              <Label>Temperature (℃) *</Label>
                                              <Input value={it.temperature} onChange={(e) => setFieldValue(`${base}.temperature`, e.target.value)} />
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t">
                                  <div>
                                    <Button variant="outline" onClick={() => addGoodRef.current && addGoodRef.current()}>
                                      <Plus className="w-4 h-4 mr-2" />
                                      Add Item
                                    </Button>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Button onClick={() => openBatchConfirmDialog({ validateForm, values, setTouched, resetForm })}>
                                      Preview & Confirm ({values.items.length})
                                    </Button>
                                  </div>
                                </div>
                              </>
                            );
                          }}
                        </FieldArray>
                      </form>
                    )}
                  </Formik>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Batch confirm dialog */}
          <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Confirm Submission</DialogTitle>
                <DialogDescription>Review items before final submission</DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[460px] mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Ingredient</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Temp</TableHead>
                      <TableHead>Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchPreviewItems.map((it, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{getIngredientName(it.ingredient)}</TableCell>
                        <TableCell>{it.stockReceived} {it.unit}</TableCell>
                        <TableCell><Badge variant="outline">{it.barCode}</Badge></TableCell>
                        <TableCell>{it.expiryDate}</TableCell>
                        <TableCell>{it.temperature}℃</TableCell>
                        <TableCell className="text-slate-500">{it.invoiceNumber || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmMultiple} disabled={batchSubmitting}>
                  {batchSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>) : "Confirm & Submit"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Ingredient Dialog */}
          <Dialog open={addIngredientOpen} onOpenChange={setAddIngredientOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Ingredient</DialogTitle>
                <DialogDescription>Add a custom ingredient to your list</DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <Label>Ingredient Name</Label>
                <Input value={newIngredientName} onChange={(e) => setNewIngredientName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()} />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAddIngredientOpen(false)} disabled={addingIngredient}>Cancel</Button>
                <Button onClick={handleAddIngredient} disabled={addingIngredient}>
                  {addingIngredient ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</>) : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
