const { Pool } = require('./../../dependencies/dependencies.js');

const { dbConfig } = require('./../../exchange/config.js');

const pool = new Pool(dbConfig);

async function zeroUpdate(filename) {

  client = await pool.connect();

  try {

    await client.connect();

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
      WHERE "number" < 1000;
    `;

    await client.query(zeroQuery);

  } catch (error) {
    console.error('Error zeroing out data:', error);
  } finally {
    await client.release();
  }
}

module.exports = { zeroUpdate };
