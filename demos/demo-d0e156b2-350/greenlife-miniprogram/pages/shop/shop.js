const app = getApp();
const { PRODUCTS } = require('../../utils/data.js');

Page({
  data: {
    cats: ['全部', '大型', '桌面', '配件'],
    cat: '全部',
    keyword: '',
    list: PRODUCTS,
    favs: {},
    cartCount: 0,
    cartItems: [],
    total: 0,
    detail: null,
    showCart: false,
    orderNo: ''
  },

  onShow() { this.refresh(); },

  refresh() {
    const cart = app.globalData.cart;
    const items = Object.keys(cart)
      .filter(id => cart[id] > 0)
      .map(id => {
        const p = PRODUCTS.find(x => x.id === id);
        return p ? Object.assign({}, p, { count: cart[id], subtotal: p.price * cart[id] }) : null;
      })
      .filter(Boolean);
    this.setData({
      favs: Object.assign({}, app.globalData.favs),
      cartCount: app.cartCount(),
      cartItems: items,
      total: items.reduce((s, i) => s + i.subtotal, 0)
    });
  },

  filterList() {
    const { cat, keyword } = this.data;
    const q = (keyword || '').trim().toLowerCase();
    this.setData({
      list: PRODUCTS.filter(p =>
        (cat === '全部' || p.cat === cat) &&
        (!q || (p.name + p.spec + p.badge + p.level).toLowerCase().indexOf(q) >= 0))
    });
  },

  onCat(e) { this.setData({ cat: e.currentTarget.dataset.c }, () => this.filterList()); },
  onSearch(e) { this.setData({ keyword: e.detail.value }, () => this.filterList()); },

  openProduct(e) {
    this.setData({ detail: PRODUCTS.find(x => x.id === e.currentTarget.dataset.id), showCart: false, orderNo: '' });
  },

  closeSheet() { this.setData({ detail: null, showCart: false, orderNo: '' }); },
  noop() {},

  addCart(e) {
    app.addCart(e.currentTarget.dataset.id);
    this.refresh();
    wx.showToast({ title: '已加入购物车', icon: 'none' });
  },

  addFromDetail() {
    app.addCart(this.data.detail.id);
    this.setData({ detail: null });
    this.refresh();
    wx.showToast({ title: '已加入购物车', icon: 'none' });
  },

  toggleFav(e) {
    app.toggleFav(e.currentTarget.dataset.id);
    this.refresh();
  },

  toggleFavInDetail() {
    app.toggleFav(this.data.detail.id);
    this.refresh();
  },

  openCart() {
    this.refresh();
    this.setData({ showCart: true, detail: null, orderNo: '' });
  },

  chg(e) {
    const { id, d } = e.currentTarget.dataset;
    app.changeQty(id, Number(d));
    this.refresh();
  },

  checkout() {
    if (!app.cartCount()) return;
    const no = 'ZJ' + String(Date.now()).slice(-8);
    app.globalData.cart = {};
    app.save();
    this.refresh();
    this.setData({ showCart: false, orderNo: no });
  },

  goContact() {
    this.setData({ orderNo: '' });
    wx.switchTab({ url: '/pages/contact/contact' });
  },

  onShareAppMessage() {
    return { title: '植间 · 挑一盆绿植带回家', path: '/pages/shop/shop' };
  }
});
