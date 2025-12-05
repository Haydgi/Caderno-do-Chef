import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "../../../Styles/global.css";
import styles from "./ModalCadastroDespesa.module.css";
import { FaInfoCircle } from "react-icons/fa";

function ModalCadastroDespesa({ onClose, onSave }) {
  const [form, setForm] = useState({
    nome: "",
    custoMensal: "",
    tempoOperacional: "",
  });

  const [isClosing, setIsClosing] = useState(false);
  const [camposInvalidos, setCamposInvalidos] = useState({});

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const campos = {};
    let mensagemErro = null;

    const nomeTrim = form.nome.trim();
    const custoValor = parseFloat(form.custoMensal.replace(",", "."));
    const tempoValor = parseFloat(form.tempoOperacional.replace(",", "."));

    if (!nomeTrim) campos.nome = true;
    if (!form.custoMensal || Number.isNaN(custoValor)) campos.custoMensal = true;

    if (!form.tempoOperacional || Number.isNaN(tempoValor)) {
      campos.tempoOperacional = true;
    } else if (tempoValor < 1 || tempoValor > 24) {
      campos.tempoOperacional = true;
      mensagemErro = "Tempo operacional deve ser um valor entre 1 e 24 horas.";
    }

    if (Object.keys(campos).length > 0) {
      setCamposInvalidos(campos);
      toast.error(mensagemErro || "Preencha todos os campos obrigatórios!");
      return;
    }

    const despesa = {
      nome: nomeTrim,
      custoMensal: custoValor,
      tempoOperacional: tempoValor,
    };

    try {
      const token = localStorage.getItem("token");
      console.log('🔑 Token disponível:', token ? 'sim' : 'não');
      console.log('📦 Dados da despesa a serem enviados:', despesa);

      if (!token) {
        toast.error("Usuário não autenticado");
        return;
      }

      const response = await fetch("http://localhost:3001/api/despesas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(despesa),
      });
      
      console.log('📊 Status da resposta POST:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Despesa criada com sucesso:', data);
        console.log('🔄 Chamando onSave com dados:', data);
        onSave?.(data);
        handleClose();
      } else {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch {
          // resposta não é JSON, ignora
        }
        toast.error(errorData.error || "Erro ao cadastrar despesa");
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor");
      console.error(error);
    }
  };

  return (
    <div
      className={`${styles.modalOverlay} ${
        isClosing ? styles.modalExit : styles.modalEnter
      }`}
    >
      <div className={`${styles.modalContainer} shadow`}>
        <div className={styles.modalHeader}>
          <div className={styles.headerIconTitle}>
            <h5>Cadastrar Despesa</h5>
          </div>
          <button onClick={handleClose} className={styles.btnClose}>
            &times;
          </button>
        </div>

        <form className={styles.modalBody} onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.colSpan2}`}>
              <label>Nome da Despesa</label>
              <input
                name="nome"
                autoComplete="off"
                className={`form-control ${
                  camposInvalidos.nome ? styles.erroInput : ""
                }`}
                value={form.nome}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Custo Mensal (R$)</label>
              <input
                name="custoMensal"
                autoComplete="off"
                className={`form-control ${
                  camposInvalidos.custoMensal ? styles.erroInput : ""
                }`}
                inputMode="decimal"
                value={form.custoMensal}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.labelWithInfo}>
                Tempo Operacional (horas)
                <span className={styles.infoWrapper} tabIndex={0}>
                  <FaInfoCircle className={styles.infoIcon} aria-hidden="true" />
                  <span className={styles.tooltip} role="tooltip">
                    Nesse campo insira quantas horas por dia você mantém essa despesa gastando. Exemplos: Luz 24h ou Funcionários 8h.
                  </span>
                </span>
              </label>
              <input
                name="tempoOperacional"
                autoComplete="off"
                className={`form-control ${
                  camposInvalidos.tempoOperacional ? styles.erroInput : ""
                }`}
                inputMode="decimal"
                value={form.tempoOperacional}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={handleClose}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.btnSave}>
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalCadastroDespesa;
