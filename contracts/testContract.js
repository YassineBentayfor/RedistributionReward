require("dotenv").config();

const {
  AccountId,
  PrivateKey,
  Client,
  ContractCallQuery,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
  HbarUnit,
} = require("@hashgraph/sdk");

async function main() {
  const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT_PRIVATE_KEY
  );
  const client = Client.forTestnet().setOperator(operatorId, operatorKey);

  const contractId = process.env.REWARD_DISTRIBUTION_CONTRACT_ID;

  try {
    // Call the getTestValue function
    const contractCall = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(100_000) // Set sufficient gas
      .setFunction("getTestValue", new ContractFunctionParameters());

    const response = await contractCall.execute(client);
    const testValue = response.getString(0);

    console.log(`Test Value: ${testValue}`);
  } catch (error) {
    console.error("Error during contract call:", error);
  }
}

main().catch(console.error);
