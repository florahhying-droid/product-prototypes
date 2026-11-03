/* Detail presentation changes are confined to the AI version. */
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
