// === svg-generator.js 测试 ===

test('生成简单网络 SVG', function() {
  const layout = {
    width: 400,
    height: 120,
    title: { x: 200, y: 25, text: 'SimpleNet' },
    sections: [],
    layers: [
      {name: 'Input', type: 'input', x: 10, y: 40, width: 216, height: 126, data: {size: '10'}}
    ],
    connections: [],
    rowConnections: [],
    blocks: []
  };

  const svg = generateSvg(layout);
  assertEqual(svg.includes('<svg'), true, '包含 SVG 标签');
  assertEqual(svg.includes('SimpleNet'), true, '包含标题');
  assertEqual(svg.includes('Input'), true, '包含层名称');
});

test('SVG 箭头标记缩小 50%', function() {
  const layout = {
    width: 400,
    height: 120,
    title: { x: 200, y: 25, text: 'Test' },
    sections: [],
    layers: [],
    connections: [],
    rowConnections: [],
    blocks: []
  };

  const svg = generateSvg(layout);
  // 箭头标记尺寸（缩小 50% 后）
  assertEqual(svg.includes('markerWidth="7.2"'), true, '箭头标记宽度缩小');
  assertEqual(svg.includes('markerHeight="5.4"'), true, '箭头标记高度缩小');
});

test('卷积层包含蓝色样式', function() {
  const layout = {
    width: 200, height: 120,
    title: { x: 100, y: 25, text: 'Test' },
    sections: [],
    layers: [{name: 'Conv1', type: 'conv', x: 10, y: 40, width: 216, height: 126, data: {kernel: 3, channels: 64}}],
    connections: [],
    rowConnections: [],
    blocks: []
  };
  const svg = generateSvg(layout);
  assertEqual(svg.includes('#e8f4f8'), true, '包含卷积层背景色');
  assertEqual(svg.includes('#5ba5d9'), true, '包含卷积层边框色');
});

test('全连接层包含绿色样式', function() {
  const layout = {
    width: 200, height: 120,
    title: { x: 100, y: 25, text: 'Test' },
    sections: [],
    layers: [{name: 'FC1', type: 'fc', x: 10, y: 40, width: 216, height: 126, data: {size: 1000}}],
    connections: [],
    rowConnections: [],
    blocks: []
  };
  const svg = generateSvg(layout);
  assertEqual(svg.includes('#e8f8f0'), true, '包含FC层背景色');
  assertEqual(svg.includes('#5bd9a5'), true, '包含FC层边框色');
});

test('section标题为粗体', function() {
  const layout = {
    width: 500, height: 200,
    title: { x: 250, y: 30, text: 'Test' },
    sections: [{
      name: '特征提取器',
      x: 10, y: 50, width: 480, height: 100,
      titleY: 60,
      strokeColor: '#b8d8e8'
    }],
    layers: [],
    connections: [],
    rowConnections: [],
    blocks: []
  };
  const svg = generateSvg(layout);
  assertEqual(svg.includes('font-weight="bold"'), true, 'section标题包含粗体样式');
});

test('显示 pool 信息', function() {
  const layout = {
    width: 300, height: 150,
    title: { x: 150, y: 30, text: 'Test' },
    sections: [],
    layers: [{
      name: 'Conv1',
      type: 'conv',
      x: 10, y: 40,
      width: 216, height: 126,
      data: {kernel: 3, channels: 64, pool: {kernel: 3, stride: 2}}
    }],
    connections: [],
    rowConnections: [],
    blocks: []
  };
  const svg = generateSvg(layout);
  assertEqual(svg.includes('Pool'), true, '包含 Pool 信息');
  assertEqual(svg.includes('#a559f0'), true, 'Pool 信息使用紫色');
});

test('显示 dropout 信息', function() {
  const layout = {
    width: 300, height: 150,
    title: { x: 150, y: 30, text: 'Test' },
    sections: [],
    layers: [{
      name: 'FC1',
      type: 'fc',
      x: 10, y: 40,
      width: 216, height: 126,
      data: {size: 4096, dropout: true}
    }],
    connections: [],
    rowConnections: [],
    blocks: []
  };
  const svg = generateSvg(layout);
  assertEqual(svg.includes('Dropout'), true, '包含 Dropout 信息');
  assertEqual(svg.includes('#d9a55b'), true, 'Dropout 信息使用橙色');
});

test('行间连接标注来自 YAML', function() {
  const layout = {
    width: 500, height: 300,
    title: { x: 250, y: 30, text: 'Test' },
    sections: [],
    layers: [],
    connections: [],
    rowConnections: [{
      from: 'L1',
      to: 'L2',
      fromX: 100,
      fromY: 100,
      midY: 150,
      toX: 200,
      toY: 200,
      label: 'Flatten: 9216',
      labelX: 220,
      labelY: 150
    }],
    blocks: []
  };
  const svg = generateSvg(layout);
  assertEqual(svg.includes('Flatten: 9216'), true, '包含自定义标注');
});

// === 模板 SVG 生成测试 ===

test('生成 VGG16 模板 SVG', function() {
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
  const svg = generateSvg(layout);

  assertEqual(svg.includes('<svg'), true, 'VGG16 SVG 包含 svg 标签');
  assertEqual(svg.includes('VGG16'), true, 'VGG16 SVG 包含标题');
  assertEqual(svg.includes('特征提取器'), true, 'VGG16 SVG 包含特征提取器 section');
  assertEqual(svg.includes('分类器'), true, 'VGG16 SVG 包含分类器 section');
  assertEqual(svg.includes('Conv1_1'), true, 'VGG16 SVG 包含 Conv1_1 层');
  assertEqual(svg.includes('Pool5'), true, 'VGG16 SVG 包含 Pool5 层');
  assertEqual(svg.includes('FC1'), true, 'VGG16 SVG 包含 FC1 层');
  assertEqual(svg.includes('Output'), true, 'VGG16 SVG 包含 Output 层');
  assertEqual(svg.includes('#e8f4f8'), true, 'VGG16 SVG 包含卷积层颜色');
  assertEqual(svg.includes('#f0e8f8'), true, 'VGG16 SVG 包含池化层颜色');
  assertEqual(svg.includes('#e8f8f0'), true, 'VGG16 SVG 包含全连接层颜色');
  // 验证 Flatten 标注来自 YAML
  assertEqual(svg.includes('Flatten: 25088'), true, 'VGG16 SVG 包含自定义标注');
  // 验证 Dropout 显示
  assertEqual(svg.includes('Dropout'), true, 'VGG16 SVG 显示 Dropout');
});

test('生成 ResNet18 模板 SVG', function() {
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
  const svg = generateSvg(layout);

  assertEqual(svg.includes('<svg'), true, 'ResNet18 SVG 包含 svg 标签');
  assertEqual(svg.includes('ResNet18'), true, 'ResNet18 SVG 包含标题');
  assertEqual(svg.includes('Input'), true, 'ResNet18 SVG 包含 Input 层');
  assertEqual(svg.includes('Conv1'), true, 'ResNet18 SVG 包含 Conv1 层');
  assertEqual(svg.includes('Pool1'), true, 'ResNet18 SVG 包含 Pool1 层');
  assertEqual(svg.includes('k=7'), true, 'ResNet18 SVG 显示 Conv1 kernel 参数');
});

test('COLORS 包含 block 类型颜色', function() {
  assertEqual(COLORS.block_residual.fill, '#e8f0f8', 'residual fill');
  assertEqual(COLORS.block_residual.stroke, '#5990d9', 'residual stroke');
  assertEqual(COLORS.block_parallel.fill, '#e8f8f0', 'parallel fill');
  assertEqual(COLORS.block_parallel.stroke, '#59d9b5', 'parallel stroke');
  assertEqual(COLORS.block_stack.fill, '#f8f8e8', 'stack fill');
  assertEqual(COLORS.block_stack.stroke, '#d9b559', 'stack stroke');
});

test('COLORS 包含 rnn 层类型颜色', function() {
  assertEqual(COLORS.rnn.fill, '#f8ece0', 'rnn fill');
  assertEqual(COLORS.rnn.stroke, '#c07040', 'rnn stroke');
});

test('RNN 层渲染', function() {
  const layout = {
    width: 400,
    height: 120,
    title: { x: 200, y: 25, text: 'RNN Test' },
    sections: [],
    layers: [
      {name: 'RNN h0', type: 'rnn', x: 10, y: 40, width: 216, height: 126, data: {size: 256, act: 'tanh'}}
    ],
    connections: [],
    rowConnections: [],
    blocks: []
  };

  const svg = generateSvg(layout);
  assertEqual(svg.includes('<svg'), true, '包含 SVG 标签');
  assertEqual(svg.includes('RNN h0'), true, '包含层名称');
  assertEqual(svg.includes('#f8ece0'), true, '包含 rnn fill 颜色');
  assertEqual(svg.includes('#c07040'), true, '包含 rnn stroke 颜色');
  assertEqual(svg.includes('tanh'), true, '包含激活函数');
});

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
  assertEqual(svg.includes('stroke-dasharray'), true, '包含虚线边框');
});

test('生成 parallel block 多层分支 SVG', function() {
  // Inception 风格的多层分支
  const blockLayout = {
    name: 'Inception',
    type: 'parallel',
    x: 100,
    y: 50,
    width: 500,
    height: 300,
    titleY: 70,
    layers: [
      {id: 'branch1', name: '1x1', type: 'conv', x: 120, y: 90, width: 72, height: 42, data: {kernel: 1}},
      {id: 'branch2_reduce', name: '3x3_reduce', type: 'conv', x: 120, y: 140, width: 72, height: 42, data: {kernel: 1}},
      {id: 'branch2_conv', name: '3x3', type: 'conv', x: 220, y: 140, width: 72, height: 42, data: {kernel: 3}},
      {id: 'branch3', name: 'pool+1x1', type: 'pool', x: 120, y: 190, width: 72, height: 42, data: {kernel: 3}}
    ],
    forkPoint: {x: 110, y: 150},
    mergePoint: {x: 350, y: 150},
    branchLayerGroups: [
      [{id: 'branch1', name: '1x1', x: 120, y: 90, width: 72, height: 42}],
      [{id: 'branch2_reduce', x: 120, y: 140, width: 72, height: 42}, {id: 'branch2_conv', x: 220, y: 140, width: 72, height: 42}],
      [{id: 'branch3', x: 120, y: 190, width: 72, height: 42}]
    ]
  };

  const svg = generateBlock(blockLayout);
  assertEqual(svg.includes('Inception'), true, '包含 block 名称');
  assertEqual(svg.includes('1x1'), true, '包含分支名称');
  assertEqual(svg.includes('3x3'), true, '包含多层分支名称');
  // 验证有路径连接（fork 和 merge）
  assertEqual(svg.includes('path'), true, '包含连接路径');
});

test('生成 residual block SVG (arc style)', function() {
  const blockLayout = {
    name: 'ResBlock',
    type: 'residual',
    x: 100,
    y: 50,
    width: 300,
    height: 200,
    titleY: 70,
    skipStyle: 'arc',
    layers: [
      {id: 'conv1', name: 'Conv1', type: 'conv', x: 120, y: 90, width: 72, height: 42, data: {kernel: 3}},
      {id: 'conv2', name: 'Conv2', type: 'conv', x: 220, y: 90, width: 72, height: 42, data: {kernel: 3}}
    ],
    skipArc: {
      x1: 105,
      y1: 140,
      x2: 305,
      y2: 140,
      midY: 40
    }
  };

  const svg = generateBlock(blockLayout);
  assertEqual(svg.includes('rect'), true, '包含容器矩形');
  assertEqual(svg.includes('ResBlock'), true, '包含 block 名称');
  assertEqual(svg.includes('A'), true, '包含弧形路径');
});

test('生成 residual block SVG (parallel style)', function() {
  const blockLayout = {
    name: 'ResBlock2',
    type: 'residual',
    x: 100,
    y: 50,
    width: 300,
    height: 200,
    titleY: 70,
    skipStyle: 'parallel',
    layers: [
      {id: 'conv1', name: 'Conv1', type: 'conv', x: 120, y: 90, width: 72, height: 42, data: {kernel: 3}},
      {id: 'conv2', name: 'Conv2', type: 'conv', x: 220, y: 90, width: 72, height: 42, data: {kernel: 3}}
    ],
    skipLine: {
      x1: 105,
      y1: 260,
      x2: 305,
      y2: 260
    }
  };

  const svg = generateBlock(blockLayout);
  assertEqual(svg.includes('rect'), true, '包含容器矩形');
  assertEqual(svg.includes('ResBlock2'), true, '包含 block 名称');
  assertEqual(svg.includes('stroke-dasharray'), true, '包含虚线边框');
});

test('生成 stack block SVG', function() {
  const blockLayout = {
    name: 'EncoderBlock',
    type: 'stack',
    x: 100,
    y: 50,
    width: 200,
    height: 150,
    titleY: 70,
    repeat: 6,
    layers: [
      {id: 'ff1', name: 'FF1', type: 'fc', x: 120, y: 90, width: 72, height: 42, data: {size: 2048}},
      {id: 'ff2', name: 'FF2', type: 'fc', x: 120, y: 140, width: 72, height: 42, data: {size: 512}}
    ]
  };

  const svg = generateBlock(blockLayout);
  assertEqual(svg.includes('rect'), true, '包含容器矩形');
  assertEqual(svg.includes('EncoderBlock'), true, '包含 block 名称');
  assertEqual(svg.includes('×6'), true, '包含重复标记');
  assertEqual(svg.includes('stroke-dasharray'), true, '包含虚线边框');
});

test('生成 Transformer 模板 SVG', function() {
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
  const svg = generateSvg(layout);

  assertEqual(svg.includes('<svg'), true, 'Transformer SVG 包含 svg 标签');
  assertEqual(svg.includes('Transformer Encoder'), true, 'Transformer SVG 包含标题');
  assertEqual(svg.includes('Input'), true, 'Transformer SVG 包含 Input 层');
  assertEqual(svg.includes('Embedding'), true, 'Transformer SVG 包含 Embedding 层');
  assertEqual(svg.includes('512 tokens'), true, 'Transformer SVG 显示 Input size');
  assertEqual(svg.includes('#f8f8e8'), true, 'Transformer SVG 包含 embedding 层颜色');
});

test('生成含 blocks 的完整网络 SVG', function() {
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

// === 收缩块 SVG 生成测试 ===

test('生成收缩层 SVG (generateCollapsedLayer)', function() {
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

  // 收缩层不应包含文本元素
  assertEqual(!svg.includes('<text'), true, '收缩层不应包含文本元素');

  // 应包含 rect 元素
  assertEqual(svg.includes('<rect'), true, '收缩层应包含 rect 元素');

  // 应使用 conv 类型的颜色
  assertEqual(svg.includes('#e8f4f8'), true, '应使用 conv 填充色');
  assertEqual(svg.includes('#5ba5d9'), true, '应使用 conv 边框色');

  // 应包含圆角
  assertEqual(svg.includes('rx="4.8"'), true, '应包含圆角属性');
});

test('生成含收缩层的 block SVG', function() {
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

  // 应包含 block 标题
  assertEqual(svg.includes('TestBlock'), true, '应包含 block 名称');

  // 收缩层不应包含层名作为文本内容
  assertEqual(!svg.includes('>l1<') && !svg.includes('>l2<'), true, '收缩层不应包含层名作为文本内容');

  // 应包含虚线边框
  assertEqual(svg.includes('stroke-dasharray'), true, '应包含虚线边框');

  // 应包含 rect 元素
  assertEqual(svg.includes('<rect'), true, '应包含 rect 元素');
});