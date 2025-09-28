import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './Dashboard.module.css';

const RecipeCount = ({ userId }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchRecipeCount = async () => {
      try {
        const response = await axios.get(`/api/receitas/ContaReceita?usuario=${userId}`);
        setCount(response.data.total);
        console.log('Total de receitas únicas:', response.data.total);
      } catch (error) {
        console.error('Erro ao buscar contagem de receitas:', error);
        setCount(0);
      }
    };

    fetchRecipeCount();
  }, [userId]);

  return (
    <div className={`${styles['chart-card']} ${styles.compact}`}>
      <h3 className={styles['chart-title']}>Receitas Cadastradas</h3>
      <div className={styles['metric-value']}>
        {count}
        <span className={styles['metric-label']}>Receitas únicas</span>
      </div>
    </div>
  );
};

export default RecipeCount;
