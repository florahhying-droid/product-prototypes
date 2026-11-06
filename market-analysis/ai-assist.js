// History fixtures use the same structured payload as the AI-assisted sample.
categoryHistoryRecords.forEach(record=>{
 record.structured=structuredClone(window.AI_CATEGORY_SAMPLE.modules);
 record.dimensions=source.dimensions.map((_,i)=>`<p>${esc(i<6?record.structured[i].conclusion:window.AI_CATEGORY_SAMPLE.textConclusions[i-6]).replace(/\n/g,'<br>')}</p>`);
 record.rankings={};record.analysisFormat='structured';
});
if(activeHistoryTask)m.dims=[...activeHistoryTask.dimensions];


/* Injected into the copied market controller; the original controller stays unchanged. */
const ai=m.aiAssist||=( {category:{},competitors:{},sequence:0} );
const aiBusy=new Set();
let aiCategorySubmitting=false;
const aiMarkupCache=new WeakMap();
const aiScope=()=>({site:m.site,level:String(m.categoryLevel),category:m.category.trim()});
const aiScopeKey=()=>JSON.stringify(aiScope());
const aiSame=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function aiCategoryState(key){return ai.category[key]||=( {manual:{},status:'idle',basis:'',attempts:0} );}
function aiCompetitorState(asin){return ai.competitors[asin]||=( {manual:{},status:'idle',basis:''} );}
function aiTextStatus(state){return state.status==='running'?'AI获取中…':state.message||'';}
function aiMarkCategory(key,field){aiCategoryState(key).manual[field]=true;persist();}
function aiCompetitorSampleResult(asin,site=m.site){return aiMockCompetitorSource({asin,marketplace:site});}
function aiApplyCompetitorSample(){aiInitCompetitorComparison();}

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
 for(const record of ensureCompetitorState().items){const original=makeCompRecord(record.asin),state=aiCompetitorState(record.asin);for(const key of ['name','date','rating','reviews','price','sales','bsr','specs','targetUsers','userPainPoints','usageScenarios','negative','direction','keywords'])if(!aiSame(record[key],original[key]))state.manual[key]=true;}
 const rankingState=aiCategoryState('rankings');if(m.rankingImages?.newTop?.src!=='assets/image10.png')rankingState.manual.newTop=true;if(m.rankingImages?.monthTop)rankingState.manual.monthTop=true;
 ai.initialized=true;persist();
}
function aiRefresh(){
 refreshAiCategoryUI();
 const target=$('#compDetail'),record=ensureCompetitorState().items.find(row=>row.asin===ensureCompetitorState().active);
 if(target&&record){const state=aiCompetitorState(record.asin);if(!target.querySelector('.ai-competitor-bar'))target.insertAdjacentHTML('afterbegin',`<div class="ai-competitor-bar"><span>当前ASIN：${esc(record.asin)}</span><span class="ai-status" data-ai-comp-status role="status" aria-live="polite"></span><button type="button" class="btn primary ai-action market-write" data-ai-get-competitor="${esc(record.asin)}">AI获取竞品分析</button></div>`);const button=target.querySelector('[data-ai-get-competitor]');button.disabled=state.status==='running'&&state.requestSite===m.site;button.hidden=readOnly;button.classList.add('primary');button.setAttribute('aria-busy',String(button.disabled));aiSetMarkup(button,aiImportIcon()+'<span>'+(button.disabled?'AI分析中':state.hasRequested||state.comparison?'AI重新分析':'AI分析')+'</span>');const status=target.querySelector('[data-ai-comp-status]');status.textContent=state.status==='running'?'':aiTextStatus(state);status.dataset.status=state.status;}
 aiRenderCompetitorComparison();
}
const aiOriginalRenderDimensions=renderDimensions;renderDimensions=function(){aiOriginalRenderDimensions();aiRefresh();};
const aiOriginalRenderCompDetail=renderCompDetail;renderCompDetail=function(){aiApplyCompetitorSample();aiOriginalRenderCompDetail();aiRefresh();};
const aiOriginalSyncReadonly=syncReadOnly;syncReadOnly=function(){aiOriginalSyncReadonly();aiRefresh();};
const aiOriginalUpload=uploadCategoryImage;uploadCategoryImage=function(i,...args){aiMarkCategory(String(i),'image');return aiOriginalUpload(i,...args);};
const aiOriginalSaveRanking=saveRanking;saveRanking=function(key){aiMarkCategory('rankings',key);return aiOriginalSaveRanking(key);};

function aiMock(request){if(request.kind==='category-batch')return Promise.all(request.modules.map(key=>aiMock({kind:'category',key,scope:request.scope,batch:true,attempt:request.attempts[key]}).then(result=>[key,result],()=>[key,{error:'获取失败'}]))).then(entries=>({modules:Object.fromEntries(entries)}));return new Promise((resolve,reject)=>setTimeout(()=>{
 const scope=request.scope,context=`${scope.site} · Amazon${categoryLevelText(scope.level)} · ${scope.category}`,time=new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});
 if(request.kind==='category'){
  resolve(aiCategorySampleResult(request));
 }else{resolve(aiMockCompetitorSource(request));}
},180));}
function aiService(request){return window.aiPrototypeService?Promise.resolve().then(()=>window.aiPrototypeService(structuredClone(request))):aiMock(request);}
function aiContextValid(key){return !readOnly&&!activeHistoryTask&&key===aiScopeKey();}
async function aiRunCompetitor(asin){return aiFetchCompetitorComparison(asin);}

document.addEventListener('input',event=>{
 if(readOnly)return;const el=event.target;
 if(el.matches('.category-conclusion'))aiMarkCategory(el.dataset.key.split(':')[1],'text');
 else if(el.hasAttribute('data-ai-basis')){const state=el.hasAttribute('data-ai-competitor-basis')?aiCompetitorState(el.dataset.aiBasis):aiCategoryState(el.dataset.aiBasis);state.basis=el.value;state.manual.basis=true;persist();}
 else if(el.closest('#compDetail')){const asin=ensureCompetitorState().active,state=aiCompetitorState(asin);if(el.dataset.cfield)state.manual[el.dataset.cfield]=true;if(el.dataset.compKw)state.manual.keywords=true;persist();}
},true);
document.addEventListener('click',event=>{
 const el=event.target.closest('button');if(!el||readOnly)return;
 if(el.id==='aiGetCategory'){if(!el.disabled)aiOpenImportDialog();return;}
 if(el.hasAttribute('data-ai-category')){if(!aiBusy.has('category'))aiRunCategory(el.dataset.aiCategory);return;}
 if(el.hasAttribute('data-ai-get-competitor')){aiRunCompetitor(el.dataset.aiGetCompetitor);return;}
 if(el.hasAttribute('data-comp-feedback-upload')||el.hasAttribute('data-comp-feedback-delete'))aiCompetitorState(ensureCompetitorState().active).manual.feedback=true;
 if(el.hasAttribute('data-category-delete'))aiMarkCategory(el.dataset.categoryDelete.split(':')[0],'image');
 if(el.hasAttribute('data-comp-keyword-delete')||el.hasAttribute('data-comp-keyword-add')){aiCompetitorState(ensureCompetitorState().active).manual.keywords=true;persist();}
},true);

for(const state of [...Object.values(ai.category),...Object.values(ai.competitors)])if(state.status==='running'){state.status='interrupted';state.message='上次获取已中断，可重新获取';}
source.dimensions.forEach((_,i)=>{const input=$('#category-conclusion-'+i);if(input)input.value=aiFormalText(input.value);});
renderCompetitors();aiRefresh();persist();
