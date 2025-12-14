// src/scenes/HRP/Roster/Roster.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";

const API_BASE =
  "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/* ---------------- Shared brand styles for HRP pages ---------------- */
const BrandStyles = () => (
  <style>{`
    .r-wrap { padding: 20px; }
    .r-card {
      background:#fff; border:1px solid #e5e7eb; border-radius:16px;
      box-shadow:0 1px 2px rgba(16,24,40,0.06),0 1px 3px rgba(16,24,40,0.08);
      overflow:hidden;
    }
    .r-hdr {
      padding:16px 20px; border-bottom:1px solid #e5e7eb;
      display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px;
    }
    .r-hdr-title {
      font-size:22px; font-weight:800; color:#0f172a; margin:0;
    }
    .r-hdr-sub {
      font-size:13px; color:#64748b; margin:2px 0 0;
    }
    .r-hdr-right { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }

    .r-chip {
      border-radius:999px; padding:4px 10px; font-size:12px;
      border:1px solid #e5e7eb; color:#475569; background:#f8fafc;
    }

    .r-btn {
      display:inline-flex; align-items:center; gap:6px; padding:8px 12px;
      font-size:14px; font-weight:700; border-radius:10px; border:1px solid transparent;
      cursor:pointer; background:#fff; color:#0f172a;
    }
    .r-btn-primary {
      background:#7C3AED; color:#fff;
      box-shadow:0 1px 2px rgba(16,24,40,0.06),0 1px 3px rgba(16,24,40,0.08);
      border-color:#7C3AED;
    }
    .r-btn-primary:hover { background:#5B21B6; }

    .r-btn-soft {
      background:#f8fafc; border-color:#e5e7eb; color:#0f172a;
    }
    .r-btn-soft:hover { background:#e2e8f0; }

    .r-body { padding:16px 20px 20px; background:#f8fafc; }

    .r-toolbar {
      margin-bottom:12px; display:flex; flex-wrap:wrap; gap:10px;
      align-items:center; justify-content:space-between;
    }
    .r-toolbar-left, .r-toolbar-right {
      display:flex; gap:8px; align-items:center; flex-wrap:wrap;
    }

    .r-pill {
      border-radius:999px; padding:4px 10px; font-size:13px;
      background:#eef2ff; color:#4f46e5; font-weight:600;
    }

    .r-week-label {
      font-weight:700; color:#0f172a; font-size:14px;
    }

    .r-table-wrap {
      border-radius:12px; overflow:auto; border:1px solid #e5e7eb; background:#fff;
    }

    table.r-table {
      width:100%; border-collapse:collapse; min-width:720px;
    }
    .r-th, .r-td {
      padding:8px 10px; border-bottom:1px solid #e5e7eb; font-size:13px;
    }
    .r-th {
      background:#f9fafb; font-weight:700; color:#475569; text-align:left;
      position:sticky; top:0; z-index:1;
    }
    .r-th-center { text-align:center; }
    .r-td-emp {
      font-weight:700; color:#0f172a; white-space:nowrap;
    }
    .r-td-muted { color:#64748b; font-size:12px; }

    .r-shift-input {
      width:100%; padding:6px 8px; font-size:12px;
      border-radius:8px; border:1px solid #e5e7eb; outline:none;
      background:#fff;
    }
    .r-shift-input:focus {
      border-color:#7C3AED;
      box-shadow:0 0 0 3px rgba(124,58,237,0.18);
    }

    .r-footnote {
      margin-top:8px; font-size:12px; color:#64748b;
    }

    @media (max-width:768px) {
      .r-hdr { align-items:flex-start; }
      .r-hdr-right { justify-content:flex-start; }
      .r-toolbar { align-items:flex-start; }
    }
  `}</style>
);

/* ---------------- Helpers ---------------- */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfISOWeek(date = new Date()) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Mon=0..Sun=6
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function addDays(date, diff) {
  const d = new Date(date);
  d.setDate(d.getDate() + diff);
  return d;
}

function formatShort(date) {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleString("default", { month: "short" });
  return `${day} ${month}`;
}

function formatRangeLabel(weekStart) {
  const start = formatShort(weekStart);
  const end = formatShort(addDays(weekStart, 6));
  return `${start} – ${end}`;
}

/* ---------------- Main Roster Component ---------------- */

const Roster = () => {
  const { cognitoId } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const [weekStart, setWeekStart] = useState(() => startOfISOWeek(new Date()));

  // shifts[employeeId][dayIndex] = "08:00–16:00"
  const [shifts, setShifts] = useState({});

  // Load employees once
  useEffect(() => {
    if (!cognitoId) return;

    const load = async () => {
      try {
        setLoadingEmployees(true);
        const res = await fetch(
          `${API_BASE}/employees/list?cognito_id=${encodeURIComponent(cognitoId)}`
        );
        const json = await res.json();
        setEmployees(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error("[Roster] Failed to load employees:", err);
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };

    load();
  }, [cognitoId]);

  const handleShiftChange = (employeeId, dayIndex, value) => {
    setShifts((prev) => {
      const emp = prev[employeeId] ? { ...prev[employeeId] } : {};
      emp[dayIndex] = value;
      return { ...prev, [employeeId]: emp };
    });
  };

  const goPrevWeek = () => {
    setWeekStart((prev) => addDays(prev, -7));
  };

  const goNextWeek = () => {
    setWeekStart((prev) => addDays(prev, 7));
  };

  const weekDates = useMemo(
    () => DAYS.map((_, idx) => addDays(weekStart, idx)),
    [weekStart]
  );

  const handleSaveRoster = async () => {
    // Build payload ready for an API
    const payload = {
      cognito_id: cognitoId,
      week_start: weekStart.toISOString().slice(0, 10),
      shifts: Object.entries(shifts).map(([employeeId, empShifts]) => ({
        employee_id: Number(employeeId),
        days: DAYS.map((_, dayIndex) => ({
          day_index: dayIndex, // 0=Mon..6=Sun
          shift: empShifts?.[dayIndex] || "",
        })),
      })),
    };

    console.log("[Roster] Save payload:", payload);

    // 🔧 When you build the backend, you can uncomment this:
    /*
    try {
      const res = await fetch(`${API_BASE}/roster/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        alert("Error saving roster: " + JSON.stringify(json));
        return;
      }
      alert("Roster saved!");
    } catch (err) {
      console.error("[Roster] Save error:", err);
      alert("Failed to save roster.");
    }
    */
  };

  return (
    <div className="r-wrap">
      <BrandStyles />

      <div className="r-card">
        {/* Header */}
        <div className="r-hdr">
          <div>
            <h1 className="r-hdr-title">Roster</h1>
            <p className="r-hdr-sub">
              Plan who is on shift each day. Week-by-week overview for all employees.
            </p>
          </div>

          <div className="r-hdr-right">
            <span className="r-chip">
              {loadingEmployees
                ? "Loading employees…"
                : `${employees.length} employee${employees.length === 1 ? "" : "s"}`}
            </span>
            <button
              type="button"
              className="r-btn r-btn-primary"
              onClick={handleSaveRoster}
            >
              Save Roster
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="r-body">
          {/* Toolbar: week navigation */}
          <div className="r-toolbar">
            <div className="r-toolbar-left">
              <button
                type="button"
                className="r-btn r-btn-soft"
                onClick={goPrevWeek}
              >
                ← Previous week
              </button>
              <button
                type="button"
                className="r-btn r-btn-soft"
                onClick={goNextWeek}
              >
                Next week →
              </button>
            </div>

            <div className="r-toolbar-right">
              <span className="r-week-label">
                Week of {formatShort(weekStart)} ({formatRangeLabel(weekStart)})
              </span>
              <span className="r-pill">Mon – Sun</span>
            </div>
          </div>

          {/* Table */}
          <div className="r-table-wrap">
            <table className="r-table">
              <thead>
                <tr>
                  <th className="r-th">Employee</th>
                  {DAYS.map((day, idx) => (
                    <th key={day} className="r-th r-th-center">
                      <div>{day}</div>
                      <div className="r-td-muted">
                        {formatShort(weekDates[idx])}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingEmployees && (
                  <tr>
                    <td className="r-td" colSpan={DAYS.length + 1}>
                      Loading employees…
                    </td>
                  </tr>
                )}

                {!loadingEmployees && employees.length === 0 && (
                  <tr>
                    <td className="r-td" colSpan={DAYS.length + 1}>
                      No employees found. Add employees in the HRP → Employees page first.
                    </td>
                  </tr>
                )}

                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="r-td">
                      <div className="r-td-emp">{emp.full_name}</div>
                      <div className="r-td-muted">
                        {emp.employment_type || "—"} · {emp.status || "active"}
                      </div>
                    </td>
                    {DAYS.map((day, dayIndex) => (
                      <td key={day} className="r-td">
                        <input
                          type="text"
                          className="r-shift-input"
                          placeholder="e.g. 08:00–16:00"
                          value={shifts?.[emp.id]?.[dayIndex] || ""}
                          onChange={(e) =>
                            handleShiftChange(emp.id, dayIndex, e.target.value)
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="r-footnote">
            Tip: Keep shifts consistent (e.g. <strong>06–14</strong>,{" "}
            <strong>08–16</strong>, <strong>12–20</strong>) so you can later
            use this roster data for labour cost forecasts & production planning.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roster;
