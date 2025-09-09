import { useState } from "react";
import styles from './Dashboard.module.css';

export default function ModalExportDashboard({ onClose, ingredientList, onExport }) {
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  const handleIngredientChange = (e) => {
    const { value, checked } = e.target;
    setSelectedIngredients(prev =>
      checked ? [...prev, value] : prev.filter(name => name !== value)
    );
  };

  const handleSubmit = () => {
    onExport(selectedIngredients);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <button className={styles.btnClose} onClick={onClose}>&times;</button>
        <h2>Exportar Dados</h2>
        <p>Selecione os ingredientes que deseja incluir:</p>
        <div className={styles.ingredientList}>
          {ingredientList.map(ing => (
            <div key={ing}>
              <input type="checkbox" id={ing} value={ing} onChange={handleIngredientChange} />
              <label htmlFor={ing}>{ing}</label>
            </div>
          ))}
        </div>
        <button onClick={handleSubmit} disabled={selectedIngredients.length === 0}>
          Gerar Relatório
        </button>
      </div>
    </div>
  );
}
