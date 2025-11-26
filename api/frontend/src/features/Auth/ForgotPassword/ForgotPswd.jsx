import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../../../Styles/global.css";
import "../globalAuth.css";
import styles from "./ForgotPswd.module.css";
import Password, { validarSenha, validarConfirmacaoSenha } from "../PswdLogic.jsx";
import { toast } from "react-toastify";
import axios from "axios";

export default function ForgotPassword() {
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [camposInvalidos, setCamposInvalidos] = useState([]);
  const [token, setToken] = useState("");
  const [validandoToken, setValidandoToken] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const tokenUrl = searchParams.get('token');
    if (!tokenUrl) {
      toast.error('Token de recuperação não encontrado.');
      navigate('/sign-in');
      return;
    }

    setToken(tokenUrl);
    validarToken(tokenUrl);
  }, [searchParams, navigate]);

  const validarToken = async (tokenUrl) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/validar-token/${tokenUrl}`);
      if (response.data.valido) {
        setTokenValido(true);
      } else {
        toast.error('Link inválido ou expirado.');
        navigate('/expired-link');
      }
    } catch (error) {
      toast.error('Link inválido ou expirado.');
      navigate('/expired-link');
    } finally {
      setValidandoToken(false);
    }
  };

  const handleRedefinirSenha = async (e) => {
    e.preventDefault();

    const camposInvalidosTemp = [];

    if (!validarSenha(senha)) {
      camposInvalidosTemp.push("senha");
    }

    if (!confirmarSenha || !validarConfirmacaoSenha(senha, confirmarSenha)) {
      camposInvalidosTemp.push("confirmarSenha");
    }

    if (camposInvalidosTemp.length > 0) {
      setCamposInvalidos(camposInvalidosTemp);
      toast.error("Por favor, corrija os campos destacados.");
      return;
    }

    setCarregando(true);

    try {
      const response = await axios.post('http://localhost:3001/api/resetar-senha', {
        token,
        novaSenha: senha
      });

      toast.success(response.data.mensagem || "Senha redefinida com sucesso!");
      setSenha("");
      setConfirmarSenha("");
      setCamposInvalidos([]);
      
      setTimeout(() => {
        navigate('/sign-in');
      }, 2000);
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      toast.error(error.response?.data?.mensagem || "Erro ao redefinir senha. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const handleInputChange = (campo, valor) => {
    if (campo === "senha") setSenha(valor);
    if (campo === "confirmarSenha") setConfirmarSenha(valor);

    // Remove o campo da lista de inválidos assim que o usuário começa a preenchê-lo
    setCamposInvalidos((prev) => prev.filter((item) => item !== campo));
  };

  if (validandoToken) {
    return (
      <div className={`${"backgroundContainer"} ${styles.background}`}>
        <div className={styles.container}>
          <p>Validando link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValido) {
    return null;
  }

  return (
    <div className={`${"backgroundContainer"} ${styles.background}`}>
      <div className={styles.container}>
        <form className={styles.formulario} onSubmit={handleRedefinirSenha} noValidate>
          <div>
            <h2>Redefinir Senha</h2>
            <div>
              <Password
                senha={senha}
                setSenha={(valor) => handleInputChange("senha", valor)}
                confirmarSenha={confirmarSenha}
                setConfirmarSenha={(valor) => handleInputChange("confirmarSenha", valor)}
                camposInvalidos={camposInvalidos}
                setCamposInvalidos={setCamposInvalidos}
                vertical={true}
              />
            </div>

            <div className={styles.buttonContainer}>
              <button 
                className={`${styles.btnDetails} ${"btnUltraViolet"}`}
                disabled={carregando}
              >
                {carregando ? "Redefinindo..." : "Redefinir"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
