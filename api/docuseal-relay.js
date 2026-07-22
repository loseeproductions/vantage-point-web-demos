export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const response = await fetch('https://n8n.timloseewinstonai.xyz/webhook/docuseal-completed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    });
    const text = await response.text();
    return res.status(200).json({ forwarded: true, status: response.status });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
