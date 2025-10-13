import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";


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
import LucroPorReceita from "./routes/LucroPorReceita.js";
import receitaDetalhadaRouter from './routes/receitaDetalhada.js';
import { atualizaReceitasPorIngrediente } from './routes/atualizaReceitas.js'; 




dotenv.config();
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

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());


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

// ==========================
// Rotas públicas
// ==========================
app.use("/api", cadastroRoutes); // cadastro de usuário
app.use("/api", loginRoutes);    // login

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
app.use('/api/receitas', auth, cadastroReceitas);
app.use('/api/despesas', auth, cadastroDespesas);

// Relatórios e métricas
app.use('/api/receitas', auth, LucroPorReceita);
app.use('/api/receitas', auth, Tempomedio);
app.use('/api/receitas', auth, ContaReceita);
app.use('/api/receitas', auth, CategoriaReceitas);
app.use('/api/receita-detalhada', auth, receitaDetalhadaRouter);
app.use('/api/ingredientes/indice', auth, IndiceDesperdicio);
app.use('/api/ingredientes', auth, DesperdicioMedio);
app.use('/api/ingredientes', auth, ContaIngredientes);
app.use('/api/ingredientes', auth, UnderusedController);
app.use('/api/historico-ingredientes', auth, historicoIngredientesRoutes);
app.use('/api', auth, pdfExportRoute); // exportação de PDF

// Observação: se alguma dessas rotas de relatórios deva ser pública,
// remova o `auth` apenas nessa linha específica.

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log("Uploads servidos de:", path.join(__dirname, "uploads"));
});
