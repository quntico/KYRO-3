import openai, { DEFAULT_MODEL } from './_lib/openai.js';

/**
 * Endpoint: /api/kyro-analyze
 * Description: Analyzes business data (leads, clients, prospects) to provide scoring and insights.
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { data, type = 'leads' } = req.body;

    if (!data || !Array.isArray(data)) {
        return res.status(400).json({ error: 'Valid data array is required' });
    }

    try {
        const response = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                {
                    role: 'system',
                    content: `Eres el analista de negocios de KYRO. Tu tarea es analizar los ${type} proporcionados.
          Genera un análisis que incluya:
          1. Un puntaje (score) de 1 a 100 para cada elemento basado en su potencial.
          2. Identificación de "Prospectos Calientes" (quienes requieren atención inmediata).
          3. Recomendaciones estratégicas específicas para cerrar ventas.
          Devuelve la respuesta en formato JSON estructurado.`
                },
                { role: 'user', content: JSON.stringify(data.slice(0, 20)) } // Limit to first 20 for token efficiency
            ],
            response_format: { type: 'json_object' },
        });

        return res.status(200).json(JSON.parse(response.choices[0].message.content));
    } catch (error) {
        console.error('Error in kyro-analyze:', error);
        return res.status(500).json({ error: 'KYRO failed to analyze data.' });
    }
}
