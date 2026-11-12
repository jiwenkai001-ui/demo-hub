// app.js —— 全局状态：购物车、收藏（本地持久化）
App({
  globalData: {
    cart: {},   // { productId: count }
    favs: {}    // { productId: true }
  },

  onLaunch() {
    try {
      const c = wx.getStorageSync('zj_cart');
      const f = wx.getStorageSync('zj_favs');
      if (c) this.globalData.cart = c;
      if (f) this.globalData.favs = f;
    } catch (e) { console.warn('读取本地缓存失败', e); }
  },

  save() {
    try {
      wx.setStorageSync('zj_cart', this.globalData.cart);
      wx.setStorageSync('zj_favs', this.globalData.favs);
    } catch (e) { console.warn('写入本地缓存失败', e); }
  },

  addCart(id) {
    this.globalData.cart[id] = (this.globalData.cart[id] || 0) + 1;
    this.save();
  },

  changeQty(id, delta) {
    const n = (this.globalData.cart[id] || 0) + delta;
    if (n <= 0) delete this.globalData.cart[id];
    else this.globalData.cart[id] = n;
    this.save();
  },

  toggleFav(id) {
    if (this.globalData.favs[id]) delete this.globalData.favs[id];
    else this.globalData.favs[id] = true;
    this.save();
    return !!this.globalData.favs[id];
  },

  cartCount() {
    return Object.values(this.globalData.cart).reduce((a, b) => a + b, 0);
  }
});
