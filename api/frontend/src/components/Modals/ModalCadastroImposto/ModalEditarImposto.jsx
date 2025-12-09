import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { getApiBaseUrl } from '../../../utils/api';
import styles from './ModalEditarImposto.module.css';

const API_URL = getApiBaseUrl();

const sanitizeNumericInput = (value = '') => value.replace(/[^0-9.,]/g, '');

const parseCurrency = (value) => {
    if (!value) return NaN;
    const normalized = value.replace(/\./g, '').replace(',', '.');
    return Number(normalized);
};

const formatToInput = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '';
    return Number(value).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const formatCurrency = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'R$ 0,00';
    return Number(value).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
    });
};

const ModalEditarImposto = ({ open, onClose, imposto, onUpdated }) => {
    const [nome, setNome] = useState('');
    const [categoria, setCategoria] = useState('');
    const [frequencia, setFrequencia] = useState('mensal');
    const [valorMedio, setValorMedio] = useState(0);

    const [historico, setHistorico] = useState([]);
    const [historicoValores, setHistoricoValores] = useState({});

    const [novoValor, setNovoValor] = useState('');
    const [novaData, setNovaData] = useState('');

    const [carregandoHistorico, setCarregandoHistorico] = useState(false);
    const [salvandoImposto, setSalvandoImposto] = useState(false);
    const [registrandoPagamento, setRegistrandoPagamento] = useState(false);
    const [linhasSalvando, setLinhasSalvando] = useState({});
    const [linhasExcluindo, setLinhasExcluindo] = useState({});

    const getToken = () => localStorage.getItem('token');

    const aplicarDadosImposto = useCallback(() => {
        if (!imposto) return;
        setNome(imposto.Nome_Imposto || imposto.nome || '');
        setCategoria(imposto.Categoria_Imposto || imposto.categoria || '');
        setFrequencia(imposto.Frequencia || imposto.frequencia || 'mensal');
        setValorMedio(imposto.Valor_Medio ?? imposto.valorMedio ?? 0);
    }, [imposto]);

    useEffect(() => {
        aplicarDadosImposto();
    }, [aplicarDadosImposto]);

    const carregarHistorico = async () => {
        if (!imposto?.id) return;
        const token = getToken();
        if (!token) {
            toast.error('Sessão expirada. Faça login novamente.');
            return;
        }

        setCarregandoHistorico(true);
        try {
            const res = await fetch(`${API_URL}/api/impostos/${imposto.id}/historico`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    Pragma: 'no-cache',
                    Expires: '0',
                },
            });

            if (!res.ok) {
                throw new Error('Erro ao carregar histórico do imposto.');
            }

            const data = await res.json();

            if (data.imposto) {
                setNome(data.imposto.Nome_Imposto || '');
                setCategoria(data.imposto.Categoria_Imposto || '');
                setFrequencia(data.imposto.Frequencia || 'mensal');
                setValorMedio(data.imposto.Valor_Medio || 0);
            }

            const registros = Array.isArray(data.historico) ? data.historico : [];
            setHistorico(registros);

            const valoresMap = {};
            registros.forEach((item) => {
                valoresMap[item.ID_Historico] = formatToInput(item.Valor);
            });
            setHistoricoValores(valoresMap);
        } catch (error) {
            console.error(error);
            toast.error('Falha ao carregar histórico do imposto.');
        } finally {
            setCarregandoHistorico(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        aplicarDadosImposto();
        setNovoValor('');
        setNovaData('');
        carregarHistorico();
    }, [open, imposto?.id, aplicarDadosImposto]);

    const handleSalvarImposto = async () => {
        if (!imposto?.id) return;
        if (!nome.trim()) {
            toast.warn('Informe o nome do imposto.');
            return;
        }

        const token = getToken();
        if (!token) {
            toast.error('Sessão expirada. Faça login novamente.');
            return;
        }

        setSalvandoImposto(true);
        try {
            const payload = new URLSearchParams();
            payload.append('Nome_Imposto', nome.trim());
            payload.append('Categoria_Imposto', categoria.trim());
            payload.append('Frequencia', frequencia);

            const res = await fetch(`${API_URL}/api/impostos/${imposto.id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: payload,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Erro ao salvar imposto.');
            }

            toast.success('Imposto atualizado com sucesso!');
            onUpdated?.();
            onClose?.();
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Erro ao salvar imposto.');
        } finally {
            setSalvandoImposto(false);
        }
    };

    const handleRegistrarPagamento = async () => {
        if (!imposto?.id) return;
        const valorNumerico = parseCurrency(novoValor);

        if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
            toast.warn('Informe um valor válido para o pagamento.');
            return;
        }

        const token = getToken();
        if (!token) {
            toast.error('Sessão expirada. Faça login novamente.');
            return;
        }

        setRegistrandoPagamento(true);
        try {
            const res = await fetch(`${API_URL}/api/impostos/${imposto.id}/historico`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    valor: valorNumerico,
                    data: novaData || undefined,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Erro ao registrar pagamento.');
            }

            const payload = await res.json().catch(() => ({}));
            if (payload?.valorMedio !== undefined) {
                setValorMedio(payload.valorMedio);
            }

            toast.success('Pagamento registrado com sucesso!');
            setNovoValor('');
            setNovaData('');
            await carregarHistorico();
            onUpdated?.();
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Erro ao registrar pagamento.');
        } finally {
            setRegistrandoPagamento(false);
        }
    };

    const handleAlterarValorHistorico = (histId, valor) => {
        setHistoricoValores((prev) => ({
            ...prev,
            [histId]: sanitizeNumericInput(valor),
        }));
    };

    const handleSalvarHistorico = async (histId) => {
        if (!imposto?.id) return;

        const rawValue = historicoValores[histId];
        const valorNumerico = parseCurrency(rawValue);

        if (Number.isNaN(valorNumerico)) {
            toast.warn('Informe um valor válido para salvar.');
            return;
        }

        const token = getToken();
        if (!token) {
            toast.error('Sessão expirada. Faça login novamente.');
            return;
        }

        setLinhasSalvando((prev) => ({ ...prev, [histId]: true }));
        try {
            const res = await fetch(`${API_URL}/api/impostos/${imposto.id}/historico/${histId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ valor: valorNumerico }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Erro ao salvar alterações.');
            }

            const payload = await res.json().catch(() => ({}));
            if (payload?.valorMedio !== undefined) {
                setValorMedio(payload.valorMedio);
            }

            toast.success('Registro atualizado!');
            await carregarHistorico();
            onUpdated?.();
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Erro ao salvar alterações.');
        } finally {
            setLinhasSalvando((prev) => ({ ...prev, [histId]: false }));
        }
    };

    const handleExcluirHistorico = async (histId) => {
        if (!imposto?.id) return;

        const token = getToken();
        if (!token) {
            toast.error('Sessão expirada. Faça login novamente.');
            return;
        }

        setLinhasExcluindo((prev) => ({ ...prev, [histId]: true }));
        try {
            const res = await fetch(`${API_URL}/api/impostos/${imposto.id}/historico/${histId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Erro ao remover pagamento.');
            }

            const payload = await res.json().catch(() => ({}));
            if (payload?.valorMedio !== undefined) {
                setValorMedio(payload.valorMedio);
            }

            toast.success('Pagamento removido.');
            await carregarHistorico();
            onUpdated?.();
        } catch (error) {
            console.error(error);
            toast.error(error.message || 'Erro ao remover pagamento.');
        } finally {
            setLinhasExcluindo((prev) => ({ ...prev, [histId]: false }));
        }
    };

    const corpoHistorico = useMemo(() => {
        if (carregandoHistorico) {
            return <p className={styles.loadingMessage}>Carregando histórico...</p>;
        }

        if (!historico.length) {
            return <p className={styles.emptyMessage}>Nenhum pagamento registrado até o momento.</p>;
        }

        return (
            <div className={styles.historyList}>
                {historico.map((registro) => (
                    <div key={registro.ID_Historico} className={styles.historyRow}>
                        <input
                            type="date"
                            value={registro.Data_Registro || ''}
                            readOnly
                            className={`${styles.input} ${styles.historyDate}`}
                        />
                        <input
                            type="text"
                            className={`${styles.input} ${styles.historyValue}`}
                            value={historicoValores[registro.ID_Historico] ?? ''}
                            onChange={(event) => handleAlterarValorHistorico(registro.ID_Historico, event.target.value)}
                        />
                        <div className={styles.historyActions}>
                            <button
                                type="button"
                                className={`${styles.btnAction} ${styles.btnSalvarHistorico}`}
                                onClick={() => handleSalvarHistorico(registro.ID_Historico)}
                                disabled={Boolean(linhasSalvando[registro.ID_Historico])}
                            >
                                {linhasSalvando[registro.ID_Historico] ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button
                                type="button"
                                className={`${styles.btnAction} ${styles.btnExcluirHistorico}`}
                                onClick={() => handleExcluirHistorico(registro.ID_Historico)}
                                disabled={Boolean(linhasExcluindo[registro.ID_Historico])}
                            >
                                {linhasExcluindo[registro.ID_Historico] ? 'Removendo...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    }, [carregandoHistorico, historico, historicoValores, linhasSalvando, linhasExcluindo]);

    if (!open) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
                <div className={styles.modalHeader}>
                    <h5>Editar Imposto</h5>
                    <button type="button" className={styles.btnClose} onClick={onClose} aria-label="Fechar">
                        &times;
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>Dados do imposto</div>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label htmlFor="nome-imposto">Nome do imposto</label>
                                <input
                                    id="nome-imposto"
                                    type="text"
                                    className={styles.input}
                                    value={nome}
                                    onChange={(event) => setNome(event.target.value)}
                                    placeholder="Informe o nome"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="categoria-imposto">Categoria</label>
                                <input
                                    id="categoria-imposto"
                                    type="text"
                                    className={styles.input}
                                    value={categoria}
                                    onChange={(event) => setCategoria(event.target.value)}
                                    placeholder="Opcional"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="frequencia-imposto">Frequência</label>
                                <select
                                    id="frequencia-imposto"
                                    className={styles.select}
                                    value={frequencia}
                                    onChange={(event) => setFrequencia(event.target.value)}
                                >
                                    <option value="mensal">Mensal</option>
                                    <option value="anual">Anual</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="valor-medio">Valor médio calculado</label>
                                <input
                                    id="valor-medio"
                                    type="text"
                                    className={styles.readonlyInput}
                                    value={formatCurrency(valorMedio)}
                                    readOnly
                                />
                                <span className={styles.helperText}>
                                    Valor que será dividido pelo número de meses ou anos, conforme a frequência selecionada.
                                </span>
                            </div>
                        </div>
                    </section>

                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>Registrar pagamento</div>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label htmlFor="novo-valor">Valor pago</label>
                                <input
                                    id="novo-valor"
                                    type="text"
                                    className={styles.input}
                                    value={novoValor}
                                    onChange={(event) => setNovoValor(sanitizeNumericInput(event.target.value))}
                                    placeholder="0,00"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="nova-data">Data do pagamento (opcional)</label>
                                <input
                                    id="nova-data"
                                    type="date"
                                    className={styles.input}
                                    value={novaData}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={(event) => setNovaData(event.target.value)}
                                />
                                <span className={styles.helperText}>
                                    Caso deixe em branco, será usada a data de hoje.
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className={`${styles.btnAction} ${styles.btnAdicionar}`}
                            onClick={handleRegistrarPagamento}
                            disabled={registrandoPagamento}
                        >
                            {registrandoPagamento ? 'Registrando...' : 'Registrar novo pagamento'}
                        </button>
                    </section>

                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>Histórico de pagamentos</div>
                        {corpoHistorico}
                    </section>
                </div>

                <div className={styles.modalFooter}>
                    <button
                        type="button"
                        className={`${styles.btnFooter} ${styles.btnCancel}`}
                        onClick={onClose}
                        disabled={salvandoImposto}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className={`${styles.btnFooter} ${styles.btnSave}`}
                        onClick={handleSalvarImposto}
                        disabled={salvandoImposto}
                    >
                        {salvandoImposto ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalEditarImposto;
