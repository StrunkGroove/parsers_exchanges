const path = require('path');
const puppeteer = require('puppeteer-core');
const chromePath = path.join(__dirname, '../../chrome-linux64/chrome');
const fs = require('fs');

async function launchBrowser() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: chromePath,
    args: ['--window-size=1920,1280', '--max-old-space-size=1024']
  });
  return browser;
}

async function getAndSaveCookies() {
  const url = 'https://www.bitget.com/ru/p2p-trade?fiatName=USD';
  const cookiesFilePath = 'cookies.json';

  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1280 });

    await page.goto(url, { waitUntil: 'networkidle2' });

    const cookies = await page.cookies();

    fs.writeFileSync(cookiesFilePath, JSON.stringify(cookies, null, 2));

    console.log('Куки успешно сохранены в файл:', cookiesFilePath);

    await browser.close();
  } catch (error) {
    console.error('Произошла ошибка:', error);
  }
}

getAndSaveCookies();