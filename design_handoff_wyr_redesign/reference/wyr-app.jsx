/* ============================================================
   WYR — Root app + router
   ============================================================ */

function Placeholder({ name }) {
  return (
    <div className="page">
      <Eyebrow num="••">In progress</Eyebrow>
      <h1 className="serif" style={{ fontSize: 40, fontWeight: 500, marginTop: 12 }}>{name}</h1>
      <p style={{ color: 'var(--ink-2)', marginTop: 8 }}>This screen is being built.</p>
    </div>
  );
}

function App() {
  const [role, setRole] = useState('publisher');
  const [user, setUser] = useState(WYR.users.find(u => u.role === 'publisher'));
  const [screen, setScreen] = useState('login');
  const [campaignId, setCampaignId] = useState(null);
  const [approvalType, setApprovalType] = useState('ideas');
  // local mutable campaign store (so flow can advance stages)
  const [store, setStore] = useState(() => ({
    campaigns: WYR.campaigns.map(c => ({ ...c })),
    ideas: JSON.parse(JSON.stringify(WYR.ideasByCampaign)),
    draftTheme: null,
  }));

  const campaign = campaignId ? store.campaigns.find(c => c.id === campaignId) : null;

  const nav = useCallback((s, cid) => {
    if (cid !== undefined) setCampaignId(cid);
    setScreen(s);
    document.querySelector('.scroll')?.scrollTo(0, 0);
  }, []);

  const switchRole = useCallback((r) => {
    setRole(r);
    setUser(WYR.users.find(u => u.role === r) || WYR.users[0]);
    if (r === 'manager' && ['new', 'ideas', 'images'].includes(screen)) setScreen('manager');
  }, [screen]);

  function onLogin(acct) {
    setRole(acct.role);
    setUser({ name: acct.name, email: acct.email, role: acct.role });
    setScreen(acct.role === 'manager' ? 'manager' : 'dashboard');
  }

  function openCampaign(c) {
    setCampaignId(c.id);
    nav(WYR.STAGE_NEXT[c.stage] || 'ideas', c.id);
  }

  // mutate helpers passed to flow screens
  const api = {
    updateCampaign(id, patch) {
      setStore(s => ({ ...s, campaigns: s.campaigns.map(c => c.id === id ? { ...c, ...patch } : c) }));
    },
    setIdeas(id, ideas) { setStore(s => ({ ...s, ideas: { ...s.ideas, [id]: ideas } })); },
    createCampaign(data) {
      const id = WYR.uid();
      const c = { id, stage: 'ideas_pending', created_at: new Date().toISOString(), publisher: user.name, ...data };
      setStore(s => ({ ...s, campaigns: [c, ...s.campaigns], ideas: { ...s.ideas, [id]: [] } }));
      return c;
    },
    openApproval(cid, type) {
      setCampaignId(cid);
      setApprovalType(type);
      setScreen('approval');
      document.querySelector('.scroll')?.scrollTo(0, 0);
    },
    submitApproval(decisions, type) {
      setStore(s => {
        const list = (s.ideas[campaignId] || []).map(i => {
          if (!decisions[i.id]) return i;
          if (type === 'ideas') return { ...i, approval_status: decisions[i.id] };
          return { ...i, story_status: decisions[i.id] };
        });
        const ideasState = { ...s.ideas, [campaignId]: list };
        let campaigns = s.campaigns;
        const approvedIdeas = list.filter(i => i.approval_status === 'approved');
        if (type === 'ideas' && list.length && list.every(i => i.approval_status === 'approved'))
          campaigns = campaigns.map(c => c.id === campaignId ? { ...c, stage: 'ideas_approved' } : c);
        if (type === 'stories' && approvedIdeas.length && approvedIdeas.every(i => i.story_status === 'approved'))
          campaigns = campaigns.map(c => c.id === campaignId ? { ...c, stage: 'stories_approved' } : c);
        return { ...s, ideas: ideasState, campaigns };
      });
    },
  };

  if (screen === 'login') return <Login onLogin={onLogin} />;
  if (screen === 'approval' && campaign) {
    return <Approval campaign={campaign} ideas={store.ideas[campaign.id] || []} type={approvalType}
      onSubmit={api.submitApproval} onBack={() => nav(WYR.STAGE_NEXT[campaign.stage] || 'dashboard', campaign.id)} />;
  }

  // Crumbs
  let crumbs = [{ label: 'WYR', onClick: () => nav('dashboard') }];
  const flowScreens = { ideas: 'Ideas', images: 'Images', stories: 'Stories', publish: 'Publish' };
  if (screen === 'dashboard') crumbs.push({ label: 'Dashboard' });
  else if (screen === 'new') crumbs.push({ label: 'Campaigns', onClick: () => nav('dashboard') }, { label: 'New' });
  else if (screen === 'manager') crumbs.push({ label: 'Manager Overview' });
  else if (screen === 'settings') crumbs.push({ label: 'Settings' });
  else if (screen === 'users') crumbs.push({ label: 'Admin', onClick: () => nav('dashboard') }, { label: 'Users' });
  else if (flowScreens[screen] && campaign) crumbs.push(
    { label: 'Campaigns', onClick: () => nav('dashboard') },
    { label: campaign.theme, onClick: () => openCampaign(campaign) },
    { label: flowScreens[screen] });

  const ideas = campaign ? (store.ideas[campaign.id] || []) : [];

  let body;
  switch (screen) {
    case 'dashboard': body = <Dashboard store={store} nav={nav} openCampaign={openCampaign} />; break;
    case 'new': body = <NewCampaign api={api} nav={nav} setActive={(c) => { setCampaignId(c.id); }} />; break;
    case 'ideas': body = <Ideas campaign={campaign} ideas={ideas} api={api} nav={nav} role={role} />; break;
    case 'images': body = <Images campaign={campaign} ideas={ideas} api={api} nav={nav} />; break;
    case 'stories': body = <Stories campaign={campaign} ideas={ideas} api={api} nav={nav} role={role} />; break;
    case 'publish': body = <Publish campaign={campaign} ideas={ideas} api={api} nav={nav} />; break;
    case 'manager': body = <Manager nav={nav} openCampaign={openCampaign} store={store} />; break;
    case 'settings': body = <Settings role={role} user={user} />; break;
    case 'users': body = <AdminUsers />; break;
    default: body = <Placeholder name={screen} />;
  }

  return (
    <AppShell screen={screen} role={role} campaign={flowScreens[screen] ? campaign : null}
      nav={nav} user={user} crumbs={crumbs} switchRole={switchRole}>
      {body}
    </AppShell>
  );
}

// Fallbacks so the app mounts before every screen module is loaded
['NewCampaign', 'Ideas', 'Images', 'Stories', 'Publish', 'Manager', 'Settings', 'AdminUsers', 'Approval'].forEach(n => {
  if (!window[n]) window[n] = () => <Placeholder name={n} />;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <ToastHost><App /></ToastHost>
);
