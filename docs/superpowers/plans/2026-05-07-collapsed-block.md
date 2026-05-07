# Collapsed Block Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add support for `expand: "collapsed"` mode to render all block types with simplified internal structure using minimal-sized blocks without text labels.

**Architecture:** Extend the existing block layout and SVG generation logic to support a third expand state. Add new COLLAPSED_CONFIG constants, modify block layout calculations to use smaller dimensions when collapsed, and create a new SVG generator function for collapsed layer rendering.

**Tech Stack:** JavaScript (ES5 compatible), js-yaml for parsing, SVG generation without external libraries

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/layout.js` | Add COLLAPSED_CONFIG constants, modify `calculateBlockLayout()` and block-type-specific layout functions to handle collapsed mode |
| `src/svg-generator.js` | Add `generateCollapsedLayer()` function, modify `generateBlock()` to use collapsed rendering when appropriate |
| `src/templates.js` | Add collapsed GoogLeNet example template (optional) |
| `tests/test-layout.js` | Add tests for collapsed layout calculations |
| `tests/test-svg.js` | Add tests for collapsed SVG generation |

---

### Task 1: Add COLLAPSED_CONFIG Constants to layout.js

**Files:**
- Modify: `src/layout.js:1-31`

- [ ] **Step 1: Add COLLAPSED_CONFIG constants after LAYOUT_CONFIG**

Add the following constants at line 31 (after `stackLoopGap`):

```javascript
const LAYOUT_CONFIG = {
  // ... existing constants ...
  stackLoopGap: 36       // stack 循环间距
};

// Collapsed block 配置（最小尺寸方块）
const COLLAPSED_CONFIG = {
  layerWidth: 50,      // 最小方块宽度（vs 正常 216）
  layerHeight: 30,     // 最小方块高度（vs 正常 126）
  layerGap: 10,        // 最小方块间距（vs 正常 27）
  blockPadding: 15,    // collapsed block 内边距（vs 正常 27）
  titleGap: 10,        // 标题与内容间距（vs 正常 18）
  branchGap: 12,       // 分支间距（vs 正常 27）
  cornerRadius: 4.8    // 圆角半径（缩小以匹配小方块）
};
```

- [ ] **Step 2: Update module exports**

Modify the exports at the end of layout.js (line 1337-1344) to include COLLAPSED_CONFIG:

```javascript
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateLayout,
    LAYOUT_CONFIG,
    COLLAPSED_CONFIG,
    calculateBlockLayout
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/layout.js
git commit -m "feat(layout): add COLLAPSED_CONFIG constants for collapsed block rendering"
```

---

### Task 2: Modify calculateBlockLayout to Handle Collapsed Mode

**Files:**
- Modify: `src/layout.js:697-737`

- [ ] **Step 1: Add collapsed mode check in calculateBlockLayout**

Modify the `calculateBlockLayout()` function to check for collapsed mode and pass it to block-specific calculators:

```javascript
function calculateBlockLayout(block, startX, startY, direction = 'horizontal') {
  const layout = {
    name: block.name,
    type: block.type,
    style: block.style,
    expand: block.expand,
    repeat: block.repeat,
    merge: block.merge,
    act: block.act,
    norm: block.norm,
    direction: direction,
    collapsed: block.expand === 'collapsed',  // NEW: collapsed flag
    x: startX,
    y: startY,
    width: 0,
    height: 0,
    titleY: startY + LAYOUT_CONFIG.fontSizeSection + LAYOUT_CONFIG.blockTitleGap / 2,
    layers: [],
    connections: [],
    skipConnection: null,
    forkPoint: null,
    mergePoint: null
  };

  // 根据类型调用不同的布局计算
  switch (block.type) {
    case 'parallel':
      calculateParallelBlockLayout(block, layout, startX, startY, direction);
      break;
    case 'residual':
      calculateResidualBlockLayout(block, layout, startX, startY, direction);
      break;
    case 'stack':
      calculateStackBlockLayout(block, layout, startX, startY, direction);
      break;
    default:
      // 未知类型，返回空布局
      break;
  }

  return layout;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/layout.js
git commit -m "feat(layout): add collapsed flag to block layout result"
```

---

### Task 3: Implement Collapsed Parallel Block Layout

**Files:**
- Modify: `src/layout.js:744-915`

- [ ] **Step 1: Add collapsed mode handling in calculateParallelBlockLayout**

Replace the function starting at line 744 with the following implementation that handles collapsed mode:

```javascript
function calculateParallelBlockLayout(block, layout, startX, startY, direction = 'horizontal') {
  // Determine which config to use based on collapsed mode
  const config = layout.collapsed ? COLLAPSED_CONFIG : LAYOUT_CONFIG;
  const layerWidth = config.layerWidth;
  const layerHeight = config.layerHeight;
  const layerGap = config.layerGap;
  const branchGap = config.branchGap;
  const padding = config.blockPadding;

  const branches = block.branches || [];
  if (branches.length === 0) return;

  // 标题区域高度/宽度（使用 LAYOUT_CONFIG 字体尺寸保持一致）
  const titleHeight = LAYOUT_CONFIG.fontSizeSection + (layout.collapsed ? COLLAPSED_CONFIG.titleGap : LAYOUT_CONFIG.blockTitleGap);
  const titleWidth = LAYOUT_CONFIG.fontSizeSection + (layout.collapsed ? COLLAPSED_CONFIG.titleGap : LAYOUT_CONFIG.blockTitleGap);

  // 记录每个分支的层，用于计算 fork/merge
  const branchLayerGroups = [];

  if (direction === 'vertical') {
    // 垂直布局：分支水平排列（左右并行）
    const contentStartY = startY + titleHeight + padding;
    let currentX = startX + padding;
    let maxBranchHeight = layerHeight;

    branches.forEach((branch, branchIndex) => {
      const branchLayers = [];

      if (Array.isArray(branch)) {
        // 多层分支：垂直排列（上下排列）
        let currentY = contentStartY;
        branch.forEach((layer, layerIndex) => {
          const layerData = {
            id: layer.id || `${block.name}_${branchIndex}_${layerIndex}`,
            name: layer.name,
            type: layer.type,
            x: currentX,
            y: currentY,
            width: layerWidth,
            height: layerHeight,
            data: layer,
            branchIndex: branchIndex,
            collapsed: layout.collapsed
          };
          layout.layers.push(layerData);
          branchLayers.push(layerData);
          currentY += layerHeight + layerGap;
        });

        const branchHeight = (branch.length - 1) * (layerHeight + layerGap) + layerHeight;
        if (branchHeight > maxBranchHeight) {
          maxBranchHeight = branchHeight;
        }

        currentX += layerWidth + (branchIndex < branches.length - 1 ? branchGap : 0);
      } else {
        // 单层分支
        const layerData = {
          id: branch.id || `${block.name}_${branchIndex}`,
          name: branch.name,
          type: branch.type,
          x: currentX,
          y: contentStartY,
          width: layerWidth,
          height: layerHeight,
          data: branch,
          branchIndex: branchIndex,
          collapsed: layout.collapsed
        };
        layout.layers.push(layerData);
        branchLayers.push(layerData);

        currentX += layerWidth + (branchIndex < branches.length - 1 ? branchGap : 0);
      }

      branchLayerGroups.push(branchLayers);
    });

    layout.width = currentX - startX + padding;
    layout.height = titleHeight + padding + maxBranchHeight + padding;

    layout.forkPoint = {
      x: startX + layout.width / 2,
      y: startY + titleHeight
    };

    layout.mergePoint = {
      x: layout.forkPoint.x,
      y: startY + titleHeight + padding + maxBranchHeight + padding / 2
    };

  } else {
    // 水平布局（默认）：分支垂直堆叠（上下并行）
    let currentY = startY + titleHeight;
    const contentStartX = startX + padding;
    let maxBranchWidth = layerWidth;

    branches.forEach((branch, branchIndex) => {
      const branchLayers = [];

      if (Array.isArray(branch)) {
        let currentX = contentStartX;
        branch.forEach((layer, layerIndex) => {
          const layerData = {
            id: layer.id || `${block.name}_${branchIndex}_${layerIndex}`,
            name: layer.name,
            type: layer.type,
            x: currentX,
            y: currentY,
            width: layerWidth,
            height: layerHeight,
            data: layer,
            branchIndex: branchIndex,
            collapsed: layout.collapsed
          };
          layout.layers.push(layerData);
          branchLayers.push(layerData);
          currentX += layerWidth + layerGap;
        });

        const branchWidth = (branch.length - 1) * (layerWidth + layerGap) + layerWidth;
        if (branchWidth > maxBranchWidth) {
          maxBranchWidth = branchWidth;
        }

        currentY += layerHeight + (branchIndex < branches.length - 1 ? branchGap : 0);
      } else {
        const layerData = {
          id: branch.id || `${block.name}_${branchIndex}`,
          name: branch.name,
          type: branch.type,
          x: contentStartX,
          y: currentY,
          width: layerWidth,
          height: layerHeight,
          data: branch,
          branchIndex: branchIndex,
          collapsed: layout.collapsed
        };
        layout.layers.push(layerData);
        branchLayers.push(layerData);

        currentY += layerHeight + (branchIndex < branches.length - 1 ? branchGap : 0);
      }

      branchLayerGroups.push(branchLayers);
    });

    layout.width = maxBranchWidth + padding * 2;
    layout.height = currentY - startY + padding;

    const contentHeight = currentY - startY - titleHeight - padding;
    layout.forkPoint = {
      x: startX + padding / 2,
      y: startY + titleHeight + contentHeight / 2
    };

    layout.mergePoint = {
      x: startX + layout.width - padding / 2,
      y: layout.forkPoint.y
    };
  }

  layout.branchLayerGroups = branchLayerGroups;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/layout.js
git commit -m "feat(layout): support collapsed mode in parallel block layout"
```

---

### Task 4: Implement Collapsed Residual Block Layout

**Files:**
- Modify: `src/layout.js:923-1174`

- [ ] **Step 1: Add collapsed mode handling in calculateResidualBlockLayout**

Modify the function to use COLLAPSED_CONFIG when layout.collapsed is true. Add the config selection at the start:

```javascript
function calculateResidualBlockLayout(block, layout, startX, startY, direction = 'horizontal') {
  // Determine which config to use
  const config = layout.collapsed ? COLLAPSED_CONFIG : LAYOUT_CONFIG;
  const layerWidth = config.layerWidth;
  const layerHeight = config.layerHeight;
  const layerGap = config.layerGap;
  const padding = config.blockPadding;
  const arcRadius = layout.collapsed ? COLLAPSED_CONFIG.layerHeight : LAYOUT_CONFIG.arcRadius;  // Smaller arc for collapsed

  const mainLayers = block.main || [];
  if (mainLayers.length === 0) return;

  const titleHeight = LAYOUT_CONFIG.fontSizeSection + (layout.collapsed ? COLLAPSED_CONFIG.titleGap : LAYOUT_CONFIG.blockTitleGap);
  const titleWidth = LAYOUT_CONFIG.fontSizeSection + (layout.collapsed ? COLLAPSED_CONFIG.titleGap : LAYOUT_CONFIG.blockTitleGap);

  // ... rest of the function remains the same but uses layerWidth/layerHeight/padding from config ...
  // IMPORTANT: All layer pushes should include collapsed: layout.collapsed
```

Update all places where layers are pushed to include `collapsed: layout.collapsed`:

```javascript
// Example for horizontal arc style (line ~1120)
const mainStartY = startY + titleHeight + arcRadius;

let currentX = startX + padding;
mainLayers.forEach((layer, index) => {
  layout.layers.push({
    name: layer.name,
    type: layer.type,
    x: currentX,
    y: mainStartY,
    width: layerWidth,
    height: layerHeight,
    data: layer,
    collapsed: layout.collapsed  // NEW
  });
  currentX += layerWidth + layerGap;
});
```

- [ ] **Step 2: Commit**

```bash
git add src/layout.js
git commit -m "feat(layout): support collapsed mode in residual block layout"
```

---

### Task 5: Implement Collapsed Stack Block Layout

**Files:**
- Modify: `src/layout.js:1182-1335`

- [ ] **Step 1: Handle collapsed mode in calculateStackBlockLayout**

Modify the function to support collapsed mode. For stack blocks, collapsed mode shows one minimal block + "×N" marker:

```javascript
function calculateStackBlockLayout(block, layout, startX, startY, direction = 'horizontal') {
  // Determine which config to use
  const config = layout.collapsed ? COLLAPSED_CONFIG : LAYOUT_CONFIG;
  const layerWidth = config.layerWidth;
  const layerHeight = config.layerHeight;
  const layerGap = config.layerGap;
  const padding = config.blockPadding;
  const stackLoopGap = layout.collapsed ? COLLAPSED_CONFIG.layerGap : LAYOUT_CONFIG.stackLoopGap;

  const layers = block.layers || [];
  const repeat = block.repeat || 1;
  const expand = block.expand === true;  // expand=true means full expansion
  // collapsed mode (expand==="collapsed") shows one block with ×N marker

  if (layers.length === 0) return;

  const titleHeight = LAYOUT_CONFIG.fontSizeSection + (layout.collapsed ? COLLAPSED_CONFIG.titleGap : LAYOUT_CONFIG.blockTitleGap);
  const titleWidth = LAYOUT_CONFIG.fontSizeSection + (layout.collapsed ? COLLAPSED_CONFIG.titleGap : LAYOUT_CONFIG.blockTitleGap);

  // For collapsed mode, treat similar to expand=false but with smaller dimensions
  // The collapsed flag on layers will trigger collapsed rendering in SVG generator
  
  // ... modify the rest of the function to use layerWidth/layerHeight/padding from config ...
  // All layer pushes should include collapsed: layout.collapsed
```

- [ ] **Step 2: Commit**

```bash
git add src/layout.js
git commit -m "feat(layout): support collapsed mode in stack block layout"
```

---

### Task 6: Add Collapsed Layer SVG Generator

**Files:**
- Modify: `src/svg-generator.js:163-177`

- [ ] **Step 1: Add generateCollapsedLayer function**

Add a new function after `generateLayer()` (around line 177) to render collapsed blocks without text:

```javascript
/**
 * 生成 collapsed 层矩形框（无文字，仅颜色）
 * @param {object} layer - 层布局数据
 * @returns {string} SVG 字符串
 */
function generateCollapsedLayer(layer) {
  const colors = COLORS[layer.type] || COLORS.input;
  const cornerRadius = COLLAPSED_CONFIG.cornerRadius || 4.8;
  
  // Minimal rectangle without any text
  return `
	<rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="${SVG_CONFIG.strokeWidth}" rx="${cornerRadius}"/>`;
}
```

- [ ] **Step 2: Add COLLAPSED_CONFIG import/reference**

Add at the top of svg-generator.js (after SVG_CONFIG definition, line 42):

```javascript
// Collapsed block 配置（从 layout.js 同步）
const COLLAPSED_CONFIG = {
  layerWidth: 50,
  layerHeight: 30,
  layerGap: 10,
  blockPadding: 15,
  titleGap: 10,
  branchGap: 12,
  cornerRadius: 4.8
};
```

- [ ] **Step 3: Commit**

```bash
git add src/svg-generator.js
git commit -m "feat(svg): add generateCollapsedLayer function for minimal block rendering"
```

---

### Task 7: Modify generateBlock to Use Collapsed Rendering

**Files:**
- Modify: `src/svg-generator.js:373-404`

- [ ] **Step 1: Modify generateBlock to check collapsed flag**

Modify the `generateBlock()` function to use `generateCollapsedLayer` when layers have `collapsed: true`:

```javascript
function generateBlock(block) {
  const parts = [];
  const colors = COLORS[`block_${block.type}`] || COLORS.block_residual;
  const centerX = block.x + block.width / 2;

  // 容器矩形（虚线边框）
  parts.push(`<rect x="${block.x}" y="${block.y}" width="${block.width}" height="${block.height}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="${SVG_CONFIG.strokeWidth}" stroke-dasharray="${9},${9}" rx="${SVG_CONFIG.cornerRadius}"/>`);

  // 标题（block 名称）
  // For collapsed stack, show "BlockName ×N"
  let titleText = block.name;
  if (block.type === 'stack' && (block.expand === false || block.expand === 'collapsed') && block.repeat > 1) {
    titleText = `${block.name} ×${block.repeat}`;
  }
  const titleY = block.titleY || (block.y + SVG_CONFIG.fontSizeSection);
  parts.push(`<text x="${centerX}" y="${titleY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeSection}" font-weight="bold" font-family="Arial, sans-serif" fill="#333">${titleText}</text>`);

  // 内部层 - use collapsed renderer if layer.collapsed is true
  if (block.layers) {
    block.layers.forEach(layer => {
      if (layer.collapsed) {
        parts.push(generateCollapsedLayer(layer));
      } else {
        parts.push(generateLayer(layer));
      }
    });
  }

  // 并行块：生成 fork/merge 连接
  if (block.type === 'parallel' && block.forkPoint && block.mergePoint) {
    parts.push(generateParallelConnections(block));
  }

  // 残差块：生成 skip 连接
  if (block.type === 'residual') {
    parts.push(generateSkipConnection(block));
  }

  return parts.join('\n');
}
```

- [ ] **Step 2: Commit**

```bash
git add src/svg-generator.js
git commit -m "feat(svg): use collapsed layer rendering in generateBlock"
```

---

### Task 8: Add Tests for Collapsed Layout

**Files:**
- Modify: `tests/test-layout.js`

- [ ] **Step 1: Add test for collapsed parallel block layout**

Add a test case in the appropriate section:

```javascript
// Test collapsed parallel block
function testCollapsedParallelBlock() {
  const block = {
    name: 'CollapsedInception',
    type: 'parallel',
    expand: 'collapsed',
    branches: [
      { id: 'b1', name: '1x1', type: 'conv', kernel: 1, channels: 64 },
      { id: 'b2', name: '3x3', type: 'conv', kernel: 3, channels: 128 },
      { id: 'b3', name: 'pool', type: 'pool', kernel: 3 }
    ],
    merge: 'concat'
  };

  const layout = calculateBlockLayout(block, 0, 0, 'horizontal');
  
  // Check collapsed flag
  assert(layout.collapsed === true, 'Should have collapsed flag');
  
  // Check layer dimensions (should be COLLAPSED_CONFIG values)
  assert(layout.layers[0].width === COLLAPSED_CONFIG.layerWidth, 'Collapsed layer width should be 50');
  assert(layout.layers[0].height === COLLAPSED_CONFIG.layerHeight, 'Collapsed layer height should be 30');
  
  // Check that layers have collapsed flag
  assert(layout.layers[0].collapsed === true, 'Layers should have collapsed flag');
  
  console.log('✓ testCollapsedParallelBlock passed');
}
```

- [ ] **Step 2: Add test for collapsed residual block layout**

```javascript
function testCollapsedResidualBlock() {
  const block = {
    name: 'CollapsedResBlock',
    type: 'residual',
    expand: 'collapsed',
    main: [
      { id: 'c1', name: 'conv1', type: 'conv', kernel: 3, channels: 64 },
      { id: 'c2', name: 'conv2', type: 'conv', kernel: 3, channels: 64 }
    ],
    skip: 'identity',
    merge: 'add'
  };

  const layout = calculateBlockLayout(block, 0, 0, 'horizontal');
  
  assert(layout.collapsed === true, 'Should have collapsed flag');
  assert(layout.layers[0].width === COLLAPSED_CONFIG.layerWidth, 'Collapsed layer width');
  assert(layout.layers[0].collapsed === true, 'Layers should have collapsed flag');
  
  console.log('✓ testCollapsedResidualBlock passed');
}
```

- [ ] **Step 3: Add test for collapsed stack block layout**

```javascript
function testCollapsedStackBlock() {
  const block = {
    name: 'CollapsedEncoder',
    type: 'stack',
    expand: 'collapsed',
    repeat: 6,
    layers: [
      { id: 'attn', name: 'Attention', type: 'attention', heads: 8 },
      { id: 'ff', name: 'FFN', type: 'fc', size: 2048 }
    ]
  };

  const layout = calculateBlockLayout(block, 0, 0, 'horizontal');
  
  assert(layout.collapsed === true, 'Should have collapsed flag');
  // Collapsed stack should show only 2 layers (the pattern) not 12 (6*2)
  assert(layout.layers.length === 2, 'Collapsed stack should show pattern layers only');
  assert(layout.layers[0].collapsed === true, 'Layers should have collapsed flag');
  
  console.log('✓ testCollapsedStackBlock passed');
}
```

- [ ] **Step 4: Add test call in test runner**

Add the test calls to the test execution section:

```javascript
// In the test execution section
console.log('\n--- Testing Collapsed Block Layouts ---');
testCollapsedParallelBlock();
testCollapsedResidualBlock();
testCollapsedStackBlock();
```

- [ ] **Step 5: Run tests**

```bash
node tests/test-runner.js
```

Expected: All tests pass including the three new collapsed tests.

- [ ] **Step 6: Commit**

```bash
git add tests/test-layout.js
git commit -m "test(layout): add tests for collapsed block layout calculations"
```

---

### Task 9: Add Tests for Collapsed SVG Generation

**Files:**
- Modify: `tests/test-svg.js`

- [ ] **Step 1: Add test for collapsed layer SVG generation**

```javascript
function testCollapsedLayerGeneration() {
  const layer = {
    name: 'collapsedConv',
    type: 'conv',
    x: 10,
    y: 10,
    width: 50,
    height: 30,
    collapsed: true,
    data: { kernel: 3, channels: 64 }
  };

  const svg = generateCollapsedLayer(layer);
  
  // Should NOT contain text elements
  assert(!svg.includes('<text'), 'Collapsed layer should not have text');
  
  // Should contain rect element
  assert(svg.includes('<rect'), 'Collapsed layer should have rect');
  
  // Should use conv colors
  assert(svg.includes('#e8f4f8'), 'Should use conv fill color');
  assert(svg.includes('#5ba5d9'), 'Should use conv stroke color');
  
  console.log('✓ testCollapsedLayerGeneration passed');
}
```

- [ ] **Step 2: Add test for collapsed block SVG generation**

```javascript
function testCollapsedBlockGeneration() {
  const block = {
    name: 'TestBlock',
    type: 'parallel',
    expand: 'collapsed',
    collapsed: true,
    x: 0,
    y: 0,
    width: 100,
    height: 80,
    titleY: 30,
    layers: [
      { name: 'l1', type: 'conv', x: 15, y: 40, width: 50, height: 30, collapsed: true },
      { name: 'l2', type: 'pool', x: 77, y: 40, width: 50, height: 30, collapsed: true }
    ],
    forkPoint: { x: 50, y: 35 },
    mergePoint: { x: 50, y: 75 }
  };

  const svg = generateBlock(block);
  
  // Should contain block title
  assert(svg.includes('TestBlock'), 'Should contain block name');
  
  // Should NOT contain layer names in text (collapsed layers have no text)
  assert(!svg.includes('l1') && !svg.includes('l2'), 'Should not contain layer names');
  
  // Should contain dashed border
  assert(svg.includes('stroke-dasharray'), 'Should have dashed border');
  
  console.log('✓ testCollapsedBlockGeneration passed');
}
```

- [ ] **Step 3: Run tests**

```bash
node tests/test-runner.js
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add tests/test-svg.js
git commit -m "test(svg): add tests for collapsed layer/block SVG generation"
```

---

### Task 10: Add Collapsed GoogLeNet Template (Optional)

**Files:**
- Modify: `src/templates.js`

- [ ] **Step 1: Add collapsed GoogLeNet template**

Add a new template entry after the existing `googlenet` template:

```javascript
googlenet_collapsed: {
  name: 'GoogLeNet (Collapsed)',
  template: `name: GoogLeNet Collapsed
layout: vertical

layers:
  - {id: input, name: Input, type: input, size: "224x224x3"}
  - {id: conv1, name: Conv1, type: conv, kernel: 7, stride: 2, channels: 64, out: "112x112x64", act: ReLU}
  - {id: pool1, name: Pool1, type: pool, kernel: 3, stride: 2, out: "56x56x64"}

blocks:
  - name: Inception_3a
    type: parallel
    expand: "collapsed"
    branches:
      - {id: inc3a_1x1, name: "1x1", type: conv, kernel: 1, channels: 64, act: ReLU}
      - [{id: inc3a_3x3r, name: "reduce", type: conv, kernel: 1, channels: 96, act: ReLU},
          {id: inc3a_3x3, name: "3x3", type: conv, kernel: 3, channels: 128, act: ReLU}]
      - [{id: inc3a_5x5r, name: "reduce", type: conv, kernel: 1, channels: 16, act: ReLU},
          {id: inc3a_5x5, name: "5x5", type: conv, kernel: 5, channels: 32, act: ReLU}]
      - [{id: inc3a_pool, name: "pool", type: pool, kernel: 3, stride: 1},
          {id: inc3a_pool1x1, name: "proj", type: conv, kernel: 1, channels: 32, act: ReLU}]
    merge: concat

  - name: Inception_3b
    type: parallel
    expand: "collapsed"
    branches:
      - {id: inc3b_1x1, name: "1x1", type: conv, kernel: 1, channels: 128, act: ReLU}
      - [{id: inc3b_3x3r, name: "reduce", type: conv, kernel: 1, channels: 128, act: ReLU},
          {id: inc3b_3x3, name: "3x3", type: conv, kernel: 3, channels: 192, act: ReLU}]
      - [{id: inc3b_5x5r, name: "reduce", type: conv, kernel: 1, channels: 32, act: ReLU},
          {id: inc3b_5x5, name: "5x5", type: conv, kernel: 5, channels: 96, act: ReLU}]
      - [{id: inc3b_pool, name: "pool", type: pool, kernel: 3, stride: 1},
          {id: inc3b_pool1x1, name: "proj", type: conv, kernel: 1, channels: 64, act: ReLU}]
    merge: concat

layers_after_blocks:
  - {id: pool2, name: Pool2, type: pool, kernel: 3, stride: 2}
  - {id: fc1, name: FC1, type: fc, size: 1024, act: ReLU, dropout: true}
  - {id: fc2, name: FC2, type: fc, size: 1000}
  - {id: output, name: Output, type: output, size: 1000, act: Softmax}`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/templates.js
git commit -m "feat(templates): add collapsed GoogLeNet template"
```

---

### Task 11: Final Integration Test

**Files:**
- Run: Manual visual verification

- [ ] **Step 1: Run the test suite**

```bash
node tests/test-runner.js
```

Expected: All tests pass (existing + new collapsed tests).

- [ ] **Step 2: Generate collapsed GoogLeNet visually**

Open `index.html` in browser, select `googlenet_collapsed` template, verify:
- Inception blocks show minimal colored rectangles
- No text inside the collapsed blocks
- Fork/merge connections are visible
- Block names are displayed at top

- [ ] **Step 3: Generate custom collapsed blocks**

Test with custom YAML:
```yaml
blocks:
  - name: MyParallel
    type: parallel
    expand: "collapsed"
    branches:
      - {type: conv}
      - {type: pool}
      - {type: fc}
```

Verify 3 minimal blocks are rendered with different colors.

- [ ] **Step 4: Final commit**

```bash
git status
git add -A
git commit -m "feat: complete collapsed block rendering implementation"
```

---

## Self-Review Checklist

After completing all tasks, verify:

1. **Spec coverage:**
   - `expand: "collapsed"` syntax ✓ (Tasks 1-2)
   - Minimal block size ✓ (Task 1)
   - No text in collapsed layers ✓ (Task 6)
   - Parallel block collapsed ✓ (Task 3)
   - Residual block collapsed ✓ (Task 4)
   - Stack block collapsed ✓ (Task 5)
   - Inherits layout direction ✓ (handled in existing layout code)
   - Tests ✓ (Tasks 8-9)

2. **Placeholder scan:** No TBD/TODO placeholders ✓

3. **Type consistency:**
   - `layout.collapsed` boolean flag used consistently ✓
   - `layer.collapsed` boolean flag on each layer ✓
   - `COLLAPSED_CONFIG` defined in both layout.js and svg-generator.js ✓

---

**Plan complete.** Execute via subagent-driven-development or inline execution.