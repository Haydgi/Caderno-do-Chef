import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './Dashboard.module.css';

const TimeChart = ({ userId }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const fetchAverageTime = async () => {
      try {
        const response = await axios.get(`/api/receitas/Tempomedio?usuario=${userId}`);
        setData(response.data);
        console.log('Dados do tempo médio por categoria:', response.data);
      } catch (error) {
        console.error('Erro ao buscar tempo médio:', error);
        setData([]);
      }
    };

    fetchAverageTime();
  }, [userId]);

  return (
    <div className={`${styles['chart-card']} ${styles['full-width']}`}>
      <h3 className={styles['chart-title']}>Tempo Médio por Categoria de Receita</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis
            dataKey="category"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            label={{ value: 'Minutos', angle: -90, position: 'insideLeft', fontSize: 12 }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip formatter={(value) => [`${value} min`, 'Tempo']} />
          <Bar
            dataKey="avgTime"
            fill="var(--primary-light)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimeChart;
