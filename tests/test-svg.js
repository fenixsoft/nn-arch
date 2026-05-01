// === svg-generator.js 测试 ===

test('生成简单网络 SVG', function() {
  const layout = {
    width: 400,
    height: 120,
    title: { x: 200, y: 25, text: 'SimpleNet' },
    sections: [],
    layers: [
      {name: 'Input', type: 'input', x: 10, y: 40, width: 120, height: 70, data: {size: '10'}}
    ],
    connections: [],
    blocks: []
  };

  const svg = generateSvg(layout);
  assertEqual(svg.includes('<svg'), true, '包含 SVG 标签');
  assertEqual(svg.includes('SimpleNet'), true, '包含标题');
  assertEqual(svg.includes('Input'), true, '包含层名称');
});

test('SVG 包含箭头定义', function() {
  const layout = {
    width: 400,
    height: 120,
    title: { x: 200, y: 25, text: 'Test' },
    sections: [],
    layers: [
      {name: 'A', type: 'input', x: 10, y: 40, width: 120, height: 70, data: {}},
      {name: 'B', type: 'output', x: 145, y: 40, width: 120, height: 70, data: {}}
    ],
    connections: [
      {from: 'A', to: 'B', x1: 130, y1: 75, x2: 145, y2: 75, type: 'sequential'}
    ],
    blocks: []
  };

  const svg = generateSvg(layout);
  assertEqual(svg.includes('marker'), true, '包含箭头标记定义');
  assertEqual(svg.includes('<path'), true, '包含路径元素');
});

test('卷积层包含蓝色样式', function() {
  const layout = {
    width: 200, height: 120,
    title: { x: 100, y: 25, text: 'Test' },
    sections: [],
    layers: [{name: 'Conv1', type: 'conv', x: 10, y: 40, width: 120, height: 70, data: {kernel: 3, channels: 64}}],
    connections: [],
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
    layers: [{name: 'FC1', type: 'fc', x: 10, y: 40, width: 120, height: 70, data: {size: 1000}}],
    connections: [],
    blocks: []
  };
  const svg = generateSvg(layout);
  assertEqual(svg.includes('#e8f8f0'), true, '包含FC层背景色');
  assertEqual(svg.includes('#5bd9a5'), true, '包含FC层边框色');
});

// === 模板 SVG 生成测试 ===

test('生成 VGG16 模板 SVG', function() {
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