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

const CURRENCY_OPTIONS = ['RMB', 'HKD', 'USD'];

function toMonthKey(dateStr) {
  return dateStr.slice(0, 7);
}

function toYearKey(dateStr) {
  return dateStr.slice(0, 4);
}

function toDayKey(dateStr) {
  return dateStr;
}

function toWeekKey(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  const dayNum = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - dayNum + 3);
  const firstThursday = new Date(date.getFullYear(), 0, 4);
  const diff = date - firstThursday;
  const week = 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
  return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function createCurrencyTotals() {
  return CURRENCY_OPTIONS.reduce((acc, currency) => {
    acc[currency] = { currency, buyAmount: 0, sellAmount: 0, realizedProfit: 0 };
    return acc;
  }, {});
}

function createTypeBucket(type) {
  return {
    type,
    count: 0,
    avgReturnRate: 0,
    returnRateSum: 0,
    byCurrency: createCurrencyTotals()
  };
}

function createInitBucket(key) {
  return {
    period: key,
    count: 0,
    avgReturnRate: 0,
    returnRateSum: 0,
    byCurrency: createCurrencyTotals(),
    byType: {}
  };
}

function getProfit(item) {
  if (item.buyCurrency !== item.sellCurrency) {
    return null;
  }
  return Number(item.sellAmount || 0) - Number(item.buyAmount || 0);
}

function updateCurrencyBucket(currencyTotals, item) {
  const buyCurrencyBucket = currencyTotals[item.buyCurrency];
  const sellCurrencyBucket = currencyTotals[item.sellCurrency];
  if (buyCurrencyBucket) {
    buyCurrencyBucket.buyAmount += Number(item.buyAmount || 0);
  }
  if (sellCurrencyBucket) {
    sellCurrencyBucket.sellAmount += Number(item.sellAmount || 0);
  }

  const profit = getProfit(item);
  if (profit !== null && sellCurrencyBucket) {
    sellCurrencyBucket.realizedProfit += profit;
  }
}

function normalizeBucket(bucket) {
  const byCurrency = Object.values(bucket.byCurrency).filter(
    (row) => row.buyAmount || row.sellAmount || row.realizedProfit
  );

  const byType = Object.values(bucket.byType)
    .map((typeBucket) => ({
      ...typeBucket,
      avgReturnRate: typeBucket.count ? typeBucket.returnRateSum / typeBucket.count : 0,
      byCurrency: Object.values(typeBucket.byCurrency).filter(
        (row) => row.buyAmount || row.sellAmount || row.realizedProfit
      )
    }))
    .sort((a, b) => b.count - a.count);

  return {
    ...bucket,
    avgReturnRate: bucket.count ? bucket.returnRateSum / bucket.count : 0,
    byCurrency,
    byType
  };
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
    const rate = Number(item.returnRate || 0);
    bucket.returnRateSum += rate;
    updateCurrencyBucket(bucket.byCurrency, item);

    if (!bucket.byType[item.assetType]) {
      bucket.byType[item.assetType] = createTypeBucket(item.assetType);
    }

    const typeBucket = bucket.byType[item.assetType];
    typeBucket.count += 1;
    typeBucket.returnRateSum += rate;
    updateCurrencyBucket(typeBucket.byCurrency, item);
  });

  return Object.values(map)
    .sort((a, b) => (a.period < b.period ? 1 : -1))
    .map(normalizeBucket);
}

function generateCurveData(transactions, granularity = 'month') {
  const granularityMap = {
    day: toDayKey,
    week: toWeekKey,
    month: toMonthKey,
    year: toYearKey
  };
  const keyGetter = granularityMap[granularity] || toMonthKey;
  const map = {};

  transactions.forEach((item) => {
    const key = keyGetter(item.tradeTime);
    if (!map[key]) {
      map[key] = { period: key, count: 0, returnRateSum: 0 };
    }
    map[key].count += 1;
    map[key].returnRateSum += Number(item.returnRate || 0);
  });

  return Object.values(map)
    .sort((a, b) => (a.period > b.period ? 1 : -1))
    .map((item) => ({
      period: item.period,
      avgReturnRate: item.count ? Number((item.returnRateSum / item.count).toFixed(2)) : 0
    }));
}

function generateReports(transactions) {
  return {
    monthly: calculatePeriodReport(transactions, toMonthKey),
    yearly: calculatePeriodReport(transactions, toYearKey)
  };
}

module.exports = {
  TYPE_OPTIONS,
  CURRENCY_OPTIONS,
  generateReports,
  generateCurveData
};
