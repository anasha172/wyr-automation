/* ============================================================
   WYR — Shared UI primitives  (React, Babel)
   ============================================================ */
const { useState, useEffect, useRef, createContext, useContext, useCallback } = React;

/* ---------- Icons (lucide-style, 24x24 stroke) ---------- */
const ICON = {
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  plus: 'M12 5v14M5 12h14',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  chart: 'M3 3v18h18M7 16v-5M12 16V8M17 16v-8',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  chevR: 'M9 18l6-6-6-6',
  chevD: 'M6 9l6 6 6-6',
  check: 'M20 6L9 17l-5-5',
  checkCircle: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
  x: 'M18 6L6 18M6 6l12 12',
  xCircle: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM15 9l-6 6M9 9l6 6',
  sparkle: 'M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
  wand: 'M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M15 9h.01M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13',
  external: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  trend: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
  image: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
  pencil: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  copy: 'M9 9h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  thumbsUp: 'M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3',
  thumbsDown: 'M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17',
  lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  calendar: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18',
  instagram: 'M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5zM16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01',
};

function Icon({ name, size = 18, color, fill = 'none', strokeWidth = 1.75, style }) {
  const d = ICON[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
      stroke={color || 'currentColor'} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      {d && d.split(/(?=M)/).map((seg, i) => <path key={i} d={seg} />)}
    </svg>
  );
}

/* ---------- Small bits ---------- */
function Eyebrow({ num, children }) {
  return <span className="eyebrow">{num && <span className="num">{num}</span>}{num && '  '}{children}</span>;
}
function Rule({ ink }) { return <div className={ink ? 'rule-ink' : 'rule'} />; }

function Avatar({ name, role, size = 34 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return <div className={'avatar role-' + (role || 'publisher')} style={{ width: size, height: size, fontSize: size * 0.36 }}>{initials}</div>;
}

function Btn({ kind = 'ink', size, children, icon, iconRight, onClick, disabled, type, style }) {
  const cls = ['btn', 'btn-' + kind, size === 'lg' && 'btn-lg', size === 'sm' && 'btn-sm'].filter(Boolean).join(' ');
  return (
    <button className={cls} onClick={onClick} disabled={disabled} type={type || 'button'} style={style}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 14 : 16} />}
    </button>
  );
}

/* ---------- Stage pill ---------- */
function StagePill({ stage }) {
  const s = WYR.STAGE[stage];
  if (!s) return null;
  const kindCls = s.kind === 'pending' ? 'is-pending' : s.kind === 'posted' ? 'is-posted' : 'is-progress';
  return (
    <span className={'pill ' + kindCls}>
      <span className="pdot" />{s.label}
    </span>
  );
}

/* ---------- Pipeline ---------- */
function Pipeline({ stage }) {
  const cur = (WYR.STAGE[stage] || { step: 0 }).step;
  const steps = WYR.PIPE_STEPS;
  return (
    <div className="pipeline">
      {steps.map((label, i) => {
        const done = i < cur, active = i === cur, last = i === steps.length - 1;
        return (
          <div className="pl-step" key={label}>
            <div className={'pl-node ' + (done ? 'done' : active ? 'active' : '')}>
              <div className="pl-mark">{done ? <Icon name="check" size={14} /> : String(i + 1).padStart(2, '0')}</div>
              <div className="pl-label">{label}</div>
            </div>
            {!last && <div className={'pl-bar ' + (done ? 'done' : '')} />}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- VS mark ---------- */
function VS({ size = 46 }) {
  return <div className="vs-circle" style={{ width: size, height: size, fontSize: size * 0.41 }}>vs</div>;
}

/* ---------- The duel: A vs B option block ---------- */
function DuelRow({ a, b, children }) {
  return (
    <div className="duel card" style={{ overflow: 'hidden' }}>
      <div className="duel-side duel-a">
        <span className="opt-tag a"><span>A</span> — Option A</span>
        <div className="opt-text">{a}</div>
      </div>
      <div className="duel-seam" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 1, overflow: 'visible' }}>
        <div style={{ position: 'relative', zIndex: 2 }}><VS size={42} /></div>
      </div>
      <div className="duel-side duel-b" style={{ textAlign: 'right' }}>
        <span className="opt-tag b" style={{ justifyContent: 'flex-end' }}>Option B — <span>B</span></span>
        <div className="opt-text">{b}</div>
      </div>
    </div>
  );
}

/* ---------- 9:16 story frame ---------- */
function StoryFrame({ idea, width = 150 }) {
  const a = idea.imageA, b = idea.imageB;
  return (
    <div className="story" style={{ width }}>
      <div className="story-hdr">Would You Rather</div>
      <div className="story-half a">
        {a ? <img src={a} alt="" /> : <div className="ph" style={{ position: 'absolute', inset: 0 }}>A</div>}
        <div className="tint" /><div className="veil" />
        <div className="story-opt" style={{ fontSize: width * 0.072 }}>{idea.option_a}</div>
      </div>
      <div className="story-half b">
        {b ? <img src={b} alt="" /> : <div className="ph" style={{ position: 'absolute', inset: 0 }}>B</div>}
        <div className="tint" /><div className="veil" />
        <div className="story-opt" style={{ fontSize: width * 0.072 }}>{idea.option_b}</div>
      </div>
      <div className="story-vs" style={{ fontSize: width * 0.075 }}>vs</div>
    </div>
  );
}

/* ---------- Toast system ---------- */
const ToastCtx = createContext(() => {});
function useToast() { return useContext(ToastCtx); }
function ToastHost({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = 'ok') => {
    const id = Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={'toast ' + t.type}>
            <span className="t-ico"><Icon name={t.type === 'err' ? 'xCircle' : 'checkCircle'} size={17} /></span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

Object.assign(window, {
  Icon, Eyebrow, Rule, Avatar, Btn, StagePill, Pipeline, VS, DuelRow, StoryFrame,
  ToastHost, useToast,
});
