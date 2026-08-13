<template>
  <div class="page">
    <header>
      <div>
        <h1>Accueil de l'administration</h1>
        <button @click="goChangePassword" type="button">Changer le mot de passe</button>
      </div>
      <button @click="logout">Se déconnecter</button>
    </header>
    <div class="grid">
      <div v-if="loading" class="status">Chargement des catégories…</div>
      <div v-else-if="error" class="status error">{{ error }}</div>
      <template v-else>
        <router-link
          class="card"
          v-for="item in categories"
          :key="item.type"
          :to="`/recordlist/${item.type}`"
        >
          {{ item.label }}
        </router-link>
      </template>
      <router-link v-if="isAdmin" class="card user-card" to="/userlist">Gérer les utilisateurs</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import api from '../services/api';

interface ContentTypeLabel {
  i18n: string;
  label: string;
}

interface ContentType {
  type: string;
  labels: ContentTypeLabel[];
  label: string;
}

const router = useRouter();
const auth = useAuthStore();
const categories = ref<ContentType[]>([]);
const loading = ref(true);
const error = ref('');
const isAdmin = computed(() => auth.isAdmin);

function logout() {
  auth.clearSession();
  router.push('/login');
}

function getLocaleLabel(labels: ContentTypeLabel[]) {
  const locale = 'fr';
  return (
    labels.find(label => label.i18n === locale)?.label ||
    labels.find(label => label.i18n === 'en')?.label ||
    labels[0]?.label ||
    ''
  );
}

async function loadCategories() {
  loading.value = true;
  error.value = '';

  try {
    const response = await api.get<ContentType[]>('/webapi/content/types');
    categories.value = (response.data || [])
      .map(item => ({
        ...item,
        label: getLocaleLabel(item.labels) || item.type
      }))
      .filter(item => item.type);
  } catch (err) {
  error.value = err instanceof Error ? err.message : "Impossible de charger les catégories.";
  } finally {
    loading.value = false;
  }
}

function goChangePassword() {
  router.push('/changepassword');
}

onMounted(() => {
  loadCategories();
});
</script>

<style scoped>
.page { padding: 2rem; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
.card { display: block; padding: 1.5rem; background: white; border-radius: 12px; text-decoration: none; color: inherit; box-shadow: 0 8px 24px rgba(0,0,0,.06); }
button { padding: .7rem 1rem; border: 0; border-radius: 8px; cursor: pointer; background: #111827; color: white; }
.status { display: block; padding: 1.5rem; border-radius: 12px; background: #f3f4f6; color: #111827; }
.status.error { background: #fee2e2; color: #991b1b; }
.change-card { margin-bottom: 1rem; }
.change-card form { display: grid; gap: 1rem; }
.change-card label { display: grid; gap: .4rem; font-weight: 600; }
.change-card input { padding: .75rem; border: 1px solid #d1d5db; border-radius: 8px; }
.change-card button { background: #2563eb; }
.user-card { grid-column: span 1; }
</style>
