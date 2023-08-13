const { WebSocket, fetch, fs, path, axios, winston, Pool, readline, promisify, copyFrom, pgp } = require('./../../dependencies/dependencies.js');

const { updateAdsInDatabase } = require(path.join(__dirname, '..', '..', 'function', 'bdFunction', 'updateDB.js'));
const { mergePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'mergePaymentMethods.js'));
const { updatePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'paymantChange.js'));
const { logError } = require(path.join(__dirname, '..', '..', 'function', 'logFunction', 'logFunction.js'));
const filename = path.parse(__filename).name;

async function fetchAdsForCrypto(cryptoCurrency, buyOrSell, payTypes) {

    const url = 'https://www.bitget.com/v1/p2p/pub/adv/queryAdvList';


    const headers = {
        'Cookie': '__cf_bm=hHkpa0aChHnH4r3FQbi.uAL661qpbJKs8ylrhsCuGoM-1690452686-0-AR19x5doQS1yPVsGfUfZCQ6dC2OU8NXpLRvdgAmUKwrefSlnDRfo8OQ4qP06OgW94GxQ2bsRXaz/ahpmSeQFXno=; _cfuvid=TK3c_8FsJNXj_.mUvuCmNAIwQPhyjG0dXqe.Ck1udNw-1690450394870-0-604800000; afUserId=5ab7d54a-6a35-4dfd-b6c4-23fecf41b839-p; _ga_Z8Q93KHR0F=GS1.1.1690450410.1.1.1690452852.60.0.0; _ga=GA1.1.563174585.1690450410; BITGET_LOCAL_COOKIE={%22bitget_unit%22:%22USD%22%2C%22bitget_lang%22:%22ru%22}; i18n_redirected=ru; bitget_theme=dark; _ga_clientid=563174585.1690450410; _ga_sessionid=1690450410; AF_SYNC=1690452690150; bt_sessonid=1c53b274-0c87-416e-a346-cc5492bb3ddf; bt_newsessionid=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIwOWI2OGM1Mi02MTg2LTRkNjItODA4OC1iNmI1ZDlmYTY4ZjQ3MTIzMTI0MjAiLCJ1aWQiOiI3QkRvc08rc3kyd3VNQkZpcHBFZDJBPT0iLCJzdWIiOiJqbWEqKipsLnJ1IiwiaXAiOiI0UE1ITHN3eFh4NUpZdkpaWXI0amdBPT0iLCJkaWQiOiJHZUZ2NVg3Qm8wcEZUZkg2Q0VDMlNWN0pTbnhWZ0lCWVZ6dTVDSCs2K1IxMTJSSXNaUUtNNUhCa1M0eVRSaG5XIiwic3RzIjowLCJpYXQiOjE2OTA0NTI4MjgsImV4cCI6MTY5ODIyODgyOCwicHVzaGlkIjoiZGRrU0xHVUNqT1J3WkV1TWswWVoxZz09IiwiaXNzIjoidXBleCJ9.0QYUlpzbJhtrk3_vVU0K1dcwh7sYnZu_8RZO4w93Ll4; __zlcmid=1H3m08ThiAWW2q4; _dx_kvani5r=0ffd0ec997a6fb0aaee0a64ce1654ffd692924a1694dd020716736edeb016d44037be96d; bt_rtoken=upex:session:id:f608a3d730d4efc323b947a716f63fa9163a67e805259c0662e1ceef32b2285f; dy_token=64c2435eD8Nk9u4gzJVv2mLXlY0V3gCOTSdKLRQ1',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json;charset=utf-8',
        'Locale': 'ru_RU',
        'Language': 'ru_RU',
        'Terminaltype': '1',
        'Terminalcode': 'd8394ba178e8d42d2a0ba3accb628fe0',
        'Apptheme': 'dark',
        'Fbid': 'fb.1.1687427145398.1165398840',
        'Gaid': 'GA1.1.1821670803.1687427123',
        'Gaclientid': '1821670803.1687427123',
        'Gasessionid': '1690439213',
        'Origin': 'https://www.bitget.com',
        'Referer': 'https://www.bitget.com/ru/p2p-trade/buy/BTC?fiatName=RUB',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Te': 'trailers'
    };

    const data = {
        "side": buyOrSell,
        "pageNo": 1,
        "pageSize": 10,
        "coinCode": cryptoCurrency,
        "fiatCode": "RUB",
        "paymethodId": payTypes,
        "languageType": 6
    };

  try {
    const response = await axios.post(url, data, { headers });

    const responseData = await response.data;
    const dataArray = responseData['data']['dataList'];

    if ((Array.isArray(dataArray) && dataArray.length === 0) || dataArray === null || dataArray === undefined) {
      return;
    }

    let token;
    const adsList = [];
    for (let i = 0; i < dataArray.length; i++) {
      const name = dataArray[i]['nickName'];
      const orders_q = parseFloat(dataArray[i]['turnoverNum']);
      const order_p = parseFloat(dataArray[i]['turnoverRateNum']);
      const payments = dataArray[i]['paymethodInfo'].map((paymethod) => paymethod.paymethodName);
      const buy_sell = buyOrSell === 1 ? 'Buy' : 'Sell';
      const price = parseFloat(dataArray[i]['price']);
      const lim_min = parseFloat(dataArray[i]['minAmount']);
      const lim_max = parseFloat(dataArray[i]['maxAmount']);
      token = dataArray[i]['coinCode'];
      const fiat = dataArray[i]['fiatCode'];

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
        // await new Promise((resolve) => setTimeout(resolve, 500));
        const data = await fetchAdsForCrypto(cryptoCurrency, buyOrSell, payTypes);
        result.push(data);
      }
    }
  }

  return result.flat();
}

// const cryptoCurrencyList = ['USDT', 'BTC'];
const cryptoCurrencyList = ['USDT', 'BTC', 'ETH', 'USDC', 'DAI'];
// const cryptoCurrencyList = ['USDT'];

const buyOrSellList = [1, 2];
// const buyOrSellList = [1];

const payTypesList = ['93', '96', '228', '287'];
// const payTypesList = ['93'];

async function fetchAndPrintAds() {
  const allAds = await fetchAdsForCryptoCombinations(cryptoCurrencyList, buyOrSellList, payTypesList);
  const mergeAllAds = mergePaymentMethods(allAds);
  await updateAdsInDatabase(mergeAllAds, filename);
  return mergeAllAds.length;
}

module.exports = { bitget: fetchAndPrintAds };

// async function main() {
//   for (;;) {
//     await fetchAndPrintAds();
//     console.log('start');
//     await new Promise((resolve) => setTimeout(resolve, 31000));
//   }
// }

// main();