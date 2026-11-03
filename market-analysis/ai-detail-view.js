/* Detail presentation changes are confined to the AI version. */
// Keep the archived standard version reachable without a floating switch entry.
const aiStandardLink=$('.demo-suite-switch a[href="市场分析报告交互原型.html"]');
if(aiStandardLink){const footer=document.createElement('footer');footer.className='ai-standard-footer';footer.setAttribute('aria-label','历史版本');aiStandardLink.textContent='标准版';if(/^https?:$/.test(window.location.protocol))aiStandardLink.href='index.html';footer.append(aiStandardLink);$('.main').append(footer);}
const aiPurchaseLink=$('#editPurchaseLink');
aiPurchaseLink.required=true;aiPurchaseLink.setAttribute('aria-required','true');
$('label[for="editPurchaseLink"]').insertAdjacentHTML('afterbegin','<span class="required">*</span> ');
aiPurchaseLink.addEventListener('input',()=>{if(aiPurchaseLink.value.trim())clearPendingRequiredError(aiPurchaseLink.closest('.pending-basic-field'));});
const aiDetailOriginalRequired=validatePendingRequiredFields;
validatePendingRequiredFields=function(){
 if(!aiPurchaseLink.value.trim()){
  const field=aiPurchaseLink.closest('.pending-basic-field');clearPendingRequiredError(field);field.classList.add('pending-field-invalid');aiPurchaseLink.setAttribute('aria-invalid','true');field.insertAdjacentHTML('beforeend','<div class="inline-error pending-required-error">请填写采购链接</div>');showToast('请填写采购链接','error');aiPurchaseLink.focus();return false;
 }
 return aiDetailOriginalRequired();
};
const aiDetailOriginalValidate=validate;
validate=function(){
 const missing=products.find(p=>!String(p.purchaseLink??p.url??'').trim());
 if(missing){showToast('请补全待开发产品采购链接','error');$('#pendingSection').scrollIntoView({behavior:'smooth',block:'center'});return false;}
 return aiDetailOriginalValidate();
};
function aiCleanDetailActions(){
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
function aiViewPending(id){
 openEdit(id);if(!$('#editModal').classList.contains('open'))return;
 aiPendingViewing=true;$('#editModal').classList.add('ai-pending-readonly');
 $('#editModal .modal-title').textContent='查看待开发产品';
 $$('#editModal input,#editModal select,#editModal textarea,#editModal button').forEach(node=>{
  if(node.hasAttribute('data-close')||node.hasAttribute('data-pending-help'))return;
  aiPendingControlSnapshot.push([node,node.disabled,node.hidden]);node.disabled=true;
  if(node.id==='saveProduct'||node.id==='addVariant'||node.classList.contains('edit-remove-variant'))node.hidden=true;
 });
 $('#editModal .modal-foot [data-close]').textContent='关闭';
}
const aiDetailOriginalSaveProduct=$('#saveProduct').onclick;
$('#saveProduct').onclick=function(event){if(aiPendingViewing||!canWrite())return;return aiDetailOriginalSaveProduct.call(this,event);};
aiCleanDetailActions();renderProducts();
