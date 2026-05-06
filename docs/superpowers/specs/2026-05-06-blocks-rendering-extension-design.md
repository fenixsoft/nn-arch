# Blocks 渲染扩展设计文档

**日期：** 2026-05-06
**目标：** 补齐现有 blocks（residual/parallel/stack）的渲染能力，支持 ResNet、Transformer 等含并行/跳线结构的网络可视化。

---

## 1. 背景

### 当前状态

| 模块 | 状态 |
|------|------|
| parser.js | ✅ 已支持 blocks YAML 解析 |
| layout.js | ❌ 未实现 blocks 坐标计算 |
| svg-generator.js | ❌ 未实现 blocks SVG 渲染 |
| templates.js | ✅ 已定义 ResNet/Transformer block 结构 |

**问题：** 虽然模板定义了 blocks，但渲染时只处理 `layers` 和 `sections`，blocks 被忽略。

### 目标网络

- **ResNet18：** 残差块（identity shortcut + add merge）
- **Transformer Encoder：** 重复块 + 并行 MultiHeadAttention
- **GoogleNet/Inception：** 多分支并行（未来扩展）

---

## 2. YAML 格式扩展

### 2.1 新增属性

```yaml
blocks:
  # 残差块
  - name: ResBlock1
    type: residual
    style: arc              # arc（环绕跳线）| parallel（并排跳线），默认 arc
    main:
      - {id: conv1, name: conv1, type: conv, kernel: 3, channels: 64, act: ReLU}
      - {id: conv2, name: conv2, type: conv, kernel: 3, channels: 64}
    skip: identity          # identity | projection
    merge: add              # add | concat
    act: ReLU

  # 并行块
  - name: MultiHead
    type: parallel
    branches:
      - {id: q, name: Q, type: fc, size: 64}
      - {id: k, name: K, type: fc, size: 64}
      - {id: v, name: V, type: fc, size: 64}
    merge: concat

  # 重复块
  - name: EncoderBlock
    type: stack
    repeat: 6
    expand: false           # true（全部展开）| false（仅一次），默认 false
    layers:
      - {id: ff1, name: FF1, type: fc, size: 2048, act: ReLU}
      - {id: ff2, name: FF2, type: fc, size: 512}
```

### 2.2 属性说明

| 属性 | 适用 block | 类型 | 默认值 | 说明 |
|------|-----------|------|--------|------|
| `style` | residual | string | `'arc'` | 跳线样式：arc（环绕）或 parallel（并排） |
| `expand` | stack | boolean | `false` | 是否展开所有重复 |
| `main` | residual | array | 必填 | 主路径层序列 |
| `skip` | residual | string | 必填 | 跳线类型 |
| `merge` | residual, parallel | string | 必填 | 汇聚方式 |
| `branches` | parallel | array | 必填 | 分支层序列 |
| `repeat` | stack | number | `1` | 重复次数 |
| `layers` | stack | array | 必填 | 内部层序列 |

---

## 3. 布局算法设计

### 3.1 渲染流程

```
layers → blocks → layers_after_blocks → connections
```

blocks 作为整体插入序列，每个 block 内部独立计算布局。

### 3.2 Parallel Block（上下堆叠式）

**布局示意：**

```
┌─────────────────────────────────┐
│  Parallel Block: MultiHead      │
│                                 │
│  ┌───┐  ┌───┐  ┌───┐           │
│  │ Q │  │ K │  │ V │           │
│  └───┘  └───┘  └───┘           │
│    │      │      │             │
│    └──────┼──────┘             │
│           ↓                    │
│       [merge: concat]          │
└─────────────────────────────────┘
```

**坐标计算：**
- 分支层上下堆叠，`branchGap` 间距
- 输入点在 block 左侧中心
- 分叉点到各分支左边缘
- 汇聚点在 block 右侧中心
- 容器高度 = max(分支高度) + padding + merge 区域

### 3.3 Residual Block

**style: arc（环绕式）**

```
┌─────────────────────────────────┐
│  Residual Block: ResBlock       │
│                                 │
│  main: conv1 → conv2            │
│                                 │
│  ╭────────────────────────╮     │
│  │   skip (identity)      │     │
│  ╰────────────────────────╯     │
│           ↓ [add]               │
└─────────────────────────────────┘
```

**style: parallel（并排式）**

```
┌─────────────────────────────────┐
│  Residual Block: ResBlock       │
│                                 │
│  ┌───────────┐  ┌───────────┐  │
│  │ main      │  │ skip      │  │
│  │ conv1→conv2│  │ identity │  │
│  └───────────┘  └───────────┘  │
│       ↓              ↓         │
│      [add + act]                │
└─────────────────────────────────┘
```

**坐标计算：**
- `arc`：跳线为弧形路径，半径 `arcRadius`
- `parallel`：skip 与 main 上下并排，间距 `branchGap`
- merge 点在 block 右侧

### 3.4 Stack Block

**expand: false**

```
┌─────────────────────────────────┐
│  Stack Block: EncoderBlock ×6   │
│                                 │
│  FF1 → FF2                      │
│                                 │
│  （右下角标注 "×6"）              │
└─────────────────────────────────┘
```

**expand: true**

```
┌─────────────────────────────────┐
│  Stack Block: EncoderBlock      │
│                                 │
│  FF1 → FF2                      │
│    ↓                            │
│  FF1 → FF2                      │
│    ↓   ...                      │
│  FF1 → FF2                      │
└─────────────────────────────────┘
```

**坐标计算：**
- `false`：仅渲染一次内部层，标注 ×N
- `true`：渲染 N 次，每次间距 `stackLoopGap`

### 3.5 Block 整体位置

```javascript
// 布局计算流程
function calculateLayout(network) {
  // 1. 计算普通 layers
  let currentX = startX;
  network.layers.forEach(layer => {
    // 现有逻辑
    currentX += layerWidth + layerGap;
  });

  // 2. 计算 blocks（作为整体插入）
  network.blocks.forEach(block => {
    const blockLayout = calculateBlockLayout(block, currentX);
    layout.blocks.push(blockLayout);
    currentX += blockLayout.width + layerGap;
  });

  // 3. 计算 layers_after_blocks
  network.layersAfterBlocks.forEach(layer => {
    // 现有逻辑
  });

  // 4. 计算连接
  // layers → first block → blocks → last block → layersAfterBlocks
  layout.connections = calculateBlockConnections(layout);
}
```

---

## 4. SVG 生成器设计

### 4.1 新增元素

**Block 容器框：**
- 虚线边框（stroke-dasharray）
- 圆角矩形
- 标题居中：`BlockName` 或 `BlockName ×N`
- 背景色区分类型

**连线类型：**
- `fork`：单点分叉到多分支
- `merge`：多分支汇聚到单点
- `skip_arc`：弧形跳线
- `skip_parallel`：直线跳线
- `stack_loop`：循环箭头

### 4.2 颜色配置

```javascript
const COLORS = {
  // 现有颜色...
  block_residual: { fill: '#e8f0f8', stroke: '#5990d9' },
  block_parallel: { fill: '#e8f8f0', stroke: '#59d9b5' },
  block_stack:    { fill: '#f8f8e8', stroke: '#d9b559' }
};
```

### 4.3 样式参数

```javascript
const SVG_CONFIG = {
  // 现有参数...
  blockPadding: 27,       // block 内边距
  blockTitleGap: 18,      // 标题与内容间距
  branchGap: 27,          // 分支间距
  arcRadius: 40,          // 跳线弧线半径
  stackLoopGap: 36,       // stack 循环间距
  repeatMarkerSize: 18    // ×N 标注字号
};
```

### 4.4 SVG 路径示例

**Parallel 分叉：**

```svg
<!-- 从输入分叉到各分支 -->
<path d="M{x_in} {y_in} L{x_in} {y_mid}" stroke="#999" />
<path d="M{x_in} {y_mid} L{x1} {y_mid} L{x1} {y1}" stroke="#999" marker-end="url(#arrowhead)" />
<path d="M{x_in} {y_mid} L{x2} {y_mid} L{x2} {y2}" stroke="#999" marker-end="url(#arrowhead)" />
<path d="M{x_in} {y_mid} L{x3} {y_mid} L{x3} {y3}" stroke="#999" marker-end="url(#arrowhead)" />
```

**Residual arc 跳线：**

```svg
<path d="M{x_start} {y_top}
         C{x_start} {y_arc},
          {x_end} {y_arc},
          {x_end} {y_top}"
         stroke="#999" fill="none" marker-end="url(#arrowhead)" />
```

---

## 5. 解析器扩展

### 5.1 normalizeBlock 增强

```javascript
function normalizeBlock(block) {
  return {
    name: block.name,
    type: block.type,
    style: block.style || 'arc',
    expand: block.expand || false,
    main: block.main ? block.main.map(normalizeLayer) : [],
    skip: block.skip,
    branches: block.branches ? block.branches.map(b => {
      return Array.isArray(b) ? b.map(normalizeLayer) : normalizeLayer(b);
    }) : [],
    layers: block.layers ? block.layers.map(normalizeLayer) : [],
    merge: block.merge || null,
    repeat: block.repeat || 1,
    act: block.act || null,
    norm: block.norm || null
  };
}
```

### 5.2 Block 内部 id 验证

```javascript
// 在 parseNetworkYaml 中添加
for (const block of network.blocks) {
  const blockLayerIds = new Set();

  const validateLayerId = (layer) => {
    if (blockLayerIds.has(layer.id)) {
      throw new Error(`Block "${block.name}" 内部层 id 重复: "${layer.id}"`);
    }
    blockLayerIds.add(layer.id);
  };

  block.main.forEach(validateLayerId);
  block.branches.flat().forEach(validateLayerId);
  block.layers.forEach(validateLayerId);
}
```

---

## 6. 边界情况处理

| 情况 | 处理方式 |
|------|---------|
| 空 block（main=[]） | 抛出错误 "Block 的 main/branches/layers 不能为空" |
| 单分支 parallel | 视为普通层序列，不渲染分叉/汇聚 |
| 嵌套 block（stack 内含 parallel） | 递归渲染，最深 3 层 |
| block 间连接 | 顺序箭头连接 |
| block 与 section 混合 | blocks 紧接 sections 后，独立渲染 |

---

## 7. 测试计划

### 7.1 单元测试

**parser.js：**
- style/expand 属性解析及默认值
- block 内部 id 重复检测
- 嵌套 block 解析

**layout.js：**
- parallel/residual/stack block 坐标计算
- block 连接坐标计算
- block 与 layers 混合布局

**svg-generator.js：**
- block 容器框渲染
- 各类连线 SVG 输出
- 颜色/样式正确应用

### 7.2 集成测试

- ResNet18 模板渲染（两种 style）
- Transformer 模板渲染（stack + parallel）
- 手写 Inception 模块（验证扩展性）

---

## 8. 实现顺序

```
Phase 1: Parser 扩展
  ├── normalizeBlock 添加 style/expand
  ├── block 内部 id 验证
  ├── 更新模板 YAML
  └── 添加测试用例

Phase 2: Layout 扩展
  ├── calculateBlockLayout 函数
  ├── parallel/residual/stack 坐标计算
  ├── block 连接计算
  └── 添加测试用例

Phase 3: SVG Generator 扩展
  ├── generateBlock 函数
  ├── generateBlockConnection 函数
  ├── 新增颜色/样式配置
  └── 添加测试用例

Phase 4: 集成验证
  ├── 运行所有模板渲染
  ├── 手动检查 SVG 输出
  └── 更新 README
```

---

## 9. 文件修改清单

| 文件 | 修改内容 |
|------|---------|
| `src/parser.js` | normalizeBlock 增强，id 验证 |
| `src/layout.js` | calculateBlockLayout，block 连接计算 |
| `src/svg-generator.js` | generateBlock，block 连线，颜色配置 |
| `src/templates.js` | ResNet/Transformer 添加 style/expand |
| `tests/test-parser.js` | 新增 block 属性解析测试 |
| `tests/test-layout.js` | 新增 block 坐标计算测试 |
| `tests/test-svg.js` | 新增 block 渲染测试 |
| `README.md` | 更新 YAML 格式说明，添加 block 示例 |

---

## 10. 后续扩展方向

本次设计完成后，可进一步扩展：

1. **Inception 模块：** 多尺度并行卷积（1x1, 3x3, 5x5, pool）
2. **DenseNet block：** 多输入密集连接
3. **自定义 merge 层：** 在 merge 点渲染具体层（如 Add 层）
4. **block 引用：** 在多处复用同一个 block 定义