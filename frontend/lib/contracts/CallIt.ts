import { createClient } from "genlayer-js";
import { GENLAYER_CHAIN } from "../genlayer/client";
import { parseMarkets } from "../utils/market";
import type { Market } from "./types";

/** Read-only calls. Writes go through Transaction Kit (see /components). */
export default class CallIt {
  private client: any;
  constructor(private address: `0x${string}`, account?: string | null) {
    this.client = createClient({
      chain: GENLAYER_CHAIN,
      ...(account ? { account: account as `0x${string}` } : {}),
    } as any);
  }

  async getCount(): Promise<number> {
    const n = await this.client.readContract({ address: this.address, functionName: "get_market_count", args: [] });
    return Number(n);
  }

  async getMarkets(): Promise<Market[]> {
    const raw = await this.client.readContract({
      address: this.address,
      functionName: "get_markets",
      args: [],
    });
    return parseMarkets(raw);
  }
}
