/* Market analysis extension; the preceding script retains the AC sourcing workflow.
 * Edit REPORT_SOURCE for source examples; field definitions below control the form.
 * Frontend simulation only. State is saved locally in this browser.
 */
(() => {
'use strict';
const KEY='ac-market-analysis-v1';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const source=window.REPORT_SOURCE;
const definitions=[
 ['D','品线名称','定位与市场数据','input'],['H','精准关键词','定位与市场数据','textarea'],['O','产品规格 / 尺寸','定位与市场数据','input'],['P','BSR排名 / 对应类目','定位与市场数据','input'],['R','核心词下搜索竞品数量（核心词下）','定位与市场数据','input'],['S','核心关键词搜索量（月）','定位与市场数据','input'],
 ['N','核心卖点（功能 / 场景 / 设计）','内容分析','rich'],['T','核心差评点（高频问题）','内容分析','rich'],['U','用户图片反馈','内容分析','rich'],
 ['V','供应链成熟度','开发可行性','input'],['W','预估采购成本（CNY）','开发可行性','input'],['X','竞品利润测算（FBA）','开发可行性','input'],['Y','MOQ（起订量）','开发可行性','input'],['Z','合规 / 认证要求','开发可行性','input'],['AA','专利风险','开发可行性','input'],['AB','差异化开发方向','开发可行性','rich'],
 ['AC','同品类关联产品点','关联搭配与备注','textarea'],['AD','搭配场景 / 逻辑','关联搭配与备注','textarea'],['AE','产品线角色','关联搭配与备注','input'],['AF','采购注意事项 / 利润优化建议','关联搭配与备注','textarea']
];
const categoryLevelText=level=>({'3':'三级','4':'四级','5':'五级'}[String(level)]||'三级');
const richKeys=new Set(definitions.filter(d=>d[3]==='rich').map(d=>d[0]));
const defaultHtml=t=>String(t||'').split('\n').filter(Boolean).map(x=>`<p>${esc(x.replaceAll('**',''))}</p>`).join('');
function competitorDraft(r){return Object.fromEntries(definitions.map(([k])=>[k,k==='U'?`<p>用户反馈图片</p><img loading="lazy" decoding="async" src="assets/${r.feedback}" alt="${esc(r.F)} · 用户反馈">`:richKeys.has(k)?defaultHtml(r[k]):r[k]||'']));}
let initial={site:'US',category:'Beauty & Personal Care / Tools & Accessories / Refillable Containers',categoryMode:'tree',categoryLevel:'3',selected:source.competitors.slice(0,2).map(r=>r.I),dims:source.dimensions.map(d=>d.html),drafts:Object.fromEntries(source.competitors.map(r=>[r.I,competitorDraft(r)])),channels:{},dept:'xingqu',stage:'research',frozenVisibility:true,origin:'ASIN选品',categoryReuse:'',competitorReuse:{}};
let m;
let activeHistoryTask=null;
try{m=JSON.parse(localStorage.getItem(KEY))||structuredClone(initial);}catch{m=structuredClone(initial);}
m.rankingImages ||= {newTop:{src:'assets/image10.png',alt:'新品TOP10'},monthTop:null};
Object.values(m.drafts||{}).forEach(d=>{if(typeof d.U==='string')d.U=d.U.replaceAll('原报告用户反馈图片（示例）','用户反馈图片');});
let isVisible=true,readOnly=false,activeRich=null,savedRange=null,dialogCounter=0,lightboxImage=null;
let refData=source.competitors.map((s,i)=>({...refs[i],asin:s.I,title:s.F,img:s.img,price:s.M,rating:s.K,reviews:s.L,sales:s.Q,date:new Date((Number(s.J)-25569)*86400000).toISOString().slice(0,10),category:'Refillable Containers',status:'done'}));
refs.splice(0,refs.length,...refData,...(m.extraRefs||[]));
candidates.forEach(c=>{if(!refs.some(r=>r.asin===c.asin)){c.asin='B0FY2DD2H6';c.img='image13.jpeg';c.title='茶色玻璃泵头分装瓶 · 两件套';}});
if(m.products)products=m.products;
if(!m.products)products.forEach(p=>{if(p.spu==='SPU26090001'){p.title='4件套硅胶旅行分装瓶 · 90ml';p.category='美容和个人护理 / 工具和配件 / 分装瓶';p.skus.forEach(s=>{s.variantTitle='硅胶旅行分装瓶 · 多色4件套';s.price=29.1;s.sale='19.99 ～ 23.99 USD';});}});
// Upgrade only the existing demonstration records once; later edits and new drafts stay untouched.
const pendingExamplesUpgraded=!m.pendingRequiredExampleVersion;
if(pendingExamplesUpgraded){
 products.forEach(p=>{
  p.title ||= '4件套硅胶旅行分装瓶 · 90ml';p.category ||= '美容和个人护理 / 工具和配件 / 分装瓶';p.img ||= 'image11.jpeg';p.supplier ||= '广州安行汽车用品有限公司';p.asin ||= 'B0FKB9CYXY';
  p.purchaseNotes ||= '现货采购交期7天；支持阿里月结，账期30天。';
  if(!p.opImages?.length)p.opImages=[{src:'assets/op-profit-example.svg',alt:'海运-多渠道利润测算（OP）示例'}];
  p.skus.forEach(s=>{s.variantTitle ||= p.title;s.img ||= p.img;s.referenceType ||= '相同款';if(s.price==null||s.price==='')s.price=29.10;if(s.moq==null||s.moq==='')s.moq=100;s.sale ||= '19.99 ～ 23.99 USD';s.accessoryList=s.accessoryList||s.packagingList||s.competitor||'分装瓶×4、漏斗×1、标签贴×1、透明收纳袋×1';s.packagingList=s.accessoryList;s.competitor=s.accessoryList;s.needsMaintenance=false;});
 });
 m.pendingRequiredExampleVersion=1;
}
$('#workflowState').value=m.stage;$('#developerDept').value=m.dept;$('#taskOrigin').value=m.origin;
const main=document.querySelector('.main');
main.querySelector('.detail-section').id='basicSection';
main.insertAdjacentHTML('afterbegin',`<nav class="jump-rail"><a href="#basicSection">任务信息</a><a href="#referenceSection">参考产品</a><a href="#marketSection" id="marketJump">市场分析</a><a href="#candidateSection">1688溯源结果</a><a href="#supplierSection">备选供应商</a><a href="#pendingSection">待开发产品</a><span class="hint">字段失焦自动保存 <span style="color:#15966b">√</span></span></nav>`);
$('#candidateSection').insertAdjacentHTML('beforebegin',`<section class="detail-section market-section" id="marketSection"><div class="section-head"><div class="section-title">市场分析</div><div class="section-actions"><button class="btn primary report-preview-button" id="previewInline"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H5v18h14V8zM14 3v5h5M8 11h5M8 15h3"/><circle cx="16" cy="16" r="3"/><path d="m18.3 18.3 2.7 2.7"/></svg><span>报告预览</span></button></div></div><div class="sub-head"><h3>类目市场分析</h3></div><div class="market-meta category-meta"><div class="category-meta-top"><div class="category-meta-row"><label><span class="required">*</span> 站点 <select id="marketSite" aria-required="true"><option>US</option><option>UK</option><option>DE</option></select></label><label><span class="required">*</span> 品类等级 <select id="marketLevel" aria-required="true"><option value="3">Amazon三级</option><option value="4">Amazon四级</option><option value="5">Amazon五级</option></select></label></div><div class="category-meta-actions"><button class="btn market-write" id="fromAsin">从参考ASIN选择</button><button class="btn market-write" id="reuseCategory">复用历史分析</button></div></div><div class="category-entry"><label for="marketCategory"><span class="required">*</span> 调研品类</label><div class="category-search-control"><input id="marketCategory" placeholder="搜索Amazon品类或自定义输入" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="categorySuggestions" aria-expanded="false"><div id="categorySuggestions" class="category-suggestions" role="listbox" hidden></div></div><span id="categorySaved" hidden aria-hidden="true"></span></div></div><section class="category-rankings" id="categoryRankings"><h4><button type="button" class="analysis-fold-title" id="toggleCategoryRankings" aria-expanded="true"><span class="analysis-fold-chevron" aria-hidden="true">›</span>榜单参考</button><span id="rankingRequiredProgress" class="analysis-required-progress"></span></h4><div class="ranking-grid" id="rankingCards"></div></section><div class="dim-grid" id="dimensions"></div><div class="sub-head" style="border-top:1px solid #e1e5ea;padding-top:18px"><h3>竞品市场分析 <span id="competitorCount"></span></h3></div><div id="competitors"></div></section>`);
const categoryMeta=$('.category-meta');
const categoryBottom=document.createElement('div');categoryBottom.className='category-meta-bottom';categoryBottom.append(categoryMeta.querySelector('.category-entry'),categoryMeta.querySelector('.category-meta-actions'));categoryMeta.append(categoryBottom);
const categoryScope=categoryMeta.querySelector('.category-meta-row');categoryScope.classList.add('category-scope-controls');categoryScope.setAttribute('role','group');categoryScope.setAttribute('aria-label','调研范围');$('#marketSection > .sub-head').append(categoryScope);categoryMeta.querySelector('.category-meta-top').remove();categoryScope.addEventListener('click',event=>event.stopPropagation());
const reuseWrap=document.createElement('span');reuseWrap.className='category-reuse-trigger';$('#reuseCategory').before(reuseWrap);reuseWrap.append($('#reuseCategory'));
$('#pendingSection').insertAdjacentHTML('beforeend',`<div class="report-link-card" id="preprojectLink"><span>预立项资料　<span class="tag teal">结构化报告</span><span class="subtle">引用当前任务报告，无需重新上传</span></span><button class="link" id="preproject">引用至预立项</button></div>`);
function persist(){if(activeHistoryTask)return true;try{m.extraRefs=refs.filter(r=>!source.competitors.some(s=>s.I===r.asin));m.products=products;localStorage.setItem(KEY,JSON.stringify(m));return true;}catch(e){showToast('浏览器存储空间不足或不可用，请减少图片后重试','error');return false;}}
function mark(el){if(!persist())return;let mark=el?.querySelector('.save-mark');if(mark)mark.textContent='√';if(el){el.classList.remove('invalid');el.querySelector('.field-error')?.remove();}}
const rankingDefinitions=[['newTop','新品TOP10'],['monthTop','小类近30天TOP']];
const rankingSaveStates={newTop:'saved',monthTop:'saved'};
function renderRankings(){
 const target=$('#rankingCards');if(!target)return;
 target.innerHTML=rankingDefinitions.map(([key,title])=>{const img=m.rankingImages?.[key];return `<article class="ranking-card" id="ranking-${key}"><div class="ranking-card-head"><span>${title}${key==='newTop'?'<span class="required"> *</span>':''}</span><div class="ranking-card-tools"><button type="button" class="link ranking-save-state ${rankingSaveStates[key]==='error'?'danger':''}" data-ranking-retry="${key}">${rankingSaveStates[key]==='error'?'保存失败 · 重试':''}</button><button type="button" class="btn primary market-write" data-ranking-upload="${key}" ${readOnly?'hidden':''}>${img?'重新上传':'上传图片'}</button></div></div>${img?`<div class="ranking-image"><img loading="lazy" decoding="async" src="${esc(img.src.startsWith('assets/')?asset(img.src.slice(7)):img.src)}" alt="${esc(img.alt||title)}" tabindex="0"><button type="button" class="category-image-delete market-write" data-ranking-delete="${key}" title="删除图片" aria-label="删除图片" ${readOnly?'hidden':''}>×</button></div>`:'<div class="ranking-empty">暂无图片</div>'}</article>`;}).join('');refreshRankingProgress();
}
function refreshRankingProgress(){const node=$('#rankingRequiredProgress');if(node){const n=m.rankingImages?.newTop?1:0,error=rankingSaveStates.newTop==='error';node.textContent=error?'保存失败 · 重试':n?'✓ 已保存':'待上传图片';node.classList.toggle('is-complete',!!n&&!error);node.classList.toggle('is-empty',!n&&!error);node.dataset.state=error?'error':n?'saved':'empty';}refreshCategoryControls();}

function saveRanking(key){rankingSaveStates[key]=persist()?'saved':'error';renderRankings();if(rankingSaveStates[key]==='saved'){$('#ranking-'+key)?.classList.remove('invalid');$('#ranking-'+key+' .field-error')?.remove();}}
function rankingReportHtml(images){return `<section class="report-rankings"><h3>榜单参考</h3><div class="ranking-report-grid">${rankingDefinitions.map(([key,title])=>`<div><h4>${esc(title)}</h4>${reportImageHtml(images?.[key],key==='newTop',title)}</div>`).join('')}</div></section>`;}

function setRankingsCollapsed(collapsed){$('#categoryRankings').classList.toggle('is-collapsed',collapsed);$('#toggleCategoryRankings').setAttribute('aria-expanded',String(!collapsed));refreshCategoryControls();}
function revealRankingRequired(){setRankingsCollapsed(false);let node=$('#ranking-newTop');while(node&&node!==main){if(node.classList.contains('module-collapsed')){node.classList.remove('module-collapsed');const toggle=node.querySelector(':scope > .section-head .module-toggle,:scope > .sub-head .module-toggle');if(toggle){toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','收起'+node.dataset.foldLabel);}}node=node.parentElement;}}
let dimensionImages=[];
const categorySaveStates=[],categorySaveVersions=[],categoryUploadJobs=Array.from({length:6},()=>[]);
let categoryInitialSavingScheduled=false;
function categoryStatusLabel(i){
 const text=$('#category-conclusion-'+i)?.value??dimensionParts(m.dims[i]).text;
 const count=i<6?(dimensionImages[i]||[]).length:0, suffix='';
 const status=categorySaveStates[i]||'saved';
 if(status==='saving')return '保存中...';
 if(status==='error')return '保存失败 · 重试';
 if(status==='dirty')return text.trim()?'':count?'未填写结论'+suffix:'未填写';
 if(!text.trim())return count?'未填写结论'+suffix:'未填写';
 if(i<6&&!count)return '待上传图片';
 return '✓ 已保存';
}
function refreshCategoryStatus(i){const status=$('#dim-'+i+' .category-save-status');if(!status)return;const label=categoryStatusLabel(i);status.textContent=label;status.dataset.state=categorySaveStates[i]||'saved';status.classList.toggle('is-empty',label.startsWith('未填写')||label==='待上传图片');status.setAttribute('aria-label',label);}
async function saveCategoryItem(i){
 if(readOnly)return;const version=(categorySaveVersions[i]||0)+1;categorySaveVersions[i]=version;
 const html=dimensionHtml(i);categorySaveStates[i]='saving';refreshCategoryStatus(i);
 await new Promise(resolve=>setTimeout(resolve,650));
 if(categorySaveVersions[i]!==version)return;
 m.dims[i]=html;
 categorySaveStates[i]=persist()?'saved':'error';refreshCategoryStatus(i);refreshCategoryControls();
 if(categorySaveStates[i]==='saved'){$('#dim-'+i).classList.remove('invalid');$('#dim-'+i+' .field-error')?.remove();}
}
function renderCategoryGallery(i){const gallery=$('[data-category-gallery="'+i+'"]');if(gallery)gallery.innerHTML=categoryImageMarkup(i);const upload=$('#dim-'+i+' [data-category-upload]');if(upload){upload.textContent=dimensionImages[i]?.length?'重新上传':'上传图片';upload.disabled=categoryUploadJobs[i]?.[0]?.status==='uploading';}refreshCategoryStatus(i);}
async function uploadCategoryImage(i,job,retry=false){
 job.status='uploading';renderCategoryGallery(i);
 try{
  if(!job.src)job.src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('read'));reader.onabort=()=>reject(new Error('abort'));reader.readAsDataURL(job.file);});
  await new Promise(resolve=>setTimeout(resolve,500));
  if(!categoryUploadJobs[i].includes(job))return;
  dimensionImages[i]=[{src:job.src,alt:job.file.name}];categoryUploadJobs[i]=categoryUploadJobs[i].filter(j=>j!==job);renderCategoryGallery(i);saveCategoryItem(i);
 }catch{if(categoryUploadJobs[i].includes(job)){job.status='error';renderCategoryGallery(i);}}
}
function dimensionParts(html){
 const node=document.createElement('div');node.innerHTML=html||'';
 const images=[...node.querySelectorAll('img')].slice(0,1).map(img=>({src:img.getAttribute('src'),alt:img.getAttribute('alt')||'分析图片'}));
 node.querySelectorAll('img').forEach(img=>img.remove());
 node.querySelectorAll('br').forEach(br=>br.replaceWith(document.createTextNode('\n')));
 node.querySelectorAll('p,div,li').forEach(block=>block.append(document.createTextNode('\n')));
 return {text:node.textContent.replace(/\n{3,}/g,'\n\n').trim(),images};
}
function categoryImageMarkup(i){
 const img=dimensionImages[i]?.[0],job=categoryUploadJobs[i]?.[0];
 return `<div class="category-single-frame${img?' has-image':''}">${img?`<img loading="lazy" decoding="async" src="${esc(img.src.startsWith('assets/')?asset(img.src.slice(7)):img.src)}" alt="${esc(img.alt)}" tabindex="0">${!readOnly&&!job?`<button type="button" class="category-image-delete" data-category-delete="${i}:0" aria-label="删除图片" title="删除图片">×</button>`:''}`:'<span class="category-single-empty">暂无图片</span>'}${job?`<div class="category-single-progress ${job.status==='error'?'upload-error':''}"><span class="category-upload-name">${esc(job.file.name)}</span>${job.status==='error'?`<button type="button" class="link danger" data-category-image-retry="${i}:${job.id}">上传失败 · 重试</button>`:'<span class="subtle">上传中...</span>'}<button type="button" class="link" data-category-image-cancel="${i}:${job.id}">${img?'保留原图':'取消'}</button></div>`:''}</div>`;
}
function normalizeSingleCategoryImage(html,i){const node=document.createElement('div');node.innerHTML=html||'';node.querySelectorAll('img').forEach((img,j)=>{if(i>=6||j>0)img.remove();});return node.innerHTML;}
function dimensionCard(i){
 const parts=dimensionParts(m.dims[i]);dimensionImages[i]=parts.images;if(!categorySaveStates[i])categorySaveStates[i]='saved';
 return `<article class="dim-card category-analysis-item${i>=6?' category-text-only':''}" id="dim-${i}"><div class="field-head"><span class="category-item-title"><span class="number">${String(i+1).padStart(2,'0')}.</span>${esc(source.dimensions[i].title)}<span class="required"> *</span></span><div class="category-item-status"><button type="button" class="category-save-status save-mark" data-category-save-retry="${i}" data-state="${categorySaveStates[i]}">${categoryStatusLabel(i)}</button></div></div><div class="category-item-body">${i<6?`<div class="category-image-panel"><div class="category-panel-head"><span>分析图片 <span class="required">*</span></span><button type="button" class="btn primary market-write" data-category-upload="${i}" ${readOnly?'hidden':''}>${parts.images.length?'重新上传':'上传图片'}</button></div><div class="category-image-grid" data-category-gallery="${i}">${categoryImageMarkup(i)}</div></div>`:''}<div class="category-text-panel">${i<6?`<div class="category-panel-head"><label for="category-conclusion-${i}">分析结论 <span class="required">*</span></label></div>`:''}<textarea class="category-conclusion" id="category-conclusion-${i}" data-key="dim:${i}" aria-label="${esc(source.dimensions[i].title)}" placeholder="请输入${esc(source.dimensions[i].title)}分析结论" rows="3" ${readOnly?'disabled':''}>${esc(parts.text)}</textarea></div></div></article>`;
}
function dimensionHtml(i){const text=$('#category-conclusion-'+i)?.value||'';return text.split('\n').map(line=>`<p>${esc(line)||'<br>'}</p>`).join('')+(dimensionImages[i]||[]).map(img=>`<img loading="lazy" decoding="async" src="${esc(img.src)}" alt="${esc(img.alt)}">`).join('');}
function sizeCategoryText(){document.querySelectorAll('#dimensions .category-conclusion').forEach(textarea=>{textarea.style.height='160px';});}
function expandAnalysisModule(id){
 let node=$('#'+id);
 while(node&&node!==main){if(node.classList.contains('module-collapsed')){node.classList.remove('module-collapsed');const toggle=node.querySelector(':scope > .sub-head .module-toggle,:scope > .section-head .module-toggle');if(toggle){toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','收起'+(node.dataset.foldLabel||''));toggle.title='收起'+(node.dataset.foldLabel||'');}}node=node.parentElement;}
}
function refreshCategoryControls(){const cards=[...document.querySelectorAll('#dimensions > .category-analysis-item')];const collapsed=cards.filter(c=>c.classList.contains('module-collapsed')).length;const button=$('#toggleCategoryItems');if(button)button.textContent=$('#categoryAnalysisBlock')?.classList.contains('module-collapsed')||collapsed===cards.length&&$('#categoryRankings').classList.contains('is-collapsed')?'全部展开':'全部收起';const progress=$('#categoryProgress');if(progress){const n=cards.filter((c,i)=>c.querySelector('textarea')?.value.trim()&&(i>=6||dimensionImages[i]?.length===1)).length+Number(!!($('#marketCategory')?.value??m.category).trim())+Number(!!m.rankingImages?.newTop);progress.textContent='已填写 '+n+'/10';}}
function scheduleCategorySize(){if(window.requestAnimationFrame)window.requestAnimationFrame(sizeCategoryText);else sizeCategoryText();}
function richEditor(key,html){return `<div class="editor-wrap"><div class="editor-toolbar"><button type="button" data-command="bold" title="加粗"><b>B</b></button><button type="button" data-command="insertUnorderedList" title="项目列表">☷</button><button type="button" data-upload="${esc(key)}">＋ 图片</button><span class="toolbar-note">图文混排 · 支持多图 / 粘贴图片</span></div><div class="editor" contenteditable="${!readOnly}" data-key="${esc(key)}" data-placeholder="输入分析内容，可在文字中插入多张图片…" role="textbox" aria-label="${esc(key.startsWith('dim:')?source.dimensions[Number(key.split(':')[1])].title:'竞品分析 '+key.split(':').at(-1))}" aria-multiline="true">${html}</div></div>`;}
function productHeader(r,actions=true){return `<div class="comp-head"><img loading="lazy" decoding="async" src="${asset(r.img)}" alt="${esc(r.title)}"><div class="comp-summary"><a href="${amazonUrl(r.asin)}" target="_blank" rel="noopener" class="external-link">${esc(r.asin)} ↗</a> <span class="tag">${esc(m.site)}</span><div class="comp-name">${esc(r.title)}</div><div class="comp-facts">售价 <b>$${esc(r.price||'--')}</b>评分 <b>${esc(r.rating||'--')} / ${esc(r.reviews||'--')}条</b>近30天销量 <b>${esc(r.sales||'--')}</b>上架 <b>${esc(r.date||'--')}</b><span>引用参考产品</span></div></div>${actions?`<div class="comp-actions"><button class="btn market-write" data-reuse="${r.asin}">复用本人历史分析</button><button class="link danger market-write" data-remove="${r.asin}">移除</button></div>`:''}</div>`;}
function fieldControl(asin,d){const [k,label,,type]=d;const required=k==='AB';const val=m.drafts[asin]?.[k]||'';if(type==='rich')return `<div class="dim-card" id="field-${asin}-${k}"><div class="field-head"><span>${esc(label)}${required?'<span class="required"> *</span>':''}</span><span class="save-mark"></span></div>${richEditor('comp:'+asin+':'+k,val)}</div>`;return `<div class="market-field" id="field-${asin}-${k}"><label for="input-${asin}-${k}">${esc(label)}<span class="save-mark"></span></label><${type==='textarea'?'textarea':'input'} id="input-${asin}-${k}" data-key="comp:${asin}:${k}" ${type==='textarea'?'rows="3"':'value="'+esc(val)+'"'} ${readOnly?'disabled':''}>${type==='textarea'?esc(val)+'</textarea>':''}</div>`;}
// Competitor analysis uses task-local snapshots; reference refreshes never overwrite edits.
const compFieldDefinitions=[
 ['name','产品名称','text'],['date','上架时间','date'],['rating','市场评分','number'],
 ['reviews','Review数量','number'],['price','竞品售价（USD）','number'],['sales','近30天销量','text'],
 ['bsr','BSR小类排名','text'],['specs','产品规格 / 尺寸','textarea'],
 ['selling','核心卖点','textarea'],['negative','核心差评点','textarea'],['direction','差异化开发方向','textarea']
];
const compPositionPlaceholders={season:'请填写具体周期/时段（如圣诞节：11月-12月，旺季12月前）',scene:'请填写核心消费场景',audience:'请填写目标客群（如北美家庭/性别/职业身份等）'};
const compPositionDefinitions=[['season','节日周期/流量时段',1],['scene','核心消费场景',7],['audience','目标客群',6]];
const compSaveStates={};
const compSaveVersions={};
const compFolded=new Set();
let compQuery='';
function plainCompText(html){const node=document.createElement('div');node.innerHTML=html||'';node.querySelectorAll('p,div,li,br').forEach(el=>el.append(document.createTextNode('\n')));return node.textContent.replace(/\n{3,}/g,'\n\n').trim();}
function makeCompRecord(asin,origin='reference'){
 const r=refs.find(r=>r.asin===asin),s=source.competitors.find(r=>r.I===asin),d=m.drafts?.[asin]||{};
 const titles=['Leakproof Silicone Travel Bottles Set, TSA Approved Refillable Toiletry Containers','4 in 1 Travel Dispenser Bottle for Shampoo, Conditioner and Body Wash','Amber Glass Pump Bottles, Refillable Travel Toiletry Dispensers'];
 const clean=v=>v===undefined||v===null||v==='--'?'':String(v);
 const words=String(d.H||s?.H||'').split(/\n/).map(w=>w.replace(/^\s*\d+[.、]\s*/,'').trim()).filter(Boolean);
 return {asin,origin,name:r?.title||s?.F||'',english:s?titles[source.competitors.indexOf(s)]:'',
  image:r?.img?'assets/'+r.img:s?.img?'assets/'+s.img:'',systemImage:!!(r?.img||s?.img),date:clean(r?.date),rating:clean(r?.rating),reviews:clean(r?.reviews),price:clean(r?.price),sales:clean(r?.sales),
  bsr:clean(d.P||s?.P),specs:clean(d.O||s?.O),selling:plainCompText(d.N||s?.N),negative:plainCompText(d.T||s?.T),direction:plainCompText(d.AB||s?.AB),remark:plainCompText(d.AF||s?.AF),
  keywords:(words.length?words.slice(0,3):['']).map((word,i)=>({word,count:i?'5000以上':clean(d.R||s?.R),volume:i?'3800+':clean(d.S||s?.S)})),
  feedback:s?.feedback?[{src:'assets/'+s.feedback,alt:'用户反馈图片'}]:[]};
}
function ensureCompetitorState(){
 if(!m.competitorAnalysis)m.competitorAnalysis={items:(m.selected||[]).map(a=>makeCompRecord(a)),active:m.selected?.[0]||'',position:Object.fromEntries(compPositionDefinitions.map(([key,,dim])=>[key,plainCompText(m.dims[dim])]))};
 const c=m.competitorAnalysis;m.selected=c.items.map(r=>r.asin);
 c.items.forEach(r=>{if(!r.origin)r.origin=refs.some(ref=>ref.asin===r.asin)?'reference':'manual';});
 if(!c.items.some(r=>r.asin===c.active))c.active=c.items[0]?.asin||'';
 return c;
}
function compImage(src){return src?.startsWith('assets/')?asset(src.slice(7)):src;}
function compCategoryPath(r){const paths=referenceCategories[r.asin]?.paths;return r.categoryPath||paths?.[5]||paths?.[4]||paths?.[3]||refs.find(ref=>ref.asin===r.asin)?.categoryPath||'—';}
function compCategoryMismatch(r){
 const actual=compCategoryPath(r);if(!m.category?.trim()||actual==='—')return false;
 const parts=path=>path.split(/\s*(?:\/|>|›)\s*/).map(s=>s.trim().toLowerCase()).filter(Boolean);
 const expected=parts(m.category),current=parts(actual).slice(0,Number(m.categoryLevel||3));
 return current.join(' / ')!==expected.join(' / ');
}
function compMismatchHtml(r){return compCategoryMismatch(r)?`<div class="comp-category-warning" role="status"><span aria-hidden="true">⚠</span><span>与调研${categoryLevelText(m.categoryLevel)}品类不一致，请确认是否属于本次调研范围</span></div>`:'';}
function refreshCompScope(){
 const head=$('#competitorCount')?.closest('.sub-head');if(!head)return;
 let summary=head.querySelector('.comp-scope-summary');
 if(!summary){summary=document.createElement('span');summary.className='comp-scope-summary';head.querySelector('h3').after(summary);}
 const text=`${m.site} · Amazon${categoryLevelText(m.categoryLevel)} · ${m.category||'类目市场分析暂未选择调研品类'}`;
 if(summary.textContent!==text)summary.textContent=text;
 summary.title=text;
 const r=m.competitorAnalysis?.items.find(r=>r.asin===m.competitorAnalysis.active),path=$('#compDetail .comp-category-path');
 if(path&&r){path.parentElement.querySelector('.comp-category-warning')?.remove();path.insertAdjacentHTML('afterend',compMismatchHtml(r));}
}
function compMissing(r){
 const fields=compFieldDefinitions.filter(([k])=>!String(r[k]??'').trim()).map(([k,label])=>({key:k,message:'请填写'+label}));
 if(r.rating!==''&&(!Number.isFinite(+r.rating)||+r.rating<0||+r.rating>5))fields.push({key:'rating',message:'市场评分应为0～5之间的数字'});
 if(r.reviews!==''&&(!/^\d+$/.test(String(r.reviews))))fields.push({key:'reviews',message:'Review数量应为非负整数'});
 if(r.price!==''&&(!Number.isFinite(+r.price)||+r.price<0))fields.push({key:'price',message:'请输入有效的非负售价'});
 if(r.specs&&!/((?:^|[^a-z])(?:cm|mm|m|in|inch|inches|ft|oz|ounces|lb|lbs|pounds|g|kg|ml|l)\b|厘米|毫米|英寸|英尺|克|千克|毫升|磅|盎司|升)/i.test(r.specs))fields.push({key:'specs',message:'产品规格 / 尺寸需注明单位'});
 if(!r.keywords.length)fields.push({key:'keywords',message:'请至少添加一组完整的关键词及搜索数据'});
 else if(!r.keywords.some(row=>['word','count','volume'].every(k=>String(row[k]||'').trim()))){
  const best=r.keywords.reduce((best,row,i,rows)=>['word','count','volume'].filter(k=>String(row[k]||'').trim()).length>['word','count','volume'].filter(k=>String(rows[best][k]||'').trim()).length?i:best,0);
  ['word','count','volume'].forEach(k=>{if(!String(r.keywords[best][k]||'').trim())fields.push({key:`kw-${best}-${k}`,message:'请至少填写一组完整的关键词及搜索数据'});});
 }
 return fields;
}
function compCompletion(r){const total=14;const missing=new Set(compMissing(r).filter(e=>e.key!=='keywords').map(e=>e.key)).size+(r.keywords.length?0:3);return `${Math.max(0,total-missing)}/${total}`;}
function compStatusHtml(){return '';}
function updateCompStatus(){}
function saveComp(group){
 const version=compSaveVersions[group]=(compSaveVersions[group]||0)+1;compSaveStates[group]='saving';updateCompStatus(group);
 setTimeout(()=>{if(version!==compSaveVersions[group])return;compSaveStates[group]=persist()?'saved':'error';updateCompStatus(group);renderCompList();},260);
}
function dirtyComp(group){compSaveVersions[group]=(compSaveVersions[group]||0)+1;compSaveStates[group]='dirty';updateCompStatus(group);}
function renderCompList(){
 const c=ensureCompetitorState(),list=$('#compList');if(!list)return;
 const filtered=c.items.filter(r=>(r.asin+' '+r.name+' '+r.english).toLowerCase().includes(compQuery.toLowerCase()));
 list.innerHTML=filtered.map(r=>`<div class="competitor-list-item ${r.asin===c.active?'is-active':''}" data-comp-select="${r.asin}" tabindex="0" role="button" aria-label="选择竞品 ${r.asin}" aria-pressed="${r.asin===c.active}"><div class="comp-list-image">${r.image?`<img loading="lazy" decoding="async" src="${esc(compImage(r.image))}" alt="${esc(r.name)}">`:'暂无图片'}</div><div class="comp-list-copy"><a href="https://www.amazon.${m.site==='UK'?'co.uk':m.site==='DE'?'de':'com'}/dp/${r.asin}" target="_blank" rel="noopener" class="external-link">${r.asin} ↗</a><div class="comp-list-name" title="${esc(r.name||r.english)}">${esc(r.name||r.english||'未填写产品名称')}</div><div class="comp-list-metrics">$${esc(r.price!==''&&r.price!=null?r.price:'—')} · ★ ${esc(r.rating!==''&&r.rating!=null?r.rating:'—')} · 月销量 ${esc(r.sales||'—')}</div><div class="comp-list-meta"><span class="comp-completion ${compMissing(r).length?'incomplete':''}">已填写 ${compCompletion(r)}</span></div></div><button type="button" class="comp-list-delete market-write" data-comp-delete="${r.asin}" aria-label="删除竞品分析 ${r.asin}" title="删除竞品分析" ${readOnly?'hidden':''}>×</button></div>`).join('')||'<div class="comp-list-empty">暂无竞品</div>';
 $('#competitorCount').textContent=`${c.items.length}个`;
 $('#competitors').dataset.total=String(c.items.length);
}
function compGroupProgress(key,r){
 const c=ensureCompetitorState();let total,filled;
 if(key==='position'){total=3;filled=compPositionDefinitions.filter(([k])=>c.position[k]?.trim()).length;}
 else{const fields={base:['name','date','rating','reviews','price','sales','bsr','specs'],feedback:['selling','negative'],advice:['direction']};
  if(key==='keywords'){total=3;filled=Math.max(0,...r.keywords.map(row=>['word','count','volume'].filter(k=>String(row[k]||'').trim()).length));}
  else{const keys=fields[key]||[];const missing=new Set(compMissing(r).map(e=>e.key));total=keys.length;filled=keys.filter(k=>!missing.has(k)).length;}
 }
 return `已填写 ${filled}/${total}`;
}
function compProgressHtml(key,r){return `<span class="analysis-required-progress" data-comp-progress="${key}">${compGroupProgress(key,r)}</span>`;}
function refreshCompProgress(){const c=ensureCompetitorState(),r=c.items.find(r=>r.asin===c.active);$$('#competitors [data-comp-progress]').forEach(el=>{const key=el.dataset.compProgress;if(key==='position'||r)el.textContent=compGroupProgress(key,r);});}
const compDisplayLabels={specs:'产品规格/尺寸（注明单位）',selling:'核心卖点（功能/场景/设计）',negative:'核心差评点（高频问题）',direction:'差异化开发方向（设计/功能/组合）'};
function compControl(r,key,label,type='text',optional=false){
 label=compDisplayLabels[key]||label;
 const attrs=`${type==='date'?`class="${r[key]?'':'is-empty-date'}"`:''} data-cfield="${key}" data-comp-group="${key==='selling'||key==='negative'?'feedback':key==='direction'||key==='remark'?'advice':'base'}-${r.asin}" aria-label="${esc(label)}" ${optional?'':'aria-required="true"'} ${readOnly?'disabled':''}`;
 return `<div class="comp-form-field ${type==='textarea'?'comp-field-wide':''}" id="cf-${key}"><label for="ci-${key}">${label}${optional?'':' <span class="required">*</span>'}</label><div class="comp-control">${type==='textarea'?`<textarea id="ci-${key}" ${attrs}>${esc(r[key])}</textarea>`:`<input id="ci-${key}" type="${type}" ${attrs} value="${esc(r[key])}" ${type==='number'?`min="0" ${key==='rating'?'max="5" step="0.1"':key==='reviews'?'step="1"':'step="0.01"'}`:''}>`}</div></div>`;
}
function compModule(key,title,body,r){const group=key+'-'+r.asin;return `<section class="comp-detail-module ${compFolded.has(group)?'is-collapsed':''}" data-comp-module="${group}"><div class="comp-module-head"><button type="button" class="comp-module-toggle" data-comp-fold="${group}" aria-expanded="${!compFolded.has(group)}"><span class="comp-chevron">›</span>${title}</button>${compProgressHtml(key,r)}</div><div class="comp-module-body">${body}</div></section>`;}
function renderCompKeywords(r){return `<div id="cf-keywords"><table class="comp-keyword-table"><thead><tr><th>核心关键词（英文） <span class="required">*</span></th><th>搜索竞品数量（核心词下） <span class="required">*</span></th><th>核心关键词搜索量（月） <span class="required">*</span></th><th>操作</th></tr></thead><tbody>${r.keywords.map((row,i)=>`<tr>${['word','count','volume'].map(k=>`<td id="cf-kw-${i}-${k}"><input data-comp-kw="${i}:${k}" data-comp-group="keywords-${r.asin}" value="${esc(row[k])}" aria-label="${{word:'核心关键词',count:'搜索竞品数量（核心词下）',volume:'核心关键词搜索量（月）'}[k]}" aria-required="true" ${readOnly?'disabled':''}></td>`).join('')}<td><button class="link danger market-write" data-comp-keyword-delete="${i}" ${readOnly?'hidden':''}>删除</button></td></tr>`).join('')}</tbody></table><button type="button" class="btn primary market-write" data-comp-keyword-add ${readOnly?'hidden':''}>＋ 添加关键词</button></div>`;}
function renderCompDetail(){
 const c=ensureCompetitorState(),r=c.items.find(r=>r.asin===c.active),target=$('#compDetail');if(!target)return;
 if(!r){target.innerHTML='<div class="comp-detail-empty">请选择或添加竞品</div>';refreshCompFoldControl();return;}
 const overview=`<div class="comp-product-overview"><div class="comp-overview-image">${r.image?`<img loading="lazy" decoding="async" src="${esc(compImage(r.image))}" alt="${esc(r.name)}">${!r.systemImage?`<button type="button" class="link market-write" data-comp-product-upload ${readOnly?'hidden':''}>重新上传</button>`:''}`:readOnly?'<span>暂无图片</span>':`<button type="button" class="comp-product-empty-upload market-write" data-comp-product-upload aria-label="上传商品图片"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 16 5-5 5 5 4-4 4 4M15 7h4M17 5v4"/></svg><span>上传图片</span></button>`}</div><div class="comp-overview-copy">${compControl(r,'name','产品名称')}<div class="comp-original-title">英文名：${r.english?esc(r.english):'—'}</div><div class="comp-original-title comp-category-path">品类：${esc(compCategoryPath(r))}</div>${compMismatchHtml(r)}</div></div>`;
 const base=overview+`<div class="comp-form-grid">${['date','rating','reviews','price','sales','bsr'].map(key=>compFieldDefinitions.find(d=>d[0]===key)).map(([k,l,t])=>compControl(r,k,l,t)).join('')}${compControl(r,'specs','产品规格 / 尺寸','textarea')}</div>`;
 const feedback=compControl(r,'selling','核心卖点','textarea')+`<div class="comp-feedback-group">${compControl(r,'negative','核心差评点','textarea').replace('</textarea></div></div>','</textarea>')}<div class="comp-feedback-images"><div class="comp-feedback-tools"><span>用户反馈图片（最多3张）</span><button type="button" class="btn primary market-write" data-comp-feedback-upload ${readOnly?'hidden':''} ${r.feedback.length>=3?'disabled':''}>上传图片</button></div><div class="comp-feedback-thumbs">${r.feedback.map((img,i)=>`<div class="comp-feedback-thumb"><img loading="lazy" decoding="async" src="${esc(compImage(img.src))}" alt="用户反馈图片"><button type="button" class="category-image-delete market-write" data-comp-feedback-delete="${i}" aria-label="删除用户反馈图片" ${readOnly?'hidden':''}>×</button></div>`).join('')||'<span class="comp-no-feedback">暂无图片</span>'}</div></div></div></div></div>`;
 target.innerHTML=compModule('base','竞品基础及市场数据',base,r)+compModule('keywords','关键词及搜索数据',renderCompKeywords(r),r)+compModule('feedback','产品卖点与用户反馈',feedback,r)+compModule('advice','开发建议',compControl(r,'direction','差异化开发方向','textarea')+compControl(r,'remark','备注','textarea',true).replace('<textarea id="ci-remark"','<textarea placeholder="采购注意事项、利润优化建议等" id="ci-remark"'),r);
 refreshCompFoldControl();refreshCompScope();
}
function setCompPositionCollapsed(collapsed){
 collapsed?compFolded.add('position'):compFolded.delete('position');
 $('.comp-position')?.classList.toggle('is-collapsed',collapsed);
 $('[data-comp-position-toggle]')?.setAttribute('aria-expanded',String(!collapsed));refreshCompFoldControl();
}
function refreshCompFoldControl(){
 const button=$('#toggleCompetitorItems');if(!button)return;
 const active=ensureCompetitorState().active,collapsed=$('#competitorAnalysisBlock')?.classList.contains('module-collapsed')||compFolded.has('position')&&(!active||['base','keywords','feedback','advice'].every(k=>compFolded.has(k+'-'+active)));
 button.textContent=collapsed?'全部展开':'全部收起';button.disabled=false;
 button.setAttribute('aria-expanded',String(!collapsed));
}
function renderCompetitors(){
 const c=ensureCompetitorState(),root=$('#competitors');
 root.innerHTML=`<section class="comp-position ${compFolded.has('position')?'is-collapsed':''}"><div class="comp-position-head"><h4><button type="button" class="analysis-fold-title" data-comp-position-toggle aria-expanded="${!compFolded.has('position')}"><span class="analysis-fold-chevron" aria-hidden="true">›</span>竞品市场定位</button></h4>${compProgressHtml('position')}</div><div class="comp-position-grid">${compPositionDefinitions.map(([key,label])=>`<div id="cp-${key}"><label for="position-${key}">${label} <span class="required">*</span></label><textarea id="position-${key}" placeholder="${esc(compPositionPlaceholders[key])}" data-comp-position="${key}" data-comp-group="position" aria-required="true" ${readOnly?'disabled':''}>${esc(c.position[key])}</textarea></div>`).join('')}</div></section><div class="comp-workspace"><aside class="comp-sidebar"><div class="comp-sidebar-head"><strong>竞品列表</strong><button class="btn primary market-write" id="selectCompetitors" ${readOnly?'hidden':''}>＋ 添加竞品</button></div><input id="compSearch" type="search" placeholder="搜索ASIN / 产品名称" value="${esc(compQuery)}" aria-label="搜索ASIN或产品名称"><div id="compList"></div></aside><div class="comp-detail" id="compDetail"></div></div>`;
 renderCompList();renderCompDetail();
 const head=$('#competitorCount').closest('.sub-head');
 if(!$('#toggleCompetitorItems'))head.insertAdjacentHTML('beforeend','<button type="button" class="btn" id="toggleCompetitorItems">全部收起</button>');
 $('#toggleCompetitorItems').onclick=()=>{const current=ensureCompetitorState().active;const groups=['position',...(current?['base','keywords','feedback','advice'].map(k=>k+'-'+current):[])];const collapse=!$('#competitorAnalysisBlock')?.classList.contains('module-collapsed')&&groups.some(group=>!compFolded.has(group));expandAnalysisModule('competitorAnalysisBlock');groups.forEach(group=>collapse?compFolded.add(group):compFolded.delete(group));setCompPositionCollapsed(collapse);renderCompDetail();};
 refreshCompFoldControl();
 root.querySelector('#selectCompetitors').onclick=chooseCompetitors;
 root.querySelector('#compSearch').oninput=e=>{compQuery=e.target.value;renderCompList();};
 if(!root.dataset.bound){root.dataset.bound='true';root.addEventListener('input',compInput);root.addEventListener('focusout',compBlur);root.addEventListener('click',compClick);root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.competitor-list-item')){e.preventDefault();selectComp(e.target.dataset.compSelect);}});}
 syncReadOnly();$('#compSearch').disabled=false;
}
function selectComp(asin){ensureCompetitorState().active=asin;persist();renderCompList();renderCompDetail();}
function compInput(e){
 const el=e.target,c=ensureCompetitorState(),r=c.items.find(r=>r.asin===c.active);if(readOnly)return;
 if(el.dataset.compPosition)c.position[el.dataset.compPosition]=el.value;
 else if(el.dataset.cfield&&r){r[el.dataset.cfield]=el.value;if(el.type==='date')el.classList.toggle('is-empty-date',!el.value);}
 else if(el.dataset.compKw&&r){const [i,k]=el.dataset.compKw.split(':');r.keywords[i][k]=el.value;}
 else return;
 refreshCompProgress();dirtyComp(el.dataset.compGroup);el.closest('.invalid')?.classList.remove('invalid');el.closest('.comp-form-field,td,[id^="cp-"]')?.querySelector('.field-error')?.remove();renderCompList();
}
function compBlur(e){if(e.target.dataset.compGroup&&!readOnly)saveComp(e.target.dataset.compGroup);}
// Local prototype of idempotent task-reference and selection-pool association.
function linkDirectCompAsin(asin){
 const key=m.site+':'+asin;m.asinPool ||= {};
 let reference=refs.find(r=>r.asin===asin);
 const pool=m.asinPool[key],known=pool||refData.find(r=>r.asin===asin),draft=ensureCompetitorState().items.find(r=>r.asin===asin);
 if(!reference){
  reference=known?structuredClone(known):{asin,title:draft?.name||'',img:draft?.image?.replace(/^assets\//,'')||'',price:draft?.price||'',rating:draft?.rating||'',reviews:draft?.reviews||'',sales:draft?.sales||'',date:draft?.date||'',category:'',targetQty:0,targetRange:null,zeroPrice:0,status:'pending',sourcingAt:''};
  refs.push(reference);
 }
 if(!pool)m.asinPool[key]=structuredClone({...reference,site:m.site});
 return reference;
}
function reconcileCompetitorReferences(){
 if(activeHistoryTask)return;
 const missing=ensureCompetitorState().items.filter(r=>!refs.some(ref=>ref.asin===r.asin));
 if(missing.length){missing.forEach(r=>linkDirectCompAsin(r.asin));persist();}
}
function chooseCompetitors(){
 if(readOnly)return;const c=ensureCompetitorState();let mode='reference';
 const dlg=openDialog('添加竞品',`<div class="comp-add-tabs" role="tablist" aria-label="添加方式"><button type="button" role="tab" aria-selected="true" aria-controls="compAddReferences" id="compAddRefTab" data-add-mode="reference" class="is-active">从参考产品选择</button><button type="button" role="tab" aria-selected="false" aria-controls="compAddDirect" id="compAddDirectTab" data-add-mode="direct">直接添加ASIN</button></div><div id="compAddReferences" role="tabpanel" aria-labelledby="compAddRefTab"><input type="search" id="compAddReferenceSearch" class="comp-add-search" placeholder="搜索ASIN / 产品名称" aria-label="搜索参考产品ASIN或产品名称" autocomplete="off"><div class="comp-add-reference-list" id="compAddReferenceList">${refs.map(r=>`<label data-reference-search="${esc((r.asin+' '+(r.title||'')).toLowerCase())}" class="comp-add-option ${c.items.some(x=>x.asin===r.asin)?'is-added':''}"><input type="checkbox" data-comp-ref="${r.asin}" ${c.items.some(x=>x.asin===r.asin)?'checked disabled':''}><span><strong>${esc(r.asin)}</strong><span class="comp-add-product-name">${esc(r.title||'未填写产品名称')}</span></span>${c.items.some(x=>x.asin===r.asin)?'<span class="comp-add-existing">已添加</span>':''}</label>`).join('')}<div class="comp-add-empty" id="compAddSearchEmpty" ${refs.length?'hidden':''}>${refs.length?'未找到匹配的参考产品':'暂无参考产品'}</div></div></div><div id="compAddDirect" role="tabpanel" aria-labelledby="compAddDirectTab" hidden><div class="comp-add-direct"><label for="directCompAsin">ASIN <span class="required">*</span></label><input id="directCompAsin" maxlength="10" autocomplete="off" placeholder="请输入10位ASIN"></div></div><div class="field-error" id="compAddError" role="alert"></div>`,`<button type="button" class="btn" data-comp-add-cancel>取消</button><button type="button" class="btn primary" data-comp-add-confirm disabled>确认添加</button>`,'comp-add-dialog');
 const confirm=dlg.querySelector('[data-comp-add-confirm]'),input=dlg.querySelector('#directCompAsin');
 const selected=()=>[...dlg.querySelectorAll('[data-comp-ref]')].filter(e=>e.checked&&!e.disabled).map(e=>e.dataset.compRef);
 const update=()=>{confirm.disabled=mode==='reference'?!selected().length:!input.value.trim();dlg.querySelector('#compAddError').textContent='';};
 dlg.querySelector('[data-comp-add-cancel]').onclick=()=>close(dlg);
 dlg.querySelectorAll('[data-comp-ref]').forEach(el=>el.onchange=update);
 input.oninput=update;
 const search=dlg.querySelector('#compAddReferenceSearch');
 search.oninput=()=>{const query=search.value.trim().toLowerCase();let count=0;dlg.querySelectorAll('[data-reference-search]').forEach(option=>{option.hidden=!option.dataset.referenceSearch.includes(query);if(!option.hidden)count++;});dlg.querySelector('#compAddSearchEmpty').hidden=count>0;};
 search.addEventListener('search',search.oninput);
 dlg.querySelectorAll('[data-add-mode]').forEach(button=>button.onclick=()=>{mode=button.dataset.addMode;dlg.querySelectorAll('[data-add-mode]').forEach(tab=>{tab.classList.toggle('is-active',tab===button);tab.setAttribute('aria-selected',String(tab===button));});dlg.querySelector('#compAddReferences').hidden=mode!=='reference';dlg.querySelector('#compAddDirect').hidden=mode!=='direct';update();if(mode==='direct')input.focus();});
 confirm.onclick=()=>{
  const asins=mode==='reference'?selected():[input.value.trim().toUpperCase()];
  if(!asins.length)return;
  if(mode==='direct'&&!/^[A-Z0-9]{10}$/.test(asins[0])){dlg.querySelector('#compAddError').textContent='请输入有效的10位ASIN';input.focus();return;}
  const snapshot={items:structuredClone(c.items),active:c.active,refs:structuredClone(refs),pool:structuredClone(m.asinPool||{}),query:compQuery};
  asins.forEach(asin=>{if(mode==='direct')linkDirectCompAsin(asin);if(!c.items.some(r=>r.asin===asin))c.items.push(makeCompRecord(asin,mode==='direct'?'manual':'reference'));});
  c.active=asins[0];m.selected=c.items.map(r=>r.asin);compQuery='';
  if(!persist()){c.items=snapshot.items;c.active=snapshot.active;m.selected=c.items.map(r=>r.asin);refs.splice(0,refs.length,...snapshot.refs);m.asinPool=snapshot.pool;compQuery=snapshot.query;dlg.querySelector('#compAddError').textContent='保存失败，请重试';return;}
  renderCompetitors();renderRefs();close(dlg);
 };
}
function uploadCompImages(r,product=false){
 if(readOnly)return;
 if(!product&&r.feedback.length>=3){showToast('用户反馈图片最多上传3张','error');return;}
 const input=document.createElement('input');input.type='file';input.accept='image/*';input.multiple=!product;
 input.onchange=async()=>{
  const files=[...input.files].filter(file=>{if(file.type.startsWith('image/'))return true;showToast('请选择图片文件','error');return false;});
  const remaining=product?1:Math.max(0,3-r.feedback.length);
  if(!product&&files.length>remaining)showToast('用户反馈图片最多上传3张，已保留可上传的图片','error');
  for(const file of files.slice(0,remaining)){
   try{const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});if(product)r.image=src;else if(r.feedback.length<3)r.feedback.push({src,alt:file.name});}
   catch{showToast('图片上传失败，请重试','error');}
  }
  compSaveStates[(product?'base-':'feedback-')+r.asin]=persist()?'saved':'error';renderCompDetail();renderCompList();
 };input.click();
}
function compClick(e){
 const el=e.target.closest('button,[data-comp-select]');if(!el)return;const c=ensureCompetitorState(),r=c.items.find(r=>r.asin===c.active);
 if(e.target.closest('a'))return;
 if(el.hasAttribute('data-comp-position-toggle')){setCompPositionCollapsed(!compFolded.has('position'));return;}
 if(el.dataset.compFold){const group=el.dataset.compFold;compFolded.has(group)?compFolded.delete(group):compFolded.add(group);renderCompDetail();return;}
 if(el.dataset.compSelect){selectComp(el.dataset.compSelect);return;}
 if(readOnly)return;
 if(el.dataset.compRetry){saveComp(el.dataset.compRetry);return;}
 if(el.dataset.compDelete){const a=el.dataset.compDelete;const dlg=openDialog('删除竞品分析',`<p class="comp-delete-warning"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 3.8a2 2 0 0 1 3.4 0l8 13.7a2 2 0 0 1-1.7 3H4a2 2 0 0 1-1.7-3z" fill="currentColor"/><path d="M12 8v5" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16.5" r="1" fill="white"/></svg><span>确定删除 ${esc(a)} 的竞品分析？</span></p>`,`<button class="btn" data-comp-delete-cancel>取消</button><button class="btn primary" data-comp-delete-confirm>确定删除</button>`);dlg.querySelector('[data-comp-delete-cancel]').onclick=()=>close(dlg);dlg.querySelector('[data-comp-delete-confirm]').onclick=()=>{c.items=c.items.filter(r=>r.asin!==a);m.selected=c.items.map(r=>r.asin);persist();renderCompetitors();renderRefs();close(dlg);};return;}
 if(!r)return;
 if(el.hasAttribute('data-comp-keyword-add')){r.keywords.push({word:'',count:'',volume:''});persist();renderCompDetail();renderCompList();}
 if(el.hasAttribute('data-comp-keyword-delete')){r.keywords.splice(+el.dataset.compKeywordDelete,1);persist();renderCompDetail();renderCompList();}
 if(el.hasAttribute('data-comp-feedback-upload'))uploadCompImages(r);
 if(el.hasAttribute('data-comp-product-upload'))uploadCompImages(r,true);
 if(el.hasAttribute('data-comp-feedback-delete')){r.feedback.splice(+el.dataset.compFeedbackDelete,1);compSaveStates['feedback-'+r.asin]=persist()?'saved':'error';renderCompDetail();}
}
function validateCompetitorAnalysis(){
 const c=ensureCompetitorState(),errors=[];
 compPositionDefinitions.forEach(([key,label])=>{if(!c.position[key].trim()){setCompPositionCollapsed(false);errors.push(validationError($('#cp-'+key),'请填写'+label));}});
 if(!c.items.length){errors.push(validationError($('.comp-sidebar'),'请至少添加一个竞品'));return errors;}
 const bad=c.items.find(r=>compMissing(r).length);if(bad){compQuery='';c.active=bad.asin;compFolded.clear();setCompPositionCollapsed(false);$('#compSearch').value='';renderCompList();renderCompDetail();compMissing(bad).forEach(({key,message})=>{const node=$('#cf-'+key);if(node&&!node.classList.contains('invalid'))errors.push(validationError(node,message));});}
 if(!errors.length&&!persist())errors.push(validationError($('#compDetail'),'内容保存失败，请重试后提交'));
 return errors;
}
function reportValue(value,required=true){const text=String(value??'').trim();return text&&!['--','—','-'].includes(text)?esc(text):`<span class="report-missing">${required?'待完善':'无'}</span>`;}
function reportImageHtml(image,required=true,alt='图片'){const src=typeof image==='string'?image:image?.src;return src?`<img loading="lazy" decoding="async" src="${esc(!src.includes('/')&&!src.startsWith('data:')?asset(src):compImage(src))}" alt="${esc(image?.alt||alt)}">`:reportValue('',required);}
function reportImageList(images,required=true,alt='图片'){return images?.length?`<div class="report-images">${images.map(img=>reportImageHtml(img,required,alt)).join('')}</div>`:reportValue('',required);}
function reportPairs(fields){const rows=[];for(let i=0;i<fields.length;i+=2){const pair=fields.slice(i,i+2);rows.push(`<tr>${pair.length===1?`<th scope="row">${esc(pair[0][0])}</th><td colspan="3">${pair[0][1]}</td>`:pair.map(([label,value])=>`<th scope="row">${esc(label)}</th><td>${value}</td>`).join('')}</tr>`);}return `<table class="report-facts"><colgroup><col class="report-label-col"><col><col class="report-label-col"><col></colgroup><tbody>${rows.join('')}</tbody></table>`;}

function reportLongText(title,value,required=true){return `<div class="report-text-block"><h4>${esc(title)}</h4><div class="comp-report-text">${reportValue(value,required)}</div></div>`;}
function categoryReportHtml(dims,rankings){return rankingReportHtml(rankings)+source.dimensions.map((d,i)=>{const parts=dimensionParts(dims[i]);return `<article class="report-analysis"><h3>${i+1}. ${esc(d.title)}</h3><div class="report-rich comp-report-text">${reportValue(parts.text)}</div>${i<6?`<div class="report-analysis-image">${reportImageList(parts.images,true,'分析图片')}</div>`:''}</article>`;}).join('');}
function competitorReportHtml(){const c=ensureCompetitorState();return `<section class="report-position"><h3>竞品市场定位</h3>${compPositionDefinitions.map(([k,l])=>reportLongText(l,c.position[k])).join('')}</section>${c.items.length?c.items.map((r,i)=>{
 const basic=[['产品名称',reportValue(r.name)+`<div class="report-english-name">${reportValue(r.english)}</div>`],['产品图片',reportImageHtml(r.image,true,'竞品产品图片')],...['date','rating','reviews','price','sales','bsr'].map(key=>{const [,label]=compFieldDefinitions.find(d=>d[0]===key);return [label,reportValue(r[key])];}),['产品规格 / 尺寸',reportValue(r.specs)]];
 const keywords=(r.keywords||[]).filter(row=>[row.word,row.count,row.volume].some(v=>String(v??'').trim()));
 return `<article class="report-competitor"><h3>${i+1}. ASIN：${reportValue(r.asin)}</h3><h4>基本数据</h4>${reportPairs(basic)}<h4>关键词及搜索数据</h4><div class="report-table-wrap"><table class="report-keywords"><thead><tr><th>核心关键词（英文）</th><th>搜索竞品数量（核心词下）</th><th>核心关键词搜索量（月）</th></tr></thead><tbody>${keywords.length?keywords.map(row=>`<tr><td>${reportValue(row.word)}</td><td>${reportValue(row.count)}</td><td>${reportValue(row.volume)}</td></tr>`).join(''):'<tr><td colspan="3">'+reportValue('')+'</td></tr>'}</tbody></table></div>${reportLongText('核心卖点',r.selling)}${reportLongText('核心差评点',r.negative)}<div class="report-text-block"><h4>用户反馈图片</h4>${reportImageList(r.feedback,false,'用户反馈图片')}</div>${reportLongText('差异化开发方向',r.direction)}${reportLongText('备注',r.remark,false)}</article>`;
 }).join(''):`<p>${reportValue('')}</p>`}`;}
function pendingProductsReportHtml(){return products.length?products.map((p,i)=>{
 const offer=candidates.find(c=>c.id===p.offerId),link=p.purchaseLink??(p.url||offer?.promotionURL||(p.offerId?offerUrl(p.offerId):''));
 const fields=[['SPU',reportValue(p.spu)],['产品标题',reportValue(p.title)],['系统品类',reportValue(p.category)],['供应商名称',reportValue(p.supplier)],['产品图片',reportImageHtml(p.img,true,'SPU产品图片')],['采购链接',reportValue(link,false)],['采购备注',reportValue(p.purchaseNotes)],['海运-多渠道利润测算（OP）',reportImageList(p.opImages,true,'利润测算截图')]];
 return `<article class="report-product"><h3>${i+1}. ${esc(p.spu||'待完善')} · ${esc(p.title||'待完善')}</h3><h4>SPU概要</h4>${reportPairs(fields)}<h4>SKU明细（${p.skus?.length||0}个）</h4><div class="report-table-wrap"><table class="report-skus"><thead><tr>${['SKU','产品标题','产品图片','参考产品','采购价 (CNY)','预计售价区间 (USD)','起订量','包装尺寸长×宽×高 (cm)','包装重量 (kg)','配件搭配清单'].map(t=>`<th>${t}</th>`).join('')}</tr></thead><tbody>${p.skus?.length?p.skus.map(sku=>`<tr><td>${reportValue(sku.sku)}</td><td>${reportValue(sku.variantTitle||p.title)}</td><td>${reportImageHtml(sku.img||p.img,true,'SKU产品图片')}</td><td>${reportValue(sku.reference||p.asin)}<br>${reportValue(sku.referenceType)}</td><td>${reportValue(sku.price===null||sku.price===undefined||sku.price===''?'':Number.isFinite(Number(sku.price))?Number(sku.price).toFixed(2):sku.price)}</td><td>${reportValue(String(sku.sale||'').replace(/\s*USD/gi,''))}</td><td>${reportValue(sku.moq)}</td><td>${reportValue(sku.pack,false)}</td><td>${reportValue(sku.weight,false)}</td><td>${reportValue(sku.accessoryList??sku.packagingList??sku.competitor)}</td></tr>`).join(''):'<tr><td colspan="10">'+reportValue('')+'</td></tr>'}</tbody></table></div></article>`;
 }).join(''):`<p>${reportValue('')}</p>`;}


function renderDimensions(){
 m.dims=m.dims.map(normalizeSingleCategoryImage);
 renderRankings();
 $('#dimensions').innerHTML=source.dimensions.map((_,i)=>dimensionCard(i)).join('');
 const categoryHead=document.querySelector('#categoryAnalysisBlock > .sub-head')||document.querySelector('#marketSection > .sub-head');
 if(categoryHead&&!$('#toggleCategoryItems')){const tools=document.createElement('div');tools.className='category-head-tools';tools.innerHTML='<span class="subtle" id="categoryProgress"></span><button type="button" class="btn" id="toggleCategoryItems">全部收起</button>';categoryHead.append(tools);}
 $('#marketSite').value=m.site;$('#marketLevel').value=m.categoryLevel||'3';$('#marketCategory').value=m.category;renderCategoryPath();refreshCategoryControls();scheduleCategorySize();source.dimensions.forEach((_,i)=>refreshCategoryStatus(i));if(!categoryInitialSavingScheduled){categoryInitialSavingScheduled=true;if(categorySaveStates[3]==='saving')setTimeout(()=>saveCategoryItem(3),1000);}
}
function renderCategoryPath(){refreshCompScope();updateCategoryReuseAvailability();}
function renderChannels(){}
function syncReadOnly(){document.querySelectorAll('#marketSection .editor').forEach(e=>e.contentEditable=String(!readOnly));document.querySelectorAll('#marketSection input,#marketSection select,#marketSection textarea,.channel-fields input').forEach(e=>e.disabled=readOnly);document.querySelectorAll('.market-write').forEach(e=>e.hidden=readOnly);if($('#compSearch'))$('#compSearch').disabled=false;$('#marketSection').classList.toggle('market-locked',readOnly);updateCategoryReuseAvailability();}
function setVisibility(){const stage=$('#workflowState').value;isVisible=stage==='unassigned'?false:stage==='research'?m.dept==='xingqu':m.frozenVisibility;readOnly=stage!=='research'||$('#currentUser').value!=='developer';$('#marketSection').hidden=!isVisible;$('#marketJump').hidden=!isVisible;$('#previewReport').hidden=!isVisible;$('#preprojectLink').hidden=!isVisible;$('#previewInline').hidden=!isVisible;$('#submitTask').hidden=readOnly;$('#openReview').hidden=!['review','done','terminated'].includes(stage);$('#taskStatusTag').textContent=({research:'调研中',unassigned:'待分配',review:'审核中',done:'已完成',terminated:'已终止'})[stage];$('#taskStatusTag').className='tag '+(stage==='research'?'blue':'orange');syncReadOnly();}
const originalWorkflow=applyWorkflow;
applyWorkflow=function(){originalWorkflow();setVisibility();renderChannels();$('#readonlyNote').style.display=readOnly?'block':'none';$('#readonlyNote').textContent=$('#workflowState').value==='research'?'当前为查看视图，内容只读。':'当前任务为只读状态。';};
$('#workflowState').onchange=()=>{if(m.stage==='research')m.frozenVisibility=m.dept==='xingqu';m.stage=$('#workflowState').value;persist();applyWorkflow();};
$('#developerDept').onchange=()=>{m.dept=$('#developerDept').value;persist();setVisibility();showToast(m.stage==='research'?(isVisible?'已展示市场分析，保留原有内容':'已隐藏市场分析，已填写数据保留'):'当前状态沿用调研结束时快照，不动态调整展示');};
$('#taskOrigin').onchange=()=>{m.origin=$('#taskOrigin').value;persist();showToast('任务来源已切换，市场分析展示范围不受影响');};
$('#currentUser').onchange=applyWorkflow;
// Reference product facts are the single source of ASIN identity and basic metrics.
renderRefs=function(){$('#referenceSection thead').innerHTML='<tr><th><input id="refAll" type="checkbox"></th><th>ASIN</th><th>图片</th><th style="min-width:210px">产品标题</th><th>平台 / 站点</th><th>Amazon品类</th><th>售价</th><th>近30天销量</th><th>评分 / 评分数</th><th>目标采购量</th><th>目标采购价</th><th>1688溯源</th><th>操作</th></tr>';
$('#referenceBody').innerHTML=refs.map(r=>`<tr><td><input type="checkbox" class="ref-check" ${canWrite()?'':'disabled'}></td><td><a class="external-link" href="${amazonUrl(r.asin)}" target="_blank" rel="noopener">${esc(r.asin)} ↗</a>${m.selected.includes(r.asin)?'<br><span class="tag teal">已分析</span>':''}</td><td><div class="thumb">${r.img?`<img loading="lazy" decoding="async" src="${asset(r.img)}" alt="${esc(r.title)}">`:'<span class="subtle">暂无图片</span>'}</div></td><td class="left">${esc(r.title)}</td><td>Amazon / ${esc(m.site)}</td><td>${esc(r.category)}</td><td>$${esc(r.price||'--')}</td><td>${esc(r.sales||'--')}</td><td>${esc(r.rating||'--')} / ${esc(r.reviews||'--')}</td><td>${r.targetQty||200}</td><td>${targetText(r)}</td><td><span class="tag ${statusClass(r)}">${statusText(r)}</span><br>${countFor(r.asin)} 条</td><td><button class="link" data-view-source="${r.asin}">查看货源</button>${canWrite()?`<br><button class="link danger" data-delete-ref="${r.asin}">删除</button>`:''}</td></tr>`).join('');$('#refTotal').textContent=`共 ${refs.length} 条`;$('#refPages').innerHTML='<button class="page-btn active">1</button>';$('#refPrev').disabled=true;$('#refNext').disabled=true;$('#refAll').disabled=!canWrite();$('#refAll').onchange=e=>$$('.ref-check').forEach(c=>c.checked=e.target.checked);};
const originalDeleteRef=deleteReference;
deleteReference=function(a){if(m.selected.includes(a))return showToast('该ASIN正在进行竞品分析，请先从市场分析中移除','error');originalDeleteRef(a);persist();};
const origRenderProducts=renderProducts;renderProducts=function(){origRenderProducts();renderChannels();};
// Additional SPU fields remain staged in the existing product dialog until confirmation.
let pendingOpImages=[],pendingEditSession=0;
function renderPendingOpImages(){
 $('#editOpImages').innerHTML=pendingOpImages.map((img,i)=>`<div class="pending-op-thumb"><img loading="lazy" decoding="async" src="${esc(img.src.startsWith('assets/')?asset(img.src.slice(7)):img.src)}" alt="海运-多渠道利润测算（OP）截图"><button type="button" class="pending-op-delete" data-op-delete="${i}" aria-label="删除测算截图">×</button></div>`).join('');
}
function clearPendingRequiredError(field){if(!field)return;field.classList.remove('pending-field-invalid');field.querySelectorAll('.pending-required-error').forEach(el=>el.remove());field.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));}
function pendingNumberError(input){
 const value=input.value.trim(),integer=input.dataset.pendingNumber==='integer';
 if(input.validity?.badInput)return integer?'请输入非负整数':'请输入非负数字，最多保留两位小数';
 if(!value)return ['price','moq'].includes(input.dataset.field)?(input.dataset.field==='price'?'请填写采购价':'请填写起订量'):'';
 return (integer?/^\d+$/:/^\d+(?:\.\d{1,2})?$/).test(value)&&Number.isFinite(Number(value))?'':integer?'请输入非负整数':'请输入非负数字，最多保留两位小数';
}
function checkPendingNumber(input,format=false){
 const field=input.closest('td');clearPendingRequiredError(field);const message=pendingNumberError(input);
 if(message){field.classList.add('pending-field-invalid');input.setAttribute('aria-invalid','true');field.insertAdjacentHTML('beforeend',`<div class="inline-error pending-required-error">${esc(message)}</div>`);return false;}
 if(format&&input.value.trim())input.value=input.dataset.pendingNumber==='integer'?String(Number(input.value)):Number(input.value).toFixed(2);
 return true;
}
$('#editVariantBody').addEventListener('focusout',e=>{if(e.target.matches('[data-pending-number]')&&(e.target.value.trim()||e.target.validity?.badInput))checkPendingNumber(e.target,true);});
$('#editVariantBody').addEventListener('input',e=>{if(e.target.matches('[data-pending-number]')&&e.target.closest('td').classList.contains('pending-field-invalid'))checkPendingNumber(e.target);});
function validatePendingRequiredFields(){
 $$('#editModal .pending-field-invalid').forEach(clearPendingRequiredError);const errors=[];
 const flag=(field,control,message)=>{field.classList.add('pending-field-invalid');control?.setAttribute('aria-invalid','true');field.insertAdjacentHTML('beforeend',`<div class="inline-error pending-required-error">${esc(message)}</div>`);errors.push(control||field);};
 if(!$('#editPurchaseNotes').value.trim())flag($('#editPurchaseNotes').closest('.pending-basic-field'),$('#editPurchaseNotes'),'请填写采购备注');
 if(!pendingOpImages.length)flag($('#uploadOpImage').closest('.pending-basic-field'),$('#uploadOpImage'),'请上传海运-多渠道利润测算（OP）截图');
 $$('#editVariantBody [data-field="competitor"]').forEach(input=>{if(!input.value.trim())flag(input.closest('td'),input,'请填写配件搭配清单');});
 $$('#editVariantBody [data-pending-number]').forEach(input=>{const message=pendingNumberError(input);if(message)flag(input.closest('td'),input,message);});
 if(errors.length){showToast('请补全待开发产品必填信息','error');errors[0].scrollIntoView({behavior:'smooth',block:'center'});errors[0].focus();return false;}return true;
}
$('#editPurchaseNotes').addEventListener('input',e=>{if(e.target.value.trim())clearPendingRequiredError(e.target.closest('.pending-basic-field'));});
$('#editVariantBody').addEventListener('input',e=>{if(e.target.matches('[data-field="competitor"]')&&e.target.value.trim())clearPendingRequiredError(e.target.closest('td'));});
const originalOpenPendingProduct=openEdit;
openEdit=function(id){
 pendingEditSession++;$$('#editModal .pending-field-invalid').forEach(clearPendingRequiredError);
 if(products.some(p=>p.spu===id||p.skus.some(s=>s.sku===id)))newPendingProduct=null;
 originalOpenPendingProduct(id);
 const p=products.find(p=>p.spu===editingSpu)||newPendingProduct;if(!p)return;
 const offer=candidates.find(c=>c.id===p.offerId);
 $('#editModal .modal-title').textContent=p===newPendingProduct?'新增待开发产品':'编辑待开发产品';
 $('#editPurchaseLink').value=p.purchaseLink??(p.url||offer?.promotionURL||(p.offerId?offerUrl(p.offerId):''));
 $('#editPurchaseNotes').value=p.purchaseNotes||'';
 pendingOpImages=structuredClone(p.opImages||[]);renderPendingOpImages();$('#editOpImageFile').value='';
 $('#editImage').hidden=!p.img;$('#changeImage').classList.toggle('has-image',!!p.img);
 $$('#editVariantBody .edit-variant-image').forEach(img=>img.hidden=!img.dataset.variantImage);
};
$('#addPendingProduct').onclick=()=>{
 if(!canWrite())return;
 let seq=products.length+1;while(products.some(p=>p.spu==='SPU2610'+String(seq).padStart(4,'0')))seq++;
 const spu='SPU2610'+String(seq).padStart(4,'0'),offer=[...selected].map(id=>candidates.find(c=>c.id===id)).find(Boolean);
 newPendingProduct={spu,pendingProductId:'PEND-'+spu,offerId:offer?.id||'',asin:offer?.asin||'',url:offer?.promotionURL||(offer?offerUrl(offer.id):''),img:offer?.img||'',title:offer?.title||'',supplier:offer?.supplier||suppliers[0]?.name||'',category:'',source:'手动添加',skus:[{sku:spu+'-01',variantTitle:offer?.title||'',variantSpec:'',img:offer?.img||'',referenceType:'',price:offer?.price||0,moq:offer?.moq||'',pack:offer?.pack||'',weight:offer?.weight||'',sale:'',competitor:'',needsMaintenance:true}]};
 openEdit(spu);
};
$('#uploadOpImage').onclick=()=>$('#editOpImageFile').click();
$('#editOpImageFile').onchange=async e=>{
 const session=pendingEditSession;
 for(const file of [...e.target.files]){
  if(!file.type.startsWith('image/')){showToast('请选择图片文件','error');continue;}
  try{const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});if(session!==pendingEditSession||!$('#editModal').classList.contains('open'))return;pendingOpImages.push({src,alt:file.name});}
  catch{showToast('图片上传失败，请重试','error');}
 }
 renderPendingOpImages();if(pendingOpImages.length)clearPendingRequiredError($('#uploadOpImage').closest('.pending-basic-field'));e.target.value='';
};
$('#editOpImages').onclick=e=>{const button=e.target.closest('[data-op-delete]');if(button){pendingOpImages.splice(Number(button.dataset.opDelete),1);renderPendingOpImages();}};
const originalPendingImageChange=$('#editImageFile').onchange;
$('#editImageFile').onchange=e=>{originalPendingImageChange(e);if(e.target.files?.length){$('#editImage').hidden=false;$('#changeImage').classList.add('has-image');$$('#editVariantBody .edit-variant-image').forEach(img=>img.hidden=false);}};
// Reuse the AC question-mark badge; popovers work on hover, keyboard focus and click.
$('#uploadOpImage').after($('#editOpImages'));
const pendingHelpPopover=document.createElement('div');pendingHelpPopover.id='pendingHelpPopover';pendingHelpPopover.className='pending-help-popover';pendingHelpPopover.setAttribute('role','tooltip');pendingHelpPopover.hidden=true;document.body.append(pendingHelpPopover);
let pendingHelpAnchor=null,pendingHelpPinned=false;
function closePendingHelp(){pendingHelpPopover.hidden=true;pendingHelpAnchor?.setAttribute('aria-expanded','false');pendingHelpAnchor?.removeAttribute('aria-describedby');pendingHelpAnchor=null;pendingHelpPinned=false;}
function showPendingHelp(button,pinned=false){
 const text=button.dataset.pendingHelp;if(!text)return;
 if(pendingHelpAnchor!==button)pendingHelpAnchor?.setAttribute('aria-expanded','false');
 pendingHelpAnchor=button;pendingHelpPinned=pinned;pendingHelpPopover.textContent=text;pendingHelpPopover.hidden=false;
 button.setAttribute('aria-expanded','true');button.setAttribute('aria-describedby',pendingHelpPopover.id);
 const rect=button.getBoundingClientRect();pendingHelpPopover.style.left=Math.max(8,Math.min(rect.left-140,window.innerWidth-336))+'px';pendingHelpPopover.style.top=(rect.bottom+8)+'px';
}
document.addEventListener('mouseover',e=>{const button=e.target.closest('.pending-help-icon');if(button&&!pendingHelpPinned)showPendingHelp(button);});
document.addEventListener('mouseout',e=>{if(!pendingHelpPinned&&e.target.closest('.pending-help-icon')&&!e.relatedTarget?.closest('.pending-help-icon,#pendingHelpPopover'))closePendingHelp();});
pendingHelpPopover.addEventListener('mouseleave',()=>{if(!pendingHelpPinned)closePendingHelp();});
document.addEventListener('focusin',e=>{const button=e.target.closest('.pending-help-icon');if(button)showPendingHelp(button);});
document.addEventListener('focusout',e=>{if(!pendingHelpPinned&&e.target.closest('.pending-help-icon'))closePendingHelp();});
document.addEventListener('click',e=>{const button=e.target.closest('.pending-help-icon');if(button){if(button===pendingHelpAnchor&&pendingHelpPinned)closePendingHelp();else showPendingHelp(button,true);}else if(!e.target.closest('#pendingHelpPopover'))closePendingHelp();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closePendingHelp();});
window.addEventListener('resize',closePendingHelp);document.addEventListener('scroll',closePendingHelp,true);
$('#editVariantBody').addEventListener('click',e=>{const button=e.target.closest('[data-variant-upload]');if(button)button.closest('td').querySelector('.pending-sku-image-file').click();});
$('#editVariantBody').addEventListener('change',async e=>{
 const input=e.target;if(!input.matches('.pending-sku-image-file'))return;
 const file=input.files?.[0];if(!file)return;if(!file.type.startsWith('image/'))return showToast('请选择图片文件','error');
 const row=input.closest('tr'),session=pendingEditSession;
 try{const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});if(session!==pendingEditSession||!row.isConnected||!$('#editModal').classList.contains('open'))return;const img=row.querySelector('.edit-variant-image');img.src=src;img.dataset.variantImage=src;img.dataset.variantCustom='true';img.hidden=false;img.closest('button').classList.add('has-image');}
 catch{showToast('图片上传失败，请重试','error');}
 input.value='';
});

const origSave=$('#saveProduct').onclick;
$('#saveProduct').onclick=()=>{
 if(!validatePendingRequiredFields())return;
 const p=products.find(p=>p.spu===editingSpu)||newPendingProduct;if(!p)return;
 p.purchaseLink=$('#editPurchaseLink').value.trim();p.purchaseNotes=$('#editPurchaseNotes').value.trim();p.opImages=structuredClone(pendingOpImages);
 origSave();
 p.spuDraft={...(p.spuDraft||{}),purchaseLink:p.purchaseLink,purchaseNotes:p.purchaseNotes,opImages:structuredClone(p.opImages),skus:p.skus.map(s=>({...p.spuDraft?.skus?.find(row=>row.sku===s.sku),sku:s.sku,packagingList:s.packagingList||''}))};
 persist();renderChannels();
};

function openDialog(title,body,foot='',cls=''){const id='m-dialog-'+(++dialogCounter);const node=document.createElement('div');node.className='modal-mask open';node.id=id;node.innerHTML=`<section class="modal m-dialog ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-head"><div class="modal-title">${title}</div><button class="close" data-dismiss="${id}" aria-label="关闭">×</button></div><div class="modal-body ${cls==='report-dialog'?'report-body':''}">${body}</div><div class="modal-foot">${foot||`<button class="btn" data-dismiss="${id}">关闭</button>`}</div></section>`;document.body.append(node);node.addEventListener('click',e=>{if(e.target===node)node.remove();});node.querySelector('.close').focus();return node;}
function close(node){node.remove();}

const categoryPaths=[['Beauty & Personal Care','Tools & Accessories','Refillable Containers'],['Beauty & Personal Care','Tools & Accessories','Refillable Containers','Refillable Cosmetic Container Kits'],['Beauty & Personal Care','Tools & Accessories','Refillable Containers','Refillable Cosmetic Pump Dispensers'],['Beauty & Personal Care','Skin Care','Face'],['Home & Kitchen','Storage & Organization','Travel Storage'],['Beauty & Personal Care','Tools & Accessories','Refillable Containers','Refillable Cosmetic Container Kits','Travel Bottle Sets'],['Beauty & Personal Care','Tools & Accessories','Refillable Containers','Refillable Cosmetic Pump Dispensers','Pump Bottles']];
const categoryCatalog=[...categoryPaths.map(path=>({site:'US',level:String(path.length),path:path.join(' / ')})),...categoryPaths.filter((_,i)=>[0,1,2,5,6].includes(i)).map(path=>({site:'UK',level:String(path.length),path:path.join(' / ')})),{site:'DE',level:'3',path:'Beauty / Zubehör / Nachfüllbehälter'},{site:'DE',level:'4',path:'Beauty / Zubehör / Nachfüllbehälter / Kosmetikdosen'},{site:'DE',level:'5',path:'Beauty / Zubehör / Nachfüllbehälter / Kosmetikdosen / Reisesets'}];
const referenceCategories=Object.fromEntries(source.competitors.map((row,i)=>[row.I,{site:'US',paths:{3:categoryPaths[0].join(' / '),4:categoryPaths[i===0?1:2].join(' / '),5:categoryPaths[i===0?5:6].join(' / ')}}]));
let categorySearchIndex=-1;
function categoryChoices(){const q=$('#marketCategory').value.trim().toLowerCase();return categoryCatalog.filter(c=>c.site===m.site&&c.level===m.categoryLevel&&(!q||c.path.toLowerCase().includes(q)));}
function closeCategorySuggestions(){$('#categorySuggestions').hidden=true;$('#marketCategory').setAttribute('aria-expanded','false');categorySearchIndex=-1;}
function clearCategoryError(){$('#marketCategory').style.borderColor='';$('#categoryError')?.remove();}
function chooseResearchCategory(path){m.category=path;m.categoryMode=categoryCatalog.some(c=>c.site===m.site&&c.level===m.categoryLevel&&c.path===path)?'tree':'custom';m.categoryReuse='';$('#marketCategory').value=path;clearCategoryError();closeCategorySuggestions();persist();$('#categorySaved').textContent='';refreshCompScope();updateCategoryReuseAvailability();}
function showCategorySuggestions(){if(readOnly)return;const options=categoryChoices();const list=$('#categorySuggestions');categorySearchIndex=-1;list.innerHTML=options.length?options.map((c,i)=>`<button type="button" class="category-suggestion" role="option" aria-selected="false" data-category-choice="${i}">${esc(c.path)}</button>`).join(''):'<div class="category-search-empty">未找到匹配品类，可直接输入自定义品类</div>';list.hidden=false;$('#marketCategory').setAttribute('aria-expanded','true');list.querySelectorAll('[data-category-choice]').forEach(button=>{button.onmousedown=e=>e.preventDefault();button.onclick=()=>chooseResearchCategory(options[Number(button.dataset.categoryChoice)].path);});}
function updateCategoryReuseAvailability(){const empty=!m.category?.trim();$('#reuseCategory').disabled=readOnly||empty;$('.category-reuse-trigger').title=empty?'请先选择调研品类':'';refreshCategoryControls();}
function changeCategoryScope(){
 const nextSite=$('#marketSite').value,nextLevel=$('#marketLevel').value;
 if(nextSite===m.site&&nextLevel===m.categoryLevel)return;
 const apply=()=>{m.site=nextSite;m.categoryLevel=nextLevel;m.category='';m.categoryMode='tree';m.categoryReuse='';$('#marketSite').value=m.site;$('#marketLevel').value=m.categoryLevel;$('#marketCategory').value='';$('#categorySaved').textContent='';clearCategoryError();closeCategorySuggestions();persist();refreshCompScope();updateCategoryReuseAvailability();renderCompList();};
 if(!m.category?.trim()){apply();return;}
 $('#marketSite').value=m.site;$('#marketLevel').value=m.categoryLevel;
 const dlg=openDialog('切换调研范围','<p>切换站点或品类等级将清空当前调研品类，是否继续？</p>','<button type="button" class="btn" data-cancel-scope>取消</button><button type="button" class="btn primary" data-confirm-scope>确认切换</button>');
 dlg.querySelector('[data-cancel-scope]').onclick=()=>close(dlg);dlg.querySelector('[data-confirm-scope]').onclick=()=>{apply();close(dlg);};
}
$('#marketSite').onchange=changeCategoryScope;$('#marketLevel').onchange=changeCategoryScope;
$('#marketCategory').onfocus=showCategorySuggestions;
$('#marketCategory').oninput=()=>{$('#categorySaved').textContent='';showCategorySuggestions();refreshCategoryControls();};
$('#marketCategory').onblur=()=>{if(readOnly)return;chooseResearchCategory($('#marketCategory').value.trim());};
$('#marketCategory').onkeydown=event=>{const list=$('#categorySuggestions'),buttons=[...list.querySelectorAll('[data-category-choice]')];if(event.key==='Escape'){closeCategorySuggestions();return;}if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();if(list.hidden){showCategorySuggestions();return;}if(!buttons.length)return;categorySearchIndex=(categorySearchIndex+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons.forEach((button,i)=>button.setAttribute('aria-selected',String(i===categorySearchIndex)));}if(event.key==='Enter'){event.preventDefault();if(!list.hidden&&categorySearchIndex>=0)buttons[categorySearchIndex]?.click();else chooseResearchCategory($('#marketCategory').value.trim());}};
$('#fromAsin').onclick=()=>{
 if(readOnly)return;
 const level=m.categoryLevel;
 const rows=refs.map(ref=>({ref,category:referenceCategories[ref.asin]})).filter(row=>row.category?.site===m.site&&row.category.paths[level]);
 let selected=null;
 const dlg=openDialog('使用参考ASIN品类',`<div class="category-dialog-context">${esc(m.site)} · Amazon${categoryLevelText(level)}</div>${rows.length?`<table class="reference-category-table"><thead><tr><th>选择</th><th>ASIN</th><th>产品标题</th><th>品类完整路径</th></tr></thead><tbody>${rows.map(({ref,category})=>`<tr><td><input type="radio" name="referenceCategory" value="${esc(ref.asin)}"></td><td>${esc(ref.asin)}</td><td>${esc(ref.title)}</td><td class="reference-category-path"><span>${esc(category.paths[level])}</span></td></tr>`).join('')}</tbody></table>`:'<div class="empty">暂无符合当前站点和品类等级的参考产品</div>'}`, '<button type="button" class="btn" data-cancel-reference>取消</button><button type="button" class="btn primary" data-use-reference disabled>确定使用</button>');
 dlg.querySelector('[data-cancel-reference]').onclick=()=>close(dlg);
 dlg.querySelector('[data-use-reference]').onclick=()=>{if(!selected)return;m.categoryLevel=level;$('#marketLevel').value=level;chooseResearchCategory(selected.paths[level]);close(dlg);};
 dlg.querySelectorAll('[name=referenceCategory]').forEach(radio=>{radio.onchange=()=>{if(!radio.checked)return;dlg.querySelectorAll('[name=referenceCategory]').forEach(other=>other.checked=other===radio);selected=referenceCategories[radio.value];dlg.querySelector('[data-use-reference]').disabled=false;};radio.closest('tr').addEventListener('click',e=>{if(e.target===radio)return;radio.checked=true;radio.onchange();});});
};
const categoryHistoryRecords=categoryPaths.filter((_,i)=>[0,1,2,5,6].includes(i)).flatMap((path,i)=>[
 {id:'DT20261025000'+(i+1),site:'US',level:String(path.length),path:path.join(' / '),dept:'xingqu',status:'approved',line:'美妆个护 > 工具与配件 > 旅行分装瓶',name:'旅行分装瓶开发',canViewTask:true,developer:'林悦',reviewedAt:'2026-10-25 16:30:00',dimensions:source.dimensions.map((d,i)=>normalizeSingleCategoryImage(d.html,i)),rankings:{newTop:{src:'assets/image10.png',alt:'新品TOP10'},monthTop:{src:'assets/image10.png',alt:'小类近30天TOP'}}},
 {id:'DT20260918000'+(i+1),site:'US',level:String(path.length),path:path.join(' / '),dept:'xingqu',status:'approved',line:'美妆个护 > 工具与配件 > 旅行分装瓶',name:'旅行分装瓶开发',canViewTask:false,developer:'张宁',reviewedAt:'2026-09-18 10:15:00',dimensions:source.dimensions.map((d,i)=>normalizeSingleCategoryImage(d.html,i)),rankings:{newTop:{src:'assets/image10.png',alt:'新品TOP10'},monthTop:{src:'assets/image10.png',alt:'小类近30天TOP'}}}
]);
function previewCategoryHistory(record){openDialog('历史类目分析 · '+record.id,`<div class="report-paper"><h1>类目市场分析</h1><div class="report-info">任务编号：${esc(record.id)}　开发人：${esc(record.developer)}<br>审核时间：${esc(record.reviewedAt)}<br>${esc(record.site)} · Amazon${categoryLevelText(record.level)}<br>${esc(record.path)}</div>${categoryReportHtml(record.dimensions,record.rankings)}</div>`,'','report-dialog');}
function reuseCategoryAnalysis(){
 if(readOnly)return;
 const typed=$('#marketCategory').value.trim();if(typed!==m.category)chooseResearchCategory(typed);
 if(!m.category){showToast('请先选择调研品类','error');return;}
 const matches=categoryHistoryRecords.filter(record=>record.site===m.site&&record.level===m.categoryLevel&&record.path===m.category&&record.dept===m.dept&&record.status==='approved').sort((a,b)=>b.reviewedAt.localeCompare(a.reviewedAt));
 const context=`<div class="history-query-summary"><div><span>站点</span><strong>${esc(m.site)}</strong></div><div><span>品类等级</span><strong>Amazon${categoryLevelText(m.categoryLevel)}</strong></div><div class="history-query-category"><span>调研品类</span><strong>${esc(m.category)}</strong></div></div>`;
 const dlg=openDialog('复用历史类目分析',context+(matches.length?`<table class="category-history-table"><thead><tr><th>选择</th><th>任务编号</th><th>品线</th><th>开发人</th><th>审核时间</th></tr></thead><tbody>${matches.map(record=>`<tr><td><input type="radio" name="categoryHistory" value="${record.id}"></td><td><a class="link" href="?taskId=${encodeURIComponent(record.id)}" target="_blank" rel="noopener" data-category-task-detail="${record.id}">${record.id}</a></td><td class="history-product-line">${esc(record.line)}</td><td>${esc(record.developer)}</td><td>${record.reviewedAt}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">暂无匹配的已审核类目分析</div>'),`<button type="button" class="btn" data-cancel>取消</button><button type="button" class="btn primary" data-use-category-history disabled>确认复用</button>`);
 let selected=null;
 dlg.querySelector('[data-cancel]').onclick=()=>close(dlg);
 dlg.querySelectorAll('[name=categoryHistory]').forEach(radio=>radio.onchange=()=>{if(radio.checked){selected=matches.find(record=>record.id===radio.value);dlg.querySelector('[data-use-category-history]').disabled=false;}});
 dlg.querySelectorAll('[data-category-task-detail]').forEach(link=>link.onclick=event=>{const record=matches.find(record=>record.id===link.dataset.categoryTaskDetail);if(!record?.canViewTask){event.preventDefault();showToast('无权限查看该任务','error');}});
 function applyHistory(){
  if(!selected)return;
  source.dimensions.forEach((_,i)=>{categorySaveVersions[i]=(categorySaveVersions[i]||0)+1;categorySaveStates[i]='saved';if(i<6)categoryUploadJobs[i]=[];});
  m.rankingImages=structuredClone(selected.rankings||{newTop:null,monthTop:null});rankingSaveStates.newTop='saved';rankingSaveStates.monthTop='saved';m.dims=[...selected.dimensions];m.categoryReuse=selected.id+' · '+selected.reviewedAt;renderDimensions();syncReadOnly();
  if(!persist())source.dimensions.forEach((_,i)=>{categorySaveStates[i]='error';refreshCategoryStatus(i);});
  close(dlg);showToast('历史类目分析已预填');
 }
 dlg.querySelector('[data-use-category-history]').onclick=()=>{
  if(!selected)return;
  const hasContent=!!(m.rankingImages?.newTop||m.rankingImages?.monthTop)||source.dimensions.some((_,i)=>$('#category-conclusion-'+i)?.value.trim()||(dimensionImages[i]||[]).length||(categoryUploadJobs[i]||[]).length);
  if(!hasContent){applyHistory();return;}
  const confirm=openDialog('覆盖当前类目分析','<p>当前已填写分析内容，复用将覆盖类目榜单图片及8项分析结论和图片，是否继续？</p>','<button type="button" class="btn" data-keep-category>取消</button><button type="button" class="btn primary" data-overwrite-category>确认覆盖</button>');
  confirm.querySelector('[data-keep-category]').onclick=()=>close(confirm);confirm.querySelector('[data-overwrite-category]').onclick=()=>{close(confirm);applyHistory();};
 };
}
function reuse(kind,asin){const cat=kind==='category';const r=refs.find(r=>r.asin===asin);const dlg=openDialog(cat?'复用历史类目分析':'复用本人历史竞品分析',`<div class="market-note">${cat?'查询范围：同部门 · 已审核通过的结构化分析':'查询范围：本人 · 相同站点、ASIN · 已审核通过'}</div><div class="m-filter"><label>站点<select id="historySite"><option>US</option><option>UK</option><option>DE</option></select></label>${cat?'<label>品类层级<select id="historyLevel"><option value="3">三级品类</option><option value="4">四级品类</option></select></label><label>品类<select id="historyCategory"><option>Refillable Containers</option><option>Refillable Cosmetic Container Kits</option><option>Refillable Cosmetic Pump Dispensers</option><option>Travel Storage</option></select></label>':`<label>ASIN<input disabled value="${esc(asin)}"></label>`}<button class="btn primary" id="historySearch">查询</button></div><div id="historyResults"></div><div class="history-warning">预填会覆盖${cat?'当前调研品类与8个维度':'当前ASIN的分析字段'}；参考产品基础信息保持引用。确认前请检查已有内容，预填后可继续编辑。</div>`,`<button class="btn" data-cancel>取消</button><button class="btn primary" data-apply disabled>使用所选分析预填</button>`);
dlg.querySelector('#historySite').value=m.site;
function search(){const site=dlg.querySelector('#historySite').value,level=cat?dlg.querySelector('#historyLevel').value:'',category=cat?dlg.querySelector('#historyCategory').value:'';const match=site==='US'&&(cat?category!=='Travel Storage'&&(level==='3'?category==='Refillable Containers':category!=='Refillable Containers'):source.competitors.some(s=>s.I===asin));dlg.querySelector('[data-apply]').disabled=true;dlg.querySelector('#historyResults').innerHTML=match?`<label class="history-row"><input type="radio" name="hist" value="1"><div><h4>${cat?esc(category)+' · 类目市场分析':esc(r.title)+' · 竞品分析'} <span class="tag green">审核通过</span></h4><div class="subtle">${site}　${cat?'星渠开发部 · 林悦':'本人 · 当前开发人'}　2026-09-18　DT202609180006</div><div class="history-preview" style="margin-top:12px">${cat?'市场体量：样本100个ASIN，均价8.92美元；8–12美元为主要价格带。包含8项类目分析及图表。':'核心差评：密封结构、清洗难度与耐用性。差异化：调整组合套装，增加漏斗等配件。包含分析文字与用户反馈图片。'}</div></div></label>`:'<div class="empty">未找到符合条件的已审核分析</div>';dlg.querySelector('[name=hist]')?.addEventListener('change',()=>dlg.querySelector('[data-apply]').disabled=false);}
dlg.querySelector('#historySearch').onclick=search;dlg.querySelectorAll('.m-filter select').forEach(s=>s.onchange=search);search();dlg.querySelector('[data-cancel]').onclick=()=>close(dlg);dlg.querySelector('[data-apply]').onclick=()=>{if(cat){m.dims=source.dimensions.map(d=>d.html);m.category=categoryPaths[0].join(' / ');const category=dlg.querySelector('#historyCategory').value;if(dlg.querySelector('#historyLevel').value==='4')m.category+=' / '+category;m.categoryMode='tree';m.categoryLevel=dlg.querySelector('#historyLevel').value;m.categoryReuse='DT202609180006 · 2026-09-18';renderDimensions();}else{m.drafts[asin]=competitorDraft(source.competitors.find(s=>s.I===asin));m.competitorReuse[asin]='DT202609180006 · 2026-09-18';renderCompetitors();}mark();close(dlg);showToast('历史分析已预填，可继续编辑');};}
$('#reuseCategory').onclick=reuseCategoryAnalysis;
// Save only on blur, allowing incomplete work during normal editing.
document.addEventListener('focusout',e=>{const el=e.target,key=el.dataset?.key;if(!key||readOnly)return;const a=key.split(':');if(a[0]==='dim'){saveCategoryItem(+a[1]);return;}else if(a[0]==='comp'){m.drafts[a[1]]||={};m.drafts[a[1]][a[2]]=el.classList.contains('editor')?el.innerHTML:el.value;}else if(a[0]==='channel'){m.channels[a[1]]||={};m.channels[a[1]][a[2]]=el.value;}mark(el.closest('.dim-card,.market-field'));if(a[0]==='dim')refreshCategoryControls();});
document.addEventListener('selectionchange',()=>{const sel=getSelection();if(sel.rangeCount){const n=sel.anchorNode?.parentElement?.closest('.editor');if(n){activeRich=n;savedRange=sel.getRangeAt(0).cloneRange();}}});
function restoreSelection(editor){editor.focus();if(savedRange&&editor.contains(savedRange.commonAncestorContainer)){const sel=getSelection();sel.removeAllRanges();sel.addRange(savedRange);}else{const range=document.createRange();range.selectNodeContents(editor);range.collapse(false);const sel=getSelection();sel.removeAllRanges();sel.addRange(range);}}
async function addImages(editor,files){if(readOnly)return;for(const file of files){if(!file.type.startsWith('image/'))continue;if(file.size>3*1024*1024){showToast('单张图片不能超过3MB','error');continue;}const data=await new Promise(resolve=>{const f=new FileReader();f.onload=()=>resolve(f.result);f.readAsDataURL(file);});restoreSelection(editor);document.execCommand('insertImage',false,data);savedRange=getSelection().getRangeAt(0).cloneRange();}editor.blur();}
document.addEventListener('paste',e=>{const editor=e.target.closest('.editor');if(!editor||readOnly)return;e.preventDefault();const imgs=[...e.clipboardData.files].filter(f=>f.type.startsWith('image/'));if(imgs.length)addImages(editor,imgs);else document.execCommand('insertText',false,e.clipboardData.getData('text/plain'));});
document.addEventListener('mousedown',e=>{if(e.target.closest('[data-command]'))e.preventDefault();});
document.addEventListener('click',e=>{const t=e.target.closest('button,a');if(t?.dataset.dismiss){$('#'+t.dataset.dismiss)?.remove();return;}if(t?.dataset.jump){$('#comp-'+t.dataset.jump)?.scrollIntoView({behavior:'smooth'});return;}if(t?.dataset.viewSource){setAsin(t.dataset.viewSource,true);return;}if(t?.dataset.deleteRef){deleteReference(t.dataset.deleteRef);return;}if(t?.dataset.reuse){reuse('competitor',t.dataset.reuse);return;}if(t?.dataset.remove){if(readOnly)return;m.selected=m.selected.filter(a=>a!==t.dataset.remove);mark();renderCompetitors();renderRefs();showToast('竞品已移除，草稿保留；不影响参考产品');return;}if(t?.dataset.action==='pick'){chooseCompetitors();return;}if(t?.dataset.command){if(readOnly)return;const editor=t.closest('.editor-wrap').querySelector('.editor');restoreSelection(editor);document.execCommand(t.dataset.command);editor.blur();return;}if(t?.dataset.upload){const editor=t.closest('.editor-wrap').querySelector('.editor');const input=document.createElement('input');input.type='file';input.accept='image/*';input.multiple=true;input.onchange=()=>addImages(editor,[...input.files]);input.click();return;}
if(e.target.tagName==='IMG'&&!e.target.closest('#imageLightbox,#changeImage,.pending-sku-image-button'))showImage(e.target);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const boxes=[...document.querySelectorAll('.modal-mask.open[id^="m-dialog-"],#imageLightbox')];boxes.at(-1)?.remove();}if(e.key==='Enter'&&e.target.tagName==='IMG')showImage(e.target);});
function showImage(img){lightboxImage=img;const node=document.createElement('div');node.className='modal-mask open lightbox';node.id='imageLightbox';node.innerHTML=`<div class="modal" role="dialog" aria-label="图片查看"><div class="modal-head"><span>${esc(img.alt||'图片查看')}</span><button class="close" data-dismiss="imageLightbox" aria-label="关闭图片">×</button></div><div class="image-area"><img loading="lazy" decoding="async" src="${esc(img.src)}" alt="${esc(img.alt||'查看大图')}"></div><div class="modal-foot">${img.closest('.editor')&&!readOnly?'<button class="btn" id="removeImage">从当前分析移除此图</button>':''}<button class="btn" data-dismiss="imageLightbox">关闭</button></div></div>`;document.body.append(node);node.querySelector('#removeImage')?.addEventListener('click',()=>{const editor=lightboxImage.closest('.editor');lightboxImage.remove();editor.focus();editor.blur();node.remove();});node.querySelector('.close').focus();}
function reportHtml(){const taskField=label=>[...document.querySelectorAll('.task-grid .label')].find(el=>el.textContent.trim()===label)?.nextElementSibling?.textContent.trim();const name=activeHistoryTask?.name||$('.detail-name')?.childNodes[0]?.textContent.trim();return `<div class="report-paper"><header class="report-header"><h1>${reportValue(name)}·市场分析报告</h1><div class="report-info-line">${reportValue(activeHistoryTask?.id||taskField('任务号'))} · ${reportValue($('#taskStatusTag')?.textContent)} · ${reportValue(activeHistoryTask?.developer||taskField('负责人'))}</div><div class="report-info-line">${reportValue(m.site)} · ${reportValue(m.categoryLevel?'Amazon'+categoryLevelText(m.categoryLevel):'')} · ${reportValue(m.category)}</div></header><h2>一、类目市场分析</h2>${categoryReportHtml(source.dimensions.map((_,i)=>$('#category-conclusion-'+i)?dimensionHtml(i):m.dims[i]),m.rankingImages)}<h2>二、竞品市场分析（${ensureCompetitorState().items.length}个）</h2>${competitorReportHtml()}<h2>三、待开发产品（${products.length}个SPU / ${products.reduce((n,p)=>n+(p.skus?.length||0),0)}个SKU）</h2>${pendingProductsReportHtml()}</div>`;}

function preview(){document.activeElement?.blur();openDialog('市场分析报告 · 只读预览',reportHtml(),'', 'report-dialog');}
$('#previewReport').onclick=preview;$('#previewInline').onclick=preview;
$('#preproject').onclick=()=>{openDialog('预立项 · 引用结构化报告',`<div class="review-banner"><div><strong>旅行分装瓶 · 市场分析报告</strong><br>DT202609280018　${esc(m.site)}　${m.selected.length}个竞品</div><span class="tag teal">结构化报告</span></div><p>将当前任务的类目分析与竞品分析关联到预立项资料，无需重复上传报告。</p>`,`<button class="btn" data-preview>查看报告</button><button class="btn primary" data-ref>确认引用</button>`);const dlg=document.querySelector('.modal-mask[id^=m-dialog-]:last-of-type');dlg.querySelector('[data-preview]').onclick=preview;dlg.querySelector('[data-ref]').onclick=()=>{close(dlg);showToast('已引用 DT202609280018 的结构化市场分析报告');};};
const hasText=html=>{const t=document.createElement('div');t.innerHTML=html||'';return !!t.textContent.trim();};
function validationError(el,message){el.classList.add('invalid');el.insertAdjacentHTML('beforeend',`<div class="field-error">${esc(message)}</div>`);return el;}
function validate(){document.activeElement?.blur();$$('#marketSection .invalid').forEach(e=>e.classList.remove('invalid'));$$('#marketSection .field-error').forEach(e=>e.remove());$('#categoryError')?.remove();let errors=[];if(isVisible){if(!m.site)errors.push(validationError($('#marketSite').closest('label'),'请选择站点'));if(!m.categoryLevel)errors.push(validationError($('#marketLevel').closest('label'),'请选择品类等级'));if(!m.category.trim()){$('#marketCategory').style.borderColor='#e6656e';$('#marketCategory').insertAdjacentHTML('afterend','<span id="categoryError" class="field-error">请选择或输入调研品类</span>');errors.push($('#marketCategory'));}rankingDefinitions.forEach(([key,title])=>{if(key==='newTop'&&!m.rankingImages?.[key]){revealRankingRequired();errors.push(validationError($('#ranking-'+key),'请上传'+title+'图片'));}});m.dims.forEach((html,i)=>{const text=$('#category-conclusion-'+i)?.value;if(text!==undefined?!text.trim():!hasText(html))errors.push(validationError($('#dim-'+i),'请填写'+source.dimensions[i].title));if(i<6&&!dimensionImages[i]?.length)errors.push(validationError($('#dim-'+i),'请上传'+source.dimensions[i].title+'分析图片'));});errors.push(...validateCompetitorAnalysis());}
if(!products.length||products.some(p=>!p.skus.length||!p.category||p.skus.some(s=>!s.sale))){errors.push($('#pendingSection'));showToast(isVisible&&(!m.rankingImages?.newTop||dimensionImages.slice(0,6).some(images=>!images?.length))?'市场分析未完成':'请补全待开发产品品类、SKU和预计售价','error');}else if(errors.length)showToast(isVisible&&(!m.rankingImages?.newTop||dimensionImages.slice(0,6).some(images=>!images?.length))?'市场分析未完成':`有 ${errors.length} 项未完成，请检查红色标记字段`,'error');if(errors.length){let node=errors[0];while(node&&node!==main){if(node.classList.contains('module-collapsed')){node.classList.remove('module-collapsed');const toggle=node.querySelector(':scope > .field-head .module-toggle,:scope > .sub-head .module-toggle,:scope > .section-head .module-toggle');toggle?.setAttribute('aria-expanded','true');}node=node.parentElement;}errors[0].scrollIntoView({behavior:'smooth',block:'center'});const input=errors[0].matches('input')?errors[0]:errors[0].querySelector('.editor,input,textarea');setTimeout(()=>input?.focus({preventScroll:true}),300);return false;}return true;}
$('#submitTask').onclick=()=>{if(readOnly||!validate())return;const dlg=openDialog('提交审核',`<p>类目分析、${m.selected.length}个竞品分析与待开发产品将一起提交审核。</p>`,`<button class="btn" data-cancel>继续编辑</button><button class="btn primary" data-submit>确认提交</button>`);dlg.querySelector('[data-cancel]').onclick=()=>close(dlg);dlg.querySelector('[data-submit]').onclick=()=>{m.frozenVisibility=isVisible;m.stage='review';$('#workflowState').value='review';persist();applyWorkflow();close(dlg);showToast('任务已提交审核，市场分析进入只读状态');openReview();};};
function openReview(){const channels=[];const dlg=openDialog('开发任务审核',`<div class="review-banner"><div><strong>旅行分装瓶开发</strong><br>DT202609280018　开发人：林悦　任务状态：${esc($('#taskStatusTag').textContent)}</div>${isVisible?'<button class="btn" data-report>查看市场分析报告</button>':''}</div><h3 style="font-size:14px">待开发产品 <span class="subtle">${products.length}个SPU / ${products.reduce((n,p)=>n+p.skus.length,0)}个SKU</span></h3><div class="review-table"><table><thead><tr><th>SPU / SKU</th><th>图片</th><th>产品名称</th><th>参考ASIN</th><th>供应商</th><th>采购价</th><th>预计售价</th></tr></thead><tbody>${products.map(p=>`<tr><td class="left"><strong>▾ ${esc(p.spu)}</strong></td><td><img loading="lazy" decoding="async" width="42" height="42" src="${asset(p.img)}"></td><td class="left">${esc(p.title)}</td><td>${esc(p.asin)}</td><td>${esc(p.supplier)}</td><td>—</td><td>—</td></tr>${p.skus.map(s=>`<tr><td>　${esc(s.sku)}</td><td><img loading="lazy" decoding="async" width="38" height="38" src="${asset(s.img||p.img)}"></td><td class="left">${esc(s.variantTitle||p.title)}</td><td>${esc(p.asin)}</td><td>${esc(p.supplier)}</td><td>¥${Number(s.price).toFixed(2)}</td><td>${esc(s.sale)}</td></tr>`).join('')}`).join('')}</tbody></table></div>${isVisible&&channels.length?`<div class="review-readonly">${channels.map(([spu,c])=>`<b>${esc(spu)} · 星渠开发信息</b><br>差异化设计：${esc(c.design)}<br>样品状态：${esc(c.sample)}　计划上线日期：${esc(c.launch)}`).join('<hr>')}</div>`:''}<h3 style="font-size:14px">审核意见</h3><textarea class="review-opinion" placeholder="填写审核意见；驳回时需填写" ${m.stage!=='review'?'disabled':''}></textarea><div class="field-error" id="reviewError"></div>`,`<button class="btn" data-cancel>关闭</button>${m.stage==='review'?'<button class="btn" data-reject>驳回</button><button class="btn primary" data-approve>审核通过</button>':''}`);dlg.querySelector('[data-report]')?.addEventListener('click',preview);dlg.querySelector('[data-cancel]').onclick=()=>close(dlg);dlg.querySelector('[data-approve]')?.addEventListener('click',()=>{m.stage='done';$('#workflowState').value='done';persist();applyWorkflow();close(dlg);showToast('审核通过，任务已完成');});dlg.querySelector('[data-reject]')?.addEventListener('click',()=>{if(!dlg.querySelector('textarea').value.trim()){dlg.querySelector('#reviewError').textContent='请填写驳回意见';dlg.querySelector('textarea').style.borderColor='#e6656e';return;}m.stage='research';$('#workflowState').value='research';persist();applyWorkflow();close(dlg);showToast('已驳回，任务返回调研中');});}
$('#openReview').onclick=openReview;
$('#addAsin').onclick=()=>{if(!canWrite())return;const dlg=openDialog('新增参考ASIN',`<div class="new-reference-form"><label>ASIN <span class="required">*</span></label><input id="newAsin" maxlength="10" placeholder="10位字母和数字"><label>产品标题 <span class="required">*</span></label><input id="newTitle" placeholder="输入参考产品标题"><label>售价（USD）</label><input id="newPrice" type="number" min="0" value="19.99"></div><div class="field-error" id="newRefError"></div><p class="subtle">添加后，可在市场分析中选择该参考产品。</p>`,`<button class="btn" data-cancel>取消</button><button class="btn primary" data-add>添加参考产品</button>`);dlg.querySelector('[data-cancel]').onclick=()=>close(dlg);dlg.querySelector('[data-add]').onclick=()=>{const a=dlg.querySelector('#newAsin').value.trim().toUpperCase(),title=dlg.querySelector('#newTitle').value.trim();if(!/^[A-Z0-9]{10}$/.test(a)||!title||refs.some(r=>r.asin===a)){dlg.querySelector('#newRefError').textContent='请输入有效的10位ASIN和产品标题，且ASIN不可重复';return;}refs.push({asin:a,title,img:'image11.jpeg',category:'Refillable Containers',price:dlg.querySelector('#newPrice').value,rating:'--',reviews:'--',sales:'--',date:'--',targetQty:200,targetRange:[20,30],zeroPrice:25,status:'pending',sourcingAt:''});persist();renderRefs();renderCandidates();renderCompetitors();close(dlg);showToast('已添加参考ASIN，可前往市场分析增选');};};
// Basic interactions are scoped to the eight category analysis items.
 document.addEventListener('input',event=>{if(event.target.matches('#dimensions .category-conclusion')){const i=Number(event.target.dataset.key.split(':')[1]);categorySaveVersions[i]=(categorySaveVersions[i]||0)+1;categorySaveStates[i]='dirty';refreshCategoryStatus(i);sizeCategoryText();refreshCategoryControls();}});
 window.addEventListener('resize',scheduleCategorySize);
 document.addEventListener('click',async event=>{
  const button=event.target.closest('button');
  if(button?.dataset.rankingUpload!==undefined){
   if(readOnly)return;const key=button.dataset.rankingUpload;const input=document.createElement('input');input.type='file';input.accept='image/*';
   input.onchange=()=>{const file=input.files?.[0];if(!file||!file.type.startsWith('image/'))return;if(file.size>3*1024*1024)return showToast('单张图片不能超过3MB','error');const reader=new FileReader();reader.onload=()=>{m.rankingImages[key]={src:reader.result,alt:file.name};saveRanking(key);};reader.onerror=()=>showToast('图片上传失败，请重试','error');reader.readAsDataURL(file);};input.click();return;
  }
  if(button?.dataset.rankingDelete!==undefined){if(readOnly)return;const key=button.dataset.rankingDelete;m.rankingImages[key]=null;saveRanking(key);return;}
  if(button?.dataset.rankingRetry!==undefined){const key=button.dataset.rankingRetry;if(!readOnly&&rankingSaveStates[key]==='error')saveRanking(key);return;}
  if(button?.id==='toggleCategoryRankings'){setRankingsCollapsed(!$('#categoryRankings').classList.contains('is-collapsed'));return;}
  if(button?.id==='toggleCategoryItems'){
   const cards=[...document.querySelectorAll('#dimensions > .category-analysis-item')];const collapse=!$('#categoryAnalysisBlock')?.classList.contains('module-collapsed')&&(!$('#categoryRankings').classList.contains('is-collapsed')||cards.some(card=>!card.classList.contains('module-collapsed')));expandAnalysisModule('categoryAnalysisBlock');setRankingsCollapsed(collapse);
   cards.forEach(card=>{card.classList.toggle('module-collapsed',collapse);const toggle=card.querySelector('.module-toggle');if(toggle){toggle.setAttribute('aria-expanded',String(!collapse));toggle.setAttribute('aria-label',(collapse?'展开':'收起')+card.dataset.foldLabel);toggle.title=(collapse?'展开':'收起')+card.dataset.foldLabel;}});
   refreshCategoryControls();scheduleCategorySize();return;
  }
  if(button?.dataset.categorySaveRetry!==undefined){const i=Number(button.dataset.categorySaveRetry);if(categorySaveStates[i]==='error')saveCategoryItem(i);return;}
  if(button?.dataset.categoryImageRetry!==undefined){if(readOnly)return;const [i,id]=button.dataset.categoryImageRetry.split(':').map(Number),job=categoryUploadJobs[i].find(j=>j.id===id);if(job)uploadCategoryImage(i,job,true);return;}
  if(button?.dataset.categoryImageCancel!==undefined){if(readOnly)return;const [i,id]=button.dataset.categoryImageCancel.split(':').map(Number);categoryUploadJobs[i]=categoryUploadJobs[i].filter(j=>j.id!==id);renderCategoryGallery(i);return;}
  if(button?.dataset.categoryUpload!==undefined){
   if(readOnly)return;const i=Number(button.dataset.categoryUpload);if(categoryUploadJobs[i]?.[0]?.status==='uploading')return;
   const input=document.createElement('input');input.type='file';input.accept='image/*';
   input.onchange=()=>{const file=input.files?.[0];if(!file||!file.type.startsWith('image/'))return;if(file.size>3*1024*1024)return showToast('单张图片不能超过3MB','error');const job={id:Date.now()+Math.random(),file,status:'uploading'};categoryUploadJobs[i]=[job];uploadCategoryImage(i,job);};input.click();return;
  }
  if(button?.dataset.categoryDelete!==undefined){if(readOnly)return;const [i,j]=button.dataset.categoryDelete.split(':').map(Number);dimensionImages[i].splice(j,1);renderCategoryGallery(i);saveCategoryItem(i);return;}
  if(event.target.closest('#marketSection > .module-fold-head, #categoryAnalysisBlock .module-fold-head')){refreshCategoryControls();refreshCompFoldControl();scheduleCategorySize();}
  if(event.target.closest('#competitorAnalysisBlock > .module-fold-head'))refreshCompFoldControl();
 });
reconcileCompetitorReferences();renderDimensions();renderCompetitors();applyWorkflow();
// Deep links open an isolated, read-only historical task without writing current drafts.
const requestedTaskMatch=/[?&]taskId=([^&]+)/.exec(window.location.search||'');
if(requestedTaskMatch){
 let taskId='';try{taskId=decodeURIComponent(requestedTaskMatch[1]);}catch{}
 const record=categoryHistoryRecords.find(item=>item.id===taskId);
 if(!record?.canViewTask){
  readOnly=true;main.dataset.taskAccessDenied='true';main.innerHTML='<div class="detail-hero"><div class="detail-name">任务详情</div></div><div class="detail-section task-access-denied"><strong>无权限查看该任务</strong><p>请联系任务负责人或管理员申请查看权限。</p><a class="btn back-link" href="'+esc(window.location.pathname||'index.html')+'">返回当前任务</a></div>';
 }else{
  activeHistoryTask=record;readOnly=true;m={...structuredClone(initial),site:record.site,categoryLevel:record.level,category:record.path,dims:[...record.dimensions],rankingImages:structuredClone(record.rankings||{newTop:null,monthTop:null}),dept:record.dept,stage:'done',frozenVisibility:true};
  source.dimensions.forEach((_,i)=>{categorySaveVersions[i]=(categorySaveVersions[i]||0)+1;categorySaveStates[i]='saved';});
  $('#workflowState').value='done';$('#developerDept').value=record.dept;
  function setBasicValue(label,value){const labels=[...$('#basicSection').querySelectorAll('.task-grid .label')];const field=labels.find(el=>el.textContent.trim()===label);if(field?.nextElementSibling)field.nextElementSibling.textContent=value;}
  setBasicValue('任务号',record.id);setBasicValue('星商品线',record.line);setBasicValue('负责人',record.developer);setBasicValue('创建时间',record.reviewedAt.slice(0,10)+' 09:00:00');
  $('.detail-name').childNodes[0].textContent=record.name+' ';document.title=record.id+' · 任务详情';
  renderDimensions();renderCompetitors();applyWorkflow();$('#preprojectLink').hidden=true;
 }
}
if(pendingExamplesUpgraded&&!activeHistoryTask)persist();
})();
