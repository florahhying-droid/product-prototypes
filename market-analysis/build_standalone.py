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


# The AI controller is a direct copy, with isolated storage and a scoped extension.
ai_controller = (root / 'market.js').read_text(encoding='utf-8')
ai_controller = ai_controller.replace("const KEY='ac-market-analysis-v1';", "const KEY='ac-market-analysis-ai-v1';")
# Keep local demonstration feedback brief; option dialogs remain synchronous.
ai_controller = ai_controller.replace("setTimeout(resolve,650)", "setTimeout(resolve,120)").replace("setTimeout(resolve,500)", "setTimeout(resolve,0)")
ai_controller = ai_controller.replace('JSON.parse(localStorage.getItem(KEY))', "JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('ac-market-analysis-v1'))")
ai_controller = ai_controller.replace("c.querySelector('textarea')?.value.trim()", "c.querySelector('.category-conclusion')?.value.trim()")
ai_controller = ai_controller.replace("if(i<6&&!dimensionImages[i]?.length)", "if(i<6&&!aiCategoryHasEvidence(i))")
ai_controller = ai_controller.replace("'请上传'+source.dimensions[i].title+'分析图片'", "'请获取'+source.dimensions[i].title+'AI数据或上传截图'")
ai_controller = ai_controller.replace('<p class="subtle op-example-note">利润率为原型演示数据。</p>', '')
ai_controller = ai_controller.replace('利润通过示例', '硅胶旅行分装瓶 · 浅色4件套').replace('利润未通过示例', '硅胶旅行分装瓶 · 深色4件套')
ai_controller = ai_controller.replace("if(key==='newTop'&&!m.rankingImages?.[key])", "if(key==='newTop'&&!aiRankingHasEvidence(key))")
# The AI version no longer includes shared competitor positioning or keyword analysis.
position_start = ai_controller.index('<section class="comp-position ${')
position_end = ai_controller.index('<div class="comp-workspace">', position_start)
ai_controller = ai_controller[:position_start] + ai_controller[position_end:]
ai_controller = ai_controller.replace("+compModule('keywords','关键词及搜索数据',renderCompKeywords(r),r)", '')
keyword_start = ai_controller.index(" if(!r.keywords.length)fields.push")
keyword_end = ai_controller.index(' return fields;', keyword_start)
ai_controller = ai_controller[:keyword_start] + ai_controller[keyword_end:]
completion_start = ai_controller.index('function compCompletion(r){')
completion_end = ai_controller.index('\n', completion_start)
ai_controller = ai_controller[:completion_start] + "function compCompletion(r){const total=11;return `${Math.max(0,total-new Set(compMissing(r).map(e=>e.key)).size)}/${total}`;}" + ai_controller[completion_end:]
ai_controller = re.sub(r"^ compPositionDefinitions\.forEach\(\(\[key,label\]\).*?\n", '', ai_controller, flags=re.M)
report_start = ai_controller.index('<section class="report-position">')
report_end = ai_controller.index('${c.items.length?', report_start)
ai_controller = ai_controller[:report_start] + ai_controller[report_end:]
keyword_report_start = ai_controller.index('<h4>关键词及搜索数据</h4>')
keyword_report_end = ai_controller.index("${reportLongText('核心卖点'", keyword_report_start)
ai_controller = ai_controller[:keyword_report_start] + ai_controller[keyword_report_end:]
# Keep saved historical data intact, but stop synchronizing removed positioning fields.
sync_start = ai_controller.index('function syncCompPositionFromCategory(force=false){')
sync_end = ai_controller.index('async function syncCompPositionWithConfirmation()', sync_start)
ai_controller = ai_controller[:sync_start] + 'function syncCompPositionFromCategory(){return false;}\n' + ai_controller[sync_end:]
cut = ai_controller.rindex('})();')
ai_controller = ai_controller[:cut] + (root / 'ai-assist.js').read_text(encoding='utf-8') + '\n' + (root / 'ai-category-view.js').read_text(encoding='utf-8') + '\n' + (root / 'ai-ranking-view.js').read_text(encoding='utf-8') + '\n' + (root / 'ai-import-view.js').read_text(encoding='utf-8') + '\n' + (root / 'ai-detail-view.js').read_text(encoding='utf-8') + '\n' + ai_controller[cut:]
(root / 'ai-market.js').write_text(ai_controller, encoding='utf-8')
ai_source = (root / 'index.html').read_text(encoding='utf-8').replace('src="market.js"', 'src="ai-market.js"')
ai_source = ai_source.replace('<script src="ai-market.js"></script>', '<script src="ai-category-data.js"></script><script src="ai-market.js"></script>')
ai_source = ai_source.replace('<title>', '<title>AI辅助版 · ', 1)
ai_source = ai_source.replace('href="layout.css">', 'href="layout.css"><link rel="stylesheet" href="ai.css">')
old_nav = '<a class="active" aria-current="page" href="市场分析报告交互原型.html">原版原型</a>'
ai_source = ai_source.replace(old_nav, '<a href="市场分析报告交互原型.html">原版原型</a>').replace('<a href="市场分析报告AI辅助原型.html">AI辅助版</a>', '<a class="active" aria-current="page" href="市场分析报告AI辅助原型.html">AI辅助版</a>')
ai_source = ai_source.replace('>原版原型</a>', '>标准版</a>').replace('方案与原型导航', '方案与版本导航')
(root / 'ai-index.html').write_text(ai_source, encoding='utf-8')
ai_offline = html.replace('<title>', '<title>AI辅助版 · ', 1)
ai_offline = ai_offline.replace(old_nav, '<a href="市场分析报告交互原型.html">原版原型</a>').replace('<a href="市场分析报告AI辅助原型.html">AI辅助版</a>', '<a class="active" aria-current="page" href="市场分析报告AI辅助原型.html">AI辅助版</a>')
ai_offline = ai_offline.replace('<script>' + (root / 'report-data.js').read_text(encoding='utf-8'), '<script>' + (root / 'ai-category-data.js').read_text(encoding='utf-8') + '</script><script>' + (root / 'report-data.js').read_text(encoding='utf-8'), 1)
original_controller = (root / 'market.js').read_text(encoding='utf-8')
# Apply the same compact-rich transformations as the original offline build.
ai_controller = ai_controller.replace('m.dims[+a[1]]=el.innerHTML', 'm.dims[+a[1]]=compactRich(el)').replace("el.classList.contains('editor')?el.innerHTML:el.value", "el.classList.contains('editor')?compactRich(el):el.value")
original_controller = original_controller.replace('m.dims[+a[1]]=el.innerHTML', 'm.dims[+a[1]]=compactRich(el)').replace("el.classList.contains('editor')?el.innerHTML:el.value", "el.classList.contains('editor')?compactRich(el):el.value")
compact_function = "function compactRich(el){const copy=el.cloneNode(true);copy.querySelectorAll('img').forEach(img=>{const src=img.getAttribute('src');for(const [name,data] of Object.entries(window.INLINE_ASSETS)){if(src===data){img.setAttribute('src','assets/'+name);break;}}});return copy.innerHTML;}\nconst hasText=html=>"
ai_controller = ai_controller.replace('const hasText=html=>', compact_function)
original_controller = original_controller.replace('const hasText=html=>', compact_function)
assert original_controller in ai_offline
ai_offline = ai_offline.replace(original_controller, ai_controller, 1).replace('</head>', '<style>' + (root / 'ai.css').read_text(encoding='utf-8') + '</style></head>')
ai_offline = ai_offline.replace('>原版原型</a>', '>标准版</a>').replace('方案与原型导航', '方案与版本导航')
(root / '市场分析报告AI辅助原型.html').write_text(ai_offline, encoding='utf-8')
print('Created AI source copy and standalone prototype')
