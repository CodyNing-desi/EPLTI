import { useEffect } from 'react';
import wx from 'weixin-js-sdk';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function useWechatShare({ title, desc, link, imgUrl }) {
  useEffect(() => {
    // 只有在微信浏览器中才初始化
    const isWechat = /MicroMessenger/i.test(navigator.userAgent);
    if (!isWechat) return;

    const initWechat = async () => {
      try {
        const url = encodeURIComponent(window.location.href.split('#')[0]);
        const res = await fetch(`${API_BASE}/api/wechat/signature?url=${url}`);
        if (!res.ok) return;
        const config = await res.json();

        wx.config({
          debug: false,
          appId: config.appId,
          timestamp: config.timestamp,
          nonceStr: config.nonceStr,
          signature: config.signature,
          jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData']
        });

        wx.ready(() => {
          const shareData = { title, desc, link, imgUrl };
          wx.updateAppMessageShareData(shareData);
          wx.updateTimelineShareData(shareData);
        });
      } catch (err) {
        console.error('Wechat JSSDK Init Error:', err);
      }
    };

    initWechat();
  }, [title, desc, link, imgUrl]);
}
