// Uses OpenRouter with Claude model — OpenAI-compatible endpoint, no extra SDK needed.

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'
const MODEL = 'anthropic/claude-sonnet-4-5'

async function chat(prompt: string, maxTokens = 1024): Promise<string> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      'X-Title': 'WYR Automation',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenRouter error ${res.status}: ${err}`)
  }

  const data = await res.json()
  return data.choices[0]?.message?.content ?? ''
}

export async function generateWYRIdeas(
  theme: string,
  tone: string,
  audience: string
): Promise<Array<{ title: string; option_a: string; option_b: string; why_it_works: string }>> {
  const text = await chat(
    `You are a creative social media content strategist specializing in viral "Would You Rather" content.

Generate exactly 5 unique and engaging "Would You Rather" questions based on:
- Theme: ${theme}
- Tone: ${tone}
- Target Audience: ${audience}

Rules:
- Each question must have a punchy title (3-6 words, title case, no punctuation)
- Each option should be a compelling, concrete scenario (max 12 words)
- Make choices genuinely difficult — no obvious winner
- why_it_works: 1 short sentence explaining why this resonates with the target audience
- Avoid offensive or harmful content
- Make them shareable and debate-worthy for Instagram Stories

Respond ONLY with a valid JSON array, no markdown, no explanation:
[
  {
    "title": "...",
    "option_a": "...",
    "option_b": "...",
    "why_it_works": "..."
  }
]`,
    1500
  )

  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export async function generateImageSearchQueries(
  optionA: string,
  optionB: string,
  theme: string
): Promise<{ queryA: string; queryB: string }> {
  const text = await chat(
    `You are an expert at finding the perfect stock photo for social media content.

Given these two "Would You Rather" options from the theme "${theme}":
- Option A: "${optionA}"
- Option B: "${optionB}"

Generate a SHORT Unsplash stock photo search query for EACH option that will return many results.

Rules:
- 1-3 words ONLY — shorter is better (e.g. "mars planet", "earth space", "moon surface")
- Use broad, common subject nouns — NOT specific descriptive phrases
- Think: what single object or scene captures this visually?
- Unsplash works best with simple terms like "astronaut", "galaxy", "rocket launch"
- Avoid multi-word phrases longer than 3 words, they return 0 results

Respond ONLY with valid JSON (no markdown):
{"queryA": "...", "queryB": "..."}`,
    256
  )
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

export async function regenerateSingleIdea(
  theme: string,
  tone: string,
  audience: string
): Promise<{ title: string; option_a: string; option_b: string; why_it_works: string }> {
  const text = await chat(
    `Generate ONE unique "Would You Rather" question for theme: ${theme}, tone: ${tone}, audience: ${audience}.
Include a punchy title (3-6 words), two options (max 12 words each), and a why_it_works sentence.
Respond ONLY with valid JSON (no markdown): {"title": "...", "option_a": "...", "option_b": "...", "why_it_works": "..."}`,
    400
  )
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}
