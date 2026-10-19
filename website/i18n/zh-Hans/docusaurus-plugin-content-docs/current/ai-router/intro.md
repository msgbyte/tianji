---
sidebar_position: 1
---

# AI 路由

AI Router 可以把多个 AI Gateway 组合成一个稳定的 AI 访问入口。它会在同一个 tier 内按权重分配流量，并在出现可重试失败时自动切换到其它 gateway route 或下一个 tier。

适合这些场景：

- 应用只接入一个统一 endpoint，而不是硬编码某一个 AI provider。
- 在多个 gateway 之间按权重分流。
- 主 provider 限流或故障时，自动切换到备用 provider。
- 迁移模型或 provider 时，通过调权重逐步放量。

## 和 AI Gateway 的关系

AI Gateway 仍然负责存储 provider 凭证、自定义 base URL、模型价格、额度告警和 gateway 日志。AI Router 不替代这些能力。

AI Router 只负责决定这次请求应该进入哪一个 gateway route。

运行时流程是：

1. 你的应用调用 AI Router endpoint。
2. AI Router 根据 workspace ID 和 router ID 找到 router。
3. AI Router 从第一个 tier 中选择一个可用 gateway route。
4. 被选中的 AI Gateway 把请求发送给上游 AI provider。
5. 如果成功，AI Router 直接返回该响应。
6. 如果失败且错误可重试，AI Router 会继续尝试同 tier 的其它 route，然后再尝试下一个 tier。

## 前置条件

添加 route 前，至少需要先创建一个已保存模型 API key 的 AI Gateway。没有保存 key 的 gateway 不会出现在 AI Router 的 route 选择列表中。

运行时请求仍然需要 Tianji API key：

- OpenAI 兼容 endpoint 使用 `Authorization: Bearer <YOUR_TIANJI_API_KEY>`。
- Anthropic Messages endpoint 使用 `x-api-key: <YOUR_TIANJI_API_KEY>`。

Tianji 会先验证调用方 API key，然后使用 AI Gateway 中保存的 provider key 去访问上游服务。

## 创建 router

1. 在 Tianji 侧边栏打开 **AI Router**。
2. 点击 **Add AI Router**。
3. 输入 router 名称。
4. 如果希望 router 接收运行时流量，保持 **Enabled** 开启。
5. 保存 router。

创建完成后，进入 **Routes** 页签配置 tier 和 gateway route。

## Tier

Tier 表示一个故障转移层级。

请求总是从第一个 tier 开始。如果出现可重试失败，AI Router 会继续尝试这个 tier 内的其它可用 route。当这个 tier 中所有可用 route 都失败后，才会进入下一个 tier。

当你需要严格的 fallback 顺序时，使用多个 tier。

示例：

| Tier | Route | 含义 |
| --- | --- | --- |
| Tier 1 | OpenAI primary, OpenRouter primary | 正常生产流量 |
| Tier 2 | DeepSeek backup | 主 provider 失败后的备用 |
| Tier 3 | Custom internal model | 最后的兜底 |

可以通过拖拽 tier 调整顺序。越靠上的 tier 越先尝试。

## 同 tier 内的权重

同一个 tier 里的 route 没有固定先后顺序，只按权重分配流量。

示例：

| Route | Weight | 近似首选比例 |
| --- | ---: | ---: |
| Gateway A | 80 | 80% |
| Gateway B | 20 | 20% |

这适合：

- 在多个 provider 之间随机分流。
- 从一个 provider 逐步迁移到另一个 provider。
- 用小流量验证新的 gateway。

如果你需要严格顺序，不要把 route 放在同一个 tier，应该放到不同 tier。

## 添加 gateway route

在 **Routes** 页签：

1. 点击某个 tier 里的 **Add Gateway**。
2. 选择已有 AI Gateway。
3. 选择这个 route 的 provider 模式。
4. 配置 route 选项。
5. 保存。

之后可以在 route 卡片上编辑或删除 route。

### Provider

Provider 决定 AI Router 用什么 provider 模式调用所选 AI Gateway。同一个 AI Gateway 可以在不同 route 中使用不同 provider 模式，只要这符合你的配置。

支持的 provider：

- `openai`
- `deepseek`
- `anthropic`
- `openrouter`
- `custom`

对于 `custom`，AI Router 会使用所选 AI Gateway 上保存的自定义模型配置，比如 custom base URL 和 custom model name。

### Weight

Weight 控制同一个 tier 内的流量分布。权重越高，该 route 越可能被优先尝试。

默认值：`100`。

### Model Override

Model Override 是可选项。

设置后，AI Router 会在发送给 gateway route 前，用这个值替换请求里的 `model`。如果希望由应用请求决定模型，保持为空。

### Timeout

Timeout 是单次 gateway 尝试的最长时间。

默认值：`30000ms`。

如果请求超时，AI Router 会把它视为可重试失败，并尝试下一个可用 route。

### Retryable Status Codes

AI Router 默认会把网络错误、超时，以及这些状态码视为可重试：

- `429`
- `500`
- `502`
- `503`
- `504`

可以通过 **Retryable Status Codes** 给单个 route 增加更多可重试状态码。例如某个 provider 经常用 HTTP `408` 表示临时请求超时，就可以添加 `408`。

谨慎添加 `400` 或 `401` 这类验证错误。它们通常表示请求或 key 配置有问题，重试其它 provider 可能会掩盖真正原因。

## 日志

**Logs** 页签会展示 router 的运行时尝试记录：

- Status：`Success`、`Failed` 或 `Partial`。
- Protocol：命中的请求协议。
- Attempts：尝试过多少个 gateway route。
- Final Gateway：产出最终结果的 gateway。
- Final Gateway Log：关联的 AI Gateway 日志 ID。
- Duration：耗时。

Router 日志适合观察 fallback 行为。需要查看 token、上游模型、成本和 provider 响应细节时，再进入关联的 AI Gateway 日志。
