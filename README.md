# oida.foundation

Website of OIDA, the OpenIndiana and illumos community Development Association.
A static [Astro](https://astro.build) site: no JavaScript is sent to visitors, no
cookies are set, and fonts (IBM Plex) are served from the site itself.

## Work on it

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

Node 22.12 or newer is required.

## Where things are

| What | Where |
| --- | --- |
| Names, addresses, links | `src/config.ts` — change them here only |
| Colours, fonts, spacing | `src/styles/global.css` (tokens at the top) |
| Home page | `src/pages/index.astro` |
| Bylaws | `src/texts/bylaws.md` — the adopted text, word for word |
| Header and footer | `src/layouts/Base.astro` |

The home page fetches the Open Collective balance and the latest Mastodon posts
**at build time**. Without network access the site still builds; those parts are
simply left out. Rebuild the site to refresh them.

`public/.well-known/funding-manifest-urls` lets
[funding.json](https://fundingjson.org) directories confirm that the manifest at
https://www.openindiana.org/funding.json speaks for this domain.

## Before launch

- [ ] Replace the text wordmark and favicon with the new logo.
- [ ] Confirm the contact addresses in `src/config.ts` (under discussion).
- [ ] Decide how `oida.foundation` is served and add the deploy step.

## Contributing

Open an issue or a pull request on
[src.oida.foundation/oida/website](https://src.oida.foundation/oida/website).
Keep member data out of this repository: it is public.

## Licence

[Mozilla Public License 2.0](LICENSE). The IBM Plex fonts are under the SIL Open
Font License 1.1.
