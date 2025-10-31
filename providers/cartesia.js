import axios from 'axios';
import fs from 'fs';
import path from 'path';
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

        if (!this.apiKey) {
            throw new ProviderError('Cartesia API key is required', 'cartesia');
        }
    }

    _getRequestOptions(voiceId, text, format = 'mp3') {
        // Configure output format based on requested format
        const outputFormat = format === 'mp3' 
            ? { container: 'mp3', encoding: 'mp3', sample_rate: 44100 }
            : { container: 'wav', encoding: 'pcm_f32le', sample_rate: 44100 };

        return {
            method: 'post',
            url: `${this.baseUrl}/tts/bytes`,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Cartesia-Version': '2024-06-10',
                'Content-Type': 'application/json'
            },
            data: {
                model_id: this.defaultSettings.model_id,
                transcript: text,
                voice: {
                    mode: 'id',
                    id: voiceId
                },
                output_format: outputFormat,
                speed: this.defaultSettings.speed,
                generation_config: this.defaultSettings.generation_config
            },
            responseType: 'stream'
        };
    }

    async save(voiceId, text, format, filePath, fileName) {
        try {
            if (!voiceId) {
                throw new ProviderError('Voice ID is required', 'cartesia');
            }
            if (!text) {
                throw new ProviderError('Text is required', 'cartesia');
            }
            if (!filePath || !fileName) {
                throw new ProviderError('File path and name are required', 'cartesia');
            }

            const response = await axios(this._getRequestOptions(voiceId, text, format));

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
                        'cartesia',
                        { path: fullPath, error: err.message }
                    ));
                });
            });
        } catch (error) {
            if (error instanceof ProviderError) {
                throw error;
            }
            
            if (axios.isAxiosError(error)) {
                // Try to read the error message from the response stream
                let errorMessage = 'Failed to save audio from Cartesia API';
                
                if (error.response?.data) {
                    try {
                        // If data is a stream/buffer, try to read it
                        if (typeof error.response.data.read === 'function') {
                            const errorData = error.response.data.read();
                            if (errorData) {
                                errorMessage = errorData.toString('utf-8');
                            }
                        } else if (typeof error.response.data === 'string') {
                            errorMessage = error.response.data;
                        }
                    } catch (readError) {
                        // Keep default error message
                    }
                }
                
                const details = {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    message: errorMessage
                };
                
                throw new ProviderError(
                    errorMessage,
                    'cartesia',
                    details
                );
            }
            
            throw new ProviderError(
                'An unexpected error occurred while saving audio',
                'cartesia',
                { originalError: error.message }
            );
        }
    }
}

