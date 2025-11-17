import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Ingredientes from "./pages/CadastroSistema/Ingredientes/Ingredientes";
import Home from "./pages/Home/Home";
import Receitas from "./pages/CadastroSistema/Receitas/Receitas";
import Despesas from "./pages/CadastroSistema/Despesas/Despesas";
import Relatorios from "./pages/CadastroSistema/Relatorios/Relatorios";
import Login from "./features/Auth/LoginUsuario/Login";
import Cadastro from "./features/Auth/CadastroUsuarios/CadastroUsuarios";
import AuthUser from "./features/Auth/AuthUser/AuthUser";
import EsqueciSenha from "./features/Auth/ForgotPasswordEmail/ForgotPswdEmail";
import RedefinirSenha from "./features/Auth/ForgotPassword/ForgotPswd";
import ExpiredLink from "./features/Auth/ExpiredLink/ExpiredLink";
import SuccessfullPasswordChange from "./features/Auth/SuccessfullPasswordChange/SuccessfullPasswordChange";
import RoleGuard from "./features/Auth/RoleGuard";
import Usuarios from "./pages/Usuarios/Usuarios";

const isTokenValid = () => {
  const t = localStorage.getItem("token");
  return !!t && t !== "undefined" && t !== "null" && t.trim() !== "";
};

// ProtectedRoute: redirect to /sign-in if token invalid
function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!isTokenValid()) {
    // ensure no invalid token remains
    localStorage.removeItem("token");
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }
  return children;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // keep a local state only for UI (not authoritative for route protection)
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    // sync UI state from real token presence on mount and when storage changes across tabs
    const sync = () => setLogado(isTokenValid());
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setLogado(false);
    navigate("/");
  };

  return (
    <>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        theme="colored"
      />

      <Routes>
        {/* use isTokenValid() here to decide redirect (do not rely solely on logado state) */}
        <Route
          path="/sign-in"
          element={isTokenValid() ? <Navigate to="/receitas" replace /> : <Login onLogin={() => setLogado(isTokenValid())} />}
        />

        <Route path="/sign-up" element={<Cadastro />} />
        <Route path="/" element={<Home />} />
        <Route path="/forgot-password-email" element={<EsqueciSenha />} />
        <Route path="/forgot-password" element={<RedefinirSenha />} />
        <Route path="/auth" element={<AuthUser />} />
        <Route path="/expired-link" element={<ExpiredLink />} />
        <Route path="/password-changed-successfully" element={<SuccessfullPasswordChange />} />

        {/* protected routes */}
        <Route
          path="/receitas"
          element={
            <ProtectedRoute>
              <Receitas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ingredientes"
          element={
            <ProtectedRoute>
              <Ingredientes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/relatorios"
          element={
            <ProtectedRoute>
              <Relatorios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/despesas"
          element={
            <ProtectedRoute>
              <Despesas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <RoleGuard allow={["Proprietário", "Gerente", "Funcionário"]}>
              <Usuarios />
            </RoleGuard>
          }
        />
        {/* keep other routes as before */}
      </Routes>
    </>
  );
}

export default App;
