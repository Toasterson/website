<script lang="ts">
	import '../app.css';
	
	type Nav = {
		name: string,
		href: string
	}
	
	let nav_pages: Nav[] = [
		{name: "Homepage", href: "/"},
		{name: "About", href: "/about"},
		{name: "Blog", href: "/blog"}
	]
</script>

<div class="navbar bg-base-100">
	<div class="navbar-start">
		<ul class="flex flex-row">
			{#each nav_pages as nav_page}
				<li class="mx-2.5"><a href={nav_page.href}>{nav_page.name}</a></li>
			{/each}		
		</ul>
	</div>
	<div class="navbar-center">
		<a href="/" class="btn btn-ghost normal-case text-xl">Toastys Website</a>
	</div>
	<div class="navbar-end" />
</div>
<div class="flex justify-center mt-20">
	<div class="sm:max-w-lg md:max-w-xl lg:max-w-7xl">
		<slot />
	</div>
</div>
