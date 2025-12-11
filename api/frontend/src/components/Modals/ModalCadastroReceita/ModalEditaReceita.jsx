import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import "../../../Styles/global.css";
import styles from "./ModalCadastroReceita.module.css";
import { FaTrash } from 'react-icons/fa';
import { GiKnifeFork } from "react-icons/gi";
import { showPermissionDeniedOnce } from "../../../utils/permissionToast";
import { getApiBaseUrl } from "../../../utils/api";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ALLOWED_RECIPE_CATEGORIES } from '../../../utils/recipeCategories';

function ModalEditaReceita({ onClose, onSave, receita }) {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    imagem: null,
    nome: "",
    categoria: "",

    tempoDePreparo: "",
    porcentagemDeLucro: "",
    descricao: "",
    custoTotalIngredientes: "0.00",
    id: null,
    imagemRemovida: false, // Flag para indicar se a imagem foi removida
  });

  const [ingredienteBusca, setIngredienteBusca] = useState("");
  const [ingredientesSelecionados, setIngredientesSelecionados] = useState([]);
  const [ingredientesDisponiveis, setIngredientesDisponiveis] = useState([]);
  const [isClosing, setIsClosing] = useState(false);
  const [camposInvalidos, setCamposInvalidos] = useState({});
  const [despesas, setDespesas] = useState([]);
  const [despesasLoading, setDespesasLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categorias = ALLOWED_RECIPE_CATEGORIES;

  // Busque ingredientes do banco ao montar o modal
  useEffect(() => {
    async function fetchIngredientes() {
      try {
        const token = localStorage.getItem("token");
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/ingredientes?limit=1000`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setIngredientesDisponiveis(data);
      } catch (err) {
        toast.error("Erro ao buscar ingredientes do banco!");
      }
    }
    fetchIngredientes();
  }, []);

  useEffect(() => {
    console.log('📄 Receita recebida no modal:', receita);
    console.log('🔍 Campos de imagem na receita:', {
      imagem_URL: receita?.imagem_URL,
      Imagem_URL: receita?.Imagem_URL,
      ID_Receita: receita?.ID_Receita,
      id: receita?.id
    });

    if (!receita?.ID_Receita && !receita?.id) {
      console.log('⚠️ Nenhuma receita válida recebida');
      return;
    }

    async function fetchReceitaDetalhada() {
      try {
        const token = localStorage.getItem("token");
        const baseUrl = getApiBaseUrl();
        const id = receita.ID_Receita || receita.id;

        console.log('🔄 Buscando receita detalhada com ID:', id);

        const res = await fetch(`${baseUrl}/api/receita-detalhada/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error('❌ Erro na resposta da API:', res.status, errorData);
          toast.error(`Erro ao buscar receita: ${errorData.error || 'Erro desconhecido'}`);
          return;
        }

        const data = await res.json();
        console.log("✅ Receita detalhada recebida:", data);
        console.log("Campo imagem_URL:", data.imagem_URL);

        // Determina a URL da imagem (do endpoint ou da receita passada)
        const imagemUrl = data.imagem_URL || receita?.imagem_URL || receita?.Imagem_URL || null;
        console.log('🇺🇷L da imagem determinada:', imagemUrl);

        // Atualize o estado com os dados detalhados
        setForm({
          imagem: imagemUrl, // URL da imagem (string) ou null
          nome: data.Nome_Receita || "",
          categoria: data.Categoria || "",
          tempoDePreparo: data.Tempo_Preparo || "",
          porcentagemDeLucro: data.Porcentagem_De_Lucro || "",
          descricao: data.Descricao || "",
          custoTotalIngredientes: data.Custo_Total_Ingredientes || "0.00",
          id: data.ID_Receita || data.id || null,
          imagemRemovida: false, // Reset da flag ao carregar
        });

        console.log("Estado do form após carregar:", {
          imagem: imagemUrl,
          temImagem: !!(imagemUrl && imagemUrl.trim() !== ""),
          imagemRemovida: false
        });
        setIngredientesSelecionados(
          (data.ingredientes || []).map(i => {
            const unidade = i.unidade || i.Unidade_De_Medida || i.Unidade;

            return {
              ID_Ingredientes: i.ID_Ingredientes,
              nome: i.nome || i.Nome_Ingrediente,
              unidade,
              quantidade: i.quantidade || i.Quantidade_Utilizada || "",
              quantidade_total:
                i.quantidade_total ||
                i.Quantidade_Total ||
                calcularQuantidadeTotalPadrao(unidade),
              custo_ingrediente: i.custo_ingrediente || i.Custo_Ingrediente || 0,
              Indice_de_Desperdicio: i.Indice_de_Desperdicio || 0,
            };
          })
        );
      } catch (err) {
        console.error("❌ Erro ao buscar detalhes da receita:", err);
        toast.error(`Erro ao buscar detalhes da receita: ${err.message}`);
      }
    }

    fetchReceitaDetalhada();
  }, [receita]);

  const handleClose = () => setIsClosing(true);

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => onClose(), 300);
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "tempoDePreparo" || name === "porcentagemDeLucro") {
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

  const handleImageChange = (e) => {
    const arquivo = e.target.files[0];

    if (arquivo) {
      // Validações do arquivo
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const tamanhoMaximo = 5 * 1024 * 1024; // 5MB

      if (!tiposPermitidos.includes(arquivo.type)) {
        toast.error(`Formato de imagem não aceito! O arquivo "${arquivo.name}" tem formato ${arquivo.type}. Apenas imagens JPG, PNG e WEBP são permitidas.`);
        e.target.value = ''; // Limpa o input
        return;
      }

      if (arquivo.size > tamanhoMaximo) {
        const tamanhoMB = (arquivo.size / (1024 * 1024)).toFixed(1);
        toast.error(`Imagem muito grande! O arquivo "${arquivo.name}" tem ${tamanhoMB}MB. O tamanho máximo permitido é 5MB.`);
        e.target.value = ''; // Limpa o input
        return;
      }

      setForm((prev) => ({
        ...prev,
        imagem: arquivo,
        imagemRemovida: false // Reset da flag quando nova imagem é selecionada
      }));
      toast.success('Nova imagem carregada com sucesso!');
    } else {
      setForm((prev) => ({ ...prev, imagem: null }));
    }
  };

  const handleSelectIngrediente = (ingrediente) => {
    setIngredientesSelecionados((prev) => [
      ...prev,
      {
        ID_Ingredientes: ingrediente.ID_Ingredientes, // <-- ESSENCIAL!
        nome: ingrediente.Nome_Ingrediente || ingrediente.nome,
        unidade: ingrediente.Unidade_De_Medida || ingrediente.unidade,
        quantidade: "", // o usuário irá preencher depois
        quantidade_total:
          ingrediente.Quantidade_Total ??
          ingrediente.quantidade_total ??
          calcularQuantidadeTotalPadrao(ingrediente.Unidade_De_Medida || ingrediente.unidade),
        custo_ingrediente: ingrediente.Custo_Ingrediente ?? ingrediente.custo_ingrediente,
        Indice_de_Desperdicio: ingrediente.Indice_de_Desperdicio ?? 0,
      },
    ]);

    setIngredienteBusca("");
  };

  const handleIngredienteChange = (index, field, value) => {
    const novos = [...ingredientesSelecionados];
    novos[index][field] = value === "" ? 0 : value;
    setIngredientesSelecionados(novos);

    if (field === "quantidade" && camposInvalidos[`ingrediente_${index}`]) {
      setCamposInvalidos((prev) => {
        const novo = { ...prev };
        delete novo[`ingrediente_${index}`];
        return novo;
      });
    }
  };

  const handleRemoverIngrediente = (index) => {
    setIngredientesSelecionados((prevSelecionados) => {
      const ingredienteRemovido = prevSelecionados[index];

      setIngredientesDisponiveis((prevDisponiveis) => {
        const jaExiste = prevDisponiveis.some(
          (i) => i.nome === ingredienteRemovido.nome
        );
        if (jaExiste) return prevDisponiveis;

        return [...prevDisponiveis, {
          nome: ingredienteRemovido.nome,
          unidade: ingredienteRemovido.unidade,
        }];
      });

      return prevSelecionados.filter((_, i) => i !== index);
    });
  };

  // Função reutilizável para buscar despesas (retorna o array)
  async function fetchDespesas() {
    setDespesasLoading(true);
    try {
      const token = localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/despesas/calculo`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        console.error("Erro ao buscar despesas para cálculo:", res.status);
        setDespesas([]);
        return [];
      }
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setDespesas(arr);
      console.log("Despesas carregadas para cálculo:", arr);
      return arr;
    } catch (err) {
      console.error("Erro ao buscar despesas:", err);
      setDespesas([]);
      return [];
    } finally {
      setDespesasLoading(false);
    }
  }

  useEffect(() => {
    fetchDespesas();
  }, []);

  const calcularCustoPorMinutoDespesa = (despesa) => {
    const diasNoMes = 30;
    const custoMensal = Number(despesa.Custo_Mensal);
    const tempoDia = Number(despesa.Tempo_Operacional);

    if (!custoMensal || !tempoDia) return 0;

    const custoDiario = custoMensal / diasNoMes;
    const custoPorHora = custoDiario / tempoDia;
    return custoPorHora / 60;
  };

  const calcularCustoIngrediente = (quantidadeUsada, quantidadeTotal, custoIngrediente, indiceDesperdicio = 0) => {
    if (!quantidadeUsada || !quantidadeTotal || !custoIngrediente) return 0;
    const proporcao = Number(quantidadeUsada) / Number(quantidadeTotal);
    const custoBase = proporcao * Number(custoIngrediente);
    const custoFinal = custoBase * (1 + Number(indiceDesperdicio) / 100);
    return custoFinal;
  };

  const calcularCustoTotalReceita = ({ ingredientes, tempo_preparo_min, despesas }) => {
    const custoIngredientes = ingredientes.reduce((total, item) => total + item.custo_calculado, 0);
    const lista = Array.isArray(despesas) ? despesas : [];
    const custoOperacionalPorMinuto = lista.reduce((total, despesa) => {
      const custoMinuto = calcularCustoPorMinutoDespesa(despesa);
      return total + (isNaN(custoMinuto) ? 0 : custoMinuto);
    }, 0);
    const custoOperacionalReceita = custoOperacionalPorMinuto * tempo_preparo_min;
    const custoTotal = custoIngredientes + custoOperacionalReceita;

    return {
      custoIngredientes,
      custoOperacionalReceita,
      custoTotal
    };
  };

  const calcularPrecoFinalComLucro = (custo, porcentagemLucro) => {
    return Number(custo) + (Number(custo) * (Number(porcentagemLucro) / 100));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Garanta que temos despesas: se não houver, tente buscar antes de abortar
    let despesasToUse = Array.isArray(despesas) ? despesas : [];
    if (!despesasToUse || despesasToUse.length === 0) {
      const fetched = await fetchDespesas();
      despesasToUse = Array.isArray(fetched) ? fetched : [];
      if (!despesasToUse || despesasToUse.length === 0) {
        toast.error("Despesas não carregadas. Tente novamente.");
        return;
      }
    }

    setIsSubmitting(true);

    // Log ingredientes e despesas
    console.log("==== Ingredientes selecionados ====");
    console.table(ingredientesSelecionados);
    console.log("==== Despesas carregadas do banco ====");
    console.table(despesasToUse);

    // Log detalhado do cálculo dos ingredientes
    ingredientesSelecionados.forEach((ing, idx) => {
      const quantidadeUsada = Number(ing.quantidade);
      const quantidadeTotal = Number(ing.quantidade_total);
      const custoIngrediente = Number(ing.custo_ingrediente);
      const indiceDesperdicio = Number(ing.Indice_de_Desperdicio) || 0;

      const proporcao = quantidadeUsada / quantidadeTotal;
      const custoBase = proporcao * custoIngrediente;
      const fatorDesperdicio = 1 + (indiceDesperdicio / 100);
      const custoFinal = custoBase * fatorDesperdicio;

      console.log(`--- Ingrediente #${idx + 1}: ${ing.nome} ---`);
      console.log(`Qtd usada: ${quantidadeUsada}`);
      console.log(`Qtd total: ${quantidadeTotal}`);
      console.log(`Custo ingrediente: ${custoIngrediente}`);
      console.log(`Índice de desperdício: ${indiceDesperdicio}%`);
      console.log(`Cálculo base: (${quantidadeUsada} / ${quantidadeTotal}) * ${custoIngrediente} = ${custoBase}`);
      console.log(`Aplicando desperdício: ${custoBase} * ${fatorDesperdicio} = ${custoFinal}`);
      console.log(`Custo calculado final: ${custoFinal}`);
    });

    // Log detalhado do cálculo operacional
    despesasToUse.forEach((desp, idx) => {
      const custoMinuto = calcularCustoPorMinutoDespesa(desp);
      console.log(
        `Despesa #${idx + 1}:`,
        `Nome: ${desp.Nome_Despesa}`,
        `Custo mensal: ${desp.Custo_Mensal}`,
        `Tempo operacional: ${desp.Tempo_Operacional}`,
        `Custo por minuto: ${custoMinuto}`
      );
    });

    const tempo_preparo_min = Number(form.tempoDePreparo);

    const resultado = calcularCustoTotalReceita({
      ingredientes: ingredientesSelecionados.map(i => ({
        ...i,
        custo_calculado: calcularCustoIngrediente(
          i.quantidade,
          i.quantidade_total,
          i.custo_ingrediente,
          i.Indice_de_Desperdicio
        )
      })),
      tempo_preparo_min,
      despesas: despesasToUse
    });

    console.log("==== Resultado final do cálculo ====");
    console.log("Custo ingredientes:", resultado.custoIngredientes);
    console.log("Custo operacional:", resultado.custoOperacionalReceita);
    console.log("Custo total:", resultado.custoTotal);

    const precoFinal = calcularPrecoFinalComLucro(resultado.custoTotal, form.porcentagemDeLucro);
    console.log("Preço final com lucro:", precoFinal);

    try {
      const token = localStorage.getItem("token");
      const baseUrl = getApiBaseUrl();
      const formData = new FormData();
      formData.append('Nome_Receita', form.nome || "");
      formData.append('Descricao', form.descricao || "");
      formData.append('Tempo_Preparo', Number(form.tempoDePreparo) || 0);
      formData.append('Custo_Total_Ingredientes', Number(precoFinal));
      formData.append('Porcentagem_De_Lucro', Number(form.porcentagemDeLucro) || 0);
      formData.append('Categoria', form.categoria || "");

      // Controle de imagem
      if (form.imagemRemovida) {
        formData.append('remover_imagem', 'true');
      } else if (form.imagem instanceof File) {
        formData.append('imagem_URL', form.imagem);
      }
      // Se nem removida nem nova imagem, mantém a imagem atual
      const ingredientesCorrigidos = ingredientesSelecionados.map(i => ({
        ID_Ingredientes: i.ID_Ingredientes, // <-- ESSENCIAL!
        nome: i.nome,
        unidade: i.unidade,
        quantidade: Number(i.quantidade),
        quantidade_total: Number(i.quantidade_total),
        custo_ingrediente: Number(i.custo_ingrediente),
        Indice_de_Desperdicio: Number(i.Indice_de_Desperdicio)
      }));
      formData.append('ingredientes', JSON.stringify(ingredientesCorrigidos));
      console.log('Dados para enviar no PUT:', ingredientesCorrigidos);

      const res = await fetch(`${baseUrl}/api/receitas/${form.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      // Log dos dados enviados
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }

      if (!res.ok) {
        let msg = "Erro ao atualizar receita!";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch { }
        throw new Error(msg);
      }

      // Atualiza os ingredientes da receita no banco
      const ingredientesParaEnviar = ingredientesSelecionados.map(i => ({
        ID_Ingredientes: i.ID_Ingredientes,
        Quantidade_Utilizada: Number(i.quantidade),
        Unidade_De_Medida: i.unidade
      }));

      // Validação antes do envio
      for (const ing of ingredientesParaEnviar) {
        if (
          !ing.ID_Ingredientes ||
          isNaN(ing.ID_Ingredientes) ||
          !ing.Quantidade_Utilizada ||
          isNaN(ing.Quantidade_Utilizada)
        ) {
          toast.error("Preencha todos os ingredientes corretamente!");
          setIsSubmitting(false);
          return;
        }
      }

      console.log("Ingredientes para enviar:", ingredientesParaEnviar);

      // Envio para o backend
      await fetch(`${baseUrl}/api/receita-detalhada/${form.id}/ingredientes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ingredientes: ingredientesParaEnviar }),
      });

      toast.success("Receita atualizada com sucesso!");
      onSave();
      handleClose();
    } catch (err) {
      toast.error(err.message || "Erro ao atualizar receita!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calcularQuantidadeTotalPadrao = (unidade) => {
    const u = (unidade || "").toLowerCase().trim();

    if (u === "kg") return 1000;
    if (u === "hg") return 100;
    if (u === "dag") return 10;
    if (u === "g") return 1;
    if (u === "dg") return 0.1;
    if (u === "cg") return 0.01;
    if (u === "mg") return 0.001;

    if (u === "kl") return 1000000;
    if (u === "hl") return 100000;
    if (u === "dal") return 10000;
    if (u === "l") return 1000;
    if (u === "dl") return 100;
    if (u === "cl") return 10;
    if (u === "ml") return 1;

    if (u === "un" || u === "unidade" || u === "unidades") return 30;

    return 1;
  };

  // Função para exibir unidade padrão amigável
  function unidadePadraoExibicao(unidade) {
    if (!unidade) return "";
    const u = unidade.toLowerCase().trim();
    // Massa
    if (["kg", "hg", "dag", "g", "dg", "cg", "mg"].includes(u)) return "g";
    // Volume
    if (["kl", "hl", "dal", "l", "dl", "cl", "ml"].includes(u)) return "ml";
    // Contáveis
    if (["un", "unidade", "unidades", "dúzia", "duzia"].includes(u)) return "un";
    return unidade;
  }

  const unidadeCorrigida = (unidade) => {
    if (!unidade) return "";
    const u = unidade.toLowerCase();
    if (u === "eu") return "ml"; // ou "g", conforme o caso
    return unidade;
  };

  return (
    <div className={`${styles.modalOverlay} ${isClosing ? styles.modalExit : styles.modalEnter}`}>
      <div className={`${styles.modalContainer} shadow`}>
        <div className={styles.modalHeader}>
          <h5>Editar Receita</h5>
          <button onClick={handleClose} className={styles.btnClose}>&times;</button>
        </div>

        <div className={styles.modalBody}>
          <div className="row" style={{ columnGap: '12px' }}>
            <div className="col-6" style={{ flex: '1' }}>
              {/* Coluna da imagem */}
              <div className={`${styles.imageFormGroup} align-items-center mb-3`}>
                <label className="mb-2" style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--rich-black)' }}>Imagem da Receita</label>
                <div
                  className={styles.imageUploadContainer}
                  style={{ cursor: 'pointer' }}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  {(() => {
                    console.log('🔍 Debug Modal Preview:', {
                      'form.imagem': form.imagem,
                      'tipo': typeof form.imagem,
                      'isFile': form.imagem instanceof File,
                      'isEmpty': !form.imagem || form.imagem === '',
                      'imagemRemovida': form.imagemRemovida,
                      'condicaoString': form.imagem && typeof form.imagem === 'string' && form.imagem.trim() !== "" && !form.imagemRemovida
                    });

                    if (form.imagem instanceof File) {
                      console.log('✅ Mostrando imagem nova (File)');
                      return (
                        <div className={styles.imagePreview}>
                          <div
                            style={{
                              backgroundImage: `url(${URL.createObjectURL(form.imagem)})`,
                              backgroundSize: "contain",
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "center",
                              width: "100%",
                              height: "100%",
                              borderRadius: "10px"
                            }}
                          />
                        </div>
                      );
                    } else if (form.imagem && typeof form.imagem === 'string' && form.imagem.trim() !== "" && !form.imagemRemovida) {
                      // Corrige quando o backend já envia a URL completa (ex: https://host/uploads/arquivo.jpg)
                      const baseUrl = getApiBaseUrl();
                      const raw = form.imagem.trim();
                      const imageUrl = raw.startsWith('http') ? raw : `${baseUrl}/uploads/${raw}`;
                      console.log('✅ Mostrando imagem existente (resolvida):', imageUrl);
                      return (
                        <div className={styles.imagePreview}>
                          <div
                            style={{
                              backgroundImage: `url(${imageUrl})`,
                              backgroundSize: "contain",
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "center",
                              width: "100%",
                              height: "100%",
                              borderRadius: "10px"
                            }}
                          />
                        </div>
                      );
                    } else {
                      console.log('⭕ Mostrando estado vazio');
                      return (
                        <div className={styles.emptyImageState}>
                          <i className="bi bi-image" style={{ fontSize: '2.5rem', color: 'var(--ultra-violet)', opacity: 0.5 }}></i>
                          <p style={{ margin: '8px 0 2px', fontSize: '0.85rem', color: 'var(--ultra-violet)', fontWeight: '500' }}>Clique para adicionar</p>
                          <span style={{ fontSize: '0.7rem', color: '#888' }}>JPG, JPEG ou PNG (até 5MB)</span>
                        </div>
                      );
                    }
                  })()}
                </div>
                <input
                  id="imagemInputEdit"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                {(form.imagem instanceof File || (form.imagem && typeof form.imagem === 'string' && form.imagem.trim() !== "" && !form.imagemRemovida)) && (
                  <div className="d-flex gap-2 mt-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary flex-fill"
                      onClick={() => fileInputRef.current?.click()}
                      title="Editar imagem"
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger flex-fill"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          imagem: null,
                          imagemRemovida: true
                        }));
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        toast.info('Imagem removida');
                      }}
                      title="Remover imagem"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                )}
              </div>

              {/* Nome da Receita */}
              <div className={styles.formGroup} style={{ marginTop: '35px' }}>
                <label>
                  <span className={styles.requiredAsterisk} data-tooltip="Este item é obrigatório.">*</span>
                  Nome da Receita
                </label>
                <input
                  name="nome"
                  autoComplete="off"
                  className={`form-control ${camposInvalidos.nome ? styles.erroInput : ""}`}
                  value={form.nome}
                  onChange={handleChange}
                  placeholder="Ex: Bolo de Chocolate"
                />
              </div>

              {/* Categoria */}
              <div className={`${styles.formGroup} mt-2`}>
                <label>
                  Categoria
                </label>
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

              {/* Linha com Tempo de Preparo e Porcentagem de Lucro */}
              <div className="row mt-2">
                <div className="col-6">
                  <div className={styles.formGroup}>
                    <label>
                      <span className={styles.requiredAsterisk} data-tooltip="Este item é obrigatório.">*</span>
                      Tempo de Preparo (Min.)
                    </label>
                    <input
                      name="tempoDePreparo"
                      autoComplete="off"
                      className={`form-control ${camposInvalidos.tempoDePreparo ? styles.erroInput : ""}`}
                      inputMode="decimal"
                      value={form.tempoDePreparo}
                      onChange={handleChange}
                      placeholder="Ex: 120"
                    />
                  </div>
                </div>
                <div className="col-6">
                  <div className={styles.formGroup}>
                    <label style={{ fontSize: '0.9rem' }}>
                      <span className={styles.requiredAsterisk} data-tooltip="Este item é obrigatório.">*</span>
                      Porcentagem de Lucro (%)
                    </label>
                    <input
                      name="porcentagemDeLucro"
                      autoComplete="off"
                      className={`form-control ${camposInvalidos.porcentagemDeLucro ? styles.erroInput : ""}`}
                      inputMode="decimal"
                      value={form.porcentagemDeLucro}
                      onChange={handleChange}
                      placeholder="Ex: 20"
                    />
                  </div>
                </div>
              </div>

              <div className={`${styles.formGroup} mt-2`}>
                <label className="mb-2 d-flex justify-content-center" style={{ fontFamily: 'Birthstone, cursive', fontSize: '1.8rem' }}>Modo de Preparo</label>
                <ReactQuill
                  theme="snow"
                  value={form.descricao}
                  onChange={(content) => setForm(prev => ({ ...prev, descricao: content }))}
                  placeholder="Descreva aqui o modo de preparo (opcional)..."
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline'],
                      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                      ['clean']
                    ]
                  }}
                  style={{ height: '90px', marginBottom: '50px' }}
                />
              </div>
            </div>

            <div className="col-6" style={{ flex: '1' }}>
              <div>
                <div className={`${styles.formGroup} ${styles.suggestionsContainer}`}>
                  <label className="mb-1">
                    <span className={`${styles.requiredAsterisk} ${styles.requiredAsteriskBelow}`} data-tooltip="Este item é obrigatório.">*</span>
                    Buscar Ingrediente
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={ingredienteBusca}
                    onChange={(e) => setIngredienteBusca(e.target.value)}
                    onFocus={async () => {
                      try {
                        const token = localStorage.getItem("token");
                        const baseUrl = getApiBaseUrl();
                        const res = await fetch(`${baseUrl}/api/ingredientes?limit=1000`, {
                          headers: {
                            "Authorization": `Bearer ${token}`,
                          },
                        });
                        const data = await res.json();
                        setIngredientesDisponiveis(data);
                      } catch (err) {
                        toast.error("Erro ao buscar ingredientes do banco!");
                      }
                    }}
                    placeholder="Digite para buscar..."
                  />
                  {ingredienteBusca && (
                    <ul className={styles.suggestionsList}>
                      {ingredientesDisponiveis
                        .filter(i =>
                          i.Nome_Ingrediente &&
                          i.Nome_Ingrediente.toLowerCase().includes(ingredienteBusca.toLowerCase()) &&
                          !ingredientesSelecionados.some(sel => sel.nome === i.Nome_Ingrediente)
                        )
                        .map(i => (
                          <li key={i.ID_Ingredientes} onClick={() => handleSelectIngrediente(i)}>
                            {i.Nome_Ingrediente} <span className="text-muted">({i.Unidade_De_Medida})</span>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>

                <div className="d-flex justify-content-center">
                  <label className="mt-2 mb-2" style={{ fontFamily: 'Birthstone, cursive', fontSize: '1.8rem' }}>Ingredientes da Receita</label>
                </div>
                <div className={styles.ingredientesBox}>
                  <div className={styles.tabelaCabecalho}>
                    <span className={styles.nomeIngrediente}>Nome</span>
                    <span>Quantidade</span>
                    <span className="d-flex justify-content-center">Unidade</span>
                  </div>
                  {ingredientesSelecionados.map((ingrediente, index) => (
                    <div
                      key={index}
                      className={`${styles.ingredienteItem} ${index % 2 === 0 ? styles.linhaBege : ""}`}
                    >
                      <span className="ml-1">{ingrediente.nome}</span>
                      <input
                        type="number"
                        placeholder="Qtd"
                        value={ingrediente.quantidade}
                        min={1}
                        onChange={(e) => handleIngredienteChange(index, "quantidade", e.target.value)}
                      />
                      <span className="d-flex justify-content-center">{unidadePadraoExibicao(ingrediente.unidade)}</span>
                      <button
                        type="button"
                        className={styles.btnRemoveIngrediente}
                        onClick={() => handleRemoverIngrediente(index)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Seção de custos */}
                <div style={{ marginTop: '50px' }}>
                  <div className="row">
                    <div className="col-6">
                      <div className="mb-2">
                        <strong>Custo dos Ingredientes:</strong>
                        <br />R$ {(() => {
                          const custoIngredientes = ingredientesSelecionados.reduce((soma, ing) => {
                            return soma + calcularCustoIngrediente(
                              ing.quantidade,
                              ing.quantidade_total,
                              ing.custo_ingrediente,
                              ing.Indice_de_Desperdicio
                            );
                          }, 0);
                          return custoIngredientes.toFixed(2);
                        })()}
                      </div>
                      <div className="mb-2">
                        <strong>Custo Total de Produção:</strong>
                        <br />R$ {(() => {
                          const custoIngredientes = ingredientesSelecionados.reduce((soma, ing) => {
                            return soma + calcularCustoIngrediente(
                              ing.quantidade,
                              ing.quantidade_total,
                              ing.custo_ingrediente,
                              ing.Indice_de_Desperdicio
                            );
                          }, 0);
                          const tempo_preparo_min = Number(form.tempoDePreparo) || 0;
                          const custoOperacional = (Array.isArray(despesas) ? despesas : []).reduce((total, despesa) => {
                            const custoMinuto = calcularCustoPorMinutoDespesa(despesa);
                            return total + (isNaN(custoMinuto) ? 0 : custoMinuto);
                          }, 0) * tempo_preparo_min;
                          const custoTotal = custoIngredientes + custoOperacional;
                          return custoTotal.toFixed(2);
                        })()}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-2">
                        <strong>Custo Operacional:</strong>
                        <br />R$ {(() => {
                          const tempo_preparo_min = Number(form.tempoDePreparo) || 0;
                          const custoOperacional = (Array.isArray(despesas) ? despesas : []).reduce((total, despesa) => {
                            const custoMinuto = calcularCustoPorMinutoDespesa(despesa);
                            return total + (isNaN(custoMinuto) ? 0 : custoMinuto);
                          }, 0) * tempo_preparo_min;
                          return custoOperacional.toFixed(2);
                        })()}
                      </div>
                      <div className="mb-2 text-success">
                        <strong>Preço Final ({form.porcentagemDeLucro || 0}% lucro):</strong>
                        <br />R$ {(() => {
                          const custoIngredientes = ingredientesSelecionados.reduce((soma, ing) => {
                            return soma + calcularCustoIngrediente(
                              ing.quantidade,
                              ing.quantidade_total,
                              ing.custo_ingrediente,
                              ing.Indice_de_Desperdicio
                            );
                          }, 0);
                          const tempo_preparo_min = Number(form.tempoDePreparo) || 0;
                          const custoOperacional = (Array.isArray(despesas) ? despesas : []).reduce((total, despesa) => {
                            const custoMinuto = calcularCustoPorMinutoDespesa(despesa);
                            return total + (isNaN(custoMinuto) ? 0 : custoMinuto);
                          }, 0) * tempo_preparo_min;
                          const custoTotal = custoIngredientes + custoOperacional;
                          const precoFinal = custoTotal * (1 + (Number(form.porcentagemDeLucro) || 0) / 100);
                          return precoFinal.toFixed(2);
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={handleClose}>Cancelar</button>
          <button
            className={styles.btnSave}
            onClick={handleSubmit}
            disabled={despesasLoading || isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}


export default ModalEditaReceita;
