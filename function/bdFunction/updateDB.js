const path = require('path');
const { logError } = require(path.join(__dirname, '..', 'logFunction', 'logFunction.js'));

const { Pool } = require('pg');
const pgp = require('pg-promise')();
const helpers = require('pg-promise-helpers');
const dbConfig = {
  user: 'pgmajor',
  password: 'hduvjHJK637',
  host: '80.87.201.112',
  port: '5432',
  database: 'dbmajor',
};
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
        'number'
      ],
      { table: { table: filename, schema: 'public' } }
    );

    dataWithNumber = data.map((currentItem, index) => {
      return {
        ...currentItem,
        number: index,
        orders_q: Math.round(currentItem.orders_q),
        order_p: Math.ceil(currentItem.order_p),
        lim_min: Math.round(currentItem.lim_min),
        lim_max: Math.round(currentItem.lim_max),
        payments: JSON.stringify(currentItem.payments),
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
        "fiat" = 0
      WHERE "number" >= $1 AND "number" < 2000;
    `;

    await client.query(zeroQuery, [data.length]);

  } catch (error) {
    console.log(error, dataWithNumber);
    logError(error, filename);
  } finally {
    if (client) {
      client.release();
    }
  }
}

module.exports = { updateAdsInDatabase };