<template>
  <div class="page login-page">
    <div class="card">
      <h1>MobileCMS Admin</h1>
      <p>Sign in to continue</p>
      <form @submit.prevent="submitLogin">
        <label>
          Email
          <input v-model="form.email" type="email" required />
        </label>
        <label>
          Password
          <input v-model="form.password" type="password" required />
        </label>
        <button type="submit">Login</button>
      </form>
      <div style="margin-top:1rem; display:grid; gap:.75rem">
        <button @click="showReset = !showReset" type="button">Forgot password</button>
      </div>
      <div v-if="showReset" class="change-card" style="margin-top:1rem">
        <form @submit.prevent="submitResetPassword">
          <label>
            Email
            <input v-model="form.email" type="email" required />
          </label>
          <button type="submit">Send reset link</button>
        </form>
        <p v-if="resetMessage" :class="{ error: resetError }">{{ resetMessage }}</p>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';
import { publicinfo, getPassword } from '../services/auth';

const router = useRouter();
const auth = useAuthStore();
const form = reactive({ email: '', password: '' });
const showReset = ref(false);
const resetMessage = ref('');
const resetError = ref(false);
const error = ref('');

async function submitLogin() {
  error.value = '';
  try {
    let mode = 'hashmacbase64';
    try {
      const infoResp = await publicinfo(form.email);
      const info = (infoResp as any).data || infoResp;
      if (info && info.clientalgorithm) {
        mode = info.clientalgorithm;
      }
    } catch (e) {
      // ignore and use default
    }

    const hashed = getPassword(form.password, mode);

    const response = await api.post('/authapi/authenticate', {
      user: form.email,
      password: hashed
    });
    const payload = response.data;
    if (payload && payload.token) {
      auth.setSession({ name: payload.name || form.email, email: payload.email || form.email, role: payload.role || 'editor' }, payload.token);
      router.push('/home');
    } else {
      error.value = 'Authentication failed';
    }
  } catch (e: any) {
    error.value = e?.message || 'Authentication failed';
  }
}

async function submitResetPassword() {
  resetMessage.value = '';
  resetError.value = false;

  try {
    await api.post('/authapi/resetpassword', {
      user: form.email
    });

    resetMessage.value = 'Password reset email sent or reset initiated';
    resetError.value = false;
    showReset.value = false;
  } catch (e: any) {
    resetMessage.value = e?.message || 'Forgot password failed';
    resetError.value = true;
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
