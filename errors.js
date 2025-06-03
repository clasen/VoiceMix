export class VoiceMixError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'VoiceMixError';
        this.details = details;
    }
}

export class ProviderError extends VoiceMixError {
    constructor(message, provider, details = {}) {
        super(message, details);
        this.name = 'ProviderError';
        this.provider = provider;
    }
}

export class ValidationError extends VoiceMixError {
    constructor(message, field, details = {}) {
        super(message, details);
        this.name = 'ValidationError';
        this.field = field;
    }
}

export function formatError(error) {
    if (error instanceof VoiceMixError) {
        let message = `${error.name}: ${error.message}`;
        
        if (error instanceof ProviderError) {
            message += `\nProvider: ${error.provider}`;
        }
        
        if (error instanceof ValidationError) {
            message += `\nField: ${error.field}`;
        }
        
        if (Object.keys(error.details).length > 0) {
            message += '\nDetails:';
            for (const [key, value] of Object.entries(error.details)) {
                message += `\n  ${key}: ${value}`;
            }
        }
        
        return message;
    }
    
    return error.message || 'An unknown error occurred';
} 