import lume from "lume/mod.ts";
import tailwindcss from "lume/plugins/tailwindcss.ts";
import postcss from "lume/plugins/postcss.ts";
import date from "lume/plugins/date.ts";
import readingInfo from "lume/plugins/reading_info.ts";
import metas from "lume/plugins/metas.ts";
import sitemap from "lume/plugins/sitemap.ts";
import feed from "lume/plugins/feed.ts";
import nunjucks from "lume/plugins/nunjucks.ts";
import markdown from "lume/plugins/markdown.ts";

const site = lume({
  src: "./src",
  dest: "./_site",
  location: new URL("https://wegmueller.it/"),
});

// Configure Markdown to auto-link citation numbers and add anchors to references
site.use(markdown({
  plugins: [
    (md) => {
      // Add ids to ordered list items inside a "Works cited" or "References" section
      md.core.ruler.after("block", "ref_ids", (state) => {
        const tokens = state.tokens;
        let inWorks = false;
        let inOrdered = false;
        let refNum = 1;
        for (let i = 0; i < tokens.length; i++) {
          const t = tokens[i];
          if (t.type === "heading_open") {
            const inline = tokens[i + 1];
            if (inline && inline.type === "inline") {
              const text = inline.content.toLowerCase();
              inWorks = /(^|\b)(works cited|references)(\b|$)/i.test(text);
            }
          } else if (t.type === "ordered_list_open") {
            inOrdered = inWorks;
            // Read start attribute if present
            const startAttr = t.attrGet && t.attrGet("start");
            refNum = startAttr ? parseInt(startAttr) || 1 : 1;
          } else if (t.type === "ordered_list_close") {
            inOrdered = false;
          } else if (inOrdered && t.type === "list_item_open") {
            if (t.attrSet) {
              t.attrSet("id", `ref-${refNum}`);
            } else {
              // Fallback for older markdown-it versions
              // @ts-ignore
              t.attrs = [["id", `ref-${refNum}`]];
            }
            refNum++;
          }
        }
      });

      // Replace trailing .<number> patterns with superscript links to #ref-<number>
      md.core.ruler.after("inline", "link_citations", (state) => {
        const tokens = state.tokens;
        for (let i = 0; i < tokens.length; i++) {
          const t = tokens[i];
          if (t.type !== "inline" || !t.children) continue;
          for (const child of t.children) {
            if (child.type !== "text") continue;
            // Avoid transforming inside code/links handled by other token types
            const replaced = child.content.replace(/(^|[^0-9])\.(\d{1,3})(?=\s|$)/g, (_m, pre, n) => `${pre}.<sup><a href="#ref-${n}">${n}</a></sup>`);
            if (replaced !== child.content) {
              child.type = "html_inline";
              child.content = replaced;
            }
          }
        }
      });
    },
  ],
}));

site.use(nunjucks());
site.use(tailwindcss({
  extensions: [".html", ".njk", ".md"],
}));
site.use(postcss());
site.use(date());
site.use(readingInfo());
site.use(metas());
site.use(sitemap());
site.use(feed({
  output: "/feed.xml",
  query: "type=post",
  info: {
    title: "Toasty's Technical Posts",
    description: "Unix systems engineering, Rust development, and infrastructure insights by Till Wegmüller (@toasterson)",
  },
  items: {
    title: "=title",
    description: "=summary",
    date: "=date",
  },
}));

// Copy static assets
site.copy("favicon.png");
site.copy("js");
site.copy("robots.txt");

export default site;