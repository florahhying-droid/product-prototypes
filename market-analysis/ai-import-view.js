function aiPdfFileIcon(){return '<svg class="ai-pdf-file-icon" viewBox="0 0 24 28" fill="none" aria-hidden="true"><path d="M4 1h12l7 7v18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Z" fill="#e74848"/><path d="M16 1v7h7" fill="#ffb9b9"/><rect x="0" y="12" width="24" height="11" rx="2" fill="#c92b32"/><text x="12" y="20" text-anchor="middle" fill="white" font-family="Arial,sans-serif" font-size="8" font-weight="700">PDF</text></svg>';}
/* Files stay in browser storage; the prototype retains its existing analysis service. */
function aiExcelFileIcon(){return '<svg class="ai-excel-file-icon" viewBox="0 0 24 28" fill="none" aria-hidden="true"><path d="M6 1h11l6 6v19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1Z" fill="#21a366"/><path d="M17 1v6h6" fill="#a6dfbe"/><path d="M12 12h8M12 16h8M12 20h8M16 10v13" stroke="#fff" stroke-opacity=".65"/><rect y="8" width="13" height="15" rx="1.5" fill="#107c41"/><path d="m4 12 5 7m0-7-5 7" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>';}
function aiImportIcon(){return '<svg class="ai-import-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7L12 3Z"/><path d="m20 2 .6 1.4L22 4l-1.4.6L20 6l-.6-1.4L18 4l1.4-.6L20 2Z"/></svg>';}
function aiMaterials(scope=aiScopeKey()){ai.materials||={};return ai.materials[scope]||={};}
function aiMaterialStorage(action,id,file){
 return new Promise((resolve,reject)=>{
  let settled=false,db=null,tx=null;
  const finish=(error,value)=>{if(settled)return;settled=true;clearTimeout(timeout);if(error&&tx){try{tx.abort();}catch{}}db?.close();error?reject(error):resolve(value);};
  const timeout=setTimeout(()=>finish(new Error('文件保存超时，请重新选择文件上传')),5000);
  if(!window.indexedDB){finish(new Error('文件存储不可用，请检查浏览器设置后重试'));return;}
  let request;
  try{request=window.indexedDB.open('ac-ai-analysis-materials',1);}catch(error){finish(error);return;}
  request.onupgradeneeded=()=>request.result.createObjectStore('files');
  request.onerror=()=>finish(new Error('无法打开文件存储，请重试'));
  request.onblocked=()=>finish(new Error('文件存储被其他页面占用，请关闭旧页面后重试'));
  request.onsuccess=()=>{
   db=request.result;if(settled){db.close();return;}
   try{
    tx=db.transaction('files',action==='get'?'readonly':'readwrite');const store=tx.objectStore('files');let value;
    const operation=action==='put'?store.put(file,id):action==='delete'?store.delete(id):store.get(id);
    operation.onsuccess=()=>{value=operation.result;};
    tx.oncomplete=()=>finish(null,value);
    tx.onerror=tx.onabort=()=>finish(new Error('文件保存失败，请检查浏览器存储空间后重试'));
   }catch(error){finish(error);}
  };
 });
}

function aiRenderMaterials(){
 const row=$('.category-meta-bottom');if(!row)return;
 let area=$('#aiAnalysisMaterials');if(!area){area=document.createElement('div');area.id='aiAnalysisMaterials';area.className='ai-analysis-materials';row.after(area);}
 const files=aiMaterials(),entries=['excel','pdf'].filter(key=>files[key]);area.hidden=!entries.length;
 aiSetMarkup(area,entries.length?'<span class="subtle">分析资料</span>'+entries.map(key=>`<span class="ai-material-file"><span class="ai-material-kind ${key}" aria-hidden="true">${key==='excel'?aiExcelFileIcon():aiPdfFileIcon()}</span><span class="ai-material-name" title="${esc(files[key].name)}">${esc(files[key].name)}</span><button type="button" class="link" data-ai-material-download="${key}">下载</button></span>`).join(''):'');
 area.querySelectorAll('[data-ai-material-download]').forEach(button=>button.onclick=()=>aiDownloadMaterial(button.dataset.aiMaterialDownload));
}
async function aiDownloadMaterial(key){
 const file=aiMaterials()[key];if(!file)return;
 try{const blob=await aiMaterialStorage('get',file.id);if(!blob)throw new Error('未找到已上传文件，请重新上传');const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=file.name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 catch(error){showToast(error.message||'文件下载失败，请重试','error');}
}
function aiOpenImportDialog(){
 if(readOnly||!aiCategoryCanGenerate()||aiCategorySubmitting||aiBusy.has('category')||Object.values(ai.category).some(state=>state.status==='running')||$('.ai-import-dialog'))return;
 const scope=aiScopeKey(),dialog=openDialog('导入类目分析资料',`<div class="ai-import-context">${esc(m.site)} · Amazon${categoryLevelText(m.categoryLevel)} · ${esc(m.category)}</div><div class="ai-import-field"><label>市场数据Excel <span class="required">*</span></label><button type="button" class="ai-import-upload" data-ai-import-pick="excel"><span class="ai-material-kind excel" aria-hidden="true">${aiExcelFileIcon()}</span><span><strong data-ai-import-name="excel">上传Excel文件</strong><small>主要用于统计数据及分析依据，仅支持 .xlsx、.xls</small></span></button><div class="ai-import-check" data-ai-import-check="excel" role="status" aria-live="polite"></div><input type="file" accept=".xlsx,.xls" data-ai-import-input="excel" hidden></div><div class="ai-import-field"><label>AI文字分析报告 <span class="subtle">（选填）</span></label><button type="button" class="ai-import-upload" data-ai-import-pick="pdf"><span class="ai-material-kind pdf" aria-hidden="true">${aiPdfFileIcon()}</span><span><strong data-ai-import-name="pdf">上传PDF文件</strong><small>用于补充市场判断、消费者画像、使用场景等，仅支持 .pdf</small></span></button><div class="ai-import-check" data-ai-import-check="pdf" role="status" aria-live="polite"></div><input type="file" accept=".pdf" data-ai-import-input="pdf" hidden></div><p class="ai-import-tip">注：资料须与当前调研口径一致，补充PDF报告可使分析更全面、准确。</p><p class="field-error" data-ai-import-error role="alert"></p>`, '<button type="button" class="btn" data-ai-import-cancel>取消</button><button type="button" class="btn primary" data-ai-import-start>开始分析并填充</button>', 'ai-import-dialog');
 let uploading=false;const uploadStates={excel:aiMaterials(scope).excel?'success':'idle',pdf:aiMaterials(scope).pdf?'success':'idle'},uploadNames={};
 const start=dialog.querySelector('[data-ai-import-start]');start.textContent='开始分析并填充';
 const error=dialog.querySelector('[data-ai-import-error]');
 function refresh(){
  const files=aiMaterials(scope);
  for(const key of ['excel','pdf']){
   const state=uploadStates[key],pick=dialog.querySelector(`[data-ai-import-pick="${key}"]`),status=dialog.querySelector(`[data-ai-import-check="${key}"]`);
   dialog.querySelector(`[data-ai-import-name="${key}"]`).textContent=state==='uploading'?uploadNames[key]:files[key]?.name||(key==='excel'?'上传Excel文件':'上传PDF文件');
   status.textContent=state==='uploading'?'上传中…':state==='success'?'✓ 上传成功':state==='error'?'! 上传失败':'';status.dataset.state=state;
   pick.dataset.uploadState=state;pick.setAttribute('aria-busy',String(state==='uploading'));pick.disabled=uploading;pick.title=files[key]?'点击重新选择文件并上传，成功后替换当前文件':'点击选择文件上传';
  }
  start.disabled=uploading||!files.excel||scope!==aiScopeKey();
 }
 for(const key of ['excel','pdf']){
  const input=dialog.querySelector(`[data-ai-import-input="${key}"]`);
  dialog.querySelector(`[data-ai-import-pick="${key}"]`).onclick=()=>{input.value='';input.click();};
  input.onchange=async event=>{
   event?.stopPropagation();
   const file=input.files?.[0];if(!file||uploading)return;error.textContent='';
   if(!(key==='excel'?/\.(xlsx|xls)$/i:/\.pdf$/i).test(file.name)){uploadStates[key]='error';error.textContent=key==='excel'?'上传失败，请选择Excel文件（.xlsx、.xls）':'上传失败，请选择PDF文件（.pdf）';input.value='';refresh();return;}
   if(!file.size){uploadStates[key]='error';error.textContent='上传失败，文件为空，请重新选择';refresh();return;}
   uploading=true;uploadStates[key]='uploading';uploadNames[key]=file.name;refresh();
   const id=scope+'|'+key+'|'+Date.now()+'|'+(++ai.sequence),old=aiMaterials(scope)[key];
   const statusVisible=new Promise(resolve=>setTimeout(resolve,650));
   try{
    // Yield a browser frame before starting file storage, keeping progress visible.
    await new Promise(resolve=>window.requestAnimationFrame?window.requestAnimationFrame(()=>setTimeout(resolve,0)):setTimeout(resolve,80));
    await Promise.all([aiMaterialStorage('put',id,file),statusVisible]);
    if(scope!==aiScopeKey()||readOnly)throw new Error('当前调研口径或权限已变化，请重新导入');
    aiMaterials(scope)[key]={id,name:file.name,size:file.size,type:file.type};
    if(!persist()){if(old)aiMaterials(scope)[key]=old;else delete aiMaterials(scope)[key];throw new Error('资料信息保存失败，请重试');}
    uploadStates[key]='success';aiRenderMaterials();if(old)aiMaterialStorage('delete',old.id).catch(()=>{});
   }catch(e){await statusVisible;aiMaterialStorage('delete',id).catch(()=>{});uploadStates[key]='error';error.textContent=(e.message||'上传失败，请重新选择文件')+(old?'；原文件已保留。':'');}
   finally{uploading=false;if(dialog.isConnected)refresh();}
  };
  // File inputs dispatch input before change; update the view at the earliest event.
  input.oninput=input.onchange;
 }
 dialog.querySelector('[data-ai-import-cancel]').onclick=()=>close(dialog);
 start.onclick=async()=>{
  if(uploading||!aiMaterials(scope).excel)return;
  if(readOnly||scope!==aiScopeKey()||!aiCategoryCanGenerate()){error.textContent='当前调研口径或权限已变化，请关闭后重新打开';return;}
  close(dialog);aiCategorySubmitting=true;aiRefresh();
  try{await aiRunAll();}finally{aiCategorySubmitting=false;aiRefresh();}
 };
 refresh();
}

function aiHasCategoryMaterials(){return Object.values(ai.materials||{}).some(files=>files.excel||files.pdf);}
function aiClearCategoryMaterials(){
 const files=Object.values(ai.materials||{}).flatMap(group=>Object.values(group));ai.materials={};
 // Detach files immediately; clean browser storage without blocking the page.
 files.forEach(file=>{if(file?.id)aiMaterialStorage('delete',file.id).catch(()=>{});});
 aiRenderMaterials();persist();
}
changeCategoryScope=function(){
 if(readOnly)return;
 const site=$('#marketSite').value,level=$('#marketLevel').value;
 if(site===m.site&&level===String(m.categoryLevel))return;
 const hasFiles=aiHasCategoryMaterials();
 const apply=()=>{
  aiClearCategoryMaterials();m.site=site;m.categoryLevel=level;m.category='';m.categoryMode='tree';m.categoryReuse='';
  $('#marketSite').value=site;$('#marketLevel').value=level;$('#marketCategory').value='';setCategorySaved(false);clearCategoryError();closeCategorySuggestions();
  persist();refreshCompScope();updateCategoryReuseAvailability();renderCompList();aiRenderMaterials();
 };
 if(!m.category.trim()&&!hasFiles){apply();return;}
 $('#marketSite').value=m.site;$('#marketLevel').value=m.categoryLevel;
 const dialog=openDialog('确认切换调研范围','<p>切换站点或品类等级将清空调研品类及已上传资料，下方已有分析数据将保留。是否继续？</p>','<button type="button" class="btn" data-cancel-scope>取消</button><button type="button" class="btn primary" data-confirm-scope>确认切换</button>');
 dialog.querySelector('[data-cancel-scope]').onclick=()=>close(dialog);dialog.querySelector('[data-confirm-scope]').onclick=()=>{apply();close(dialog);};
};
$('#marketSite').onchange=changeCategoryScope;$('#marketLevel').onchange=changeCategoryScope;
const aiOriginalChooseCategory=chooseResearchCategory;
chooseResearchCategory=function(path){
 if(path===m.category){aiOriginalChooseCategory(path);return;}
 const apply=()=>{aiClearCategoryMaterials();aiOriginalChooseCategory(path);aiRenderMaterials();};
 if(!aiHasCategoryMaterials()){apply();return;}
 closeCategorySuggestions();
 const dialog=openDialog('确认切换调研品类','<p>切换调研品类将清空已上传资料，下方已有分析数据将保留。是否继续？</p>','<button type="button" class="btn" data-category-change-cancel>取消</button><button type="button" class="btn primary" data-category-change-confirm>确认切换</button>');
 dialog.querySelector('[data-category-change-cancel]').onclick=()=>{$('#marketCategory').value=m.category;close(dialog);refreshCategoryControls();};
 dialog.querySelector('[data-category-change-confirm]').onclick=()=>{apply();close(dialog);};
};
