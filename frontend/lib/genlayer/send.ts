import { createClient } from "genlayer-js";
import { GENLAYER_CHAIN } from "./client";

export interface WriteRequest {
  address: `0x${string}`;
  method: string;
  args: unknown[];
  value?: bigint;
}

const STATUS: Record<string, string> = { "5": "ACCEPTED", "7": "FINALIZED" };
const RESULT: Record<string, string> = {
  "0": "NOT_VOTED", "1": "FINISHED_WITH_RETURN", "2": "FINISHED_WITH_ERROR",
  "3": "TIMEOUT", "4": "NONDET_DISAGREE", "5": "DETERMINISTIC_VIOLATION",
};
function statusName(r: any): string | undefined {
  if (typeof r?.statusName === "string") return r.statusName;
  const v = r?.status;
  return v === undefined ? undefined : STATUS[String(v)] ?? String(v);
}
function resultName(r: any): string | undefined {
  if (typeof r?.txExecutionResultName === "string") return r.txExecutionResultName;
  const v = r?.txExecutionResult;
  return v === undefined ? undefined : RESULT[String(v)];
}

export type SendResult = { ok: true; hash: string } | { ok: false; message: string };

/**
 * Plain wallet send through genlayer-js. Used when the RPC does not offer the
 * fee-quote methods Transaction Kit needs (e.g. sim_getFeeConfig).
 */
export async function sendWrite(req: WriteRequest, account: string): Promise<SendResult> {
  try {
    const client: any = createClient({ chain: GENLAYER_CHAIN, account: account as `0x${string}` } as any);
    const hash = await client.writeContract({
      address: req.address,
      functionName: req.method,
      args: req.args,
      value: req.value ?? BigInt(0),
    });
    const receipt = await client.waitForTransactionReceipt({ hash, waitUntil: "decided", retries: 200, fullTransaction: true });
    const status = statusName(receipt);
    const result = resultName(receipt);
    const detail = `Transaction ${String(hash)} ended with status ${status ?? "unknown"} and result ${result ?? "unknown"}.`;
    if (status !== "ACCEPTED" && status !== "FINALIZED") {
      return { ok: false, message: `Not confirmed by validators. ${detail} Nothing is recorded; check the hash in the explorer.` };
    }
    if (result && result !== "FINISHED_WITH_RETURN") {
      return {
        ok: false,
        message:
          result === "NONDET_DISAGREE"
            ? `Validators could not agree on what the page says. ${detail} Nothing changed, try again.`
            : `The contract refused this action (for a resolve, the page may be unreachable or may not settle the question). ${detail}`,
      };
    }
    return { ok: true, hash: String(hash) };
  } catch (e: any) {
    const text = String(e?.shortMessage ?? e?.message ?? e);
    if (/reject|denied|4001/i.test(text)) return { ok: false, message: "You cancelled the request in your wallet." };
    return { ok: false, message: text.slice(0, 300) };
  }
}
