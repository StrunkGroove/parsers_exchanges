const { binance } = require('./exchange/binance/binance.js');
const { bybit } = require('./exchange/bybit/bybit.js');
const { gateio } = require('./exchange/gateio/gateio.js');
const { hodlhodl } = require('./exchange/hodlhodl/hodlhodl.js');
const { huobi } = require('./exchange/huobi/huobi.js');
const { kucoin } = require('./exchange/kucoin/kucoin.js');
const { mexc } = require('./exchange/mexc/mexc.js');
const { okx } = require('./exchange/okx/okx.js');
const { totalcoinio } = require('./exchange/totalcoinio/totalcoinio.js');
const { garantex } = require('./exchange/garantex/garantex.js');
const { bitpapa } = require('./exchange/bitpapa/bitpapa.js');
// const { bitget } = require('./exchange/bitget/bitget.js');
const { beribit } = require('./exchange/beribit/beribit.js');

const { zeroUpdate } = require('./function/bdFunction/zeroUpdate.js');

async function main() {
  await Promise.all([
    run(beribit, 'Beribit', 41000),
    run(binance, 'Binance', 31000),
    run(bybit, 'Bybit', 41000),
    run(gateio, 'Gateio', 5000),
    run(hodlhodl, 'HodlHodl', 31000),
    run(huobi, 'Huobi', 31000),
    run(kucoin, 'Kucoin', 7000),
    run(mexc, 'Mexc', 7000),
    run(okx, 'Okx', 31000),
    run(totalcoinio, 'Totalcoinio', 20000),
    run(garantex, 'Garantex', 41000),
    run(bitpapa, 'Bitpapa', 61000),

    // run(bitget, 'Bitget', 31000),
  ]);
}

async function run_forever() {
  for (;;) {
    try {
      await main();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }
  }
}

run_forever();

async function run(exchangeFunction, functionName, delay) {
  for (;;) {
    try {
      const startTime = new Date();
      const length = await exchangeFunction();
      const endTime = new Date();
      const executionTime = endTime - startTime;

      const currentTime = new Date();
      console.log(`${functionName}, Current Time: ${currentTime.toLocaleString()}, Execution Time: ${executionTime} ms, Number of Rows: ${length}`);

      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      await zeroUpdate(functionName);

      console.error(`Function: ${functionName}, Error:`, error);
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }
  }
}
