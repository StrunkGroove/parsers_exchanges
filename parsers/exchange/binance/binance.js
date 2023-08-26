const { path, axios} = require('./../../dependencies/dependencies.js');

const { updateAdsInDatabase } = require(path.join(__dirname, '..', '..', 'function', 'bdFunction', 'updateDB.js'));
const { mergePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'mergePaymentMethods.js'));
const { updatePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'paymantChange.js'));
const { logError } = require(path.join(__dirname, '..', '..', 'function', 'logFunction', 'logFunction.js'));
const filename = path.parse(__filename).name;

async function fetchAdsForCrypto(cryptoCurrency, buyOrSell, payTypes) {
  const url = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
  const headers = {
    'Host': 'p2p.binance.com',
  };

  const data = {
    fiat: 'RUB',
    page: 1,
    rows: 10,
    tradeType: buyOrSell.toUpperCase(),
    asset: cryptoCurrency,
    countries: [],
    proMerchantAds: false,
    shieldMerchantAds: false,
    publisherType: null,
    payTypes: payTypes,
  };


  const response = await axios.post(url, data, { headers: headers });
  const responseData = response.data;
  const dataArray = responseData['data'];

  if ((Array.isArray(dataArray) && dataArray.length === 0) || dataArray === null || dataArray === undefined) {
    return;
  }

  const adsList = [];
  for (let i = 0; i < dataArray.length; i++) {
    const name = dataArray[i]['advertiser']['nickName'];
    const orders_q = parseFloat(dataArray[i]['advertiser']['monthOrderCount']);
    const order_p = parseFloat(dataArray[i]['advertiser']['monthFinishRate'])*100;
    const payments = updatePaymentMethods(dataArray[i]['adv']['tradeMethods'].map((paymethod) => paymethod.tradeMethodName));
    const buy_sell = dataArray[i]['adv']['tradeType'] === 'BUY' ? 'Sell' : 'Buy';
    const price = parseFloat(dataArray[i]['adv']['price']);
    const lim_min = parseFloat(dataArray[i]['adv']['minSingleTransAmount']);
    const lim_max = parseFloat(dataArray[i]['adv']['maxSingleTransAmount']);
    const token = dataArray[i]['adv']['asset'];
    const fiat = dataArray[i]['adv']['fiatUnit'];
    const adv_no = dataArray[i]['adv']['advNo'];
    const available = parseFloat(dataArray[i]['adv']['tradableQuantity']);

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

// const cryptoCurrencyList = ['USDT', 'BTC', 'ETH', 'BUSD', 'BNB', 'RUB', 'SHIB'];
const buyOrSellList = ['BUY', 'SELL'];
const payTypesList = [['TinkoffNew'], ['RosBankNew'], ['QIWI'], ['MTSBank'], ['RaiffeisenBank'], ['YandexMoneyNew']];

const cryptoCurrencyList = ['USDT', 'BTC', 'ETH'];

async function fetchAndPrintAds() {
  const allAds = await fetchAdsForCryptoCombinations(cryptoCurrencyList, buyOrSellList, payTypesList);
  const mergeAllAds = mergePaymentMethods(allAds);
  await updateAdsInDatabase(mergeAllAds, filename);
  return mergeAllAds.length;
}

module.exports = { binance: fetchAndPrintAds };

//async function main() {
//  for (;;) {
//    try {
//      const startTime = new Date();
//      const length = await fetchAndPrintAds();
//      const endTime = new Date();
//      const executionTime = endTime - startTime;

//      const currentTime = new Date();
//      console.log(`Current Time: ${currentTime.toLocaleString()}, Execution Time: ${executionTime} ms, Number of Rows: ${length}`);
//
//      await new Promise((resolve) => setTimeout(resolve, 16000));
//    } catch {
//      await new Promise((resolve) => setTimeout(resolve, 30000));
//    }
//  }
//}

//main();
