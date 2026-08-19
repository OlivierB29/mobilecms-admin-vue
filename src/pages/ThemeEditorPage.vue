<template>
  <div class="page">
    <header>
      <h1>Thème du site</h1>
      <div class="actions">
        <button type="button" @click="goHome">Accueil</button>
        <button type="button" class="primary" @click="saveTheme">Enregistrer</button>
      </div>
    </header>

    <p v-if="loading" class="status">Chargement…</p>
    <p v-else-if="error" class="status error">{{ error }}</p>
    <form v-else class="form" @submit.prevent="saveTheme">
      <section>
        <h2>Identité</h2>
        <label>Langue par défaut<input v-model="theme.defaultlocale" required /></label>
        <label>Titre<input v-model="theme.title" required /></label>
        <label>Titre complet<input v-model="theme.fulltitle" required /></label>
        <label>Mots-clés<input v-model="theme.keywords" /></label>
      </section>

      <section>
        <div class="section-heading"><h2>Réseaux sociaux</h2><button type="button" @click="addSocialNetwork">Ajouter</button></div>
        <div v-for="(network, index) in theme.socialnetworks" :key="index" class="network">
          <label>Nom<input v-model="network.title" /></label>
          <label>URL<input v-model="network.url" type="url" /></label>
          <label>Icône Bootstrap<input v-model="network.icon" placeholder="bi-facebook" /></label>
          <button type="button" class="remove" @click="removeSocialNetwork(index)">Supprimer</button>
        </div>
      </section>

      <section>
        <h2>Calendrier Google</h2>
        <label>URL d’intégration<input v-model="theme.googlecalendar.embedurl" type="url" /></label>
      </section>

      <section>
        <h2>Bannière</h2>
        <div class="upload-field">
          <input type="file" accept="image/jpeg,image/png,image/gif" @change="onBannerSelected" />
          <button type="button" @click="uploadBanner">Téléverser l’image</button>
        </div>
        <div v-if="theme.banner.imageurl" class="uploaded-banner">
          Image actuelle : {{ theme.banner.imageurl }}
        </div>
        <p v-if="uploadError" class="error">{{ uploadError }}</p>
        <label>Texte alternatif<input v-model="theme.banner.imagealt" /></label>
      </section>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';

interface SocialNetwork { title: string; url: string; icon: string }
interface Theme { defaultlocale: string; title: string; fulltitle: string; keywords: string; socialnetworks: SocialNetwork[]; googlecalendar: { embedurl: string }; banner: { imageurl: string; imagealt: string } }

const router = useRouter();
const loading = ref(true);
const error = ref('');
const uploadError = ref('');
const bannerFile = ref<File | null>(null);
const theme = reactive<Theme>({
  defaultlocale: '', title: '', fulltitle: '', keywords: '', socialnetworks: [],
  googlecalendar: { embedurl: '' }, banner: { imageurl: '', imagealt: '' }
});

function applyTheme(data: Partial<Theme>) {
  Object.assign(theme, data, {
    socialnetworks: Array.isArray(data.socialnetworks)
      ? data.socialnetworks.map(network => ({
        title: network.title || '',
        url: network.url || '',
        icon: network.icon || ''
      }))
      : [],
    googlecalendar: { embedurl: data.googlecalendar?.embedurl || '' },
    banner: { imageurl: data.banner?.imageurl || '', imagealt: data.banner?.imagealt || '' }
  });
}

async function loadTheme() {
  try {
    applyTheme((await api.get<Theme>('/adminapi/theme')).data || {});
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Impossible de charger le thème.';
  } finally { loading.value = false; }
}

async function saveTheme() {
  error.value = '';
  try {
    applyTheme((await api.post<Theme>('/adminapi/theme', theme)).data || theme);
    window.alert('Thème enregistré.');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Impossible d’enregistrer le thème.';
  }
}

function onBannerSelected(event: Event) {
  uploadError.value = '';
  bannerFile.value = (event.target as HTMLInputElement).files?.[0] || null;
}

async function uploadBanner() {
  if (!bannerFile.value) {
    uploadError.value = 'Sélectionnez d’abord une image.';
    return;
  }

  const formData = new FormData();
  formData.append('banner', bannerFile.value);

  try {
    const response = await api.upload<{ url: string }>('/adminapi/theme/banner', formData);
    theme.banner.imageurl = response.data.url;
    bannerFile.value = null;
    uploadError.value = '';
  } catch (err) {
    uploadError.value = err instanceof Error ? err.message : 'Échec du téléversement.';
  }
}

function addSocialNetwork() { theme.socialnetworks.push({ title: '', url: '', icon: '' }); }
function removeSocialNetwork(index: number) { theme.socialnetworks.splice(index, 1); }
function goHome() { router.push('/home'); }
onMounted(loadTheme);
</script>

<style scoped>
.page { padding: 2rem; max-width: 980px; margin: 0 auto; }
header, .section-heading { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.actions { display: flex; gap: .75rem; }
.form { display: grid; gap: 1rem; }
section { display: grid; gap: 1rem; background: white; padding: 1.5rem; border-radius: 12px; }
h2 { margin: 0; font-size: 1.1rem; }
label { display: grid; gap: .4rem; font-weight: 600; }
input { width: 100%; padding: .7rem; border: 1px solid #d1d5db; border-radius: 8px; }
.upload-field { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
button { padding: .6rem .9rem; border: 0; border-radius: 8px; cursor: pointer; background: #111827; color: white; }
.primary { background: #2563eb; }
.network { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; padding: 1rem; border: 1px solid #e5e7eb; border-radius: 8px; }
.remove { justify-self: start; background: #991b1b; }
.status { padding: 1rem; background: #f3f4f6; }
.error { color: #991b1b; background: #fee2e2; }
@media (max-width: 640px) { .page { padding: 1rem; } header { align-items: flex-start; flex-direction: column; } .network { grid-template-columns: 1fr; } }
</style>