import OpenAI from 'openai';

/**
 * OpenAI Client Configuration
 * This utility centralizes OpenAI communication and ensures consistent configuration.
 */

if (!process.env.OPENAI_API_KEY) {
    console.warn('WARNING: OPENAI_API_KEY is not defined in environment variables.');
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

export default openai;
