/* Export the saved report using the browser PDF printer; no external service. */
function aiPrintReport(dialog){
 if(!dialog||document.body.classList.contains('ai-printing-report'))return;
 document.activeElement?.blur();
 dialog.dataset.aiPrintReport='true';document.body.classList.add('ai-printing-report');
 const previousTitle=document.title;document.title=dialog.querySelector('.report-paper h1')?.textContent||'市场分析报告';
 const cleanup=()=>{document.body.classList.remove('ai-printing-report');delete dialog.dataset.aiPrintReport;document.title=previousTitle;window.removeEventListener('afterprint',cleanup);};
 window.addEventListener('afterprint',cleanup,{once:true});
 // The native print dialog provides Save as PDF and page-size controls.
 const print=()=>{try{window.print();}catch{cleanup();showToast('无法打开导出窗口，请重试','error');}};
 const images=[...dialog.querySelectorAll('img')].filter(img=>!img.complete);
 Promise.all(images.map(img=>new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true});setTimeout(resolve,1500);}))).then(()=>document.fonts?.ready).then(print);
}
// The offline prototype models AC export tasks; the final file uses the browser PDF printer.
const aiReportExportTasks=[];
function aiRenderDownloadCenter(dialog){
 const body=dialog.querySelector('.modal-body');
 body.innerHTML=`<div class="table-shell"><table><thead><tr><th>文件名称</th><th>状态</th><th>操作</th></tr></thead><tbody>${aiReportExportTasks.length?aiReportExportTasks.map(task=>`<tr><td class="left">${esc(task.name)}</td><td>${task.ready?'导出成功':'导出中'}</td><td><button type="button" class="link" data-ai-download-task="${task.id}" ${task.ready?'':'disabled'}>下载PDF</button></td></tr>`).join(''):'<tr><td colspan="3">暂无下载任务</td></tr>'}</tbody></table></div>`;
 body.querySelectorAll('[data-ai-download-task]').forEach(button=>button.onclick=()=>{
  const task=aiReportExportTasks.find(item=>item.id===button.dataset.aiDownloadTask);if(!task?.ready)return;
  const report=openDialog('市场分析报告',task.html,'','report-dialog');
  aiPrintReport(report);
  window.addEventListener('afterprint',()=>report.remove(),{once:true});
 });
}
function aiOpenDownloadCenter(){
 const dialog=openDialog('下载中心','','','ai-download-center');aiRenderDownloadCenter(dialog);return dialog;
}
function aiQueueReportExport(dialog){
 const task={id:'REPORT-'+Date.now()+'-'+aiReportExportTasks.length,name:(dialog.querySelector('.report-paper h1')?.textContent||'市场分析报告')+'.pdf',html:dialog.querySelector('.report-paper').outerHTML,ready:false};
 aiReportExportTasks.unshift(task);showToast('导出任务已提交，请前往下载中心查看');
 setTimeout(()=>{task.ready=true;document.querySelectorAll('.ai-download-center').forEach(node=>aiRenderDownloadCenter(node.closest('.modal-mask')));},350);
}
const aiDownloadCenterButton=document.createElement('button');aiDownloadCenterButton.type='button';aiDownloadCenterButton.className='link';aiDownloadCenterButton.textContent='下载中心';aiDownloadCenterButton.dataset.aiDownloadCenter='true';aiDownloadCenterButton.onclick=aiOpenDownloadCenter;
($('.top-actions')||$('.topbar')).append(aiDownloadCenterButton);
function aiAttachReportExport(dialog){
 if(!dialog||dialog.querySelector('[data-ai-export-pdf]'))return;
 const button=document.createElement('button');button.type='button';button.className='btn primary';button.textContent='导出PDF';button.dataset.aiExportPdf='true';button.onclick=()=>aiQueueReportExport(dialog);dialog.querySelector('.modal-foot').prepend(button);
}
const aiReportOriginalPreview=preview;
preview=function(){
 aiReportOriginalPreview();const dialog=[...document.querySelectorAll('.modal-mask')].findLast(mask=>mask.querySelector('.report-dialog'));aiAttachReportExport(dialog);
};
$('#previewReport').onclick=preview;$('#previewInline').onclick=preview;
