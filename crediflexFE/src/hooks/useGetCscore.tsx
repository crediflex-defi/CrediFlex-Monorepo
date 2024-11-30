import avsAbi from "@/abi/avs.json";
import { useAccount, useReadContract } from "wagmi";

export const useGetCurrentUserCscore = () => {
  const { address } = useAccount();
  return useReadContract({
    abi: avsAbi,
    address: "0xc4327AD867E6e9a938e03815Ccdd4198ccE1023c",
    functionName: "getUserCScoreData",
    args: [address],
    query: {
      enabled: !!address,
    },
  });
};
