<script lang="ts">
  import { authClient } from "$lib/stores/auth.store";
  import * as v from "valibot";
  import { SignInSchema, SignUpSchema } from "@shared/schemas";

  interface Props {
    onSuccess: () => void;
  }
  let { onSuccess }: Props = $props();

  let mode = $state<"signin" | "signup">("signin");
  let email = $state("");
  let password = $state("");
  let name = $state("");
  let errors = $state<Record<string, string>>({});
  let submitting = $state(false);
  let serverError = $state("");

  function validate(): boolean {
    const schema = mode === "signup" ? SignUpSchema : SignInSchema;
    const input = mode === "signup" ? { email, password, name } : { email, password };
    const result = v.safeParse(schema, input);
    if (!result.success) {
      errors = Object.fromEntries(
        result.issues.map(i => [String(i.path?.[0]?.key ?? "form"), i.message])
      );
      return false;
    }
    errors = {};
    return true;
  }

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    if (!validate()) return;
    submitting = true;
    serverError = "";
    try {
      if (mode === "signup") {
        const result = await authClient.signUp.email({ email, password, name });
        if (result.error) throw new Error(result.error.message);
      } else {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) throw new Error(result.error.message);
      }
      onSuccess();
    } catch (err) {
      serverError = err instanceof Error ? err.message : "Something went wrong";
    } finally {
      submitting = false;
    }
  }
</script>

<div class="auth-page">
  <div class="auth-card">
    <div class="auth-header">
      <div class="logo">📝</div>
      <h1>{mode === "signin" ? "Sign in" : "Create account"}</h1>
      <p class="subtitle">Notion Clone — collaborative workspace</p>
    </div>

    <form onsubmit={handleSubmit} novalidate>
      {#if mode === "signup"}
        <div class="field">
          <label for="name">Name</label>
          <input id="name" class="input" type="text" bind:value={name} placeholder="Your name" autocomplete="name" />
          {#if errors.name}<span class="field-error">{errors.name}</span>{/if}
        </div>
      {/if}

      <div class="field">
        <label for="email">Email</label>
        <input id="email" class="input" type="email" bind:value={email} placeholder="you@example.com" autocomplete="email" />
        {#if errors.email}<span class="field-error">{errors.email}</span>{/if}
      </div>

      <div class="field">
        <label for="password">Password</label>
        <input id="password" class="input" type="password" bind:value={password} placeholder="••••••••" autocomplete={mode === "signup" ? "new-password" : "current-password"} />
        {#if errors.password}<span class="field-error">{errors.password}</span>{/if}
      </div>

      {#if serverError}
        <div class="server-error">{serverError}</div>
      {/if}

      <button type="submit" class="btn btn-primary submit-btn" disabled={submitting}>
        {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
      </button>
    </form>

    <div class="auth-footer">
      {#if mode === "signin"}
        <span>Don't have an account?</span>
        <button class="link-btn" onclick={() => { mode = "signup"; errors = {}; serverError = ""; }}>Sign up</button>
      {:else}
        <span>Already have an account?</span>
        <button class="link-btn" onclick={() => { mode = "signin"; errors = {}; serverError = ""; }}>Sign in</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface);
    padding: 16px;
  }

  .auth-card {
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 40px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 4px 24px rgba(0 0 0 / 0.08);
  }

  .auth-header {
    text-align: center;
    margin-bottom: 28px;
  }

  .logo {
    font-size: 2.5rem;
    margin-bottom: 12px;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 6px;
  }

  .subtitle {
    color: var(--color-text-muted);
    font-size: 13px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  label {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text);
  }

  .field-error {
    font-size: 12px;
    color: var(--color-danger);
  }

  .server-error {
    background: #fff0f0;
    border: 1px solid #fcc;
    border-radius: var(--radius);
    padding: 10px 12px;
    font-size: 13px;
    color: var(--color-danger);
    margin-bottom: 16px;
  }

  .submit-btn {
    width: 100%;
    justify-content: center;
    padding: 10px;
    font-size: 14px;
    margin-top: 4px;
  }

  .auth-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 20px;
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .link-btn {
    background: none;
    border: none;
    color: var(--color-accent);
    cursor: pointer;
    font-size: 13px;
    padding: 0;
    text-decoration: underline;
  }
</style>
