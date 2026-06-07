/* ============================================================
   WYR — Stories  (compose · 9:16 preview · approval)
   ============================================================ */

function StoryStatus({ status }) {
  if (status === 'approved') return <span className="row gap-6" style={{ color: 'var(--go-ink)', fontWeight: 600, fontSize: 12.5 }}><Icon name="checkCircle" size={14} />Approved</span>;
  if (status === 'rejected') return <span className="row gap-6" style={{ color: 'var(--a-ink)', fontWeight: 600, fontSize: 12.5 }}><Icon name="xCircle" size={14} />Rejected</span>;
  if (status === 'pending') return <span className="row gap-6" style={{ color: 'var(--pending)', fontWeight: 600, fontSize: 12.5 }}><span className="pdot live" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pending)' }} />Pending</span>;
  return null;
}

function Stories({ campaign, ideas, api, nav, role }) {
  const approved = ideas.filter(i => i.approval_status === 'approved');
  const [composing, setComposing] = useState(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const isManager = role === 'manager' || role === 'admin';
  if (!campaign) return null;

  const sent = ['stories_pending', 'stories_approved', 'posted'].includes(campaign.stage);
  const allComposed = approved.length > 0 && approved.every(i => i.story_ready);
  const allApproved = approved.length > 0 && approved.every(i => i.story_status === 'approved');
  const composedCount = approved.filter(i => i.story_ready).length;

  function compose(id) {
    setComposing(id);
    setTimeout(() => {
      api.setIdeas(campaign.id, ideas.map(i => i.id === id ? { ...i, story_ready: true, story_status: 'pending' } : i));
      setComposing(null);
      toast('Story composed');
    }, 700);
  }
  function composeAll() {
    setBusy(true);
    setTimeout(() => {
      api.setIdeas(campaign.id, ideas.map(i => i.approval_status === 'approved' ? { ...i, story_ready: true, story_status: i.story_status || 'pending' } : i));
      setBusy(false);
      toast('All stories composed');
    }, 900);
  }
  function sendApproval() {
    setBusy(true);
    api.updateCampaign(campaign.id, { stage: 'stories_pending' });
    toast('Stories sent to manager');
    setTimeout(() => {
      api.setIdeas(campaign.id, ideas.map(i => i.approval_status === 'approved' ? { ...i, story_status: 'approved' } : i));
      api.updateCampaign(campaign.id, { stage: 'stories_approved' });
      setBusy(false);
      toast('Manager approved all stories');
    }, 1800);
  }
  function mApprove(id) {
    const next = ideas.map(i => i.id === id ? { ...i, story_status: 'approved' } : i);
    api.setIdeas(campaign.id, next);
    if (next.filter(i => i.approval_status === 'approved').every(i => i.story_status === 'approved')) {
      api.updateCampaign(campaign.id, { stage: 'stories_approved' });
      toast('All stories approved');
    } else toast('Story approved');
  }
  function mReject(id) {
    api.setIdeas(campaign.id, ideas.map(i => i.id === id ? { ...i, story_status: 'rejected' } : i));
    toast('Story rejected', 'err');
  }

  return (
    <div>
      <FlowHeader campaign={campaign} current="stories" />
      <div className="page" style={{ maxWidth: 960 }}>
        <SectionHead num="04" kicker={`${composedCount} of ${approved.length} composed`} title="Compose the Stories"
          right={!allComposed
            ? <Btn kind="ink" icon="wand" onClick={composeAll} disabled={busy || composing !== null}>{busy ? 'Composing…' : 'Compose All'}</Btn>
            : !sent && !isManager
              ? <Btn kind="a" icon="send" onClick={sendApproval} disabled={busy}>{busy ? 'Sending…' : 'Send to Manager'}</Btn>
              : null} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }} className="stagger">
          {approved.map((idea, i) => (
            <div key={idea.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
              borderColor: idea.story_status === 'approved' ? 'color-mix(in oklab, var(--go) 32%, var(--hair))' : idea.story_status === 'rejected' ? 'var(--a-line)' : 'var(--hair)' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <Eyebrow num={String(i + 1).padStart(2, '0')}>Story</Eyebrow>
                <StoryStatus status={idea.story_status} />
              </div>

              <div className="row gap-16" style={{ alignItems: 'flex-start' }}>
                {idea.story_ready ? (
                  <StoryFrame idea={idea} width={118} />
                ) : (
                  <div className="ph" style={{ width: 118, aspectRatio: '9/16', borderRadius: 12, flexDirection: 'column', gap: 8 }}>
                    <Icon name="wand" size={20} /><span>not composed</span>
                  </div>
                )}
                <div className="col gap-10" style={{ flex: 1, minWidth: 0 }}>
                  <div>
                    <div className="opt-tag a" style={{ fontSize: 9 }}>A</div>
                    <div className="serif" style={{ fontSize: 14, lineHeight: 1.2, marginTop: 2 }}>{idea.option_a}</div>
                  </div>
                  <div>
                    <div className="opt-tag b" style={{ fontSize: 9 }}>B</div>
                    <div className="serif" style={{ fontSize: 14, lineHeight: 1.2, marginTop: 2 }}>{idea.option_b}</div>
                  </div>

                  {!idea.story_ready ? (
                    <Btn kind="ink" size="sm" icon="wand" onClick={() => compose(idea.id)} disabled={composing === idea.id}>
                      {composing === idea.id ? 'Composing…' : 'Compose'}
                    </Btn>
                  ) : isManager && idea.story_status !== 'approved' ? (
                    <div className="row gap-6">
                      <button className="btn btn-go btn-sm" onClick={() => mApprove(idea.id)}><Icon name="thumbsUp" size={12} />Approve</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => mReject(idea.id)}><Icon name="thumbsDown" size={12} />Reject</button>
                    </div>
                  ) : idea.story_status !== 'approved' ? (
                    <button className="btn btn-quiet btn-sm" onClick={() => compose(idea.id)} style={{ alignSelf: 'flex-start', paddingLeft: 0 }}>
                      <Icon name="refresh" size={12} />Recompose
                    </button>
                  ) : (
                    <span className="row gap-6" style={{ color: 'var(--go-ink)', fontSize: 12.5, fontWeight: 600 }}><Icon name="check" size={13} />Story ready</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status / next */}
        {sent && !allApproved && (
          <div className="card" style={{ marginTop: 22, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--pending-soft)', borderColor: 'var(--a-line)' }}>
            <span className="pdot live" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pending)' }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Waiting for manager to approve all stories…</span>
            <button className="btn btn-quiet btn-sm" onClick={() => api.openApproval(campaign.id, 'stories')}><Icon name="external" size={13} />Approval link</button>
            {isManager && <Btn kind="go" size="sm" icon="checkCircle" style={{ marginLeft: 'auto' }}
              onClick={() => { api.setIdeas(campaign.id, ideas.map(i => i.approval_status === 'approved' ? { ...i, story_status: 'approved' } : i)); api.updateCampaign(campaign.id, { stage: 'stories_approved' }); toast('All stories approved'); }}>Approve All</Btn>}
          </div>
        )}

        {allApproved && (
          <div className="card" style={{ marginTop: 22, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--go-soft)', borderColor: 'color-mix(in oklab, var(--go) 30%, white)' }}>
            <div className="row gap-12">
              <Icon name="checkCircle" size={22} color="var(--go-ink)" />
              <div>
                <div style={{ fontWeight: 600 }}>All stories approved</div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>Ready to publish to Instagram.</div>
              </div>
            </div>
            <Btn kind="go" iconRight="arrow" onClick={() => nav('publish', campaign.id)}>Post to Instagram</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Stories });
