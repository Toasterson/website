# Toasty's Personal Website

This is the personal website and blog of Till Wegmüller (@toasterson), built with [Lume](https://lume.land/) - a static site generator for Deno.
 
## Features

- Static site generation with Lume
- Tailwind CSS for styling
- Blog with markdown posts
- RSS feed generation
- Responsive design
- Fast and lightweight

## Development

### Prerequisites

- [Deno](https://deno.land/) installed

### Getting Started

1. Clone the repository
2. Navigate to the `lume-site` directory
3. Start the development server:

```bash
deno task serve
```

The site will be available at `http://localhost:3000`

### Building

To build the site for production:

```bash
deno task build
```

The built site will be in the `_site` directory.

### Adding Blog Posts

Create a new markdown file in `src/blog/` with the following frontmatter:

```yaml
---
title: "Your Post Title"
type: post
date: 2024-01-01
summary: "Brief description of your post"
layout: post.njk
---
```

## Technology Stack

- **Static Site Generator**: Lume
- **Runtime**: Deno
- **Styling**: Tailwind CSS
- **Templating**: Nunjucks
- **Content**: Markdown

## Previous Version

This site was previously built with SvelteKit. The migration to Lume provides better performance, simpler deployment, and easier content management while maintaining all the original functionality.