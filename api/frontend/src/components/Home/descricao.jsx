import React from 'react';
import styles from './descricao.module.css';
import ChefAnimado from '/midia/chef_animado.png';

const PassoAPasso = (props) => {
  return (
    <div className={`${styles['passo-a-passo-container1']} thq-section-padding ${props.rootClassName}`}>
      <div className={`${styles['passo-a-passo-max-width']} thq-section-max-width`}>
        <div className={styles['descricao-flex-container']}>
          <div className={styles.texto} id="descricao">
            <h2 className='thq-heading-2'>O que é o Caderno do Chef?</h2>
            <div className={styles['descricao-text']}>
              <p>
                O Caderno do Chef é um sistema inovador desenvolvido por uma equipe de estudantes, com o objetivo de transformar a forma como empreendedores do setor gastronômico realizam a precificação de suas receitas.
              </p>
              <p>
                Nosso sistema oferece uma solução prática, eficiente e intuitiva, que auxilia na tomada de decisões estratégicas, proporcionando maior segurança e precisão na definição de preços. Com ele, é possível realizar cálculos automáticos, analisar e selecionar a quantidade de cada ingrediente na receita e otimizar a precificação e a gestão financeira do negócio. Além de ser uma ferramenta de apoio técnico, o Caderno do Chef também busca fomentar uma cultura de profissionalização no setor gastronômico, contribuindo para o fortalecimento e crescimento sustentável dos empreendimentos.
              </p>
              <p>
                Este projeto representa não apenas uma solução tecnológica, mas também um compromisso social com a valorização e o desenvolvimento dos pequenos e médios negócios gastronômicos.
              </p>
            </div>
          </div>
          <div className={styles['passo-a-passo-section-header']}>
            <img
              src={ChefAnimado}
              alt="Imagem de um Chef animado com a sua ideia."
              className={styles.imagem}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassoAPasso;