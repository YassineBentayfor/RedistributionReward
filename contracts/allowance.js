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
const account1Key = PrivateKey.fromStringECDSA(
  process.env.ACCOUNT1_PRIVATE_KEY
);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function main() {
  // Ensure required environment variables are available
  if (
    !process.env.ACCOUNT_ID ||
    !process.env.ACCOUNT_PRIVATE_KEY ||
    !process.env.ACCOUNT1_ID ||
    !process.env.ACCOUNT1_PRIVATE_KEY ||
    !process.env.MST_TOKEN_ADDRESS ||
    !process.env.MPT_TOKEN_ADDRESS
  ) {
    throw new Error("Please set required keys in .env file.");
  }

  // Approve the token allowance for MST
  console.log("Approving MST token allowance...");
  const transactionAllowanceMST = new AccountAllowanceApproveTransaction()
    .approveTokenAllowance(
      process.env.MST_TOKEN_ADDRESS,
      operatorId,
      account1Id,
      10000000
    )
    .freezeWith(client);

  // Sign the transaction with the necessary keys
  const signTxAllowanceMST = await transactionAllowanceMST.sign(operatorKey);
  const txResponseAllowanceMST = await signTxAllowanceMST.execute(client);
  const receiptAllowanceMST = await txResponseAllowanceMST.getReceipt(client);
  const transactionStatusAllowanceMST = receiptAllowanceMST.status;

  console.log(
    "The transaction consensus status for the MST allowance function is " +
      transactionStatusAllowanceMST.toString()
  );

  // Approve the token allowance for MPT
  console.log("Approving MPT token allowance...");
  const transactionAllowanceMPT = new AccountAllowanceApproveTransaction()
    .approveTokenAllowance(
      process.env.MPT_TOKEN_ADDRESS,
      operatorId,
      account1Id,
      10000000
    )
    .freezeWith(client);

  // Sign the transaction with the necessary keys
  const signTxAllowanceMPT = await transactionAllowanceMPT.sign(operatorKey);
  const txResponseAllowanceMPT = await signTxAllowanceMPT.execute(client);
  const receiptAllowanceMPT = await txResponseAllowanceMPT.getReceipt(client);
  const transactionStatusAllowanceMPT = receiptAllowanceMPT.status;

  console.log(
    "The transaction consensus status for the MPT allowance function is " +
      transactionStatusAllowanceMPT.toString()
  );
}

main().catch(console.error);
