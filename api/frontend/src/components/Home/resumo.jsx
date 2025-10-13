import React from "react";
import styles from "./resumo.module.css";

const Resumo = () => {
  const scrollToSection = () => {
    const section = document.getElementById("bullets");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className={styles["container"]}>
      <div className={styles["thq-section-padding"]}>
        <div
          className={`${styles["resumo-container"]} ${styles["thq-section-max-width"]}`}
        >
          <div className={styles["resumo-card-container"]}>
            {/* Card */}
            <div className={styles["resumo-content1"]}>
              <h1>
                Já pensou em lucrar mais <br /> no seu restaurante?
              </h1>
              <p>
                Nós temos uma solução prática e eficiente para o seu negócio que
                poderá lhe proporcionar maiores lucros e um posicionamento mais
                assertivo no mercado gastronômico.
              </p>
              <button
                className={`btnUltraViolet ${styles["btnUltraViolet"]}`}
                onClick={scrollToSection}
              >
                Descubra como!
              </button>
            </div>
          </div>
          <div className={styles["resumo-image-container"]}>
            {/* Imagem da mulher */}
            <img
              src={`${import.meta.env.BASE_URL}midia/MulherChef.png`}
              alt="Mulher chef"
              className={styles["resumo-mulher-img"]}
            />
          </div>
        </div>
      </div>
      <div className={styles["wave"]}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 240"
          preserveAspectRatio="none"
        >
          <path
            fill="#FAFAFA"
            fillOpacity="1"
            d="M0,224L48,213.3C96,203,192,181,288,154.7C384,128,480,96,576,101.3C672,107,768,149,864,176C960,203,1056,213,1152,186.7C1248,160,1344,96,1392,64L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>
    </div>
  );
};

export default Resumo;
