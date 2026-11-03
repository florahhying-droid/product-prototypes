/* Files stay in browser storage; the prototype retains its existing analysis service. */
function aiImportIcon(){return '<svg class="ai-import-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.7 6.3L21 12l-6.3 2.7L12 21l-2.7-6.3L3 12l6.3-2.7L12 3Z"/><path d="m20 2 .6 1.4L22 4l-1.4.6L20 6l-.6-1.4L18 4l1.4-.6L20 2Z"/></svg>';}
function aiMaterials(scope=aiScopeKey()){ai.materials||={};return ai.materials[scope]||={};}
function aiMaterialStorage(action,id,file){
 return new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(new Error('文件存储不可用，请检查浏览器设置后重试'));return;}
  const request=window.indexedDB.open('ac-ai-analysis-materials',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('files');
  request.onerror=()=>reject(new Error('无法打开文件存储，请重试'));
  request.onblocked=()=>reject(new Error('文件存储被其他页面占用，请关闭旧页面后重试'));
  request.onsuccess=()=>{
   const db=request.result,tx=db.transaction('files',action==='get'?'readonly':'readwrite'),store=tx.objectStore('files');
   let value;
   const operation=action==='put'?store.put(file,id):action==='delete'?store.delete(id):store.get(id);
   operation.onsuccess=()=>{value=operation.result;};
   tx.oncomplete=()=>{db.close();resolve(value);};
   tx.onerror=tx.onabort=()=>{db.close();reject(new Error('文件保存失败，请检查浏览器存储空间后重试'));};
  };
 });
}
function aiRenderMaterials(){
 const row=$('.category-meta-bottom');if(!row)return;
 let area=$('#aiAnalysisMaterials');if(!area){area=document.createElement('div');area.id='aiAnalysisMaterials';area.className='ai-analysis-materials';row.after(area);}
 const files=aiMaterials(),entries=['excel','pdf'].filter(key=>files[key]);area.hidden=!entries.length;
 aiSetMarkup(area,entries.length?'<span class="subtle">分析资料</span>'+entries.map(key=>`<span class="ai-material-file"><span class="ai-material-kind ${key}" aria-hidden="true">${key==='excel'?'▦':'▤'}</span><span class="ai-material-name" title="${esc(files[key].name)}">${esc(files[key].name)}</span><button type="button" class="link" data-ai-material-download="${key}">下载</button></span>`).join(''):'');
 area.querySelectorAll('[data-ai-material-download]').forEach(button=>button.onclick=()=>aiDownloadMaterial(button.dataset.aiMaterialDownload));
}
async function aiDownloadMaterial(key){
 const file=aiMaterials()[key];if(!file)return;
 try{const blob=await aiMaterialStorage('get',file.id);if(!blob)throw new Error('未找到已上传文件，请重新上传');const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=file.name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 catch(error){showToast(error.message||'文件下载失败，请重试','error');}
}
function aiOpenImportDialog(){
 if(readOnly||!aiCategoryCanGenerate()||aiBusy.has('category')||$('.ai-import-dialog'))return;
 const scope=aiScopeKey(),dialog=openDialog('导入类目分析资料',`<div class="ai-import-context">${esc(m.site)} · Amazon${categoryLevelText(m.categoryLevel)} · ${esc(m.category)}</div><div class="ai-import-field"><label>市场数据Excel <span class="required">*</span></label><button type="button" class="ai-import-upload" data-ai-import-pick="excel"><span class="ai-material-kind excel" aria-hidden="true">▦</span><span><strong data-ai-import-name="excel">上传Excel文件</strong><small>主要用于统计数据及分析依据，仅支持 .xlsx、.xls</small></span><span class="ai-import-check" data-ai-import-check="excel" aria-hidden="true"></span></button><input type="file" accept=".xlsx,.xls" data-ai-import-input="excel" hidden></div><div class="ai-import-field"><label>AI文字分析报告 <span class="subtle">（选填）</span></label><button type="button" class="ai-import-upload" data-ai-import-pick="pdf"><span class="ai-material-kind pdf" aria-hidden="true">▤</span><span><strong data-ai-import-name="pdf">上传PDF文件</strong><small>用于补充市场判断、消费者画像、使用场景等，仅支持 .pdf</small></span><span class="ai-import-check" data-ai-import-check="pdf" aria-hidden="true"></span></button><input type="file" accept=".pdf" data-ai-import-input="pdf" hidden></div><p class="ai-import-tip">请确保文件与当前调研品类、站点一致，统计周期及样本范围一致或可明确区分。上传PDF分析报告可补充更多市场信息，使分析更丰富、准确。</p><p class="field-error" data-ai-import-error role="alert"></p>`, '<button type="button" class="btn" data-ai-import-cancel>取消</button><button type="button" class="btn primary" data-ai-import-start>开始分析并填充</button>', 'ai-import-dialog');
 let uploading=false;
 const start=dialog.querySelector('[data-ai-import-start]');start.textContent='开始分析并填充';
 const error=dialog.querySelector('[data-ai-import-error]');
 function refresh(){
  const files=aiMaterials(scope);
  for(const key of ['excel','pdf']){dialog.querySelector(`[data-ai-import-name="${key}"]`).textContent=files[key]?.name||(key==='excel'?'上传Excel文件':'上传PDF文件');dialog.querySelector(`[data-ai-import-check="${key}"]`).textContent=files[key]?'✓':'';dialog.querySelector(`[data-ai-import-pick="${key}"]`).disabled=uploading;}
  start.disabled=uploading||!files.excel||scope!==aiScopeKey();
 }
 for(const key of ['excel','pdf']){
  const input=dialog.querySelector(`[data-ai-import-input="${key}"]`);
  dialog.querySelector(`[data-ai-import-pick="${key}"]`).onclick=()=>{input.value='';input.click();};
  input.onchange=async()=>{
   const file=input.files?.[0];if(!file||uploading)return;error.textContent='';
   if(!(key==='excel'?/\.(xlsx|xls)$/i:/\.pdf$/i).test(file.name)){error.textContent=key==='excel'?'请选择Excel文件（.xlsx、.xls）':'请选择PDF文件（.pdf）';input.value='';return;}
   if(!file.size){error.textContent='文件为空，请重新选择';return;}
   uploading=true;refresh();dialog.querySelector(`[data-ai-import-check="${key}"]`).textContent='上传中…';
   const id=scope+'|'+key+'|'+Date.now()+'|'+(++ai.sequence),old=aiMaterials(scope)[key];
   try{
    await aiMaterialStorage('put',id,file);
    if(scope!==aiScopeKey()||readOnly)throw new Error('当前调研口径或权限已变化，请重新导入');
    aiMaterials(scope)[key]={id,name:file.name,size:file.size,type:file.type};
    if(!persist()){if(old)aiMaterials(scope)[key]=old;else delete aiMaterials(scope)[key];throw new Error('资料信息保存失败，请重试');}
    aiRenderMaterials();if(old)aiMaterialStorage('delete',old.id).catch(()=>{});
   }catch(e){aiMaterialStorage('delete',id).catch(()=>{});error.textContent=e.message||'上传失败，请重试';}
   finally{uploading=false;if(dialog.isConnected)refresh();}
  };
 }
 dialog.querySelector('[data-ai-import-cancel]').onclick=()=>close(dialog);
 start.onclick=async()=>{
  if(uploading||!aiMaterials(scope).excel)return;
  if(readOnly||scope!==aiScopeKey()||!aiCategoryCanGenerate()){error.textContent='当前调研口径或权限已变化，请关闭后重新打开';return;}
  close(dialog);await aiRunAll();
 };
 refresh();
}
