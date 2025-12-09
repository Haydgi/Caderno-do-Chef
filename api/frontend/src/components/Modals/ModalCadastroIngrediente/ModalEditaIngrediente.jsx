import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "../../../Styles/global.css";
import styles from "./ModalCadastroIngrediente.module.css";

function ModalEditaIngrediente({ onClose, onSave, ingrediente }) {
  const [form, setForm] = useState({
    nome: "",
    custo: "",
    categoria: "",
    unidade: "",
    taxaDesperdicio: "",
  });

  const [isClosing, setIsClosing] = useState(false);
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

  useEffect(() => {
    if (ingrediente) {
      console.log('Ingrediente recebido para edição:', ingrediente);
      setForm({
        nome: ingrediente.nome || ingrediente.Nome_Ingrediente || "",
        custo: (ingrediente.preco || ingrediente.Custo_Ingrediente || ingrediente.custo || 0).toString().replace(".", ","),
        categoria: ingrediente.categoria || ingrediente.Categoria || "",
        unidade: ingrediente.unidadeCompra || ingrediente.Unidade_De_Medida || ingrediente.unidade || "",
        taxaDesperdicio: (ingrediente.Indice_de_Desperdicio || ingrediente.taxaDesperdicio || 0).toString().replace(".", ","),
      });
    }
  }, [ingrediente]);

  const handleClose = () => {
    setIsClosing(true);
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

  const handleSubmit = async () => {
    const campos = {};

    if (!form.nome) campos.nome = true;
    if (!form.custo) campos.custo = true;
    if (!form.categoria) campos.categoria = true;
    if (!form.unidade) campos.unidade = true;
    if (!form.taxaDesperdicio) campos.taxaDesperdicio = true;

    if (Object.keys(campos).length > 0) {
      setCamposInvalidos(campos);
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Usuário não autenticado.");
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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/ingredientes/${ingrediente.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
        },
        body: JSON.stringify(ingredienteFormatado),
      });

      const data = await response.json();

      if (!response.ok || data.error || data.success === false) {
        throw new Error(data.message || "Erro ao atualizar o ingrediente.");
      }

      // Apenas sinaliza para o pai atualizar a lista; não enviar payload de volta para evitar PUT duplicado
      if (onSave) {
        await onSave();
      }

      handleClose();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar o ingrediente.');
    }

  };

  return (
    <div className={`${styles.modalOverlay} ${isClosing ? styles.modalExit : styles.modalEnter}`}>
      <div className={`${styles.modalContainer} shadow`}>
        <div className={styles.modalHeader}>
          <h5>Editar Ingrediente</h5>
          <button onClick={handleClose} className={styles.btnClose}>&times;</button>
        </div>

        <div className={styles.modalBody}>
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
                  <option key={cat} value={cat}>{cat}</option>
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
                <option value="g">Grama (g)</option>
                <option value="mg">Miligrama (mg)</option>
                <option value="L">Litro (L)</option>
                <option value="ml">Mililitro (ml)</option>
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
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnCancel} onClick={handleClose}>Cancelar</button>
          <button type="button" className={styles.btnSave} onClick={handleSubmit}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

export default ModalEditaIngrediente;