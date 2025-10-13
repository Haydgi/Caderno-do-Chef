import styles from "./ExpiredLink.module.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function LinkExpirado() {
  const navigate = useNavigate();

  const handleVoltar = () => {
    navigate("/sign-in");
  };

  const handleReenviar = () => {
    toast.success("Um novo link foi enviado para o seu e-mail!");
  };

  return (
    <div className={styles.background}>
      <div className={styles.banner}>
        <div className={styles.textContainer}>
          <h2 className={styles.title}>Link expirado...</h2>
          <p className={styles.message}>
            <strong>Este link de confirmação não é mais válido.</strong><br />
            Solicite um novo para recuperar sua senha.
          </p>
          <div className={styles.actions}>
            <button
              className={`${styles.btnCustomHeight}  ${styles.btnReenviar}`}
              onClick={handleReenviar}
            >
              <i className="bi bi-arrow-clockwise"></i> Reenviar link
            </button>
            <button
              className={`${styles.btnCustomHeight} ${styles.btnVoltar}`}
              onClick={handleVoltar}
            >
              <i className="bi bi-arrow-left"></i> Voltar para o login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
