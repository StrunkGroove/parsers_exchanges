const { WebSocket, fetch, fs, path, axios, winston, Pool, readline, promisify, copyFrom, pgp } = require('./../../dependencies/dependencies.js');

const { updateAdsInDatabase } = require(path.join(__dirname, '..', '..', 'function', 'bdFunction', 'updateDB.js'));
const { mergePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'mergePaymentMethods.js'));
const { updatePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'paymantChange.js'));
const { logError } = require(path.join(__dirname, '..', '..', 'function', 'logFunction', 'logFunction.js'));
const filename = path.parse(__filename).name;

const dbConfig = require(path.join(__dirname, '..', 'config.js'));
const pool = new Pool(dbConfig);
const db = pgp(dbConfig);

async function fetchAdsForCrypto(cryptoCurrency, buyOrSell) {
  const url = `https://totalcoin.io/ru/offers/ajax-offers-list?type=${buyOrSell}&currency=rub&crypto=${cryptoCurrency}&pm=&pro=0`;
  const maxAds = 30;

  try {
    const response = await axios.get(url);
    const responseData = response.data;
    const dataArray = responseData['data'];

    if ((Array.isArray(dataArray) && dataArray.length === 0) || dataArray === null || dataArray === undefined) {
      return;
    }
    
    const adsList = [];
    for (let i = 0; i < dataArray.length && i < maxAds; i++) {
      const name = dataArray[i]['user']['nickname'];
      const orders_q = dataArray[i]['user']['okReviewCount'];
      const order_p = 50;
      const payments = updatePaymentMethods([dataArray[i]['paymentMethod']['name']]);
      const buy_sell = dataArray[i]['type'] === 'BUY' ? 'Sell' : 'Buy';
      let price = dataArray[i]['fixedPrice'];
      if (!price) {
        price = dataArray[i]['price'];
      }
      const lim_min = dataArray[i]['limitMin'];
      const lim_max = dataArray[i]['limitMax'];
      const token = dataArray[i]['cryptocurrency'];
      const fiat = dataArray[i]['user']['currency']['id'];
      const adv_no = dataArray[i]['id'];
      const available = dataArray[i]['limitMax'];

      // if (name && paymentMethod && buySell && price && limitMin && limitMax && cryptocurrency && fiat) {
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
    logError(error, filename);
    return [];
  }
}

async function fetchAndPrintAds() {
  const ethBuyAds = await fetchAdsForCrypto('ETH', 'buy');
  const btcSellAds = await fetchAdsForCrypto('BTC', 'sell');
  const btcBuyAds = await fetchAdsForCrypto('BTC', 'buy');
  const usdtSellAds = await fetchAdsForCrypto('USDT', 'sell');
  const usdtBuyAds = await fetchAdsForCrypto('USDT', 'buy');
  const ethSellAds = await fetchAdsForCrypto('ETH', 'sell');
  const ltcBuyAds = await fetchAdsForCrypto('LTC', 'buy');
  const ltcSellAds = await fetchAdsForCrypto('LTC', 'sell');

  const allAds = [...btcSellAds, ...btcBuyAds, ...usdtSellAds, ...usdtBuyAds, ...ethSellAds, ...ethBuyAds, ...ltcBuyAds, ...ltcSellAds];
  const mergeAllAds = mergePaymentMethods(allAds);
  await updateAdsInDatabase(mergeAllAds, filename);
  return mergeAllAds.length;
}

module.exports = { totalcoinio: fetchAndPrintAds };

// async function main() {
//   for (;;) {
//     await fetchAndPrintAds();
//     await new Promise((resolve) => setTimeout(resolve, 10000));
//   }
// }


// main();