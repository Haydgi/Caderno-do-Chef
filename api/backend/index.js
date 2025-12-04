import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import helmet from "helmet";
import compression from "compression";


// Rotas
import historicoIngredientesRoutes from './routes/historicoIngredientes.js';
import UnderusedController from './routes/UnderusedController.js';
import CategoriaReceitas from "./routes/CategoriaReceitas.js";
import ContaIngredientes from "./routes/ContaIngredientes.js"
import ContaReceita from "./routes/ContaReceita.js";
import Tempomedio from "./routes/Tempomedio.js"
import DesperdicioMedio from "./routes/DesperdicioMedio.js";
import IndiceDesperdicio from './routes/IndiceDesperdicio.js';
import cadastroRoutes from "./routes/CadastroUsuario.js";
import loginRoutes from "./routes/login.js";
import ingredientesRoutes from "./routes/cadastroIngredientes.js";
import cadastroReceitas from "./routes/cadastroReceitas.js";
import cadastroDespesas from "./routes/cadastroDespesas.js";
import impostosRoutes from "./routes/impostos.js";
import LucroPorReceita from "./routes/LucroPorReceita.js";
import receitaDetalhadaRouter from './routes/receitaDetalhada.js';
import { atualizaReceitasPorIngrediente } from './routes/atualizaReceitas.js';
import gerenciamentoUsuariosRoutes from "./routes/gerenciamentoUsuarios.js";
import recuperarSenhaRoutes from "./routes/recuperarSenha.js";
import importExportRoutes from "./routes/importExport.js";
import backupRoutes from './routes/backup.js';
import { proprietarioOuGerente, apenasProprietario } from "./middleware/permissions.js"; 




dotenv.config();

// Validação de variáveis de ambiente críticas
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'SECRET_JWT'];
const missingEnvVars = requiredEnvVars.filter(varName => typeof process.env[varName] === 'undefined');
if (missingEnvVars.length > 0) {
  console.error('❌ Variáveis de ambiente faltando:', missingEnvVars.join(', '));
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Garante que o diretório uploads existe
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✌️ Diretório uploads criado:', uploadsDir);
}

// Headers de segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Desabilitar CSP para permitir assets externos se necessário
}));

// Compressão de respostas HTTP
app.use(compression());

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Limite de tamanho do body para prevenir ataques de payload gigante
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Servir imagens com headers de cache otimizados
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  maxAge: '7d', // Cache por 7 dias
  etag: true, // Habilita ETags
  lastModified: true, // Habilita Last-Modified header
  setHeaders: (res, path, stat) => {
    // Adiciona headers de segurança para imagens
    res.set({
      'Cache-Control': 'public, max-age=604800', // 7 dias em segundos
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self';"
    });
  }
}));

// Import test route
import testRoute from './routes/testRoute.js';

// Import PDF export route
import pdfExportRoute from './routes/pdfExport.js';

// Middleware de autenticação (JWT) para rotas protegidas
import auth from './middleware/auth.js';

// Utilitários de erro e logging
import { errorHandler, notFoundHandler } from './utils/errors.js';
import { requestLogger } from './utils/logger.js';

// ==========================
// Middlewares globais
// ==========================
// Logger de requisições (deve vir antes das rotas)
app.use(requestLogger);

// ==========================
// Rotas públicas
// ==========================
app.use("/api", cadastroRoutes); // cadastro de usuário
app.use("/api", loginRoutes);    // login
app.use("/api", recuperarSenhaRoutes); // recuperação de senha

// Healthcheck público explícito
app.get('/api/test-connection', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

// ==========================
// Rotas protegidas (JWT)
// ==========================
// Cadastros e operações de negócio
app.use('/api', auth, testRoute); // demais endpoints de teste protegidos
app.use('/api/ingredientes', auth, ingredientesRoutes);
app.use('/api/despesas', auth, cadastroDespesas);
app.use('/api/impostos', auth, impostosRoutes);

// Gerenciamento de usuários (apenas Proprietário)
app.use('/api', auth, gerenciamentoUsuariosRoutes);

// Rota de receita detalhada (todos os usuários autenticados podem visualizar)
app.use('/api/receita-detalhada', auth, receitaDetalhadaRouter);

// Relatórios e métricas (permissões aplicadas internamente em cada rota)
app.use('/api/receitas', auth, LucroPorReceita);
app.use('/api/receitas', auth, Tempomedio);
app.use('/api/receitas', auth, ContaReceita);
app.use('/api/receitas', auth, CategoriaReceitas);

// Cadastro de receitas (generic routes with :id params) - MUST come AFTER specific routes
app.use('/api/receitas', auth, cadastroReceitas);
app.use('/api/ingredientes/indice', auth, proprietarioOuGerente, IndiceDesperdicio);
app.use('/api/ingredientes', auth, proprietarioOuGerente, DesperdicioMedio);
app.use('/api/ingredientes', auth, proprietarioOuGerente, ContaIngredientes);
app.use('/api/ingredientes', auth, proprietarioOuGerente, UnderusedController);
app.use('/api/historico-ingredientes', auth, proprietarioOuGerente, historicoIngredientesRoutes);
// Exportação de relatórios (apenas Proprietário)
app.use('/api', auth, apenasProprietario, pdfExportRoute);

// Importação e Exportação de dados (apenas Proprietário)
app.use('/api', auth, apenasProprietario, importExportRoutes);
// Backup completo (Proprietário ou Gerente) - export/import sem usuários
app.use('/api/backup', auth, proprietarioOuGerente, backupRoutes);

// ==========================
// Middlewares de erro (devem vir por último)
// ==========================
// Rota 404 para endpoints não encontrados
app.use(notFoundHandler);

// Middleware global de tratamento de erros
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Uploads servidos de: ${path.join(__dirname, "uploads")}`);
  console.log(`🔒 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Fechando servidor gracefully...');
  server.close(() => {
    console.log('Servidor fechado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT recebido. Fechando servidor gracefully...');
  server.close(() => {
    console.log('Servidor fechado');
    process.exit(0);
  });
});
