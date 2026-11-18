/**
 * LLM Daily Request Cap Tracker
 * Enforces global daily quota via LLM_DAILY_CAP env var to prevent surprise bills.
 * When daily cap is reached, the application automatically uses the deterministic rules parser.
 */

interface DailyUsageState {
  date: string;
  count: number;
}

let state: DailyUsageState = {
  date: new Date().toISOString().slice(0, 10),
  count: 0,
};

function ensureCurrentDay(): void {
  const today = new Date().toISOString().slice(0, 10);
  if (state.date !== today) {
    state = { date: today, count: 0 };
  }
}

export function canMakeLlmCall(): boolean {
  ensureCurrentDay();
  const cap = parseInt(process.env.LLM_DAILY_CAP || "500", 10);
  return state.count < cap;
}

export function recordLlmCall(): void {
  ensureCurrentDay();
  state.count += 1;
}

export function getDailyLlmUsage(): { date: string; count: number; cap: number; remaining: number } {
  ensureCurrentDay();
  const cap = parseInt(process.env.LLM_DAILY_CAP || "500", 10);
  return {
    date: state.date,
    count: state.count,
    cap,
    remaining: Math.max(0, cap - state.count),
  };
}

export function setDailyLlmUsageForTest(count: number): void {
  ensureCurrentDay();
  state.count = count;
}

export function resetDailyLlmUsageForTest(): void {
  state = {
    date: new Date().toISOString().slice(0, 10),
    count: 0,
  };
}
