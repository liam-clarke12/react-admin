// src/scenes/HRP/Roster/Roster.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";

const API_BASE =
  "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/* ---------------- Simple, minimal styles ---------------- */
const Styles = () => (
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
      grid-template-columns: 260px minmax(0,1fr);
      align-items:start;
      max-width: 1500px;
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

    .r-title{
      margin:0 0 8px;
      font-size:13px;
      font-weight:900;
      letter-spacing:0.06em;
      text-transform:uppercase;
      color:#111827;
    }
    .r-sub{
      margin:0 0 12px;
      font-size:12px;
      color:#64748b;
      line-height:1.4;
    }

    .r-toolbar{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      padding:10px 12px;
      border-bottom:1px solid #e5e7eb;
      background:#fff;
      flex-wrap:wrap;
    }
    .r-toolbar-left,.r-toolbar-right{
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
      font-weight:900;
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
    .r-btn-primary:hover{ background:#0b1220; border-color:#0b1220; }

    .r-chip{
      font-size:12px;
      font-weight:900;
      padding:6px 10px;
      border-radius:999px;
      background:#f1f5f9;
      border:1px solid #e5e7eb;
      color:#334155;
    }
    .r-week-label{
      font-size:13px;
      font-weight:900;
      color:#0f172a;
    }

    /* Left column blocks */
    .r-block{
      border:1px solid #e5e7eb;
      border-radius:12px;
      padding:10px;
      background:#fff;
    }
    .r-stack{ display:flex; flex-direction:column; gap:10px; }

    .r-emp-list{
      display:flex;
      flex-direction:column;
      gap:8px;
      max-height: 45vh;
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
      user-select:none;
    }
    .r-emp-name{
      font-size:13px;
      font-weight:800;
      color:#0f172a;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .r-emp-meta{
      font-size:11px;
      font-weight:900;
      padding:4px 8px;
      border-radius:999px;
      border:1px solid #e5e7eb;
      background:#f8fafc;
      color:#334155;
      flex:0 0 auto;
    }

    .r-role-list{
      display:flex;
      flex-direction:column;
      gap:8px;
    }
    .r-role-chip{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      padding:10px 10px;
      border-radius:12px;
      border:1px solid #e5e7eb;
      background:#fff;
      cursor:grab;
      user-select:none;
      box-shadow:0 8px 16px rgba(15,23,42,0.06);
      transition:transform .08s ease-out, box-shadow .12s ease-out;
    }
    .r-role-chip:hover{
      box-shadow:0 12px 22px rgba(15,23,42,0.10);
      transform:translateY(-1px);
    }
    .r-role-chip:active{ cursor:grabbing; transform:scale(0.99); }

    .r-role-left{
      display:flex;
      align-items:center;
      gap:10px;
      min-width:0;
    }
    .r-swatch{
      width:12px;
      height:12px;
      border-radius:999px;
      background: var(--swatch);
      box-shadow: 0 0 0 3px rgba(255,255,255,0.8), 0 10px 18px rgba(15,23,42,0.20);
      flex:0 0 auto;
    }
    .r-role-name{
      font-size:13px;
      font-weight:900;
      color:#0f172a;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .r-role-hint{
      font-size:11px;
      font-weight:900;
      padding:4px 8px;
      border-radius:999px;
      border:1px solid #e5e7eb;
      background:#f8fafc;
      color:#334155;
      flex:0 0 auto;
    }

    /* Grid (rows=people) */
    .r-calendar{
      background:#fff;
      border:1px solid #e5e7eb;
      border-radius:14px;
      box-shadow:0 10px 26px rgba(15,23,42,0.08);
      overflow:hidden;
    }

    .r-grid{
      display:grid;
      grid-template-columns: 220px repeat(7, minmax(0, 1fr));
      width:100%;
      font-size:12px;
    }

    .r-head{
      padding:10px;
      background:#f8fafc;
      border-bottom:1px solid #e5e7eb;
      border-right:1px solid #e5e7eb;
      font-weight:900;
      color:#0f172a;
      text-align:center;
    }
    .r-head:first-of-type{ text-align:left; color:#475569; }

    .r-day-label{
      font-size:11px;
      text-transform:uppercase;
      letter-spacing:0.08em;
      color:#64748b;
    }
    .r-day-date{
      font-size:13px;
      font-weight:900;
      color:#0f172a;
      margin-top:2px;
    }

    .r-row-label{
      padding:10px;
      border-right:1px solid #e5e7eb;
      border-bottom:1px solid #e5e7eb;
      background:#fff;
    }
    .r-row-name{
      font-size:13px;
      font-weight:900;
      color:#0f172a;
      margin:0;
      line-height:1.2;
    }
    .r-row-sub{
      margin-top:4px;
      font-size:11px;
      color:#94a3b8;
      font-weight:800;
    }

    .r-cell{
      min-height:86px;
      padding:8px;
      border-right:1px solid #e5e7eb;
      border-bottom:1px solid #e5e7eb;
      background:#fff;
      transition:box-shadow .12s ease-out, background .12s ease-out;
      position:relative;
    }
    .r-cell:hover{ background:#fbfdff; }
    .r-cell-dropping{
      box-shadow: inset 0 0 0 2px #111827;
      background:#f8fafc;
    }

    .r-cell-empty{
      font-size:11px;
      color:#cbd5e1;
      font-style:italic;
      text-align:center;
      margin-top:18px;
    }

    .r-shifts{
      display:flex;
      flex-direction:column;
      gap:8px;
    }

    /* 🔥 Stronger, punchier shift blocks */
    .r-shift{
      border-radius:14px;
      padding:10px 12px;
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:10px;
      box-shadow: 0 14px 28px rgba(15,23,42,0.16);
      position:relative;
      overflow:hidden;

      /* vars provided inline */
      background: var(--bg);
      color: var(--fg);

      /* thick outline + subtle inner highlight */
      border: 2px solid var(--bd);
    }

    /* glossy accent stripe */
    .r-shift::before{
      content:"";
      position:absolute;
      inset:0;
      background: linear-gradient(120deg, rgba(255,255,255,0.35), rgba(255,255,255,0.0) 55%);
      pointer-events:none;
      mix-blend-mode: overlay;
    }

    /* left colour bar for even more pop */
    .r-shift::after{
      content:"";
      position:absolute;
      left:0;
      top:0;
      bottom:0;
      width:8px;
      background: var(--bd);
      opacity:0.95;
      pointer-events:none;
    }

    .r-shift-left{ min-width:0; padding-left:2px; }
    .r-shift-role{
      font-weight:1000;
      font-size:12px;
      line-height:1.2;
      margin:0;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
      max-width: 160px;
      text-shadow: 0 1px 0 rgba(0,0,0,0.06);
    }
    .r-shift-time{
      margin-top:5px;
      font-size:11px;
      font-weight:950;
      white-space:nowrap;
      opacity:0.95;
    }

    .r-icon-btn{
      border:none;
      background:rgba(255,255,255,0.25);
      cursor:pointer;
      font-weight:1000;
      color:inherit;
      padding:6px 8px;
      line-height:1;
      border-radius:999px;
      opacity:0.9;
      box-shadow:0 10px 18px rgba(15,23,42,0.16);
      flex:0 0 auto;
    }
    .r-icon-btn:hover{ opacity:1; transform: translateY(-1px); }

    /* Modal */
    .r-modal-overlay{
      position:fixed;
      inset:0;
      background:rgba(15,23,42,0.55);
      display:flex;
      align-items:center;
      justify-content:center;
      padding:18px;
      z-index:9999;
    }
    .r-modal{
      width:min(520px, 100%);
      background:#fff;
      border-radius:16px;
      border:1px solid #e5e7eb;
      box-shadow:0 22px 70px rgba(0,0,0,0.22);
      overflow:hidden;
    }
    .r-modal-hdr{
      padding:12px 14px;
      border-bottom:1px solid #e5e7eb;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
    }
    .r-modal-title{
      margin:0;
      font-size:13px;
      font-weight:1000;
      letter-spacing:0.05em;
      text-transform:uppercase;
      color:#111827;
    }
    .r-modal-body{
      padding:14px;
      display:flex;
      flex-direction:column;
      gap:12px;
    }
    .r-field{
      display:flex;
      flex-direction:column;
      gap:6px;
    }
    .r-label{
      font-size:12px;
      font-weight:900;
      color:#334155;
    }
    .r-input, .r-select{
      border:1px solid #e5e7eb;
      border-radius:12px;
      padding:10px 10px;
      font-size:13px;
      font-weight:800;
      color:#0f172a;
      background:#fff;
      outline:none;
    }
    .r-input:focus, .r-select:focus{
      box-shadow:0 0 0 3px rgba(17,24,39,0.08);
      border-color:#cbd5e1;
    }
    .r-row{
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap:10px;
    }
    .r-modal-ftr{
      padding:12px 14px;
      border-top:1px solid #e5e7eb;
      display:flex;
      justify-content:flex-end;
      gap:10px;
      background:#fff;
    }
    .r-note{
      font-size:12px;
      color:#64748b;
      line-height:1.35;
    }

    @media (max-width: 900px){
      .r-grid{ grid-template-columns: 190px repeat(7, minmax(0, 1fr)); }
      .r-row-label{ padding:8px; }
      .r-cell{ padding:6px; min-height:78px; }
      .r-shift-role{ max-width: 120px; }
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

function isValidTime(t) {
  return typeof t === "string" && /^\d{2}:\d{2}$/.test(t);
}

function timeToMinutes(t) {
  const [hh, mm] = t.split(":").map((x) => Number(x));
  return hh * 60 + mm;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return (
    timeToMinutes(aStart) < timeToMinutes(bEnd) &&
    timeToMinutes(bStart) < timeToMinutes(aEnd)
  );
}

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/* ---------------- Roles (🔥 more saturated + high-contrast) ---------------- */

const DEFAULT_ROLES = [
  {
    key: "production",
    name: "Production",
    style: { bg: "#312E81", fg: "#FFFFFF", bd: "#6366F1" }, // indigo
  },
  {
    key: "packing",
    name: "Packing",
    style: { bg: "#0F766E", fg: "#FFFFFF", bd: "#2DD4BF" }, // teal
  },
  {
    key: "dispatch",
    name: "Dispatch",
    style: { bg: "#9A3412", fg: "#FFFFFF", bd: "#FB923C" }, // orange
  },
  {
    key: "admin",
    name: "Admin",
    style: { bg: "#86198F", fg: "#FFFFFF", bd: "#F472B6" }, // magenta
  },
];

/* ---------------- Main Component ---------------- */

const Roster = () => {
  const { cognitoId } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const [weekStart, setWeekStart] = useState(() => startOfISOWeek(new Date()));

  // assignments[employeeId][dayIndex] = [{ id, roleKey, start, end }, ...]
  const [assignments, setAssignments] = useState({});

  const [dragOverCell, setDragOverCell] = useState(null); // {employeeId, dayIndex} or null

  // role drop modal state
  const [modal, setModal] = useState({
    open: false,
    employeeId: null,
    dayIndex: null,
    roleKey: DEFAULT_ROLES[0]?.key || "",
    start: "08:00",
    end: "16:00",
    error: "",
  });

  const roles = DEFAULT_ROLES;

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

  const getRoleByKey = (roleKey) => roles.find((r) => r.key === roleKey);

  const getDayShifts = (employeeId, dayIndex) => {
    const empDays = assignments[employeeId] || {};
    const shifts = empDays[dayIndex] || [];
    return [...shifts].sort(
      (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
    );
  };

  const openRoleModalForDrop = (employeeId, dayIndex, roleKeyFromDrag) => {
    setModal({
      open: true,
      employeeId,
      dayIndex,
      roleKey: roleKeyFromDrag || roles[0]?.key || "",
      start: "08:00",
      end: "16:00",
      error: "",
    });
  };

  const closeModal = () => setModal((m) => ({ ...m, open: false, error: "" }));

  const confirmAddShift = () => {
    const { employeeId, dayIndex, roleKey, start, end } = modal;

    if (dayIndex === null || dayIndex === undefined) {
      setModal((m) => ({ ...m, error: "Missing day." }));
      return;
    }
    if (!roleKey) {
      setModal((m) => ({ ...m, error: "Choose a role." }));
      return;
    }
    if (!isValidTime(start) || !isValidTime(end)) {
      setModal((m) => ({ ...m, error: "Please enter valid start/end time." }));
      return;
    }
    if (timeToMinutes(start) >= timeToMinutes(end)) {
      setModal((m) => ({ ...m, error: "End time must be after start time." }));
      return;
    }

    const existing = getDayShifts(employeeId, dayIndex);
    if (existing.some((s) => overlaps(start, end, s.start, s.end))) {
      setModal((m) => ({
        ...m,
        error: "That time overlaps an existing shift for this person on this day.",
      }));
      return;
    }

    setAssignments((prev) => {
      const next = { ...prev };
      const empDays = next[employeeId] ? { ...next[employeeId] } : {};
      const dayArr = empDays[dayIndex] ? [...empDays[dayIndex]] : [];
      dayArr.push({ id: uid(), roleKey, start, end });
      empDays[dayIndex] = dayArr;
      next[employeeId] = empDays;
      return next;
    });

    closeModal();
  };

  const removeShift = (employeeId, dayIndex, shiftId) => {
    setAssignments((prev) => {
      const next = { ...prev };
      const empDays = next[employeeId] ? { ...next[employeeId] } : {};
      const dayArr = empDays[dayIndex] ? [...empDays[dayIndex]] : [];
      empDays[dayIndex] = dayArr.filter((s) => s.id !== shiftId);
      next[employeeId] = empDays;
      return next;
    });
  };

  const goPrevWeek = () => setWeekStart((prev) => addDays(prev, -7));
  const goNextWeek = () => setWeekStart((prev) => addDays(prev, 7));

  const handleSaveRoster = async () => {
    const flat = [];
    Object.entries(assignments).forEach(([employeeIdStr, daysObj]) => {
      Object.entries(daysObj || {}).forEach(([dayIndexStr, shiftArr]) => {
        (shiftArr || []).forEach((s) => {
          flat.push({
            employee_id: Number(employeeIdStr),
            day_index: Number(dayIndexStr),
            role_key: s.roleKey,
            start: s.start,
            end: s.end,
          });
        });
      });
    });

    const payload = {
      cognito_id: cognitoId,
      week_start: weekStart.toISOString().slice(0, 10),
      shifts: flat,
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
      <Styles />

      <div className="r-layout">
        {/* LEFT: Roles + Team */}
        <div className="r-panel">
          <div className="r-panel-body">
            <div className="r-stack">
              <div className="r-block">
                <div className="r-title">Roles</div>
                <p className="r-sub">
                  Drag a role into a person’s day cell, then set start/finish time.
                </p>

                <div className="r-role-list">
                  {roles.map((role) => (
                    <div
                      key={role.key}
                      className="r-role-chip"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          "application/x-roster-role",
                          JSON.stringify({ roleKey: role.key })
                        );
                      }}
                      title="Drag into the roster"
                    >
                      <div className="r-role-left">
                        <span
                          className="r-swatch"
                          style={{ ["--swatch"]: role.style.bd }}
                        />
                        <span className="r-role-name">{role.name}</span>
                      </div>
                      <span className="r-role-hint">Drag</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="r-block">
                <div className="r-title">Team</div>
                <p className="r-sub">
                  Rows are people. Columns are days. Shifts show strong role colours.
                </p>

                <div className="r-emp-list">
                  {loadingEmployees && <span>Loading employees…</span>}
                  {!loadingEmployees && employees.length === 0 && (
                    <span>No employees yet. Add them in HRP → Employees.</span>
                  )}
                  {employees.map((emp) => (
                    <div key={emp.id} className="r-emp-chip">
                      <span className="r-emp-name">{emp.full_name}</span>
                      <span className="r-emp-meta">Row</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Roster grid */}
        <div className="r-calendar">
          <div className="r-toolbar">
            <div className="r-toolbar-left">
              <button type="button" className="r-btn" onClick={goPrevWeek}>
                ← Prev
              </button>
              <button type="button" className="r-btn" onClick={goNextWeek}>
                Next →
              </button>
              <span className="r-chip">
                {loadingEmployees ? "Loading…" : `${employees.length} staff`}
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

          <div className="r-grid">
            {/* Header row */}
            <div className="r-head">Person</div>
            {DAYS.map((day, idx) => (
              <div key={day} className="r-head">
                <div className="r-day-label">{day}</div>
                <div className="r-day-date">{formatShort(weekDates[idx])}</div>
              </div>
            ))}

            {/* Rows = employees */}
            {employees.map((emp) => (
              <React.Fragment key={emp.id}>
                <div className="r-row-label">
                  <p className="r-row-name">{emp.full_name}</p>
                  <div className="r-row-sub">Drop roles into cells</div>
                </div>

                {DAYS.map((_, dayIndex) => {
                  const shifts = (() => {
                    const empDays = assignments[emp.id] || {};
                    const arr = empDays[dayIndex] || [];
                    return [...arr].sort(
                      (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
                    );
                  })();

                  const isDropping =
                    dragOverCell &&
                    dragOverCell.employeeId === emp.id &&
                    dragOverCell.dayIndex === dayIndex;

                  return (
                    <div
                      key={`${emp.id}-${dayIndex}`}
                      className={"r-cell" + (isDropping ? " r-cell-dropping" : "")}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverCell({ employeeId: emp.id, dayIndex });
                      }}
                      onDragLeave={() => {
                        setTimeout(() => {
                          setDragOverCell((cur) => {
                            if (
                              cur &&
                              cur.employeeId === emp.id &&
                              cur.dayIndex === dayIndex
                            ) {
                              return null;
                            }
                            return cur;
                          });
                        }, 30);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverCell(null);

                        const raw = e.dataTransfer.getData("application/x-roster-role");
                        if (!raw) return;

                        try {
                          const parsed = JSON.parse(raw);
                          const roleKey = parsed?.roleKey;
                          if (!roleKey) return;
                          openRoleModalForDrop(emp.id, dayIndex, roleKey);
                        } catch {
                          // ignore
                        }
                      }}
                      title="Drop a role here"
                    >
                      {shifts.length === 0 ? (
                        <div className="r-cell-empty">Drop role</div>
                      ) : (
                        <div className="r-shifts">
                          {shifts.map((s) => {
                            const role = roles.find((r) => r.key === s.roleKey);
                            const style = role?.style || {
                              bg: "#0F172A",
                              fg: "#FFFFFF",
                              bd: "#111827",
                            };

                            return (
                              <div
                                key={s.id}
                                className="r-shift"
                                style={{
                                  ["--bg"]: style.bg,
                                  ["--fg"]: style.fg,
                                  ["--bd"]: style.bd,
                                }}
                                title={`${role?.name || s.roleKey} • ${s.start}–${s.end}`}
                              >
                                <div className="r-shift-left">
                                  <p className="r-shift-role">
                                    {role?.name || s.roleKey}
                                  </p>
                                  <div className="r-shift-time">
                                    {s.start} – {s.end}
                                  </div>
                                </div>
                                <button
                                  className="r-icon-btn"
                                  type="button"
                                  onClick={() => removeShift(emp.id, dayIndex, s.id)}
                                  aria-label="Remove shift"
                                  title="Remove"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}

            {!loadingEmployees && employees.length === 0 && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: 16,
                  color: "#64748b",
                  fontWeight: 800,
                }}
              >
                No employees found. Add them in HRP → Employees.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <div
          className="r-modal-overlay"
          onMouseDown={(e) => {
            if (e.target?.classList?.contains("r-modal-overlay")) closeModal();
          }}
        >
          <div className="r-modal" role="dialog" aria-modal="true">
            <div className="r-modal-hdr">
              <h3 className="r-modal-title">Add shift</h3>
              <button
                className="r-icon-btn"
                type="button"
                onClick={closeModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="r-modal-body">
              <div className="r-note">
                <strong>{getEmployeeName(modal.employeeId)}</strong> ·{" "}
                <strong>{DAYS[modal.dayIndex]}</strong> ·{" "}
                <strong>{formatShort(weekDates[modal.dayIndex])}</strong>
              </div>

              <div className="r-field">
                <label className="r-label">Role</label>
                <select
                  className="r-select"
                  value={modal.roleKey}
                  onChange={(e) =>
                    setModal((m) => ({ ...m, roleKey: e.target.value, error: "" }))
                  }
                >
                  {roles.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="r-row">
                <div className="r-field">
                  <label className="r-label">Start</label>
                  <input
                    className="r-input"
                    type="time"
                    value={modal.start}
                    onChange={(e) =>
                      setModal((m) => ({ ...m, start: e.target.value, error: "" }))
                    }
                  />
                </div>
                <div className="r-field">
                  <label className="r-label">Finish</label>
                  <input
                    className="r-input"
                    type="time"
                    value={modal.end}
                    onChange={(e) =>
                      setModal((m) => ({ ...m, end: e.target.value, error: "" }))
                    }
                  />
                </div>
              </div>

              {modal.error && (
                <div className="r-note" style={{ color: "#b91c1c", fontWeight: 900 }}>
                  {modal.error}
                </div>
              )}

              <div className="r-note">
                Note: shifts for the same person/day can’t overlap. Add another block
                for split shifts.
              </div>
            </div>

            <div className="r-modal-ftr">
              <button type="button" className="r-btn" onClick={closeModal}>
                Cancel
              </button>
              <button
                type="button"
                className="r-btn r-btn-primary"
                onClick={confirmAddShift}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roster;
