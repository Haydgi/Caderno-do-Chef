import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
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

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());


app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Registro das rotas ;)
app.use("/api", cadastroRoutes);
app.use("/api", loginRoutes);
app.use("/api/ingredientes", ingredientesRoutes);
app.use("/api/receitas", cadastroReceitas);
app.use("/api/despesas", cadastroDespesas);
app.use("/api/receitas", LucroPorReceita);
app.use('/api/ingredientes/indice', IndiceDesperdicio);
app.use('/api/ingredientes',DesperdicioMedio);
app.use('/api/receitas',Tempomedio);
app.use('/api/receitas',ContaReceita);
app.use('/api/ingredientes',ContaIngredientes);
app.use('/api/receitas',CategoriaReceitas);
app.use('/api/receita-detalhada', receitaDetalhadaRouter);
app.use('/api/ingredientes', UnderusedController);
app.use('/api/historico-ingredientes', historicoIngredientesRoutes);


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log("SECRET_JWT =", process.env.SECRET_JWT);
  console.log("Uploads servidos de:", path.join(__dirname, "uploads"));
});
