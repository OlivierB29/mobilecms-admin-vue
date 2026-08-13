<template>
  <div class="page">
    <header>
      <h1>{{ type }} — métadonnées</h1>
      <div class="actions">
        <button @click="goBack">Retour</button>
      </div>
    </header>

    <div v-if="loading">Chargement…</div>
    <div v-else-if="!properties.length">Aucune métadonnée trouvée pour ce type.</div>
    <table v-else>
      <thead>
        <tr>
          <th>Nom</th>
          <th>Type</th>
          <th>Éditeur</th>
          <th>Principal</th>
          <th>Choix</th>
          <th>Traduire</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="property in properties" :key="property.name || property.id">
          <td>{{ property.name }}</td>
          <td>{{ property.type }}</td>
          <td>{{ property.editor }}</td>
          <td>{{ property.primary }}</td>
          <td>{{ formatChoices(property.choices) }}</td>
          <td>{{ property.translate }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';

const route = useRoute();
const router = useRouter();
const type = ref(String(route.params.type || 'news'));
const loading = ref(true);
const properties = ref<any[]>([]);

function formatChoices(choices: unknown): string {
  if (!Array.isArray(choices)) {
    return '';
  }

  return choices.join(', ');
}

async function loadMetadata() {
  loading.value = true;
  try {
    const response = await api.get<any[]>(`/cmsapi/metadata/${type.value}`);
    properties.value = Array.isArray(response.data) ? response.data : [];
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push(`/recordlist/${type.value}`);
}

watch(
  () => route.params.type,
  (value) => {
    type.value = String(value || 'news');
    loadMetadata();
  }
);

onMounted(() => {
  loadMetadata();
});
</script>

<style scoped>
.page { padding: 2rem; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.actions { display: flex; gap: .75rem; }
button { padding: .6rem .9rem; border: 0; border-radius: 8px; cursor: pointer; background: #111827; color: white; }
table { width: 100%; border-collapse: collapse; background: white; }
th, td { padding: .85rem; border-bottom: 1px solid #e5e7eb; text-align: left; }
</style>
