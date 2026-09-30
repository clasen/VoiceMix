import { ProviderError } from '../errors.js';
import { stripAudioTags } from './elevenlabs.js';

export const MOOD_TAGS = [
    'whispers', 'quietly', 'softly', 'nervous', 'hesitant', 'confused', 'thoughtful',
    'serious', 'sarcastic', 'mischievously', 'annoyed', 'excited', 'crying',
    'laughs', 'giggle', 'soft chuckle', 'nervous laugh', 'trying not to laugh',
    'sighs', 'exhales', 'clears throat', 'swallows', 'gulps', 'yawning',
    'pause', 'long pause',
    'stammering', 'mumbling', 'breathless', 'sleepy', 'tired',
];

const NO_TAG = 'none';

export class TypeSafeProvider {
    constructor(apiKey) {
        this.apiKey = apiKey || process.env.TYPESAFE_API_KEY;
        this.model = 'jev-latest';
    }

    async moodTag(text) {
        if (!this.apiKey) {
            throw new ProviderError('TypeSafe API key is required', 'typesafe');
        }

        const line = stripAudioTags(text);
        if (!line) return null;

        const criteria = { [NO_TAG]: 'Neutral delivery; no tag clearly fits the line' };
        for (const tag of MOOD_TAGS) criteria[tag] = null;

        const response = await fetch('https://api.typesafe.ai/v1/systemone', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                state: line,
                model: this.model,
                questions: {
                    mood: {
                        type: 'choice',
                        instructions: 'Which audio tag best matches how this dialogue line should be performed by a voice actor?',
                        criteria,
                    },
                },
            }),
        });

        if (!response.ok) {
            throw new ProviderError('Failed to choose mood tag from TypeSafe API', 'typesafe', {
                status: response.status,
                statusText: response.statusText,
                data: await response.text().catch(() => ''),
            });
        }

        const { answers } = await response.json();
        const choice = answers?.mood?.choice;
        if (choice === NO_TAG) return null;
        if (!MOOD_TAGS.includes(choice)) {
            throw new ProviderError('TypeSafe returned an unknown mood tag', 'typesafe', { choice });
        }

        return `[${choice}]`;
    }
}
