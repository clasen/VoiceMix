# VoiceMix

VoiceMix is a flexible text-to-speech library that allows you to generate speech from text using different voices, languages, and customization options.

## Installation

```bash
npm install voicemix dotenv
```

> **AI Skill**: You can also add VoiceMix as a skill for AI agentic development:
> ```bash
> npx skills add https://github.com/clasen/VoiceMix --skill voicemix
> ```

### Environment Setup

Create a `.env` file in your project root with your API keys:

```plaintext
ELEVENLABS_API_KEY="6e04xxxxxxxxxxxxxxxxxxxxxxxxa9da"
RESEMBLE_API_KEY="9YWxxxxxxxxxxxxxxxxxmgtt"
CARTESIA_API_KEY="sk_car_xxxxxxxxxxxxxxxxxxxxjr"
TYPESAFE_API_KEY="your-typesafe-key" # only for autoMood()
```

## Usage

### Basic Example

```javascript
import { VoiceMix } from 'voicemix';
import dotenv from 'dotenv';
dotenv.config();

const voiceMix = new VoiceMix();

voiceMix
    .voice('EbhcCfMvNsbvjN6OhjpJ')
    .say('Hello, world!')
    .save();
```

### Using ElevenLabs v4 Model

```javascript
const voiceMix = new VoiceMix();

voiceMix
    .v4() // Use the latest ElevenLabs v4 model
    .voice('EbhcCfMvNsbvjN6OhjpJ')
    .say('Hello! This is using the ElevenLabs v4 model.')
    .save();
```

The v4 model is the latest and most advanced model from ElevenLabs. It only uses the stability and similarity voice settings; style, speed and SSML are not supported.

### Automatic Mood Tags (ElevenLabs v3 / v4)

```javascript
const voiceMix = new VoiceMix();

voiceMix
    .v3() // also v4() or v4_turbo()
    .autoMood() // reads TYPESAFE_API_KEY, or pass the key: autoMood(apiKey)
    .voice('EbhcCfMvNsbvjN6OhjpJ')
    .say('Oh great, another Monday. Just what I needed.')
    .save(); // sends "[sarcastic] Oh great, another Monday. Just what I needed."
```

`autoMood()` asks [TypeSafe Jev](https://docs.typesafe.ai) to pick one audio tag for each line, or none when the line is neutral. Tags: `[whispers]`, `[quietly]`, `[softly]`, `[nervous]`, `[hesitant]`, `[confused]`, `[thoughtful]`, `[serious]`, `[sarcastic]`, `[mischievously]`, `[annoyed]`, `[excited]`, `[crying]`, `[laughs]`, `[giggle]`, `[soft chuckle]`, `[nervous laugh]`, `[trying not to laugh]`, `[sighs]`, `[exhales]`, `[clears throat]`, `[swallows]`, `[gulps]`, `[yawning]`, `[pause]`, `[long pause]`, `[stammering]`, `[mumbling]`, `[breathless]`, `[sleepy]`, `[tired]`. It has no effect on other models or providers.

### Advanced Usage

#### Using Resemble AI

```javascript
const voiceMix = new VoiceMix();

voiceMix
    .useResemble()  // https://www.resemble.ai/
    .prompt('Friendly and conversational tone') // Set voice prompt/style
    .voice('ba875a0a') // Select specific voice
    .lang('en-US') // Set language
    .say('Your text here')
    .save();
```

#### Using Cartesia

```javascript
const voiceMix = new VoiceMix();

voiceMix
    .useCartesia()  // https://cartesia.ai/
    .voice('your-cartesia-voice-id') // Select specific voice from your Cartesia account
    .say('Your text here')
    .save();
```

**Note:** You need to use a valid voice ID from your Cartesia account. You can find available voices in your Cartesia dashboard.

### Batch Processing

You can process multiple lines of text using a JSON configuration:

```javascript
import { VoiceMix } from 'voicemix';
import fs from 'fs';

// Read script from JSON file
const script = JSON.parse(fs.readFileSync('./lines.json', 'utf8'));
const voiceMix = new VoiceMix();

// Process each line
for (const entry of script) {
    voiceMix
        .prompt(entry.prompt || 'Friendly and conversational tone')
        .voice(entry.voiceId)
        .say(entry.english)
        .save();
}
```

Example `lines.json`:
```json
[
    {
        "prompt": "Friendly and conversational tone",
        "english": "Hello, how are you today?",
        "voiceId": "EbhcCfMvNsbvjN6OhjpJ"
    }
]
```

## Features

- Multiple voice support
- Language selection
- Voice prompts for style control (Resemble AI)
- Automatic mood tags for ElevenLabs v3/v4 via TypeSafe Jev (`autoMood()`)
- Support for multiple TTS providers:
  - ElevenLabs (including v4 model)
  - Resemble AI
  - Cartesia
- Support for different ElevenLabs models:
  - `monolingual_v1()` - Original English model
  - `multilingual_v1()` - First multilingual model
  - `multilingual_v2()` - Improved multilingual model (default)
  - `v3()` - Expressive v3 model
  - `v4()` - Latest and most advanced model
  - `v4_turbo()` - Low-latency variant of v4
- Simple chainable API

## License

MIT
