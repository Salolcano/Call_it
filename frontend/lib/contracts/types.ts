export type MarketStatus = "open" | "resolved" | "void";

/** Amounts are wei strings: they exceed Number.MAX_SAFE_INTEGER. */
export interface Market {
  id: string;
  creator: string;
  question: string;
  resolution_url: string;
  deadline: string;
  status: MarketStatus;
  outcome: "" | "yes" | "no";
  reason: string;
  yes_pool: bigint;
  no_pool: bigint;
  yes_stakes: Record<string, bigint>;
  no_stakes: Record<string, bigint>;
  claimed: Record<string, boolean>;
}
