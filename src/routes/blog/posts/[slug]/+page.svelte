<script lang="ts">
  import { page } from '$app/stores';
 
</script>

<svelte:head>
  <title>{$page.data.meta.title}</title>
</svelte:head>

<svelte:component this={$page.data.post.default} />