import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "../../../Styles/global.css";
import styles from "./ModalCadastroDespesa.module.css";
import { IoWalletSharp } from "react-icons/io5";

function ModalEditaDespesa({ despesa, onClose, onSave }) {
  const [form, setForm] = useState({
    nome: "",
    custoMensal: "",
    tempoOperacional: "",
  });

  const [isClosing, setIsClosing] = useState(false);
  const [camposInvalidos, setCamposInvalidos] = useState({});

  useEffect(() => {
    if (despesa) {
      setForm({
        nome: despesa.nome || "",
        custoMensal: despesa.custoMensal?.toString().replace(".", ",") || "",
        tempoOperacional: despesa.tempoOperacional?.toString().replace(".", ",") || "",
      });
    }
  }, [despesa]);

  const handleClose = () => setIsClosing(true);

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => onClose(), 300);
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue =
      name === "custoMensal" || name === "tempoOperacional"
        ? value.replace(/[^\d,]/g, "").replace(/(,.*?),/g, "$1")
        : value;

    setForm((prev) => ({ ...prev, [name]: newValue }));

    if (camposInvalidos[name]) {
      setCamposInvalidos((prev) => {
        const novo = { ...prev };
        delete novo[name];
        return novo;
      });
    }
  };

  const handleSubmit = () => {
    const campos = {};
    if (!form.nome.trim()) campos.nome = true;
    if (!form.custoMensal) campos.custoMensal = true;
    if (!form.tempoOperacional) campos.tempoOperacional = true;

    if (Object.keys(campos).length > 0) {
      setCamposInvalidos(campos);
      toast.error("Preencha todos os campos obrigatórios!");
      return;
    }

    const despesaAtualizada = {
      id: despesa.id, // importante para o PUT
      nome: form.nome.trim(),
      custoMensal: parseFloat(form.custoMensal.replace(",", ".")),
      tempoOperacional: parseFloat(form.tempoOperacional.replace(",", ".")),
    };

    onSave?.(despesaAtualizada); // essa função externa deve fazer o PUT
    handleClose();
  };

  const salvarDespesa = async (despesaEditada) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:3001/api/despesas/${despesaEditada.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
        body: new URLSearchParams({
          nome: despesaEditada.nome,
          custoMensal: despesaEditada.custoMensal,
          tempoOperacional: despesaEditada.tempoOperacional,
        }),
      });

      if (!response.ok) throw new Error("Erro ao salvar despesa");

      toast.success("Despesa atualizada com sucesso!");
      // Atualize a lista de despesas aqui se necessário
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar a despesa.");
    }
  };

  return (
    <div className={`${styles.modalOverlay} ${isClosing ? styles.modalExit : styles.modalEnter}`}>
      <div className={`${styles.modalContainer} shadow`}>
        <div className={styles.modalHeader}>
          <div className={styles.headerIconTitle}>
            <IoWalletSharp className={styles.walletIcon} />
            <h5>Editar Despesa</h5>
          </div>
          <button onClick={handleClose} className={styles.btnClose}>
            &times;
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.colSpan2}`}>
              <label>Nome da Despesa</label>
              <input
                name="nome"
                autoComplete="off"
                className={`form-control ${camposInvalidos.nome ? styles.erroInput : ""}`}
                value={form.nome}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Custo Mensal (R$)</label>
              <input
                name="custoMensal"
                autoComplete="off"
                className={`form-control ${camposInvalidos.custoMensal ? styles.erroInput : ""}`}
                inputMode="decimal"
                value={form.custoMensal}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Tempo Operacional (horas)</label>
              <input
                name="tempoOperacional"
                autoComplete="off"
                className={`form-control ${camposInvalidos.tempoOperacional ? styles.erroInput : ""}`}
                inputMode="decimal"
                value={form.tempoOperacional}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={handleClose}>
            Cancelar
          </button>
          <button className={styles.btnSave} onClick={handleSubmit}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalEditaDespesa;
