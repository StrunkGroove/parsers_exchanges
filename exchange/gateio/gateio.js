const { WebSocket, fetch, fs, path, axios, winston, Pool, readline, promisify, copyFrom, pgp } = require('./../../dependencies/dependencies.js');

const { updateAdsInDatabase } = require(path.join(__dirname, '..', '..', 'function', 'bdFunction', 'updateDB.js'));
const { mergePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'mergePaymentMethods.js'));
const { updatePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'paymantChange.js'));
const { logError } = require(path.join(__dirname, '..', '..', 'function', 'logFunction', 'logFunction.js'));
const filename = path.parse(__filename).name;

async function fetchAdsForCrypto(cryptoCurrency) {
  const url = 'https://www.gate.io/json_svr/query_push/?u=21&c=388882';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Referer': 'https://www.gate.io/ru/c2c/market',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': 'https://www.gate.io',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'Te': 'trailers',
    'Connection': 'close'
  };

  const data = `type=push_order_list&symbol=${cryptoCurrency}&big_trade=0&amount=&pay_type=&is_blue=`;

  try {
    const response = await axios.post(url, data, { headers });
    const responseData = response.data;
    const dataArray = responseData['push_order'];

    if ((Array.isArray(dataArray) && dataArray.length === 0) || dataArray === null || dataArray === undefined) {
      return;
    }
    
    const adsList = [];
    for (let i = 0; i < dataArray.length; i++) {
      const name = dataArray[i]['username'];
      const orders_q = parseFloat(dataArray[i]['complete_number']);
      const order_p = parseFloat(dataArray[i]['complete_rate_month']);
      const payments = updatePaymentMethods(dataArray[i]['pay_type_num'].split(','));
      const buy_sell = dataArray[i]['type'] === 'sell' ? 'Buy' : 'Sell';
      const price = parseFloat(dataArray[i]['rate']);
      const lim_min = parseFloat(dataArray[i]['limit_total'].split('~')[0]);
      const lim_max = parseFloat(dataArray[i]['limit_total'].split('~')[1]);
      const token = dataArray[i]['curr_a'];
      const fiat = dataArray[i]['curr_b'];
      const adv_no = dataArray[i]['uid']; // uid ???
      const available = parseFloat(dataArray[i]['total'].replace(/,/g, ''));

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

async function fetchAdsForCryptoCombinations(cryptoCurrencyList) {
  const result = [];

  for (const cryptoCurrency of cryptoCurrencyList) {
    const data = await fetchAdsForCrypto(cryptoCurrency);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    result.push(data);
  }

  return result.flat();
}

const cryptoCurrencyList = ['USDT_RUB', 'BTC_RUB', 'ETH_RUB', 'DOGE_RUB'];

async function fetchAndPrintAds() {
  const allAds = await fetchAdsForCryptoCombinations(cryptoCurrencyList);
  const mergeAllAds = mergePaymentMethods(allAds);
  await updateAdsInDatabase(mergeAllAds, filename);
  return mergeAllAds.length;
}

module.exports = { gateio: fetchAndPrintAds };

// async function main() {
//   for (;;) {
//     await fetchAndPrintAds();
//     await new Promise((resolve) => setTimeout(resolve, 5000));
//   }
// }


// main();