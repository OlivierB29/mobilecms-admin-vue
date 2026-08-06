<template>
  <div class="page">
    <header>
      <h1>Admin home</h1>
      <button @click="logout">Logout</button>
    </header>
    <div class="grid">
      <router-link class="card" to="/recordlist/news">Manage news</router-link>
      <router-link class="card" to="/recordlist/calendar">Manage calendar</router-link>
      <router-link class="card" to="/userlist">Manage users</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
const router = useRouter();
const auth = useAuthStore();
function logout() {
  auth.clearSession();
  router.push('/login');
}
</script>

<style scoped>
.page { padding: 2rem; }
header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
.card { display: block; padding: 1.5rem; background: white; border-radius: 12px; text-decoration: none; color: inherit; box-shadow: 0 8px 24px rgba(0,0,0,.06); }
button { padding: .7rem 1rem; border: 0; border-radius: 8px; cursor: pointer; background: #111827; color: white; }
</style>
