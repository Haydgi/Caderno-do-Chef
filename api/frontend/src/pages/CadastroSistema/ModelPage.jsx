import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import styles from './Itens.module.css';
import ReactPaginate from "react-paginate";


function ModelPage({
  titulo,
  dados,
  salvarItem,
  removerItem,
  abrirModal,
  fecharModal,
  abrirModalEditar,
  fecharModalEditar,
  mostrarModal,
  mostrarModalEditar,
  ModalCadastro,
  ModalEditar,
  renderCard,
  itensPorPagina,
  termoBusca,
  setTermoBusca,
  painelLateral, // Novo prop para componente lateral
  // Props para tabs mobile
  enableMobileTabs = false,
  mobileTabs = [],
  activeMobileTab = 0,
  setActiveMobileTab = () => {},
}) {
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);
  const [isMobileTab, setIsMobileTab] = useState(window.innerWidth < 768);
  const floatingSearchRef = useRef(null);
  const prevTotalPaginas = useRef(0);


  const totalPaginas = Math.ceil(dados.length / itensPorPagina);

  useEffect(() => {
    document.body.classList.add('produtos-page');
    return () => {
      document.body.classList.remove('produtos-page');
    };
  }, []);

  useEffect(() => {
    // Só muda a página se realmente há novos dados
    if (totalPaginas > prevTotalPaginas.current && dados.length > 0) {
      setPaginaAtual(Math.max(0, totalPaginas - 1));
    }
    prevTotalPaginas.current = totalPaginas;
  }, [dados, totalPaginas]);

  useEffect(() => {
    if (paginaAtual >= totalPaginas && totalPaginas > 0) {
      setPaginaAtual(totalPaginas - 1);
    }
  }, [paginaAtual, totalPaginas]);

  // Reset página para 0 quando dados mudarem drasticamente
  useEffect(() => {
    if (dados.length > 0 && paginaAtual >= Math.ceil(dados.length / itensPorPagina)) {
      setPaginaAtual(0);
    }
  }, [dados.length, itensPorPagina]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 576);
      setIsMobileTab(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Detecta cliques fora da barra de pesquisa flutuante
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        floatingSearchRef.current &&
        !floatingSearchRef.current.contains(event.target)
      ) {
        setShowMobileSearch(false); // Fecha a barra de pesquisa
      }
    };

    if (showMobileSearch) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMobileSearch]);

  const dadosExibidos = dados.slice(
    paginaAtual * itensPorPagina,
    (paginaAtual + 1) * itensPorPagina
  );

  const mudarPagina = ({ selected }) => {
    setPaginaAtual(selected);
  };

  return (
    <>
      <Navbar />
      {mostrarModal && (
        <ModalCadastro onClose={fecharModal} onSave={salvarItem} />
      )}
      {mostrarModalEditar && (
        <ModalEditar onClose={fecharModalEditar} onSave={salvarItem} />
      )}

      <div className={styles.pageContent}>
        <div className="container mt-4">
          {/* Título e barra de pesquisa/botão na mesma linha */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 className={`${styles.title}`}>{titulo}</h2>
            <div className="d-flex align-items-center">
              {isMobile ? (
                <button
                  className={`${styles.searchButton}`}
                  onClick={() => setShowMobileSearch(!showMobileSearch)}
                >
                  <i className="bi bi-search"></i>
                </button>
              ) : (
                <div className={styles.searchBarContainer}>
                  <input
                    type="text"
                    className={`form-control ${styles.searchBar} me-2`}
                    placeholder="Pesquise aqui..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                  />
                </div>
              )}
              <button
                className={`${styles.addBtn} btnUltraViolet btn`}
                onClick={abrirModal}
              >
                <i className="bi bi-plus-circle"></i>
              </button>
            </div>
          </div>

          {/* Barra de pesquisa flutuante no mobile */}
          {isMobile && showMobileSearch && (
            <div
              className={styles.floatingSearchInput}
              ref={floatingSearchRef}
            >
              <input
                type="text"
                className={`form-control ${styles.searchBarMobile}`}
                placeholder="Pesquise aqui..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
              />
            </div>
          )}

          {/* Tabs mobile - aparecem apenas se habilitadas e em mobile com tela < 768px */}
          {enableMobileTabs && isMobileTab && mobileTabs.length > 0 && (
            <div className={styles.mobileTabsContainer}>
              <div className={styles.mobileTabs}>
                {mobileTabs.map((tab, index) => (
                  <button
                    key={index}
                    className={`${styles.mobileTab} ${activeMobileTab === index ? styles.mobileTabActive : ''}`}
                    onClick={() => setActiveMobileTab(index)}
                  >
                    {tab.icon && <i className={tab.icon}></i>}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Layout principal com grid */}
          <div className="container mt-4">
            <div className="row">
              {/* Renderização condicional baseada em tabs mobile */}
              {enableMobileTabs && isMobileTab ? (
                // Layout mobile com tabs
                <div className="col-12">
                  {activeMobileTab === 0 ? (
                    // Tab 1: Lista de dados (ex: Despesas)
                    <>
                      {dados.length === 0 ? (
                        <div id="sem-dados" className={`${styles.emptyState}`}>
                          <p>
                            {termoBusca && termoBusca.trim() !== ""
                              ? "Nenhum item encontrado para sua busca."
                              : "Não há itens cadastrados"}
                          </p>
                          <button
                            className={`${styles.btnDetails} btnUltraViolet btn`}
                            onClick={abrirModal}
                          >
                            <p className={styles.btnText}>
                              <i className="bi bi-plus-circle me-2"></i>
                              {termoBusca && termoBusca.trim() !== ""
                                ? "Criar Item"
                                : "Criar o Primeiro Item"}
                            </p>
                          </button>
                        </div>
                      ) : (
                        <div className="row">
                          {dadosExibidos.map(renderCard)}
                        </div>
                      )}
                    </>
                  ) : (
                    // Tab 2: Painel lateral (ex: Custo Operacional)
                    <div className="col-12">
                      <div className={styles.mobilePanel}>
                        {painelLateral}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Layout desktop padrão
                <>
                  {/* Coluna esquerda - Cards */}
                  <div className={painelLateral ? "col-md-6" : "col-12"}>
                    {dados.length === 0 ? (
                      <div
                        id="sem-dados"
                        className={`${styles.emptyState}`}
                        style={painelLateral ? { marginRight: '150px' } : {}}
                      >
                        <p>
                          {termoBusca && termoBusca.trim() !== ""
                            ? "Nenhum item encontrado para sua busca."
                            : "Não há itens cadastrados"}
                        </p>
                        <button
                          className={`${styles.btnDetails} btnUltraViolet btn`}
                          onClick={abrirModal}
                        >
                          <p className={styles.btnText}>
                            <i className="bi bi-plus-circle me-2"></i>
                            {termoBusca && termoBusca.trim() !== ""
                              ? "Criar Item"
                              : "Criar o Primeiro Item"}
                          </p>
                        </button>
                      </div>
                    ) : (
                      <div className="row">
                        {dadosExibidos.map(renderCard)}
                      </div>
                    )}
                  </div>

                  {/* Linha divisória vertical quando há painel lateral */}
                  {painelLateral && (
                    <div className="col-auto d-flex align-items-stretch position-relative" style={{ padding: '0' }}>
                      <div
                        style={{
                          position: 'absolute',
                          right: '0px',
                          height: '75vh',
                          width: '2px',
                          backgroundColor: '#67477A',
                          opacity: 0.4,
                          borderRadius: '2px'
                        }}
                      ></div>
                    </div>
                  )}

                  {/* Coluna direita - Painel do Cálculo de Despesas */}
                  {painelLateral && (
                    <div className="col-md-5 position-relative">
                      <div
                        className="position-absolute"
                        style={{
                          left: '180px',
                          top: '0',
                          width: 'calc(100% - 80px)'
                        }}
                      >
                        {painelLateral}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Paginação fixa na parte inferior */}
          {totalPaginas > 1 && (
            // Só mostra paginação se não tem tabs mobile OU se está na primeira tab (lista de dados)
            (!enableMobileTabs || !isMobileTab || activeMobileTab === 0) && (
              <ReactPaginate
                pageCount={totalPaginas}
                onPageChange={mudarPagina}
                forcePage={paginaAtual}
                containerClassName={styles.pagination}
                activeClassName={styles.active}
                pageClassName={styles.pageItem}
                pageLinkClassName={styles.pageLink}
                pageRangeDisplayed={isMobile ? 1 : 3}
                marginPagesDisplayed={1}
                previousClassName={undefined}
                previousLabel={null}
                nextLabel={null}
                nextClassName={undefined}
              />
            )
          )}

          {/* Botão flutuante para mobile */}
          {isMobile && (
            <button
              className={`${styles.floatingAddBtn}`}
              onClick={abrirModal}
            >
              <i className="bi bi-plus-circle"></i>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default ModelPage;
