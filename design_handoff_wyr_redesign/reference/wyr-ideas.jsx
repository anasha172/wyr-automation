/* ============================================================
   WYR — Ideas  (AI generation · the duel · approval)
   ============================================================ */

function EditableOpt({ value, side, onChange }) {
  const ref = useRef(null);
  return (
    <div
      ref={ref}
      className={'opt-text'}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={e => onChange(e.currentTarget.textContent.trim())}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
      style={{ outline: 'none', cursor: 'text', borderRadius: 4, textAlign: side === 'b' ? 'right' : 'left' }}
      title="Click to edit"
    >{value}</div>
  );
}

function StatusBadge({ status, sent }) {
  if (status === 'approved') return <span className="row gap-6" style={{ color: 'var(--go-ink)', fontWeight: 600, fontSize: 13 }}><Icon name="checkCircle" size={15} />Approved</span>;
  if (status === 'rejected') return <span className="row gap-6" style={{ color: 'var(--a-ink)', fontWeight: 600, fontSize: 13 }}><Icon name="xCircle" size={15} />Rejected</span>;
  if (status === 'pending' || sent) return <span className="row gap-6" style={{ color: 'var(--pending)', fontWeight: 600, fontSize: 13 }}><span className="pdot live" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--pending)' }} />Awaiting manager</span>;
  return <span className="row gap-6 mono" style={{ color: 'var(--ink-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}><Icon name="clock" size={13} />Draft</span>;
}

function IdeaCard({ idea, index, selected, onSelect, onRegen, onEdit, regenning, role, onApprove, onReject }) {
  const isManager = role === 'manager' || role === 'admin';
  const draft = idea.approval_status === 'draft';
  const pending = idea.approval_status === 'pending';
  return (
    <div className="card fade-in" style={{ overflow: 'hidden', borderColor: idea.approval_status === 'approved' ? 'color-mix(in oklab, var(--go) 35%, var(--hair))' : idea.approval_status === 'rejected' ? 'var(--a-line)' : 'var(--hair)' }}>
      <div className="row" style={{ justifyContent: 'space-between', padding: '13px 18px', borderBottom: '1px solid var(--hair)' }}>
        <div className="row gap-12">
          {draft && (
            <button onClick={() => onSelect(idea.id, !selected)}
              style={{ width: 20, height: 20, borderRadius: 6, border: '1.5px solid ' + (selected ? 'var(--ink)' : 'var(--hair-2)'), background: selected ? 'var(--ink)' : 'transparent', color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              {selected && <Icon name="check" size={13} />}
            </button>
          )}
          <Eyebrow num={String(index + 1).padStart(2, '0')}>Idea</Eyebrow>
        </div>
        <div className="row gap-12">
          <StatusBadge status={idea.approval_status} sent={idea.sent} />
          {isManager && pending && (
            <div className="row gap-6">
              <button className="btn btn-go btn-sm" onClick={() => onApprove(idea.id)}><Icon name="thumbsUp" size={13} />Approve</button>
              <button className="btn btn-ghost btn-sm" onClick={() => onReject(idea.id)}><Icon name="thumbsDown" size={13} />Reject</button>
            </div>
          )}
          {!isManager && (idea.approval_status !== 'approved') && (
            <button className="icon-btn" onClick={() => onRegen(idea.id)} title="Regenerate this idea" style={{ width: 32, height: 32 }}>
              <Icon name="refresh" size={15} style={regenning ? { animation: 'spin .7s linear infinite' } : null} />
            </button>
          )}
        </div>
      </div>
      <div className="duel">
        <div className="duel-side duel-a">
          <span className="opt-tag a"><span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--a)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>A</span> Option A</span>
          <EditableOpt value={idea.option_a} side="a" onChange={v => onEdit(idea.id, 'option_a', v)} />
        </div>
        <div className="duel-seam" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
          <div style={{ position: 'relative', zIndex: 2 }}><VS size={44} /></div>
        </div>
        <div className="duel-side duel-b" style={{ textAlign: 'right' }}>
          <span className="opt-tag b" style={{ justifyContent: 'flex-end' }}>Option B <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--b)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>B</span></span>
          <EditableOpt value={idea.option_b} side="b" onChange={v => onEdit(idea.id, 'option_b', v)} />
        </div>
      </div>
    </div>
  );
}

function Ideas({ campaign, ideas, api, nav, role }) {
  const [generating, setGenerating] = useState(false);
  const [regenId, setRegenId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [sending, setSending] = useState(false);
  const toast = useToast();
  if (!campaign) return null;

  const COUNT = 5;
  const hasIdeas = ideas.length > 0;
  const drafts = ideas.filter(i => i.approval_status === 'draft');
  const approvedCount = ideas.filter(i => i.approval_status === 'approved').length;
  const sentCount = ideas.filter(i => i.approval_status === 'pending' || i.approval_status === 'approved').length;
  const allApproved = ideas.length === COUNT && ideas.every(i => i.approval_status === 'approved');
  const rejected = ideas.filter(i => i.approval_status === 'rejected');

  function generate() {
    setGenerating(true);
    setTimeout(() => {
      const fresh = WYR.makeIdeas(campaign.id, campaign.theme).map(i => ({ ...i, approval_status: 'draft' }));
      api.setIdeas(campaign.id, fresh);
      api.updateCampaign(campaign.id, { stage: 'ideas_pending' });
      setSelected(new Set());
      setGenerating(false);
      toast('5 ideas generated');
    }, 1100);
  }

  function regen(id) {
    setRegenId(id);
    setTimeout(() => {
      const pool = WYR.ideaSet(campaign.theme);
      const pick = pool[Math.floor(Math.random() * pool.length)];
      const next = ideas.map(i => i.id === id ? { ...i, option_a: pick.a, option_b: pick.b, approval_status: 'draft', sent: false } : i);
      api.setIdeas(campaign.id, next);
      setSelected(s => new Set([...s, id]));
      setRegenId(null);
      toast('Idea regenerated — select and re-send');
    }, 800);
  }

  function edit(id, field, val) {
    api.setIdeas(campaign.id, ideas.map(i => i.id === id ? { ...i, [field]: val } : i));
  }
  function toggle(id, on) {
    setSelected(s => { const n = new Set(s); on ? n.add(id) : n.delete(id); return n; });
  }
  function selectAll() { setSelected(new Set(drafts.map(i => i.id))); }

  function send() {
    if (selected.size === 0) { toast('Select at least one idea', 'err'); return; }
    setSending(true);
    const next = ideas.map(i => selected.has(i.id) ? { ...i, approval_status: 'pending', sent: true } : i);
    api.setIdeas(campaign.id, next);
    const n = selected.size;
    setSelected(new Set());
    toast(`${n} idea${n > 1 ? 's' : ''} sent to manager`);
    // Simulate manager review coming back
    setTimeout(() => {
      const cur = api;
      const approved = next.map(i => i.approval_status === 'pending' ? { ...i, approval_status: 'approved' } : i);
      api.setIdeas(campaign.id, approved);
      setSending(false);
      if (approved.filter(i => i.approval_status === 'approved').length === COUNT) {
        api.updateCampaign(campaign.id, { stage: 'ideas_approved' });
        toast('Manager approved all ideas');
      } else {
        toast('Manager approved');
      }
    }, 1600);
  }

  function managerApprove(id) {
    const next = ideas.map(i => i.id === id ? { ...i, approval_status: 'approved' } : i);
    api.setIdeas(campaign.id, next);
    if (next.every(i => i.approval_status === 'approved')) api.updateCampaign(campaign.id, { stage: 'ideas_approved' });
    toast('Idea approved');
  }
  function managerReject(id) {
    api.setIdeas(campaign.id, ideas.map(i => i.id === id ? { ...i, approval_status: 'rejected' } : i));
    toast('Idea rejected', 'err');
  }

  return (
    <div>
      <FlowHeader campaign={campaign} current="ideas" />
      <div className="page page-narrow">
        {!hasIdeas ? (
          <div className="card" style={{ padding: '56px 40px', textAlign: 'center', borderStyle: 'dashed' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--paper-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--a)' }}>
              <Icon name="sparkle" size={28} />
            </div>
            <h2 className="serif" style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em' }}>Five questions, one click</h2>
            <p style={{ color: 'var(--ink-2)', margin: '8px auto 22px', maxWidth: '42ch' }}>
              We’ll draft five “Would You Rather” duels for <em className="serif">{campaign.theme}</em> in your chosen tone.
            </p>
            <Btn kind="ink" size="lg" icon="sparkle" onClick={generate} disabled={generating}>
              {generating ? 'Generating…' : 'Generate 5 Ideas'}
            </Btn>
          </div>
        ) : (
          <>
            {/* Progress strip */}
            <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
              <div className="row" style={{ justifyContent: 'space-between', padding: '12px 18px' }}>
                <span className="mono" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-2)' }}>Approval progress</span>
                <div className="row gap-16">
                  {sentCount > 0 && <button className="btn btn-quiet btn-sm" style={{ padding: 0 }} onClick={() => api.openApproval(campaign.id, 'ideas')}><Icon name="external" size={13} />Approval link</button>}
                  <span className="serif" style={{ fontSize: 16, whiteSpace: 'nowrap' }}>{approvedCount} <span style={{ color: 'var(--ink-3)' }}>/ {COUNT} approved</span></span>
                </div>
              </div>
              <div style={{ height: 4, background: 'var(--paper-2)' }}>
                <div style={{ height: '100%', width: `${(approvedCount / COUNT) * 100}%`, background: 'var(--go)', transition: 'width .5s' }} />
              </div>
            </div>

            <div className="col gap-12">
              {ideas.map((idea, i) => (
                <IdeaCard key={idea.id} idea={idea} index={i} selected={selected.has(idea.id)}
                  onSelect={toggle} onRegen={regen} onEdit={edit} regenning={regenId === idea.id}
                  role={role} onApprove={managerApprove} onReject={managerReject} />
              ))}
            </div>

            {/* Action bar */}
            {drafts.length > 0 && (
              <div className="row" style={{ gap: 10, marginTop: 20 }}>
                {selected.size < drafts.length && <Btn kind="ghost" onClick={selectAll}>Select all drafts ({drafts.length})</Btn>}
                <Btn kind="a" icon="send" onClick={send} disabled={sending || selected.size === 0}>
                  {sending ? 'Sending…' : selected.size === 0 ? 'Select ideas to send' : `Send ${selected.size} to Manager`}
                </Btn>
              </div>
            )}

            {rejected.length > 0 && (
              <div className="well" style={{ padding: '12px 16px', marginTop: 16, fontSize: 13, color: 'var(--a-ink)' }}>
                {rejected.length} idea{rejected.length > 1 ? 's' : ''} rejected — regenerate (↻), then select and re-send.
              </div>
            )}

            {allApproved && (
              <div className="card" style={{ marginTop: 22, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--go-soft)', borderColor: 'color-mix(in oklab, var(--go) 30%, white)' }}>
                <div className="row gap-12">
                  <Icon name="checkCircle" size={22} color="var(--go-ink)" />
                  <div>
                    <div style={{ fontWeight: 600 }}>All five ideas approved</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>Time to find imagery for each option.</div>
                  </div>
                </div>
                <Btn kind="go" iconRight="arrow" onClick={() => nav('images', campaign.id)}>Find Images</Btn>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { Ideas });
