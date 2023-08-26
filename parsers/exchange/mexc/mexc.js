const { path, axios} = require('./../../dependencies/dependencies.js');

const { updateAdsInDatabase } = require(path.join(__dirname, '..', '..', 'function', 'bdFunction', 'updateDB.js'));
const { mergePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'mergePaymentMethods.js'));
const { updatePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'paymantChange.js'));
const filename = path.parse(__filename).name;

async function fetchAdsForCrypto(cryptoCurrency, buyOrSell, payTypes) {
  const url = `https://p2p.mexc.com/api/market?allowTrade=false&amount=&blockTrade=false&coinName=${cryptoCurrency}&countryCode=&currency=RUB&follow=false&haveTrade=false&page=1&payMethod=${payTypes}&tradeType=${buyOrSell}`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Referer': 'https://otc.mexc.com/',
    'Language': 'en-US',
    'Version': '3.3.7',
    'Origin': 'https://otc.mexc.com',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
    'Te': 'trailers',
  };


    const response = await axios.get(url, { headers: headers })
    const responseData = response.data;
    const dataArray = responseData['data'];

    if ((Array.isArray(dataArray) && dataArray.length === 0) || dataArray === null || dataArray === undefined) {
      return;
    }

    const adsList = [];
    for (let i = 0; i < dataArray.length; i++) {
      const name = dataArray[i]['merchant']['nickName'];
      const orders_q = parseFloat(dataArray[i]['merchantStatistics']['doneLastMonthCount']);
      const order_p = parseFloat(dataArray[i]['merchantStatistics']['lastMonthCompleteRate']);
      const payments = updatePaymentMethods(dataArray[i]['payMethod'].split(','));
      const buy_sell = dataArray[i]['tradeType'] === 1 ? 'Buy' : 'Sell';
      const price = parseFloat(dataArray[i]['price']);
      const lim_min = parseFloat(dataArray[i]['minTradeLimit']);
      const lim_max = parseFloat(dataArray[i]['maxTradeLimit']);
      const token = dataArray[i]['coinName'];
      const fiat = dataArray[i]['currency'];
      const adv_no = dataArray[i]['id'];
      const available = dataArray[i]['availableQuantity'];

      if (name && price && payments) {
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

async function fetchAdsForCryptoCombinations(cryptoCurrencyList, buyOrSellList, payTypesList) {
  const result = [];

  for (const cryptoCurrency of cryptoCurrencyList) {
    for (const buyOrSell of buyOrSellList) {
      for (const payTypes of payTypesList) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const data = await fetchAdsForCrypto(cryptoCurrency, buyOrSell, payTypes);
        result.push(data);
      }
    }
  }

  return result.flat();
}

const cryptoCurrencyList = ['USDT', 'BTC', 'ETH', 'USDC'];
const buyOrSellList = ['SELL', 'BUY'];
const payTypesList = ['12', '13'];

// const cryptoCurrencyList = ['USDT'];
// const buyOrSellList = ['SELL'];
// const payTypesList = ['12'];

async function fetchAndPrintAds() {
  const allAds = await fetchAdsForCryptoCombinations(cryptoCurrencyList, buyOrSellList, payTypesList);
  const mergeAllAds = mergePaymentMethods(allAds);
  await updateAdsInDatabase(mergeAllAds, filename);
  return mergeAllAds.length;
}
module.exports = { mexc: fetchAndPrintAds };

// async function main() {
//   for (;;) {
//     await fetchAndPrintAds();
//     await new Promise((resolve) => setTimeout(resolve, 2000));
//   }
// }

// main();
