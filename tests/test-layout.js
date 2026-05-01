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

  // 检查第一层位置（放大 250%）
  const layerA = layout.layers.find(l => l.name === 'A');
  assertEqual(layerA.x, 52.5, 'A 层 x 坐标');
  assertEqual(layerA.y, 67.5, 'A 层 y 坐标');

  // 检查层间距（180 宽度 + 22.5 间距 = 202.5）
  const layerB = layout.layers.find(l => l.name === 'B');
  assertEqual(layerB.x - layerA.x, 202.5, 'A-B 层间距');
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

  // y 坐标应该有间距（105 高度 + 22.5 间距 = 127.5）
  assertEqual(layerHidden.y - layerInput.y, 127.5, '垂直布局层间距');
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
    layersAfterBlocks: []
  };

  const layout = calculateLayout(network);
  const layerA = layout.layers.find(l => l.name === 'A');
  const layerB = layout.layers.find(l => l.name === 'B');

  // 垂直布局中，x 坐标相同，y 坐标递增
  assertEqual(layerA.x, 52.5, 'A 层 x 坐标');
  assertEqual(layerB.x, 52.5, 'B 层 x 坐标（垂直布局 x 相同）');
  assertEqual(layerB.y - layerA.y, 127.5, 'A-B 层间距');
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

  // 箭头起点在 A 层右侧中间（52.5 + 180 = 232.5）
  assertEqual(conn.x1, 232.5, '箭头起点 x');
  // 箭头起点 y（67.5 + 105/2 = 120）
  assertEqual(conn.y1, 120, '箭头起点 y');
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
  // = 52.5 + 3*180 + 2*22.5 + 52.5 = 690
  assertEqual(layout.width, 690, '总宽度');

  // 总高度 = startY + 层高度 + startY
  // = 67.5 + 105 + 67.5 = 240
  assertEqual(layout.height, 240, '总高度');
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
  // 放大 250% 后的值
  assertEqual(LAYOUT_CONFIG.layerWidth, 180, '层宽度');
  assertEqual(LAYOUT_CONFIG.layerHeight, 105, '层高度');
  assertEqual(LAYOUT_CONFIG.layerGap, 22.5, '层间距');
  assertEqual(LAYOUT_CONFIG.startX, 52.5, '起始 X 坐标');
  assertEqual(LAYOUT_CONFIG.startY, 67.5, '起始 Y 坐标');
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
      {name: '特征提取器', layers: ['Input', 'Conv1', 'Conv2']},
      {name: '分类器', layers: ['FC1', 'Output']}
    ],
    blocks: [],
    connections: [],
    layersAfterBlocks: []
  };

  const layout = calculateLayout(network);
  assertEqual(layout.sections.length, 2, 'sections 数量');

  // 有 sections 时会换行布局
  const section1 = layout.sections[0];
  assertEqual(section1.name, '特征提取器', 'section 名称');
  assertEqual(section1.x, 30, 'section x 起点'); // 52.5 - 22.5 (padding)

  // 验证行间连接存在
  assertEqual(layout.rowConnections.length, 1, '行间连接数量');
});

// === 模板布局测试 ===

test('计算 VGG16 模板布局（换行）', function() {
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
  assertEqual(layout.sections.length, 2, 'VGG16 sections 分组数量');

  // 验证所有层都有有效坐标
  const allLayersHaveCoords = layout.layers.every(l => l.x >= 0 && l.y >= 0);
  assertEqual(allLayersHaveCoords, true, 'VGG16 所有层都有有效坐标');

  // 验证行间连接存在（特征提取器 -> 分类器）
  assertEqual(layout.rowConnections.length, 1, 'VGG16 行间连接数量');
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

  // 验证初始层坐标（放大 250%）
  const inputLayer = layout.layers.find(l => l.name === 'Input');
  assertEqual(inputLayer !== undefined, true, 'ResNet18 Input 层存在');
  assertEqual(inputLayer.x, 52.5, 'ResNet18 Input 层 x 坐标');
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