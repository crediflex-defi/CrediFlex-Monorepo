import { normalize } from "@/lib/bignumber";
import { HexAddress } from "@/lib/type";
import { erc20Abi } from "viem";
import { useBalance, useReadContracts } from "wagmi";

export const useERC20TokenBalance = (
  address?: HexAddress,
  token?: HexAddress
) => {
  const results = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: token as HexAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as HexAddress],
      },
      {
        address: token,
        abi: erc20Abi,
        functionName: "decimals",
      },
      {
        address: token,
        abi: erc20Abi,
        functionName: "symbol",
      },
    ],
  });

  const balance = results?.data?.[0].toString() || 0;
  const decimals = results?.data?.[1] || 18;

  const normalizedResult = normalize(balance, decimals);
  return { ...results, balance: normalizedResult };
};

export const useETHBalance = (address?: HexAddress) => {
  const { data: balanceData } = useBalance({
    address: address as HexAddress,
  });
  const ethBalance = balanceData?.formatted || "0";
  return { balance: ethBalance };
};
