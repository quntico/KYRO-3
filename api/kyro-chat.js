import openai, { DEFAULT_MODEL } from './_lib/openai.js';

/**
 * Endpoint: /api/kyro-chat
 * Description: Business-aware chat interface for KYRO.
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, context = '' } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const response = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                {
                    role: 'system',
                    content: `Eres KYRO, un sistema operativo de negocios inteligente y proactivo. 
          Tu objetivo es ayudar al usuario a gestionar su negocio (CRM, ventas, logística y finanzas) de forma eficiente.
          Sé conciso, profesional y siempre ofrece soluciones basadas en datos. 
          Contexto adicional del sistema: ${context}`
                },
                { role: 'user', content: message }
            ],
            temperature: 0.7,
        });

        return res.status(200).json({
            reply: response.choices[0].message.content,
            usage: response.usage,
        });
    } catch (error) {
        console.error('Error in kyro-chat:', error);
        return res.status(500).json({ error: 'Error processing your request with KYRO AI.' });
    }
}
