---
name: voicemix
description: Instructions for generating speech audio files using the VoiceMix Node.js library
version: 1.3.2
tags: [nodejs, tts, text-to-speech, elevenlabs, resemble-ai, cartesia, audio]
---

# VoiceMix Skill

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Core API](#core-api)
- [Common Tasks](#common-tasks)
- [Agent Usage Rules](#agent-usage-rules)
- [Troubleshooting](#troubleshooting)
- [References](#references)

## Overview

VoiceMix is a chainable text-to-speech Node.js library that generates audio files (mp3/wav) from text using multiple TTS provider APIs.

**Use this skill when:**

- A task requires generating speech audio from text
- Integrating text-to-speech into a Node.js project
- Working with ElevenLabs, Resemble AI, or Cartesia APIs
- Batch-processing scripts of dialogue lines into audio files

**Do NOT use this skill when:**

- The task requires real-time streaming audio playback (VoiceMix writes to files)
- The target environment is browser-only (VoiceMix uses Node.js `fs`)
- Speech-to-text (transcription) is needed — this is text-**to**-speech only

## Installation

```bash
npm install voicemix dotenv
```

- Requires Node.js with ESM support (`"type": "module"` in `package.json`).
- `dotenv` is optional but recommended for loading API keys from `.env`.

## Environment Setup

Create a `.env` file with the relevant provider key(s):

```plaintext
ELEVENLABS_API_KEY="your-elevenlabs-key"
RESEMBLE_API_KEY="your-resemble-key"
CARTESIA_API_KEY="your-cartesia-key"
```

Only the key for the provider being used is required. ElevenLabs is the default provider.

## Core API

VoiceMix uses a **chainable fluent API**. Every method (except `save()`) returns `this`.

### Constructor

```javascript
import { VoiceMix } from 'voicemix';

const vm = new VoiceMix();          // defaults: ElevenLabs, multilingual_v2, mp3, cwd
const vm = new VoiceMix({ filePath: './audio', format: 'wav' }); // with options
```

Constructor options (all optional):

| Option       | Default    | Description                        |
|--------------|------------|------------------------------------|
| `filePath`   | `'./'`     | Output directory for audio files   |
| `format`     | `'mp3'`    | Output format (`mp3` or `wav`)     |
| `filePrefix` | `''`       | Prefix for generated filenames     |
| `drymode`    | `false`    | Skip API calls, return filename    |
| `apiKey`     | env var    | Override provider API key          |

### Provider Selection

```javascript
vm.useElevenLabs(apiKey?)  // default — reads ELEVENLABS_API_KEY
vm.useResemble(apiKey?)    // reads RESEMBLE_API_KEY
vm.useCartesia(apiKey?)    // reads CARTESIA_API_KEY
```

### ElevenLabs Model Selection

```javascript
vm.monolingual_v1()    // English only
vm.multilingual_v1()   // First multilingual
vm.multilingual_v2()   // Default — improved multilingual
vm.v3()                // Latest, most advanced
```

### Speech Generation Chain

```javascript
vm.voice('voiceId')    // required — set provider voice ID
  .say('Hello world')  // required — set text, auto-generates hashed filename
  .save();             // returns Promise<string> resolving to the full file path
```

### Additional Methods

```javascript
vm.lang('en-US')                   // set language (used by Resemble for SSML)
vm.prompt('Friendly tone')         // set voice style prompt (Resemble only)
vm.path('./output')                // change output directory
vm.prefix('ch1_')                  // set filename prefix
vm.file('custom-name')             // override auto-generated filename
vm.id('voiceId')                   // alias for .voice()
```

### Resemble-Specific

```javascript
vm.setSampleRate(48000)            // default 48000
vm.setPrecision('PCM_16')          // MULAW | PCM_16 | PCM_24 | PCM_32
vm.setOutputFormat('mp3')          // mp3 | wav
```

## Common Tasks

### Generate a Single Audio File (ElevenLabs)

```javascript
import { VoiceMix } from 'voicemix';
import dotenv from 'dotenv';
dotenv.config();

const vm = new VoiceMix();

await vm
  .voice('EbhcCfMvNsbvjN6OhjpJ')
  .say('Hello, world!')
  .save();
```

### Generate with ElevenLabs v3

```javascript
const vm = new VoiceMix();

await vm
  .v3()
  .voice('dxvGlXoa4TLMyfYR6uC9')
  .say('This uses the latest ElevenLabs model.')
  .save();
```

### Generate with Resemble AI (with Prompt Styling)

```javascript
const vm = new VoiceMix();

await vm
  .useResemble()
  .prompt('Friendly and conversational tone')
  .voice('ba875a0a')
  .lang('en-US')
  .say('Your text here')
  .save();
```

### Generate with Cartesia

```javascript
const vm = new VoiceMix();

await vm
  .useCartesia()
  .voice('6ccbfb76-1fc6-48f7-b71d-91ac6298247b')
  .say('Your text here')
  .save();
```

### Batch Process a Script from JSON

```javascript
import { VoiceMix } from 'voicemix';
import fs from 'fs';

const script = JSON.parse(fs.readFileSync('./lines.json', 'utf8'));
const vm = new VoiceMix({ filePath: './audio' });

for (const entry of script) {
  await vm
    .prompt(entry.prompt || 'Friendly and conversational tone')
    .voice(entry.voiceId)
    .say(entry.english)
    .save();
}
```

Expected `lines.json` format:

```json
[
  {
    "prompt": "Friendly and conversational tone",
    "english": "Hello, how are you today?",
    "voiceId": "EbhcCfMvNsbvjN6OhjpJ"
  }
]
```

### Save to a Custom Path and Filename

```javascript
const vm = new VoiceMix();

await vm
  .voice('EbhcCfMvNsbvjN6OhjpJ')
  .path('./output/chapter1')
  .prefix('line_')
  .say('Opening narration here.')
  .save();
```

## Agent Usage Rules

1. **Always load environment variables** — call `dotenv.config()` (or equivalent) before constructing `VoiceMix` so provider API keys are available via `process.env`.
2. **Check if `voicemix` is already installed** before running `npm install`.
3. **Ensure `"type": "module"`** exists in the project's `package.json` — VoiceMix is ESM-only.
4. **Never hardcode API keys** — use environment variables or pass keys via constructor/provider methods.
5. **Always `await` the `.save()` call** — it returns a Promise. Without `await`, files may not be written before the process exits.
6. **Voice ID is required** — calling `.save()` without `.voice()` throws a `ValidationError`.
7. **Use the correct voice IDs for the selected provider** — ElevenLabs, Resemble, and Cartesia voice IDs are not interchangeable.
8. **Filenames are auto-hashed** — `.say(text)` generates a deterministic filename from the text + config. The same input produces the same filename (useful for caching). Use `.file('name')` only when an explicit filename is needed.
9. **Provider methods are provider-scoped** — `.prompt()` only works with Resemble; `.v3()` only works with ElevenLabs. Calling them on the wrong provider is a no-op (no error thrown).
10. **Batch processing uses an internal queue** (batch size 3) — multiple `.save()` calls are automatically batched and processed concurrently.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `ProviderError: ElevenLabs API key is required` | Missing env var | Set `ELEVENLABS_API_KEY` in `.env` and call `dotenv.config()` |
| `ProviderError: Cartesia API key is required` | Missing env var | Set `CARTESIA_API_KEY` in `.env` |
| `ValidationError: Voice ID is required` | `.voice()` not called | Chain `.voice('id')` before `.save()` |
| 401 / 403 from provider API | Invalid or expired key | Verify the API key in provider dashboard |
| Files not appearing | `save()` not awaited | Add `await` before `.save()` |
| Wrong provider voice ID | Mixing IDs across providers | Use voice IDs from the active provider's dashboard |

## References

- [npm: voicemix](https://www.npmjs.com/package/voicemix)
- [GitHub: clasen/VoiceMix](https://github.com/clasen/VoiceMix)
- [ElevenLabs API docs](https://elevenlabs.io/docs)
- [Resemble AI docs](https://docs.resemble.ai/)
- [Cartesia docs](https://docs.cartesia.ai/)
