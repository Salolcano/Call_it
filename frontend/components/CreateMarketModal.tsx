"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { getContractAddress } from "@/lib/genlayer/client";
import { useWallet } from "@/lib/genlayer/wallet";
import { useInvalidateMarkets } from "@/lib/hooks/useCallIt";
import CallIt from "@/lib/contracts/CallIt";
import { error, success } from "@/lib/utils/toast";
import { TxDialog } from "./TxDialog";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function CreateMarketModal() {
  const { isConnected } = useWallet();
  const invalidate = useInvalidateMarkets();
  const contract = getContractAddress();
  const [form, setForm] = useState(false);
  const [review, setReview] = useState(false);
  const [question, setQuestion] = useState("");
  const [url, setUrl] = useState("");
  const [deadline, setDeadline] = useState("");
  const [err, setErr] = useState("");

  const tx = useMemo(
    () => ({
      kind: "write" as const,
      address: contract as `0x${string}`,
      method: "create_market",
      args: [question.trim(), url.trim(), deadline.trim()],
    }),
    [contract, question, url, deadline],
  );

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return error("Contract address not configured", { description: "Set NEXT_PUBLIC_CONTRACT_ADDRESS." });
    if (question.trim().length < 10) return setErr("Describe a checkable outcome (10+ characters).");
    if (!/^https?:\/\//i.test(url.trim())) return setErr("Resolution page must start with http:// or https://");
    setErr("");
    setForm(false);
    setReview(true);
  };

  return (
    <>
      <Button variant="gradient" disabled={!isConnected} onClick={() => setForm(true)}>
        <Plus className="h-4 w-4" /> New call
      </Button>
      <Dialog open={form} onOpenChange={setForm}>
        <DialogContent className="brand-card sm:max-w-[520px]">
          <form onSubmit={next} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Make a call</DialogTitle>
              <DialogDescription>Ask a question a public web page will eventually answer.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="q">Question</Label>
              <textarea id="q" value={question} onChange={(e) => setQuestion(e.target.value)} className="field min-h-[96px]"
                placeholder="Will the status page show 99.9% uptime for October 2026?" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u">Resolution page</Label>
              <Input id="u" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://status.example.com/history" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d">Resolve after (shown to stakers)</Label>
              <Input id="d" value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="2026-11-01" />
            </div>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setForm(false)}>Cancel</Button>
              <Button type="submit" variant="gradient">Review fees</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <TxDialog
        open={review}
        onOpenChange={setReview}
        title="Publish your call"
        description="Review the network fee, then hold to sign."
        tx={tx}
        onDone={async (s) => {
          if (s.successful !== false) {
            invalidate();
            try {
              const n = await new CallIt(contract as `0x${string}`).getCount();
              success("Call published", { description: `The contract now holds ${n} call${n === 1 ? "" : "s"}.` });
            } catch (e: any) {
              error("Sent, but the contract could not be read back", { description: String(e?.message ?? e).slice(0, 220) });
            }
            setReview(false);
            setQuestion(""); setUrl(""); setDeadline("");
          } else error("Could not publish the call");
        }}
      />
    </>
  );
}
