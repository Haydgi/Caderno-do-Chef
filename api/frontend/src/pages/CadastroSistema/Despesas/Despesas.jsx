import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import ModelPage from '../ModelPage';
import ModalCadastroDespesa from '../../../components/Modals/ModalCadastroDespesa/ModalCadastroDespesa';
import ModalEditaDespesa from '../../../components/Modals/ModalCadastroDespesa/ModalEditaDespesa';
import ModalCadastroImposto from '../../../components/Modals/ModalCadastroImposto/ModalCadastroImposto';
import ModalSelecaoTipoDespesa from '../../../components/Modals/ModalSelecaoTipoDespesa';
import styles from './Despesas.module.css';
import { FaMoneyBillWave, FaTrash, FaRegClock, FaHandHoldingUsd } from 'react-icons/fa';
import { MdOutlineCalendarMonth } from 'react-icons/md';
import { BiMoneyWithdraw } from "react-icons/bi";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function Despesas() {
  const [termoBusca, setTermoBusca] = useState('');
  const [despesas, setDespesas] = useState([]);
  const [impostos, setImpostos] = useState([]);
  const [mostrarModalSelecao, setMostrarModalSelecao] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalImposto, setMostrarModalImposto] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [despesaSelecionada, setDespesaSelecionada] = useState(null);
  // Estado para sincronizar hover entre cards e painel
  const [hoveredDespesaId, setHoveredDespesaId] = useState(null);
  const [itensPorPagina, setItensPorPagina] = useState(6);
  // Estados para tabs mobile
  const [activeMobileTab, setActiveMobileTab] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Ajustar itens por página baseado no tamanho da tela
  useEffect(() => {
    const ajustarItensPorTamanho = () => {
      const largura = window.innerWidth;
      
      // Atualiza estado mobile
      setIsMobile(largura < 768);

      // Para despesas, ajustamos para mobile com 2 itens por página
      if (largura < 768) {
        setItensPorPagina(2); // 2 itens por página em mobile
      } else if (largura < 992) {
        setItensPorPagina(4);
      } else {
        setItensPorPagina(6);
      }
    };

    ajustarItensPorTamanho();
    window.addEventListener('resize', ajustarItensPorTamanho);

    return () => window.removeEventListener('resize', ajustarItensPorTamanho);
  }, []);

  useEffect(() => {
    const ajustarItensPorTamanho = () => {
      const largura = window.innerWidth;
      if (largura < 577) {
        setItensPorPagina(2);
      } else if (largura < 761) {
        setItensPorPagina(2);
      } else if (largura < 992) {
        setItensPorPagina(3);
      } else {
        setItensPorPagina(3);
      }
    };

    ajustarItensPorTamanho();
    window.addEventListener('resize', ajustarItensPorTamanho);
    return () => window.removeEventListener('resize', ajustarItensPorTamanho);
  }, []);

  const getToken = () => localStorage.getItem('token');

  const fetchDespesas = async (termo = '') => {
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
      setDespesas(despesasNormalizadas);
    } catch (error) {
      console.error('Erro no fetchDespesas:', error);
      setDespesas([]);
      toast.error('Falha ao buscar despesas.');
    }
  };

  const fetchImpostos = async (termo = '') => {
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

      if (!res.ok) throw new Error('Erro ao buscar impostos');
      
      const data = await res.json();
      const impostosNormalizados = data.map(item => ({
        ...item,
        id: item.ID_Imposto,
        nome: item.Nome_Imposto,
        tipo: 'imposto', // Adiciona um tipo para diferenciação
        custoMensal: item.Frequencia === 'anual' ? item.Valor_Medio / 12 : item.Valor_Medio,
        tempoOperacional: 24, // Impostos impactam o custo 24h por dia
      }));
      setImpostos(impostosNormalizados);
    } catch (error) {
  console.error('Erro no fetchImpostos:', error);
  setImpostos([]);
  toast.error('Falha ao buscar impostos.');
    }
  };

  // Combina despesas e impostos em uma única lista
  const todosOsCustos = [...despesas, ...impostos].sort((a, b) => new Date(b.data || b.Data_Atualizacao) - new Date(a.data || a.Data_Atualizacao));


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
  }, [API_URL, termoBusca]);

  useEffect(() => {
    fetchDespesas('');
    fetchImpostos('');
  }, []);

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
      setDespesaSelecionada(null);
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
      toast.error('Erro ao remover despesa.');
    }
  };

  // Função para editar imposto (usa Swal para formulário simples) e atualizar via API
  const editarImposto = async (imposto) => {
    // evita erros com valores nulos
    const safeNome = imposto?.Nome_Imposto ?? '';
    // Prefill: se houver Valor_Medio use-o; caso contrário, derive a partir de custoMensal (convertendo para anual se necessário)
    const inferredValor = imposto?.Valor_Medio ?? (imposto?.custoMensal != null
      ? (String((imposto?.Frequencia || '').toLowerCase()) === 'anual' ? Number(imposto.custoMensal) * 12 : Number(imposto.custoMensal))
      : '');
    const safeValor = inferredValor ?? '';
    const frequenciaAtual = (imposto?.Frequencia || '').toLowerCase();

    const { value: dados } = await Swal.fire({
      title: 'Editar Imposto',
      showCancelButton: true,
      confirmButtonText: 'Salvar', // -- trocado para "Salvar"
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      buttonsStyling: false,
      customClass: {
        popup: styles.swalPopup,
        content: styles.swalContent,
        // usa a classe verde para o botão de confirmação
        confirmButton: `${styles.swalConfirm} ${styles.swalConfirmGreen}`,
        cancelButton: styles.swalCancel
      },
      // se quiser manter as animações propostas antes (opcional):
      showClass: {
        popup: styles.swalPopupEnter
      },
      hideClass: {
        popup: styles.swalPopupExit
      },
      html: `
        <div class="card" style="border-radius:12px; overflow:hidden; box-shadow:none;">
          <div class="card-body p-3" style="background:transparent;">
            <div class="mb-3">
              <label for="swal-nome" class="form-label" style="font-size:0.9rem; color:var(--text-muted, rgba(0,0,0,0.6))">Nome do imposto</label>
              <input id="swal-nome" class="form-control" placeholder="Ex: DAS" value="${safeNome}" />
            </div>

            <div class="row g-2">
              <div class="col">
                <label for="swal-valor" class="form-label" style="font-size:0.9rem; color:var(--text-muted, rgba(0,0,0,0.6))">Valor a pagar</label>
                <input id="swal-valor" type="number" step="0.01" class="form-control" placeholder="Valor (no período selecionado)" value="${safeValor}" />
                <small class="text-muted" style="display:block; margin-top:6px; font-size:0.82rem">
                  Digite o valor exato a ser pago no período selecionado.
                </small>
              </div>

              <div class="col-auto" style="min-width:140px;">
                <label for="swal-frequencia" class="form-label" style="font-size:0.9rem; color:var(--text-muted, rgba(0,0,0,0.6))">Frequência</label>
                <select id="swal-frequencia" class="form-select">
                  <option value="mensal" ${frequenciaAtual === 'mensal' ? 'selected' : ''}>Mensal</option>
                  <option value="anual" ${frequenciaAtual === 'anual' ? 'selected' : ''}>Anual</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      `,
      preConfirm: () => {
        const nome = document.getElementById('swal-nome')?.value || '';
        const valor = document.getElementById('swal-valor')?.value || '';
        const frequencia = document.getElementById('swal-frequencia')?.value || 'mensal';

        if (!nome || !valor) {
          Swal.showValidationMessage('Nome e Valor são obrigatórios');
          return false;
        }

        return { Nome_Imposto: nome, Valor_Medio: parseFloat(valor), Frequencia: frequencia };
      }
    });

    if (dados) {
      try {
        // usa ID preferencialmente do campo ID_Imposto se existir
        const impostoId = imposto?.ID_Imposto || imposto?.id || imposto?.ID || imposto?._id;
        await atualizarImposto(impostoId, dados);
        // atualizar estado/local conforme sua implementação
      } catch (err) {
        console.error(err);
        Swal.fire('Erro', 'Não foi possível atualizar o imposto', 'error');
      }
    }
  };

  const atualizarImposto = async (id, dados) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/impostos/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          Nome_Imposto: dados.Nome_Imposto,
          Valor_Medio: String(dados.Valor_Medio),
          Frequencia: dados.Frequencia
        })
      });

      if (!res.ok) throw new Error('Erro ao atualizar imposto');

      // Atualiza o estado local imediatamente com o valor EXATO digitado pelo usuário
      setImpostos(prev => prev.map(i => {
        if (i.id !== id) return i;
        const valor = Number(dados.Valor_Medio);
        const freq = dados.Frequencia;
        return {
          ...i,
          Nome_Imposto: dados.Nome_Imposto,
          Valor_Medio: valor,
          Frequencia: freq,
          custoMensal: freq === 'anual' ? valor / 12 : valor
        };
      }));

      // Não faz novo fetchImpostos() aqui para evitar que o backend sobrescreva o valor exibido.
      toast.success('Imposto atualizado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar imposto.');
    }
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
    setMostrarModalSelecao(true);
  };

  const handleFecharModais = () => {
    setMostrarModalSelecao(false);
    setMostrarModal(false);
    setMostrarModalImposto(false);
    setMostrarModalEditar(false);
    setItemSelecionado(null);
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
                marginBottom: '1rem',
                marginLeft: '10px',
                marginRight: '10px',
              }
            : {
                width: '100%',
                marginBottom: '1.3rem',
                display: 'flex',
                justifyContent: 'flex-start',
                marginLeft: '-75px',
              }
        }
      >
        <div
          className={`${styles.cardDespesa} ${styles.cardImposto} ${
            hoveredDespesaId === imposto.id ? styles.cardDespesaHovered : ''
          }`}
          style={
            isMobile
              ? {
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '100%',
                  margin: '0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: 'auto',
                  minHeight: '180px',
                  padding: '1.6rem',
                  boxSizing: 'border-box',
                  fontSize: '0.85rem',
                }
              : {
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '540px',
                  minWidth: '320px',
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '205px',
                  padding: '0.25rem 0.25rem 0.2rem 0.25rem',
                  boxSizing: 'border-box',
                  fontSize: '0.75rem',
                }
          }
          onClick={() => {
            // abre edição do imposto
            editarImposto(imposto);
          }}
          onMouseEnter={() => setHoveredDespesaId(imposto.id)}
          onMouseLeave={() => setHoveredDespesaId(null)}
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
                onMouseDown={(e)=>e.preventDefault()}
              >
                ?
              </button>
            )}
          </div>
          <div className="mb-2" style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '0.5rem' }}>
            <div className="row g-2">
              <div className="col-6 d-flex flex-column justify-content-center">
                <div className="text-center">
                  <div className="d-flex align-items-center justify-content-center">
                    <FaHandHoldingUsd className="me-1" style={{ fontSize: '1.5rem', color: 'var(--tangerine)' }} />
                    <span className="text-white fw-bold" style={{ fontSize: '1.1rem' }}>
                      {imposto.Frequencia.charAt(0).toUpperCase() + imposto.Frequencia.slice(1)}
                    </span>
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
          <div className="d-flex align-items-center justify-content-between" style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '8px', padding: '0.5rem', marginTop: '0.2rem' }}>
            <div className="fw-bold mb-1" style={{ fontSize: '0.85rem', color: 'var(--sunset)' }}>
              <FaHandHoldingUsd style={{ marginRight: '6px', color: 'var(--tangerine)' }} /> Imposto
            </div>
            <div className="fw-bold" style={{ fontSize: '1.1rem', color: '#FFD700', marginLeft: '10px' }}>
              R$ {custoOperacionalPorMinuto.toFixed(3)}/min
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
                marginBottom: '1rem',
                marginLeft: '10px',
                marginRight: '10px',
              }
            : {
                width: '100%',
                marginBottom: '1.3rem',
                display: 'flex',
                justifyContent: 'flex-start',
                marginLeft: '-75px',
              }
        }
      >
        <div
          className={`${styles.cardDespesa} ${hoveredDespesaId === despesa.id ? styles.cardDespesaHovered : ''}`}
          onClick={() => {
            setItemSelecionado(despesa);
            setMostrarModalEditar(true);
          }}
          onMouseEnter={() => setHoveredDespesaId(despesa.id)}
          onMouseLeave={() => setHoveredDespesaId((prev) => (prev === despesa.id ? null : prev))}
          style={
            isMobile
              ? {
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '100%',
                  margin: '0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: 'auto',
                  minHeight: '180px',
                  padding: '1.6rem',
                  boxSizing: 'border-box',
                  fontSize: '0.85rem',
                }
              : {
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '540px',
                  minWidth: '320px',
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '205px',
                  padding: '0.25rem 0.25rem 0.2rem 0.25rem',
                  boxSizing: 'border-box',
                  fontSize: '0.75rem',
                }
          }
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

          {/* Breakdown de custos + Custo operacional juntos */}
          <div className="d-flex align-items-center justify-content-between" style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '8px', padding: '0.5rem', marginTop: '0.2rem' }}>
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
            <div style={{
              background: 'linear-gradient(45deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.2))',
              borderRadius: '8px',
              padding: '0.5rem 0.7rem',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              marginLeft: '0.7rem',
              minWidth: '120px',
              textAlign: 'center'
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
  const PainelCustoOperacional = ({ isMobileVersion = false }) => (
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
            background: var(--tangerine);
          }
          
          /* Estilos específicos para mobile */
          .mobile-cost-panel {
            position: relative;
            width: 470px;
            height: 590px;
            margin: -5px auto 0 auto; /* Subir 45px total (20px + 25px) e centralizar */
            max-width: calc(100vw - 2rem); /* Responsivo */
            display: flex;
            flex-direction: column;
          }
          
          .mobile-cost-content {
            height: 450px; /* Ajustado para acomodar footer maior */
            overflow-y: auto;
            padding: 16px;
            padding-bottom: 0;
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
          borderRadius: '20px',
          overflow: 'hidden',
          margin: '0 1rem',
        } : {
          position: 'relative',
          background: 'linear-gradient(135deg, var(--ultra-violet) 0%, var(--ultra-violet) 100%)',
          minHeight: '500px',
          borderRadius: '20px',
          right: '50px',
          overflow: 'hidden',
          width: '700px',
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

        <div className={isMobileVersion ? "mobile-cost-content" : "card-body text-white"} style={isMobileVersion ? { padding: '1rem' } : { padding: '2rem' }}>
          {/* Seção de detalhamento */}
          <div className={isMobileVersion ? "mb-2" : "mb-4"}>
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

            <div
              className="custom-scrollbar"
              style={isMobileVersion ? {
                height: '370px',
                overflowY: 'auto',
                paddingRight: '10px'
              } : {
                maxHeight: '200px',
                overflowY: 'auto',
                paddingRight: '10px'
              }}
            >
              {todosOsCustos.map((item) => {
                const custoMinuto = calcularCustoOperacional(item.custoMensal, item.tempoOperacional);
                return (
                  <div
                    key={item.id}
                    className="d-flex justify-content-between align-items-center mb-3 p-2 rounded"
                    style={{
                      background: hoveredDespesaId === item.id ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                      transform: hoveredDespesaId === item.id ? 'translateX(5px)' : 'translateX(0px)',
                      backdropFilter: 'blur(5px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={() => setHoveredDespesaId(item.id)}
                    onMouseLeave={() => setHoveredDespesaId((prev) => (prev === item.id ? null : prev))}
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
                      {item.nome}
                      <span style={{ fontSize: '0.75rem', marginLeft: '8px', color: '#FFD700' }}>
                        {item.tipo === 'imposto' ? 'Imposto' : 'Despesa Operacional'}
                      </span>
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
                      R$ {custoMinuto.toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legenda */}
          <div className="mb-3" style={{ background: 'rgba(255,255,255,0.07)', padding: '0.5rem', borderRadius: '8px' }}>
            <FaMoneyBillWave style={{ color: 'var(--sunset)', marginRight: '6px' }} /> Despesa Operacional &nbsp;|
            <FaHandHoldingUsd style={{ color: 'var(--tangerine)', marginLeft: '12px', marginRight: '6px' }} /> Imposto

          </div>

          {/* Seção de soma - apenas no desktop */}
          {todosOsCustos.length > 1 && !isMobileVersion && (
            <div
              className="mb-4 p-3 rounded"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-semibold" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Soma Total:
                </span>
                <span
                  className="fw-bold"
                  style={{
                    fontSize: '0.85rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontFamily: 'monospace'
                  }}
                >
                  {todosOsCustos.map((item) => {
                    const custoMinuto = calcularCustoOperacional(item.custoMensal, item.tempoOperacional);
                    return custoMinuto.toFixed(3);
                  }).join(' + ')} =
                </span>
              </div>
            </div>
          )}

          {/* Resultado final - condicional baseado na versão */}
          {!isMobileVersion && (
            <div
              className="text-center p-4 rounded-3"
              style={{
                background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))',
                backdropFilter: 'blur(15px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
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

              {/* Informação adicional */}
              <div
                className="mt-3 pt-3"
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}
              >
                <i className="bi bi-info-circle me-1"></i>
                Atualizado em tempo real
              </div>
            </div>
          )}
        </div>
        
        {/* Footer sticky para mobile */}
        {isMobileVersion && (
          <div className="mobile-cost-footer">
            {/* Seção de soma no mobile - visual original */}
            {todosOsCustos.length > 1 && (
              <div
                className="p-3 rounded"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-semibold" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Soma Total:
                  </span>
                  <span
                    className="fw-bold"
                    style={{
                      fontSize: '0.85rem',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontFamily: 'monospace'
                    }}
                  >
                    {todosOsCustos.map((item) => {
                      const custoMinuto = calcularCustoOperacional(item.custoMensal, item.tempoOperacional);
                      return custoMinuto.toFixed(3);
                    }).join(' + ')} =
                  </span>
                </div>
              </div>
            )}
            
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
  );

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

  return (
    <ModelPage
      titulo="Despesas cadastradas"
      dados={todosOsCustos}
      salvarItem={salvarItem}
      removerItem={(id, tipo) => tipo === 'imposto' ? removerImposto(id) : removerDespesa(id)}
      abrirModal={handleAbrirModal}
      fecharModal={handleFecharModais}
      mostrarModal={mostrarModal || mostrarModalImposto || mostrarModalSelecao}
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
      ModalEditar={() =>
        mostrarModalEditar && (
          <ModalEditaDespesa
            despesa={itemSelecionado}
            onClose={() => {
              setMostrarModalEditar(false);
              setItemSelecionado(null);
            }}
            onSave={atualizarDespesa}
          />
        )
      }
      renderCard={renderCard}
      itensPorPagina={itensPorPagina}
      termoBusca={termoBusca}
      setTermoBusca={setTermoBusca}
      painelLateral={<PainelCustoOperacional isMobileVersion={isMobile && activeMobileTab === 1} />}
      enableMobileTabs={true}
      mobileTabs={mobileTabs}
      activeMobileTab={activeMobileTab}
      setActiveMobileTab={setActiveMobileTab}
    />
  );
}

export default Despesas;
