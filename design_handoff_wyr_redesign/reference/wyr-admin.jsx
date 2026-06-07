/* ============================================================
   WYR — Manager Overview · Settings · User Management
   ============================================================ */

function Manager({ nav, openCampaign, store }) {
  const pubs = WYR.publishers;
  const campaigns = store ? store.campaigns : WYR.campaigns;
  const pendingStages = ['ideas_pending', 'images_pending', 'stories_pending'];
  const queue = campaigns.filter(c => pendingStages.includes(c.stage));
  const totalPending = queue.length;
  const totalPosted = campaigns.filter(c => c.stage === 'posted').length;

  return (
    <div className="page page-wide">
      <div className="masthead">
        <Eyebrow num="01">Oversight</Eyebrow>
        <h1 style={{ marginTop: 12 }}>Manager Overview</h1>
        <p className="lede">Every publisher, every approval waiting on you.</p>
      </div>

      <div className="figure-row" style={{ marginBottom: 26 }}>
        <Figure label="Publishers" value={pubs.length} trend="Active this week" up icon="users" />
        <Figure label="Awaiting Approval" value={totalPending} trend={totalPending ? 'Needs your review' : 'All clear'} icon="clock" />
        <Figure label="Total Posted" value={totalPosted} trend="Live on Instagram" up icon="checkCircle" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 22 }}>
        {/* Publishers */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="row gap-8" style={{ padding: '14px 18px', borderBottom: '1px solid var(--hair)' }}>
            <Icon name="users" size={15} color="var(--ink-3)" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Publishers</span>
            <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3)' }}>{pubs.length} total</span>
          </div>
          <table className="tbl">
            <thead><tr><th>Name</th><th style={{ textAlign: 'center' }}>Total</th><th style={{ textAlign: 'center' }}>Pending</th><th style={{ textAlign: 'center' }}>Live</th></tr></thead>
            <tbody>
              {pubs.map(p => (
                <tr key={p.id} style={{ cursor: 'default' }}>
                  <td>
                    <div className="row gap-12">
                      <Avatar name={p.name} role="publisher" size={32} />
                      <div><div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.email}</div></div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.total}</td>
                  <td style={{ textAlign: 'center' }}>{p.pending ? <span className="pill is-pending" style={{ display: 'inline-flex' }}>{p.pending}</span> : <span style={{ color: 'var(--hair-2)' }}>—</span>}</td>
                  <td style={{ textAlign: 'center' }}>{p.posted ? <span className="pill is-posted" style={{ display: 'inline-flex' }}>{p.posted}</span> : <span style={{ color: 'var(--hair-2)' }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Approval queue */}
        <div className="card" style={{ overflow: 'hidden', alignSelf: 'start' }}>
          <div className="row gap-8" style={{ padding: '14px 18px', borderBottom: '1px solid var(--hair)' }}>
            <Icon name="clock" size={15} color="var(--pending)" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Approval Queue</span>
            {totalPending > 0 && <span className="pill is-pending" style={{ marginLeft: 'auto' }}>{totalPending}</span>}
          </div>
          {queue.length === 0 ? (
            <div style={{ padding: '40px 18px', textAlign: 'center', color: 'var(--ink-3)' }}>
              <Icon name="checkCircle" size={22} color="var(--go)" /><p style={{ marginTop: 8, fontSize: 13.5 }}>All clear — nothing pending</p>
            </div>
          ) : queue.map((c, i) => (
            <div key={c.id} className="col" style={{ padding: '13px 18px', borderBottom: i < queue.length - 1 ? '1px solid var(--hair)' : 'none', cursor: 'pointer' }} onClick={() => openCampaign(c)}>
              <div className="row" style={{ justifyContent: 'space-between', gap: 10 }}>
                <div className="serif" style={{ fontSize: 16, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.theme}</div>
                <span className="row gap-6" style={{ color: 'var(--b-ink)', fontWeight: 600, fontSize: 12.5, flexShrink: 0 }}>Review <Icon name="chevR" size={13} /></span>
              </div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', margin: '3px 0 8px' }}>{c.publisher}</div>
              <StagePill stage={c.stage} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Settings ---------------- */
function SettingsCard({ icon, title, desc, connected, children }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="row gap-12" style={{ padding: '16px 20px', borderBottom: '1px solid var(--hair)' }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--ink)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={17} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>{title}</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{desc}</div>
        </div>
        <span className={'pill ' + (connected ? 'is-posted' : '')}><span className="pdot" />{connected ? 'Connected' : 'Not set'}</span>
      </div>
      <div className="col gap-16" style={{ padding: '18px 20px' }}>{children}</div>
    </div>
  );
}
function Field({ label, desc, children }) {
  return <div><label className="field-label">{label}</label>{desc && <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '-2px 0 8px' }}>{desc}</p>}{children}</div>;
}

function Settings({ role, user }) {
  const [s, setS] = useState({ email: 'sam@studio.co', google: '', gid: '', pin: '', igid: '', igtok: '' });
  const toast = useToast();
  const set = k => e => setS(v => ({ ...v, [k]: e.target.value }));
  const has = v => (v || '').trim().length > 0;

  return (
    <div className="page page-narrow">
      <div className="masthead">
        <Eyebrow num="06">Configuration</Eyebrow>
        <h1 style={{ marginTop: 12 }}>Settings</h1>
        <p className="lede">Connect the services that power the pipeline.</p>
      </div>

      <div className="col gap-16">
        <SettingsCard icon="mail" title="Notifications" desc="Where approval requests are sent" connected={has(s.email)}>
          <Field label="Manager email" desc="Approval requests go to this address">
            <input className="input" value={s.email} onChange={set('email')} placeholder="manager@studio.co" />
          </Field>
        </SettingsCard>

        <SettingsCard icon="globe" title="Google Image Search" desc="Powers image search for each option" connected={has(s.google)}>
          <Field label="Google API key"><input className="input" type="password" value={s.google} onChange={set('google')} placeholder="AIza…" /></Field>
          <Field label="Custom Search Engine ID"><input className="input" value={s.gid} onChange={set('gid')} placeholder="0123456789…" /></Field>
        </SettingsCard>

        <SettingsCard icon="image" title="Pinterest" desc="Alternative image source" connected={has(s.pin)}>
          <Field label="Pinterest API token"><input className="input" type="password" value={s.pin} onChange={set('pin')} placeholder="Bearer token" /></Field>
        </SettingsCard>

        <SettingsCard icon="instagram" title="Instagram / Meta" desc="Required to publish stories" connected={has(s.igid) && has(s.igtok)}>
          <Field label="Instagram User ID"><input className="input" value={s.igid} onChange={set('igid')} placeholder="17841…" /></Field>
          <Field label="Access token" desc="Business or Creator account linked to a Facebook Page">
            <input className="input" type="password" value={s.igtok} onChange={set('igtok')} placeholder="EAAx…" />
          </Field>
        </SettingsCard>

        <Btn kind="ink" size="lg" icon="check" onClick={() => toast('Settings saved')} style={{ width: '100%', justifyContent: 'center' }}>Save all settings</Btn>
      </div>
    </div>
  );
}

/* ---------------- User Management ---------------- */
function AdminUsers() {
  const toast = useToast();
  const roleStyle = { admin: 'on-a', manager: 'on-b', publisher: '' };
  return (
    <div className="page">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div className="masthead" style={{ marginBottom: 0 }}>
          <Eyebrow num="07">Access</Eyebrow>
          <h1 style={{ marginTop: 12 }}>User Management</h1>
          <p className="lede">Who’s in the studio, and what they can do.</p>
        </div>
        <Btn kind="a" icon="plus" onClick={() => toast('Invite sent')}>Add User</Btn>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="tbl">
          <thead><tr><th>Name</th><th>Role</th><th>Last active</th><th></th></tr></thead>
          <tbody>
            {WYR.users.map(u => (
              <tr key={u.id} style={{ cursor: 'default' }}>
                <td>
                  <div className="row gap-12">
                    <Avatar name={u.name} role={u.role} size={34} />
                    <div><div style={{ fontWeight: 600, fontSize: 14.5 }}>{u.name}</div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{u.email}</div></div>
                  </div>
                </td>
                <td><span className={'chip ' + (roleStyle[u.role] || '') + ' on'} style={{ textTransform: 'capitalize', cursor: 'default', fontSize: 12, padding: '4px 11px' }}>{u.role}</span></td>
                <td><span className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{WYR.fmtDate(u.active)}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-quiet btn-sm" onClick={() => toast('Editing ' + u.name)}><Icon name="pencil" size={13} />Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

Object.assign(window, { Manager, Settings, AdminUsers });
