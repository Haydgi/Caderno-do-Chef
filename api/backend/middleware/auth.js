import jwt from 'jsonwebtoken';
import db from '../database/connection.js';

// Middleware de autenticação por JWT
// Exige header: Authorization: Bearer <token>
export default async function auth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) {
      return res.status(401).json({ mensagem: 'Não autorizado: token ausente.' });
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ mensagem: 'Não autorizado: formato de Authorization inválido.' });
    }

    jwt.verify(token, process.env.SECRET_JWT, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ mensagem: 'Não autorizado: token inválido ou expirado.' });
      }
      
      try {
        // Buscar o papel do usuário no banco de dados
        const [usuarios] = await db.query(
          'SELECT Tipo_Usuario FROM usuario WHERE ID_Usuario = ?',
          [decoded.ID_Usuario]
        );

        if (usuarios.length === 0) {
          return res.status(401).json({ mensagem: 'Não autorizado: usuário não encontrado.' });
        }

        // Anexa dados do usuário para uso posterior nas rotas
        req.user = {
          ...decoded,
          role: usuarios[0].Tipo_Usuario
        };
        
        return next();
      } catch (dbError) {
        console.error('Erro ao buscar papel do usuário:', dbError);
        return res.status(500).json({ mensagem: 'Erro ao validar permissões.' });
      }
    });
  } catch (e) {
    return res.status(401).json({ mensagem: 'Não autorizado.' });
  }
}
