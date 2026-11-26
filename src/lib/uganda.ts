// Curriculum-aligned configuration for the Ugandan education system.
// Levels follow the structure used by NCDC / UNEB.

export type Level = {
  id: string;
  label: string;
  short: string;
  exam: string;
  color: string;
};

export const LEVELS: Level[] = [
  { id: "pre-primary", label: "Pre-Primary (Nursery)", short: "Nursery", exam: "—", color: "#f59e0b" },
  { id: "primary", label: "Primary", short: "Primary", exam: "PLE", color: "#16a34a" },
  { id: "o-level", label: "Lower Secondary (O-Level)", short: "O-Level", exam: "UCE", color: "#0ea5e9" },
  { id: "a-level", label: "Upper Secondary (A-Level)", short: "A-Level", exam: "UACE", color: "#8b5cf6" },
  { id: "btvet", label: "BTVET / Vocational", short: "BTVET", exam: "UBTEB / DIT", color: "#ef4444" },
  { id: "university", label: "Tertiary / University", short: "University", exam: "—", color: "#0d9488" },
];

export function getLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export type Subject = { id: string; label: string; icon: string; group: string };

export const SUBJECTS: Subject[] = [
  { id: "mathematics", label: "Mathematics", icon: "📐", group: "Core Sciences" },
  { id: "english", label: "English Language", icon: "🔤", group: "Languages" },
  { id: "physics", label: "Physics", icon: "⚛️", group: "Core Sciences" },
  { id: "chemistry", label: "Chemistry", icon: "🧪", group: "Core Sciences" },
  { id: "biology", label: "Biology", icon: "🌱", group: "Core Sciences" },
  { id: "computer-studies", label: "Computer Studies / ICT", icon: "💻", group: "Core Sciences" },
  { id: "social-studies", label: "Social Studies", icon: "🗺️", group: "Humanities" },
  { id: "history", label: "History & Political Education", icon: "🏛️", group: "Humanities" },
  { id: "geography", label: "Geography", icon: "🌍", group: "Humanities" },
  { id: "economics", label: "Economics", icon: "📊", group: "Humanities" },
  { id: "entrepreneurship", label: "Entrepreneurship", icon: "💡", group: "Humanities" },
  { id: "literature", label: "Literature in English", icon: "📚", group: "Languages" },
  { id: "religious-education", label: "Religious Education (CRE/IRE)", icon: "🕌", group: "Humanities" },
  { id: "luganda", label: "Luganda", icon: "🗣️", group: "Local Languages" },
  { id: "runyankole", label: "Runyankole", icon: "🗣️", group: "Local Languages" },
  { id: "luo", label: "Luo", icon: "🗣️", group: "Local Languages" },
  { id: "general-paper", label: "General Paper", icon: "📰", group: "Humanities" },
  { id: "accounting", label: "Accounting / Commerce", icon: "🧮", group: "Humanities" },
  { id: "agriculture", label: "Agriculture", icon: "🌾", group: "Vocational" },
  { id: "technical-drawing", label: "Technical Drawing", icon: "✏️", group: "Vocational" },
  { id: "other", label: "Other", icon: "📁", group: "Other" },
];

export function getSubject(id: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id);
}

export const NETWORKS = [
  { id: "mtn", label: "MTN Mobile Money", color: "#ffcc00" },
  { id: "airtel", label: "Airtel Money", color: "#e11d2a" },
];
