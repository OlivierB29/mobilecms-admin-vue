<template>
  <div class="page login-page">
    <div class="card">
      <h1>MobileCMS Admin</h1>
      <p>Sign in to continue</p>
      <form @submit.prevent="submitLogin">
        <label>
          Username
          <input v-model="form.username" type="text" required />
        </label>
        <label>
          Password
          <input v-model="form.password" type="password" required />
        </label>
        <button type="submit">Login</button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

const router = useRouter();
const auth = useAuthStore();
const form = reactive({ username: '', password: '' });
const error = ref('');

async function submitLogin() {
  error.value = '';
  try {
    const response = await api.post('/authapi/authenticate', {
      user: form.username,
      password: form.password
    });
    const payload = response.data;
    if (payload && payload.token) {
      auth.setSession({ name: payload.name || form.username, role: payload.role || 'editor' }, payload.token);
      router.push('/home');
    } else {
      error.value = 'Authentication failed';
    }
  } catch (e: any) {
    error.value = e?.message || 'Authentication failed';
  }
}
</script>

<style scoped>
.page { min-height: 100vh; display: grid; place-items: center; padding: 2rem; }
.card { width: min(100%, 420px); background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 10px 30px rgba(0,0,0,.08); }
form { display: grid; gap: 1rem; }
label { display: grid; gap: .4rem; font-weight: 600; }
input { padding: .75rem; border: 1px solid #d1d5db; border-radius: 8px; }
button { background: #2563eb; color: white; border: 0; border-radius: 8px; padding: .8rem 1rem; cursor: pointer; }
.error { color: #b91c1c; }
</style>
