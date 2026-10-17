"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { getContractAddress } from "@/lib/genlayer/client";
import { useWallet } from "@/lib/genlayer/wallet";
import { useInvalidateMarkets } from "@/lib/hooks/useCallIt";
import type { Market } from "@/lib/contracts/types";
import { claimable, formatGen, stakeOf, toWei } from "@/lib/utils/market";
import { error, success } from "@/lib/utils/toast";
import { TxDialog } from "./TxDialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type Action = null | "stake" | "resolve" | "claim";

export function MarketCard({ m }: { m: Market }) {
  const { isConnected, address } = useWallet();
  const invalidate = useInvalidateMarkets();
  const contract = getContractAddress() as `0x${string}`;
  const [action, setAction] = useState<Action>(null);
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const [amountErr, setAmountErr] = useState("");
  const wei = toWei(amount);

  const total = m.yes_pool + m.no_pool;
  const yesPct = total === BigInt(0) ? 50 : Number((m.yes_pool * BigInt(1000)) / total) / 10;
  const mine = stakeOf(m, address);
  const owed = claimable(m, address);
  const open = m.status === "open";

  const tx = useMemo(() => {
    const method = action === "stake" ? "stake" : action === "claim" ? "claim" : "resolve";
    const args = action === "stake" ? [m.id, side] : [m.id];
    return { kind: "write" as const, address: contract, method, args };
  }, [action, contract, m.id, side]);

  const done = (ok: boolean, msg: string) => {
    if (ok) { invalidate(); success(msg); setAction(null); setAmount(""); }
    else error("Transaction did not succeed", { description: "Nothing changed. Check the explorer or try again." });
  };

  return (
    <article className="brand-card flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold leading-snug">{m.question}</h3>
        <span className={`chip chip-${m.status}`}>{m.status === "open" ? "Open" : m.status === "void" ? "Void" : `Called ${m.outcome.toUpperCase()}`}</span>
      </div>

      <div aria-label={`Yes ${yesPct}%`}>
        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
          <div style={{ width: `${yesPct}%` }} className="bg-foreground" />
          <div style={{ width: `${100 - yesPct}%` }} className="bg-spark" />
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span>Yes {formatGen(m.yes_pool)} GEN</span>
          <span>No {formatGen(m.no_pool)} GEN</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {m.deadline && <>Resolves after {m.deadline}. </>}
        <a href={m.resolution_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2">
          Resolution page <ExternalLink className="h-3 w-3" />
        </a>
      </p>
      {!open && m.reason && <p className="text-sm">{m.reason}</p>}
      {(mine.yes > 0 || mine.no > 0) && (
        <p className="text-sm text-muted-foreground">Your stake: {formatGen(mine.yes)} yes, {formatGen(mine.no)} no</p>
      )}

      {open && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex rounded-md border border-input p-0.5" role="group" aria-label="Side">
            {(["yes", "no"] as const).map((s) => (
              <button key={s} type="button" aria-pressed={side === s} onClick={() => setSide(s)}
                className={`rounded px-4 py-1.5 text-sm font-medium ${side === s ? "bg-foreground text-background" : ""}`}>
                {s === "yes" ? "Yes" : "No"}
              </button>
            ))}
          </div>
          <div className="w-28">
            <Input aria-label="Stake in GEN" inputMode="decimal" placeholder="GEN" value={amount}
              onChange={(e) => { setAmount(e.target.value); setAmountErr(""); }} />
          </div>
          <Button variant="gradient" disabled={!isConnected}
            onClick={() => (wei ? setAction("stake") : setAmountErr("Enter a stake above 0"))}>Stake</Button>
          <Button variant="secondary" disabled={!isConnected} onClick={() => setAction("resolve")}>Resolve</Button>
        </div>
      )}
      {amountErr && <p className="text-xs text-destructive">{amountErr}</p>}
      {owed > BigInt(0) && (
        <Button variant="gradient" disabled={!isConnected} onClick={() => setAction("claim")}>Claim {formatGen(owed)} GEN</Button>
      )}

      <TxDialog
        open={action !== null}
        onOpenChange={(o) => !o && setAction(null)}
        title={action === "stake" ? `Stake ${amount} GEN on ${side.toUpperCase()}` : action === "claim" ? "Claim your payout" : "Resolve this call"}
        description={action === "resolve"
          ? "Validators read the resolution page and must agree. If the page is unreachable or does not settle it, nothing changes."
          : "Review the network fee, then hold to sign."}
        tx={tx}
        userValue={action === "stake" ? wei ?? undefined : undefined}
        onDone={(s) => done(s.successful !== false, action === "stake" ? "Stake placed" : action === "claim" ? "Payout sent" : "Resolution submitted")}
      />
    </article>
  );
}
