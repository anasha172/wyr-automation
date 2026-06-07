/* ============================================================
   WYR — Approval  (standalone shareable manager page, no login)
   ============================================================ */

function Approval({ campaign, ideas, type, onSubmit, onBack }) {
  const approved = ideas.filter(i => i.approval_status === 'approved' || type === 'ideas');
  const reviewIdeas = type === 'ideas' ? ideas : approved;
  const [decisions, setDecisions] = useState({});   // id -> 'approved'|'rejected'
  const [comments, setComments] = useState({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allDecided = reviewIdeas.length > 0 && reviewIdeas.every(i => decisions[i.id]);

  function decide(id, d) { setDecisions(p => ({ ...p, [id]: d })); }

  function submit() {
    setSubmitting(true);
    setTimeout(() => { onSubmit(decisions, type); setSubmitting(false); setDone(true); }, 700);
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card fade-in" style={{ padding: '48px 40px', textAlign: 'center', maxWidth: 420 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'var(--go-soft)', color: 'var(--go-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><Icon name="checkCircle" size={30} /></div>
          <h1 className="serif" style={{ fontSize: 30, fontWeight: 500 }}>Thank you</h1>
          <p style={{ color: 'var(--ink-2)', marginTop: 8 }}>Your review has been submitted. The team will be notified.</p>
          <Btn kind="ghost" onClick={onBack} style={{ marginTop: 22 }}>Back to studio</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      {/* Branded header */}
      <div style={{ borderBottom: '1px solid var(--hair)', padding: '20px 0', background: 'var(--card)' }}>
        <div className="row" style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px', justifyContent: 'space-between' }}>
          <div className="row gap-12" style={{ alignItems: 'baseline' }}>
            <div className="serif" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>
              <span style={{ color: 'var(--a)' }}>W</span><span style={{ color: 'var(--b)' }}>Y</span>R
            </div>
            <span className="mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Approval link</span>
          </div>
          <span className="pill"><Icon name="lock" size={11} />Secure · expires in 48h</span>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px 80px' }} className="fade-in">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Eyebrow>{type === 'ideas' ? 'Review ideas' : 'Review stories'}</Eyebrow>
          <h1 className="serif" style={{ fontSize: 38, fontWeight: 500, letterSpacing: '-0.025em', margin: '10px 0 6px' }}>
            {type === 'ideas' ? 'Approve the duels' : 'Approve the stories'}
          </h1>
          <p style={{ color: 'var(--ink-2)' }}>Campaign — <span className="serif" style={{ fontStyle: 'italic' }}>{campaign.theme}</span></p>
        </div>

        <div className="col gap-16">
          {reviewIdeas.map((idea, i) => {
            const d = decisions[idea.id];
            return (
              <div key={idea.id} className="card" style={{ overflow: 'hidden', borderColor: d === 'approved' ? 'color-mix(in oklab, var(--go) 35%, var(--hair))' : d === 'rejected' ? 'var(--a-line)' : 'var(--hair)' }}>
                <div className="row" style={{ justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid var(--hair)' }}>
                  <Eyebrow num={String(i + 1).padStart(2, '0')}>{type === 'ideas' ? 'Idea' : 'Story'}</Eyebrow>
                  {d && <span className="row gap-6" style={{ fontWeight: 600, fontSize: 13, color: d === 'approved' ? 'var(--go-ink)' : 'var(--a-ink)' }}>
                    <Icon name={d === 'approved' ? 'checkCircle' : 'xCircle'} size={14} />{d === 'approved' ? 'Approved' : 'Rejected'}</span>}
                </div>

                {type === 'stories' && idea.story_ready ? (
                  <div className="row gap-16" style={{ padding: 18 }}>
                    <StoryFrame idea={idea} width={110} />
                    <div className="col gap-10" style={{ flex: 1 }}>
                      <div><span className="opt-tag a" style={{ fontSize: 9 }}>A</span><div className="serif" style={{ fontSize: 15, marginTop: 2 }}>{idea.option_a}</div></div>
                      <div><span className="opt-tag b" style={{ fontSize: 9 }}>B</span><div className="serif" style={{ fontSize: 15, marginTop: 2 }}>{idea.option_b}</div></div>
                    </div>
                  </div>
                ) : (
                  <div className="duel">
                    <div className="duel-side duel-a"><span className="opt-tag a">Option A</span><div className="opt-text" style={{ fontSize: 17 }}>{idea.option_a}</div></div>
                    <div className="duel-seam" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}><div style={{ position: 'relative', zIndex: 2 }}><VS size={40} /></div></div>
                    <div className="duel-side duel-b" style={{ textAlign: 'right' }}><span className="opt-tag b" style={{ justifyContent: 'flex-end' }}>Option B</span><div className="opt-text" style={{ fontSize: 17 }}>{idea.option_b}</div></div>
                  </div>
                )}

                <div className="row gap-8" style={{ padding: '12px 18px', borderTop: '1px solid var(--hair)' }}>
                  <button className={'btn btn-sm ' + (d === 'approved' ? 'btn-go' : 'btn-ghost')} onClick={() => decide(idea.id, 'approved')}><Icon name="check" size={13} />Approve</button>
                  <button className={'btn btn-sm ' + (d === 'rejected' ? 'btn-a' : 'btn-ghost')} onClick={() => decide(idea.id, 'rejected')}><Icon name="x" size={13} />Reject</button>
                </div>
                {d === 'rejected' && (
                  <div style={{ padding: '0 18px 16px' }}>
                    <input className="input" placeholder="Optional note for the publisher…" value={comments[idea.id] || ''} onChange={e => setComments(p => ({ ...p, [idea.id]: e.target.value }))} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Btn kind="ink" size="lg" onClick={submit} disabled={!allDecided || submitting}
          style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}>
          {submitting ? 'Submitting…' : allDecided ? 'Submit Review' : `Decide on all ${reviewIdeas.length} to submit`}
        </Btn>
      </div>
    </div>
  );
}

Object.assign(window, { Approval });
