import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import PropTypes from 'prop-types';
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import ModelPage from '../ModelPage';
import { showPermissionDeniedOnce } from '../../../utils/permissionToast';
import ModalCadastroDespesa from '../../../components/Modals/ModalCadastroDespesa/ModalCadastroDespesa';
import ModalEditaDespesa from '../../../components/Modals/ModalCadastroDespesa/ModalEditaDespesa';
import ModalCadastroImposto from '../../../components/Modals/ModalCadastroImposto/ModalCadastroImposto';
import ModalEditarImposto from '../../../components/Modals/ModalCadastroImposto/ModalEditarImposto';
import ModalSelecaoTipoDespesa from '../../../components/Modals/ModalSelecaoTipoDespesa';
import styles from './Despesas.module.css';
import { FaMoneyBillWave, FaTrash, FaRegClock, FaHandHoldingUsd } from 'react-icons/fa';
import { MdOutlineCalendarMonth } from 'react-icons/md';
import { BiMoneyWithdraw, BiRepeat } from "react-icons/bi";
import { useInfiniteScroll } from '../../../hooks/useInfiniteScroll';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function Despesas() {
  const [termoBusca, setTermoBusca] = useState('');
  const [despesas, setDespesas] = useState([]);
  const [impostos, setImpostos] = useState([]);
  const [mostrarModalSelecao, setMostrarModalSelecao] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalImposto, setMostrarModalImposto] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarModalEditarImposto, setMostrarModalEditarImposto] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [impostoSelecionado, setImpostoSelecionado] = useState(null);
  // Estado para sincronizar hover entre cards e painel
  // Usar chave composta para evitar colisão de IDs entre despesas e impostos
  const [hoveredKey, setHoveredKey] = useState(null);
  // Estados para tabs mobile
  const [activeMobileTab, setActiveMobileTab] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  // Estado de ordenação e filtro
  const [ordenacao, setOrdenacao] = useState('nome-asc'); // Padrão: ordem alfabética crescente
  const [filtroTipo, setFiltroTipo] = useState('todos'); // todos, despesas, impostos
  // Controle de busca para evitar respostas antigas sobrescrevendo o estado
  const termoBuscaRef = useRef('');
  const despesasRequestIdRef = useRef(0);
  const impostosRequestIdRef = useRef(0);

  // Ajustar estado mobile baseado no tamanho da tela
  useEffect(() => {
    const ajustarIsMobile = () => {
      const largura = window.innerWidth;
      setIsMobile(largura < 768);
    };

    ajustarIsMobile();
    window.addEventListener('resize', ajustarIsMobile);

    return () => window.removeEventListener('resize', ajustarIsMobile);
  }, []);

  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    termoBuscaRef.current = termoBusca;
  }, [termoBusca]);

  const fetchDespesas = useCallback(async (termo = termoBuscaRef.current || '') => {
    const requestId = ++despesasRequestIdRef.current;
    const token = getToken();
    if (!token) {
      console.log('Sem token, não busca despesas');
      return;
    }

    try {
      console.log('Buscando despesas com termo:', termo);
      const timestamp = new Date().getTime();
      const url = `${API_URL}/api/despesas?limit=10000&search=${encodeURIComponent(termo)}&_t=${timestamp}`;

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });

      if (!res.ok) {
        if (res.status === 403) {
          showPermissionDeniedOnce();
          setDespesas([]);
          return;
        }
        console.error('Erro na resposta:', res.status);
        throw new Error('Erro ao buscar despesas');
      }

      const data = await res.json();
      console.log('Dados recebidos da API:', data);

      // Normaliza os dados
      const despesasNormalizadas = data.map(item => ({
        ...item,
        id: item.ID_Despesa,
        nome: item.Nome_Despesa,
        custoMensal: item.Custo_Mensal,
        tempoOperacional: item.Tempo_Operacional,
        data: item.Data_Despesa,
      }));

      console.log('Despesas normalizadas:', despesasNormalizadas);
      if (requestId === despesasRequestIdRef.current) {
        setDespesas(despesasNormalizadas);
      }
    } catch (error) {
      console.error('Erro no fetchDespesas:', error);
      if (requestId === despesasRequestIdRef.current) {
        setDespesas([]);
      }
      // Evita mensagem duplicada quando já foi 403
      if (!(error?.message && error.message.includes('403'))) {
        toast.error('Falha ao buscar despesas.');
      }
    }
  }, []);

  const fetchImpostos = useCallback(async (termo = termoBuscaRef.current || '') => {
    const requestId = ++impostosRequestIdRef.current;
    const token = getToken();
    if (!token) return;

    try {
      const timestamp = new Date().getTime();
      const url = `${API_URL}/api/impostos?limit=10000&search=${encodeURIComponent(termo)}&_t=${timestamp}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });

      if (!res.ok) {
        if (res.status === 403) {
          showPermissionDeniedOnce();
          setImpostos([]);
          return;
        }
        throw new Error('Erro ao buscar impostos');
      }

      const data = await res.json();
      const impostosNormalizados = data.map(item => ({
        ...item,
        id: item.ID_Imposto,
        nome: item.Nome_Imposto,
        tipo: 'imposto', // Adiciona um tipo para diferenciação
        custoMensal: item.Frequencia === 'anual' ? item.Valor_Medio / 12 : item.Valor_Medio,
        tempoOperacional: 24, // Impostos impactam o custo 24h por dia
      }));
      if (requestId === impostosRequestIdRef.current) {
        setImpostos(impostosNormalizados);
      }
    } catch (error) {
      console.error('Erro no fetchImpostos:', error);
      if (requestId === impostosRequestIdRef.current) {
        setImpostos([]);
      }
      toast.error('Falha ao buscar impostos.');
    }
  }, []);

  // Combina, filtra e ordena despesas e impostos
  const todosOsCustos = useMemo(() => {
    // Primeiro, combinar os dados
    let custos = [...despesas, ...impostos];

    // Filtrar por tipo
    if (filtroTipo === 'despesas') {
      custos = despesas;
    } else if (filtroTipo === 'impostos') {
      custos = impostos;
    }

    // Filtro defensivo no cliente para garantir que apenas nomes que contenham o termo apareçam
    const termo = (termoBusca || '').trim().toLowerCase();
    if (termo) {
      custos = custos.filter((item) => {
        const nome = (item.nome || item.Nome_Despesa || item.Nome_Imposto || '').toLowerCase();
        return nome.includes(termo);
      });
    }

    // Ordenar conforme selecionado
    // Evitar mutação in-place: sempre ordenar uma cópia
    switch (ordenacao) {
      case 'nome-asc':
        return [...custos].sort((a, b) => {
          const nomeA = (a.nome || a.Nome_imposto || '').toLowerCase();
          const nomeB = (b.nome || b.Nome_imposto || '').toLowerCase();
          return nomeA.localeCompare(nomeB);
        });
      case 'nome-desc':
        return [...custos].sort((a, b) => {
          const nomeA = (a.nome || a.Nome_imposto || '').toLowerCase();
          const nomeB = (b.nome || b.Nome_imposto || '').toLowerCase();
          return nomeB.localeCompare(nomeA);
        });
      case 'preco-asc':
        return [...custos].sort((a, b) => {
          const valorA = parseFloat(a.custoMensal || a.Custo_Mensal || a.valor || a.Valor_imposto || 0);
          const valorB = parseFloat(b.custoMensal || b.Custo_Mensal || b.valor || b.Valor_imposto || 0);
          return valorA - valorB;
        });
      case 'preco-desc':
        return [...custos].sort((a, b) => {
          const valorA = parseFloat(a.custoMensal || a.Custo_Mensal || a.valor || a.Valor_imposto || 0);
          const valorB = parseFloat(b.custoMensal || b.Custo_Mensal || b.valor || b.Valor_imposto || 0);
          return valorB - valorA;
        });
      case 'padrao':
      default:
        // Último cadastrado (data mais recente primeiro)
        return [...custos].sort((a, b) =>
          new Date(b.data || b.Data_Atualizacao) - new Date(a.data || a.Data_Atualizacao)
        );
    }
  }, [despesas, impostos, filtroTipo, ordenacao]);

  // Hook para scroll infinito com 20 itens por vez
  const { displayedItems, hasMore } = useInfiniteScroll(todosOsCustos, 20);
  const cardRefs = React.useRef({});
  const setCardRef = (key) => (el) => { if (el) cardRefs.current[key] = el; };

  const ensureVisible = async (key) => {
    // Não force carregamento nem remonte a lista ao passar o mouse no painel.
    // Apenas role até o card se ele já estiver renderizado.
    const el = cardRefs.current[key];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  useEffect(() => {
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    const fetchData = () => {
      fetchDespesas(termoBusca);
      fetchImpostos(termoBusca);
    };

    if (isFirefox) {
      const timer = setTimeout(fetchData, 100);
      return () => clearTimeout(timer);
    } else {
      fetchData();
    }
  }, [fetchDespesas, fetchImpostos, termoBusca]);

  useEffect(() => {
    fetchDespesas('');
    fetchImpostos('');
  }, [fetchDespesas, fetchImpostos]);

  const salvarItem = async () => {
    await fetchDespesas();
    await fetchImpostos();
  };

  const atualizarDespesa = async (despesaAtualizada) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/despesas/${despesaAtualizada.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          nome: despesaAtualizada.nome,
          custoMensal: despesaAtualizada.custoMensal,
          tempoOperacional: despesaAtualizada.tempoOperacional
        })
      });

      if (!res.ok) throw new Error('Erro ao atualizar despesa');

      // Recarrega todas as despesas após editar
      await fetchDespesas();

      setMostrarModalEditar(false);
      toast.success('Despesa atualizada com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar despesa.');
    }
  };

  const removerDespesa = async (id) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/despesas/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Erro ao remover despesa');

      setDespesas(prev => prev.filter(d => d.id !== id));
      toast.success('Despesa removida com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover despesa.');
    }
  };

  // Abrir modal avançado de edição de imposto com histórico
  const editarImposto = (imposto) => {
    setImpostoSelecionado(imposto);
    setMostrarModalEditarImposto(true);
  };

  const removerImposto = async (id) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/impostos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Erro ao remover imposto');

      setImpostos(prev => prev.filter(i => i.id !== id));
      toast.success('Imposto removido com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover imposto.');
    }
  };

  const handleAbrirModal = () => {
    const role = localStorage.getItem('role');
    if (role === 'Funcionário') {
      toast.error('Nível de permissão insuficiente');
      return;
    }
    setMostrarModalSelecao(true);
  };

  const handleFecharModais = () => {
    setMostrarModalSelecao(false);
    setMostrarModal(false);
    setMostrarModalImposto(false);
    setMostrarModalEditar(false);
    setMostrarModalEditarImposto(false);
    setItemSelecionado(null);
    setImpostoSelecionado(null);
  };

  const handleSelecaoTipo = (tipo) => {
    setMostrarModalSelecao(false);
    if (tipo === 'operacional') {
      setMostrarModal(true);
    } else if (tipo === 'imposto') {
      setMostrarModalImposto(true);
    }
  };

  // Função para calcular custo operacional por minuto
  const calcularCustoOperacional = (custoMensal, tempoOperacional) => {
    const diasNoMes = 30;
    const custoMensalNum = Number(custoMensal);
    const tempoDiaNum = Number(tempoOperacional);

    if (!custoMensalNum || !tempoDiaNum) return 0;

    const custoDiario = custoMensalNum / diasNoMes;
    const custoPorHora = custoDiario / tempoDiaNum;
    const custoPorMinuto = custoPorHora / 60;
    return custoPorMinuto;
  };

  const renderCardImposto = (imposto) => {
    const custoOperacionalPorMinuto = calcularCustoOperacional(imposto.custoMensal, imposto.tempoOperacional);

    return (
      <div
        key={imposto.id}
        className={isMobile ? "col-12 mb-3" : "col-12"}
        style={
          isMobile
            ? {
              width: 'calc(100% - 20px)',
              marginBottom: '25px',
              marginTop: '25px',
              marginLeft: '10px',
              marginRight: '10px',
            }
            : {
              width: '100%',
              marginBottom: '1.3rem',
              display: 'flex',
              justifyContent: 'center',
              marginLeft: '0px',
            }
        }
      >
        <div
          className={`${styles.cardDespesa} ${hoveredKey === `imposto-${imposto.id}` ? styles.cardDespesaHovered : ''}`}
          style={{
            cursor: 'pointer',
            width: '100%',
            miWidth: '520px',
            margin: '0 auto',
            /* roxo mais escuro apenas para imposto */
            background: ' rgba(79, 58, 111, 1)',
            border: '1px solid rgba(108,79,153,0.35)'
          }}
          onClick={() => {
            // abre edição do imposto
            editarImposto(imposto);
          }}
          onMouseEnter={() => {
            setHoveredKey(`imposto-${imposto.id}`);
          }}
          onMouseLeave={() => {
            if (hoveredKey === `imposto-${imposto.id}`) setHoveredKey(null);
          }}
          ref={setCardRef(`imposto-${imposto.id}`)}
        >
          <i
            className={styles.Trash}
            onClick={(e) => {
              e.stopPropagation();
              Swal.fire({
                title: 'Tem certeza?',
                text: 'Você deseja excluir este imposto?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sim, excluir',
                cancelButtonText: 'Cancelar',
              }).then((result) => {
                if (result.isConfirmed) {
                  removerImposto(imposto.id);
                  Swal.fire(
                    'Excluído!',
                    'O imposto foi removido com sucesso.',
                    'success'
                  );
                }
              });
            }}
          >
            <FaTrash />
          </i>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
            <h3 className="fw-bold mb-2 mt-2" style={{ fontSize: '1.15rem', textAlign: 'center', margin: 0 }}>
              {imposto.nome}
            </h3>
            {imposto.nome === 'DAS' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  Swal.fire({
                    title: 'DAS',
                    html: '<p style="text-align:left">DAS (Documento de Arrecadação do Simples Nacional) é o tributo mensal que reúne impostos e contribuições de micro e pequenas empresas optantes pelo Simples.</p>',
                    icon: 'info',
                    confirmButtonText: 'Fechar',
                    customClass: { popup: styles.swalPopup, content: styles.swalContent, confirmButton: styles.swalConfirm }
                  });
                }}
                title="DAS — clique para mais detalhes"
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  padding: 0,
                  marginLeft: '6px'
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                ?
              </button>
            )}
          </div>
          {/* Seção de informações principais */}
          <div className="mb-2" style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '0.5rem' }}>
            <div className="row g-2">
              <div className="col-6 d-flex flex-column justify-content-center">
                <div className="text-center">
                  <div className="d-flex align-items-center justify-content-center mb-1">
                    <BiRepeat className="me-1" style={{ fontSize: '1.3rem', color: 'var(--tangerine)' }} />
                    <small className="text-white-50" style={{ fontSize: '0.9rem' }}>Frequência</small>
                  </div>
                  <div className="fw-bold text-white" style={{ fontSize: '1rem' }}>
                    {imposto.Frequencia.charAt(0).toUpperCase() + imposto.Frequencia.slice(1)}
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="text-center">
                  <div className="d-flex align-items-center justify-content-center mb-1">
                    <MdOutlineCalendarMonth className="me-1" style={{ fontSize: '1.3rem', color: 'var(--sunset)' }} />
                    <small className="text-white-50" style={{ fontSize: '0.9rem' }}>Custo Mensal</small>
                  </div>
                  <div className="fw-bold text-white" style={{ fontSize: '1rem' }}>
                    R$ {Number(imposto.custoMensal).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Breakdown de custos + Custo operacional juntos (no mobile ocultar o breakdown) */}
          <div className="d-flex align-items-center justify-content-between" style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '8px', padding: '0.5rem', marginTop: '0.2rem' }}>
            {!isMobile && (
              <div style={{ flex: 1 }}>
                <div className="text-center mb-1">
                  <small className="text-white-50" style={{ fontSize: '0.9rem' }}>BREAKDOWN DE CUSTOS</small>
                </div>
                <div className="d-flex justify-content-between" style={{ fontSize: '1.0rem' }}>
                  <div className="text-center" style={{ flex: 1 }}>
                    <small className="text-white-50">Por dia:</small>
                    <div className="text-white fw-semibold">
                      R$ {(Number(imposto.custoMensal) / 30).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center" style={{ flex: 1 }}>
                    <small className="text-white-50">Por hora:</small>
                    <div className="text-white fw-semibold">
                      R$ {((Number(imposto.custoMensal) / 30) / Number(imposto.tempoOperacional || 24)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div style={{
              background: 'linear-gradient(45deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.2))',
              borderRadius: '8px',
              padding: '0.5rem 0.7rem',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              marginLeft: isMobile ? '0' : '0.7rem',
              minWidth: '120px',
              textAlign: 'center',
              width: isMobile ? '100%' : 'auto'
            }}>
              <div className="fw-bold mb-1" style={{ fontSize: '0.85rem', color: 'var(--sunset)' }}>
                <FaHandHoldingUsd style={{ marginRight: '6px', color: 'var(--tangerine)' }} /> Imposto
              </div>
              <div className="fw-bold" style={{ fontSize: '1.1rem', color: '#FFD700' }}>
                R$ {custoOperacionalPorMinuto.toFixed(3)}/min
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCard = (item) => {
    if (item.tipo === 'imposto') {
      return renderCardImposto(item);
    }
    const despesa = item;
    const custoOperacionalPorMinuto = calcularCustoOperacional(despesa.custoMensal, despesa.tempoOperacional);

    return (
      <div
        key={despesa.id}
        className={isMobile ? "col-12 mb-3" : "col-12"}
        style={
          isMobile
            ? {
              width: 'calc(100% - 20px)',
              marginBottom: '25px',
              marginTop: '25px',
              marginLeft: '10px',
              marginRight: '10px',
            }
            : {
              width: '100%',
              marginBottom: '1.3rem',
              display: 'flex',
              justifyContent: 'center',
              marginLeft: '0px',
            }
        }
      >
        <div
          className={`${styles.cardDespesa} ${hoveredKey === `despesa-${despesa.id}` ? styles.cardDespesaHovered : ''}`}
          onClick={() => {
            setItemSelecionado(despesa);
            setMostrarModalEditar(true);
          }}
          onMouseEnter={() => {
            setHoveredKey(`despesa-${despesa.id}`);
          }}
          onMouseLeave={() => {
            if (hoveredKey === `despesa-${despesa.id}`) setHoveredKey(null);
          }}
          style={{
            cursor: 'pointer',
            width: '100%',
            maxWidth: '520px',
            margin: '0 auto'
          }}
          ref={setCardRef(`despesa-${despesa.id}`)}
        >
          <i
            className={styles.Trash}
            onClick={(e) => {
              e.stopPropagation();
              Swal.fire({
                title: 'Tem certeza?',
                text: 'Você deseja excluir esta despesa?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sim, excluir',
                cancelButtonText: 'Cancelar',
              }).then((result) => {
                if (result.isConfirmed) {
                  removerDespesa(despesa.id);
                  Swal.fire(
                    'Excluído!',
                    'A despesa foi removida com sucesso.',
                    'success'
                  );
                }
              });
            }}
          >
            <FaTrash />
          </i>

          <h3
            className="fw-bold mb-2 mt-2 text-center"
            style={
              isMobile
                ? {
                  fontSize: '1.15rem',
                  position: 'relative',
                  top: '-15px',
                }
                : { fontSize: '1.15rem' }
            }
          >
            {despesa.nome}
          </h3>

          {/* Seção de informações principais */}
          <div className="mb-2" style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '0.5rem' }}>
            <div className="row g-2">
              <div className="col-6">
                <div className="text-center">
                  <div className="d-flex align-items-center justify-content-center mb-1">
                    <MdOutlineCalendarMonth className="me-1" style={{ fontSize: '1.3rem', color: 'var(--sunset)' }} />
                    <small className="text-white-50" style={{ fontSize: '0.9rem' }}>Mensal</small>
                  </div>
                  <div className="fw-bold text-white" style={{ fontSize: '1rem' }}>
                    R$ {Number(despesa.custoMensal).toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="col-6">
                <div className="text-center">
                  <div className="d-flex align-items-center justify-content-center mb-1">
                    <FaRegClock className="me-1" style={{ fontSize: '1.3rem', color: 'var(--tangerine)' }} />
                    <small className="text-white-50" style={{ fontSize: '0.9rem' }}>Tempo/Dia</small>
                  </div>
                  <div className="fw-bold text-white" style={{ fontSize: '1rem' }}>
                    {despesa.tempoOperacional}h
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown de custos + Custo operacional juntos (no mobile ocultar o breakdown) */}
          <div className="d-flex align-items-center justify-content-between" style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '8px', padding: '0.5rem', marginTop: '0.2rem' }}>
            {!isMobile && (
              <div style={{ flex: 1 }}>
                <div className="text-center mb-1">
                  <small className="text-white-50" style={{ fontSize: '0.9rem' }}>BREAKDOWN DE CUSTOS</small>
                </div>
                <div className="d-flex justify-content-between" style={{ fontSize: '1.0rem' }}>
                  <div className="text-center" style={{ flex: 1 }}>
                    <small className="text-white-50">Por dia:</small>
                    <div className="text-white fw-semibold">
                      R$ {(Number(despesa.custoMensal) / 30).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center" style={{ flex: 1 }}>
                    <small className="text-white-50">Por hora:</small>
                    <div className="text-white fw-semibold">
                      R$ {((Number(despesa.custoMensal) / 30) / Number(despesa.tempoOperacional)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div style={{
              background: 'linear-gradient(45deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.2))',
              borderRadius: '8px',
              padding: '0.5rem 0.7rem',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              marginLeft: isMobile ? '0' : '0.7rem',
              minWidth: '120px',
              textAlign: 'center',
              width: isMobile ? '100%' : 'auto'
            }}>
              <div className="fw-bold mb-1" style={{ fontSize: '0.85rem', color: 'var(--sunset)' }}>
                <FaMoneyBillWave style={{ marginRight: '6px', color: 'var(--sunset)' }} /> Despesa Operacional
              </div>
              <div className="fw-bold" style={{ fontSize: '1.1rem', color: '#FFD700' }}>
                R$ {custoOperacionalPorMinuto.toFixed(3)}/min
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Calcular custo operacional total
  const custoOperacionalTotal = todosOsCustos.reduce((total, item) => {
    return total + calcularCustoOperacional(item.custoMensal, item.tempoOperacional);
  }, 0);

  // Componente do painel lateral - versão responsiva
  const PainelCustoOperacional = React.memo(({ isMobileVersion = false, itens = [] }) => (
    <>
      {/* Estilo customizado para scrollbar */}
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: var(--ultra-violet);
            border-radius: 10px;
            border: 2px solid rgba(255, 255, 255, 0.1);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            /* keep hover in purple (slightly darker) instead of orange */
            background: rgba(108,79,153,0.95);
          }

          /* mobile cost content scrollbar styling */
          .mobile-cost-content::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          .mobile-cost-content::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.06);
            border-radius: 10px;
          }
          .mobile-cost-content::-webkit-scrollbar-thumb {
            background: var(--ultra-violet);
            border-radius: 10px;
            border: 2px solid rgba(255, 255, 255, 0.06);
          }
          .mobile-cost-content::-webkit-scrollbar-thumb:hover {
            background: rgba(108,79,153,0.95);
          }
          
          /* Estilos específicos para mobile */
          .mobile-cost-panel {
            position: relative;
            width: 470px;
            /* deixa responsivo e limita pelo viewport para evitar cartões gigantes em mobile */
            max-width: calc(100vw - 2rem);
            display: flex;
            flex-direction: column;
            height: auto;
            max-height: calc(60vh + 125px); /* aumentado em 125px */
            margin: -5px auto 0 auto;
          }

          .mobile-cost-content {
            /* conteúdo interna com scroll quando necessário — evita painel demasiado alto */
            overflow-y: auto;
            padding: 12px 16px 0 16px;
            flex: 1 1 auto;
            min-height: 100px;
            /* usar o mesmo limite que a versão desktop para manter consistência
              aqui diminuímos o máximo interno para que a lista role como no desktop */
            max-height: calc(60vh - 120px); /* revertido */
            -webkit-overflow-scrolling: touch;
          }
          
          .mobile-cost-footer {
            height: auto; /* Altura automática para acomodar a seção de soma */
            min-height: 120px;
            background: linear-gradient(45deg, var(--ultra-violet), var(--ultra-violet));
            padding: 16px;
            border-radius: 0 0 15px 15px;
            border-top: 2px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(10px);
            z-index: 10;
          }
        `}
      </style>

      <div
        className={isMobileVersion ? "mobile-cost-panel" : "card shadow-lg border-0"}
        style={isMobileVersion ? {
          background: 'linear-gradient(135deg, var(--ultra-violet) 0%, var(--ultra-violet) 100%)',
          borderRadius: '16px',
          overflow: 'hidden',
          margin: '0 1rem',
          width: '100%',
        } : {
          position: 'relative',
          background: 'linear-gradient(135deg, var(--ultra-violet) 0%, var(--ultra-violet) 100%)',
          minHeight: '220px',
          maxHeight: 'calc(64vh + 125px)', /* aumentado em 125px */
          borderRadius: '12px',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '600px',
          boxSizing: 'border-box'
        }}
      >
        {!isMobileVersion && (
          <div
            className="card-header border-0 text-white text-center"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <h5 className="card-title mb-0 fw-bold"
              style={{
                fontSize: '1.4rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
              <i className="bi bi-calculator me-2"></i>
              Custo Operacional
            </h5>
          </div>
        )}

        <div className={isMobileVersion ? "mobile-cost-content" : "card-body text-white quiet-scrollbar"} style={isMobileVersion ? { padding: '1rem' } : { padding: '1rem', maxHeight: 'calc(64vh + 125px)', overflowY: 'auto' }}>
          {/* Seção de detalhamento */}
          <div className={isMobileVersion ? "mb-2" : "mb-5"}>
            <h6
              className={isMobileVersion ? "mb-2 fw-semibold" : "mb-3 fw-semibold"}
              style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: isMobileVersion ? '1rem' : '1.1rem',
                borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
                paddingBottom: '0.5rem'
              }}
            >
              <i className="bi bi-list-ul me-2"></i>
              {isMobileVersion ? 'Detalhamento' : 'Detalhamento por Despesa'}
            </h6>

            {/* Legenda mais evidente e diferente dos cards */}
            <div
              className="mb-3"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
                padding: '0.75rem 0.9rem',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.9rem',
                justifyContent: 'space-between',
                border: '1px dashed rgba(255,255,255,0.3)',
                boxShadow: '0 6px 14px rgba(0,0,0,0.08)',
                flexWrap: 'wrap'
              }}
            >
              <span style={{
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.78rem'
              }}>
                Legenda
              </span>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.9rem',
                justifyContent: 'flex-end',
                flex: 1,
                minWidth: '260px'
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.28rem 0.6rem',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: 'rgba(255,255,255,0.95)'
                }}>
                  <FaMoneyBillWave style={{ color: 'var(--sunset)', fontSize: '1rem' }} />
                  Despesa Operacional
                </span>

                <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>

                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0.28rem 0.6rem',
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.14)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: 'rgba(255,255,255,0.95)'
                }}>
                  <FaHandHoldingUsd style={{ color: 'var(--tangerine)', fontSize: '1rem' }} />
                  Imposto
                </span>
              </div>
            </div>

            <div
              className="custom-scrollbar"
              style={isMobileVersion ? {
                maxHeight: 'calc(60vh - 200px)',
                overflowY: 'scroll',
                paddingRight: '10px',
                marginTop: '0.8rem',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.5)'
              } : {
                maxHeight: '240px',
                overflowY: 'scroll',
                paddingRight: '10px',
                marginTop: '0.8rem',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.5) rgba(255,255,255,0.1)'
              }}
            >
              {itens.map((item) => {
                const custoMinuto = calcularCustoOperacional(item.custoMensal, item.tempoOperacional);
                const key = `${item.tipo || 'despesa'}-${item.id}`;
                return (
                  <div
                    key={key}
                    className="d-flex justify-content-between align-items-center mb-3 p-2 rounded"
                    style={{
                      background: hoveredKey === key ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                      transform: hoveredKey === key ? 'translateX(5px)' : 'translateX(0px)',
                      backdropFilter: 'blur(5px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={() => {
                      setHoveredKey(key);
                      ensureVisible(key);
                    }}
                    onMouseLeave={() => {
                      if (hoveredKey === key) setHoveredKey(null);
                    }}
                  >
                    <span
                      className="text-truncate fw-medium d-flex align-items-center"
                      style={{
                        maxWidth: '180px',
                        color: 'rgba(255, 255, 255, 0.95)'
                      }}
                    >
                      {item.tipo === 'imposto' ? (
                        <FaHandHoldingUsd style={{ color: 'var(--tangerine)', marginRight: '6px' }} />
                      ) : (
                        <FaMoneyBillWave style={{ color: 'var(--sunset)', marginRight: '6px' }} />
                      )}
                      {/* No mobile, manter o nome; ocultar apenas o rótulo adicional */}
                      {item.nome}
                    </span>
                    <span
                      className="fw-bold px-2 py-1 rounded"
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        fontSize: '0.9rem',
                        minWidth: '80px',
                        textAlign: 'center'
                      }}
                    >
                      R$ {custoMinuto.toFixed(4)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seção de soma - apenas no desktop */}
          {itens.length > 1 && !isMobileVersion && (
            <div
              className="mb-2 p-3 rounded"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                marginTop: '0.5rem'
              }}
            >
              <div className="d-flex flex-column">
                <span className="fw-semibold mb-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Soma Total:
                </span>
                <span
                  className="fw-bold"
                  style={{
                    fontSize: '0.85rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontFamily: 'monospace',
                    wordBreak: 'keep-all',
                    whiteSpace: 'nowrap',
                    overflowX: 'auto'
                  }}
                >
                  {itens.map((item) => {
                    const custoMinuto = calcularCustoOperacional(item.custoMensal, item.tempoOperacional);
                    return custoMinuto.toFixed(4);
                  }).join(' + ')} =
                </span>
              </div>
            </div>
          )}

          {/* Resultado final - condicional baseado na versão */}
          {!isMobileVersion && (
            <div
              className="text-center p-3 rounded-3"
              style={{
                background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))',
                backdropFilter: 'blur(15px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                marginTop: '1rem'
              }}
            >
              <h6
                className="mb-2 fw-bold"
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '1.1rem',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                <i style={{ color: 'var(--sunset)', marginRight: '8px', fontSize: '1.5rem' }}>
                  <BiMoneyWithdraw />
                </i>
                Custo Operacional Total
              </h6>
              <h3
                className="mb-0 fw-bold"
                style={{
                  background: 'linear-gradient(45deg, var(--sunset), var(--tangerine))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '2.2rem',
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }}
              >
                R$ {custoOperacionalTotal.toFixed(3)}/min
              </h3>

              {/* Informação adicional removida */}
            </div>
          )}
        </div>

        {/* Footer sticky para mobile */}
        {isMobileVersion && (
          <div className="mobile-cost-footer">
            {/* Resultado final */}
            <div className="text-center">
              <h6
                className="mb-2 fw-bold text-white"
                style={{
                  fontSize: '1rem',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                <i style={{ color: 'var(--sunset)', marginRight: '8px', fontSize: '1.3rem' }}>
                  <BiMoneyWithdraw />
                </i>
                Custo Operacional Total
              </h6>
              <h3
                className="mb-0 fw-bold"
                style={{
                  background: 'linear-gradient(45deg, var(--sunset), var(--tangerine))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '1.8rem',
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }}
              >
                R$ {custoOperacionalTotal.toFixed(3)}/min
              </h3>
            </div>
          </div>
        )}
      </div>
    </>
  ));

  PainelCustoOperacional.displayName = 'PainelCustoOperacional';
  PainelCustoOperacional.propTypes = {
    isMobileVersion: PropTypes.bool,
    itens: PropTypes.array
  };

  // Configuração das tabs mobile
  const mobileTabs = [
    {
      label: 'Despesas',
      icon: 'bi bi-receipt'
    },
    {
      label: 'Custo Operacional',
      icon: 'bi bi-calculator'
    }
  ];

  const painelLateralEl = useMemo(() => (
    <PainelCustoOperacional isMobileVersion={isMobile && activeMobileTab === 1} itens={todosOsCustos} />
  ), [isMobile, activeMobileTab, todosOsCustos]);

  return (
    <>
      {/* Modal de edição de imposto com histórico */}
      {mostrarModalEditarImposto && impostoSelecionado && (
        <ModalEditarImposto
          imposto={impostoSelecionado}
          open={mostrarModalEditarImposto}
          onClose={() => {
            setMostrarModalEditarImposto(false);
            setImpostoSelecionado(null);
          }}
          onUpdated={async () => {
            // Recarrega impostos para refletir alterações
            await fetchImpostos(termoBusca);
          }}
        />
      )}
      {hasMore && (
        <>
          <style>{`@keyframes floatDown{0%{transform:translateY(0)}100%{transform:translateY(8px)}}`}</style>
          <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.8)' }}>
            <i className="bi bi-arrow-down" style={{ fontSize: '1.4rem', animation: 'floatDown 1.2s ease-in-out infinite alternate' }}></i>
            <span style={{ fontSize: '0.9rem' }}>Role para carregar mais itens</span>
          </div>
        </>
      )}
      <ModelPage
        titulo="Despesas cadastradas"
        dados={displayedItems}
        salvarItem={salvarItem}
        removerItem={(id, tipo) => tipo === 'imposto' ? removerImposto(id) : removerDespesa(id)}
        abrirModal={handleAbrirModal}
        fecharModal={handleFecharModais}
        fecharModalEditar={() => { setMostrarModalEditar(false); setItemSelecionado(null); }}
        mostrarModal={mostrarModal || mostrarModalImposto || mostrarModalSelecao}
        mostrarModalEditar={mostrarModalEditar}
        ModalCadastro={() => {
          if (mostrarModalSelecao) {
            return <ModalSelecaoTipoDespesa onSelect={handleSelecaoTipo} onClose={handleFecharModais} />;
          }
          if (mostrarModal) {
            return <ModalCadastroDespesa onClose={handleFecharModais} onSave={salvarItem} />;
          }
          if (mostrarModalImposto) {
            return <ModalCadastroImposto onClose={handleFecharModais} onSave={salvarItem} />;
          }
          return null;
        }}
        ModalEditar={({ onClose, onSave }) => (
          <ModalEditaDespesa
            despesa={itemSelecionado}
            onClose={() => {
              onClose?.();
              setItemSelecionado(null);
            }}
            onSave={(despesaAtualizada) => {
              atualizarDespesa(despesaAtualizada);
              // Após atualização, dispara onSave para sincronizar lista
              onSave?.();
            }}
          />
        )}
        renderCard={renderCard}
        itensPorPagina={isMobile ? 2 : displayedItems.length}
        termoBusca={termoBusca}
        setTermoBusca={setTermoBusca}
        painelLateral={painelLateralEl}
        enableMobileTabs={true}
        mobileTabs={mobileTabs}
        activeMobileTab={activeMobileTab}
        setActiveMobileTab={setActiveMobileTab}
        ordenacao={ordenacao}
        setOrdenacao={setOrdenacao}
        filtroTipo={filtroTipo}
        setFiltroTipo={setFiltroTipo}
      />
    </>
  );
}

export default Despesas;
