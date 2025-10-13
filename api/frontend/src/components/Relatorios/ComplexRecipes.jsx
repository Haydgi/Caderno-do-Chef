import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './Dashboard.module.css';

const ComplexRecipes = ({ recipes }) => {
  const data = [...recipes]
    .sort((a, b) => b.tempoDePreparo - a.tempoDePreparo)
    .slice(0, 5)
    .map(r => ({
      name: r.name,
      tempo: r.tempoDePreparo
    }));

  return (
    <div className={`${styles['chart-card']} ${styles.compact}`}>
      <h3 className={styles['chart-title']}>Receitas Mais Complexas (Tempo)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            label={{
              value: 'Minutos',
              angle: -90,
              position: 'insideLeft',
              fontSize: 12
            }}
          />
          <Tooltip formatter={(value) => [`${value} min`, 'Tempo']} />
          <Bar dataKey="tempo" fill="var(--secondary-dark)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComplexRecipes;