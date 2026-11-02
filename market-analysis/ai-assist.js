
/* Injected into the copied market controller; the original controller stays unchanged. */
const ai=m.aiAssist||=( {category:{},competitors:{},sequence:0} );
const aiBusy=new Set();
const aiScope=()=>({site:m.site,level:String(m.categoryLevel),category:m.category.trim()});
const aiScopeKey=()=>JSON.stringify(aiScope());
const aiSame=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function aiCategoryState(key){return ai.category[key]||=( {manual:{},status:'idle',basis:'',attempts:0} );}
function aiCompetitorState(asin){return ai.competitors[asin]||=( {manual:{},status:'idle',basis:''} );}
function aiTextStatus(state){return state.status==='running'?'AI获取中…':state.message||'';}
function aiMarkCategory(key,field){aiCategoryState(key).manual[field]=true;persist();}
function aiBasisMarkup(state,key,competitor=false){return `<div class="ai-evidence${competitor?' ai-competitor-evidence':''}"><label>数据依据 · 演示</label><textarea data-ai-basis="${esc(key)}" ${competitor?'data-ai-competitor-basis':''} aria-label="${competitor?'竞品':'类目模块'}数据依据" placeholder="AI获取后展示数据依据，可人工修改" ${readOnly?'disabled':''}>${esc(state.basis||'')}</textarea></div>`;}
// Preserve pre-existing edits when copying a saved original prototype into this version.
if(!ai.initialized){
 source.dimensions.forEach((dim,i)=>{const current=dimensionParts(m.dims[i]),original=dimensionParts(dim.html),state=aiCategoryState(String(i));if(current.text!==original.text)state.manual.text=true;if(!aiSame(current.images.map(x=>x.src),original.images.map(x=>x.src)))state.manual.image=true;});
 for(const record of ensureCompetitorState().items){const original=makeCompRecord(record.asin),state=aiCompetitorState(record.asin);for(const key of ['name','date','rating','reviews','price','sales','bsr','specs','selling','negative','direction','keywords'])if(!aiSame(record[key],original[key]))state.manual[key]=true;}
 const rankingState=aiCategoryState('rankings');if(m.rankingImages?.newTop?.src!=='assets/image10.png')rankingState.manual.newTop=true;if(m.rankingImages?.monthTop)rankingState.manual.monthTop=true;
 ai.initialized=true;persist();
}
function aiRefresh(){
 const head=$('#categoryAnalysisBlock > .sub-head')||$('#marketSection > .sub-head');
 if(head&&!$('#aiCategoryTools'))head.insertAdjacentHTML('beforeend','<div class="ai-category-tools" id="aiCategoryTools"><span class="ai-status" id="aiCategoryStatus" role="status" aria-live="polite"></span><button type="button" class="ai-action market-write" id="aiGetCategory">AI获取分析</button></div>');
 const all=$('#aiGetCategory');if(all){all.disabled=aiBusy.has('category')||Object.values(ai.category).some(state=>state.status==='running');all.hidden=readOnly;all.textContent=aiBusy.has('category')?'AI获取中…':'AI获取分析';}
 const summary=$('#aiCategoryStatus');if(summary)summary.textContent=aiBusy.has('category')?'按当前站点与品类获取分析…':ai.categoryMessage||'';
 for(const key of ['rankings',...source.dimensions.map((_,i)=>String(i))]){
  const card=key==='rankings'?$('#categoryRankings'):$('#dim-'+key),header=card?.querySelector(key==='rankings'?'h4':'.field-head');if(!header)continue;
  const state=aiCategoryState(key);
  if(!header.querySelector('[data-ai-category]'))header.insertAdjacentHTML('beforeend',`<span class="ai-status" data-ai-module-status="${key}" role="status" aria-live="polite"></span><button type="button" class="ai-retry market-write" data-ai-category="${key}">AI重新获取</button>`);
  const retry=header.querySelector('[data-ai-category]');retry.disabled=state.status==='running'||aiBusy.has('category');retry.hidden=readOnly;
  const status=header.querySelector('[data-ai-module-status]');status.textContent=aiTextStatus(state);status.dataset.status=state.status;
  const previous=card.querySelector('[data-ai-basis]');if(!previous)header.insertAdjacentHTML('afterend',aiBasisMarkup(state,key));else{if(document.activeElement!==previous&&previous.value!==state.basis)previous.value=state.basis;previous.disabled=readOnly;}
 }
 const target=$('#compDetail'),record=ensureCompetitorState().items.find(row=>row.asin===ensureCompetitorState().active);
 if(target&&record){const state=aiCompetitorState(record.asin);if(!target.querySelector('.ai-competitor-bar'))target.insertAdjacentHTML('afterbegin',`<div class="ai-competitor-bar"><span>当前ASIN：${esc(record.asin)}</span><span class="ai-status" data-ai-comp-status role="status" aria-live="polite"></span><button type="button" class="ai-action market-write" data-ai-get-competitor="${esc(record.asin)}">AI获取竞品分析</button></div>`+aiBasisMarkup(state,record.asin,true));const button=target.querySelector('[data-ai-get-competitor]');button.disabled=state.status==='running';button.hidden=readOnly;button.textContent=state.status==='running'?'AI获取中…':'AI获取竞品分析';const status=target.querySelector('[data-ai-comp-status]');status.textContent=aiTextStatus(state);status.dataset.status=state.status;}
}
const aiOriginalRenderDimensions=renderDimensions;renderDimensions=function(){aiOriginalRenderDimensions();aiRefresh();};
const aiOriginalRenderCompDetail=renderCompDetail;renderCompDetail=function(){aiOriginalRenderCompDetail();aiRefresh();};
const aiOriginalSyncReadonly=syncReadOnly;syncReadOnly=function(){aiOriginalSyncReadonly();aiRefresh();};
const aiOriginalUpload=uploadCategoryImage;uploadCategoryImage=function(i,...args){aiMarkCategory(String(i),'image');return aiOriginalUpload(i,...args);};
const aiOriginalSaveRanking=saveRanking;saveRanking=function(key){aiMarkCategory('rankings',key);return aiOriginalSaveRanking(key);};

function aiMock(request){if(request.kind==='category-batch')return Promise.all(request.modules.map(key=>aiMock({kind:'category',key,scope:request.scope,batch:true,attempt:request.attempts[key]}).then(result=>[key,result],()=>[key,{error:'获取失败'}]))).then(entries=>({modules:Object.fromEntries(entries)}));return new Promise((resolve,reject)=>setTimeout(()=>{
 if(request.kind==='category'&&request.key==='3'&&request.batch&&request.attempt===1){reject(new Error('本模块获取失败，请单独重新获取'));return;}
 const scope=request.scope,context=`${scope.site} · Amazon${categoryLevelText(scope.level)} · ${scope.category}`,time=new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});
 if(request.kind==='category'){
  const key=request.key,basis=`${context}。模拟样本：100个ASIN，近24个月趋势及公开商品信息；获取时间：${time}。数据仅用于交互演示。`;
  if(key==='rankings'){resolve({basis,newTop:{src:'assets/image10.png',alt:'AI演示：新品TOP10'},monthTop:{src:'assets/image10.png',alt:'AI演示：小类近30天TOP'}});return;}
  const i=Number(key),conclusions=[
   '演示样本显示市场处于稳定增长阶段，近一年需求仍有提升空间。建议先以小批量测试差异化组合，结合真实销量数据验证市场容量。',
   '演示趋势呈现季节性波动，旺季前应提前备货。建议结合主要节日、站点流量及物流时效制定上新节奏。',
   '演示样本中头部商品占比较高，但长尾仍有细分机会。建议通过规格组合、使用场景及包装设计减少同质化竞争。',
   '演示样本中新老商品共同分布，近期上新仍能获得销量。建议优先分析新商品的差异化策略，并观察其增长持续性。',
   '演示价格分布以中间价格带为主。建议结合采购成本、物流费用及目标利润，评估单品与组合套装的定价空间。',
   '演示样本包含多类型卖家，供给较充分。建议从交付能力、产品质量、售后及差异化服务建立竞争优势。',
   '演示用户更关注便捷性、可靠性与性价比。建议结合真实评论划分目标人群，并验证其购买动机与关键痛点。',
   '演示使用场景包括日常使用、外出携带和礼赠。建议围绕高频使用场景优化产品结构、套装与说明内容。'
  ];resolve({basis,conclusion:`【AI演示】${source.dimensions[i].title}\n调研口径：${context}\n${conclusions[i]}`,image:dimensionParts(source.dimensions[i].html).images[0]});
 }else{
  const record=ensureCompetitorState().items.find(row=>row.asin===request.asin),original=makeCompRecord(request.asin);
  resolve({basis:`${scope.site} · ASIN ${request.asin}；模拟商品详情、关键词与评论样本，获取时间：${time}。数据仅用于演示。`,fields:{...Object.fromEntries(['name','date','rating','reviews','price','sales','bsr','specs'].map(key=>[key,original[key]||record?.[key]||''])),selling:`【AI演示】${record?.name||request.asin}\n功能：关注核心使用需求与产品可靠性。\n场景：围绕主要使用场景优化组合与便携性。\n设计：通过材质、颜色与配件组合体现差异。`,negative:'【AI演示】高频问题：密封与耐用性、清洁便利程度、包装保护及配件完整性。建议结合真实评论复核问题频次，优先解决影响使用体验的问题。',direction:'【AI演示】优先优化结构可靠性与包装保护，测试不同规格、配件及组合套装；以小批量验证用户反馈后再扩大备货。',keywords:[{word:'travel containers',count:'9000+',volume:'7500'},{word:'refillable bottles',count:'5000+',volume:'3800'}]}});
 }
},900));}
function aiService(request){return window.aiPrototypeService?Promise.resolve().then(()=>window.aiPrototypeService(structuredClone(request))):aiMock(request);}
function aiContextValid(key){return !readOnly&&!activeHistoryTask&&key===aiScopeKey();}
async function aiRunCategory(key,batch=false,batchResult=null){
 const state=aiCategoryState(key);if(state.status==='running'||readOnly)return;
 const scopeKey=aiScopeKey(),scope=aiScope();if(!scope.site||!scope.level||!scope.category){showToast('请先选择站点、品类等级和调研品类','error');return;}
 const node=$('#category-conclusion-'+key),before={text:node?.value,images:key==='rankings'?structuredClone(m.rankingImages):structuredClone(dimensionImages[Number(key)]||[]),basis:state.basis},token=++ai.sequence;
 state.status='running';state.token=token;state.attempts++;state.message='';aiRefresh();
 try{
  const result=await (batchResult||aiService({kind:'category',key,scope,batch,attempt:state.attempts,taskId:'AI-CAT-'+token}));
  if(state.token!==token)return;
  if(!aiContextValid(scopeKey)){state.status='interrupted';state.message='口径或状态已变化，结果未回填';return;}
  if(typeof result.basis!=='string'||(key!=='rankings'&&typeof result.conclusion!=='string'))throw new Error('返回结果不完整');
  let protectedCount=0;
  if(!state.manual.basis&&state.basis===before.basis)state.basis=result.basis;else protectedCount++;
  if(key==='rankings'){
   for(const rank of ['newTop','monthTop']){if(state.manual[rank]||!aiSame(m.rankingImages[rank],before.images[rank])){protectedCount++;continue;}if(result[rank]?.src)m.rankingImages[rank]=structuredClone(result[rank]);}renderRankings();
  }else{
   const i=Number(key),input=$('#category-conclusion-'+i);
   if(!state.manual.text&&input.value===before.text)input.value=result.conclusion;else protectedCount++;
   if(i<6&&result.image){if(!state.manual.image&&aiSame(dimensionImages[i],before.images))dimensionImages[i]=[structuredClone(result.image)];else protectedCount++;}
   categorySaveVersions[i]=(categorySaveVersions[i]||0)+1;m.dims[i]=dimensionHtml(i);categorySaveStates[i]='saved';renderCategoryGallery(i);
  }
  state.status='done';state.message=protectedCount?'AI已更新 · 保留人工修改':'AI已更新';if(!persist()){state.status='error';state.message='保存失败，可重新获取';}
 }catch(error){state.status='error';state.message='获取失败，请重新获取';}
 finally{persist();aiRefresh();refreshCategoryControls();}
}
async function aiRunAll(){
 if(readOnly||aiBusy.has('category')||Object.values(ai.category).some(state=>state.status==='running'))return;
 document.activeElement?.blur();if(!m.site||!m.categoryLevel||!m.category.trim()){showToast('请先选择站点、品类等级和调研品类','error');return;}
 const modules=['rankings',...source.dimensions.map((_,i)=>String(i))],taskId='AI-CAT-BATCH-'+(++ai.sequence);
 aiBusy.add('category');aiRefresh();
 const response=aiService({kind:'category-batch',scope:aiScope(),taskId,modules,attempts:Object.fromEntries(modules.map(key=>[key,aiCategoryState(key).attempts+1]))});
 await Promise.all(modules.map(key=>aiRunCategory(key,true,response.then(result=>{const module=result.modules?.[key];if(!module||module.error)throw new Error('模块获取失败');return module;}))));
 aiBusy.delete('category');const failed=Object.values(ai.category).filter(state=>state.status==='error').length;
 ai.categoryMessage=failed?`${failed}个模块获取失败，可单独重新获取`:'本次获取结束，已保留人工修改';persist();aiRefresh();
}
async function aiRunCompetitor(asin){
 const record=ensureCompetitorState().items.find(row=>row.asin===asin),state=aiCompetitorState(asin);if(!record||readOnly||state.status==='running')return;
 document.activeElement?.blur();const before=structuredClone(record),scopeKey=aiScopeKey(),beforeBasis=state.basis,token=++ai.sequence;state.status='running';state.token=token;state.message='';aiRefresh();
 try{
  const result=await aiService({kind:'competitor',asin,scope:aiScope(),taskId:'AI-COMP-'+token});if(state.token!==token)return;
  if(!aiContextValid(scopeKey)||!ensureCompetitorState().items.includes(record)){state.status='interrupted';state.message='口径或竞品已变化，结果未回填';return;}
  if(!result.fields||typeof result.basis!=='string')throw new Error('返回结果不完整');let protectedCount=0;
  for(const key of ['name','date','rating','reviews','price','sales','bsr','specs','selling','negative','direction','keywords']){if(result.fields[key]===undefined)continue;if(state.manual[key]||!aiSame(record[key],before[key])){protectedCount++;continue;}if(key==='keywords'&&!Array.isArray(result.fields[key]))continue;record[key]=structuredClone(result.fields[key]);}
  if(!state.manual.basis&&state.basis===beforeBasis)state.basis=result.basis;else protectedCount++;
  state.status='done';state.message=protectedCount?'AI已更新 · 保留人工修改':'AI已更新';if(!persist()){state.status='error';state.message='保存失败，请重新获取';}
  renderCompList();if(ensureCompetitorState().active===asin)renderCompDetail();
 }catch(error){state.status='error';state.message='获取失败，可重新获取';}
 finally{persist();aiRefresh();}
}
document.addEventListener('input',event=>{
 if(readOnly)return;const el=event.target;
 if(el.matches('.category-conclusion'))aiMarkCategory(el.dataset.key.split(':')[1],'text');
 else if(el.hasAttribute('data-ai-basis')){const state=el.hasAttribute('data-ai-competitor-basis')?aiCompetitorState(el.dataset.aiBasis):aiCategoryState(el.dataset.aiBasis);state.basis=el.value;state.manual.basis=true;persist();}
 else if(el.closest('#compDetail')){const asin=ensureCompetitorState().active,state=aiCompetitorState(asin);if(el.dataset.cfield)state.manual[el.dataset.cfield]=true;if(el.dataset.compKw)state.manual.keywords=true;persist();}
},true);
document.addEventListener('click',event=>{
 const el=event.target.closest('button');if(!el||readOnly)return;
 if(el.id==='aiGetCategory'){aiRunAll();return;}
 if(el.hasAttribute('data-ai-category')){if(!aiBusy.has('category'))aiRunCategory(el.dataset.aiCategory);return;}
 if(el.hasAttribute('data-ai-get-competitor')){aiRunCompetitor(el.dataset.aiGetCompetitor);return;}
 if(el.hasAttribute('data-category-delete'))aiMarkCategory(el.dataset.categoryDelete.split(':')[0],'image');
 if(el.hasAttribute('data-comp-keyword-delete')||el.hasAttribute('data-comp-keyword-add')){aiCompetitorState(ensureCompetitorState().active).manual.keywords=true;persist();}
},true);
const badge=document.createElement('span');badge.className='ai-version-badge';badge.textContent='AI辅助版 · 模拟生成，仅用于演示';$('.detail-name')?.append(badge);
for(const state of [...Object.values(ai.category),...Object.values(ai.competitors)])if(state.status==='running'){state.status='interrupted';state.message='上次获取已中断，可重新获取';}
aiRefresh();persist();
