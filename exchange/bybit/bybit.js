const { WebSocket, fetch, fs, path, axios, winston, Pool, readline, promisify, copyFrom, pgp } = require('./../../dependencies/dependencies.js');

const { updateAdsInDatabase } = require(path.join(__dirname, '..', '..', 'function', 'bdFunction', 'updateDB.js'));
const { mergePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'mergePaymentMethods.js'));
const { updatePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'paymantChange.js'));
const { logError } = require(path.join(__dirname, '..', '..', 'function', 'logFunction', 'logFunction.js'));
const filename = path.parse(__filename).name;

async function fetchAdsForCrypto(cryptoCurrency, buyOrSell, payTypes) {
  const url = 'https://api2.bybit.com/fiat/otc/item/online';
  const headers = {
    'Host': 'api2.bybit.com',
  };

  const data = {
  userId:"",
  tokenId: cryptoCurrency,
  currencyId: "RUB",
  payment: payTypes,
  side: buyOrSell,
  size: "10",
  page: "1",
  amount: "",
  authMaker: false,
  canTrade: false
};

  try {
    const response = await axios.post(url, data, { headers });
    const responseData = response.data;
    const dataArray = responseData['result']['items'];

    if ((Array.isArray(dataArray) && dataArray.length === 0) || dataArray === null || dataArray === undefined) {
      return;
    }

    const adsList = [];
    for (let i = 0; i < dataArray.length; i++) {
      const name = dataArray[i]['nickName'];
      const orders_q = parseFloat(dataArray[i]['recentOrderNum']);
      const order_p = parseFloat(dataArray[i]['recentExecuteRate']);
      const payments = updatePaymentMethods(dataArray[i]['payments']);

      const buy_sell = dataArray[i]['side'] === 0 ? 'Sell' : 'Buy'; // status ?

      const price = parseFloat(dataArray[i]['price']);
      const lim_min = parseFloat(dataArray[i]['minAmount']);
      const lim_max = parseFloat(dataArray[i]['maxAmount']);
      const token = dataArray[i]['symbolInfo']['tokenId'];
      const fiat = dataArray[i]['symbolInfo']['currencyId'];
      const available = parseFloat(dataArray[i]['lastQuantity']);
      const adv_no = dataArray[i]['id'];

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
          available,
          adv_no
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
        result.push(fetchAdsForCrypto(cryptoCurrency, buyOrSell, payTypes));
      }
    }
  }
  const dataList = await Promise.all(result);
  return dataList.flat();
}

// 75 - Tinkoff, 185 - Ros, 44 - MTS, 62 - QIWI, 274 - ЮMoney, 64 - Raiff
const payTypesList = [["62"], ["274"], ["64"], ["75"], ["185"], ["44"]];
const cryptoCurrencyList = ['ETH', 'USDC'];
const buyOrSellList = ["1", "0"];

async function fetchAndPrintAds() {
  const allAds = await fetchAdsForCryptoCombinations(cryptoCurrencyList, buyOrSellList, payTypesList);
  const mergeAllAds = mergePaymentMethods(allAds);
  await updateAdsInDatabase(mergeAllAds, filename);
  return mergeAllAds.length;
}

module.exports = { bybit: fetchAndPrintAds };

// async function main() {
//   for (;;) {
//     await fetchAndPrintAds();
//     await new Promise((resolve) => setTimeout(resolve, 31000));
//   }
// }


// main();
