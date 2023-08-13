const { WebSocket, fetch, fs, path, axios, winston, Pool, readline, promisify, copyFrom, pgp } = require('./../../dependencies/dependencies.js');

const { updateAdsInDatabase } = require(path.join(__dirname, '..', '..', 'function', 'bdFunction', 'updateDB.js'));
const { mergePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'mergePaymentMethods.js'));
const { updatePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'paymantChange.js'));
const { logError } = require(path.join(__dirname, '..', '..', 'function', 'logFunction', 'logFunction.js'));
const filename = path.parse(__filename).name;

async function fetchAdsForCrypto(coinId, buyOrSell) {
  let sortType
  if (buyOrSell === 'buy') {
    sortType = 'price_desc'
  } else {
    sortType = 'price_asc'

  }
  const url = `https://www.okx.com/v3/c2c/tradingOrders/getMarketplaceAdsPrelogin?t=1690216571973&side=${buyOrSell}&paymentMethod=all&userType=all&hideOverseasVerificationAds=false&sortType=${sortType}&urlId=15&limit=300&cryptoCurrency=${coinId}&fiatCurrency=rub&currentPage=1&numberPerPage=300`;
  const options = {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
    },
  };
  
  try {
    const response = await fetch(url, options);
    responseData = await response.json();
    const dataArray = responseData['data'][buyOrSell];
    
    if ((Array.isArray(dataArray) && dataArray.length === 0) || dataArray === null || dataArray === undefined) {
      return;
    }

    const adsList = [];
    for (let i = 0; i < dataArray.length; i++) {
      const name = dataArray[i]['nickName'];
      const orders_q = parseFloat(dataArray[i]['completedOrderQuantity']);
      const order_p = parseFloat(dataArray[i]['completedRate']);

      // const payments = updatePaymentMethods(dataArray[i]['paymentMethods']);
      const payments = updatePaymentMethods(dataArray[i]['paymentMethods']);

      const buy_sell = dataArray[i]['side'] === 'sell' ? 'Buy' : 'Sell';
      const price = parseFloat(dataArray[i]['price']);
      const lim_min = parseFloat(dataArray[i]['quoteMinAmountPerOrder']);
      const lim_max = parseFloat(dataArray[i]['quoteMaxAmountPerOrder']);
      const token = dataArray[i]['baseCurrency'].toUpperCase();
      const fiat = dataArray[i]['quoteCurrency'].toUpperCase();
      const adv_no = dataArray[i]['id'];
      const available = parseFloat(dataArray[i]['availableAmount']);

      if (price && payments && payments.length !== 0) {
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

async function fetchAdsForCryptoV2(coinId, buyOrSell, payType) {
  let sortType
  if (buyOrSell === 'buy') {
    sortType = 'price_desc'
  } else {
    sortType = 'price_asc'
  }

  const url = `https://www.okx.com/v3/c2c/tradingOrders/getMarketplaceAdsPrelogin?t=1690216571973&side=${buyOrSell}&paymentMethod=${payType}&userType=all&hideOverseasVerificationAds=false&sortType=${sortType}&urlId=15&limit=300&cryptoCurrency=${coinId}&fiatCurrency=rub&currentPage=1&numberPerPage=300`;
  const options = {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
    },
  };
  
  try {
    const response = await fetch(url, options);
    responseData = await response.json();
    const dataArray = responseData['data'][buyOrSell];
    
    if ((Array.isArray(dataArray) && dataArray.length === 0) || dataArray === null || dataArray === undefined) {
      return;
    }

    const adsList = [];
    for (let i = 0; i < dataArray.length; i++) {
      const name = dataArray[i]['nickName'];
      const orders_q = parseFloat(dataArray[i]['completedOrderQuantity']);
      const order_p = parseFloat(dataArray[i]['completedRate']) * 100;

      // const payments = updatePaymentMethods(dataArray[i]['paymentMethods']);
      const payments = updatePaymentMethods(dataArray[i]['paymentMethods']);

      const buy_sell = dataArray[i]['side'] === 'sell' ? 'Buy' : 'Sell';
      const price = parseFloat(dataArray[i]['price']);
      const lim_min = parseFloat(dataArray[i]['quoteMinAmountPerOrder']);
      const lim_max = parseFloat(dataArray[i]['quoteMaxAmountPerOrder']);
      const token = dataArray[i]['baseCurrency'].toUpperCase();
      const fiat = dataArray[i]['quoteCurrency'].toUpperCase();
      const adv_no = dataArray[i]['id'];
      const available = parseFloat(dataArray[i]['availableAmount']);

      if (price && payments && payments.length !== 0) {
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
      result.push(fetchAdsForCrypto(cryptoCurrency, buyOrSell));
    }
  }

  cryptoCurrencyList = ['usdt'];
  buyOrSellList = ['buy', 'sell'];
  payTypesList = ['QiWi', 'Yandex.Money'];

  for (const cryptoCurrency of cryptoCurrencyList) {
    for (const buyOrSell of buyOrSellList) {
      for (const payTypes of payTypesList) {
        result.push(fetchAdsForCryptoV2(cryptoCurrency, buyOrSell, payTypes));
      }
    }
  }

  const dataList = await Promise.all(result);
  return dataList.flat();
}

const cryptoCurrencyList = ['usdt', 'btc', 'eth', 'usdc', 'dai', 'tusd'];
const buyOrSellList = ['buy', 'sell'];
// const payTypesList = ['Tinkoff', 'Sberbank', 'QiWi', 'Raiffaizen', 'MTS+Bank', 'YooMoney'];
const payTypesList = ['QiWi', 'Yandex.Money'];

async function fetchAndPrintAds() {
  const allAds = await fetchAdsForCryptoCombinations(cryptoCurrencyList, buyOrSellList, payTypesList);
  const mergeAllAds = mergePaymentMethods(allAds);
  await updateAdsInDatabase(mergeAllAds, filename);
  return mergeAllAds.length;
}

module.exports = { okx: fetchAndPrintAds };

// async function main() {
//   for (;;) {
//     const num = await fetchAndPrintAds();
//     await new Promise((resolve) => setTimeout(resolve, 31000));
//   }
// }

// main();
