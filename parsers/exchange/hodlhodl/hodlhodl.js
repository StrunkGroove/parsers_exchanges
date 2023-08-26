const { fetch, path } = require('./../../dependencies/dependencies.js');

const { updateAdsInDatabase } = require(path.join(__dirname, '..', '..', 'function', 'bdFunction', 'updateDB.js'));
const { mergePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'mergePaymentMethods.js'));
const filename = path.parse(__filename).name;

async function fetchAdsForCrypto(buyOrSell, payTypes) {
  const url = `https://hodlhodl.com/api/frontend/offers?filters%5Bpayment_method_name%5D=${payTypes}&filters%5Bcurrency_code%5D=RUB&pagination%5Boffset%5D=0&filters%5Bside%5D=${buyOrSell}&facets%5Bshow_empty_rest%5D=true&facets%5Bonly%5D=false&pagination%5Blimit%5D=50`;
  const options = {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
    },
  };


    const response = await fetch(url, options);
    let responseData
    try {
      responseData = await response.json();
    } catch {
      return [];
    }
    const dataArray = responseData['offers'];

    if ((Array.isArray(dataArray) && dataArray.length === 0) || dataArray === null || dataArray === undefined) {
      return;
    }

    let token;
    const adsList = [];
    for (let i = 0; i < dataArray.length; i++) {
      const name = dataArray[i]['trader']['login'];
      const order_p = parseFloat(dataArray[i]['trader']['rating'] === null ? 0 : dataArray[i]['trader']['rating']);
      const orders_q = parseFloat(dataArray[i]['trader']['trades_count']);

      let payments
      if (buyOrSell === 'buy') {
        const payMeth = dataArray[i]['payment_methods'];
        if (payMeth) {
          payments = payMeth.map((paymethod) => paymethod.name);
        }
      } else if (buyOrSell === 'sell') {
        const payMeth = dataArray[i]['payment_method_instructions'];
        if (payMeth) {
          payments = payMeth.map((paymethod) => paymethod.payment_method_name);
        }
      }
      const buy_sell = dataArray[i]['side'] === 'buy' ? 'Sell' : 'Buy';
      const price = parseFloat(dataArray[i]['price']);
      const lim_min = parseFloat(dataArray[i]['min_amount']);
      const lim_max = parseFloat(dataArray[i]['max_amount']);
      const token = dataArray[i]['asset_code'];
      const fiat = dataArray[i]['currency_code'];
      const adv_no = dataArray[i]['id'];
      const available = parseFloat(dataArray[i]['max_amount']);

      // if (price && payments) {
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
          available
        });
      // }
    }

    return adsList;
  
}

async function fetchAdsForCryptoCombinations(buyOrSellList, payTypesList) {
  const result = [];

  for (const payTypes of payTypesList) {
    for (const buyOrSell of buyOrSellList) {
      // await new Promise((resolve) => setTimeout(resolve, 500));
      const data = await fetchAdsForCrypto(buyOrSell, payTypes);
      result.push(data);
    }
  }

  return result.flat();
}
const buyOrSellList = ['buy', 'sell'];
// const buyOrSellList = ['buy'];
const payTypesList = ['Tinkoff', 'Sberbank'];

async function fetchAndPrintAds() {
  const allAds = await fetchAdsForCryptoCombinations(buyOrSellList, payTypesList);
  // console.log(allAds);
  const mergeAllAds = mergePaymentMethods(allAds);
  await updateAdsInDatabase(mergeAllAds, filename);
  return mergeAllAds.length;
}

// async function main() {
//   for (;;) {
//     await fetchAndPrintAds();
//     await new Promise((resolve) => setTimeout(resolve, 31000));
//   }
// }

module.exports = { hodlhodl: fetchAndPrintAds };

// main();


// function saveErrorToFile(error) {
//   const errorMessage = JSON.stringify(error, null, 2);
//   fs.writeFileSync('error.log', errorMessage);
// }
