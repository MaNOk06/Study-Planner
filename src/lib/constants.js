// Course definitions
export const COURSES = {
  DE:  { name: 'Differential Equations', short: 'DE',  bg: '#1E40AF', light: '#DBEAFE', tint: '#EFF6FF' },
  CE:  { name: 'Circuits & Electronics', short: 'CE',  bg: '#C2410C', light: '#FED7AA', tint: '#FFF7ED' },
  MS:  { name: 'Material Science',       short: 'MS',  bg: '#6D28D9', light: '#E9D5FF', tint: '#FAF5FF' },
  AP:  { name: 'Applied Programming',    short: 'AP',  bg: '#047857', light: '#A7F3D0', tint: '#ECFDF5' },
  TM:  { name: 'Text & Meaning',         short: 'TM',  bg: '#BE185D', light: '#FBCFE8', tint: '#FDF2F8' },
  LS3: { name: 'Leadership Seminar III', short: 'LS3', bg: '#0F766E', light: '#99F6E4', tint: '#F0FDFA' },
  PERSONAL: { name: 'Personal', short: 'PERSONAL', bg: '#7C2D12', light: '#FED7AA', tint: '#FFF7ED' },
}

// Item categories (what the user selected: assignments, quizzes, readings, goals)
export const CATEGORIES = {
  assignment: { label: 'Assignment', icon: '✎', defaultHours: 3, weight: 6 },
  quiz:       { label: 'Quiz',       icon: '?', defaultHours: 2, weight: 8 },
  popquiz:    { label: 'Pop Quiz',   icon: '!', defaultHours: 1, weight: 5 },
  exam:       { label: 'Exam',       icon: '✪', defaultHours: 10, weight: 10 },
  midsem:     { label: 'Midsem',     icon: '◆', defaultHours: 8, weight: 9 },
  final:      { label: 'Final Exam', icon: '★', defaultHours: 14, weight: 12 },
  reading:    { label: 'Reading',    icon: '📖', defaultHours: 1, weight: 4 },
  project:    { label: 'Project',    icon: '⬢', defaultHours: 6, weight: 7 },
  lab:        { label: 'Lab Report', icon: '⚗', defaultHours: 3, weight: 6 },
  paper:      { label: 'Paper',      icon: '✑', defaultHours: 5, weight: 7 },
  presentation: { label: 'Presentation', icon: '◐', defaultHours: 3, weight: 6 },
  goal:       { label: 'Goal',       icon: '◉', defaultHours: 0, weight: 3 },
  habit:      { label: 'Habit',      icon: '⟳', defaultHours: 0, weight: 3 },
  other:      { label: 'Other',      icon: '·', defaultHours: 1, weight: 3 },
}

export const ACADEMIC_CATEGORIES = ['assignment','quiz','popquiz','exam','midsem','final','reading','project','lab','paper','presentation','other']
export const PERSONAL_CATEGORIES = ['goal','habit']

// Theme colors
export const C = {
  NAVY: '#1E3A5F',
  GOLD: '#B08A3E',
  CREAM: '#FAF6EE',
  PAPER: '#F7F4ED',
  RED: '#B91C1C',
  ORANGE: '#C2410C',
  GREEN: '#15803D',
  TEXT: '#1A1A1A',
  MUTED: '#6B6155',
  BORDER: '#E5DCC5',
  TINT: '#F5EFE0',
}
