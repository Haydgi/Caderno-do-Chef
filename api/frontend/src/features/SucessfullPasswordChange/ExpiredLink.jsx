import styles from "./ExpiredLink.module.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function LinkExpirado() {
  const navigate = useNavigate();

  const handleVoltar = () => {
    navigate("/login");
  };

  const handleReenviar = () => {
    toast.success("Novo link enviado para seu e-mail!");
  };

  return (
    <div className={styles.background}>
      <div className={styles.banner}>
        <div className={styles.textContainer}>
          <h2 className={styles.title}>Link expirado</h2>
          <p className={styles.message}>
            Este link de confirmação não é mais válido.<br />
            Solicite um novo para continuar.
          </p>
          <div className={styles.actions}>
            <button
              className={`btnUltraViolet ${styles.btnCustomHeight}`}
              onClick={handleReenviar}
            >
              <i className="bi bi-arrow-clockwise"></i> Reenviar link
            </button>
            <button
              className={`btnUltraViolet ${styles.btnCustomHeight} ${styles.btnCustomBack}`}
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
