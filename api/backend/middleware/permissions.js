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
  console.log('🔑 Permission check - proprietarioOuGerente:', req.user?.role);
  if (req.user.role !== 'Proprietário' && req.user.role !== 'Gerente') {
    console.log('❌ Access denied - role:', req.user.role);
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

export const Roles = {
  PROPRIETARIO: 'Proprietário',
  GERENTE: 'Gerente',
  FUNCIONARIO: 'Funcionário',
};

export function requireRole(allowed = []) {
  return (req, res, next) => {
    if (!req.user?.role) return res.status(401).json({ mensagem: 'Não autenticado' });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ mensagem: 'Acesso negado' });
    }
    next();
  };
}

export function funcionarioOuAcima(req, res, next) {
  if (!req.user?.role) return res.status(401).json({ mensagem: 'Não autenticado' });
  const ok = [Roles.FUNCIONARIO, Roles.GERENTE, Roles.PROPRIETARIO].includes(req.user.role);
  if (!ok) return res.status(403).json({ mensagem: 'Acesso negado' });
  next();
}

export function gerenteOuAcima(req, res, next) {
  if (!req.user?.role) return res.status(401).json({ mensagem: 'Não autenticado' });
  const ok = [Roles.GERENTE, Roles.PROPRIETARIO].includes(req.user.role);
  if (!ok) return res.status(403).json({ mensagem: 'Acesso negado' });
  next();
}
