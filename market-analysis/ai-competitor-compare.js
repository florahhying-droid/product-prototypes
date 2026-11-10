function aiWarningIcon(){return '<span class="ai-warning-icon" aria-hidden="true">!</span>';}
const aiCompNumberDigits={price:2,rating:1,reviews:0,sales:0};
const aiCompOriginalControl=compControl;
compControl=function(record,key,...args){
 const html=aiCompOriginalControl(record,key,...args);
 if(!(key in aiCompNumberDigits))return html;
 const digits=aiCompNumberDigits[key];
 return html.replace('<input ',`<input data-comp-number="${digits}" inputmode="${digits?'decimal':'numeric'}" placeholder="${digits?'0.'+'0'.repeat(digits):'0'}" `);
};
function aiCompNumberInput(input){return input?.matches?.('#compDetail [data-comp-number]')&&!input.disabled;}
function aiCompTruncateNumber(input){
 const match=input.value.match(/^(-?\d*)\.(\d*)$/);if(!match)return;
 const digits=Number(input.dataset.compNumber);
 input.value=digits?(match[1]||'0')+'.'+match[2].slice(0,digits):(match[1]==='-'?'-0':match[1]||'0');
}
function aiCompValidateNumber(input){
 const field=input.closest('.comp-form-field');if(!field)return false;
 field.querySelector('[data-comp-number-error]')?.remove();input.removeAttribute('aria-invalid');
 let message='';const value=input.value;
 if(input.validity?.badInput)message='请输入有效数字';
 else if(value){
  if(Number(value)<0||value.startsWith('-'))message='不能为负数';
  else if(!/^\d+(?:\.\d*)?$/.test(value))message='请输入有效数字';
  else if(input.dataset.cfield==='rating'&&Number(value)>5)message='评分须在0～5之间';
 }
 if(message){input.setAttribute('aria-invalid','true');field.querySelector('.comp-control').insertAdjacentHTML('beforeend',`<div class="field-error" data-comp-number-error role="alert">${message}</div>`);}
 return !message;
}
// Truncate before the existing input handler saves task-local field values.
document.addEventListener('input',event=>{if(aiCompNumberInput(event.target))aiCompTruncateNumber(event.target);},true);
document.addEventListener('input',event=>{if(aiCompNumberInput(event.target))aiCompValidateNumber(event.target);});
document.addEventListener('focusout',event=>{
 const input=event.target;if(!aiCompNumberInput(input))return;
 aiCompTruncateNumber(input);
 if(aiCompValidateNumber(input)&&input.value){
  input.value=Number(input.value).toFixed(Number(input.dataset.compNumber));
  const record=ensureCompetitorState().items.find(item=>item.asin===ensureCompetitorState().active);if(record)record[input.dataset.cfield]=input.value;
 }
},true);
/* Agent supplies independent results. AC owns reconciliation and field-level decisions. */
const AI_COMP_KEYS=['name','english','categoryPath','date','price','rating','reviews','sales','bsr','specs','targetUsers','userPainPoints','usageScenarios','negative','feedback','direction','remark'];
const AI_COMP_SOURCE_KEYS={name:'productName',english:'englishTitle',date:'listingDate',price:'priceUsd',reviews:'ratingCount',sales:'estimatedSales30d',bsr:'bsrSmallCategoryRank',specs:'specifications',negative:'coreNegativeReviews',feedback:'reviewImages',direction:'differentiationDirection'};
function aiCompEmpty(value){return value===null||value===undefined||Array.isArray(value)&&!value.length||typeof value==='string'&&['','--','—'].includes(value.trim());}
function aiCompText(value){return String(value??'').normalize('NFKC').replace(/\s+/g,' ').trim();}
function aiCompNumber(value,key,meta={}){
 let text=aiCompText(value),unit=meta.unit||'',qualifier=/[+＋]|至少|以上|at least/i.test(text)?'at-least':/约|估算|预估|estimated|approx/i.test(text)?'estimated':'';
 if(key==='price'){const currency=text.match(/USD|CNY|EUR|GBP|US\$|人民币|美元|欧元|英镑|[$€£¥￥]/i)?.[0];unit=currency?({'US$':'USD','$':'USD','美元':'USD','人民币':'CNY','¥':'CNY','￥':'CNY','€':'EUR','欧元':'EUR','£':'GBP','英镑':'GBP'}[currency]||currency.toUpperCase()):unit||'USD';}
 if(key==='rating')unit=/%|百分比/.test(text)?'percent':unit||'stars';
 if(key==='reviews')unit=unit||'count';
 text=text.replace(/(?<=\d)[,，](?=\d{3}(?:\D|$))/g,'');
 const match=text.match(/[-+]?\d+(?:\.\d+)?/);if(!match)return null;
 let number=Number(match[0]),tail=text.slice(match.index+match[0].length);if(/^\s*[kK]/.test(tail))number*=1000;if(/^\s*万/.test(tail))number*=10000;
 if(!Number.isFinite(number))return null;
 if(key==='rating'&&(number<0||number>5||Math.abs(number*10-Math.round(number*10))>1e-8)||key==='reviews'&&(!Number.isInteger(number)||number<0)||key==='price'&&(number<0||Math.abs(number*100-Math.round(number*100))>1e-8))return null;
 unit=({'美元':'USD','$':'USD','usd':'USD','星':'stars','star':'stars','条':'count','reviews':'count'}[unit]||unit);
 return {number,unit,qualifier};
}
function aiCompDate(value){const match=aiCompText(value).match(/^(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})(?:日|(?:T|\s).*)?$/);if(!match)return null;const y=+match[1],m=+match[2],d=+match[3],date=new Date(Date.UTC(y,m-1,d));return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`:null;}
function aiCompSales(value,meta={}){
 const text=aiCompText(value),n=aiCompNumber(value,'sales',meta);if(!n)return null;
 const period=meta.period||(/非精确30天/.test(text)?'month':/月|month|\/mo\b/i.test(text)?'month':/30\s*(天|days)|30d/i.test(text)?'30d':'unspecified');
 const unit=/kg|千克|公斤/i.test(text)?'kg':/件|units?|个|pcs/i.test(text)?'units':meta.unit||'units';
 return {...n,unit,period,qualifier:n.qualifier==='at-least'?'at-least':'',estimated:meta.estimated??/估算|预估|estimated|approx/i.test(text)};
}
function aiCompBsr(value,meta={}){const n=aiCompNumber(value,'bsr',meta);if(!n)return null;const text=aiCompText(value),category=meta.category||text.replace(/^.*?\d+[\s.)]*/,'').replace(/Sorftime|SellerSprite|卖家精灵|^in\s+/gi,'').replace(/[()（）;；#]/g,'').trim().toLowerCase();return {number:n.number,category};}
function aiCompEquivalent(key,current,result){
 if(key==='feedback'){const urls=items=>(items||[]).map(item=>typeof item==='string'?item:item.src||item.url||'');return aiSame(urls(current),urls(result.value));}
 const value=result.value;if(['price','rating','reviews'].includes(key)){const a=aiCompNumber(current,key),b=aiCompNumber(value,key,result);return !!(a&&b&&Math.abs(a.number-b.number)<1e-9&&a.unit===b.unit&&a.qualifier===b.qualifier);}
 if(key==='date'){const a=aiCompDate(current),b=aiCompDate(value);return a&&b?a===b:aiCompText(current)===aiCompText(value);}
 if(key==='sales'){const a=aiCompSales(current,/^\d+$/.test(String(current).trim())?result:{}),b=aiCompSales(value,result);return a&&b?Math.abs(a.number-b.number)<1e-9&&a.period===b.period&&a.unit===b.unit&&a.estimated===b.estimated&&a.qualifier===b.qualifier:aiCompText(current)===aiCompText(value);}
 if(key==='bsr'){const a=aiCompBsr(current),b=aiCompBsr(value,result);return a&&b?a.number===b.number&&(!a.category||!b.category||a.category===b.category):aiCompText(current)===aiCompText(value);}
 if(Array.isArray(value))return aiSame(current,value);
 return aiCompText(current)===aiCompText(value);
}
function aiCompStoredValue(key,result){
 if(key==='feedback')return result.value.slice(0,3).map(item=>typeof item==='string'?{src:item,alt:'用户反馈图片'}:structuredClone(item));
 if(['price','rating','reviews'].includes(key))return String(aiCompNumber(result.value,key,result).number);
 if(key==='date')return aiCompDate(result.value);
 if(key==='sales')return String(aiCompSales(result.value,result).number);
 return structuredClone(result.value);
}
function aiNormalizeCompResponse(response,asin,site){
 if(response?.status==='failed'||response?.scene&&response.scene!=='competitor_analysis')throw Error('AI分析失败或场景不匹配');
 // Skill JSON uses ratingCount; the legacy AC storage key remains reviews.
 if(response?.basicInfo&&!response.fields){
  const values={...response.basicInfo,...response.marketPosition,...response.userFeedback,...response.developmentAdvice},quality=response.dataQuality||{};
  response={...response,fields:Object.fromEntries(AI_COMP_KEYS.map(key=>{
   const sourceKey=AI_COMP_SOURCE_KEYS[key]||key,value=values[sourceKey];
   const missing=quality.missingFields?.find(item=>item.field===sourceKey||item.field?.endsWith('.'+sourceKey));
   return [key,{status:aiCompEmpty(value)?'missing':'success',value,reason:missing?.reason||'',source:quality.fieldSources?.[sourceKey]||quality.fieldSources?.['basicInfo.'+sourceKey]||''}];
  }))};
 }
 if(!response||response.asin&&response.asin!==asin||response.marketplace&&response.marketplace!==site||!response.fields||typeof response.fields!=='object')throw Error('AI返回数据与请求不匹配');
 const fields={};
 for(const key of AI_COMP_KEYS){
  if(key==='remark')continue;
  const raw=response.fields[key];if(raw===undefined)continue;
  const result=raw&&typeof raw==='object'&&!Array.isArray(raw)&&'status' in raw?structuredClone(raw):{status:aiCompEmpty(raw)?'missing':'success',value:structuredClone(raw)};
  if(!['success','missing','failed','unavailable'].includes(result.status))throw Error('AI字段状态无效');
  if(result.status==='success'&&!aiCompEmpty(result.value)){
   if(['price','rating','reviews'].includes(key)){const number=aiCompNumber(result.value,key,result);if(!number||key==='price'&&number.unit!=='USD'||key==='rating'&&number.unit!=='stars'||key==='reviews'&&number.unit!=='count')throw Error('AI数值类型或单位无效');}
   if(key==='sales'){const sales=aiCompSales(result.value,result);if(!sales||sales.number<0||!Number.isInteger(sales.number)||sales.unit!=='units')throw Error('AI销量应为非负整数');}
   if(key==='date'&&!aiCompDate(result.value))throw Error('AI日期格式无效');
   if(key==='feedback'&&!Array.isArray(result.value))throw Error('AI图片格式无效');
  }else{result.status='missing';delete result.value;}
  fields[key]=result;
 }
 if(!Object.keys(fields).length)throw Error('AI未返回可识别字段');
 return {marketplace:site,fields,sourceStatus:response.status||response.sourceStatus||'done',dataQuality:structuredClone(response.dataQuality||{}),receivedAt:new Date().toISOString()};
}
function aiCompRelation(record,key,result){if(!result)return '';if(result.status!=='success')return aiCompEmpty(record[key])?'missing':'';if(aiCompEmpty(record[key]))return '';return aiCompEquivalent(key,record[key],result)?'':'difference';}
function aiMigrateCompetitorAnalysis(){
 if(readOnly||activeHistoryTask)return;
 for(const record of ensureCompetitorState().items){
  const state=aiCompetitorState(record.asin);if(state.firstAnalysisRulesVersion===3)continue;
  // Older saved demos did not persist whether an effective first result had completed.
  state.analysisCompleted=!!(state.analysisCompleted||state.comparison||state.hasRequested&&state.status==='done');
  if(state.analysisCompleted)state.analysisMarketplace=state.analysisMarketplace||state.comparison?.marketplace||state.requestSite||m.site;
  else{
   for(const key of AI_COMP_KEYS)if(key!=='remark'&&!state.manual[key])record[key]=key==='feedback'?[]:'';
   state.comparison=null;
  }
  if(state.comparison){
   if(state.comparison.marketplace===m.site)for(const key of ['english','categoryPath']){
    const result=state.comparison.fields?.[key];
    if(result?.status==='success'&&!aiCompEmpty(result.value))record[key]=aiCompStoredValue(key,result);
   }
   delete state.comparison.fields?.remark;
   for(const key of ['remark','english','categoryPath'])delete state.comparison.outcomes?.[key];
  }
  state.firstAnalysisRulesVersion=3;
 }
 persist();
}
function aiReconcileCompetitor(record,response,site,reanalysis=true){
 const comparison=aiNormalizeCompResponse(response,record.asin,site);
 for(const [key,result]of Object.entries(comparison.fields))if(result.status==='success'&&(aiCompEmpty(record[key])||['english','categoryPath'].includes(key)))record[key]=aiCompStoredValue(key,result);
 comparison.reanalysis=reanalysis;
 comparison.outcomes=Object.fromEntries(Object.entries(comparison.fields).map(([key,result])=>{const relation=aiCompRelation(record,key,result);return [key,['english','categoryPath'].includes(key)||relation==='difference'&&!reanalysis?'':relation];}));
 const state=aiCompetitorState(record.asin);state.comparison=comparison;state.sourceStatus=comparison.sourceStatus;state.dataQuality=comparison.dataQuality;
 return comparison;
}
function aiMockCompetitorSource(request){
 // This provider uses fixed fixtures only. Never read AC records/drafts to form AI output.
 const asin=request.asin,site=request.marketplace||request.scope?.site,sample=window.AI_COMPETITOR_SAMPLE;
 if(sample&&asin===sample.asin&&site===sample.marketplace){
  const b=sample.basicInfo,p=sample.marketPosition,d=sample.developmentAdvice;
  const values={name:b.productName,english:b.englishTitle,categoryPath:b.categoryPath,date:b.listingDate,price:b.priceUsd,rating:b.rating,reviews:b.ratingCount,sales:b.estimatedSales30d,bsr:b.bsrSmallCategoryRank,specs:b.specifications,...p,direction:d.differentiationDirection,remark:d.remark};
  const fields=Object.fromEntries(Object.entries(values).map(([key,value])=>[key,{status:aiCompEmpty(value)?'missing':'success',value,source:sample.dataQuality.fieldSources[AI_COMP_SOURCE_KEYS[key]||key]||'',...(key==='price'?{unit:'USD'}:key==='rating'?{unit:'stars'}:key==='reviews'?{unit:'count'}:{})}]));
  fields.negative={status:'missing',reason:sample.userFeedback.coreNegativeReviews,source:sample.dataQuality.fieldSources.coreNegativeReviews};
  if(aiCompEmpty(b.ratingCount))fields.reviews={status:'missing',reason:'演示样本未提供可核验的ratings评分数，请人工补充。'};
  fields.feedback={status:'missing',reason:sample.dataQuality.fieldSources.reviewImages,source:'Sorftime product_reviews'};
  Object.assign(fields.sales,{value:1448,unit:'units',period:'month',estimated:true,scope:'Sorftime月销量估算，非精确30天订单数'});
  return {scene:'competitor_analysis',asin,marketplace:site,status:'partial',fields,dataQuality:structuredClone(sample.dataQuality)};
 }
 const fields=Object.fromEntries(AI_COMP_KEYS.map(key=>[key,{status:'missing',reason:'未获取到当前ASIN在该站点的对应字段数据，请人工补充。'}]));
 return {scene:'competitor_analysis',asin,marketplace:site,status:'partial',fields,dataQuality:{sourcesUsed:[],missingFields:AI_COMP_KEYS.slice()}};
}
function aiInitCompetitorComparison(){
 const sample=window.AI_COMPETITOR_SAMPLE;if(activeHistoryTask||!sample||sample.marketplace!==m.site)return;
 for(const item of ensureCompetitorState().items){const itemState=aiCompetitorState(item.asin);if(itemState.numericSalesVersion===1)continue;const sales=aiCompSales(item.sales);if(!itemState.manual.sales&&!aiCompEmpty(item.sales)&&sales&&sales.unit==='units'&&Number.isInteger(sales.number)&&sales.number>=0){itemState.previousSalesValue=item.sales;item.sales=String(sales.number);}itemState.numericSalesVersion=1;}
 const record=ensureCompetitorState().items.find(r=>r.asin===sample.asin);if(!record)return;
 const state=aiCompetitorState(record.asin);
 if(state.ratingCountVersion!==1){
  const previous=state.comparison?.fields?.reviews;
  // Discard only a provable automatic comment count; retain manually maintained AC values.
  if(!state.manual.reviews&&previous?.status==='success'&&/Sorftime/.test(previous.source||'')&&String(record.reviews)===String(previous.value))record.reviews='';
  if(state.comparison?.fields){delete state.comparison.fields.reviews;delete state.comparison.outcomes?.reviews;}
  state.ratingCountVersion=1;persist();
 }
 if(state.comparisonVersion===2)return;
 // Migrate only the previous automatic placeholder, never genuine manual review content.
 if(!state.manual.negative&&record.negative===sample.userFeedback.coreNegativeReviews)record.negative='';
 if(!state.manual.sales&&record.sales===sample.basicInfo.estimatedSales30d)record.sales='1448';
 aiReconcileCompetitor(record,aiMockCompetitorSource({asin:record.asin,marketplace:m.site}),m.site,false);
 state.analysisCompleted=true;state.analysisMarketplace=m.site;state.hasRequested=true;
 state.comparisonVersion=2;state.status='done';state.message='';persist();
}
function aiCompFieldHost(key){
 if(key==='english')return $('#compDetail .comp-original-title:not(.comp-category-path)');
 if(key==='categoryPath')return $('#compDetail .comp-category-path');
 if(key==='feedback')return $('#compDetail .comp-feedback-images');
 return $('#cf-'+key+' .comp-control');
}
function aiCompDisplay(value){return Array.isArray(value)?`${value.length}张图片`:String(value??'');}
function aiRenderCompetitorComparison(){
 const target=$('#compDetail'),c=ensureCompetitorState(),record=c.items.find(r=>r.asin===c.active);if(!target||!record)return;
 const state=aiCompetitorState(record.asin),comparison=state.comparison?.marketplace===m.site?state.comparison:null;
 target.querySelectorAll('[data-ai-field-note]').forEach(node=>node.remove());
 target.querySelectorAll('[data-ai-described]').forEach(input=>{input.removeAttribute('aria-describedby');input.removeAttribute('data-ai-described');});
 let count=0;
 if(comparison)for(const [key,result]of Object.entries(comparison.fields)){
  if(['english','categoryPath','remark'].includes(key))continue;
  const relation=comparison.outcomes?.[key];if(!relation)continue;
  const host=aiCompFieldHost(key);if(!host)continue;
  if(relation==='missing'&&(!result.reason||!compFieldDefinitions.some(([name])=>name===key)))continue;
  const note=document.createElement('div');note.id='ai-note-'+key;note.dataset.aiFieldNote=key;note.className='ai-field-note '+(relation==='difference'?'ai-field-difference':'ai-field-missing');note.setAttribute('role','status');
  if(relation==='difference'){
   count++;
   note.innerHTML=`<div class="ai-difference-line">${aiWarningIcon()}<span class="ai-difference-preview" title="${esc(aiCompDisplay(result.value))}">AI值：${esc(aiCompDisplay(result.value))}</span>${readOnly?'':`<button type="button" class="link ai-adopt-value" data-ai-adopt-field="${key}" ${state.status==='running'?'disabled':''}>采用AI值</button>`}</div>`;
  }else note.innerHTML=`<span class="ai-missing-icon ai-warning-icon" aria-hidden="true">!</span><span>${esc(result.reason)}</span>`;
  host.append(note);const input=$('#ci-'+key);if(input){input.setAttribute('aria-describedby',note.id);input.dataset.aiDescribed='true';}
 }
 const status=target.querySelector('[data-ai-comp-status]');if(status)status.dataset.hasDifferences=String(count>0&&state.status!=='running');if(status&&state.status!=='running'){const text=count?`待处理差异 ${count}项`:state.message||'';status.innerHTML=(text&&(count||['error','interrupted'].includes(state.status))?aiWarningIcon():'')+esc(text);}
}
async function aiFetchCompetitorComparison(asin){
 const record=ensureCompetitorState().items.find(r=>r.asin===asin),state=aiCompetitorState(asin),site=m.site;
 if(!record||readOnly||state.status==='running')return;document.activeElement?.blur();
 const reanalysis=!!state.analysisCompleted&&state.analysisMarketplace===site,token=++ai.sequence;state.status='running';state.hasRequested=true;state.requestSite=site;state.token=token;state.message='';aiRefresh();
 try{
  const response=await aiService({kind:'competitor',scene:'competitor_analysis',asin,marketplace:site,scope:{site},taskId:'AI-COMP-'+token});if(state.token!==token)return;
  if(readOnly||activeHistoryTask||m.site!==site||!ensureCompetitorState().items.includes(record)){state.status='interrupted';state.message='站点或权限已变化，结果未回填';return;}
  aiReconcileCompetitor(record,response,site,reanalysis);state.analysisCompleted=true;state.analysisMarketplace=site;state.status='done';state.message='';if(!persist())throw Error('保存失败，请重试');
  renderCompList();if(ensureCompetitorState().active===asin)renderCompDetail();
 }catch{state.status='error';state.message='获取失败，请重试';state.comparison=null;}
 finally{persist();aiRefresh();}
}
document.addEventListener('input',event=>{if(!event.target.closest('#compDetail')||!event.target.hasAttribute('data-cfield'))return;const state=aiCompetitorState(ensureCompetitorState().active);if(state.comparison?.outcomes)delete state.comparison.outcomes[event.target.dataset.cfield];aiRenderCompetitorComparison();});
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-ai-adopt-field]');if(!button||readOnly||button.disabled)return;
 const c=ensureCompetitorState(),record=c.items.find(r=>r.asin===c.active),state=aiCompetitorState(c.active),key=button.dataset.aiAdoptField;
 if(state.status==='running'||state.comparison?.marketplace!==m.site)return;
 const result=state.comparison.fields[key];if(!record||!result||result.status!=='success')return;
 const old=structuredClone(record[key]),oldManual=state.manual[key];record[key]=aiCompStoredValue(key,result);state.manual[key]=false;
 const group=['targetUsers','userPainPoints','usageScenarios','negative','feedback'].includes(key)?'feedback':key==='direction'||key==='remark'?'advice':'base';
 const saveGroup=group+'-'+record.asin;compSaveVersions[saveGroup]=(compSaveVersions[saveGroup]||0)+1;const saved=persist();compSaveStates[saveGroup]=saved?'saved':'error';if(!saved){record[key]=old;state.manual[key]=oldManual;}else{delete state.comparison.outcomes[key];persist();}
 renderCompList();renderCompDetail();
});
