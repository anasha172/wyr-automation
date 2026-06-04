const CANVA_API_BASE = 'https://api.canva.com/rest/v1'

export async function createDesignFromTemplate(
  accessToken: string,
  templateId: string,
  imageAUrl: string,
  imageBUrl: string,
  textA: string,
  textB: string
): Promise<{ designId: string; editUrl: string }> {
  const res = await fetch(`${CANVA_API_BASE}/designs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      design_type: { type: 'preset', name: 'InstagramStory' },
      asset_id: templateId,
      title: 'WYR Story',
      autofill_data: {
        brand_template_id: templateId,
        data: [
          { name: 'image_a', type: 'image', asset_url: imageAUrl },
          { name: 'image_b', type: 'image', asset_url: imageBUrl },
          { name: 'text_a', type: 'text', text: textA },
          { name: 'text_b', type: 'text', text: textB },
        ],
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Canva create design error: ${err}`)
  }

  const data = await res.json()
  return {
    designId: data.design.id,
    editUrl: data.design.urls.edit_url,
  }
}

export async function exportCanvaDesign(
  accessToken: string,
  designId: string
): Promise<string> {
  // Start export
  const startRes = await fetch(`${CANVA_API_BASE}/exports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      design_id: designId,
      format: { type: 'png' },
    }),
  })

  if (!startRes.ok) throw new Error(`Canva export start error: ${startRes.status}`)

  const { job } = await startRes.json()
  const jobId = job.id

  // Poll for completion
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    const pollRes = await fetch(`${CANVA_API_BASE}/exports/${jobId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const pollData = await pollRes.json()

    if (pollData.job.status === 'success') {
      return pollData.job.urls[0]
    }
    if (pollData.job.status === 'failed') {
      throw new Error('Canva export failed')
    }
  }

  throw new Error('Canva export timed out')
}
