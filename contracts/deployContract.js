const fs = require("fs").promises;
const {
  Client,
  PrivateKey,
  ContractCreateFlow,
  ContractFunctionParameters,
} = require("@hashgraph/sdk");
require("dotenv").config();

function hederaToHexAddress(hederaAddress) {
  const [shard, realm, num] = hederaAddress.split(".").map(Number);
  const buf = Buffer.alloc(20);
  buf.writeUInt32BE(shard, 0);
  buf.writeUInt32BE(realm, 4);
  buf.writeUInt32BE(num, 8);
  return "0x" + buf.toString("hex").padStart(40, "0");
}

async function main() {
  // Ensure required environment variables are available
  if (
    !process.env.ACCOUNT_ID ||
    !process.env.ACCOUNT_PRIVATE_KEY ||
    !process.env.MST_TOKEN_ADDRESS ||
    !process.env.MPT_TOKEN_ADDRESS ||
    !process.env.FEE_RECIPIENT
  ) {
    throw new Error("Please set required keys in .env file.");
  }

  const accountId = process.env.ACCOUNT_ID;
  const accountKey = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT_PRIVATE_KEY
  );

  // Initialize Hedera client
  const client = Client.forTestnet();
  client.setOperator(accountId, accountKey);

  // Convert Hedera addresses to Ethereum-style addresses
  const mstTokenHexAddress = hederaToHexAddress(process.env.MST_TOKEN_ADDRESS);
  const feeRecipientHexAddress = hederaToHexAddress(process.env.FEE_RECIPIENT);

  // Deploy FeeToken contract
  const feeTokenAbi = await fs.readFile("./output/FeeToken_FeeToken.abi", {
    encoding: "utf8",
  });
  const feeTokenBytecode = await fs.readFile("./output/FeeToken_FeeToken.bin", {
    encoding: "utf8",
  });

  const feeTokenCreateTx = new ContractCreateFlow()
    .setGas(1000000)
    .setBytecode(feeTokenBytecode)
    .setConstructorParameters(
      new ContractFunctionParameters()
        .addAddress(mstTokenHexAddress)
        .addAddress(feeRecipientHexAddress)
    );

  const feeTokenSubmit = await feeTokenCreateTx.execute(client);
  const feeTokenReceipt = await feeTokenSubmit.getReceipt(client);
  const feeTokenAddress = feeTokenReceipt.contractId.toString();

  console.log(`- FeeToken contract deployed at: ${feeTokenAddress}`);

  // Deploy RewardDistribution contract
  const rewardDistributionAbi = await fs.readFile(
    "./output/RewardDistribution_sol_RewardDistribution.abi",
    { encoding: "utf8" }
  );
  const rewardDistributionBytecode = await fs.readFile(
    "./output/RewardDistribution_sol_RewardDistribution.bin",
    { encoding: "utf8" }
  );

  const rewardDistributionCreateTx = new ContractCreateFlow()
    .setGas(1000000)
    .setBytecode(rewardDistributionBytecode)
    .setConstructorParameters(
      new ContractFunctionParameters()
        .addAddress(hederaToHexAddress(process.env.MST_TOKEN_ADDRESS))
        .addAddress(hederaToHexAddress(process.env.MPT_TOKEN_ADDRESS))
        .addAddress(feeRecipientHexAddress)
        .addUint256(10)
    );

  const rewardDistributionSubmit = await rewardDistributionCreateTx.execute(
    client
  );
  const rewardDistributionReceipt = await rewardDistributionSubmit.getReceipt(
    client
  );
  const rewardDistributionAddress =
    rewardDistributionReceipt.contractId.toString();

  console.log(
    `- RewardDistribution contract deployed at: ${rewardDistributionAddress}`
  );

  // Output results
  const accountHexAddress = hederaToHexAddress(accountId);
  const accountExplorerUrl = `https://hashscan.io/testnet/account/${accountId}/?ph=1&pt=1`;
  const feeTokenExplorerUrl = `https://hashscan.io/testnet/contract/${feeTokenAddress}`;
  const rewardDistributionExplorerUrl = `https://hashscan.io/testnet/contract/${rewardDistributionAddress}`;

  console.log(`accountId: ${accountId}`);
  console.log(`accountAddress: ${accountHexAddress}`);
  console.log(`accountExplorerUrl: ${accountExplorerUrl}`);
  console.log(`feeTokenAddress: ${feeTokenAddress}`);
  console.log(`feeTokenExplorerUrl: ${feeTokenExplorerUrl}`);
  console.log(`rewardDistributionAddress: ${rewardDistributionAddress}`);
  console.log(
    `rewardDistributionExplorerUrl: ${rewardDistributionExplorerUrl}`
  );

  return {
    accountId,
    accountHexAddress,
    accountExplorerUrl,
    feeTokenAddress,
    feeTokenExplorerUrl,
    rewardDistributionAddress,
    rewardDistributionExplorerUrl,
  };
}

main().catch(console.error);
