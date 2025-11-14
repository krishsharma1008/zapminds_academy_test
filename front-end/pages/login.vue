<script setup lang="ts">
import { UIElements } from "~/assets/static-data/ui-elements";

definePageMeta({
  layout: "default",
  middleware: ["redirect-if-authenticated"],
});

const pageTitle = "Log in – Zapminds Academy";

useSeoMeta({
  title: pageTitle,
  description: UIElements.auth.subtitle,
});

type AuthProvider = "google" | "github" | "microsoft";

const credentials = reactive({
  email: "",
  password: "",
  remember: false,
});

const ssoProviders = [
  {
    id: "google",
    label: UIElements.auth.ssoProviders.google,
  },
  {
    id: "github",
    label: UIElements.auth.ssoProviders.github,
  },
  {
    id: "microsoft",
    label: UIElements.auth.ssoProviders.microsoft,
  },
];

const highlights = [
  {
    title: "Curated DSA roadmap",
    description: "Master data structures with progressive, interview-ready problems.",
  },
  {
    title: "Live code reviews",
    description: "Get annotated feedback from mentors after each milestone.",
  },
  {
    title: "Weekly leaderboards",
    description: "Climb the rankings while you sharpen your problem solving.",
  },
];

const router = useRouter();
const auth = process.client ? useStudentAuth() : null;

const formError = ref<string | null>(null);
const isSubmitting = ref(false);

const onSubmit = async (event: Event) => {
  event.preventDefault();
  if (isSubmitting.value) {
    return;
  }

  if (!auth) {
    formError.value = "Authentication is not available. Please refresh the page.";
    return;
  }

  formError.value = null;
  isSubmitting.value = true;

  try {
    await auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
      remember: credentials.remember,
    });
    credentials.password = "";
    await router.push("/dashboard");
  } catch (error) {
    formError.value =
      error instanceof Error ? error.message : "Unable to sign in.";
  } finally {
    isSubmitting.value = false;
  }
};

const onProviderLogin = async (providerId: AuthProvider) => {
  if (isSubmitting.value) {
    return;
  }

  if (!auth) {
    formError.value = "Authentication is not available. Please refresh the page.";
    return;
  }

  formError.value = null;
  isSubmitting.value = true;

  try {
    await auth.signInWithProvider(providerId);
  } catch (error) {
    formError.value =
      error instanceof Error ? error.message : "Unable to continue with SSO.";
  } finally {
    // Provider SSO triggers redirect, but if it fails we release the lock.
    isSubmitting.value = false;
  }
};
</script>

<template>
  <section :class="$style.root">
    <div class="container grid" :class="$style.container">
      <aside :class="$style.panel">
        <span :class="$style.badge">{{ UIElements.auth.portalLabel }}</span>
        <h1 :class="$style.title">
          <VAnimatedTextByLetters :label="UIElements.auth.title" :align="'left'" />
        </h1>
        <p :class="$style.subtitle">{{ UIElements.auth.subtitle }}</p>

        <ul :class="$style.highlights">
          <li v-for="item in highlights" :key="item.title">
            <span :class="$style['highlights__title']">{{ item.title }}</span>
            <span :class="$style['highlights__description']">{{ item.description }}</span>
          </li>
        </ul>

        <p :class="$style.support">
          {{ UIElements.auth.supportNote }}
        </p>
      </aside>

      <div :class="$style.form">
        <form :class="$style['form-card']" @submit="onSubmit" novalidate>
          <p v-if="formError" :class="$style.error" role="alert">
            {{ formError }}
          </p>

          <fieldset :class="$style['field-group']">
            <label :class="$style.label" for="email">{{ UIElements.auth.emailLabel }}</label>
            <input
              v-model="credentials.email"
              autocomplete="email"
              id="email"
              name="email"
              required
              type="email"
              :class="$style.input"
            />
          </fieldset>

          <fieldset :class="$style['field-group']">
            <label :class="$style.label" for="password">
              {{ UIElements.auth.passwordLabel }}
            </label>
            <input
              v-model="credentials.password"
              autocomplete="current-password"
              id="password"
              name="password"
              required
              type="password"
              :class="$style.input"
            />
          </fieldset>

          <div :class="$style['form-meta']">
            <label :class="$style.checkbox">
              <input v-model="credentials.remember" type="checkbox" />
              <span>{{ UIElements.auth.rememberMe }}</span>
            </label>

            <NuxtLink to="/login/reset" :class="$style.link">
              {{ UIElements.auth.forgotPassword }}
            </NuxtLink>
          </div>

          <button
            type="submit"
            :class="$style.submit"
            :disabled="isSubmitting"
            :aria-busy="isSubmitting"
          >
            {{ UIElements.auth.primaryCta }}
          </button>

          <div :class="$style.divider">
            <span></span>
            <span>{{ UIElements.auth.secondaryTitle }}</span>
            <span></span>
          </div>

          <ul :class="$style.providers">
            <li v-for="provider in ssoProviders" :key="provider.id">
              <button
                type="button"
                @click="onProviderLogin(provider.id as AuthProvider)"
                :disabled="isSubmitting"
              >
                {{ provider.label }}
              </button>
            </li>
          </ul>

          <p :class="$style['form-footer']">
            {{ UIElements.auth.createAccountPrompt }}
            <NuxtLink to="/signup" :class="$style.link">
              {{ UIElements.auth.createAccountCta }}
            </NuxtLink>
          </p>
        </form>
      </div>
    </div>
  </section>
</template>

<style module lang="scss">
.root {
  min-height: 100vh;
  padding: calc(var(--height-space) * 0.3) 0;
  background: radial-gradient(
      circle at 20% 20%,
      color-mix(in srgb, var(--foreground-color) 8%, transparent),
      transparent 55%
    ),
    radial-gradient(
      circle at 80% 30%,
      color-mix(in srgb, var(--color-palette-4) 12%, transparent),
      transparent 60%
    );
}

.container {
  row-gap: calc(var(--gutter-size) * 4);
}

.panel {
  grid-column: 3 / 11;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 2 / 10;
  }

  @media screen and (orientation: portrait) {
    grid-column: 1 / -1;
    order: 2;
  }
}

.badge {
  display: inline-flex;
  align-self: flex-start;
  font-family: var(--display-font);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  border-radius: 999px;
  border: 1px solid currentColor;
  padding: 0.25rem 0.85rem;
  font-size: 0.7rem;
}

.title {
  @include section-title;
  transform: none;
  -webkit-text-stroke: 0;
  text-align: left;
}

.subtitle {
  max-width: 32ch;
  font-size: 1.2rem;
  line-height: 1.5;
  opacity: 0.85;
}

.highlights {
  list-style: none;
  display: grid;
  gap: 1.25rem;
  padding: 0;
  margin: 0;

  li {
    background: color-mix(in srgb, var(--foreground-color) 6%, transparent);
    border: 1px solid color-mix(in srgb, var(--foreground-color) 15%, transparent);
    border-radius: 1.25rem;
    padding: 1.15rem 1.4rem;
    backdrop-filter: blur(12px);
  }
}

.highlights__title {
  display: block;
  font-family: var(--display-font);
  text-transform: uppercase;
  font-size: 0.95rem;
}

.highlights__description {
  display: block;
  font-size: 0.95rem;
  opacity: 0.75;
  margin-top: 0.35rem;
  line-height: 1.4;
}

.support {
  font-size: 0.85rem;
  opacity: 0.7;
}

.form {
  grid-column: 13 / 23;
  display: flex;
  justify-content: flex-end;

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 11 / 23;
  }

  @media screen and (orientation: portrait) {
    grid-column: 1 / -1;
    order: 1;
    justify-content: center;
  }
}

.form-card {
  width: min(28rem, 100%);
  background: color-mix(in srgb, var(--background-color) 92%, transparent);
  border: 1px solid color-mix(in srgb, var(--foreground-color) 15%, transparent);
  border-radius: 1.5rem;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-shadow: 0 30px 80px color-mix(in srgb, #000 25%, transparent);
  backdrop-filter: blur(22px);

  @media screen and (orientation: portrait) {
    padding: 2rem;
  }
}

.error {
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 0.9rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 22%, transparent);
  background: color-mix(in srgb, var(--foreground-color) 12%, transparent);
  font-size: 0.85rem;
  line-height: 1.5;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin: 0;
  padding: 0;
  border: 0;
}

.label {
  font-family: var(--display-font);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
}

.input {
  background: color-mix(in srgb, var(--background-color) 95%, transparent);
  border: 1px solid color-mix(in srgb, var(--foreground-color) 22%, transparent);
  border-radius: 0.9rem;
  padding: 0.85rem 1rem;
  color: inherit;
  font: inherit;
  transition: border-color 0.25s ease(out-cubic),
    box-shadow 0.25s ease(out-cubic);

  &:focus-visible {
    outline: none;
    border-color: var(--foreground-color);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--foreground-color) 20%, transparent);
  }
}

.form-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;

  input {
    width: 1rem;
    height: 1rem;
    accent-color: var(--foreground-color);
  }
}

.link {
  color: inherit;
  text-decoration: none;
  position: relative;
  padding-bottom: 0.2rem;

  &:after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    height: 1px;
    width: 100%;
    background: currentColor;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.25s ease(out-cubic);
  }

  &:hover:after,
  &:focus-visible:after {
    transform: scaleX(1);
  }
}

.submit {
  background: var(--foreground-color);
  color: var(--background-color);
  border: 0;
  border-radius: 999px;
  padding: 0.9rem 1.25rem;
  font-family: var(--display-font);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  cursor: pointer;
  transition: transform 0.35s ease(out-cubic),
    box-shadow 0.35s ease(out-cubic);

  &:hover,
  &:focus-visible {
    transform: translate3d(0, -0.2rem, 0);
    box-shadow: 0 18px 40px color-mix(in srgb, var(--foreground-color) 25%, transparent);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.8;
    transform: none;
    box-shadow: none;
  }
}

.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.7;

  span:first-child,
  span:last-child {
    flex: 1;
    height: 1px;
    background: color-mix(in srgb, var(--foreground-color) 20%, transparent);
  }
}

.providers {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;

  button {
    width: 100%;
    background: color-mix(in srgb, var(--foreground-color) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--foreground-color) 16%, transparent);
    border-radius: 999px;
    padding: 0.85rem 1.25rem;
    color: inherit;
    font: inherit;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: border-color 0.25s ease(out-cubic),
      transform 0.25s ease(out-cubic);

    &:hover,
    &:focus-visible {
      border-color: var(--foreground-color);
      transform: translate3d(0, -0.1rem, 0);
    }
  }
}

.form-footer {
  font-size: 0.85rem;
  opacity: 0.8;
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}
</style>
