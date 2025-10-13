import { useState } from "react";
import "../../../Styles/global.css";
import "../globalAuth.css";
import styles from "./ForgotPswd.module.css";
import Password, { validarSenha, validarConfirmacaoSenha } from "../PswdLogic.jsx";
import { toast } from "react-toastify"; // ✅ import toast

export default function ForgotPassword() {
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [camposInvalidos, setCamposInvalidos] = useState([]);

  const handleRedefinirSenha = (e) => {
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
      toast.error("Por favor, corrija os campos destacados."); // 🔴 toast de erro
      return;
    }

    // Simula redefinição de senha bem-sucedida
    setSenha("");
    setConfirmarSenha("");
    setCamposInvalidos([]);
    toast.success("Senha redefinida com sucesso!"); // 🟢 toast de sucesso
  };

  const handleInputChange = (campo, valor) => {
    if (campo === "senha") setSenha(valor);
    if (campo === "confirmarSenha") setConfirmarSenha(valor);

    // Remove o campo da lista de inválidos assim que o usuário começa a preenchê-lo
    setCamposInvalidos((prev) => prev.filter((item) => item !== campo));
  };

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
              <button className={`${styles.btnDetails} ${"btnUltraViolet"}`}>
                Redefinir
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
