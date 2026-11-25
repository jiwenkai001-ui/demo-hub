const app = getApp();
const { PRODUCTS, TIPS } = require('../../utils/data.js');

Page({
  data: {
    products: PRODUCTS.slice(0, 4),
    tips: TIPS,
    remindOn: true,
    detail: null,
    faved: false
  },

  onShow() {
    if (this.data.detail) {
      this.setData({ faved: !!app.globalData.favs[this.data.detail.id] });
    }
  },

  goShop()    { wx.switchTab({ url: '/pages/shop/shop' }); },
  goCare()    { wx.switchTab({ url: '/pages/care/care' }); },
  goCases()   { wx.switchTab({ url: '/pages/cases/cases' }); },
  goContact() { wx.switchTab({ url: '/pages/contact/contact' }); },

  toggleRemind() {
    this.setData({ remindOn: !this.data.remindOn });
    wx.showToast({ title: this.data.remindOn ? '已开启养护提醒' : '已关闭养护提醒', icon: 'none' });
  },

  openProduct(e) {
    const p = PRODUCTS.find(x => x.id === e.currentTarget.dataset.id);
    this.setData({ detail: p, faved: !!app.globalData.favs[p.id] });
  },

  closeSheet() { this.setData({ detail: null }); },
  noop() {},

  addCart(e) {
    app.addCart(e.currentTarget.dataset.id);
    wx.showToast({ title: '已加入购物车', icon: 'none' });
  },

  addFromDetail() {
    app.addCart(this.data.detail.id);
    this.setData({ detail: null });
    wx.showToast({ title: '已加入购物车', icon: 'none' });
  },

  toggleFav() {
    const on = app.toggleFav(this.data.detail.id);
    this.setData({ faved: on });
    wx.showToast({ title: on ? '已收藏' : '已取消收藏', icon: 'none' });
  },

  onShareAppMessage() {
    return { title: '植间 · 把一整个春天搬进你的房间', path: '/pages/index/index' };
  }
});
