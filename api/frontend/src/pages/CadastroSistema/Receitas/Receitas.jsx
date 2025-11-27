import React, { useState, useEffect } from 'react';
import ModalCadastroReceita from '../../../components/Modals/ModalCadastroReceita/ModalCadastroReceita';
import ModalEditaReceita from '../../../components/Modals/ModalCadastroReceita/ModalEditaReceita';
import ModalVisualizarReceita from '../../../components/Modals/ModalCadastroReceita/ModalVisualizarReceita';
import ModelPage from '../ModelPage';
import { FaTrash } from 'react-icons/fa';
import { GiKnifeFork } from "react-icons/gi";
import Swal from "sweetalert2";
import { toast } from 'react-toastify';
import { showPermissionDeniedOnce } from '../../../utils/permissionToast';
import styles from './Receitas.module.css';

function Receitas() {
  const [receitas, setReceitas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarModalVisualizar, setMostrarModalVisualizar] = useState(false);
  const [receitaSelecionada, setReceitaSelecionada] = useState(null);
  const [itensPorPagina, setItensPorPagina] = useState(8);
  const [termoBusca, setTermoBusca] = useState('');
  const [isUpdating, setIsUpdating] = useState(false); // Flag para evitar múltiplas atualizações
  const [despesas, setDespesas] = useState([]); // Para cálculo do custo operacional
  const [ordenacao, setOrdenacao] = useState('nome-asc'); // Ordenação padrão alfabética
  const [filtroCategoria, setFiltroCategoria] = useState('todas'); // Filtro de categoria

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const apiUrl = `${baseUrl}/api/receitas`;
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Ajusta quantidade de cards por tela
  useEffect(() => {
    const ajustarItensPorPagina = () => {
      if (window.innerWidth <= 576) {
        setItensPorPagina(2);
      } else if (window.innerWidth <= 768) {
        setItensPorPagina(4);
      } else if (window.innerWidth <= 991) {
        setItensPorPagina(6);
      } else {
        setItensPorPagina(8);
      }
    };

    ajustarItensPorPagina();
    window.addEventListener('resize', ajustarItensPorPagina);
    return () => window.removeEventListener('resize', ajustarItensPorPagina);
  }, []);

  // Busca receitas e despesas no carregamento
  useEffect(() => {
    fetchReceitas();
    fetchDespesas();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchReceitas(termoBusca);
    }, 400); // debounce para evitar requisições excessivas

    return () => clearTimeout(delayDebounce);
  }, [termoBusca]);

  const fetchReceitas = async (busca = '') => {
    if (isUpdating) return; // Evita múltiplas chamadas

    try {
      setIsUpdating(true);
      const url = busca ? `${apiUrl}?search=${encodeURIComponent(busca)}` : apiUrl;
      console.log("URL de busca:", url);

      const res = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erro na requisição:", res.status, errorText);
        throw new Error('Erro ao buscar receitas');
      }

      const data = await res.json();
      console.log("Receitas recebidas:", data);

      const receitasFormatadas = Array.isArray(data)
        ? data.map(r => ({ ...r, id: r.ID_Receita }))
        : Array.isArray(data.receitas)
          ? data.receitas.map(r => ({ ...r, id: r.ID_Receita }))
          : [];

      setReceitas(receitasFormatadas);
    } catch (err) {
      console.error("Erro no fetchReceitas:", err);
      setReceitas([]);
    } finally {
      setTimeout(() => setIsUpdating(false), 500); // Reset após 500ms
    }
  };

  // Buscar despesas para cálculo do custo operacional
  const fetchDespesas = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/despesas`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDespesas(data);
      } else if (res.status === 403) {
        // Funcionário não tem acesso a despesas, mas isso é normal
        // Não mostrar erro pois o funcionário pode visualizar receitas
        console.log('Usuário sem permissão para acessar despesas');
      }
    } catch (err) {
      console.error('Erro ao buscar despesas:', err);
    }
  };

  // Funções para cálculo do custo operacional
  const calcularCustoPorMinutoDespesa = (despesa) => {
    const diasNoMes = 30;
    const custoMensal = Number(despesa.Custo_Mensal);
    const tempoDia = Number(despesa.Tempo_Operacional);

    if (!custoMensal || !tempoDia) return 0;

    const custoDiario = custoMensal / diasNoMes;
    const custoPorHora = custoDiario / tempoDia;
    return custoPorHora / 60;
  };

  const calcularCustoOperacionalTotal = (tempoPreparo) => {
    const custoOperacionalPorMinuto = despesas.reduce((total, despesa) => {
      const custoMinuto = calcularCustoPorMinutoDespesa(despesa);
      return total + (isNaN(custoMinuto) ? 0 : custoMinuto);
    }, 0);
    return custoOperacionalPorMinuto * Number(tempoPreparo);
  };

  // Função para calcular preço final de uma receita (usado na ordenação)
  const calcularPrecoFinal = (receita) => {
    // O valor salvo no banco (Custo_Total_Ingredientes) já é o preço final com margem
    return Number(receita.Custo_Total_Ingredientes ?? 0);
  };

  // Função wrapper para onSave que evita múltiplas execuções
  const handleSaveReceita = async () => {
    if (!isUpdating) {
      await fetchReceitas();
      // Garante que ambos os modais sejam fechados e estados limpos
      setMostrarModal(false);
      setMostrarModalEditar(false);
      setReceitaSelecionada(null);
    }
  };

  const salvarReceita = async (novaReceita) => {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          Nome_Receita: novaReceita.Nome_Receita,
          Custo_Total_Ingredientes: novaReceita.Custo_Total_Ingredientes,
          Descricao: novaReceita.Descricao,
          Tempo_Preparo: novaReceita.Tempo_Preparo,
          Porcentagem_De_Lucro: novaReceita.Porcentagem_De_Lucro,
          Categoria: novaReceita.Categoria,
          Imagem_URL: novaReceita.Imagem_URL?.name,
          ingredientes: novaReceita.ingredientes,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (res.status === 409) {
          Swal.fire('Atenção', errorData.error || 'Receita já cadastrada!', 'warning');
          return;
        }
        throw new Error('Erro ao salvar receita');
      }

      await res.json(); // Se precisar validar resposta, salve aqui
      await fetchReceitas(); // Atualiza as receitas na tela

      // Limpa completamente os estados para evitar abertura do modal de edição
      setMostrarModal(false);
      setMostrarModalEditar(false);
      setReceitaSelecionada(null);

      Swal.fire('Sucesso', 'Receita criada com sucesso!', 'success');
    } catch (error) {
      console.error(error);
      Swal.fire('Erro', 'Não foi possível salvar a receita.', 'error');
    }
  };

  const atualizarReceita = async (receitaAtualizada) => {
    // Pegue o id da receita selecionada
    const id = receitaSelecionada?.id || receitaSelecionada?.ID_Receita;
    if (!id) {
      Swal.fire('Erro', 'ID da receita não encontrado. Não é possível atualizar.', 'error');
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(receitaAtualizada), // sem id!
      });

      if (!res.ok) throw new Error('Erro ao atualizar receita');
      await fetchReceitas();

      setMostrarModalEditar(false);
      setReceitaSelecionada(null);
      Swal.fire('Sucesso', 'Receita atualizada com sucesso!', 'success');
    } catch (error) {
      console.error(error);
      Swal.fire('Erro', 'Não foi possível atualizar a receita.', 'error');
    }
  };

  const removerReceita = async (id) => {
    if (!id) {
      Swal.fire('Erro', 'ID inválido para remover receita.', 'error');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        }
      });

      if (res.status === 403) {
        Swal.fire('Acesso Negado', 'Apenas Gerentes e Proprietários podem excluir receitas.', 'warning');
        return;
      }

      if (!res.ok) throw new Error('Erro ao excluir receita');
      setReceitas(prev => prev.filter(r => r.id !== id));
      Swal.fire('Excluído!', 'A receita foi removida.', 'success');
    } catch (error) {
      console.error(error);
      Swal.fire('Erro', 'Não foi possível remover a receita.', 'error');
    }
  };


  const renderCard = (receita) => {
    if (!receita) return null;

    // Verifica se há imagem válida - testa todos os campos possíveis
    const imagemCampo = receita.imagem_URL || receita.Imagem_URL || receita.imagem || receita.IMAGEM;
    const temImagem = imagemCampo && typeof imagemCampo === 'string' && imagemCampo.trim() !== "";
    const urlImagem = temImagem ? imagemCampo.trim() : null;

    // Cálculos de preço (o valor salvo no banco já é o preço final com margem)
    const precoFinalSalvo = Number(receita.Custo_Total_Ingredientes ?? 0);
    const porcentagemLucro = Number(receita.Porcentagem_De_Lucro ?? 0);
    const tempoPreparo = Number(receita.Tempo_Preparo ?? 0);

    // Calcular custo operacional
    const custoOperacional = calcularCustoOperacionalTotal(tempoPreparo);

    // Reverter o cálculo: preço final = custo total * (1 + margem/100)
    // Logo: custo total = preço final / (1 + margem/100)
    const fatorMargem = 1 + (porcentagemLucro / 100);
    const custoTotalProducao = fatorMargem > 0 ? precoFinalSalvo / fatorMargem : precoFinalSalvo;

    // O custo de produção inclui ingredientes + operacional
    const custoProducao = custoTotalProducao;
    const custoComMargem = precoFinalSalvo;

    console.log('Card debug:', {
      imagemCampo,
      temImagem,
      urlImagem,
      receita: receita.Nome_Receita,
      campos_originais: {
        imagem_URL: receita.imagem_URL,
        Imagem_URL: receita.Imagem_URL,
        imagem: receita.imagem,
        IMAGEM: receita.IMAGEM
      }
    });

    return (
      <div className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4" key={receita.id || receita.ID_Receita}>
        <div
          className={styles.cardReceita}
          onClick={async () => {
            // Se for funcionário, usa os dados da listagem
            if (role === 'Funcionário') {
              console.log('👤 Funcionário - usando dados da listagem:', receita);
              setReceitaSelecionada(receita);
              setMostrarModalVisualizar(true);
            } else {
              // Para outros usuários, busca detalhes completos
              try {
                const res = await fetch(`${baseUrl}/api/receita-detalhada/${receita.ID_Receita}`, {
                  headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                  }
                });
                
                if (res.ok) {
                  const receitaCompleta = await res.json();
                  console.log('Receita completa:', receitaCompleta);
                  setReceitaSelecionada(receitaCompleta);
                  setMostrarModalEditar(true);
                } else {
                  throw new Error('Erro ao buscar detalhes da receita');
                }
              } catch (error) {
                console.error('Erro ao buscar receita:', error);
                Swal.fire({
                  icon: 'error',
                  title: 'Erro',
                  text: 'Não foi possível carregar os detalhes da receita'
                });
              }
            }
          }}
          style={{ cursor: "pointer" }}
        >
          {/* Ícone de excluir no canto superior direito */}
          {role !== 'Funcionário' && (
            <i
              className={styles.Trash}
              onClick={(e) => {
                e.stopPropagation();
                Swal.fire({
                  title: 'Tem certeza?',
                  text: 'Você deseja excluir esta receita?',
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonColor: '#EF4444',
                  cancelButtonColor: '#3085d6',
                  confirmButtonText: 'Sim, excluir',
                  cancelButtonText: 'Cancelar',
                }).then((result) => {
                  if (result.isConfirmed) {
                    removerReceita(receita.id || receita.ID_Receita);
                  }
                });
              }}
              title="Excluir"
            >
              <FaTrash />
            </i>
          )}
          {/* Imagem ou Placeholder - NUNCA ambos */}
          {(() => {
            console.log('🔍 Debug Card (renderizando):', {
              receita: receita.Nome_Receita,
              imagemCampo,
              temImagem,
              urlImagem,
              tipoImagemCampo: typeof imagemCampo
            });

            if (temImagem) {
              console.log('✅ Card mostrando IMAGEM para:', receita.Nome_Receita);
              return (
                <div
                  className="rounded mb-2 border"
                  style={{
                    width: "150px",
                    height: "120px",
                    backgroundImage: `url(${urlImagem.startsWith('http') ? urlImagem : baseUrl + '/uploads/' + urlImagem})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    margin: "0 auto",
                    display: "block", // Garante display consistente
                    flexShrink: 0, // Impede que o elemento mude de tamanho
                  }}
                  onError={(e) => {
                    console.log('❌ Erro ao carregar imagem no card:', urlImagem);
                    // Se der erro, esconde a imagem e força o placeholder
                    e.target.style.display = 'none';
                    // Adiciona um placeholder no lugar
                    const placeholder = document.createElement('div');
                    placeholder.className = `rounded d-flex align-items-center justify-content-center ${styles.semImagem}`;
                    placeholder.style.cssText = 'width: 150px; height: 120px; margin: 0 auto; background: transparent; display: flex; flex-shrink: 0;';
                    placeholder.innerHTML = '<svg class="${styles.iconeReceitaVazia}"><!-- ícone --></svg>';
                    e.target.parentNode.appendChild(placeholder);
                  }}
                />
              );
            } else {
              console.log('⭕ Card mostrando PLACEHOLDER para:', receita.Nome_Receita);
              return (
                <div
                  className={`rounded d-flex align-items-center justify-content-center ${styles.semImagem}`}
                  style={{
                    width: "150px",
                    height: "120px",
                    margin: "0 auto",
                    background: "transparent",
                    display: "flex", // Garante display consistente
                    flexShrink: 0, // Impede que o elemento mude de tamanho
                    minWidth: "150px", // Força largura mínima
                    minHeight: "120px", // Força altura mínima
                  }}
                >
                  <GiKnifeFork className={styles.iconeReceitaVazia} />
                </div>
              );
            }
          })()}

          {/* Container para o conteúdo de texto com altura flexível */}
          <div className={styles.cardContent}>
            <div>
              <h5 className={`fw-bold ${styles.tituloReceita}`}>{receita.Nome_Receita || "Sem Nome"}</h5>
              <p className="mb-1 fs-6" style={{ margin: '2px 0' }}>{receita.Categoria || "Sem Categoria"}</p>

              <div className="d-flex justify-content-between fs-6 mb-2" style={{ fontSize: '0.85rem' }}>
                <span>
                  <i className="bi bi-clock" style={{ marginRight: '4px' }}></i>
                  {receita.Tempo_Preparo ?? 0} min
                </span>
                <span>
                  <i className="bi bi-currency-dollar" style={{ marginRight: '4px' }}></i>
                  {receita.Porcentagem_De_Lucro ?? 0}%
                </span>
              </div>
            </div>

            {/* Preços na parte inferior - formato simples */}
            <div className="d-flex justify-content-between align-items-center mt-auto">
              <div style={{ fontSize: '0.85rem' }}>
                <div>Custo: R$ {custoProducao.toFixed(2)}</div>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                <div>Preço: R$ {custoComMargem.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Extrair categorias únicas das receitas cadastradas
  const categorias = React.useMemo(() => {
    const categoriasUnicas = [...new Set(receitas.map(r => r.Categoria).filter(Boolean))];
    return categoriasUnicas.sort();
  }, [receitas]);

  // Calcular preço final da receita (custo ingredientes + custo operacional + lucro)
  const calcularPrecoFinal = (receita) => {
    const custoIngredientes = Number(receita.Custo_Total_Ingredientes) || 0;
    const tempoPreparo = Number(receita.Tempo_Preparo) || 0;
    const porcentagemLucro = Number(receita.Porcentagem_De_Lucro) || 0;
    
    // Custo operacional baseado no tempo de preparo
    const custoOperacional = calcularCustoOperacionalTotal(tempoPreparo);
    
    // Custo total
    const custoTotal = custoIngredientes + custoOperacional;
    
    // Preço final com margem de lucro
    return custoTotal * (1 + porcentagemLucro / 100);
  };

  // Filtrar e ordenar receitas
  const receitasOrdenadas = React.useMemo(() => {
    // Primeiro filtra por categoria
    let lista = filtroCategoria === 'todas' 
      ? [...receitas] 
      : receitas.filter(r => r.Categoria === filtroCategoria);

    switch (ordenacao) {
      case 'nome-asc':
        return lista.sort((a, b) => (a.Nome_Receita || '').localeCompare(b.Nome_Receita || ''));
      case 'nome-desc':
        return lista.sort((a, b) => (b.Nome_Receita || '').localeCompare(a.Nome_Receita || ''));
      case 'preco-asc':
        return lista.sort((a, b) => {
          const precoA = calcularPrecoFinal(a);
          const precoB = calcularPrecoFinal(b);
          return precoA - precoB;
        });
      case 'preco-desc':
        return lista.sort((a, b) => {
          const precoA = calcularPrecoFinal(a);
          const precoB = calcularPrecoFinal(b);
          return precoB - precoA;
        });
      default:
        return lista;
    }
  }, [receitas, ordenacao, despesas, filtroCategoria]);

  return (
    <>
      <ModelPage
        titulo="Receitas cadastradas"
        dados={receitasOrdenadas}
        termoBusca={termoBusca}
        setTermoBusca={setTermoBusca}
        centerPagination={true}
        ordenacao={ordenacao}
        setOrdenacao={setOrdenacao}
        filtroCategoria={filtroCategoria}
        setFiltroCategoria={setFiltroCategoria}
        categorias={categorias}
        removerItem={removerReceita}
        abrirModal={() => {
          if (role === 'Funcionário') {
            toast.error('Nível de permissão insuficiente');
            return;
          }
          setMostrarModal(true);
        }}
        fecharModal={() => setMostrarModal(false)}
        abrirModalEditar={() => setMostrarModalEditar(true)}
        fecharModalEditar={() => setMostrarModalEditar(false)}
        mostrarModal={mostrarModal}
        mostrarModalEditar={mostrarModalEditar}
        desabilitarBotaoAdicionar={role === 'Funcionário'}
        ModalCadastro={() => (
          <ModalCadastroReceita
            onSave={handleSaveReceita}
            onClose={() => setMostrarModal(false)}
          />
        )}
        ModalEditar={() => (
          <ModalEditaReceita
            receita={receitaSelecionada}
            onSave={handleSaveReceita}
            onClose={() => {
              setMostrarModalEditar(false);
              setReceitaSelecionada(null);
            }}
          />
        )}
        renderCard={renderCard}
        itensPorPagina={itensPorPagina}
      />
      {mostrarModalVisualizar && (
        <ModalVisualizarReceita
          receita={receitaSelecionada}
          onClose={() => {
            setMostrarModalVisualizar(false);
            setReceitaSelecionada(null);
          }}
        />
      )}
    </>
  );
}

export default Receitas;
