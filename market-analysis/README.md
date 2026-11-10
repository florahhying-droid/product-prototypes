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
- 竞品分析：成功添加后自动发起，支持AI重新分析；首次使用AI结果填充空值，不预填选品池字段或生成差异；重新分析时比较差异并逐项采用。必填缺失原因独立提示，备注由人工维护。表单在请求期间可编辑，比较响应时的当前值；人工修改清除该字段的旧提示。参考产品与竞品分析按ASIN关联，仍有分析时不能删除参考产品。
- 产品开发：共用列表及编辑／查看弹窗；采购备注、链接、包装清单及装箱数据仅星渠必填，其他部门选填。星渠使用单值售价及7平台9店铺自动测算，其他部门保留售价区间且不触发该测算。只读查看按任务权限开放。品牌中心草稿承接采购链接及包装数据；星渠采购价、预计售价不传递，其他部门采购价和币种沿用原同步。
- 报告：三章节只读展示，必填空值为“待完善”、选填空值为“无”。导出先创建任务，再到下载中心下载；离线文件最后通过浏览器打印功能保存PDF。
- 进入预立项：自动关联已审核报告快照，在项目详情和开发调研方案列表展示同一份记录；名称取报告名称、修改人为AC系统，重复进入复用该记录。
- 原型不连接真实Agent、OP或AC下载中心。AI通过 `window.aiPrototypeService(request)`、利润测算通过 `window.opPrototypeService(request)`预留接入。星仔Agent「AC市场分析助手」已配置，正式接入由AC用系统token调用，返回结构化JSON。
- 源码职责：`ai-assist.js`共享AI状态；`ai-category-view.js`类目结构化展示与填充；`ai-import-view.js`资料上传及范围切换；`ai-competitor-compare.js`结果适配与逐字段比较；`ai-detail-view.js`产品查看、报告及选择表格；`ai-pending-rules.js`共用产品模块的业务差异；`ai-report-export.js`导出任务与下载中心交互。
- `ai-category-data.js`保留用户指定Google文档最后一次完整8模块输出及版本信息；`ai-competitor-data.js`保留用户提供的US／B0FKB9CYXY结果。缺失原因由样本／Agent返回，前端不推断。样本资料含内部数据，发布前需核对授权。
- 竞品结果契约：`{scene:'competitor_analysis',asin,marketplace,status,fields,dataQuality}`；字段为 `{status:'success',value,source?,collectedAt?,scope?,unit?,period?,estimated?}` 或 `{status:'missing',reason,source?}`。销量整数与估算、周期元数据分别存储。

## 当前Skill口径

- 竞品评分数对应 `basicInfo.ratingCount`：优先 `competitor_lookup.ratings`，备用 `asin_detail.ratings`；非负整数，0有效，缺失为null，不使用文字评论数替代。AC内部存储键 `reviews` 仅为兼容旧记录，接口按 `ratingCount` 映射。
- 类目概况使用“平均评分数”；Excel统计值、计算结果和结论数字由Skill交叉核验，AC按返回JSON展示。
- 当前竞品样本未包含可核验的ratings，演示AI结果留空并提示补充，不把旧评论数转换成评分数。

## 本地文件保留与清理建议（2026-11-06）

当前目录约7.68 MB，共40个文件。以下清点只给出建议，未删除文件。

| 文件／目录 | 用途与建议 |
| --- | --- |
| `plan.html`、AI在线／离线HTML | 当前方案与演示入口，保留。离线HTML为生成文件，但分享或直接打开时需要。 |
| `build_standalone.py`、`ai-*.js`、`ai.css` | 构建脚本、扩展源码、数据样本及样式，保留。`ai-market.js`虽由构建生成，也是在线页面运行所需。 |
| `index.html`、`market.js/css`、`layout.js/css`、`report-data.js`、`assets/` | AI版复用的基础结构和图片，当前构建有依赖，不能因属于标准版基础就直接删除。 |
| `ai-ranking-view.js` | 仍由构建脚本拼接，负责清理榜单相关DOM；当前不可单独删除。 |
| `市场分析报告交互原型.html` | 标准版离线历史副本，当前AI版不读取，可归档；若删除需同步移除历史入口链接。 |
| 根目录 `.pnpm-store/`（约10.95 MB） | 包管理缓存，不参与页面运行或Python构建，可清理，后续安装依赖时可能重新下载。 |
| 根目录 `tmp/`（约11.14 MB） | 临时改造脚本、旧备份、DOM验收脚本及其依赖。交付和发布不需要；建议保留有用的回归脚本，其余可清理。 |
| `output/market-analysis-prd-20261106/PRD.md`、`PRD.pdf` | PRD本地备份及导出交付件，建议保留；Google Docs为在线正文。 |
| 上述PRD目录内32张PNG（约8.16 MB） | 分页渲染图、拼图和验收截图，不参与交付或页面运行，可清理，需要时从PDF重建。 |
| 根目录 `outputs/series-diff-421-vs-368/` | 其他任务的系列差异文档，与本次市场分析无关，不按本任务冗余文件处理。 |

根目录下其他产品原型文件夹各自对应其他需求，保留。`.git/`是仓库记录，保留。
