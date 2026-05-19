// Vercel serverless function: /api/parse-syllabus
// Receives extracted PDF text, asks Claude to structure it into items.

const SYSTEM_PROMPT = `You extract academic tasks from course syllabi.

You will receive the raw text of a syllabus. Return ONLY a JSON array (no prose, no markdown fences) of every concrete task with a due date or scheduled date.

For each item return an object with these fields:
- "type": one of "assignment" | "quiz" | "popquiz" | "exam" | "midsem" | "final" | "reading" | "project" | "lab" | "paper" | "presentation" | "other"
- "title": short clear title (e.g. "Problem Set 3", "Quiz 2 — Laplace transforms", "Midsem Exam", "Read Ch. 5 (pp. 80-110)", "Final project proposal")
- "dueDate": ISO format YYYY-MM-DD. If only month/day is given (e.g. "May 30"), assume year 2026. If only a week number is given, leave dueDate as an empty string.
- "estHours": realistic hours to complete. Defaults if unsure: assignment 3, quiz 2, popquiz 1, exam 10, midsem 8, final 14, reading 1, project 6, lab 3, paper 5, presentation 3, other 2.
- "notes": brief context from the syllabus (1 line max, under 100 chars), or empty string.

Rules:
- Be CONSERVATIVE. Only include items that are clearly tasks. Skip lecture topics, office hours, week labels, page numbers, room numbers, phone numbers, grade percentages.
- Each reading before a class counts as a separate item with type "reading".
- A midterm/midsem is type "midsem", a final exam is type "final", regular tests are "exam".
- If two items share a date, return both.
- If no items are found, return [].
- Return ONLY the JSON array. No other text, no markdown.`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(503).json({
      error: 'no_api_key',
      message: 'ANTHROPIC_API_KEY not configured. See README for setup steps.',
    })
  }

  let text
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    text = body?.text
  } catch (e) {
    return res.status(400).json({ error: 'invalid_body' })
  }

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'missing_text' })
  }

  // Trim to a sane limit (most syllabi are well under 50K chars)
  const trimmed = text.slice(0, 50000)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Here is the syllabus text:\n\n"""\n${trimmed}\n"""\n\nReturn the JSON array now.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Anthropic API error:', response.status, errText)
      return res.status(502).json({
        error: 'api_error',
        status: response.status,
        message: errText.slice(0, 500),
      })
    }

    const data = await response.json()
    const rawText = data?.content?.[0]?.text || ''

    // Strip any markdown fences that snuck in
    let cleaned = rawText.trim()
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    // Find the first [ and last ] to be robust to surrounding text
    const firstBracket = cleaned.indexOf('[')
    const lastBracket = cleaned.lastIndexOf(']')
    if (firstBracket >= 0 && lastBracket > firstBracket) {
      cleaned = cleaned.slice(firstBracket, lastBracket + 1)
    }

    let items
    try {
      items = JSON.parse(cleaned)
    } catch (e) {
      console.error('Parse error:', e.message, 'Raw:', rawText.slice(0, 500))
      return res.status(500).json({
        error: 'parse_error',
        message: 'AI returned malformed JSON. Try again or use bulk paste.',
        raw: rawText.slice(0, 1000),
      })
    }

    if (!Array.isArray(items)) {
      return res.status(500).json({ error: 'parse_error', message: 'AI did not return an array.' })
    }

    // Light validation: ensure each item has the basics
    const validTypes = new Set(['assignment','quiz','popquiz','exam','midsem','final','reading','project','lab','paper','presentation','other'])
    const cleaned_items = items
      .filter(i => i && typeof i === 'object' && i.title)
      .map(i => ({
        type: validTypes.has(i.type) ? i.type : 'assignment',
        title: String(i.title).slice(0, 200),
        dueDate: typeof i.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(i.dueDate) ? i.dueDate : '',
        estHours: typeof i.estHours === 'number' && i.estHours >= 0 ? Math.min(40, i.estHours) : 2,
        notes: typeof i.notes === 'string' ? i.notes.slice(0, 200) : '',
      }))

    return res.status(200).json({
      items: cleaned_items,
      count: cleaned_items.length,
      usage: data.usage || null,
    })
  } catch (e) {
    console.error('Function error:', e)
    return res.status(500).json({ error: 'function_error', message: e.message })
  }
}
