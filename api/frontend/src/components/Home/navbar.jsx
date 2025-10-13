import React from "react";
import { useNavigate } from "react-router-dom";

import styles from "./navbar.module.css";

const Navbar = (props) => {
  const navigate = useNavigate();

  return (
    <h1 className={styles["navbar-container1"]}>
      <div className={styles["navbar-navbar-interactive"]}>
        <img
          src={`${import.meta.env.BASE_URL}midia/logo_caderno_do_chef.png`}
          alt="Logo Caderno do Chef"
          className={styles["navbar-image1"]}
        />

        <div className={styles.links}>
          <a href="#descricao" className={styles.links}>
            O que é o Caderno do Chef?
          </a>
          <a href="#passo-a-passo" className={styles.links}>
            Como o sistema funciona?
          </a>
          <a href="#equipe" className={styles.links}>
            Equipe
          </a>
        </div>

        <div className={styles["navbar-buttons1"]}>
          <button
            className={`btnUltraViolet ${styles.btnUltraViolet}`}
            onClick={() => navigate("/sign-in")}
          >
            Login
          </button>
          <button
            className={`btnUltraViolet ${styles.btnUltraViolet}`}
            onClick={() => navigate("/sign-up")}
          >
            Cadastro
          </button>
        </div>
      </div>
    </h1>
  );
};

export default Navbar;
