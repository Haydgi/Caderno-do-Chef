/**
 * Utilitários de validação centralizados
 */

/**
 * Valida formato de email
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Valida formato de telefone brasileiro
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  // Aceita formatos: (11) 98888-8888, 11988888888, etc.
  return cleaned.length >= 10 && cleaned.length <= 11;
}

/**
 * Valida se uma string está dentro do tamanho permitido
 */
export function isValidLength(str, min = 0, max = Infinity) {
  if (typeof str !== 'string') return false;
  const len = str.trim().length;
  return len >= min && len <= max;
}

/**
 * Valida se um número é positivo
 */
export function isPositiveNumber(value) {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

/**
 * Valida se um número é não-negativo
 */
export function isNonNegativeNumber(value) {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
}

/**
 * Valida papel/role de usuário
 */
export function isValidRole(role) {
  const validRoles = ['Proprietário', 'Gerente', 'Funcionário'];
  return validRoles.includes(role);
}

/**
 * Sanitiza string removendo caracteres perigosos para SQL/XSS
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.trim()
    .replace(/[<>]/g, '') // Remove < e >
    .slice(0, 1000); // Limita tamanho
}

/**
 * Valida ID numérico
 */
export function isValidId(id) {
  const num = Number(id);
  return Number.isInteger(num) && num > 0;
}

/**
 * Valida formato de data ISO
 */
export function isValidDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Valida se valor está em um enum
 */
export function isInEnum(value, enumArray) {
  return enumArray.includes(value);
}

/**
 * Valida URL
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida extensões de arquivo permitidas
 */
export function hasValidExtension(filename, allowedExtensions = []) {
  if (!filename || typeof filename !== 'string') return false;
  const ext = filename.split('.').pop()?.toLowerCase();
  return allowedExtensions.includes(ext);
}

/**
 * Validador de objeto com schema
 * Exemplo: validate({ name: 'required|string|min:3|max:100' }, { name: 'João' })
 */
export function validate(schema, data) {
  const errors = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const ruleList = rules.split('|');

    for (const rule of ruleList) {
      const [ruleName, ruleValue] = rule.split(':');

      switch (ruleName) {
        case 'required':
          if (value === undefined || value === null || value === '') {
            errors[field] = `${field} é obrigatório`;
          }
          break;

        case 'string':
          if (value !== undefined && typeof value !== 'string') {
            errors[field] = `${field} deve ser uma string`;
          }
          break;

        case 'number':
          if (value !== undefined && isNaN(Number(value))) {
            errors[field] = `${field} deve ser um número`;
          }
          break;

        case 'email':
          if (value && !isValidEmail(value)) {
            errors[field] = `${field} deve ser um email válido`;
          }
          break;

        case 'min':
          if (typeof value === 'string' && value.length < parseInt(ruleValue)) {
            errors[field] = `${field} deve ter no mínimo ${ruleValue} caracteres`;
          } else if (typeof value === 'number' && value < parseFloat(ruleValue)) {
            errors[field] = `${field} deve ser no mínimo ${ruleValue}`;
          }
          break;

        case 'max':
          if (typeof value === 'string' && value.length > parseInt(ruleValue)) {
            errors[field] = `${field} deve ter no máximo ${ruleValue} caracteres`;
          } else if (typeof value === 'number' && value > parseFloat(ruleValue)) {
            errors[field] = `${field} deve ser no máximo ${ruleValue}`;
          }
          break;

        case 'positive':
          if (value !== undefined && !isPositiveNumber(value)) {
            errors[field] = `${field} deve ser um número positivo`;
          }
          break;

        case 'enum':
          const enumValues = ruleValue.split(',');
          if (value && !isInEnum(value, enumValues)) {
            errors[field] = `${field} deve ser um dos valores: ${enumValues.join(', ')}`;
          }
          break;
      }

      // Se já há erro para este campo, não precisa continuar validando
      if (errors[field]) break;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
