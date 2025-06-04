# VoiceMix

VoiceMix is a flexible text-to-speech library that allows you to generate speech from text using different voices, languages, and customization options.

## Installation

```bash
npm install voicemix dotenv
```

### Environment Setup

Create a `.env` file in your project root with your API keys:

```plaintext
ELEVENLABS_API_KEY="6e04xxxxxxxxxxxxxxxxxxxxxxxxa9da"
RESEMBLE_API_KEY="9YWxxxxxxxxxxxxxxxxxmgtt"
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

### Advanced Usage

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
- Support for different TTS engines
- Simple chainable API

## License

MIT
