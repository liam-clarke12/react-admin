// src/scenes/HRP/Roster/Roster.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";

const API_BASE =
  "https://z08auzr2ce.execute-api.eu-west-1.amazonaws.com/dev/api";

/* ---------------- Styles (keep yours as-is) ---------------- */
const Styles = () => (
  <style>{`
    :root{
      --dae-purple:#7C3AED;
      --dae-purple-dark:#5B21B6;
      --dae-purple-ring: rgba(124,58,237,0.22);
    }
    .r-page{ min-height:100vh; padding:16px; background:#f6f7fb; color:#0f172a; }
    .r-layout{ display:grid; gap:14px; grid-template-columns: 260px minmax(0,1fr); align-items:start; max-width: 1500px; margin:0 auto; }
    @media (max-width: 1024px){ .r-layout{ grid-template-columns: minmax(0,1fr); } }
    .r-panel{ background:#fff; border:1px solid #e5e7eb; border-radius:14px; box-shadow:0 10px 26px rgba(15,23,42,0.08); overflow:hidden; }
    .r-panel-body{ padding:12px; }
    .r-title{ margin:0 0 8px; font-size:13px; font-weight:900; letter-spacing:0.06em; text-transform:uppercase; color:#111827; }
    .r-sub{ margin:0 0 12px; font-size:12px; color:#64748b; line-height:1.4; }
    .r-toolbar{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 12px; border-bottom:1px solid #e5e7eb; background:#fff; flex-wrap:wrap; }
    .r-toolbar-left,.r-toolbar-right{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .r-btn{ display:inline-flex; align-items:center; gap:6px; padding:8px 10px; font-size:13px; font-weight:900; border-radius:10px; border:1px solid #e5e7eb; background:#fff; color:#0f172a; cursor:pointer; transition:transform .08s ease-out, box-shadow .12s ease-out, background .12s ease-out; }
    .r-btn:hover{ background:#f8fafc; box-shadow:0 10px 18px rgba(15,23,42,0.08); transform:translateY(-1px); }
    .r-btn-primary{ background:var(--dae-purple); border-color:var(--dae-purple); color:#fff; box-shadow:0 12px 24px rgba(124,58,237,0.22); }
    .r-btn-primary:hover{ background:var(--dae-purple-dark); border-color:var(--dae-purple-dark); }
    .r-btn-primary:focus{ outline:none; box-shadow:0 0 0 4px var(--dae-purple-ring), 0 12px 24px rgba(124,58,237,0.22); }
    .r-chip{ font-size:12px; font-weight:900; padding:6px 10px; border-radius:999px; background:#f1f5f9; border:1px solid #e5e7eb; color:#334155; }
    .r-week-label{ font-size:13px; font-weight:900; color:#0f172a; }
    .r-block{ border:1px solid #e5e7eb; border-radius:12px; padding:10px; background:#fff; }
    .r-stack{ display:flex; flex-direction:column; gap:10px; }
    .r-emp-list{ display:flex; flex-direction:column; gap:8px; max-height: 45vh; overflow:auto; padding-right:4px; }
    .r-emp-chip{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 10px; border-radius:12px; border:1px solid #e5e7eb; background:#ffffff; user-select:none; }
    .r-emp-name{ font-size:13px; font-weight:800; color:#0f172a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .r-emp-meta{ font-size:11px; font-weight:900; padding:4px 8px; border-radius:999px; border:1px solid #e5e7eb; background:#f8fafc; color:#334155; flex:0 0 auto; }
    .r-role-list{ display:flex; flex-direction:column; gap:8px; }
    .r-role-chip{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 10px; border-radius:12px; border:1px solid #e5e7eb; background:#fff; cursor:grab; user-select:none; box-shadow:0 8px 16px rgba(15,23,42,0.06); transition:transform .08s ease-out, box-shadow .12s ease-out; }
    .r-role-chip:hover{ box-shadow:0 12px 22px rgba(15,23,42,0.10); transform:translateY(-1px); }
    .r-role-chip:active{ cursor:grabbing; transform:scale(0.99); }
    .r-role-left{ display:flex; align-items:center; gap:10px; min-width:0; }
    .r-swatch{ width:12px; height:12px; border-radius:999px; background: var(--swatch); box-shadow: 0 0 0 3px rgba(255,255,255,0.8), 0 10px 18px rgba(15,23,42,0.20); flex:0 0 auto; }
    .r-role-name{ font-size:13px; font-weight:900; color:#0f172a; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .r-role-hint{ font-size:11px; font-weight:900; padding:4px 8px; border-radius:999px; border:1px solid #e5e7eb; background:#f8fafc; color:#334155; flex:0 0 auto; }
    .r-calendar{ background:#fff; border:1px solid #e5e7eb; border-radius:14px; box-shadow:0 10px 26px rgba(15,23,42,0.08); overflow:hidden; }
    .r-grid{ display:grid; grid-template-columns: 220px repeat(7, minmax(0, 1fr)); width:100%; font-size:12px; }
    .r-head{ padding:10px; background:#f8fafc; border-bottom:1px solid #e5e7eb; border-right:1px solid #e5e7eb; font-weight:900; color:#0f172a; text-align:center; }
    .r-head:first-of-type{ text-align:left; color:#475569; }
    .r-day-label{ font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#64748b; }
    .r-day-date{ font-size:13px; font-weight:900; color:#0f172a; margin-top:2px; }
    .r-row-label{ padding:10px; border-right:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; background:#fff; }
    .r-row-name{ font-size:13px; font-weight:900; color:#0f172a; margin:0; line-height:1.2; }
    .r-row-sub{ margin-top:4px; font-size:11px; color:#94a3b8; font-weight:800; }
    .r-cell{ min-height:86px; padding:8px; border-right:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; background:#fff; transition:box-shadow .12s ease-out, background .12s ease-out; position:relative; }
    .r-cell:hover{ background:#fbfdff; }
    .r-cell-dropping{ background: var(--drop-bg, #f8fafc); box-shadow: inset 0 0 0 2px var(--drop-bd, #111827); }
    .r-cell-empty{ font-size:11px; color:#cbd5e1; font-style:italic; text-align:center; margin-top:18px; }
    .r-shifts{ display:flex; flex-direction:column; gap:8px; }
    .r-shift{
      border-radius:12px; padding:10px 12px;
      display:flex; justify-content:space-between; align-items:flex-start; gap:10px;
      position:relative; overflow:hidden;
      background: var(--bd);
      color:#fff;
      border:1px solid rgba(15,23,42,0.10);
      box-shadow:0 10px 18px rgba(15,23,42,0.10);
    }
    .r-shift::before, .r-shift::after{ content:none !important; }
    .r-shift-left{ min-width:0; }
    .r-shift-role{ font-weight:950; font-size:12px; line-height:1.2; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width: 160px; }
    .r-shift-time{ margin-top:5px; font-size:11px; font-weight:800; white-space:nowrap; opacity:0.95; }
    .r-icon-btn{ border:none; background:rgba(255,255,255,0.22); cursor:pointer; font-weight:1000; color:inherit; padding:6px 8px; line-height:1; border-radius:999px; opacity:0.95; flex:0 0 auto; }
    .r-icon-btn:hover{ opacity:1; transform: translateY(-1px); }
    .r-modal-overlay{ position:fixed; inset:0; background:rgba(15,23,42,0.55); display:flex; align-items:center; justify-content:center; padding:18px; z-index:9999; }
    .r-modal{ width:min(520px, 100%); background:#fff; border-radius:16px; border:1px solid #e5e7eb; box-shadow:0 22px 70px rgba(0,0,0,0.22); overflow:hidden; }
    .r-modal-hdr{ padding:12px 14px; border-bottom:1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .r-modal-title{ margin:0; font-size:13px; font-weight:1000; letter-spacing:0.05em; text-transform:uppercase; color:#111827; }
    .r-modal-body{ padding:14px; display:flex; flex-direction:column; gap:12px; }
    .r-field{ display:flex; flex-direction:column; gap:6px; }
    .r-label{ font-size:12px; font-weight:900; color:#334155; }
    .r-input, .r-select{ border:1px solid #e5e7eb; border-radius:12px; padding:10px 10px; font-size:13px; font-weight:800; color:#0f172a; background:#fff; outline:none; }
    .r-input:focus, .r-select:focus{ box-shadow:0 0 0 4px var(--dae-purple-ring); border-color: rgba(124,58,237,0.45); }
    .r-row{ display:grid; grid-template-columns: 1fr 1fr; gap:10px; }
    .r-modal-ftr{ padding:12px 14px; border-top:1px solid #e5e7eb; display:flex; justify-content:flex-end; gap:10px; background:#fff; }
    .r-note{ font-size:12px; color:#64748b; line-height:1.35; }
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
  const day = (d.getDay() + 6) % 7;
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
  return timeToMinutes(aStart) < timeToMinutes(bEnd) && timeToMinutes(bStart) < timeToMinutes(aEnd);
}

/* ---------------- Roles ---------------- */
const DEFAULT_ROLES = [
  { key: "production", name: "Production", style: { bd: "#6366F1" } },
  { key: "packing", name: "Packing", style: { bd: "#2DD4BF" } },
  { key: "dispatch", name: "Dispatch", style: { bd: "#FB923C" } },
  { key: "admin", name: "Admin", style: { bd: "#F472B6" } },
];

/* ---------------- Main ---------------- */

const Roster = () => {
  const { cognitoId } = useAuth();

  const roles = DEFAULT_ROLES;

  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // assignments shape:
  // assignments[employeeId][dayIndex] = [{ id: assignment_id, roleKey, start, end, date }]
  const [assignments, setAssignments] = useState({});

  const [weekStart, setWeekStart] = useState(() => startOfISOWeek(new Date()));
  const [loadingWeek, setLoadingWeek] = useState(false);

  const [dragOverCell, setDragOverCell] = useState(null);

  const [modal, setModal] = useState({
    open: false,
    employeeId: null,
    dayIndex: null,
    roleKey: roles[0]?.key || "",
    start: "08:00",
    end: "16:00",
    error: "",
  });

  const weekDates = useMemo(() => DAYS.map((_, idx) => addDays(weekStart, idx)), [weekStart]);

  const weekStartYYYYMMDD = useMemo(() => weekStart.toISOString().slice(0, 10), [weekStart]);

  const getEmployeeName = (id) => {
    const emp = employees.find((e) => String(e.id) === String(id));
    return emp?.full_name || `#${id}`;
  };

  const getDayShifts = (employeeId, dayIndex) => {
    const empDays = assignments?.[employeeId] || {};
    const shifts = empDays?.[dayIndex] || [];
    return [...shifts].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  };

  const rebuildAssignmentsFromWeekRows = useCallback(
    (rows) => {
      // backend returns rows array (joined)
      const next = {};
      (rows || []).forEach((r) => {
        const employeeId = r.employee_id;
        const shiftDate = String(r.shift_date).slice(0, 10);

        const dayIndex = weekDates.findIndex(
          (d) => d.toISOString().slice(0, 10) === shiftDate
        );
        if (dayIndex < 0) return;

        const roleKey =
          (r.template_name && roles.find((x) => x.name === r.template_name)?.key) ||
          r.role_key ||
          "production";

        const item = {
          id: r.assignment_id, // IMPORTANT: assignment id (for delete/update)
          roleKey,
          start: r.start_time,
          end: r.end_time,
          date: shiftDate,
          rosterShiftId: r.roster_shift_id,
        };

        if (!next[employeeId]) next[employeeId] = {};
        if (!next[employeeId][dayIndex]) next[employeeId][dayIndex] = [];
        next[employeeId][dayIndex].push(item);
      });

      // sort each day
      Object.values(next).forEach((daysObj) => {
        Object.values(daysObj).forEach((arr) => {
          arr.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
        });
      });

      setAssignments(next);
    },
    [roles, weekDates]
  );

  // Load employees
  useEffect(() => {
    if (!cognitoId) return;

    (async () => {
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
    })();
  }, [cognitoId]);

  // Load week roster
  useEffect(() => {
    if (!cognitoId) return;

    (async () => {
      try {
        setLoadingWeek(true);
        const res = await fetch(
          `${API_BASE}/api/week?cognito_id=${encodeURIComponent(
            cognitoId
          )}&week_start=${encodeURIComponent(weekStartYYYYMMDD)}`
        );
        const json = await res.json();
        rebuildAssignmentsFromWeekRows(json?.rows || []);
      } catch (err) {
        console.error("[Roster] Failed to load week:", err);
        setAssignments({});
      } finally {
        setLoadingWeek(false);
      }
    })();
  }, [cognitoId, weekStartYYYYMMDD, rebuildAssignmentsFromWeekRows]);

  const goPrevWeek = () => setWeekStart((prev) => addDays(prev, -7));
  const goNextWeek = () => setWeekStart((prev) => addDays(prev, 7));

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

  const confirmAddShift = async () => {
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

    const date = weekDates[dayIndex].toISOString().slice(0, 10);
    const role = roles.find((r) => r.key === roleKey);

    try {
      const res = await fetch(`${API_BASE}/api/shift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cognito_id: cognitoId,
          date,
          role_key: roleKey,
          role_name: role?.name || roleKey,
          area: "default",
          start,
          end,
          employee_id: Number(employeeId),
          status: "assigned",
          comment: null,
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Create shift failed");
      }
      const created = await res.json();

      // update UI immediately
      setAssignments((prev) => {
        const next = { ...prev };
        const empDays = next[employeeId] ? { ...next[employeeId] } : {};
        const dayArr = empDays[dayIndex] ? [...empDays[dayIndex]] : [];
        dayArr.push({
          id: created.assignment_id,
          roleKey,
          start,
          end,
          date,
          rosterShiftId: created.roster_shift_id,
        });
        empDays[dayIndex] = dayArr.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
        next[employeeId] = empDays;
        return next;
      });

      closeModal();
    } catch (e) {
      console.error("[Roster] create shift error:", e);
      setModal((m) => ({ ...m, error: e?.message || "Could not create shift." }));
    }
  };

  const removeShift = async (employeeId, dayIndex, assignmentId) => {
    if (!assignmentId) return;

    // optimistic UI remove
    const prevSnapshot = assignments;

    setAssignments((prev) => {
      const next = { ...prev };
      const empDays = next[employeeId] ? { ...next[employeeId] } : {};
      const dayArr = empDays[dayIndex] ? [...empDays[dayIndex]] : [];
      empDays[dayIndex] = dayArr.filter((s) => String(s.id) !== String(assignmentId));
      next[employeeId] = empDays;
      return next;
    });

    try {
      const res = await fetch(
        `${API_BASE}/api/assignment/${encodeURIComponent(
          assignmentId
        )}?cognito_id=${encodeURIComponent(cognitoId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Delete failed");
      }
    } catch (e) {
      console.error("[Roster] delete error:", e);
      // rollback
      setAssignments(prevSnapshot);
      alert(e?.message || "Could not delete shift.");
    }
  };

  return (
    <div className="r-page">
      <Styles />

      <div className="r-layout">
        {/* LEFT */}
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
                        <span className="r-swatch" style={{ ["--swatch"]: role.style.bd }} />
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
                  Rows are people. Columns are days. Blocks use the same colour as the role dot.
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

        {/* RIGHT */}
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
                {loadingEmployees || loadingWeek ? "Loading…" : `${employees.length} staff`}
              </span>
            </div>

            <div className="r-toolbar-right">
              <span className="r-week-label">
                Week of {formatShort(weekStart)} ({formatRangeLabel(weekStart)})
              </span>
              <span className="r-chip">{loadingWeek ? "Syncing…" : "Synced"}</span>
            </div>
          </div>

          <div className="r-grid">
            <div className="r-head">Person</div>
            {DAYS.map((day, idx) => (
              <div key={day} className="r-head">
                <div className="r-day-label">{day}</div>
                <div className="r-day-date">{formatShort(weekDates[idx])}</div>
              </div>
            ))}

            {employees.map((emp) => (
              <React.Fragment key={emp.id}>
                <div className="r-row-label">
                  <p className="r-row-name">{emp.full_name}</p>
                  <div className="r-row-sub">Drop roles into cells</div>
                </div>

                {DAYS.map((_, dayIndex) => {
                  const shifts = getDayShifts(emp.id, dayIndex);

                  const isDropping =
                    dragOverCell &&
                    dragOverCell.employeeId === emp.id &&
                    dragOverCell.dayIndex === dayIndex;

                  const cellDropStyle = isDropping
                    ? {
                        ["--drop-bg"]: dragOverCell?.roleBd
                          ? `${dragOverCell.roleBd}22`
                          : "#f8fafc",
                        ["--drop-bd"]: dragOverCell?.roleBd || "#111827",
                      }
                    : undefined;

                  return (
                    <div
                      key={`${emp.id}-${dayIndex}`}
                      className={"r-cell" + (isDropping ? " r-cell-dropping" : "")}
                      style={cellDropStyle}
                      onDragOver={(e) => {
                        e.preventDefault();
                        const raw = e.dataTransfer.getData("application/x-roster-role");
                        let roleBd = null;
                        if (raw) {
                          try {
                            const parsed = JSON.parse(raw);
                            const rk = parsed?.roleKey;
                            roleBd = roles.find((r) => r.key === rk)?.style?.bd || null;
                          } catch {}
                        }
                        setDragOverCell({ employeeId: emp.id, dayIndex, roleBd });
                      }}
                      onDragLeave={() => {
                        setTimeout(() => {
                          setDragOverCell((cur) => {
                            if (cur && cur.employeeId === emp.id && cur.dayIndex === dayIndex)
                              return null;
                            return cur;
                          });
                        }, 30);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const raw = e.dataTransfer.getData("application/x-roster-role");
                        setDragOverCell(null);
                        if (!raw) return;

                        try {
                          const parsed = JSON.parse(raw);
                          const roleKey = parsed?.roleKey;
                          if (!roleKey) return;
                          openRoleModalForDrop(emp.id, dayIndex, roleKey);
                        } catch {}
                      }}
                      title="Drop a role here"
                    >
                      {shifts.length === 0 ? (
                        <div className="r-cell-empty">Drop role</div>
                      ) : (
                        <div className="r-shifts">
                          {shifts.map((s) => {
                            const role = roles.find((r) => r.key === s.roleKey);
                            const bd = role?.style?.bd || "#111827";

                            return (
                              <div
                                key={s.id}
                                className="r-shift"
                                style={{ ["--bd"]: bd }}
                                title={`${role?.name || s.roleKey} • ${s.start}–${s.end}`}
                              >
                                <div className="r-shift-left">
                                  <p className="r-shift-role">{role?.name || s.roleKey}</p>
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
              <button className="r-icon-btn" type="button" onClick={closeModal} aria-label="Close">
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
                  onChange={(e) => setModal((m) => ({ ...m, roleKey: e.target.value, error: "" }))}
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
                    onChange={(e) => setModal((m) => ({ ...m, start: e.target.value, error: "" }))}
                  />
                </div>
                <div className="r-field">
                  <label className="r-label">Finish</label>
                  <input
                    className="r-input"
                    type="time"
                    value={modal.end}
                    onChange={(e) => setModal((m) => ({ ...m, end: e.target.value, error: "" }))}
                  />
                </div>
              </div>

              {modal.error && (
                <div className="r-note" style={{ color: "#b91c1c", fontWeight: 900 }}>
                  {modal.error}
                </div>
              )}
            </div>

            <div className="r-modal-ftr">
              <button type="button" className="r-btn" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="r-btn r-btn-primary" onClick={confirmAddShift}>
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
