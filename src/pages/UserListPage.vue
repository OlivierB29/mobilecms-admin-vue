<template>
  <div class="page">
    <header>
      <h1>Utilisateurs</h1>
      <button @click="goHome">Accueil</button>
    </header>
    <div v-if="loading">Chargement…</div>
    <table v-else>
      <thead>
        <tr><th>Adresse e-mail</th><th>Nom</th><th>Rôle</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.email">
          <td>{{ item.email }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.role }}</td>
          <td><button @click="editUser(item)">Modifier</button></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

const router = useRouter();
const items = ref<any[]>([]);
const loading = ref(true);

async function loadUsers() {
  loading.value = true;
  try {
    const response = await api.get('/adminapi/index/users');
    items.value = response.data || [];
  } finally {
    loading.value = false;
  }
}

function editUser(item: any) {
  router.push(`/userrecord/${encodeURIComponent(item.email || 'new')}`);
}

function goHome() {
  router.push('/home');
}

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.page { padding: 2rem; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
button { padding: .6rem .9rem; border: 0; border-radius: 8px; cursor: pointer; background: #111827; color: white; }
table { width: 100%; border-collapse: collapse; background: white; }
th, td { padding: .85rem; border-bottom: 1px solid #e5e7eb; text-align: left; }
</style>
