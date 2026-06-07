/* ============================================================
   WYR — Login + Dashboard
   ============================================================ */

function Login({ onLogin }) {
  const accounts = [
    { role: 'publisher', name: 'Mara Ellison', email: 'publisher@studio.co', desc: 'Create & run campaigns', ico: 'pencil' },
    { role: 'manager',   name: 'Sam Cho',      email: 'manager@studio.co',   desc: 'Review & approve work',  ico: 'chart' },
    { role: 'admin',     name: 'Alex Rivera',  email: 'admin@studio.co',     desc: 'Users, settings, all access', ico: 'shield' },
  ];
  const sampleIdea = { option_a: 'Read minds for a day', option_b: 'Be invisible for a day', imageA: WYR.img('login-a'), imageB: WYR.img('login-b') };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', height: '100vh' }}>
      {/* Left — editorial masthead */}
      <div style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '56px 60px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <div className="row" style={{ gap: 12, alignItems: 'baseline' }}>
          <div className="serif" style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em' }}>
            <span style={{ color: 'var(--a)' }}>W</span><span style={{ color: 'oklch(0.7 0.16 262)' }}>Y</span>R
          </div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(251,250,247,0.5)' }}>Studio</div>
        </div>

        <div style={{ marginTop: 'auto', marginBottom: 'auto' }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(251,250,247,0.5)', marginBottom: 18 }}>
            Idea → Approval → Story → Posted
          </div>
          <h1 className="serif" style={{ fontSize: 58, fontWeight: 500, lineHeight: 1.0, letterSpacing: '-0.03em' }}>
            The whole<br /><span style={{ fontStyle: 'italic' }}>“Would You<br />Rather”</span><br />pipeline.
          </h1>
          <p style={{ color: 'rgba(251,250,247,0.62)', fontSize: 16, marginTop: 22, maxWidth: '38ch' }}>
            From a one-word theme to a posted Instagram Story — generated, approved, designed and published in one place.
          </p>
        </div>

        <div style={{ position: 'absolute', right: -30, bottom: -40, transform: 'rotate(8deg)', opacity: 0.96 }}>
          <StoryFrame idea={sampleIdea} width={210} />
        </div>
        <div className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', color: 'rgba(251,250,247,0.4)', textTransform: 'uppercase' }}>
          Internal content studio · v2
        </div>
      </div>

      {/* Right — account pick */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: 360, maxWidth: '100%' }} className="fade-in">
          <Eyebrow num="00">Sign in</Eyebrow>
          <h2 className="serif" style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.02em', margin: '12px 0 4px' }}>Choose a seat</h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 14.5, marginBottom: 24 }}>Pick a demo role to step into the studio.</p>

          <div className="col gap-10">
            {accounts.map(a => (
              <button key={a.role} onClick={() => onLogin(a)} className="card"
                style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left', background: 'var(--card)' }}>
                <Avatar name={a.name} role={a.role} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{a.role} · {a.desc}</div>
                </div>
                <span style={{ color: 'var(--ink-3)' }}><Icon name="arrow" size={18} /></span>
              </button>
            ))}
          </div>

          <div className="row gap-12" style={{ margin: '24px 0' }}>
            <div className="rule" style={{ flex: 1 }} />
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>or</span>
            <div className="rule" style={{ flex: 1 }} />
          </div>
          <div className="col gap-12">
            <div><label className="field-label">Email</label><input className="input" placeholder="you@studio.co" defaultValue="" /></div>
            <div><label className="field-label">Password</label><input className="input" type="password" placeholder="••••••••" /></div>
            <Btn kind="ink" size="lg" onClick={() => onLogin(accounts[0])} style={{ width: '100%', justifyContent: 'center' }}>Sign in</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function Figure({ label, value, trend, up, icon }) {
  return (
    <div className="figure">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="f-label">{label}</div>
        <span style={{ color: 'var(--ink-3)' }}><Icon name={icon} size={16} /></span>
      </div>
      <div className="f-val">{value}</div>
      <div className={'f-trend' + (up ? ' up' : '')}>{up && <Icon name="trend" size={13} />}{trend}</div>
    </div>
  );
}

function Dashboard({ store, nav, openCampaign }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const campaigns = store ? store.campaigns : WYR.campaigns;

  const inProgressStages = ['ideas_approved', 'images_approved', 'stories_approved'];
  const pendingStages = ['ideas_pending', 'images_pending', 'stories_pending'];

  const total = campaigns.length;
  const pending = campaigns.filter(c => pendingStages.includes(c.stage)).length;
  const posted = campaigns.filter(c => c.stage === 'posted').length;
  const inProgress = campaigns.filter(c => inProgressStages.includes(c.stage)).length;

  const tabs = [
    { key: 'all', label: 'All', count: total },
    { key: 'approval', label: 'Awaiting Approval', count: pending },
    { key: 'progress', label: 'In Progress', count: inProgress },
    { key: 'posted', label: 'Posted', count: posted },
  ];

  const filtered = campaigns.filter(c => {
    const m = filter === 'approval' ? pendingStages.includes(c.stage)
      : filter === 'progress' ? inProgressStages.includes(c.stage)
      : filter === 'posted' ? c.stage === 'posted' : true;
    return m && (!search || c.theme.toLowerCase().includes(search.toLowerCase()));
  });

  return (
    <div className="page page-wide">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
        <div className="masthead" style={{ marginBottom: 0 }}>
          <Eyebrow num="01">The desk</Eyebrow>
          <h1 style={{ marginTop: 12 }}>Dashboard</h1>
          <p className="lede">Every campaign, from first idea to posted Story.</p>
        </div>
        <div className="row gap-10">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-3)' }}><Icon name="search" size={15} /></span>
            <input className="input" placeholder="Search themes…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 34, width: 220, fontSize: 14 }} />
          </div>
          <Btn kind="a" icon="plus" onClick={() => nav('new')}>New Campaign</Btn>
        </div>
      </div>

      <div className="figure-row" style={{ marginBottom: 26 }}>
        <Figure label="Total Campaigns" value={total} trend={`+${campaigns.filter(c => WYR.fmtDate(c.created_at)).length ? 2 : 0} this week`} up icon="trend" />
        <Figure label="Pending Approval" value={pending} trend={pending ? `${pending} awaiting manager` : 'All clear'} icon="clock" />
        <Figure label="Posted This Week" value={posted} trend={`${posted} live on Instagram`} up icon="checkCircle" />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="row" style={{ justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--hair)' }}>
          <div className="tabs">
            {tabs.map(t => (
              <div key={t.key} className={'tab' + (filter === t.key ? ' active' : '')} onClick={() => setFilter(t.key)}>
                {t.label}<span className="t-count">{t.count}</span>
              </div>
            ))}
          </div>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{filtered.length} shown</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--ink-3)' }}>
            <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center' }}><Icon name="sparkle" size={26} /></div>
            <p style={{ fontWeight: 500, color: 'var(--ink-2)', marginBottom: 14 }}>{search ? `Nothing matches “${search}”` : 'No campaigns yet'}</p>
            <Btn kind="ink" size="sm" icon="plus" onClick={() => nav('new')}>Start a campaign</Btn>
          </div>
        ) : (
          <table className="tbl">
            <thead><tr>
              <th>Theme</th><th>Channel</th><th>Stage</th><th>Pipeline</th><th>Created</th><th></th>
            </tr></thead>
            <tbody className="stagger">
              {filtered.map(c => (
                <tr key={c.id} onClick={() => openCampaign(c)}>
                  <td>
                    <div className="t-theme">{c.theme}</div>
                    <div className="t-meta">{c.tone} · {WYR.audienceLabel(c.audience)} · {c.publisher}</div>
                  </td>
                  <td><span className="pill"><span style={{ display: 'flex', color: 'var(--a)' }}><Icon name="instagram" size={13} /></span>Story</span></td>
                  <td><StagePill stage={c.stage} /></td>
                  <td><MiniPipe stage={c.stage} /></td>
                  <td><span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{WYR.fmtDate(c.created_at)}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="row" style={{ gap: 6, justifyContent: 'flex-end', color: 'var(--ink-2)', fontWeight: 600, fontSize: 13 }}>
                      Open <Icon name="chevR" size={15} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function MiniPipe({ stage }) {
  const cur = (WYR.STAGE[stage] || { step: 0 }).step;
  return (
    <div className="row" style={{ gap: 4 }}>
      {WYR.PIPE_STEPS.map((_, i) => (
        <div key={i} style={{
          width: 22, height: 4, borderRadius: 2,
          background: i < cur ? 'var(--ink)' : i === cur ? 'var(--a)' : 'var(--hair-2)',
        }} />
      ))}
    </div>
  );
}

Object.assign(window, { Login, Dashboard });
