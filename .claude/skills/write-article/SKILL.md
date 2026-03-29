---
name: write-article
description: This skill should be used when the user asks to "write a blog post", "draft an article", "create a new post", "write a devlog", "write about [topic]", "draft a deep-dive on", "write an opinion piece", or otherwise requests blog content for the website.
---

# Write Article

Generate blog article drafts that match Toasty's authentic writing voice for the blog at `wegmueller.it`.

## Workflow

### 1. Determine Parameters

Extract from the user's request:
- **Topic** (required): The subject of the article
- **Category** (optional, default `devlog`): One of `devlog`, `deep-dive`, `opinion`, `announcement`
- **Tags** (optional): Relevant topic tags like `rust`, `illumos`, `kubernetes`

If the topic is unclear, ask the user to clarify before proceeding.

### 2. Load Tone Reference

Read `references/tone-guide.md` for the complete voice and style guide. Key constraints:

- **Voice:** Conversational, direct, opinionated but diplomatic, community-minded
- **Structure:** Context/motivation first, technical content with links, social dimensions, invitation to participate
- **Sign-off:** End with `-- Toasty`
- **Avoid:** Corporate jargon, clickbait, hyper-polished prose, emojis in body text

### 3. Category-Specific Tone

| Category | Tone | Length | Structure |
|----------|------|--------|-----------|
| `devlog` | Casual, stream-of-consciousness, excited | 800-1500 words | Preamble, sectioned updates per project |
| `deep-dive` | Structured, precise, still conversational | 1500-4000+ words | Context paragraph, technical sections with headers, source links |
| `opinion` | Thoughtful, balanced, constructive | 1000-2500 words | What's happening, my perspective, what I'd like to see, invitation |
| `announcement` | Light, brief, positive | 300-800 words | tl;dr up front, explanation, what's next |

### 4. Generate Frontmatter

Produce YAML frontmatter matching the site's format:

```yaml
---
title: "[Article Title]"
type: post
date: YYYY-MM-DD
summary: "[One-line summary for the blog listing]"
tags:
  - tag1
  - tag2
layout: post.njk
---
```

Use today's date. Title should be descriptive, not clickbait.

### 5. Write the Draft

Apply the voice rules from the tone guide:
- Open with personal context or motivation, not a thesis statement
- Use "I" naturally throughout
- Include 2-3+ outbound links to source code, docs, or community resources
- Acknowledge what is unknown or unfinished
- End with an invitation to contribute, discuss, or explore
- Close with `-- Toasty`

### 6. Save the Draft

Write the file to `src/blog/` using a kebab-case filename derived from the title:

```
src/blog/my-article-title.md
```

After writing, inform the user of the file path and offer to revise.

## Reference Files

- **`references/tone-guide.md`** — Complete voice analysis with examples, anti-patterns, and a before/after comparison. Consult this before drafting.

## Existing Blog Posts

For additional voice calibration, read 2-3 existing posts in `src/blog/`:
- `rust-on-illumos.md` — Opinion/commentary example
- `devlog-1.md` — Devlog example
- `one-year-of-streaming.md` — Reflective/announcement example
- `pkgdepend-dependency-resolution.md` — Technical deep-dive example

## Quality Checklist

Before presenting the draft to the user, verify:

- [ ] Opens with personal context, not a thesis statement
- [ ] Uses "I" naturally
- [ ] Contains outbound links (or placeholders marked `[LINK_NEEDED]`)
- [ ] Acknowledges unknowns honestly
- [ ] Ends with invitation + sign-off
- [ ] No corporate jargon or marketing language
- [ ] Frontmatter is complete and valid
- [ ] Tone matches the selected category
- [ ] File saved to `src/blog/`
