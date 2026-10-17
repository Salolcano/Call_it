import { describe, expect, it } from "vitest";
import { claimable, formatGen, parseMarkets, toWei } from "../lib/utils/market";

const ALICE = "0xAbC0000000000000000000000000000000000001";
const BOB = "0xB0b0000000000000000000000000000000000002";
const raw = (o: object) => JSON.stringify([o]).replace(/"BIG:(\d+)"/g, "$1");

const base = {
  id: "1", question: "q", resolution_url: "https://x.org", deadline: "", reason: "", claimed: {},
  yes_pool: "BIG:1000000000000000000", no_pool: "BIG:3000000000000000000",
  yes_stakes: { [ALICE]: "BIG:1000000000000000000" },
  no_stakes: { [BOB]: "BIG:3000000000000000000" },
};

describe("market utils", () => {
  it("keeps 18-decimal wei amounts exact", () => {
    const [m] = parseMarkets(raw({ ...base, status: "open", outcome: "" }));
    expect(m.yes_pool).toBe(BigInt("1000000000000000000"));
    expect(formatGen(m.no_pool)).toBe("3");
  });
  it("pays winners pro rata and nothing to losers", () => {
    const [m] = parseMarkets(raw({ ...base, status: "resolved", outcome: "yes" }));
    expect(claimable(m, ALICE.toLowerCase())).toBe(BigInt("4000000000000000000"));
    expect(claimable(m, BOB)).toBe(BigInt(0));
  });
  it("refunds on void and blocks double claims", () => {
    const [v] = parseMarkets(raw({ ...base, status: "void", outcome: "yes" }));
    expect(claimable(v, BOB)).toBe(BigInt("3000000000000000000"));
    const [c] = parseMarkets(raw({ ...base, status: "void", outcome: "yes", claimed: { [BOB]: true } }));
    expect(claimable(c, BOB)).toBe(BigInt(0));
  });
  it("parses stake input safely", () => {
    expect(toWei("1.5")).toBe(BigInt("1500000000000000000"));
    expect(toWei("0")).toBeNull();
    expect(toWei("abc")).toBeNull();
    expect(toWei("1.1234567890123456789")).toBeNull();
  });
});
