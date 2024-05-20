require("dotenv").config();
const {
  AccountId,
  PrivateKey,
  Client,
  ContractCallQuery,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
} = require("@hashgraph/sdk");

async function main() {
  const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT_PRIVATE_KEY
  );
  const account2Id = AccountId.fromString(process.env.ACCOUNT2_ID);
  const account2Key = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT2_PRIVATE_KEY
  );
  const account3Id = AccountId.fromString(process.env.ACCOUNT3_ID);
  const account3Key = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT3_PRIVATE_KEY
  );

  const account1Evm = process.env.TREASURY_ADDRESS_ETHER;
  const account2Evm = process.env.ACCOUNT2_ADDRESS_ETHER;
  const account3Evm = process.env.ACCOUNT3_ADDRESS_ETHER;

  const client = Client.forTestnet()
    .setOperator(operatorId, operatorKey)
    .setMaxTransactionFee(new Hbar(20));
  const client2 = Client.forTestnet()
    .setOperator(account2Id, account2Key)
    .setMaxTransactionFee(new Hbar(20));
  const client3 = Client.forTestnet()
    .setOperator(account3Id, account3Key)
    .setMaxTransactionFee(new Hbar(20));

  const contractId = process.env.REWARD_DISTRIBUTION_CONTRACT_ID;

  try {
    // Test contract call with increased max query payment
    const contractCall = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(10_000_000)
      .setFunction("getTestValue", new ContractFunctionParameters())
      .setMaxQueryPayment(new Hbar(20)); // Set max query payment to 20 HBAR

    const response = await contractCall.execute(client);
    const testValue = response.getString(0);
    console.log(`Test Value: ${testValue}`);

    // Step 1: Account 1 sends 1000 MPT and 2000 MST to Account 2 via contract
    console.log("Transferring 1000 MPT and 2000 MST to Account 2...");
    let tx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(10_000_000)
      .setFunction(
        "transferMptTokens",
        new ContractFunctionParameters().addUint64(1000).addAddress(account2Evm)
      )
      .setMaxTransactionFee(new Hbar(20)); // Set max transaction fee to 20 HBAR
    let frozenTx = await tx.freezeWith(client);
    let signTx = await frozenTx.sign(operatorKey);
    let responseTx = await signTx.execute(client);
    let receiptTx = await responseTx.getReceipt(client);
    console.log(`Transaction status: ${receiptTx.status}`);

    tx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(10_000_000)
      .setFunction(
        "transferMstTokens",
        new ContractFunctionParameters().addUint64(2000).addAddress(account2Evm)
      )
      .setMaxTransactionFee(new Hbar(20)); // Set max transaction fee to 20 HBAR
    frozenTx = await tx.freezeWith(client);
    signTx = await frozenTx.sign(operatorKey);
    responseTx = await signTx.execute(client);
    receiptTx = await responseTx.getReceipt(client);
    console.log(`Transaction status: ${receiptTx.status}`);

    // Step 2: Account 2 stakes 1000 MST
    console.log("Account 2 staking 1000 MST...");
    tx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(10_000_000)
      .setFunction(
        "stakeTokens",
        new ContractFunctionParameters().addUint64(1000)
      )
      .setMaxTransactionFee(new Hbar(20)); // Set max transaction fee to 20 HBAR
    frozenTx = await tx.freezeWith(client2);
    signTx = await frozenTx.sign(account2Key);
    responseTx = await signTx.execute(client2);
    receiptTx = await responseTx.getReceipt(client2);
    console.log(`Transaction status: ${receiptTx.status}`);

    // Step 3: Account 3 stakes 500 MST
    console.log("Account 3 staking 500 MST...");
    tx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(10_000_000)
      .setFunction(
        "stakeTokens",
        new ContractFunctionParameters().addUint64(500)
      )
      .setMaxTransactionFee(new Hbar(20)); // Set max transaction fee to 20 HBAR
    frozenTx = await tx.freezeWith(client3);
    signTx = await frozenTx.sign(account3Key);
    responseTx = await signTx.execute(client3);
    receiptTx = await responseTx.getReceipt(client3);
    console.log(`Transaction status: ${receiptTx.status}`);

    // Step 4: Account 2 sends 1000 MPT to Account 3 via contract
    console.log("Account 2 sending 1000 MPT to Account 3...");
    tx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(10_000_000)
      .setFunction(
        "transferMptTokens",
        new ContractFunctionParameters().addUint64(1000).addAddress(account3Evm)
      )
      .setMaxTransactionFee(new Hbar(20)); // Set max transaction fee to 20 HBAR
    frozenTx = await tx.freezeWith(client2);
    signTx = await frozenTx.sign(account2Key);
    responseTx = await signTx.execute(client2);
    receiptTx = await responseTx.getReceipt(client2);
    console.log(`Transaction status: ${receiptTx.status}`);

    // Step 5: Account 3 sends 1000 MPT to Account 2 via contract
    console.log("Account 3 sending 1000 MPT to Account 2...");
    tx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(10_000_000)
      .setFunction(
        "transferMptTokens",
        new ContractFunctionParameters().addUint64(1000).addAddress(account2Evm)
      )
      .setMaxTransactionFee(new Hbar(20)); // Set max transaction fee to 20 HBAR
    frozenTx = await tx.freezeWith(client3);
    signTx = await frozenTx.sign(account3Key);
    responseTx = await signTx.execute(client3);
    receiptTx = await responseTx.getReceipt(client3);
    console.log(`Transaction status: ${receiptTx.status}`);

    // Step 6: Account 2 claims rewards
    console.log("Account 2 claiming rewards...");
    tx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(10_000_000)
      .setFunction("claimRewards")
      .setMaxTransactionFee(new Hbar(20)); // Set max transaction fee to 20 HBAR
    frozenTx = await tx.freezeWith(client2);
    signTx = await frozenTx.sign(account2Key);
    responseTx = await signTx.execute(client2);
    receiptTx = await responseTx.getReceipt(client2);
    console.log(`Transaction status: ${receiptTx.status}`);

    // Step 7: Account 3 claiming rewards
    console.log("Account 3 claiming rewards...");
    tx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(10_000_000)
      .setFunction("claimRewards")
      .setMaxTransactionFee(new Hbar(20)); // Set max transaction fee to 20 HBAR
    frozenTx = await tx.freezeWith(client3);
    signTx = await frozenTx.sign(account3Key);
    responseTx = await signTx.execute(client3);
    receiptTx = await responseTx.getReceipt(client3);
    console.log(`Transaction status: ${receiptTx.status}`);

    // Step 8: Account 2 unstakes 1000 MST
    console.log("Account 2 unstaking 1000 MST...");
    tx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(10_000_000)
      .setFunction(
        "unstakeTokens",
        new ContractFunctionParameters().addUint64(1000)
      )
      .setMaxTransactionFee(new Hbar(20)); // Set max transaction fee to 20 HBAR
    frozenTx = await tx.freezeWith(client2);
    signTx = await frozenTx.sign(account2Key);
    responseTx = await signTx.execute(client2);
    receiptTx = await responseTx.getReceipt(client2);
    console.log(`Transaction status: ${receiptTx.status}`);

    // Step 9: Account 3 unstakes 500 MST
    console.log("Account 3 unstaking 500 MST...");
    tx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(10_000_000)
      .setFunction(
        "unstakeTokens",
        new ContractFunctionParameters().addUint64(500)
      )
      .setMaxTransactionFee(new Hbar(20)); // Set max transaction fee to 20 HBAR
    frozenTx = await tx.freezeWith(client3);
    signTx = await frozenTx.sign(account3Key);
    responseTx = await signTx.execute(client3);
    receiptTx = await responseTx.getReceipt(client3);
    console.log(`Transaction status: ${receiptTx.status}`);

    console.log("All transactions executed successfully.");
  } catch (error) {
    console.error("Error during contract call:", error);
  }
}

main().catch(console.error);
