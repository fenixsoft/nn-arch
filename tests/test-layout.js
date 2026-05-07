// === layout.js 测试 ===

test('计算简单网络层位置（水平布局）', function() {
  const network = {
    name: 'SimpleNet',
    layout: 'horizontal',
    layers: [
      {name: 'A', type: 'input', size: '10'},
      {name: 'B', type: 'conv', kernel: 3, channels: 64},
      {name: 'C', type: 'output', size: 10}
    ],
    sections: [],
    blocks: [],
    connections: [],
    layersAfterBlocks: [],
    rowLabels: []
  };

  const layout = calculateLayout(network);
  assertEqual(layout.layers.length, 3, '布局层数量');

  // 检查第一层位置（放大 300%）
  const layerA = layout.layers.find(l => l.name === 'A');
  assertEqual(layerA.x, 63, 'A 层 x 坐标');
  assertEqual(layerA.y, 81, 'A 层 y 坐标');

  // 检查层间距（216 宽度 + 27 间距 = 243）
  const layerB = layout.layers.find(l => l.name === 'B');
  assertEqual(layerB.x - layerA.x, 243, 'A-B 层间距');
});

test('计算垂直布局', function() {
  const network = {
    name: 'VerticalNet',
    layout: 'vertical',
    layers: [
      {name: 'Input', type: 'input', size: 10},
      {name: 'Hidden', type: 'dense', units: 64},
      {name: 'Output', type: 'output', size: 10}
    ],
    sections: [],
    blocks: [],
    connections: [],
    layersAfterBlocks: [],
    rowLabels: []
  };

  const layout = calculateLayout(network);
  assertEqual(layout.layers.length, 3, '布局层数量');

  const layerInput = layout.layers.find(l => l.name === 'Input');
  const layerHidden = layout.layers.find(l => l.name === 'Hidden');

  // 垂直布局应该有相同的 x 坐标
  assertEqual(layerInput.x, layerHidden.x, '垂直布局 x 坐标相同');

  // y 坐标应该有间距（126 高度 + 27 间距 = 153）
  assertEqual(layerHidden.y - layerInput.y, 153, '垂直布局层间距');
});

test('计算垂直布局层位置', function() {
  const network = {
    name: 'VerticalNet',
    layout: 'vertical',
    layers: [
      {name: 'A', type: 'input', size: '10'},
      {name: 'B', type: 'conv', kernel: 3, channels: 64},
      {name: 'C', type: 'output', size: 10}
    ],
    sections: [],
    blocks: [],
    connections: [],
    layersAfterBlocks: [],
    rowLabels: []
  };

  const layout = calculateLayout(network);
  const layerA = layout.layers.find(l => l.name === 'A');
  const layerB = layout.layers.find(l => l.name === 'B');

  // 垂直布局中，x 坐标相同，y 坐标递增
  assertEqual(layerA.x, 63, 'A 层 x 坐标');
  assertEqual(layerB.x, 63, 'B 层 x 坐标（垂直布局 x 相同）');
  assertEqual(layerB.y - layerA.y, 153, 'A-B 层间距');
});

test('计算连接箭头位置（水平布局）', function() {
  const network = {
    name: 'ConnectNet',
    layout: 'horizontal',
    layers: [
      {name: 'A', type: 'input'},
      {name: 'B', type: 'dense'}
    ],
    sections: [],
    blocks: [],
    connections: [],
    layersAfterBlocks: [],
    rowLabels: []
  };

  const layout = calculateLayout(network);
  assertEqual(layout.connections.length, 1, '连接数量');

  const conn = layout.connections[0];
  assertEqual(conn.from, 'A', '连接起点层');
  assertEqual(conn.to, 'B', '连接终点层');
  assertEqual(conn.type, 'sequential', '连接类型');

  // 箭头起点在 A 层右侧中间（63 + 216 = 279）
  assertEqual(conn.x1, 279, '箭头起点 x');
  // 箭头起点 y（81 + 126/2 = 144）
  assertEqual(conn.y1, 144, '箭头起点 y');
});

test('计算布局总尺寸', function() {
  const network = {
    name: 'SizeNet',
    layout: 'horizontal',
    layers: [
      {name: 'A', type: 'input'},
      {name: 'B', type: 'conv'},
      {name: 'C', type: 'output'}
    ],
    sections: [],
    blocks: [],
    connections: [],
    layersAfterBlocks: [],
    rowLabels: []
  };

  const layout = calculateLayout(network);

  // 总宽度 = startX + 3层 + 2间距 + startX
  // = 63 + 3*216 + 2*27 + 63 = 828
  assertEqual(layout.width, 828, '总宽度');

  // 总高度 = startY + 层高度 + bottomPadding
  // = 81 + 126 + 6 = 213
  assertEqual(layout.height, 213, '总高度');
});

test('处理空网络', function() {
  const network = {
    name: 'EmptyNet',
    layout: 'horizontal',
    layers: [],
    sections: [],
    blocks: [],
    connections: [],
    layersAfterBlocks: [],
    rowLabels: []
  };

  const layout = calculateLayout(network);
  assertEqual(layout.layers.length, 0, '空网络层列表');
  assertEqual(layout.connections.length, 0, '空网络连接列表');
});

test('布局配置常量正确', function() {
  // 放大 300% 后的值
  assertEqual(LAYOUT_CONFIG.layerWidth, 216, '层宽度');
  assertEqual(LAYOUT_CONFIG.layerHeight, 126, '层高度');
  assertEqual(LAYOUT_CONFIG.layerGap, 27, '层间距');
  assertEqual(LAYOUT_CONFIG.startX, 63, '起始 X 坐标');
  assertEqual(LAYOUT_CONFIG.startY, 81, '起始 Y 坐标');
  assertEqual(LAYOUT_CONFIG.maxLayersPerRow, 6, '每行最大层数');
});

test('LAYOUT_CONFIG 包含 block 相关参数', function() {
  assertEqual(LAYOUT_CONFIG.blockPadding, 27, 'blockPadding');
  assertEqual(LAYOUT_CONFIG.blockTitleGap, 18, 'blockTitleGap');
  assertEqual(LAYOUT_CONFIG.branchGap, 27, 'branchGap');
  assertEqual(LAYOUT_CONFIG.arcRadius, 40, 'arcRadius');
  assertEqual(LAYOUT_CONFIG.stackLoopGap, 36, 'stackLoopGap');
});

test('计算 sections 分组区域位置（换行布局）', function() {
  const network = {
    name: 'TestNet',
    layout: 'horizontal',
    layers: [
      {name: 'Input', type: 'input', size: '10'},
      {name: 'Conv1', type: 'conv', kernel: 3, channels: 64},
      {name: 'Conv2', type: 'conv', kernel: 3, channels: 64},
      {name: 'FC1', type: 'fc', size: 1000},
      {name: 'Output', type: 'output', size: 10}
    ],
    sections: [
      {name: '特征提取器', layers: ['Input', 'Conv1', 'Conv2'], rowLabel: 'Flatten: N'},
      {name: '分类器', layers: ['FC1', 'Output'], rowLabel: null}
    ],
    blocks: [],
    connections: [],
    layersAfterBlocks: [],
    rowLabels: []
  };

  const layout = calculateLayout(network);
  assertEqual(layout.sections.length, 2, 'sections 数量');

  // 有 sections 时会换行布局
  const section1 = layout.sections[0];
  assertEqual(section1.name, '特征提取器', 'section 名称');
  assertEqual(section1.x, 36, 'section x 起点'); // 63 - 27 (padding)

  // 验证行间连接存在
  assertEqual(layout.rowConnections.length, 1, '行间连接数量');

  // 验证标注来自 section 定义
  assertEqual(layout.rowConnections[0].label, 'Flatten: N', '行间标注来自 section 定义');
});

test('section 内超过 6 个元素自动换行', function() {
  const network = {
    name: 'TestNet',
    layout: 'horizontal',
    layers: [
      {name: 'L1', type: 'conv'},
      {name: 'L2', type: 'conv'},
      {name: 'L3', type: 'conv'},
      {name: 'L4', type: 'conv'},
      {name: 'L5', type: 'conv'},
      {name: 'L6', type: 'conv'},
      {name: 'L7', type: 'conv'},
      {name: 'L8', type: 'conv'}
    ],
    sections: [
      {name: '大 Section', layers: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8']}
    ],
    blocks: [],
    connections: [],
    layersAfterBlocks: [],
    rowLabels: []
  };

  const layout = calculateLayout(network);

  // 检查层有 rowIndex 标记
  const layer1 = layout.layers.find(l => l.name === 'L1');
  const layer7 = layout.layers.find(l => l.name === 'L7');

  assertEqual(layer1.rowIndex, 0, 'L1 在第一行');
  assertEqual(layer7.rowIndex, 1, 'L7 在第二行（超过 6 个换行）');

  // L7 的 y 应该比 L1 大（换行到下一行）
  assertEqual(layer7.y > layer1.y, true, 'L7 在 L1 下方');
});

// === 模板布局测试 ===

test('计算 VGG16 模板布局（换行）', function() {
  const vgg16Yaml = `name: VGG16
layout: horizontal

sections:
  - name: 特征提取器
    layers: [Input, Conv1_1, Conv1_2, Pool1, Conv2_1, Conv2_2, Pool2, Conv3_1, Conv3_2, Conv3_3, Pool3, Conv4_1, Conv4_2, Conv4_3, Pool4, Conv5_1, Conv5_2, Conv5_3, Pool5]
    row_label: "Flatten: 25088"
  - name: 分类器
    layers: [FC1, FC2, FC3, Output]

layers:
  - {name: Input, type: input, size: "224x224x3"}
  - {name: Conv1_1, type: conv, kernel: 3, channels: 64, act: ReLU}
  - {name: Conv1_2, type: conv, kernel: 3, channels: 64, act: ReLU}
  - {name: Pool1, type: pool, kernel: 2, stride: 2, out: "112x112x64"}
  - {name: Conv2_1, type: conv, kernel: 3, channels: 128, act: ReLU}
  - {name: Conv2_2, type: conv, kernel: 3, channels: 128, act: ReLU}
  - {name: Pool2, type: pool, kernel: 2, stride: 2, out: "56x56x128"}
  - {name: Conv3_1, type: conv, kernel: 3, channels: 256, act: ReLU}
  - {name: Conv3_2, type: conv, kernel: 3, channels: 256, act: ReLU}
  - {name: Conv3_3, type: conv, kernel: 3, channels: 256, act: ReLU}
  - {name: Pool3, type: pool, kernel: 2, stride: 2, out: "28x28x256"}
  - {name: Conv4_1, type: conv, kernel: 3, channels: 512, act: ReLU}
  - {name: Conv4_2, type: conv, kernel: 3, channels: 512, act: ReLU}
  - {name: Conv4_3, type: conv, kernel: 3, channels: 512, act: ReLU}
  - {name: Pool4, type: pool, kernel: 2, stride: 2, out: "14x14x512"}
  - {name: Conv5_1, type: conv, kernel: 3, channels: 512, act: ReLU}
  - {name: Conv5_2, type: conv, kernel: 3, channels: 512, act: ReLU}
  - {name: Conv5_3, type: conv, kernel: 3, channels: 512, act: ReLU}
  - {name: Pool5, type: pool, kernel: 2, stride: 2, out: "7x7x512"}
  - {name: FC1, type: fc, size: 4096, act: ReLU, dropout: true}
  - {name: FC2, type: fc, size: 4096, act: ReLU, dropout: true}
  - {name: FC3, type: fc, size: 1000}
  - {name: Output, type: output, size: 1000, act: Softmax}`;

  const network = parseNetworkYaml(vgg16Yaml);
  const layout = calculateLayout(network);

  assertEqual(layout.layers.length, 23, 'VGG16 布局层数量');
  assertEqual(layout.sections.length, 2, 'VGG16 sections 分组数量');

  // 验证所有层都有有效坐标
  const allLayersHaveCoords = layout.layers.every(l => l.x >= 0 && l.y >= 0);
  assertEqual(allLayersHaveCoords, true, 'VGG16 所有层都有有效坐标');

  // 验证行间连接存在
  assertEqual(layout.rowConnections.length, 1, 'VGG16 行间连接数量');

  // 验证标注来自 YAML 定义
  assertEqual(layout.rowConnections[0].label, 'Flatten: 25088', 'VGG16 行间标注来自 YAML');

  // 特征提取器有 19 个层，应该分成多行（19 > 6）
  const section1RowCount = layout.sections[0].rowCount;
  assertEqual(section1RowCount >= 3, true, 'VGG16 特征提取器有多行（超过 6 个元素换行）');
});

test('计算 ResNet18 模板布局', function() {
  const resnet18Yaml = `name: ResNet18
layout: horizontal

layers:
  - {name: Input, type: input, size: "224x224x3"}
  - {name: Conv1, type: conv, kernel: 7, stride: 2, channels: 64, out: "56x56x64", act: ReLU}
  - {name: Pool1, type: pool, kernel: 3, stride: 2, out: "28x28x64"}

blocks:
  - name: ResBlock1
    type: residual
    main:
      - {name: conv1, type: conv, kernel: 3, channels: 64, act: ReLU}
      - {name: conv2, type: conv, kernel: 3, channels: 64}
    skip: identity
    merge: add
    act: ReLU

layers_after_blocks:
  - {name: GlobalPool, type: pool, kernel: global, out: "1x1x512"}
  - {name: FC, type: fc, size: 1000}
  - {name: Output, type: output, size: 1000, act: Softmax}`;

  const network = parseNetworkYaml(resnet18Yaml);
  const layout = calculateLayout(network);

  // ResNet18 现在包含 blocks，总层数 = 初始层 + block内部层 + afterBlocks
  // 初始层: 3 (Input, Conv1, Pool1)
  // block内部: 2 (conv1, conv2)
  // afterBlocks: 3 (GlobalPool, FC, Output)
  // 总计: 8 层
  assertEqual(layout.layers.length, 8, 'ResNet18 总层数量（含 block）');
  assertEqual(layout.blocks.length, 1, 'ResNet18 block 数量');
  assertEqual(layout.blockConnections.length, 2, 'ResNet18 block 连接数量（entry + exit）');

  // 验证初始层坐标
  const inputLayer = layout.layers.find(l => l.name === 'Input');
  assertEqual(inputLayer !== undefined, true, 'ResNet18 Input 层存在');
  assertEqual(inputLayer.x, 63, 'ResNet18 Input 层 x 坐标');

  // 验证 block 在初始层之后
  const block = layout.blocks[0];
  assertEqual(block.x > inputLayer.x, true, 'ResNet18 block 在初始层之后');

  // 验证 afterBlocks 在 block 之后
  const globalPool = layout.layers.find(l => l.name === 'GlobalPool');
  assertEqual(globalPool.x > block.x + block.width, true, 'ResNet18 GlobalPool 在 block 之后');
});

test('计算 Transformer 模板布局', function() {
  const transformerYaml = `name: Transformer Encoder
layout: horizontal

layers:
  - {name: Input, type: input, size: "512 tokens"}
  - {name: Embedding, type: embedding, size: 512}

blocks:
  - name: EncoderBlock
    type: stack
    repeat: 6
    layers:
      - {name: FF1, type: fc, size: 2048}
      - {name: FF2, type: fc, size: 512}

layers_after_blocks:
  - {name: Output, type: output, size: 10000}`;

  const network = parseNetworkYaml(transformerYaml);
  const layout = calculateLayout(network);

  // Transformer 现在包含 blocks，总层数 = 初始层 + block内部层 + afterBlocks
  // 初始层: 2 (Input, Embedding)
  // block内部: 2 (FF1, FF2) - expand=false 所以只显示一次
  // afterBlocks: 1 (Output)
  // 总计: 5 层
  assertEqual(layout.layers.length, 5, 'Transformer 总层数量（含 block）');
  assertEqual(layout.blocks.length, 1, 'Transformer block 数量');
  assertEqual(layout.blockConnections.length, 2, 'Transformer block 连接数量（entry + exit）');

  // 验证层类型正确
  const embeddingLayer = layout.layers.find(l => l.name === 'Embedding');
  assertEqual(embeddingLayer !== undefined, true, 'Transformer Embedding 层存在');
  assertEqual(embeddingLayer.type, 'embedding', 'Transformer Embedding 层类型');

  // 验证 block 有重复标记
  const block = layout.blocks[0];
  assertEqual(block.repeatMarker !== undefined, true, 'Transformer block 有重复标记');
  assertEqual(block.repeatMarker.count, 6, 'Transformer block 重复次数为 6');
});

// === Block Layout 测试 ===

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
  assertEqual(blockLayout.layers[0].name, 'Q', '第一个分支名称');
  assertEqual(blockLayout.width > 0, true, '容器宽度');
  assertEqual(blockLayout.height > 0, true, '容器高度');
});

test('计算 parallel block 多层分支布局', function() {
  // Inception 模块风格的测试：每个分支有多层
  const block = {
    name: 'Inception',
    type: 'parallel',
    branches: [
      // 分支1: 单层 1x1 conv
      {id: 'branch1', name: '1x1', type: 'conv', kernel: 1, channels: 64},
      // 分支2: 两层 3x3 conv (reduce + conv)
      [
        {id: 'branch2_reduce', name: '3x3_reduce', type: 'conv', kernel: 1, channels: 96},
        {id: 'branch2_conv', name: '3x3', type: 'conv', kernel: 3, channels: 128}
      ],
      // 分支3: 两层 5x5 conv (reduce + conv)
      [
        {id: 'branch3_reduce', name: '5x5_reduce', type: 'conv', kernel: 1, channels: 16},
        {id: 'branch3_conv', name: '5x5', type: 'conv', kernel: 5, channels: 32}
      ],
      // 分支4: 单层 pool + 1x1 conv
      {id: 'branch4', name: 'pool+1x1', type: 'pool', kernel: 3}
    ],
    merge: 'concat'
  };

  const blockLayout = calculateBlockLayout(block, 100, 50);
  assertEqual(blockLayout.name, 'Inception', 'block name');
  assertEqual(blockLayout.layers.length, 6, '总层数量（1 + 2 + 2 + 1）');
  assertEqual(blockLayout.branchLayerGroups.length, 4, '分支组数量');

  // 验证容器宽度覆盖最长分支（2层）
  const twoLayerBranchWidth = 216 * 2 + 27; // layerWidth * 2 + layerGap
  assertEqual(blockLayout.width > twoLayerBranchWidth, true, '容器宽度覆盖最长分支');

  // 验证 fork 和 merge 点
  assertEqual(blockLayout.forkPoint !== undefined, true, '有 fork 点');
  assertEqual(blockLayout.mergePoint !== undefined, true, '有 merge 点');
});

test('计算 residual block arc 样式布局', function() {
  const block = {
    name: 'ResBlock',
    type: 'residual',
    style: 'arc',
    main: [
      {name: 'conv1', type: 'conv', kernel: 3, channels: 64},
      {name: 'conv2', type: 'conv', kernel: 3, channels: 64}
    ],
    skip: 'identity',
    merge: 'add'
  };

  const blockLayout = calculateBlockLayout(block, 100, 50);
  assertEqual(blockLayout.name, 'ResBlock', 'block name');
  assertEqual(blockLayout.type, 'residual', 'block type');
  assertEqual(blockLayout.layers.length, 2, '主路径层数量');
  assertEqual(blockLayout.skipConnection.type, 'arc', 'skip connection type');
  assertEqual(blockLayout.skipConnection !== undefined, true, '存在 skip connection');
});

test('计算 residual block parallel 样式布局', function() {
  const block = {
    name: 'ResBlock',
    type: 'residual',
    style: 'parallel',
    main: [
      {name: 'conv1', type: 'conv', kernel: 3, channels: 64},
      {name: 'conv2', type: 'conv', kernel: 3, channels: 64}
    ],
    skip: [
      {name: 'skip_conv', type: 'conv', kernel: 1, channels: 64}
    ],
    merge: 'add'
  };

  const blockLayout = calculateBlockLayout(block, 100, 50);
  assertEqual(blockLayout.name, 'ResBlock', 'block name');
  assertEqual(blockLayout.type, 'residual', 'block type');
  assertEqual(blockLayout.layers.length >= 2, true, '主路径层数量');
  // 当有 skip 层时，skip connection type 为 parallel-with-layers
  assertEqual(blockLayout.skipConnection.type, 'parallel-with-layers', 'skip connection type (with skip layers)');
});

test('计算 residual block parallel 样式布局 - identity shortcut', function() {
  // 测试 identity shortcut（无 skip 层，skip: identity）
  const block = {
    name: 'ResBlock',
    type: 'residual',
    style: 'parallel',
    main: [
      {name: 'conv1', type: 'conv', kernel: 3, channels: 64},
      {name: 'conv2', type: 'conv', kernel: 3, channels: 64}
    ],
    skip: 'identity',
    merge: 'add'
  };

  const blockLayout = calculateBlockLayout(block, 100, 50);
  assertEqual(blockLayout.name, 'ResBlock', 'block name');
  assertEqual(blockLayout.layers.length, 2, '主路径层数量（只有 main 层）');
  // 当 skip 为 identity 时，skip connection type 为 parallel（无 skip 层）
  assertEqual(blockLayout.skipConnection.type, 'parallel', 'skip connection type (identity shortcut)');
});

test('计算 residual block parallel 样式布局 - skip路径更长', function() {
  // 测试 skip 路径层数多于 main 路径时容器宽度是否正确
  const block = {
    name: 'ResBlock',
    type: 'residual',
    style: 'parallel',
    main: [
      {name: 'conv1', type: 'conv', kernel: 3, channels: 64}
    ],
    skip: [
      {name: 'skip_conv1', type: 'conv', kernel: 1, channels: 64},
      {name: 'skip_conv2', type: 'conv', kernel: 1, channels: 64},
      {name: 'skip_conv3', type: 'conv', kernel: 1, channels: 64}
    ],
    merge: 'add'
  };

  const blockLayout = calculateBlockLayout(block, 100, 50);
  const mainLayers = blockLayout.layers.filter(l => l.path === 'main');
  const skipLayers = blockLayout.layers.filter(l => l.path === 'skip');

  assertEqual(mainLayers.length, 1, '主路径层数量');
  assertEqual(skipLayers.length, 3, 'skip路径层数量');

  // 验证所有层都在容器宽度范围内
  const rightEdge = blockLayout.x + blockLayout.width;
  for (const layer of skipLayers) {
    const layerRightEdge = layer.x + layer.width;
    assertEqual(layerRightEdge <= rightEdge, true,
      `skip层 "${layer.name}" 右边缘 (${layerRightEdge}) 应在容器右边缘 (${rightEdge}) 内`);
  }
});

test('计算 stack block expand=false 布局', function() {
  const block = {
    name: 'EncoderStack',
    type: 'stack',
    repeat: 6,
    expand: false,
    layers: [
      {name: 'attn', type: 'attention', heads: 8},
      {name: 'ff', type: 'fc', size: 2048}
    ]
  };

  const blockLayout = calculateBlockLayout(block, 100, 50);
  assertEqual(blockLayout.name, 'EncoderStack', 'block name');
  assertEqual(blockLayout.type, 'stack', 'block type');
  assertEqual(blockLayout.layers.length, 2, '未展开时只显示一层');
  assertEqual(blockLayout.repeatMarker !== undefined, true, '存在重复标记');
  assertEqual(blockLayout.repeatMarker.count, 6, '重复次数');
});

test('计算 stack block expand=true 布局', function() {
  const block = {
    name: 'EncoderStack',
    type: 'stack',
    repeat: 3,
    expand: true,
    layers: [
      {name: 'attn', type: 'attention', heads: 8},
      {name: 'ff', type: 'fc', size: 2048}
    ]
  };

  const blockLayout = calculateBlockLayout(block, 100, 50);
  assertEqual(blockLayout.name, 'EncoderStack', 'block name');
  assertEqual(blockLayout.type, 'stack', 'block type');
  assertEqual(blockLayout.layers.length, 6, '展开时显示所有重复层（3次 × 2层）');
  assertEqual(blockLayout.repeatMarker, undefined, '展开时无重复标记');
});

// === Block Integration 测试 ===

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
  assertEqual(layout.layers.length >= 4, true, '总层数量包含 block 内部层');
  assertEqual(layout.blocks.length, 1, 'block 布局数量');
  const blockX = layout.blocks[0].x;
  const inputLayer = layout.layers.find(l => l.name === 'Input');
  const outputLayer = layout.layers.find(l => l.name === 'Output');
  assertEqual(blockX > inputLayer.x, true, 'block 在 Input 之后');
});

// === Collapsed Block Layout 测试 ===

test('计算 collapsed parallel block 布局', function() {
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

  // horizontal 布局：使用正常宽度 216
  const layout = calculateBlockLayout(block, 100, 50, 'horizontal');

  assertEqual(layout.collapsed, true, 'Should have collapsed flag');
  assertEqual(layout.layers.length, 3, 'Collapsed parallel block should have 3 layers');
  assertEqual(layout.layers[0].width, COLLAPSED_CONFIG.horizontalLayerWidth, 'Horizontal collapsed layer width should be 216 (horizontalLayerWidth)');
  assertEqual(layout.layers[0].height, COLLAPSED_CONFIG.layerHeight, 'Collapsed layer height should match COLLAPSED_CONFIG');
  assertEqual(layout.layers[0].collapsed, true, 'Layers should have collapsed flag');
});

test('计算 collapsed residual block 布局', function() {
  const block = {
    name: 'CollapsedResBlock',
    type: 'residual',
    expand: 'collapsed',
    style: 'arc',
    main: [
      { name: 'conv1', type: 'conv', kernel: 3, channels: 64 },
      { name: 'conv2', type: 'conv', kernel: 3, channels: 64 }
    ],
    skip: 'identity',
    merge: 'add'
  };

  // horizontal 布局：使用正常宽度 216
  const layout = calculateBlockLayout(block, 100, 50, 'horizontal');

  assertEqual(layout.collapsed, true, 'Should have collapsed flag');
  assertEqual(layout.layers.length, 2, 'Collapsed residual block should have 2 main layers');
  assertEqual(layout.layers[0].width, COLLAPSED_CONFIG.horizontalLayerWidth, 'Horizontal collapsed layer width should be 216 (horizontalLayerWidth)');
  assertEqual(layout.layers[0].height, COLLAPSED_CONFIG.layerHeight, 'Collapsed layer height should match COLLAPSED_CONFIG');
  assertEqual(layout.layers[0].collapsed, true, 'Layers should have collapsed flag');
  assertEqual(layout.skipConnection.type, 'arc', 'Should have arc skip connection');
});

test('计算 collapsed stack block 布局', function() {
  const block = {
    name: 'CollapsedEncoderStack',
    type: 'stack',
    expand: 'collapsed',
    repeat: 6,
    layers: [
      { name: 'attn', type: 'attention', heads: 8 },
      { name: 'ff', type: 'fc', size: 2048 }
    ]
  };

  // horizontal 布局：使用正常宽度 216
  const layout = calculateBlockLayout(block, 100, 50, 'horizontal');

  assertEqual(layout.collapsed, true, 'Should have collapsed flag');
  assertEqual(layout.layers.length, 2, 'Collapsed stack block should show layers once');
  assertEqual(layout.layers[0].width, COLLAPSED_CONFIG.horizontalLayerWidth, 'Horizontal collapsed layer width should be 216 (horizontalLayerWidth)');
  assertEqual(layout.layers[0].height, COLLAPSED_CONFIG.layerHeight, 'Collapsed layer height should match COLLAPSED_CONFIG');
  assertEqual(layout.layers[0].collapsed, true, 'Layers should have collapsed flag');
  assertEqual(layout.repeatMarker !== undefined, true, 'Should have repeat marker');
  assertEqual(layout.repeatMarker.count, 6, 'Repeat marker should show count 6');
});