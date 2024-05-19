console.clear();
require("dotenv").config();
const {
  Client,
  AccountId,
  PrivateKey,
  FileCreateTransaction,
  FileAppendTransaction,
  ContractCreateTransaction,
  ContractFunctionParameters,
  TokenUpdateTransaction,
  ContractExecuteTransaction,
} = require("@hashgraph/sdk");
const fs = require("fs").promises;
const axios = require("axios");

function hederaToHexAddress(hederaAddress) {
  const [shard, realm, num] = hederaAddress.split(".").map(Number);
  const buf = Buffer.alloc(20);
  buf.writeUInt32BE(shard, 0);
  buf.writeUInt32BE(realm, 4);
  buf.writeUInt32BE(num, 8);
  return "0x" + buf.toString("hex").padStart(40, "0");
}

const operatorId = AccountId.fromString(process.env.ACCOUNT_ID);
const operatorKey = PrivateKey.fromStringECDSA(process.env.ACCOUNT_PRIVATE_KEY);
const account2Id = AccountId.fromString(process.env.ACCOUNT2_ID);
const account2Key = PrivateKey.fromStringECDSA(
  process.env.ACCOUNT2_PRIVATE_KEY
);
const contractId = AccountId.fromString(
  process.env.REWARD_DISTRIBUTION_CONTRACT_ID
);
const mstToken = AccountId.fromString(process.env.MST_TOKEN_ID);
const mptToken = AccountId.fromString(process.env.MPT_TOKEN_ID);

const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function queryAccountBalance(accountId) {
  try {
    const response = await axios.get(
      `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}`
    );
    console.log(`Balance for account ${accountId}:`, response.data.balance);
  } catch (error) {
    console.error(`Failed to query balance for account ${accountId}:`, error);
  }
}

async function main() {
  console.log(`Step 1: Token Association`);

  try {
    const associateTx = await new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(1000000)
      .setFunction(
        "tokenAssociate",
        new ContractFunctionParameters()
          .addAddress(account2Id.toSolidityAddress())
          .addAddressArray([
            mstToken.toSolidityAddress(),
            mptToken.toSolidityAddress(),
          ])
      )

      .freezeWith(client)
      .sign(operatorKey);

    const associateResponse = await associateTx.execute(client);
    const associateReceipt = await associateResponse.getReceipt(client);
    console.log(
      "Token association status:",
      associateReceipt.status.toString()
    );

    await queryAccountBalance(account2Id.toString());
  } catch (error) {
    console.error("Token Association Error:", error);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
