import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar/Navbar';
import Ingredientes from './pages/CadastroSistema/Ingredientes/Ingredientes';
import Home from './pages/Home/Home';
import Receitas from './pages/CadastroSistema/Receitas/Receitas';
import Despesas from './pages/CadastroSistema/Despesas/Despesas';
import Relatorios from './pages/CadastroSistema/Relatorios/Relatorios';
import Sobre from './features/Auth/LoginUsuario/Login';
import Cadastro from './features/Auth/CadastroUsuarios/CadastroUsuarios';
import AuthUser from './features/Auth/AuthUser/AuthUser';
import EsqueciSenha from './features/Auth/ForgotPasswordEmail/ForgotPswdEmail';
import RedefinirSenha from './features/Auth/ForgotPassword/ForgotPswd';
import ExpiredLink from './features/Auth/ExpiredLink/ExpiredLink';
import SuccessfullPasswordChange from './features/Auth/SuccessfullPasswordChange/SuccessfullPasswordChange';

function App() {
  const [logado, setLogado] = useState(false);
  const navigate = useNavigate(); 

  const logout = () => {
    setLogado(false);
    navigate('/'); // Redireciona para a página inicial (Sobre)
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3001/api/receitas", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
          // NÃO coloque Content-Type aqui, o browser define para FormData!
        },
        body: formData
      });
      if (res.ok) {
        toast.success("Receita cadastrada com sucesso!");
        // ...outros comandos...
      } else {
        toast.error("Erro ao cadastrar receita!");
      }
    } catch (error) {
      toast.error("Erro inesperado!");
    }
  }

  return (
    <>
      {logado && <Navbar onLogout={logout} />}
      <ToastContainer position="bottom-right" />
      <Routes>
        <Route
          path="/sign-in"
          element={logado ? <Navigate to="/produtos" /> : <Sobre onLogin={() => setLogado(true)} />}
        />
        <Route 
          path="/sign-up" 
          element={<Cadastro />} // Rota para o componente Cadastro
        />
        <Route 
          path="/" 
          element={<Home />}
        />
        <Route
          path="/forgot-password-email"
          element={<EsqueciSenha/>}
        />
        <Route
          path="/forgot-password"
          element={<RedefinirSenha/>}
        />
        <Route 
          path="/auth" 
          element={<AuthUser />} // Rota para o componente Cadastro
        />
        <Route 
          path="/expired-link" 
          element={<ExpiredLink />}
        />
        <Route 
          path="/password-changed-successfully" 
          element={<SuccessfullPasswordChange />}
        />
        <Route
          path="/ingredientes"
          element={<Ingredientes />}
        />
        <Route
          path="/receitas"
          element={<Receitas />}
        />
        <Route
          path="/despesas"
          element={<Despesas />}
        />
        <Route
          path="/relatorios"
          element={<Relatorios />}
        />
      </Routes>
    </>
  );
}

export default App;
