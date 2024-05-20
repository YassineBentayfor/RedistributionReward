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

async function queryMirrorNodeFor(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error querying mirror node: ${error}`);
    return null;
  }
}

async function get_token_balance(account_id, token_id) {
  const base_url = "https://testnet.mirrornode.hedera.com/api/v1";
  const url = `${base_url}/balances?account.id=${account_id}&limit=1`;

  const balance_info = await queryMirrorNodeFor(url);

  if (balance_info && balance_info.balances) {
    for (const item of balance_info.balances) {
      if (item.account === account_id) {
        for (const token of item.tokens) {
          if (token.token_id === token_id) {
            const token_info_url = `${base_url}/tokens/${token_id}`;
            const token_info = await queryMirrorNodeFor(token_info_url);

            if (token_info && token_info.decimals !== undefined) {
              const decimals = parseFloat(token_info.decimals);
              const balance = token.balance / 10 ** decimals;
              return balance * 10000;
            }
          }
        }
      }
    }
  }
  return null;
}

async function main() {
  const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT_PRIVATE_KEY
  );
  const accountAId = AccountId.fromString(process.env.ACCOUNT1_ID);
  const accountAKey = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT1_PRIVATE_KEY
  );
  const accountBId = AccountId.fromString(process.env.ACCOUNT2_ID);
  const accountBKey = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT2_PRIVATE_KEY
  );
  const accountCId = AccountId.fromString(process.env.ACCOUNT3_ID);
  const accountCKey = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT3_PRIVATE_KEY
  );
  const contractId = AccountId.fromString(
    process.env.REWARD_DISTRIBUTION_CONTRACT_ID
  );

  const accountAAddress = process.env.ACCOUNT1_ADDRESS_ETHER;
  const accountBAddress = process.env.ACCOUNT2_ADDRESS_ETHER;
  const accountCAddress = process.env.ACCOUNT3_ADDRESS_ETHER;
  const mstTokenId = process.env.MST_TOKEN_ADDRESS;
  const mptTokenId = process.env.MPT_TOKEN_ADDRESS;

  const client = Client.forTestnet().setOperator(operatorId, operatorKey);
  const clientA = Client.forTestnet().setOperator(accountAId, accountAKey);
  const clientB = Client.forTestnet().setOperator(accountBId, accountBKey);
  const clientC = Client.forTestnet().setOperator(accountCId, accountCKey);

  try {
    // Initial Setup
    console.log("Initial Setup...");

    // Step 1: Person A stakes 80 MST
    console.log("Person A staking 80 MST...");
    const stakeA = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction(
        "stakeTokens",
        new ContractFunctionParameters().addUint64(80)
      )
      .setMaxTransactionFee(new Hbar(20));
    await stakeA.execute(clientA);
    console.log("Person A staked 80 MST.");

    // Step 2: Person B stakes 20 MST
    console.log("Person B staking 20 MST...");
    const stakeB = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction(
        "stakeTokens",
        new ContractFunctionParameters().addUint64(20)
      )
      .setMaxTransactionFee(new Hbar(20));
    await stakeB.execute(clientB);
    console.log("Person B staked 20 MST.");

    // Wait for 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Step 3: Check rewards after 1 second
    console.log("Checking rewards after 1 second...");
    const claimA1 = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction("claimRewards")
      .setMaxTransactionFee(new Hbar(20));
    await claimA1.execute(clientA);

    const claimB1 = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction("claimRewards")
      .setMaxTransactionFee(new Hbar(20));
    await claimB1.execute(clientB);

    console.log(
      `Person A Rewards: ${await get_token_balance(
        accountAId.toString(),
        mptTokenId
      )}`
    );
    console.log(
      `Person B Rewards: ${await get_token_balance(
        accountBId.toString(),
        mptTokenId
      )}`
    );

    // Wait for 1 more second
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Step 4: Check rewards after 2 seconds
    console.log("Checking rewards after 2 seconds...");
    const claimA2 = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction("claimRewards")
      .setMaxTransactionFee(new Hbar(20));
    await claimA2.execute(clientA);

    const claimB2 = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction("claimRewards")
      .setMaxTransactionFee(new Hbar(20));
    await claimB2.execute(clientB);

    console.log(
      `Person A Rewards: ${await get_token_balance(
        accountAId.toString(),
        mptTokenId
      )}`
    );
    console.log(
      `Person B Rewards: ${await get_token_balance(
        accountBId.toString(),
        mptTokenId
      )}`
    );

    // Step 5: Person C stakes 100 MST
    console.log("Person C staking 100 MST...");
    const stakeC = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction(
        "stakeTokens",
        new ContractFunctionParameters().addUint64(100)
      )
      .setMaxTransactionFee(new Hbar(20));
    await stakeC.execute(clientC);
    console.log("Person C staked 100 MST.");

    // Wait for 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Step 6: Check rewards after Person C stakes
    console.log("Checking rewards after Person C stakes...");
    const claimA3 = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction("claimRewards")
      .setMaxTransactionFee(new Hbar(20));
    await claimA3.execute(clientA);

    const claimB3 = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction("claimRewards")
      .setMaxTransactionFee(new Hbar(20));
    await claimB3.execute(clientB);

    const claimC1 = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction("claimRewards")
      .setMaxTransactionFee(new Hbar(20));
    await claimC1.execute(clientC);

    console.log(
      `Person A Rewards: ${await get_token_balance(
        accountAId.toString(),
        mptTokenId
      )}`
    );
    console.log(
      `Person B Rewards: ${await get_token_balance(
        accountBId.toString(),
        mptTokenId
      )}`
    );
    console.log(
      `Person C Rewards: ${await get_token_balance(
        accountCId.toString(),
        mptTokenId
      )}`
    );

    // Step 7: Person A withdraws their rewards
    console.log("Person A withdrawing their rewards...");
    const withdrawA = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction("claimRewards")
      .setMaxTransactionFee(new Hbar(20));
    await withdrawA.execute(clientA);
    console.log("Person A withdrew their rewards.");

    console.log(
      `Person A Rewards after withdrawal: ${await get_token_balance(
        accountAId.toString(),
        mptTokenId
      )}`
    );

    // Final state summary
    console.log("Final State Summary:");
    console.log(
      `Person A Staked: 0 MST, Rewards: ${await get_token_balance(
        accountAId.toString(),
        mptTokenId
      )} MPT`
    );
    console.log(
      `Person B Staked: 20 MST, Rewards: ${await get_token_balance(
        accountBId.toString(),
        mptTokenId
      )} MPT`
    );
    console.log(
      `Person C Staked: 100 MST, Rewards: ${await get_token_balance(
        accountCId.toString(),
        mptTokenId
      )} MPT`
    );

    console.log("All transactions executed successfully.");
  } catch (error) {
    console.error("Error during contract interaction:", error);
  }
}

main().catch(console.error);
