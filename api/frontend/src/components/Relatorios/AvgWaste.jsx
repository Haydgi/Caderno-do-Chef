import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './Dashboard.module.css';

const AvgWaste = () => {
  const [avgWaste, setAvgWaste] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const idUsuario = localStorage.getItem('userId');
    console.log('ID do usuário obtido do localStorage:', idUsuario);

    if (!idUsuario) {
      console.log('Usuário não está logado. ID não encontrado.');
      setError('Usuário não logado');
      setLoading(false);
      return;
    }

    const fetchAverageWaste = async () => {
      try {
        console.log(`Buscando desperdício médio para o usuário ${idUsuario}...`);
        const response = await axios.get(`/api/ingredientes/media?usuario=${idUsuario}`);
        console.log('Resposta recebida do backend:', response.data);

        const mediaRecebida = response.data.media;
        if (mediaRecebida === undefined) {
          console.log('Resposta não contém campo "media".');
          setAvgWaste(0);
        } else {
          setAvgWaste(mediaRecebida);
          console.log('Desperdício médio definido para:', mediaRecebida);
        }
      } catch (err) {
        console.error('Erro ao buscar desperdício médio:', err);
        setError('Erro ao buscar desperdício médio');
        setAvgWaste(0);
      } finally {
        setLoading(false);
        console.log('Busca finalizada.');
      }
    };

    fetchAverageWaste();
  }, []);

  if (loading) {
    return <div className={styles['chart-card']}>Carregando...</div>;
  }

  if (error) {
    return <div className={styles['chart-card']}>Erro: {error}</div>;
  }

  return (
    <div className={`${styles['chart-card']} ${styles['compact']}`}>
      <h3>Desperdício Médio</h3>
      <div className={`${styles['metric-value']} ${styles['large']}`}>
        {avgWaste}%
      </div>
      <div className={styles['metric-subtext']}>
        Média ponderada do sistema
      </div>
    </div>
  );
};

export default AvgWaste;
