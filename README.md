# ReformedTech Website

This is the website project for ReformedTech.ca.

Main folders:
- assets = images, logos, icons
- css = design files
- js = scripts
- components = reusable sections
- blog = blog pages
- seo = SEO notes and schema notes
- .vscode = VS Code project settings

Main pages:
- index.html
- about.html
- services.html
- contact.html

## Cache busting
Stylesheet links carry a version query (e.g. `css/style.css?v=20261015`) so
browsers fetch fresh CSS after a deploy. When you change any file in `css/`,
bump the version on every page in one go:

    sed -i -E 's/\.css\?v=[0-9]+/.css?v=YYYYMMDD/g' $(git ls-files '*.html')
