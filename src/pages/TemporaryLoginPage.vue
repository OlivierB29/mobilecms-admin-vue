<template>
  <div class="page">
    <div class="card">
      <h1>Réinitialisation du mot de passe</h1>
      <p v-if="loading">Vérification du lien…</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <button v-if="error" type="button" @click="router.replace('/login')">Retour à la connexion</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const error = ref('');

async function validateResetLink() {
  const fragment = new URLSearchParams(route.hash.slice(1));
  const user = typeof route.query.user === 'string' ? route.query.user : fragment.get('user');
  const token = typeof route.query.token === 'string' ? route.query.token : fragment.get('token');
  if (typeof user !== 'string' || typeof token !== 'string' || !user || !token) {
    loading.value = false;
    error.value = 'Ce lien de réinitialisation est invalide ou incomplet.';
    return;
  }

  try {
    await router.replace({ path: route.path });
    await api.post('/authapi/temporarylogin', { user, token });
    sessionStorage.setItem('passwordReset', JSON.stringify({ user, token }));
    await router.replace({ path: '/changepassword', query: { reset: '1' } });
  } catch (e) {
    sessionStorage.removeItem('passwordReset');
    loading.value = false;
    const message = e instanceof Error ? e.message : '';
    error.value = message.includes('401')
      ? 'Ce lien de réinitialisation est invalide ou expiré.'
      : message || 'Impossible de vérifier le lien de réinitialisation.';
  }
}

void validateResetLink();
</script>

<style scoped>
.page { min-height: 100vh; display: grid; place-items: center; padding: 2rem; }
.card { width: min(100%, 420px); background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,.08); }
button { background: #2563eb; color: white; border: 0; border-radius: 8px; padding: .8rem 1rem; cursor: pointer; }
.error { color: #b91c1c; }
</style>
