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
      <div style="margin-top:1rem">
        <button @click="showChange = !showChange" type="button">Change password</button>
      </div>
      <div v-if="showChange" class="change-card" style="margin-top:1rem">
        <form @submit.prevent="submitChangePassword">
          <label>
            Username
            <input v-model="form.username" type="text" required />
          </label>
          <label>
            Old password
            <input v-model="change.oldPassword" type="password" required />
          </label>
          <label>
            New password
            <input v-model="change.newPassword" type="password" required />
          </label>
          <label>
            Confirm new password
            <input v-model="change.confirmPassword" type="password" required />
          </label>
          <button type="submit">Submit change</button>
        </form>
        <p v-if="changeMessage" :class="{ error: changeError }">{{ changeMessage }}</p>
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
const form = reactive({ username: '', password: '' });
const showChange = ref(false);
const change = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });
const changeMessage = ref('');
const changeError = ref(false);
const error = ref('');

async function submitLogin() {
  error.value = '';
  try {
    let mode = 'hashmacbase64';
    try {
      const infoResp = await publicinfo(form.username);
      const info = (infoResp as any).data || infoResp;
      if (info && info.clientalgorithm) {
        mode = info.clientalgorithm;
      }
    } catch (e) {
      // ignore and use default
    }

    const hashed = getPassword(form.password, mode);

    const response = await api.post('/authapi/authenticate', {
      user: form.username,
      password: hashed
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

async function submitChangePassword() {
  changeMessage.value = '';
  changeError.value = false;
  if (change.newPassword !== change.confirmPassword) {
    changeMessage.value = 'New passwords do not match';
    changeError.value = true;
    return;
  }

  try {
    let mode = 'hashmacbase64';
    try {
      const infoResp = await publicinfo(form.username);
      const info = (infoResp as any).data || infoResp;
      if (info && info.clientalgorithm) {
        mode = info.clientalgorithm;
      }
    } catch (e) {
      // ignore, use default
    }

    const oldHashed = getPassword(change.oldPassword, mode);
    const newHashed = getPassword(change.newPassword, 'hashmacbase64');

    await api.post('/authapi/changepassword', {
      user: form.username,
      password: oldHashed,
      newpassword: newHashed,
      captchaanswer: ''
    });

    changeMessage.value = 'Password changed successfully';
    changeError.value = false;
    showChange.value = false;
    change.oldPassword = '';
    change.newPassword = '';
    change.confirmPassword = '';
  } catch (e: any) {
    changeMessage.value = e?.message || 'Change password failed';
    changeError.value = true;
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
