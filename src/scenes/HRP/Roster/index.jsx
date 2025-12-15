// src/scenes/HRP/Roster/Roster.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";

const API_BASE =
  "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/* ---------------- Simple, minimal styles (reduced colours) ---------------- */
const BrandStyles = () => (
  <style>{`
    .r-page{
      min-height:100vh;
      padding:16px;
      background:#f6f7fb;
      color:#0f172a;
    }

    .r-layout{
      display:grid;
      gap:14px;
      grid-template-columns: 220px minmax(0,1fr);
      align-items:start;
      max-width: 1400px;
      margin:0 auto;
    }

    @media (max-width: 1024px){
      .r-layout{ grid-template-columns: minmax(0,1fr); }
    }

    .r-panel{
      background:#fff;
      border:1px solid #e5e7eb;
      border-radius:14px;
      box-shadow:0 10px 26px rgba(15,23,42,0.08);
      overflow:hidden;
    }

    .r-panel-body{ padding:12px; }

    /* Left: Team palette */
    .r-emp-title{
      margin:0 0 6px;
      font-size:13px;
      font-weight:800;
      letter-spacing:0.02em;
      color:#111827;
      text-transform:uppercase;
    }
    .r-emp-sub{
      margin:0 0 10px;
      font-size:12px;
      color:#64748b;
      line-height:1.35;
    }

    .r-emp-list{
      display:flex;
      flex-direction:column;
      gap:8px;
      max-height: calc(100vh - 130px);
      overflow:auto;
      padding-right:4px;
    }

    .r-emp-chip{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      padding:10px 10px;
      border-radius:12px;
      border:1px solid #e5e7eb;
      background:#ffffff;
      cursor:grab;
      user-select:none;
      transition:transform .08s ease-out, box-shadow .12s ease-out;
    }
    .r-emp-chip:hover{
      box-shadow:0 10px 18px rgba(15,23,42,0.08);
      transform:translateY(-1px);
    }
    .r-emp-chip:active{
      cursor:grabbing;
      transform:scale(0.99);
    }
    .r-emp-name{
      font-size:13px;
      font-weight:700;
      color:#0f172a;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .r-emp-tag{
      font-size:11px;
      font-weight:800;
      padding:4px 8px;
      border-radius:999px;
      border:1px solid #e5e7eb;
      color:#334155;
      background:#f8fafc;
      flex:0 0 auto;
    }

    /* Right: Calendar takes most of the page */
    .r-calendar-wrap{
      background:#fff;
      border:1px solid #e5e7eb;
      border-radius:14px;
      box-shadow:0 10px 26px rgba(15,23,42,0.08);
      overflow:hidden;
    }

    .r-toolbar{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      padding:10px 12px;
      border-bottom:1px solid #e5e7eb;
      background:#ffffff;
      flex-wrap:wrap;
    }

    .r-toolbar-left,
    .r-toolbar-right{
      display:flex;
      gap:8px;
      align-items:center;
      flex-wrap:wrap;
    }

    .r-btn{
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:8px 10px;
      font-size:13px;
      font-weight:800;
      border-radius:10px;
      border:1px solid #e5e7eb;
      background:#fff;
      color:#0f172a;
      cursor:pointer;
      transition:transform .08s ease-out, box-shadow .12s ease-out, background .12s ease-out;
    }
    .r-btn:hover{
      background:#f8fafc;
      box-shadow:0 10px 18px rgba(15,23,42,0.08);
      transform:translateY(-1px);
    }

    .r-btn-primary{
      background:#111827;
      border-color:#111827;
      color:#fff;
    }
    .r-btn-primary:hover{
      background:#0b1220;
      border-color:#0b1220;
    }

    .r-week-label{
      font-size:13px;
      font-weight:800;
      color:#0f172a;
    }

    .r-chip{
      font-size:12px;
      font-weight:800;
      padding:6px 10px;
      border-radius:999px;
      background:#f1f5f9;
      border:1px solid #e5e7eb;
      color:#334155;
    }

    /* Calendar grid */
    .r-cal-grid{
      display:grid;
      grid-template-columns: 150px repeat(7, minmax(0, 1fr));
      font-size:12px;
      width:100%;
    }

    .r-cal-head-cell{
      padding:10px 10px;
      background:#f8fafc;
      border-bottom:1px solid #e5e7eb;
      border-right:1px solid #e5e7eb;
      font-weight:900;
      color:#0f172a;
      text-align:center;
    }
    .r-cal-head-cell:first-of-type{
      text-align:left;
      color:#475569;
    }

    .r-cal-day-label{
      font-size:11px;
      text-transform:uppercase;
      letter-spacing:0.08em;
      color:#64748b;
    }
    .r-cal-day-date{
      font-size:13px;
      font-weight:900;
      color:#0f172a;
      margin-top:2px;
    }

    .r-cal-row-label{
      padding:10px 10px;
      border-right:1px solid #e5e7eb;
      border-bottom:1px solid #e5e7eb;
      background:#ffffff;
      font-weight:900;
      color:#334155;
    }
    .r-cal-row-sub{
      display:block;
      font-size:11px;
      font-weight:700;
      color:#94a3b8;
      margin-top:2px;
    }

    .r-cal-slot{
      min-height:110px; /* more space, calendar feels bigger */
      padding:8px;
      border-right:1px solid #e5e7eb;
      border-bottom:1px solid #e5e7eb;
      background:#ffffff;
      transition:box-shadow .12s ease-out, background .12s ease-out;
    }
    .r-cal-slot:hover{
      background:#fbfdff;
    }
    .r-cal-slot-dropping{
      box-shadow: inset 0 0 0 2px #111827;
      background:#f8fafc;
    }

    .r-slot-label{
      font-size:11px;
      color:#94a3b8;
      margin-bottom:6px;
      font-weight:700;
    }

    .r-slot-empty{
      font-size:11px;
      color:#cbd5e1;
      font-style:italic;
      margin-top:18px;
      text-align:center;
    }

    .r-slot-badges{
      display:flex;
      flex-wrap:wrap;
      gap:6px;
    }

    /* Only a few badge colours */
    .r-slot-badge{
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:6px 10px;
      border-radius:999px;
      font-size:12px;
      font-weight:800;
      border:1px solid #e5e7eb;
      box-shadow:0 6px 14px rgba(15,23,42,0.08);
      max-width: 100%;
    }
    .r-slot-badge span{
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
      max-width: 160px;
    }

    .r-badge-a{ background:#eef2ff; color:#1e1b4b; border-color:#c7d2fe; } /* indigo */
    .r-badge-b{ background:#ecfeff; color:#083344; border-color:#a5f3fc; } /* cyan */
    .r-badge-c{ background:#f1f5f9; color:#0f172a; border-color:#e5e7eb; } /* slate */

    .r-slot-badge button{
      border:none;
      background:transparent;
      cursor:pointer;
      font-weight:900;
      color:inherit;
      opacity:0.55;
      padding:0;
      line-height:1;
      flex:0 0 auto;
    }
    .r-slot-badge button:hover{ opacity:0.9; }

    @media (max-width: 900px){
      .r-cal-grid{ font-size:11px; }
      .r-cal-slot{ min-height:90px; }
      .r-cal-head-cell{ padding:8px 6px; }
      .r-cal-row-label{ padding:8px 6px; }
      .r-slot-badge span{ max-width: 120px; }
    }
  `}</style>
);

/* ---------------- Helpers ---------------- */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

function badgeClassForEmployee(employeeId) {
  const n = Math.abs(Number(employeeId || 0)) % 3;
  if (n === 0) return "r-badge-a";
  if (n === 1) return "r-badge-b";
  return "r-badge-c";
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
      if (!bandArr.includes(employeeId)) bandArr.push(employeeId);
      day[bandKey] = bandArr;
      return { ...prev, [dayIndex]: day };
    });

    setDragOverSlot(null);
  };

  const handleRemoveFromSlot = (dayIndex, bandKey, employeeId) => {
    setAssignments((prev) => {
      const day = prev[dayIndex] ? { ...prev[dayIndex] } : {};
      const bandArr = day[bandKey] ? [...day[bandKey]] : [];
      day[bandKey] = bandArr.filter((id) => id !== employeeId);
      return { ...prev, [dayIndex]: day };
    });
  };

  const goPrevWeek = () => setWeekStart((prev) => addDays(prev, -7));
  const goNextWeek = () => setWeekStart((prev) => addDays(prev, 7));

  const handleSaveRoster = async () => {
    const payload = {
      cognito_id: cognitoId,
      week_start: weekStart.toISOString().slice(0, 10),
      shifts: Object.entries(assignments).map(([dayIndexStr, bands]) => ({
        day_index: Number(dayIndexStr), // 0=Mon..6=Sun
        slots: Object.entries(bands).map(([bandKey, employeeIds]) => ({
          band_key: bandKey,
          employees: employeeIds.map((id) => ({ employee_id: id })),
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
        <div className="r-panel">
          <div className="r-panel-body">
            <h3 className="r-emp-title">Team</h3>
            <p className="r-emp-sub">
              Drag an employee into a slot. Keep it simple + consistent.
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
                  }}
                  title="Drag into calendar"
                >
                  <span className="r-emp-name">{emp.full_name}</span>
                  <span className="r-emp-tag">Drag</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Calendar (dominant) */}
        <div className="r-calendar-wrap">
          {/* Minimal toolbar (no big header) */}
          <div className="r-toolbar">
            <div className="r-toolbar-left">
              <button type="button" className="r-btn" onClick={goPrevWeek}>
                ← Prev
              </button>
              <button type="button" className="r-btn" onClick={goNextWeek}>
                Next →
              </button>
              <span className="r-chip">
                {loadingEmployees
                  ? "Loading…"
                  : `${employees.length} staff`}
              </span>
            </div>

            <div className="r-toolbar-right">
              <span className="r-week-label">
                Week of {formatShort(weekStart)} ({formatRangeLabel(weekStart)})
              </span>
              <button
                type="button"
                className="r-btn r-btn-primary"
                onClick={handleSaveRoster}
              >
                Save
              </button>
            </div>
          </div>

          {/* Calendar grid */}
          <div className="r-cal-grid">
            {/* Header row */}
            <div className="r-cal-head-cell">Band / Time</div>
            {DAYS.map((day, idx) => (
              <div key={day} className="r-cal-head-cell">
                <div className="r-cal-day-label">{day}</div>
                <div className="r-cal-day-date">{formatShort(weekDates[idx])}</div>
              </div>
            ))}

            {/* Rows per band */}
            {BANDS.map((band) => (
              <React.Fragment key={band.key}>
                <div className="r-cal-row-label">
                  {band.label}
                  <span className="r-cal-row-sub">{band.hours}</span>
                </div>

                {DAYS.map((day, dayIndex) => {
                  const slotEmployees = assignments[dayIndex]?.[band.key] || [];
                  const isDropping =
                    dragOverSlot &&
                    dragOverSlot.dayIndex === dayIndex &&
                    dragOverSlot.bandKey === band.key;

                  return (
                    <div
                      key={`${band.key}-${day}`}
                      className={"r-cal-slot" + (isDropping ? " r-cal-slot-dropping" : "")}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverSlot({ dayIndex, bandKey: band.key });
                      }}
                      onDragLeave={() => {
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
                      <div className="r-slot-label">Drop here</div>

                      {slotEmployees.length === 0 ? (
                        <div className="r-slot-empty">Empty</div>
                      ) : (
                        <div className="r-slot-badges">
                          {slotEmployees.map((empId) => (
                            <div
                              key={empId}
                              className={`r-slot-badge ${badgeClassForEmployee(empId)}`}
                              title={getEmployeeName(empId)}
                            >
                              <span>{getEmployeeName(empId)}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveFromSlot(dayIndex, band.key, empId)
                                }
                                aria-label="Remove"
                                title="Remove"
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
      </div>
    </div>
  );
};

export default Roster;
