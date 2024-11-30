"use client";

import avsAbi from "@/abi/avs.json";
import { motion } from "framer-motion";
import { ChevronDown, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import mainAbi from "@/abi/main.json";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { useBorrow } from "@/hooks/useBorrow";
import { useAddCollateral } from "@/hooks/useDeposit";
import { useGetConversionPrice } from "@/hooks/useGetConversionPrice";
import { useGetCurrentUserCscore } from "@/hooks/useGetCscore";
import { useERC20TokenBalance } from "@/hooks/userERC20TokenBalance";
import { normalize, normalizeBN } from "@/lib/bignumber";
import Image from "next/image";
import { useAccount, useReadContracts, useWriteContract } from "wagmi";

// Define the expected type for positionData
type PositionData = {
  result: [string, string, string];
};

export default function BorrowInterface() {
  const [collateralAmount, setCollateralAmount] = useState("0");
  const [borrowAmount, setBorrowAmount] = useState("0");
  const { address } = useAccount();
  const balanceCollateral = useERC20TokenBalance(
    address,
    "0x80207b9bacc73dadac1c8a03c6a7128350df5c9e"
  );
  const { data: positionData, refetch: refetchPositions } = useReadContracts({
    contracts: [
      {
        abi: mainAbi,
        address: "0xC4EC8E64157Ff9B5140966e6764F8B55319Ad08B",
        functionName: "positions",
        args: [address],
      },
      {
        abi: mainAbi,
        address: "0xC4EC8E64157Ff9B5140966e6764F8B55319Ad08B",
        functionName: "calculateDynamicLTV",
        args: [address],
      },
      {
        abi: mainAbi,
        address: "0xC4EC8E64157Ff9B5140966e6764F8B55319Ad08B",
        functionName: "totalBorrowAssets",
      },
      {
        abi: mainAbi,
        address: "0xC4EC8E64157Ff9B5140966e6764F8B55319Ad08B",
        functionName: "totalBorrowShares",
      },
      {
        abi: mainAbi,
        address: "0xC4EC8E64157Ff9B5140966e6764F8B55319Ad08B",
        functionName: "totalSupplyAssets",
      },
      {
        abi: mainAbi,
        address: "0xC4EC8E64157Ff9B5140966e6764F8B55319Ad08B",
        functionName: "totalSupplyShares",
      },
      {
        abi: mainAbi,
        address: "0xC4EC8E64157Ff9B5140966e6764F8B55319Ad08B",
        functionName: "calculateHealth",
        args: [address],
      },
    ],
    query: {
      enabled: !!address,
    },
  });
  const { data: cScore } = useGetCurrentUserCscore() as {
    data: {
      cScore: string;
      lastUpdate: string;
    };
    isPending: boolean;
  };
  const { mutation: depositCollateral } = useAddCollateral();
  const { mutation: borrow } = useBorrow();
  const { data: conversionPrice } = useGetConversionPrice({
    amountIn: (positionData?.[0] as PositionData)?.result?.[2] ?? "0",
    dataFeedIn: "0x122e4C08f927AD85534Fc19FD5f3BC607b00C731",
    dataFeedOut: "0x27D0Dd86F00b59aD528f1D9B699847A588fbA2C7",
  });
  const health = normalizeBN((positionData?.[6].result as string) ?? "0", 18);

  const userBorrowAssets = normalizeBN(
    ((positionData?.[0] as PositionData)?.result?.[1] ?? "0") as string,
    18
  )
    .multipliedBy(normalizeBN((positionData?.[2].result as string) ?? "0", 18))
    .div(normalizeBN((positionData?.[3].result as string) ?? "0", 18));

  const availableToBorrow = normalizeBN((conversionPrice as string) ?? "0", 18)
    .multipliedBy(normalizeBN((positionData?.[1].result as string) ?? "0", 18))
    .minus(userBorrowAssets);

  const networth = normalizeBN((conversionPrice as string) ?? "0", 18).minus(
    userBorrowAssets
  );

  const collateral = normalize(
    ((positionData?.[0] as PositionData)?.result?.[2] ?? "0") as string,
    18
  );

  const normalizedCscore = parseFloat(normalize(cScore?.cScore || "0", 18));
  const ltvValue =
    parseFloat(normalize((positionData?.[1]?.result ?? "0") as string, 18)) *
    100;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  const triggerCscoreRequest = async () => {
    await fetch("/api/processCreditScore");
  };

  const { writeContract } = useWriteContract({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreditScoreRequest = () => {
    setLoading(true);
    setError(null);

    writeContract(
      {
        address: "0xc4327AD867E6e9a938e03815Ccdd4198ccE1023c",
        abi: avsAbi,
        functionName: "createNewTask",
        args: [address],
      },
      {
        onSuccess: () => {
          triggerCscoreRequest();
          setLoading(false);
        },
        onError: (err) => {
          setLoading(false);
          setError(err.message);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf8f6] to-[#f6e6e0] p-8">
      <motion.div
        className="max-w-6xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          className="text-4xl font-bold text-neutral-900"
          variants={itemVariants}
        >
          Borrow Dashboard
        </motion.h1>

        <Button variant="outline" className="mb-4">
          <Link href="/">Back to Home</Link>
        </Button>

        <Button onClick={handleCreditScoreRequest} className="mb-4">
          Re-request Credit Score
        </Button>

        {loading && <p className="text-blue-500">Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <motion.div
              className="grid gap-4 md:grid-cols-2 items-start"
              variants={itemVariants}
            >
              <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Collateral
                  </h2>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-neutral-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Deposit your assets as collateral</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Image
                      className="rounded-full"
                      src="https://assets.coingecko.com/coins/images/37405/standard/tokens.png?1714372859"
                      alt="weth"
                      width={24}
                      height={24}
                    />
                    <span>WET</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={collateralAmount}
                    onChange={(e) => setCollateralAmount(e.target.value)}
                    className="w-48 text-right"
                  />
                </div>
                <div className="text-sm text-neutral-500 text-right">
                  <div className="flex justify-between">
                    <span>Balance:</span>
                    <span>{balanceCollateral.balance} weth</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deposited:</span>
                    <span>
                      {parseFloat(collateral).toFixed(2)} weth (
                      {normalizeBN(conversionPrice as string, 18).toFixed(4)}{" "}
                      usd)
                    </span>
                  </div>
                </div>
                <Button
                  disabled={depositCollateral.isPending}
                  className="mt-4 w-full"
                  variant="outline"
                  onClick={() => {
                    depositCollateral.mutate(
                      {
                        amount: collateralAmount,
                      },
                      {
                        onSuccess() {
                          toast({
                            title: "Deposited successfully",
                            description: "You have successfully deposited",
                          });
                          refetchPositions();
                        },
                        onError(error) {
                          toast({
                            title: "Error",
                            description: error.message,
                          });
                        },
                      }
                    );
                  }}
                >
                  {depositCollateral.isPending
                    ? "Depositing..."
                    : "Deposit Collateral"}
                </Button>
              </Card>

              <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-neutral-900">
                    Borrow
                  </h2>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-neutral-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Borrow assets against your collateral</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Image
                      className="rounded-full"
                      src="https://assets.coingecko.com/coins/images/33613/standard/USDE.png?1716355685"
                      alt="usde"
                      width={24}
                      height={24}
                    />
                    <span>USDe</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    className="w-48 text-right"
                  />
                </div>
                <div className="text-sm text-neutral-500 text-right">
                  <div className="flex justify-between">
                    <span>Available to borrow:</span>
                    <span>{availableToBorrow.toFixed(2)} usde</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Your borrowed value:</span>
                    <span>{userBorrowAssets.toFixed(2)} usde</span>
                  </div>
                </div>
                <Button
                  disabled={borrow.isPending}
                  className="mt-4 w-full"
                  variant="outline"
                  onClick={() => {
                    borrow.mutate(
                      {
                        amount: borrowAmount,
                      },
                      {
                        onSuccess() {
                          toast({
                            title: "Borrowed successfully",
                            description: "You have successfully borrowed",
                          });
                          refetchPositions();
                        },
                        onError(error) {
                          toast({
                            title: "Error",
                            description: error.message,
                          });
                        },
                      }
                    );
                  }}
                >
                  {borrow.isPending ? "Borrowing..." : "Borrow"}
                </Button>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">
                      Loan to Value (LTV)
                    </h2>
                    <p className="text-sm text-neutral-500">
                      Ratio of the borrowed value to the collateral value
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-neutral-900">
                      {ltvValue.toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-6">
                  <Slider
                    value={[ltvValue]}
                    max={150}
                    step={0.01}
                    disabled
                    className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5 [&_[role=slider]]:border-2 [&_[role=slider]]:border-primary"
                  />

                  <div className="flex justify-between text-sm text-neutral-600">
                    <span>Liquidation</span>
                    <span>Aggressive</span>
                    <span>Moderate</span>
                    <span>Conservative</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-6 shadow-lg">
              <h2 className="text-lg font-semibold mb-4">NET WORTH </h2>
              <div className="text-5xl font-bold mb-4">
                $ {networth.toFixed(2)}
              </div>
              <h2 className="text-md font-semibold mb-4">Credit Score </h2>
              <div
                className={`text-3xl font-bold mb-4 ${
                  normalizedCscore * 10 < 50
                    ? "text-red-500"
                    : normalizedCscore * 10 <= 60
                    ? "text-yellow-500"
                    : "text-green-500"
                }`}
              >
                {(normalizedCscore * 10).toFixed(2)}
              </div>
              <h2 className="text-md font-semibold mb-4">Last updated </h2>
              <p className="text-sm ">
                {cScore?.lastUpdate
                  ? new Date(Number(cScore.lastUpdate) * 1000).toLocaleString()
                  : "N/A"}
              </p>

              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-2">Borrow Rate</h3>
                <div className="text-2xl font-bold text-green-400">10% APR</div>
                <p className="text-neutral-400 ">
                  Current interest rate for borrowing
                </p>
                <div className="text-lg mt-2">Health</div>
                <p
                  className={`
                  ${userBorrowAssets.isZero() ? "text-neutral-400" : ""}
                  ${health.toNumber() < 1.5 ? "text-red-500" : ""}
                  ${
                    health.toNumber() >= 1.5 && health.toNumber() <= 2
                      ? "text-yellow-500"
                      : ""
                  }
                  ${health.toNumber() > 2 ? "text-green-500" : ""}
                `}
                >
                  {userBorrowAssets.isZero() ? "0" : health.toFixed(2)}
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
