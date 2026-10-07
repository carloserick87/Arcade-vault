export interface User {
  name: string;
}

export interface SavedScore {
  game: string;
  score: number;
  name: string;
  at: number;
}

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

export function loadUser(): User | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveUser(u: User | null): void {
  try {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  } catch {}
}

export function loadScores(): SavedScore[] {
  try {
    const all = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
    return Array.isArray(all) ? all : [];
  } catch {
    return [];
  }
}

export function addScore(s: Omit<SavedScore, "at">): void {
  try {
    const all = loadScores();
    all.push({ ...s, at: Date.now() });
    localStorage.setItem(SCORES_KEY, JSON.stringify(all));
  } catch {}
}

export function bestScore(game: string, name: string): SavedScore | null {
  return loadScores()
    .filter((s) => s.game === game && s.name === name)
    .reduce<SavedScore | null>((best, s) => (!best || s.score > best.score ? s : best), null);
}
