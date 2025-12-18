import axios from 'axios';
import fs from 'fs';
import path from 'path';
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

        if (!this.apiKey) {
            throw new ProviderError('ElevenLabs API key is required', 'elevenlabs');
        }
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
        return this;
    }    

    _getRequestOptions(voiceId, text, format) {
        return {
            method: "post",
            url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            headers: {
                accept: "audio/" + (format === "mp3" ? "mpeg" : format),
                "xi-api-key": this.apiKey,
                "Content-Type": "application/json",
            },
            data: {
                text,
                model_id: this.model_id,
                voice_settings: this.voice_settings,
            },
            responseType: "stream",
        };
    }

    async save(voiceId, text, format, filePath, fileName) {
        try {
            if (!voiceId) {
                throw new ProviderError('Voice ID is required', 'elevenlabs');
            }
            if (!text) {
                throw new ProviderError('Text is required', 'elevenlabs');
            }
            if (!filePath || !fileName) {
                throw new ProviderError('File path and name are required', 'elevenlabs');
            }

            const response = await axios({
                ...this._getRequestOptions(voiceId, text, format),
                responseType: 'stream'
            });

            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath, { recursive: true });
            }

            const fullPath = path.join(filePath, fileName);
            const writer = fs.createWriteStream(fullPath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(fullPath));
                writer.on('error', (err) => {
                    reject(new ProviderError(
                        'Failed to write audio file',
                        'elevenlabs',
                        { path: fullPath, error: err.message }
                    ));
                });
            });
        } catch (error) {
            if (error instanceof ProviderError) {
                throw error;
            }
            
            if (axios.isAxiosError(error)) {
                const details = {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data
                };
                
                throw new ProviderError(
                    'Failed to save audio from ElevenLabs API',
                    'elevenlabs',
                    details
                );
            }
            
            throw new ProviderError(
                'An unexpected error occurred while saving audio',
                'elevenlabs',
                { originalError: error.message }
            );
        }
    }
} 