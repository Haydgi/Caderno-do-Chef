import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import styles from './Dashboard.module.css';

const IngredientHistory = ({ usuarioId }) => {
  const [ingredientes, setIngredientes] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [yAxisDomain, setYAxisDomain] = useState([0, 'auto']); // NOVO

  // Buscar lista de ingredientes (únicos) do usuário
  useEffect(() => {
    if (!usuarioId) return;

    const token = localStorage.getItem('token');
    setLoading(true);
    axios
      .get(`/api/ingredientes?usuario=${usuarioId}&limit=10000`)
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
      setYAxisDomain([0, 'auto']);
      return;
    }
    setLoading(true);
    axios
      .get(
        `/api/historico-ingredientes/${encodeURIComponent(
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
              cost: Math.max(0, parseFloat(ing.costPerUnit) || 0), // Garantir que cost não seja negativo
              waste: ing.wasteRate,
            };
          });
        
        // Calcular domínio do eixo Y baseado nos valores dos dados
        if (dadosOrdenados.length > 0) {
          const custos = dadosOrdenados.map(item => item.cost).filter(cost => !isNaN(cost) && cost >= 0);
          if (custos.length > 0) {
            const minCost = Math.min(...custos);
            const maxCost = Math.max(...custos);
            
            // Calcular margem adequada baseada na diferença dos valores
            const range = maxCost - minCost;
            let margin;
            
            if (range === 0) {
              // Se todos os valores são iguais, usar 10% do valor como margem
              margin = Math.max(maxCost * 0.1, 0.1);
            } else {
              // Usar 10% da diferença como margem, com mínimo de 5% do valor máximo
              margin = Math.max(range * 0.1, maxCost * 0.05);
            }
            
            const yMin = Math.max(0, minCost - margin);
            const yMax = maxCost + margin;
            
            // Garantir que o domínio seja válido
            if (yMax > yMin) {
              setYAxisDomain([yMin, yMax]);
            } else {
              setYAxisDomain([0, Math.max(maxCost * 1.2, 1)]);
            }
          } else {
            setYAxisDomain([0, 'auto']);
          }
        } else {
          setYAxisDomain([0, 'auto']);
        }
        
        setHistoricalData(dadosOrdenados);
        setLoading(false);
      })
      .catch((err) => {
        setHistoricalData([]);
        setYAxisDomain([0, 'auto']);
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
              domain={yAxisDomain}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `R$ ${Number(value).toFixed(2)}`}
              allowDataOverflow={false}
              scale="linear"
            />
            <Tooltip
              formatter={(value, name) => [
                `R$ ${Number(value).toFixed(2)}`,
                'Custo pela Unidade de Medida'
              ]}
            />
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
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default IngredientHistory;

