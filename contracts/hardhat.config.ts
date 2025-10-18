import type { HardhatUserConfig } from "hardhat/config";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import "dotenv/config";
import ignition from "@nomicfoundation/hardhat-ignition";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { SensitiveString } from "hardhat/types/config";

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxMochaEthersPlugin, hardhatVerify, ignition],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    "arbitrumSepolia": {
      type: "http",
      chainType: "op",
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL as SensitiveString,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 421614,
    },
  },
  verify: {
    etherscan: {
      apiKey: process.env.ETHERSCAN_V2_API_KEY || "",
    },
  },
};

export default config;
