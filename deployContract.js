import fs from "node:fs/promises";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";
import { ContractFactory } from "@ethersproject/contracts";
import dotenv from "dotenv";

async function main() {
  // Ensure required environment variables are available
  dotenv.config();
  if (
    !process.env.ACCOUNT_ID ||
    !process.env.ACCOUNT_PRIVATE_KEY ||
    !process.env.RPC_URL ||
    !process.env.MST_TOKEN_ADDRESS ||
    !process.env.MPT_TOKEN_ADDRESS ||
    !process.env.FEE_RECIPIENT
  ) {
    throw new Error("Please set required keys in .env file.");
  }
  const rpcUrl = process.env.RPC_URL;
  const accountId = process.env.ACCOUNT_ID;
  const accountKey = process.env.ACCOUNT_PRIVATE_KEY;

  // Initialize account
  const rpcProvider = new JsonRpcProvider(rpcUrl);
  const accountWallet = new Wallet(accountKey, rpcProvider);
  const accountAddress = accountWallet.address;
  const accountExplorerUrl = `https://hashscan.io/testnet/address/${accountAddress}`;

  // Deploy FeeToken contract
  const feeTokenAbi = await fs.readFile("./FeeToken_sol_FeeToken.abi", {
    encoding: "utf8",
  });
  const feeTokenBytecode = await fs.readFile("./FeeToken_sol_FeeToken.bin", {
    encoding: "utf8",
  });
  const feeTokenFactory = new ContractFactory(
    feeTokenAbi,
    feeTokenBytecode,
    accountWallet
  );
  const feeToken = await feeTokenFactory.deploy(
    "Fee Token",
    "FTK",
    process.env.FEE_RECIPIENT
  );
  await feeToken.deployTransaction.wait();
  const feeTokenAddress = feeToken.address;
  const feeTokenExplorerUrl = `https://hashscan.io/testnet/address/${feeTokenAddress}`;

  // Deploy RewardDistribution contract
  const rewardDistributionAbi = await fs.readFile(
    "./RewardDistribution_sol_RewardDistribution.abi",
    { encoding: "utf8" }
  );
  const rewardDistributionBytecode = await fs.readFile(
    "./RewardDistribution_sol_RewardDistribution.bin",
    { encoding: "utf8" }
  );
  const rewardDistributionFactory = new ContractFactory(
    rewardDistributionAbi,
    rewardDistributionBytecode,
    accountWallet
  );
  const rewardDistribution = await rewardDistributionFactory.deploy(
    process.env.MST_TOKEN_ADDRESS,
    process.env.MPT_TOKEN_ADDRESS,
    process.env.FEE_RECIPIENT,
    10
  );
  await rewardDistribution.deployTransaction.wait();
  const rewardDistributionAddress = rewardDistribution.address;
  const rewardDistributionExplorerUrl = `https://hashscan.io/testnet/address/${rewardDistributionAddress}`;

  // Output results
  console.log(`accountId: ${accountId}`);
  console.log(`accountAddress: ${accountAddress}`);
  console.log(`accountExplorerUrl: ${accountExplorerUrl}`);
  console.log(`feeTokenAddress: ${feeTokenAddress}`);
  console.log(`feeTokenExplorerUrl: ${feeTokenExplorerUrl}`);
  console.log(`rewardDistributionAddress: ${rewardDistributionAddress}`);
  console.log(
    `rewardDistributionExplorerUrl: ${rewardDistributionExplorerUrl}`
  );

  return {
    accountId,
    accountAddress,
    accountExplorerUrl,
    feeTokenAddress,
    feeTokenExplorerUrl,
    rewardDistributionAddress,
    rewardDistributionExplorerUrl,
  };
}

main();

export default main;
