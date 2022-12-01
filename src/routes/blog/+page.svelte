<script lang="ts">
	import type { PageServerData } from './$types';

  export let data: PageServerData;

</script>

<div>
	{#each data.posts as {title, summary, path}}
			<a href="/blog/{path}">
			<div class="card min-w-full my-10">
			  <div class="card-body">
			    <h2 class="card-title">{title}</h2>
			    <p>{summary}</p>
			    <div class="card-actions justify-end">Read more...</div>
			  </div>
			</div>
		</a>
	{/each}
</div>
