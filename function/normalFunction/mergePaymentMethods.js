function mergePaymentMethods(results) {
  const mergedResults = {};
  for (const rowData of results) {
    if (rowData) {
      const name = rowData.name;
      const price = rowData.price;
      const payments = rowData.payments;
      const buy_sell = rowData.buy_sell;
      const token = rowData.token;

      const key = `${name}-${price}-${buy_sell}-${token}`;

      if (!mergedResults[key]) {
        mergedResults[key] = { ...rowData };
      } else {
        mergedResults[key].payments = Array.from(new Set([...mergedResults[key].payments, ...payments]));
      }
    }
  }
  return Object.values(mergedResults);
}

module.exports = { mergePaymentMethods };
