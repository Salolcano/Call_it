# CallIt

Stake on anything a public web page can prove. Someone makes a call (a plain-English question plus a resolution page), people stake GEN on yes or no, and GenLayer validators read the page and settle it. Winners split the pool.

Network: GenLayer Studio, chain 61999, RPC `https://studio.genlayer.com/api`, explorer `https://explorer-studio.genlayer.com`.

## How it works

1. `create_market(question, resolution_url, deadline)`
2. `stake(market_id, side)` (payable, `yes` or `no`)
3. `resolve(market_id)`: validators fetch the page with `gl.nondet.web.render`, the model answers `yes`, `no` or `unresolved`, and validators compare only that single value with `strict_eq`.
4. `claim(market_id)`: winners receive `stake * total_pool / winning_pool`. If nobody backed the winner the market is `void` and stakes are refunded.

## Claim integrity

- **Fail-safe parsing.** `answer` must be the JSON string `"yes"` or `"no"` and `evidence_quote` must be text that really appears in the fetched page. Booleans, `"Yes!"`, `"true"`, malformed JSON, non-objects, missing fields and model errors all end as `invalid` and never settle a market.
- **Unavailable evidence.** A failed render, empty page or non-text page ends as `unavailable`. The call reverts and the market stays open and retryable.
- **One-shot finalization.** Only an `open` market can be resolved; stakes close once it is final; claims are single-use per address.
- **Prompt isolation.** The question and page are untrusted. They are passed as one `json.dumps(..., ensure_ascii=True)` object, so quotes, newlines and fake delimiters are escaped, and the rules appear both before and after the data.
- **Consensus-bound explanation.** Only the decision enum is compared by validators. The stored `reason` is written by the contract from that decision, never copied from model text, so what is displayed is exactly what validators agreed on.

Known limit: evidence binding proves the quote exists on the page, not that the page is truthful. Choose resolution pages you trust. There is no on-chain clock; `deadline` is informational and resolution is refused while the page does not settle the question.

## Run

```bash
# contract tests (no GenVM needed: executes contracts/call_it.py against an SDK stub)
pip install pytest && pytest tests/unit

# real GenVM direct-mode tests
pip install -r requirements.txt && pytest tests/direct
```

Deploy to Studio (one time, with a funded Studio account):

```bash
npm install -g genlayer
genlayer network set studionet
genlayer deploy --contract contracts/call_it.py
```

Frontend:

```bash
cd frontend && cp .env.example .env.local   # paste the deployed address
npm install && npm run dev
npm test && npm run lint && npm run build
```

Writes use a plain wallet send through `genlayer-js` by default, because `studio.genlayer.com/api` does not offer the `sim_getFeeConfig` method the fee-quote panel needs. If you point at an RPC that does, set `NEXT_PUBLIC_USE_TX_KIT=true` to get the Transaction Kit fee quote, hold-to-sign and live tracking (stakes pass `userValue`).
