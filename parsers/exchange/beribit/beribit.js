const { WebSocket, path } = require('./../../dependencies/dependencies.js');

const { updateAdsInDatabase } = require(path.join(__dirname, '..', '..', 'function', 'bdFunction', 'updateDB.js'));
const filename = path.parse(__filename).name;

function startWebSocket() {
  const wsUrl = 'wss://beribit.com/ws/depth/usdtrub';

  const headers = {
    'Content-Type': 'application/json;charset=utf-8',
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
  };

  const ws = new WebSocket(wsUrl, {
    headers: headers,
  });

  return new Promise((resolve, reject) => {
    let resolved = false;

    ws.on('open', () => {
      const request = {
        event: 'subscribe',
        channel: 'depth',
        symbol: 'usdtrub',
      };

      ws.send(JSON.stringify(request));
    });

    ws.on('message', async (message) => {
      const data = JSON.parse(message);
      const number = 2;
      const allAds = await elementFind(data.Depth, number, 'USDT');
      // console.log(allAds);
      await updateAdsInDatabase(allAds, filename);

      if (allAds.length === 4 && !resolved) {
        resolved = true;
        ws.terminate();
        resolve(allAds.length); // Разрешаем промис с длиной allAds.length
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket ошибка:', error);
      ws.terminate();
      reject(error); // Отклоняем промис с ошибкой
    });

    ws.on('close', () => {
    });
  });
}

module.exports = { beribit: startWebSocket };

function elementFind(pairData, number, crypto) {
  const adsList = [];
  const ask = pairData.Asks.slice(0, number);
  const bid = pairData.Bids.slice(0, number);

  for (let i = 0; i < ask.length; i++) {

      const name = 'Биржевой стакан';
      const orders_q = 100;
      const order_p = 100;
      const payments = ['Tinkoff', 'Sber'];
      const buy_sell = 'Buy';
      const price = parseFloat(ask[i]['ExchangeRate']);
      const lim_min = 500;
      const lim_max = parseFloat(ask[i]['Price']);
      const token = crypto;
      const fiat = 'RUB';
      const adv_no = '#';
      const available = parseFloat(ask[i]['Size']);

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
      const price = parseFloat(bid[i]['ExchangeRate']);
      const lim_min = 500;
      const lim_max = parseFloat(bid[i]['Price']);
      const token = crypto;
      const fiat = 'RUB';
      const adv_no = '#';
      const available = parseFloat(ask[i]['Size']);

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
