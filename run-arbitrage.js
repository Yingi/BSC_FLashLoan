require("dotenv").config();
const Web3 = require("web3");
const abis = require("./abis");
const { mainnet: addresses } = require("./addresses");
const Flashloan = require("./build/contracts/FlashSwap.json");

const web3 = new Web3(
  new Web3.providers.WebsocketProvider(process.env.WSS_URL)
);
const { address: admin } = web3.eth.accounts.wallet.add(
  process.env.PRIVATE_KEY
);


const flashloanUSDT = "10000";
const flashloanBUSD = "10000";
const flashloanWBNB = "100";

// Trying USDT
const amountInUSDT = web3.utils.toBN(web3.utils.toWei(flashloanUSDT));

const amountInBUSD = web3.utils.toBN(web3.utils.toWei(flashloanBUSD));
const amountInWBNB = web3.utils.toBN(web3.utils.toWei(flashloanWBNB));



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
  
  const flashloan = new web3.eth.Contract(
    Flashloan.abi,
    Flashloan.networks[networkId].address
  ); 

  
  

  web3.eth
    .subscribe("newBlockHeaders")
    .on("data", async (block) => {
      console.log(`New block received. Block # ${block.number}`);

      const amountsOut1 = await ApeSwap.methods
        .getAmountsIn(amountInUSDT, [
          addresses.tokens.WBNB,
          addresses.tokens.USDT,
        ])
        .call();
      const amountsOut2 = await ApeSwap.methods
        .getAmountsOut(amountInUSDT, [
          addresses.tokens.USDT,
          addresses.tokens.WBNB,
        ])
        .call();

      
      const amountsOut3 = await PancakeSwap.methods
        .getAmountsIn(amountInUSDT, [
          addresses.tokens.WBNB,
          addresses.tokens.USDT,
        ])
        .call();
      const amountsOut4 = await PancakeSwap.methods
        .getAmountsOut(amountInUSDT, [
          addresses.tokens.USDT,
          addresses.tokens.WBNB,
        ])
        .call();

      const amountsOut5 = await ApeSwap.methods
        .getAmountsIn(amountInWBNB, [
          addresses.tokens.USDT,
          addresses.tokens.WBNB,
        ])
        .call();
      const amountsOut6 = await ApeSwap.methods
        .getAmountsOut(amountInWBNB, [
          addresses.tokens.WBNB,
          addresses.tokens.USDT,
        ])
        .call();

      const amountsOut7 = await PancakeSwap.methods
        .getAmountsIn(amountInWBNB, [
          addresses.tokens.USDT,
          addresses.tokens.WBNB,
        ])
        .call();
      const amountsOut8 = await PancakeSwap.methods
        .getAmountsOut(amountInWBNB, [
          addresses.tokens.WBNB,
          addresses.tokens.USDT,
        ])
        .call();

        
      const aperesults = {
        buy: amountsOut1[0] / 10 ** 18,
        sell: amountsOut2[1] / 10 ** 18,
      };

      
      const aperesults2 = {
        buy: amountsOut5[0] / 10 ** 18,
        sell: amountsOut6[1] / 10 ** 18,
      };

      const pancakeresults = {
        buy: amountsOut3[0] / 10 ** 18,
        sell: amountsOut4[1] / 10 ** 18,
      };
      const pancakeresults2 = {
        buy: amountsOut7[0] / 10 ** 18,
        sell: amountsOut8[1] / 10 ** 18,
      };

      
      console.log(`ApeSwap ${flashloanUSDT} USDT/WBNB `);
      console.log(aperesults);

      console.log(`PancakeSwap ${flashloanUSDT} USDT/WBNB`);
      console.log(pancakeresults);

      console.log(`ApeSwap ${flashloanWBNB} WBNB/USDT`);
      console.log(aperesults2);

      console.log(`PancakeSwap${flashloanWBNB} WBNB/USDT `);
      console.log(pancakeresults2);

      

      //Payback fee calc


      const pancakeBnbPrice =
        (pancakeresults.buy + pancakeresults.sell) / flashloanWBNB / 2;
      const apeswapBnbPrice =
        (aperesults.buy + aperesults.sell) / flashloanWBNB / 2;

      let pancakePaybackCalcUSDT = (pancakeresults.buy / 0.997) * 10 ** 18;
      let apeswapPaybackCalcUSDT = (aperesults.buy / 0.997) * 10 ** 18;
      let apePaybackCalcWbnb = (aperesults2.buy / 0.997) * 10 ** 18;
      let pancakePaybackCalcWbnb = (pancakeresults2.buy / 0.997) * 10 ** 18;

      let repayUSDTPancakeFee =
        pancakePaybackCalcUSDT / 10 ** 18 - pancakeresults.buy;
      let repayUSDTApeswapFee =
        apeswapPaybackCalcUSDT / 10 ** 18 - aperesults.buy;
      let repayWbnbPancakeFee =
        (pancakePaybackCalcWbnb / 10 ** 18 - pancakeresults2.buy) *
        pancakeBnbPrice;
      let repayWbnbApeswapFee =
        (apePaybackCalcWbnb / 10 ** 18 - aperesults2.buy) * apeswapBnbPrice;

      const gasPrice = await web3.eth.getGasPrice();
      const txCost =
        ((330000 * parseInt(gasPrice)) / 10 ** 18) * pancakeBnbPrice;

      //Profit Calc
      const profit1 =
        aperesults.sell - pancakeresults.buy - txCost - repayUSDTApeswapFee;
      const profit2 =
        pancakeresults.sell - aperesults.buy - txCost - repayUSDTPancakeFee;
      const profit3 =
        pancakeresults2.sell - aperesults2.buy - txCost - repayWbnbPancakeFee;
      const profit4 =
        aperesults2.sell - pancakeresults2.buy - txCost - repayWbnbApeswapFee;

      if (profit1 > 0 && profit1 > profit2) {
        console.log("Arb opportunity found!");
        console.log(`Flashloan WBNB on Apeswap at ${aperesults.buy} `);
        console.log(`Sell WBNB on PancakeSwap at ${pancakeresults.sell} `);
        console.log(`Expected cost of flashswap: ${repayUSDTPancakeFee}`);
        console.log(`Expected Gas cost: ${txCost}`);
        console.log(`Expected profit: ${profit1} USDT`);

        let tx = flashloan.methods.startArbitrage(
          addresses.tokens.WBNB,
          addresses.tokens.USDT,
          amountInWBNB.toString(),
          0,
          addresses.apeSwap.factory,
          addresses.pancakeSwap.router,
          pancakePaybackCalcUSDT.toString()
        );

        const data = tx.encodeABI();
        const txData = {
          from: admin,
          to: flashloan.options.address,
          data,
          gas: "330000",
          gasPrice: gasPrice,
        };
        const receipt = await web3.eth.sendTransaction(txData);
        console.log(`Transaction hash: ${receipt.transactionHash}`);
      }

      if (profit2 > 0 && profit2 > profit1) {
        console.log("Arb opportunity found!");
        console.log(`Buy WBNB from PancakeSwap at ${pancakeresults.buy} `);
        console.log(`Sell WBNB from ApeSwap at ${aperesults.sell}`);
        console.log(`Expected cost of flashswap: ${repayUSDTApeswapFee}`);
        console.log(`Expected Gas cost: ${txCost}`);
        console.log(`Expected profit: ${profit2} USDT`);

        let tx = flashloan.methods.startArbitrage(
          addresses.tokens.WBNB, //token1
          addresses.tokens.USDT, //token2
          amountInWBNB.toString(), //amount0
          0, //amount1
          addresses.pancakeSwap.factory, //pancakefactory
          addresses.apeSwap.router, // aperouter
          apeswapPaybackCalcUSDT.toString()
        );

        const data = tx.encodeABI();
        const txData = {
          from: admin,
          to: flashloan.options.address,
          data,
          gas: "330000",
          gasPrice: gasPrice,
        };
        const receipt = await web3.eth.sendTransaction(txData);
        console.log(`Transaction hash: ${receipt.transactionHash}`);
      }

      if (profit3 > 0 && profit3 > profit4) {
        console.log("Arb opportunity found!");
        console.log(`Flashloan USDT on Apeswap at ${aperesults2.buy} `);
        console.log(`Sell BUSD on PancakeSwap at ${pancakeresults2.sell} `);
        console.log(`Expected cost of flashswap: ${repayWbnbApeswapFee}`);
        console.log(`Expected Gas cost: ${txCost}`);
        console.log(`Expected profit: ${profit3} WBNB`);

        let tx = flashloan.methods.startArbitrage(
          addresses.tokens.USDT, //token1
          addresses.tokens.WBNB, //token2
          0, //amount0
          amountInUSDT.toString(), //amount1
          addresses.apeSwap.factory, //apefactory
          addresses.pancakeSwap.router, //pancakerouter
          apePaybackCalcWbnb.toString()
        );

        const data = tx.encodeABI();
        const txData = {
          from: admin,
          to: flashloan.options.address,
          data,
          gas: "330000",
          gasPrice: gasPrice,
        };
        const receipt = await web3.eth.sendTransaction(txData);
        console.log(`Transaction hash: ${receipt.transactionHash}`);
      }

      if (profit4 > 0 && profit4 > profit3) {
        console.log("Arb opportunity found!");
        console.log(`Flashloan USDT on PancakeSwap at ${pancakeresults2.buy} `);
        console.log(`Sell USDT on  at Apeswap ${aperesults2.sell} `);
        console.log(`Expected cost of flashswap: ${repayWbnbPancakeFee}`);
        console.log(`Expected Gas cost: ${txCost}`);
        console.log(`Expected profit: ${profit4} WBNB`);

        let tx = flashloan.methods.startArbitrage(
          //token1
          addresses.tokens.WBNB,
          addresses.tokens.USDT, //token2
          0, //amount0
          amountInBUSD.toString(), //amount1
          addresses.pancakeSwap.factory, //pancakeFactory
          addresses.apeSwap.router, //apeRouter
          pancakePaybackCalcWbnb.toString()
        );

        const data = tx.encodeABI();
        const txData = {
          from: admin,
          to: flashloan.options.address,
          data,
          gas: "330000",
          gasPrice: gasPrice,
        };
        const receipt = await web3.eth.sendTransaction(txData);
        console.log(`Transaction hash: ${receipt.transactionHash}`);
      }

      

    })
    .on("error", (error) => {
      console.log(error);
    });
};
init();