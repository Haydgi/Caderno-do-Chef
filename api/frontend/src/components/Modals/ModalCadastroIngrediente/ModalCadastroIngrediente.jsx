import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "../../../Styles/global.css";
import styles from "./ModalCadastroIngrediente.module.css";

function ModalCadastroIngrediente({ onClose, onSave }) {
  const [form, setForm] = useState({
    nome: "",
    custo: "",
    categoria: "",
    unidade: "",
    taxaDesperdicio: "",
  });

  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Novo estado para controlar o envio
  const [camposInvalidos, setCamposInvalidos] = useState({});

  const categorias = [
    "Carnes",
    "Doces",
    "Farináceos",
    "Grãos",
    "Frutas",
    "Laticínios",
    "Legumes e Verduras",
    "Líquidos",
    "Oleaginosas",
    "Óleos e Gorduras",
    "Temperos e Condimentos",
  ];

  const handleClose = () => {
    setIsClosing(true);
    // Reseta o formulário ao cancelar
    setForm({
      nome: "",
      custo: "",
      categoria: "",
      unidade: "",
      taxaDesperdicio: "",
    });
    setCamposInvalidos({});
  };

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        onClose();
        setIsClosing(false); // Reseta o estado para próxima abertura
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "custo" || name === "taxaDesperdicio") {
      newValue = value.replace(/[^\d,]/g, "").replace(/(,.*?),/g, "$1");
    }

    setForm((prev) => ({ ...prev, [name]: newValue }));

    if (camposInvalidos[name]) {
      setCamposInvalidos((prev) => {
        const novo = { ...prev };
        delete novo[name];
        return novo;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    const campos = {};
    if (!form.nome) campos.nome = true;
    if (!form.custo) campos.custo = true;
    if (!form.categoria) campos.categoria = true;
    if (!form.unidade) campos.unidade = true;
    if (!form.taxaDesperdicio) campos.taxaDesperdicio = true;

    if (Object.keys(campos).length > 0) {
      setCamposInvalidos(campos);
      toast.error("Preencha todos os campos obrigatórios!");
      setIsSubmitting(false);
      return;
    }

    const ingredienteFormatado = {
      nome: form.nome,
      unidadeDeMedida: form.unidade,
      custo: parseFloat(form.custo.replace(",", ".")),
      indiceDeDesperdicio: parseFloat(form.taxaDesperdicio.replace(",", ".")),
      categoria: form.categoria,
    };

    try {
      if (onSave) {
        await onSave(ingredienteFormatado); // O pai faz o fetch!
      }
      handleClose();
    } catch (error) {
      toast.error("Erro ao cadastrar ingrediente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${styles.modalOverlay} ${isClosing ? styles.modalExit : styles.modalEnter}`}>
      <div className={`${styles.modalContainer} shadow`}>
        <div className={styles.modalHeader}>
          <h5>Cadastrar Ingrediente</h5>
          <button onClick={handleClose} className={styles.btnClose}>
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                <label>Nome do Ingrediente</label>
                <input
                  name="nome"
                  autoComplete="off"
                  className={`form-control ${camposInvalidos.nome ? styles.erroInput : ""}`}
                  value={form.nome}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Custo de Compra (R$)</label>
                <input
                  name="custo"
                  autoComplete="off"
                  className={`form-control ${camposInvalidos.custo ? styles.erroInput : ""}`}
                  inputMode="decimal"
                  value={form.custo}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Categoria</label>
                <select
                  name="categoria"
                  className={`form-control ${camposInvalidos.categoria ? styles.erroInput : ""}`}
                  value={form.categoria}
                  onChange={handleChange}
                >
                  <option value="">Selecione...</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Unidade de Medida</label>
                <select
                  name="unidade"
                  className={`form-control ${camposInvalidos.unidade ? styles.erroInput : ""}`}
                  value={form.unidade}
                  onChange={handleChange}
                >
                  <option value="">Selecione...</option>
                  <option value="kg">Quilo (kg)</option>
                  <option value="L">Litro (L)</option>
                  <option value="un">Unidade (un.)</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Taxa de Desperdício (%)</label>
                <input
                  name="taxaDesperdicio"
                  autoComplete="off"
                  className={`form-control ${camposInvalidos.taxaDesperdicio ? styles.erroInput : ""}`}
                  inputMode="decimal"
                  value={form.taxaDesperdicio}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnCancel} onClick={handleClose} disabled={isSubmitting}>
                Cancelar
              </button>
              <button type="submit" className={styles.btnSave} disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ModalCadastroIngrediente;