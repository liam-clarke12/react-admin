// src/scenes/form/GoodsIn/index.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
  Inventory2 as PackageIcon,
  PlaylistAdd as PackagePlusIcon,
  Save as SaveIcon,
  CalendarToday as CalendarIcon,
  Thermostat as ThermometerIcon,
  Barcode as BarcodeIcon,
  Scale as ScaleIcon,
  Description as FileTextIcon,
  Tune as SliderIcon,
} from "@mui/icons-material";
import { toast, Toaster } from "sonner";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const unitOptions = [
  { value: "grams", label: "Grams (g)" },
  { value: "kg", label: "Kilograms (Kg)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "l", label: "Litres (L)" },
  { value: "units", label: "Units" },
];

const useAuthMock = () => ({ cognitoId: "mock-cognito-id" });

const initialSingle = {
  date: new Date().toISOString().slice(0, 10),
  ingredient: "",
  stockReceived: "",
  unit: "grams",
  barCode: "",
  expiryDate: new Date().toISOString().slice(0, 10),
  temperature: "N/A",
  invoiceNumber: "",
};

const initialBatchItem = { ...initialSingle };

export default function GoodsInForm() {
  const theme = useTheme();
  const { cognitoId } = useAuthMock();

  // UI state
  const [tab, setTab] = useState(0);
  const [colWidthMultiplier, setColWidthMultiplier] = useState(1);
  const [addIngredientOpen, setAddIngredientOpen] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [batchPreviewOpen, setBatchPreviewOpen] = useState(false);
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // data
  const [masterIngredients, setMasterIngredients] = useState([]);
  const [customIngredients, setCustomIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // Single form
  const [singleForm, setSingleForm] = useState(initialSingle);
  const [singleErrors, setSingleErrors] = useState({});

  // Multiple form (array)
  const [multipleItems, setMultipleItems] = useState([initialBatchItem]);
  const [multipleErrors, setMultipleErrors] = useState([{}]);

  // preview items (for confirm dialog)
  const [previewItems, setPreviewItems] = useState([]);

  // selection demo
  const [selectedRows, setSelectedRows] = useState([]);

  // Fetch ingredients (mock fallback if API unreachable)
  useEffect(() => {
    if (!cognitoId) return;
    setLoadingIngredients(true);
    fetch(`${API_BASE}/ingredients?cognito_id=${encodeURIComponent(cognitoId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject("no api")))
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setMasterIngredients(data.map((d, i) => ({ id: d.id ?? String(i), name: d.name ?? d })));
        } else {
          // fallback mock
          setMasterIngredients([
            { id: "1", name: "Organic Flour" },
            { id: "2", name: "Fresh Milk" },
            { id: "3", name: "Cane Sugar" },
            { id: "4", name: "Butter" },
            { id: "5", name: "Vanilla Extract" },
            { id: "6", name: "Fresh Eggs" },
          ]);
        }
      })
      .catch(() => {
        setMasterIngredients([
          { id: "1", name: "Organic Flour" },
          { id: "2", name: "Fresh Milk" },
          { id: "3", name: "Cane Sugar" },
          { id: "4", name: "Butter" },
          { id: "5", name: "Vanilla Extract" },
          { id: "6", name: "Fresh Eggs" },
        ]);
      })
      .finally(() => setLoadingIngredients(false));

    // fetch custom ingredients (attempt)
    fetch(`${API_BASE}/custom-ingredients?cognito_id=${encodeURIComponent(cognitoId)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setCustomIngredients(data.map((d) => ({ id: `c-${d.id ?? Date.now()}`, name: d.name ?? d })));
      })
      .catch(() => setCustomIngredients([]));
  }, [cognitoId]);

  const ingredients = useMemo(() => [...masterIngredients, ...customIngredients], [masterIngredients, customIngredients]);

  // helpers
  const getIngredientName = (id) => {
    if (!id) return "";
    const found = ingredients.find((i) => String(i.id) === String(id));
    return found ? found.name : id;
  };

  // validation (simple)
  const validateSingle = (values = singleForm) => {
    const e = {};
    if (!values.date) e.date = "Date required";
    if (!values.ingredient) e.ingredient = "Ingredient required";
    if (!values.stockReceived || Number(values.stockReceived) <= 0) e.stockReceived = "Stock must be > 0";
    if (!values.unit) e.unit = "Unit required";
    if (!values.barCode) e.barCode = "Batch code required";
    if (!values.expiryDate) e.expiryDate = "Expiry date required";
    if (!values.temperature) e.temperature = "Temperature required";
    setSingleErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateMultiple = (items = multipleItems) => {
    const errs = [];
    let ok = true;
    items.forEach((it) => {
      const e = {};
      if (!it.date) e.date = "Date required";
      if (!it.ingredient) e.ingredient = "Ingredient required";
      if (!it.stockReceived || Number(it.stockReceived) <= 0) e.stockReceived = "Stock must be > 0";
      if (!it.unit) e.unit = "Unit required";
      if (!it.barCode) e.barCode = "Batch code required";
      if (!it.expiryDate) e.expiryDate = "Expiry required";
      if (!it.temperature) e.temperature = "Temperature required";
      errs.push(e);
      if (Object.keys(e).length) ok = false;
    });
    setMultipleErrors(errs);
    return ok;
  };

  const handleSingleSubmit = async () => {
    if (!validateSingle()) {
      toast.error("Fix errors before submitting");
      return;
    }
    const payload = { ...singleForm, cognito_id: cognitoId };
    try {
      const res = await fetch(`${API_BASE}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Server rejected");
      toast.success("Recorded");
      setSingleForm(initialSingle);
    } catch (err) {
      console.error(err);
      toast.error("Submit failed — check console");
    }
  };

  const handleAddIngredient = async () => {
    if (!newIngredientName.trim()) {
      toast.error("Enter ingredient name");
      return;
    }
    // attempt to save via API
    try {
      const res = await fetch(`${API_BASE}/custom-ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newIngredientName.trim(), cognito_id: cognitoId }),
      });
      if (res.ok) {
        // try to refresh list
        const updated = await fetch(`${API_BASE}/custom-ingredients?cognito_id=${encodeURIComponent(cognitoId)}`).then((r) =>
          r.ok ? r.json() : []
        );
        setCustomIngredients(Array.isArray(updated) ? updated.map((d) => ({ id: `c-${d.id ?? Date.now()}`, name: d.name ?? d })) : []);
        toast.success("Ingredient added");
        setNewIngredientName("");
        setAddIngredientOpen(false);
        return;
      }
    } catch (err) {
      // fallback: add locally
      setCustomIngredients((prev) => [...prev, { id: `c-${Date.now()}`, name: newIngredientName.trim() }]);
      toast.success("Ingredient added (local)");
      setNewIngredientName("");
      setAddIngredientOpen(false);
    }
  };

  // multiple handlers
  const addMultipleItem = () => {
    setMultipleItems((prev) => [...prev, { ...initialBatchItem }]);
    setMultipleErrors((prev) => [...prev, {}]);
  };

  const removeMultipleItem = (index) => {
    if (multipleItems.length === 1) {
      toast.error("At least one item required");
      return;
    }
    setMultipleItems((prev) => prev.filter((_, i) => i !== index));
    setMultipleErrors((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePreviewBatch = () => {
    if (!validateMultiple()) {
      toast.error("Fix validation errors first");
      return;
    }
    setPreviewItems(multipleItems.map((it) => ({ ...it })));
    setBatchPreviewOpen(true);
  };

  const handleConfirmBatch = async () => {
    setBatchSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/submit/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: previewItems, cognito_id: cognitoId }),
      });
      if (!res.ok) {
        // fallback: post each individually
        for (const it of previewItems) {
          await fetch(`${API_BASE}/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...it, cognito_id: cognitoId }),
          });
        }
      }
      toast.success("Batch submitted");
      setBatchPreviewOpen(false);
      setMultipleItems([{ ...initialBatchItem }]);
    } catch (err) {
      console.error(err);
      toast.error("Batch submit failed");
    } finally {
      setBatchSubmitting(false);
    }
  };

  // selection demo
  const toggleSelect = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  // -----------------------
  // Unit normalization logic
  // -----------------------
  const computeNormalizedTotals = (rows = []) => {
    let massGrams = 0;
    let volMl = 0;
    let units = 0;

    for (const r of rows) {
      const val = Number(r.stockRemaining ?? r.stockReceived ?? 0) || 0;
      const u = (r.unit || "").toLowerCase();
      if (u === "kg") massGrams += val * 1000;
      else if (u === "grams" || u === "g") massGrams += val;
      else if (u === "l") volMl += val * 1000;
      else if (u === "ml") volMl += val;
      else if (u === "units") units += val;
      else {
        // unknown treat as units
        units += val;
      }
    }

    const massDisplay = massGrams
      ? massGrams >= 1000
        ? { total: +(massGrams / 1000).toFixed(3), label: "kg" }
        : { total: +massGrams.toFixed(2), label: "g" }
      : null;

    const volDisplay = volMl
      ? volMl >= 1000
        ? { total: +(volMl / 1000).toFixed(3), label: "L" }
        : { total: +volMl.toFixed(2), label: "ml" }
      : null;

    const unitsDisplay = units ? { total: +units.toFixed(2), label: "units" } : null;

    return { massDisplay, volDisplay, unitsDisplay };
  };

  // compute totals either from preview items (if present) or current multipleItems
  const totalsSource = previewItems.length ? previewItems : multipleItems;
  const normalizedTotals = useMemo(() => computeNormalizedTotals(totalsSource), [totalsSource]);

  // CSS helpers to avoid horizontal scroll and allow wrapping columns
  const colMinPx = Math.max(100, Math.round(120 * colWidthMultiplier));

  // ----- render -----
  return (
    <Box sx={{ p: 3, overflowX: "hidden" }}>
      <Toaster />
      <Box sx={{ maxWidth: 1400, mx: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
        {/* header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", color: "primary.contrastText", boxShadow: 3 }}>
              <PackageIcon />
            </Box>
            <Box>
              <Typography variant="h6">Goods In Management</Typography>
              <Typography variant="body2" color="text.secondary">Track and manage incoming inventory</Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            <Card variant="outlined" sx={{ p: 1.25, minWidth: 140 }}>
              <Typography variant="caption" color="text.secondary">Total (mass)</Typography>
              <Typography variant="h6">{normalizedTotals.massDisplay ? normalizedTotals.massDisplay.total : "—"}</Typography>
              <Typography variant="caption" color="text.secondary">{normalizedTotals.massDisplay ? normalizedTotals.massDisplay.label : ""}</Typography>
            </Card>
            <Card variant="outlined" sx={{ p: 1.25, minWidth: 140 }}>
              <Typography variant="caption" color="text.secondary">Total (volume)</Typography>
              <Typography variant="h6">{normalizedTotals.volDisplay ? normalizedTotals.volDisplay.total : "—"}</Typography>
              <Typography variant="caption" color="text.secondary">{normalizedTotals.volDisplay ? normalizedTotals.volDisplay.label : ""}</Typography>
            </Card>
            <Card variant="outlined" sx={{ p: 1.25, minWidth: 140 }}>
              <Typography variant="caption" color="text.secondary">Total (units)</Typography>
              <Typography variant="h6">{normalizedTotals.unitsDisplay ? normalizedTotals.unitsDisplay.total : "—"}</Typography>
              <Typography variant="caption" color="text.secondary">{normalizedTotals.unitsDisplay ? normalizedTotals.unitsDisplay.label : ""}</Typography>
            </Card>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "background.paper", borderRadius: 1, p: 1 }}>
              <SliderIcon />
              <Slider
                value={colWidthMultiplier}
                min={0.8}
                max={2}
                step={0.05}
                onChange={(e, v) => setColWidthMultiplier(v)}
                sx={{ width: 140 }}
              />
            </Box>
          </Stack>
        </Box>

        {/* Tabs */}
        <Card>
          <CardHeader title={<Tabs value={tab} onChange={(e, v) => setTab(v)} aria-label="goodsin-tabs">
            <Tab label="Single Entry" />
            <Tab label="Multiple Entry" />
          </Tabs>} subheader="" />
          <Divider />
          <CardContent>
            {tab === 0 && (
              <Box component="form" noValidate autoComplete="off" sx={{ display: "grid", gap: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <InputLabel>Date</InputLabel>
                    <TextField fullWidth type="date" value={singleForm.date} onChange={(e) => setSingleForm((s) => ({ ...s, date: e.target.value }))} />
                    {singleErrors.date && <Typography color="error" variant="caption">{singleErrors.date}</Typography>}
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <InputLabel>Ingredient</InputLabel>
                    <Select fullWidth value={singleForm.ingredient} onChange={(e) => setSingleForm((s) => ({ ...s, ingredient: e.target.value }))}>
                      <MenuItem value="">Select ingredient</MenuItem>
                      {ingredients.map((ing) => <MenuItem key={ing.id} value={ing.id}>{ing.name}</MenuItem>)}
                    </Select>
                    {singleErrors.ingredient && <Typography color="error" variant="caption">{singleErrors.ingredient}</Typography>}
                    <Box sx={{ mt: 1 }}>
                      <Button size="small" variant="outlined" onClick={() => setAddIngredientOpen(true)} startIcon={<AddIcon />}>Add ingredient</Button>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <InputLabel>Invoice #</InputLabel>
                    <TextField fullWidth value={singleForm.invoiceNumber} onChange={(e) => setSingleForm((s) => ({ ...s, invoiceNumber: e.target.value }))} />
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <InputLabel>Stock Received</InputLabel>
                    <TextField fullWidth type="number" value={singleForm.stockReceived} onChange={(e) => setSingleForm((s) => ({ ...s, stockReceived: e.target.value }))} />
                    {singleErrors.stockReceived && <Typography color="error" variant="caption">{singleErrors.stockReceived}</Typography>}
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <InputLabel>Unit</InputLabel>
                    <Select fullWidth value={singleForm.unit} onChange={(e) => setSingleForm((s) => ({ ...s, unit: e.target.value }))}>
                      {unitOptions.map((u) => <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>)}
                    </Select>
                    {singleErrors.unit && <Typography color="error" variant="caption">{singleErrors.unit}</Typography>}
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <InputLabel>Batch Code</InputLabel>
                    <TextField fullWidth value={singleForm.barCode} onChange={(e) => setSingleForm((s) => ({ ...s, barCode: e.target.value }))} />
                    {singleErrors.barCode && <Typography color="error" variant="caption">{singleErrors.barCode}</Typography>}
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <InputLabel>Expiry Date</InputLabel>
                    <TextField fullWidth type="date" value={singleForm.expiryDate} onChange={(e) => setSingleForm((s) => ({ ...s, expiryDate: e.target.value }))} />
                    {singleErrors.expiryDate && <Typography color="error" variant="caption">{singleErrors.expiryDate}</Typography>}
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <InputLabel>Temperature (℃)</InputLabel>
                    <TextField fullWidth value={singleForm.temperature} onChange={(e) => setSingleForm((s) => ({ ...s, temperature: e.target.value }))} />
                    {singleErrors.temperature && <Typography color="error" variant="caption">{singleErrors.temperature}</Typography>}
                  </Grid>

                  <Grid item xs={12} md={9}></Grid>

                  <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSingleSubmit}>Record Stock</Button>
                  </Grid>
                </Grid>
              </Box>
            )}

            {tab === 1 && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1">Multiple Stock Entries</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={addMultipleItem}>Add Item</Button>
                    <Button variant="contained" startIcon={<PackagePlusIcon />} onClick={handlePreviewBatch}>Preview & Confirm</Button>
                  </Stack>
                </Stack>

                <Box sx={{ display: "grid", gap: 2 }}>
                  {multipleItems.map((it, idx) => (
                    <Card variant="outlined" key={idx}>
                      <CardHeader
                        title={`Item ${idx + 1}`}
                        action={
                          <IconButton onClick={() => removeMultipleItem(idx)} disabled={multipleItems.length === 1}>
                            <DeleteIcon />
                          </IconButton>
                        }
                      />
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={3}>
                            <InputLabel>Date</InputLabel>
                            <TextField fullWidth type="date" value={it.date} onChange={(e) => {
                              const copy = [...multipleItems];
                              copy[idx] = { ...copy[idx], date: e.target.value };
                              setMultipleItems(copy);
                            }} />
                          </Grid>

                          <Grid item xs={12} md={3}>
                            <InputLabel>Ingredient</InputLabel>
                            <Select fullWidth value={it.ingredient} onChange={(e) => {
                              const copy = [...multipleItems];
                              copy[idx] = { ...copy[idx], ingredient: e.target.value };
                              setMultipleItems(copy);
                            }}>
                              <MenuItem value="">Select</MenuItem>
                              {ingredients.map((ing) => <MenuItem key={ing.id} value={ing.id}>{ing.name}</MenuItem>)}
                            </Select>
                          </Grid>

                          <Grid item xs={12} md={3}>
                            <InputLabel>Stock Received</InputLabel>
                            <TextField fullWidth type="number" value={it.stockReceived} onChange={(e) => {
                              const copy = [...multipleItems];
                              copy[idx] = { ...copy[idx], stockReceived: e.target.value };
                              setMultipleItems(copy);
                            }} />
                          </Grid>

                          <Grid item xs={12} md={3}>
                            <InputLabel>Unit</InputLabel>
                            <Select fullWidth value={it.unit} onChange={(e) => {
                              const copy = [...multipleItems];
                              copy[idx] = { ...copy[idx], unit: e.target.value };
                              setMultipleItems(copy);
                            }}>
                              {unitOptions.map((u) => <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>)}
                            </Select>
                          </Grid>

                          <Grid item xs={12} md={3}>
                            <InputLabel>Batch Code</InputLabel>
                            <TextField fullWidth value={it.barCode} onChange={(e) => {
                              const copy = [...multipleItems];
                              copy[idx] = { ...copy[idx], barCode: e.target.value };
                              setMultipleItems(copy);
                            }} />
                          </Grid>

                          <Grid item xs={12} md={3}>
                            <InputLabel>Expiry Date</InputLabel>
                            <TextField fullWidth type="date" value={it.expiryDate} onChange={(e) => {
                              const copy = [...multipleItems];
                              copy[idx] = { ...copy[idx], expiryDate: e.target.value };
                              setMultipleItems(copy);
                            }} />
                          </Grid>

                          <Grid item xs={12} md={3}>
                            <InputLabel>Temperature (℃)</InputLabel>
                            <TextField fullWidth value={it.temperature} onChange={(e) => {
                              const copy = [...multipleItems];
                              copy[idx] = { ...copy[idx], temperature: e.target.value };
                              setMultipleItems(copy);
                            }} />
                          </Grid>

                          <Grid item xs={12} md={3}>
                            <InputLabel>Invoice #</InputLabel>
                            <TextField fullWidth value={it.invoiceNumber} onChange={(e) => {
                              const copy = [...multipleItems];
                              copy[idx] = { ...copy[idx], invoiceNumber: e.target.value };
                              setMultipleItems(copy);
                            }} />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* preview table (small inline table) */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Current Items (preview)</Typography>

          <TableContainer sx={{ maxHeight: 360, overflowX: "auto" }}>
            <Table stickyHeader size="small" sx={{ minWidth: Math.max(800, colMinPx * 6) }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: colMinPx }}>Date</TableCell>
                  <TableCell sx={{ minWidth: colMinPx }}>Ingredient</TableCell>
                  <TableCell sx={{ minWidth: colMinPx, textAlign: "center" }}>Stock Received</TableCell>
                  <TableCell sx={{ minWidth: colMinPx, textAlign: "center" }}>Unit</TableCell>
                  <TableCell sx={{ minWidth: colMinPx }}>Batch</TableCell>
                  <TableCell sx={{ minWidth: colMinPx }}>Expiry</TableCell>
                  <TableCell sx={{ minWidth: colMinPx }}>Temp</TableCell>
                  <TableCell sx={{ minWidth: colMinPx, textAlign: "right" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                { (tab === 1 ? multipleItems : [singleForm]).map((r, i) => (
                  <TableRow key={i} hover selected={selectedRows.includes(r.barCode || String(i))}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{getIngredientName(r.ingredient) || r.ingredient}</TableCell>
                    <TableCell align="center">{r.stockReceived}</TableCell>
                    <TableCell align="center">{r.unit}</TableCell>
                    <TableCell>{r.barCode}</TableCell>
                    <TableCell>{r.expiryDate}</TableCell>
                    <TableCell>{r.temperature}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => toggleSelect(r.barCode || String(i))}><EditIcon /></IconButton>
                      <IconButton size="small" onClick={() => { /* optional per-row edit */ }}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                )) }
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* dialogs */}
        <Dialog open={addIngredientOpen} onClose={() => setAddIngredientOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Add Ingredient</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <TextField label="Ingredient name" value={newIngredientName} onChange={(e) => setNewIngredientName(e.target.value)} fullWidth onKeyDown={(e) => e.key === "Enter" && handleAddIngredient()} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddIngredientOpen(false)}>Cancel</Button>
            <Button onClick={handleAddIngredient} variant="contained" startIcon={<AddIcon />}>Add</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={batchPreviewOpen} onClose={() => setBatchPreviewOpen(false)} fullWidth maxWidth="lg">
          <DialogTitle>Confirm Submission</DialogTitle>
          <DialogContent dividers>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Ingredient</TableCell>
                    <TableCell align="center">Quantity</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Batch</TableCell>
                    <TableCell>Expiry</TableCell>
                    <TableCell>Temp</TableCell>
                    <TableCell>Invoice</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewItems.map((it, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{getIngredientName(it.ingredient) || it.ingredient}</TableCell>
                      <TableCell align="center">{it.stockReceived}</TableCell>
                      <TableCell>{it.unit}</TableCell>
                      <TableCell><Chip label={it.barCode} variant="outlined" size="small" /></TableCell>
                      <TableCell>{it.expiryDate}</TableCell>
                      <TableCell>{it.temperature}℃</TableCell>
                      <TableCell>{it.invoiceNumber || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBatchPreviewOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleConfirmBatch} startIcon={<SaveIcon />} disabled={batchSubmitting}>
              {batchSubmitting ? "Submitting..." : "Confirm & Submit"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
