const { CASES } = require('../../utils/data.js');
const ALL = CASES.map((c, i) => Object.assign({}, c, { no: i + 1 }));

Page({
  data: {
    cats: ['全部', '住宅', '办公', '商业'],
    cat: '全部',
    list: ALL,
    detail: null
  },

  onCat(e) {
    const cat = e.currentTarget.dataset.c;
    this.setData({ cat, list: cat === '全部' ? ALL : ALL.filter(c => c.cat === cat) });
  },

  openCase(e) {
    this.setData({ detail: ALL.find(c => c.id === e.currentTarget.dataset.id) });
  },

  closeSheet() { this.setData({ detail: null }); },
  noop() {},

  goContact() {
    this.setData({ detail: null });
    wx.switchTab({ url: '/pages/contact/contact' });
  },

  onShareAppMessage() {
    return { title: '植间 · 他们把绿意带回了家', path: '/pages/cases/cases' };
  }
});
