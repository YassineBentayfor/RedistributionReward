console.clear();
require("dotenv").config();
const {
  Client,
  PrivateKey,
  AccountId,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  Hbar,
  TokenInfoQuery,
} = require("@hashgraph/sdk");

// Configure accounts and client, and generate needed keys
const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);
const operatorKey = PrivateKey.fromString(process.env.ACCOUNT_PRIVATE_KEY);
const treasuryId = operatorId;
const treasuryKey = operatorKey;

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

const supplyKey = PrivateKey.generate();

async function createToken(tokenName, tokenSymbol) {
  try {
    // Create the token
    let tokenCreateTx = await new TokenCreateTransaction()
      .setTokenType(TokenType.FungibleCommon)
      .setTokenName(tokenName)
      .setTokenSymbol(tokenSymbol)
      .setDecimals(2)
      .setInitialSupply(10000)
      .setTreasuryAccountId(treasuryId)
      .setSupplyType(TokenSupplyType.Infinite)
      .setSupplyKey(supplyKey)
      .freezeWith(client);

    // Sign the transaction
    const tokenCreateTxSigned = await tokenCreateTx.sign(treasuryKey);

    // Submit the transaction
    const tokenCreateTxSubmitted = await tokenCreateTxSigned.execute(client);

    // Get the receipt of the transaction
    const tokenCreateTxReceipt = await tokenCreateTxSubmitted.getReceipt(
      client
    );

    // Get the token ID
    const tokenId = tokenCreateTxReceipt.tokenId;

    // Log the created token ID
    console.log(`- Created token with ID: ${tokenId}`);

    // Query the token info using TokenInfoQuery
    try {
      const tokenInfo = await new TokenInfoQuery()
        .setTokenId(tokenId)
        .execute(client);
      console.log(
        `The token info for ${tokenName} is: ${JSON.stringify(
          tokenInfo,
          null,
          2
        )}`
      );
    } catch (tokenInfoError) {
      console.error(
        `Error querying token info for ${tokenName}:`,
        tokenInfoError
      );
    }

    return tokenId;
  } catch (error) {
    console.error(`Error creating ${tokenName}:`, error);
  }
}

async function main() {
  try {
    // Ensure required environment variables are available
    if (!process.env.ACCOUNT_ID || !process.env.ACCOUNT_PRIVATE_KEY) {
      throw new Error("Please set required keys in .env file.");
    }

    // Create Mintable Staking Token (MST)
    const mstTokenId = await createToken("Mintable Staking Token", "MST");
    console.log(`- Created MST token with ID: ${mstTokenId} \n`);

    // Create Mintable Payment Token (MPT)
    const mptTokenId = await createToken("Mintable Payment Token", "MPT");
    console.log(`- Created MPT token with ID: ${mptTokenId} \n`);

    // URLs for tokens
    const mstTokenUrl = `https://hashscan.io/testnet/token/${mstTokenId}`;
    const mptTokenUrl = `https://hashscan.io/testnet/token/${mptTokenId}`;

    console.log(`MST Token URL: ${mstTokenUrl}`);
    console.log(`MPT Token URL: ${mptTokenUrl}`);

    return {
      mstTokenId,
      mptTokenId,
      mstTokenUrl,
      mptTokenUrl,
    };
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

// Run the main function
main();
