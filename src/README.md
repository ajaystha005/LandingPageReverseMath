# Marketing site source

Static site for https://www.reversemathpuzzle.com (GitHub Pages serves the repo root; the pages in the root are generated and committed).

- `src/pages/*.html` page bodies (first line is a `<!--meta {...} -->` JSON: path, title, description, nav key, JSON-LD).
- `src/build.py` adds the head, nav and footer and writes `<path>/index.html`. Run `python3 src/build.py`.
- `assets/css/site.css`, `assets/js/site.js` the only stylesheet and script. Fonts are self-hosted (Nunito, OFL), so the site calls no third party.
- Legal pages (`tos`, `privacy-policy`, `delete-data`): edit the text in `src/pages/`; never reflow it by script.

## Release checklist (every change, however small)

1. `python3 src/build.py`
2. `python3 scripts/check_site.py --shots /tmp/site-shots` must say PASS (build is current, no horizontal scroll at 360/390/768/1280/1920, no stretched images, no console errors, links and anchors resolve, one h1, titles and descriptions present). Then LOOK at the screenshots.
3. Push `main`. Wait about a minute, then `python3 scripts/check_site.py --live --external`.
4. QA runs the same two commands on the live site plus the manual pass (real Safari and Chrome, phone) and reports before anyone calls it done.

Images: always give `<img>` its natural `width` and `height` attributes; the stylesheet sets `height:auto`, so they never stretch.
