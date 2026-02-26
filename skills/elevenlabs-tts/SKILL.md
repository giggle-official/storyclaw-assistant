---
name: elevenlabs-tts
description: Text-to-speech via ElevenLabs API with multilingual support and voice cloning. Outputs ogg_opus format.
homepage: https://elevenlabs.io
metadata:
  {
    "openclaw":
      {
        "emoji": "🗣️",
        "requires": { "env": ["ELEVENLABS_API_KEY"] },
        "primaryEnv": "ELEVENLABS_API_KEY",
      },
  }
---

# 技能：elevenlabs-tts

> 独占技能（仅 companion/Mira 使用）
> 版本：1.0.0

---

## 功能描述

调用 ElevenLabs TTS API 将文字合成语音，直接输出 ogg_opus 格式（无需 ffmpeg 转码），通过 Telegram `sendVoice` 接口发送。支持中英文自然切换，并支持**声音克隆**——可上传音频样本配置林志玲风格的自定义声音。

---

## API 规格

| 参数         | 值                                                                       |
| ------------ | ------------------------------------------------------------------------ |
| 端点         | `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream`          |
| 模型         | `eleven_multilingual_v2`（中英混合最佳）/ `eleven_flash_v2_5`（低延迟）  |
| 默认声音     | 内置女声（见下方推荐列表）                                               |
| 输出格式     | `ogg_opus`（原生支持，Telegram `sendVoice` 可直接使用，**无需 ffmpeg**） |
| 最大文本长度 | 5,000 字符                                                               |
| 认证方式     | `xi-api-key: {ELEVENLABS_API_KEY}`                                       |

---

## 推荐声音选项

### 内置声音（零配置可用）

| 声音名   | 风格       | 中文表现 | 适用场景                      |
| -------- | ---------- | -------- | ----------------------------- |
| `Sarah`  | 温柔、亲切 | 良好     | Mira 情感陪伴（**推荐起步**） |
| `Rachel` | 沉稳、知性 | 良好     | evening / weekly 沉静消息     |
| `Aria`   | 清透、中性 | 良好     | 日常对话                      |

> 内置声音均为英文原生，通过 `eleven_multilingual_v2` 处理中文时有轻微外国口音，适合用户接受此风格时使用。

### 声音克隆（推荐用于纯中文自然发音）

通过 ElevenLabs Voice Lab 克隆声音，可实现接近林志玲风格的自然中文发音：

```
1. 登录 ElevenLabs → Voice Lab → Add Voice → Instant Voice Cloning
2. 上传 1-5 分钟高质量中文音频（清晰、少背景噪声、情感自然）
3. 命名声音（如 "Mira_ZH"），完成克隆后获取 Voice ID
4. 将 Voice ID 填入 ~/.openclaw/.env.local 的 ELEVENLABS_VOICE_ID 字段
```

克隆声音的质量取决于样本音频质量：清晰、情感丰富、1 分钟以上效果最佳。

---

## 调用接口

### speak(text, voice_id=None, output_path=None) → str

```
输入:
  text        必填，要合成的文字
  voice_id    可选，覆盖 ELEVENLABS_VOICE_ID 环境变量配置
  output_path 可选，指定输出路径（默认 /tmp/mira_tts_{uuid}.ogg）

输出:
  str — 生成的 ogg 文件绝对路径

异常:
  ElevenLabsTTSError — API 调用失败（含 HTTP 状态码）
  QuotaExceededError — 月度字符额度耗尽（HTTP 429）
```

---

## 合成流程

```
1. 读取 ELEVENLABS_VOICE_ID（未配置则使用内置 Sarah voice ID）
2. POST /v1/text-to-speech/{voice_id}/stream:
   Headers:
     xi-api-key: {ELEVENLABS_API_KEY}
     Accept: audio/ogg; codecs=opus
     Content-Type: application/json
   Body:
   {
     "text": "<消息文字>",
     "model_id": "eleven_multilingual_v2",
     "voice_settings": {
       "stability": 0.65,
       "similarity_boost": 0.80,
       "style": 0.35,
       "use_speaker_boost": true
     }
   }
3. 流式接收 ogg_opus 数据，写入 /tmp/mira_tts_{uuid}.ogg
4. 返回 .ogg 文件路径
```

> **参数说明**：`stability: 0.65` — 保留情感弹性，不过于机械；`style: 0.35` — 轻微风格化，自然不夸张。可在 USER.md 的 `voice_style` 字段微调。

---

## 与 Telegram 集成

生成 .ogg 文件后通过 `sendVoice` 发送：

```
POST https://api.telegram.org/bot{TG_BOT_TOKEN_COMPANION}/sendVoice
Content-Type: multipart/form-data

chat_id: <TG_ADMIN_CHAT_ID>
voice:   <.ogg 文件>
caption: <原始文字>（可选，作为字幕）
```

发送后立即删除临时 .ogg 文件。

---

## 用量追踪

ElevenLabs 按字符计费，每次调用后记录用量：

```json
// ~/.openclaw/workspaces/companion/logs/elevenlabs-usage.json
{
  "month": "2026-02",
  "totalChars": 12450,
  "limitChars": 30000,
  "remaining": 17550,
  "lastUpdated": "2026-02-25T10:30:00Z"
}
```

余量低于 10% 时自动降级为文字发送，并通过 Telegram 通知用户检查用量。

---

## 文本预处理规则

| 处理项        | 规则                                          |
| ------------- | --------------------------------------------- |
| Markdown 符号 | 移除 `**`、`_`、`~`、`` ` `` 等格式符号       |
| URL           | 替换为「一个链接」                            |
| Emoji         | 保留（multilingual v2 会自然处理）            |
| 超长消息      | > 500 字时截断为前 500 字；同时发送完整文字版 |

---

## 语音发送时机

与 minimax-tts 相同，由 `proactive-chat` 技能控制触发逻辑：

| 触发类型     | 默认行为             | 原因                      |
| ------------ | -------------------- | ------------------------- |
| `morning`    | 语音优先             | 晨间问候适合听            |
| `evening`    | 语音优先             | 夜晚陪伴感更强            |
| `weekly`     | 语音优先             | 情感回顾适合声音传递      |
| `discovery`  | 文字优先             | 含链接/引用内容不适合朗读 |
| 用户直接对话 | 文字（除非用户要求） | 对话回复效率优先          |

用户可在 `USER.md` 的 `voice_messages` 字段关闭语音（`enabled: false`）或调整 `voice_style`（stability/similarity 参数）。

---

## 降级策略

| 条件                                    | 处理                       |
| --------------------------------------- | -------------------------- |
| `ELEVENLABS_API_KEY` 未配置             | 降级为文字，记录 warn 日志 |
| HTTP 4xx / 5xx                          | 降级，记录 error 日志      |
| 月额度耗尽（HTTP 429）                  | 降级，通知用户充值         |
| 余量 < 10%                              | 自动降级，通知用户         |
| 文字 < 5 字                             | 降级                       |
| USER.md `voice_messages.enabled: false` | 降级                       |
| discovery 消息含外链                    | 降级                       |

---

## 环境变量

| 变量                  | 必填 | 说明                                                              |
| --------------------- | ---- | ----------------------------------------------------------------- |
| `ELEVENLABS_API_KEY`  | ✅   | ElevenLabs 平台 API Key（[elevenlabs.io](https://elevenlabs.io)） |
| `ELEVENLABS_VOICE_ID` | 可选 | 自定义/克隆声音 ID（未配置则使用内置 Sarah）                      |

---

## 依赖

- `requests`（Python HTTP 请求）
- 无需 ffmpeg（原生输出 ogg_opus）
- `ELEVENLABS_API_KEY`
- `TG_BOT_TOKEN_COMPANION`、`TG_ADMIN_CHAT_ID`

---

## 日志

- 合成成功：`~/.openclaw/workspaces/companion/logs/tts.log`（记录 voice_id、字符数、耗时）
- 用量追踪：`~/.openclaw/workspaces/companion/logs/elevenlabs-usage.json`
- 降级记录：`tts.log`（含降级原因）
- 错误：`~/.openclaw/workspaces/companion/logs/error.log`

---

## 与 minimax-tts 对比

| 维度         | elevenlabs-tts                   | minimax-tts                 |
| ------------ | -------------------------------- | --------------------------- |
| 中文自然度   | ⭐⭐⭐⭐ 良好（multilingual v2） | ⭐⭐⭐⭐⭐ 极佳（原生中文） |
| 中英混合     | ⭐⭐⭐⭐⭐ 极佳                  | ⭐⭐⭐⭐ 良好               |
| ogg 输出     | ✅ 原生支持，无需 ffmpeg         | ❌ 需 ffmpeg 转码           |
| 声音克隆     | ✅ 支持（Instant Cloning）       | ❌ 不支持                   |
| 延迟         | ~600–1200ms                      | ~300–600ms                  |
| 成本         | 中（Starter $5/30K 字）          | 低（中文场景更划算）        |
| **推荐场景** | **声音克隆、中英混合消息**       | **纯中文、低延迟、低成本**  |
