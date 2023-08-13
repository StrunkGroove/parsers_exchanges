const { WebSocket, fetch, fs, path, axios, winston, Pool, readline, promisify, copyFrom, pgp } = require('./../../dependencies/dependencies.js');

const chromePath = path.join(__dirname, '../../chrome-linux64/chrome');
const { updatePaymentMethods } = require(path.join(__dirname, '..', '..', 'function', 'normalFunction', 'paymantChange.js'));
const { updateAdsInDatabase } = require(path.join(__dirname, '..', '..', 'function', 'bdFunction', 'updateDB.js'));
const dbConfig = require(path.join(__dirname, '..', 'config.js'));
const filename = path.parse(__filename).name;

function updateStatusFile(formattedDate, filename) {
  const statusFolderPath = path.join(__dirname, '../../status');
  const statusFilePath = path.join(statusFolderPath, `${filename}.txt`);

  if (!fs.existsSync(statusFolderPath)) {
    fs.mkdirSync(statusFolderPath, { recursive: true });
  }

  fs.writeFileSync(statusFilePath, formattedDate);
}
async function clickOnCryptoSelection(page) {
  await page.waitForTimeout(1500);
  const elements = await page.$$('.selectable-box.selectable-box1');
  await elements[0].click();}
async function selectText(page, text) {
  await page.waitForSelector('.ps-container.option.ps.ps--theme_default.ps--active-y');
  const element = await page.$('.ps-container.option.ps.ps--theme_default.ps--active-y');
  const textContent = await element.evaluate(element => element.textContent.trim());
  const elementss = await page.$$('span.el-tooltip.bg-tooltip > span.option-item');
  for (const element of elementss) {
    const textContent = await element.evaluate(element => element.textContent.trim());
    if (textContent === text) {
      await element.click();
      break;
    }
  }}

async function selectBank(page, textBanks) {
  await page.waitForSelector('.ps-container.option.ps.ps--theme_default.ps--active-y');
  const element = await page.$('.ps-container.option.ps.ps--theme_default.ps--active-y');
  const textContent = await element.evaluate(element => element.textContent.trim());
  const elementss = await page.$$('span.el-tooltip.bg-tooltip > span.option-item');
  for (const element of elementss) {
    const textContent = await element.evaluate(element => element.textContent.trim());
    if (textContent === textBanks) {
      await element.click();
      break;
    }
  }}
async function clickOnBankSelection(page) {
  await page.waitForTimeout(500);
  const elements = await page.$$('.selectable-box.selectable-box1');
  await elements[1].click();}
async function clickElementRepeatedly(page, selector, maxClicks) {
  let clickCount = 0;

  while (clickCount < maxClicks) {
    try {
      const timeout = 1000;
      await Promise.race([
        page.waitForSelector(selector, { timeout }),
        page.waitForTimeout(timeout)
      ]);
      const element = await page.$(selector);
      await element.click();
      clickCount++;
    } catch (error) {
      // logError(error, filename);
      break;
    }
  }
}

async function pars(page, results, uniqueNames) {

  await page.waitForTimeout(200);
  try {
    await page.waitForSelector('.hall-list-item-wrap.hall-list', { timeout: 1000 });
  } catch (error) {
    // logError(error, filename);
    return { results, uniqueNames };
  }
  const rows = await page.$$('.hall-list-item-wrap.hall-list');
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowData = {};

    const merchantName = await row.$eval('.list-item-nickname', (element) => element.textContent.trim());
    const name = merchantName.split('Всего')[0].trim();
    rowData['name'] = name;

    const orderDetails = await row.$eval('.list-item__info', (element) => element.innerText);
    const regex = /(\d+)/g;
    const matches = orderDetails.match(regex);
    if (matches) {
      const totalOrders = parseFloat(matches[0]).toFixed(2);
      const completionRate = parseFloat(matches[1]);
      rowData['order_p'] = completionRate;
      rowData['orders_q'] = totalOrders;
      }

    const listNumber = await row.$$('span.list_limit');
    const elementHTML = await (await listNumber[0].getProperty('innerHTML')).jsonValue();
    const $ = cheerio.load(elementHTML);
    const spans = $('span');

    if (spans.length >= 2) {
      const secondSpan = spans.eq(1);
      const secondSpanHTML = secondSpan.html();

      const $2 = cheerio.load(secondSpanHTML);
      const spansInsideSecondSpan = $2('span');

      const firstElement = $2(spansInsideSecondSpan[0]).text().trim();
      const secondElement = $2(spansInsideSecondSpan[1]).text().trim();

      const [number, token] = firstElement.split(' ');
      const available = parseFloat(number);

      const elem = secondElement.split('\n');
      lim = elem[0].split('–')

      lim_min = parseFloat(lim[0].replace(',', ''))
      lim_max = parseFloat(lim[1].replace(',', ''))
      fiat = elem[1].trim()

      rowData['lim_min'] = lim_min;
      rowData['lim_max'] = lim_max;
      rowData['fiat'] = fiat;
      rowData['available'] = available;
      rowData['token'] = token;
    }

    const payRow = await row.$$('.list-item-price-payment');
    const paymentsList = await payRow[1].getProperty('innerHTML');
    const paymentsHTML = await paymentsList.jsonValue();
    const cheerioInstance = cheerio.load(paymentsHTML);

    const payments = [];
    cheerioInstance('img').each((index, element) => {
      const alt = cheerioInstance(element).attr('alt');
      payments.push(alt);
    });

    const paymentsUpdate = updatePaymentMethods(payments);
    rowData['payments'] = paymentsUpdate

    const buySellParametr = await row.$$('.list-item-btn');
    const firstElement = buySellParametr[0];
    const buySell = await firstElement.evaluate(node => node.textContent.trim());
    if (buySell === 'Покупка') {
      rowData['buy_sell'] = 'Buy';
    } else if (buySell === 'Продажа') {
      rowData['buy_sell'] = 'Sell';
    }

    const priceAllFound = await row.$$('.list-item-price');
    const priceFound = priceAllFound[0];
    const priceText = await priceFound.evaluate(node => node.textContent.trim());
    const price = parseFloat(priceText.split(' ')[0].replace(/,/g, ''))
    rowData['price'] = price;

    rowData['adv_no'] = '#';

    if (uniqueNames[merchantName] && uniqueNames[merchantName] === price) {
      continue;
    }

    if (paymentsUpdate.length === 0) {
      continue;
    }

    results.push(rowData);
    uniqueNames[merchantName] = price;
  }
  return { results, uniqueNames };}
async function parsPages(pages) {
  const results = [];
  const uniqueNames = {};
  const errorUrls = [];
  
  // const listBanks = ['QIWI', 'Красный Банк', 'МТС Банк', 'Почта Банк', 'Райффайзен', 'Тинькофф', 'Уралсиб', 'Газпромбанк', 'SBP'];
  const listBanks = ['МТС Банк', 'Райффайзен', 'Тинькофф', 'Росбанк'];
  const listCrypto = ['BTC', 'USDT', 'ETH', 'USDC', 'DAI']
  for (const page of pages) {
    await page.bringToFront();
    await clickElementRepeatedly(page, '.steps_guide_footer-left_btn', 4);
    for (const crypto of listCrypto) {
      await clickOnCryptoSelection(page);
      await selectText(page, crypto);
      for (const textBanks of listBanks) {
        await clickOnBankSelection(page);
        await selectText(page, textBanks);
        const { results: parsedResults, uniqueNames: parsedUniqueNames } = await pars(page, results, uniqueNames);
        Object.assign(results, parsedResults);
        Object.assign(uniqueNames, parsedUniqueNames);
      }
    }
  }
  return results;}
async function main(pages, delay) {
  for (;;) {
    const results = await parsPages(pages);
    // console.log(results);
    await updateAdsInDatabase(results, filename);

    const length = Object.keys(results).length;
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')} ${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}:${currentDate.getSeconds().toString().padStart(2, '0')}`;
    updateStatusFile(formattedDate, filename);
  }}

async function processPagesSequentially(browser, list) {

  let errorUrls = [];
  const pages = [];

  try {
    for (const url of list) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1000, height: 800 });

      try {
        let isRowFound = false;
        let attempts = 0;

        while (!isRowFound && attempts < 3) {
          try {
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.waitForSelector('.hall-list-phone-item.list-item-phone', { timeout: 30000 });

            const row = await page.$('.hall-list-phone-item.list-item-phone');
            const box = await page.$('.hall-list-box');

            if (row) {
              console.log('Downloaded page:', url);
              isRowFound = true;
            }

            if (box && !row) {
              attempts++;
              await page.reload();
            }
          } catch (error) {
            console.log(error);
            attempts++;
          }
        }

        if (!isRowFound) {
          console.log('Row not found after multiple attempts:', url);
          errorUrls.push(url);
        } else {
          pages.push(page);
        }
      } catch (error) {
        console.log(error);
        errorUrls.push(url);
      }
    }

    console.log('Downloaded all pages!');
  } catch (error) {
    console.log(error);
  }

  return { pages, errorUrls };}

async function launchBrowser() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: chromePath,
    args: ['--window-size=1920,1280', '--max-old-space-size=1024']
  });
  return browser;
}

async function runParsing() {
  const list = [
    'https://www.bitget.com/ru/p2p-trade?fiatName=RUB',
    'https://www.bitget.com/ru/p2p-trade/sell?fiatName=RUB',
  ];

  let browser;
  let pages;
  let errorUrls;

  while (true) {
    browser = await launchBrowser();
    const result = await processPagesSequentially(browser, list);
    pages = result.pages;
    errorUrls = result.errorUrls;

    if (errorUrls.length === 0) {
      break;
    }

    await browser.close();
  }

  try {
    const delay = 0;
    await main(pages, delay);
  } catch (error) {
    console.log(error);
    await browser.close();
  }
}

async function infinity() {
  while (true) {
    await runParsing();
  }
}

infinity();
