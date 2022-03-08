This is a FlashLoan Smart Contract deployed to the Binance Smartchain
You can deploy to a different EVM compatible blockchain if they do have the Pancakeswap and Apeswap DEX deployed on the chain

First install all the required packages

> npm install

You can change the tokens to what suits you in the run-arbitrage.js. I used the BNB/USDT Pair

You must have nodeJS installed in your computer to run the bot

> node run-arbitrage.js

To deploy your smart contract. Do the Following

1. Sign up to a blockchain node. ANKR was used in this project. You can sign up here:  https://app.ankr.com/auth/sign-up

2. On ANKR, create a new project and then copy the URL either WSS_URL or HTTP_URL

3. Create a .env file in the root folder of your project and add the URL you copied. It should look like this:

> WSS_URL=wss://xxxxxxxxxxxxxx

4. To deploy and initiate your smart contract, you will need to have a metamask wallet with at least $10 BNB. You also need the private key of the metamask account and you need to put this inside the .env file to. NOTE: Do not share your private key with anyone else. Your private key can be used to drain you account. So be careful. 

5. So on .env file, you add your private key like this

> PRIVATE_KEY=xxxxxxxxxxxxxxxxxx

6. Finally you can deploy, You should compile your smart contract first using
> truffle compile

7. Then you deploy with the following
> truffle deploy --network BSC





