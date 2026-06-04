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
): Promise<Array<{ option_a: string; option_b: string }>> {
  const text = await chat(
    `You are a creative social media content strategist specializing in viral "Would You Rather" content.

Generate exactly 5 unique and engaging "Would You Rather" questions based on:
- Theme: ${theme}
- Tone: ${tone}
- Target Audience: ${audience}

Rules:
- Each question should present two genuinely difficult choices (not obvious)
- Keep each option concise (max 8 words per option)
- Make them thought-provoking and likely to spark debate
- Avoid offensive or harmful content
- Make them relevant for Instagram Stories

Respond ONLY with a valid JSON array, no markdown, no explanation:
[
  {"option_a": "...", "option_b": "..."},
  {"option_a": "...", "option_b": "..."},
  {"option_a": "...", "option_b": "..."},
  {"option_a": "...", "option_b": "..."},
  {"option_a": "...", "option_b": "..."}
]`,
    1024
  )

  // Strip possible markdown code fences
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

Generate a short, specific Google Images search query for EACH option that will find a visually striking, contextually relevant photo.

Rules:
- 2-5 words per query
- Focus on the visual subject, not the abstract concept
- Use concrete nouns (e.g. "gourmet restaurant meal" not "eating out experience")
- Avoid negative words like "never", "without", "no"

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
): Promise<{ option_a: string; option_b: string }> {
  const text = await chat(
    `Generate ONE unique "Would You Rather" question for theme: ${theme}, tone: ${tone}, audience: ${audience}.
Respond ONLY with valid JSON (no markdown): {"option_a": "...", "option_b": "..."}`,
    256
  )
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}
