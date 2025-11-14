<script setup lang="ts">
// Render only on client to avoid SSR layout shifts
</script>

<template>
  <div class="review-root">
    <client-only>
      <iframe
        class="review-frame"
        src="/review/index.html"
        title="The Frantic Run of the Valorous Rabbit — Review"
      />
    </client-only>
  </div>
</template>

<style scoped>
.review-root {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  padding: 0;
  margin: 0;
  background: #0a0a0a;
}

.review-frame {
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  border: 0;
  background: #0a0a0a;
}
</style>
