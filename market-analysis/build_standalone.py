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
if not target.exists() or target.read_text(encoding='utf-8') != html:
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
ai_controller = ai_controller.replace("'请上传'+source.dimensions[i].title+'分析图片'", "'请补全'+source.dimensions[i].title+'分析依据'")
ai_controller = ai_controller.replace('<p class="subtle op-example-note">利润率为原型演示数据。</p>', '')
ai_controller = ai_controller.replace('利润通过示例', '硅胶旅行分装瓶 · 浅色4件套').replace('利润未通过示例', '硅胶旅行分装瓶 · 深色4件套')
ai_controller = ai_controller.replace("const rankingDefinitions=[['newTop','新品TOP10'],['monthTop','小类近30天TOP']];", "const rankingDefinitions=[];")
ai_controller = ai_controller.replace("!m.rankingImages?.newTop||dimensionImages.slice(0,6)", "dimensionImages.slice(0,6)")
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
ai_controller = ai_controller[:completion_start] + "function compCompletion(r){const total=13;return `${Math.max(0,total-new Set(compMissing(r).map(e=>e.key)).size)}/${total}`;}" + ai_controller[completion_end:]
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
# AI-only positioning fields replace the former combined selling-point textarea.
ai_controller = ai_controller.replace("['selling','核心卖点','textarea']", "['targetUsers','目标用户','textarea'],['userPainPoints','用户痛点','textarea'],['usageScenarios','使用场景','textarea']")
ai_controller = ai_controller.replace("selling:plainCompText(d.N||s?.N),", "selling:plainCompText(d.N||s?.N),targetUsers:'',userPainPoints:'',usageScenarios:'',")
ai_controller = ai_controller.replace("c.items.forEach(r=>{if(!r.origin)", "c.items.forEach(r=>{for(const key of ['targetUsers','userPainPoints','usageScenarios'])r[key]??='';if(!r.origin)")
ai_controller = ai_controller.replace("feedback:['selling','negative']", "feedback:['targetUsers','userPainPoints','usageScenarios','negative']")
ai_controller = ai_controller.replace("key==='selling'||key==='negative'", "['targetUsers','userPainPoints','usageScenarios','negative'].includes(key)")
ai_controller = ai_controller.replace("compControl(r,'selling','核心卖点','textarea')", "`<div class=\"comp-positioning-grid\">${compControl(r,'targetUsers','目标用户','textarea')}${compControl(r,'userPainPoints','用户痛点','textarea')}${compControl(r,'usageScenarios','使用场景','textarea')}</div>`")
ai_controller = ai_controller.replace('产品卖点与用户反馈', '市场定位与用户反馈')
ai_controller = ai_controller.replace("${reportLongText('核心卖点',r.selling)}", "<h4>市场定位与用户反馈</h4>${reportLongText('目标用户',r.targetUsers)}${reportLongText('用户痛点',r.userPainPoints)}${reportLongText('使用场景',r.usageScenarios)}")
# AI competitor control types and precision rules; standard version is unchanged.
ai_controller = ai_controller.replace("['sales','近30天销量','text']", "['sales','近30天销量','number']").replace("['specs','产品规格 / 尺寸','textarea']", "['specs','产品规格 / 尺寸','text']")
ai_controller = ai_controller.replace("compControl(r,'specs','产品规格 / 尺寸','textarea')", "compControl(r,'specs','产品规格 / 尺寸','text')")
ai_controller = ai_controller.replace("key==='reviews'?'step=\"1\"'", "['reviews','sales'].includes(key)?'step=\"1\"'")
ai_controller = ai_controller.replace("if(r.rating!==''&&(!Number.isFinite(+r.rating)||+r.rating<0||+r.rating>5))fields.push({key:'rating',message:'市场评分应为0～5之间的数字'});", "if(r.rating!==''&&(!/^\\d+(?:\\.\\d)?$/.test(String(r.rating))||+r.rating>5))fields.push({key:'rating',message:'市场评分应为0～5之间的非负数字，最多一位小数'});")
ai_controller = ai_controller.replace("if(r.price!==''&&(!Number.isFinite(+r.price)||+r.price<0))fields.push({key:'price',message:'请输入有效的非负售价'});", "if(r.price!==''&&!/^\\d+(?:\\.\\d{1,2})?$/.test(String(r.price)))fields.push({key:'price',message:'售价应为非负数字，最多两位小数'});if(r.sales!==''&&!/^\\d+$/.test(String(r.sales)))fields.push({key:'sales',message:'近30天销量应为非负整数'});")
# Reuse category history with the same explicit fill policy as AI assistance.
history_apply_start = ai_controller.index(' function applyHistory(){')
history_apply_end = ai_controller.index('\n}\nfunction reuse(kind,asin)', history_apply_start)
ai_controller = ai_controller[:history_apply_start] + """ function applyHistory(mode='overwrite'){
  if(!selected||readOnly)return;aiApplyCategoryHistory(selected,mode);close(dlg);showToast('历史类目分析已填充');
 }
 dlg.querySelector('[data-use-category-history]').onclick=async()=>{
  if(!selected)return;document.activeElement?.blur();const scope=aiScopeKey(),record=selected;
  const decision=await aiCategoryAskOverwrite(source.dimensions.map((_,i)=>String(i)),'复用历史分析');
  if(decision==='cancel'||readOnly||scope!==aiScopeKey()||!dlg.isConnected)return;
  selected=record;applyHistory(decision);
 };
""" + ai_controller[history_apply_end:]
# AI-only list presentation and automatic first analysis on successful additions.
ai_controller = ai_controller.replace('<span class="tag teal">竞品分析</span>', '<span class="tag teal">已加入竞品</span>')
ai_controller = ai_controller.replace("  renderCompetitors();renderRefs();close(dlg);", "  renderCompetitors();renderRefs();close(dlg);const added=asins.filter(asin=>!snapshot.items.some(item=>item.asin===asin));added.forEach(asin=>{const state=aiCompetitorState(asin);state.status='idle';state.comparison=null;void aiFetchCompetitorComparison(asin);});")
ai_controller = ai_controller.replace('<div class="field-error" id="compAddError" role="alert"></div>', '<p class="subtle comp-add-ai-tip">确认添加后，系统将自动获取AI竞品分析。已有内容将保留，差异项可逐项采用AI值。</p><div class="field-error" id="compAddError" role="alert"></div>')
# Category ASIN references show identifiers; commercial values stay in the task.
ai_controller = ai_controller.replace('class="reference-category-asin" title="${esc(ref.title||ref.asin)}"', 'class="reference-category-asin"')
ai_controller = ai_controller.replace(',salePrice:s.salePrice', '')
ai_controller = ai_controller.replace('p.spuDraft.skus.forEach(sku=>delete sku.cartons);', 'p.spuDraft.skus.forEach(sku=>{delete sku.cartons;delete sku.salePrice;delete sku.price;});')
ai_controller = ai_controller.replace('该ASIN正在进行竞品分析，请先从市场分析中移除', '当前ASIN已有竞品分析，无法删除参考产品。请先删除对应的竞品分析，再删除参考产品。')
ai_controller = ai_controller.replace(".join(', ')", ".join(',')")
# Freeze review data and allow preproject use only after approval.
ai_controller = ai_controller.replace("m.stage='review';$('#workflowState').value='review';persist();applyWorkflow();", "m.stage='review';$('#workflowState').value='review';applyWorkflow();m.submittedReportHtml=reportHtml();m.submittedProducts=structuredClone(products);persist();")
ai_controller = ai_controller.replace("m.stage='done';$('#workflowState').value='done';persist();applyWorkflow();", "m.stage='done';m.approvedReportHtml=m.submittedReportHtml||reportHtml();$('#workflowState').value='done';persist();applyWorkflow();")
ai_controller = ai_controller.replace("m.stage='research';$('#workflowState').value='research';persist();", "m.stage='research';delete m.submittedReportHtml;delete m.approvedReportHtml;delete m.submittedProducts;delete m.approvedSkuCodes;$('#workflowState').value='research';persist();")
cut = ai_controller.rindex('})();')
ai_controller = ai_controller[:cut] + (root / 'ai-competitor-compare.js').read_text(encoding='utf-8') + '\n' + (root / 'ai-assist.js').read_text(encoding='utf-8') + '\n' + (root / 'ai-category-view.js').read_text(encoding='utf-8') + '\n' + (root / 'ai-ranking-view.js').read_text(encoding='utf-8') + '\n' + (root / 'ai-import-view.js').read_text(encoding='utf-8') + '\n' + (root / 'ai-detail-view.js').read_text(encoding='utf-8') + '\n' + (root / 'ai-report-export.js').read_text(encoding='utf-8') + '\n' + ai_controller[cut:]
ai_controller = ai_controller.replace('配件搭配清单', '产品包装清单')
ai_controller = ai_controller.replace('reportValue(r.english)', 'reportValue(r.english,false)').replace("['采购链接',reportValue(link,false)]", "['采购链接',reportValue(link)]")
def normalize_ai_profit_labels(text):
    text = text.replace('海运-多渠道利润测算（OP）', '利润测算结果').replace('海运－多渠道利润测算（OP）', '利润测算结果')
    return text.replace('data-pending-help="全部平台店铺利润大于0，且有一个大于10%时可算利润通过。"', 'data-pending-help="海运-多渠道利润测算（OP）：所有平台店铺利润率均大于0%，且至少1家大于10%，判定为利润通过；否则不通过。"')
ai_controller = normalize_ai_profit_labels(ai_controller)
(root / 'ai-market.js').write_text(ai_controller, encoding='utf-8')
ai_source = (root / 'index.html').read_text(encoding='utf-8').replace('src="market.js"', 'src="ai-market.js"')
ai_source = ai_source.replace('<script src="ai-market.js"></script>', '<script src="ai-category-data.js"></script><script src="ai-competitor-data.js"></script><script src="ai-market.js"></script>')
ai_source = ai_source.replace('<title>', '<title>AI辅助版 · ', 1)
ai_source = ai_source.replace('href="layout.css">', 'href="layout.css"><link rel="stylesheet" href="ai.css">')
old_nav = '<a class="active" aria-current="page" href="市场分析报告交互原型.html">原版原型</a>'
ai_source = ai_source.replace(old_nav, '<a href="市场分析报告交互原型.html">原版原型</a>').replace('<a href="市场分析报告AI辅助原型.html">AI辅助版</a>', '<a class="active" aria-current="page" href="市场分析报告AI辅助原型.html">AI辅助版</a>')
ai_source = ai_source.replace('>原版原型</a>', '>标准版</a>').replace('方案与原型导航', '方案与版本导航')
ai_source = ai_source.replace("p.asin=row.querySelector('[data-field=\"reference\"]').value.trim().toUpperCase();", "s.reference=row.querySelector('[data-field=\"reference\"]').value.trim().toUpperCase();").replace('pendingEscape(p.asin)}<br>${pendingEscape(s.referenceType', 'pendingEscape(s.reference??p.asin)}<br>${pendingEscape(s.referenceType')
ai_source = ai_source.replace('配件搭配清单', '产品包装清单')
ai_source = normalize_ai_profit_labels(ai_source)
(root / 'ai-index.html').write_text(ai_source, encoding='utf-8')
ai_offline = html.replace('<title>', '<title>AI辅助版 · ', 1)
ai_offline = ai_offline.replace(old_nav, '<a href="市场分析报告交互原型.html">原版原型</a>').replace('<a href="市场分析报告AI辅助原型.html">AI辅助版</a>', '<a class="active" aria-current="page" href="市场分析报告AI辅助原型.html">AI辅助版</a>')
ai_offline = ai_offline.replace('<script>' + (root / 'report-data.js').read_text(encoding='utf-8'), '<script>' + (root / 'ai-category-data.js').read_text(encoding='utf-8') + '</script><script>' + (root / 'ai-competitor-data.js').read_text(encoding='utf-8') + '</script><script>' + (root / 'report-data.js').read_text(encoding='utf-8'), 1)
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
ai_offline = ai_offline.replace("p.asin=row.querySelector('[data-field=\"reference\"]').value.trim().toUpperCase();", "s.reference=row.querySelector('[data-field=\"reference\"]').value.trim().toUpperCase();").replace('pendingEscape(p.asin)}<br>${pendingEscape(s.referenceType', 'pendingEscape(s.reference??p.asin)}<br>${pendingEscape(s.referenceType')
ai_offline = ai_offline.replace('配件搭配清单', '产品包装清单')
ai_offline = ai_offline.replace('海运-多渠道利润测算（OP） <button', '利润测算结果 <button').replace('data-pending-help="全部平台店铺利润大于0，且有一个大于10%时可算利润通过。"', 'data-pending-help="海运-多渠道利润测算（OP）：所有平台店铺利润率均大于0%，且至少1家大于10%，判定为利润通过；否则不通过。"')
(root / '市场分析报告AI辅助原型.html').write_text(ai_offline, encoding='utf-8')
print('Created AI source copy and standalone prototype')
