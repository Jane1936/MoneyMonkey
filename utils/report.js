const TYPE_OPTIONS = [
  '中国A股',
  '港股',
  '美股',
  '银行积存金',
  '黄金实物',
  '白银实物',
  '铂金实物',
  '虚拟币'
];

function toMonthKey(dateStr) {
  return dateStr.slice(0, 7);
}

function toYearKey(dateStr) {
  return dateStr.slice(0, 4);
}

function createInitBucket(key) {
  return {
    period: key,
    count: 0,
    buyAmount: 0,
    sellAmount: 0,
    realizedProfit: 0,
    avgReturnRate: 0,
    returnRateSum: 0,
    byType: {}
  };
}

function ensureTypeBucket(container, type) {
  if (!container.byType[type]) {
    container.byType[type] = {
      type,
      count: 0,
      realizedProfit: 0,
      avgReturnRate: 0,
      returnRateSum: 0
    };
  }
  return container.byType[type];
}

function calculatePeriodReport(transactions, getPeriodKey) {
  const map = {};
  transactions.forEach((item) => {
    const key = getPeriodKey(item.tradeTime);
    if (!map[key]) {
      map[key] = createInitBucket(key);
    }

    const bucket = map[key];
    bucket.count += 1;
    bucket.buyAmount += Number(item.buyAmount || 0);
    bucket.sellAmount += Number(item.sellAmount || 0);

    const profit = Number(item.sellAmount || 0) - Number(item.buyAmount || 0);
    bucket.realizedProfit += profit;

    const rate = Number(item.returnRate || 0);
    bucket.returnRateSum += rate;

    const typeBucket = ensureTypeBucket(bucket, item.assetType);
    typeBucket.count += 1;
    typeBucket.realizedProfit += profit;
    typeBucket.returnRateSum += rate;
  });

  return Object.values(map)
    .sort((a, b) => (a.period < b.period ? 1 : -1))
    .map((bucket) => {
      bucket.avgReturnRate = bucket.count ? bucket.returnRateSum / bucket.count : 0;
      const typeList = Object.values(bucket.byType).map((typeBucket) => ({
        ...typeBucket,
        avgReturnRate: typeBucket.count ? typeBucket.returnRateSum / typeBucket.count : 0
      }));
      return {
        ...bucket,
        byType: typeList.sort((a, b) => b.realizedProfit - a.realizedProfit)
      };
    });
}

function generateReports(transactions) {
  return {
    monthly: calculatePeriodReport(transactions, toMonthKey),
    yearly: calculatePeriodReport(transactions, toYearKey)
  };
}

module.exports = {
  TYPE_OPTIONS,
  generateReports
};
