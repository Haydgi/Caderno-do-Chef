import { useState } from "react";
import styles from "./PswdLogic.module.css";

// Função para validar a senha
export const validarSenha = (senha) => {
  return (
    senha.length >= 8 &&
    senha.length <= 20 &&
    /[a-z]/.test(senha) &&
    /[A-Z]/.test(senha) &&
    /[0-9]/.test(senha) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(senha)
  );
};

// Função para validar se as senhas coincidem
export const validarConfirmacaoSenha = (senha, confirmarSenha) => {
  return senha === confirmarSenha;
};

// Componente principal para exibir os campos de senha
export default function PasswordLogic({
  senha,
  setSenha,
  confirmarSenha,
  setConfirmarSenha,
  camposInvalidos,
  setCamposInvalidos,
  vertical = false, // valor padrão é false (mantém os campos lado a lado)
}) {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  return (
    <div className={styles.ladoDireito}>
      <div className={`${styles.inputsRow} ${vertical ? styles.inputsColumn : ""}`}>
        {/* Campo de Senha */}
        <div className={styles.formGroup}>
          <label htmlFor="senha">
            Senha
            {camposInvalidos.includes("senha") && (
              <span className={styles.asterisco}>*</span>
            )}
          </label>
          <div className={styles.inputIconContainer}>
            <i className="bi bi-lock"></i>
            <input
              id="senha"
              type={mostrarSenha ? "text" : "password"}
              minLength="8"
              maxLength="20"
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value);

                // Remove "senha" da lista de campos inválidos ao modificar o campo
                if (camposInvalidos.includes("senha")) {
                  setCamposInvalidos((prev) =>
                    prev.filter((item) => item !== "senha")
                  );
                }
              }}
              required
              className={`${styles.inputField} ${
                camposInvalidos.includes("senha") ? styles.inputInvalido : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className={styles.toggleSenha}
            >
              {mostrarSenha ? (
                <i className="bi bi-eye-slash"></i>
              ) : (
                <i className="bi bi-eye"></i>
              )}
            </button>
          </div>
        </div>

        {/* Campo de Confirmar Senha */}
        <div className={styles.formGroup}>
          <label htmlFor="confirmarSenha">
            Confirmar senha
            {camposInvalidos.includes("confirmarSenha") && (
              <span className={styles.asterisco}>*</span>
            )}
          </label>
          <div className={styles.inputIconContainer}>
            <i className="bi bi-lock"></i>
            <input
              id="confirmarSenha"
              type={mostrarConfirmarSenha ? "text" : "password"}
              minLength="8"
              maxLength="20"
              value={confirmarSenha}
              onChange={(e) => {
                setConfirmarSenha(e.target.value);

                // Remove "confirmarSenha" da lista de campos inválidos ao modificar o campo
                if (camposInvalidos.includes("confirmarSenha")) {
                  setCamposInvalidos((prev) =>
                    prev.filter((item) => item !== "confirmarSenha")
                  );
                }
              }}
              required
              className={`${styles.inputField} ${
                camposInvalidos.includes("confirmarSenha")
                  ? styles.inputInvalido
                  : ""
              }`}
            />
            <button
              type="button"
              onClick={() =>
                setMostrarConfirmarSenha(!mostrarConfirmarSenha)
              }
              className={styles.toggleSenha}
            >
              {mostrarConfirmarSenha ? (
                <i className="bi bi-eye-slash"></i>
              ) : (
                <i className="bi bi-eye"></i>
              )}
            </button>
          </div>
          {/* Mensagem de erro se as senhas não coincidirem */}
          {confirmarSenha && confirmarSenha !== senha && (
            <p className={styles.textErroSenha}>As senhas não coincidem</p>
          )}
        </div>
      </div>

      {/* Regras para a criação de senha */}
      <div className={styles.regrasContainer}>
        <p className={styles.titleRegrasSenha}>Regras para a criação de senha:</p>
        <ul className={styles.regrasSenha}>
          <li
            className={
              senha.length >= 8 && senha.length <= 20
                ? styles.valido
                : styles.invalido
            }
          >
            <i
              className={
                senha.length >= 8 && senha.length <= 20
                  ? "bi bi-check-circle"
                  : "bi bi-x-circle"
              }
            ></i>
            Possuir um tamanho entre 8 e 20 caracteres.
          </li>
          <li
            className={/[a-z]/.test(senha) ? styles.valido : styles.invalido}
          >
            <i
              className={
                /[a-z]/.test(senha) ? "bi bi-check-circle" : "bi bi-x-circle"
              }
            ></i>
            Possuir no mínimo 1 letra minúscula
          </li>
          <li
            className={/[A-Z]/.test(senha) ? styles.valido : styles.invalido}
          >
            <i
              className={
                /[A-Z]/.test(senha) ? "bi bi-check-circle" : "bi bi-x-circle"
              }
            ></i>
            Possuir no mínimo 1 letra maiúscula.
          </li>
          <li
            className={/[0-9]/.test(senha) ? styles.valido : styles.invalido}
          >
            <i
              className={
                /[0-9]/.test(senha) ? "bi bi-check-circle" : "bi bi-x-circle"
              }
            ></i>
            Possuir no mínimo 1 número.
          </li>
          <li
            className={
              /[!@#$%^&*(),.?":{}|<>]/.test(senha)
                ? styles.valido
                : styles.invalido
            }
          >
            <i
              className={
                /[!@#$%^&*(),.?":{}|<>]/.test(senha)
                  ? "bi bi-check-circle"
                  : "bi bi-x-circle"
              }
            ></i>
            Possuir no mínimo 1 caractere especial.
          </li>
        </ul>
      </div>
    </div>
  );
}