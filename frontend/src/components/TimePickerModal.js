import React, { useState, useRef, useEffect, useCallback } from 'react';

const STYLE_ID = 'tpm-clock-styles';
const CSS = `
.tpm-overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.4);
  display:flex;align-items:center;justify-content:center;}
.tpm-sheet{background:#fff;border-radius:28px;width:92%;max-width:340px;
  overflow:hidden;animation:tpm-pop 0.2s cubic-bezier(.4,0,.2,1);
  box-shadow:0 12px 40px rgba(0,0,0,0.2);}
@keyframes tpm-pop{from{transform:scale(0.9);opacity:0}to{transform:scale(1);opacity:1}}

.tpm-top{padding:16px 20px 8px;color:#555;font-size:13px;font-weight:500;}

.tpm-display{display:flex;align-items:center;padding:4px 20px 12px;gap:4px;}
.tpm-seg{font-size:44px;font-weight:700;padding:6px 14px;border-radius:12px;
  cursor:pointer;transition:background 0.15s;line-height:1;min-width:72px;text-align:center;}
.tpm-seg.active{background:#e8f0fe;color:#1a73e8;}
.tpm-seg.inactive{background:#f1f3f4;color:#3c4043;}
.tpm-colon{font-size:44px;font-weight:700;color:#3c4043;line-height:1;padding-bottom:4px;}
.tpm-ampm{display:flex;flex-direction:column;gap:6px;margin-left:8px;}
.tpm-ampm-btn{padding:6px 14px;border-radius:10px;border:1.5px solid #dadce0;
  font-size:14px;font-weight:600;cursor:pointer;background:#fff;color:#3c4043;transition:all 0.15s;}
.tpm-ampm-btn.active{background:#e8f0fe;color:#1a73e8;border-color:#1a73e8;}
.tpm-ampm-btn.disabled{opacity:0.35;cursor:not-allowed;pointer-events:none;}

.tpm-past-warn{font-size:11px;color:#d93025;padding:0 20px 6px;font-weight:500;}

.tpm-clock-wrap{position:relative;padding:8px 20px 16px;display:flex;justify-content:center;}
.tpm-clock-svg{width:100%;max-width:280px;cursor:pointer;}

.tpm-footer{display:flex;justify-content:flex-end;align-items:center;
  padding:8px 16px 16px;gap:8px;border-top:1px solid #f0f0f0;}
.tpm-footer-cancel{padding:10px 20px;border:none;background:none;
  color:#1a73e8;font-size:15px;font-weight:600;cursor:pointer;border-radius:8px;}
.tpm-footer-cancel:hover{background:#f1f3f4;}
.tpm-footer-ok{padding:10px 24px;border:none;background:#1a73e8;
  color:#fff;font-size:15px;font-weight:700;cursor:pointer;border-radius:10px;}
.tpm-footer-ok:hover{background:#1557b0;}
.tpm-footer-ok.disabled{background:#b0c4f5;cursor:not-allowed;}
`;

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID; s.textContent = CSS;
  document.head.appendChild(s);
}

function parseInitial(value) {
  if (!value) return { hour: 7, minute: 0, ampm: 'AM' };
  if (value.includes(' ')) {
    const [time, ap] = value.split(' ');
    const [h, m] = time.split(':').map(Number);
    return { hour: h, minute: m, ampm: ap };
  }
  const [h, m] = value.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return { hour: h12, minute: m, ampm: ap };
}

// ── Convert 12h → total minutes from midnight ─────────────────────────────────
function toTotalMins(hour, minute, ap) {
  let h = hour % 12;
  if (ap === 'PM') h += 12;
  return h * 60 + minute;
}

// ── Current time total minutes ────────────────────────────────────────────────
function nowTotalMins() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// ── Clock Face SVG ─────────────────────────────────────────────────────────────
function ClockFace({ mode, hour, minute, onChange }) {
  const svgRef = useRef(null);
  const isDragging = useRef(false);

  const numbers = mode === 'hour'
    ? [12,1,2,3,4,5,6,7,8,9,10,11]
    : [0,5,10,15,20,25,30,35,40,45,50,55];

  const CX = 140; const CY = 140;
  const numR = 100;

  const selectedIndex = mode === 'hour'
    ? numbers.indexOf(hour === 0 ? 12 : hour)
    : numbers.indexOf(Math.round(minute / 5) * 5);

  const getAngle = (val) => {
    const idx = numbers.indexOf(val);
    return idx >= 0 ? (idx / 12) * 2 * Math.PI - Math.PI / 2 : -Math.PI / 2;
  };

  const handAngle = mode === 'hour'
    ? getAngle(hour === 0 ? 12 : hour)
    : (minute / 60) * 2 * Math.PI - Math.PI / 2;

  const handX = CX + Math.cos(handAngle) * numR;
  const handY = CY + Math.sin(handAngle) * numR;

  const getValFromPos = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const scale = 280 / rect.width;
    const x = (clientX - rect.left) * scale - CX;
    const y = (clientY - rect.top) * scale - CY;
    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;
    const idx = Math.round(angle / (2 * Math.PI / 12)) % 12;
    return numbers[idx];
  }, [mode]);

  const handleInteract = useCallback((clientX, clientY) => {
    const val = getValFromPos(clientX, clientY);
    if (val !== null) onChange(val);
  }, [getValFromPos, onChange]);

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return;
      const pos = e.touches ? e.touches[0] : e;
      handleInteract(pos.clientX, pos.clientY);
    };
    const onUp = () => { isDragging.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
  }, [handleInteract]);

  return (
    <svg
      ref={svgRef}
      className="tpm-clock-svg"
      viewBox="0 0 280 280"
      onMouseDown={(e) => { isDragging.current = true; handleInteract(e.clientX, e.clientY); }}
      onTouchStart={(e) => { isDragging.current = true; handleInteract(e.touches[0].clientX, e.touches[0].clientY); }}
    >
      <circle cx={CX} cy={CY} r="120" fill="#f1f3f4" />
      <line x1={CX} y1={CY} x2={handX} y2={handY}
        stroke="#1a73e8" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={CX} cy={CY} r="5" fill="#1a73e8" />
      <circle cx={handX} cy={handY} r="20" fill="#1a73e8" opacity="0.15" />
      <circle cx={handX} cy={handY} r="18" fill="#1a73e8" />
      {numbers.map((num, i) => {
        const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
        const x = CX + Math.cos(angle) * numR;
        const y = CY + Math.sin(angle) * numR;
        const isSel = selectedIndex === i;
        return (
          <text key={num} x={x} y={y}
            textAnchor="middle" dominantBaseline="central"
            fontSize={isSel ? "17" : "15"} fontWeight={isSel ? "700" : "500"}
            fill={isSel ? "#fff" : "#3c4043"}
            style={{ userSelect: 'none', pointerEvents: 'none' }}>
            {mode === 'minute' ? String(num).padStart(2, '0') : num}
          </text>
        );
      })}
    </svg>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function TimePickerModal({ value, onConfirm, onCancel, isToday = false }) {
  injectStyles();
  const init = parseInitial(value);
  const [hour, setHour] = useState(init.hour);
  const [minute, setMinute] = useState(init.minute);
  const [ampm, setAmpm] = useState(init.ampm);
  const [mode, setMode] = useState('hour');

  // ── Live past-time checks (only when isToday) ────────────────────────────
  const nowMins = nowTotalMins();

  const isAmPast  = isToday && toTotalMins(hour, minute, 'AM') <= nowMins;
  const isPmPast  = isToday && toTotalMins(hour, minute, 'PM') <= nowMins;
  const isCurrentPast = isToday && toTotalMins(hour, minute, ampm) <= nowMins;

  // Auto-switch ampm if currently selected period is past
  useEffect(() => {
    if (!isToday) return;
    if (toTotalMins(hour, minute, ampm) <= nowMins) {
      // Try switching to the other period
      const other = ampm === 'AM' ? 'PM' : 'AM';
      if (toTotalMins(hour, minute, other) > nowMins) {
        setAmpm(other);
      }
    }
  }, [hour, minute]);

  const handleHourChange = (val) => setHour(val === 0 ? 12 : val);
  const handleMinuteChange = (val) => setMinute(val);

  const handleAmpmClick = (ap) => {
    if (isToday && toTotalMins(hour, minute, ap) <= nowMins) return; // block past
    setAmpm(ap);
  };

  const handleDone = () => {
    if (isCurrentPast) return; // block OK if past
    const h = String(hour).padStart(2, '0');
    const m = String(minute).padStart(2, '0');
    onConfirm(`${h}:${m} ${ampm}`);
  };

  return (
    <div className="tpm-overlay" onClick={onCancel}>
      <div className="tpm-sheet" onClick={(e) => e.stopPropagation()}>

        <div className="tpm-top">Select time</div>

        <div className="tpm-display">
          <div className={`tpm-seg ${mode === 'hour' ? 'active' : 'inactive'}`}
            onClick={() => setMode('hour')}>
            {String(hour).padStart(2, '0')}
          </div>
          <div className="tpm-colon">:</div>
          <div className={`tpm-seg ${mode === 'minute' ? 'active' : 'inactive'}`}
            onClick={() => setMode('minute')}>
            {String(minute).padStart(2, '0')}
          </div>
          <div className="tpm-ampm">
            <button
              className={`tpm-ampm-btn ${ampm === 'AM' ? 'active' : ''} ${isToday && isAmPast ? 'disabled' : ''}`}
              onClick={() => handleAmpmClick('AM')}
              title={isToday && isAmPast ? 'This time has passed' : ''}
            >AM</button>
            <button
              className={`tpm-ampm-btn ${ampm === 'PM' ? 'active' : ''} ${isToday && isPmPast ? 'disabled' : ''}`}
              onClick={() => handleAmpmClick('PM')}
              title={isToday && isPmPast ? 'This time has passed' : ''}
            >PM</button>
          </div>
        </div>

        {/* Past time warning */}
        {isToday && isCurrentPast && (
          <div className="tpm-past-warn">
            This time has already passed — please select a future time
          </div>
        )}

        <div className="tpm-clock-wrap">
          <ClockFace
            mode={mode}
            hour={hour}
            minute={minute}
            onChange={mode === 'hour'
              ? (v) => { handleHourChange(v); setTimeout(() => setMode('minute'), 300); }
              : handleMinuteChange
            }
          />
        </div>

        <div className="tpm-footer">
          <button className="tpm-footer-cancel" onClick={onCancel}>Cancel</button>
          <button
            className={`tpm-footer-ok ${isToday && isCurrentPast ? 'disabled' : ''}`}
            onClick={handleDone}
            disabled={isToday && isCurrentPast}
          >OK</button>
        </div>

      </div>
    </div>
  );
}