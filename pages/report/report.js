const { generateReports, generateCurveData, normalizeTransactions } = require('../../utils/report');

const STORAGE_KEY = 'moneyMonkeyTransactions';

Page({
  data: {
    hasData: false,
    monthly: [],
    yearly: [],
    granularityOptions: ['year', 'month', 'week', 'day'],
    granularityLabelMap: {
      year: '按年',
      month: '按月',
      week: '按周',
      day: '按日'
    },
    activeGranularity: 'month',
    curveData: []
  },

  onShow() {
    this.loadData();
  },

  onReady() {
    this.drawCurve();
  },

  loadData() {
    const transactions = normalizeTransactions(wx.getStorageSync(STORAGE_KEY) || []);
    if (!transactions.length) {
      this.setData({ hasData: false, monthly: [], yearly: [], curveData: [] }, () => this.drawCurve());
      return;
    }

    const { monthly, yearly } = generateReports(transactions);
    const curveData = generateCurveData(transactions, this.data.activeGranularity);
    this.setData({ hasData: true, monthly, yearly, curveData }, () => this.drawCurve());
  },

  onGranularityTap(e) {
    const granularity = e.currentTarget.dataset.value;
    const transactions = normalizeTransactions(wx.getStorageSync(STORAGE_KEY) || []);
    const curveData = generateCurveData(transactions, granularity);
    this.setData({ activeGranularity: granularity, curveData }, () => this.drawCurve());
  },

  drawCurve() {
    const ctx = wx.createCanvasContext('curveCanvas', this);
    const width = 680;
    const height = 300;
    const padding = 40;
    const points = this.data.curveData;

    ctx.clearRect(0, 0, width, height);
    ctx.setFillStyle('#f9f9fb');
    ctx.fillRect(0, 0, width, height);

    ctx.setStrokeStyle('#d1d1d6');
    ctx.strokeRect(0, 0, width, height);

    if (!points.length) {
      ctx.setFillStyle('#8e8e93');
      ctx.setFontSize(24);
      ctx.fillText('暂无可绘制数据', 250, 150);
      ctx.draw();
      return;
    }

    const rates = points.map((p) => p.avgReturnRate);
    let minY = Math.min(...rates);
    let maxY = Math.max(...rates);
    if (minY === maxY) {
      minY -= 1;
      maxY += 1;
    }

    const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

    ctx.setStrokeStyle('#007aff');
    ctx.setLineWidth(4);
    points.forEach((point, index) => {
      const x = padding + index * stepX;
      const y = height - padding - ((point.avgReturnRate - minY) / (maxY - minY)) * (height - padding * 2);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    ctx.setFillStyle('#007aff');
    points.forEach((point, index) => {
      const x = padding + index * stepX;
      const y = height - padding - ((point.avgReturnRate - minY) / (maxY - minY)) * (height - padding * 2);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.setFillStyle('#8e8e93');
    ctx.setFontSize(20);
    ctx.fillText(`最大 ${maxY.toFixed(2)}%`, 20, 24);
    ctx.fillText(`最小 ${minY.toFixed(2)}%`, 20, height - 10);
    ctx.draw();
  }
});
