import lume from "lume/mod.ts";
import tailwindcss from "lume/plugins/tailwindcss.ts";
import postcss from "lume/plugins/postcss.ts";
import date from "lume/plugins/date.ts";
import readingInfo from "lume/plugins/reading_info.ts";
import metas from "lume/plugins/metas.ts";
import sitemap from "lume/plugins/sitemap.ts";
import feed from "lume/plugins/feed.ts";
import nunjucks from "lume/plugins/nunjucks.ts";

const site = lume({
  src: "./src",
  dest: "./_site",
  location: new URL("https://wegmueller.it/"),
});

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
    title: "T0@STY'S TERMINAL FEED [ILLUMOS.NODE]",
    description: "Mission logs and technical transmissions from the digital frontier by Till Wegmüller (@toasterson) - Illumos Systems Architect & Space Opera Enthusiast",
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