import platform from './platform';

export default class ShareManager {
  constructor() {
    this.shareTitles = [
      '数一数噻 - 找回消失的专注力！',
      '我能找到所有数字，你能吗？',
      '挑战你的专注力极限！数一数噻',
      '这个数字游戏太上头了！'
    ];
    // 微信 CDN 分享图。抖音不支持网络分享图：shareImages 留空，
    // imageUrl 不传由平台自动截图（TODO: 后续提供 5:4 本地图 image/share/*.png）
    this.shareImages = platform.type === 'wechat'
      ? [
        'https://mmocgame.qpic.cn/wechatgame/ia9bI9ZkVFJ0CQMNicgq67tocDwKuP04ZDq7wLKNJBbHHJBH4OQ21TFMiawj5A72wCD/0',
        'https://mmocgame.qpic.cn/wechatgame/ZSNQDes4Pge8bRywMDtto8JeM9x6lHUALVbnZBx92CaDlhLVdEayqKC98OovB4gm/0',
        'https://mmocgame.qpic.cn/wechatgame/RptOPklgbiaXPTic6NlTM54IcazvL5BlrqwibHfrDEzZhWn5U6V89ic14nJQHmFAthCg/0'
      ]
      : [];
  }

  init() {
    this._setupShareMenu();
    this._setupShareAppMessage();
    this._setupShareTimeline();
  }

  _setupShareMenu() {
    platform.showShareMenu();
  }

  _setupShareAppMessage() {
    platform.onShareAppMessage(() => this._buildPayload());
  }

  _setupShareTimeline() {
    platform.onShareTimeline(() => this._buildPayload());
  }

  shareAppMessage(title) {
    platform.shareAppMessage(this._buildPayload(title));
  }

  _buildPayload(title) {
    const payload = { title: title || this._getRandomTitle() };
    const image = this._getRandomImage();
    if (image) {
      payload.imageUrl = image;
    }
    return payload;
  }

  _getRandomTitle() {
    return this.shareTitles[Math.floor(Math.random() * this.shareTitles.length)];
  }

  _getRandomImage() {
    if (this.shareImages.length === 0) return undefined;
    return this.shareImages[Math.floor(Math.random() * this.shareImages.length)];
  }
}
