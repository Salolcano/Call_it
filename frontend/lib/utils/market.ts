import type { Market } from "../contracts/types";

const WEI = BigInt(10) ** BigInt(18);

/** Quote integers of 16+ digits before JSON.parse so wei amounts stay exact. */
export function parseMarkets(raw: unknown): Market[] {
  const text = typeof raw === "string" ? raw : JSON.stringify(raw ?? []);
  const safe = text.replace(/(:\s*)(\d{16,})/g, '$1"$2"');
  const list = JSON.parse(safe);
  if (!Array.isArray(list)) return [];
  const big = (v: unknown) => BigInt(String(v ?? 0));
  const bigMap = (o: Record<string, unknown> = {}) =>
    Object.fromEntries(Object.entries(o).map(([k, v]) => [k.toLowerCase(), big(v)]));
  return list
    .map((m: any) => ({
      ...m,
      yes_pool: big(m.yes_pool),
      no_pool: big(m.no_pool),
      yes_stakes: bigMap(m.yes_stakes),
      no_stakes: bigMap(m.no_stakes),
      claimed: Object.fromEntries(
        Object.entries(m.claimed ?? {}).map(([k, v]) => [k.toLowerCase(), Boolean(v)]),
      ),
    }))
    .sort((a: Market, b: Market) => Number(b.id) - Number(a.id));
}

/** Mirrors CallIt._payout in contracts/call_it.py. */
export function claimable(m: Market, address: string | null): bigint {
  if (!address) return BigInt(0);
  const who = address.toLowerCase();
  if (m.claimed[who]) return BigInt(0);
  const y = m.yes_stakes[who] ?? BigInt(0);
  const n = m.no_stakes[who] ?? BigInt(0);
  if (m.status === "void") return y + n;
  if (m.status !== "resolved") return BigInt(0);
  const total = m.yes_pool + m.no_pool;
  const mine = m.outcome === "yes" ? y : n;
  const winning = m.outcome === "yes" ? m.yes_pool : m.no_pool;
  return winning === BigInt(0) ? BigInt(0) : (mine * total) / winning;
}

export function formatGen(wei: bigint): string {
  const whole = wei / WEI;
  const frac = (wei % WEI).toString().padStart(18, "0").slice(0, 4).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}

/** "1.5" -> wei, or null if not a positive decimal with up to 18 places. */
export function toWei(input: string): bigint | null {
  const t = input.trim();
  if (!/^\d+(\.\d{1,18})?$/.test(t)) return null;
  const [w, f = ""] = t.split(".");
  const v = BigInt(w) * WEI + BigInt(f.padEnd(18, "0"));
  return v > BigInt(0) ? v : null;
}

export const stakeOf = (m: Market, address: string | null) => {
  const who = (address ?? "").toLowerCase();
  return { yes: m.yes_stakes[who] ?? BigInt(0), no: m.no_stakes[who] ?? BigInt(0) };
};
