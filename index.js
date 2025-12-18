import fs from 'fs';
import path from 'path';
import hashFactory from 'hash-factory';
import { ElevenLabsProvider } from './providers/elevenlabs.js';
import { ResembleProvider } from './providers/resemble.js';
import { CartesiaProvider } from './providers/cartesia.js';
import { ValidationError, formatError } from './errors.js';

const hash = hashFactory({ words: true, alpha: true });
const hashNow = hashFactory({ words: true, alpha: true, now: true });

export class VoiceMix {
    voices = {};

    constructor(opts = {}) {
        this.text = 'string';
        this.ttsId = null;
        this.format = 'mp3';
        this.filePath = './';
        this.fileOutput = 'speech';
        this.filePrefix = '';
        this.randPosfix = false;
        this.drymode = false;
        this.promptText = null;
        this.xmlLang = 'en-us';

        this.temperature = "0.8";
        this.exaggeration = "0";
        // this.prosodyRate = "100%";
        // this.prosodyPitch = "medium";

        this.requestsQueue = []; // Cola para las solicitudes pendientes
        this.isProcessing = false; // Estado para controlar si ya se está procesando un lote
        this.batchSize = 3; // Tamaño del lote    

        Object.assign(this, opts);

        // Inicializar el proveedor por defecto (ElevenLabs)
        this.provider = new ElevenLabsProvider(opts.apiKey);
        this.providerType = 'elevenlabs';

        // Asegurar que filePath sea una ruta absoluta
        this.filePath = path.resolve(this.filePath);
    }

    useElevenLabs(apiKey) {
        this.provider = new ElevenLabsProvider(apiKey);
        this.providerType = 'elevenlabs';
        return this;
    }

    useResemble(apiKey) {
        this.provider = new ResembleProvider(apiKey);
        this.providerType = 'resemble';
        return this;
    }

    useCartesia(apiKey) {
        this.provider = new CartesiaProvider(apiKey);
        this.providerType = 'cartesia';
        return this;
    }

    monolingual_v1() {
        if (this.providerType === 'elevenlabs') {
            this.provider.monolingual_v1();
        }
        return this;
    }

    multilingual_v1() {
        if (this.providerType === 'elevenlabs') {
            this.provider.multilingual_v1();
        }
        return this;
    }

    multilingual_v2() {
        if (this.providerType === 'elevenlabs') {
            this.provider.multilingual_v2();
        }
        return this;
    }

    v3() {
        if (this.providerType === 'elevenlabs') {
            this.provider.v3();
        }
        return this;
    }

    setSampleRate(rate) {
        if (this.providerType === 'resemble') {
            this.provider.setSampleRate(rate);
        }
        return this;
    }

    setPrecision(precision) {
        if (this.providerType === 'resemble') {
            this.provider.setPrecision(precision);
        }
        return this;
    }

    setOutputFormat(format) {
        if (this.providerType === 'resemble') {
            this.provider.setOutputFormat(format);
        }
        return this;
    }

    id(id) {
        this.ttsId = id;
        return this;
    }

    actor(key) {
        if (!this.voices[key]) return this;
        this.ttsId = this.voices[key];
        return this;
    }

    path(v) {
        this.filePath = path.resolve(v);
        return this;
    }

    prefix(v) {
        this.filePrefix = v;
        return this;
    }

    voice(id) {
        this.ttsId = id;
        return this;
    }

    exists() {
        return fs.existsSync(this.fullPath());
    }

    fullPath() {
        return path.join(this.filePath, this.fileName());
    }

    fileName() {
        return this.fileOutput + "." + this.format;
    }

    _filename(text) {
        text += " " + this.promptText + " " + this.xmlLang + " " + this.ttsId;
        text += " " + this.providerType;
        const filename = this.randPosfix ? hashNow(text) : hash(text);
        return this.filePrefix + filename;
    }

    say(text) {
        this.text = text;
        // Eliminar contenido entre corchetes para el nombre del archivo
        const textForFilename = text.replace(/\[.*?\]/g, '').trim();
        return this.file(this._filename(textForFilename));
    }

    file(fileName) {
        this.fileOutput = fileName;
        return this;
    }

    save() {
        if (this.drymode) return Promise.resolve(this.fileOutput);

        const fileName = this.fileOutput + "." + this.format;

        // Crear una instantánea de todas las variables relevantes
        const requestSnapshot = {
            fileName,
            text: this.text,
            ttsId: this.ttsId,
            format: this.format,
            filePath: this.filePath,
            promptText: this.promptText,
            xmlLang: this.xmlLang,
            shouldAddBreakTags: this.shouldAddBreakTags,
            temperature: this.temperature,
            exaggeration: this.exaggeration,
            prosodyRate: this.prosodyRate,
            prosodyPitch: this.prosodyPitch
        };

        return new Promise((resolve, reject) => {
            this.requestsQueue.push({
                ...requestSnapshot,
                resolve,
                reject
            });

            this._processBatch();
        });
    }

    _processBatch() {
        if (this.isProcessing) return;
        if (this.requestsQueue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const batch = this.requestsQueue.splice(0, this.batchSize);

        Promise.all(batch.map(request =>
            this._sendRequest(request)
                .then(fileName => request.resolve(fileName))
                .catch(error => request.reject(error))
        )).then(() => {
            this.isProcessing = false;
            this._processBatch();
        });
    }

    async _sendRequest(request) {
        if (this.drymode) return Promise.resolve(request.fileName);

        try {
            if (!request.ttsId) {
                throw new ValidationError('Voice ID is required', 'ttsId');
            }

            const text = this.addBreakTags(request.text, {
                promptText: request.promptText,
                xmlLang: request.xmlLang,
                temperature: request.temperature,
                exaggeration: request.exaggeration,
                prosodyRate: request.prosodyRate,
                prosodyPitch: request.prosodyPitch
            });

            return await this.provider.save(
                request.ttsId,
                text,
                request.format,
                request.filePath,
                request.fileName
            );

        } catch (error) {
            const formattedError = formatError(error);
            console.error(formattedError);
            throw error;
        }
    }


    lang(lang) {
        this.xmlLang = lang;
        return this;
    }

    addBreakTags(text, options = {}) {

        if (this.providerType !== 'resemble') return text;

        // Construir atributos de la etiqueta speak
        const speakAttributes = [];

        if (options.promptText) {
            speakAttributes.push(`prompt="${options.promptText}"`);
            // speakAttributes.push(`xml:lang="en-us"`);
            if (options.temperature) speakAttributes.push(`temperature="${options.temperature}"`);
            if (options.exaggeration) speakAttributes.push(`exaggeration="${options.exaggeration}"`);
        }

        // Construir atributos de prosodia
        const prosodyAttributes = [];
        if (options.prosodyRate) prosodyAttributes.push(`rate="${options.prosodyRate}"`);
        if (options.prosodyPitch) prosodyAttributes.push(`pitch="${options.prosodyPitch}"`);


        if (prosodyAttributes.length > 0) {
            // Si solo existen atributos de prosodia, solo envolver en prosodia
            text = `<prosody ${prosodyAttributes.join(' ')}>${text}</prosody>`;
        }

        // Solo envolver en etiqueta speak si hay atributos
        if (speakAttributes.length > 0) {
            text = `<speak ${speakAttributes.join(' ')}>${text}</speak>`;
        }

        if (options.xmlLang) {
            text = `<lang xml:lang="${options.xmlLang}">${text}</lang>`;
        }

        return text;
    }

    prompt(promptText) {
        if (this.providerType !== 'resemble') return this;
        this.promptText = promptText;
        return this;
    }
}

