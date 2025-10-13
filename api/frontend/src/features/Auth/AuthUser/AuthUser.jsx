import styles from "./AuthUser.module.css";
import { useNavigate } from "react-router-dom";

export default function AuthUser() {
  const navigate = useNavigate();

  const handleVoltar = () => {
    navigate("/sign-in");
  };

  return (
    <div className={styles.background}>
      <div className={styles.banner}>
        <div className={styles.textContainer}>
          <h2 className={styles.title}>E-mail confirmado com sucesso!</h2>
          <div className={styles.actions}>
            <button
              className={`btnUltraViolet ${styles.btnCustomHeight} ${styles.btnCustomBack}`}
              onClick={handleVoltar}
            >
              <i className="bi bi-arrow-left"></i> Voltar para a página de login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
