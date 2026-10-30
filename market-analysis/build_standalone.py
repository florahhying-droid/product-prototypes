"""Build one offline HTML from the editable prototype; Python standard library only."""
from pathlib import Path
import base64
import json
import re

root = Path(__file__).resolve().parent
assets = {}
for path in (root / 'assets').iterdir():
    mime = {'.png':'image/png', '.svg':'image/svg+xml'}.get(path.suffix.lower(), 'image/jpeg')
    assets[path.name] = f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode('ascii')

html = (root / 'index.html').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="market.css">', '<style>' + (root / 'market.css').read_text(encoding='utf-8') + '</style>')
html = html.replace('<link rel="stylesheet" href="layout.css">', '<style>' + (root / 'layout.css').read_text(encoding='utf-8') + '</style>')
for filename in ['report-data.js', 'market.js', 'layout.js']:
    html = html.replace(f'<script src="{filename}"></script>', '<script>' + (root / filename).read_text(encoding='utf-8') + '</script>')

# Store short stable asset references in localStorage. Hydrate images from the
# embedded map whenever rendering adds an image, including pasted source HTML.
inline_script = '''
window.INLINE_ASSETS = ASSET_MAP;
new MutationObserver(records => {
  function hydrate(img) {
    const raw = img.getAttribute('src') || '';
    if (raw.startsWith('assets/')) {
      const name = raw.slice(7);
      if (window.INLINE_ASSETS[name]) img.src = window.INLINE_ASSETS[name];
    }
  }
  records.forEach(r => {
    if (r.type === 'attributes') hydrate(r.target);
    r.addedNodes.forEach(n => {
      if (n.nodeType === 1) {
        if (n.tagName === 'IMG') hydrate(n);
        n.querySelectorAll('img').forEach(hydrate);
      }
    });
  });
}).observe(document.documentElement, {childList:true, subtree:true, attributes:true, attributeFilter:['src']});
'''.replace('ASSET_MAP', json.dumps(assets, ensure_ascii=False))
html = html.replace('<head>', '<head><script>' + inline_script + '</script>', 1)
html = html.replace('asset=n=>/^(data:|blob:|https?:)/.test(n)?n:`assets/${n}`', 'asset=n=>window.INLINE_ASSETS[n]||(/^(data:|blob:|https?:)/.test(n)?n:`assets/${n}`)')

# Retain compact original image paths when a rich editor is saved.
html = html.replace("m.dims[+a[1]]=el.innerHTML", "m.dims[+a[1]]=compactRich(el)")
html = html.replace("el.classList.contains('editor')?el.innerHTML:el.value", "el.classList.contains('editor')?compactRich(el):el.value")
html = html.replace("const hasText=html=>", "function compactRich(el){const copy=el.cloneNode(true);copy.querySelectorAll('img').forEach(img=>{const src=img.getAttribute('src');for(const [name,data] of Object.entries(window.INLINE_ASSETS)){if(src===data){img.setAttribute('src','assets/'+name);break;}}});return copy.innerHTML;}\nconst hasText=html=>")
target = root / '市场分析报告交互原型.html'
target.write_text(html, encoding='utf-8')
print(f'Created {target.name} ({target.stat().st_size:,} bytes)')
