/**
 * Sistema de logging estruturado
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const levels = {
  ERROR: { value: 0, color: colors.red, icon: '❌' },
  WARN: { value: 1, color: colors.yellow, icon: '⚠️' },
  INFO: { value: 2, color: colors.blue, icon: 'ℹ️' },
  SUCCESS: { value: 3, color: colors.green, icon: '✅' },
  DEBUG: { value: 4, color: colors.cyan, icon: '🔍' }
};

const currentLevel = process.env.LOG_LEVEL || 'INFO';
const currentLevelValue = levels[currentLevel]?.value ?? levels.INFO.value;

function formatMessage(level, message, data) {
  const timestamp = new Date().toISOString();
  const levelInfo = levels[level];
  
  let output = `${levelInfo.icon} [${timestamp}] ${levelInfo.color}${level}${colors.reset}: ${message}`;
  
  if (data && Object.keys(data).length > 0) {
    output += `\n${colors.dim}${JSON.stringify(data, null, 2)}${colors.reset}`;
  }
  
  return output;
}

function log(level, message, data = {}) {
  const levelValue = levels[level]?.value;
  if (levelValue === undefined || levelValue > currentLevelValue) {
    return;
  }
  
  console.log(formatMessage(level, message, data));
}

export const logger = {
  error: (message, data) => log('ERROR', message, data),
  warn: (message, data) => log('WARN', message, data),
  info: (message, data) => log('INFO', message, data),
  success: (message, data) => log('SUCCESS', message, data),
  debug: (message, data) => log('DEBUG', message, data),
  
  // Helpers específicos
  request: (req) => {
    log('INFO', `${req.method} ${req.path}`, {
      query: req.query,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  },
  
  auth: (userId, action, success = true) => {
    const level = success ? 'SUCCESS' : 'WARN';
    log(level, `Auth: ${action}`, { userId, success });
  },
  
  db: (query, duration) => {
    log('DEBUG', 'Database query', { query, duration: `${duration}ms` });
  },
  
  security: (message, data) => {
    log('WARN', `Security: ${message}`, data);
  }
};

/**
 * Middleware de logging de requisições
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  
  // Log quando a resposta for enviada
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'WARN' : 'INFO';
    
    log(level, `${req.method} ${req.path}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')?.substring(0, 50)
    });
  });
  
  next();
}

export default logger;
