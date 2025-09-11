import React, { Fragment } from 'react';
import styles from './bullets.module.css';
import ChefTriste from '/midia/chef_triste.png';

const Bullets = (props) => {
  return (
    <div className={`${styles['passo-a-passo-container1']} thq-section-padding ${props.rootClassName}`} >
      <div className={`${styles['passo-a-passo-max-width']} thq-section-max-width`}>
        <div className={styles['passo-a-passo-section-header']}>
            
            <img
              src={ChefTriste}
              alt={props.imageAlt}
              className={styles['passo-a-passo-image']}
            />
            
        </div>
        <div className={`${styles['passo-a-passo-container2']}`}>
          <div className={styles['passo-a-passo-container3']} id='bullets'>
                <h2 className = "thq-heading-2"> Os erros invisíveis que drenam o seu lucro</h2>
                <text className={styles.appeal} >A verdade é simples: <strong>cozinhar bem não garante um negócio lucrativo</strong>.
                <br/><br/> Esses são os erros mais comuns que impedem bons chefs de crescer:</text>
                <ul className={`${styles['list']}`}>
                    <li>
                    A precificação não cobre os custos reais — o lucro some sem que você perceba.
                    </li>
                    <li>
                    Os preços são definidos com base em achismo ou comparação com concorrentes.
                    </li>
                    <li>
                    Falta controle financeiro real: não se sabe onde está o desperdício nem onde dá pra melhorar.
                    </li>
                    <li>
                    O sistema utilizado para fins de cálculo financeiro é complicado, pouco intuitivo e consome muito tempo.
                    </li>
                    <li>
                    A gestão ainda acontece no caderno, na calculadora ou em planilhas confusas.
                    </li>
                </ul>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Bullets;