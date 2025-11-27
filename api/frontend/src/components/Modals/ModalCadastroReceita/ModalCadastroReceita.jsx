import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { showPermissionDeniedOnce } from "../../../utils/permissionToast";
import "../../../Styles/global.css";
import styles from "./ModalCadastroReceita.module.css";
import { FaTrash } from 'react-icons/fa';
import axios from "axios";
import { GiKnifeFork } from "react-icons/gi";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function ModalCadastroReceita({ onClose, onSave, }) {

  const fileInputRef = useRef(null); // <-- aqui


  const [form, setForm] = useState({

    ID_Usuario: "", // ou o id do usuário logado
    Nome_Receita: "",
    Descricao: "",
    Tempo_Preparo: "",
    Custo_Total_Ingredientes: "",
    Porcentagem_De_Lucro: "",
    Categoria: "",
    imagem_URL: "",
    Data_Receita: "", // pode ser preenchido automaticamente no backend
  });

  const [isClosing, setIsClosing] = useState(false);
  const [ingredienteBusca, setIngredienteBusca] = useState("");
  const [ingredientesSelecionados, setIngredientesSelecionados] = useState([]);
  const [camposInvalidos, setCamposInvalidos] = useState({});
  const [custoTotalIngredientes, setCustoTotalIngredientes] = useState(0);
  const [despesas, setDespesas] = useState([]);
  const categorias = [
    "Carnes", "Aves", "Peixes e Frutos do Mar", "Massas", "Arroz e Grãos",
    "Doces", "Sobremesas", "Bolos e Tortas", "Pães e Biscoitos", "Sopas e Caldos",
    "Molhos e Pastas", "Bebidas", "Vegano", "Vegetariano", "Sem Glúten", "Sem Lactose"
  ];

  const [ingredientesDisponiveis, setIngredientesDisponiveis] = useState([]);
  const [ingredientesBanco, setIngredientesBanco] = useState([]);


  const handleClose = () => setIsClosing(true);

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => onClose(), 300);
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

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
      // Cria URL temporária para preview
      const previewUrl = URL.createObjectURL(arquivo);
      setForm(prev => ({
        ...prev,
        imagem_URL: arquivo,
        imagem_preview: previewUrl,  // armazena a url para preview
      }));
    }
  };

  const handleSelectIngrediente = (ingrediente) => {
    setIngredientesSelecionados((prev) => [
      ...prev,
      {
        id_ingrediente: ingrediente.ID_Ingredientes,
        nome: ingrediente.nome,
        unidade: ingrediente.unidade,
        quantidade: "",
        custo_ingrediente: ingrediente.custo_ingrediente,
        quantidade_total: ingrediente.quantidade_total,
        Indice_de_Desperdicio: ingrediente.Indice_de_Desperdicio ?? 0, // <-- aqui!
      }
    ]);
    setIngredientesDisponiveis((prev) =>
      prev.filter((i) => i.ID_Ingredientes !== ingrediente.ID_Ingredientes)
    );
    setIngredienteBusca("");
  };

  const handleIngredienteChange = (index, field, value) => {
    const novos = [...ingredientesSelecionados];
    novos[index][field] = value;
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
          (i) => i.ID_Ingredientes === ingredienteRemovido.id_ingrediente
        );
        if (jaExiste) return prevDisponiveis;

        // Devolva o objeto completo, mantendo o ID e os campos necessários
        return [
          ...prevDisponiveis,
          {
            ID_Ingredientes: ingredienteRemovido.id_ingrediente,
            nome: ingredienteRemovido.nome,
            unidade: ingredienteRemovido.unidade,
            custo_ingrediente: ingredienteRemovido.custo_ingrediente,
            quantidade_total: ingredienteRemovido.quantidade_total,
          }
        ];
      });

      return prevSelecionados.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("==== Ingredientes selecionados ====");
    console.table(ingredientesSelecionados);
    console.log("==== Despesas carregadas do banco ====");
    console.table(despesas);

    // Log detalhado do cálculo dos ingredientes com desperdício
    ingredientesSelecionados.forEach((ing, idx) => {
      const custoCalculado = calcularCustoIngrediente(
        ing.quantidade,
        ing.quantidade_total,
        ing.custo_ingrediente,
        ing.Indice_de_Desperdicio
      );
      console.log(
        `Ingrediente #${idx + 1}:`,
        `Nome: ${ing.nome}`,
        `Qtd usada: ${ing.quantidade}`,
        `Qtd total: ${ing.quantidade_total}`,
        `Custo ingrediente: ${ing.custo_ingrediente}`,
        `Índice de desperdício: ${ing.Indice_de_Desperdicio || 0}%`,
        `Custo calculado: ${custoCalculado}`
      );
    });

    despesas.forEach((desp, idx) => {
      const custoMinuto = calcularCustoPorMinutoDespesa(desp);
      console.log(
        `Despesa #${idx + 1}:`,
        `Nome: ${desp.Nome_Despesa}`,
        `Custo mensal: ${desp.Custo_Mensal}`,
        `Tempo operacional: ${desp.Tempo_Operacional}`,
        `Custo por minuto: ${custoMinuto}`
      );
    });

    const tempo_preparo_min = Number(form.Tempo_Preparo);

    const resultado = calcularCustoTotalReceita({
      ingredientes: ingredientesSelecionados.map(i => ({
        ...i,
        custo_calculado: calcularCustoIngrediente(
          i.quantidade,
          i.quantidade_total,
          i.custo_ingrediente,
          i.Indice_de_Desperdicio // <-- agora aplicado corretamente!
        )
      })),
      tempo_preparo_min,
      despesas
    });

    console.log("==== Resultado final do cálculo ====");
    console.log("Custo ingredientes:", resultado.custoIngredientes);
    console.log("Custo operacional:", resultado.custoOperacionalReceita);
    console.log("Custo total:", resultado.custoTotal);

    const precoFinal = calcularPrecoFinalComLucro(resultado.custoTotal, form.Porcentagem_De_Lucro);
    console.log("Preço final com lucro:", precoFinal);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('Nome_Receita', form.Nome_Receita || "");
      formData.append('Descricao', form.Descricao || "");
      formData.append('Tempo_Preparo', form.Tempo_Preparo || 0);
      formData.append('Custo_Total_Ingredientes', precoFinal); // com desperdício
      formData.append('Porcentagem_De_Lucro', form.Porcentagem_De_Lucro || 0);
      formData.append('Categoria', form.Categoria || "");
      if (form.imagem_URL && form.imagem_URL instanceof File) {
        formData.append('imagem_URL', form.imagem_URL);
      }
      // ADICIONE NA LINHA 214:

      formData.append('ingredientes', JSON.stringify(
        ingredientesSelecionados.map(i => ({
          ID_Ingredientes: Number(i.ID_Ingredientes ?? i.id_ingrediente ?? i.id),
          Quantidade_Utilizada: Number(i.Quantidade_Utilizada ?? i.quantidade),
          Unidade_De_Medida: i.Unidade_De_Medida ?? i.unidade ?? ""
        }))
      ));

      // Log dos dados enviados
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }

      const response = await fetch("http://localhost:3001/api/receitas", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erro do servidor:", errorData);
        toast.error(errorData.error || "Erro ao salvar receita");
        return;
      }

      const result = await response.json();
      console.log("✅ Receita salva com sucesso:", result);

      toast.success("Receita cadastrada com sucesso!");
      onSave();
      onClose();
    } catch (err) {
      if (err.response) {
        const errorText = await err.response.text();
        console.error("❌ Erro ao salvar receita:", errorText);
      } else {
        console.error("❌ Erro ao salvar receita:", err.message);
      }
      toast.error("Erro ao salvar receita");
    }
  };

  const buscarIngredientesDoBanco = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/api/ingredientes?limit=1000", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Erro ao buscar ingredientes");
      const data = await response.json();
      const ingredientesMapeados = data.map(i => ({
        ID_Ingredientes: i.ID_Ingredientes,
        nome: i.Nome_Ingrediente || i.nome,
        unidade: i.Unidade_De_Medida || i.unidade || i.Unidade,
        custo_ingrediente: i.Custo_Ingrediente ?? i.custo_ingrediente,
        quantidade_total: i.Quantidade_Total ??

          i.quantidade_total ??
          (
            (() => {
              const u = (i.Unidade_De_Medida || i.unidade || i.Unidade || "").toLowerCase().trim();

              // MASSA → gramas
              if (u === "kg") return 1000;
              if (u === "hg") return 100;
              if (u === "dag") return 10;
              if (u === "g") return 1;
              if (u === "dg") return 0.1;
              if (u === "cg") return 0.01;
              if (u === "mg") return 0.001;

              // VOLUME → mililitros
              if (u === "kl") return 1000000;
              if (u === "hl") return 100000;
              if (u === "dal") return 10000;
              if (u === "l") return 1000;
              if (u === "dl") return 100;
              if (u === "cl") return 10;
              if (u === "ml") return 1;

              // CONTÁVEIS → dúzia
              if (u === "un" || u === "unidade" || u === "unidades") return 30;

              return 1; // fallback
            })()
          ),
        Indice_de_Desperdicio: i.Indice_de_Desperdicio ?? 0, // <-- aqui!
      }));
      setIngredientesBanco(ingredientesMapeados); // <- referência fixa
      setIngredientesDisponiveis(ingredientesMapeados); // <- para busca/sugestão
    } catch (err) {
      console.error("Erro ao buscar ingredientes:", err);
      toast.error("Erro ao buscar ingredientes");
    }
  };

  const buscarDespesasDoBanco = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/api/despesas/calculo", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        console.error("Erro ao buscar despesas para cálculo:", response.status);
        setDespesas([]);
        return;
      }
      const data = await response.json();
      setDespesas(data);
      console.log("Despesas carregadas para cálculo:", data);
    } catch (err) {
      console.error("Erro ao buscar despesas:", err);
      setDespesas([]);
    }
  };


  useEffect(() => {
    buscarIngredientesDoBanco();
    buscarDespesasDoBanco();
  }, []);

  useEffect(() => {
    const total = ingredientesSelecionados.reduce((soma, ing) => {
      return soma + calcularCustoIngrediente(ing.quantidade, ing.quantidade_total, ing.custo_ingrediente);
    }, 0);
    setCustoTotalIngredientes(total);
    setForm(prev => ({ ...prev, Custo_Total_Ingredientes: total }));
  }, [ingredientesSelecionados]);

  function calcularCustoIngrediente(quantidadeUsada, quantidadeTotal, custoIngrediente, indiceDesperdicio = 0) {
    if (!quantidadeUsada || !quantidadeTotal || !custoIngrediente) return 0;
    const custoBase = (Number(quantidadeUsada) / Number(quantidadeTotal)) * Number(custoIngrediente);
    // Aplica o índice de desperdício individual (ex: 10% => 1.10)
    return custoBase * (1 + Number(indiceDesperdicio) / 100);
  }

  function calcularCustoTotal(ingredientesSelecionados, ingredientesDoBanco) {
    console.log("==== Iniciando cálculo do custo total dos ingredientes ====");

    let total = 0;

    ingredientesSelecionados.forEach(item => {
      // Compare sempre como número!
      const ingredienteBanco = ingredientesDoBanco.find(i =>
        Number(i.ID_Ingredientes) === Number(item.id_ingrediente)
      );

      if (ingredienteBanco) {
        const unidade = (ingredienteBanco.unidade || ingredienteBanco.Unidade_De_Medida || '').toLowerCase();
        const custoUnitario = Number(ingredienteBanco.custo_ingrediente || ingredienteBanco.Custo_Ingrediente);
        const quantidadeUsada = Number(item.quantidade);

        let fatorConversao = 1;
        if (unidade === 'kg' || unidade === 'l') {
          fatorConversao = 1000; // converte para gramas ou ml
        }

        const custoCalculado = (quantidadeUsada / fatorConversao) * custoUnitario;

        console.log(`Ingrediente: ${ingredienteBanco.nome || ingredienteBanco.Nome_Ingrediente} | Unidade: ${unidade} | Custo total: ${custoUnitario} | Quantidade total: ${fatorConversao} | Quantidade usada: ${quantidadeUsada} | Custo calculado: ${custoCalculado.toFixed(2)}`);

        total += custoCalculado;
      } else {
        console.warn(`❌ Ingrediente com ID ${item.id_ingrediente} não encontrado no banco.`);
      }
    });

    const totalFinal = parseFloat(total.toFixed(2));
    console.log(`==== Soma final do custo dos ingredientes: ${totalFinal} ====`);
    return totalFinal;
  }

  function calcularCustoPorMinutoDespesa(despesa) {
    const diasNoMes = 30;
    // Use os nomes exatos do banco:
    const custoMensal = Number(despesa.Custo_Mensal);
    const tempoDia = Number(despesa.Tempo_Operacional);

    if (!custoMensal || !tempoDia) return 0;

    const custoDiario = custoMensal / diasNoMes;
    const custoPorHora = custoDiario / tempoDia;
    return custoPorHora / 60;
  }

  function calcularCustoOperacionalTotal(despesas) {
    return despesas.reduce((total, despesa) => {
      const custoMinuto = calcularCustoPorMinutoDespesa(despesa);
      return total + (isNaN(custoMinuto) ? 0 : custoMinuto);
    }, 0);
  }

  function calcularCustoTotalReceita({ ingredientes, tempo_preparo_min, despesas }) {
    const custoIngredientes = ingredientes.reduce((total, item) => total + item.custo_calculado, 0);
    const custoOperacionalPorMinuto = calcularCustoOperacionalTotal(despesas);
    const custoOperacionalReceita = custoOperacionalPorMinuto * tempo_preparo_min;
    const custoTotal = custoIngredientes + custoOperacionalReceita;

    return {
      custoIngredientes,
      custoOperacionalReceita,
      custoTotal
    };
  }

  function calcularPrecoFinalComLucro(custo, porcentagemLucro) {
    return Number(custo) + (Number(custo) * (Number(porcentagemLucro) / 100));
  }

  // Exemplo de uso:
  const precoFinal = calcularPrecoFinalComLucro(100, 120); // 220

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

  return (
    <div className={`${styles.modalOverlay} ${isClosing ? styles.modalExit : styles.modalEnter}`}>
      <div className={`${styles.modalContainer} shadow`}>
        <div className={styles.modalHeader}>
          <h5>Cadastrar Receita</h5>
          <button onClick={handleClose} className={styles.btnClose}>&times;</button>
        </div>

        <div className={styles.modalBody}>
          <div className="row" style={{ columnGap: '12px' }}>
            {/* Coluna Esquerda */}

            <div className="col-6" style={{ flex: '1' }}>
              {/* Coluna da imagem */}
              <div className={`${styles.imageFormGroup} align-items-center mb-3`}>
                <label className="mb-2" style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--rich-black)' }}>Imagem da Receita</label>
                <label htmlFor="imagemInput" className={styles.imageUploadContainer}>
                  {form.imagem_URL ? (
                    <div className={styles.imagePreview}>
                      <div
                        style={{
                          backgroundImage: `url(${form.imagem_preview})`,
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center",
                          width: "100%",
                          height: "100%",
                          borderRadius: "10px"
                        }}
                      />
                    </div>
                  ) : (
                    <div className={styles.emptyImageState}>
                      <i className="bi bi-image" style={{ fontSize: '2.5rem', color: 'var(--ultra-violet)', opacity: 0.5 }}></i>
                      <p style={{ margin: '8px 0 2px', fontSize: '0.85rem', color: 'var(--ultra-violet)', fontWeight: '500' }}>Clique para adicionar</p>
                      <span style={{ fontSize: '0.7rem', color: '#888' }}>JPG, PNG ou GIF</span>
                    </div>
                  )}
                </label>
                <input
                  id="imagemInput"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                {form.imagem_URL && (
                  <div className="d-flex gap-2 mt-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary flex-fill"
                      onClick={() => document.getElementById('imagemInput').click()}
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
                          imagem_URL: "",
                          imagem_preview: ""
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
              <div className={styles.formGroup} style={{ marginTop: '15px' }}>
                <label>
                  <span className={styles.requiredAsterisk} data-tooltip="Este item é obrigatório.">*</span>
                  Nome da Receita
                </label>
                <input
                  name="Nome_Receita"
                  autoComplete="off"
                  className={`form-control ${camposInvalidos.Nome_Receita ? styles.erroInput : ""}`}
                  value={form.Nome_Receita}
                  onChange={handleChange}
                  placeholder="Ex: Bolo de Chocolate"
                />
              </div>

              {/* Categoria */}
              <div className={`${styles.formGroup} mt-2`}>
                <label>
                  <span className={styles.requiredAsterisk} data-tooltip="Este item é obrigatório.">*</span>
                  Categoria
                </label>
                <select
                  name="Categoria"
                  className={`form-control ${camposInvalidos.categoria ? styles.erroInput : ""}`}
                  value={form.Categoria}
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
                      name="Tempo_Preparo"
                      autoComplete="off"
                      className={`form-control ${camposInvalidos.Tempo_Preparo ? styles.erroInput : ""}`}
                      inputMode="decimal"
                      value={form.Tempo_Preparo}
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
                      name="Porcentagem_De_Lucro"
                      autoComplete="off"
                      className={`form-control ${camposInvalidos.porcentagemDeLucro ? styles.erroInput : ""}`}
                      inputMode="decimal"
                      value={form.Porcentagem_De_Lucro}
                      onChange={handleChange}
                      placeholder="Ex: 20"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formGroup} style={{ marginTop: '25px' }}>
                <label className="mb-2 d-flex justify-content-center" style={{ fontFamily: 'Birthstone, cursive', fontSize: '1.8rem' }}>Modo de Preparo</label>
                <ReactQuill
                  theme="snow"
                  value={form.Descricao}
                  onChange={(content) => setForm(prev => ({ ...prev, Descricao: content }))}
                  placeholder="Descreva aqui o modo de preparo (opcional)..."
                  modules={{
                    toolbar: [
                      ['bold', 'italic', 'underline'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['clean']
                    ]
                  }}
                  style={{ height: '90px', marginBottom: '50px' }}
                />
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="col-6" style={{ flex: '1' }}>
              <div>

                <div className={`${styles.formGroup} ${styles.suggestionsContainer}`}>
                  <label className="mb-1">
                    <span className={styles.requiredAsterisk} data-tooltip="Este item é obrigatório.">*</span>
                    Buscar Ingrediente
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={ingredienteBusca}
                    onChange={(e) => setIngredienteBusca(e.target.value)}
                    onFocus={buscarIngredientesDoBanco} // <-- aqui!
                    placeholder="Digite para buscar..."
                  />
                  {ingredienteBusca && (
                    <ul className={styles.suggestionsList}>
                      {ingredientesDisponiveis
                        .filter(i => i.nome.toLowerCase().includes(ingredienteBusca.toLowerCase()))
                        // Oculta itens já adicionados na lista da receita
                        .filter(i => !ingredientesSelecionados.some(sel => Number(sel.id_ingrediente ?? sel.ID_Ingredientes ?? sel.id) === Number(i.ID_Ingredientes)))
                        .map(i => (
                          <li
                            key={i.ID_Ingredientes}
                            onClick={() => {
                              // Evita adicionar duplicado
                              const jaSelecionado = ingredientesSelecionados.some(
                                sel => Number(sel.id_ingrediente ?? sel.ID_Ingredientes ?? sel.id) === Number(i.ID_Ingredientes)
                              );
                              if (jaSelecionado) return;
                              handleSelectIngrediente(i);
                            }}
                          >
                            {i.nome} <span className="text-muted">({i.unidade})</span>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>


                <div className="d-flex justify-content-center">
                  <label className="mt-2 mb-2" style={{ fontFamily: 'Birthstone, cursive', fontSize: '1.8rem' }}>Ingredientes da Receita</label>
                </div>
                <div className={styles.ingredientesBox}>
                  <div className={`${styles.tabelaCabecalho}`}>
                    <span className={`${styles.nomeIngrediente}`}>Nome</span>
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
                        className={`${styles.inputQuantidade} ${camposInvalidos[`ingrediente_${index}`] ? styles.erroInput : ""}`}
                        value={ingrediente.quantidade}
                        onChange={(e) => handleIngredienteChange(index, "quantidade", e.target.value)}
                      />
                      <span className="d-flex justify-content-center">
                        {unidadePadraoExibicao(ingrediente.unidade)}
                      </span>
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

                <div style={{ marginTop: '50px' }}>
                  <div className="row">
                    <div className="col-6">
                      <div className="mb-2">
                        <strong>Custo dos Ingredientes:</strong>
                        <br />R$ {custoTotalIngredientes.toFixed(2)}
                      </div>
                      <div className="mb-2">
                        <strong>Custo Total de Produção:</strong>
                        <br />R$ {(() => {
                          const tempo_preparo_min = Number(form.Tempo_Preparo) || 0;
                          const custoOperacional = despesas.reduce((total, despesa) => {
                            const custoMinuto = calcularCustoPorMinutoDespesa(despesa);
                            return total + (isNaN(custoMinuto) ? 0 : custoMinuto);
                          }, 0) * tempo_preparo_min;
                          const custoTotal = custoTotalIngredientes + custoOperacional;
                          return custoTotal.toFixed(2);
                        })()}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="mb-2">
                        <strong>Custo Operacional:</strong>
                        <br />R$ {(() => {
                          const tempo_preparo_min = Number(form.Tempo_Preparo) || 0;
                          const custoOperacional = despesas.reduce((total, despesa) => {
                            const custoMinuto = calcularCustoPorMinutoDespesa(despesa);
                            return total + (isNaN(custoMinuto) ? 0 : custoMinuto);
                          }, 0) * tempo_preparo_min;
                          return custoOperacional.toFixed(2);
                        })()}
                      </div>
                      <div className="mb-2 text-success">
                        <strong>Preço Final ({form.Porcentagem_De_Lucro || 0}% lucro):</strong>
                        <br />R$ {(() => {
                          const tempo_preparo_min = Number(form.Tempo_Preparo) || 0;
                          const custoOperacional = despesas.reduce((total, despesa) => {
                            const custoMinuto = calcularCustoPorMinutoDespesa(despesa);
                            return total + (isNaN(custoMinuto) ? 0 : custoMinuto);
                          }, 0) * tempo_preparo_min;
                          const custoTotal = custoTotalIngredientes + custoOperacional;
                          const precoFinal = custoTotal * (1 + (Number(form.Porcentagem_De_Lucro) || 0) / 100);
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
          <button className={styles.btnSave} onClick={handleSubmit}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

export default ModalCadastroReceita;
