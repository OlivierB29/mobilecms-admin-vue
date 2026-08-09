<template>
  <div class="page">
    <header>
      <h1>{{ id === 'new' ? 'New record' : 'Edit record' }}</h1>
      <div class="actions">
        <button @click="goBack">Back</button>
        <button @click="saveRecord">Save</button>
      </div>
    </header>
    <div v-if="loading">Loading…</div>
    <form v-else @submit.prevent="saveRecord" class="form">
      <label>
        Title
        <input v-model="record.title" />
      </label>
      <label>
        Status
        <select v-model="record.status">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>
      <div class="field">
        <label for="description">Description</label>
        <ckeditor id="description" :editor="ClassicEditor" v-model="record.description" :config="editorConfig" />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const route = useRoute();
const router = useRouter();
const type = ref(String(route.params.type || 'news'));
const id = ref(String(route.params.id || 'new'));
const loading = ref(true);
const record = ref<any>({ title: '', status: 'draft', description: '' });
const editorConfig = ref({
  placeholder: 'Enter HTML content here…',
  toolbar: ['bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'heading', '|',  'undo', 'redo']
});

async function loadRecord() {
  loading.value = true;
  if (id.value === 'new') {
    record.value = { title: '', status: 'draft', description: '' };
    loading.value = false;
    return;
  }
  try {
    const response = await api.get(`/cmsapi/content/${type.value}/${id.value}`);
    record.value = response.data || { title: '', status: 'draft', description: '' };
  } finally {
    loading.value = false;
  }
}

async function saveRecord() {
  try {
    await api.post(`/cmsapi/content/${type.value}`, record.value);
    router.push(`/recordlist/${type.value}`);
  } catch (e) {
    console.error(e);
  }
}

function goBack() {
  router.push(`/recordlist/${type.value}`);
}

onMounted(() => {
  loadRecord();
});
</script>

<style scoped>
.page { padding: 2rem; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.actions { display: flex; gap: .75rem; }
button { padding: .6rem .9rem; border: 0; border-radius: 8px; cursor: pointer; background: #111827; color: white; }
.form { display: grid; gap: 1rem; max-width: 640px; background: white; padding: 1.5rem; border-radius: 12px; }
label { display: grid; gap: .4rem; font-weight: 600; }
input, select, textarea { padding: .7rem; border: 1px solid #d1d5db; border-radius: 8px; }
</style>
