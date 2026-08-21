export default async function handler(req, res) {
  const backend = (process.env.BACKEND_URL || '').replace(/\/$/, '');
  if (!backend) {
    return res.status(500).json({ message: 'BACKEND_URL is not configured in Vercel.' });
  }

  const target = `${backend}${req.url}`;
  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;

  let body;
  if (!['GET', 'HEAD'].includes(req.method)) {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
  }

  try {
    const response = await fetch(target, {
      method: req.method,
      headers,
      body,
      redirect: 'manual',
    });

    res.status(response.status);
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);
    const text = await response.text();
    return res.send(text);
  } catch (error) {
    console.error(error);
    return res.status(502).json({ message: 'Could not reach the Study Forge backend.' });
  }
}
