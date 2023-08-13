const { WebSocket, fetch, fs, path, axios, winston, Pool, readline, promisify, copyFrom, pgp } = require('./../../dependencies/dependencies.js');

const { updateAdsInDatabase } = require(path.join(__dirname, '..', '..', 'function', 'bdFunction', 'updateDB.js'));
const { mergePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'mergePaymentMethods.js'));
const { updatePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'paymantChange.js'));
const { logError } = require(path.join(__dirname, '..', '..', 'function', 'logFunction', 'logFunction.js'));
const filename = path.parse(__filename).name;

async function fetchAdsForCrypto(coinId, buyOrSell, payTypes) {
  const url = `https://www.huobi.com/-/x/otc/v1/data/trade-market?coinId=${coinId}&currency=11&tradeType=${buyOrSell}&currPage=1&payMethod=${payTypes}&acceptOrder=0&country=&blockType=general&online=1&range=0&amount=&onlyTradable=false&isFollowed=false`;

  try {
    const response = await axios.get(url);
    const responseData = response.data;
    const dataArray = responseData['data'];
    
    if ((Array.isArray(dataArray) && dataArray.length === 0) || dataArray === null || dataArray === undefined) {
      return;
    }

    const tokenMap = {
      2: 'USDT',
      4: 'HT',
      62: 'USDD',
      1: 'BTC',
      22: 'TRX',
      3: 'ETH',
      5: 'EOS',
      7: 'XRP',
      8: 'LTC',
    };
    const adsList = [];
    const payMethods = [];
    for (let i = 0; i < dataArray.length; i++) {
      if (dataArray[i]['isOnline'] === false) {
        continue;
      }
      const name = dataArray[i]['userName'];
      const orders_q = parseFloat(dataArray[i]['tradeMonthTimes']);
      const order_p = parseFloat(dataArray[i]['orderCompleteRate']);

      const payMethods = [];
      dataArray[i]['payMethods'].forEach((payMethod) => { // 28 - Tinkoff, 29 - Sber, 356 - MTS, 36 - Raiff, 9 - QIWI, 19 - Юmoney
        payMethods.push(payMethod.name);
      });
      const payments = updatePaymentMethods(payMethods);
      
      const buy_sell = dataArray[i]['tradeType'] === 0 ? 'Sell' : 'Buy'; // 1 - buy, 0 - sell
      const price = parseFloat(dataArray[i]['price']);
      const lim_min = parseFloat(dataArray[i]['minTradeLimit']);
      const lim_max = parseFloat(dataArray[i]['maxTradeLimit']);

      const tokenId = dataArray[i]['coinId'];
      const token = tokenMap[tokenId] || 'Unknown Token';

      const fiat = dataArray[i]['currency'] === 11 ? 'RUB' : 'error'; // 11 - RUB
      const adv_no = dataArray[i]['id']; // uid ???
      const available = parseFloat(dataArray[i]['tradeCount']); // 11 - RUB

      if (price && payments) {
        adsList.push({
          name,
          orders_q,
          order_p,
          payments,
          buy_sell,
          price,
          lim_min,
          lim_max,
          token,
          fiat,
          adv_no,
          available,
        });
      }
    }
    return adsList;
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error.message);
    throw error;
  }
}

async function fetchAdsForCryptoCombinations(cryptoCurrencyList, buyOrSellList, payTypesList) {
  const result = [];

  for (const cryptoCurrency of cryptoCurrencyList) {
    for (const buyOrSell of buyOrSellList) {
      for (const payTypes of payTypesList) {
        const data = await fetchAdsForCrypto(cryptoCurrency, buyOrSell, payTypes);
        // await new Promise((resolve) => setTimeout(resolve, 500));
        result.push(data);
      }
    }
  }

  return result.flat();
}

// 2 - USDT, 4 - USDD, 1 - BTC, 22 - TRX, 3 - ETH, 5 - EOS, 7 - XRP, 8 - LTC
// const cryptoCurrencyList = [2, 4, 1, 22, 3, 5, 7, 8];
const cryptoCurrencyList = [2, 4, 1, 22];

const buyOrSellList = ['buy', 'sell'];

 // 28 - Tinkoff, 29 - Sber, 356 - MTS, 36 - Raiff, 9 - QIWI, 19 - Юmoney
const payTypesList = [28, 29, 356, 36, 9, 19];


async function fetchAndPrintAds() {
  const allAds = await fetchAdsForCryptoCombinations(cryptoCurrencyList, buyOrSellList, payTypesList);
  const mergeAllAds = mergePaymentMethods(allAds);
  await updateAdsInDatabase(mergeAllAds, filename);
  return mergeAllAds.length;
}

module.exports = { huobi: fetchAndPrintAds };

// async function main() {
//   for (;;) {
//     await fetchAndPrintAds();
//     await new Promise((resolve) => setTimeout(resolve, 31000));
//   }
// }

// main();