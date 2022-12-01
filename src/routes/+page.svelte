<script lang="ts">
  import Link from '$lib/components/Link.svelte'
	import { onMount } from 'svelte';

  onMount(() => {
    //@ts-ignore
    new Twitch.Embed("twitch-embed", {
        width: 1280,
        height: 720,
        channel: "Toasterson"
      });
  });
</script>

<svelte:head>
  <title>Toasty's Personal Blog</title>
  <script src="https://embed.twitch.tv/embed/v1.js"></script>
</svelte:head>

<h1 class="text-3xl font-bold underline text-center">
  Welcome to my Website
</h1>

<div class="mt-5 text-center">
  <p>You have found my personal blog on the Internet. Here you can find my blog posts some information about me and some project showcases
  I have been working on. Since this Blog is written in <Link href="https://kit.svelte.dev/" text="SvelteKit"/> I can add as many features here
  as I like and make this space my own. I do my styling with <Link href="https://tailwindcss.com/" text="TailwindCSS" /> so expect me to get
  some better styling eventually. Suggestions welcome :)</p>
  <p></p>
</div>

<div class="mt-10" id="twitch-embed"></div>