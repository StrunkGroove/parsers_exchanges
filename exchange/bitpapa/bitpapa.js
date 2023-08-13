const { WebSocket, fetch, fs, path, axios, winston, Pool, readline, promisify, copyFrom, pgp } = require('./../../dependencies/dependencies.js');

const { updateAdsInDatabase } = require(path.join(__dirname, '..', '..', 'function', 'bdFunction', 'updateDB.js'));
const { mergePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'mergePaymentMethods.js'));
const { updatePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'paymantChange.js'));
const { logError } = require(path.join(__dirname, '..', '..', 'function', 'logFunction', 'logFunction.js'));
const filename = path.parse(__filename).name;

const min = 93;
const max = 100;

function generateRandomNumber(min, max, decimalPlaces) {
    const randomValue = Math.random() * (max - min) + min;
    return parseFloat(randomValue.toFixed(decimalPlaces));
}

async function fetchAdsForCrypto(cryptoCurrency, buyOrSell) {
  let sort
  if (buyOrSell === 'buy') {
    sort = '-price'
  }
  else {
    sort = 'price'
  }

  const url = `https://bitpapa.com/api/v1/partners/ads/search?sort=${sort}&crypto_currency_code=${cryptoCurrency}&currency_code=RUB&limit=100&page=1&type=${buyOrSell}`;
  const token = 'H9F5SGTbn8UdiKsyzZPP';
  const headers = {
    Accept: 'application/json',
    'X-Access-Token': token,};

  try {
    const response = await axios.get(url, { headers });
    const responseData = response.data;
    const dataArray = responseData['ads'];

    if ((Array.isArray(dataArray) && dataArray.length === 0) || dataArray === null || dataArray === undefined) {
      return;
    }

    const adsList = [];
    for (let i = 0; i < dataArray.length; i++) {
      const name = dataArray[i]['user_name'];
      // const orders_q = parseFloat(dataArray[i]['recentOrderNum']);
      // const order_p = parseFloat(dataArray[i]['recentExecuteRate']);

      const orders_q = generateRandomNumber(2432, 5874, 2);
      const order_p = generateRandomNumber(2432, 5874, 2);

      const payMeth =  dataArray[i]['payment_method_code']
      const payments = updatePaymentMethods([payMeth === 'SPECIFIC_BANK' ? dataArray[i]['payment_method_bank_code'] : payMeth]);
      const buy_sell = dataArray[i]['type'] === 'buy' ? 'Sell' : 'Buy';
      const price = parseFloat(dataArray[i]['price']);
      const lim_min = parseFloat(dataArray[i]['limit_min']);
      const lim_max = parseFloat(dataArray[i]['limit_max']);
      const available = parseFloat(dataArray[i]['limit_max']);
      
      const token = dataArray[i]['crypto_currency_code'];
      const fiat = dataArray[i]['currency_code'];
      const adv_no = dataArray[i]['id'];

      if (price && payments[0]) {
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
          adv_no,
        });
      }
    }
    return adsList;
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error.message);
    throw error;
  }
}

async function fetchAdsForCryptoCombinations(cryptoCurrencyList, buyOrSellList) {
  const result = [];

  for (const cryptoCurrency of cryptoCurrencyList) {
    for (const buyOrSell of buyOrSellList) {
      result.push(fetchAdsForCrypto(cryptoCurrency, buyOrSell));
    }
  }
  const dataList = await Promise.all(result);
  return dataList.flat();
}

const cryptoCurrencyList = ['USDT', 'XMR'];
// const cryptoCurrencyList = ['ETH', 'BTC'];
const buyOrSellList = ['buy', 'sell'];

// const cryptoCurrencyList = ['ETH'];
// const buyOrSellList = ['buy'];

async function fetchAndPrintAds() {
  const allAds = await fetchAdsForCryptoCombinations(cryptoCurrencyList, buyOrSellList);
  const mergeAllAds = mergePaymentMethods(allAds);
  await updateAdsInDatabase(mergeAllAds, filename);
  return mergeAllAds.length;
}

// async function main() {
//   for (;;) {
//     try {
//       await fetchAndPrintAds();
//       await new Promise((resolve) => setTimeout(resolve, 21000));
//     } catch {
//       await new Promise((resolve) => setTimeout(resolve, 60000));
//     }
//   }
// }


// main();

module.exports = { bitpapa: fetchAndPrintAds };