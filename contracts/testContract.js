console.clear();
require("dotenv").config();
const {
  Client,
  AccountId,
  PrivateKey,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  AccountBalanceQuery,
  Hbar,
  ContractId,
} = require("@hashgraph/sdk");

// Load environment variables
const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);
const operatorKey = PrivateKey.fromStringECDSA(process.env.ACCOUNT_PRIVATE_KEY);
const treasuryId = AccountId.fromString(process.env.TREASURY_ADDRESS);
const treasuryKey = PrivateKey.fromStringECDSA(process.env.TREASURY_PVKEY);
const account2Id = AccountId.fromString(process.env.ACCOUNT2_ID);
const account2Key = PrivateKey.fromStringECDSA(
  process.env.ACCOUNT2_PRIVATE_KEY
);
const mstTokenAddress = process.env.MST_TOKEN_ADDRESS;
const mptTokenAddress = process.env.MPT_TOKEN_ADDRESS;
const contractId = ContractId.fromString(
  process.env.REWARD_DISTRIBUTION_CONTRACT_ID
);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function main() {
  try {
    // STEP 1: Token Association
    console.log(`STEP 1: Token Association`);

    let tx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction(
        "tokenAssociate",
        new ContractFunctionParameters()
          .addAddress(account2Id.toSolidityAddress())
          .addAddress(mstTokenAddress)
          .addAddress(mptTokenAddress)
      )
      .freezeWith(client);
    tx = await tx.sign(account2Key);
    let submitTx = await tx.execute(client);
    let receipt = await submitTx.getReceipt(client);

    console.log(
      `- Token association with Account2: ${receipt.status.toString()}`
    );

    // STEP 2: Token Transfer
    console.log(`STEP 2: Token Transfer`);

    tx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction(
        "processTransaction",
        new ContractFunctionParameters()
          .addUint64(4000)
          .addAddress(account2Id.toSolidityAddress())
          .addAddress(mstTokenAddress)
      );
    submitTx = await tx.execute(client);
    receipt = await submitTx.getReceipt(client);
    console.log(
      `- Transferred 4000 MST to Account2: ${receipt.status.toString()}`
    );

    tx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction(
        "processTransaction",
        new ContractFunctionParameters()
          .addUint64(4000)
          .addAddress(account2Id.toSolidityAddress())
          .addAddress(mptTokenAddress)
      );
    submitTx = await tx.execute(client);
    receipt = await submitTx.getReceipt(client);
    console.log(
      `- Transferred 4000 MPT to Account2: ${receipt.status.toString()}`
    );

    // STEP 3: Fee Component
    console.log(`STEP 3: Fee Component`);

    tx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction(
        "processTransaction",
        new ContractFunctionParameters()
          .addUint64(2000)
          .addAddress(treasuryId.toSolidityAddress())
          .addAddress(mptTokenAddress)
      );
    submitTx = await tx.execute(client);
    receipt = await submitTx.getReceipt(client);
    console.log(
      `- Transferred 2000 MPT to Treasury: ${receipt.status.toString()}`
    );

    // Check Treasury Balance
    let balance = await new AccountBalanceQuery()
      .setAccountId(treasuryId)
      .execute(client);
    console.log(
      `- Treasury balance: ${balance.tokens._map.get(mptTokenAddress)} MPT`
    );

    // STEP 4: Staking
    console.log(`STEP 4: Staking`);

    tx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction(
        "stakeTokens",
        new ContractFunctionParameters().addUint64(4000)
      );
    submitTx = await tx.execute(client);
    receipt = await submitTx.getReceipt(client);
    console.log(
      `- Staked 4000 MST from Account2: ${receipt.status.toString()}`
    );

    // STEP 5: Claim Rewards
    console.log(`STEP 5: Claim Rewards`);

    tx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction("claimRewards");
    submitTx = await tx.execute(client);
    receipt = await submitTx.getReceipt(client);
    console.log(`- Claimed rewards: ${receipt.status.toString()}`);

    // STEP 6: Unstaking
    console.log(`STEP 6: Unstaking`);

    tx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction(
        "unstakeTokens",
        new ContractFunctionParameters().addUint64(4000)
      );
    submitTx = await tx.execute(client);
    receipt = await submitTx.getReceipt(client);
    console.log(
      `- Unstaked 4000 MST from Account2: ${receipt.status.toString()}`
    );
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

main();
