const { path, Pool, pgp } = require('./../../dependencies/dependencies.js');
const { zeroUpdate } = require(path.join(__dirname, 'zeroUpdate.js'));
const { logError } = require(path.join(__dirname, '..', 'logFunction', 'logFunction.js'));

const { dbConfig } = require('./../../exchange/config.js');

const pool = new Pool(dbConfig);


async function updateAdsInDatabase(data, filename) {
  let client;
  let dataWithNumber;
  try {
    client = await pool.connect();
    const cs = new pgp.helpers.ColumnSet(
      [
        { name: 'payments', cast: 'jsonb' },
        'name',
        'orders_q',
        'order_p',
        'price',
        'lim_min',
        'lim_max',
        'buy_sell',
        'token',
        'fiat',
        'number',
        'adv_no',
        'available',
        'available_rub'
      ],
      { table: { table: filename, schema: 'public' } }
    );

    let USDTRUB = await USDTRUB_function('garantex', client);
    USDTRUB = USDTRUB[0]['price'];
    const spotPrice = await getTokenPrices('spot', client);

    dataWithNumber = data.map((currentItem, index) => {
      return {
        ...currentItem,
        number: index,
        orders_q: Math.round(currentItem.orders_q),
        order_p: Math.ceil(currentItem.order_p),
        lim_min: Math.round(currentItem.lim_min),
        lim_max: Math.round(currentItem.lim_max),
        payments: JSON.stringify(currentItem.payments),
        available: calculationAvailableInCrypto(currentItem.available, currentItem.token, spotPrice, USDTRUB, filename),
        available_rub: calculationAvailableInRUB(currentItem.available, currentItem.token, spotPrice, USDTRUB, filename),
      };
    });
    const query = `${pgp.helpers.update(dataWithNumber, cs)} WHERE v."number" = t."number"`;
    await client.query(query);

    const zeroQuery = `
      UPDATE public.${filename}
      SET 
        "payments" = '[]',
        "name" = 0,
        "orders_q" = 0,
        "order_p" = 0,
        "price" = 0,
        "lim_min" = 0,
        "lim_max" = 0,
        "buy_sell" = 0,
        "token" = 0,
        "fiat" = 0,
        "adv_no" = 0,
        "available" = 0
      WHERE "number" >= $1 AND "number" < 1000;
    `;

    await client.query(zeroQuery, [data.length + 1]);

  } catch (error) {

    await zeroUpdate(filename);

    console.log(error, dataWithNumber[0]);
    logError(error, filename);
  } finally {
    if (client) {
      await client.release();
    }
  }
}


module.exports = { updateAdsInDatabase };


function calculationAvailableInRUB(available, token, spotPrice, USDTRUB, exchage) {

  if (exchage === 'binance' || exchage === 'beribit' || exchage === 'bybit' || exchage === 'garantex' || exchage === 'okx' || 
      exchage === 'kucoin'  || exchage === 'mexc'    || exchage === 'huob') {

    if (token === 'USDT') {
      return Math.round(available * USDTRUB * 100) / 100;
    }

    const key = getUSDTKey(token);
    const spot = getPriceBySymbol(spotPrice, key);
    return Math.round(spot * available * USDTRUB * 100) / 100;

  }
  else {
    return available;
  }
}


function calculationAvailableInCrypto(available, token, spotPrice, USDTRUB, exchage) {

  if (exchage === 'bitpapa' || exchage === 'totalcoinio' || exchage === 'hodlhodl' || exchage === 'gateio') {

    if (token === 'USDT') {
      return Math.round((available / USDTRUB) * 100) / 100;
    }

    const key = getUSDTKey(token);
    const spot = 1 / getPriceBySymbol(spotPrice, key);
    return Math.round(((available / USDTRUB) / spot) * 100) / 100;

  }
  else {
    return available;
  }
}


async function getTokenPrices(tableName, client) {
  try {

    const result = await client.query(`SELECT * FROM ${tableName}`);
    const rows = result.rows;

    return rows;
  } catch (error) {
    console.log('Ошибка при выборке строк:', error);
  }
}


async function USDTRUB_function(tableName, client) {
  try {
    const result = await client.query(`SELECT price FROM ${tableName} WHERE buy_sell = 'Buy' ORDER BY price ASC LIMIT 1`);
    const rows = result.rows;

    return rows;
  } catch (error) {
    console.log('Ошибка при выборке строк:', error);
  }
}


function getUSDTKey(fiat) {
  switch (fiat) {
    case 'BTC':
      return 'BTCUSDT';
    case 'GMT':
      return 'GMTUSDT';
    case 'XMR':
      return 'XMRUSDT';
    case 'DOGE':
      return 'DOGEUSDT';
    case 'TRX':
      return 'TRXUSDT';
    case 'EOS':
      return 'EOSUSDT';
    case 'XRP':
      return 'XRPUSDT';
    case 'LTC':
      return 'LTCUSDT';
    case 'BUSD':
      return 'BUSDUSDT';
    case 'BNB':
      return 'BNBUSDT';
    case 'ETH':
      return 'ETHUSDT';
    case 'RUB':
      return 'USDTRUB';
    case 'SHIB':
      return 'SHIBUSDT';
    case 'TON':
      return 'TON_USDT';
    case 'HT':
      return 'HT_USDT';
    default:
      return fiat;
  }
}


function getPriceBySymbol(cryptoList, targetCrypto) {
  for (const cryptoObj of cryptoList) {
    if (cryptoObj.crypto === targetCrypto) {
      return cryptoObj.price;
    }
  }
}
