import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FaFilter } from 'react-icons/fa';
import styles from './Dashboard.module.css';

const WasteChart = ({ userId }) => {
    console.log("userId recebido no WasteChart:", userId);

    
  const [ingredients, setIngredients] = useState([]);
  const [filter, setFilter] = useState('maior');
  const [showOptions, setShowOptions] = useState(false);
  const [menuAnimation, setMenuAnimation] = useState('');

  useEffect(() => {
    if (!userId) return;
    axios.get(`/api/ingredientes/indice?usuario=${userId}`)
      .then(res => {
        console.log("Dados recebidos para o gráfico:", res.data);
        setIngredients(res.data);
      })
      .catch(err => console.error('Erro ao carregar dados de desperdício:', err));
  }, [userId]);

  const toggleMenu = () => {
    if (showOptions) {
      setMenuAnimation('exit');
      setTimeout(() => setShowOptions(false), 300);
    } else {
      setShowOptions(true);
      setMenuAnimation('enter');
    }
  };

  // Ordena ingredientes pela data de criação mais recente, trata datas inválidas corretamente
  const latestIngredients = [...ingredients]
    .sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    })
    // Pega só o ingrediente mais recente para cada nome (remove duplicatas)
    .filter((ing, index, self) =>
      index === self.findIndex(i => i.name === ing.name)
    );

  // Ordena conforme filtro selecionado
  const sorted = [...latestIngredients].sort((a, b) =>
    filter === 'maior'
      ? b.wasteRate - a.wasteRate
      : a.wasteRate - b.wasteRate
  );

  // Prepara dados para o gráfico, com nomes truncados se muito longos
  const data = sorted
    .slice(0, 5)
    .map(ing => ({
      name: ing.name.length > 15 ? `${ing.name.substring(0, 12)}...` : ing.name,
      desperdicio: ing.wasteRate,
    }));

  return (
    <div className={`${styles['chart-card']} ${styles['compact']}`}>
      <div className={styles['chart-header']}>
        <h3 className={styles['chart-title-mini']}>
          Desperdício de Ingrediente - <span className={styles['filter-marker']}>{filter === 'maior' ? 'Maior' : 'Menor'}</span>
        </h3>
        <div className={styles['select-container']}>
          <button className={styles['icon-button']} onClick={toggleMenu}>
            <FaFilter />
          </button>
          {showOptions && (
            <div className={`${styles['dropdown-menu']} ${styles[menuAnimation]}`}>
              <button
                className={styles['dropdown-item']}
                onClick={() => {
                  setFilter('maior');
                  toggleMenu();
                }}
              >
                Maior desperdício
              </button>
              <button
                className={styles['dropdown-item']}
                onClick={() => {
                  setFilter('menor');
                  toggleMenu();
                }}
              >
                Menor desperdício
              </button>
            </div>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
          <Tooltip formatter={value => [`${value}%`, 'Desperdício']} />
          <Bar
            dataKey="desperdicio"
            fill="var(--primary-dark)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WasteChart;
