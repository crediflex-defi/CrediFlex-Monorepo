import { arbitrumSepolia } from "viem/chains";
import { createConfig, http } from "wagmi";

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: http(
      "https://arbitrum-sepolia.blockpi.network/v1/rpc/public"
    ),
  },
});
