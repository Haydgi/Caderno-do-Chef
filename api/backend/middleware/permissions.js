// Middlewares de verificação de permissões baseados em papel/role

// Apenas Proprietário
export function apenasProprietario(req, res, next) {
  if (req.user.role !== 'Proprietário') {
    return res.status(403).json({ 
      mensagem: "Acesso negado. Apenas proprietários podem acessar este recurso." 
    });
  }
  next();
}

// Proprietário ou Gerente
export function proprietarioOuGerente(req, res, next) {
  if (req.user.role !== 'Proprietário' && req.user.role !== 'Gerente') {
    return res.status(403).json({ 
      mensagem: "Acesso negado. Apenas proprietários e gerentes podem acessar este recurso." 
    });
  }
  next();
}

// Qualquer usuário autenticado (Proprietário, Gerente ou Funcionário)
// Este middleware é apenas uma passagem, pois o auth.js já valida a autenticação
export function qualquerUsuario(req, res, next) {
  // Todos os papéis podem acessar
  next();
}
