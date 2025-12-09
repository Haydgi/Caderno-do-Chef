import { useState } from "react";
import Password from "../PswdLogic.jsx";
import { useNavigate } from "react-router-dom";
import { getApiBaseUrl } from "../../../utils/api";
import "../../../Styles/global.css";
import "../globalAuth.css";
import styles from "./CadastroUsuarios.module.css";
import logoManuscrito from "../../../assets/logotipo-manuscrito.png";
import { toast } from "react-toastify";

export default function Cadastro() {
  const navigate = useNavigate();

  // Estados dos campos
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    confirmarEmail: "",
    senha: "",
    confirmarSenha: "",
    telefone: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [camposInvalidos, setCamposInvalidos] = useState([]);

  // Função para resetar completamente o formulário
  const resetarFormulario = () => {
    setFormData({
      nome: "",
      email: "",
      confirmarEmail: "",
      senha: "",
      confirmarSenha: "",
      telefone: ""
    });
    setCamposInvalidos([]);
  };

  // Formatar telefone
  const formatTelefone = (value) => {
    value = value.replace(/\D/g, "");
    if (!value) return "";
    
    if (value.length > 10) {
      return value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (value.length > 6) {
      return value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (value.length > 2) {
      return value.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    }
    return value.replace(/^(\d*)/, "($1");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Validações
    if (!formData.nome || !formData.email || !formData.telefone || !formData.senha) {
      toast.error("Preencha todos os campos obrigatórios!");
      setIsSubmitting(false);
      return;
    }
    
    if (formData.email !== formData.confirmarEmail) {
      toast.error("Os e-mails não coincidem!");
      setIsSubmitting(false);
      return;
    }
    
    if (formData.senha !== formData.confirmarSenha) {
      toast.error("As senhas não coincidem!");
      setIsSubmitting(false);
      return;
    }
    
    const dadosParaEnviar = {
      nome: formData.nome.trim(),
      email: formData.email.trim().toLowerCase(),
      telefone: formData.telefone.trim(),
      senha: formData.senha
    };
    
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/cadastrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dadosParaEnviar)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.mensagem || "Usuário cadastrado com sucesso!");
        resetarFormulario();
        
        setTimeout(() => {
          navigate('/sign-in');
        }, 2000);
      } else {
        toast.error(data.mensagem || "Erro ao cadastrar usuário");
      }
      
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      toast.error("Erro de conexão com o servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler para mudança dos campos
  const handleInputChange = (campo, valor) => {
    if (campo === 'telefone') {
      valor = formatTelefone(valor);
    }
    
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
    
    // Remover erro do campo quando usuário começa a digitar
    setCamposInvalidos(prev => prev.filter(item => item !== campo));
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
          onSubmit={handleSubmit}
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
                  value={formData.nome}
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
                  value={formData.telefone}
                  onChange={(e) => handleInputChange("telefone", e.target.value)}
                  placeholder="(XX) XXXXX-XXXX"
                  required
                  className={`${styles.inputField} ${camposInvalidos.includes("telefone") ? styles.inputInvalido : ""
                    }`}
                />
              </div>
              {/* Exibe a mensagem de erro apenas se o telefone não for válido */}
              {formData.telefone.replace(/\D/g, "").length > 0 &&
                (formData.telefone.replace(/\D/g, "").length < 10 ||
                  formData.telefone.replace(/\D/g, "").length > 15) && (
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
              {!formData.email.includes("@") && formData.email && (
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
                  value={formData.email}
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
                  value={formData.confirmarEmail}
                  onChange={(e) => handleInputChange("confirmarEmail", e.target.value)}
                  required
                  className={`${styles.inputField} ${camposInvalidos.includes("confirmarEmail") || camposInvalidos.includes("email") ? styles.inputInvalido : ""
                    }`}
                />
              </div>
              {/* Mensagem de erro se os e-mails não coincidirem */}
              {formData.confirmarEmail && formData.confirmarEmail !== formData.email && (
                <p className={styles.textErroConfirmarEmail}>
                  Os e-mails não coincidem
                </p>
              )}
            </div>
          </div>

          <Password
            senha={formData.senha}
            setSenha={(valor) => handleInputChange("senha", valor)}
            confirmarSenha={formData.confirmarSenha}
            setConfirmarSenha={(valor) => handleInputChange("confirmarSenha", valor)}
            camposInvalidos={camposInvalidos}
            setCamposInvalidos={setCamposInvalidos}
          />

          <button 
            type="submit" 
            className={styles.btnCadastrar}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Cadastrando..." : "Cadastrar-se"}
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

      </div>
    </div>
  );
}
