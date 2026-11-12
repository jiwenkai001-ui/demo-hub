const { FAQ } = require('../../utils/data.js');

Page({
  data: {
    name: '', phone: '', msg: '',
    needs: ['选植物/搭配', '办公室配置', '养护问诊', '门店与售后'],
    need: '选植物/搭配',
    faq: FAQ,
    openFaq: -1,
    ticket: '',
    name2: '', phone2: '', need2: ''
  },

  onName(e)  { this.setData({ name: e.detail.value }); },
  onPhone(e) { this.setData({ phone: e.detail.value }); },
  onMsg(e)   { this.setData({ msg: e.detail.value }); },
  onNeed(e)  { this.setData({ need: e.currentTarget.dataset.n }); },

  toggleFaq(e) {
    const i = Number(e.currentTarget.dataset.i);
    this.setData({ openFaq: this.data.openFaq === i ? -1 : i });
  },

  callUs() {
    wx.makePhoneCall({
      phoneNumber: '4008206688',
      fail: () => wx.showToast({ title: '可拨打 400-820-6688', icon: 'none' })
    });
  },

  copyWechat() {
    wx.setClipboardData({
      data: 'zhijian_green',
      success: () => wx.showToast({ title: '微信号已复制', icon: 'none' })
    });
  },

  showAddress() {
    wx.showModal({
      title: '植间 · 绿植生活馆',
      content: '上海市徐汇区武康路 118 号\n营业时间 9:00–20:00（周一至周日）',
      confirmText: '知道了',
      showCancel: false
    });
  },

  submit() {
    const { name, phone, need, msg } = this.data;
    if (!name.trim()) {
      wx.showToast({ title: '请填写称呼', icon: 'none' }); return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      wx.showToast({ title: '请填写正确的 11 位手机号', icon: 'none' }); return;
    }
    const masked = phone.slice(0, 3) + '****' + phone.slice(-4);
    this.setData({
      ticket: 'ZX' + String(Date.now()).slice(-8),
      name2: name.trim(), phone2: masked, need2: need,
      name: '', phone: '', msg: ''
    });
    // 实际业务中此处应调用后端接口提交需求，当前为本地演示
  },

  closeSheet() { this.setData({ ticket: '' }); },
  noop() {},

  onShareAppMessage() {
    return { title: '植间 · 聊聊你的绿植需求', path: '/pages/contact/contact' };
  }
});
