/* ============================================================
   WYR — Publish  (carousel review · post to Instagram)
   ============================================================ */

function Publish({ campaign, ideas, api, nav }) {
  const approved = ideas.filter(i => i.approval_status === 'approved');
  const [mode, setMode] = useState('now');
  const [when, setWhen] = useState('');
  const [posting, setPosting] = useState(false);
  const toast = useToast();
  if (!campaign) return null;

  const posted = campaign.stage === 'posted';
  const stories = approved.filter(i => i.story_ready);
  const allApproved = approved.length > 0 && approved.every(i => i.story_status === 'approved');

  function post() {
    setPosting(true);
    setTimeout(() => {
      api.updateCampaign(campaign.id, { stage: 'posted' });
      setPosting(false);
      toast('Posted to Instagram');
    }, 1500);
  }

  if (posted) {
    return (
      <div>
        <FlowHeader campaign={campaign} current="publish" />
        <div className="page page-narrow fade-in" style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--go-soft)', color: 'var(--go-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '24px auto 22px', border: '1px solid color-mix(in oklab, var(--go) 30%, white)' }}>
            <Icon name="checkCircle" size={34} />
          </div>
          <Eyebrow num="05">Live</Eyebrow>
          <h1 className="serif" style={{ fontSize: 44, fontWeight: 500, letterSpacing: '-0.025em', margin: '12px 0 8px' }}>It’s posted.</h1>
          <p style={{ color: 'var(--ink-2)', maxWidth: '46ch', margin: '0 auto 8px' }}>
            Your {stories.length} “Would You Rather” stories are live as an Instagram carousel.
          </p>
          <a className="row gap-6" style={{ justifyContent: 'center', color: 'var(--b-ink)', fontWeight: 600, fontSize: 14, marginBottom: 30, cursor: 'pointer' }}>
            <Icon name="external" size={15} />View on Instagram
          </a>

          <div className="row" style={{ gap: 14, justifyContent: 'center', marginBottom: 36, flexWrap: 'wrap' }}>
            {stories.map(idea => <StoryFrame key={idea.id} idea={idea} width={120} />)}
          </div>

          <div className="row gap-12" style={{ justifyContent: 'center' }}>
            <Btn kind="ink" icon="plus" onClick={() => nav('new')}>Start New Campaign</Btn>
            <Btn kind="ghost" onClick={() => nav('dashboard')}>Back to Dashboard</Btn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <FlowHeader campaign={campaign} current="publish" />
      <div className="page page-narrow">
        <SectionHead num="05" kicker={`${stories.length} slides`} title="Review & publish" />

        {/* Carousel preview */}
        <div className="card card-pad" style={{ marginBottom: 20 }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
            <span className="mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-2)' }}>Carousel preview</span>
            <span className="pill"><span style={{ display: 'flex', color: 'var(--a)' }}><Icon name="instagram" size={12} /></span>{stories.length} × Story</span>
          </div>
          <div className="row" style={{ gap: 14, overflowX: 'auto', paddingBottom: 6 }}>
            {stories.map(idea => <StoryFrame key={idea.id} idea={idea} width={130} />)}
          </div>
        </div>

        {/* Approval status */}
        <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
          <div className="row" style={{ gap: 8, padding: '12px 18px', borderBottom: '1px solid var(--hair)' }}>
            <Icon name="clock" size={14} color="var(--ink-3)" />
            <span style={{ fontWeight: 600, fontSize: 13.5 }}>Story approval</span>
            {allApproved
              ? <span className="row gap-6" style={{ marginLeft: 'auto', color: 'var(--go-ink)', fontWeight: 600, fontSize: 12.5 }}><Icon name="checkCircle" size={13} />All approved</span>
              : <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--pending)' }}>awaiting</span>}
          </div>
          {approved.map((idea, i) => (
            <div key={idea.id} className="row gap-12" style={{ padding: '11px 18px', borderBottom: i < approved.length - 1 ? '1px solid var(--hair)' : 'none' }}>
              {idea.story_ready && <StoryFrame idea={idea} width={26} />}
              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', marginRight: 8 }}>{String(i + 1).padStart(2, '0')}</span>
                {idea.option_a} <span className="serif" style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>vs</span> {idea.option_b}
              </span>
              <StoryStatus status={idea.story_status} />
            </div>
          ))}
        </div>

        {/* When + post */}
        <div className="card card-pad">
          <span className="field-label">When to post</span>
          <div className="row gap-8" style={{ marginBottom: mode === 'schedule' ? 12 : 0 }}>
            {['now', 'schedule'].map(m => (
              <button key={m} className={'chip' + (mode === m ? ' on' : '')} style={{ flex: 1, padding: '11px', textTransform: 'capitalize', justifyContent: 'center' }} onClick={() => setMode(m)}>
                {m === 'now' ? 'Post now' : 'Schedule'}
              </button>
            ))}
          </div>
          {mode === 'schedule' && <input className="input" type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} />}
          <Btn kind="a" size="lg" icon="share" onClick={post} disabled={posting || !allApproved}
            style={{ width: '100%', justifyContent: 'center', marginTop: 16 }}>
            {posting ? 'Posting…' : `Post ${stories.length} Stories as Carousel`}
          </Btn>
          {!allApproved && <p className="mono" style={{ fontSize: 11, textAlign: 'center', color: 'var(--ink-3)', marginTop: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Manager must approve all stories first</p>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Publish });
