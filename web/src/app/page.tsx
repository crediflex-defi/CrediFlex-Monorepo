"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import { ArrowRight, Loader } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";

import avsAbi from "@/abi/avs.json";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGetCurrentUserCscore } from "@/hooks/useGetCscore";
import { normalize } from "@/lib/bignumber";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { writeContract, error, isPending } = useWriteContract({});
  const [showError, setShowError] = useState(false);

  const triggerCscoreRequest = async () => {
    await fetch("/api/processCreditScore");
  };

  useEffect(() => {
    triggerCscoreRequest();
  }, []);

  const handleCreditScoreRequest = () => {
    setShowError(false);
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
        },
      }
    );
  };

  const { data: cScore } = useGetCurrentUserCscore() as {
    data: { cScore: string };
    isPending: boolean;
  };

  const normalizedCscore = parseFloat(normalize(cScore?.cScore || "0", 18));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 font-sans">
      <main className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h1 className="mb-4 text-4xl font-bold text-blue-800">Crediflex</h1>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-1 text-center">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="h-full bg-white/80 backdrop-blur-md shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-800">
                  Credit Score Request
                </CardTitle>
                <CardDescription className="text-blue-600">
                  Get your credit score with just one click
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 ">
                  <div>
                    {!isConnected ? (
                      <div className="flex justify-center">
                        <ConnectButton />
                      </div>
                    ) : (
                      <div>
                        {normalizedCscore > 0 ? (
                          <p className="text-lg font-semibold">
                            Your credit score:{" "}
                            <h2 className="text-2xl font-bold">
                              {(normalizedCscore * 10).toFixed(2)}
                            </h2>
                          </p>
                        ) : (
                          <Button
                            onClick={handleCreditScoreRequest}
                            disabled={isPending}
                            className="relative w-full overflow-hidden bg-blue-500 text-white transition-all duration-300 hover:bg-blue-600"
                          >
                            <span className="relative z-10 flex items-center justify-center">
                              {isPending ? (
                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <ArrowRight className="mr-2 h-4 w-4" />
                              )}
                              {isPending
                                ? "Processing..."
                                : "Request Credit Score"}
                            </span>
                            <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
                          </Button>
                        )}
                      </div>
                    )}
                    <Button asChild className="mt-4 w-full">
                      <Link href="/dashboard">
                        Go To Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    {error && showError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded bg-red-100 p-3 text-sm text-red-700"
                      >
                        Error: {error.message}
                      </motion.div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
