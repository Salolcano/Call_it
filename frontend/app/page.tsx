"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { MarketCard } from "@/components/MarketCard";
import { useMarkets } from "@/lib/hooks/useCallIt";
import { getContractAddress, GENLAYER_NETWORK } from "@/lib/genlayer/client";

const STEPS = [
  ["Make a call", "Write a question and point to a public page that will answer it."],
  ["Stake your side", "Anyone stakes GEN on yes or no. Pools update as stakes land."],
  ["Let validators read", "Anyone triggers resolution. Validators fetch the page, and the call settles only if they agree it clearly shows the answer."],
  ["Winners claim", "Winning stakers split the whole pool pro rata. If nobody backed the winner, everyone is refunded."],
];

export default function Home() {
  const { data: markets = [], isLoading, error } = useMarkets();
  const [tab, setTab] = useState<"open" | "settled">("open");
  const list = markets.filter((m) => (tab === "open" ? m.status === "open" : m.status !== "open"));

  return (
    <>
      <Navbar />
      <main id="top">
        <section className="mx-auto max-w-6xl px-5 pb-20 pt-20 md:pt-28">
          <h1 className="hero-title">Call it.<br />The page decides.</h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Stake on anything a public web page can prove. GenLayer validators read the page, reach consensus, and pay the winners. No oracle, no referee.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#calls" className="btn-ink">Browse open calls</a>
            <a href="#how" className="btn-line">How it settles</a>
          </div>
        </section>

        <section id="how" className="border-y border-border bg-card/60">
          <ol className="mx-auto grid max-w-6xl gap-px px-5 py-12 md:grid-cols-4 md:gap-8">
            {STEPS.map(([t, d], i) => (
              <li key={t}>
                <p className="text-sm text-muted-foreground">Step {i + 1}</p>
                <h2 className="mt-1 text-lg font-semibold">{t}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="calls" className="mx-auto max-w-6xl px-5 py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Calls</h2>
            <div className="flex rounded-full border border-input p-0.5" role="tablist">
              {(["open", "settled"] as const).map((t) => (
                <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === t ? "bg-foreground text-background" : ""}`}>
                  {t === "open" ? "Open" : "Settled"}
                </button>
              ))}
            </div>
          </div>
          {!getContractAddress() && (
            <p className="brand-card p-5 text-sm">Set <code>NEXT_PUBLIC_CONTRACT_ADDRESS</code> in <code>frontend/.env.local</code> after deploying the contract.</p>
          )}
          {error && <p className="text-sm text-destructive">Could not read markets from the contract. Check the RPC and contract address.</p>}
          {isLoading && <p className="text-muted-foreground">Loading calls…</p>}
          {!isLoading && getContractAddress() && list.length === 0 && (
            <p className="text-muted-foreground">{tab === "open" ? "No open calls yet. Make the first one." : "Nothing has settled yet."}</p>
          )}
          <div className="grid gap-5 md:grid-cols-2">
            {list.map((m) => <MarketCard key={m.id} m={m} />)}
          </div>
        </section>
      </main>
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        CallIt runs on GenLayer Studio, chain 61999.
        {getContractAddress() && (
          <p className="mt-2">
            Contract{" "}
            <a className="underline" target="_blank" rel="noreferrer"
              href={`${GENLAYER_NETWORK.blockExplorerUrls[0]}/address/${getContractAddress()}`}>
              {getContractAddress()}
            </a>{" "}
            · {markets.length} call{markets.length === 1 ? "" : "s"} read from chain
          </p>
        )}
      </footer>
    </>
  );
}
