// Import necessary modules and dependencies
const fs = require("fs").promises; // File system module for reading files asynchronously
const {
  Client,
  PrivateKey,
  ContractCreateFlow,
  ContractFunctionParameters,
} = require("@hashgraph/sdk"); // Hedera SDK
require("dotenv").config(); // Load environment variables from .env file

// Function to convert Hedera address to Ethereum-style hexadecimal address
function hederaToHexAddress(hederaAddress) {
  const [shard, realm, num] = hederaAddress.split(".").map(Number); // Split Hedera address into shard, realm, and number parts and convert them to numbers
  const buf = Buffer.alloc(20); // Allocate a 20-byte buffer
  buf.writeUInt32BE(shard, 0); // Write shard part to buffer
  buf.writeUInt32BE(realm, 4); // Write realm part to buffer
  buf.writeUInt32BE(num, 8); // Write number part to buffer
  return "0x" + buf.toString("hex").padStart(40, "0"); // Convert buffer to hexadecimal string and pad to 40 characters, then return with "0x" prefix
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
    throw new Error("Please set required keys in .env file."); // Throw error if any required environment variable is missing
  }

  const accountId = process.env.ACCOUNT_ID; // Get account ID from environment variable
  const accountKey = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT_PRIVATE_KEY
  ); // Get private key from environment variable

  // Initialize Hedera client
  const client = Client.forTestnet(); // Create a client for Hedera testnet
  client.setOperator(accountId, accountKey); // Set the operator account ID and private key

  // Convert Hedera addresses to Ethereum-style addresses
  const mptTokenHexAddress = hederaToHexAddress(process.env.MPT_TOKEN_ADDRESS); // Convert MPT token address to hex
  const feeRecipientHexAddress = hederaToHexAddress(process.env.FEE_RECIPIENT); // Convert fee recipient address to hex

  // Deploy FeeToken contract
  const feeTokenAbi = await fs.readFile("./output/FeeToken_FeeToken.abi", {
    encoding: "utf8",
  }); // Read ABI file for FeeToken contract
  const feeTokenBytecode = await fs.readFile("./output/FeeToken_FeeToken.bin", {
    encoding: "utf8",
  }); // Read bytecode file for FeeToken contract

  const feeTokenCreateTx = new ContractCreateFlow() // Create a new contract creation transaction
    .setGas(1000000) // Set gas limit
    .setBytecode(feeTokenBytecode) // Set contract bytecode
    .setConstructorParameters(
      // Set constructor parameters
      new ContractFunctionParameters()
        .addAddress(mptTokenHexAddress) // Add MPT token address
        .addAddress(feeRecipientHexAddress) // Add fee recipient address
    );

  const feeTokenSubmit = await feeTokenCreateTx.execute(client); // Execute the transaction
  const feeTokenReceipt = await feeTokenSubmit.getReceipt(client); // Get the receipt of the transaction
  const feeTokenAddress = feeTokenReceipt.contractId.toString(); // Get the contract ID as a string

  console.log(`- FeeToken contract deployed at: ${feeTokenAddress}`); // Log the FeeToken contract address

  // Deploy RewardDistribution contract
  const rewardDistributionAbi = await fs.readFile(
    "./output/RewardDistribution_sol_RewardDistribution.abi",
    { encoding: "utf8" }
  ); // Read ABI file for RewardDistribution contract
  const rewardDistributionBytecode = await fs.readFile(
    "./output/RewardDistribution_sol_RewardDistribution.bin",
    { encoding: "utf8" }
  ); // Read bytecode file for RewardDistribution contract

  const rewardDistributionCreateTx = new ContractCreateFlow() // Create a new contract creation transaction
    .setGas(1000000) // Set gas limit
    .setBytecode(rewardDistributionBytecode) // Set contract bytecode
    .setConstructorParameters(
      // Set constructor parameters
      new ContractFunctionParameters()
        .addAddress(hederaToHexAddress(process.env.MST_TOKEN_ADDRESS)) // Add MST token address
        .addAddress(hederaToHexAddress(process.env.MPT_TOKEN_ADDRESS)) // Add MPT token address
        .addAddress(feeRecipientHexAddress) // Add fee recipient address
        .addUint256(10) // Add fee percentage
    );

  const rewardDistributionSubmit = await rewardDistributionCreateTx.execute(
    client
  ); // Execute the transaction
  const rewardDistributionReceipt = await rewardDistributionSubmit.getReceipt(
    client
  ); // Get the receipt of the transaction
  const rewardDistributionAddress =
    rewardDistributionReceipt.contractId.toString(); // Get the contract ID as a string

  console.log(
    `- RewardDistribution contract deployed at: ${rewardDistributionAddress}`
  ); // Log the RewardDistribution contract address

  // Output results
  const accountHexAddress = hederaToHexAddress(accountId); // Convert account ID to hex address
  const accountExplorerUrl = `https://hashscan.io/testnet/account/${accountId}/?ph=1&pt=1`; // Generate account explorer URL
  const feeTokenExplorerUrl = `https://hashscan.io/testnet/contract/${feeTokenAddress}`; // Generate FeeToken explorer URL
  const rewardDistributionExplorerUrl = `https://hashscan.io/testnet/contract/${rewardDistributionAddress}`; // Generate RewardDistribution explorer URL

  console.log(`accountId: ${accountId}`); // Log account ID
  console.log(`accountAddress: ${accountHexAddress}`); // Log account hex address
  console.log(`accountExplorerUrl: ${accountExplorerUrl}`); // Log account explorer URL
  console.log(`feeTokenAddress: ${feeTokenAddress}`); // Log FeeToken address
  console.log(`feeTokenExplorerUrl: ${feeTokenExplorerUrl}`); // Log FeeToken explorer URL
  console.log(`rewardDistributionAddress: ${rewardDistributionAddress}`); // Log RewardDistribution address
  console.log(
    `rewardDistributionExplorerUrl: ${rewardDistributionExplorerUrl}`
  ); // Log RewardDistribution explorer URL

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

main().catch(console.error); // Run the main function and catch any errors
