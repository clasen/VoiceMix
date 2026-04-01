import fs from 'fs';
import path from 'path';
import { ProviderError, ValidationError } from '../errors.js';

export class ResembleProvider {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.RESEMBLE_API_KEY;
        this.baseUrl = 'https://f.cluster.resemble.ai';
        this.defaultSettings = {
            sample_rate: 48000,
            output_format: 'mp3',
            precision: 'PCM_16'
        };

    }

    _getFetchParams(endpoint, data) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br'
        };
        const body = JSON.stringify(data);

        return { url, headers, body };
    }

    async save(voiceId, text, format, filePath, fileName) {
        try {
            if (!this.apiKey) {
                throw new ProviderError('Resemble API key is required', 'resemble');
            }
            if (!voiceId) {
                throw new ProviderError('Voice ID is required', 'resemble');
            }
            if (!text) {
                throw new ProviderError('Text is required', 'resemble');
            }
            if (!filePath || !fileName) {
                throw new ProviderError('File path and name are required', 'resemble');
            }

            const { url, headers, body } = this._getFetchParams('/synthesize', {
                voice_uuid: voiceId,
                data: text,
                sample_rate: this.defaultSettings.sample_rate,
                output_format: format,
                precision: this.defaultSettings.precision
            });

            const response = await fetch(url, { method: 'POST', headers, body });

            if (!response.ok) {
                let data;
                const raw = await response.text().catch(() => '');
                try {
                    data = raw ? JSON.parse(raw) : raw;
                } catch {
                    data = raw;
                }
                throw new ProviderError(
                    'Failed to save audio from Resemble API',
                    'resemble',
                    {
                        status: response.status,
                        statusText: response.statusText,
                        data,
                    }
                );
            }

            const responseData = await response.json();

            if (!responseData.success) {
                throw new ProviderError(
                    responseData.issues?.join(', ') || 'Synthesis failed',
                    'resemble',
                    responseData
                );
            }

            if (!fs.existsSync(filePath)) {
                fs.mkdirSync(filePath, { recursive: true });
            }

            const fullPath = path.join(filePath, fileName);
            const audioBuffer = Buffer.from(responseData.audio_content, 'base64');

            return new Promise((resolve, reject) => {
                fs.writeFile(fullPath, audioBuffer, (err) => {
                    if (err) {
                        reject(new ProviderError(
                            'Failed to write audio file',
                            'resemble',
                            { path: fullPath, error: err.message }
                        ));
                    } else {
                        resolve(fullPath);
                    }
                });
            });
        } catch (error) {
            if (error instanceof ProviderError) {
                throw error;
            }

            throw new ProviderError(
                'An unexpected error occurred while saving audio',
                'resemble',
                { originalError: error.message }
            );
        }
    }

    // Additional Resemble-specific methods
    setSampleRate(rate) {
        this.defaultSettings.sample_rate = rate;
        return this;
    }

    setPrecision(precision) {
        const validPrecisions = ['MULAW', 'PCM_16', 'PCM_24', 'PCM_32'];
        if (!validPrecisions.includes(precision)) {
            throw new ValidationError(
                `Invalid precision. Must be one of: ${validPrecisions.join(', ')}`,
                'precision'
            );
        }
        this.defaultSettings.precision = precision;
        return this;
    }

    setOutputFormat(format) {
        const validFormats = ['mp3', 'wav'];
        if (!validFormats.includes(format)) {
            throw new ValidationError(
                `Invalid output format. Must be one of: ${validFormats.join(', ')}`,
                'output_format'
            );
        }
        this.defaultSettings.output_format = format;
        return this;
    }
}
