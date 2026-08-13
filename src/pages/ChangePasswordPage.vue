<template>
  <div class="page change-password-page">
    <div class="card">
      <h1>Changer le mot de passe</h1>
      <form @submit.prevent="submitChangePassword">
        <label>
          Adresse e-mail
          <input v-model="formEmail" type="email" readonly />
        </label>
        <label>
          Ancien mot de passe
          <input v-model="change.oldPassword" type="password" required />
        </label>
        <label>
          Nouveau mot de passe
          <input v-model="change.newPassword" type="password" required />
        </label>
        <label>
          Confirmer le nouveau mot de passe
          <input v-model="change.confirmPassword" type="password" required />
        </label>
        <button type="submit">Valider</button>
      </form>
      <p v-if="changeMessage" :class="{ error: changeError }">{{ changeMessage }}</p>
      <button class="back-button" type="button" @click="goBack">Retour</button>
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
const formEmail = ref(auth.user?.email || '');
const change = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });
const changeMessage = ref('');
const changeError = ref(false);

function goBack() {
  router.push('/home');
}

async function submitChangePassword() {
  changeMessage.value = '';
  changeError.value = false;

  if (change.newPassword !== change.confirmPassword) {
    changeMessage.value = 'Les nouveaux mots de passe ne correspondent pas';
    changeError.value = true;
    return;
  }

  try {
    let mode = 'hashmacbase64';
    try {
      const infoResp = await publicinfo(formEmail.value);
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
      user: formEmail.value,
      password: oldHashed,
      newpassword: newHashed,
      captchaanswer: ''
    });

    changeMessage.value = 'Mot de passe modifié avec succès';
    changeError.value = false;
    change.oldPassword = '';
    change.newPassword = '';
    change.confirmPassword = '';
  } catch (e: any) {
    changeMessage.value = e?.message || "Échec du changement de mot de passe";
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
.back-button { margin-top: 1rem; background: #6b7280; }
</style>
