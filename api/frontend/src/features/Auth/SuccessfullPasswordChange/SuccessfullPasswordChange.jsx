import styles from "./SuccessfullPasswordChange.module.css";
import { useNavigate } from "react-router-dom";

export default function LinkExpirado() {
  const navigate = useNavigate();

  const handleVoltar = () => {
    navigate("/sign-in");
  };

  return (
    <div className={styles.background}>
      <div className={styles.banner}>
        <div className={styles.textContainer}>
          <h2 className={styles.title}>Senha alterada com sucesso!</h2>
          <p className={styles.message}>
            Utilize a sua nova senha para acessar o sistema à partir de agora.<br />
          </p>
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
