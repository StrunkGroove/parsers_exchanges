const { path, axios} = require('./../../dependencies/dependencies.js');

const { updateAdsInDatabase } = require(path.join(__dirname, '..', '..', 'function', 'bdFunction', 'updateDB.js'));
const filename = path.parse(__filename).name;

function elementFind(pairName, pairData, number, crypto) {
  const adsList = [];
  const ask = pairData.ask.slice(0, number);
  const bid = pairData.bid.slice(0, number);

  for (let i = 0; i < ask.length; i++) {
    const name = 'Биржевой стакан';
    const orders_q = 100;
    const order_p = 100;
    const payments = ['Tinkoff', 'Sber'];
    const buy_sell = 'Buy';
    const price = parseFloat(ask[i]['price']);
    const lim_min = 500;
    const lim_max = parseFloat(ask[i]['amount']);
    const token = crypto;
    const fiat = 'RUB';
    const adv_no = '#';
    const available = parseFloat(ask[i]['volume']);

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

  for (let i = 0; i < bid.length; i++) {
    const name = 'Биржевой стакан';
    const orders_q = 100;
    const order_p = 100;
    const payments = ['Tinkoff', 'Sber'];
    const buy_sell = 'Sell';
    const price = parseFloat(bid[i]['price']);
    const lim_min = 500;
    const lim_max = parseFloat(bid[i]['amount']);
    const token = crypto;
    const fiat = 'RUB';
    const adv_no = '#';
    const available = parseFloat(bid[i]['volume']);

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
  return adsList;
}

async function fetchAdsForCrypto(number) {

  const url = 'https://garantex.org/trading/btcrub';

  const response = await axios.get(url);

  const startIndex = response.data.indexOf('window.gon = ');
  const endIndex = response.data.indexOf(';', startIndex);
  const jsonStr = response.data.slice(startIndex + 'window.gon = '.length, endIndex);
  const json = JSON.parse(jsonStr);
  const jsonPars = json.exchangers

  const adsList = [];
  adsList.push(...elementFind('usdcrub', jsonPars.usdcrub, number, 'USDC'));
  adsList.push(...elementFind('btcrub', jsonPars.btcrub, number, 'BTC'));
  adsList.push(...elementFind('ethrub', jsonPars.ethrub, number, 'ETH'));
  adsList.push(...elementFind('usdtrub', jsonPars.usdtrub, number, 'USDT'));
  adsList.push(...elementFind('dairub', jsonPars.dairub, number, 'DAI'));

  return adsList;

}

async function fetchAndPrintAds() {
  const number = 2;
  const allAds = await fetchAdsForCrypto(number);
  await updateAdsInDatabase(allAds, filename);
  return allAds.length;
}

// async function main() {
//   for (;;) {
//     await fetchAndPrintAds();
//     await new Promise((resolve) => setTimeout(resolve, 31000));
//   }
// }
//
// main();

module.exports = { garantex: fetchAndPrintAds };
