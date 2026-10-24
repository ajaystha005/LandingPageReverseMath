#!/usr/bin/env python3
"""Validate the marketing site before every release (and for QA after it).
  python3 scripts/check_site.py                local files, served on a temp port
  python3 scripts/check_site.py --live         https://www.reversemathpuzzle.com
  python3 scripts/check_site.py --shots DIR    also save a full-page screenshot per page and width
  python3 scripts/check_site.py --external     also HEAD-check external links
Needs: playwright (+ Chrome). Exit code 1 if anything fails. Checks, per page and per width (360, 390, 768, 1280, 1920):
no horizontal scroll, every image keeps its natural aspect ratio (layout size, not the rotated box), images have alt + width/height,
no console errors / failed requests / HTTP >= 400, exactly one h1, title and description present, internal links and #anchors resolve,
build output matches src/ (python3 src/build.py --check)."""
import argparse, http.server, os, re, socketserver, subprocess, sys, threading, urllib.request, urllib.parse
from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
WIDTHS = [360, 390, 768, 1280, 1920]
PAGES = ["/", "/download/", "/support/", "/tos/", "/privacy-policy/", "/delete-data/", "/404.html"]
fails = []


def fail(msg): fails.append(msg); print("  FAIL", msg)


def serve():
    class H(http.server.SimpleHTTPRequestHandler):
        def __init__(s, *a, **k): super().__init__(*a, directory=ROOT, **k)
        def log_message(s, *a): pass
        def send_error(s, code, message=None, explain=None):
            if code == 404 and os.path.exists(os.path.join(ROOT, "404.html")) and s.path != "/404.html":
                body = open(os.path.join(ROOT, "404.html"), "rb").read(); s.send_response(404); s.send_header("Content-Type", "text/html"); s.send_header("Content-Length", str(len(body))); s.end_headers(); s.wfile.write(body); return
            super().send_error(code, message, explain)
    srv = socketserver.TCPServer(("127.0.0.1", 0), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}"


JS_IMG = """() => [...document.images].filter(i => i.complete && i.naturalWidth && i.offsetHeight).map(i => ({
  src: i.getAttribute('src'), w: i.offsetWidth, h: i.offsetHeight, nw: i.naturalWidth, nh: i.naturalHeight,
  alt: i.getAttribute('alt'), hasDims: i.hasAttribute('width') && i.hasAttribute('height')}))"""


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--live", action="store_true"); ap.add_argument("--shots"); ap.add_argument("--external", action="store_true")
    a = ap.parse_args(); srv = None
    if a.live: base = "https://www.reversemathpuzzle.com"
    else:
        r = subprocess.run([sys.executable, os.path.join(ROOT, "src/build.py"), "--check"], capture_output=True, text=True); print(r.stdout.strip() or r.stderr.strip())
        if r.returncode: fail("build output is out of date: run python3 src/build.py")
        srv, base = serve()
    if a.shots: os.makedirs(a.shots, exist_ok=True)
    ext_links = set(); seen_ids = {}
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome")
        for path in PAGES:
            print(path)
            for w in WIDTHS:
                pg = b.new_page(viewport={"width": w, "height": 900}); errs = []
                pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
                pg.on("requestfailed", lambda r: errs.append("request failed: " + r.url))
                pg.on("response", lambda r: errs.append(f"HTTP {r.status}: {r.url}") if r.status >= 400 and not (path == "/404.html" and r.url.endswith("/404.html")) else None)
                pg.goto(base + path, wait_until="load")
                pg.evaluate("document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager')"); pg.wait_for_timeout(700)
                pg.add_style_tag(content=".js .reveal{opacity:1!important;transform:none!important;transition:none!important}")
                pg.wait_for_timeout(500)
                for e in errs:
                    if "404.html" in path and "404" in e: continue
                    fail(f"{path} @{w}: {e}")
                sw = pg.evaluate("document.documentElement.scrollWidth")
                if sw > w + 1: fail(f"{path} @{w}: horizontal scroll (page is {sw}px wide)")
                for im in pg.evaluate(JS_IMG):
                    ratio = (im["w"] / im["h"]) / (im["nw"] / im["nh"])
                    if abs(ratio - 1) > 0.02: fail(f"{path} @{w}: image stretched {im['src']} shows {im['w']}x{im['h']}, natural {im['nw']}x{im['nh']}")
                    if w == 1280:
                        if im["alt"] is None: fail(f"{path}: image without alt attribute {im['src']}")
                        if not im["hasDims"]: fail(f"{path}: image without width/height {im['src']}")
                if w == 1280:
                    h1 = pg.evaluate("document.querySelectorAll('h1').length")
                    if h1 != 1: fail(f"{path}: {h1} h1 elements (want 1)")
                    t = pg.title(); d = pg.evaluate("(document.querySelector('meta[name=description]')||{}).content||''")
                    if not t or len(t) > 70: fail(f"{path}: title missing or over 70 chars ({len(t)})")
                    if not d or len(d) > 170: fail(f"{path}: description missing or over 170 chars ({len(d)})")
                    ids = set(pg.evaluate("[...document.querySelectorAll('[id]')].map(e=>e.id)")); seen_ids[path] = ids
                    for href in pg.evaluate("[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))"):
                        if href.startswith(("mailto:", "tel:")): continue
                        if href.startswith("http"):
                            if not href.startswith(base): ext_links.add(href)
                            continue
                        u = urllib.parse.urlparse(href); tp = u.path or path
                        loc = os.path.join(ROOT, tp.strip("/"), "index.html") if tp.endswith("/") or tp == "" else os.path.join(ROOT, tp.strip("/"))
                        if tp == "/": loc = os.path.join(ROOT, "index.html")
                        if not a.live and not os.path.exists(loc): fail(f"{path}: broken internal link {href}")
                if a.shots: pg.screenshot(path=os.path.join(a.shots, f"{path.strip('/').replace('/', '_') or 'home'}_{w}.png"), full_page=True)
                pg.close()
        b.close()
    for path, ids in seen_ids.items(): pass
    if not a.live:  # anchors: every /#x must exist on the home page
        home = seen_ids.get("/", set())
        for f in [os.path.join(ROOT, "src/pages", x) for x in os.listdir(os.path.join(ROOT, "src/pages"))]:
            for m in re.findall(r'href="/#([\w-]+)"', open(f).read()) + re.findall(r'href="/#([\w-]+)"', open(os.path.join(ROOT, "src/build.py")).read()):
                if m not in home: fail(f"anchor /#{m} does not exist on the home page")
    if a.external:
        for u in sorted(ext_links):
            try:
                req = urllib.request.Request(u, method="GET", headers={"User-Agent": "Mozilla/5.0"}); code = urllib.request.urlopen(req, timeout=15).status
            except Exception as e: code = getattr(e, "code", str(e))
            print("  external", code, u)
            if not (isinstance(code, int) and code < 400): fail(f"external link {u} -> {code}")
    else: print("external links (not checked; use --external):", *sorted(ext_links), sep="\n  ")
    print("\nRESULT:", "PASS" if not fails else f"{len(fails)} FAILURE(S)")
    sys.exit(1 if fails else 0)


if __name__ == "__main__": main()
