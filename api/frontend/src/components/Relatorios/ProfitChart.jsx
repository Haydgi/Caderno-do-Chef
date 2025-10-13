import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './Dashboard.module.css';

const ProfitChart = ({ userId }) => {
  const [recipes, setRecipes] = useState([]);
  const [filter, setFilter] = useState('mais');

  useEffect(() => {
    if (!userId) return;

    axios.get(`/api/receitas/lucros?usuario=${userId}`)
      .then(res => setRecipes(res.data))
      .catch(err => console.error('Erro ao buscar receitas:', err));
  }, [userId]);

  // Ordena receitas conforme filtro
  const sorted = [...recipes].sort((a, b) => {
    const lucroA = a.Custo_Total_Ingredientes * (a.Porcentagem_De_Lucro / 100);
    const lucroB = b.Custo_Total_Ingredientes * (b.Porcentagem_De_Lucro / 100);
    return filter === 'mais' ? lucroB - lucroA : lucroA - lucroB;
  });

  // Top 5 conforme filtro
  const data = sorted.slice(0, 5).map(r => ({
    name: r.Nome_Receita.length > 15 ? `${r.Nome_Receita.substring(0, 12)}...` : r.Nome_Receita,
    lucro: r.Custo_Total_Ingredientes * (r.Porcentagem_De_Lucro / 100),
    custo: r.Custo_Total_Ingredientes
  }));

  return (
    <div className={`${styles['chart-card']} ${styles['full-width']}`}>
      <div className={styles['chart-header']}>
        <h3 className={styles['chart-title']}>Top 5 Receitas</h3>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className={styles['ingredient-select']}
        >
          <option value="mais">Mais lucrativas</option>
          <option value="menos">Menos lucrativas</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ left: 30, right: 20 }}>
          <XAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
          <YAxis
            type="number"
            tick={{ fontSize: 12 }}
            label={{ value: 'Valor (R$)', angle: -90, position: 'insideLeft', fontSize: 12 }}
          />
          <Tooltip formatter={(value, name) => [`R$ ${value.toFixed(2)}`, name]} />
          <Bar dataKey="lucro" name="Lucro" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="custo" name="Custo" fill="var(--primary)" radius={[4, 4, 0, 0]} opacity={0.8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProfitChart;
