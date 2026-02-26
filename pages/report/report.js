const { generateReports } = require('../../utils/report');

const STORAGE_KEY = 'moneyMonkeyTransactions';

Page({
  data: {
    hasData: false,
    monthly: [],
    yearly: []
  },

  onShow() {
    const transactions = wx.getStorageSync(STORAGE_KEY) || [];
    if (!transactions.length) {
      this.setData({
        hasData: false,
        monthly: [],
        yearly: []
      });
      return;
    }

    const { monthly, yearly } = generateReports(transactions);
    this.setData({
      hasData: true,
      monthly,
      yearly
    });
  }
});
