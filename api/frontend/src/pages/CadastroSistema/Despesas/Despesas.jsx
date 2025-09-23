import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import ModelPage from '../ModelPage';
import ModalCadastroDespesa from '../../../components/Modals/ModalCadastroDespesa/ModalCadastroDespesa';
import ModalEditaDespesa from '../../../components/Modals/ModalCadastroDespesa/ModalEditaDespesa';
import styles from './Despesas.module.css';
import { FaMoneyBillWave, FaTrash, FaRegClock } from 'react-icons/fa';
import { MdOutlineCalendarMonth } from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function Despesas() {
  const [termoBusca, setTermoBusca] = useState('');
  const [despesas, setDespesas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [despesaSelecionada, setDespesaSelecionada] = useState(null);
  const [itensPorPagina, setItensPorPagina] = useState(12);

  useEffect(() => {
    const ajustarItensPorTamanho = () => {
      const largura = window.innerWidth;
      if (largura < 577) {
        setItensPorPagina(4);
      } else if (largura < 761) {
        setItensPorPagina(6);
      } else if (largura < 992) {
        setItensPorPagina(9);
      } else {
        setItensPorPagina(12);
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
      
      // Adiciona timestamp para evitar cache no Firefox
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

  // Força limpeza de cache no Firefox
  useEffect(() => {
    // Detecta se é Firefox
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    
    if (isFirefox) {
      console.log('🦊 Firefox detectado - aplicando correções');
      // Força recarregamento sem cache
      const timer = setTimeout(() => {
        fetchDespesas(termoBusca);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      fetchDespesas(termoBusca);
    }
  }, [API_URL, termoBusca]);
  
  // Força busca inicial ao montar componente (especialmente para Firefox)
  useEffect(() => {
    console.log('Componente montado - busca inicial');
    fetchDespesas('');
  }, []);

  const salvarDespesa = async (novaDespesa) => {
    // Não faz POST aqui, apenas recarrega a lista
    // O modal já fez o POST
    await fetchDespesas();
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

  const renderCard = (despesa) => (
    <div className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4" key={despesa.id}>
      <div
        className={styles.cardDespesa}
        onClick={() => {
          setDespesaSelecionada(despesa);
          setMostrarModalEditar(true);
        }}
        style={{ cursor: 'pointer' }}
      >
        <h3 className="fw-bold mb-4 mt-3">{despesa.nome}</h3>

        <div className="d-flex justify-content-between align-items-center text-white fs-5">
          <span className="d-flex align-items-center">
            <MdOutlineCalendarMonth className="me-2" />
            R$ {Number(despesa.custoMensal).toFixed(2)}
          </span>
          <span className="d-flex align-items-center">
            <FaRegClock className="me-2" />
            {despesa.tempoOperacional}h
          </span>
          <i
            className={styles.Trash}
            onClick={(e) => {
              e.stopPropagation();
              
              // SweetAlert para confirmação
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
        </div>
      </div>
    </div>
  );

  return (
    <ModelPage
      titulo="Despesas cadastradas"
      dados={despesas}
      salvarItem={salvarDespesa}
      removerItem={removerDespesa}
      abrirModal={() => setMostrarModal(true)}
      fecharModal={() => setMostrarModal(false)}
      abrirModalEditar={() => setMostrarModalEditar(true)}
      fecharModalEditar={() => setMostrarModalEditar(false)}
      mostrarModal={mostrarModal}
      mostrarModalEditar={mostrarModalEditar}
      ModalCadastro={ModalCadastroDespesa}
      ModalEditar={() =>
        despesaSelecionada && (
          <ModalEditaDespesa
            despesa={despesaSelecionada}
            onClose={() => {
              setMostrarModalEditar(false);
              setDespesaSelecionada(null);
            }}
            onSave={atualizarDespesa}
          />
        )
      }
      renderCard={renderCard}
      itensPorPagina={itensPorPagina}
      termoBusca={termoBusca}
      setTermoBusca={setTermoBusca}
    />
  );
}

export default Despesas;
