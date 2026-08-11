import api from './api';
import { HashUtils } from './hashutils';

export async function publicinfo(user: string) {
  try {
    return await api.post('/authapi/publicinfo', { user });
  } catch (e) {
    // fallback: try GET
    return api.get(`/authapi/publicinfo/${encodeURIComponent(user)}`);
  }
}

export function getPassword(password: string, mode: string) {
  const hashUtils = new HashUtils();
  if (mode === 'hashmacbase64') {
    return hashUtils.hash64(password);
  } else if (mode === 'none') {
    return password;
  }
  return hashUtils.hash(password);
}
