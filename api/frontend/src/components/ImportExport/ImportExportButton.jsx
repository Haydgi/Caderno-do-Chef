import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MdCloudUpload, MdCloudDownload, MdClose, MdPictureAsPdf } from 'react-icons/md';
import { toast } from 'react-toastify';
import axios from 'axios';
import styles from './ImportExportButton.module.css';

export default function ImportExportButton() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [importando, setImportando] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const location = useLocation();

  const role = localStorage.getItem('role');
  // Apenas Proprietário e somente na página de relatórios
  const permitido = role === 'Proprietário' && location.pathname === '/relatorios';

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAberto(false);
      }
    };

    if (menuAberto) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuAberto]);

  const handleExportar = async (formato) => {
    try {
      toast.info(`Gerando arquivo ${formato.toUpperCase()}...`);
      
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.get(
        `${baseUrl}/api/exportar-dados?formato=${formato}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const extension = formato === 'excel' ? 'xlsx' : 'csv';
      const filename = `caderno_do_chef_${new Date().toISOString().split('T')[0]}.${extension}`;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Arquivo exportado com sucesso!`);
      setMenuAberto(false);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar dados. Tente novamente.');
    }
  };

  const handleExportarPDFIngredientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const userId = Number(localStorage.getItem('userId'));
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      // Buscar lista de ingredientes do usuário
      const listaResp = await axios.get(`${baseUrl}/api/ingredientes?usuario=${userId}&limit=10000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const ingredientes = [...new Set((listaResp.data || []).map(ing => ing.Nome_Ingrediente))];
      if (ingredientes.length === 0) {
        toast.info('Nenhum ingrediente para exportar.');
        return;
      }

      // Requisitar geração de PDF
      const pdfResp = await axios.post(`${baseUrl}/api/export-dashboard`, {
        ingredientes,
        userId
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([pdfResp.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_ingredientes_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMenuAberto(false);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const handleImportar = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('arquivo', file);

    setImportando(true);
    setMenuAberto(false);

    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await axios.post(
        `${baseUrl}/api/importar-dados`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success(
        `Importação concluída! ${response.data.importados} itens importados, ${response.data.erros} erros.`
      );
    } catch (error) {
      console.error('Erro ao importar:', error);
      toast.error(error.response?.data?.mensagem || 'Erro ao importar dados.');
    } finally {
      setImportando(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    // Renderiza apenas se permitido, mantendo hooks sempre executados
    !permitido ? null : (
    <div className={styles.container} ref={menuRef}>
      <button
        className={styles.mainButton}
        onClick={() => setMenuAberto(!menuAberto)}
        title="Importar/Exportar dados"
        disabled={importando}
      >
        {importando ? (
          <span className={styles.spinner}></span>
        ) : (
          <MdCloudUpload size={20} />
        )}
      </button>

      {menuAberto && (
        <div className={styles.menu}>
          <div className={styles.menuHeader}>
            <span>Dados do Sistema</span>
            <button
              className={styles.closeButton}
              onClick={() => setMenuAberto(false)}
            >
              <MdClose size={16} />
            </button>
          </div>

          <div className={styles.menuSection}>
            <div className={styles.sectionTitle}>
              <MdCloudDownload size={16} />
              Exportar
            </div>
            <button
              className={styles.menuItem}
              onClick={() => handleExportar('excel')}
            >
              <i className="bi bi-file-earmark-excel"></i>
              Exportar Excel (.xlsx)
            </button>
            <button
              className={styles.menuItem}
              onClick={() => handleExportar('csv')}
            >
              <i className="bi bi-file-earmark-text"></i>
              Exportar CSV
            </button>
            <button
              className={styles.menuItem}
              onClick={handleExportarPDFIngredientes}
            >
              <MdPictureAsPdf size={18} />
              Exportar PDF
            </button>
          </div>

          <div className={styles.menuSection}>
            <div className={styles.sectionTitle}>
              <MdCloudUpload size={16} />
              Importar
            </div>
            <label className={styles.menuItem}>
              <i className="bi bi-upload"></i>
              Importar arquivo
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportar}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div className={styles.menuFooter}>
            <small>Formatos: Excel (.xlsx) ou CSV</small>
          </div>
        </div>
      )}
    </div>
    )
  );
}
