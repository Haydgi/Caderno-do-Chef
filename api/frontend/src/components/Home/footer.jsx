import React from 'react';
import styles from './footer.module.css';

const Footer = (props) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className={styles['footer-footer7']}>
      <button
        className={`btnUltraViolet ${styles['btnUltraViolet']}`}
        onClick={scrollToTop}
      >
        Voltar ao topo
      </button>
      <div className={styles['footer-max-width']}>
        <div className={styles['footer-content']}></div>
        <div className={styles['footer-row']}>
          <div className={styles['footer-container']}>
            <div className={styles['footer-divider']}></div> {/* Linha divisória */}
            <span className={styles.caderno}>© 2025 Caderno do Chef. Todos os direitos reservados.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
