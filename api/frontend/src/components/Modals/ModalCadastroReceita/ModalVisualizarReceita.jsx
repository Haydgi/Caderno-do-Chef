import { useState, useEffect } from "react";
import "../../../Styles/global.css";
import styles from "./ModalCadastroReceita.module.css";
import { GiKnifeFork } from "react-icons/gi";
import { getApiBaseUrl } from "../../../utils/api";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function ModalVisualizarReceita({ onClose, receita }) {
    const [form, setForm] = useState({
        imagem: null,
        nome: "",
        categoria: "",
        tempoDePreparo: "",
        porcentagemDeLucro: "",
        descricao: "",
        custoTotalIngredientes: "0.00",
        id: null,
    });

    const [ingredientesSelecionados, setIngredientesSelecionados] = useState([]);
    const [isClosing, setIsClosing] = useState(false);
    const [despesas, setDespesas] = useState([]);

    const categorias = [
        "Carnes", "Aves", "Peixes e Frutos do Mar", "Massas", "Arroz e Grãos",
        "Doces", "Sobremesas", "Bolos e Tortas", "Pães e Biscoitos", "Sopas e Caldos",
        "Molhos e Pastas", "Bebidas", "Vegano", "Vegetariano", "Sem Glúten", "Sem Lactose"
    ];

    // Buscar despesas operacionais para cálculos (rota acessível a todos)
    useEffect(() => {
        async function fetchDespesas() {
            try {
                const token = localStorage.getItem("token");
                const baseUrl = getApiBaseUrl();
                const response = await fetch(`${baseUrl}/api/despesas/calculo`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('📊 Despesas recebidas para cálculo:', data);
                    setDespesas(data);
                } else {
                    console.error('Erro ao buscar despesas para cálculo:', response.status);
                    setDespesas([]);
                }
            } catch (error) {
                console.error("Erro ao buscar despesas:", error);
                setDespesas([]);
            }
        }

        fetchDespesas();
    }, []);

    // Carregar dados da receita e buscar ingredientes
    useEffect(() => {
        async function carregarReceita() {
            if (!receita) return;

            console.log('📋 Receita recebida no modal:', receita);

            setForm({
                imagem: receita.imagem_URL || receita.Caminho_Imagem || receita.imagem_url || null,
                nome: receita.Nome_Receita || receita.nome || "",
                categoria: receita.Categoria || receita.categoria || "",
                tempoDePreparo: receita.Tempo_Preparo || receita.tempo_preparo || "",
                porcentagemDeLucro: receita.Porcentagem_De_Lucro || receita.porcentagem_lucro || "",
                descricao: receita.Descricao || receita.descricao || "",
                custoTotalIngredientes: receita.Custo_Total_Ingredientes || receita.custo_total || "0.00",
                id: receita.ID_Receita || receita.id,
            });

            // Buscar ingredientes da receita
            try {
                const token = localStorage.getItem("token");
                const baseUrl = getApiBaseUrl();
                const idReceita = receita.ID_Receita || receita.id;

                const response = await fetch(`${baseUrl}/api/receita-detalhada/${idReceita}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const receitaDetalhada = await response.json();
                    console.log('📋 Receita detalhada recebida:', receitaDetalhada);
                    console.log('📋 Ingredientes recebidos:', receitaDetalhada.ingredientes);

                    if (receitaDetalhada.ingredientes && receitaDetalhada.ingredientes.length > 0) {
                        const ingredientesMapeados = receitaDetalhada.ingredientes.map((ing) => {
                            console.log('Ingrediente individual:', ing);
                            return {
                                id_ingrediente: ing.ID_Ingredientes,
                                nome: ing.Nome_Ingrediente,
                                quantidade: ing.Quantidade_Utilizada,
                                unidade: ing.Unidade_De_Medida,
                                quantidade_total: 1000, // valor padrão
                                custo_ingrediente: ing.Custo_Ingrediente,
                                Indice_de_Desperdicio: ing.Indice_de_Desperdicio || 0
                            };
                        });
                        console.log('📋 Ingredientes mapeados:', ingredientesMapeados);
                        setIngredientesSelecionados(ingredientesMapeados);
                    } else {
                        console.log('⚠️ Nenhum ingrediente encontrado');
                        setIngredientesSelecionados([]);
                    }
                } else {
                    console.error('Erro ao buscar ingredientes:', response.status);
                    setIngredientesSelecionados([]);
                }
            } catch (error) {
                console.error('Erro ao buscar ingredientes:', error);
                setIngredientesSelecionados([]);
            }
        }

        carregarReceita();
    }, [receita]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    // Função de cálculo de custo do ingrediente (mesma lógica dos outros modais)
    function calcularCustoIngrediente(quantidadeUsada, quantidadeTotal, custoIngrediente, indiceDesperdicio = 0) {
        if (!quantidadeUsada || !quantidadeTotal || !custoIngrediente) return 0;
        const custoBase = (Number(quantidadeUsada) / Number(quantidadeTotal)) * Number(custoIngrediente);
        return custoBase * (1 + Number(indiceDesperdicio) / 100);
    }

    // Calcular custo por minuto de despesa
    function calcularCustoPorMinutoDespesa(despesa) {
        const diasNoMes = 30;
        const custoMensal = Number(despesa.Custo_Mensal);
        const tempoDia = Number(despesa.Tempo_Operacional);

        if (!custoMensal || !tempoDia) return 0;

        const custoDiario = custoMensal / diasNoMes;
        const custoPorHora = custoDiario / tempoDia;
        return custoPorHora / 60;
    }

    // Calcular custo total dos ingredientes
    const custoTotalIngredientes = ingredientesSelecionados.reduce((soma, ing) => {
        return soma + calcularCustoIngrediente(
            ing.quantidade,
            ing.quantidade_total,
            ing.custo_ingrediente,
            ing.Indice_de_Desperdicio
        );
    }, 0);

    return (
        <div className={`${styles.modalOverlay} ${isClosing ? styles.closing : ""}`}>
            <div className={`${styles.modalContainer} ${isClosing ? styles.closing : ""}`}>
                <div className={styles.modalHeader}>
                    <h5>Visualizar Receita</h5>
                    <button
                        type="button"
                        className={styles.btnClose}
                        onClick={handleClose}
                        aria-label="Fechar modal"
                        style={{ backgroundColor: 'var(--imperial-red)', color: 'var(--white-smoke)' }}
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className="row" style={{ columnGap: '12px' }}>
                        {/* Coluna Esquerda */}
                        <div className="col-6" style={{ flex: '1' }}>
                            {/* Campo de Imagem */}
                            <div className={`${styles.formGroup} ${styles.imageFormGroup}`}>
                                <label className="mb-2 d-flex justify-content-center">Imagem da Receita</label>
                                <div className={styles.imageUploadContainer} style={{ cursor: "default" }}>
                                    {form.imagem ? (
                                        <div className={styles.imagePreview}>
                                            <div
                                                style={{
                                                    backgroundImage: `url(${form.imagem})`,
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
                                            <i className="bi bi-image" style={{ fontSize: "2.5rem", color: "var(--ultra-violet)", opacity: 0.5 }}></i>
                                            <p style={{ margin: "8px 0 2px", fontSize: "0.85rem", color: "var(--ultra-violet)" }}>Sem imagem</p>
                                        </div>
                                    )}
                                </div>

                            </div>

                            {/* Nome da Receita */}
                            <div className={styles.formGroup} style={{ marginTop: '15px' }}>
                                <label>Nome da Receita</label>
                                <input
                                    name="nome"
                                    autoComplete="off"
                                    className="form-control"
                                    value={form.nome}
                                    disabled
                                    readOnly
                                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                />
                            </div>

                            {/* Categoria */}
                            <div className={`${styles.formGroup} mt-2`}>
                                <label>Categoria</label>
                                <select
                                    name="categoria"
                                    className="form-control"
                                    value={form.categoria}
                                    disabled
                                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
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
                                        <label>Tempo de Preparo (Min.)</label>
                                        <input
                                            name="tempoDePreparo"
                                            autoComplete="off"
                                            className="form-control"
                                            value={form.tempoDePreparo}
                                            disabled
                                            readOnly
                                            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                        />
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className={styles.formGroup}>
                                        <label style={{ fontSize: '0.9rem' }}>Porcentagem de Lucro (%)</label>
                                        <input
                                            name="porcentagemDeLucro"
                                            autoComplete="off"
                                            className="form-control"
                                            value={form.porcentagemDeLucro}
                                            disabled
                                            readOnly
                                            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formGroup} style={{ marginTop: '25px' }}>
                                <label className="mb-2 d-flex justify-content-center" style={{ fontFamily: 'Birthstone, cursive', fontSize: '1.8rem' }}>Modo de Preparo</label>
                                <ReactQuill
                                    theme="snow"
                                    value={form.descricao || ''}
                                    readOnly={true}
                                    modules={{ toolbar: false }}
                                    style={{ height: '180px', marginBottom: '20px', backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                />
                            </div>
                        </div>

                        {/* Coluna Direita */}
                        <div className="col-6" style={{ flex: '1' }}>
                            <div>
                                <div className="d-flex justify-content-center mb-2">
                                    <label style={{ fontFamily: 'Birthstone, cursive', fontSize: '1.8rem', margin: 0 }}>
                                        Ingredientes da Receita
                                    </label>
                                </div>

                                {/* Tabela de Ingredientes com mesma estrutura dos outros modais */}
                                <div className={styles.ingredientesBox} style={{ height: '479px', maxHeight: '479px' }}>
                                    <div className={styles.tabelaCabecalho}>
                                        <div style={{ flex: '2', textAlign: 'center', fontWeight: 'bold', padding: '10px' }}>Nome</div>
                                        <div style={{ flex: '1', textAlign: 'center', fontWeight: 'bold', padding: '10px' }}>Quantidade</div>
                                        <div style={{ flex: '1', textAlign: 'center', fontWeight: 'bold', padding: '10px' }}>Unidade</div>
                                    </div>

                                    {ingredientesSelecionados.length === 0 ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                            Nenhum ingrediente adicionado
                                        </div>
                                    ) : (
                                        ingredientesSelecionados.map((ing, index) => (
                                            <div
                                                key={ing.id_ingrediente}
                                                className={`${styles.ingredienteItem} ${index % 2 === 0 ? styles.linhaBege : ""}`}
                                            >
                                                <div style={{ flex: '2', textAlign: 'center', padding: '10px' }}>{ing.nome}</div>
                                                <div style={{ flex: '1', textAlign: 'center', padding: '10px' }}>{ing.quantidade}</div>
                                                <div style={{ flex: '1', textAlign: 'center', padding: '10px' }}>{ing.unidade}</div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Custos com mesmo layout dos outros modais */}
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
                                                    const tempo_preparo_min = Number(form.tempoDePreparo) || 0;
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
                                                    const tempo_preparo_min = Number(form.tempoDePreparo) || 0;
                                                    const custoOperacional = despesas.reduce((total, despesa) => {
                                                        const custoMinuto = calcularCustoPorMinutoDespesa(despesa);
                                                        return total + (isNaN(custoMinuto) ? 0 : custoMinuto);
                                                    }, 0) * tempo_preparo_min;
                                                    return custoOperacional.toFixed(2);
                                                })()}
                                            </div>
                                            <div className="mb-2 text-success">
                                                <strong>Preço Final ({form.porcentagemDeLucro || 0}% lucro):</strong>
                                                <br />R$ {(() => {
                                                    const tempo_preparo_min = Number(form.tempoDePreparo) || 0;
                                                    const custoOperacional = despesas.reduce((total, despesa) => {
                                                        const custoMinuto = calcularCustoPorMinutoDespesa(despesa);
                                                        return total + (isNaN(custoMinuto) ? 0 : custoMinuto);
                                                    }, 0) * tempo_preparo_min;
                                                    const custoTotal = custoTotalIngredientes + custoOperacional;
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
            </div>
        </div>
    );
}

export default ModalVisualizarReceita;
