require("dotenv").config();
const {
  Client,
  PrivateKey,
  AccountId,
  ContractCreateFlow,
  ContractFunctionParameters,
  Hbar,
  ContractExecuteTransaction,
} = require("@hashgraph/sdk");
const fs = require("fs");

// Configure accounts and client
const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);
const operatorKey = PrivateKey.fromString(process.env.ACCOUNT_PRIVATE_KEY);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function deployContract() {
  // Read the compiled contract bytecode
  const contractBytecode = fs.readFileSync("RewardDistribution.bin");

  // Create the contract with initial parameters
  const contractCreateTx = new ContractCreateFlow()
    .setGas(100000)
    .setBytecode(contractBytecode)
    .setConstructorParameters(
      new ContractFunctionParameters()
        .addAddress(process.env.MST_TOKEN_ADDRESS) // MST token address
        .addAddress(process.env.MPT_TOKEN_ADDRESS) // MPT token address
        .addAddress(process.env.FEE_RECIPIENT) // Fee recipient address
        .addUint256(10) // Fee percentage (0.1%)
    );

  // Sign the transaction with the client operator key and submit to a Hedera network
  const contractCreateSubmit = await contractCreateTx.execute(client);

  // Get the receipt of the transaction
  const contractCreateRx = await contractCreateSubmit.getReceipt(client);

  // Get the new contract ID
  const contractId = contractCreateRx.contractId;
  console.log("The smart contract ID is " + contractId);

  return contractId;
}

async function main() {
  try {
    const contractId = await deployContract();
    console.log(`Contract deployed successfully with ID: ${contractId}`);
  } catch (error) {
    console.error("Error deploying contract:", error);
  }
}

main();
