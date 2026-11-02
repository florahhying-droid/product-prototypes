
/* Ranking evidence is scoped to the AI copy; source rows are never synthesized. */
const aiRankingFolded=new Set(['monthTop']);
function aiRankingState(key){const state=aiCategoryState(key);if(!state.rankingVersion){state.structured=structuredClone(window.AI_CATEGORY_SAMPLE.rankings[key]);state.evidenceMode='table';state.screenshot=structuredClone(m.rankingImages?.[key]||null);state.rankingVersion=1;}return state;}
function aiRankingHasEvidence(key){const state=aiRankingState(key);return !!(state.structured?.rows?.length||state.screenshot?.src);}
function aiRankingTable(data,compact=false){
 const rows=compact?data.rows.slice(0,3):data.rows,labels=compact?['排名','商品 / ASIN','售价（USD）','预估月销量','评分 / 评分数']:['排名','商品 / ASIN','品牌 / 形态','售价（USD）','预估月销量','评分 / 评分数','上架日期'];
 return `<div class="ai-data-table-wrap"><table class="ai-data-table ai-ranking-table${compact?' is-compact':''}"><thead><tr>${labels.map(label=>`<th>${label}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr><td>${esc(row[0])}</td><td class="ai-ranking-product">${esc(row[1])}<br><a class="external-link" href="https://www.amazon.com/dp/${esc(row[2])}" target="_blank" rel="noopener noreferrer">${esc(row[2])} ${asinLinkIcon}</a></td>${compact?'':`<td>${esc(row[3])}</td>`}<td>${esc(row[4])}</td><td>${esc(row[5])}</td><td>${esc(row[6])}</td>${compact?'':`<td>${esc(row[7])}</td>`}</tr>`).join('')}</tbody></table></div>`;
}
function aiRankingBody(key,report=false){
 const state=aiRankingState(key),data=state.structured;
 if(state.evidenceMode==='screenshot'&&state.screenshot?.src)return `<figure class="ai-category-shot">${reportImageHtml(state.screenshot,true,rankingDefinitions.find(row=>row[0]===key)[1]+'截图')}<figcaption>人工上传截图${!report&&!readOnly?` <button type="button" class="link danger" data-ai-rank-remove="${key}">删除截图</button>`:''}</figcaption></figure>`;
 if(!data?.rows?.length)return '<div class="ai-data-empty">暂无榜单，请获取AI数据或上传截图。</div>';
 return aiRankingTable(data,!report)+`<div class="ai-ranking-source"><div class="ai-ranking-source-line" title="${esc(data.source+'；'+data.sample+'；'+data.period)}">来源：${esc(data.source.split(' · ')[0])} ｜ Amazon US ｜ 统计日期：${esc(window.AI_CATEGORY_SAMPLE.retrievedAt)} ｜ 预估月销量</div>${report?'':`<div class="ai-ranking-more"><button type="button" class="link" data-ai-rank-full="${key}">查看全部${data.rows.length}条</button></div>`}</div>`;
}
renderRankings=function(){
 const target=$('#rankingCards');if(!target)return;
 const markup=rankingDefinitions.map(([key,title])=>{const state=aiRankingState(key),busy=state.status==='running',label=busy?'AI获取中…':state.status==='error'?'获取失败':rankingSaveStates[key]==='error'?'保存失败':'';
 return `<article class="ranking-card ai-ranking-card${aiRankingFolded.has(key)?' is-rank-collapsed':''}" id="ranking-${key}"><div class="ranking-card-head"><button type="button" class="ai-rank-toggle" data-ai-rank-toggle="${key}" aria-expanded="${!aiRankingFolded.has(key)}"><span class="ai-rank-chevron" aria-hidden="true">›</span>${title}<span class="${key==='newTop'?'required':'subtle'}">（${key==='newTop'?'必填':'选填'}）</span></button><div class="ranking-card-tools"><span class="ai-status" role="status" data-status="${state.status}">${label}</span>${readOnly?'':`<button type="button" class="ai-retry" data-ai-rank-fetch="${key}" ${busy||aiBusy.has('category')?'disabled':''}>${state.structured?'AI重新获取':'AI获取榜单'}</button>${state.evidenceMode==='screenshot'&&state.structured?`<button type="button" class="link" data-ai-rank-restore="${key}">恢复AI表格</button>`:''}<button type="button" class="link" data-ai-rank-upload="${key}">${state.evidenceMode==='screenshot'?'更换截图':'替换为截图'}</button>`}</div></div><div class="ai-ranking-body" ${aiRankingFolded.has(key)?'hidden':''}>${aiRankingBody(key)}</div></article>`;}).join('');
 if(target.innerHTML!==markup)target.innerHTML=markup;refreshRankingProgress();
};
refreshRankingProgress=function(){const node=$('#rankingRequiredProgress');if(node){const ready=aiRankingHasEvidence('newTop');node.textContent=ready?'✓ 已保存':'待获取榜单';node.classList.toggle('is-complete',ready);node.classList.toggle('is-empty',!ready);}refreshCategoryControls();};
const aiRankingOriginalRefresh=refreshAiCategoryUI;refreshAiCategoryUI=function(){aiRankingOriginalRefresh();renderRankings();};
const aiRankingOriginalSample=aiCategorySampleResult;aiCategorySampleResult=function(request){if(['newTop','monthTop'].includes(request.key)){const structured=structuredClone(window.AI_CATEGORY_SAMPLE.rankings[request.key]);return {structured,basis:structured.source+'；'+structured.sample};}return aiRankingOriginalSample(request);};
async function aiRunRanking(key,batch=false,batchResult=null,decision=null){
 const state=aiRankingState(key);if(readOnly||state.status==='running')return;document.activeElement?.blur();
 if(!decision)decision=await aiCategoryAskOverwrite([key]);if(readOnly||decision==='cancel'||state.status==='running')return;
 const scopeKey=aiScopeKey(),before={version:state.imageVersion||0,mode:state.evidenceMode},token=++ai.sequence;state.status='running';state.token=token;state.attempts++;aiRefresh();
 try{
  const result=await(batchResult||aiService({kind:'category',key,scope:aiScope(),batch,attempt:state.attempts,taskId:'AI-RANK-'+token}));if(state.token!==token)return;
  if(!aiContextValid(scopeKey)){state.status='interrupted';state.message='口径已变化，结果未回填';return;}
  if(!Array.isArray(result.structured?.rows)||!result.structured.rows.length)throw Error('榜单获取失败');
  state.structured=structuredClone(result.structured);if(decision==='overwrite'&&(state.imageVersion||0)===before.version){state.evidenceMode='table';state.manual.image=false;}
  state.status='done';state.message='';if(!persist())throw Error('保存失败');rankingSaveStates[key]='saved';
 }catch{state.status='error';state.message='榜单获取失败';}finally{persist();aiRefresh();}
}
function aiRankingDrawer(key){
 const data=aiRankingState(key).structured;if(!data)return;aiCloseCategoryData();const origin=document.activeElement,mask=document.createElement('div');mask.id='aiCategoryDataDrawer';mask.className='ai-data-drawer-mask';mask.innerHTML=`<aside class="ai-data-drawer" role="dialog" aria-modal="true" aria-labelledby="aiDataDrawerTitle"><header><div><h3 id="aiDataDrawerTitle">${esc(data.title)} · 完整榜单</h3><span class="subtle">共${data.rows.length}条 · 按预估月销量排序</span></div><button type="button" class="close" data-ai-data-close aria-label="关闭完整榜单">×</button></header><div class="ai-data-drawer-body">${aiRankingTable(data)}${aiCategorySource(data,true)}<p class="ai-data-note">${esc(data.notes)}</p></div></aside>`;document.body.append(mask);mask._origin=origin;mask._overflow=document.body.style.overflow;document.body.style.overflow='hidden';mask.querySelector('[data-ai-data-close]').focus();
}
function aiRankingUpload(key){
 if(readOnly)return;const input=document.createElement('input');input.type='file';input.accept='image/*';input.onchange=()=>{
  const file=input.files?.[0];if(!file)return;if(!file.type.startsWith('image/'))return showToast('请选择图片文件','error');if(file.size>3*1024*1024)return showToast('单张图片不能超过3MB','error');
  const state=aiRankingState(key),uploadVersion=(state.uploadVersion||0)+1;state.uploadVersion=uploadVersion;const reader=new FileReader();reader.onload=()=>{if(readOnly||state.uploadVersion!==uploadVersion)return;state.screenshot={src:reader.result,alt:file.name};state.evidenceMode='screenshot';aiRankingFolded.delete(key);state.manual.image=true;state.imageVersion=(state.imageVersion||0)+1;m.rankingImages[key]=structuredClone(state.screenshot);rankingSaveStates[key]=persist()?'saved':'error';aiRefresh();};reader.onerror=()=>showToast('截图上传失败，请重试','error');reader.readAsDataURL(file);
 };input.click();
}
const aiRankingOriginalReport=rankingReportHtml;rankingReportHtml=function(rankings){if(activeHistoryTask||rankings!==m.rankingImages)return aiRankingOriginalReport(rankings);return `<div class="ai-ranking-report">${rankingDefinitions.map(([key,title])=>`<section><h4>${title}</h4>${aiRankingBody(key,true)}</section>`).join('')}</div>`;};
document.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;
 if(button.dataset.aiRankToggle){const key=button.dataset.aiRankToggle;aiRankingFolded.has(key)?aiRankingFolded.delete(key):aiRankingFolded.add(key);renderRankings();return;}
 if(button.id==='toggleCategoryItems'){if($('#categoryRankings').classList.contains('is-collapsed')){aiRankingFolded.add('newTop');aiRankingFolded.add('monthTop');}else aiRankingFolded.clear();renderRankings();}
 if(button.dataset.aiRankFull)aiRankingDrawer(button.dataset.aiRankFull);
 if(readOnly)return;
 if(button.dataset.aiRankFetch&&!aiBusy.has('category'))aiRunRanking(button.dataset.aiRankFetch);
 if(button.dataset.aiRankUpload)aiRankingUpload(button.dataset.aiRankUpload);
 if(button.dataset.aiRankRestore||button.dataset.aiRankRemove){const key=button.dataset.aiRankRestore||button.dataset.aiRankRemove,state=aiRankingState(key);state.evidenceMode='table';state.imageVersion=(state.imageVersion||0)+1;state.uploadVersion=(state.uploadVersion||0)+1;if(button.dataset.aiRankRemove){state.screenshot=null;state.manual.image=false;m.rankingImages[key]=null;}persist();aiRefresh();}
});
renderRankings();persist();
