<template>
  <div class="page">
    <header>
      <h1>{{ id === 'new' ? 'New user' : 'Edit user' }}</h1>
      <button @click="goBack">Back</button>
    </header>
    <form @submit.prevent="saveUser" class="form">
      <label>
        Email
        <input v-model="user.email" />
      </label>
      <label>
        Name
        <input v-model="user.name" />
      </label>
      <label>
        Role
        <select v-model="user.role">
          <option value="guest">Guest</option>
          <option value="editor">Editor</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <label>
        Password
        <input v-model="user.password" type="password" />
      </label>
      <button type="submit">Save</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';

const route = useRoute();
const router = useRouter();
const id = ref(String(route.params.id || 'new'));
const user = ref<any>({ email: '', name: '', role: 'editor', password: '' });

async function loadUser() {
  if (id.value === 'new') return;
  const response = await api.get(`/adminapi/content/users/${decodeURIComponent(id.value)}`);
  user.value = { ...response.data, password: '' };
}

async function saveUser() {
  if (id.value === 'new') {
    await api.post('/adminapi/content/users', user.value);
  } else {
    await api.post(`/adminapi/content/users/${encodeURIComponent(user.value.email)}`, user.value);
  }
  router.push('/userlist');
}

function goBack() {
  router.push('/userlist');
}

onMounted(() => {
  loadUser();
});
</script>

<style scoped>
.page { padding: 2rem; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
button { padding: .6rem .9rem; border: 0; border-radius: 8px; cursor: pointer; background: #111827; color: white; }
.form { display: grid; gap: 1rem; max-width: 560px; background: white; padding: 1.5rem; border-radius: 12px; }
label { display: grid; gap: .4rem; font-weight: 600; }
input, select { padding: .7rem; border: 1px solid #d1d5db; border-radius: 8px; }
</style>
