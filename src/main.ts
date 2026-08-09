import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import CKEditor from '@ckeditor/ckeditor5-vue';

const app = createApp(App);

app.use(router);
app.use(CKEditor);
app.mount('#app');
