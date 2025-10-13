import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './Dashboard.module.css';

const IngredientCount = ({ userId }) => {
  const [uniqueIngredients, setUniqueIngredients] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchUniqueIngredients = async () => {
      try {
        const response = await axios.get(`/api/ingredientes/ContaIngredientes?usuario=${userId}`);
        setUniqueIngredients(response.data.count);
        console.log('Quantidade de ingredientes únicos:', response.data.count);
      } catch (error) {
        console.error('Erro ao buscar ingredientes únicos:', error);
        setUniqueIngredients(0);
      }
    };

    fetchUniqueIngredients();
  }, [userId]);

  return (
    <div className={`${styles['chart-card']} ${styles.compact}`}>
      <h3 className={styles['chart-title']}>Ingredientes Cadastrados</h3>
      <div className={styles['metric-value']}>
        {uniqueIngredients}
        <span className={styles['metric-label']}>ingredientes únicos</span>
      </div>
    </div>
  );
};

export default IngredientCount;
