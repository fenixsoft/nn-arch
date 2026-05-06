# Blocks Rendering Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement visualization for residual/parallel/stack blocks, enabling ResNet and Transformer architecture diagrams.

**Architecture:** Extend existing parser/layout/svg-generator with block-specific coordinate calculations and rendering functions. Blocks are inserted as visual units between `layers` and `layers_after_blocks`.

**Tech Stack:** JavaScript (ES5 compatible), js-yaml, SVG generation

---

## File Structure

| File | Purpose | Changes |
|------|---------|---------|
| `src/parser.js` | YAML parsing | Add `style`, `expand` attributes; block id validation |
| `src/layout.js` | Coordinate calculation | Add `calculateBlockLayout`, block connection coordinates |
| `src/svg-generator.js` | SVG rendering | Add `generateBlock`, `generateBlockConnection`, block colors |
| `src/templates.js` | Preset templates | Update ResNet/Transformer with new attributes |
| `tests/test-parser.js` | Parser tests | Add style/expand/id validation tests |
| `tests/test-layout.js` | Layout tests | Add block coordinate tests |
| `tests/test-svg.js` | SVG tests | Add block rendering tests |

---

## Phase 1: Parser Extension

### Task 1: Add style and expand attributes to normalizeBlock

**Files:**
- Modify: `src/parser.js:142-159`
- Test: `tests/test-parser.js`

- [ ] **Step 1: Write failing test for style attribute**

```javascript
// Add to tests/test-parser.js

test('解析残差块 style 属性', function() {
  const yaml = `
blocks:
  - name: ResBlock1
    type: residual
    style: parallel
    main:
      - {name: conv1, type: conv, kernel: 3, channels: 64}
    skip: identity
    merge: add
`;
  const result = parseNetworkYaml(yaml);
  const block = result.blocks[0];
  assertEqual(block.style, 'parallel', 'block style');
});

test('残差块 style 默认值', function() {
  const yaml = `
blocks:
  - name: ResBlock1
    type: residual
    main:
      - {name: conv1, type: conv, kernel: 3, channels: 64}
    skip: identity
    merge: add
`;
  const result = parseNetworkYaml(yaml);
  const block = result.blocks[0];
  assertEqual(block.style, 'arc', '默认 style 为 arc');
});

test('解析 stack block expand 属性', function() {
  const yaml = `
blocks:
  - name: EncoderBlock
    type: stack
    repeat: 6
    expand: true
    layers:
      - {name: FF1, type: fc, size: 2048}
`;
  const result = parseNetworkYaml(yaml);
  const block = result.blocks[0];
  assertEqual(block.expand, true, 'block expand');
});

test('stack block expand 默认值', function() {
  const yaml = `
blocks:
  - name: EncoderBlock
    type: stack
    repeat: 6
    layers:
      - {name: FF1, type: fc, size: 2048}
`;
  const result = parseNetworkYaml(yaml);
  const block = result.blocks[0];
  assertEqual(block.expand, false, '默认 expand 为 false');
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test-runner.js`
Expected: 4 new tests fail with "block.style undefined" or similar

- [ ] **Step 3: Implement style and expand in normalizeBlock**

```javascript
// Modify src/parser.js normalizeBlock function (lines 142-159)

function normalizeBlock(block) {
  return {
    name: block.name,
    type: block.type,
    style: block.style || 'arc',           // 新增：默认 arc
    expand: block.expand || false,         // 新增：默认 false
    main: block.main ? block.main.map(layer => normalizeLayer(layer)) : [],
    skip: block.skip,
    branches: block.branches ? block.branches.map(branch => {
      if (Array.isArray(branch)) {
        return branch.map(layer => normalizeLayer(layer));
      }
      return normalizeLayer(branch);
    }) : [],
    layers: block.layers ? block.layers.map(layer => normalizeLayer(layer)) : [],
    merge: block.merge || null,
    repeat: block.repeat || 1,
    act: block.act || null,
    norm: block.norm || null
  };
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `node tests/test-runner.js`
Expected: All 4 new tests pass

- [ ] **Step 5: Commit**

```bash
git add src/parser.js tests/test-parser.js
git commit -m "feat(parser): add style and expand attributes to block definitions

- Add style attribute for residual blocks (arc/parallel, default arc)
- Add expand attribute for stack blocks (true/false, default false)
- Add test cases for new attributes and defaults

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Add block internal id validation

**Files:**
- Modify: `src/parser.js:48-66`
- Test: `tests/test-parser.js`

- [ ] **Step 1: Write failing test for block id duplication**

```javascript
// Add to tests/test-parser.js

test('block 内部层 id 重复时报错', function() {
  const yaml = `
blocks:
  - name: TestBlock
    type: residual
    main:
      - {id: dup_id, name: conv1, type: conv, kernel: 3, channels: 64}
      - {id: dup_id, name: conv2, type: conv, kernel: 3, channels: 64}
    skip: identity
    merge: add
`;
  try {
    parseNetworkYaml(yaml);
    throw new Error('应该抛出异常但没有');
  } catch (e) {
    if (!e.message.includes('内部层 id 重复')) {
      throw new Error('错误信息应包含内部层 id 重复: ' + e.message);
    }
  }
});

test('block 内部不同路径 id 不重复时正常解析', function() {
  const yaml = `
blocks:
  - name: TestBlock
    type: residual
    main:
      - {id: main1, name: conv1, type: conv, kernel: 3, channels: 64}
      - {id: main2, name: conv2, type: conv, kernel: 3, channels: 64}
    skip: identity
    merge: add
`;
  const result = parseNetworkYaml(yaml);
  assertEqual(result.blocks[0].main[0].id, 'main1', 'main 第一个层 id');
  assertEqual(result.blocks[0].main[1].id, 'main2', 'main 第二个层 id');
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test-runner.js`
Expected: First test fails (no validation in parser)

- [ ] **Step 3: Implement block id validation in parseNetworkYaml**

```javascript
// Add after line 65 in src/parser.js (after global layer id validation)

// 验证 block 内部层 id 唯一性
for (const block of network.blocks) {
  const blockLayerIds = new Set();

  const validateBlockLayerId = (layer) => {
    if (!layer || !layer.id) return;
    if (blockLayerIds.has(layer.id)) {
      throw new Error(`Block "${block.name}" 内部层 id 重复: "${layer.id}"`);
    }
    blockLayerIds.add(layer.id);
  };

  // 验证 main 路径
  block.main.forEach(validateBlockLayerId);

  // 验证 branches
  if (block.branches) {
    block.branches.forEach(branch => {
      if (Array.isArray(branch)) {
        branch.forEach(validateBlockLayerId);
      } else {
        validateBlockLayerId(branch);
      }
    });
  }

  // 验证 stack layers
  block.layers.forEach(validateBlockLayerId);
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `node tests/test-runner.js`
Expected: Both new tests pass

- [ ] **Step 5: Commit**

```bash
git add src/parser.js tests/test-parser.js
git commit -m "feat(parser): validate block internal layer id uniqueness

- Add validation loop for block.main, block.branches, block.layers
- Throw descriptive error when duplicate id found in block
- Add test cases for validation

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Add empty block validation

**Files:**
- Modify: `src/parser.js` (add after block id validation)
- Test: `tests/test-parser.js`

- [ ] **Step 1: Write failing test for empty block**

```javascript
// Add to tests/test-parser.js

test('block main 为空时报错', function() {
  const yaml = `
blocks:
  - name: EmptyBlock
    type: residual
    main: []
    skip: identity
    merge: add
`;
  try {
    parseNetworkYaml(yaml);
    throw new Error('应该抛出异常但没有');
  } catch (e) {
    if (!e.message.includes('不能为空')) {
      throw new Error('错误信息应包含不能为空: ' + e.message);
    }
  }
});

test('block branches 为空时报错', function() {
  const yaml = `
blocks:
  - name: EmptyBlock
    type: parallel
    branches: []
    merge: concat
`;
  try {
    parseNetworkYaml(yaml);
    throw new Error('应该抛出异常但没有');
  } catch (e) {
    if (!e.message.includes('不能为空')) {
      throw new Error('错误信息应包含不能为空: ' + e.message);
    }
  }
});

test('block layers 为空时报错', function() {
  const yaml = `
blocks:
  - name: EmptyBlock
    type: stack
    repeat: 6
    layers: []
`;
  try {
    parseNetworkYaml(yaml);
    throw new Error('应该抛出异常但没有');
  } catch (e) {
    if (!e.message.includes('不能为空')) {
      throw new Error('错误信息应包含不能为空: ' + e.message);
    }
  }
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test-runner.js`
Expected: All 3 new tests fail

- [ ] **Step 3: Implement empty block validation**

```javascript
// Add after block id validation in src/parser.js

// 验证 block 不能为空
for (const block of network.blocks) {
  if (block.type === 'residual' && (!block.main || block.main.length === 0)) {
    throw new Error(`Block "${block.name}" 的 main 不能为空`);
  }
  if (block.type === 'parallel' && (!block.branches || block.branches.length === 0)) {
    throw new Error(`Block "${block.name}" 的 branches 不能为空`);
  }
  if (block.type === 'stack' && (!block.layers || block.layers.length === 0)) {
    throw new Error(`Block "${block.name}" 的 layers 不能为空`);
  }
}
```

- [ ] **Step 4: Run test to verify pass**

Run: `node tests/test-runner.js`
Expected: All 3 new tests pass

- [ ] **Step 5: Commit**

```bash
git add src/parser.js tests/test-parser.js
git commit -m "feat(parser): validate block content is not empty

- Add validation for empty main, branches, layers
- Throw descriptive error with block name
- Add test cases for all three block types

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Update templates with new attributes

**Files:**
- Modify: `src/templates.js:73-105` (ResNet18)
- Modify: `src/templates.js:108-145` (Transformer)

- [ ] **Step 1: Write test for template YAML parsing**

```javascript
// Add to tests/test-parser.js

test('ResNet18 模板包含 style 属性', function() {
  const resnetYaml = getTemplate('resnet18');
  const result = parseNetworkYaml(resnetYaml);
  assertEqual(result.blocks.length, 2, 'ResNet18 blocks 数量');
  // 第一块默认 arc，第二块显式 parallel
  assertEqual(result.blocks[0].style, 'arc', 'ResBlock1 style 默认 arc');
  assertEqual(result.blocks[1].style, 'parallel', 'ResBlock2 style');
});

test('Transformer 模板包含 expand 属性', function() {
  const transformerYaml = getTemplate('transformer');
  const result = parseNetworkYaml(transformerYaml);
  assertEqual(result.blocks.length, 1, 'Transformer blocks 数量');
  assertEqual(result.blocks[0].expand, false, 'expand 默认 false');
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test-runner.js`
Expected: Tests fail (templates don't have style/expand yet)

- [ ] **Step 3: Update ResNet18 template**

```javascript
// Modify src/templates.js resnet18 template (lines 73-105)

resnet18: {
  name: 'ResNet18',
  template: `name: ResNet18
layout: horizontal

layers:
  - {id: input, name: Input, type: input, size: "224x224x3"}
  - {id: conv1, name: Conv1, type: conv, kernel: 7, stride: 2, channels: 64, out: "56x56x64", act: ReLU}
  - {id: pool1, name: Pool1, type: pool, kernel: 3, stride: 2, out: "28x28x64"}

blocks:
  - name: ResBlock1
    type: residual
    main:
      - {id: rb1_conv1, name: conv1, type: conv, kernel: 3, channels: 64, act: ReLU}
      - {id: rb1_conv2, name: conv2, type: conv, kernel: 3, channels: 64}
    skip: identity
    merge: add
    act: ReLU

  - name: ResBlock2
    type: residual
    style: parallel
    main:
      - {id: rb2_conv1, name: conv1, type: conv, kernel: 3, channels: 64, act: ReLU}
      - {id: rb2_conv2, name: conv2, type: conv, kernel: 3, channels: 64}
    skip: identity
    merge: add
    act: ReLU

layers_after_blocks:
  - {id: globalpool, name: GlobalPool, type: pool, kernel: global, out: "1x1x512"}
  - {id: fc, name: FC, type: fc, size: 1000}
  - {id: output, name: Output, type: output, size: 1000, act: Softmax}`
},
```

- [ ] **Step 4: Update Transformer template**

```javascript
// Modify src/templates.js transformer template (lines 108-145)

transformer: {
  name: 'Transformer Encoder',
  template: `name: Transformer Encoder
layout: horizontal

layers:
  - {id: input, name: Input, type: input, size: "512 tokens"}
  - {id: embedding, name: Embedding, type: embedding, size: 512}

blocks:
  - name: EncoderBlock
    type: stack
    repeat: 6
    layers:
      - name: MultiHeadAttention
        type: parallel
        branches:
          - {id: q, name: Q, type: fc, size: 64}
          - {id: k, name: K, type: fc, size: 64}
          - {id: v, name: V, type: fc, size: 64}
        merge: concat
      - {id: attnout, name: AttnOut, type: fc, size: 512}
      - name: AddNorm1
        type: residual
        skip: identity
        merge: add
        norm: layer
      - {id: ff1, name: FF1, type: fc, size: 2048, act: ReLU}
      - {id: ff2, name: FF2, type: fc, size: 512}
      - name: AddNorm2
        type: residual
        skip: identity
        merge: add
        norm: layer

layers_after_blocks:
  - {id: output, name: Output, type: output, size: 10000}`
},
```

- [ ] **Step 5: Run test to verify pass**

Run: `node tests/test-runner.js`
Expected: All tests pass (including existing template tests)

- [ ] **Step 6: Commit**

```bash
git add src/templates.js tests/test-parser.js
git commit -m "feat(templates): add style/expand attributes to ResNet and Transformer

- ResNet18: ResBlock1 uses default arc, ResBlock2 uses parallel
- Transformer: stack block uses default expand=false
- Add test cases for template attribute parsing

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 2: Layout Extension

### Task 5: Add block layout constants to LAYOUT_CONFIG

**Files:**
- Modify: `src/layout.js:7-25`
- Test: `tests/test-layout.js`

- [ ] **Step 1: Write test for layout config constants**

```javascript
// Add to tests/test-layout.js

test('LAYOUT_CONFIG 包含 block 相关参数', function() {
  assertEqual(LAYOUT_CONFIG.blockPadding, 27, 'blockPadding');
  assertEqual(LAYOUT_CONFIG.blockTitleGap, 18, 'blockTitleGap');
  assertEqual(LAYOUT_CONFIG.branchGap, 27, 'branchGap');
  assertEqual(LAYOUT_CONFIG.arcRadius, 40, 'arcRadius');
  assertEqual(LAYOUT_CONFIG.stackLoopGap, 36, 'stackLoopGap');
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test-runner.js`
Expected: Test fails (constants not defined)

- [ ] **Step 3: Add block constants to LAYOUT_CONFIG**

```javascript
// Modify src/layout.js LAYOUT_CONFIG (lines 7-25)

const LAYOUT_CONFIG = {
  layerWidth: 216,
  layerHeight: 126,
  layerGap: 27,
  arrowLength: 27,
  sectionPadding: 27,
  fontSizeName: 25.2,
  fontSizeDetail: 21.6,
  fontSizeTitle: 36,
  fontSizeSection: 25.2,
  titleGap: 18,
  sectionTitleGap: 5,
  rowGap: 87,
  rowWrapGap: 20,
  startX: 63,
  startY: 81,
  bottomPadding: 6,
  maxLayersPerRow: 6,
  // Block layout constants (新增)
  blockPadding: 27,         // block 内边距
  blockTitleGap: 18,        // block 标题与内容间距
  branchGap: 27,            // 并行分支间距
  arcRadius: 40,            // 跳线弧线半径
  stackLoopGap: 36          // stack 循环间距
};
```

- [ ] **Step 4: Run test to verify pass**

Run: `node tests/test-runner.js`
Expected: Test passes

- [ ] **Step 5: Commit**

```bash
git add src/layout.js tests/test-layout.js
git commit -m "feat(layout): add block layout constants

- Add blockPadding, blockTitleGap, branchGap, arcRadius, stackLoopGap
- Add test for config constants

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: Implement calculateBlockLayout function

**Files:**
- Modify: `src/layout.js` (add new function after calculateLayout)
- Test: `tests/test-layout.js`

- [ ] **Step 1: Write failing test for parallel block layout**

```javascript
// Add to tests/test-layout.js

test('计算 parallel block 布局', function() {
  const block = {
    name: 'MultiHead',
    type: 'parallel',
    branches: [
      {id: 'q', name: 'Q', type: 'fc', size: 64},
      {id: 'k', name: 'K', type: 'fc', size: 64},
      {id: 'v', name: 'V', type: 'fc', size: 64}
    ],
    merge: 'concat'
  };

  const blockLayout = calculateBlockLayout(block, 100, 50);
  assertEqual(blockLayout.name, 'MultiHead', 'block name');
  assertEqual(blockLayout.type, 'parallel', 'block type');
  assertEqual(blockLayout.layers.length, 3, '分支层数量');
  // 第一个分支在顶部
  assertEqual(blockLayout.layers[0].name, 'Q', '第一个分支名称');
  // 检查容器尺寸
  assertEqual(blockLayout.width > 0, true, '容器宽度');
  assertEqual(blockLayout.height > 0, true, '容器高度');
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test-runner.js`
Expected: Test fails (calculateBlockLayout not defined)

- [ ] **Step 3: Implement calculateBlockLayout for parallel**

```javascript
// Add to src/layout.js after calculateConnections function

/**
 * 计算单个 block 的布局
 * @param {object} block - block 定义
 * @param {number} startX - block 容器起始 X 坐标
 * @param {number} startY - block 容器起始 Y 坐标
 * @returns {object} block 布局结果
 */
function calculateBlockLayout(block, startX, startY) {
  const layout = {
    name: block.name,
    type: block.type,
    style: block.style || 'arc',
    expand: block.expand || false,
    repeat: block.repeat || 1,
    merge: block.merge,
    act: block.act,
    norm: block.norm,
    x: startX,
    y: startY,
    width: 0,
    height: 0,
    titleY: startY + LAYOUT_CONFIG.fontSizeSection + LAYOUT_CONFIG.blockTitleGap,
    layers: [],
    connections: [],
    skipConnection: null,
    forkPoint: null,
    mergePoint: null
  };

  const contentStartY = layout.titleY + LAYOUT_CONFIG.fontSizeSection + LAYOUT_CONFIG.blockTitleGap;
  const layerWidth = LAYOUT_CONFIG.layerWidth;
  const layerHeight = LAYOUT_CONFIG.layerHeight;

  if (block.type === 'parallel') {
    calculateParallelBlockLayout(block, layout, contentStartY, layerWidth, layerHeight);
  } else if (block.type === 'residual') {
    calculateResidualBlockLayout(block, layout, contentStartY, layerWidth, layerHeight);
  } else if (block.type === 'stack') {
    calculateStackBlockLayout(block, layout, contentStartY, layerWidth, layerHeight);
  }

  return layout;
}

/**
 * 计算 parallel block 布局（上下堆叠）
 */
function calculateParallelBlockLayout(block, layout, contentStartY, layerWidth, layerHeight) {
  const branches = block.branches;
  const branchCount = branches.length;

  // 分支上下堆叠
  let currentY = contentStartY;
  branches.forEach((branch, index) => {
    if (Array.isArray(branch)) {
      // 分支是多层序列
      let currentX = layout.x + LAYOUT_CONFIG.blockPadding;
      branch.forEach(layer => {
        layout.layers.push({
          id: layer.id,
          name: layer.name,
          type: layer.type,
          x: currentX,
          y: currentY,
          width: layerWidth,
          height: layerHeight,
          data: layer,
          branchIndex: index
        });
        currentX += layerWidth + LAYOUT_CONFIG.layerGap;
      });
    } else {
      // 分支是单层
      layout.layers.push({
        id: branch.id,
        name: branch.name,
        type: branch.type,
        x: layout.x + LAYOUT_CONFIG.blockPadding,
        y: currentY,
        width: layerWidth,
        height: layerHeight,
        data: branch,
        branchIndex: index
      });
    }
    currentY += layerHeight + LAYOUT_CONFIG.branchGap;
  });

  // 计算容器尺寸
  const maxX = Math.max(...layout.layers.map(l => l.x + l.width)) + LAYOUT_CONFIG.blockPadding;
  const maxY = currentY - LAYOUT_CONFIG.branchGap + LAYOUT_CONFIG.blockPadding;
  layout.width = maxX - layout.x;
  layout.height = maxY - layout.y;

  // 分叉点：block 左侧中心
  layout.forkPoint = {
    x: layout.x + LAYOUT_CONFIG.blockPadding / 2,
    y: contentStartY + layerHeight / 2 + (branchCount - 1) * (layerHeight + LAYOUT_CONFIG.branchGap) / 2
  };

  // 汇聚点：block 右侧中心
  layout.mergePoint = {
    x: layout.x + layout.width - LAYOUT_CONFIG.blockPadding / 2,
    y: layout.forkPoint.y
  };
}

/**
 * 计算 residual block 布局
 */
function calculateResidualBlockLayout(block, layout, contentStartY, layerWidth, layerHeight) {
  const mainLayers = block.main;
  const style = block.style || 'arc';

  if (style === 'arc') {
    // 环绕式：main 路径横向排列
    let currentX = layout.x + LAYOUT_CONFIG.blockPadding;
    mainLayers.forEach(layer => {
      layout.layers.push({
        id: layer.id,
        name: layer.name,
        type: layer.type,
        x: currentX,
        y: contentStartY,
        width: layerWidth,
        height: layerHeight,
        data: layer
      });
      currentX += layerWidth + LAYOUT_CONFIG.layerGap;
    });

    // 跳线弧形环绕
    const arcHeight = layerHeight + LAYOUT_CONFIG.arcRadius * 2;
    layout.skipConnection = {
      type: 'arc',
      startX: layout.x + LAYOUT_CONFIG.blockPadding / 2,
      startY: contentStartY,
      endX: currentX - LAYOUT_CONFIG.layerGap + layerWidth / 2,
      endY: contentStartY,
      arcY: contentStartY - LAYOUT_CONFIG.arcRadius
    };

    layout.width = currentX - LAYOUT_CONFIG.layerGap + LAYOUT_CONFIG.blockPadding - layout.x;
    layout.height = layerHeight + LAYOUT_CONFIG.arcRadius * 2 + LAYOUT_CONFIG.blockPadding * 2;

  } else {
    // 并排式：main 和 skip 上下排列
    let currentX = layout.x + LAYOUT_CONFIG.blockPadding;

    // main 路径
    mainLayers.forEach(layer => {
      layout.layers.push({
        id: layer.id,
        name: layer.name,
        type: layer.type,
        x: currentX,
        y: contentStartY,
        width: layerWidth,
        height: layerHeight,
        data: layer,
        path: 'main'
      });
      currentX += layerWidth + LAYOUT_CONFIG.layerGap;
    });

    // skip 路径（identity 或 projection）
    const skipY = contentStartY + layerHeight + LAYOUT_CONFIG.branchGap;
    layout.layers.push({
      id: 'skip_' + block.name,
      name: block.skip,
      type: 'identity',
      x: layout.x + LAYOUT_CONFIG.blockPadding,
      y: skipY,
      width: currentX - layout.x - LAYOUT_CONFIG.blockPadding - LAYOUT_CONFIG.layerGap,
      height: layerHeight,
      data: { type: 'identity', name: block.skip },
      path: 'skip'
    });

    layout.width = currentX - LAYOUT_CONFIG.layerGap + LAYOUT_CONFIG.blockPadding - layout.x;
    layout.height = skipY + layerHeight + LAYOUT_CONFIG.blockPadding - layout.y;

    layout.skipConnection = {
      type: 'parallel',
      startX: layout.x + LAYOUT_CONFIG.blockPadding,
      startY: skipY,
      endX: currentX - LAYOUT_CONFIG.layerGap,
      endY: skipY
    };
  }

  // 汇聚点
  layout.mergePoint = {
    x: layout.x + layout.width - LAYOUT_CONFIG.blockPadding / 2,
    y: contentStartY + layerHeight / 2
  };
}

/**
 * 计算 stack block 布局
 */
function calculateStackBlockLayout(block, layout, contentStartY, layerWidth, layerHeight) {
  const internalLayers = block.layers;
  const repeatCount = block.repeat;
  const expand = block.expand || false;

  if (!expand) {
    // 仅展开一次，标注 ×N
    let currentX = layout.x + LAYOUT_CONFIG.blockPadding;
    internalLayers.forEach(layer => {
      layout.layers.push({
        id: layer.id,
        name: layer.name,
        type: layer.type,
        x: currentX,
        y: contentStartY,
        width: layerWidth,
        height: layerHeight,
        data: layer
      });
      currentX += layerWidth + LAYOUT_CONFIG.layerGap;
    });

    layout.repeatMarker = {
      text: `×${repeatCount}`,
      x: currentX - LAYOUT_CONFIG.layerGap + 10,
      y: contentStartY + layerHeight / 2
    };

    layout.width = currentX - LAYOUT_CONFIG.layerGap + LAYOUT_CONFIG.blockPadding - layout.x;
    layout.height = layerHeight + LAYOUT_CONFIG.blockPadding * 2;

  } else {
    // 全部展开
    let currentY = contentStartY;
    for (let i = 0; i < repeatCount; i++) {
      let currentX = layout.x + LAYOUT_CONFIG.blockPadding;
      internalLayers.forEach(layer => {
        layout.layers.push({
          id: layer.id + '_' + i,
          name: layer.name,
          type: layer.type,
          x: currentX,
          y: currentY,
          width: layerWidth,
          height: layerHeight,
          data: layer,
          repeatIndex: i
        });
        currentX += layerWidth + LAYOUT_CONFIG.layerGap;
      });
      currentY += layerHeight + LAYOUT_CONFIG.stackLoopGap;
    }

    layout.width = Math.max(...layout.layers.map(l => l.x + l.width)) + LAYOUT_CONFIG.blockPadding - layout.x;
    layout.height = currentY - LAYOUT_CONFIG.stackLoopGap + LAYOUT_CONFIG.blockPadding - layout.y;
  }
}
```

- [ ] **Step 4: Update exports in layout.js**

```javascript
// Modify src/layout.js exports at the end

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateLayout,
    calculateBlockLayout,
    calculateParallelBlockLayout,
    calculateResidualBlockLayout,
    calculateStackBlockLayout,
    LAYOUT_CONFIG
  };
}
```

- [ ] **Step 5: Update test-runner.js to export new functions**

```javascript
// Modify tests/test-runner.js after loading layout.js

globalThis.calculateBlockLayout = layout.calculateBlockLayout;
```

- [ ] **Step 6: Run test to verify pass**

Run: `node tests/test-runner.js`
Expected: Parallel block layout test passes

- [ ] **Step 7: Write test for residual block layout**

```javascript
// Add to tests/test-layout.js

test('计算 residual block 布局（arc style）', function() {
  const block = {
    name: 'ResBlock',
    type: 'residual',
    style: 'arc',
    main: [
      {id: 'conv1', name: 'conv1', type: 'conv', kernel: 3, channels: 64},
      {id: 'conv2', name: 'conv2', type: 'conv', kernel: 3, channels: 64}
    ],
    skip: 'identity',
    merge: 'add'
  };

  const blockLayout = calculateBlockLayout(block, 100, 50);
  assertEqual(blockLayout.style, 'arc', 'block style');
  assertEqual(blockLayout.layers.length, 2, 'main 层数量');
  assertEqual(blockLayout.skipConnection.type, 'arc', 'skip connection type');
});

test('计算 residual block 布局（parallel style）', function() {
  const block = {
    name: 'ResBlock',
    type: 'residual',
    style: 'parallel',
    main: [
      {id: 'conv1', name: 'conv1', type: 'conv', kernel: 3, channels: 64}
    ],
    skip: 'identity',
    merge: 'add'
  };

  const blockLayout = calculateBlockLayout(block, 100, 50);
  assertEqual(blockLayout.style, 'parallel', 'block style');
  // main + skip 层
  assertEqual(blockLayout.layers.length, 2, 'main + skip 层数量');
  assertEqual(blockLayout.skipConnection.type, 'parallel', 'skip connection type');
});
```

- [ ] **Step 8: Run test to verify pass**

Run: `node tests/test-runner.js`
Expected: Residual block tests pass

- [ ] **Step 9: Write test for stack block layout**

```javascript
// Add to tests/test-layout.js

test('计算 stack block 布局（expand false）', function() {
  const block = {
    name: 'EncoderBlock',
    type: 'stack',
    repeat: 6,
    expand: false,
    layers: [
      {id: 'ff1', name: 'FF1', type: 'fc', size: 2048},
      {id: 'ff2', name: 'FF2', type: 'fc', size: 512}
    ]
  };

  const blockLayout = calculateBlockLayout(block, 100, 50);
  assertEqual(blockLayout.expand, false, 'expand 属性');
  assertEqual(blockLayout.layers.length, 2, '仅展开一次，2层');
  assertEqual(blockLayout.repeatMarker.text, '×6', 'repeat marker');
});

test('计算 stack block 布局（expand true）', function() {
  const block = {
    name: 'EncoderBlock',
    type: 'stack',
    repeat: 3,
    expand: true,
    layers: [
      {id: 'ff1', name: 'FF1', type: 'fc', size: 2048}
    ]
  };

  const blockLayout = calculateBlockLayout(block, 100, 50);
  assertEqual(blockLayout.expand, true, 'expand 属性');
  assertEqual(blockLayout.layers.length, 3, '展开 3 次，共 3 层');
});
```

- [ ] **Step 10: Run test to verify pass**

Run: `node tests/test-runner.js`
Expected: Stack block tests pass

- [ ] **Step 11: Commit**

```bash
git add src/layout.js tests/test-layout.js tests/test-runner.js
git commit -m "feat(layout): implement block layout calculation

- Add calculateBlockLayout, calculateParallelBlockLayout
- Add calculateResidualBlockLayout (arc/parallel styles)
- Add calculateStackBlockLayout (expand true/false)
- Add LAYOUT_CONFIG block constants
- Add comprehensive test cases

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 7: Integrate blocks into calculateLayout

**Files:**
- Modify: `src/layout.js:32-95`
- Test: `tests/test-layout.js`

- [ ] **Step 1: Write test for full network with blocks**

```javascript
// Add to tests/test-layout.js

test('计算含 blocks 的完整网络布局', function() {
  const network = {
    name: 'ResNetMini',
    layout: 'horizontal',
    layers: [
      {id: 'input', name: 'Input', type: 'input', size: '224x224x3'},
      {id: 'conv1', name: 'Conv1', type: 'conv', kernel: 7, channels: 64}
    ],
    sections: [],
    blocks: [
      {
        name: 'ResBlock',
        type: 'residual',
        style: 'arc',
        main: [
          {id: 'rb1', name: 'conv', type: 'conv', kernel: 3, channels: 64}
        ],
        skip: 'identity',
        merge: 'add'
      }
    ],
    layersAfterBlocks: [
      {id: 'output', name: 'Output', type: 'output', size: 10}
    ],
    connections: [],
    rowLabels: []
  };

  const layout = calculateLayout(network);
  // layers + block 内部层 + layersAfterBlocks
  assertEqual(layout.layers.length >= 4, true, '总层数量包含 block 内部层');
  assertEqual(layout.blocks.length, 1, 'block 布局数量');
  // block 应在 layers 和 layersAfterBlocks 之间
  const blockX = layout.blocks[0].x;
  const inputLayer = layout.layers.find(l => l.name === 'Input');
  const outputLayer = layout.layers.find(l => l.name === 'Output');
  assertEqual(blockX > inputLayer.x, true, 'block 在 Input 之后');
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test-runner.js`
Expected: Test fails (blocks not integrated in calculateLayout)

- [ ] **Step 3: Modify calculateLayout to integrate blocks**

```javascript
// Modify src/layout.js calculateHorizontalLayout function

function calculateHorizontalLayout(network, layout) {
  let currentX = LAYOUT_CONFIG.startX;
  let currentY = LAYOUT_CONFIG.startY;
  const layerHeight = LAYOUT_CONFIG.layerHeight;
  const layerWidth = LAYOUT_CONFIG.layerWidth;

  // 如果有 sections，按 sections 分行布局
  if (network.sections && network.sections.length > 0) {
    calculateSectionsLayout(network, layout);
    // sections 后继续处理 blocks
    currentX = layout.width - LAYOUT_CONFIG.startX;
    currentY = Math.max(...layout.sections.map(s => s.y + s.height)) + LAYOUT_CONFIG.rowGap;
  }

  // 处理普通 layers（无 sections 时）
  if (!network.sections || network.sections.length === 0) {
    network.layers.forEach((layer, index) => {
      layout.layers.push({
        id: layer.id,
        name: layer.name,
        type: layer.type,
        x: currentX,
        y: currentY,
        width: layerWidth,
        height: layerHeight,
        data: layer
      });
      currentX += layerWidth + LAYOUT_CONFIG.layerGap;
    });
  }

  // 处理 blocks（新增）
  if (network.blocks && network.blocks.length > 0) {
    network.blocks.forEach((block, index) => {
      const blockLayout = calculateBlockLayout(block, currentX, currentY);
      layout.blocks.push(blockLayout);

      // 将 block 内部层加入全局 layers 数组
      blockLayout.layers.forEach(layer => {
        layout.layers.push(layer);
      });

      currentX += blockLayout.width + LAYOUT_CONFIG.layerGap;
    });
  }

  // 处理 layers_after_blocks
  if (network.layersAfterBlocks && network.layersAfterBlocks.length > 0) {
    network.layersAfterBlocks.forEach(layer => {
      layout.layers.push({
        id: layer.id,
        name: layer.name,
        type: layer.type,
        x: currentX,
        y: currentY,
        width: layerWidth,
        height: layerHeight,
        data: layer
      });
      currentX += layerWidth + LAYOUT_CONFIG.layerGap;
    });
  }

  // 计算总尺寸
  const lastLayer = layout.layers[layout.layers.length - 1];
  const lastBlock = layout.blocks[layout.blocks.length - 1];
  let maxX = lastLayer ? lastLayer.x + lastLayer.width : currentX;
  if (lastBlock && lastBlock.x + lastBlock.width > maxX) {
    maxX = lastBlock.x + lastBlock.width;
  }

  let maxY = currentY + layerHeight;
  layout.blocks.forEach(block => {
    if (block.y + block.height > maxY) {
      maxY = block.y + block.height;
    }
  });

  layout.width = maxX + LAYOUT_CONFIG.startX;
  layout.height = maxY + LAYOUT_CONFIG.bottomPadding;

  // 计算标题位置
  layout.title.x = layout.width / 2;
  layout.title.y = LAYOUT_CONFIG.fontSizeTitle + LAYOUT_CONFIG.titleGap;

  // 计算连接（包含 block 连接）
  layout.connections = calculateConnections(layout.layers);
  layout.blockConnections = calculateBlockConnections(layout, network);
}
```

- [ ] **Step 4: Add calculateBlockConnections function**

```javascript
// Add to src/layout.js

/**
 * 计算 block 与外部层的连接
 * @param {object} layout - 布局结果
 * @param {object} network - 网络定义
 * @returns {array} block 连接数组
 */
function calculateBlockConnections(layout, network) {
  const connections = [];

  // layers → first block
  if (network.layers && network.layers.length > 0 && layout.blocks.length > 0) {
    const lastLayerBeforeBlock = network.layers[network.layers.length - 1];
    const lastLayerLayout = layout.layers.find(l => l.id === lastLayerBeforeBlock.id);
    const firstBlock = layout.blocks[0];

    connections.push({
      type: 'block_entry',
      from: lastLayerBeforeBlock.id,
      to: firstBlock.name,
      x1: lastLayerLayout.x + lastLayerLayout.width,
      y1: lastLayerLayout.y + lastLayerLayout.height / 2,
      x2: firstBlock.x,
      y2: firstBlock.y + firstBlock.height / 2
    });
  }

  // blocks → blocks
  for (let i = 0; i < layout.blocks.length - 1; i++) {
    const currentBlock = layout.blocks[i];
    const nextBlock = layout.blocks[i + 1];

    connections.push({
      type: 'block_to_block',
      from: currentBlock.name,
      to: nextBlock.name,
      x1: currentBlock.x + currentBlock.width,
      y1: currentBlock.y + currentBlock.height / 2,
      x2: nextBlock.x,
      y2: nextBlock.y + nextBlock.height / 2
    });
  }

  // last block → layers_after_blocks
  if (layout.blocks.length > 0 && network.layersAfterBlocks && network.layersAfterBlocks.length > 0) {
    const lastBlock = layout.blocks[layout.blocks.length - 1];
    const firstLayerAfter = network.layersAfterBlocks[0];
    const firstLayerLayout = layout.layers.find(l => l.id === firstLayerAfter.id);

    connections.push({
      type: 'block_exit',
      from: lastBlock.name,
      to: firstLayerAfter.id,
      x1: lastBlock.x + lastBlock.width,
      y1: lastBlock.y + lastBlock.height / 2,
      x2: firstLayerLayout.x,
      y2: firstLayerLayout.y + firstLayerLayout.height / 2
    });
  }

  return connections;
}
```

- [ ] **Step 5: Run test to verify pass**

Run: `node tests/test-runner.js`
Expected: Full network with blocks test passes

- [ ] **Step 6: Commit**

```bash
git add src/layout.js tests/test-layout.js
git commit -m "feat(layout): integrate blocks into network layout

- Add blocks processing in calculateHorizontalLayout
- Add calculateBlockConnections for block entry/exit links
- Add block internal layers to global layers array
- Add test for complete network with blocks

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 3: SVG Generator Extension

### Task 8: Add block color constants

**Files:**
- Modify: `src/svg-generator.js:7-19`
- Test: `tests/test-svg.js`

- [ ] **Step 1: Write test for block colors**

```javascript
// Add to tests/test-svg.js

test('COLORS 包含 block 类型颜色', function() {
  assertEqual(COLORS.block_residual.fill, '#e8f0f8', 'residual fill');
  assertEqual(COLORS.block_residual.stroke, '#5990d9', 'residual stroke');
  assertEqual(COLORS.block_parallel.fill, '#e8f8f0', 'parallel fill');
  assertEqual(COLORS.block_parallel.stroke, '#59d9b5', 'parallel stroke');
  assertEqual(COLORS.block_stack.fill, '#f8f8e8', 'stack fill');
  assertEqual(COLORS.block_stack.stroke, '#d9b559', 'stack stroke');
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test-runner.js`
Expected: Test fails (block colors not defined)

- [ ] **Step 3: Add block colors to COLORS**

```javascript
// Modify src/svg-generator.js COLORS (lines 7-19)

const COLORS = {
  input: { fill: '#fff8f0', stroke: '#f0a559' },
  conv: { fill: '#e8f4f8', stroke: '#5ba5d9' },
  pool: { fill: '#f0e8f8', stroke: '#a559f0' },
  fc: { fill: '#e8f8f0', stroke: '#5bd9a5' },
  output: { fill: '#ffe8e8', stroke: '#f5a5a5' },
  embedding: { fill: '#f8f8e8', stroke: '#d9a55b' },
  attention: { fill: '#e8f0f8', stroke: '#5990d9' },
  norm: { fill: '#f8e8f8', stroke: '#d959f0' },
  activation: { fill: '#f8f0e8', stroke: '#d9b559' },
  merge: { fill: '#f0f8e8', stroke: '#59d9b5' },
  identity: { fill: '#f8f8f8', stroke: '#999999' },
  // Block colors (新增)
  block_residual: { fill: '#e8f0f8', stroke: '#5990d9' },
  block_parallel: { fill: '#e8f8f0', stroke: '#59d9b5' },
  block_stack: { fill: '#f8f8e8', stroke: '#d9b559' }
};
```

- [ ] **Step 4: Run test to verify pass**

Run: `node tests/test-runner.js`
Expected: Test passes

- [ ] **Step 5: Commit**

```bash
git add src/svg-generator.js tests/test-svg.js
git commit -m "feat(svg): add block type colors

- Add block_residual, block_parallel, block_stack colors
- Add test for block colors

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 9: Implement generateBlock function

**Files:**
- Modify: `src/svg-generator.js` (add new function)
- Modify: `src/svg-generator.js:44-95` (integrate into generateSvg)
- Test: `tests/test-svg.js`

- [ ] **Step 1: Write failing test for generateBlock**

```javascript
// Add to tests/test-svg.js

test('生成 parallel block SVG', function() {
  const blockLayout = {
    name: 'MultiHead',
    type: 'parallel',
    x: 100,
    y: 50,
    width: 300,
    height: 200,
    titleY: 70,
    layers: [
      {id: 'q', name: 'Q', type: 'fc', x: 120, y: 90, width: 72, height: 42, data: {size: 64}},
      {id: 'k', name: 'K', type: 'fc', x: 120, y: 130, width: 72, height: 42, data: {size: 64}},
      {id: 'v', name: 'V', type: 'fc', x: 120, y: 170, width: 72, height: 42, data: {size: 64}}
    ],
    forkPoint: {x: 110, y: 140},
    mergePoint: {x: 280, y: 140}
  };

  const svg = generateBlock(blockLayout);
  assertEqual(svg.includes('rect'), true, '包含容器矩形');
  assertEqual(svg.includes('MultiHead'), true, '包含 block 名称');
  assertEqual(svg.includes('Q'), true, '包含分支名称');
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test-runner.js`
Expected: Test fails (generateBlock not defined)

- [ ] **Step 3: Implement generateBlock function**

```javascript
// Add to src/svg-generator.js after generateSectionRowConnection

/**
 * 生成 block 容器 SVG
 * @param {object} block - block 布局数据
 * @returns {string} SVG 字符串
 */
function generateBlock(block) {
  const colors = COLORS['block_' + block.type] || COLORS.block_residual;
  const titleY = block.titleY || (block.y + SVG_CONFIG.fontSizeSection);

  // 容器框（虚线边框）
  let svg = `<rect x="${block.x}" y="${block.y}" width="${block.width}" height="${block.height}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="${SVG_CONFIG.strokeWidth}" stroke-dasharray="${9},${9}" rx="${SVG_CONFIG.cornerRadius * 1.25}"/>`;

  // 标题
  const displayName = block.repeat > 1 && !block.expand ? `${block.name} ×${block.repeat}` : block.name;
  svg += `\n<text x="${block.x + block.width / 2}" y="${titleY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeSection}" font-weight="bold" font-family="Arial, sans-serif" fill="${colors.stroke}">${displayName}</text>`;

  // 内部层
  block.layers.forEach(layer => {
    svg += '\n' + generateLayer(layer);
  });

  // 分叉/汇聚连线（parallel block）
  if (block.forkPoint && block.mergePoint && block.type === 'parallel') {
    svg += '\n' + generateParallelConnections(block);
  }

  // 跳线（residual block）
  if (block.skipConnection) {
    svg += '\n' + generateSkipConnection(block.skipConnection);
  }

  // 重复标记（stack block）
  if (block.repeatMarker) {
    svg += `\n<text x="${block.repeatMarker.x}" y="${block.repeatMarker.y}" text-anchor="start" font-size="18" font-family="Arial, sans-serif" fill="#666">${block.repeatMarker.text}</text>`;
  }

  // merge 标注
  if (block.merge) {
    const mergeY = block.y + block.height - SVG_CONFIG.fontSizeDetail;
    svg += `\n<text x="${block.x + block.width / 2}" y="${mergeY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeDetail}" font-family="Arial, sans-serif" fill="#666">[${block.merge}]</text>`;
  }

  return svg;
}

/**
 * 生成 parallel block 分叉/汇聚连线
 */
function generateParallelConnections(block) {
  let svg = '';
  const fork = block.forkPoint;
  const merge = block.mergePoint;

  // 分叉线：从 fork 点到各分支
  block.layers.forEach(layer => {
    svg += `\n<path d="M${fork.x} ${fork.y} L${layer.x} ${fork.y} L${layer.x} ${layer.y + layer.height / 2}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`;
  });

  // 汇聚线：从各分支到 merge 点
  block.layers.forEach(layer => {
    const branchEndX = layer.x + layer.width;
    svg += `\n<path d="M${branchEndX} ${layer.y + layer.height / 2} L${branchEndX} ${merge.y} L${merge.x} ${merge.y}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`;
  });

  return svg;
}

/**
 * 生成 residual block 跳线
 */
function generateSkipConnection(skipConn) {
  if (skipConn.type === 'arc') {
    // 弧形跳线
    return `\n<path d="M${skipConn.startX} ${skipConn.startY} Q${skipConn.startX} ${skipConn.arcY} ${(skipConn.startX + skipConn.endX) / 2} ${skipConn.arcY} Q${skipConn.endX} ${skipConn.arcY} ${skipConn.endX} ${skipConn.endY}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`;
  } else {
    // 直线跳线
    return `\n<path d="M${skipConn.startX} ${skipConn.startY} L${skipConn.endX} ${skipConn.endY}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`;
  }
}
```

- [ ] **Step 4: Update exports in svg-generator.js**

```javascript
// Modify src/svg-generator.js exports

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateSvg,
    generateDefs,
    generateTitle,
    generateSection,
    generateLayer,
    generateLayerContent,
    generateConnection,
    generateRowConnection,
    generateSectionRowConnection,
    generateBlock,
    generateParallelConnections,
    generateSkipConnection,
    generateErrorSvg,
    getDisplayName,
    getLayerDetail,
    COLORS,
    SVG_CONFIG
  };
}
```

- [ ] **Step 5: Update test-runner.js to export generateBlock**

```javascript
// Modify tests/test-runner.js after loading svg-generator.js

globalThis.generateBlock = svgGenerator.generateBlock;
```

- [ ] **Step 6: Run test to verify pass**

Run: `node tests/test-runner.js`
Expected: Parallel block SVG test passes

- [ ] **Step 7: Write tests for residual and stack block SVG**

```javascript
// Add to tests/test-svg.js

test('生成 residual block SVG（arc style）', function() {
  const blockLayout = {
    name: 'ResBlock',
    type: 'residual',
    style: 'arc',
    x: 100,
    y: 50,
    width: 200,
    height: 150,
    titleY: 70,
    layers: [
      {id: 'conv1', name: 'conv1', type: 'conv', x: 120, y: 90, width: 72, height: 42, data: {kernel: 3}}
    ],
    skipConnection: {
      type: 'arc',
      startX: 110,
      startY: 90,
      endX: 200,
      endY: 90,
      arcY: 50
    },
    merge: 'add'
  };

  const svg = generateBlock(blockLayout);
  assertEqual(svg.includes('ResBlock'), true, '包含 block 名称');
  assertEqual(svg.includes('Q'), true, '包含弧形跳线（Q 是贝塞尔曲线指令）');
});

test('生成 stack block SVG（expand false）', function() {
  const blockLayout = {
    name: 'EncoderBlock',
    type: 'stack',
    expand: false,
    repeat: 6,
    x: 100,
    y: 50,
    width: 200,
    height: 100,
    titleY: 70,
    layers: [
      {id: 'ff1', name: 'FF1', type: 'fc', x: 120, y: 90, width: 72, height: 42, data: {size: 512}}
    ],
    repeatMarker: {text: '×6', x: 200, y: 110}
  };

  const svg = generateBlock(blockLayout);
  assertEqual(svg.includes('EncoderBlock ×6'), true, '包含 repeat 标注');
});
```

- [ ] **Step 8: Run test to verify pass**

Run: `node tests/test-runner.js`
Expected: Residual and stack block tests pass

- [ ] **Step 9: Commit**

```bash
git add src/svg-generator.js tests/test-svg.js tests/test-runner.js
git commit -m "feat(svg): implement block SVG generation

- Add generateBlock for block container rendering
- Add generateParallelConnections for fork/merge lines
- Add generateSkipConnection for arc/parallel skip
- Add block title with repeat marker
- Add comprehensive test cases

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 10: Integrate blocks into generateSvg

**Files:**
- Modify: `src/svg-generator.js:44-95`
- Test: `tests/test-svg.js`

- [ ] **Step 1: Write test for full network SVG with blocks**

```javascript
// Add to tests/test-svg.js

test('生成含 blocks 的完整网络 SVG', function() {
  // 先用 parser 解析，再用 layout 计算，最后生成 SVG
  const yaml = `
name: MiniNet
layout: horizontal
layers:
  - {id: input, name: Input, type: input, size: "10"}
blocks:
  - name: ResBlock
    type: residual
    main:
      - {id: conv, name: conv, type: conv, kernel: 3, channels: 64}
    skip: identity
    merge: add
layers_after_blocks:
  - {id: output, name: Output, type: output, size: 10}
`;
  const network = parseNetworkYaml(yaml);
  const layout = calculateLayout(network);
  const svg = generateSvg(layout);

  assertEqual(svg.includes('<svg'), true, 'SVG 开头');
  assertEqual(svg.includes('MiniNet'), true, '包含网络名称');
  assertEqual(svg.includes('Input'), true, '包含 Input 层');
  assertEqual(svg.includes('ResBlock'), true, '包含 block 名称');
  assertEqual(svg.includes('Output'), true, '包含 Output 层');
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test-runner.js`
Expected: Test may fail or pass (depends on existing generateSvg handling)

- [ ] **Step 3: Modify generateSvg to include blocks**

```javascript
// Modify src/svg-generator.js generateSvg function (lines 44-95)

function generateSvg(layout) {
  const svgParts = [];
  const scale = SVG_CONFIG.scale;

  const displayWidth = Math.round(layout.width * scale);
  const displayHeight = Math.round(layout.height * scale);

  svgParts.push(`<svg viewBox="0 0 ${layout.width} ${layout.height}" width="${displayWidth}" height="${displayHeight}" xmlns="http://www.w3.org/2000/svg">`);
  svgParts.push(generateDefs());
  svgParts.push(`<rect width="${layout.width}" height="${layout.height}" fill="#ffffff"/>`);
  svgParts.push(generateTitle(layout.title));

  // sections 区域框
  layout.sections.forEach(section => {
    svgParts.push(generateSection(section));
  });

  // blocks 容器框（新增）
  if (layout.blocks) {
    layout.blocks.forEach(block => {
      svgParts.push(generateBlock(block));
    });
  }

  // 层（排除 block 内部层，因为 generateBlock 已处理）
  layout.layers.forEach(layer => {
    // 如果层属于某个 block，跳过
    const belongsToBlock = layout.blocks && layout.blocks.some(b =>
      b.layers.some(bl => bl.id === layer.id)
    );
    if (!belongsToBlock) {
      svgParts.push(generateLayer(layer));
    }
  });

  // 连接箭头
  layout.connections.forEach(conn => {
    svgParts.push(generateConnection(conn));
  });

  // section 内换行连接
  if (layout.sectionRowConnections) {
    layout.sectionRowConnections.forEach(conn => {
      svgParts.push(generateSectionRowConnection(conn));
    });
  }

  // 行间连接
  layout.rowConnections.forEach(conn => {
    svgParts.push(generateRowConnection(conn));
  });

  // block 外部连接（新增）
  if (layout.blockConnections) {
    layout.blockConnections.forEach(conn => {
      svgParts.push(generateBlockConnection(conn));
    });
  }

  svgParts.push('</svg>');

  return svgParts.join('\n');
}

/**
 * 生成 block 外部连接 SVG
 */
function generateBlockConnection(conn) {
  return `<path d="M${conn.x1} ${conn.y1} L${conn.x2} ${conn.y2}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`;
}
```

- [ ] **Step 4: Update exports**

```javascript
// Add generateBlockConnection to exports

globalThis.generateBlockConnection = svgGenerator.generateBlockConnection;
```

- [ ] **Step 5: Update test-runner.js**

```javascript
// Add to test-runner.js exports

globalThis.generateBlockConnection = svgGenerator.generateBlockConnection;
```

- [ ] **Step 6: Run test to verify pass**

Run: `node tests/test-runner.js`
Expected: Full network with blocks test passes

- [ ] **Step 7: Commit**

```bash
git add src/svg-generator.js tests/test-svg.js tests/test-runner.js
git commit -m "feat(svg): integrate blocks into SVG generation

- Add blocks rendering in generateSvg
- Skip block internal layers (handled by generateBlock)
- Add generateBlockConnection for block entry/exit
- Add test for complete network SVG with blocks

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 4: Integration Testing

### Task 11: Run template rendering tests

**Files:**
- No code changes
- Manual verification

- [ ] **Step 1: Run all tests**

Run: `node tests/test-runner.js`
Expected: All tests pass, no failures

- [ ] **Step 2: Create manual test script**

```javascript
// Create tests/manual-blocks-test.js

const NNArch = require('../src/nn-arch.js');

console.log('=== Testing ResNet18 ===');
const resnetSvg = NNArch.generateFromTemplate('resnet18');
console.log('ResNet18 SVG generated, length:', resnetSvg.length);
console.log('Contains ResBlock:', resnetSvg.includes('ResBlock'));

console.log('\n=== Testing Transformer ===');
const transformerSvg = NNArch.generateFromTemplate('transformer');
console.log('Transformer SVG generated, length:', transformerSvg.length);
console.log('Contains EncoderBlock:', transformerSvg.includes('EncoderBlock'));

console.log('\n=== All templates OK ===');
```

- [ ] **Step 3: Run manual test**

Run: `node tests/manual-blocks-test.js`
Expected: Both templates generate successfully

- [ ] **Step 4: Save sample SVG files for visual inspection**

```bash
node -e "const NNArch = require('./src/nn-arch.js'); const fs = require('fs'); fs.writeFileSync('test-resnet.svg', NNArch.generateFromTemplate('resnet18')); fs.writeFileSync('test-transformer.svg', NNArch.generateFromTemplate('transformer'));"
```

- [ ] **Step 5: Commit**

```bash
git add tests/manual-blocks-test.js
git commit -m "test: add manual blocks rendering test

- Test ResNet18 and Transformer template rendering
- Verify SVG generation succeeds

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 12: Update README documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add block YAML format section**

Update README.md to include block definition examples and attribute documentation (reference the spec document for content).

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README with blocks YAML format

- Add block types section (residual/parallel/stack)
- Document style, expand attributes
- Add example YAML for each block type

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Summary

**Total Tasks:** 12
**Estimated Time:** 4-6 hours for experienced developer

**Phase Breakdown:**
- Phase 1 (Parser): Tasks 1-4, ~1.5 hours
- Phase 2 (Layout): Tasks 5-7, ~2 hours
- Phase 3 (SVG): Tasks 8-10, ~1.5 hours
- Phase 4 (Integration): Tasks 11-12, ~0.5 hours

**Key Files Modified:**
- `src/parser.js` - style/expand attributes, validation
- `src/layout.js` - block layout calculation, integration
- `src/svg-generator.js` - block rendering, colors
- `src/templates.js` - updated YAML definitions
- `tests/*.js` - comprehensive test coverage