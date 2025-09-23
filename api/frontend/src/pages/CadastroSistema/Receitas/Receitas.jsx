import { useState, useEffect } from 'react';
import ModalCadastroReceita from '../../../components/Modals/ModalCadastroReceita/ModalCadastroReceita';
import ModalEditaReceita from '../../../components/Modals/ModalCadastroReceita/ModalEditaReceita';
import ModelPage from '../ModelPage';
import { FaTrash } from 'react-icons/fa';
import { GiKnifeFork } from "react-icons/gi";
import Swal from "sweetalert2";
import styles from './Receitas.module.css';

function Receitas() {
  const [receitas, setReceitas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [receitaSelecionada, setReceitaSelecionada] = useState(null);
  const [itensPorPagina, setItensPorPagina] = useState(8);
  const [termoBusca, setTermoBusca] = useState('');
  const [isUpdating, setIsUpdating] = useState(false); // Flag para evitar múltiplas atualizações

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const apiUrl = `${baseUrl}/api/receitas`;
  const token = localStorage.getItem('token');

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

  // Busca receitas no carregamento
  useEffect(() => {
    fetchReceitas();
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
          onClick={() => {
            setReceitaSelecionada(receita);
            setMostrarModalEditar(true);
          }}
          style={{ cursor: "pointer" }}
        >
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
                    backgroundImage: `url(${baseUrl}/uploads/${urlImagem})`,
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
              <p className="mb-1 fs-6" style={{margin: '4px 0'}}>{receita.Categoria || "Sem Categoria"}</p>
              
              <div className="d-flex justify-content-between fs-6 mb-1" style={{fontSize: '0.85rem'}}>
                <span>{receita.Tempo_Preparo ?? 0} min</span>
                <span>Lucro: {receita.Porcentagem_De_Lucro ?? 0}%</span>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-auto">
              <p className="fw-bold mb-0" style={{fontSize: '0.9rem'}}>
                Custo: R$ {Number(receita.Custo_Total_Ingredientes ?? 0).toFixed(2)}
              </p>
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
            </div>
          </div>
        </div>
      </div>
    );
  };



  return (
    <ModelPage
      titulo="Receitas cadastradas"
      dados={receitas}
      termoBusca={termoBusca}
      setTermoBusca={setTermoBusca}
      removerItem={removerReceita}
      abrirModal={() => setMostrarModal(true)}
      fecharModal={() => setMostrarModal(false)}
      abrirModalEditar={() => setMostrarModalEditar(true)}
      fecharModalEditar={() => setMostrarModalEditar(false)}
      mostrarModal={mostrarModal}
      mostrarModalEditar={mostrarModalEditar}
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
      )
      }
      renderCard={renderCard}
      itensPorPagina={itensPorPagina}
    />
  );
}

export default Receitas;
