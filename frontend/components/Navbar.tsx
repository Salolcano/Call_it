"use client";

import { AccountPanel } from "./AccountPanel";
import { CreateMarketModal } from "./CreateMarketModal";
import { Logo } from "./Logo";
import { GENLAYER_NETWORK } from "@/lib/genlayer/client";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="#top" aria-label="CallIt home"><Logo /></a>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="#how" className="hover:text-foreground">How it settles</a>
          <a href="#calls" className="hover:text-foreground">Open calls</a>
          <a href={GENLAYER_NETWORK.blockExplorerUrls[0]} target="_blank" rel="noreferrer" className="hover:text-foreground">Explorer</a>
        </nav>
        <div className="flex items-center gap-2">
          <CreateMarketModal />
          <AccountPanel />
        </div>
      </div>
    </header>
  );
}
