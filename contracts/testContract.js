require("dotenv").config();
const {
  AccountId,
  PrivateKey,
  Client,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
  TokenMintTransaction,
} = require("@hashgraph/sdk");

async function main() {
  const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);
  const operatorKey = PrivateKey.fromStringECDSA(
    process.env.ACCOUNT_PRIVATE_KEY
  );
  const mptTokenId = process.env.MPT_TOKEN_ADDRESS;
  
  const mstTokenId = process.env.MST_TOKEN_ADDRESS;
  const treasuryAddress = AccountId.fromString(process.env.TREASURY_ADDRESS);
  const contractId = process.env.REWARD_DISTRIBUTION_CONTRACT_ID;

  const client = Client.forTestnet()
    .setOperator(operatorId, operatorKey)
    .setDefaultMaxTransactionFee(new Hbar(20));

  try {
    // Mint tokens using the TokenMintTransaction
    console.log("Minting new tokens...");
    const tokenMintTx = await new TokenMintTransaction()
      .setTokenId(mptTokenId)
      .setAmount(1000)
      .setMaxTransactionFee(new Hbar(20)) // Use when HBAR is under 10 cents
      .freezeWith(client);

    // Sign with the operator private key
    const signTx = await tokenMintTx.sign(operatorKey);

    // Submit the transaction to a Hedera network
    const txResponse = await signTx.execute(client);

    // Request the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the transaction consensus status
    const transactionStatus = receipt.status;

    console.log(
      "The transaction consensus status " + transactionStatus.toString()
    );
  } catch (error) {
    console.error("Error during minting tokens:", error);
  }

  try {
    // Staking tokens by transferring MST tokens to the treasury address
    console.log("Staking tokens...");
    const stakeTx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction(
        "transferMstTokens",
        new ContractFunctionParameters()
          .addUint64(1000) // Specify the amount to stake
          .addAddress(treasuryAddress.toSolidityAddress()) // Specify the treasury address as the recipient
      )
      .setMaxTransactionFee(new Hbar(20)); // Set max transaction fee to 20 HBAR

    const stakeTxSubmit = await stakeTx.execute(client);
    const stakeTxReceipt = await stakeTxSubmit.getReceipt(client);
    console.log(`- Tokens staked: ${stakeTxReceipt.status.toString()}`);
  } catch (error) {
    console.error("Error during staking tokens:", error);
  }
}

main().catch(console.error);
