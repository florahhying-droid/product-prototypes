// Shared pending-product UI with task-specific Xingqu validation and calculation.
function aiPendingIsXingqu(){return ['research','unassigned'].includes(m.stage)?m.dept==='xingqu':!!m.frozenVisibility;}
function aiPendingRange(sku){
 const numbers=String(sku.sale||'').match(/\d+(?:\.\d+)?/g)||[];
 return {min:sku.saleMin??(numbers[0]!==undefined?Number(numbers[0]):pendingSalePrice(sku)),max:sku.saleMax??(numbers[1]!==undefined?Number(numbers[1]):null)};
}
function aiPendingRequiredMark(label,required){
 if(!label)return;label.querySelectorAll('.required').forEach(node=>node.remove());
 if(required)label.insertAdjacentHTML('afterbegin','<span class="required">*</span> ');
}
function aiPendingBusinessLabels(){
 const star=aiPendingIsXingqu();
 for(const id of ['editPurchaseNotes','editPurchaseLink']){
  const input=$('#'+id);input.required=star;input.setAttribute('aria-required',String(star));aiPendingRequiredMark($('label[for="'+id+'"]'),star);
 }
 $$('#editModal th').forEach(th=>{
  const text=th.textContent.replace(/\*/g,'').trim();
  if(/装箱方式|整箱数量|整箱重量|外箱[长宽高]|单套重量|包装[长宽高]|产品包装清单/.test(text))aiPendingRequiredMark(th,star);
 });
 $$('#editModal [data-pending-help]').forEach(button=>{const text=button.dataset.pendingHelp||'';if(text.includes('套装数量')||text.includes('含包材'))button.hidden=!star;});
}
const aiBusinessVariants=renderEditVariants;
renderEditVariants=function(product){
 aiBusinessVariants(product);const star=aiPendingIsXingqu();
 $$('#editVariantBody > tr').forEach(row=>{
  const sku=product.skus.find(item=>item.sku===row.dataset.sku);if(!sku)return;
  row.querySelectorAll('[data-packing-field],[data-field="competitor"],[data-field="cartonMode"]').forEach(input=>input.setAttribute('aria-required',String(star&&!input.disabled)));
  if(!star){
   const range=aiPendingRange(sku),minimum=row.querySelector('[data-field="salePrice"]'),maximum=minimum.cloneNode(true),separator=document.createElement('span');
   minimum.value=range.min===null?'':Number(range.min).toFixed(2);minimum.setAttribute('aria-label','预计售价下限');
   maximum.dataset.field='saleMax';maximum.setAttribute('aria-label','预计售价上限');maximum.value=range.max===null?'':Number(range.max).toFixed(2);separator.textContent='～';
   minimum.after(separator,maximum);
  }
 });
 aiPendingBusinessLabels();
};
const aiBusinessRequired=validatePendingRequiredFields;
validatePendingRequiredFields=function(){
 if(!aiPendingIsXingqu())for(const row of $$('#editVariantBody > tr')){
  const min=row.querySelector('[data-field="salePrice"]'),max=row.querySelector('[data-field="saleMax"]');
  if(min?.value.trim()&&max?.value.trim()&&Number(min.value)>Number(max.value)){
   const field=max.closest('td');clearPendingRequiredError(field);field.classList.add('pending-field-invalid');max.setAttribute('aria-invalid','true');field.insertAdjacentHTML('beforeend','<div class="inline-error pending-required-error">预计售价下限不能大于上限</div>');return false;
  }
 }
 return aiBusinessRequired();
};
const aiBusinessSave=$('#saveProduct').onclick;
$('#saveProduct').onclick=function(event){
 const star=aiPendingIsXingqu(),product=products.find(item=>item.spu===editingSpu)||newPendingProduct;
 const ranges=!star?$$('#editVariantBody > tr').map(row=>({sku:row.dataset.sku,min:row.querySelector('[data-field="salePrice"]')?.value,max:row.querySelector('[data-field="saleMax"]')?.value})):[];
 const result=aiBusinessSave.call(this,event);
 if(product&&!star&&!$('#editModal').classList.contains('open')){
  for(const range of ranges){const sku=product.skus.find(item=>item.sku===range.sku);if(!sku)continue;sku.saleMin=Number(range.min);sku.saleMax=Number(range.max);sku.sale=sku.saleMin.toFixed(2)+'～'+sku.saleMax.toFixed(2)+' '+(sku.saleCurrency||'USD');}
  persist();renderProducts();
 }
 return result;
};
const aiBusinessProducts=renderProducts;
renderProducts=function(){
 aiBusinessProducts();
 if(!aiPendingIsXingqu()){
  $$('#pendingSection .pending-profit-fixed').forEach(cell=>cell.remove());
  $$('#pendingBody tr').forEach(row=>{
   const sku=products.flatMap(product=>product.skus).find(item=>item.sku===row.querySelector('.sku-code')?.textContent.trim());
   if(sku&&row.children[7]){const range=aiPendingRange(sku);row.children[7].innerHTML=range.min===null||range.max===null?'<span class="tag orange">待维护</span>':esc(Number(range.min).toFixed(2))+'～'+esc(Number(range.max).toFixed(2))+' <span class="pending-currency-label">'+esc(sku.saleCurrency||'USD')+'</span>';}
  });
 }
};
const aiBusinessReview=aiReviewProductsHtml;
aiReviewProductsHtml=function(rows){
 const html=aiBusinessReview(rows);if(aiPendingIsXingqu())return html;
 const content=document.createElement('div');content.innerHTML=html;content.querySelectorAll('tr').forEach(row=>row.children[9]?.remove());content.querySelectorAll('col')[9]?.remove();
 const skus=rows.flatMap(product=>product.skus);content.querySelectorAll('tr[data-review-parent]').forEach((row,index)=>{const sku=skus[index],range=aiPendingRange(sku);row.children[8].innerHTML=range.min===null||range.max===null?reportValue(''):Number(range.min).toFixed(2)+'～'+Number(range.max).toFixed(2)+' <span class="pending-currency-label">'+esc(sku.saleCurrency||'USD')+'</span>';});
 return content.innerHTML;
};
const aiBusinessRefresh=aiRefresh;
aiRefresh=function(){aiBusinessRefresh();aiPendingBusinessLabels();};
const aiBusinessDepartment=$('#developerDept').onchange;
$('#developerDept').onchange=function(event){aiBusinessDepartment.call(this,event);renderProducts();if($('#editModal').classList.contains('open')){const product=products.find(item=>item.spu===editingSpu)||newPendingProduct;if(product)renderEditVariants(product);}};
aiPendingBusinessLabels();renderProducts();
