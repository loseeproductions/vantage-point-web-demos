export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    await fetch('http://152.70.137.246:5678/webhook/aba-stripe-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    });
    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
