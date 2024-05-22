console.clear();
require("dotenv").config();
const {
  AccountId,
  PrivateKey,
  Client,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
  AccountAllowanceApproveTransaction,
} = require("@hashgraph/sdk");
const axios = require("axios");

const baseUrl = "https://testnet.mirrornode.hedera.com/api/v1";

async function queryMirrorNodeFor(url) {
  const response = await axios.get(url);
  return response.data;
}
const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);

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

  //Create the transaction
  const transaction = new AccountAllowanceApproveTransaction()
    .approveTokenAllowance(
      process.env.MST_TOKEN_ADDRESS,

      account1Id,
      contractId,
      100000000
    )
    .freezeWith(client);

  //Sign the transaction with the owner account key
  const signTx = await transaction.sign(account1Key);

  //Sign the transaction with the client operator private key and submit to a Hedera network
  const txResponse = await signTx.execute(client1);

  //Request the receipt of the transaction
  const receipt = await txResponse.getReceipt(client1);

  //Get the transaction consensus status
  const transactionStatus = receipt.status;

  console.log(
    "The transaction consensus status is " + transactionStatus.toString()
  );

  const transaction1 = new AccountAllowanceApproveTransaction()
    .approveTokenAllowance(
      process.env.MPT_TOKEN_ADDRESS,

      account1Id,
      contractId,
      100000000
    )
    .freezeWith(client);

  //Sign the transaction with the owner account key
  const signTx1 = await transaction1.sign(account1Key);

  //Sign the transaction with the client operator private key and submit to a Hedera network
  const txResponse1 = await signTx1.execute(client1);

  //Request the receipt of the transaction
  const receipt1 = await txResponse1.getReceipt(client1);

  //Get the transaction consensus status
  const transactionStatus1 = receipt1.status;

  console.log(
    "The transaction consensus status is " + transactionStatus.toString()
  );

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

    // Step 1: Operator sends 20000 MST and 20000 MPT to both Account 1 and Account 2, and 2000 MPT and 40000 MST to Account 3
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

    try {
      const transferTx2 = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "transferMstTokens",
          new ContractFunctionParameters()
            .addUint64(2000)
            .addAddress(process.env.ACCOUNT2_ADDRESS_ETHER)
        )
        .setMaxTransactionFee(new Hbar(20));
      const transferTxSubmit2 = await transferTx2.execute(client1);
      const transferTxReceipt2 = await transferTxSubmit2.getReceipt(client1);
      console.log(
        `- Tokens transferred using transferMstTokens account 1 function to Account 2: ${transferTxReceipt2.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during transfer of 2000 MST to Account 2 using transferMstTokens function:",
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
            .addUint64(400)
            .addAddress(process.env.ACCOUNT3_ADDRESS_ETHER)
        )
        .setMaxTransactionFee(new Hbar(20));
      const transferTxSubmit3 = await transferTx3.execute(client1);
      const transferTxReceipt3 = await transferTxSubmit3.getReceipt(client1);
      console.log(
        `- Tokens transferred using transferMstTokens function to Account 3: ${transferTxReceipt3.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during transfer of 40000 MST to Account 3 using transferMstTokens function:",
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

    // Step 2: Account 1 stakes 20000 MST and then sends 20000 MPT to Account 2
    console.log("Account 1 staking 20000 MST...");
    try {
      const stakeTx1 = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "stakeTokens",
          new ContractFunctionParameters().addUint64(200)
        )
        .setMaxTransactionFee(new Hbar(20));
      const stakeTxSubmit1 = await stakeTx1.execute(client1);
      const stakeTxReceipt1 = await stakeTxSubmit1.getReceipt(client1);
      console.log(
        `- Tokens staked by Account 1 using stakeTokens function: ${stakeTxReceipt1.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during staking of 20000 MST by Account 1 using stakeTokens function:",
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

    // Step 5: All accounts will unstake what they staked
    console.log("Account 1 unstaking 200 MST...");
    try {
      const unstakeTx1 = await new ContractExecuteTransaction()
        .setContractId(contractId)
        .setGas(3000000)
        .setFunction(
          "unstakeTokens",
          new ContractFunctionParameters().addUint64(200)
        )
        .setMaxTransactionFee(new Hbar(20));
      const unstakeTxSubmit1 = await unstakeTx1.execute(client1);
      const unstakeTxReceipt1 = await unstakeTxSubmit1.getReceipt(client1);
      console.log(
        `- Tokens unstaked by Account 1 using unstakeTokens function: ${unstakeTxReceipt1.status.toString()}`
      );
    } catch (error) {
      console.error(
        "Error during unstaking of 20000 MST by Account 1 using unstakeTokens function:",
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

    console.log("All transactions executed successfully.");
  } catch (error) {
    console.error("Error during contract interaction:", error);
  }
}

main().catch(console.error);
