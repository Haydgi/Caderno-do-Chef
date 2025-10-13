import jwt from 'jsonwebtoken';

// Middleware de autenticação por JWT
// Exige header: Authorization: Bearer <token>
export default function auth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) {
      return res.status(401).json({ mensagem: 'Não autorizado: token ausente.' });
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ mensagem: 'Não autorizado: formato de Authorization inválido.' });
    }

    jwt.verify(token, process.env.SECRET_JWT, (err, decoded) => {
      if (err) {
        return res.status(401).json({ mensagem: 'Não autorizado: token inválido ou expirado.' });
      }
      // anexa dados do usuário para uso posterior nas rotas
      req.user = decoded;
      return next();
    });
  } catch (e) {
    return res.status(401).json({ mensagem: 'Não autorizado.' });
  }
}
