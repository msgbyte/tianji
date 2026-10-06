import { describe, expect, test } from 'vitest';
import { getBrowserName, getLocation } from '../detect.js';
import fs from 'fs-extra';
import { libraryPath } from '../lib.js';

describe.runIf(fs.existsSync(libraryPath.geoPath))('detect', () => {
  describe('getLocation', () => {
    test('should detect local ip', async () => {
      const location = await getLocation('127.0.0.1');

      expect(location).toBeUndefined();
    });

    test('should detect public ip', async () => {
      const location = await getLocation('76.76.21.123');

      expect(location).toHaveProperty('country', 'US');
      expect(location).toHaveProperty('subdivision1', 'CA');
      expect(location).toHaveProperty('subdivision2', undefined);
      expect(location).toHaveProperty('city', 'Walnut');
      expect(location).toHaveProperty('longitude', -117.8512);
      expect(location).toHaveProperty('latitude', 34.0233);
      expect(location).toHaveProperty('accuracyRadius', 20);
    });
  });
});

describe('getBrowserName', () => {
  test.each([
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.43(0x18002b2c) NetType/WIFI Language/zh_CN',
      'wechat',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36 NetType/WIFI MicroMessenger/7.0.20.1781(0x6700143B) WindowsWechat(0x63090a13) XWEB/9129 Flue',
      'wechat',
    ],
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Lark/7.12.7 Chrome/120.0.6099.71 Safari/537.36 LarkLocale/zh_CN ChannelName/Feishu',
      'feishu',
    ],
    [
      'Mozilla/5.0 (Linux; Android 12; V2134A Build/SP1A.210812.003; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.72 MQQBrowser/6.2 TBS/046295 Mobile Safari/537.36 V1_AND_SQ_8.9.68_4264_YYB_D QQ/8.9.68.11565 NetType/WIFI WebP/0.3.0',
      'qq',
    ],
    [
      'Mozilla/5.0 (Linux; Android 13; SM-S908B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.6045.163 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/442.0.0.33.113;]',
      'facebook',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0.0.0 (iPhone14,2; iOS 17_0; en_US; en; scale=3.00; 1170x2532; 1)',
      'instagram',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/13.0.0',
      'line',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'ios',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'chrome',
    ],
    [
      'Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0.0.0 Mobile Safari/537.36',
      'chromium-webview',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 wxwork/4.1.6 MicroMessenger/7.0.1 Language/zh ColorScheme/Light',
      'wecom',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Weibo (iPhone14,2__weibo__13.10.1__iphone__os17.0)',
      'weibo',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 AliApp(DingTalk/7.0.40) com.laiwang.DingTalk/30512345 Channel/201200 language/zh-Hans-CN',
      'dingtalk',
    ],
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Lark/7.12.7 Chrome/120.0.6099.71 Safari/537.36 LarkLocale/en_US ChannelName/Lark',
      'lark',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 AlipayChannelId/5136 AliApp(AP/10.5.36.6000) AlipayClient/10.5.36.6000 Language/zh-Hans',
      'alipay',
    ],
    [
      'Mozilla/5.0 (Linux; Android 13; 22081212C Build/TKQ1.220829.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/107.0.5304.105 Mobile Safari/537.36 aweme_230400 JsSdk/1.0 NetType/WIFI AppName/aweme app_version/23.4.0',
      'douyin',
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_31.5.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/en Region/US',
      'tiktok',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.25 Safari/537.36 Core/1.70.3870.400 QQBrowser/10.8.4405.400',
      'chrome',
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0 Safari/537.36 DingTalkBot-LinkService/1.0',
      'chrome',
    ],
    ['Mozilla/5.0 (compatible; Weibo spider)', 'searchbot'],
    ['', null],
  ])('%s', (userAgent, expected) => {
    expect(getBrowserName(userAgent)).toBe(expected);
  });
});
