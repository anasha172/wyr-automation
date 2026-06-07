/* ============================================================
   WYR — Campaign flow header (used by ideas/images/stories/publish)
   ============================================================ */

function FlowHeader({ campaign, current }) {
  return (
    <div style={{ borderBottom: '1px solid var(--hair)', padding: '22px 40px 22px', background: 'color-mix(in oklab, var(--paper) 70%, white)' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <Eyebrow num={['ideas', 'images', 'stories', 'publish'].indexOf(current) + 2 + ''}>
          {current} · {campaign.tone} · {WYR.audienceLabel(campaign.audience)}
        </Eyebrow>
        <StagePill stage={campaign.stage} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <h1 className="serif" style={{ fontSize: 38, fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1.05, display: 'inline-block', marginRight: 14, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>{campaign.theme}</h1>
        <span className="pill" style={{ verticalAlign: 'middle' }}><span style={{ display: 'flex', color: 'var(--a)' }}><Icon name="instagram" size={13} /></span>Instagram Story</span>
      </div>
      <Pipeline stage={campaign.stage} />
    </div>
  );
}

/* Section heading used inside flow pages */
function SectionHead({ num, kicker, title, right }) {
  return (
    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', margin: '4px 0 18px' }}>
      <div>
        <Eyebrow num={num}>{kicker}</Eyebrow>
        {title && <h2 className="serif" style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 8 }}>{title}</h2>}
      </div>
      {right}
    </div>
  );
}

Object.assign(window, { FlowHeader, SectionHead });
