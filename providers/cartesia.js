import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { ProviderError } from '../errors.js';

export class CartesiaProvider {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.CARTESIA_API_KEY;
        this.baseUrl = 'https://api.cartesia.ai';
        this.defaultSettings = {
            model_id: 'sonic-3',
            speed: 'normal',
            generation_config: {
                speed: 1,
                volume: 1
            }
        };

    }

    _getFetchParams(voiceId, text, format = 'mp3') {
        // Configure output format based on requested format
        const outputFormat = format === 'mp3'
            ? { container: 'mp3', encoding: 'mp3', sample_rate: 44100 }
            : { container: 'wav', encoding: 'pcm_f32le', sample_rate: 44100 };

        const url = `${this.baseUrl}/tts/bytes`;
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Cartesia-Version': '2024-06-10',
            'Content-Type': 'application/json'
        };
        const body = JSON.stringify({
            model_id: this.defaultSettings.model_id,
            transcript: text,
            voice: {
                mode: 'id',
                id: voiceId
            },
            output_format: outputFormat,
            speed: this.defaultSettings.speed,
            generation_config: this.defaultSettings.generation_config
        });

        return { url, headers, body };
    }

    async save(voiceId, text, format, filePath, fileName) {
        try {
            if (!this.apiKey) {
                throw new ProviderError('Cartesia API key is required', 'cartesia');
            }
            if (!voiceId) {
                throw new ProviderError('Voice ID is required', 'cartesia');
            }
            if (!text) {
                throw new ProviderError('Text is required', 'cartesia');
            }
            if (!filePath || !fileName) {
                throw new ProviderError('File path and name are required', 'cartesia');
            }

            const { url, headers, body } = this._getFetchParams(voiceId, text, format);
            const response = await fetch(url, { method: 'POST', headers, body });

            if (!response.ok) {
                const errorMessage = (await response.text().catch(() => '')) || 'Failed to save audio from Cartesia API';
                throw new ProviderError(errorMessage, 'cartesia', {
                    status: response.status,
                    statusText: response.statusText,
                    message: errorMessage
                });
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
                    'cartesia',
                    { path: fullPath, error: err.message }
                );
            }
        } catch (error) {
            if (error instanceof ProviderError) {
                throw error;
            }

            throw new ProviderError(
                'An unexpected error occurred while saving audio',
                'cartesia',
                { originalError: error.message }
            );
        }
    }
}
