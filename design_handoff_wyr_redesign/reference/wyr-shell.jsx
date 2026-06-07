/* ============================================================
   WYR — App shell: sidebar + topbar
   ============================================================ */

function Sidebar({ screen, role, campaign, nav, user }) {
  const isPub = role === 'publisher' || role === 'admin';
  const isMgr = role === 'manager' || role === 'admin';

  const Item = ({ id, ico, label, num, onClick, disabled, tag, active }) => (
    <div className={'nav-item' + (active ? ' active' : '') + (disabled ? ' disabled' : '')}
      onClick={disabled ? undefined : (onClick || (() => nav(id)))}>
      {num != null && <span className="ni-num">{num}</span>}
      {ico && <span className="ni-ico"><Icon name={ico} size={17} /></span>}
      <span>{label}</span>
      {tag && <span className="ni-tag">{tag}</span>}
    </div>
  );

  const flowSteps = [
    { id: 'ideas', label: 'Ideas' },
    { id: 'images', label: 'Images' },
    { id: 'stories', label: 'Stories' },
    { id: 'publish', label: 'Publish' },
  ];
  const flowScreens = ['ideas', 'images', 'stories', 'publish'];

  return (
    <aside className="sidebar">
      <div className="sb-brand" onClick={() => nav('dashboard')} style={{ cursor: 'pointer' }}>
        <div className="sb-wordmark"><span className="a">W</span><span className="b">Y</span>R</div>
        <div className="sb-sub">Would<br />You<br />Rather</div>
      </div>

      <nav className="sb-nav">
        <div className="sb-section">Workspace<span className="line" /></div>
        <Item id="dashboard" ico="dashboard" label="Dashboard" active={screen === 'dashboard'} />
        {isPub && <Item id="campaigns" ico="list" label="All Campaigns" active={false} onClick={() => nav('dashboard')} />}
        {isMgr && <Item id="manager" ico="chart" label="Manager Overview" active={screen === 'manager'} />}

        {isPub && (
          <>
            <div className="sb-section">Channels<span className="line" /></div>
            <div className={'nav-item' + (flowScreens.includes(screen) || screen === 'new' ? ' active' : '')}
              onClick={() => nav('new')}>
              <span className="ni-ico"><Icon name="instagram" size={17} /></span>
              <span>Instagram</span>
              <span className="ni-tag">Story</span>
            </div>
            <Item label="LinkedIn" ico="link" disabled tag="Soon" />
          </>
        )}

        {campaign && flowScreens.includes(screen) && (
          <>
            <div className="sb-section">{campaign.theme.length > 18 ? campaign.theme.slice(0, 18) + '…' : campaign.theme}<span className="line" /></div>
            {flowSteps.map((s, i) => (
              <Item key={s.id} id={s.id} num={String(i + 1).padStart(2, '0')} label={s.label}
                active={screen === s.id} onClick={() => nav(s.id, campaign.id)} />
            ))}
          </>
        )}

        {role === 'admin' && (
          <>
            <div className="sb-section">Admin<span className="line" /></div>
            <Item id="users" ico="users" label="User Management" active={screen === 'users'} />
            <Item id="settings" ico="settings" label="Settings" active={screen === 'settings'} />
          </>
        )}
        {role !== 'admin' && (
          <>
            <div className="sb-section">Account<span className="line" /></div>
            <Item id="settings" ico="settings" label="Settings" active={screen === 'settings'} />
          </>
        )}
      </nav>

      <div className="sb-foot">
        <div className="user-chip" onClick={() => nav('settings')}>
          <Avatar name={user.name} role={role} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{role}</div>
          </div>
          <span className="ni-ico" onClick={(e) => { e.stopPropagation(); nav('login'); }} title="Sign out"
            style={{ color: 'var(--ink-3)' }}><Icon name="logout" size={16} /></span>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ crumbs, role, switchRole }) {
  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep"><Icon name="chevR" size={13} /></span>}
            {c.onClick
              ? <span className="c-link" onClick={c.onClick}>{c.label}</span>
              : <span className={i === crumbs.length - 1 ? 'c-now' : ''}>{c.label}</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="tb-spacer" />
      {/* Role switcher — prototype convenience */}
      <div className="row gap-6" style={{ marginRight: 4 }}>
        <span className="mono" style={{ fontSize: 9.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>View as</span>
        {['publisher', 'manager', 'admin'].map(r => (
          <button key={r} className={'chip btn-sm' + (role === r ? ' on' : '')}
            style={{ textTransform: 'capitalize', padding: '5px 10px', fontSize: 12 }}
            onClick={() => switchRole(r)}>{r}</button>
        ))}
      </div>
      <button className="icon-btn"><Icon name="bell" size={18} /><span className="dot-badge" /></button>
    </div>
  );
}

function AppShell({ screen, role, campaign, nav, user, crumbs, switchRole, children }) {
  return (
    <div className="shell">
      <Sidebar screen={screen} role={role} campaign={campaign} nav={nav} user={user} />
      <div className="main">
        <Topbar crumbs={crumbs} role={role} switchRole={switchRole} />
        <div className="scroll">{children}</div>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, Topbar, AppShell });
