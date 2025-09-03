import React, { Fragment } from 'react';
import styles from './passo-a-passo.module.css';
import ChefFeliz from '/midia/chef_caderno.png';

const PassoAPasso = (props) => {
  return (
    <div className={`${styles['passo-a-passo-container1']} thq-section-padding ${props.rootClassName}`}>
      <div className={`${styles['passo-a-passo-max-width']} thq-section-max-width`}>
        <div className={styles['passo-a-passo-container2']}>
          <div className={styles['passo-a-passo-section-header']} id='passo-a-passo'>
            <h2 className="thq-heading-2">Como o sistema funciona?</h2>
            <img
              src={ChefFeliz}
              alt={props.imageAlt}
              className={styles['passo-a-passo-image']}
            />
          </div>
          <div className={styles['passo-a-passo-container3']}>
            <div className={`${styles['passo-a-passo-container4']} thq-card`}>
              <h2 className={`${styles['card-roxo']} thq-heading-2`}>
                {props.step1Title ?? (
                  <Fragment>
                    <span className={styles['passo-a-passo-text27']}>Cadastre os ingredientes</span>
                  </Fragment>
                )}
              </h2>
              <span className={`${styles['passo-a-passo-text12']} thq-body-small`}>
                {props.step1Description ?? (
                  <Fragment>
                    <span className={styles['passo-a-passo-text23']}>Cadastre seus ingredientes com nome, quantidade, categoria, unidade de medida e taxa de desperdício.</span>
                  </Fragment>
                )}
              </span>
              <label className={`${styles['passo-a-passo-text13']} thq-heading-3`}>01</label>
            </div>
            <div className={`${styles['passo-a-passo-container5']} thq-card`}>
              <h2 className="thq-heading-2">
                {props.step2Title ?? (
                  <Fragment>
                    <span className={styles['passo-a-passo-text25']}>Cadastre suas despesas</span>
                  </Fragment>
                )}
              </h2>
              <span className={`${styles['passo-a-passo-text15']} thq-body-small`}>
                {props.step2Description ?? (
                  <Fragment>
                    <span className={styles['passo-a-passo-text26']}>Cadastre suas despesas com nome, custo mensal e tempo operacional (horas).</span>
                  </Fragment>
                )}
              </span>
              <label className={`${styles['passo-a-passo-text16']} thq-heading-3`}>02</label>
            </div>
            <div className={`${styles['passo-a-passo-container6']} thq-card`}>
              <h2 className={styles['card-roxo']}>
                {props.step3Title ?? (
                  <Fragment>
                    <span className={`${styles['passo-a-passo-text28']} thq-heading-2`}>Crie suas receitas</span>
                  </Fragment>
                )}
              </h2>
              <span className={`${styles['passo-a-passo-text18']} thq-body-small`}>
                {props.step3Description ?? (
                  <Fragment>
                    <span className={styles['passo-a-passo-text24']}>Cadastre suas receitas com nome, categoria, tempo de preparo, porcentagem de lucro, ingredientes e suas quantidades.</span>
                  </Fragment>
                )}
              </span>
              <label className={`${styles['passo-a-passo-text19']} thq-heading-3`}>03</label>
            </div>
            <div className={`${styles['passo-a-passo-container7']} thq-card`}>
              <h2 className="thq-heading-2">
                {props.step4Title ?? (
                  <Fragment>
                    <span className={styles['passo-a-passo-text30']}>Acompanhe a variação de preço dos ingredientes</span>
                  </Fragment>
                )}
              </h2>
              <span className={`${styles['passo-a-passo-text21']} thq-body-small`}>
                {props.step4Description ?? (
                  <Fragment>
                    <span className={styles['passo-a-passo-text29']}>Selecione um ingrediente e uma período para obter um relatório de variação do preço do produto cadastrado conforme atualizações.</span>
                  </Fragment>
                )}
              </span>
              <label className={`${styles['passo-a-passo-text22']} thq-heading-3`}>04</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

PassoAPasso.defaultProps = {
  step1Description: undefined,
  step3Description: undefined,
  step2Title: undefined,
  step2Description: undefined,
  step1Title: undefined,
  step3Title: undefined,
  step4Description: undefined,
  step4Title: undefined,
  rootClassName: '',
  imageSrc: 'https://play.teleporthq.io/static/svg/default-img.svg',
  imageAlt: 'image',
};

export default PassoAPasso;
