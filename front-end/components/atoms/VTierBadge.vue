<script setup lang="ts">
import { computed } from "vue";
import { getTierByName } from "~/utils/xp-tiers";

const props = defineProps<{
  tierName: string;
  size?: "small" | "medium" | "large";
  showGlow?: boolean;
}>();

const tier = computed(() => getTierByName(props.tierName));
const sizeClass = computed(() => `size-${props.size || "medium"}`);
</script>

<template>
  <span
    v-if="tier"
    :class="[$style.root, $style[sizeClass], showGlow && $style.glow]"
    :style="{ '--tier-color': tier.color }"
    :title="`${tier.name} Tier`"
  >
    <span :class="$style.icon">{{ tier.icon }}</span>
    <span :class="$style.name">{{ tier.name }}</span>
  </span>
</template>

<style module lang="scss">
.root {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--tier-color) 20%, transparent);
  border: 2px solid var(--tier-color);
  font-weight: bold;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background: color-mix(in srgb, var(--tier-color) 30%, transparent);
    transform: translateY(-2px);
  }

  &.glow {
    box-shadow: 0 0 10px var(--tier-color), 0 0 20px color-mix(in srgb, var(--tier-color) 50%, transparent);
    animation: tier-glow 2s ease-in-out infinite;
  }
}

.icon {
  font-size: 1.2em;
  line-height: 1;
}

.name {
  color: var(--tier-color);
  font-size: 0.9em;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

// Size variants
.size-small {
  padding: 0.3rem 0.6rem;
  gap: 0.4rem;

  .icon {
    font-size: 1em;
  }

  .name {
    font-size: 0.8em;
  }
}

.size-medium {
  padding: 0.4rem 0.8rem;
  gap: 0.5rem;

  .icon {
    font-size: 1.2em;
  }

  .name {
    font-size: 0.9em;
  }
}

.size-large {
  padding: 0.6rem 1.2rem;
  gap: 0.6rem;

  .icon {
    font-size: 1.5em;
  }

  .name {
    font-size: 1.1em;
  }
}

@keyframes tier-glow {
  0%,
  100% {
    box-shadow: 0 0 10px var(--tier-color), 0 0 20px color-mix(in srgb, var(--tier-color) 50%, transparent);
  }
  50% {
    box-shadow: 0 0 20px var(--tier-color), 0 0 40px color-mix(in srgb, var(--tier-color) 70%, transparent),
      0 0 60px color-mix(in srgb, var(--tier-color) 30%, transparent);
  }
}
</style>

