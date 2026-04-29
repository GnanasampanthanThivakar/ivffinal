export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function sanitizeNameInput(value) {
  return String(value || "").replace(/[^A-Za-z]/g, "");
}

export function isValidName(value) {
  return /^[A-Za-z]{2,30}$/.test(String(value || "").trim());
}

export function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function calculateAgeFromDob(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return "";

  const birthDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return "";

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    years -= 1;
  }

  return years >= 0 ? String(years) : "";
}

export function getAdultDobCutoffDate() {
  const today = new Date();
  return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
}

export function isAdultDob(value) {
  const dob = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false;

  const birthDate = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return false;

  return birthDate <= getAdultDobCutoffDate();
}

export function normalizeSriLankanPhone(value) {
  const cleaned = String(value || "").replace(/[^\d+]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("+94")) return cleaned.slice(0, 12);
  if (cleaned.startsWith("94")) return `+${cleaned.slice(0, 11)}`;
  if (cleaned.startsWith("0")) return cleaned.slice(0, 10);
  if (cleaned.startsWith("7")) return `+94${cleaned.slice(0, 9)}`;
  return cleaned.slice(0, 12);
}

export function isValidSriLankanPhone(value) {
  return /^(?:\+94|0)7\d{8}$/.test(String(value || "").trim());
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

export function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .replace(/[\s.-]+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
}

export function generateUsername(profileEmail, profileFirstName, profileLastName) {
  const nameBased = normalizeUsername(
    `${String(profileFirstName || "").trim()}_${String(profileLastName || "").trim()}`
  );
  if (nameBased.length >= 4) return nameBased;

  const emailPrefix = normalizeUsername((profileEmail || "").split("@")[0] || "");
  if (emailPrefix.length >= 4) return emailPrefix;

  return `user_${Math.random().toString(36).slice(2, 8)}`;
}

export function isValidFourDigitPin(value) {
  return /^\d{4}$/.test(String(value || "").trim());
}

export function isStrongPassword(value) {
  const password = String(value || "").trim();
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function emailPrefix(email) {
  return normalizeEmail(email).split("@")[0] || "momera";
}

export function buildFirebasePassword(email, secret) {
  const safeSecret = String(secret || "").trim();
  if (isStrongPassword(safeSecret)) return safeSecret;
  return `Momera_${safeSecret}_${emailPrefix(email)}`;
}

export function buildFirebasePasswordCandidates(email, secret) {
  const safeSecret = String(secret || "").trim();
  if (!safeSecret) return [];
  const candidates = [safeSecret];
  if (!isStrongPassword(safeSecret)) {
    candidates.push(`Momera_${safeSecret}_${emailPrefix(email)}`);
  }
  return [...new Set(candidates)];
}
