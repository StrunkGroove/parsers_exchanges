const { WebSocket, fetch, fs, path, axios, winston, Pool, readline, promisify, copyFrom, pgp } = require('./../../dependencies/dependencies.js');

const { dbConfig } = require('./../../exchange/config.js');

const pool = new Pool(dbConfig);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = promisify(rl.question).bind(rl);

async function deleteData() {
  try {
    const dbName = await question('Введите название базы данных: ');

    const confirm = await question(`Вы уверены, что хотите удалить все строки из базы данных "${dbName}"? (Y/n): `);
    if (!confirm.trim() || confirm.trim().toLowerCase() !== 'y') {
      console.log('Введенные данные не подтверждены. Программа завершена.');
      rl.close();
      return;
    }

    const client = await pool.connect();

    await client.query(`DELETE FROM ${dbName}`);

    await client.query('COMMIT');

    client.release();

    console.log('Все строки успешно удалены из базы данных');
  } catch (error) {
    console.log('Ошибка при удалении данных:', error);
  } finally {
    rl.close();
  }
}

deleteData();
