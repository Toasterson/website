import { mdsvex } from 'mdsvex';
import mdsvexConfig from './mdsvex.config.js';
import adapter from 'svelte-adapter-deno';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', ...mdsvexConfig.extensions],

	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [preprocess({
		postcss: true
	}), mdsvex(mdsvexConfig)],

	kit: {
		adapter: adapter({
			out: 'build'
		})
	}
};

export default config;
