import Swal from 'sweetalert2';
import { exportBackupNow } from './exportBackup';

const KEY_NEXT_REMINDER = 'backup_next_reminder_at';
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

// Mostra um lembrete a cada 2 semanas somente para Proprietário ao entrar no sistema
export async function maybeShowBiweeklyBackupPrompt() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  if (!token || role !== 'Proprietário') return;

  const now = Date.now();
  const nextAtStr = localStorage.getItem(KEY_NEXT_REMINDER);
  const nextAt = nextAtStr ? Number(nextAtStr) : 0;
  if (nextAt && now < nextAt) return; // ainda não é hora

  const result = await Swal.fire({
    title: 'Sugerir Backup',
    text: 'Deseja fazer um backup agora? Recomendamos fazer backups regulares dos seus dados.',
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'Quero fazer o backup',
    cancelButtonText: 'Talvez mais tarde',
    confirmButtonColor: '#0ea5e9',
    cancelButtonColor: '#64748b',
  });

  if (result.isConfirmed) {
    // Executa exatamente a mesma função de exportar backup do menu
    await exportBackupNow();
    // Após executar, agenda próximo lembrete para daqui a 2 semanas
    localStorage.setItem(KEY_NEXT_REMINDER, String(now + TWO_WEEKS_MS));
  } else {
    // Usuário preferiu mais tarde: agenda próximo lembrete
    localStorage.setItem(KEY_NEXT_REMINDER, String(now + TWO_WEEKS_MS));
  }
}
