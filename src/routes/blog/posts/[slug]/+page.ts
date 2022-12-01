import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const post = await import(`../${params.slug}.svx`);
  return {
    meta: post.metadata,
    post
  };
}