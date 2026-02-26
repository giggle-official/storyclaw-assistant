---
name: mira-voice-f5
description: "Mira 的本地语音合成技能（台湾腔甜美女声）。使用 F5-TTS 零样本声音克隆，在本机离线生成语音并通过 Telegram 发送给用户。当用户要求语音回复时使用。"
allowed-tools: Bash(bash:*) Bash(python3:*) Bash(ffmpeg:*) Bash(curl:*) Read Write
---

# Mira Voice — 本地语音合成

F5-TTS 离线生成，直接通过 Telegram Bot API 发送。

## 触发条件

用户明确说"用语音"、"发语音给我"、"说出来"时调用。日常文字回复不使用此技能。

## ⚠️ 重要：禁止使用内置 TTS 工具

内置 TTS 工具（会返回 `[[audio_as_voice]]` 的那个工具）已损坏，生成的是空文件。
**必须**通过以下 bash 流程发送语音，不能走内置 TTS。

## 完整流程（三步，必须按顺序执行）

### Step 1：生成语音

```bash
PYTHONHASHSEED=random \
~/.openclaw/workspace/skills/mira-voice-f5/.venv/bin/python \
  ~/.openclaw/workspace/skills/mira-voice-f5/scripts/mira_tts.py \
  "要说的内容" \
  --no-play \
  --output /tmp/mira_reply.wav
```

生成约需 20-30 秒，请等待完成。

### Step 2：转换格式

```bash
ffmpeg -y -i /tmp/mira_reply.wav -c:a libopus -b:a 64k /tmp/mira_reply.ogg 2>/dev/null
```

### Step 3：发送到 Telegram

```bash
curl -s \
  -F "chat_id=1981782453" \
  -F "voice=@/tmp/mira_reply.ogg" \
  "https://api.telegram.org/bot8750482121:AAEHLkNQc413zPtbFq5xVcj7Qr4D6Vcp84I/sendVoice"
```

发送成功后，文字回复写 `NO_REPLY`。

---

## 语音内容规则

- 每句 ≤15 个汉字
- 不用括号、列表、换行符
- 多句自然断开

示例：

- ✅ "你来了。"
- ✅ "我刚才在想你说的那件事。"
- ❌ "我刚才在想，你说的那件事其实可以从另一个角度来看，可能结果会完全不一样。"（太长）
