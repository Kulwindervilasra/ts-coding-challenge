import { Given, Then, When } from "@cucumber/cucumber";
import { accounts } from "../../src/config";
import { AccountBalanceQuery, AccountId, Client, PrivateKey, TokenCreateTransaction, TokenInfoQuery, TokenMintTransaction, TokenType, TokenSupplyType, TransferTransaction, TokenAssociateTransaction } from "@hashgraph/sdk";
import assert from "node:assert";
import { setDefaultTimeout } from "@cucumber/cucumber";
const client = Client.forTestnet();
// Set a higher timeout for this specific scenario (15 seconds)
setDefaultTimeout(15000);
Given(/^A Hedera account with more than (\d+) hbar$/, async function (expectedBalance: number) {
  const account = accounts[0];
  const MY_ACCOUNT_ID = AccountId.fromString(account.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(account.privateKey);
  client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

  const query = new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID);
  const balance = await query.execute(client);
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance);
});

When(/^I create a token named Test Token \(HTT\)$/, async function () {
  const transaction = await new TokenCreateTransaction()
    .setTokenName("Test Token")
    .setTokenSymbol("HTT")
    .setDecimals(2)
    .setInitialSupply(1000)
    .setTreasuryAccountId(client.operatorAccountId!)
    .setAdminKey(client.operatorPublicKey!)
    .setSupplyKey(client.operatorPublicKey!)
    .execute(client);

  const receipt = await transaction.getReceipt(client);
  this.tokenId = receipt.tokenId;
});

Then(/^The token has the name "([^"]*)"$/, async function (expectedName: string) {
  const query = new TokenInfoQuery().setTokenId(this.tokenId);
  const info = await query.execute(client);
  assert.strictEqual(info.name, expectedName);
});

Then(/^The token has the symbol "([^"]*)"$/, async function (expectedSymbol: string) {
  const query = new TokenInfoQuery().setTokenId(this.tokenId);
  const info = await query.execute(client);
  assert.strictEqual(info.symbol, expectedSymbol);
});

Then(/^The token has (\d+) decimals$/, async function (expectedDecimals: number) {
  const query = new TokenInfoQuery().setTokenId(this.tokenId);
  const info = await query.execute(client);
  assert.strictEqual(info.decimals, expectedDecimals);
});

Then(/^The token is owned by the account$/, async function () {
  const query = new TokenInfoQuery().setTokenId(this.tokenId);
  const info = await query.execute(client);
  assert.strictEqual(info.treasuryAccountId?.toString(), client.operatorAccountId?.toString());
});

Then(/^An attempt to mint (\d+) additional tokens succeeds$/, async function (amount: number) {
  const transaction = await new TokenMintTransaction()
    .setTokenId(this.tokenId)
    .setAmount(amount)
    .execute(client);

  const receipt = await transaction.getReceipt(client);
  assert.strictEqual(receipt.status.toString(), "SUCCESS");
});

When(/^I create a fixed supply token named Test Token \(HTT\) with (\d+) tokens$/, async function (initialSupply: number) {
  const transaction = await new TokenCreateTransaction()
    .setTokenName("Test Token")
    .setTokenSymbol("HTT")
    .setDecimals(2)
    .setInitialSupply(initialSupply)
    .setMaxSupply(initialSupply)
    .setTreasuryAccountId(client.operatorAccountId!)
    .setAdminKey(client.operatorPublicKey!)
    .setSupplyKey(client.operatorPublicKey!)
    .setTokenType(TokenType.FungibleCommon)
    .setSupplyType(TokenSupplyType.Finite)
    .execute(client);

  const receipt = await transaction.getReceipt(client);
  this.tokenId = receipt.tokenId;
});

Then(/^The total supply of the token is (\d+)$/, async function (expectedSupply: number) {
  const query = new TokenInfoQuery().setTokenId(this.tokenId);
  const info = await query.execute(client);
  assert.strictEqual(info.totalSupply.toNumber(), expectedSupply);
});

Then(/^An attempt to mint tokens fails$/, async function () {
  try {
    const transaction = await new TokenMintTransaction()
      .setTokenId(this.tokenId)
      .setAmount(1)
      .execute(client);

    await transaction.getReceipt(client);
    assert.fail("Minting should have failed");
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      assert.strictEqual((error as any).status.toString(), "TOKEN_MAX_SUPPLY_REACHED");
    } else {
      assert.fail("Unexpected error type");
    }
  }
});

Given(/^A first hedera account with more than (\d+) hbar$/, async function (expectedBalance: number) {
  const account = accounts[0];
  const MY_ACCOUNT_ID = AccountId.fromString(account.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(account.privateKey);
  client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

  const query = new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID);
  const balance = await query.execute(client);
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance);
});

Given(/^A second Hedera account$/, async function () {
  const account = accounts[1];
  const MY_ACCOUNT_ID = AccountId.fromString(account.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(account.privateKey);
  this.secondAccountId = MY_ACCOUNT_ID; // Store for later use
  // Don't set operator yet, only when needed
});

Given(/^A token named Test Token \(HTT\) with (\d+) tokens$/, async function (initialSupply: number) {
  // Ensure first account is operator
  client.setOperator(AccountId.fromString(accounts[0].id), PrivateKey.fromStringECDSA(accounts[0].privateKey));

  const transaction = await new TokenCreateTransaction()
    .setTokenName("Test Token")
    .setTokenSymbol("HTT")
    .setDecimals(2)
    .setInitialSupply(initialSupply)
    .setTreasuryAccountId(client.operatorAccountId!)
    .setAdminKey(client.operatorPublicKey!)
    .setSupplyKey(client.operatorPublicKey!)
    .execute(client);

  const receipt = await transaction.getReceipt(client);
  this.tokenId = receipt.tokenId;
});

Given(/^The first account holds (\d+) HTT tokens$/, async function (amount: number) {
  // Ensure first account is operator
  client.setOperator(AccountId.fromString(accounts[0].id), PrivateKey.fromStringECDSA(accounts[0].privateKey));

  const query = new TokenInfoQuery().setTokenId(this.tokenId);
  const info = await query.execute(client);
  assert.strictEqual(info.treasuryAccountId?.toString(), client.operatorAccountId?.toString());
  assert.ok(info.totalSupply.toNumber() >= amount);
});

Given(/^The second account holds (\d+) HTT tokens$/, async function (amount: number) {
  const secondAccountId = AccountId.fromString(accounts[1].id);

  const currentBalance = await new AccountBalanceQuery()
    .setAccountId(secondAccountId)
    .execute(client);

  const currentTokens = currentBalance.tokens?.get(this.tokenId)?.toNumber() || 0;
  // Associate second account with token if needed
  if (!currentTokens)
    await new TokenAssociateTransaction()
      .setAccountId(secondAccountId)
      .setTokenIds([this.tokenId])
      .freezeWith(client)
      .sign(PrivateKey.fromStringECDSA(accounts[1].privateKey))
      .then(tx => tx.execute(client))
      .then(tx => tx.getReceipt(client));

  // Set operator back to first account for transfer
  client.setOperator(AccountId.fromString(accounts[0].id), PrivateKey.fromStringECDSA(accounts[0].privateKey));

  if (currentTokens < amount) {
    const transferAmount = amount - currentTokens;
    await new TransferTransaction()
      .addTokenTransfer(this.tokenId, client.operatorAccountId!, -transferAmount)
      .addTokenTransfer(this.tokenId, secondAccountId, transferAmount)
      .execute(client)
      .then(tx => tx.getReceipt(client));
  }

  const balance = await new AccountBalanceQuery()
    .setAccountId(secondAccountId)
    .execute(client);
  assert.strictEqual(balance.tokens?.get(this.tokenId)?.toNumber(), amount);
});

When(/^The first account creates a transaction to transfer (\d+) HTT tokens to the second account$/, async function (amount: number) {
  const SECOND_ACCOUNT_ID = AccountId.fromString(accounts[1].id);

  // Ensure first account is operator
  client.setOperator(AccountId.fromString(accounts[0].id), PrivateKey.fromStringECDSA(accounts[0].privateKey));

  this.transaction = await new TransferTransaction()
    .addTokenTransfer(this.tokenId, client.operatorAccountId!, -amount)
    .addTokenTransfer(this.tokenId, SECOND_ACCOUNT_ID, amount)
    .freezeWith(client)
    .sign(PrivateKey.fromStringECDSA(accounts[0].privateKey));
});

When(/^The first account submits the transaction$/, async function () {
  // Ensure first account is operator
  client.setOperator(AccountId.fromString(accounts[0].id), PrivateKey.fromStringECDSA(accounts[0].privateKey));

  try {
    const response = await this.transaction.execute(client);
    const receipt = await response.getReceipt(client);
    assert.strictEqual(receipt.status.toString(), "SUCCESS");
  } catch (error) {
    console.error("Transaction submission failed:", error);
    throw error;
  }
});

When(/^The second account creates a transaction to transfer (\d+) HTT tokens to the first account$/, async function (amount: number) {
  const FIRST_ACCOUNT_ID = AccountId.fromString(accounts[0].id);

  // Set operator to second account
  client.setOperator(AccountId.fromString(accounts[1].id), PrivateKey.fromStringECDSA(accounts[1].privateKey));

  this.transaction = await new TransferTransaction()
    .addTokenTransfer(this.tokenId, client.operatorAccountId!, -amount)
    .addTokenTransfer(this.tokenId, FIRST_ACCOUNT_ID, amount)
    .freezeWith(client)
    .sign(PrivateKey.fromStringECDSA(accounts[1].privateKey));
});

Then(/^The first account has paid for the transaction fee$/, async function () {
  const query = new AccountBalanceQuery().setAccountId(accounts[0].id);
  const balance = await query.execute(client);
  assert.ok(balance.hbars.toBigNumber().toNumber() < accounts[0].initialBalance);
});


Given(/^A first hedera account with more than (\d+) hbar and (\d+) HTT tokens$/, async function (expectedHbar: number, expectedTokens: number) {
  const account = accounts[0];
  const MY_ACCOUNT_ID = AccountId.fromString(account.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(account.privateKey);
  client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

  const query = new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID);
  const balance = await query.execute(client);
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedHbar);
  assert.ok(balance.tokens !== null, "Tokens should not be null");

  const currentTokens = balance.tokens?.get(this.tokenId)?.toNumber() || 0;
  if (currentTokens < expectedTokens) {
    await new TokenMintTransaction()
      .setTokenId(this.tokenId)
      .setAmount(expectedTokens - currentTokens)
      .execute(client)
      .then(tx => tx.getReceipt(client));
  }

  const finalBalance = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID).execute(client);
  assert.ok(finalBalance.tokens?.get(this.tokenId)?.toNumber() > expectedTokens);
});

Given(/^A second Hedera account with (\d+) hbar and (\d+) HTT tokens$/, async function (expectedHbar: number, expectedTokens: number) {
  const account = accounts[1];
  const MY_ACCOUNT_ID = AccountId.fromString(account.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(account.privateKey);

  await new TokenAssociateTransaction()
    .setAccountId(MY_ACCOUNT_ID)
    .setTokenIds([this.tokenId])
    .freezeWith(client)
    .sign(MY_PRIVATE_KEY)
    .then(tx => tx.execute(client))
    .then(tx => tx.getReceipt(client));

  client.setOperator(AccountId.fromString(accounts[0].id), PrivateKey.fromStringECDSA(accounts[0].privateKey));

  const balance = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID).execute(client);
  assert.ok(balance.hbars.toBigNumber().toNumber() >= expectedHbar);

  const currentTokens = balance.tokens?.get(this.tokenId)?.toNumber() || 0;
  if (currentTokens < expectedTokens) {
    await new TransferTransaction()
      .addTokenTransfer(this.tokenId, client.operatorAccountId!, -(expectedTokens - currentTokens))
      .addTokenTransfer(this.tokenId, MY_ACCOUNT_ID, expectedTokens - currentTokens)
      .execute(client)
      .then(tx => tx.getReceipt(client));
  }

  const finalBalance = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID).execute(client);
  assert.strictEqual(finalBalance.tokens?.get(this.tokenId)?.toNumber(), expectedTokens);
});

Given(/^A third Hedera account with (\d+) hbar and (\d+) HTT tokens$/, async function (expectedHbar: number, expectedTokens: number) {
  const account = accounts[2];
  const MY_ACCOUNT_ID = AccountId.fromString(account.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(account.privateKey);

  try {
    // Associate token
    const associateTx = await new TokenAssociateTransaction()
      .setAccountId(MY_ACCOUNT_ID)
      .setTokenIds([this.tokenId])
      .freezeWith(client)
      .sign(MY_PRIVATE_KEY);

    const associateResponse = await associateTx.execute(client);
    await associateResponse.getReceipt(client);

    // Set operator to first account for setup
    client.setOperator(AccountId.fromString(accounts[0].id), PrivateKey.fromStringECDSA(accounts[0].privateKey));

    const balance = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID).execute(client);
    assert.ok(balance.hbars.toBigNumber().toNumber() >= expectedHbar);

    const currentTokens = balance.tokens?.get(this.tokenId)?.toNumber() || 0;
    if (currentTokens < expectedTokens) {
      const transferTx = await new TransferTransaction()
        .addTokenTransfer(this.tokenId, client.operatorAccountId!, -(expectedTokens - currentTokens))
        .addTokenTransfer(this.tokenId, MY_ACCOUNT_ID, expectedTokens - currentTokens)
        .execute(client);
      await transferTx.getReceipt(client);
    }

    const finalBalance = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID).execute(client);
    assert.strictEqual(finalBalance.tokens?.get(this.tokenId)?.toNumber(), expectedTokens);
  } catch (error) {
    console.error("Error in third account setup:", error);
    throw error;
  }
});

Given(/^A fourth Hedera account with (\d+) hbar and (\d+) HTT tokens$/, async function (expectedHbar: number, expectedTokens: number) {
  const account = accounts[3];
  const MY_ACCOUNT_ID = AccountId.fromString(account.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(account.privateKey);

  try {
    // Associate token
    const associateTx = await new TokenAssociateTransaction()
      .setAccountId(MY_ACCOUNT_ID)
      .setTokenIds([this.tokenId])
      .freezeWith(client)
      .sign(MY_PRIVATE_KEY);

    const associateResponse = await associateTx.execute(client);
    await associateResponse.getReceipt(client);

    // Set operator to first account for setup
    client.setOperator(AccountId.fromString(accounts[0].id), PrivateKey.fromStringECDSA(accounts[0].privateKey));

    const balance = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID).execute(client);
    assert.ok(balance.hbars.toBigNumber().toNumber() >= expectedHbar);

    const currentTokens = balance.tokens?.get(this.tokenId)?.toNumber() || 0;
    if (currentTokens < expectedTokens) {
      const transferTx = await new TransferTransaction()
        .addTokenTransfer(this.tokenId, client.operatorAccountId!, -(expectedTokens - currentTokens))
        .addTokenTransfer(this.tokenId, MY_ACCOUNT_ID, expectedTokens - currentTokens)
        .execute(client);
      await transferTx.getReceipt(client);
    }

    const finalBalance = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID).execute(client);
    assert.strictEqual(finalBalance.tokens?.get(this.tokenId)?.toNumber(), expectedTokens);
  } catch (error) {
    console.error("Error in fourth account setup:", error);
    throw error;
  }
});

When(/^A transaction is created to transfer (\d+) HTT tokens out of the first and second account and (\d+) HTT tokens into the third account and (\d+) HTT tokens into the fourth account$/, async function (amount1: number, amount2: number, amount3: number) {
  const account1 = accounts[0];
  const account2 = accounts[1];
  const account3 = accounts[2];
  const account4 = accounts[3];

  client.setOperator(AccountId.fromString(account1.id), PrivateKey.fromStringECDSA(account1.privateKey));

  this.transaction = await new TransferTransaction()
    .addTokenTransfer(this.tokenId, account1.id, -amount1)  // -10 from first account
    .addTokenTransfer(this.tokenId, account2.id, -amount1)  // -10 from second account (using amount1 as both are 10)
    .addTokenTransfer(this.tokenId, account3.id, amount2)   // +5 to third account
    .addTokenTransfer(this.tokenId, account4.id, amount3)   // +15 to fourth account
    .freezeWith(client);

  await this.transaction.sign(PrivateKey.fromStringECDSA(account1.privateKey));
  await this.transaction.sign(PrivateKey.fromStringECDSA(account2.privateKey));
});

Then(/^The third account holds (\d+) HTT tokens$/, async function (expectedTokens: number) {
  const query = new AccountBalanceQuery().setAccountId(accounts[2].id);
  const balance = await query.execute(client);
  assert.strictEqual(balance.tokens?.get(this.tokenId)?.toNumber(), expectedTokens);
});

Then(/^The fourth account holds (\d+) HTT tokens$/, async function (expectedTokens: number) {
  const query = new AccountBalanceQuery().setAccountId(accounts[3].id);
  const balance = await query.execute(client);
  assert.strictEqual(balance.tokens?.get(this.tokenId)?.toNumber(), expectedTokens);
});

