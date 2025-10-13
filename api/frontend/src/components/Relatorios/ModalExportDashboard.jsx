import { useState } from "react";
import styles from './Dashboard.module.css';

export default function ModalExportDashboard({ onClose, ingredientList, onExport }) {
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleIngredientChange = (e) => {
    const { value, checked } = e.target;
    setSelectedIngredients(prev =>
      checked ? [...prev, value] : prev.filter(name => name !== value)
    );
  };

  const handleSelectAll = () => {
    if (selectedIngredients.length === ingredientList.length) {
      setSelectedIngredients([]);
    } else {
      setSelectedIngredients([...ingredientList]);
    }
  };

  const handleSubmit = async () => {
    if (selectedIngredients.length === 0) return;
    
    setIsExporting(true);
    try {
      await onExport(selectedIngredients);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <button className={styles.btnClose} onClick={onClose}>&times;</button>
        <h2>Exportar Relatório de Ingredientes</h2>
        <p>Selecione os ingredientes que deseja incluir no relatório PDF:</p>
        
        {ingredientList.length === 0 ? (
          <div className={styles.noIngredients}>
            <p>Nenhum ingrediente encontrado.</p>
            <p>Certifique-se de que você já cadastrou ingredientes no sistema.</p>
          </div>
        ) : (
          <>
            <div className={styles.selectAllContainer}>
              <button 
                type="button" 
                className={styles.btnSelectAll}
                onClick={handleSelectAll}
              >
                {selectedIngredients.length === ingredientList.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
              <span className={styles.selectedCount}>
                {selectedIngredients.length} de {ingredientList.length} selecionados
              </span>
            </div>
            
            <div className={styles.ingredientList}>
              {ingredientList.map(ing => (
                <div key={ing} className={styles.ingredientItem}>
                  <input 
                    type="checkbox" 
                    id={ing} 
                    value={ing} 
                    checked={selectedIngredients.includes(ing)}
                    onChange={handleIngredientChange} 
                  />
                  <label htmlFor={ing}>{ing}</label>
                </div>
              ))}
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.btnCancel}
                onClick={onClose}
                disabled={isExporting}
              >
                Cancelar
              </button>
              <button 
                className={styles.btnExport}
                onClick={handleSubmit} 
                disabled={selectedIngredients.length === 0 || isExporting}
              >
                {isExporting ? 'Gerando Relatório...' : 'Gerar Relatório PDF'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
