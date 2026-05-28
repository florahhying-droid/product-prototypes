# Product Prototypes

这个仓库用于集中管理产品需求的交互原型。发布到 GitHub Pages 后，根目录 `index.html` 是所有原型的目录页。

## 当前原型

- `competitor-ai/`：AI 推荐竞品链接功能
- `accessory-log/`：配件产品尺寸重量日志
- `accessory-optimization/`：配件产品添加与关联优化
- `season-recommendation/`：AI 推荐季节标签

## 新增一个需求原型

1. 在根目录新建一个需求文件夹，例如 `new-feature/`。
2. 把这个需求的页面放到 `new-feature/index.html`。
3. 如果有图片等资源，放到 `new-feature/assets/`。
4. 在根目录 `index.html` 里新增一张卡片，链接到 `./new-feature/`。
5. 新增或修改 Demo 前，先参考 `DEMO_WORK_RULES.md`，保持页面结构、说明区和脱敏规则一致。

## 发布说明

- 本仓库是静态 HTML 原型集合，不需要构建命令。
- GitHub Pages 发布后，根目录 `index.html` 作为原型目录页。
- 每个需求原型使用独立文件夹，默认入口为该文件夹下的 `index.html`。
- 不要提交真实用户姓名、手机号、邮箱、账号、接口地址、token、cookie 等敏感信息。

推荐保持这种结构：

```text
product-prototypes/
├── index.html
├── DEMO_WORK_RULES.md
├── competitor-ai/
│   └── index.html
├── accessory-log/
│   ├── index.html
│   └── assets/
├── accessory-optimization/
│   └── index.html
├── season-recommendation/
│   └── index.html
└── README.md
```
