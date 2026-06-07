/* ============================================================
   WYR — Mock data + stage helpers  (plain JS, attaches to window)
   ============================================================ */
(function () {
  // Pipeline stage machine -------------------------------------------------
  const STAGE = {
    ideas_pending:    { label: 'Ideas Pending',    step: 1, kind: 'pending'  },
    ideas_approved:   { label: 'Ideas Approved',   step: 2, kind: 'progress' },
    images_pending:   { label: 'Images Pending',   step: 2, kind: 'pending'  },
    images_approved:  { label: 'Images Ready',     step: 3, kind: 'progress' },
    stories_pending:  { label: 'Stories Pending',  step: 3, kind: 'pending'  },
    stories_approved: { label: 'Stories Approved', step: 4, kind: 'progress' },
    posted:           { label: 'Posted',           step: 5, kind: 'posted'   },
  };
  const PIPE_STEPS = ['Theme', 'Ideas', 'Images', 'Stories', 'Posted'];

  // which screen a campaign's "continue" should land on
  const STAGE_NEXT = {
    ideas_pending: 'ideas', ideas_approved: 'images',
    images_pending: 'images', images_approved: 'stories',
    stories_pending: 'stories', stories_approved: 'publish',
    posted: 'publish',
  };

  const img = (seed) => `https://picsum.photos/seed/${seed}/600/600`;

  // Ideas pool per theme ---------------------------------------------------
  const IDEAS = {
    travel: [
      { a: 'Backpack across Asia for a year', b: 'Five-star resort for one week' },
      { a: 'Window seat, no recline', b: 'Aisle seat, full recline' },
      { a: 'Spontaneous one-way ticket', b: 'A planned itinerary' },
      { a: 'Mountains every trip', b: 'Beaches every trip' },
      { a: 'Travel solo forever', b: 'Always travel with a group' },
    ],
    food: [
      { a: 'Never eat dessert again', b: 'Never eat pizza again' },
      { a: 'Cook every meal yourself', b: 'Order delivery forever' },
      { a: 'Sweet breakfast every day', b: 'Savory breakfast every day' },
      { a: 'Unlimited tacos, no drinks', b: 'Unlimited drinks, no tacos' },
      { a: 'Eat only spicy food', b: 'Eat only bland food' },
    ],
    career: [
      { a: 'Dream job, average pay', b: 'Boring job, huge salary' },
      { a: 'Work fully remote forever', b: 'Corner office in the city' },
      { a: 'Famous in your field', b: 'Quietly wealthy' },
      { a: 'Four-day week, less pay', b: 'Six-day week, double pay' },
      { a: 'A brilliant boss', b: 'A brilliant team' },
    ],
    tech: [
      { a: 'No phone for a month', b: 'No laptop for a month' },
      { a: 'Read minds for a day', b: 'Be invisible for a day' },
      { a: 'Always 5% battery', b: 'Always buffering at 99%' },
      { a: 'Living in a smart home', b: 'Going fully off-grid' },
      { a: 'Self-driving everywhere', b: 'Flying car, you steer' },
    ],
    relationships: [
      { a: 'Always know the truth', b: 'Always stay blissfully unaware' },
      { a: 'A best friend who moves away', b: 'Ten friends you rarely see' },
      { a: 'Text only for a year', b: 'Call only for a year' },
      { a: 'Marry your first love', b: 'Meet someone new every year' },
      { a: 'Forgive and forget', b: 'Remember everything' },
    ],
  };

  function ideaSet(theme) {
    const key = (theme || '').toLowerCase();
    for (const k of Object.keys(IDEAS)) if (key.includes(k)) return IDEAS[k];
    // generic fallback built from theme word
    const t = theme || 'this';
    return [
      { a: `Go all-in on ${t}`, b: `Play it safe with ${t}` },
      { a: `Master ${t} slowly`, b: `Fake ${t} instantly` },
      { a: `${t}, but expensive`, b: `${t}, but exhausting` },
      { a: `Too much ${t}`, b: `Never enough ${t}` },
      { a: `${t} alone`, b: `${t} with everyone` },
    ];
  }

  let _id = 100;
  const uid = () => 'c' + (++_id);

  function makeIdeas(campaignId, theme, statuses) {
    const set = ideaSet(theme);
    return set.map((s, i) => ({
      id: campaignId + '_i' + i,
      option_a: s.a, option_b: s.b,
      approval_status: statuses ? statuses[i] : 'draft',  // draft | pending | approved | rejected
      sent: false,
      story_status: undefined,    // undefined | pending | approved | rejected
      story_ready: false,
      imageA: null, imageB: null,
    }));
  }

  // Seed campaigns ---------------------------------------------------------
  const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

  const campaigns = [
    { id: 'cmp_travel', theme: 'Travel adventures', tone: 'fun', audience: 'gen-z',
      stage: 'stories_pending', created_at: daysAgo(1), publisher: 'Mara Ellison' },
    { id: 'cmp_food', theme: 'Food preferences', tone: 'controversial', audience: 'general',
      stage: 'ideas_pending', created_at: daysAgo(0), publisher: 'Mara Ellison' },
    { id: 'cmp_career', theme: 'Career choices', tone: 'thought-provoking', audience: 'professionals',
      stage: 'images_pending', created_at: daysAgo(2), publisher: 'Devin Osei' },
    { id: 'cmp_tech', theme: 'Tech & the future', tone: 'fun', audience: 'gen-z',
      stage: 'posted', created_at: daysAgo(5), publisher: 'Mara Ellison' },
    { id: 'cmp_rel', theme: 'Relationships', tone: 'thought-provoking', audience: 'general',
      stage: 'ideas_approved', created_at: daysAgo(3), publisher: 'Devin Osei' },
    { id: 'cmp_money', theme: 'Money & success', tone: 'controversial', audience: 'professionals',
      stage: 'posted', created_at: daysAgo(9), publisher: 'Mara Ellison' },
  ];

  // Per-campaign idea state -----------------------------------------------
  const ideaStatusByStage = {
    ideas_pending:    ['approved','pending','approved','draft','draft'],
    ideas_approved:   ['approved','approved','approved','approved','approved'],
    images_pending:   ['approved','approved','approved','approved','approved'],
    images_approved:  ['approved','approved','approved','approved','approved'],
    stories_pending:  ['approved','approved','approved','approved','approved'],
    stories_approved: ['approved','approved','approved','approved','approved'],
    posted:           ['approved','approved','approved','approved','approved'],
  };

  const ideasByCampaign = {};
  campaigns.forEach((c) => {
    const ideas = makeIdeas(c.id, c.theme, ideaStatusByStage[c.stage]);
    const st = c.stage;
    // attach images + story status depending on stage progression
    ideas.forEach((idea, i) => {
      if (['images_approved','stories_pending','stories_approved','posted'].includes(st)) {
        idea.imageA = img(idea.id + '-a');
        idea.imageB = img(idea.id + '-b');
      }
      if (st === 'stories_pending') { idea.story_ready = true; idea.story_status = 'pending'; if (i === 0) idea.story_status = 'approved'; }
      if (st === 'stories_approved' || st === 'posted') { idea.story_ready = true; idea.story_status = 'approved'; }
      if (st === 'ideas_pending') { idea.sent = idea.approval_status !== 'draft'; }
      else idea.sent = true;
    });
    ideasByCampaign[c.id] = ideas;
  });

  // Publishers (for manager view) -----------------------------------------
  const publishers = [
    { id: 'p1', name: 'Mara Ellison',  email: 'mara@studio.co',  total: 4, pending: 2, in_progress: 1, posted: 2 },
    { id: 'p2', name: 'Devin Osei',    email: 'devin@studio.co', total: 2, pending: 1, in_progress: 1, posted: 0 },
    { id: 'p3', name: 'Priya Nair',    email: 'priya@studio.co', total: 3, pending: 0, in_progress: 1, posted: 2 },
  ];

  const users = [
    { id: 'u1', name: 'Alex Rivera',  email: 'alex@studio.co',  role: 'admin',     active: daysAgo(0) },
    { id: 'u2', name: 'Mara Ellison', email: 'mara@studio.co',  role: 'publisher', active: daysAgo(0) },
    { id: 'u3', name: 'Devin Osei',   email: 'devin@studio.co', role: 'publisher', active: daysAgo(1) },
    { id: 'u4', name: 'Priya Nair',   email: 'priya@studio.co', role: 'publisher', active: daysAgo(2) },
    { id: 'u5', name: 'Sam Cho',      email: 'sam@studio.co',   role: 'manager',   active: daysAgo(0) },
  ];

  const EXAMPLE_THEMES = ['Travel', 'Food', 'Career', 'Tech', 'Relationships', 'Fitness', 'Money'];
  const TONES = ['fun', 'thought-provoking', 'controversial'];
  const AUDIENCES = ['general', 'gen-z', 'professionals'];

  function imageResults(seed, n) {
    return Array.from({ length: n || 9 }, (_, i) => ({
      id: seed + '-' + i,
      url: `https://picsum.photos/seed/${seed}-${i}/400/400`,
    }));
  }

  function fmtDate(iso) {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso));
  }
  function audienceLabel(a) { return a === 'gen-z' ? 'Gen Z' : a.charAt(0).toUpperCase() + a.slice(1); }

  window.WYR = {
    STAGE, PIPE_STEPS, STAGE_NEXT,
    campaigns, ideasByCampaign, publishers, users,
    EXAMPLE_THEMES, TONES, AUDIENCES,
    ideaSet, makeIdeas, imageResults, img, uid, fmtDate, audienceLabel,
  };
})();
