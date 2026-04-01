import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { ProviderError } from '../errors.js';

export class ElevenLabsProvider {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.ELEVENLABS_API_KEY;
        this.model_id = 'eleven_multilingual_v2';
        this.voice_settings = {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.4,
            use_speaker_boost: true
        };

    }

    monolingual_v1() {
        this.model_id = 'eleven_monolingual_v1';
        return this;
    }

    multilingual_v1() {
        this.model_id = 'eleven_multilingual_v1';
        return this;
    }

    multilingual_v2() {
        this.model_id = 'eleven_multilingual_v2';
        return this;
    }

    v3() {
        this.model_id = 'eleven_v3';
        this.voice_settings = {
            stability: this.voice_settings.stability,
        };

        return this;
    }

    _getFetchParams(voiceId, text, format) {
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
        const headers = {
            accept: 'audio/' + (format === 'mp3' ? 'mpeg' : format),
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
        };
        const body = JSON.stringify({
            text,
            model_id: this.model_id,
            voice_settings: this.voice_settings,
        });

        return { url, headers, body };
    }

    async save(voiceId, text, format, filePath, fileName) {
        try {
            if (!this.apiKey) {
                throw new ProviderError('ElevenLabs API key is required', 'elevenlabs');
            }
            if (!voiceId) {
                throw new ProviderError('Voice ID is required', 'elevenlabs');
            }
            if (!text) {
                throw new ProviderError('Text is required', 'elevenlabs');
            }
            if (!filePath || !fileName) {
                throw new ProviderError('File path and name are required', 'elevenlabs');
            }

            const { url, headers, body } = this._getFetchParams(voiceId, text, format);
            const response = await fetch(url, { method: 'POST', headers, body });

            if (!response.ok) {
                const errorBody = await response.text().catch(() => '');
                throw new ProviderError(
                    'Failed to save audio from ElevenLabs API',
                    'elevenlabs',
                    {
                        status: response.status,
                        statusText: response.statusText,
                        data: errorBody,
                    }
                );
            }

            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath, { recursive: true });
            }

            const fullPath = path.join(filePath, fileName);
            const writer = fs.createWriteStream(fullPath);

            try {
                await pipeline(Readable.fromWeb(response.body), writer);
                return fullPath;
            } catch (err) {
                // Clean up partial file on failure
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
                throw new ProviderError(
                    'Failed to write audio file',
                    'elevenlabs',
                    { path: fullPath, error: err.message }
                );
            }
        } catch (error) {
            if (error instanceof ProviderError) {
                throw error;
            }

            throw new ProviderError(
                'An unexpected error occurred while saving audio',
                'elevenlabs',
                { originalError: error.message }
            );
        }
    }
}
