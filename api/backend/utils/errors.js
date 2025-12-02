/**
 * Classes de erro customizadas para o sistema
 */

/**
 * Erro base do sistema
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erro de validação (400)
 */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Erro de autenticação (401)
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Erro de autorização/permissão (403)
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Erro de recurso não encontrado (404)
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} não encontrado`, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Erro de conflito (409) - ex: email duplicado
 */
export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Erro de banco de dados (500)
 */
export class DatabaseError extends AppError {
  constructor(message = 'Erro ao acessar banco de dados', details = null) {
    super(message, 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Handler de erro assíncrono para rotas Express
 * Uso: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Middleware de tratamento de erros
 */
export function errorHandler(err, req, res, next) {
  // Log do erro
  console.error('❌ Erro:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Se já foi enviada resposta, delega para o handler padrão
  if (res.headersSent) {
    return next(err);
  }

  // Determina status code
  const statusCode = err.statusCode || 500;

  // Não expor detalhes internos em produção
  const isDev = process.env.NODE_ENV !== 'production';

  // Resposta padronizada
  const response = {
    mensagem: err.isOperational ? err.message : 'Erro interno do servidor',
    status: statusCode
  };

  // Adiciona detalhes extras em desenvolvimento
  if (isDev) {
    response.stack = err.stack;
    if (err.details) response.details = err.details;
  }

  res.status(statusCode).json(response);
}

/**
 * Handler para rotas não encontradas
 */
export function notFoundHandler(req, res, next) {
  const error = new NotFoundError('Endpoint');
  error.details = {
    path: req.path,
    method: req.method
  };
  next(error);
}
