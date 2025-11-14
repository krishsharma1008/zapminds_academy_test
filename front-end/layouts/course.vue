<template>
  <VHeader />

  <main :class="$style.root">
    <slot />
  </main>
</template>

<style module lang="scss">
.root {
  padding-top: calc(var(--height-space) * 0.45);
  min-height: 100vh;
}
</style>
