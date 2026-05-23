export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const systemPrompt = `Du bist ein erfahrener Kontaktlinsen-Berater in einem Optikfachgeschäft. \
Du hilfst Optikern dabei, die optimale Kontaktlinse für ihre Kunden zu empfehlen.

Antworte immer auf Deutsch, präzise und fachkundig. \
Berücksichtige Faktoren wie: Tragekomfort, Augenzustand (trockene Augen, Empfindlichkeit), \
Aktivitäten (Sport, Bildschirmarbeit), Budget, Tragezyklus (täglich, monatlich) und Sehwerte.

Halte Antworten praxisorientiert und konkret (3–5 Sätze). \
Nenne wenn möglich einen konkreten Produktnamen und begründe kurz die Empfehlung.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ki-kontaktlinsen-assistent.vercel.app',
        'X-Title': 'KI Kontaktlinsen-Assistent',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v3-2',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenRouter error:', data);
      return res.status(response.status).json({
        error: data.error?.message || 'Fehler bei der KI-Anfrage',
      });
    }

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) {
      return res.status(500).json({ error: 'Leere Antwort vom Modell' });
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
}
