import { useState } from "react";
import Password, { validarSenha, validarConfirmacaoSenha } from "../PswdLogic.jsx";
import { useNavigate } from "react-router-dom";
import "../../../Styles/global.css";
import "../globalAuth.css";
import styles from "./CadastroUsuarios.module.css";
import logoManuscrito from "../../../assets/logotipo-manuscrito.png";
import { toast } from "react-toastify";

export default function Cadastro() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [confirmarEmail, setConfirmarEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [telefone, setTelefone] = useState("");

  const [popUpMessage, setPopUpMessage] = useState(""); // Estado para o pop-up
  const [camposInvalidos, setCamposInvalidos] = useState([]); // Campos inválidos

  const formatTelefone = (value) => {
    // Remove todos os caracteres que não sejam números
    value = value.replace(/\D/g, "");

    // Se o campo estiver vazio, retorna uma string vazia
    if (value === "") {
      return "";
    }

    // Adiciona os parênteses e o traço conforme o usuário digita
    if (value.length > 10) {
      value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (value.length > 6) {
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (value.length > 2) {
      value = value.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    } else {
      value = value.replace(/^(\d*)/, "($1");
    }

    return value;
  };

  const handleCadastro = (e) => {
    e.preventDefault();

    // Redefine o pop-up para garantir que ele reapareça
    setPopUpMessage("");

    const camposNaoPreenchidos = [];
    const camposInvalidosTemp = [];

    // Validações
    if (nome.length < 3) camposInvalidosTemp.push("nome");

    if (!email) {
      camposNaoPreenchidos.push("email");
    } else if (!email.includes("@")) {
      camposInvalidosTemp.push("email"); // Adiciona o campo de e-mail como inválido
    }
    if (!confirmarEmail || email !== confirmarEmail)
      camposInvalidosTemp.push("confirmarEmail");

    // Validação do telefone
    const telefoneNumeros = telefone.replace(/\D/g, ""); // Remove caracteres não numéricos
    if (!telefone || telefoneNumeros.length < 10 || telefoneNumeros.length > 15) {
      camposInvalidosTemp.push("telefone");
    }

    // Validação da senha
    if (!validarSenha(senha)) {
      camposInvalidosTemp.push("senha");
    }

    if (!confirmarSenha || !validarConfirmacaoSenha(senha, confirmarSenha)) {
    camposInvalidosTemp.push("confirmarSenha");
  }

    // Se houver campos inválidos ou não preenchidos
    if (camposNaoPreenchidos.length > 0 || camposInvalidosTemp.length > 0) {
      setTimeout(() => {
        toast.error("Por favor, corrija os campos destacados."); }, 0);
        
      setCamposInvalidos([...camposNaoPreenchidos, ...camposInvalidosTemp]);
      return;
    }

    // Cadastro bem-sucedido
    const usuario = {
  nome,
  email,
  telefone,
  senha,
};

fetch("http://localhost:3001/api/cadastrar", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(usuario)
})
.then(response => response.json())
.then(data => {
  toast.success("Cadastro realizado com sucesso!");

  // Limpa os campos após sucesso
  setNome("");
  setEmail("");
  setConfirmarEmail("");
  setSenha("");
  setConfirmarSenha("");
  setTelefone("");
  setCamposInvalidos([]);
})
.catch(error => {
  console.error("Erro ao cadastrar:", error);
  toast.error("Erro ao cadastrar usuário.");
});

  }

  const handleInputChange = (campo, valor) => {
    switch (campo) {
      case "nome":
        setNome(valor);
        break;
      case "email":
        setEmail(valor);
        break;
      case "confirmarEmail":
        setConfirmarEmail(valor);
        break;
      case "senha":
        setSenha(valor);
        break;
      case "confirmarSenha":
        setConfirmarSenha(valor);
        break;
      case "telefone":
        // Atualiza o estado com o valor formatado
        setTelefone(formatTelefone(valor));

        // Validação do telefone
        const telefoneNumeros = valor.replace(/\D/g, ""); // Remove caracteres não numéricos
        if (telefoneNumeros.length >= 10 && telefoneNumeros.length <= 15) {
          // Número válido: remove o campo da lista de inválidos
          setCamposInvalidos((prev) =>
            prev.filter((item) => item !== "telefone")
          );
        }
        break;

      default:
        setCamposInvalidos((prev) => prev.filter((item) => item !== campo));
        break;
    }

    // Remove o campo da lista de inválidos assim que o usuário começa a preenchê-lo
    setCamposInvalidos((prev) => prev.filter((item) => item !== campo));
  };

  return (
    <div className={`${"backgroundContainer"} ${styles.backgroundSignUp}`}>
      <div className={`${styles.ladoEsquerdo}`}>
        <div className={styles.logoContainer}>
          <img
            src={logoManuscrito}
            alt="Logotipo manuscrito: Caderno do Chef"
            className={styles.logoManuscrito}
          />
        </div>
      </div>

      <div className={styles.ladoDireito}>
        <form
          className={styles.formulario}
          onSubmit={handleCadastro}
          noValidate
        >
          <div className={styles.topoForms}>
            {" "}

            <h2 className={styles.topoForms}> Crie sua conta </h2>
          </div>

          {/* Linha: Nome e Sobrenome */}
          <div className={styles.inputsRow}>
            <div className={styles.formGroup}>
              <label htmlFor="nome">
                Nome Completo
                {camposInvalidos.includes("nome") && (
                  <span className={styles.asterisco}>*</span>
                )}
              </label>
              <div className={styles.inputIconContainer}>
                <i className="bi bi-person"></i>
                <input
                  id="nome"
                  type="text"
                  minLength="2"
                  maxLength="100"
                  placeholder="Ex: João Oliveira da Silva"
                  value={nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  required
                  className={`${styles.inputField} ${camposInvalidos.includes("nome") ? styles.inputInvalido : ""
                    }`}
                />
              </div>
            </div>

            {/* Telefone */}
            <div className={styles.formGroup}>
              <label htmlFor="telefone">
                Telefone celular (com DDD)
                {camposInvalidos.includes("telefone") && (
                  <span className={styles.asterisco}>*</span>
                )}
              </label>
              <div className={styles.inputIconContainer}>
                <i className="bi bi-telephone"></i>
                <input
                  id="telefone"
                  type="text"
                  value={telefone}
                  onChange={(e) =>
                    handleInputChange("telefone", formatTelefone(e.target.value))
                  }
                  placeholder="(XX) XXXXX-XXXX"
                  required
                  className={`${styles.inputField} ${camposInvalidos.includes("telefone") ? styles.inputInvalido : ""
                    }`}
                />
              </div>
              {/* Exibe a mensagem de erro apenas se o telefone não for válido */}
              {telefone.replace(/\D/g, "").length > 0 &&
                (telefone.replace(/\D/g, "").length < 10 ||
                  telefone.replace(/\D/g, "").length > 15) && (
                  <p className={styles.textErroTelefone}>
                    Número de telefone inválido
                  </p>
                )}
            </div>
          </div>

          <div className={styles.inputsRow}>
            {/* Email */}
            <div className={styles.formGroup}>
              <label htmlFor="email">
                E-mail
                {(camposInvalidos.includes("email")) && (
                    <span className={styles.asterisco}>*</span>
                  )}
              </label>
              {/* Mensagem de erro para formato inválido de e-mail */}
              {!email.includes("@") && email && (
                <p className={styles.textErroFormatoEmail}>
                  Formato de e-mail inválido
                </p>
              )}
              <div className={styles.inputIconContainer}>
                <i className="bi bi-envelope"></i>
                <input
                  id="email"
                  type="email"
                  minLength="5"
                  maxLength="50"
                  value={email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  className={`${styles.inputField} ${camposInvalidos.includes("email") ? styles.inputInvalido : ""
                    }`}
                />
              </div>
            </div>

            {/* Confirmar Email */}
            <div className={styles.formGroup} style={{ position: "relative" }}>
              <label htmlFor="confirmarEmail">
                Confirmar e-mail
                {(camposInvalidos.includes("email") ||
                  camposInvalidos.includes("confirmarEmail")) && (
                    <span className={styles.asterisco}>*</span>
                  )}
              </label>
              <div className={styles.inputIconContainer}>
                <i className="bi bi-envelope"></i>
                <input
                  id="confirmarEmail"
                  type="email"
                  minLength="5"
                  maxLength="50"
                  value={confirmarEmail}
                  onChange={(e) =>
                    handleInputChange("confirmarEmail", e.target.value)
                  }
                  required
                  className={`${styles.inputField} ${camposInvalidos.includes("confirmarEmail") || camposInvalidos.includes("email") ? styles.inputInvalido : ""
                    }`}
                />
              </div>
              {/* Mensagem de erro se os e-mails não coincidirem */}
              {confirmarEmail && confirmarEmail !== email && (
                <p className={styles.textErroConfirmarEmail}>
                  Os e-mails não coincidem
                </p>
              )}
            </div>
          </div>

          <Password
            senha={senha}
            setSenha={setSenha}
            confirmarSenha={confirmarSenha}
            setConfirmarSenha={setConfirmarSenha}
            camposInvalidos={camposInvalidos}
            setCamposInvalidos={setCamposInvalidos}
          />

          <button type="submit" className={styles.btnCadastrar}>
            Cadastrar-se
          </button>

          <div className="mt-1 text-center">
            <p className={styles.footerModal}>
              Já é cadastrado?{" "}
              <span
                onClick={() => navigate("/sign-in")}
                className={styles.otherLinks}
              >
                Fazer log-in
              </span>
            </p>
          </div>
        </form>

        {/* Pop-up para mensagens */}
        {popUpMessage && (
          <div
            className={
              popUpMessage ===
                "Cadastro realizado com sucesso! Verifique seu e-mail para ativar sua conta."
                ? styles.popUpSucess
                : styles.popUpError
            }
          >
            {popUpMessage}
          </div>
        )}
      </div>
    </div>
  );
}
