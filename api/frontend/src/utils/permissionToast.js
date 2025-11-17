import { toast } from 'react-toastify';

// Simple throttle to avoid spamming the same permission toast repeatedly
let lastShownAt = 0;
const MIN_INTERVAL_MS = 2000; // 2 seconds

export function showPermissionDeniedOnce(message = 'Nível de permissão insuficiente') {
  const now = Date.now();
  if (now - lastShownAt > MIN_INTERVAL_MS) {
    lastShownAt = now;
    toast.error(message);
  }
}
