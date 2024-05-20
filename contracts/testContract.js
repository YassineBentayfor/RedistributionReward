console.clear();
require("dotenv").config();
const {
  AccountId,
  PrivateKey,
  Client,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
} = require("@hashgraph/sdk");

async function main() {
  const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT_PRIVATE_KEY
  );

  const operator2Id = AccountId.fromString(process.env.ACCOUNT2_ID);
  const operator2Key = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT2_PRIVATE_KEY
  );

  const operator2Evm = process.env.ACCOUNT2_ADDRESS_ETHER;

  const contractId = process.env.REWARD_DISTRIBUTION_CONTRACT_ID;
  const treasuryAddress = AccountId.fromString(process.env.TREASURY_ADDRESS);

  const client = Client.forTestnet()
    .setOperator(operatorId, operatorKey)
    .setDefaultMaxTransactionFee(new Hbar(20));

  const client2 = Client.forTestnet()
    .setOperator(operator2Id, operator2Key)
    .setDefaultMaxTransactionFee(new Hbar(20));

  try {
    console.log("Staking tokens using stakeTokens function...");
    const stakeTx1 = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction(
        "stakeTokens",
        new ContractFunctionParameters().addUint64(1000) // Specify the amount to stake
      )
      .setMaxTransactionFee(new Hbar(20)); // Set max transaction fee to 20 HBAR

    const stakeTxSubmit1 = await stakeTx1.execute(client2);
    const stakeTxReceipt1 = await stakeTxSubmit1.getReceipt(client2);
    console.log(
      `- Tokens staked using stakeTokens function: ${stakeTxReceipt1.status.toString()}`
    );
  } catch (error) {
    console.error(
      "Error during staking tokens using stakeTokens function:",
      error
    );
  }
  // try {
  //   console.log("Transferring MST tokens using transferMstTokens function...");
  //   const transferTx = await new ContractExecuteTransaction()
  //     .setContractId(contractId)
  //     .setGas(3000000)
  //     .setFunction(
  //       "transferMstTokens",
  //       new ContractFunctionParameters()
  //         .addUint64(1000) // Specify the amount to transfer/stake
  //         .addAddress(operator2Evm) // Specify the treasury address as the recipient
  //     )
  //     .setMaxTransactionFee(new Hbar(20)); // Set max transaction fee to 20 HBAR

  //   const transferTxSubmit = await transferTx.execute(client);
  //   const transferTxReceipt = await transferTxSubmit.getReceipt(client);
  //   console.log(
  //     `- Tokens transferred using transferMstTokens function: ${transferTxReceipt.status.toString()}`
  //   );
  // } catch (error) {
  //   console.error(
  //     "Error during transferring MST tokens using transferMstTokens function:",
  //     error
  //   );
  // }
}

main().catch(console.error);
