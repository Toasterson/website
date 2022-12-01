<script lang="ts">
	import type { PageServerData } from './$types';

	export let data: PageServerData;

	const date_format_options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
</script>

<ol class="border-l border-gray-100">
	{#each data.posts as { title, summary, path, date }}
		<li>
			<div class="flex flex-start items-center pt-3">
				<div class="bg-gray-100 w-2 h-2 rounded-full -ml-1 mr-3" />
				<p class="text-gray-100 text-sm">
					{new Date(date).toLocaleDateString('en-US', date_format_options)}
				</p>
			</div>
			<a href="/blog/{path}">
				<div class="mt-0.5 ml-4 mb-6">
					<h4 class="text-gray-300 font-semibold text-xl mb-1.5">{title}</h4>
					<p class="text-gray-300 mb-3">{summary}</p>
				</div>
			</a>
		</li>
	{/each}
</ol>
