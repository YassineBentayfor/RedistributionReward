console.clear();
require("dotenv").config();
const {
  Client,
  AccountId,
  PrivateKey,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractCreateTransaction,
  ContractFunctionParameters,
  TokenUpdateTransaction,
} = require("@hashgraph/sdk");
const fs = require("fs").promises;

// Function to convert Hedera address to Ethereum-style hexadecimal address
function hederaToHexAddress(hederaAddress) {
  const [shard, realm, num] = hederaAddress.split(".").map(Number);
  const buf = Buffer.alloc(20);
  buf.writeUInt32BE(shard, 0);
  buf.writeUInt32BE(realm, 4);
  buf.writeUInt32BE(num, 8);
  return "0x" + buf.toString("hex").padStart(40, "0");
}

const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);
const operatorKey = PrivateKey.fromStringECDSA(process.env.ACCOUNT_PRIVATE_KEY);
const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function main() {
  // Ensure required environment variables are available
  if (
    !process.env.ACCOUNT_ID ||
    !process.env.ACCOUNT_PRIVATE_KEY ||
    !process.env.MST_TOKEN_ADDRESS ||
    !process.env.MPT_TOKEN_ADDRESS ||
    !process.env.TREASURY_ADDRESS
  ) {
    throw new Error("Please set required keys in .env file.");
  }

  const accountId = process.env.ACCOUNT_ID;
  const mstTokenHexAddress = hederaToHexAddress(process.env.MST_TOKEN_ADDRESS);
  const mptTokenHexAddress = hederaToHexAddress(process.env.MPT_TOKEN_ADDRESS);
  const treasuryHexAddress = hederaToHexAddress(process.env.TREASURY_ADDRESS);

  // Load contract bytecode
  const rewardDistributionBytecode = await fs.readFile(
    "./output/RewardDis_sol_RewardDistribution.bin",
    { encoding: "utf8" }
  );

  // Create a file on Hedera and store the contract bytecode
  const fileCreateTx = new FileCreateTransaction()
    .setKeys([operatorKey])
    .freezeWith(client);
  const fileCreateSign = await fileCreateTx.sign(operatorKey);
  const fileCreateSubmit = await fileCreateSign.execute(client);
  const fileCreateRx = await fileCreateSubmit.getReceipt(client);
  const bytecodeFileId = fileCreateRx.fileId;
  console.log(`- The smart contract bytecode file ID is ${bytecodeFileId}`);

  // Append contents to the file
  const fileAppendTx = new FileAppendTransaction()
    .setFileId(bytecodeFileId)
    .setContents(rewardDistributionBytecode)
    .setMaxChunks(10)
    .freezeWith(client);
  const fileAppendSign = await fileAppendTx.sign(operatorKey);
  const fileAppendSubmit = await fileAppendSign.execute(client);
  const fileAppendRx = await fileAppendSubmit.getReceipt(client);
  console.log(`- Content added: ${fileAppendRx.status} \n`);

  // Deploy RewardDistribution contract
  const rewardDistributionCreateTx = new ContractCreateTransaction()
    .setBytecodeFileId(bytecodeFileId)
    .setGas(3000000)
    .setConstructorParameters(
      new ContractFunctionParameters()
        .addAddress(mstTokenHexAddress)
        .addAddress(mptTokenHexAddress)
        .addAddress(treasuryHexAddress)
    );
  const rewardDistributionSubmit = await rewardDistributionCreateTx.execute(
    client
  );
  const rewardDistributionReceipt = await rewardDistributionSubmit.getReceipt(
    client
  );

  // Check if the contract creation was successful
  if (rewardDistributionReceipt.status.toString() !== "SUCCESS") {
    console.error(
      `- Contract creation failed with status: ${rewardDistributionReceipt.status.toString()}`
    );
    return;
  }

  const rewardDistributionAddress =
    rewardDistributionReceipt.contractId.toString();
  console.log(
    `- RewardDistribution contract deployed at: ${rewardDistributionAddress}`
  );

  // Update MST token to be managed by the contract
  const tokenUpdateTxMST = await new TokenUpdateTransaction()
    .setTokenId(process.env.MST_TOKEN_ADDRESS)
    .setSupplyKey(rewardDistributionReceipt.contractId)
    .freezeWith(client)
    .sign(operatorKey);
  const tokenUpdateSubmitMST = await tokenUpdateTxMST.execute(client);
  const tokenUpdateRxMST = await tokenUpdateSubmitMST.getReceipt(client);
  console.log(`- MST Token update status: ${tokenUpdateRxMST.status}`);

  // Update MPT token to be managed by the contract
  const tokenUpdateTxMPT = await new TokenUpdateTransaction()
    .setTokenId(process.env.MPT_TOKEN_ADDRESS)
    .setSupplyKey(rewardDistributionReceipt.contractId)
    .freezeWith(client)
    .sign(operatorKey);
  const tokenUpdateSubmitMPT = await tokenUpdateTxMPT.execute(client);
  const tokenUpdateRxMPT = await tokenUpdateSubmitMPT.getReceipt(client);
  console.log(`- MPT Token update status: ${tokenUpdateRxMPT.status}`);

  // Output results
  const accountHexAddress = hederaToHexAddress(accountId);
  const accountExplorerUrl = `https://hashscan.io/testnet/account/${accountId}/?ph=1&pt=1`;
  const rewardDistributionExplorerUrl = `https://hashscan.io/testnet/contract/${rewardDistributionAddress}`;

  console.log(`accountId: ${accountId}`);
  console.log(`accountAddress: ${accountHexAddress}`);
  console.log(`accountExplorerUrl: ${accountExplorerUrl}`);
  console.log(`rewardDistributionAddress: ${rewardDistributionAddress}`);
  console.log(
    `rewardDistributionExplorerUrl: ${rewardDistributionExplorerUrl}`
  );

  return {
    accountId,
    accountHexAddress,
    accountExplorerUrl,
    rewardDistributionAddress,
    rewardDistributionExplorerUrl,
  };
}

main().catch(console.error);
