import jwt from 'jsonwebtoken';
import db from '../database/connection.js';

// Middleware de autenticação por JWT
// Exige header: Authorization: Bearer <token>
export default async function auth(req, res, next) {
  console.log(`🔒 Auth middleware - ${req.method} ${req.path}`);
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) {
      console.log('❌ No authorization header found');
      return res.status(401).json({ mensagem: 'Não autorizado: token ausente.' });
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ mensagem: 'Não autorizado: formato de Authorization inválido.' });
    }

    jwt.verify(token, process.env.SECRET_JWT, async (err, decoded) => {
      if (err) {
        console.log('❌ JWT verification failed:', err.message);
        return res.status(401).json({ mensagem: 'Não autorizado: token inválido ou expirado.' });
      }
      
      console.log('🔐 Token decoded:', { ID_Usuario: decoded.ID_Usuario, email: decoded.email, role: decoded.role });
      
      try {
        // Buscar o papel do usuário no banco de dados
        const [usuarios] = await db.query(
          'SELECT tipo_usuario FROM usuario WHERE ID_Usuario = ?',
          [decoded.ID_Usuario]
        );

        if (usuarios.length === 0) {
          return res.status(401).json({ mensagem: 'Não autorizado: usuário não encontrado.' });
        }

        // Anexa dados do usuário para uso posterior nas rotas
        req.user = {
          ...decoded,
          role: usuarios[0].tipo_usuario
        };
        
        console.log('✅ Auth successful - req.user:', { ID_Usuario: req.user.ID_Usuario, role: req.user.role });
        
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
