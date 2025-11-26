import '../../../Styles/global.css';
import "../globalAuth.css";
import styles from "./ForgotPswdEmail.module.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [mostrarErroEmail, setMostrarErroEmail] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const handleVoltarParaTelaInicial = () => {
    navigate('/sign-in');
  };

  const handleCadastro = async (e) => {
    e.preventDefault();

    if (!email.includes("@")) {
      setMostrarErroEmail(true);
      setMensagem("");
      toast.error("Por favor, insira um e-mail válido.");
      return;
    }

    setCarregando(true);

    try {
      const response = await axios.post('http://localhost:3001/api/recuperar-senha', {
        email: email
      });

      setMensagem(response.data.mensagem || "Verifique seu email. Um link para redefinir sua senha foi enviado.");
      setMostrarErroEmail(false);
      toast.success("Verifique seu e-mail para redefinir a senha.");
    } catch (error) {
      console.error('Erro ao solicitar recuperação:', error);
      
      if (error.response?.status === 429) {
        toast.error("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
      } else {
        // Por segurança, sempre mostramos mensagem genérica
        setMensagem("Se o email existir em nossa base, você receberá instruções de recuperação.");
        toast.info("Verifique seu email se estiver cadastrado.");
      }
      setMostrarErroEmail(false);
    } finally {
      setCarregando(false);
    }
  };

  const handleEmailChange = (valor) => {
    setEmail(valor);
    setMensagem("");
    setMostrarErroEmail(false);            // remove erro ao digitar
  };

  return (
    <div className={`${"backgroundContainer"} ${styles.background}`}>
      <div>
        <div className={styles.container}>
          <form className={styles.formulario} onSubmit={handleCadastro} noValidate>
            <button className={styles.btnDetailsBack} onClick={handleVoltarParaTelaInicial}>
              <i className="bi bi-arrow-left-circle"></i>Voltar
            </button>

            <h2>Recuperação de Senha</h2>

            <div className={styles.formGroup} style={{ position: "relative" }}>
              <label htmlFor="email">
                E-mail
                {mostrarErroEmail && <span className={styles.asterisco}>*</span>}
              </label>

              <div className={styles.inputIconContainer}>
                <i className="bi bi-envelope"></i>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="Insira seu e-mail"
                  className={`${styles.inputField} ${mostrarErroEmail ? styles.inputInvalido : ""}`}
                />
              </div>

              {mensagem && (
                <div className={styles.mensagemEmail}>
                  <p>{mensagem}</p>
                  <button
                    type="button"
                    className={styles.btnReenviar}
                    onClick={() => setMensagem("Um novo link foi enviado ao seu email.")} >
                    Reenviar email
                  </button>
                </div>
              )}
            </div>

            <div className={styles.buttonContainer}>
              <button 
                className={`${styles.btnDetails} btnUltraViolet`} 
                type="submit"
                disabled={carregando}
              >
                {carregando ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
