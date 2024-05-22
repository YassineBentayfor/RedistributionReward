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
const axios = require("axios");

const baseUrl = "https://testnet.mirrornode.hedera.com/api/v1";

async function queryMirrorNodeFor(url) {
  const response = await axios.get(url);
  return response.data;
}

async function getTokenBalance(accountId, tokenId) {
  const url = `${baseUrl}/balances?account.id=${accountId}`;
  const balanceInfo = await queryMirrorNodeFor(url);

  if (balanceInfo && balanceInfo.balances) {
    for (const item of balanceInfo.balances) {
      if (item.account === accountId) {
        for (const token of item.tokens) {
          if (token.token_id === tokenId) {
            const tokenInfoUrl = `${baseUrl}/tokens/${tokenId}`;
            const tokenInfo = await queryMirrorNodeFor(tokenInfoUrl);

            if (tokenInfo && tokenInfo.decimals !== undefined) {
              const decimals = parseFloat(tokenInfo.decimals);
              const balance = token.balance / 10 ** decimals;
              return balance * 10000; // Adjust as necessary
            }
          }
        }
      }
    }
  }
  return null;
}

async function getStakesAndRewards(client, contractId, account) {
  const stakesQuery = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(3000000)
    .setFunction(
      "getStakes",
      new ContractFunctionParameters().addAddress(account)
    );
  const stakesResult = await stakesQuery.execute(client);
  const stakes = stakesResult.getUint64(0);

  const rewardsQuery = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(3000000)
    .setFunction(
      "getRewards",
      new ContractFunctionParameters().addAddress(account)
    );
  const rewardsResult = await rewardsQuery.execute(client);
  const rewards = rewardsResult.getUint64(0);

  return { stakes, rewards };
}

async function main() {
  const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT_PRIVATE_KEY
  );
  const account1Id = AccountId.fromString(process.env.ACCOUNT1_ID);
  const account1Key = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT1_PRIVATE_KEY
  );
  const account2Id = AccountId.fromString(process.env.ACCOUNT2_ID);
  const account2Key = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT2_PRIVATE_KEY
  );
  const account3Id = AccountId.fromString(process.env.ACCOUNT3_ID);
  const account3Key = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT3_PRIVATE_KEY
  );
  const contractId = process.env.REWARD_DISTRIBUTION_CONTRACT_ID;

  const client = Client.forTestnet().setOperator(operatorId, operatorKey);
  const client1 = Client.forTestnet().setOperator(account1Id, account1Key);
  const client2 = Client.forTestnet().setOperator(account2Id, account2Key);
  const client3 = Client.forTestnet().setOperator(account3Id, account3Key);

  try {
    // Preliminary step: Operator sends 3000 MPT to Account 1
    try {
      const transferPrelim = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "transferMptTokens",
          new ContractFunctionParameters()
            .addUint64(3000)
            .addAddress(process.env.ACCOUNT1_ADDRESS_ETHER)
        )
        .setMaxTransactionFee(new Hbar(20));
      const transferPrelimSubmit = await transferPrelim.execute(client);
      const transferPrelimReceipt = await transferPrelimSubmit.getReceipt(
        client
      );
      console.log(
        `- Preliminary transfer of 3000 MPT to Account 1: ${transferPrelimReceipt.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during preliminary transfer of 3000 MPT to Account 1:",
        error
      );
    }

    // Step 1: Operator sends 4000 MST and 4000 MPT to both Account 1 and Account 2, and 2000 MPT and 4000 MST to Account 3
    console.log(
      "Operator transferring tokens to Account 1, Account 2, and Account 3..."
    );

    console.log("Balances before transfer:");
    console.log(
      `Account 1 MST: ${await getTokenBalance(
        process.env.ACCOUNT1_ID,
        process.env.MST_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 1 MPT: ${await getTokenBalance(
        process.env.ACCOUNT1_ID,
        process.env.MPT_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 2 MST: ${await getTokenBalance(
        process.env.ACCOUNT2_ID,
        process.env.MST_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 2 MPT: ${await getTokenBalance(
        process.env.ACCOUNT2_ID,
        process.env.MPT_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 3 MST: ${await getTokenBalance(
        process.env.ACCOUNT3_ID,
        process.env.MST_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 3 MPT: ${await getTokenBalance(
        process.env.ACCOUNT3_ID,
        process.env.MPT_TOKEN_ADDRESS
      )}`
    );

    try {
      const transferTx1 = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "transferMstTokens",
          new ContractFunctionParameters()
            .addUint64(4000)
            .addAddress(process.env.ACCOUNT1_ADDRESS_ETHER)
        )
        .setMaxTransactionFee(new Hbar(20));
      const transferTxSubmit1 = await transferTx1.execute(client);
      const transferTxReceipt1 = await transferTxSubmit1.getReceipt(client);
      console.log(
        `- Tokens transferred using transferMstTokens function to Account 1: ${transferTxReceipt1.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during transfer of 4000 MST to Account 1 using transferMstTokens function:",
        error
      );
    }

    try {
      const transferTx2 = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "transferMstTokens",
          new ContractFunctionParameters()
            .addUint64(4000)
            .addAddress(process.env.ACCOUNT2_ADDRESS_ETHER)
        )
        .setMaxTransactionFee(new Hbar(20));
      const transferTxSubmit2 = await transferTx2.execute(client);
      const transferTxReceipt2 = await transferTxSubmit2.getReceipt(client);
      console.log(
        `- Tokens transferred using transferMstTokens function to Account 2: ${transferTxReceipt2.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during transfer of 4000 MST to Account 2 using transferMstTokens function:",
        error
      );
    }

    try {
      const transferTx3 = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "transferMstTokens",
          new ContractFunctionParameters()
            .addUint64(4000)
            .addAddress(process.env.ACCOUNT3_ADDRESS_ETHER)
        )
        .setMaxTransactionFee(new Hbar(20));
      const transferTxSubmit3 = await transferTx3.execute(client);
      const transferTxReceipt3 = await transferTxSubmit3.getReceipt(client);
      console.log(
        `- Tokens transferred using transferMstTokens function to Account 3: ${transferTxReceipt3.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during transfer of 4000 MST to Account 3 using transferMstTokens function:",
        error
      );
    }

    try {
      const transferTx4 = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "transferMptTokens",
          new ContractFunctionParameters()
            .addUint64(4000)
            .addAddress(process.env.ACCOUNT1_ADDRESS_ETHER)
        )
        .setMaxTransactionFee(new Hbar(20));
      const transferTxSubmit4 = await transferTx4.execute(client);
      const transferTxReceipt4 = await transferTxSubmit4.getReceipt(client);
      console.log(
        `- Tokens transferred using transferMptTokens function to Account 1: ${transferTxReceipt4.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during transfer of 4000 MPT to Account 1 using transferMptTokens function:",
        error
      );
    }

    try {
      const transferTx5 = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "transferMptTokens",
          new ContractFunctionParameters()
            .addUint64(4000)
            .addAddress(process.env.ACCOUNT2_ADDRESS_ETHER)
        )
        .setMaxTransactionFee(new Hbar(20));
      const transferTxSubmit5 = await transferTx5.execute(client);
      const transferTxReceipt5 = await transferTxSubmit5.getReceipt(client);
      console.log(
        `- Tokens transferred using transferMptTokens function to Account 2: ${transferTxReceipt5.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during transfer of 4000 MPT to Account 2 using transferMptTokens function:",
        error
      );
    }

    try {
      const transferTx6 = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "transferMptTokens",
          new ContractFunctionParameters()
            .addUint64(2000)
            .addAddress(process.env.ACCOUNT3_ADDRESS_ETHER)
        )
        .setMaxTransactionFee(new Hbar(20));
      const transferTxSubmit6 = await transferTx6.execute(client);
      const transferTxReceipt6 = await transferTxSubmit6.getReceipt(client);
      console.log(
        `- Tokens transferred using transferMptTokens function to Account 3: ${transferTxReceipt6.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during transfer of 2000 MPT to Account 3 using transferMptTokens function:",
        error
      );
    }

    console.log("Transfer complete.");

    console.log("Balances after transfer:");
    console.log(
      `Account 1 MST: ${await getTokenBalance(
        process.env.ACCOUNT1_ID,
        process.env.MST_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 1 MPT: ${await getTokenBalance(
        process.env.ACCOUNT1_ID,
        process.env.MPT_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 2 MST: ${await getTokenBalance(
        process.env.ACCOUNT2_ID,
        process.env.MST_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 2 MPT: ${await getTokenBalance(
        process.env.ACCOUNT2_ID,
        process.env.MPT_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 3 MST: ${await getTokenBalance(
        process.env.ACCOUNT3_ID,
        process.env.MST_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 3 MPT: ${await getTokenBalance(
        process.env.ACCOUNT3_ID,
        process.env.MPT_TOKEN_ADDRESS
      )}`
    );

    // Step 2: Account 1 stakes 4000 MST
    console.log("Account 1 staking 4000 MST...");
    try {
      const stakeTx1 = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "stakeTokens",
          new ContractFunctionParameters().addUint64(4000)
        )
        .setMaxTransactionFee(new Hbar(20));
      const stakeTxSubmit1 = await stakeTx1.execute(client1);
      const stakeTxReceipt1 = await stakeTxSubmit1.getReceipt(client1);
      console.log(
        `- Tokens staked by Account 1 using stakeTokens function: ${stakeTxReceipt1.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during staking of 4000 MST by Account 1 using stakeTokens function:",
        error
      );
    }

    console.log("Balances after staking:");
    console.log(
      `Account 1 MST: ${await getTokenBalance(
        process.env.ACCOUNT1_ID,
        process.env.MST_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 1 MPT: ${await getTokenBalance(
        process.env.ACCOUNT1_ID,
        process.env.MPT_TOKEN_ADDRESS
      )}`
    );

    // Step 3: Account 2 stakes 4000 MST and then sends 4000 MPT to Account 3
    console.log("Account 2 staking 4000 MST...");
    try {
      const stakeTx2 = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "stakeTokens",
          new ContractFunctionParameters().addUint64(4000)
        )
        .setMaxTransactionFee(new Hbar(20));
      const stakeTxSubmit2 = await stakeTx2.execute(client2);
      const stakeTxReceipt2 = await stakeTxSubmit2.getReceipt(client2);
      console.log(
        `- Tokens staked by Account 2 using stakeTokens function: ${stakeTxReceipt2.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during staking of 4000 MST by Account 2 using stakeTokens function:",
        error
      );
    }

    console.log("Account 2 transferring 4000 MPT to Account 3...");
    try {
      const transferMptTx2 = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "transferMptTokens",
          new ContractFunctionParameters()
            .addUint64(4000)
            .addAddress(process.env.ACCOUNT3_ADDRESS_ETHER)
        )
        .setMaxTransactionFee(new Hbar(20));
      const transferMptTxSubmit2 = await transferMptTx2.execute(client2);
      const transferMptTxReceipt2 = await transferMptTxSubmit2.getReceipt(
        client2
      );
      console.log(
        `- Tokens transferred by Account 2 to Account 3 using transferMptTokens function: ${transferMptTxReceipt2.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during transfer of 4000 MPT by Account 2 to Account 3 using transferMptTokens function:",
        error
      );
    }

    console.log("Balances after staking and transfer:");
    console.log(
      `Account 1 MST: ${await getTokenBalance(
        process.env.ACCOUNT1_ID,
        process.env.MST_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 1 MPT: ${await getTokenBalance(
        process.env.ACCOUNT1_ID,
        process.env.MPT_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 2 MST: ${await getTokenBalance(
        process.env.ACCOUNT2_ID,
        process.env.MST_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 2 MPT: ${await getTokenBalance(
        process.env.ACCOUNT2_ID,
        process.env.MPT_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 3 MST: ${await getTokenBalance(
        process.env.ACCOUNT3_ID,
        process.env.MST_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 3 MPT: ${await getTokenBalance(
        process.env.ACCOUNT3_ID,
        process.env.MPT_TOKEN_ADDRESS
      )}`
    );

    // Step 4: Account 3 stakes 4000 MST and then sends 2000 MPT to Account 1 and 2000 MPT to Account 2
    console.log("Account 3 staking 4000 MST...");
    try {
      const stakeTx3 = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "stakeTokens",
          new ContractFunctionParameters().addUint64(4000)
        )
        .setMaxTransactionFee(new Hbar(20));
      const stakeTxSubmit3 = await stakeTx3.execute(client3);
      const stakeTxReceipt3 = await stakeTxSubmit3.getReceipt(client3);
      console.log(
        `- Tokens staked by Account 3 using stakeTokens function: ${stakeTxReceipt3.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during staking of 4000 MST by Account 3 using stakeTokens function:",
        error
      );
    }

    console.log("Account 3 transferring 2000 MPT to Account 1...");
    try {
      const transferMptTx3 = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "transferMptTokens",
          new ContractFunctionParameters()
            .addUint64(2000)
            .addAddress(process.env.ACCOUNT1_ADDRESS_ETHER)
        )
        .setMaxTransactionFee(new Hbar(20));
      const transferMptTxSubmit3 = await transferMptTx3.execute(client3);
      const transferMptTxReceipt3 = await transferMptTxSubmit3.getReceipt(
        client3
      );
      console.log(
        `- Tokens transferred by Account 3 to Account 1 using transferMptTokens function: ${transferMptTxReceipt3.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during transfer of 2000 MPT by Account 3 to Account 1 using transferMptTokens function:",
        error
      );
    }

    console.log("Account 3 transferring 2000 MPT to Account 2...");
    try {
      const transferMptTx4 = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "transferMptTokens",
          new ContractFunctionParameters()
            .addUint64(2000)
            .addAddress(process.env.ACCOUNT2_ADDRESS_ETHER)
        )
        .setMaxTransactionFee(new Hbar(20));
      const transferMptTxSubmit4 = await transferMptTx4.execute(client3);
      const transferMptTxReceipt4 = await transferMptTxSubmit4.getReceipt(
        client3
      );
      console.log(
        `- Tokens transferred by Account 3 to Account 2 using transferMptTokens function: ${transferMptTxReceipt4.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during transfer of 2000 MPT by Account 3 to Account 2 using transferMptTokens function:",
        error
      );
    }

    console.log("Balances after staking and transfer:");
    console.log(
      `Account 1 MST: ${await getTokenBalance(
        process.env.ACCOUNT1_ID,
        process.env.MST_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 1 MPT: ${await getTokenBalance(
        process.env.ACCOUNT1_ID,
        process.env.MPT_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 2 MST: ${await getTokenBalance(
        process.env.ACCOUNT2_ID,
        process.env.MST_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 2 MPT: ${await getTokenBalance(
        process.env.ACCOUNT2_ID,
        process.env.MPT_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 3 MST: ${await getTokenBalance(
        process.env.ACCOUNT3_ID,
        process.env.MST_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 3 MPT: ${await getTokenBalance(
        process.env.ACCOUNT3_ID,
        process.env.MPT_TOKEN_ADDRESS
      )}`
    );

    // Step 5: Account 1 unstakes 4000 MST
    console.log("Account 1 unstaking 4000 MST...");
    try {
      const unstakeTx1 = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "unstakeTokens",
          new ContractFunctionParameters().addUint64(4000)
        )
        .setMaxTransactionFee(new Hbar(20));
      const unstakeTxSubmit1 = await unstakeTx1.execute(client1);
      const unstakeTxReceipt1 = await unstakeTxSubmit1.getReceipt(client1);
      console.log(
        `- Tokens unstaked by Account 1 using unstakeTokens function: ${unstakeTxReceipt1.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during unstaking of 4000 MST by Account 1 using unstakeTokens function:",
        error
      );
    }

    console.log("Balances after unstaking:");
    console.log(
      `Account 1 MST: ${await getTokenBalance(
        process.env.ACCOUNT1_ID,
        process.env.MST_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 1 MPT: ${await getTokenBalance(
        process.env.ACCOUNT1_ID,
        process.env.MPT_TOKEN_ADDRESS
      )}`
    );

    // Step 6: Account 2 unstakes 4000 MST
    console.log("Account 2 unstaking 4000 MST...");
    try {
      const unstakeTx2 = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "unstakeTokens",
          new ContractFunctionParameters().addUint64(4000)
        )
        .setMaxTransactionFee(new Hbar(20));
      const unstakeTxSubmit2 = await unstakeTx2.execute(client2);
      const unstakeTxReceipt2 = await unstakeTxSubmit2.getReceipt(client2);
      console.log(
        `- Tokens unstaked by Account 2 using unstakeTokens function: ${unstakeTxReceipt2.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during unstaking of 4000 MST by Account 2 using unstakeTokens function:",
        error
      );
    }

    console.log("Balances after unstaking:");
    console.log(
      `Account 2 MST: ${await getTokenBalance(
        process.env.ACCOUNT2_ID,
        process.env.MST_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 2 MPT: ${await getTokenBalance(
        process.env.ACCOUNT2_ID,
        process.env.MPT_TOKEN_ADDRESS
      )}`
    );

    // Step 7: Account 3 unstakes 4000 MST
    console.log("Account 3 unstaking 4000 MST...");
    try {
      const unstakeTx3 = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "unstakeTokens",
          new ContractFunctionParameters().addUint64(4000)
        )
        .setMaxTransactionFee(new Hbar(20));
      const unstakeTxSubmit3 = await unstakeTx3.execute(client3);
      const unstakeTxReceipt3 = await unstakeTxSubmit3.getReceipt(client3);
      console.log(
        `- Tokens unstaked by Account 3 using unstakeTokens function: ${unstakeTxReceipt3.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during unstaking of 4000 MST by Account 3 using unstakeTokens function:",
        error
      );
    }

    console.log("Balances after unstaking:");
    console.log(
      `Account 3 MST: ${await getTokenBalance(
        process.env.ACCOUNT3_ID,
        process.env.MST_TOKEN_ADDRESS
      )}`
    );
    console.log(
      `Account 3 MPT: ${await getTokenBalance(
        process.env.ACCOUNT3_ID,
        process.env.MPT_TOKEN_ADDRESS
      )}`
    );

    console.log("All transactions executed successfully.");
  } catch (error) {
    console.error("Error during contract interaction:", error);
  }
}

main().catch(console.error);
