const updatePaymentMethods = (paymentMethods) => {
  return paymentMethods.map((method) => {
    switch (method) {

      case 'B8': // bitget
      case '97': // mexc
      case '186': // gateio
      case '64': // bybit
      case 'Raiffaizen':
      case 'Райффайзен':
      case 'Raiffeisen Bank':
      case 'Райффайзенбанк':
      case 'Raiffeisenbank':
        return 'Raiffeisenbank';

      case 'B47': // bitget ???
      case 'B21': // bitget ???
      case 'B3': // bitget
      case '13': // mexc
      case '75': // bybit
      case 'Тинькофф':
      case 'Tinkoff':
        return 'Tinkoff';

      case 'МТС Банк':
      case 'B44': // bitget
      case '44': // bybit
      case 'MTS Bank':
      case 'MTS-Bank':
        return 'MTS-Bank';

      case '31': // mexc
      case '22': // gateio
      case '62': // bybit
      case 'QiWi':
      case 'QIWI':
        return 'QIWI';

      case 'Росбанк':
      case 'B1': // bitget
      case '12': // mexc
      case 'RosBank':
      case '185': // bybit
      case 'Sberbank':
      case 'СберБанк':
      case 'Sber':
        return 'Sber';

      case '274': // bybit
      case 'YM':
      case 'Yandex':
      case 'YooMoney':
      case 'Yandex.Money':
      case 'Юmoney':
      case 'ЮMoney':
      case 'ЮMoney':
        return 'ЮMoney';

      case 'B39': // bitget
      case 'Россельхозбанк':
        // return 'RosBank';
        
      case 'B2': // bitget
      case '1': // bybit
      case 'Красный Банк':
      case 'Alfa-Bank':
      case 'Альфа-банк':
        // return 'Alfa Bank';

      case 'B7': // bitget
      case 'Газпромбанк':
        // return 'Gazprom';

      case '14': // bybit
        // return 'Bank Transfer';

      case 'Advanced cash RUB': // bitget
      case 'Cash in Person': // okx
      case 'CASH': // bitget
      case '90': // bybit
        // return 'Cash';

      case 'Почта Банк':
      case 'B13': // bitget
      case 'Pochta Bank':
        // return 'Post Bank';

      case 'Хоум Кредит Банк':
      case 'Home Credit Bank (Russia)':
      case '102': // bybit
      case 'Банк Хоум Кредит':
      case 'Home Credit Bank  (Russia)':
        // return 'Home Credit Bank';

      case 'B80': // bitget
      case '23': // mexc
      case '74': // gateio
      case 'SBP Fast Bank Transfer':
      case 'SBP - Fast Bank Transfer':
      case 'SBP System of fast payments':
      case 'СБП':
        // return 'SBP';

      case 'B5': // bitget
      case 'VTB':
      case 'ВТБ':
        // return 'VTB';

      case '73': // gateio
        // return 'Russia Standart Bank';

      case '70': // gateio
        // return 'AK Bars Bank';

      case '2': // gateio
        // return 'Банковская карта';

      case 'B23': // bitget
      case 'B15': // bitget
      case 'B41': // bitget
      case 'B22': // bitget
      case 'B16': // bitget
      case 'B14': // bitget
      case 'USDT': // bitget
      case 'Payeer': // bitget
      case 'AdvCash': // bitget
      case 'bank': // okx
      case 'Mobile Recharge': // bitget
      case 'Payeer RUB': // bitget
      case 'BTC Bitcoin': // bitget
        return undefined;

      default:
        return undefined;
    }
  }).filter(Boolean);
};

module.exports = { updatePaymentMethods };
