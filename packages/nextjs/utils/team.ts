import { Address } from "viem";

export const TEAM_NAME = "The 5th Node";

export const TEAM_PROBLEM = "Creating a shared treasury workflow with a 3-of-5 multisig on Sepolia.";

export const TEAM_ACCENT = "#0f766e";
export const TEAM_ACCENT_DARK = "#134e4a";
export const TEAM_SURFACE = "#f5f1e8";

export const TEAM_MEMBERS: { name: string; address: Address; deployer?: boolean }[] = [
  {
    name: "Sonam Wangmo",
    address: "0xa83Ba69dB08288D9962229DA0b64f92e36c40A4E",
    deployer: true,
  },
  {
    name: "Tshering Yangdey",
    address: "0x2D5f6d424E0975D02C96026867e50b63bad3c803",
  },
  {
    name: "Kezang Wangmo",
    address: "0x13AC2A545cBa93A6Eb68b272C4A294BE65E32135",
  },
  {
    name: "Dorji Dema",
    address: "0x2781810478328087A99984d0Bc31D8bcD8E2E9f6",
  },
  {
    name: "Sonam Deki",
    address: "0xD44B1f0589A529C9447bb2adbF835236e2785ee4",
  },
];

export const TEAM_PROBLEM_EXPANDED =
  "The 5th Node is using Scaffold-ETH to make shared wallet control concrete and visible. The app turns multisig coordination into a practical team workflow: propose an action, gather approvals, and execute only when the agreed threshold is met.";
