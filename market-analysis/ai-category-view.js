
/* Category-only presentation; competitor and pending product controllers are untouched. */
function aiSetMarkup(node,markup){if(aiMarkupCache.get(node)===markup)return;node.innerHTML=markup;aiMarkupCache.set(node,markup);}
function aiCategoryFixture(i){return window.AI_CATEGORY_SAMPLE?.modules[i];}
function aiCategoryHasEvidence(i){const state=aiCategoryState(String(i));return !!state.structured?.rows?.length;}
function aiCategoryInit(i){
 const state=aiCategoryState(String(i)),sample=window.AI_CATEGORY_SAMPLE,input=$('#category-conclusion-'+i);
 if(activeHistoryTask){state.structured=i<6?structuredClone(activeHistoryTask.structured[i]):null;state.evidenceMode='table';state.screenshot=null;state.sampleVersion=sample.version;if(input)input.value=dimensionParts(activeHistoryTask.dimensions[i]).text;return state;}
 if(state.sampleVersion!==sample.version){
  const previous=state.structured?.conclusion,original=dimensionParts(source.dimensions[i].html).text;
  const replace=!state.manual.text||input?.value===previous||input?.value===original;
  if(i<6)state.structured=structuredClone(aiCategoryFixture(i));
  state.evidenceMode='table';state.sampleVersion=sample.version;state.structuredVersion=1;state.status='idle';state.message='';
  if(input&&replace){input.value=i<6?sample.modules[i].conclusion:sample.textConclusions[i-6];state.manual.text=false;m.dims[i]=dimensionHtml(i);categorySaveVersions[i]=(categorySaveVersions[i]||0)+1;categorySaveStates[i]='saved';}
 }return state;
}
function aiCategoryTable(data){
 return `<div class="ai-data-table-wrap"><table class="ai-data-table"><thead><tr>${data.columns.map(label=>`<th>${esc(label)}</th>`).join('')}</tr></thead><tbody>${data.rows.map(row=>`<tr>${row.map(value=>`<td>${esc(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function aiCategoryEvidenceMarkup(i,report=false){
 const state=aiCategoryState(String(i)),data=state.structured;

 if(!data?.rows?.length)return report?reportValue(''):'<div class="ai-data-empty">暂无分析依据，请导入类目分析资料后进行AI辅助分析。</div>';
 const tables=data.tables?.length?`<div class="ai-seller-tables">${data.tables.map(table=>`<section class="ai-seller-table"><h5>${esc(table.title)}</h5>${aiCategoryTable(table)}${table.note?`<p class="ai-table-note">数据说明：${esc(table.note)}</p>`:''}</section>`).join('')}</div>`:aiCategoryTable(data);
 return tables+(data.note?`<p class="ai-table-note">数据说明：${esc(data.note)}</p>`:'');
}
function aiCategoryCanGenerate(){
 const site=$('#marketSite'),level=$('#marketLevel'),category=$('#marketCategory'),value=category?.value.trim()||'';
 return !!(site?.value&&['3','4','5'].includes(level?.value)&&value&&value===m.category.trim()&&site.value===m.site&&level.value===String(m.categoryLevel)&&!$('#categoryError')&&category.getAttribute('aria-invalid')!=='true');
}
function aiUpdateCategoryPrimary(){
 const button=$('#aiGetCategory');if(!button)return;
 const busy=aiBusy.has('category')||Object.values(ai.category).some(state=>state.status==='running');
 button.disabled=readOnly||aiCategorySubmitting||busy||!aiCategoryCanGenerate();button.hidden=readOnly;button.setAttribute('aria-busy',String(busy));aiSetMarkup(button,aiImportIcon()+'<span>'+(busy?'AI分析中':'AI辅助分析')+'</span>');
 button.title=!aiCategoryCanGenerate()?'请先选择有效的站点、品类等级和调研品类':'';aiRenderMaterials();
}
function refreshAiCategoryUI(){
 const head=$('#categoryAnalysisBlock > .sub-head')||$('#marketSection > .sub-head'),row=$('.category-meta-bottom');
 if(row&&!$('#aiGetCategory'))row.insertAdjacentHTML('beforeend','<div class="ai-category-tools" id="aiCategoryTools"><button type="button" class="btn primary ai-action market-write" id="aiGetCategory">AI生成分析</button></div>');
 if(row&&$('#aiCategoryTools')?.parentElement!==row)row.append($('#aiCategoryTools'));
 $('#aiCategoryStatus')?.remove();$('#categoryProgress')?.remove();
 $('#toggleCategoryItems')?.remove();
 const tools=head?.querySelector('.category-head-tools');if(tools&&!tools.children.length)tools.remove();
 aiUpdateCategoryPrimary();
 $('#categoryRankings')?.querySelectorAll('.ai-evidence,[data-ai-module-status],[data-ai-category]').forEach(node=>node.remove());
 source.dimensions.forEach((_,i)=>{
  const key=String(i),card=$('#dim-'+i),header=card?.querySelector('.field-head');if(!card||!header)return;
  const state=aiCategoryInit(i);
  card.querySelectorAll(':scope > .ai-evidence,[data-ai-module-status]').forEach(node=>node.remove());
  header.querySelectorAll('[data-ai-category]').forEach(node=>node.remove());
  const body=card.querySelector('.category-item-body');
  if(i<6){
   if(!body.classList.contains('ai-category-layout')){const value=$('#category-conclusion-'+i).value;body.className='category-item-body ai-category-layout';body.innerHTML=`<div class="ai-analysis-basis"><div class="ai-basis-head"><span>分析依据 <span class="required">*</span></span></div><div data-ai-evidence-area="${i}"></div></div><div class="category-text-panel ai-analysis-conclusion"><label for="category-conclusion-${i}">分析结论 <span class="required">*</span></label><textarea class="category-conclusion" id="category-conclusion-${i}" data-key="dim:${i}" aria-label="${esc(source.dimensions[i].title)}" rows="5" placeholder="请输入分析结论">${esc(value)}</textarea></div>`;}
   aiSetMarkup(body.querySelector('[data-ai-evidence-area]'),aiCategoryEvidenceMarkup(i));
  }else if(!body.classList.contains('ai-text-only-body')){const input=$('#category-conclusion-'+i);body.className='category-item-body ai-text-only-body';body.replaceChildren(input);}
  const input=$('#category-conclusion-'+i);if(input){input.disabled=readOnly;input.style.height='136px';}
  refreshCategoryStatus(i);const mark=card.querySelector('.category-save-status');if(mark&&['error','running','interrupted'].includes(state.status))mark.dataset.state=state.status==='running'?'saving':'error';
 });
 refreshCategoryControls();
}
function aiCategorySampleResult(request){
 const i=Number(request.key),sample=window.AI_CATEGORY_SAMPLE;
 if(i<6){const structured=structuredClone(sample.modules[i]);return {basis:`${structured.source}；${structured.sample}；${structured.period}`,structured,conclusion:structured.conclusion};}
 return {basis:sample.record,conclusion:sample.textConclusions[i-6]};
}
function aiCategoryAskOverwrite(keys,action='AI辅助分析'){
 if(!keys.some(key=>{const i=Number(key);return !!$('#category-conclusion-'+i)?.value.trim()||i<6&&aiCategoryHasEvidence(i);}))return Promise.resolve('keep');
 return new Promise(resolve=>{const dialog=openDialog('确认填充方式',`<p>当前类目分析已有内容，请选择${esc(action)}的填充方式。</p><p class="subtle">全部覆盖将替换现有分析依据及结论；仅填充空值项将保留已有内容。</p>`,'<button type="button" class="btn" data-ai-cover-cancel>取消</button><button type="button" class="btn" data-ai-cover-keep>仅填充空值项</button><button type="button" class="btn primary" data-ai-cover-confirm>全部覆盖</button>');
  let answered=false;const answer=value=>{if(answered)return;answered=true;document.removeEventListener('keydown',escape);close(dialog);resolve(value);};
  const escape=e=>{if(e.key==='Escape')answer('cancel');};document.addEventListener('keydown',escape);
  dialog.querySelector('[data-ai-cover-cancel]').onclick=()=>answer('cancel');dialog.querySelector('[data-ai-cover-keep]').onclick=()=>answer('keep');dialog.querySelector('[data-ai-cover-confirm]').onclick=()=>answer('overwrite');dialog.querySelector('.close').onclick=()=>answer('cancel');dialog.addEventListener('click',e=>{if(e.target===dialog)answer('cancel');});
 });
}
async function aiRunCategory(key,batch=false,batchResult=null,decision=null){
 if(!/^\d$/.test(key)||+key>7||readOnly)return;const state=aiCategoryState(key);if(state.status==='running')return;
 document.activeElement?.blur();if(!decision)decision=await aiCategoryAskOverwrite([key]);if(decision==='cancel'||readOnly||state.status==='running')return;
 const scopeKey=aiScopeKey(),scope=aiScope();if(!scope.site||!scope.level||!scope.category){showToast('请先选择站点、品类等级和调研品类','error');return;}
 const i=Number(key),input=$('#category-conclusion-'+i),before={text:input.value,version:categorySaveVersions[i]||0,shot:JSON.stringify(state.screenshot),mode:state.evidenceMode,hasEvidence:aiCategoryHasEvidence(i)},token=++ai.sequence;
 state.status='running';state.token=token;state.attempts++;state.message='';if(!batch)aiRefresh();
 try{
  const result=await(batchResult||aiService({kind:'category',key,scope,batch,attempt:state.attempts,taskId:'AI-CAT-'+token}));if(state.token!==token)return;
  if(!aiContextValid(scopeKey)){state.status='interrupted';state.message='口径已变化，结果未回填';return;}
  if(typeof result.conclusion!=='string'||i<6&&(!result.structured?.rows?.length||!Array.isArray(result.structured.columns)))throw new Error('返回数据不完整');
  const current=$('#category-conclusion-'+i);let kept=false;
  if((!before.text.trim()||decision==='overwrite')&&current.value===before.text&&(categorySaveVersions[i]||0)===before.version){current.value=result.conclusion;state.manual.text=false;}else kept=true;
  if(i<6&&(decision==='overwrite'||!before.hasEvidence)&&JSON.stringify(state.screenshot)===before.shot&&state.evidenceMode===before.mode){state.structured=structuredClone(result.structured);state.structuredVersion=1;state.sampleVersion=window.AI_CATEGORY_SAMPLE.version;
   if(decision==='overwrite'&&JSON.stringify(state.screenshot)===before.shot&&state.evidenceMode===before.mode){state.evidenceMode='table';state.manual.image=false;}else if(state.evidenceMode==='screenshot')kept=true;
  }
  categorySaveVersions[i]=(categorySaveVersions[i]||0)+1;m.dims[i]=dimensionHtml(i);syncCompPositionFromCategory();categorySaveStates[i]='saved';state.status='done';state.generatedAt=Date.now();state.message=kept?'已保留人工内容':'';if(!persist())throw new Error('保存失败');
 }catch{state.status='error';state.message='获取失败，可重新获取';}
 finally{if(!batch){persist();aiRefresh();}}
}
async function aiRunAll(){
 if(readOnly||aiBusy.has('category')||Object.values(ai.category).some(state=>state.status==='running'))return;document.activeElement?.blur();
 if(!aiCategoryCanGenerate()){showToast('请先选择有效的站点、品类等级和调研品类','error');return;}
 const modules=source.dimensions.map((_,i)=>String(i)),scopeKey=aiScopeKey(),decision=await aiCategoryAskOverwrite(modules);if(decision==='cancel'||readOnly||scopeKey!==aiScopeKey()||aiBusy.has('category'))return;
 aiBusy.add('category');aiRefresh();const response=aiService({kind:'category-batch',scope:aiScope(),materials:structuredClone(aiMaterials()),taskId:'AI-CAT-BATCH-'+(++ai.sequence),modules,attempts:Object.fromEntries(modules.map(key=>[key,aiCategoryState(key).attempts+1]))});
 await Promise.all(modules.map(key=>aiRunCategory(key,true,response.then(result=>{const module=result.modules?.[key];if(!module||module.error)throw new Error('获取失败');return module;}),decision)));
 aiBusy.delete('category');if(modules.some(key=>aiCategoryState(key).status==='done'))ai.categoryGenerated=true;const failed=modules.filter(key=>aiCategoryState(key).status==='error').length;ai.categoryMessage=failed?`${failed}项获取失败，请通过AI辅助分析重试`:'类目分析已更新';persist();aiRefresh();
}
const aiCategoryOriginalStatus=categoryStatusLabel;categoryStatusLabel=function(i){const state=aiCategoryState(String(i));if(state.status==='running')return 'AI获取中…';if(state.status==='error')return 'AI获取失败';if(state.status==='interrupted')return state.message||'获取已中断';if(i>=6)return aiCategoryOriginalStatus(i);if(categorySaveStates[i]==='saving')return '保存中…';if(categorySaveStates[i]==='dirty')return '未保存';if(categorySaveStates[i]==='error')return '保存失败 · 重试';if(!$('#category-conclusion-'+i)?.value.trim())return '未填写';return aiCategoryHasEvidence(i)?'✓ 已保存':'待获取依据';};
refreshCategoryControls=function(){$('#toggleCategoryItems')?.remove();$('#categoryProgress')?.remove();aiUpdateCategoryPrimary();};
sizeCategoryText=function(){$$('#dimensions .category-conclusion').forEach(input=>input.style.height='136px');};
const aiCategoryOriginalGallery=renderCategoryGallery;renderCategoryGallery=function(i){aiCategoryOriginalGallery(i);if(i<6)refreshAiCategoryUI();};
uploadCategoryImage=async function(i,job,retry=false){if(readOnly)return;aiMarkCategory(String(i),'image');const state=aiCategoryState(String(i));await aiOriginalUpload(i,job,retry);if(!job.cancelled&&!readOnly&&job.status!=='error'&&dimensionImages[i]?.[0]?.src===job.src){state.screenshot=structuredClone(dimensionImages[i][0]);state.evidenceMode='screenshot';persist();}refreshAiCategoryUI();};
const aiCategoryOriginalReport=categoryReportHtml;categoryReportHtml=function(dims,rankings){
 const history=categoryHistoryRecords.find(record=>record.dimensions===dims)||activeHistoryTask;
 if(history)return source.dimensions.map((module,i)=>`<article class="report-analysis"><h3>${i+1}. ${esc(module.title)}</h3>${i<6?`<h4>分析依据</h4>${aiCategoryHistoryEvidence(history.structured?.[i])}<h4>分析结论</h4>`:''}<div class="report-rich comp-report-text">${reportValue(dimensionParts(history.dimensions[i]).text)}</div></article>`).join('');
 return rankingReportHtml(rankings)+source.dimensions.map((module,i)=>`<article class="report-analysis"><h3>${i+1}. ${esc(module.title)}</h3>${i<6?`<h4>分析依据</h4>${aiCategoryEvidenceMarkup(i,true)}<h4>分析结论</h4>`:''}<div class="report-rich comp-report-text">${reportValue(dimensionParts(m.dims[i]).text)}</div></article>`).join('');
};
refreshAiCategoryUI();persist();

function aiApplyCategoryHistory(selected,mode){
 source.dimensions.forEach((_,i)=>{
  const existing=dimensionParts(m.dims[i]);existing.text=$('#category-conclusion-'+i)?.value??existing.text;const incoming=dimensionParts(selected.dimensions[i]),state=aiCategoryState(String(i));
  const text=mode==='overwrite'||!existing.text.trim()?incoming.text:existing.text;
  if(i<6&&(mode==='overwrite'||!aiCategoryHasEvidence(i))){
   state.structured=selected.structured?.[i]?structuredClone(selected.structured[i]):null;
   state.screenshot=null;
   state.evidenceMode='table';state.manual.image=false;categoryUploadJobs[i]=[];
  }
  if(text!==existing.text||mode==='overwrite')state.manual.text=false;
  m.dims[i]=text?`<p>${esc(text).replace(/\n/g,'<br>')}</p>`:'';
  categorySaveVersions[i]=(categorySaveVersions[i]||0)+1;categorySaveStates[i]='saved';
 });
 m.categoryReuse=selected.id+' · '+selected.reviewedAt;renderDimensions();syncReadOnly();persist();
}

function aiCategoryHistoryEvidence(data){
 if(!data?.rows?.length)return reportValue('');
 const note=text=>text?`<p class="ai-table-note">数据说明：${esc(text)}</p>`:'';
 return (data.tables?.length?`<div class="ai-seller-tables">${data.tables.map(table=>`<section class="ai-seller-table"><h5>${esc(table.title)}</h5>${aiCategoryTable(table)}${note(table.note)}</section>`).join('')}</div>`:aiCategoryTable(data))+note(data.note);
}

function aiCategoryHistoryReportName(record){return record.reportName||record.name+'·市场分析报告';}
previewCategoryHistory=function(record){
 const dialog=openDialog('市场分析报告 · 只读预览',aiHistoryReportSnapshot(record),'','report-dialog');
 aiAttachReportExport(dialog);
};

function aiHistoryReportSnapshot(record){
 if(record.approvedReportHtml)return record.approvedReportHtml;
 // Isolate historical fixtures from the currently edited task and its products.
 const current=m,history=activeHistoryTask,currentProducts=products.slice();
 try{
  activeHistoryTask=record;
  m={...structuredClone(initial),site:record.site,categoryLevel:record.level,category:record.path,dims:record.dimensions,selected:[],competitorAnalysis:structuredClone(record.competitorAnalysis||{items:[],active:'',position:{}})};
  products.splice(0,products.length,...structuredClone(record.products||[]));
  const content=document.createElement('div');content.innerHTML=aiLiveReportHtml();
  content.querySelector('.report-header h1').textContent=aiCategoryHistoryReportName(record);
  content.querySelector('.report-info-line').textContent=record.id+' · 已完成 · '+record.developer;
  return content.innerHTML;
 }finally{m=current;activeHistoryTask=history;products.splice(0,products.length,...currentProducts);}
}
