<template>
  <Teleport to="body">
    <div v-if="open" :class="$style.backdrop" @click.self="close">
      <div :class="$style.modal">
        <header :class="$style.header">
          <h2>XP Transaction History</h2>
          <button type="button" :class="$style.close" @click="close">×</button>
        </header>

        <section :class="$style.content">
          <p v-if="pending" :class="$style.status">Loading transactions…</p>
          <p v-else-if="!transactions.length" :class="$style.status">
            No XP transactions recorded yet.
          </p>

          <ul v-else :class="$style.list">
            <li v-for="item in transactions" :key="item.id" :class="$style.row">
              <div>
                <strong>{{ formatDelta(item.delta) }}</strong>
                <small>{{ formatSource(item.source) }}</small>
              </div>
              <div>
                <time :datetime="item.created_at">{{ formatDate(item.created_at) }}</time>
                <small v-if="item.note">{{ item.note }}</small>
              </div>
            </li>
          </ul>
        </section>

        <footer :class="$style.footer">
          <button type="button" :disabled="offset === 0" @click="prevPage">Previous</button>
          <span>{{ pageLabel }}</span>
          <button type="button" :disabled="!hasMore" @click="nextPage">Next</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (event: "close"): void }>();

const limit = ref(20);
const offset = ref(0);

const { data, pending, refresh } = useAsyncData(
  () => `xp-transactions:${offset.value}`,
  () =>
    $fetch<{ total: number; transactions: Array<{ id: number; delta: number; source: string; note: string | null; created_at: string }> }>(
      "/api/user/xp-transactions",
      {
        query: {
          limit: limit.value,
          offset: offset.value,
        },
      }
    )
);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      refresh();
    }
  }
);

const transactions = computed(() => data.value?.transactions ?? []);
const total = computed(() => data.value?.total ?? 0);
const hasMore = computed(() => offset.value + limit.value < total.value);
const pageLabel = computed(() => {
  if (!transactions.value.length) {
    return "0 transactions";
  }

  const start = offset.value + 1;
  const end = offset.value + transactions.value.length;
  return `${start}–${end} of ${total.value}`;
});

const close = () => emit("close");

const nextPage = async () => {
  if (!hasMore.value) {
    return;
  }
  offset.value += limit.value;
  await refresh();
};

const prevPage = async () => {
  if (offset.value === 0) {
    return;
  }
  offset.value = Math.max(offset.value - limit.value, 0);
  await refresh();
};

const formatDelta = (delta: number) => `${delta > 0 ? "+" : ""}${delta} XP`;
const formatSource = (source: string) => source.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
const formatDate = (iso: string) => new Date(iso).toLocaleString();
</script>

<style module>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(6, 10, 25, 0.65);
  display: grid;
  place-items: center;
  z-index: 999;
}

.modal {
  background: #0f1324;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  width: min(560px, 92vw);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 32px 64px rgba(6, 10, 25, 0.45);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header h2 {
  font-size: 1.1rem;
  font-weight: 600;
}

.close {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
}

.content {
  padding: 0 24px;
  flex: 1;
  overflow-y: auto;
}

.status {
  margin: 24px 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.65);
}

.list {
  display: grid;
  gap: 12px;
  margin: 24px 0;
  padding: 0;
  list-style: none;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.row strong {
  font-size: 1rem;
  color: #ffffff;
}

.row small {
  display: block;
  color: rgba(255, 255, 255, 0.55);
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.footer button {
  background: rgba(255, 255, 255, 0.08);
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  color: #ffffff;
  cursor: pointer;
}

.footer button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
