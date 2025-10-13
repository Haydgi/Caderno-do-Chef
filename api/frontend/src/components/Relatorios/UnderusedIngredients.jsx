import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Dashboard.module.css';

const UnderusedIngredients = ({ userId }) => {
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    if (!userId) return;

    console.log('🔄 Buscando ingredientes subutilizados para o usuário:', userId);

    axios.get(`/api/ingredientes/underused?usuario=${userId}`)
      .then(res => {
        console.log('✅ Ingredientes recebidos do backend:', res.data.ingredients);
        console.log('✅ Receitas recebidas do backend:', res.data.recipes);
        setIngredients(res.data.ingredients);
        setRecipes(res.data.recipes);
      })
      .catch(err => console.error('❌ Erro ao buscar ingredientes subutilizados:', err));
  }, [userId]);

  const latestIngredients = [...ingredients]
    .sort((a, b) => b.ID - a.ID)
    .filter((ing, index, self) =>
      index === self.findIndex(i => i.name === ing.name)
    );

  console.log('📦 Ingredientes mais recentes e únicos:', latestIngredients);

  const usedIngredients = new Set();
  recipes.forEach(recipe => {
    if (Array.isArray(recipe.ingredients)) {
      recipe.ingredients.forEach(ing => usedIngredients.add(ing.name));
    }
  });

  console.log('🍽️ Ingredientes usados nas receitas:', Array.from(usedIngredients));

  const underused = latestIngredients.filter(ing => !usedIngredients.has(ing.name));

  console.log('⚠️ Ingredientes subutilizados:', underused);

  if (underused.length === 0) {
    console.log('✅ Todos os ingredientes estão sendo utilizados.');
    return (
      <div className={`${styles['chart-card']} ${styles['compact']} ${styles['list-card']}`}>
        <h3 className={styles['chart-title']}>Ingredientes Subutilizados</h3>
        <p className={styles['no-data-message']}>
          Todos os ingredientes estão sendo utilizados em receitas
        </p>
      </div>
    );
  }

  console.log('🧾 Renderizando lista de ingredientes subutilizados...');

  return (
    <div className={`${styles['chart-card']} ${styles['compact']} ${styles['list-card']}`}>
      <h3 className={styles['chart-title']}>Ingredientes Subutilizados</h3>
      <ul className={styles['ingredient-list']}>
        {underused.map(ing => (
          <li key={ing.ID} className={styles['ingredient-item']}>
            <span className={styles['ing-name']}>{ing.name}</span>
            <span className={styles['ing-category']}>{ing.category}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UnderusedIngredients;
