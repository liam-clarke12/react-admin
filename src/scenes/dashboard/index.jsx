"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from "recharts"

/* ==========================================
   Unit helpers (normalize amounts)
   ========================================== */

const UnitGroup = Object.freeze({
  GRAMS: "grams_group",
  ML: "ml_group",
  UNITS: "units_group",
})

function detectUnitGroup(unit) {
  const u = String(unit || "").toLowerCase()
  if (u === "kg" || u === "g" || u === "grams") return UnitGroup.GRAMS
  if (u === "l" || u === "litre" || u === "litres" || u === "liter" || u === "liters" || u === "ml") return UnitGroup.ML
  return UnitGroup.UNITS
}

function toBaseAmount(amount, unit) {
  const val = Number(amount || 0)
  const u = String(unit || "").toLowerCase()
  if (u === "kg") return val * 1000 
  if (u === "g" || u === "grams") return val 
  if (u === "l" || u === "litre" || u === "litres" || u === "liter" || u === "liters") return val * 1000 
  if (u === "ml") return val 
  return val 
}

function formatDisplayAmount(baseAmount, group) {
  const n = Number(baseAmount || 0)
  if (group === UnitGroup.GRAMS) {
    if (Math.abs(n) >= 1000) return { amount: Number((n / 1000).toFixed(2)), unit: "kg" }
    return { amount: Math.round(n), unit: "g" }
  }
  if (group === UnitGroup.ML) {
    if (Math.abs(n) >= 1000) return { amount: Number((n / 1000).toFixed(2)), unit: "L" }
    return { amount: Math.round(n), unit: "ml" }
  }
  return { amount: Math.round(n), unit: "units" }
}

/* ==========================================
   Components with Tailwind styling
   ========================================== */

const DashboardCard = ({ title, children }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-800/50 p-6 flex flex-col min-w-0 transition-all duration-200 hover:shadow-lg dark:hover:shadow-slate-950/70">
    <div className="flex items-center mb-4">
      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
    </div>
    <div className="flex-1 min-h-0">{children}</div>
  </div>
)

const ExpiringIngredients = ({ ingredients }) => {
  const list = Array.isArray(ingredients) ? ingredients : []
  if (list.length === 0)
    return (
      <div className="text-slate-500 dark:text-slate-400 h-full flex items-center justify-center text-center text-sm">
        No ingredients expiring soon. Good job!
      </div>
    )

  const getDaysRemaining = (date) => {
    if (!date) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(date)
    expiry.setHours(0, 0, 0, 0)
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="flex flex-col gap-3 h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
      {list.map((ing) => {
        const daysRemaining = getDaysRemaining(ing.expiryDate)
        const urgencyClass =
          daysRemaining <= 1
            ? "bg-red-100 dark:bg-red-950/30 text-red-900 dark:text-red-300"
            : daysRemaining <= 3
              ? "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-900 dark:text-yellow-300"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        return (
          <div key={ing.id} className="flex justify-between items-center text-sm">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{ing.name}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                {ing.display.amount} {ing.display.unit}
              </p>
            </div>
            <span className={`font-bold rounded-full px-3 py-1.5 text-sm ${urgencyClass}`}>
              {daysRemaining <= 0 ? "Today" : `${daysRemaining}d`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const IngredientStock = ({ ingredients }) => {
  const list = Array.isArray(ingredients) ? ingredients : []
  if (list.length === 0) return <p className="text-slate-500 dark:text-slate-400 text-sm">No ingredients in stock.</p>

  const sorted = [...list].sort((a, b) => a.stockBase / a.maxBase - b.stockBase / b.maxBase)

  return (
    <div className="flex flex-col gap-4 h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
      {sorted.map((ing) => {
        const pct = Math.max(0, Math.min(100, (ing.stockBase / ing.maxBase) * 100))
        const colorClass = pct < 25 ? "bg-red-500" : pct < 50 ? "bg-yellow-500" : "bg-green-500"
        return (
          <div key={ing.id}>
            <div className="flex justify-between items-center mb-1.5 text-sm">
              <span className="font-medium text-slate-900 dark:text-slate-100">{ing.name}</span>
              <span className="text-slate-500 dark:text-slate-400">
                {ing.display.amount} {ing.display.unit}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

const RecipeStock = ({ recipes }) => {
  const list = Array.isArray(recipes) ? recipes : []
  if (list.length === 0) return <p className="text-slate-500 dark:text-slate-400 text-sm">No recipes in stock.</p>

  const sorted = [...list].sort((a, b) => a.stockBase / a.maxBase - b.stockBase / b.maxBase)

  return (
    <div className="flex flex-col gap-4 h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
      {sorted.map((rec) => {
        const pct = Math.max(0, Math.min(100, (rec.stockBase / rec.maxBase) * 100))
        const colorClass = pct < 25 ? "bg-red-500" : pct < 50 ? "bg-yellow-500" : "bg-green-500"
        return (
          <div key={rec.id}>
            <div className="flex justify-between items-center mb-1.5 text-sm">
              <span className="font-medium text-slate-900 dark:text-slate-100">{rec.name}</span>
              <span className="text-slate-500 dark:text-slate-400">
                {rec.display.amount} {rec.display.unit}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

const WeeklyUsageChart = ({ data, isDark }) => (
  <div className="w-full h-72">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(148,163,184,0.18)" : "rgba(128,128,128,0.2)"} />
        <XAxis dataKey="day" tick={{ fill: isDark ? "#cbd5e1" : "#9CA3AF" }} />
        <YAxis tick={{ fill: isDark ? "#cbd5e1" : "#9CA3AF" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? "rgba(15,23,42,0.92)" : "rgba(31, 41, 55, 0.85)",
            borderColor: isDark ? "rgba(148,163,184,0.22)" : "#4B5563",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "#F9FAFB" }}
        />
        <Legend />
        <Bar dataKey="batches" fill="#6366F1" name="Batches" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
)

/* ===========================
   Helpers
   =========================== */

const API_BASE = "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api"
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

function startOfISOWeek(d = new Date()) {
  const date = new Date(d)
  const day = (date.getDay() + 6) % 7 
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - day)
  return date
}
function endOfISOWeek(d = new Date()) {
  const start = startOfISOWeek(d)
  const end = new Date(start)
  end.setDate(start.getDate() + 7) 
  return end
}

/* ===========================
   Dashboard container
   =========================== */

const Dashboard = () => {
  const { cognitoId } = useAuth() || {}
  const [loading, setLoading] = useState(true)

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme-mode") === "dark"
    }
    return false
  })

  useEffect(() => {
    const onThemeChanged = () => {
      setIsDark(localStorage.getItem("theme-mode") === "dark")
    }
    window.addEventListener("themeChanged", onThemeChanged)
    return () => window.removeEventListener("themeChanged", onThemeChanged)
  }, [])

  const [inventoryRaw, setInventoryRaw] = useState([])
  const [prodLogs, setProdLogs] = useState([])
  const [prodLogsActive, setProdLogsActive] = useState([])
  const [goodsInRaw, setGoodsInRaw] = useState([])

  useEffect(() => {
    if (!cognitoId) return
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const [invRes, plRes, plaRes, giRes] = await Promise.all([
          fetch(`${API_BASE}/ingredient-inventory/active?cognito_id=${encodeURIComponent(cognitoId)}`),
          fetch(`${API_BASE}/production-log?cognito_id=${encodeURIComponent(cognitoId)}`),
          fetch(`${API_BASE}/production-log/active?cognito_id=${encodeURIComponent(cognitoId)}`),
          fetch(`${API_BASE}/goods-in/active?cognito_id=${encodeURIComponent(cognitoId)}`),
        ])

        const [invJson, plJson, plaJson, giJson] = await Promise.all([
          invRes.ok ? invRes.json() : [],
          plRes.ok ? plRes.json() : [],
          plaRes.ok ? plaRes.json() : [],
          giRes.ok ? giRes.json() : [],
        ])

        if (!mounted) return
        setInventoryRaw(Array.isArray(invJson) ? invJson : [])
        setProdLogs(Array.isArray(plJson) ? plJson : [])
        setProdLogsActive(Array.isArray(plaJson) ? plaJson : [])
        setGoodsInRaw(Array.isArray(giJson) ? giJson : [])
      } catch (e) {
        console.error("Dashboard load error:", e)
        if (!mounted) return
        setInventoryRaw([])
        setProdLogs([])
        setProdLogsActive([])
        setGoodsInRaw([])
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [cognitoId])

  const {
    kpiStockoutsCount,
    kpiLowStockCount,
    ingredientStockList,
    expiringSoonList,
    weeklyBatchesData,
    recipeStockList,
  } = useMemo(() => {
    const mapped = (inventoryRaw || []).map((r, i) => {
      const name = r.ingredient || "Unknown"
      const unit = r.unit || ""
      const group = detectUnitGroup(unit)
      const stockBase = toBaseAmount(r.totalRemaining, unit)
      const display = formatDisplayAmount(stockBase, group)

      const rawExpiry = r.expiryDate || r.expiry || r.bestBefore || r.best_before || r.activeExpiry || r.batchExpiry

      const d = rawExpiry ? new Date(rawExpiry) : null
      const expiryDate = d && !Number.isNaN(d.getTime()) ? d : undefined

      return {
        id: `${name}-${i}`,
        name,
        group,
        stockBase,
        display,
        expiryDate,
      }
    })

    const meanBase = mapped.reduce((s, it) => s + (it.stockBase || 0), 0) / Math.max(mapped.length, 1)

    const ingredientStockList = mapped
      .map((it) => {
        const maxBase = Math.max(it.stockBase, Math.round(meanBase * 1.25), 1)
        return { ...it, maxBase }
      })
      .sort((a, b) => a.stockBase / a.maxBase - b.stockBase / b.maxBase)

    const now = new Date()
    const soonCut = new Date(startOfISOWeek(now))
    soonCut.setDate(soonCut.getDate() + 7)

    const expiringSoonList = ingredientStockList
      .filter((r) => r.expiryDate && r.expiryDate <= soonCut)
      .sort((a, b) => (a.expiryDate?.getTime() || 0) - (b.expiryDate?.getTime() || 0))
      .slice(0, 30)

    const kpiLowStockCount = ingredientStockList.filter((it) => {
      const pct = (it.stockBase / it.maxBase) * 100
      return pct <= 25 && it.stockBase > 0 
    }).length

    const stockoutAggMap = new Map()
    ;(goodsInRaw || []).forEach((row) => {
      const name = row.ingredient || row.ingredient_name || row.item || row.name || "Unknown"
      const unit = row.unit || row.uom || row.measure_unit || ""
      const group = detectUnitGroup(unit)
      const remainingRaw = row.remaining ?? row.remaining_qty ?? row.remaining_quantity ?? row.totalRemaining ?? 0
      const remainingBase = toBaseAmount(remainingRaw, unit)

      const key = `${name}__${group}`
      const existing = stockoutAggMap.get(key)

      if (existing) {
        existing.stockBase += remainingBase
      } else {
        stockoutAggMap.set(key, { name, group, stockBase: remainingBase })
      }
    })

    const kpiStockoutsCount = Array.from(stockoutAggMap.values()).filter((it) => (it.stockBase || 0) <= 0).length

    const weekStart = startOfISOWeek(new Date())
    const weekEnd = endOfISOWeek(new Date())
    const dayMap = new Map(DAYS.map((d) => [d, 0]))

    ;(prodLogs || []).forEach((row) => {
      const d = new Date(row?.date || row?.production_log_date || row?.createdAt || "")
      if (Number.isNaN(d.getTime()) || d < weekStart || d >= weekEnd) return
      const dow = (d.getDay() + 6) % 7 
      const key = DAYS[dow]
      const batches = Number(row.batchesProduced ?? row.batches ?? 0)
      dayMap.set(key, (dayMap.get(key) || 0) + batches)
    })

    const weeklyBatchesData = DAYS.map((day) => ({
      day,
      batches: dayMap.get(day) || 0,
    }))

    const recipeMap = new Map()
    ;(prodLogsActive || []).forEach((row) => {
      const name = row.recipe || row.recipe_name || "Unknown"
      const unitsRemaining = Number(row.unitsRemaining ?? 0)
      if (unitsRemaining <= 0) return
      recipeMap.set(name, (recipeMap.get(name) || 0) + unitsRemaining)
    })

    const recipeArray = Array.from(recipeMap.entries()).map(([name, totalUnits]) => {
      const stockBase = totalUnits
      const display = formatDisplayAmount(stockBase, UnitGroup.UNITS)
      return { id: name, name, group: UnitGroup.UNITS, stockBase, display }
    })

    const meanRecipeBase = recipeArray.reduce((s, it) => s + (it.stockBase || 0), 0) / Math.max(recipeArray.length, 1)
    const recipeStockList = recipeArray
      .map((it) => {
        const maxBase = Math.max(it.stockBase, Math.round(meanRecipeBase * 1.25), 1)
        return { ...it, maxBase }
      })
      .sort((a, b) => a.stockBase / a.maxBase - b.stockBase / b.maxBase)

    return {
      kpiStockoutsCount,
      kpiLowStockCount,
      ingredientStockList,
      expiringSoonList,
      weeklyBatchesData,
      recipeStockList,
    }
  }, [inventoryRaw, goodsInRaw, prodLogs, prodLogsActive])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
          Inventory & Production Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Current ISO week (Mon–Sun): production & inventory at a glance.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <DashboardCard title="Stockouts (0 qty)">
          <div className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">{kpiStockoutsCount}</div>
        </DashboardCard>
        <DashboardCard title="Low Stock (≤ 25% of max)">
          <div className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">{kpiLowStockCount}</div>
        </DashboardCard>
        <DashboardCard title="Batches Produced (This Week)">
          <div className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">
            {weeklyBatchesData.reduce((s, d) => s + (d.batches || 0), 0)}
          </div>
        </DashboardCard>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCard title="Ingredient Stock Levels">
          <IngredientStock ingredients={ingredientStockList} />
        </DashboardCard>
        <DashboardCard title="Expiring Soon (next 7 days)">
          <ExpiringIngredients ingredients={expiringSoonList} />
        </DashboardCard>
        <DashboardCard title="Batches per Day (This Week)">
          <WeeklyUsageChart data={weeklyBatchesData} isDark={isDark} />
        </DashboardCard>
        <DashboardCard title="Recipe Availability (Current units remaining)">
          <RecipeStock recipes={recipeStockList} />
        </DashboardCard>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl px-8 py-4 font-bold border border-slate-200 dark:border-slate-800">
            Loading…
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard