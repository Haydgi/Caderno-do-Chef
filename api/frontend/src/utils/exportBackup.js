import axios from 'axios';
import { toast } from 'react-toastify';
import { getApiBaseUrl } from './api';

// Exporta backup completo em .zip (reutilizável em qualquer lugar da UI)
export async function exportBackupNow() {
  try {
    toast.info('Gerando backup completo...');
    const token = localStorage.getItem('token');
    const baseUrl = getApiBaseUrl();
    const resp = await axios.get(`${baseUrl}/api/backup/export`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([resp.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `backup_caderno_do_chef_${new Date().toISOString().split('T')[0]}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Backup exportado!');
    return true;
  } catch (err) {
    console.error('Erro backup export:', err);
    toast.error('Falha ao gerar backup.');
    return false;
  }
}
