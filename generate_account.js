
const {
    AccountId,
    PrivateKey,
    Client,
    AccountCreateTransaction,
    Hbar,
    TransferTransaction,
    AccountBalanceQuery
} = require("@hashgraph/sdk"); // v2.46.0

async function main() {
    let client;
    try {


        // Your account ID and private key from string value
        const MY_ACCOUNT_ID = AccountId.fromString("0.0.5613250");
        const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA("");

        // Pre-configured client for test network (testnet)
        client = Client.forTestnet();

        //Set the operator with the account ID and private key
        client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);


        const query = new AccountBalanceQuery().setAccountId('0.0.5636460');
        const balance = await query.execute(client);
        console.log(balance.toJSON())
        return


        // Start your code here


        // Generate a new key for the account
        // const accountPrivateKey = PrivateKey.generateECDSA();
        // const accountPublicKey = accountPrivateKey.publicKey;

        // const txCreateAccount = new AccountCreateTransaction()
        //     .setAlias(accountPublicKey.toEvmAddress()) //Do NOT set an alias if you need to update/rotate keys 
        //     .setKey(accountPublicKey)
        //     .setInitialBalance(new Hbar(10));

        // //Sign the transaction with the client operator private key and submit to a Hedera network
        // const txCreateAccountResponse = await txCreateAccount.execute(client);

        // //Request the receipt of the transaction
        // const receiptCreateAccountTx = await txCreateAccountResponse.getReceipt(client);

        // //Get the transaction consensus status
        // const statusCreateAccountTx = receiptCreateAccountTx.status;

        // //Get the Account ID o
        // const accountId = receiptCreateAccountTx.accountId;

        // //Get the Transaction ID 
        // const txIdAccountCreated = txCreateAccountResponse.transactionId.toString();

        // console.log("------------------------------ Create Account ------------------------------ ");
        // console.log("Receipt status       :", statusCreateAccountTx.toString());
        // console.log("Transaction ID       :", txIdAccountCreated);
        // console.log("Hashscan URL         :", `https://hashscan.io/testnet/tx/${txIdAccountCreated}`);
        // console.log("Account ID           :", accountId.toString());
        // console.log("Private key          :", accountPrivateKey.toString());
        // console.log("Public key           :", accountPublicKey.toString());

        const accountId = AccountId.fromString("0.0.5636460");
        // Create a transaction to transfer 1 HBAR
        const txTransfer = new TransferTransaction()
            .addHbarTransfer(MY_ACCOUNT_ID, new Hbar(-200))
            .addHbarTransfer(accountId, new Hbar(200)); //Fill in the receiver account ID

        //Submit the transaction to a Hedera network
        const txTransferResponse = await txTransfer.execute(client);

        //Request the receipt of the transaction
        const receiptTransferTx = await txTransferResponse.getReceipt(client);

        //Get the transaction consensus status
        const statusTransferTx = receiptTransferTx.status;

        //Get the Transaction ID
        const txIdTransfer = txTransferResponse.transactionId.toString();

        console.log("-------------------------------- Transfer HBAR ------------------------------ ");
        console.log("Receipt status           :", statusTransferTx.toString());
        console.log("Transaction ID           :", txIdTransfer);
        console.log("Hashscan URL             :", `https://hashscan.io/testnet/tx/${txIdTransfer}`);

    } catch (error) {
        console.error(error);
    } finally {
        if (client) client.close();
    }
}

main();
