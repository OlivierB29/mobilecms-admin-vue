<template>
  <div class="page">
    <header>
      <h1>{{ id === 'new' ? 'Nouvel enregistrement' : "Modifier l'enregistrement" }}</h1>
      <div class="actions">
        <button @click="goBack">Retour</button>
        <button @click="saveRecord">Enregistrer</button>
        <button
          v-if="id !== 'new'"
          type="button"
          class="delete-button"
          @click="confirmAndDelete"
          title="Supprimer l'enregistrement"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M3 6h18v2H3V6zm2 3h14l-1 11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2l-1-11zM10 4h4l1 2H9l1-2z" />
          </svg>
        </button>
      </div>
    </header>
    <div v-if="loading">Chargement…</div>
    <form v-else @submit.prevent="saveRecord" class="form">
      <div v-for="property in properties" :key="property.name" class="field">
        <template v-if="property.editor !== 'none' && !property.generated">
          <label :for="property.name">{{ property.name }}</label>

          <input
            v-if="property.editor === 'line'"
          :id="property.name"
          v-model="record[property.name]"
        />

        <select
          v-else-if="property.editor === 'choice'"
          :id="property.name"
          v-model="record[property.name]"
        >
          <option v-for="choice in property.choices || []" :key="choice" :value="choice">
            {{ choice }}
          </option>
        </select>

        <input
          v-else-if="property.editor === 'date'"
          :id="property.name"
          type="date"
          v-model="record[property.name]"
        />

          <ckeditor
          v-else-if="property.editor === 'text'"
          :id="property.name"
          :editor="ClassicEditor"
          v-model="record[property.name]"
          :config="editorConfig"
        />

        <div v-else-if="property.editor === 'medialist'"
             class="media-field"
        >
          <input
            :id="property.name + '-upload'"
            type="file"
            multiple
            @change="onFilesSelected($event, property.name)"
          />
          <button type="button" @click="uploadFiles(property.name)">Téléverser des fichiers</button>
          <div class="upload-error" v-if="uploadError">{{ uploadError }}</div>
          <div class="upload-error" v-if="deleteError">{{ deleteError }}</div>
          <div class="uploaded-files" v-if="Array.isArray(record[property.name]) && record[property.name].length">
            <div v-for="file in record[property.name]" :key="file.url" class="uploaded-file">
              <span>{{ file.title || file.url }}</span>
              <button type="button" class="delete-file-button" @click="deleteFile(property.name, file.url)">Supprimer</button>
            </div>
          </div>
        </div>

        <div v-else-if="property.editor === 'attachmentlist'"
             class="value-display"
        >
          {{ formatValue(record[property.name]) }}
        </div>

          <div v-else class="value-display">
            {{ formatValue(record[property.name]) }}
          </div>
        </template>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../services/api';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const route = useRoute();
const router = useRouter();
const type = ref(String(route.params.type || 'news'));
const id = ref(String(route.params.id || 'new'));
const loading = ref(true);
const properties = ref<any[]>([]);
const record = ref<any>({});
const selectedFiles = ref<File[]>([]);
const uploadError = ref('');
const deleteError = ref('');
const editorConfig = ref({
  placeholder: 'Saisissez du contenu HTML ici…',
  toolbar: ['bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'heading', '|', 'undo', 'redo']
});

function createDefaultRecord() {
  const defaults: Record<string, unknown> = {};

  properties.value.forEach((property: any) => {
    if (property.editor === 'choice') {
      defaults[property.name] = property.choices?.[0] || '';
    } else if (property.editor === 'medialist' || property.editor === 'attachmentlist') {
      defaults[property.name] = [];
    } else {
      defaults[property.name] = '';
    }
  });

  return defaults;
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map(item => {
        if (item && typeof item === 'object' && 'title' in item) {
          return (item as any).title || (item as any).url || JSON.stringify(item);
        }
        return String(item);
      })
      .join(', ');
  }

  return value ?? '';
}

function slugify(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function computeGeneratedFields(payload: Record<string, any>, preserveExisting: boolean) {
  properties.value.forEach((property: any) => {
    if (!property || !property.generated || !property.name) {
      return;
    }

    if (String(property.generated).trim() === 'date') {
      payload[property.name] = new Date().toISOString();
      return;
    }

    if (preserveExisting && payload[property.name]) {
      return;
    }

    const sourceField = String(property.generated).trim();
    if (!sourceField) {
      return;
    }

    const sourceValue = payload[sourceField];
    if (sourceValue === undefined || sourceValue === null || sourceValue === '') {
      payload[property.name] = '';
      return;
    }

    if (sourceField === 'title') {
      const base = slugify(sourceValue);
      const suffix = String(Math.floor(Math.random() * 9000) + 1000);
      payload[property.name] = base ? `${base}-${suffix}` : `generated-${suffix}`;
      return;
    }

    payload[property.name] = sourceValue;
  });
}

async function loadMetadata() {
  try {
    const response = await api.get<any[]>(`/cmsapi/metadata/${type.value}`);
    properties.value = Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error(error);
    properties.value = [];
  }
}

async function loadRecord() {
  if (id.value === 'new') {
    record.value = createDefaultRecord();
    return;
  }

  try {
    const response = await api.get(`/cmsapi/content/${type.value}/${id.value}`);
    record.value = {
      ...createDefaultRecord(),
      ...(response.data || {})
    };
  } catch (error) {
    console.error(error);
    record.value = createDefaultRecord();
  }
}

async function loadPage() {
  loading.value = true;
  await Promise.all([loadMetadata(), loadRecord()]);
  loading.value = false;
}

function onFilesSelected(event: Event, propertyName: string) {
  uploadError.value = '';
  const input = event.target as HTMLInputElement;
  const files = input.files;

  if (!files) {
    selectedFiles.value = [];
    return;
  }

  selectedFiles.value = Array.from(files);
}

async function uploadFiles(propertyName: string) {
  if (!selectedFiles.value.length) {
    uploadError.value = 'Sélectionnez d\'abord des fichiers à téléverser.';
    return;
  }

  if (id.value === 'new') {
    uploadError.value = "Enregistrez l'enregistrement avant de téléverser des fichiers.";
    return;
  }

  const formData = new FormData();
  selectedFiles.value.forEach(file => formData.append('uploadfiles[]', file));

  try {
    const response = await api.upload<any[]>(`/fileapi/basicupload/${type.value}/${encodeURIComponent(id.value)}`, formData);
    const uploaded = response.data || [];

    if (!Array.isArray(record.value[propertyName])) {
      record.value[propertyName] = [];
    }
    record.value[propertyName] = [...record.value[propertyName], ...uploaded];
    selectedFiles.value = [];
    uploadError.value = '';
  } catch (error) {
    uploadError.value = error instanceof Error ? error.message : 'Échec du téléversement.';
  }
}

async function deleteFile(propertyName: string, fileUrl: string) {
  if (id.value === 'new') {
    deleteError.value = "Enregistrez l'enregistrement avant de supprimer des fichiers.";
    return;
  }

  try {
    const response = await api.post<any[]>(`/fileapi/delete/${type.value}/${encodeURIComponent(id.value)}`, [{ url: fileUrl }]);
    const updatedFiles = response.data || [];
    record.value[propertyName] = updatedFiles;
    deleteError.value = '';
  } catch (error) {
    deleteError.value = error instanceof Error ? error.message : "Échec de la suppression.";
  }
}

async function saveRecord() {
  try {
    const payload = { ...record.value };
    computeGeneratedFields(payload, id.value !== 'new');
    await api.post(`/cmsapi/content/${type.value}`, payload);
    record.value = payload;
    router.push(`/recordlist/${type.value}`);
  } catch (e) {
    console.error(e);
  }
}

async function confirmAndDelete() {
  if (id.value === 'new') return;

  const ok = window.confirm("Êtes-vous sûr de vouloir supprimer cet enregistrement ?");
  if (!ok) return;

  try {
    await api.delete(`/cmsapi/content/${type.value}/${encodeURIComponent(id.value)}`);
    router.push(`/recordlist/${type.value}`);
  } catch (e) {
    console.error(e);
    deleteError.value = e instanceof Error ? e.message : 'Delete failed.';
  }
}

function goBack() {
  router.push(`/recordlist/${type.value}`);
}

watch(
  () => route.params.type,
  () => {
    type.value = String(route.params.type || 'news');
    id.value = String(route.params.id || 'new');
    loadPage();
  }
);

onMounted(() => {
  loadPage();
});
</script>

<style scoped>
.page { padding: 2rem; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.actions { display: flex; gap: .75rem; }
button { padding: .6rem .9rem; border: 0; border-radius: 8px; cursor: pointer; background: #111827; color: white; }
.form { display: grid; gap: 1rem; max-width: 640px; background: white; padding: 1.5rem; border-radius: 12px; }
.field { display: grid; gap: .4rem; }
label { font-weight: 600; }
input, select, textarea { padding: .7rem; border: 1px solid #d1d5db; border-radius: 8px; }
.value-display { padding: .7rem; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb; }
.media-field { display: grid; gap: .5rem; }
.uploaded-files { display: grid; gap: .3rem; padding: .6rem; border: 1px solid #d1d5db; border-radius: 8px; background: #f9fafb; }
.uploaded-file { display: flex; justify-content: space-between; align-items: center; gap: .75rem; font-size: .95rem; }
.delete-file-button { padding: .35rem .65rem; border: 0; border-radius: 8px; cursor: pointer; background: #dc2626; color: white; }
.upload-error { color: #b91c1c; font-size: .95rem; }

.delete-button { display: inline-flex; align-items: center; justify-content: center; gap: .4rem; padding: .5rem .7rem; border: 0; border-radius: 8px; cursor: pointer; background: #dc2626; color: white; }
.delete-button svg { display: block; }
</style>
