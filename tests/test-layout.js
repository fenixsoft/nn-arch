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
    layersAfterBlocks: []
  };

  const layout = calculateLayout(network);
  assertEqual(layout.layers.length, 3, '布局层数量');

  // 检查第一层位置
  const layerA = layout.layers.find(l => l.name === 'A');
  assertEqual(layerA.x, 21, 'A 层 x 坐标');
  assertEqual(layerA.y, 27, 'A 层 y 坐标');

  // 检查层间距
  const layerB = layout.layers.find(l => l.name === 'B');
  assertEqual(layerB.x - layerA.x, 81, 'A-B 层间距（72宽度 + 9间距）');
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
    layersAfterBlocks: []
  };

  const layout = calculateLayout(network);
  assertEqual(layout.layers.length, 3, '布局层数量');

  const layerInput = layout.layers.find(l => l.name === 'Input');
  const layerHidden = layout.layers.find(l => l.name === 'Hidden');

  // 垂直布局应该有相同的 x 坐标
  assertEqual(layerInput.x, layerHidden.x, '垂直布局 x 坐标相同');

  // y 坐标应该有间距
  assertEqual(layerHidden.y - layerInput.y, 51, '垂直布局层间距（42高度 + 9间距）');
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
    layersAfterBlocks: []
  };

  const layout = calculateLayout(network);
  assertEqual(layout.connections.length, 1, '连接数量');

  const conn = layout.connections[0];
  assertEqual(conn.from, 'A', '连接起点层');
  assertEqual(conn.to, 'B', '连接终点层');
  assertEqual(conn.type, 'sequential', '连接类型');

  // 箭头起点在 A 层右侧中间
  assertEqual(conn.x1, 93, '箭头起点 x'); // 21 + 72
  assertEqual(conn.y1, 48, '箭头起点 y'); // 27 + 42/2
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
    layersAfterBlocks: []
  };

  const layout = calculateLayout(network);

  // 总宽度 = startX + 3层 + 2间距 + startX
  // = 21 + 3*72 + 2*9 + 21 = 276
  assertEqual(layout.width, 276, '总宽度');

  // 总高度 = startY + 层高度 + startY
  // = 27 + 42 + 27 = 96
  assertEqual(layout.height, 96, '总高度');
});

test('处理空网络', function() {
  const network = {
    name: 'EmptyNet',
    layout: 'horizontal',
    layers: [],
    sections: [],
    blocks: [],
    connections: [],
    layersAfterBlocks: []
  };

  const layout = calculateLayout(network);
  assertEqual(layout.layers.length, 0, '空网络层列表');
  assertEqual(layout.connections.length, 0, '空网络连接列表');
});

test('布局配置常量正确', function() {
  assertEqual(LAYOUT_CONFIG.layerWidth, 72, '层宽度');
  assertEqual(LAYOUT_CONFIG.layerHeight, 42, '层高度');
  assertEqual(LAYOUT_CONFIG.layerGap, 9, '层间距');
  assertEqual(LAYOUT_CONFIG.startX, 21, '起始 X 坐标');
  assertEqual(LAYOUT_CONFIG.startY, 27, '起始 Y 坐标');
});

test('计算 sections 分组区域位置', function() {
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
      {name: '特征提取器', layers: ['Input', 'Conv1', 'Conv2']},
      {name: '分类器', layers: ['FC1', 'Output']}
    ],
    blocks: [],
    connections: [],
    layersAfterBlocks: []
  };

  const layout = calculateLayout(network);
  assertEqual(layout.sections.length, 2, 'sections 数量');

  // 第一个 section 应包含 Input, Conv1, Conv2
  const section1 = layout.sections[0];
  assertEqual(section1.name, '特征提取器', 'section 名称');
  assertEqual(section1.x, 12, 'section x 起点'); // 21 - 9 (padding)
  assertEqual(section1.y, 17, 'section y 起点'); // titleBottom (17)
});

// === 模板布局测试 ===

test('计算 VGG16 模板布局', function() {
  const vgg16Yaml = `name: VGG16
layout: horizontal

sections:
  - name: 特征提取器
    layers: [Input, Conv1_1, Conv1_2, Pool1, Conv2_1, Conv2_2, Pool2, Conv3_1, Conv3_2, Conv3_3, Pool3, Conv4_1, Conv4_2, Conv4_3, Pool4, Conv5_1, Conv5_2, Conv5_3, Pool5]
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
  assertEqual(layout.connections.length, 22, 'VGG16 布局连接数量');
  assertEqual(layout.sections.length, 2, 'VGG16 sections 分组数量');

  // 验证所有层都有有效坐标
  const allLayersHaveCoords = layout.layers.every(l => l.x >= 0 && l.y >= 0);
  assertEqual(allLayersHaveCoords, true, 'VGG16 所有层都有有效坐标');

  // 验证总尺寸合理（23层 * 72宽度 + 22间距 + 边距）
  const expectedMinWidth = 21 + 23 * 72 + 22 * 9 + 21;
  assertEqual(layout.width >= expectedMinWidth, true, 'VGG16 总宽度足够');
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

  // ResNet18 当前基础实现只处理 layers
  assertEqual(layout.layers.length, 3, 'ResNet18 初始层布局数量');
  assertEqual(layout.connections.length, 2, 'ResNet18 初始层连接数量');

  // 验证初始层坐标
  const inputLayer = layout.layers.find(l => l.name === 'Input');
  assertEqual(inputLayer !== undefined, true, 'ResNet18 Input 层存在');
  assertEqual(inputLayer.x, 21, 'ResNet18 Input 层 x 坐标');
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

  // Transformer 当前基础实现只处理 layers
  assertEqual(layout.layers.length, 2, 'Transformer 初始层布局数量');
  assertEqual(layout.connections.length, 1, 'Transformer 初始层连接数量');

  // 验证层类型正确
  const embeddingLayer = layout.layers.find(l => l.name === 'Embedding');
  assertEqual(embeddingLayer !== undefined, true, 'Transformer Embedding 层存在');
  assertEqual(embeddingLayer.type, 'embedding', 'Transformer Embedding 层类型');
});