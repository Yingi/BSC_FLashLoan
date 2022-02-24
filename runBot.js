require("dotenv").config();
const Web3 = require("web3");
const abis = require("./abis");
const { mainnet: addresses } = require("./addresses");
//const Flashloan = require("./build/contracts/FlashSwap.json");

const web3 = new Web3(
  new Web3.providers.WebsocketProvider(process.env.WSS_URL)
);
const { address: admin } = web3.eth.accounts.wallet.add(
  process.env.PRIVATE_KEY
);

const flashloanUSDT = "10000";
const flashloanBUSD = "10000";
const flashloanWBNB = "100";
const amountInBUSD = web3.utils.toBN(web3.utils.toWei(flashloanBUSD));
const amountInWBNB = web3.utils.toBN(web3.utils.toWei(flashloanWBNB));

// Trying USDT
const amountInUSDT = web3.utils.toBN(web3.utils.toWei(flashloanUSDT));

const ApeSwap = new web3.eth.Contract(
  abis.apeSwap.router,
  addresses.apeSwap.router
);

const PancakeSwap = new web3.eth.Contract(
  abis.pancakeSwap.router,
  addresses.pancakeSwap.router
);

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function stop(reason) {
  throw new Error(reason);
}

const init = async () => {
  const networkId = await web3.eth.net.getId();
  {/**
  const flashloan = new web3.eth.Contract(
    Flashloan.abi,
    Flashloan.networks[networkId].address
  ); */}


  web3.eth
    .subscribe("newBlockHeaders")
    .on("data", async (block) => {
      console.log(`New block received. Block # ${block.number}`);

      const amountsOut1 = await ApeSwap.methods
        .getAmountsIn(amountInBUSD, [
          addresses.tokens.COIN98,
          addresses.tokens.BUSD,
        ])
        .call();
      const amountsOut2 = await ApeSwap.methods
        .getAmountsOut(amountInBUSD, [
          addresses.tokens.BUSD,
          addresses.tokens.COIN98,
        ])
        .call();

     
      const aperesults = {
        buy: amountsOut1[0] / 10 ** 18,
        sell: amountsOut2[1] / 10 ** 18,
      };

      
      console.log(`ApeSwap ${flashloanBUSD} BUSD/COIN98 `);
      console.log(aperesults);

      

      

    })
    .on("error", (error) => {
      console.log(error);
    });
};
init();