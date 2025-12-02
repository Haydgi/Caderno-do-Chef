/**
 * Funções utilitárias para respostas HTTP padronizadas
 */

/**
 * Resposta de sucesso
 */
export function success(res, data, message = 'Operação realizada com sucesso', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

/**
 * Resposta de sucesso para criação
 */
export function created(res, data, message = 'Recurso criado com sucesso') {
  return success(res, data, message, 201);
}

/**
 * Resposta de erro
 */
export function error(res, message, statusCode = 400, details = null) {
  const response = {
    success: false,
    message
  };
  
  if (details) {
    response.details = details;
  }
  
  return res.status(statusCode).json(response);
}

/**
 * Resposta de validação falhada
 */
export function validationError(res, errors) {
  return res.status(400).json({
    success: false,
    message: 'Erro de validação',
    errors
  });
}

/**
 * Resposta de não autorizado
 */
export function unauthorized(res, message = 'Não autorizado') {
  return res.status(401).json({
    success: false,
    message
  });
}

/**
 * Resposta de acesso negado
 */
export function forbidden(res, message = 'Acesso negado') {
  return res.status(403).json({
    success: false,
    message
  });
}

/**
 * Resposta de não encontrado
 */
export function notFound(res, resource = 'Recurso') {
  return res.status(404).json({
    success: false,
    message: `${resource} não encontrado`
  });
}

/**
 * Resposta de conflito
 */
export function conflict(res, message) {
  return res.status(409).json({
    success: false,
    message
  });
}

/**
 * Resposta de erro interno
 */
export function serverError(res, message = 'Erro interno do servidor', error = null) {
  const response = {
    success: false,
    message
  };
  
  // Em desenvolvimento, incluir detalhes do erro
  if (process.env.NODE_ENV !== 'production' && error) {
    response.error = error.message;
    response.stack = error.stack;
  }
  
  return res.status(500).json(response);
}

/**
 * Resposta paginada
 */
export function paginated(res, data, pagination) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    }
  });
}
