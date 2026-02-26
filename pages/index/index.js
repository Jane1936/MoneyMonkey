const { TYPE_OPTIONS, CURRENCY_OPTIONS } = require('../../utils/report');

const STORAGE_KEY = 'moneyMonkeyTransactions';

function formatDate(date = new Date()) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

Page({
  data: {
    typeOptions: TYPE_OPTIONS,
    currencyOptions: CURRENCY_OPTIONS,
    typeIndex: 0,
    buyCurrencyIndex: 0,
    sellCurrencyIndex: 0,
    errorMsg: '',
    form: {
      stockName: '',
      buyTime: formatDate(),
      sellTime: formatDate(),
      buyAmount: '',
      sellAmount: ''
    },
    transactions: []
  },

  onShow() {
    this.loadTransactions();
  },

  loadTransactions() {
    const transactions = wx.getStorageSync(STORAGE_KEY) || [];
    this.setData({ transactions });
  },

  onTypeChange(e) {
    this.setData({ typeIndex: Number(e.detail.value) });
  },

  onBuyCurrencyChange(e) {
    this.setData({ buyCurrencyIndex: Number(e.detail.value) });
  },

  onSellCurrencyChange(e) {
    this.setData({ sellCurrencyIndex: Number(e.detail.value) });
  },

  onStockNameInput(e) {
    this.setData({ 'form.stockName': e.detail.value });
  },

  onBuyDateChange(e) {
    this.setData({ 'form.buyTime': e.detail.value });
  },

  onSellDateChange(e) {
    this.setData({ 'form.sellTime': e.detail.value });
  },

  onBuyAmountInput(e) {
    this.setData({ 'form.buyAmount': e.detail.value });
  },

  onSellAmountInput(e) {
    this.setData({ 'form.sellAmount': e.detail.value });
  },

  onAddRecord() {
    const {
      typeOptions,
      currencyOptions,
      typeIndex,
      buyCurrencyIndex,
      sellCurrencyIndex,
      form,
      transactions
    } = this.data;

    const buyAmount = Number(form.buyAmount);
    const sellAmount = Number(form.sellAmount);

    if (!form.stockName.trim()) {
      this.setData({ errorMsg: '请填写具体投资名称，例如：贵州茅台 / Apple / BTC。' });
      return;
    }

    if (!buyAmount || !sellAmount) {
      this.setData({ errorMsg: '买入金额和卖出金额必须大于 0。' });
      return;
    }

    if (form.sellTime < form.buyTime) {
      this.setData({ errorMsg: '卖出时间不能早于买入时间。' });
      return;
    }

    const returnRate = (((sellAmount - buyAmount) / buyAmount) * 100).toFixed(2);
    const newRecord = {
      id: `${Date.now()}`,
      assetType: typeOptions[typeIndex],
      stockName: form.stockName.trim(),
      buyTime: form.buyTime,
      tradeTime: form.sellTime,
      buyAmount: buyAmount.toFixed(2),
      sellAmount: sellAmount.toFixed(2),
      buyCurrency: currencyOptions[buyCurrencyIndex],
      sellCurrency: currencyOptions[sellCurrencyIndex],
      returnRate
    };

    const nextTransactions = [newRecord, ...transactions];
    wx.setStorageSync(STORAGE_KEY, nextTransactions);

    this.setData({
      transactions: nextTransactions,
      errorMsg: '',
      form: {
        ...form,
        stockName: '',
        buyAmount: '',
        sellAmount: ''
      }
    });

    wx.showToast({ title: '记录已保存', icon: 'success' });
  },

  toReport() {
    wx.navigateTo({ url: '/pages/report/report' });
  }
});
