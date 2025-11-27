import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import ModelPage from "../ModelPage";
import ModalCadastroIngrediente from "../../../components/Modals/ModalCadastroIngrediente/ModalCadastroIngrediente";
import ModalEditaIngrediente from "../../../components/Modals/ModalCadastroIngrediente/ModalEditaIngrediente";
import styles from "../Itens.module.css";

import { GiMeat, GiFruitBowl, GiPumpkin, GiPeanut, GiWrappedSweet } from "react-icons/gi";
import { CiWheat, CiDroplet } from "react-icons/ci";
import { LuMilk } from "react-icons/lu";
import { TbSalt } from "react-icons/tb";
import { FaTrash } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function Ingredientes() {
  // 1. Estado do termo de busca e ingredientes
  const [termoBusca, setTermoBusca] = useState('');
  const [ingredientes, setIngredientes] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [ingredienteSelecionado, setIngredienteSelecionado] = useState(null);
  const [itensPorPagina, setItensPorPagina] = useState(12);
  const [ordenacao, setOrdenacao] = useState('nome-asc'); // padrao, nome-asc, nome-desc, preco-asc, preco-desc
  const [filtroCategoria, setFiltroCategoria] = useState('todas'); // Filtro de categoria

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

  const iconesCategorias = {
    Carnes: <GiMeat />,
    Doces: <GiWrappedSweet />,
    Farináceos: <CiWheat />,
    Frutas: <GiFruitBowl />,
    Laticínios: <LuMilk />,
    "Legumes e Verduras": <GiPumpkin />,
    Líquidos: <CiDroplet />,
    "Óleos e Gorduras": <CiDroplet />,
    Oleaginosas: <GiPeanut />,
    "Temperos e Condimentos": <TbSalt />,
  };

  const getToken = () => localStorage.getItem('token');

  const fetchIngredientes = async (termo = '') => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(
        `${API_URL}/api/ingredientes?limit=10000&search=${encodeURIComponent(termo)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (!res.ok) throw new Error('Erro ao buscar ingredientes');
      const data = await res.json();
      // Normaliza os dados - mantém campos originais para edição
      setIngredientes(data.map(item => ({
        ...item, // Mantém TODOS os campos originais do banco
        id: item.ID_Ingredientes,
        nome: item.Nome_Ingrediente,
        preco: item.Custo_Ingrediente,
        unidadeCompra: item.Unidade_Compra || item.Unidade_De_Medida,
        categoria: item.Categoria,
        icone: iconesCategorias[item.Categoria] || "❓",
      })));
    } catch (error) {
      setIngredientes([]);
      console.error('Erro:', error);
      toast.error('Falha ao buscar ingredientes.');
    }
  };

  useEffect(() => {
    fetchIngredientes(termoBusca);
  }, [API_URL, termoBusca]);

  // Extrair categorias únicas dos ingredientes cadastrados
  const categorias = React.useMemo(() => {
    const categoriasUnicas = [...new Set(ingredientes.map(i => i.categoria).filter(Boolean))];
    return categoriasUnicas.sort();
  }, [ingredientes]);

  // Função para ordenar ingredientes
  const ingredientesOrdenados = React.useMemo(() => {
    // Primeiro filtra por categoria
    let lista = filtroCategoria === 'todas'
      ? [...ingredientes]
      : ingredientes.filter(i => i.categoria === filtroCategoria);

    switch (ordenacao) {
      case 'nome-asc':
        return lista.sort((a, b) => a.nome.localeCompare(b.nome));
      case 'nome-desc':
        return lista.sort((a, b) => b.nome.localeCompare(a.nome));
      case 'preco-asc':
        return lista.sort((a, b) => (a.preco || 0) - (b.preco || 0));
      case 'preco-desc':
        return lista.sort((a, b) => (b.preco || 0) - (a.preco || 0));
      default:
        return lista; // mantém ordem original do banco
    }
  }, [ingredientes, ordenacao, filtroCategoria]);

  const salvarIngrediente = async (novoIngrediente) => {
    // Faz apenas o POST para criar novo ingrediente
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/ingredientes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(novoIngrediente)
      });

      if (!res.ok) throw new Error('Erro ao salvar ingrediente');

      await fetchIngredientes(); // Recarrega a lista de ingredientes
      toast.success('Ingrediente cadastrado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao cadastrar ingrediente.');
    }
  };

  const atualizarIngrediente = async (ingredienteAtualizado) => {
    const token = getToken();
    if (!token) return;

    try {
      console.log('Enviando para atualização:', ingredienteAtualizado);
      const res = await fetch(`${API_URL}/api/ingredientes/${ingredienteAtualizado.ID_Ingredientes}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ingredienteAtualizado)
      });

      const atualizado = await res.json();

      // Recarrega todos os ingredientes após editar
      await fetchIngredientes();

      setMostrarModalEditar(false);
      setIngredienteSelecionado(null);
      toast.success('Ingrediente atualizado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar ingrediente.');
    }
  };

  const removerIngrediente = async (id) => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/ingredientes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Erro ao remover ingrediente');

      setIngredientes(prev => prev.filter(i => i.id !== id));
      toast.success('Ingrediente removido com sucesso!');
    } catch (err) {
      toast.error('Erro ao remover ingrediente.');
    }
  };

  const renderCard = (ingrediente) => (
    <div className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4" key={ingrediente.id}>
      <div
        className={styles.cardProduto}
        onClick={() => {
          setIngredienteSelecionado(ingrediente);
          setMostrarModalEditar(true);
        }}
        style={{ cursor: 'pointer' }}
      >
        <div className={styles.cardIcon}>{ingrediente.icone}</div>
        <h5 className={styles.cardTitle}>{ingrediente.nome}</h5>
        <p className={styles.cardPrice}>
          R$ {(ingrediente.preco || 0).toFixed(2).replace('.', ',')}/{ingrediente.unidadeCompra}
        </p>
        <div className={styles.cardAction}>
          <i
            className={styles.Trash}
            onClick={(e) => {
              e.stopPropagation();

              // SweetAlert para confirmação
              Swal.fire({
                title: 'Tem certeza?',
                text: 'Você deseja excluir este ingrediente?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sim, excluir',
                cancelButtonText: 'Cancelar',
              }).then((result) => {
                if (result.isConfirmed) {
                  removerIngrediente(ingrediente.id);
                  Swal.fire(
                    'Excluído!',
                    'O ingrediente foi removido com sucesso.',
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

  const handleSubmit = async (event) => {
    event.preventDefault(); // Previne o comportamento padrão do formulário

    const novoIngrediente = {
      nome: form.nome,
      unidadeDeMedida: form.unidade,
      custo: parseFloat(form.custo.replace(",", ".")),
      indiceDeDesperdicio: parseFloat(form.taxaDesperdicio.replace(",", ".")),
      categoria: form.categoria,
    };

    await salvarIngrediente(novoIngrediente);
  };

  return (
    <ModelPage
      titulo="Ingredientes cadastrados"
      dados={ingredientesOrdenados}
      ordenacao={ordenacao}
      setOrdenacao={setOrdenacao}
      filtroCategoria={filtroCategoria}
      setFiltroCategoria={setFiltroCategoria}
      categorias={categorias}
      centerPagination={true}
      salvarItem={salvarIngrediente}
      removerItem={removerIngrediente}
      abrirModal={() => setMostrarModal(true)}
      fecharModal={() => setMostrarModal(false)}
      abrirModalEditar={() => setMostrarModalEditar(true)}
      fecharModalEditar={() => setMostrarModalEditar(false)}
      mostrarModal={mostrarModal}
      mostrarModalEditar={mostrarModalEditar}
      ModalCadastro={ModalCadastroIngrediente}
      ModalEditar={() =>
        ingredienteSelecionado && (
          <ModalEditaIngrediente
            ingrediente={ingredienteSelecionado}
            onClose={() => {
              setMostrarModalEditar(false);
              setIngredienteSelecionado(null);
            }}
            onSave={atualizarIngrediente}
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

export default Ingredientes;