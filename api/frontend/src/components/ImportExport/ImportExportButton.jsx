import { useState, useRef, useEffect } from 'react';
import { MdCloudUpload, MdCloudDownload, MdClose } from 'react-icons/md';
import { toast } from 'react-toastify';
import axios from 'axios';
import styles from './ImportExportButton.module.css';

export default function ImportExportButton() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [importando, setImportando] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  const role = localStorage.getItem('role');

  // Apenas Proprietário pode ver este botão
  if (role !== 'Proprietário') {
    return null;
  }

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
      const response = await axios.get(
        `http://localhost:3001/api/exportar-dados?formato=${formato}`,
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

  const handleImportar = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('arquivo', file);

    setImportando(true);
    setMenuAberto(false);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3001/api/importar-dados',
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
  );
}
