"use client";

import { GenLayerTransactionPanel, type SubmitInput, type TrackedStatus } from "@genlayer/transaction-kit-react";
import { useState } from "react";
import { GENLAYER_NETWORK } from "@/lib/genlayer/client";
import { sendWrite } from "@/lib/genlayer/send";
import { Button } from "./ui/button";
import { useTransactionKit } from "@/lib/genlayer/kit";
import { useWallet } from "@/lib/genlayer/wallet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

/** Fee quote, hold-to-sign and tracking for one write, shown in a dialog. */
export function TxDialog({
  open, onOpenChange, title, description, tx, userValue, onDone,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  tx: SubmitInput;
  userValue?: bigint;
  onDone: (s: TrackedStatus) => void;
}) {
  const { address } = useWallet();
  const kit = useTransactionKit(address);
  const useKit = process.env.NEXT_PUBLIC_USE_TX_KIT === "true";
  const [phase, setPhase] = useState<"idle" | "sending" | "failed">("idle");
  const [message, setMessage] = useState("");

  const send = async () => {
    if (!address || tx.kind !== "write") return;
    setPhase("sending");
    const r = await sendWrite(
      { address: tx.address, method: tx.method, args: tx.args ?? [], value: userValue },
      address,
    );
    if (r.ok) {
      setPhase("idle");
      onDone({ phase: "decided", successful: true } as TrackedStatus);
    } else {
      setPhase("failed");
      setMessage(r.message);
    }
  };

  const close = (o: boolean) => {
    if (!o) { setPhase("idle"); setMessage(""); }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="brand-card sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {open && useKit && kit ? (
          <GenLayerTransactionPanel
            kit={kit}
            tx={tx}
            userValue={userValue}
            network={GENLAYER_NETWORK.chainName}
            theme="light"
            trackUntil="decided"
            onDone={onDone}
          />
        ) : open && address && !useKit ? (
          <div className="space-y-4">
            {userValue !== undefined && (
              <p className="text-sm">Your wallet will send the stake with this transaction.</p>
            )}
            <p className="text-sm text-muted-foreground">
              Confirm in your wallet. Validators then take a short while to decide, so keep this window open.
            </p>
            {phase === "failed" && <p role="alert" className="text-sm text-destructive">{message}</p>}
            <Button variant="gradient" className="w-full" disabled={phase === "sending"} onClick={send}>
              {phase === "sending" ? "Waiting for wallet and validators…" : phase === "failed" ? "Try again" : "Confirm in wallet"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Connect your wallet to continue.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
