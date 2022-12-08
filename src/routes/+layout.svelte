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
	<div class="text-3xl md:text-lg">
		{#each nav_pages as nav_page}
			<a class="mx-3" href={nav_page.href}>{nav_page.name}</a>
		{/each}
	</div>
	<div class="mx-auto text-4xl">Toastys Website</div>
	<div />
</div>

<div class="border boder-solid lg:max-w-4xl border-color-white container mx-auto flex justify-between px-4 mt-20">
	<slot />
</div>
