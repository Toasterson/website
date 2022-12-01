import type { PageServerLoad } from "./$types";
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const all_pages = import.meta.globEager(`./posts/*.svx`);
	const allPosts = Object.entries(all_pages).map(([path, post]) => {
      const postPath = path.slice(2, -4);
      return { path: postPath, ...post.metadata};
  });
	
	const posts = allPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!posts.length) {
      return { status: 404 };
  }
	
  return {posts};
}