const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'multixita_secret_2026_umb';

function verifyToken(req, res, next) {
  const auth = req.headers.authorization || '';

  const token = auth.startsWith('Bearer ')
    ? auth.slice(7)
    : req.query.token || null;

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    req.usuario = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { verifyToken };
