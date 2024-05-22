console.clear();
require("dotenv").config();
const {
  Client,
  AccountId,
  PrivateKey,
  AccountAllowanceApproveTransaction,
} = require("@hashgraph/sdk");

const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);
const operatorKey = PrivateKey.fromStringECDSA(process.env.ACCOUNT_PRIVATE_KEY);

const account1Id = AccountId.fromString(process.env.ACCOUNT1_ID);
const account2Id = AccountId.fromString(process.env.ACCOUNT2_ID);
const account3Id = AccountId.fromString(process.env.ACCOUNT3_ID);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function approveAllowance(client, tokenAddress, spenderId, amount) {
  const transaction = new AccountAllowanceApproveTransaction()
    .approveTokenAllowance(tokenAddress, operatorId, spenderId, amount)
    .freezeWith(client);
  const signTx = await transaction.sign(operatorKey);
  const txResponse = await signTx.execute(client);
  const receipt = await txResponse.getReceipt(client);
  console.log(
    `- Allowance approved for ${amount} of token ${tokenAddress} to ${spenderId.toString()}: ${receipt.status.toString()}`
  );
}

async function main() {
  // Ensure required environment variables are available
  if (
    !process.env.ACCOUNT_ID ||
    !process.env.ACCOUNT_PRIVATE_KEY ||
    !process.env.ACCOUNT1_ID ||
    !process.env.ACCOUNT1_PRIVATE_KEY ||
    !process.env.ACCOUNT2_ID ||
    !process.env.ACCOUNT2_PRIVATE_KEY ||
    !process.env.ACCOUNT3_ID ||
    !process.env.ACCOUNT3_PRIVATE_KEY ||
    !process.env.MST_TOKEN_ADDRESS ||
    !process.env.MPT_TOKEN_ADDRESS
  ) {
    throw new Error("Please set required keys in .env file.");
  }

  // Approve allowances for all accounts
  console.log("Approving allowances for all accounts...");

  await approveAllowance(
    client,
    process.env.MST_TOKEN_ADDRESS,
    account1Id,
    10000000
  );
  await approveAllowance(
    client,
    process.env.MST_TOKEN_ADDRESS,
    account2Id,
    10000000
  );
  await approveAllowance(
    client,
    process.env.MST_TOKEN_ADDRESS,
    account3Id,
    10000000
  );
  await approveAllowance(
    client,
    process.env.MPT_TOKEN_ADDRESS,
    account1Id,
    10000000
  );
  await approveAllowance(
    client,
    process.env.MPT_TOKEN_ADDRESS,
    account2Id,
    10000000
  );
  await approveAllowance(
    client,
    process.env.MPT_TOKEN_ADDRESS,
    account3Id,
    10000000
  );

  console.log("Allowances approved.");
}

main().catch(console.error);
