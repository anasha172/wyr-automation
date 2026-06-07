/* ============================================================
   WYR — New Campaign  (editorial brief)
   ============================================================ */

function NewCampaign({ api, nav }) {
  const [theme, setTheme] = useState('');
  const [tone, setTone] = useState('fun');
  const [audience, setAudience] = useState('general');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  function submit() {
    if (!theme.trim()) { toast('Enter a theme to begin', 'err'); return; }
    setLoading(true);
    setTimeout(() => {
      const c = api.createCampaign({ theme: theme.trim(), tone, audience });
      toast('Campaign created — let’s generate ideas');
      nav('ideas', c.id);
    }, 500);
  }

  const ToneCard = ({ value, label, desc }) => (
    <button className={'chip' + (tone === value ? ' on' : '')} onClick={() => setTone(value)}
      style={{ textAlign: 'left', padding: '12px 14px', display: 'block', width: '100%', borderRadius: 10 }}>
      <div style={{ fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>{label}</div>
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{desc}</div>
    </button>
  );
  const AudCard = ({ value, label, desc }) => (
    <button className={'chip' + (audience === value ? ' on' : '')} onClick={() => setAudience(value)}
      style={{ textAlign: 'left', padding: '12px 14px', display: 'block', width: '100%', borderRadius: 10 }}>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{desc}</div>
    </button>
  );

  return (
    <div className="page page-narrow fade-in">
      <div className="masthead">
        <Eyebrow num="02">New brief</Eyebrow>
        <h1 style={{ marginTop: 12 }}>Start a duel.</h1>
        <p className="lede">Give us a theme. We’ll draft five “Would You Rather” questions for it.</p>
      </div>

      {/* Channel */}
      <div style={{ marginBottom: 26 }}>
        <span className="field-label">Channel</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center', borderColor: 'var(--ink)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--ink)', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="instagram" size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>Instagram</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Story · 9:16</div>
            </div>
            <span style={{ width: 18, height: 18, borderRadius: '50%', border: '5px solid var(--ink)', flexShrink: 0 }} />
          </div>
          <div className="well" style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center', opacity: 0.55 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--hair-2)', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="link" size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>LinkedIn</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Carousel</div>
            </div>
            <span className="ni-tag">Soon</span>
          </div>
        </div>
      </div>

      <div className="card card-pad fade-in">
        {/* Theme */}
        <span className="field-label">The theme</span>
        <textarea className="textarea" rows={2} value={theme} onChange={e => setTheme(e.target.value)}
          placeholder="e.g. Travel adventures, Career choices, Food preferences…"
          style={{ fontSize: 18, fontFamily: 'var(--serif)' }} />
        <div className="row" style={{ gap: 7, flexWrap: 'wrap', marginTop: 12 }}>
          {WYR.EXAMPLE_THEMES.map(t => (
            <button key={t} className="chip" onClick={() => setTheme(t)} style={{ padding: '6px 12px', fontSize: 13 }}>{t}</button>
          ))}
        </div>

        <div className="rule" style={{ margin: '22px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
          <div>
            <span className="field-label">Tone</span>
            <div className="col gap-8">
              <ToneCard value="fun" label="Fun" desc="Light, playful, shareable" />
              <ToneCard value="thought-provoking" label="Thought-provoking" desc="Makes people pause" />
              <ToneCard value="controversial" label="Controversial" desc="Sparks a debate" />
            </div>
          </div>
          <div>
            <span className="field-label">Audience</span>
            <div className="col gap-8">
              <AudCard value="general" label="General" desc="Broad appeal" />
              <AudCard value="gen-z" label="Gen Z" desc="Younger, internet-native" />
              <AudCard value="professionals" label="Professionals" desc="Career-minded" />
            </div>
          </div>
        </div>
      </div>

      <div className="row" style={{ justifyContent: 'space-between', marginTop: 22 }}>
        <Btn kind="quiet" onClick={() => nav('dashboard')}>Cancel</Btn>
        <Btn kind="a" size="lg" iconRight="sparkle" onClick={submit} disabled={loading}>
          {loading ? 'Creating…' : 'Generate Ideas'}
        </Btn>
      </div>
    </div>
  );
}

Object.assign(window, { NewCampaign });
