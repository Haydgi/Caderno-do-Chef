import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MdCloudUpload, MdCloudDownload, MdClose, MdPictureAsPdf, MdBackup } from 'react-icons/md';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import axios from 'axios';
import styles from './ImportExportButton.module.css';
import { exportBackupNow } from '../../utils/exportBackup';

export default function ImportExportButton() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [importando, setImportando] = useState(false); // estado de operações
  const [backupBusy, setBackupBusy] = useState(false); // estado específico para backup
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const location = useLocation();

  const role = localStorage.getItem('role');
  // Proprietário nas páginas de relatórios e usuários
  const permitido = role === 'Proprietário' && (location.pathname === '/relatorios');

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

  // Exporta backup completo em .zip (reutiliza util compartilhado)
  const handleExportarBackup = async () => {
    if (backupBusy) return;
    setBackupBusy(true);
    try {
      const ok = await exportBackupNow();
      if (ok) setMenuAberto(false);
    } finally {
      setBackupBusy(false);
    }
  };

  // Importa backup .zip com confirmação
  const handleImportarBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.zip')) {
      toast.error('Envie um arquivo .zip gerado pelo backup.');
      e.target.value='';
      return;
    }
    if (backupBusy) { toast.info('Operação em andamento...'); return; }
    const result = await Swal.fire({
      title: 'Tem certeza?',
      text: 'Todos os dados atuais serão apagados e substituídos pelo conteúdo do backup.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, importar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) { e.target.value=''; return; }
    try {
      setBackupBusy(true);
      toast.info('Validando e importando backup (aguarde)...');
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const formData = new FormData();
      formData.append('arquivo', file);
      const resp = await axios.post(`${baseUrl}/api/backup/import`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Backup importado! Receitas: ${resp.data.receitas} | Ingredientes: ${resp.data.ingredientes} | Despesas: ${resp.data.despesas}`);
    } catch (err) {
      console.error('Erro import backup:', err);
      toast.error(err.response?.data?.error || 'Falha ao importar backup');
    } finally {
      e.target.value='';
      setBackupBusy(false);
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
        onClick={() => !importando && !backupBusy && setMenuAberto(!menuAberto)}
        title="Importar/Exportar dados"
        disabled={importando || backupBusy}
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
            {/* Exportar Excel habilitado */}
            <button
              className={styles.menuItem}
              onClick={() => handleExportar('excel')}
              disabled={importando || backupBusy}
            >
              <i className="bi bi-file-earmark-excel"></i>
              Exportar Excel (.xlsx)
            </button>
            <button className={styles.menuItem} onClick={handleExportarPDFIngredientes} disabled={importando || backupBusy}>
              <MdPictureAsPdf size={18} />
              Exportar PDF
            </button>
            <button className={styles.menuItem} onClick={handleExportarBackup} disabled={importando || backupBusy}>
              <MdBackup size={18} />
              Backup (.zip)
            </button>
          </div>

          <div className={styles.menuSection}>
            <div className={styles.sectionTitle}>
              <MdCloudUpload size={16} />
              Importar
            </div>
            {/* Removido: Importar Excel/CSV */}
            <label className={styles.menuItem} style={{opacity: importando||backupBusy?0.5:1, pointerEvents: importando||backupBusy?'none':'auto'}}>
              <MdBackup size={16} />
              Importar Backup (.zip)
              <input
                type="file"
                accept=".zip"
                onChange={handleImportarBackup}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          
        </div>
      )}
    </div>
    )
  );
}
