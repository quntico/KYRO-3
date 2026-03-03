import openai, { DEFAULT_MODEL } from './_lib/openai.js';

/**
 * Endpoint: /api/kyro-decide
 * Description: Recommends specific business actions based on goals and context.
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { context, goal } = req.body;

    if (!context || !goal) {
        return res.status(400).json({ error: 'Context and goal are required' });
    }

    try {
        const response = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                {
                    role: 'system',
                    content: `Eres el motor de decisiones de KYRO. Basándote en el contexto del negocio y los objetivos del usuario, debes proponer la mejor acción a seguir.
          Tu salida debe ser una decisión estructurada con:
          - Acción sugerida
          - Justificación técnica/comercial
          - Riesgos potenciales
          - Siguiente paso inmediato.`
                },
                {
                    role: 'user',
                    content: `Contexto: ${JSON.stringify(context)}\nObjetivo: ${goal}`
                }
            ],
        });

        return res.status(200).json({
            decision: response.choices[0].message.content,
            usage: response.usage,
        });
    } catch (error) {
        console.error('Error in kyro-decide:', error);
        return res.status(500).json({ error: 'KYRO Decision Engine encounter an error.' });
    }
}
