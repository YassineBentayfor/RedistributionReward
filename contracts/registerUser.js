const {
  Client,
  PrivateKey,
  AccountId,
  TokenAssociateTransaction,
  TransferTransaction,
  AccountBalanceQuery,
} = require("@hashgraph/sdk");
require("dotenv").config();

const accountId = AccountId.fromString(process.env.ACCOUNT_ID);
const accountKey = PrivateKey.fromStringECDSA(process.env.ACCOUNT_PRIVATE_KEY);
const client = Client.forTestnet().setOperator(accountId, accountKey);

// Function to associate tokens to an account
async function associateToken(client, userAccountId, userPrivateKey) {
  const mstTokenId = process.env.MST_TOKEN_ADDRESS;
  const mptTokenId = process.env.MPT_TOKEN_ADDRESS;

  const transaction = await new TokenAssociateTransaction()
    .setAccountId(userAccountId)
    .setTokenIds([mstTokenId, mptTokenId])
    .freezeWith(client)
    .sign(userPrivateKey);

  const response = await transaction.execute(client);
  const receipt = await response.getReceipt(client);
  console.log(`- Token association status: ${receipt.status}`);
}

// Function to transfer initial MST and MPT tokens to the user
async function transferInitialTokens(client, userAccountId) {
  const mstTokenId = process.env.MST_TOKEN_ADDRESS;
  const mptTokenId = process.env.MPT_TOKEN_ADDRESS;

  // Transfer MST tokens
  let mstTransferTx = await new TransferTransaction()
    .addTokenTransfer(mstTokenId, accountId, -100) // Sending 100 MST tokens from treasury to user
    .addTokenTransfer(mstTokenId, userAccountId, 100)
    .freezeWith(client)
    .sign(accountKey);

  await mstTransferTx.execute(client);

  // Transfer MPT tokens
  let mptTransferTx = await new TransferTransaction()
    .addTokenTransfer(mptTokenId, accountId, -100) // Sending 100 MPT tokens from treasury to user
    .addTokenTransfer(mptTokenId, userAccountId, 100)
    .freezeWith(client)
    .sign(accountKey);

  await mptTransferTx.execute(client);
}

// Function to handle token association and initial transfer for an existing user
async function registerExistingUser(userAccountId, userPrivateKey) {
  const userPrivateKeyObj = PrivateKey.fromString(userPrivateKey);

  await associateToken(client, userAccountId, userPrivateKeyObj);
  await transferInitialTokens(client, userAccountId);

  const balanceQuery = await new AccountBalanceQuery()
    .setAccountId(userAccountId)
    .execute(client);

  return {
    message: "Tokens associated and initial MST and MPT tokens transferred",
    accountId: userAccountId,
    mstBalance: balanceQuery.tokens._map.get(process.env.MST_TOKEN_ADDRESS),
    mptBalance: balanceQuery.tokens._map.get(process.env.MPT_TOKEN_ADDRESS),
  };
}

module.exports = {
  registerExistingUser,
  associateToken,
  transferInitialTokens,
};
