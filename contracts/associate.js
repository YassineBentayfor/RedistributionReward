console.clear();
require("dotenv").config();
const {
  AccountId,
  PrivateKey,
  Client,
  TokenAssociateTransaction,
} = require("@hashgraph/sdk");

async function associateTokenToAccount(client, accountId, accountKey, tokenId) {
  try {
    // Create the Token Associate transaction
    const transaction = await new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds([tokenId])
      .freezeWith(client);

    // Sign the transaction with the private key of the account being associated
    const signTx = await transaction.sign(accountKey);

    // Submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client);

    // Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the transaction consensus status
    const transactionStatus = receipt.status;

    console.log(
      `The transaction asscociation status for ${accountId} is ${transactionStatus.toString()}`
    );
  } catch (error) {
    console.error(`Error associating token for ${accountId}:`, error);
  }
}

async function main() {
  const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT_PRIVATE_KEY
  );
  const tokenId = process.env.TOKEN_ID;
  const account1Id = AccountId.fromString(process.env.ACCOUNT1_ID);
  const account1Key = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT1_PRIVATE_KEY
  );
  const client = Client.forTestnet().setOperator(operatorId, operatorKey);
  const mstTokenId = process.env.MST_TOKEN_ADDRESS;
  const mptTokenId = process.env.MPT_TOKEN_ADDRESS;
  await associateTokenToAccount(client, account1Id, account1Key, mstTokenId);
  await associateTokenToAccount(client, account1Id, account1Key, mptTokenId);
}

main().catch(console.error);
