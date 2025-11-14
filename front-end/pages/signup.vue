<script setup lang="ts">
import { UIElements } from "~/assets/static-data/ui-elements";

const pageTitle = "Sign up – Zapminds Academy";

definePageMeta({
  layout: "default",
  middleware: ["redirect-if-authenticated"],
});

useSeoMeta({
  title: pageTitle,
  description:
    "Create your Zapminds Academy account to unlock personalized roadmaps, accountability rituals, and live mentor reviews.",
});

type AuthProvider = "google" | "github" | "microsoft";

const router = useRouter();
const auth = process.client ? useStudentAuth() : null;

const formState = reactive({
  name: "",
  email: "",
  password: "",
  track: "python",
  consent: true,
  updates: true,
});

const ssoProviders = [
  { id: "google", label: UIElements.auth.ssoProviders.google },
  { id: "github", label: UIElements.auth.ssoProviders.github },
  { id: "microsoft", label: UIElements.auth.ssoProviders.microsoft },
];

const cohortTracks = [
  { id: "python", label: "Python Foundations" },
  { id: "ml-systems", label: "Machine Learning Systems" },
  { id: "llm-engineering", label: "LLM Engineering" },
];

const rituals = [
  {
    title: "Accountability pods",
    description: "Weekly stand-ups with 4 peers to keep momentum high.",
  },
  {
    title: "Capsule projects",
    description: "Ship portfolio-ready builds for every milestone.",
  },
  {
    title: "Mentor hotlines",
    description: "Office hours & async reviews when you're blocked.",
  },
];

const formError = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const isSubmitting = ref(false);

const onSubmit = async (event: Event) => {
  event.preventDefault();
  if (isSubmitting.value) {
    return;
  }

  if (!formState.consent) {
    formError.value = "Please acknowledge the Honor Code to continue.";
    return;
  }

  if (!auth) {
    formError.value = "Authentication is not available. Please refresh the page.";
    return;
  }

  formError.value = null;
  successMessage.value = null;
  isSubmitting.value = true;

  try {
    const { session } = await auth.signUpWithPassword({
      email: formState.email,
      password: formState.password,
      name: formState.name,
      metadata: {
        preferred_track: formState.track,
        marketing_opt_in: formState.updates,
      },
    });

    if (session) {
      await router.push("/dashboard");
      return;
    }

    successMessage.value =
      "Check your inbox to confirm your account. You can log in after verifying your email.";
  } catch (error) {
    formError.value =
      error instanceof Error ? error.message : "Unable to create your account.";
  } finally {
    isSubmitting.value = false;
  }
};

const onProviderSignup = async (providerId: AuthProvider) => {
  if (isSubmitting.value) {
    return;
  }

  if (!auth) {
    formError.value = "Authentication is not available. Please refresh the page.";
    return;
  }

  formError.value = null;
  successMessage.value = null;
  isSubmitting.value = true;

  try {
    await auth.signInWithProvider(providerId);
  } catch (error) {
    formError.value =
      error instanceof Error
        ? error.message
        : "Unable to continue with that provider.";
    isSubmitting.value = false;
  }
};
</script>

<template>
  <section :class="$style.root">
    <div class="container grid" :class="$style.container">
      <aside :class="$style.panel">
        <span :class="$style.badge">Launch cohort</span>
        <h1 :class="$style.title">
          <VAnimatedTextByLetters label="Start building" :align="'left'" />
        </h1>
        <p :class="$style.subtitle">
          Join a learning pod, get weekly mentor reviews, and ship career-grade projects with Zapminds Academy.
        </p>

        <ul :class="$style.highlights">
          <li v-for="ritual in rituals" :key="ritual.title">
            <span :class="$style['highlights__title']">{{ ritual.title }}</span>
            <span :class="$style['highlights__description']">{{ ritual.description }}</span>
          </li>
        </ul>

        <p :class="$style.support">
          Already enrolled? <NuxtLink to="/login" :class="$style.link">Log in</NuxtLink>
        </p>
      </aside>

      <div :class="$style.form">
        <form :class="$style['form-card']" @submit="onSubmit" novalidate>
          <p v-if="formError" :class="$style.error" role="alert">
            {{ formError }}
          </p>
          <p v-else-if="successMessage" :class="$style.success" role="status">
            {{ successMessage }}
          </p>

          <fieldset :class="$style['field-group']">
            <label :class="$style.label" for="full-name">Full name</label>
            <input
              v-model="formState.name"
              autocomplete="name"
              id="full-name"
              name="full-name"
              required
              type="text"
              :class="$style.input"
              placeholder="Ada Lovelace"
            />
          </fieldset>

          <fieldset :class="$style['field-group']">
            <label :class="$style.label" for="signup-email">Email address</label>
            <input
              v-model="formState.email"
              autocomplete="email"
              id="signup-email"
              name="email"
              required
              type="email"
              :class="$style.input"
              placeholder="you@zapminds.academy"
            />
          </fieldset>

          <fieldset :class="$style['field-group']">
            <label :class="$style.label" for="signup-password">Password</label>
            <input
              v-model="formState.password"
              autocomplete="new-password"
              id="signup-password"
              name="password"
              required
              type="password"
              minlength="8"
              :class="$style.input"
              placeholder="Create a secure password"
            />
            <small :class="$style.help">Use 8+ characters with a mix of letters, numbers & symbols.</small>
          </fieldset>

          <fieldset :class="$style['field-group']">
            <label :class="$style.label" for="track">Choose your launch track</label>
            <select
              v-model="formState.track"
              id="track"
              name="track"
              required
              :class="[$style.input, $style.select]"
            >
              <option v-for="track in cohortTracks" :key="track.id" :value="track.id">
                {{ track.label }}
              </option>
            </select>
          </fieldset>

          <div :class="$style['form-meta']">
            <label :class="$style.checkbox">
              <input v-model="formState.consent" type="checkbox" required />
              <span>I agree to the Honor Code & community guidelines.</span>
            </label>

            <label :class="$style.checkbox">
              <input v-model="formState.updates" type="checkbox" />
              <span>Send me cohort reminders & progress tips.</span>
            </label>
          </div>

          <button
            type="submit"
            :class="$style.submit"
            :disabled="isSubmitting"
            :aria-busy="isSubmitting"
          >
            Create free account
          </button>

          <div :class="$style.divider">
            <span></span>
            <span>or jump in with</span>
            <span></span>
          </div>

          <ul :class="$style.providers">
            <li v-for="provider in ssoProviders" :key="provider.id">
              <button
                type="button"
                @click="onProviderSignup(provider.id as AuthProvider)"
                :disabled="isSubmitting"
              >
                {{ provider.label }}
              </button>
            </li>
          </ul>
        </form>
      </div>
    </div>
  </section>
</template>

<style module lang="scss">
@use "sass:math";

.root {
  min-height: 100vh;
  padding: calc(var(--height-space) * 0.3) 0;
  background: radial-gradient(
      circle at 15% 20%,
      color-mix(in srgb, var(--color-palette-3) 12%, transparent),
      transparent 55%
    ),
    radial-gradient(
      circle at 80% 15%,
      color-mix(in srgb, var(--color-palette-2) 18%, transparent),
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
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--background-color) 35%, transparent);
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.title {
  margin: 0;
  font-size: clamp(3.25rem, 12vw, 4.75rem);
}

.subtitle {
  margin: 0;
  max-width: 36ch;
  font-size: 1.05rem;
  line-height: 1.6;
  opacity: 0.85;
}

.highlights {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1rem;

  li {
    padding: 1.25rem;
    border-radius: 1.5rem;
    background: color-mix(in srgb, var(--background-color) 60%, transparent);
    display: grid;
    gap: 0.35rem;
    border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
  }

  &__title {
    font-family: var(--display-font);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  &__description {
    opacity: 0.75;
    font-size: 0.95rem;
    line-height: 1.5;
  }
}

.support {
  margin-top: auto;
  font-size: 0.95rem;
  opacity: 0.85;
}

.link {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 0.25rem;
}

.form {
  grid-column: 14 / 23;

  @media screen and (max-aspect-ratio: 12 / 8) {
    grid-column: 12 / 23;
  }

  @media screen and (orientation: portrait) {
    grid-column: 1 / -1;
    order: 1;
  }
}

.form-card {
  display: grid;
  gap: 1.25rem;
  padding: clamp(1.5rem, 4vw, 2.25rem);
  border-radius: 1.75rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 12%, transparent);
  background: color-mix(in srgb, var(--background-color) 90%, transparent);
  box-shadow: 0 30px 120px color-mix(in srgb, #000 35%, transparent);
}

.error,
.success {
  margin: 0;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  font-size: 0.9rem;
  line-height: 1.5;
}

.error {
  border: 1px solid color-mix(in srgb, var(--foreground-color) 25%, transparent);
  background: color-mix(in srgb, var(--foreground-color) 12%, transparent);
}

.success {
  border: 1px solid color-mix(in srgb, var(--color-palette-3) 30%, transparent);
  background: color-mix(in srgb, var(--color-palette-3) 18%, transparent);
}

.field-group {
  display: grid;
  gap: 0.45rem;
  margin: 0;
  padding: 0;
  border: 0;
}

.label {
  font-family: var(--display-font);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.input {
  width: 100%;
  border-radius: 0.95rem;
  border: 1px solid color-mix(in srgb, var(--foreground-color) 20%, transparent);
  padding: 0.95rem 1.1rem;
  background: color-mix(in srgb, var(--background-color) 92%, transparent);
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

.select {
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, currentColor 50%),
    linear-gradient(135deg, currentColor 50%, transparent 50%);
  background-position: calc(100% - 18px) calc(50% - 2px),
    calc(100% - 12px) calc(50% - 2px);
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
}

.help {
  font-size: 0.75rem;
  opacity: 0.6;
}

.form-meta {
  display: grid;
  gap: 0.65rem;
  margin: 0.25rem 0 0.5rem;
}

.checkbox {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.85rem;
  line-height: 1.4;

  input {
    margin-top: 0.2rem;
    accent-color: var(--foreground-color);
  }
}

.submit {
  width: 100%;
  border: none;
  border-radius: 999px;
  padding: 0.9rem 1rem;
  font-family: var(--display-font);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  background: var(--foreground-color);
  color: var(--background-color);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover,
  &:focus-visible {
    transform: translateY(-1px);
    box-shadow: 0 15px 40px color-mix(in srgb, #000 35%, transparent);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.8;
    transform: none;
    box-shadow: none;
  }
}

.divider {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.75rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  opacity: 0.75;

  span:first-child,
  span:last-child {
    height: 1px;
    background: color-mix(in srgb, var(--foreground-color) 15%, transparent);
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
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--foreground-color) 20%, transparent);
    padding: 0.85rem 1rem;
    background: transparent;
    color: inherit;
    font-family: var(--display-font);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    cursor: pointer;
    transition: border-color 0.25s ease, transform 0.25s ease;

    &:hover,
    &:focus-visible {
      border-color: var(--foreground-color);
      transform: translateY(-2px);
    }
  }
}
</style>
