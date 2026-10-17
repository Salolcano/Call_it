"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import CallIt from "../contracts/CallIt";
import { getContractAddress } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import type { Market } from "../contracts/types";

export function useMarkets() {
  const { address } = useWallet();
  const contractAddress = getContractAddress();
  const contract = useMemo(
    () => (contractAddress ? new CallIt(contractAddress as `0x${string}`, address) : null),
    [contractAddress, address],
  );
  return useQuery<Market[], Error>({
    queryKey: ["markets", contractAddress],
    queryFn: () => (contract ? contract.getMarkets() : Promise.resolve([])),
    enabled: !!contract,
    refetchInterval: 8000,
  });
}

export function useInvalidateMarkets() {
  const qc = useQueryClient();
  return useCallback(() => qc.invalidateQueries({ queryKey: ["markets"] }), [qc]);
}
