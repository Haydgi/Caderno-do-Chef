import React, { useState, useEffect } from 'react';
import ProfitChart from './ProfitChart';
import TimeChart from './TimeChart';
import RecipeCount from './RecipeCount';
import WasteChart from './WasteChart';
import IngredientCount from './IngredientCount';
import ComplexRecipes from './ComplexRecipes';
import CategoriesChart from './CategoriesChart';
import UnderusedIngredients from './UnderusedIngredients';
import AvgWaste from './AvgWaste';
import IngredientHistory from './IngredientHistory';
import { MdPictureAsPdf } from 'react-icons/md';
import styles from './Dashboard.module.css';
import axios from 'axios';
import ModalExportDashboard from './ModalExportDashboard';

const Dashboard = () => {
  const [userId, setUserId] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [ingredientList, setIngredientList] = useState([]);
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(Number(storedUserId));
    }
  }, []);

  // Busca ingredientes do backend
  useEffect(() => {
    if (!userId) return;
    // Busca ingredientes do backend
    const token = localStorage.getItem('token');
    axios.get(`http://localhost:3001/api/ingredientes?usuario=${userId}&limit=10000`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => {
        const nomes = [...new Set(res.data.map(ing => ing.Nome_Ingrediente))].sort();
        setIngredientList(nomes);
      })
      .catch((err) => {
        console.error('Erro ao buscar ingredientes:', err);
        setIngredientList([]);
      });
  }, [userId]);

  const handleExportPDF = async (selectedIngredients) => {
    if (selectedIngredients.length === 0) {
      alert('Por favor, selecione pelo menos um ingrediente.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/export-dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredientes: selectedIngredients, userId: userId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `relatorio_ingredientes_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      alert('Erro ao gerar o relatório PDF. Tente novamente.');
    }

    setShowExportModal(false);
  };


  return (
    <div className={styles.dashboard}>
      {/* Linha 1 - Histórico IngredientHistory */}
      <div className={styles.row}>
        <IngredientHistory usuarioId={userId} />
      </div>

      {/* Linha 2 - Lucro Por Receita: ProfitChart */}
      <div className={styles.row}>
        <ProfitChart userId={userId} />
      </div>

      {/* Linha 3 - Ingredientes com Maior Desperdício WasteChart /// Desperdício Médio AvgWaste */}
      <div className={styles.row}>
        <WasteChart userId={userId} />
        <AvgWaste userId={userId} />
      </div>

      {/* Linha 4 - Tempo Médio Por Categoria TimeChart */}
      <div className={styles.row}>
        <TimeChart userId={userId} />
      </div>

      {/* Linha 5 - Receitas Cadastradas: RecipeCount / IngredientCount / CategoriesChart */}
      {userId && (
        <div className={styles.row}>
          <RecipeCount userId={userId} />
          <IngredientCount userId={userId} />
          <CategoriesChart userId={userId} />
        </div>
      )}

      {/* Linha 6 - Ingredientes Subutilizados */}
      <div className={styles.row}>
        <UnderusedIngredients userId={userId} ingredients={ingredientList} />
      </div>

      {/* Botão flutuante Exportar PDF */}
      <button
        className={styles.fabExport}
        onClick={() => setShowExportModal(true)}
        title="Exportar PDF"
      >
        <MdPictureAsPdf size={24} style={{ marginRight: 8 }} />
        Exportar
      </button>

      {/* Modal de Exportação */}
      {showExportModal && (
        <ModalExportDashboard
          onClose={() => setShowExportModal(false)}
          ingredientList={ingredientList}
          onExport={handleExportPDF}
        />
      )}
    </div>
  );
};

export default Dashboard;
