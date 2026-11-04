
/* Category-only presentation; competitor and pending product controllers are untouched. */
function aiSetMarkup(node,markup){if(aiMarkupCache.get(node)===markup)return;node.innerHTML=markup;aiMarkupCache.set(node,markup);}
function aiCategoryFixture(i){return window.AI_CATEGORY_SAMPLE?.modules[i];}
function aiCategoryHasEvidence(i){const state=aiCategoryState(String(i));return !!(state.structured?.rows?.length||state.screenshot?.src);}
function aiCategoryInit(i){
 const state=aiCategoryState(String(i));if(state.structuredVersion!==1){
  state.structured=structuredClone(aiCategoryFixture(i));state.evidenceMode='table';
  state.screenshot=state.manual.image?structuredClone(dimensionImages[i]?.[0]||null):null;
  if(!state.manual.text){const input=$('#category-conclusion-'+i);if(input){input.value=state.structured.conclusion;m.dims[i]=dimensionHtml(i);categorySaveVersions[i]=(categorySaveVersions[i]||0)+1;categorySaveStates[i]='saved';}}
  state.structuredVersion=1;
 }return state;
}
function aiCategoryTable(data,compact=false){
 const rows=compact?(data.preview||data.rows.map((_,i)=>i).slice(0,6)).map(i=>data.rows[i]).filter(Boolean):data.rows;
 return `<div class="ai-data-table-wrap"><table class="ai-data-table"><thead><tr>${data.columns.map(label=>`<th>${esc(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(value=>`<td>${esc(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function aiCategorySource(data,full=false){return `<div class="ai-data-source"><span>数据来源：${esc(data.source)}</span><span>样本口径：${esc(data.sample)}</span><span>统计时间：${esc(data.period)}</span>${full?`<span>获取日期：${esc(window.AI_CATEGORY_SAMPLE.retrievedAt)}</span>`:''}</div>`;}
function aiCategoryEvidenceMarkup(i,report=false){
 const state=aiCategoryState(String(i)),data=state.structured;
 if(!data?.rows?.length&&state.evidenceMode==='screenshot'&&state.screenshot?.src)return `<figure class="ai-category-shot">${reportImageHtml(state.screenshot,true,'人工分析截图')}<figcaption>人工上传截图${!report&&!readOnly?` <button type="button" class="link danger" data-ai-remove-shot="${i}">删除截图</button>`:''}</figcaption></figure>`;
 if(!data?.rows?.length)return '<div class="ai-data-empty">暂无分析依据，请导入类目分析资料后进行AI辅助分析。</div>';
 return aiCategoryTable(data,true)+`<div class="ai-data-footer">${report?'':`<button type="button" class="link" data-ai-full-data="${i}">查看完整数据</button>`}</div>`;
}
function aiCategoryCanGenerate(){
 const site=$('#marketSite'),level=$('#marketLevel'),category=$('#marketCategory'),value=category?.value.trim()||'';
 return !!(site?.value&&['3','4','5'].includes(level?.value)&&value&&value===m.category.trim()&&site.value===m.site&&level.value===String(m.categoryLevel)&&!$('#categoryError')&&category.getAttribute('aria-invalid')!=='true');
}
function aiUpdateCategoryPrimary(){
 const button=$('#aiGetCategory');if(!button)return;
 const busy=aiBusy.has('category')||Object.values(ai.category).some(state=>state.status==='running');
 button.disabled=readOnly||busy||!aiCategoryCanGenerate();button.hidden=readOnly;aiSetMarkup(button,aiImportIcon()+'<span>AI辅助分析</span>');
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
  const state=i<6?aiCategoryInit(i):aiCategoryState(key);
  card.querySelectorAll(':scope > .ai-evidence,[data-ai-module-status]').forEach(node=>node.remove());
  header.querySelectorAll('[data-ai-category]').forEach(node=>node.remove());
  const body=card.querySelector('.category-item-body');
  if(i<6){
   if(!body.classList.contains('ai-category-stack')){const value=$('#category-conclusion-'+i).value;body.className='category-item-body ai-category-stack';body.innerHTML=`<div class="ai-analysis-basis"><div class="ai-basis-head"><span>分析依据 <span class="required">*</span></span></div><div data-ai-evidence-area="${i}"></div><div class="ai-shot-status" data-ai-shot-status="${i}" role="status"></div></div><div class="category-text-panel ai-analysis-conclusion"><label for="category-conclusion-${i}">分析结论 <span class="required">*</span></label><textarea class="category-conclusion" id="category-conclusion-${i}" data-key="dim:${i}" aria-label="${esc(source.dimensions[i].title)}" rows="5" placeholder="请输入分析结论">${esc(value)}</textarea></div>`;}
   const area=body.querySelector('[data-ai-evidence-area]'),markup=aiCategoryEvidenceMarkup(i);aiSetMarkup(area,markup);


  }
  const input=$('#category-conclusion-'+i);if(input){input.disabled=readOnly;input.style.height='136px';}
  refreshCategoryStatus(i);const mark=card.querySelector('.category-save-status');if(mark&&['error','running','interrupted'].includes(state.status))mark.dataset.state=state.status==='running'?'saving':'error';
 });
 refreshCategoryControls();
}
function aiCategorySampleResult(request){
 const i=Number(request.key),sample=window.AI_CATEGORY_SAMPLE;
 if(i<6){const structured=structuredClone(sample.modules[i]);return {basis:`${structured.source}；${structured.sample}；${structured.period}`,structured,conclusion:structured.conclusion};}
 return {basis:'基于商品标题和用途推断，非买家人口统计',conclusion:sample.textConclusions[i-6]};
}
function aiCategoryAskOverwrite(keys){
 if(!keys.some(key=>{const state=aiCategoryState(String(key));return state.manual.text||state.manual.image||state.evidenceMode==='screenshot';}))return Promise.resolve('keep');
 return new Promise(resolve=>{const dialog=openDialog('重新获取分析','<p>所选分析项已有人工填写的结论或截图，是否覆盖？</p><p class="subtle">保留时只更新AI数据，不改动人工结论及当前截图；覆盖时使用AI初稿和表格。获取期间的新修改仍会保留。</p>','<button type="button" class="btn" data-ai-cover-cancel>取消</button><button type="button" class="btn" data-ai-cover-keep>保留人工内容并获取</button><button type="button" class="btn primary" data-ai-cover-confirm>覆盖并重新获取</button>');
  let answered=false;const answer=value=>{if(answered)return;answered=true;document.removeEventListener('keydown',escape);close(dialog);resolve(value);};
  const escape=e=>{if(e.key==='Escape')answer('cancel');};document.addEventListener('keydown',escape);
  dialog.querySelector('[data-ai-cover-cancel]').onclick=()=>answer('cancel');dialog.querySelector('[data-ai-cover-keep]').onclick=()=>answer('keep');dialog.querySelector('[data-ai-cover-confirm]').onclick=()=>answer('overwrite');dialog.querySelector('.close').onclick=()=>answer('cancel');dialog.addEventListener('click',e=>{if(e.target===dialog)answer('cancel');});
 });
}
async function aiRunCategory(key,batch=false,batchResult=null,decision=null){
 if(!/^\d$/.test(key)||+key>7||readOnly)return;const state=aiCategoryState(key);if(state.status==='running')return;
 document.activeElement?.blur();if(!decision)decision=await aiCategoryAskOverwrite([key]);if(decision==='cancel'||readOnly||state.status==='running')return;
 const scopeKey=aiScopeKey(),scope=aiScope();if(!scope.site||!scope.level||!scope.category){showToast('请先选择站点、品类等级和调研品类','error');return;}
 const i=Number(key),input=$('#category-conclusion-'+i),before={text:input.value,version:categorySaveVersions[i]||0,shot:JSON.stringify(state.screenshot),mode:state.evidenceMode},token=++ai.sequence;
 state.status='running';state.token=token;state.attempts++;state.message='';if(!batch)aiRefresh();
 try{
  const result=await(batchResult||aiService({kind:'category',key,scope,batch,attempt:state.attempts,taskId:'AI-CAT-'+token}));if(state.token!==token)return;
  if(!aiContextValid(scopeKey)){state.status='interrupted';state.message='口径已变化，结果未回填';return;}
  if(typeof result.conclusion!=='string'||i<6&&(!result.structured?.rows?.length||!Array.isArray(result.structured.columns)))throw new Error('返回数据不完整');
  const current=$('#category-conclusion-'+i);let kept=false;
  if((!state.manual.text||decision==='overwrite')&&current.value===before.text&&(categorySaveVersions[i]||0)===before.version){current.value=result.conclusion;state.manual.text=false;}else kept=true;
  if(i<6){state.structured=structuredClone(result.structured);state.structuredVersion=1;
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
function aiOpenCategoryData(i){
 const data=aiCategoryState(String(i)).structured;if(!data)return;aiCloseCategoryData();const origin=document.activeElement,mask=document.createElement('div');mask.className='ai-data-drawer-mask';mask.id='aiCategoryDataDrawer';mask.innerHTML=`<aside class="ai-data-drawer" role="dialog" aria-modal="true" aria-labelledby="aiDataDrawerTitle"><header><div><h3 id="aiDataDrawerTitle">${esc(source.dimensions[i].title)} · 完整数据</h3><span class="subtle">Amazon US · Refillable Containers · 节点11062781</span></div><button type="button" class="close" data-ai-data-close aria-label="关闭完整数据">×</button></header><div class="ai-data-drawer-body">${aiCategoryTable(data)}${aiCategorySource(data,true)}<p class="ai-data-note">${esc(data.notes||'')}</p>${(data.extra||[]).map(extra=>`<section><h4>${esc(extra.title)}</h4>${aiCategoryTable(extra)}${aiCategorySource(extra)}</section>`).join('')}</div></aside>`;
 document.body.append(mask);mask._origin=origin;mask._overflow=document.body.style.overflow;document.body.style.overflow='hidden';mask.querySelector('[data-ai-data-close]').focus();
}
function aiCloseCategoryData(){const node=$('#aiCategoryDataDrawer');if(node){document.body.style.overflow=node._overflow||'';node.remove();if(node._origin?.isConnected)node._origin.focus();}}
const aiCategoryOriginalStatus=categoryStatusLabel;categoryStatusLabel=function(i){const state=aiCategoryState(String(i));if(state.status==='running')return 'AI获取中…';if(state.status==='error')return 'AI获取失败';if(state.status==='interrupted')return state.message||'获取已中断';if(i>=6)return aiCategoryOriginalStatus(i);if(categorySaveStates[i]==='saving')return '保存中…';if(categorySaveStates[i]==='dirty')return '未保存';if(categorySaveStates[i]==='error')return '保存失败 · 重试';if(!$('#category-conclusion-'+i)?.value.trim())return '未填写';return aiCategoryHasEvidence(i)?'✓ 已保存':'待获取依据';};
refreshCategoryControls=function(){$('#toggleCategoryItems')?.remove();$('#categoryProgress')?.remove();aiUpdateCategoryPrimary();};
sizeCategoryText=function(){$$('#dimensions .category-conclusion').forEach(input=>input.style.height='136px');};
const aiCategoryOriginalGallery=renderCategoryGallery;renderCategoryGallery=function(i){aiCategoryOriginalGallery(i);if(i<6)refreshAiCategoryUI();};
uploadCategoryImage=async function(i,job,retry=false){if(readOnly)return;aiMarkCategory(String(i),'image');const state=aiCategoryState(String(i));await aiOriginalUpload(i,job,retry);if(!job.cancelled&&!readOnly&&job.status!=='error'&&dimensionImages[i]?.[0]?.src===job.src){state.screenshot=structuredClone(dimensionImages[i][0]);state.evidenceMode='screenshot';persist();}refreshAiCategoryUI();};
const aiCategoryOriginalReport=categoryReportHtml;categoryReportHtml=function(dims,rankings){
 if(activeHistoryTask||categoryHistoryRecords.some(record=>record.dimensions===dims))return aiCategoryOriginalReport(dims,rankings);
 return rankingReportHtml(rankings)+source.dimensions.map((module,i)=>`<article class="report-analysis"><h3>${i+1}. ${esc(module.title)}</h3>${i<6?`<h4>分析依据</h4>${aiCategoryEvidenceMarkup(i,true)}`:''}<h4>分析结论</h4><div class="report-rich comp-report-text">${reportValue(dimensionParts(m.dims[i]).text)}</div></article>`).join('');
};
document.addEventListener('click',event=>{const full=event.target.closest('[data-ai-full-data]'),restore=event.target.closest('[data-ai-restore-data]'),remove=event.target.closest('[data-ai-remove-shot]');if(full)aiOpenCategoryData(Number(full.dataset.aiFullData));if((restore||remove)&&!readOnly){const i=Number((restore||remove).dataset[restore?'aiRestoreData':'aiRemoveShot']),state=aiCategoryState(String(i));state.evidenceMode='table';for(const job of categoryUploadJobs[i]||[])job.cancelled=true;categoryUploadJobs[i]=[];if(remove){state.screenshot=null;dimensionImages[i]=[];state.manual.image=false;m.dims[i]=dimensionHtml(i);}persist();refreshAiCategoryUI();}if(event.target.closest('[data-ai-data-close]')||event.target.id==='aiCategoryDataDrawer')aiCloseCategoryData();});
document.addEventListener('keydown',event=>{const drawer=$('#aiCategoryDataDrawer');if(!drawer)return;if(event.key==='Escape'){event.preventDefault();aiCloseCategoryData();}if(event.key==='Tab'){event.preventDefault();drawer.querySelector('[data-ai-data-close]').focus();}});
refreshAiCategoryUI();persist();
