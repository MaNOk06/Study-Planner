// PDF parsing with pdfjs-dist + heuristic item detection
import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { CATEGORIES } from './constants'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

/**
 * Extract all text from a PDF file (File object).
 * Returns a single string of all text content.
 */
export async function extractTextFromPDF(file) {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  let fullText = ''
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map(it => it.str).join(' ')
    fullText += '\n' + pageText
  }
  return fullText
}

// Month names → numbers (English, both full and abbreviated)
const MONTHS = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
}

/**
 * Parse a date string and return ISO YYYY-MM-DD.
 * Handles many common formats found in syllabi.
 * Year defaults to current year if not specified.
 */
function parseDateString(dateStr) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const text = dateStr.trim()

  // ISO: 2026-05-30
  let m = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) {
    const [, y, mo, d] = m
    return `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`
  }

  // 30/05/2026 or 5/30/26 (assume DD/MM/YYYY since user is in Ghana)
  m = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/)
  if (m) {
    let [, d, mo, y] = m
    if (y.length === 2) y = '20' + y
    return `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`
  }

  // "May 30", "May 30, 2026", "30 May", "30 May 2026"
  // Match: 30 May 2026
  m = text.match(/(\d{1,2})\s+([A-Za-z]+)(?:[, ]+(\d{4}))?/)
  if (m) {
    const [, d, monName, y] = m
    const mo = MONTHS[monName.toLowerCase()]
    if (mo) {
      const year = y ? parseInt(y) : currentYear
      return `${year}-${String(mo).padStart(2,'0')}-${d.padStart(2,'0')}`
    }
  }

  // Match: May 30 (no year)
  m = text.match(/([A-Za-z]+)\s+(\d{1,2})(?:[a-z]{2})?(?:[, ]+(\d{4}))?/)
  if (m) {
    const [, monName, d, y] = m
    const mo = MONTHS[monName.toLowerCase()]
    if (mo) {
      const year = y ? parseInt(y) : currentYear
      return `${year}-${String(mo).padStart(2,'0')}-${d.padStart(2,'0')}`
    }
  }

  return null
}

// Find all date-like substrings + their positions
function findDateOccurrences(text) {
  const patterns = [
    /\b\d{4}-\d{1,2}-\d{1,2}\b/g,
    /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g,
    /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)(?:\s+\d{4})?\b/gi,
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+\d{1,2}(?:st|nd|rd|th)?(?:[, ]+\d{4})?\b/gi,
  ]
  const found = []
  for (const re of patterns) {
    let m
    while ((m = re.exec(text)) !== null) {
      found.push({ raw: m[0], index: m.index })
    }
  }
  // De-duplicate by index proximity
  found.sort((a, b) => a.index - b.index)
  const dedup = []
  for (const f of found) {
    if (!dedup.find(d => Math.abs(d.index - f.index) < 5)) dedup.push(f)
  }
  return dedup
}

// Keyword → category mapping
const TYPE_KEYWORDS = [
  { kw: /\b(final\s*exam|final\s*examination)\b/i, type: 'final' },
  { kw: /\b(mid[-\s]*sem|midterm|mid[-\s]*term)\b/i, type: 'midsem' },
  { kw: /\b(pop\s*quiz)\b/i, type: 'popquiz' },
  { kw: /\b(quiz|quizzes)\b/i, type: 'quiz' },
  { kw: /\b(exam|examination|test)\b/i, type: 'exam' },
  { kw: /\b(lab\s*report|laboratory\s*report|lab\b)\b/i, type: 'lab' },
  { kw: /\b(project|capstone)\b/i, type: 'project' },
  { kw: /\b(paper|essay|term\s*paper)\b/i, type: 'paper' },
  { kw: /\b(presentation|present\b)\b/i, type: 'presentation' },
  { kw: /\b(reading|read\s+chapter|read\s+pages|textbook)\b/i, type: 'reading' },
  { kw: /\b(problem\s*set|assignment|homework|hw\b|due\b)/i, type: 'assignment' },
]

function detectType(context) {
  for (const t of TYPE_KEYWORDS) {
    if (t.kw.test(context)) return t.type
  }
  return null
}

// Extract a clean title from context surrounding a date
function extractTitle(context, dateRaw) {
  // Try to find common title patterns
  let txt = context.replace(dateRaw, '').trim()

  // Look for "Assignment N", "Quiz N", "Lab N", "Problem Set N", etc.
  const titleMatch = txt.match(/(Assignment\s*\d+|Quiz\s*\d+|Lab(?:\s*Report)?\s*\d+|Problem\s*Set\s*\d+|Project\s*\d*|Paper\s*\d*|Midsem|Mid[-\s]*term|Final\s*Exam|Pop\s*Quiz|Reading[\s\S]{0,80}?(?=[.;,]|\bdue\b)|Chapter\s*\d+)/i)
  if (titleMatch) return titleMatch[0].trim().replace(/\s+/g, ' ')

  // Fallback: short phrase before the date
  const before = txt.split(/[.;:|]/)[0] || ''
  const clean = before.replace(/\s+/g, ' ').trim()
  if (clean.length > 8 && clean.length < 80) return clean

  // Last resort
  return txt.split(/\s+/).slice(0, 8).join(' ') || 'Untitled item'
}

/**
 * Parse a PDF text blob into candidate items.
 * Returns an array of { rawDate, isoDate, title, type, context }
 */
export function findCandidatesInText(text) {
  // Normalize whitespace
  const clean = text.replace(/\s+/g, ' ')
  const occ = findDateOccurrences(clean)
  const candidates = []
  for (const o of occ) {
    const isoDate = parseDateString(o.raw)
    if (!isoDate) continue
    // Get context: 100 chars before, 60 chars after
    const start = Math.max(0, o.index - 120)
    const end = Math.min(clean.length, o.index + o.raw.length + 60)
    const context = clean.slice(start, end).trim()
    const type = detectType(context) || 'assignment'
    const title = extractTitle(context, o.raw)
    candidates.push({
      id: `cand_${o.index}`,
      rawDate: o.raw,
      isoDate,
      title,
      type,
      context,
      estHours: CATEGORIES[type]?.defaultHours || 2,
      course: null, // user must assign
      selected: true,
    })
  }
  // Deduplicate (same date + similar title)
  const out = []
  for (const c of candidates) {
    const dup = out.find(x => x.isoDate === c.isoDate && x.title.slice(0,20) === c.title.slice(0,20))
    if (!dup) out.push(c)
  }
  return out
}

/**
 * Full pipeline: PDF File → candidates
 */
export async function parseSyllabusPDF(file) {
  const text = await extractTextFromPDF(file)
  const candidates = findCandidatesInText(text)
  return { text, candidates }
}
