import { useReadContract } from "wagmi";
import mainAbi from "@/abi/main.json";

export const useGetConversionPrice = ({
  amountIn,
  dataFeedIn,
  dataFeedOut,
}: {
  amountIn: string;
  dataFeedIn: string;
  dataFeedOut: string;
}) => {
  return useReadContract({
    abi: mainAbi,
    address: "0xC4EC8E64157Ff9B5140966e6764F8B55319Ad08B",
    functionName: "getConversionPrice",
    args: [amountIn, dataFeedIn, dataFeedOut],
    query: {
      enabled: !!amountIn && !!dataFeedIn && !!dataFeedOut,
    },
  });
};
