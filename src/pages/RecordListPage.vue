<template>
  <div class="page">
    <header>
      <h1>{{ type }} — enregistrements</h1>
      <div class="actions">
        <button @click="goHome">Accueil</button>
        <button @click="viewMetadata">Voir les métadonnées</button>
        <button @click="createRecord">Nouvel enregistrement</button>
      </div>
    </header>
    <div v-if="loading">Chargement…</div>
    <table v-else>
      <thead>
        <tr><th>Titre</th><th>État</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id || item.title">
          <td>{{ item.title }}</td>
          <td>{{ item.status }}</td>
          <td><button @click="editRecord(item)">Modifier</button></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';

const route = useRoute();
const router = useRouter();
const type = ref(String(route.params.type || 'news'));
const items = ref<any[]>([]);
const loading = ref(true);

async function loadItems() {
  loading.value = true;
  try {
    const response = await api.get(`/cmsapi/index/${type.value}`);
    items.value = response.data || [];
  } finally {
    loading.value = false;
  }
}

function editRecord(item: any) {
  router.push(`/record/${type.value}/${item.id || ''}`);
}

function createRecord() {
  router.push(`/record/${type.value}/new`);
}

function viewMetadata() {
  router.push(`/metadata/${type.value}`);
}

function goHome() {
  router.push('/home');
}

onMounted(() => {
  loadItems();
});
</script>

<style scoped>
.page { padding: 2rem; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.actions { display: flex; gap: .75rem; }
button { padding: .6rem .9rem; border: 0; border-radius: 8px; cursor: pointer; background: #111827; color: white; }
table { width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; }
th, td { padding: .85rem; border-bottom: 1px solid #e5e7eb; text-align: left; }
</style>
