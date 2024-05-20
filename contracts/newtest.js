require("dotenv").config();
const {
  Client,
  AccountId,
  PrivateKey,
  TransferTransaction,
  ContractExecuteTransaction,
  ContractCallQuery,
  Hbar,
} = require("@hashgraph/sdk");

async function main() {
  const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT_PRIVATE_KEY
  );
  const client = Client.forTestnet().setOperator(operatorId, operatorKey);

  const account2Id = AccountId.fromString(process.env.ACCOUNT2_ID);
  const account2Key = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT2_PRIVATE_KEY
  );
  const account3Id = AccountId.fromString(process.env.ACCOUNT3_ID);
  const account3Key = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT3_PRIVATE_KEY
  );

  const mstTokenId = AccountId.fromString(process.env.MST_TOKEN_ADDRESS);
  const mptTokenId = AccountId.fromString(process.env.MPT_TOKEN_ADDRESS);
  const contractId = AccountId.fromString(
    process.env.REWARD_DISTRIBUTION_CONTRACT_ID
  );

  try {
    // Step 1: Account 1 sends 1000 MPT and 2000 MST to both Account 2 and Account 3
    const sendTokens = async (toAccount, amountMPT, amountMST) => {
      await new TransferTransaction()
        .addTokenTransfer(mptTokenId, operatorId, -amountMPT)
        .addTokenTransfer(mptTokenId, toAccount, amountMPT)
        .addTokenTransfer(mstTokenId, operatorId, -amountMST)
        .addTokenTransfer(mstTokenId, toAccount, amountMST)
        .execute(client);
    };

    await sendTokens(account2Id, 1000, 2000);
    await sendTokens(account3Id, 1000, 2000);

    // Step 2: Account 2 stakes 1000 MST
    await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(1000000)
      .setFunction("stakeTokens", 1000)
      .freezeWith(client)
      .sign(account2Key)
      .execute(client);

    // Step 3: Account 3 stakes 500 MST
    await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(1000000)
      .setFunction("stakeTokens", 500)
      .freezeWith(client)
      .sign(account3Key)
      .execute(client);

    // Step 4: Account 2 sends 1000 MPT to Account 3
    await new TransferTransaction()
      .addTokenTransfer(mptTokenId, account2Id, -1000)
      .addTokenTransfer(mptTokenId, account3Id, 1000)
      .freezeWith(client)
      .sign(account2Key)
      .execute(client);

    // Step 5: Account 3 sends 1000 MPT to Account 2
    await new TransferTransaction()
      .addTokenTransfer(mptTokenId, account3Id, -1000)
      .addTokenTransfer(mptTokenId, account2Id, 1000)
      .freezeWith(client)
      .sign(account3Key)
      .execute(client);

    // Step 6: Account 2 claims rewards
    await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(1000000)
      .setFunction("claimRewards")
      .freezeWith(client)
      .sign(account2Key)
      .execute(client);

    // Step 6: Account 3 claims rewards
    await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(1000000)
      .setFunction("claimRewards")
      .freezeWith(client)
      .sign(account3Key)
      .execute(client);

    // Step 7: Account 2 unstakes MST
    await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(1000000)
      .setFunction("unstakeTokens", 1000)
      .freezeWith(client)
      .sign(account2Key)
      .execute(client);

    // Step 7: Account 3 unstakes MST
    await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(1000000)
      .setFunction("unstakeTokens", 500)
      .freezeWith(client)
      .sign(account3Key)
      .execute(client);

    console.log("All transactions executed successfully.");
  } catch (error) {
    console.error("Error during test script execution:", error);
  }
}

main().catch(console.error);
