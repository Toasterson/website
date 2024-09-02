<script lang="ts">
	import '@skeletonlabs/skeleton/styles/all.css';
	import '../theme.postcss'
	import '../app.css';

	type Nav = {
		name: string;
		href: string;
	};

	let nav_pages: Nav[] = [
		{ name: 'Homepage', href: '/' },
		{ name: 'About', href: '/about' },
		{ name: 'Blog', href: '/blog' }
	];
</script>

<div class="mt-5 grid grid-cols-[400px_1fr_400px]">
	<div class="text-lg">
		{#each nav_pages as nav_page}
			<a class="mx-3" href={nav_page.href}>{nav_page.name}</a>
		{/each}
	</div>
	<div class="mx-auto"><h1>Toastys Website</h1></div>
	<div />
</div>

<div class="grid grid-cols-[200px_1fr_200px]">
	<div></div>
	<slot />
	<div></div>
</div>
