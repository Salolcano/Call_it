import { createClient } from "genlayer-js";
import { GENLAYER_CHAIN } from "../genlayer/client";
import { parseMarkets } from "../utils/market";
import type { Market } from "./types";

export const isValidAddress = (a: string) => /^0x[0-9a-fA-F]{40}$/.test(a);

/** Read-only calls. Writes go through the wallet (see /lib/genlayer/send.ts). */
export default class CallIt {
  private client: any;
  constructor(private address: `0x${string}`, account?: string | null) {
    this.client = createClient({
      chain: GENLAYER_CHAIN,
      ...(account ? { account: account as `0x${string}` } : {}),
    } as any);
  }

  /** Try both state views, and report the real reason if every attempt fails. */
  private async read(functionName: string): Promise<unknown> {
    if (!isValidAddress(this.address)) {
      throw new Error(`Contract address "${this.address}" is not a full 0x address (42 characters).`);
    }
    const errors: string[] = [];
    for (const variant of ["latest-nonfinal", "latest-final", undefined]) {
      try {
        return await this.client.readContract({
          address: this.address,
          functionName,
          args: [],
          ...(variant ? { transactionHashVariant: variant } : {}),
        });
      } catch (e: any) {
        errors.push(String(e?.shortMessage ?? e?.message ?? e).slice(0, 160));
      }
    }
    throw new Error(errors[0] ?? "read failed");
  }

  async getCount(): Promise<number> {
    return Number(await this.read("get_market_count"));
  }

  async getMarkets(): Promise<Market[]> {
    return parseMarkets(await this.read("get_markets"));
  }
}
