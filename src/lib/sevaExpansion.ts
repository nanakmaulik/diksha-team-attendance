export const SEVA_TEAMS = {
  "main-gali": { title: "Main Gali — Management & Entry", pinKey: "MAIN_GALI_ADMIN_PIN" },
  "enquiry": { title: "Enquiry Counter", pinKey: "ENQUIRY_ADMIN_PIN" },
  "main-gate": { title: "Main Gate", pinKey: "MAIN_GATE_ADMIN_PIN" },
  "jeev-gali": { title: "Jeev Gali", pinKey: "JEEV_GALI_ADMIN_PIN" },
} as const;

export type TeamSlug = keyof typeof SEVA_TEAMS;
export function isTeamSlug(input: string): input is TeamSlug {
  return Object.prototype.hasOwnProperty.call(SEVA_TEAMS, input);
}
export function indiaDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function getPin(slug: TeamSlug) {
  return process.env[SEVA_TEAMS[slug].pinKey] || "";
}
export function validPin(slug: TeamSlug, value: string | null) {
  const expected = getPin(slug);
  if (!expected || !value) return false;
  // Constant-time comparison for same-length values.
  const a = new TextEncoder().encode(expected);
  const b = new TextEncoder().encode(value);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
export function timeLabel(s: string) {
  const [h, m] = s.slice(0,5).split(":").map(Number);
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2,"0")} ${h < 12 ? "AM" : "PM"}`;
}
