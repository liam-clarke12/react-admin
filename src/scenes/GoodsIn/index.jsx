// src/scenes/data/GoodsIn/index.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Checkbox,
  Chip,
  Stack,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PackageIcon from "@mui/icons-material/Inventory2";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation } from "react-router-dom";

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

const brand = {
  text: "#0f172a",
  subtext: "#334155",
  border: "#e5e7eb",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  primary: "#7C3AED",
  primaryDark: "#5B21B6",
  focusRing: "rgba(124,58,237,0.18)",
  shadow: "0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)",
};


const unitOptions = [
  { value: "grams", label: "Grams (g)" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "kg", label: "Kilograms (Kg)" },
  { value: "l", label: "Litres (L)" },
  { value: "units", label: "Units" },
];

const UNIT_GROUP = {
  GRAMS: "grams_group",
  ML: "ml_group",
  UNITS: "units_group",
};

function toBaseAmount(amount, unit) {
  if (!unit) return Number(amount || 0);
  const u = String(unit).toLowerCase();
  if (u === "kg") return Number(amount || 0) * 1000;
  if (u === "grams" || u === "g") return Number(amount || 0);
  if (u === "l") return Number(amount || 0) * 1000;
  if (u === "ml") return Number(amount || 0);
  return Number(amount || 0);
}

function detectUnitGroup(unit) {
  if (!unit) return UNIT_GROUP.UNITS;
  const u = String(unit).toLowerCase();
  if (u === "kg" || u === "grams" || u === "g") return UNIT_GROUP.GRAMS;
  if (u === "l" || u === "ml") return UNIT_GROUP.ML;
  return UNIT_GROUP.UNITS;
}

function formatDisplayAmount(baseAmount, group) {
  if (group === UNIT_GROUP.GRAMS) {
    if (Math.abs(baseAmount) >= 1000) {
      return { amount: Number((baseAmount / 1000).toFixed(2)), unit: "kg" };
    } else {
      return { amount: Math.round(baseAmount), unit: "g" };
    }
  }
  if (group === UNIT_GROUP.ML) {
    if (Math.abs(baseAmount) >= 1000) {
      return { amount: Number((baseAmount / 1000).toFixed(2)), unit: "l" };
    } else {
      return { amount: Math.round(baseAmount), unit: "ml" };
    }
  }
  return { amount: Math.round(baseAmount), unit: "units" };
}

export default function GoodsIn() {
  const { goodsInRows, setGoodsInRows, setIngredientInventory } = useData();
  const { cognitoId } = useAuth();
  const location = useLocation();

  const [selectedRows, setSelectedRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState({ field: "date", dir: "desc" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [originalBarcode, setOriginalBarcode] = useState(null);
  const [originalId, setOriginalId] = useState(null);
  const [updating, setUpdating] = useState(false);

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGoodsInData = async () => {
      try {
        if (!cognitoId) return;
        setLoading(true);
        const response = await fetch(
          `${API_BASE}/goods-in/active?cognito_id=${encodeURIComponent(cognitoId)}`
        );
        if (!response.ok) throw new Error("Failed to fetch Goods In data");
        const data = await response.json();

        const normalized = (Array.isArray(data) ? data : []).map((row, idx) => {
          const date = row.date ? String(row.date).slice(0, 10) : row.date;
          const expiryDate = row.expiryDate ? String(row.expiryDate).slice(0, 10) : row.expiryDate;
          const stockReceived = Number(row.stockReceived || 0);
          const stockRemaining = Number(row.stockRemaining || 0);
          const serverBar = row.barCode ? String(row.barCode) : null;
          const _id = serverBar
            ? `${serverBar}-${idx}`
            : `gen-${idx}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const invoiceNumber = row.invoice_number ?? row.invoiceNumber ?? null;
          const unit = row.unit ?? row.unitName ?? row.unit_label ?? "";

          return {
            ...row,
            date,
            expiryDate,
            stockReceived,
            stockRemaining,
            processed: Number(stockRemaining) === 0 ? "Yes" : "No",
            barCode: serverBar || row.barCode || null,
            invoiceNumber,
            unit,
            _id,
          };
        });

        setGoodsInRows(normalized);
        computeAndSetIngredientInventory(normalized);
      } catch (error) {
        console.error("Error fetching Goods In data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (cognitoId) fetchGoodsInData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cognitoId]);

  const computeAndSetIngredientInventory = (rows) => {
    const active = (Array.isArray(rows) ? rows : []).filter((r) => Number(r.stockRemaining) > 0);
    const map = new Map();
    for (const r of active) {
      const key = r.ingredient;
      const prev = map.get(key) || { ingredient: key, amount: 0, barcode: r.barCode, _date: r.date, unit: r.unit };
      const amount = prev.amount + Number(r.stockRemaining || 0);
      let nextBarcode = prev.barcode;
      let nextDate = prev._date;
      try {
        const prevTime = new Date(prev._date).getTime() || Infinity;
        const curTime = new Date(r.date).getTime() || Infinity;
        if (curTime < prevTime) {
          nextBarcode = r.barCode;
          nextDate = r.date;
        }
      } catch {}
      map.set(key, { ingredient: key, amount, barcode: nextBarcode, _date: nextDate, unit: r.unit });
    }
    const inventory = Array.from(map.values()).map(({ _date, ...rest }) => rest);
    setIngredientInventory(inventory);
  };

  const processRowUpdate = async (newRow, oldRow) => {
    const oldBar = oldRow && oldRow.barCode ? String(oldRow.barCode) : undefined;
    const oldId = oldRow && oldRow._id ? String(oldRow._id) : undefined;

    const payload = {
      date: newRow.date,
      ingredient: newRow.ingredient,
      temperature: newRow.temperature,
      stockReceived: Number(newRow.stockReceived || 0),
      stockRemaining: Number(newRow.stockRemaining || 0),
      unit: newRow.unit,
      expiryDate: newRow.expiryDate,
      barCode: newRow.barCode,
      invoice_number: newRow.invoiceNumber ?? null,
      cognito_id: cognitoId,
    };

    const identifierForPath = oldBar || newRow.barCode;
    const url = `${API_BASE}/goods-in/${encodeURIComponent(identifierForPath)}`;

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error("[processRowUpdate] server returned non-OK:", response.status, text);
        throw new Error(text || `Failed to update row (status ${response.status})`);
      }

      const json = await response.json().catch(() => null);
      const serverRow = json && json.updated ? json.updated : json || null;

      const normalizedResult = {
        ...newRow,
        ...(serverRow ? serverRow : {}),
        stockReceived: Number((serverRow && serverRow.stockReceived) ?? newRow.stockReceived ?? 0),
        stockRemaining: Number((serverRow && serverRow.stockRemaining) ?? newRow.stockRemaining ?? 0),
        processed: Number(((serverRow && serverRow.stockRemaining) ?? newRow.stockRemaining) || 0) === 0 ? "Yes" : "No",
        invoiceNumber: (serverRow && (serverRow.invoice_number ?? serverRow.invoiceNumber)) ?? newRow.invoiceNumber ?? null,
        unit: (serverRow && (serverRow.unit ?? serverRow.unit_label ?? serverRow.unitName)) ?? newRow.unit ?? "",
      };

      normalizedResult._id =
        oldId ||
        newRow._id ||
        (serverRow && serverRow.barCode ? `${serverRow.barCode}-${Date.now()}` : `gen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);

      normalizedResult.barCode = (serverRow && serverRow.barCode) ? serverRow.barCode : (newRow.barCode || null);

      setGoodsInRows((prev = []) => {
        const list = Array.isArray(prev) ? prev.slice() : [];
        let found = false;
        const next = list.map((r) => {
          if (oldId && r._id === oldId) {
            found = true;
            return { ...r, ...normalizedResult };
          }
          if (!oldId && identifierForPath && r.barCode === identifierForPath) {
            found = true;
            return { ...r, ...normalizedResult };
          }
          return r;
        });

        if (!found) {
          next.push(normalizedResult);
        }

        computeAndSetIngredientInventory(next);
        return next;
      });

      return normalizedResult;
    } catch (error) {
      console.error("Backend update error:", error);
      throw error;
    }
  };

  const handleDeleteSelectedRows = async () => {
    if (!cognitoId || selectedRows.length === 0) return;

    try {
      const rowsToDelete = (goodsInRows || []).filter((r) => selectedRows.includes(r._id));

      await Promise.all(
        rowsToDelete.map((row) =>
          fetch(`${API_BASE}/delete-row`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ barCode: row.barCode, cognito_id: cognitoId }),
          }).then(async (res) => {
            if (!res.ok) {
              const t = await res.text().catch(() => "");
              throw new Error(t || `Soft delete failed for ${row.barCode}`);
            }
          })
        )
      );

      setGoodsInRows((prev = []) => {
        const remaining = prev.filter((r) => !selectedRows.includes(r._id));
        computeAndSetIngredientInventory(remaining);
        return remaining;
      });

      setSelectedRows([]);
      setOpenConfirmDialog(false);
    } catch (err) {
      console.error("Soft delete error:", err);
      alert("Could not delete selected records. Check console for details.");
    }
  };

  const handleEditRow = (row) => {
    setEditingRow({ ...row });
    setOriginalBarcode(row.barCode);
    setOriginalId(row._id);
    setEditDialogOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (!editingRow) return;
    setUpdating(true);
    try {
      await processRowUpdate(editingRow, { barCode: originalBarcode, _id: originalId });
      setEditDialogOpen(false);
      setEditingRow(null);
      setOriginalBarcode(null);
      setOriginalId(null);
    } catch (err) {
      console.error("Confirm edit failed:", err);
      alert("Update failed. See console for details.");
    } finally {
      setUpdating(false);
    }
  };

  const filteredRows = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    let rows = Array.isArray(goodsInRows) ? goodsInRows.slice() : [];
    if (q) {
      rows = rows.filter((r) =>
        ["date", "ingredient", "barCode", "invoiceNumber", "unit", "temperature"]
          .some((k) => String(r[k] ?? "").toLowerCase().includes(q))
      );
    }

    const dir = sortBy.dir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      const fa = a[sortBy.field] ?? "";
      const fb = b[sortBy.field] ?? "";
      if (sortBy.field === "stockRemaining" || sortBy.field === "stockReceived") {
        return (Number(fa) - Number(fb)) * dir;
      }
      return String(fa).localeCompare(String(fb)) * dir;
    });

    return rows;
  }, [goodsInRows, searchQuery, sortBy]);

  const visibleRows = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const toggleSelectAll = () => {
    if (selectedRows.length === filteredRows.length && filteredRows.length > 0) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredRows.map((r) => r._id));
    }
  };

  const toggleRowSelection = (id) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  useEffect(() => {
    const focusBar = (location && location.state && location.state.focusBar) || new URLSearchParams(window.location.search).get("focusBar");
    if (!focusBar) return;
    if (!goodsInRows || goodsInRows.length === 0) return;

    const target = goodsInRows.find((r) => r.barCode === focusBar);
    if (!target) return;
    const targetId = target._id;

    setSelectedRows([targetId]);

    setTimeout(() => {
      const el = document.querySelector(`[data-row-id="${targetId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("highlight-row");
        setTimeout(() => el.classList.remove("highlight-row"), 2500);
      }
    }, 250);
    try {
      if (window && window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete("focusBar");
        window.history.replaceState({}, document.title, url.pathname + url.search || "");
      }
    } catch (e) {}
  }, [goodsInRows, location]);

  const totalsByBaseUnitGroup = useMemo(() => {
    const acc = {
      [UNIT_GROUP.GRAMS]: 0,
      [UNIT_GROUP.ML]: 0,
      [UNIT_GROUP.UNITS]: 0,
    };

    (filteredRows || []).forEach((r) => {
      const group = detectUnitGroup(r.unit);
      const base = toBaseAmount(Number(r.stockRemaining || 0), r.unit);
      acc[group] = (acc[group] || 0) + base;
    });

    return acc;
  }, [filteredRows]);

  const displayTotalsByGroup = useMemo(() => {
    return {
      gramsGroup: formatDisplayAmount(totalsByBaseUnitGroup[UNIT_GROUP.GRAMS] || 0, UNIT_GROUP.GRAMS),
      mlGroup: formatDisplayAmount(totalsByBaseUnitGroup[UNIT_GROUP.ML] || 0, UNIT_GROUP.ML),
      unitsGroup: formatDisplayAmount(totalsByBaseUnitGroup[UNIT_GROUP.UNITS] || 0, UNIT_GROUP.UNITS),
    };
  }, [totalsByBaseUnitGroup]);

  const totalsByIngredient = useMemo(() => {
    const map = new Map();
    (goodsInRows || []).forEach((r) => {
      const key = r.ingredient || "—";
      const prev = map.get(key) || { baseAmount: 0, unitSamples: new Map() };
      const base = toBaseAmount(Number(r.stockRemaining || 0), r.unit);
      prev.baseAmount += base;
      const u = r.unit || "";
      prev.unitSamples.set(u, (prev.unitSamples.get(u) || 0) + 1);
      map.set(key, prev);
    });

    const arr = Array.from(map.entries()).map(([ingredient, { baseAmount, unitSamples }]) => {
      let chosenGroup = UNIT_GROUP.UNITS;
      for (const u of unitOptions.map((o) => o.value)) {
        if (unitSamples.has(u)) {
          chosenGroup = detectUnitGroup(u);
          break;
        }
      }
      const disp = formatDisplayAmount(baseAmount, chosenGroup);
      return { ingredient, amount: disp.amount, unit: disp.unit, baseAmount };
    });

    arr.sort((a, b) => b.baseAmount - a.baseAmount);
    return arr.slice(0, 6);
  }, [goodsInRows]);

  const SmallBarChart = ({ data = [] }) => {
    if (!data || data.length === 0) return <Typography variant="caption" color="text.secondary">No data</Typography>;
    const max = Math.max(...data.map((d) => Number(d.amount) || 0), 1);
    return (
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
        {data.map((d) => (
          <Box key={d.ingredient} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 12, minWidth: 80, color: brand.subtext, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.ingredient}</Typography>
            <Box sx={{ flex: 1, height: 10, background: brand.surfaceMuted, borderRadius: 999, overflow: "hidden" }}>
              <Box sx={{ width: `${(Number(d.amount) / max) * 100}%`, height: "100%", background: brand.primary }} />
            </Box>
            <Typography sx={{ fontSize: 12, width: 72, textAlign: "right" }}>
              {d.amount} {d.unit}
            </Typography>
          </Box>
        ))}
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">Units shown: {Array.from(new Set(data.map(d => d.unit).filter(Boolean))).join(", ") || "—"}</Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box m={2} sx={{ overflowX: "hidden" }}>
      <style>{`
        .highlight-row { animation: highlightPulse 2.4s ease forwards; }
        @keyframes highlightPulse {
          0% { background-color: rgba(251,191,36,0.12); }
          50% { background-color: rgba(251,191,36,0.12); }
          100% { background-color: transparent; }
        }
      `}</style>

      <Box maxWidth="1200px" mx="auto" display="flex" flexDirection="column" gap={2}>
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ width: 52, height: 52, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center",
                        background: `linear-gradient(180deg, ${brand.primary}, ${brand.primaryDark})`, boxShadow: "0 8px 20px rgba(124,58,237,0.12)" }}>
              <PackageIcon sx={{ color: "white" }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Goods In Management</Typography>
              <Typography variant="caption" color="text.secondary">Track and manage incoming inventory</Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            {selectedRows.length > 0 && (
              <Chip label={`${selectedRows.length} selected`} color="default" />
            )}
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setOpenConfirmDialog(true)}
              disabled={selectedRows.length === 0}
            >
              Delete ({selectedRows.length})
            </Button>
          </Stack>
        </Box>

        <Paper variant="outlined" sx={{ p: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1, minWidth: 240 }}>
            <SearchIcon color="action" />
            <TextField
              placeholder="Search by ingredient, batch code, invoice..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              size="small"
              fullWidth
            />
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button variant="outlined" startIcon={<FilterListIcon />}>Filters</Button>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Sort</InputLabel>
              <Select
                value={`${sortBy.field}:${sortBy.dir}`}
                label="Sort"
                onChange={(e) => {
                  const [field, dir] = String(e.target.value).split(":");
                  setSortBy({ field, dir });
                }}
              >
                <MenuItem value="date:desc">Date (new → old)</MenuItem>
                <MenuItem value="date:asc">Date (old → new)</MenuItem>
                <MenuItem value="ingredient:asc">Ingredient A→Z</MenuItem>
                <MenuItem value="ingredient:desc">Ingredient Z→A</MenuItem>
                <MenuItem value="stockRemaining:desc">Stock Remaining (high → low)</MenuItem>
                <MenuItem value="stockRemaining:asc">Stock Remaining (low → high)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" } }}>
          <Paper sx={{ flex: 1, overflow: "hidden", borderRadius: 2, border: `1px solid ${brand.border}`, boxShadow: brand.shadow }}>
            {/* TABLE CONTAINER: horizontal scrollbar enabled here */}
            <TableContainer sx={{ maxHeight: "60vh", overflowX: "auto" }}>
              {/* give the table a larger minWidth so horizontal slider appears when needed */}
              <Table stickyHeader sx={{ tableLayout: "fixed", minWidth: 1200 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: "4%", minWidth: 56 }}><Checkbox
                      checked={selectedRows.length > 0 && selectedRows.length === filteredRows.length && filteredRows.length > 0}
                      indeterminate={selectedRows.length > 0 && selectedRows.length < filteredRows.length}
                      onChange={toggleSelectAll}
                    /></TableCell>

                    {/* Date */}
                    <TableCell sx={{ width: "10%", minWidth: 110 }}>Date</TableCell>

                    {/* Ingredient */}
                    <TableCell sx={{ width: "24%", minWidth: 200 }}>Ingredient</TableCell>

                    {/* Temperature */}
                    <TableCell sx={{ width: "8%", minWidth: 90 }}>Temperature</TableCell>

                    {/* Stock Received */}
                    <TableCell sx={{ width: "10%", minWidth: 110, textAlign: "center" }}>Stock Received</TableCell>

                    {/* Stock Remaining */}
                    <TableCell sx={{ width: "10%", minWidth: 110, textAlign: "center" }}>Stock Remaining</TableCell>

                    {/* Invoice */}
                    <TableCell sx={{ width: "12%", minWidth: 120 }}>Invoice #</TableCell>

                    {/* Expiry Date */}
                    <TableCell sx={{ width: "8%", minWidth: 110 }}>Expiry Date</TableCell>

                    {/* Batch Code */}
                    <TableCell sx={{ width: "7%", minWidth: 100 }}>Batch Code</TableCell>

                    {/* Actions */}
                    <TableCell sx={{ width: "7%", minWidth: 80, textAlign: "right" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                        <CircularProgress />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>Loading goods in...</Typography>
                      </TableCell>
                    </TableRow>
                  ) : visibleRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">No records found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleRows.map((row, idx) => (
                      <TableRow
                        key={row._id}
                        data-row-id={row._id}
                        sx={{
                          backgroundColor: (page * rowsPerPage + idx) % 2 === 0 ? "white" : brand.surfaceMuted,
                          "&:hover": { backgroundColor: "#fbf8ff" },
                        }}
                      >
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Checkbox checked={selectedRows.includes(row._id)} onChange={() => toggleRowSelection(row._id)} />
                        </TableCell>

                        <TableCell sx={{ color: brand.subtext, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Tooltip title={row.date || "-"} placement="top">
                            <span>{row.date || "-"}</span>
                          </Tooltip>
                        </TableCell>

                        <TableCell sx={{ color: brand.text, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {row.ingredient || "-"}
                        </TableCell>

                        <TableCell sx={{ color: brand.subtext, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Tooltip title={row.temperature ? `${row.temperature}℃` : "-"} placement="top">
                            <span>{row.temperature ? `${row.temperature}℃` : "-"}</span>
                          </Tooltip>
                        </TableCell>

                        {/* Stock Received: centered + bold */}
                        <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                          <Box component="span" sx={{ display: "inline-flex", alignItems: "center", px: 2, py: 0.5, borderRadius: 1, background: "#ecfdf5" }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "#064e3b" }}>
                              {row.stockReceived}
                            </Typography>
                            {row.unit ? <Typography variant="caption" sx={{ ml: 0.5, color: brand.subtext }}>{` ${row.unit}`}</Typography> : null}
                          </Box>
                        </TableCell>

                        {/* Stock Remaining: centered + NOT bold */}
                        <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                          <Box component="span" sx={{ display: "inline-flex", alignItems: "center", px: 2, py: 0.5, borderRadius: 1, background: "#f8fafc" }}>
                            <Typography variant="body2" sx={{ fontWeight: 400, color: brand.text }}>
                              {row.stockRemaining}
                            </Typography>
                            {row.unit ? <Typography variant="caption" sx={{ ml: 0.5, color: brand.subtext }}>{` ${row.unit}`}</Typography> : null}
                          </Box>
                        </TableCell>

                        <TableCell sx={{ color: brand.subtext, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {row.invoiceNumber || "-"}
                        </TableCell>

                        <TableCell sx={{ color: brand.subtext, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Tooltip title={row.expiryDate || "-"} placement="top">
                            <span>{row.expiryDate || "-"}</span>
                          </Tooltip>
                        </TableCell>

                        <TableCell sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Chip label={row.barCode || "-"} variant="outlined" sx={{ bgcolor: "#f9f5ff", color: brand.primary, borderColor: "#eee" }} />
                        </TableCell>

                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEditRow(row)}>
                              <EditOutlinedIcon sx={{ color: brand.primary }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, borderTop: `1px solid ${brand.border}`, background: "#fbfbff" }}>
              <Typography variant="caption" color="text.secondary">
                Showing <strong style={{ color: brand.text }}>{filteredRows.length === 0 ? 0 : page * rowsPerPage + 1}</strong>
                {" - "}
                <strong style={{ color: brand.text }}>{Math.min((page + 1) * rowsPerPage, filteredRows.length)}</strong>
                {" of "}
                <strong style={{ color: brand.text }}>{filteredRows.length}</strong>
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Remaining</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: brand.text }}>
                    {(() => {
                      const groups = [];
                      if ((totalsByBaseUnitGroup[UNIT_GROUP.GRAMS] || 0) > 0) groups.push(displayTotalsByGroup.gramsGroup);
                      if ((totalsByBaseUnitGroup[UNIT_GROUP.ML] || 0) > 0) groups.push(displayTotalsByGroup.mlGroup);
                      if ((totalsByBaseUnitGroup[UNIT_GROUP.UNITS] || 0) > 0) groups.push(displayTotalsByGroup.unitsGroup);

                      if (groups.length === 0) return "—";
                      if (groups.length === 1) return `${groups[0].amount} ${groups[0].unit}`;
                      return `${groups.map(g => `${g.amount} ${g.unit}`).join(" · ")}`;
                    })()}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    {(() => {
                      const parts = [];
                      if ((totalsByBaseUnitGroup[UNIT_GROUP.GRAMS] || 0) > 0) {
                        const g = displayTotalsByGroup.gramsGroup;
                        parts.push(`${g.amount} ${g.unit}`);
                      }
                      if ((totalsByBaseUnitGroup[UNIT_GROUP.ML] || 0) > 0) {
                        const m = displayTotalsByGroup.mlGroup;
                        parts.push(`${m.amount} ${m.unit}`);
                      }
                      if ((totalsByBaseUnitGroup[UNIT_GROUP.UNITS] || 0) > 0) {
                        const u = displayTotalsByGroup.unitsGroup;
                        parts.push(`${u.amount} ${u.unit}`);
                      }
                      return parts.length === 0 ? "—" : parts.join(" · ");
                    })()}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
                  <Button variant="outlined" size="small" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>Prev</Button>
                  <Typography variant="caption">{page + 1}</Typography>
                  <Button variant="outlined" size="small" onClick={() => {
                    const maxPage = Math.max(0, Math.ceil(filteredRows.length / rowsPerPage) - 1);
                    setPage(Math.min(maxPage, page + 1));
                  }} disabled={(page + 1) * rowsPerPage >= filteredRows.length}>Next</Button>

                  <FormControl size="small" sx={{ minWidth: 88 }}>
                    <Select
                      value={rowsPerPage}
                      onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
                    >
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={25}>25</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ width: { xs: "100%", md: 320 } }}>
            <Paper sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: brand.shadow }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Quick Stats</Typography>
              <Typography variant="caption" color="text.secondary">Top ingredients by remaining stock (normalized)</Typography>
              <Box sx={{ mt: 2 }}>
                <SmallBarChart data={totalsByIngredient} />
              </Box>
            </Paper>

            <Paper sx={{ p: 2, borderRadius: 2, boxShadow: brand.shadow }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Legend</Typography>
              <Box sx={{ mt: 1, display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                <Chip label="Selected" color="default" size="small" />
                <Chip label="Low stock" size="small" sx={{ bgcolor: "#fff7ed", color: "#92400e" }} />
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Goods In Record</DialogTitle>
        <DialogContent dividers>
          {editingRow ? (
            <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
              <TextField label="Ingredient" fullWidth value={editingRow.ingredient || ""} onChange={(e) => setEditingRow({ ...editingRow, ingredient: e.target.value })} />
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                <TextField label="Date" type="date" value={editingRow.date || ""} onChange={(e) => setEditingRow({ ...editingRow, date: e.target.value })} fullWidth />
                <TextField label="Temperature (℃)" value={editingRow.temperature || ""} onChange={(e) => setEditingRow({ ...editingRow, temperature: e.target.value })} fullWidth />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                <TextField label="Stock Received" type="number" value={editingRow.stockReceived || ""} onChange={(e) => setEditingRow({ ...editingRow, stockReceived: Number(e.target.value) })} fullWidth />
                <TextField label="Stock Remaining" type="number" value={editingRow.stockRemaining || ""} onChange={(e) => setEditingRow({ ...editingRow, stockRemaining: Number(e.target.value) })} fullWidth />
              </Box>

              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select value={editingRow.unit || ""} onChange={(e) => setEditingRow({ ...editingRow, unit: e.target.value })}>
                  {unitOptions.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                </Select>
              </FormControl>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                <TextField label="Batch Code" value={editingRow.barCode || ""} onChange={(e) => setEditingRow({ ...editingRow, barCode: e.target.value })} fullWidth />
                <TextField label="Invoice Number" value={editingRow.invoiceNumber || ""} onChange={(e) => setEditingRow({ ...editingRow, invoiceNumber: e.target.value })} fullWidth />
              </Box>

              <TextField label="Expiry Date" type="date" value={editingRow.expiryDate || ""} onChange={(e) => setEditingRow({ ...editingRow, expiryDate: e.target.value })} fullWidth />
            </Box>
          ) : (
            <Typography color="text.secondary">No row selected.</Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => { setEditDialogOpen(false); setEditingRow(null); }} disabled={updating}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmEdit} disabled={updating}>
            {updating ? <CircularProgress size={18} /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">Delete {selectedRows.length} selected record{selectedRows.length === 1 ? "" : "s"}? This action will soft-delete them.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={() => setOpenConfirmDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteSelectedRows}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
