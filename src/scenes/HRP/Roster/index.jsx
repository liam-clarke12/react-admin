// src/scenes/HRP/Roster/Roster.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";

const API_BASE =
  "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/* ---------------- Shared brand styles for HRP pages ---------------- */
const BrandStyles = () => (
  <style>{`
    .r-page {
      padding: 20px;
      min-height: 100vh;
      background: radial-gradient(circle at top left, #eef2ff 0, #fdf2ff 40%, #f8fafc 80%);
    }

    .r-layout {
      display: grid;
      gap: 18px;
      grid-template-columns: 260px minmax(0,1fr);
      align-items: flex-start;
    }

    @media (max-width: 1024px) {
      .r-layout {
        grid-template-columns: minmax(0,1fr);
      }
    }

    .r-card {
      background:#fff;
      border:1px solid #e5e7eb;
      border-radius:18px;
      box-shadow:0 18px 45px rgba(15,23,42,0.16);
      overflow:hidden;
    }

    .r-card-soft {
      background:linear-gradient(135deg,#eef2ff,#f9fafb);
      border-radius:18px;
      border:1px solid rgba(148,163,184,0.25);
      box-shadow:0 10px 30px rgba(129,140,248,0.20);
      padding:14px 16px 16px;
    }

    .r-hdr {
      padding:16px 20px 14px;
      border-bottom:1px solid #e5e7eb;
      display:flex;
      flex-wrap:wrap;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      background:linear-gradient(120deg,#4f46e5,#7c3aed,#ec4899);
      color:#f9fafb;
    }

    .r-hdr-title {
      font-size:22px;
      font-weight:800;
      margin:0;
      letter-spacing:0.01em;
    }
    .r-hdr-sub {
      font-size:13px;
      opacity:0.9;
      margin:3px 0 0;
    }
    .r-hdr-right {
      display:flex;
      gap:8px;
      align-items:center;
      flex-wrap:wrap;
    }

    .r-chip {
      border-radius:999px;
      padding:4px 10px;
      font-size:12px;
      border:1px solid rgba(191,219,254,0.8);
      color:#e0f2fe;
      background:rgba(15,23,42,0.25);
      backdrop-filter:blur(4px);
    }

    .r-btn {
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:8px 12px;
      font-size:13px;
      font-weight:700;
      border-radius:999px;
      border:1px solid transparent;
      cursor:pointer;
      background:#fff;
      color:#0f172a;
      transition:all .15s ease-out;
    }
    .r-btn-primary {
      background:#f97316;
      color:#111827;
      border-color:#fed7aa;
      box-shadow:0 6px 18px rgba(248,113,113,0.35);
    }
    .r-btn-primary:hover {
      background:#ea580c;
      transform:translateY(-1px);
    }

    .r-btn-soft {
      background:#e0f2fe;
      border-color:#bfdbfe;
      color:#0f172a;
    }
    .r-btn-soft:hover {
      background:#dbeafe;
      transform:translateY(-0.5px);
    }

    .r-body {
      padding:16px 20px 20px;
      background:linear-gradient(180deg,#f9fafb,#eff6ff);
    }

    .r-toolbar {
      margin-bottom:12px;
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      align-items:center;
      justify-content:space-between;
    }
    .r-toolbar-left,
    .r-toolbar-right {
      display:flex;
      gap:8px;
      align-items:center;
      flex-wrap:wrap;
    }

    .r-pill {
      border-radius:999px;
      padding:4px 10px;
      font-size:12px;
      background:linear-gradient(135deg,#22c55e,#a3e635);
      color:#052e16;
      font-weight:700;
      box-shadow:0 4px 10px rgba(34,197,94,0.35);
    }

    .r-week-label {
      font-weight:700;
      color:#0f172a;
      font-size:14px;
    }

    /* Employee palette */
    .r-emp-title {
      font-size:14px;
      font-weight:700;
      color:#0f172a;
      margin:0 0 6px;
    }
    .r-emp-sub {
      font-size:12px;
      color:#475569;
      margin:0 0 12px;
    }

    .r-emp-list {
      display:flex;
      flex-wrap:wrap;
      gap:6px;
      max-height:520px;
      overflow:auto;
      padding-right:4px;
    }

    .r-emp-chip {
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:6px 10px;
      border-radius:999px;
      font-size:12px;
      font-weight:600;
      cursor:grab;
      border:1px solid rgba(148,163,184,0.7);
      background:linear-gradient(135deg,#e0f2fe,#f5f3ff);
      color:#0f172a;
      box-shadow:0 4px 10px rgba(148,163,184,0.35);
      user-select:none;
    }
    .r-emp-chip span.r-dot {
      width:8px;
      height:8px;
      border-radius:999px;
      background:linear-gradient(135deg,#22c55e,#a3e635);
    }

    .r-emp-chip:active {
      cursor:grabbing;
      transform:scale(0.97);
    }

    /* Calendar grid */
    .r-calendar-wrap {
      border-radius:16px;
      overflow:hidden;
      border:1px solid #e5e7eb;
      background:#f9fafb;
      box-shadow:0 10px 28px rgba(148,163,184,0.3);
    }

    .r-cal-grid {
      display:grid;
      grid-template-columns: 150px repeat(7, minmax(0, 1fr));
      border-collapse:separate;
      border-spacing:0;
      font-size:12px;
    }

    .r-cal-head-cell {
      padding:10px 10px 8px;
      background:linear-gradient(135deg,#eef2ff,#e0f2fe);
      border-bottom:1px solid #d4d4d8;
      border-right:1px solid #e5e7eb;
      font-weight:700;
      color:#0f172a;
      text-align:center;
    }
    .r-cal-head-cell:first-of-type {
      text-align:left;
      font-weight:700;
      color:#4b5563;
    }

    .r-cal-day-label {
      font-size:12px;
      text-transform:uppercase;
      letter-spacing:0.08em;
      color:#4b5563;
    }
    .r-cal-day-date {
      font-size:13px;
      font-weight:700;
      color:#1f2937;
      margin-top:2px;
    }

    .r-cal-row-label {
      padding:10px 10px;
      border-right:1px solid #e5e7eb;
      border-bottom:1px solid #e5e7eb;
      background:linear-gradient(180deg,#faf5ff,#f9fafb);
      font-weight:700;
      color:#4b5563;
    }
    .r-cal-row-label span {
      display:block;
    }
    .r-cal-row-sub {
      font-size:11px;
      color:#6b7280;
      margin-top:2px;
      font-weight:500;
    }

    .r-cal-slot {
      min-height:86px;
      padding:6px 6px 8px;
      border-right:1px solid #e5e7eb;
      border-bottom:1px solid #e5e7eb;
      background:radial-gradient(circle at top left,#f9fafb 0,#eff6ff 45%,#f9fafb 100%);
      position:relative;
      transition:background .15s ease-out, box-shadow .15s ease-out, transform .08s ease-out;
    }

    .r-cal-slot-dropping {
      background:radial-gradient(circle at top,#e0f2fe 0,#eef2ff 40%,#f9fafb 100%);
      box-shadow:inset 0 0 0 2px #3b82f6;
      transform:scale(1.01);
    }

    .r-slot-label {
      font-size:11px;
      color:#9ca3af;
      margin-bottom:4px;
    }

    .r-slot-empty {
      font-size:11px;
      color:#cbd5f5;
      font-style:italic;
      margin-top:14px;
      text-align:center;
    }

    .r-slot-badges {
      display:flex;
      flex-wrap:wrap;
      gap:4px;
    }

    .r-slot-badge {
      display:inline-flex;
      align-items:center;
      gap:4px;
      padding:4px 8px;
      border-radius:999px;
      font-size:11px;
      font-weight:600;
      background:linear-gradient(135deg,#a855f7,#f97316);
      color:#f9fafb;
      box-shadow:0 4px 10px rgba(129,140,248,0.45);
      cursor:default;
    }
    .r-slot-badge button {
      border:none;
      background:transparent;
      color:#fee2e2;
      cursor:pointer;
      padding:0;
      line-height:1;
      font-size:12px;
    }
    .r-slot-badge button:hover {
      color:#fecaca;
    }

    .r-footnote {
      margin-top:10px;
      font-size:12px;
      color:#6b7280;
    }

    @media (max-width: 900px) {
      .r-cal-grid {
        font-size:11px;
      }
      .r-cal-head-cell { padding:8px 6px; }
      .r-cal-row-label { padding:8px 6px; }
      .r-cal-slot { min-height:72px; padding:4px; }
    }
  `}</style>
);

/* ---------------- Helpers ---------------- */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Fixed time bands for calendar rows
const BANDS = [
  { key: "morning", label: "Morning", hours: "06:00 – 14:00" },
  { key: "day", label: "Day", hours: "08:00 – 16:00" },
  { key: "evening", label: "Evening", hours: "12:00 – 20:00" },
];

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

  // assignments[dayIndex][bandKey] = [employeeId, ...]
  const [assignments, setAssignments] = useState({});
  const [dragOverSlot, setDragOverSlot] = useState(null); // {dayIndex, bandKey} or null

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

  const weekDates = useMemo(
    () => DAYS.map((_, idx) => addDays(weekStart, idx)),
    [weekStart]
  );

  const getEmployeeName = (id) => {
    const emp = employees.find((e) => e.id === id);
    return emp?.full_name || `#${id}`;
  };

  const handleShiftDrop = (e, dayIndex, bandKey) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    if (!data) return;
    const employeeId = Number(data);
    if (!employeeId) return;

    setAssignments((prev) => {
      const day = prev[dayIndex] ? { ...prev[dayIndex] } : {};
      const bandArr = day[bandKey] ? [...day[bandKey]] : [];
      if (!bandArr.includes(employeeId)) {
        bandArr.push(employeeId);
      }
      day[bandKey] = bandArr;
      return { ...prev, [dayIndex]: day };
    });

    setDragOverSlot(null);
  };

  const handleRemoveFromSlot = (dayIndex, bandKey, employeeId) => {
    setAssignments((prev) => {
      const day = prev[dayIndex] ? { ...prev[dayIndex] } : {};
      const bandArr = day[bandKey] ? [...day[bandKey]] : [];
      const nextArr = bandArr.filter((id) => id !== employeeId);
      day[bandKey] = nextArr;
      return { ...prev, [dayIndex]: day };
    });
  };

  const goPrevWeek = () => {
    setWeekStart((prev) => addDays(prev, -7));
  };

  const goNextWeek = () => {
    setWeekStart((prev) => addDays(prev, 7));
  };

  const handleSaveRoster = async () => {
    const payload = {
      cognito_id: cognitoId,
      week_start: weekStart.toISOString().slice(0, 10),
      shifts: Object.entries(assignments).map(([dayIndexStr, bands]) => ({
        day_index: Number(dayIndexStr), // 0=Mon..6=Sun
        slots: Object.entries(bands).map(([bandKey, employeeIds]) => ({
          band_key: bandKey,
          employees: employeeIds.map((id) => ({
            employee_id: id,
          })),
        })),
      })),
    };

    console.log("[Roster] Save payload:", payload);

    // 🔧 Hook up backend later:
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
    <div className="r-page">
      <BrandStyles />

      <div className="r-layout">
        {/* LEFT: Employee palette */}
        <div className="r-card-soft">
          <h3 className="r-emp-title">Team</h3>
          <p className="r-emp-sub">
            Drag an employee into a time slot for the week. You can schedule them on
            multiple days.
          </p>

          <div className="r-emp-list">
            {loadingEmployees && <span>Loading employees…</span>}
            {!loadingEmployees && employees.length === 0 && (
              <span>No employees yet. Add them in HRP → Employees.</span>
            )}
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="r-emp-chip"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", String(emp.id));
                  // to help browsers know it's copy, not move
                  if (e.dataTransfer.setDragImage) {
                    // optional custom drag image
                  }
                }}
              >
                <span className="r-dot" />
                <span>{emp.full_name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Calendar */}
        <div className="r-card">
          {/* Header */}
          <div className="r-hdr">
            <div>
              <h1 className="r-hdr-title">Roster Calendar</h1>
              <p className="r-hdr-sub">
                Colourful weekly view of who&apos;s in the building and when.
              </p>
            </div>

            <div className="r-hdr-right">
              <span className="r-chip">
                {loadingEmployees
                  ? "Loading employees…"
                  : `${employees.length} team member${
                      employees.length === 1 ? "" : "s"
                    }`}
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
                <span className="r-pill">Mon – Sun · Drag & Drop</span>
              </div>
            </div>

            {/* Calendar grid */}
            <div className="r-calendar-wrap">
              <div className="r-cal-grid">
                {/* Header row */}
                <div className="r-cal-head-cell">
                  Band / Time
                </div>
                {DAYS.map((day, idx) => (
                  <div key={day} className="r-cal-head-cell">
                    <div className="r-cal-day-label">{day}</div>
                    <div className="r-cal-day-date">
                      {formatShort(weekDates[idx])}
                    </div>
                  </div>
                ))}

                {/* Rows per band */}
                {BANDS.map((band) => (
                  <React.Fragment key={band.key}>
                    {/* Row label */}
                    <div className="r-cal-row-label">
                      <span>{band.label}</span>
                      <span className="r-cal-row-sub">{band.hours}</span>
                    </div>

                    {/* Slots per day */}
                    {DAYS.map((day, dayIndex) => {
                      const slotEmployees =
                        assignments[dayIndex]?.[band.key] || [];
                      const isDropping =
                        dragOverSlot &&
                        dragOverSlot.dayIndex === dayIndex &&
                        dragOverSlot.bandKey === band.key;

                      return (
                        <div
                          key={`${band.key}-${day}`}
                          className={
                            "r-cal-slot" +
                            (isDropping ? " r-cal-slot-dropping" : "")
                          }
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverSlot({ dayIndex, bandKey: band.key });
                          }}
                          onDragLeave={(e) => {
                            // leave may fire when hovering children; small delay avoid flicker
                            setTimeout(() => {
                              setDragOverSlot((current) => {
                                if (
                                  current &&
                                  current.dayIndex === dayIndex &&
                                  current.bandKey === band.key
                                ) {
                                  return null;
                                }
                                return current;
                              });
                            }, 30);
                          }}
                          onDrop={(e) => handleShiftDrop(e, dayIndex, band.key)}
                        >
                          <div className="r-slot-label">Drop staff here</div>

                          {slotEmployees.length === 0 ? (
                            <div className="r-slot-empty">No one assigned</div>
                          ) : (
                            <div className="r-slot-badges">
                              {slotEmployees.map((empId) => (
                                <div
                                  key={empId}
                                  className="r-slot-badge"
                                  title={getEmployeeName(empId)}
                                >
                                  <span>{getEmployeeName(empId)}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveFromSlot(
                                        dayIndex,
                                        band.key,
                                        empId
                                      )
                                    }
                                    aria-label="Remove"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="r-footnote">
              Tip: keep your time bands consistent (Morning / Day / Evening) so you
              can later translate this roster into labour cost forecasts and
              production capacity planning.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roster;
