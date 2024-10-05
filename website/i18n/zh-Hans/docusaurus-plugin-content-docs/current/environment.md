---
sidebar_position: 2
_i18n_hash: c65e22ae3d729a07b0b23f525a89b8ca
---
# 环境

以下是可以在 Docker 中配置的环境变量

| 名称 | 默认值 | 描述 |
| ---- | ---- | ----- |
| JWT_SECRET | - | 用于计算密钥的随机字符串 |
| ALLOW_REGISTER | false | 是否允许用户注册账户 |
| ALLOW_OPENAPI | false | 是否允许使用 OpenAPI 进行数据获取或提交，类似于通过 UI 操作 |
| SANDBOX_MEMORY_LIMIT | 16 | 自定义脚本监控沙盒内存限制，控制监控脚本不占用过多内存（单位：MB，最小值为 8） |
| MAPBOX_TOKEN | - | 用于替换默认访客地图的 MapBox 令牌 |
| AMAP_TOKEN | - | 用于替换默认访客地图的高德地图令牌 |
| CUSTOM_TRACKER_SCRIPT_NAME | - | 修改默认的 `tracker.js` 脚本名称以避免广告拦截 |
| DISABLE_ANONYMOUS_TELEMETRY | false | 禁用向天机官方发送遥测报告，我们会在最小匿名化的前提下向天机官网报告使用情况。 |
| DISABLE_AUTO_CLEAR | false | 禁用自动清除数据。 |
