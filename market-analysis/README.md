# AC开发任务与预立项整合方案

## 查看入口

- `plan.html`：四阶段规划、第一阶段方案及三个原报告字段处理附表。
- `市场分析报告AI辅助原型.html`：当前AI版离线入口，内嵌样式、脚本及示例图片。
- `ai-index.html`：当前AI版在线入口，使用分离资源。
- `市场分析报告交互原型.html` / `index.html`：标准版历史入口。

## 编辑与构建

AI版复用 `index.html`、`market.js`、`market.css`、`layout.js/css` 和 `report-data.js` 的基础结构，扩展源文件见下方。运行 `python build_standalone.py` 构建控制器及在线／离线入口。方案独立维护，无需构建。

验证使用模拟DOM检查关键交互及静态CSS规则，不等同于浏览器像素验收。正式Agent、利润接口、PDF生成及项目关联服务需由AC接入；原型使用浏览器存储和本地样本。

## AI辅助演示版

- 在线入口：`ai-index.html`；离线入口：`市场分析报告AI辅助原型.html`；方案：`plan.html`。标准版入口位于页面底部。
- 运行 `build_standalone.py` 生成AI控制器、在线入口及离线文件。业务基础复用 `market.js`，AI扩展仅作用于AI版；独立存储键为 `ac-market-analysis-ai-v1`。
- 类目分析：Excel必传、PDF选传，上传状态立即展示；切换调研范围确认清空品类和资料，保留分析内容。一次生成8项内容，支持全部覆盖或仅填充空值；前6项为左右各半的只读依据与可编辑结论，画像／场景为纯文本。历史复用采用审核快照。
- 竞品分析：成功添加后自动发起，支持AI重新分析；空值预填、差异逐项采用、必填缺失原因提示。表单在请求期间可编辑，比较响应时的当前值；人工修改清除该字段的旧提示。参考产品与竞品分析按ASIN关联，仍有分析时不能删除参考产品。
- 产品开发：采购备注、采购链接、SKU产品包装清单及适用装箱数据必填；保存后按SKU自动测算7平台9店铺利润。只读查看按任务权限开放。品牌中心草稿承接采购链接及包装数据，采购价和预计售价不传递。
- 报告：三章节只读展示，必填空值为“待完善”、选填空值为“无”。导出先创建任务，再到下载中心下载；离线文件最后通过浏览器打印功能保存PDF。
- 进入预立项：自动关联已审核报告快照，在项目详情和开发调研方案列表展示同一份记录；名称取报告名称、修改人为AC系统，重复进入复用该记录。
- 原型不连接真实Agent、OP或AC下载中心。AI通过 `window.aiPrototypeService(request)`、利润测算通过 `window.opPrototypeService(request)`预留接入。正式AI能力配置在星仔Agent，由AC用系统token调用，返回结构化JSON。
- 源码职责：`ai-assist.js`共享AI状态；`ai-category-view.js`类目结构化展示与填充；`ai-import-view.js`资料上传及范围切换；`ai-competitor-compare.js`结果适配与逐字段比较；`ai-detail-view.js`产品查看、报告及选择表格；`ai-report-export.js`导出任务与下载中心交互。
- `ai-category-data.js`保留用户指定Google文档最后一次完整8模块输出及版本信息；`ai-competitor-data.js`保留用户提供的US／B0FKB9CYXY结果。缺失原因由样本／Agent返回，前端不推断。样本资料含内部数据，发布前需核对授权。
- 竞品结果契约：`{scene:'competitor_analysis',asin,marketplace,status,fields,dataQuality}`；字段为 `{status:'success',value,source?,collectedAt?,scope?,unit?,period?,estimated?}` 或 `{status:'missing',reason,source?}`。销量整数与估算、周期元数据分别存储。
