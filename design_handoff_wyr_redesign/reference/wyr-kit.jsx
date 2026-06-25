/* ============================================================
   WYR — Design System Kit viewer
   ============================================================ */

const NAV_ITEMS = [
  { id: 'overview',    label: 'Overview',     num: '00' },
  { id: 'colors',      label: 'Color Tokens', num: '01' },
  { id: 'typography',  label: 'Typography',   num: '02' },
  { id: 'buttons',     label: 'Buttons',      num: '03' },
  { id: 'chips',       label: 'Chips & Tabs', num: '04' },
  { id: 'cards',       label: 'Cards & Wells',num: '05' },
  { id: 'pipeline',    label: 'Pipeline',     num: '06' },
  { id: 'pills',       label: 'Stage Pills',  num: '07' },
  { id: 'duel',        label: 'Duel Row',     num: '08' },
  { id: 'story',       label: 'Story Frame',  num: '09' },
  { id: 'icons',       label: 'Icons',        num: '10' },
  { id: 'inputs',      label: 'Inputs',       num: '11' },
];

const COLORS = [
  { token: '--paper',       label: 'Paper',       val: '#FBFAF7' },
  { token: '--paper-2',     label: 'Paper 2',     val: '#F4F1EA' },
  { token: '--card',        label: 'Card',        val: '#FFFFFF' },
  { token: '--ink',         label: 'Ink',         val: '#1A1815' },
  { token: '--ink-2',       label: 'Ink 2',       val: '#57534B' },
  { token: '--ink-3',       label: 'Ink 3',       val: '#8E887C' },
  { token: '--hair',        label: 'Hair',        val: '#E7E2D8' },
  { token: '--hair-2',      label: 'Hair 2',      val: '#D8D2C5' },
];

const DUEL_COLORS = [
  { token: '--a',       label: 'Option A',      group: 'a' },
  { token: '--a-ink',   label: 'Option A Ink',  group: 'a' },
  { token: '--a-soft',  label: 'Option A Soft', group: 'a' },
  { token: '--a-line',  label: 'Option A Line', group: 'a' },
  { token: '--b',       label: 'Option B',      group: 'b' },
  { token: '--b-ink',   label: 'Option B Ink',  group: 'b' },
  { token: '--b-soft',  label: 'Option B Soft', group: 'b' },
  { token: '--b-line',  label: 'Option B Line', group: 'b' },
];

const STATUS_COLORS = [
  { token: '--pending',       label: 'Pending',      group: 'pending' },
  { token: '--pending-soft',  label: 'Pending Soft', group: 'pending' },
  { token: '--go',            label: 'Go / Posted',  group: 'go' },
  { token: '--go-soft',       label: 'Go Soft',      group: 'go' },
  { token: '--go-ink',        label: 'Go Ink',       group: 'go' },
];

const TYPE_SCALE = [
  { name: 'Display',   tag: 'serif', size: '46px', weight: '500', cls: 'serif display', sample: 'Would You Rather?' },
  { name: 'Heading 1', tag: 'serif', size: '34px', weight: '500', cls: 'serif', sample: 'Campaign Dashboard' },
  { name: 'Heading 2', tag: 'serif', size: '24px', weight: '500', cls: 'serif', sample: 'Ideas for Review' },
  { name: 'Body',      tag: 'sans',  size: '15px', weight: '400', cls: '',      sample: 'Choose which option you prefer — tap to select your answer.' },
  { name: 'Small',     tag: 'sans',  size: '13px', weight: '400', cls: '',      sample: 'Created 3 hours ago · Travel theme · 5 ideas pending' },
  { name: 'Label',     tag: 'mono',  size: '10.5px', weight: '400', cls: 'mono eyebrow', sample: 'CAMPAIGN STATUS' },
  { name: 'Mono',      tag: 'mono',  size: '13px', weight: '400', cls: 'mono', sample: 'ideas_approved · #c4a9f2' },
];

const SAMPLE_IDEA = {
  option_a: 'Travel the world for a year with no phone',
  option_b: 'Stay home but have unlimited money',
  imageA: null,
  imageB: null,
};

const ICON_NAMES = [
  'dashboard','plus','list','chart','users','shield','settings','bell',
  'search','arrow','chevR','chevD','check','checkCircle','x','xCircle',
  'sparkle','send','refresh','wand','clock','share','external','logout',
  'user','trend','image','pencil','mail','link','copy',
  'thumbsUp','thumbsDown','lock','globe','filter','calendar','instagram',
];

function Swatch({ token, label }) {
  return (
    <div className="kit-swatch">
      <div className="kit-chip" style={{ background: `var(${token})`, border: token === '--card' || token === '--paper' ? '1px solid var(--hair)' : undefined }} />
      <div>
        <div className="kit-meta-k">{label}</div>
        <code className="kit-code">{token}</code>
      </div>
    </div>
  );
}

function Section({ id, eyebrow, title, intro, children }) {
  return (
    <div className="kit-section" id={id}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="kit-h2">{title}</h2>
      {intro && <p className="kit-intro">{intro}</p>}
      {children}
    </div>
  );
}

function Demo({ label, note, center = true, children, bg }) {
  return (
    <div className="kit-demo">
      {label && <div className="kit-demo-label">{label}</div>}
      <div className="kit-demo-stage" style={{ justifyContent: center ? 'center' : 'flex-start', background: bg }}>
        {children}
      </div>
      {note && <div className="kit-demo-note">{note}</div>}
    </div>
  );
}

function Kit() {
  const [active, setActive] = useState('overview');
  const mainRef = useRef(null);

  function scrollTo(id) {
    setActive(id);
    const el = document.getElementById(id);
    if (el && mainRef.current) {
      mainRef.current.scrollTo({ top: el.offsetTop - 32, behavior: 'smooth' });
    }
  }

  // Update active nav on scroll
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    function onScroll() {
      const scrollY = main.scrollTop;
      for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
        const el = document.getElementById(NAV_ITEMS[i].id);
        if (el && el.offsetTop - 80 <= scrollY) {
          setActive(NAV_ITEMS[i].id);
          return;
        }
      }
      setActive('overview');
    }
    main.addEventListener('scroll', onScroll);
    return () => main.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="kit-shell">
      {/* Sidebar nav */}
      <nav className="kit-nav">
        <div className="kit-brand">
          <div className="sb-wordmark" style={{ fontSize: 26 }}>
            <span className="a">W</span><span className="b">Y</span>R
          </div>
          <div className="sb-sub" style={{ marginTop: 4 }}>Design Kit</div>
        </div>
        <div className="kit-nav-list">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={'kit-nav-item' + (active === item.id ? ' active' : '')}
              onClick={() => scrollTo(item.id)}
            >
              <span className="kit-nav-num">{item.num}</span>
              {item.label}
            </button>
          ))}
        </div>
        <a className="kit-nav-foot" href="WYR Studio.html">← Open Studio App</a>
      </nav>

      {/* Main content */}
      <div className="kit-main" ref={mainRef}>
        <div className="kit-wrap">

          {/* Cover */}
          <div className="kit-cover" id="overview">
            <Eyebrow>Design System</Eyebrow>
            <h1 className="kit-h1 serif">WYR<br/>Design Kit</h1>
            <p className="kit-lede">
              The visual language for <strong>Would You Rather</strong> — a premium editorial design system
              built on warm paper surfaces, duel contrast, and editorial serif typography.
            </p>
            <div className="kit-cover-meta">
              <div>
                <div className="kit-meta-k">Typefaces</div>
                <div className="kit-meta-v">Newsreader · Hanken Grotesk · Space Mono</div>
              </div>
              <div>
                <div className="kit-meta-k">Accent palette</div>
                <div className="kit-meta-v">Flame (A) · Cobalt (B) · Warm paper</div>
              </div>
              <div>
                <div className="kit-meta-k">Framework</div>
                <div className="kit-meta-v">React 18 + Babel standalone</div>
              </div>
            </div>
          </div>

          {/* 01 Colors */}
          <Section id="colors" eyebrow="01 — Tokens" title="Color Tokens"
            intro="All colors are CSS custom properties on :root. Use var(--token) everywhere — never hardcode hex values.">
            <div className="kit-block-label">Surfaces</div>
            <div className="kit-token-grid" style={{ marginBottom: 28 }}>
              {COLORS.map(c => <Swatch key={c.token} {...c} />)}
            </div>

            <div className="kit-duel-tokens">
              <div>
                <div className="kit-block-label">Option A — Flame</div>
                <div className="kit-token-grid">
                  {DUEL_COLORS.filter(c => c.group === 'a').map(c => <Swatch key={c.token} {...c} />)}
                </div>
              </div>
              <div>
                <div className="kit-block-label">Option B — Cobalt</div>
                <div className="kit-token-grid">
                  {DUEL_COLORS.filter(c => c.group === 'b').map(c => <Swatch key={c.token} {...c} />)}
                </div>
              </div>
            </div>

            <div className="kit-block-label" style={{ marginTop: 28 }}>Status</div>
            <div className="kit-token-grid">
              {STATUS_COLORS.map(c => <Swatch key={c.token} {...c} />)}
            </div>
          </Section>

          {/* 02 Typography */}
          <Section id="typography" eyebrow="02 — Type" title="Typography"
            intro="Three typefaces: Newsreader (editorial serif), Hanken Grotesk (UI sans), Space Mono (data/labels).">
            <div className="kit-scale">
              {TYPE_SCALE.map(t => (
                <div className="kit-scale-row" key={t.name}>
                  <div className="kit-scale-meta">
                    <div className="kit-meta-k">{t.name}</div>
                    <code className="kit-code" style={{ fontSize: 11 }}>{t.size} / {t.tag}</code>
                  </div>
                  <div className={t.cls} style={{ fontSize: t.size, fontWeight: t.weight, lineHeight: 1.2, color: 'var(--ink)' }}>
                    {t.sample}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 03 Buttons */}
          <Section id="buttons" eyebrow="03 — Actions" title="Buttons"
            intro="Use .btn with a variant modifier. btn-ink is the primary CTA. btn-a / btn-b are used on duel screens.">
            <Demo label="Variants">
              <div className="kit-flow">
                <Btn kind="ink">Primary</Btn>
                <Btn kind="ghost">Ghost</Btn>
                <Btn kind="a">Option A</Btn>
                <Btn kind="b">Option B</Btn>
                <Btn kind="go">Posted</Btn>
                <Btn kind="quiet">Quiet</Btn>
              </div>
            </Demo>
            <Demo label="Sizes">
              <div className="kit-flow">
                <Btn kind="ink" size="lg" icon="sparkle">Large</Btn>
                <Btn kind="ink">Default</Btn>
                <Btn kind="ghost" size="sm">Small</Btn>
              </div>
            </Demo>
            <Demo label="With icons">
              <div className="kit-flow">
                <Btn kind="ink" icon="sparkle">Generate Ideas</Btn>
                <Btn kind="ghost" icon="send">Send for Approval</Btn>
                <Btn kind="ink" iconRight="arrow">Next Step</Btn>
                <Btn kind="ink" icon="refresh" size="sm">Regenerate</Btn>
              </div>
            </Demo>
            <Demo label="Disabled state">
              <div className="kit-flow">
                <Btn kind="ink" disabled>Disabled Primary</Btn>
                <Btn kind="ghost" disabled>Disabled Ghost</Btn>
              </div>
            </Demo>
          </Section>

          {/* 04 Chips & Tabs */}
          <Section id="chips" eyebrow="04 — Selection" title="Chips & Tabs"
            intro="Chips are used for theme selectors and tone/audience options. Tabs filter table views.">
            <Demo label="Chips">
              <div className="kit-flow" style={{ flexWrap: 'wrap' }}>
                <span className="chip">Travel</span>
                <span className="chip on">Food</span>
                <span className="chip">Career</span>
                <span className="chip on-a">Option A</span>
                <span className="chip on-b">Option B</span>
              </div>
            </Demo>
            <Demo label="Filter tabs">
              <div className="tabs">
                <div className="tab active">All <span className="t-count">12</span></div>
                <div className="tab">Awaiting <span className="t-count">3</span></div>
                <div className="tab">In Progress <span className="t-count">5</span></div>
                <div className="tab">Posted <span className="t-count">4</span></div>
              </div>
            </Demo>
          </Section>

          {/* 05 Cards */}
          <Section id="cards" eyebrow="05 — Surfaces" title="Cards & Wells"
            intro=".card is the primary elevated surface. .well is a recessed container for secondary content.">
            <Demo label="Card" center={false}>
              <div className="card card-pad" style={{ width: 320 }}>
                <div className="kit-meta-k">Campaign</div>
                <div className="serif" style={{ fontSize: 20, marginTop: 6 }}>Travel vs Career</div>
                <div style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 4 }}>Created 2 hours ago</div>
              </div>
            </Demo>
            <Demo label="Well" center={false}>
              <div className="well" style={{ padding: 20, width: 320, color: 'var(--ink-2)', fontSize: 14 }}>
                Recessed content area — used for editor fields, image placeholders, and secondary panels.
              </div>
            </Demo>
          </Section>

          {/* 06 Pipeline */}
          <Section id="pipeline" eyebrow="06 — Progress" title="Pipeline"
            intro="The 5-step editorial pipeline from theme input to Instagram post. Active step has ink ring; completed steps are filled.">
            {['ideas_pending','ideas_approved','images_approved','design_ready','posted'].map(stage => (
              <Demo key={stage} label={stage} note={`stage="${stage}"`}>
                <div style={{ overflowX: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <Pipeline stage={stage} />
                </div>
              </Demo>
            ))}
          </Section>

          {/* 07 Pills */}
          <Section id="pills" eyebrow="07 — Status" title="Stage Pills"
            intro="Compact mono-spaced pill badges for table rows and card headers.">
            <Demo label="All stages">
              <div className="kit-flow" style={{ flexWrap: 'wrap' }}>
                {Object.keys(WYR.STAGE).map(s => <StagePill key={s} stage={s} />)}
              </div>
            </Demo>
          </Section>

          {/* 08 Duel Row */}
          <Section id="duel" eyebrow="08 — The Duel" title="Duel Row"
            intro="The core WYR card — Option A (flame) on the left, Option B (cobalt) on the right, VS mark at the seam.">
            <Demo label="Sample duel" center={false}>
              <div style={{ width: '100%' }}>
                <DuelRow
                  a={SAMPLE_IDEA.option_a}
                  b={SAMPLE_IDEA.option_b}
                />
              </div>
            </Demo>
            <div className="kit-do" style={{ marginTop: 16 }}>
              <div className="kit-dd-head"><span style={{ color: 'var(--go)' }}>✓</span> Do</div>
              <ul className="kit-dd"><li>Keep option text concise — max ~8 words per side</li><li>Use serif opt-text for editorial weight</li></ul>
            </div>
            <div className="kit-dont" style={{ marginTop: 10 }}>
              <div className="kit-dd-head"><span style={{ color: 'var(--a)' }}>✕</span> Don't</div>
              <ul className="kit-dd"><li>Overflow with long text — both sides should feel balanced</li></ul>
            </div>
          </Section>

          {/* 09 Story Frame */}
          <Section id="story" eyebrow="09 — Instagram" title="Story Frame"
            intro="9:16 Instagram Story preview. Top half is Option A (flame tint), bottom half is Option B (cobalt tint). VS badge floats at center.">
            <Demo label="No images (placeholder)">
              <div style={{ display: 'flex', gap: 24 }}>
                <StoryFrame idea={SAMPLE_IDEA} width={140} />
                <StoryFrame
                  idea={{
                    option_a: 'Always speak your mind',
                    option_b: 'Never lie but stay silent',
                    imageA: null, imageB: null,
                  }}
                  width={140}
                />
              </div>
            </Demo>
            <p className="kit-foot-note">
              When images are approved, pass <code className="kit-code">imageA</code> and <code className="kit-code">imageB</code> URLs
              — they render as full-bleed with a colour tint overlay.
            </p>
          </Section>

          {/* 10 Icons */}
          <Section id="icons" eyebrow="10 — Iconography" title="Icons"
            intro="Lucide-style 24px stroke icons, exposed via the ICON map and the <Icon> component. Default size 18, strokeWidth 1.75.">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
              {ICON_NAMES.map(name => (
                <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 8px', border: '1px solid var(--hair)', borderRadius: 10, background: 'var(--card)' }}>
                  <Icon name={name} size={20} />
                  <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', textAlign: 'center' }}>{name}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* 11 Inputs */}
          <Section id="inputs" eyebrow="11 — Forms" title="Inputs"
            intro="Text inputs and textareas share the same .input / .textarea class. Labels use .field-label (mono, uppercase).">
            <Demo label="Text input" center={false}>
              <div style={{ width: '100%', maxWidth: 440 }}>
                <label className="field-label">Campaign Theme</label>
                <input className="input" placeholder="e.g. Travel, Food, Career…" />
              </div>
            </Demo>
            <Demo label="Textarea" center={false}>
              <div style={{ width: '100%', maxWidth: 440 }}>
                <label className="field-label">Manager Comment</label>
                <textarea className="textarea" rows={3} placeholder="Optional note for the creator…" />
              </div>
            </Demo>
          </Section>

        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ToastHost><Kit /></ToastHost>
);
