import mainAbi from "@/abi/main.json";
import { HexAddress } from "@/lib/type";
import { useReadContract } from "wagmi";

export const useCalculateDynamicLtv = ({
  userAddress,
}: {
  userAddress?: HexAddress;
}) => {
  return useReadContract({
    abi: mainAbi,
    address: "0xC4EC8E64157Ff9B5140966e6764F8B55319Ad08B",
    functionName: "calculateDynamicLTV",
    args: [userAddress],
    query: {
      enabled: !!userAddress,
    },
  });
};
