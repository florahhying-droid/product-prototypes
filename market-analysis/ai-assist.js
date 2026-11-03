
/* Injected into the copied market controller; the original controller stays unchanged. */
const ai=m.aiAssist||=( {category:{},competitors:{},sequence:0} );
const aiBusy=new Set();
const aiMarkupCache=new WeakMap();
const aiScope=()=>({site:m.site,level:String(m.categoryLevel),category:m.category.trim()});
const aiScopeKey=()=>JSON.stringify(aiScope());
const aiSame=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function aiCategoryState(key){return ai.category[key]||=( {manual:{},status:'idle',basis:'',attempts:0} );}
function aiCompetitorState(asin){return ai.competitors[asin]||=( {manual:{},status:'idle',basis:''} );}
function aiTextStatus(state){return state.status==='running'?'AI获取中…':state.message||'';}
function aiMarkCategory(key,field){aiCategoryState(key).manual[field]=true;persist();}

function aiFormalText(value){return typeof value==='string'?value.replace(/【AI演示】/g,'').replace(/模拟商品详情/g,'商品详情').replace(/模拟样本/g,'样本').replace(/数据仅用于(?:交互)?演示[。.]?/g,'').replace(/利润率为原型演示数据[。.]?/g,'').replace(/测试样例口径/g,'数据口径').replace(/(?:原)?调用记录/g,'来源数据').replace(/记录日期/g,'获取日期'):value;}
function aiCleanSavedCopy(){
 m.dims=m.dims.map(aiFormalText);Object.values(m.drafts||{}).forEach(draft=>Object.keys(draft).forEach(key=>draft[key]=aiFormalText(draft[key])));
 const c=m.competitorAnalysis;if(c){Object.keys(c.position||{}).forEach(key=>c.position[key]=aiFormalText(c.position[key]));for(const row of c.items||[])for(const key of ['name','selling','negative','direction','remark'])row[key]=aiFormalText(row[key]);}
 const cleanData=value=>{if(typeof value==='string')return aiFormalText(value);if(Array.isArray(value))return value.map(cleanData);if(value&&typeof value==='object')for(const key of Object.keys(value))value[key]=cleanData(value[key]);return value;};
 for(const state of [...Object.values(ai.category),...Object.values(ai.competitors)]){state.basis=aiFormalText(state.basis);if(state.structured)cleanData(state.structured);}
 for(const product of products)for(const sku of product.skus){if(sku.variantTitle==='利润通过示例')sku.variantTitle='硅胶旅行分装瓶 · 浅色4件套';if(sku.variantTitle==='利润未通过示例')sku.variantTitle='硅胶旅行分装瓶 · 深色4件套';}
}
aiCleanSavedCopy();

// Preserve pre-existing edits when copying a saved original prototype into this version.
if(!ai.initialized){
 source.dimensions.forEach((dim,i)=>{const current=dimensionParts(m.dims[i]),original=dimensionParts(dim.html),state=aiCategoryState(String(i));if(current.text!==original.text)state.manual.text=true;if(!aiSame(current.images.map(x=>x.src),original.images.map(x=>x.src)))state.manual.image=true;});
 for(const record of ensureCompetitorState().items){const original=makeCompRecord(record.asin),state=aiCompetitorState(record.asin);for(const key of ['name','date','rating','reviews','price','sales','bsr','specs','selling','negative','direction','keywords'])if(!aiSame(record[key],original[key]))state.manual[key]=true;}
 const rankingState=aiCategoryState('rankings');if(m.rankingImages?.newTop?.src!=='assets/image10.png')rankingState.manual.newTop=true;if(m.rankingImages?.monthTop)rankingState.manual.monthTop=true;
 ai.initialized=true;persist();
}
function aiRefresh(){
 refreshAiCategoryUI();
 const target=$('#compDetail'),record=ensureCompetitorState().items.find(row=>row.asin===ensureCompetitorState().active);
 if(target&&record){const state=aiCompetitorState(record.asin);if(!target.querySelector('.ai-competitor-bar'))target.insertAdjacentHTML('afterbegin',`<div class="ai-competitor-bar"><span>当前ASIN：${esc(record.asin)}</span><span class="ai-status" data-ai-comp-status role="status" aria-live="polite"></span><button type="button" class="btn ai-action market-write" data-ai-get-competitor="${esc(record.asin)}">AI获取竞品分析</button></div>`);const button=target.querySelector('[data-ai-get-competitor]');button.disabled=state.status==='running';button.hidden=readOnly;button.textContent=state.status==='running'?'AI获取中…':'AI获取竞品分析';const status=target.querySelector('[data-ai-comp-status]');status.textContent=aiTextStatus(state);status.dataset.status=state.status;}
}
const aiOriginalRenderDimensions=renderDimensions;renderDimensions=function(){aiOriginalRenderDimensions();aiRefresh();};
const aiOriginalRenderCompDetail=renderCompDetail;renderCompDetail=function(){aiOriginalRenderCompDetail();aiRefresh();};
const aiOriginalSyncReadonly=syncReadOnly;syncReadOnly=function(){aiOriginalSyncReadonly();aiRefresh();};
const aiOriginalUpload=uploadCategoryImage;uploadCategoryImage=function(i,...args){aiMarkCategory(String(i),'image');return aiOriginalUpload(i,...args);};
const aiOriginalSaveRanking=saveRanking;saveRanking=function(key){aiMarkCategory('rankings',key);return aiOriginalSaveRanking(key);};

function aiMock(request){if(request.kind==='category-batch')return Promise.all(request.modules.map(key=>aiMock({kind:'category',key,scope:request.scope,batch:true,attempt:request.attempts[key]}).then(result=>[key,result],()=>[key,{error:'获取失败'}]))).then(entries=>({modules:Object.fromEntries(entries)}));return new Promise((resolve,reject)=>setTimeout(()=>{
 const scope=request.scope,context=`${scope.site} · Amazon${categoryLevelText(scope.level)} · ${scope.category}`,time=new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});
 if(request.kind==='category'){
  resolve(aiCategorySampleResult(request));
 }else{
  const record=ensureCompetitorState().items.find(row=>row.asin===request.asin),original=makeCompRecord(request.asin);
  resolve({basis:`${scope.site} · ASIN ${request.asin}；商品详情、关键词与评论样本，获取时间：${time}。`,fields:{...Object.fromEntries(['name','date','rating','reviews','price','sales','bsr','specs'].map(key=>[key,original[key]||record?.[key]||''])),selling:`${record?.name||request.asin}\n功能：关注核心使用需求与产品可靠性。\n场景：围绕主要使用场景优化组合与便携性。\n设计：通过材质、颜色与配件组合体现差异。`,negative:'高频问题：密封与耐用性、清洁便利程度、包装保护及配件完整性。建议结合真实评论复核问题频次，优先解决影响使用体验的问题。',direction:'优先优化结构可靠性与包装保护，测试不同规格、配件及组合套装；以小批量验证用户反馈后再扩大备货。',keywords:[{word:'travel containers',count:'9000+',volume:'7500'},{word:'refillable bottles',count:'5000+',volume:'3800'}]}});
 }
},180));}
function aiService(request){return window.aiPrototypeService?Promise.resolve().then(()=>window.aiPrototypeService(structuredClone(request))):aiMock(request);}
function aiContextValid(key){return !readOnly&&!activeHistoryTask&&key===aiScopeKey();}
async function aiRunCompetitor(asin){
 const record=ensureCompetitorState().items.find(row=>row.asin===asin),state=aiCompetitorState(asin);if(!record||readOnly||state.status==='running')return;
 document.activeElement?.blur();const before=structuredClone(record),scopeKey=aiScopeKey(),beforeBasis=state.basis,token=++ai.sequence;state.status='running';state.token=token;state.message='';aiRefresh();
 try{
  const result=await aiService({kind:'competitor',asin,scope:aiScope(),taskId:'AI-COMP-'+token});if(state.token!==token)return;
  if(!aiContextValid(scopeKey)||!ensureCompetitorState().items.includes(record)){state.status='interrupted';state.message='口径或竞品已变化，结果未回填';return;}
  if(!result.fields||typeof result.basis!=='string')throw new Error('返回结果不完整');let protectedCount=0;
  for(const key of ['name','date','rating','reviews','price','sales','bsr','specs','selling','negative','direction']){if(result.fields[key]===undefined)continue;if(state.manual[key]||!aiSame(record[key],before[key])){protectedCount++;continue;}if(key==='keywords'&&!Array.isArray(result.fields[key]))continue;record[key]=structuredClone(result.fields[key]);}
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

for(const state of [...Object.values(ai.category),...Object.values(ai.competitors)])if(state.status==='running'){state.status='interrupted';state.message='上次获取已中断，可重新获取';}
source.dimensions.forEach((_,i)=>{const input=$('#category-conclusion-'+i);if(input)input.value=aiFormalText(input.value);});
renderCompetitors();aiRefresh();persist();
