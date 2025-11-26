import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import styles from './ModalCadastroImposto.module.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ModalCadastroImposto = ({ onClose, onSave }) => {
    const [nome, setNome] = useState(null);
    const [categoria, setCategoria] = useState('');
    const [frequencia, setFrequencia] = useState('mensal');
    const [valor, setValor] = useState('');
    const [opcoesNomes, setOpcoesNomes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const getToken = () => localStorage.getItem('token');

    useEffect(() => {
        const fetchNomesImpostos = async () => {
            const token = getToken();
            try {
                const res = await fetch(`${API_URL}/api/impostos/nomes`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Erro ao buscar nomes de impostos');
                const data = await res.json();
                setOpcoesNomes(data.map(nome => ({ label: nome, value: nome })));
            } catch (error) {
                console.error(error);
                toast.error('Falha ao carregar sugestões de impostos.');
            }
        };
        fetchNomesImpostos();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nome || !valor || !frequencia) {
            toast.warn('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        setIsLoading(true);
        const token = getToken();
        const impostoData = {
            nome: nome.value,
            categoria,
            frequencia,
            valor: parseFloat(valor.replace(',', '.')),
        };

        try {
            const res = await fetch(`${API_URL}/api/impostos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(impostoData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Erro ao salvar imposto');
            }

            toast.success('Imposto salvo com sucesso!');
            onSave(); // Callback para atualizar a lista na página principal
            onClose(); // Fecha o modal
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2 className={styles.modalTitle}>Cadastrar Imposto</h2>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="nome">Nome do Imposto</label>
                        <CreatableSelect
                            id="nome"
                            isClearable
                            isSearchable
                            options={opcoesNomes}
                            value={nome}
                            onChange={setNome}
                            placeholder="Digite ou selecione um imposto"
                            formatCreateLabel={inputValue => `Criar novo: "${inputValue}"`}
                        />
                        <small>Você pode digitar um novo nome ou escolher um já existente para adicionar um novo pagamento.</small>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="categoria">Categoria (Opcional)</label>
                        <input
                            id="categoria"
                            type="text"
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            placeholder="Ex: Federal, Estadual, Municipal"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Frequência de Pagamento</label>
                        <div className={styles.radioGroup}>
                            <label>
                                <input
                                    type="radio"
                                    value="mensal"
                                    checked={frequencia === 'mensal'}
                                    onChange={() => setFrequencia('mensal')}
                                />
                                Mensal
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="anual"
                                    checked={frequencia === 'anual'}
                                    onChange={() => setFrequencia('anual')}
                                />
                                Anual
                            </label>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="valor">Valor Pago</label>
                        <input
                            id="valor"
                            type="text"
                            inputMode="decimal"
                            value={valor}
                            onChange={(e) => {
                                const value = e.target.value;
                                // Permite apenas números, vírgula e ponto
                                if (/^[0-9]*[,.]?[0-9]*$/.test(value)) {
                                    setValor(value);
                                }
                            }}
                            placeholder="0,00"
                            required
                        />
                    </div>

                    <div className={styles.buttonGroup}>
                        <button type="button" onClick={onClose} className={styles.btnCancel} disabled={isLoading}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.btnSave} disabled={isLoading}>
                            {isLoading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalCadastroImposto;
