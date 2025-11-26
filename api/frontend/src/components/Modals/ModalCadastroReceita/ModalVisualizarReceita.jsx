import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "../../../Styles/global.css";
import styles from "./ModalCadastroReceita.module.css";
import { GiKnifeFork } from "react-icons/gi";

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

    // Buscar despesas operacionais
    useEffect(() => {
        async function fetchDespesas() {
            try {
                const token = localStorage.getItem("token");
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
                const response = await fetch(`${baseUrl}/api/despesas`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (!response.ok) throw new Error("Erro ao buscar despesas");

                const data = await response.json();
                setDespesas(data);
            } catch (error) {
                console.error("Erro ao buscar despesas:", error);
                toast.error("Erro ao carregar despesas");
            }
        }

        fetchDespesas();
    }, []);

    // Carregar dados da receita
    useEffect(() => {
        if (receita) {
            console.log('📋 Receita recebida:', receita);

            setForm({
                imagem: receita.Caminho_Imagem || null,
                nome: receita.Nome_Receita || "",
                categoria: receita.Categoria || "",
                tempoDePreparo: receita.Tempo_Preparo || "",
                porcentagemDeLucro: receita.Porcentagem_De_Lucro || "",
                descricao: receita.Descricao || "",
                custoTotalIngredientes: receita.Custo_Total_Ingredientes || "0.00",
                id: receita.ID_Receita,
            });

            if (receita.ingredientes && receita.ingredientes.length > 0) {
                setIngredientesSelecionados(
                    receita.ingredientes.map((ing) => ({
                        id: ing.ID_Ingredientes,
                        nome: ing.Nome_Ingrediente,
                        quantidade: ing.Quantidade,
                        unidade: ing.Unidade,
                        preco: ing.Preco,
                    }))
                );
            }
        }
    }, [receita]);

    // Calcular custo total dos ingredientes
    useEffect(() => {
        const custoTotal = ingredientesSelecionados.reduce(
            (acc, ing) => acc + parseFloat(ing.preco || 0),
            0
        );
        setForm((prev) => ({
            ...prev,
            custoTotalIngredientes: custoTotal.toFixed(2),
        }));
    }, [ingredientesSelecionados]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    // Calcular custo operacional
    const calcularCustoOperacional = () => {
        if (despesas.length === 0) return 0;

        const custoIngredientes = parseFloat(form.custoTotalIngredientes) || 0;
        const totalDespesas = despesas.reduce((acc, desp) => {
            return acc + parseFloat(desp.Valor || 0);
        }, 0);

        return (custoIngredientes * (totalDespesas / 100)).toFixed(2);
    };

    // Calcular preço final
    const calcularPrecoFinal = () => {
        const custoIngredientes = parseFloat(form.custoTotalIngredientes) || 0;
        const custoOperacional = parseFloat(calcularCustoOperacional()) || 0;
        const custoTotal = custoIngredientes + custoOperacional;
        const porcentagemLucro = parseFloat(form.porcentagemDeLucro) || 0;

        if (custoTotal === 0) return "0.00";

        const precoFinal = custoTotal * (1 + porcentagemLucro / 100);
        return precoFinal.toFixed(2);
    };

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
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className="row" style={{ columnGap: '12px' }}>
                        {/* Coluna Esquerda */}
                        <div className="col-6" style={{ flex: '1' }}>
                            {/* Campo de Imagem */}
                            <div className={styles.formGroup}>
                                <label className="mb-2">Imagem da Receita</label>
                                {form.imagem ? (
                                    <div
                                        className={styles.imageUploadContainer}
                                        style={{
                                            backgroundImage: `url(${form.imagem})`,
                                            backgroundSize: 'contain',
                                            backgroundPosition: 'center',
                                            backgroundRepeat: 'no-repeat',
                                            position: 'relative',
                                            cursor: 'default',
                                        }}
                                    />
                                ) : (
                                    <div className={styles.imageUploadContainer} style={{ cursor: 'default' }}>
                                        <div className={styles.emptyImageState}>
                                            <i className="bi bi-image" style={{ fontSize: '2.5rem', color: 'var(--ultra-violet)', opacity: 0.5 }}></i>
                                            <p style={{ margin: '8px 0 2px', fontSize: '0.85rem', color: 'var(--ultra-violet)', fontWeight: '500' }}>Sem imagem</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Nome da Receita */}
                            <div className={styles.formGroup}>
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

                            <div className={`${styles.formGroup} mt-2`}>
                                <label className="mb-2 d-flex justify-content-center" style={{ fontFamily: 'Birthstone, cursive', fontSize: '1.8rem' }}>Modo de Preparo</label>
                                <textarea
                                    name="descricao"
                                    className="form-control"
                                    value={form.descricao}
                                    disabled
                                    readOnly
                                    rows={3}
                                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                />
                            </div>
                        </div>

                        {/* Coluna Direita */}
                        <div className="col-6" style={{ flex: '1' }}>
                            <div>
                                {/* Ingredientes da Receita */}
                                <div className="mb-3">
                                    <div className="d-flex justify-content-center mb-2">
                                        <label style={{ fontFamily: 'Birthstone, cursive', fontSize: '1.8rem', margin: 0 }}>
                                            Ingredientes da Receita
                                        </label>
                                    </div>

                                    {/* Tabela de Ingredientes */}
                                    <div className={styles.tabelaIngredientes}>
                                        <table className="table table-bordered table-hover">
                                            <thead className={styles.tabelaCabecalho}>
                                                <tr>
                                                    <th>Nome</th>
                                                    <th>Quantidade</th>
                                                    <th>Unidade</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ingredientesSelecionados.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="3" className="text-center">
                                                            Nenhum ingrediente adicionado
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    ingredientesSelecionados.map((ing) => (
                                                        <tr key={ing.id}>
                                                            <td>{ing.nome}</td>
                                                            <td>{ing.quantidade}</td>
                                                            <td>{ing.unidade}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Custos */}
                                <div className="row mt-3">
                                    <div className="col-6">
                                        <strong>Custo dos Ingredientes:</strong>
                                        <p>R$ {form.custoTotalIngredientes}</p>
                                    </div>
                                    <div className="col-6">
                                        <strong>Custo Operacional:</strong>
                                        <p>R$ {calcularCustoOperacional()}</p>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-6">
                                        <strong>Custo Total de Produção:</strong>
                                        <p>R$ {(parseFloat(form.custoTotalIngredientes) + parseFloat(calcularCustoOperacional())).toFixed(2)}</p>
                                    </div>
                                    <div className="col-6">
                                        <strong style={{ color: 'var(--green)' }}>Preço Final (0% lucro):</strong>
                                        <p style={{ color: 'var(--green)', fontWeight: 'bold' }}>R$ {calcularPrecoFinal()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button
                        type="button"
                        className="btn"
                        onClick={handleClose}
                        style={{
                            backgroundColor: 'var(--gray)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                        }}
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ModalVisualizarReceita;
