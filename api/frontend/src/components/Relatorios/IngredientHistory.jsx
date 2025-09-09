import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import styles from './Dashboard.module.css';

const IngredientHistory = ({ usuarioId }) => {
  const [ingredientes, setIngredientes] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false); // NOVO

  // Buscar lista de ingredientes (únicos) do usuário
  useEffect(() => {
    if (!usuarioId) return;

    const token = localStorage.getItem('token');
    setLoading(true);
    axios
      .get(`http://localhost:3001/api/ingredientes?usuario=${usuarioId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        const nomesUnicos = [
          ...new Set(res.data.map((ing) => ing.Nome_Ingrediente)),
        ].sort();
        setIngredientes(nomesUnicos);
        if (nomesUnicos.length > 0) setSelectedIngredient(nomesUnicos[0]);
        setLoading(false);
      })
      .catch((err) => {
        setIngredientes([]);
        setSelectedIngredient('');
        setLoading(false);
      });
  }, [usuarioId]);

  // Buscar histórico do ingrediente selecionado
  useEffect(() => {
    if (!selectedIngredient || !usuarioId) {
      setHistoricalData([]);
      return;
    }
    setLoading(true);
    axios
      .get(
        `http://localhost:3001/api/historico-ingredientes/${encodeURIComponent(
          selectedIngredient
        )}/${usuarioId}`
      )
      .then((res) => {
        const dadosOrdenados = res.data
          .sort(
            (a, b) =>
              new Date(a.createdAt || '2024-01-01') -
              new Date(b.createdAt || '2024-01-01')
          )
          .map((ing) => {
            let dataFormatada = 'N/A';
            if (ing.createdAt) {
              const d = new Date(ing.createdAt);
              const dia = String(d.getDate()).padStart(2, '0');
              const mes = String(d.getMonth() + 1).padStart(2, '0');
              const ano = d.getFullYear();
              dataFormatada = `${dia}/${mes}/${ano}`;
            }
            return {
              date: dataFormatada,
              cost: ing.costPerUnit,
              waste: ing.wasteRate,
            };
          });
        setHistoricalData(dadosOrdenados);
        setLoading(false);
      })
      .catch((err) => {
        setHistoricalData([]);
        setLoading(false);
      });
  }, [selectedIngredient, usuarioId]);

  if (!usuarioId) {
    return <p>Informe o usuário para carregar o histórico.</p>;
  }

  if (loading) {
    return (
      <div className={`${styles['chart-card']} ${styles['full-width']}`}>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className={`${styles['chart-card']} ${styles['full-width']}`}>
      <div className={styles['chart-header']}>
        <h3 className={styles['chart-title']}>Custo Histórico do Ingrediente</h3>
        <select
          value={selectedIngredient}
          onChange={(e) => setSelectedIngredient(e.target.value)}
          className={styles['ingredient-select']}
        >
          {ingredientes.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      {historicalData.length === 0 ? (
        <div className={styles['no-data-message']}>
          Nenhum histórico encontrado para ingrediente.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={historicalData}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="left"
              label={{ value: 'Custo (R$)', angle: -90, position: 'insideLeft', fontSize: 12 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: 'Desperdício (%)', angle: 90, position: 'insideRight', fontSize: 12 }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value, name) =>
                name === 'Custo pela Unidade de Medida'
                  ? [`R$ ${Number(value).toFixed(2)}`, name]
                  : [`${value}%`, name]
              }
            />
            <Legend wrapperStyle={{ fontSize: 12 }} verticalAlign="bottom" align="center" />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cost"
              name="Custo pela Unidade de Medida"
              stroke="var(--primary)"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="waste"
              name="Taxa de Desperdício"
              stroke="var(--secondary-dark)"
              strokeWidth={3}
              dot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default IngredientHistory;

