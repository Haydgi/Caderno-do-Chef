import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import styles from './Dashboard.module.css';

const COLORS = [
  'var(--primary)',
  'var(--secondary)',
  'var(--primary-light)',
  'var(--secondary-dark)',
  'var(--accent)'
];

const CategoriesChart = ({ userId }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const fetchCategoryData = async () => {
      try {
        const response = await axios.get(`/api/receitas/categorias?usuario=${userId}`);
        setData(response.data);
        console.log('Distribuição por categoria:', response.data);
      } catch (error) {
        console.error('Erro ao buscar dados de categorias:', error);
        setData([]);
      }
    };

    fetchCategoryData();
  }, [userId]);

  return (
    <div className={`${styles['chart-card']} ${styles.compact}`}>
      <h4 className={styles['chart-title']}>Distribuição de Receitas por Categoria</h4>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          {/* Filtra categorias não utilizadas (valor 0) para evitar aglomeração no gráfico */}
          <Pie
            data={data.filter((d) => d && Number(d.value) > 0)}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            label={({ name }) => name}
          >
            {data
              .filter((d) => d && Number(d.value) > 0)
              .map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [`${value} receitas`, name]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoriesChart;
