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
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  // Recupera userId do localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(Number(storedUserId));
    }
  }, []);

  // Busca ingredientes do backend
  useEffect(() => {
    if (!userId) return;

    axios.get(`/api/ingredientes?usuario=${userId}`)
      .then(res => {
        const nomes = [...new Set(res.data.map(ing => ing.Nome_Ingrediente))].sort();
        setIngredientList(nomes);
      })
      .catch(() => setIngredientList([]));
  }, [userId]);

  const handleIngredientChange = (e) => {
    const { value, checked } = e.target;
    setSelectedIngredients(prev =>
      checked ? [...prev, value] : prev.filter(name => name !== value)
    );
  };

  const handleExport = async () => {
    if (selectedIngredients.length === 0) return;

    const formData = new FormData();
    selectedIngredients.forEach(ing => formData.append('ingredientes[]', ing));

    try {
      const response = await fetch('/api/export-dashboard.php', {
        method: 'POST',
        body: formData,
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
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
          onExport={(selectedIngredients) => {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/api/export-dashboard.php';
            form.target = '_blank';

            selectedIngredients.forEach(ing => {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = 'ingredientes[]';
              input.value = ing;
              form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
