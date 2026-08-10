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
      <div v-for="property in properties" :key="property.name" class="field">
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
          <button type="button" @click="uploadFiles(property.name)">Upload files</button>
          <div class="upload-error" v-if="uploadError">{{ uploadError }}</div>
          <div class="upload-error" v-if="deleteError">{{ deleteError }}</div>
          <div class="uploaded-files" v-if="Array.isArray(record[property.name]) && record[property.name].length">
            <div v-for="file in record[property.name]" :key="file.url" class="uploaded-file">
              <span>{{ file.title || file.url }}</span>
              <button type="button" class="delete-file-button" @click="deleteFile(property.name, file.url)">Delete</button>
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
  placeholder: 'Enter HTML content here…',
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
    uploadError.value = 'Select files to upload first.';
    return;
  }

  if (id.value === 'new') {
    uploadError.value = 'Save the record before uploading files.';
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
    uploadError.value = error instanceof Error ? error.message : 'Upload failed.';
  }
}

async function deleteFile(propertyName: string, fileUrl: string) {
  if (id.value === 'new') {
    deleteError.value = 'Save the record before deleting files.';
    return;
  }

  try {
    const response = await api.post<any[]>(`/fileapi/delete/${type.value}/${encodeURIComponent(id.value)}`, [{ url: fileUrl }]);
    const updatedFiles = response.data || [];
    record.value[propertyName] = updatedFiles;
    deleteError.value = '';
  } catch (error) {
    deleteError.value = error instanceof Error ? error.message : 'Delete failed.';
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
</style>
