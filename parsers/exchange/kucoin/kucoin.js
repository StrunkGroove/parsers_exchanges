const { path, axios} = require('./../../dependencies/dependencies.js');

const { updateAdsInDatabase } = require(path.join(__dirname, '..', '..', 'function', 'bdFunction', 'updateDB.js'));
const { mergePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'mergePaymentMethods.js'));
const filename = path.parse(__filename).name;

async function fetchAdsForCrypto(cryptoCurrency, buyOrSell) {
  const url = `https://www.kucoin.com/_api/otc/ad/list?currency=${cryptoCurrency}&side=${buyOrSell}&legal=RUB&page=1&pageSize=10&status=PUTUP&lang=nl_NL`;

  const headers = {
    Host: 'www.kucoin.com',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Referer': 'https://www.kucoin.com/nl/otc/buy/BTC-RUB',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache',
    'Te': 'trailers'
  };


    const response = await axios.get(url, { headers: headers })
    const responseData = response.data;
    const dataArray = responseData['items'];

    if ((Array.isArray(dataArray) && dataArray.length === 0) || dataArray === null || dataArray === undefined) {
      return;
    }

    const adsList = [];
    for (let i = 0; i < dataArray.length; i++) {
      const name = dataArray[i]['nickName'];
      const orders_q = isNaN(parseFloat(dataArray[i]['dealOrderNum'])) ? 0 : parseFloat(dataArray[i]['dealOrderNum']);
      const order_p = isNaN(parseFloat(dataArray[i]['dealOrderRate'])) ? 0 : parseFloat(dataArray[i]['dealOrderRate']);
      // const payments = updatePaymentMethods(dataArray[i]['adPayTypes'].map((paymethod) => paymethod.payTypeCode));
      const payments = ['Sber', 'Tinkoff'];
      const buy_sell = dataArray[i]['side'] === 'SELL' ? 'Buy' : 'Sell';
      const price = parseFloat(dataArray[i]['floatPrice']);
      const lim_min = parseFloat(dataArray[i]['limitMinQuote']);
      const lim_max = parseFloat(dataArray[i]['limitMaxQuote']);
      const token = dataArray[i]['currency'];
      const fiat = dataArray[i]['legal'];
      const adv_no = dataArray[i]['id'];
      const available = parseFloat(dataArray[i]['currencyBalanceQuantity']);

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

}

async function fetchAdsForCryptoCombinations(cryptoCurrencyList, buyOrSellList) {
  const result = [];

  for (const cryptoCurrency of cryptoCurrencyList) {
    for (const buyOrSell of buyOrSellList) {
      const data = await fetchAdsForCrypto(cryptoCurrency, buyOrSell);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      result.push(data);
    }
  }

  return result.flat();
}

const cryptoCurrencyList = ['USDT', 'BTC', 'ETH', 'USDC'];
const buyOrSellList = ['SELL', 'BUY'];

async function fetchAndPrintAds() {
  const allAds = await fetchAdsForCryptoCombinations(cryptoCurrencyList, buyOrSellList);
  const mergeAllAds = mergePaymentMethods(allAds);
  await updateAdsInDatabase(mergeAllAds, filename);
  return mergeAllAds.length;
}

module.exports = { kucoin: fetchAndPrintAds };

// async function main() {
//   for (;;) {
//     await fetchAndPrintAds();
//     await new Promise((resolve) => setTimeout(resolve, 2000));
//   }
// }

// main();
