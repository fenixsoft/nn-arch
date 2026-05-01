# 神经网络架构可视化工具

一个纯前端的神经网络架构可视化工具，输入 YAML 格式的网络定义，生成美观的 SVG 架构图。

## 功能特性

- ✅ 支持多种层类型：Input、Conv、Pool、FC、Output、Embedding、Attention 等
- ✅ 支持复杂拓扑结构：残差块（Residual）、并行块（Parallel）、重复块（Stack）
- ✅ 支持多种布局：水平、垂直、自动换行
- ✅ 支持分组显示（Sections）
- ✅ 预置模板：AlexNet、VGG16、ResNet18、Transformer
- ✅ 纯前端实现，无需后端依赖
- ✅ 支持外部 API 调用

## 文件结构

```
nn-arch/
├── index.html          # 主页面（编辑器 + 预览）
├── src/                # 源代码目录
│   ├── styles.css      # CSS 样式
│   ├── app.js          # 主逻辑（页面交互）
│   ├── parser.js       # YAML 解析器
│   ├── layout.js       # 布局算法
│   ├── svg-generator.js # SVG 生成器
│   ├── templates.js    # 预置模板
│   ├── nn-arch.js      # 外部调用 API
│   └── lib/
│     └ js-yaml.min.js  # YAML 解析库（本地）
└── tests/              # 测试文件
```

## 使用方式

### 方式一：npm 安装

```bash
npm install @icyfenix-dmla/nn-arch
```

在 Node.js 中使用：

```javascript
const NNArch = require('@icyfenix-dmla/nn-arch');

// 从 YAML 生成 SVG
const yaml = `
name: SimpleNet
layout: horizontal
layers:
  - {name: Input, type: input, size: "224x224x3"}
  - {name: Conv1, type: conv, kernel: 3, channels: 64, act: ReLU}
  - {name: Output, type: output, size: 10}
`;
const svg = NNArch.generateFromYaml(yaml);

// 从预置模板生成
const vggSvg = NNArch.generateFromTemplate('vgg16');
```

### 方式二：直接打开网页

在浏览器中打开 `index.html`，即可使用可视化界面：

1. 在 YAML 编辑器中输入网络定义
2. 点击"生成 SVG"按钮
3. 在预览区域查看生成的架构图
4. 使用 +/- 按钮调整缩放比例
5. 点击"下载 SVG"保存文件

### 方式三：外部 API 聃用（浏览器）

在你的网页中引入相关文件后，调用 `NNArch` 对象的方法：

```html
<!-- 引入依赖 -->
<script src="src/lib/js-yaml.min.js"></script>
<script src="src/parser.js"></script>
<script src="src/layout.js"></script>
<script src="src/svg-generator.js"></script>
<script src="src/templates.js"></script>
<script src="src/nn-arch.js"></script>

<!-- 使用 API -->
<script>
  // 从 YAML 生成 SVG
  const yaml = `
name: SimpleNet
layout: horizontal
layers:
  - {name: Input, type: input, size: "224x224x3"}
  - {name: Conv1, type: conv, kernel: 3, channels: 64, act: ReLU}
  - {name: Output, type: output, size: 10}
`;
  const svg = NNArch.generateFromYaml(yaml);
  document.getElementById('container').innerHTML = svg;

  // 从预置模板生成
  const vggSvg = NNArch.generateFromTemplate('vgg16');

  // 下载 SVG
  NNArch.downloadSvg(svg, 'MyNetwork');
</script>
```

### API 方法

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `generateFromYaml(yamlText)` | YAML 文本 | SVG 字符串 | 从 YAML 生成 SVG |
| `generateFromTemplate(key)` | 模板键名 | SVG 字符串 | 从预置模板生成 |
| `getTemplateList()` | 无 | 数组 | 获取可用模板列表 |
| `getTemplateYaml(key)` | 模板键名 | YAML 文本 | 获取模板 YAML |
| `downloadSvg(svg, filename)` | SVG、文件名 | 无 | 下载 SVG 文件 |

**可用模板：** `alexnet`, `vgg16`, `resnet18`, `transformer`

## YAML 格式说明

### 基本结构

```yaml
name: 网络名称
layout: horizontal | vertical    # 布局方式（可选，默认 horizontal）

sections:                        # 分组区域（可选）
  - name: 特征提取器
    layers: [Input, Conv1, Conv2]
    row_label: "Flatten: 9216"   # section 后的标注（可选）

layers:                          # 所有层定义
  - {name: Input, type: input, size: "224x224x3"}
  - {name: Conv1, type: conv, kernel: 11, stride: 4, channels: 96, out: "55x55x96", act: ReLU}
  - {name: Pool1, type: pool, kernel: 3, stride: 2, out: "27x27x96"}
  - {name: FC1, type: fc, size: 4096, act: ReLU, dropout: true}
  - {name: Output, type: output, size: 1000, act: Softmax}
```

### 支持的层类型

| 类型 | 必要参数 | 可选参数 |
|------|----------|----------|
| `input` | `size` | - |
| `conv` | `kernel`, `channels` | `stride`, `out`, `act`, `pool` |
| `pool` | `kernel` | `stride`, `out`, `type` |
| `fc` | `size` | `act`, `dropout` |
| `output` | `size` | `act` |
| `embedding` | `size` | - |
| `attention` | `heads` | `type` |

### 换行机制

当 section 内的层超过 6 个时，会自动换行显示，换行处会有折线连接。

## 测试

```bash
node tests/test-runner.js
```

或打开 `tests/test-runner.html` 在浏览器中运行测试。

## 许可证

MIT License