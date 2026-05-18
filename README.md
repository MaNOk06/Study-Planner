# Martha's Academic Planner

A personal planner for tracking assignments, quizzes, readings, and goals. Built mobile-first, deployable to Vercel.

---

## What it does

- **Today** — Shows the top 3-5 things to focus on, with a "Start here" pick and a one-line reason. Stats banner shows hours outstanding and items behind start.
- **Week** — All items by day, Monday to Sunday, with prev/next week navigation.
- **All** — Filter by Active / This week / All / Done, and by course.
- **Goals** — Daily habits with streak tracking + bigger personal goals.
- **PDF import** — Upload a syllabus, the app scans for dates and item types, and you confirm what to add.
- **Bulk paste** — Paste items in `COURSE | Title | YYYY-MM-DD | hours | type` format.
- **Backup / restore** — Download your data as JSON, restore it on another device.

## What it doesn't do (yet)

- No cloud sync. Your data lives in this browser. Use the Backup button in Settings to save a JSON file.
- No login. It's just you, on this device.
- Notifications work while the app/PWA is opened (no background push). Adding it to your home screen helps a lot.

---

## Run it locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Refresh after edits.

To build for production:
```bash
npm run build
```

Output ends up in `dist/`.

---

## Deploy to Vercel

### Option A — Drag & drop (easiest, no GitHub needed)

1. Run `npm install && npm run build` locally.
2. Go to [vercel.com/new](https://vercel.com/new), drag the `dist/` folder into the upload area.
3. Done. Vercel gives you a URL.

### Option B — Push to GitHub, then Vercel import

1. Push this folder to a GitHub repo.
2. Go to [vercel.com/new](https://vercel.com/new), pick **Import Git Repository**, select your repo.
3. Vercel auto-detects Vite. No environment variables needed. Click **Deploy**.
4. Future commits to `main` auto-deploy.

### Option C — Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow prompts. First deploy creates the project. Subsequent `vercel --prod` ships updates.

**No env keys, no database, no Supabase needed.** Static site, period.

---

## Install on your phone (PWA)

Open the deployed URL on your phone, then:

- **iPhone (Safari):** Tap Share → **Add to Home Screen**.
- **Android (Chrome):** Tap the three-dot menu → **Install app** (or "Add to Home Screen").

You'll get an app icon. Open it like any other app. Notifications work better in this mode.

---

## Quick usage tips

### First-day setup

1. Open the app → tap **+** → **PDF** tab → upload one syllabus.
2. The review screen will show ~5-20 detected items. Uncheck anything that isn't a real task (e.g., room numbers that look like dates). Adjust course/type/hours inline if needed. Tap **Add N items**.
3. Repeat for each course.
4. Go to **Goals** → add habits (e.g., "Morning quiet time", "Volleyball").

### Bulk paste format (faster than one-by-one)

```
DE | Problem Set 1 | 2026-05-30 | 4 | assignment
DE | Quiz 1 | 2026-06-05 | 2 | quiz
CE | Lab 1 | 2026-06-02 | 3 | lab
MS | Midsem | 2026-06-25 | 12 | midsem
```

Courses: `DE`, `CE`, `MS`, `AP`, `TM`, `LS2`
Types: `assignment`, `quiz`, `popquiz`, `midsem`, `final`, `exam`, `reading`, `lab`, `paper`, `project`, `presentation`, `other`

### How "latest start" works

The app estimates the **latest day you can start** a task to finish on time. Formula: `due date − ceil(hours / 1.5)`. So a 6-hour assignment due Friday should be started by Tuesday.

If you've missed your latest-start day and logged zero hours, the card glows red.

You can adjust **hours per day** in Settings (default 1.5h).

### Notifications

Toggle on in Settings → app will request browser permission. When you open the app each morning, you'll get a quick toast showing your top focus. (Background push requires more setup — this is foreground only for now.)

### Backup your data

Settings → **Backup** downloads a JSON file. Save it to Google Drive or email it to yourself. If your phone dies or you switch devices, you can **Restore** from that file.

---

## File structure

```
src/
├── App.jsx              # Top-level shell, bottom nav, modals
├── main.jsx             # Entry point
├── index.css            # Tailwind + base styles
├── lib/
│   ├── constants.js     # Courses, item categories, colors
│   ├── dates.js         # Date helpers (parsing, formatting, start-by calc)
│   ├── focus.js         # Focus scoring engine
│   ├── store.jsx        # localStorage-backed React context
│   ├── pdfParser.js     # PDF text extraction + item detection
│   └── notifications.js # Browser Notifications API wrapper
├── components/
│   ├── Shared.jsx       # Buttons, badges, modal shell, etc.
│   ├── ItemCard.jsx     # The main item card
│   ├── ItemForm.jsx     # Add/edit modal (single + bulk tabs)
│   └── PdfImport.jsx    # PDF upload → review → import flow
└── pages/
    ├── Today.jsx
    ├── Week.jsx
    ├── AllItems.jsx
    ├── Goals.jsx
    └── Settings.jsx
```

---

## If you ever want cloud sync (v2)

Right now data is device-bound. To add cross-device sync without adding logins, you'd:

1. Create a Supabase project.
2. Generate a UUID once, store it in localStorage, use it as a `device_id` column on a `items` table.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars in Vercel.
4. Swap the localStorage calls in `src/lib/store.jsx` for Supabase queries scoped to that `device_id`.

Not needed for v1. Backup/restore solves the device-switch problem just fine.

---

Built fast, designed slow. Stay ahead. 🙏
