<template>
  <div class="app-shell">
    <router-view />
  </div>
</template>

<script setup lang="ts">
</script>

<style>
:root {
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #111827;
  background: #f3f4f6;
}
body {
  margin: 0;
  background: #f3f4f6;
}
* { box-sizing: border-box; }
button, input, select, textarea { font: inherit; }
.app-shell { min-height: 100vh; }
</style>