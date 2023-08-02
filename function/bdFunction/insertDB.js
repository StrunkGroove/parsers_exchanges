const { Pool } = require('pg');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const copyFrom = require('pg-copy-streams').from;
const readline = require('readline');

// Конфигурация базы данных
// const dbConfig = {
//   user: 'pgmajor',
//   password: 'hduvjHJK637',
//   host: '80.87.201.112',
//   port: '5432',
//   database: 'dbmajor',
// };

const dbConfig = {
  user: 'postgres',
  password: 'r0o8bhjWcVjJf2stVsjEb7k',
  host: '62.109.11.29',
  port: '5432',
  database: 'mydatabase',
};


// Подключение к базе данных
const pool = new Pool(dbConfig);

// Вспомогательные функции для чтения пользовательского ввода
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = promisify(rl.question).bind(rl);

async function insertData() {
  try {
    const dbName = await question('Введите название базы данных: ');

    const rowCountInput = await question('Введите количество строк для вставки: ');
    const rowCount = rowCountInput.trim() ? parseInt(rowCountInput, 10) : 0;

    const confirm = await question(`Вы ввели название базы данных "${dbName}" и количество строк "${rowCount}". Верно? (Y/n): `);
    if (!confirm.trim() || confirm.trim().toLowerCase() !== 'y') {
      console.log('Введенные данные не подтверждены. Программа завершена.');
      rl.close();
      return;
    }

    const data = [];
    for (let i = 1; i <= rowCount; i++) {
      data.push({ number: i });
    }

    const client = await pool.connect();

    // const copyStream = client.query(copyFrom(`COPY ${dbName} (number) FROM STDIN`));
    const copyStream = client.query(copyFrom(`COPY ${dbName} (spread) FROM STDIN`));

    await new Promise((resolve, reject) => {
      copyStream.on('error', reject);

      const totalRows = data.length;
      const batchRows = data.map((row) => `${row.number}`).join('\n');

      copyStream.write(batchRows + '\n');

      copyStream.end(resolve);
    });

    await client.query('COMMIT');

    client.release();

    console.log('Данные успешно вставлены в базу данных');
  } catch (error) {
    console.log('Ошибка при вставке данных:', error);
  } finally {
    rl.close();
  }
}

// Вызов функции insertData
insertData();
