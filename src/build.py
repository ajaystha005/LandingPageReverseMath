#!/usr/bin/env python3
"""Builds the static site: src/pages/*.html + src/partials/*.html -> <path>/index.html (committed; GitHub Pages serves them).
Run:  python3 src/build.py          write every page
      python3 src/build.py --check  exit 1 if a committed page differs from what the sources produce
Each page file starts with one line: <!--meta {"path":"/support/","title":"...","desc":"...","nav":"support","og":"/assets/og-image.jpg","jsonld":{...}} -->"""
import json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SITE = "https://www.reversemathpuzzle.com"
PLAY = "https://play.reversemathpuzzle.com/"
APP = "https://apps.apple.com/app/id6746214080"
GPLAY = "https://play.google.com/store/apps/details?id=com.reversemath.puzzle.android"


def read(p):
    with open(os.path.join(ROOT, p), encoding="utf-8") as f:
        return f.read()


def badges(where):
    return (f'<div class="badges">'
            f'<a href="{APP}" target="_blank" rel="noopener" data-store="ios" data-where="{where}"><img src="/assets/badges/app-store-badge-en.svg" alt="Download on the App Store" width="156" height="52"></a>'
            f'<a href="{GPLAY}" target="_blank" rel="noopener" data-store="android" data-where="{where}"><img src="/assets/badges/google-play-badge-en.png" alt="Get it on Google Play" width="199" height="77"></a>'
            f'</div>')


def nav(active):
    items = [("daily", "/#daily", "Daily"), ("battle", "/#battle", "Battles"), ("web", PLAY, "Play in browser"), ("support", "/support/", "Support")]
    li = ""
    for key, href, label in items:
        ext = ' target="_blank" rel="noopener"' if href.startswith("http") else ""
        cur = ' aria-current="page"' if key == active else ""
        li += f'<li><a href="{href}"{ext}{cur}>{label}</a></li>'
    li += '<li><a class="nav-cta" href="/download/"' + (' aria-current="page"' if active == "download" else "") + '>Get the app</a></li>'
    return (f'<header class="nav"><div class="wrap nav-in"><a class="brand" href="/"><img src="/app_icon_1024.png" width="40" height="40" alt="">Reverse Math Puzzle</a>'
            f'<button class="burger" aria-label="Menu" aria-expanded="false" aria-controls="nav-links"><span></span><span></span><span></span></button>'
            f'<ul class="nav-links" id="nav-links">{li}</ul></div></header>')


FOOTER = f'''<footer class="footer"><div class="wrap">
<div class="footer-in"><div><a class="brand" href="/"><img src="/app_icon_1024.png" width="40" height="40" alt="">Reverse Math Puzzle</a>
<p>A daily number puzzle with friend battles, for iPhone and Android.</p></div>
<nav aria-label="Footer"><a href="/download/">Get the app</a><a href="{PLAY}" target="_blank" rel="noopener">Play in browser</a><a href="/support/">Support</a><a href="/privacy-policy/">Privacy policy</a><a href="/tos/">Terms of service</a><a href="/delete-data/">Delete my data</a><a href="#" id="cookie-choices">Cookie choices</a></nav></div>
<small>&copy; <span id="year">2026</span> Reverse Math Puzzle. All rights reserved.</small></div></footer>'''


STICKY = """<div class="sticky-install" id="sticky-install" hidden>
  <span><strong>Reverse Math Puzzle</strong><small>Free · iPhone &amp; Android</small></span>
  <a class="btn btn-ink only-ios-btn" href="{{APP}}" target="_blank" rel="noopener" data-store="ios" data-where="sticky">Get the app</a>
  <a class="btn btn-ink only-android-btn" href="{{GPLAY}}" target="_blank" rel="noopener" data-store="android" data-where="sticky">Get the app</a>
</div>
"""


def render(src):
    m = re.match(r"\s*<!--meta (\{.*?\}) -->\n", src, re.S)
    meta = json.loads(m.group(1)); body = src[m.end():]
    body = body.replace("{{sticky}}", STICKY.replace("{{APP}}", APP).replace("{{GPLAY}}", GPLAY))
    body = body.replace("{{badges:hero}}", badges("hero")).replace("{{badges:battle}}", badges("battle")).replace("{{badges:cta}}", badges("cta")).replace("{{badges:download}}", badges("download"))
    body = body.replace("{{PLAY}}", PLAY).replace("{{APP}}", APP).replace("{{GPLAY}}", GPLAY)
    path = meta["path"]; canon = SITE + (path if path != "/404.html" else "/")
    og = SITE + meta.get("og", "/assets/og-image.jpg")
    title = meta["title"]; desc = meta["desc"]; esc = lambda s: s.replace("&", "&amp;").replace('"', "&quot;")
    ld = ""
    for block in meta.get("jsonld", []):
        ld += f'<script type="application/ld+json">{json.dumps(block, ensure_ascii=False, separators=(",", ":"))}</script>\n'
    robots = '<meta name="robots" content="noindex">\n' if (path == "/404.html" or meta.get("noindex")) else ""
    head = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{esc(desc)}">
{robots}<link rel="canonical" href="{canon}">
<meta name="theme-color" content="#F2A81D">
<link rel="icon" href="/app_icon_1024.png" type="image/png">
<link rel="apple-touch-icon" href="/app_icon_1024.png">
<meta property="og:type" content="website"><meta property="og:site_name" content="Reverse Math Puzzle">
<meta property="og:url" content="{canon}"><meta property="og:title" content="{esc(meta.get("ogtitle", title))}"><meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="{og}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="628"><meta property="og:image:alt" content="Reverse Math Puzzle: fill the blanks, hit the target. Free on iPhone and Android.">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{esc(meta.get("ogtitle", title))}"><meta name="twitter:description" content="{esc(desc)}"><meta name="twitter:image" content="{og}">
<link rel="preload" href="/assets/fonts/nunito-ExtraBold.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/nunito-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/site.css?v=2">
<script>document.documentElement.classList.add("js")</script>
<script src="/assets/js/analytics.js?v=5"></script>
{ld}</head>
<body>
<a class="skip" href="#main">Skip to content</a>
{nav(meta.get("nav", ""))}
<main id="main">
'''
    tail = f'''
</main>
{FOOTER}
<script src="/assets/js/site.js?v=5" defer></script>
</body>
</html>
'''
    return path, head + body.strip() + "\n" + tail


def out_path(path):
    return os.path.join(ROOT, "404.html" if path == "/404.html" else path.strip("/") + "/index.html" if path != "/" else "index.html")


def main():
    check = "--check" in sys.argv; bad = []
    for f in sorted(os.listdir(os.path.join(ROOT, "src/pages"))):
        path, html = render(read("src/pages/" + f)); op = out_path(path)
        if check:
            cur = open(op, encoding="utf-8").read() if os.path.exists(op) else None
            if cur != html: bad.append(op)
        else:
            os.makedirs(os.path.dirname(op), exist_ok=True)
            with open(op, "w", encoding="utf-8") as fh: fh.write(html)
            print("wrote", os.path.relpath(op, ROOT))
    if check:
        if bad: print("OUT OF DATE (run python3 src/build.py):", *bad, sep="\n  "); sys.exit(1)
        print("build is up to date")


if __name__ == "__main__":
    main()
