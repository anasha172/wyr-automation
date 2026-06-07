/* ============================================================
   WYR — Images  (search · A/B selection)
   ============================================================ */

function Images({ campaign, ideas, api, nav }) {
  const approved = ideas.filter(i => i.approval_status === 'approved');
  const [tab, setTab] = useState(0);
  const [source, setSource] = useState('google');
  const [results, setResults] = useState({});   // ideaId -> {a:[], b:[]}
  const [loading, setLoading] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const idea = approved[tab];

  function runSearch(targetIdea, autoselect) {
    if (!targetIdea) return;
    setLoading(l => ({ ...l, [targetIdea.id]: true }));
    setTimeout(() => {
      const a = WYR.imageResults(targetIdea.id + '-a-' + source, 9);
      const b = WYR.imageResults(targetIdea.id + '-b-' + source, 9);
      setResults(r => ({ ...r, [targetIdea.id]: { a, b } }));
      setLoading(l => ({ ...l, [targetIdea.id]: false }));
      if (autoselect && (!targetIdea.imageA || !targetIdea.imageB)) {
        api.setIdeas(campaign.id, ideas.map(i => i.id === targetIdea.id ? { ...i, imageA: i.imageA || a[0].url, imageB: i.imageB || b[0].url } : i));
      }
    }, 750);
  }

  // auto-search when entering a tab with no results
  useEffect(() => {
    if (idea && !results[idea.id] && !loading[idea.id]) runSearch(idea, true);
  }, [tab, idea && idea.id]);

  function pick(option, url) {
    api.setIdeas(campaign.id, ideas.map(i => i.id === idea.id ? { ...i, [option === 'a' ? 'imageA' : 'imageB']: url } : i));
  }

  const allPicked = approved.length > 0 && approved.every(i => i.imageA && i.imageB);
  const pickedCount = approved.filter(i => i.imageA && i.imageB).length;

  function save() {
    if (!allPicked) { toast('Pick an image for every option', 'err'); return; }
    setSaving(true);
    setTimeout(() => {
      api.updateCampaign(campaign.id, { stage: 'images_approved' });
      toast('Images locked in');
      nav('stories', campaign.id);
    }, 700);
  }

  if (!campaign) return null;
  if (approved.length === 0) {
    return (
      <div><FlowHeader campaign={campaign} current="images" />
        <div className="page page-narrow"><div className="card card-pad" style={{ textAlign: 'center', color: 'var(--ink-3)' }}>
          <p>No approved ideas yet.</p>
          <Btn kind="ghost" onClick={() => nav('ideas', campaign.id)} style={{ marginTop: 12 }}>← Back to Ideas</Btn>
        </div></div>
      </div>
    );
  }

  const r = idea ? results[idea.id] : null;
  const isLoading = idea && loading[idea.id];

  const Column = ({ option, text, selectedUrl, imgs }) => {
    const isA = option === 'a';
    return (
      <div>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <span className={'opt-tag ' + option}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: isA ? 'var(--a)' : 'var(--b)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>{option.toUpperCase()}</span>
            Option {option.toUpperCase()}
          </span>
        </div>
        <div className="opt-text" style={{ fontSize: 16, marginBottom: 12, minHeight: 38 }}>{text}</div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Search: “{text}”
        </div>
        {/* selected preview */}
        <div className={'thumb ' + (selectedUrl ? 'sel-' + option : '')} style={{ marginBottom: 10, aspectRatio: '1', cursor: 'default' }}>
          {selectedUrl ? <img src={selectedUrl} alt="" /> : <div className="ph" style={{ width: '100%', height: '100%' }}>select below</div>}
          {selectedUrl && <div className="check"><Icon name="check" size={14} /></div>}
        </div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--ink-3)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tap to swap</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
          {(imgs || []).map(img => (
            <div key={img.id} className={'thumb' + (selectedUrl === img.url ? ' sel-' + option : '')} onClick={() => pick(option, img.url)}>
              <img src={img.url} alt="" />
              {selectedUrl === img.url && <div className="check"><Icon name="check" size={12} /></div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <FlowHeader campaign={campaign} current="images" />
      <div className="page" style={{ maxWidth: 920 }}>
        {/* Source + tabs */}
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div className="row gap-8">
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Source</span>
            {['google', 'pinterest'].map(s => (
              <button key={s} className={'chip' + (source === s ? ' on' : '')} style={{ textTransform: 'capitalize', padding: '6px 14px' }}
                onClick={() => { setSource(s); setResults({}); if (idea) runSearch(idea, false); }}>{s}</button>
            ))}
          </div>
          <Btn kind="ghost" size="sm" icon="refresh" onClick={() => runSearch(idea, false)} disabled={isLoading}>
            {isLoading ? 'Searching…' : 'Refresh'}
          </Btn>
        </div>

        <div className="row gap-6" style={{ marginBottom: 18, flexWrap: 'wrap' }}>
          {approved.map((it, i) => {
            const done = it.imageA && it.imageB;
            return (
              <button key={it.id} onClick={() => setTab(i)}
                className={'chip' + (tab === i ? ' on' : done ? ' on-b' : '')}
                style={{ padding: '6px 13px', display: 'flex', alignItems: 'center', gap: 6 }}>
                {done && tab !== i && <Icon name="check" size={12} />} Idea {String(i + 1).padStart(2, '0')}
              </button>
            );
          })}
        </div>

        {/* Active idea panel */}
        <div className="card card-pad fade-in" key={idea && idea.id}>
          <div className="duel well" style={{ overflow: 'hidden', marginBottom: 22, borderRadius: 10 }}>
            <div className="duel-side" style={{ padding: '12px 16px' }}>
              <span className="opt-tag a">Option A</span>
              <div className="serif" style={{ fontSize: 16, marginTop: 4 }}>{idea.option_a}</div>
            </div>
            <div className="duel-seam" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
              <div className="vs" style={{ fontSize: 16, background: 'var(--paper-2)', padding: '0 6px' }}>vs</div>
            </div>
            <div className="duel-side" style={{ padding: '12px 16px', textAlign: 'right' }}>
              <span className="opt-tag b" style={{ justifyContent: 'flex-end' }}>Option B</span>
              <div className="serif" style={{ fontSize: 16, marginTop: 4 }}>{idea.option_b}</div>
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
              {[0, 1].map(c => (
                <div key={c}>
                  <div className="thumb" style={{ marginBottom: 10 }}><div className="ph" style={{ width: '100%', height: '100%' }}>loading</div></div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
                    {[0, 1, 2].map(j => <div key={j} className="ph" style={{ aspectRatio: 1, borderRadius: 10 }} />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
              <Column option="a" text={idea.option_a} selectedUrl={idea.imageA} imgs={r && r.a} />
              <Column option="b" text={idea.option_b} selectedUrl={idea.imageB} imgs={r && r.b} />
            </div>
          )}

          {idea.imageA && idea.imageB && tab < approved.length - 1 && (
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
              <Btn kind="ghost" size="sm" iconRight="arrow" onClick={() => setTab(tab + 1)}>Next idea</Btn>
            </div>
          )}
        </div>

        {/* Footer progress */}
        <div className="card" style={{ marginTop: 20, padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="serif" style={{ fontSize: 18 }}>{pickedCount} <span style={{ color: 'var(--ink-3)' }}>/ {approved.length} ideas have images</span></div>
            {!allPicked && <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Pick one image per option to continue.</div>}
          </div>
          <Btn kind={allPicked ? 'go' : 'ghost'} iconRight="arrow" onClick={save} disabled={!allPicked || saving}>
            {saving ? 'Saving…' : 'Compose Stories'}
          </Btn>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Images });
