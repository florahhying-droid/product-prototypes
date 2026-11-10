/* Detail presentation changes are confined to the AI version. */
const aiOriginalOpDetails=opDetailsHtml;
opDetailsHtml=function(product,skuId=''){
 const content=document.createElement('div');content.innerHTML=aiOriginalOpDetails(product,skuId);
 content.querySelectorAll('.op-plan-summary,.op-rule-note,.op-example-note').forEach(node=>node.remove());
 const runs=(product.opCalculation?.runs||[]).filter(run=>!skuId||run.sku===skuId);
 content.querySelectorAll('.op-sku-result').forEach((section,index)=>{
  const run=runs[index],sku=product.skus.find(row=>row.sku===run.sku),assessment=opAssessment(product,sku);
  const timestamps=(run.results||[]).map(result=>result.calculatedAt).filter(Boolean).sort((a,b)=>new Date(b)-new Date(a));
  const title=run.request?.spuTitle||product.title,time=timestamps[0];
  section.querySelector('h3')?.remove();
  section.querySelectorAll('.op-profit-details tr').forEach(row=>row.children[2]?.remove());
  section.insertAdjacentHTML('afterbegin',`<header class="ai-op-summary"><div class="ai-op-summary-main"><strong>${esc(product.spu)}</strong><span class="ai-op-product-name">${esc(title)}</span><span class="pending-profit-result ai-op-result-tag ${assessment.state}">${['pass','fail'].includes(assessment.state)?`<span class="ai-op-result-icon" aria-hidden="true">${assessment.state==='pass'?'✓':'×'}</span>`:''}${esc(assessment.label)}</span></div><div class="ai-op-summary-meta"><span>测算季节：${esc(run.request?.saleSeason||'旺季')}（默认）</span><span>测算时间：${time?opDateText(time):'待测算'}</span></div></header>`);
 });
 return content.innerHTML;
};
// Keep the archived standard version reachable without a floating switch entry.
const aiStandardLink=$('.demo-suite-switch a[href="市场分析报告交互原型.html"]');
if(aiStandardLink){const footer=document.createElement('footer');footer.className='ai-standard-footer';footer.setAttribute('aria-label','历史版本');aiStandardLink.textContent='标准版';if(/^https?:$/.test(window.location.protocol))aiStandardLink.href='index.html';footer.append(aiStandardLink);$('.main').append(footer);}
const aiPurchaseLink=$('#editPurchaseLink');
aiPurchaseLink.required=true;aiPurchaseLink.setAttribute('aria-required','true');
$('label[for="editPurchaseLink"]').insertAdjacentHTML('afterbegin','<span class="required">*</span> ');
aiPurchaseLink.addEventListener('input',()=>{if(aiPurchaseLink.value.trim())clearPendingRequiredError(aiPurchaseLink.closest('.pending-basic-field'));});
const aiDetailOriginalRequired=validatePendingRequiredFields;
validatePendingRequiredFields=function(){
 if(aiPendingIsXingqu()&&!aiPurchaseLink.value.trim()){
  const field=aiPurchaseLink.closest('.pending-basic-field');clearPendingRequiredError(field);field.classList.add('pending-field-invalid');aiPurchaseLink.setAttribute('aria-invalid','true');field.insertAdjacentHTML('beforeend','<div class="inline-error pending-required-error">请填写采购链接</div>');showToast('请填写采购链接','error');aiPurchaseLink.focus();return false;
 }
 return aiDetailOriginalRequired();
};
const aiDetailOriginalValidate=validate;
function aiPendingNeedsCompletion(product){
 if(!String(product.purchaseLink??product.url??'').trim()||!String(product.purchaseNotes||'').trim())return true;
 return product.skus.some(sku=>{
  if(missingOpFields(buildOpRequest(product,sku)).length)return true;
  if(!String(sku.accessoryList??sku.packagingList??sku.competitor??'').trim())return true;
  if(!/^\d+$/.test(String(sku.moq??'')))return true;
  const request=buildOpRequest(product,sku),values=[sku.price,pendingSalePrice(sku),...['length','width','height','weight'].map(key=>request.carton[key]),...(request.product?['length','width','height','weight'].map(key=>request.product[key]):[])];
  return values.some(value=>!/^\d+(?:\.\d{1,2})?$/.test(String(value)));
 });
}
validate=function(){
 document.activeElement?.blur();
 const missing=isVisible?products.find(aiPendingNeedsCompletion):null;
 if(missing){openEdit(missing.spu);validatePendingRequiredFields();showToast('请补全待开发产品必填信息及数值格式','error');return false;}
 return aiDetailOriginalValidate();
};

function aiAlignCompetitorOverview(){
 $('#compDetail .comp-overview-image')?.remove();
 const path=$('#compDetail .comp-category-path'),warning=$('#compDetail .comp-category-warning');
 if(warning){const icon=warning.querySelector('[aria-hidden="true"]');if(icon){icon.className='ai-warning-icon';icon.textContent='!';}}
 if(path&&warning&&warning.parentElement!==path)path.append(warning);
}
function aiCleanDetailActions(){
 aiAlignCompetitorOverview();
 $('#toggleCompetitorItems')?.remove();
 $$('#compDetail [data-comp-progress]').forEach(node=>node.remove());
}
const aiDetailOriginalRefresh=aiRefresh;
aiRefresh=function(){aiDetailOriginalRefresh();aiCleanDetailActions();};
const aiDetailOriginalCompetitors=renderCompetitors;
renderCompetitors=function(){aiDetailOriginalCompetitors();aiCleanDetailActions();};

const aiDetailOriginalProducts=renderProducts;
renderProducts=function(){
 aiDetailOriginalProducts();
 const headers=[...$('#pendingHead tr').children],removed=headers.map((cell,index)=>['起订量','配件搭配清单'].includes(cell.textContent.trim())?index:-1).filter(index=>index>=0);
 $$('#pendingBody tr').forEach(row=>{
  const cells=[...row.children];if(cells.length===1){cells[0].colSpan=10;return;}
  removed.forEach(index=>cells[index]?.remove());
  const spu=row.querySelector('[data-spu]')?.dataset.spu,id=spu||row.querySelector('.sku-code')?.textContent;
  const product=products.find(p=>p.spu===id||p.skus.some(s=>s.sku===id));
  if(spu&&product&&cells[5])cells[5].innerHTML=sourceCell(product);
  let operation=row.querySelector('.pending-operation-fixed');
  if(!operation){operation=document.createElement('td');operation.className='pending-operation-fixed';row.append(operation);}
  if(spu){const view=document.createElement('button');view.type='button';view.className='link ai-view-product';view.textContent='查看';view.dataset.pendingView=id;view.onclick=()=>aiViewPending(id);operation.prepend(view);if(view.nextSibling)view.after(document.createElement('br'));}
 });
 removed.forEach(index=>headers[index].remove());
 $$('#pendingBody .pending-operation-fixed').forEach(cell=>{const edit=cell.querySelector('.edit-product'),view=cell.querySelector('[data-pending-view]'),others=[...cell.querySelectorAll('button,a')].filter(node=>node!==edit&&node!==view);cell.replaceChildren(...[edit,view,...others].filter(Boolean));cell.classList.add('ai-inline-operations');});
 if(!$('#pendingHead .pending-operation-fixed'))$('#pendingHead tr').insertAdjacentHTML('beforeend','<th class="pending-operation-fixed">操作</th>');
 $('.pending-table').classList.add('has-operations');schedulePendingStickyWidth();
};

let aiPendingViewing=false,aiPendingControlSnapshot=[];
function aiRestorePendingControls(){
 for(const [node,disabled,hidden] of aiPendingControlSnapshot){node.disabled=disabled;node.hidden=hidden;}
 aiPendingControlSnapshot=[];aiPendingViewing=false;
 $('#editModal').classList.remove('ai-pending-readonly');
 $('#editModal .modal-foot [data-close]').textContent='取消';
}
const aiDetailOriginalOpenEdit=openEdit;
openEdit=function(id){aiRestorePendingControls();aiDetailOriginalOpenEdit(id);};
function aiViewPending(id,snapshot=null){
 const index=snapshot?products.findIndex(product=>product.spu===id):-1,live=index>=0?products[index]:null;
 if(live)products[index]=structuredClone(snapshot);
 try{openEdit(id);}finally{if(live)products[index]=live;}
if(!$('#editModal').classList.contains('open'))return;
 // The reusable editor is mounted before dynamic dialogs; move it above its caller.
 document.body.append($('#editModal'));
 aiPendingViewing=true;$('#editModal').classList.add('ai-pending-readonly');
 $('#editModal .modal-title').textContent='查看待开发产品';
 $$('#editModal input,#editModal select,#editModal textarea,#editModal button').forEach(node=>{
  if(node.hasAttribute('data-close')||node.hasAttribute('data-pending-help'))return;
  aiPendingControlSnapshot.push([node,node.disabled,node.hidden]);node.disabled=true;
  if(node.id==='saveProduct'||node.id==='addVariant'||node.classList.contains('edit-remove-variant'))node.hidden=true;
 });
 $('#editModal .modal-foot [data-close]').textContent='关闭';$('#editModal .modal-head [data-close]')?.focus();
}
const aiDetailOriginalSaveProduct=$('#saveProduct').onclick;
$('#saveProduct').onclick=function(event){if(aiPendingViewing||!canWrite())return;return aiDetailOriginalSaveProduct.call(this,event);};
aiCleanDetailActions();renderProducts();

// Populate SKU references directly from this task's reference-product list.
const aiOriginalEditVariants=renderEditVariants;
renderEditVariants=function(product){
 aiOriginalEditVariants(product);
 $$('#editVariantBody > tr').forEach(row=>{
  const sku=product.skus.find(item=>item.sku===row.dataset.sku),input=row.querySelector('[data-field="reference"]');
  if(!sku||!input)return;
  const selected=sku.reference??product.asin??'',select=document.createElement('select');
  select.className=input.className;select.dataset.field='reference';select.setAttribute('aria-label','参考产品ASIN');select.setAttribute('aria-required','true');select.disabled=input.disabled;
  const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent=refs.length?'请选择参考产品':'暂无参考产品';select.append(placeholder);
  const seen=new Set();
  refs.forEach(reference=>{if(!reference.asin||seen.has(reference.asin))return;seen.add(reference.asin);const option=document.createElement('option');option.value=reference.asin;option.textContent=reference.asin;option.title=reference.title||reference.asin;option.selected=reference.asin===selected;select.append(option);});
  if(selected&&!seen.has(selected)){const option=document.createElement('option');option.value=selected;option.textContent=selected+'（已不在参考产品列表）';option.disabled=true;option.selected=true;select.append(option);}
  if(!selected)placeholder.selected=true;
  input.replaceWith(select);
 });
};

// Keep report SKU details focused on the seven presentation fields.
const aiOriginalPendingReport=pendingProductsReportHtml;
pendingProductsReportHtml=function(){
 const container=document.createElement('div');container.innerHTML=aiOriginalPendingReport();
 container.querySelectorAll('.report-skus').forEach(table=>{
  table.querySelectorAll('tr').forEach(row=>{
   if(row.children.length===1){row.children[0].colSpan=7;return;}
   [7,6].forEach(index=>row.children[index]?.remove());
  });
  const headers=table.querySelectorAll('thead th');
  ['SKU编码','标题','产品图片','参考产品','采购价','预计售价','利润测算结果'].forEach((title,index)=>{if(headers[index])headers[index].textContent=title;});
 });
 return container.innerHTML;
};

const aiOriginalRefreshCompScope=refreshCompScope;
refreshCompScope=function(){aiOriginalRefreshCompScope();aiAlignCompetitorOverview();};
aiAlignCompetitorOverview();

const aiOriginalRenderCompList=renderCompList;
renderCompList=function(){
 aiOriginalRenderCompList();
 $$('#compList .comp-list-metrics').forEach(node=>node.remove());
 $$('#compList .comp-completion').forEach(node=>{
  if(!node.classList.contains('incomplete')){node.remove();return;}
  node.textContent='待完善';
  const asin=node.closest('[data-comp-select]')?.dataset.compSelect,record=ensureCompetitorState().items.find(item=>item.asin===asin);
  if(record){const reasons=[...new Set(compMissing(record).map(item=>item.message))];node.title=reasons.join('；');node.setAttribute('aria-label','待完善：'+reasons.join('；'));}
 });
};
renderCompList();
setCategorySaved=function(){const mark=$('#categorySaved');if(mark){mark.hidden=true;mark.setAttribute('aria-hidden','true');mark.textContent='';}};
setCategorySaved(false);

const aiOriginalRenderReferences=renderRefs;
renderRefs=function(){
 aiOriginalRenderReferences();
 $$('#referenceBody .reference-asin-status').forEach(group=>{
  const association=group.querySelector('.tag.teal'),identity=group.querySelector('.reference-identity-tags');
  if(association){association.classList.add('reference-competitor-tag');group.append(association);}
  if(identity&&!identity.children.length)identity.remove();
 });
};
renderRefs();

// Select task reference products in a compact table with filtered select-all.
const aiOriginalChooseCompetitors=chooseCompetitors;
chooseCompetitors=function(){
 aiOriginalChooseCompetitors();
 const addDialog=[...document.querySelectorAll('.comp-add-dialog')].at(-1);
 if(addDialog){
  const error=addDialog.querySelector('#compAddError'),directInput=addDialog.querySelector('#directCompAsin'),tip=addDialog.querySelector('.comp-add-ai-tip');
  addDialog.querySelectorAll('[data-add-mode]').forEach(button=>button.addEventListener('click',()=>{if(button.dataset.addMode==='direct')directInput.after(error);else tip.before(error);}));
 }
 const dialog=document.querySelector('.comp-add-dialog')?.closest('.modal-mask');if(!dialog)return;
 const list=dialog.querySelector('#compAddReferenceList'),empty=dialog.querySelector('#compAddSearchEmpty');
 const rows=[...list.querySelectorAll('[data-reference-search]')].map(label=>{
  const row=document.createElement('tr');row.dataset.referenceSearch=label.dataset.referenceSearch;
  if(label.classList.contains('is-added'))row.classList.add('is-added');
  const checkbox=label.querySelector('[data-comp-ref]'),name=label.querySelector('.comp-add-product-name'),status=label.querySelector('.comp-add-existing');
  for(let i=0;i<4;i++)row.append(document.createElement('td'));
  checkbox.setAttribute('aria-label','选择参考产品 '+checkbox.dataset.compRef);row.children[0].append(checkbox);
  row.children[1].textContent=checkbox.dataset.compRef;row.children[2].textContent=name?.textContent||'未填写产品名称';row.children[2].title=row.children[2].textContent;
  if(status)row.children[3].append(status);
  return row;
 });
 const table=document.createElement('table');table.className='ai-comp-reference-table';table.innerHTML='<colgroup><col style="width:44px"><col style="width:130px"><col><col style="width:68px"></colgroup><thead><tr><th><input type="checkbox" data-comp-ref-all aria-label="全选当前搜索结果中可添加的参考产品"></th><th>ASIN</th><th>产品名称</th><th>状态</th></tr></thead><tbody></tbody>';
 table.querySelector('tbody').append(...rows);list.replaceChildren(table,empty);
 const all=table.querySelector('[data-comp-ref-all]'),search=dialog.querySelector('#compAddReferenceSearch');
 let page=1,pageSize=10;
 const matching=()=>{const query=search.value.trim().toLowerCase();return rows.filter(row=>row.dataset.referenceSearch.includes(query));};
 const eligible=()=>matching().map(row=>row.querySelector('[data-comp-ref]')).filter(input=>!input.disabled);
 const sync=()=>{const inputs=eligible(),selected=inputs.filter(input=>input.checked).length;all.disabled=!inputs.length;all.checked=inputs.length>0&&selected===inputs.length;all.indeterminate=selected>0&&selected<inputs.length;all.setAttribute('aria-checked',all.indeterminate?'mixed':String(all.checked));};
 rows.forEach(row=>{const checkbox=row.querySelector('[data-comp-ref]'),update=checkbox.onchange;checkbox.onchange=()=>{update?.();sync();};row.onclick=event=>{if(event.target.closest('input,button,a')||checkbox.disabled)return;checkbox.checked=!checkbox.checked;checkbox.onchange();};});
 all.onchange=()=>{const inputs=eligible();inputs.forEach(input=>input.checked=all.checked);if(inputs.length)inputs[0].onchange();else sync();};
 const pager=document.createElement('div');pager.className='pagination ai-reference-pagination';pager.setAttribute('aria-label','参考产品分页');
 pager.innerHTML='<span data-ref-page-total></span><button type="button" class="page-btn" data-ref-page-prev aria-label="上一页">‹</button><span data-ref-page-current aria-live="polite"></span><button type="button" class="page-btn" data-ref-page-next aria-label="下一页">›</button><select class="control" data-ref-page-size aria-label="每页条数"><option value="10" selected>10条/页</option><option value="20">20条/页</option><option value="50">50条/页</option></select>';
 list.after(pager);
 const paintPage=()=>{const matches=matching(),pages=Math.max(1,Math.ceil(matches.length/pageSize));page=Math.min(page,pages);const visible=new Set(matches.slice((page-1)*pageSize,page*pageSize));rows.forEach(row=>row.hidden=!visible.has(row));empty.hidden=matches.length>0;pager.querySelector('[data-ref-page-total]').textContent='共 '+matches.length+' 条';const pageNumbers=pager.querySelector('[data-ref-page-current]');pageNumbers.replaceChildren();const first=Math.max(1,Math.min(page-2,pages-4));for(let n=first;n<=Math.min(pages,first+4);n++){const button=document.createElement('button');button.type='button';button.className='page-btn'+(n===page?' active':'');button.textContent=n;button.setAttribute('aria-label','第'+n+'页');if(n===page)button.setAttribute('aria-current','page');button.onclick=()=>{page=n;paintPage();};pageNumbers.append(button);}pager.querySelector('[data-ref-page-prev]').disabled=page<=1;pager.querySelector('[data-ref-page-next]').disabled=page>=pages;list.scrollTop=0;sync();};
 pager.querySelector('[data-ref-page-size]').onchange=event=>{pageSize=Number(event.target.value);page=1;paintPage();};
 pager.querySelector('[data-ref-page-prev]').onclick=()=>{if(page>1){page--;paintPage();}};
 pager.querySelector('[data-ref-page-next]').onclick=()=>{if(page*pageSize<matching().length){page++;paintPage();}};
 const searchInput=search.oninput;
 search.oninput=()=>{searchInput();page=1;paintPage();};search.addEventListener('search',()=>{page=1;paintPage();});
 paintPage();
};
if($('#selectCompetitors'))$('#selectCompetitors').onclick=chooseCompetitors;

// Review and preproject views share the submitted, approved report snapshot.
const aiLiveReportHtml=reportHtml;
reportHtml=function(){
 if(m.stage==='done'&&m.approvedReportHtml)return m.approvedReportHtml;
 if(['review','terminated'].includes(m.stage)&&m.submittedReportHtml)return m.submittedReportHtml;
 return aiLiveReportHtml();
};
function aiRefreshPreproject(){
 const button=$('#preproject');if(!button)return;
 button.textContent='进入预立项';button.disabled=m.stage!=='done';button.title=button.disabled?'开发任务审核通过后可进入预立项':'';
 const note=$('#preprojectLink .subtle');if(note)note.textContent='进入预立项后自动生成PDF并关联项目';
}
const aiPreprojectRefresh=aiRefresh;
aiRefresh=function(){aiPreprojectRefresh();aiRefreshPreproject();};
function aiRenderProjectReport(dialog){
 const record=m.projectResearchReport;if(!record)return;
 const row=`<tr><td class="left">${esc(record.name)}</td><td>PDF</td><td>${esc(record.modifiedBy)}</td><td><button type="button" class="link" data-project-report-preview>预览</button> <button type="button" class="link" data-project-report-pdf>下载PDF</button></td></tr>`;
 dialog.querySelector('.modal-body').innerHTML=`<div class="ai-project-report-tabs"><button type="button" class="btn primary" data-project-report-tab="detail">项目详情</button><button type="button" class="btn" data-project-report-tab="list">开发调研方案列表</button></div><h3 data-project-report-heading>开发调研方案</h3><div class="table-shell"><table><thead><tr><th>名称</th><th>格式</th><th>修改人</th><th>操作</th></tr></thead><tbody>${row}</tbody></table></div>`;
 dialog.querySelectorAll('[data-project-report-tab]').forEach(button=>button.onclick=()=>{dialog.querySelectorAll('[data-project-report-tab]').forEach(item=>item.classList.toggle('primary',item===button));dialog.querySelector('[data-project-report-heading]').textContent=button.dataset.projectReportTab==='detail'?'开发调研方案':'开发调研方案列表';});
 dialog.querySelector('[data-project-report-preview]').onclick=()=>{const report=openDialog('市场分析报告 · 只读预览',record.html,'','report-dialog');aiAttachReportExport(report);};
 dialog.querySelector('[data-project-report-pdf]').onclick=()=>{const report=openDialog('市场分析报告',record.html,'','report-dialog');aiPrintReport(report);window.addEventListener('afterprint',()=>report.remove(),{once:true});};
}
$('#preproject').onclick=()=>{
 if(m.stage!=='done')return;
 const html=m.approvedReportHtml||reportHtml(),content=document.createElement('div');content.innerHTML=html;
 const name=content.querySelector('h1')?.textContent||'市场分析报告';
 if(m.projectResearchReport?.html!==html){
  m.projectResearchReport={name,fileName:name+'.pdf',modifiedBy:'AC系统',html};m.preprojectReportHtml=html;persist();
 }
 const dialog=openDialog('预立项 · 开发调研方案','','','ai-project-research-dialog');aiRenderProjectReport(dialog);
};
aiRefreshPreproject();

// Reuse the review dialog; the research-state shortcut only previews its interaction.
function aiProfitHelpMarkup(){
 const fullName=['海运','多渠道利润测算（OP）'].join('-');
 return `<button type="button" class="pending-help-icon" data-pending-help="${esc(fullName)}：所有平台店铺利润率均大于0%，且至少1家大于10%，判定为利润通过；否则不通过。" aria-label="利润测算说明" aria-expanded="false">?</button>`;
}
function aiReviewProductsHtml(rows){
 const profit=(product,sku)=>{const result=opAssessment(product,sku);return `<span class="pending-profit-result ${result.state}">${esc(result.label)}</span>`;};
 return `<table class="ai-review-products"><colgroup><col style="width:44px"><col style="width:155px"><col style="width:76px"><col style="width:240px"><col style="width:200px"><col style="width:140px"><col style="width:135px"><col style="width:115px"><col style="width:120px"><col style="width:120px"><col style="width:65px"></colgroup><thead><tr><th><input type="checkbox" data-review-all aria-label="全选审核SKU"></th>${['SPU/SKU','产品图片','产品标题','供应商','参考产品','来源','采购价','预计售价','利润测算结果','操作'].map(title=>`<th>${title}${title==='利润测算结果'?' '+aiProfitHelpMarkup():''}</th>`).join('')}</tr></thead><tbody>${rows.map(product=>`<tr class="ai-review-spu"><td></td><td class="left"><button type="button" class="tree-toggle" data-review-fold="${esc(product.spu)}" aria-expanded="true">▾</button>${esc(product.spu)}</td><td>${reportImageHtml(product.img,true,'SPU产品图片')}</td><td class="left">${esc(product.title)}</td><td class="left">${esc(product.supplier)}${product.purchaseNotes?`<div class="subtle">${esc(product.purchaseNotes)}</div>`:''}</td><td></td><td>${sourceCell(product)}</td><td></td><td></td><td></td><td><button type="button" class="link" data-review-view="${esc(product.spu)}">查看</button></td></tr>${product.skus.map(sku=>`<tr data-review-parent="${esc(product.spu)}"><td><input type="checkbox" data-review-sku="${esc(sku.sku)}" aria-label="审核通过 ${esc(sku.sku)}"></td><td class="left">${esc(sku.sku)}</td><td>${reportImageHtml(sku.img||product.img,true,'SKU产品图片')}</td><td class="left">${esc(sku.variantTitle||product.title)}</td><td></td><td>${esc(sku.reference||product.asin)}<br>${esc(sku.referenceType||'')}</td><td>${esc(product.source||'')}</td><td>${reportValue(sku.price==null||sku.price===''?'':Number(sku.price).toFixed(2))} <span class="pending-currency-label">${esc(sku.purchaseCurrency||'CNY')}</span></td><td>${reportValue(pendingSalePrice(sku)===null?'':pendingSalePrice(sku).toFixed(2))} <span class="pending-currency-label">${esc(sku.saleCurrency||'USD')}</span></td><td>${profit(product,sku)}</td><td></td></tr>`).join('')}`).join('')||'<tr><td colspan="11">暂无待开发产品</td></tr>'}</tbody></table>`;
}
const aiOriginalOpenReview=openReview;
openReview=function(demo=false){
 aiOriginalOpenReview();
 const dialog=[...document.querySelectorAll('.modal-mask')].findLast(node=>node.querySelector('.review-table'));if(!dialog)return;
 dialog.querySelector('.modal').classList.add('ai-review-dialog');dialog.querySelector('.modal-title').textContent='审核';dialog.querySelector('.modal').setAttribute('aria-label','审核');dialog.querySelector('.modal-foot [data-cancel]').textContent='取消';
 const rejectButton=dialog.querySelector('[data-reject]');
 // Keep handler references for confirmation, but remove the duplicate footer controls.
 const approveButton=dialog.querySelector('[data-approve]');
 const actual=m.stage==='review'&&!demo,interactive=actual||demo;
 const rows=m.submittedProducts&&m.stage!=='research'?m.submittedProducts:products;
 const body=dialog.querySelector('.modal-body'),banner=dialog.querySelector('.review-banner');
 banner.innerHTML=isVisible?`<button type="button" class="btn report-preview-button ai-review-report-button" data-review-report aria-label="预览市场分析报告">${$('#previewInline svg')?.outerHTML||''}<span>预览市场分析报告</span></button>`:'';
 banner.querySelector('[data-review-report]')?.addEventListener('click',event=>{event.preventDefault();preview();});
 banner.insertAdjacentHTML('afterend',`<div class="ai-review-decision"><span><span class="required">*</span> 审核结果</span><label><input type="radio" name="ai-review-decision-${dialog.id}" value="approve" checked ${interactive?'':'disabled'}> 审核通过</label><label><input type="radio" name="ai-review-decision-${dialog.id}" value="reject" ${interactive?'':'disabled'}> 审核驳回</label></div>`);
 const heading=dialog.querySelector('h3');heading.classList.add('ai-review-sku-heading');heading.innerHTML='<span><span class="required">*</span> 已开发SKU</span>';
 const reportButton=banner.querySelector('[data-review-report]');heading.insertAdjacentHTML('beforeend','<span class="subtle">请选择审核通过的SKU</span>');if(reportButton)heading.append(reportButton);banner.remove();
 const table=dialog.querySelector('.review-table');table.classList.add('ai-review-table');table.innerHTML=aiReviewProductsHtml(rows);
 const master=table.querySelector('[data-review-all]'),checks=[...table.querySelectorAll('[data-review-sku]')];
 if(!interactive){checks.forEach(input=>{input.checked=(m.approvedSkuCodes||[]).includes(input.dataset.reviewSku);input.disabled=true;});master.disabled=true;}
 const sync=()=>{master.checked=checks.length>0&&checks.every(input=>input.checked);master.indeterminate=checks.some(input=>input.checked)&&!master.checked;};
 master.onchange=()=>{checks.forEach(input=>input.checked=master.checked);sync();};checks.forEach(input=>input.onchange=sync);sync();
 table.querySelectorAll('[data-review-fold]').forEach(button=>button.onclick=()=>{const expanded=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(expanded));button.textContent=expanded?'▾':'▸';table.querySelectorAll('[data-review-parent]').forEach(row=>{if(row.dataset.reviewParent===button.dataset.reviewFold)row.hidden=!expanded;});});
 table.querySelectorAll('[data-review-view]').forEach(button=>button.onclick=()=>aiViewPending(button.dataset.reviewView,rows.find(product=>product.spu===button.dataset.reviewView)));
 const opinion=dialog.querySelector('.review-opinion');opinion.disabled=!interactive;opinion.placeholder='请输入备注';
 const opinionHeading=[...body.querySelectorAll('h3')].at(-1);opinionHeading.textContent='备注';
 const foot=dialog.querySelector('.modal-foot');
 approveButton?.remove();rejectButton?.remove();
 const confirm=document.createElement('button');confirm.type='button';confirm.className='btn primary';confirm.textContent='确认';confirm.dataset.reviewConfirm='true';
 if(interactive){foot.append(confirm);confirm.onclick=()=>{
  const rejecting=dialog.querySelector('input[type="radio"][value="reject"]').checked;
  if(rejecting&&!opinion.value.trim()){dialog.querySelector('#reviewError').textContent='审核驳回时请填写备注';opinion.focus();return;}
  if(!rejecting&&!checks.some(input=>input.checked)){dialog.querySelector('#reviewError').textContent='请选择审核通过的SKU';return;}
  if(demo){close(dialog);return;}
  if(rejecting)rejectButton.click();else{m.approvedSkuCodes=checks.filter(input=>input.checked).map(input=>input.dataset.reviewSku);approveButton.click();}
 };}
};
$('#openReview').onclick=()=>openReview();
const aiReviewShortcut=document.createElement('button');aiReviewShortcut.type='button';aiReviewShortcut.className='link ai-review-shortcut';aiReviewShortcut.textContent='审核弹窗';aiReviewShortcut.dataset.reviewDemo='true';aiReviewShortcut.onclick=()=>openReview(true);$('#taskStatusTag').after(aiReviewShortcut);
const aiReturnToResearch=document.createElement('button');aiReturnToResearch.type='button';aiReturnToResearch.className='link ai-review-shortcut';aiReturnToResearch.textContent='返回调研（演示）';aiReturnToResearch.dataset.returnResearchDemo='true';aiReturnToResearch.hidden=!['review','done'].includes(m.stage);aiReviewShortcut.after(aiReturnToResearch);
aiReturnToResearch.onclick=()=>{
 if(activeHistoryTask)return;
 delete m.submittedReportHtml;delete m.approvedReportHtml;delete m.submittedProducts;delete m.approvedSkuCodes;
 $('#currentUser').value='developer';$('#workflowState').value='research';$('#workflowState').onchange();
 showToast('已返回调研中，已填写内容保留');
};
const aiResearchDemoRefresh=aiRefresh;aiRefresh=function(){aiResearchDemoRefresh();aiReturnToResearch.hidden=!!activeHistoryTask||!['review','done'].includes(m.stage);};
