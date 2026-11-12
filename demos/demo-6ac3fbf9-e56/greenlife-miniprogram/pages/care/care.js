const { PLANTS } = require('../../utils/data.js');

Page({
  data: {
    cats: ['全部', '观叶', '耐旱', '水培'],
    cat: '全部',
    list: PLANTS,
    openId: null
  },

  onCat(e) {
    const cat = e.currentTarget.dataset.c;
    this.setData({
      cat,
      list: cat === '全部' ? PLANTS : PLANTS.filter(p => p.cat === cat),
      openId: null
    });
  },

  toggle(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ openId: this.data.openId === id ? null : id });
  },

  goContact() { wx.switchTab({ url: '/pages/contact/contact' }); },

  onShareAppMessage() {
    return { title: '植间养护百科 · 30 种室内植物怎么养', path: '/pages/care/care' };
  }
});
