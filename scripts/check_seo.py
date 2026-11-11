#!/usr/bin/env python3
"""Static checks for the SEO pages (no browser needed): titles and descriptions, canonicals, JSON-LD, sitemap, headings, brand and banned words.
  python3 scripts/check_seo.py      exit 1 on any failure"""
import datetime, json, os, re, sys, html
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SITE = "https://www.reversemathpuzzle.com"
PAGES = ["/", "/how-to-play/", "/daily-math-puzzle/", "/math-puzzle-game/", "/brain-teasers/", "/survival-mode/", "/live-arena/", "/faq/", "/download/", "/support/", "/tos/", "/privacy-policy/", "/delete-data/"]
NEW = PAGES[1:8]
LEGAL = {"/tos/", "/privacy-policy/", "/delete-data/"}
fails = []
def fail(m): fails.append(m); print("  FAIL", m)
def page(p): return open(os.path.join(ROOT, "index.html" if p == "/" else p.strip("/") + "/index.html"), encoding="utf-8").read()
titles = {}
for p in PAGES + ["/404.html"]:
    h = open(os.path.join(ROOT, "404.html"), encoding="utf-8").read() if p == "/404.html" else page(p)
    t = html.unescape(re.search(r"<title>(.*?)</title>", h, re.S).group(1)); d = html.unescape(re.search(r'<meta name="description" content="(.*?)">', h).group(1))
    if len(t) > 60: fail(f"{p}: title {len(t)} chars")
    if not (40 if p == "/404.html" else 50) <= len(d) <= 155: fail(f"{p}: description {len(d)} chars")
    if t in titles: fail(f"{p}: same title as {titles[t]}")
    titles[t] = p
    canon = re.findall(r'<link rel="canonical" href="(.*?)">', h)
    if p == "/404.html":
        if canon: fail("404 has a canonical")
        continue
    if canon != [SITE + p]: fail(f"{p}: canonical {canon}")
    if h.count("<h1") != 1: fail(f"{p}: {h.count('<h1')} h1")
    for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S):
        try: json.loads(b)
        except Exception as e: fail(f"{p}: JSON-LD does not parse: {e}")
    # the how-to-play title and the Open Graph copies of it keep the capitalised phrase on purpose (seo-plan-v2, v2 decision 1)
    if "Reverse Math Puzzle" in re.sub(r"<title>.*?</title>|<meta property=\"og:title\"[^>]*>|<meta name=\"twitter:title\"[^>]*>", "", h, flags=re.S) and p not in LEGAL: fail(f"{p}: old brand spelling in the page")
    if p != "/how-to-play/" and re.search(r"<title>[^<]*Reverse Math", h): fail(f"{p}: old brand spelling in the title")
    if "&copy; <span id=\"year\">2026</span> ReverseMath." not in h: fail(f"{p}: footer copyright")
    body = re.sub(r"<script.*?</script>|<[^>]+>", " ", h.split("<main", 1)[1].split("</main>")[0], flags=re.S).lower()
    if p in NEW + ["/", "/download/"]:
        for w in (r"\bcoins?\b", r"\bads?\b", r"\badvert", r"purchas", r"rematch", r"\bin-app\b"):
            if re.search(w, body): fail(f"{p}: banned word {w}")
        words = len(body.split())
        if p in NEW and not 150 <= words <= 520: fail(f"{p}: {words} words")
    # every internal link resolves
    for href in set(re.findall(r'href="(/[^"#?]*)', h)):
        if href in ("/",): continue
        if not (os.path.exists(os.path.join(ROOT, href.strip("/"), "index.html")) or os.path.exists(os.path.join(ROOT, href.strip("/")))): fail(f"{p}: broken link {href}")
    for src in set(re.findall(r'src="(/[^"]+)"', h)):
        if not os.path.exists(os.path.join(ROOT, src.split("?")[0].lstrip("/"))): fail(f"{p}: missing file {src}")
    for img in re.findall(r"<img [^>]*>", h):
        if 'alt="' not in img: fail(f"{p}: image without alt: {img[:60]}")
# the FAQ JSON-LD questions equal the visible questions
for p in ("/faq/", "/support/"):
    h = page(p)
    qs = [q["name"] for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S) for q in json.loads(b).get("mainEntity", [])]
    visible = [html.unescape(re.sub(r"<[^>]+>", "", x)) for x in re.findall(r"<h3>(.*?)</h3>|<summary>(.*?)</summary>", h) for x in x if x]
    for q in qs:
        if q not in visible: fail(f"{p}: FAQ JSON-LD question not on the page: {q}")
# sitemap
sm = open(os.path.join(ROOT, "sitemap.xml"), encoding="utf-8").read()
urls = re.findall(r"<url><loc>(.*?)</loc><lastmod>(.*?)</lastmod></url>", sm)
if [u for u, _ in urls if u.replace(SITE, "") not in PAGES] or len(urls) != 13: fail(f"sitemap: {len(urls)} URLs")
for u, lm in urls:
    try: datetime.datetime.strptime(lm, "%Y-%m-%d")
    except ValueError: fail(f"sitemap: bad lastmod {lm} for {u}")
    if not u.endswith("/"): fail(f"sitemap: no trailing slash {u}")
print("RESULT:", "OK" if not fails else f"{len(fails)} FAILURE(S)")
sys.exit(1 if fails else 0)
