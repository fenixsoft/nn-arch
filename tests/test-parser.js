// === parser.js 测试 ===

// 简单 YAML 解析测试
test('解析简单层定义', function() {
  const yaml = `
name: SimpleNet
layers:
  - {name: Input, type: input, size: "224x224x3"}
  - {name: Output, type: output, size: 10}
`;
  const result = parseNetworkYaml(yaml);
  assertEqual(result.name, 'SimpleNet', '网络名称');
  assertEqual(result.layers.length, 2, '层数量');
  assertEqual(result.layers[0].name, 'Input', '第一层名称');
  assertEqual(result.layers[0].type, 'input', '第一层类型');
  assertEqual(result.layers[1].name, 'Output', '第二层名称');
});

test('解析卷积层完整参数', function() {
  const yaml = `
layers:
  - {name: Conv1, type: conv, kernel: 11, stride: 4, channels: 96, out: "55x55x96", act: ReLU}
`;
  const result = parseNetworkYaml(yaml);
  const conv = result.layers[0];
  assertEqual(conv.name, 'Conv1', '卷积层名称');
  assertEqual(conv.type, 'conv', '类型');
  assertEqual(conv.kernel, 11, 'kernel');
  assertEqual(conv.stride, 4, 'stride');
  assertEqual(conv.channels, 96, 'channels');
  assertEqual(conv.out, '55x55x96', '输出尺寸');
  assertEqual(conv.act, 'ReLU', '激活函数');
});

test('解析池化层参数', function() {
  const yaml = `
layers:
  - {name: Pool1, type: pool, kernel: 3, stride: 2, out: "27x27x64"}
`;
  const result = parseNetworkYaml(yaml);
  const pool = result.layers[0];
  assertEqual(pool.kernel, 3, 'pool kernel');
  assertEqual(pool.stride, 2, 'pool stride');
  assertEqual(pool.out, '27x27x64', 'pool out');
});

test('解析全连接层带 dropout', function() {
  const yaml = `
layers:
  - {name: FC1, type: fc, size: 4096, act: ReLU, dropout: true}
`;
  const result = parseNetworkYaml(yaml);
  const fc = result.layers[0];
  assertEqual(fc.size, 4096, 'fc size');
  assertEqual(fc.dropout, true, 'dropout');
});

test('解析 sections 分组', function() {
  const yaml = `
name: TestNet
sections:
  - name: 特征提取器
    layers: [Input, Conv1, Conv2]
  - name: 分类器
    layers: [FC1, Output]
layers:
  - {name: Input, type: input, size: "224x224x3"}
  - {name: Conv1, type: conv, kernel: 3, channels: 64}
  - {name: Conv2, type: conv, kernel: 3, channels: 64}
  - {name: FC1, type: fc, size: 1000}
  - {name: Output, type: output, size: 10}
`;
  const result = parseNetworkYaml(yaml);
  assertEqual(result.sections.length, 2, 'sections 数量');
  assertEqual(result.sections[0].name, '特征提取器', '第一个 section 名称');
  assertDeepEqual(result.sections[0].layers, ['Input', 'Conv1', 'Conv2'], '第一个 section 层列表');
});

test('解析 section row_label', function() {
  const yaml = `
name: TestNet
sections:
  - name: 特征提取器
    layers: [Input, Conv1]
    row_label: "Flatten: 9216"
  - name: 分类器
    layers: [FC1, Output]
layers:
  - {name: Input, type: input, size: "224x224x3"}
  - {name: Conv1, type: conv, kernel: 3, channels: 64}
  - {name: FC1, type: fc, size: 1000}
  - {name: Output, type: output, size: 10}
`;
  const result = parseNetworkYaml(yaml);
  assertEqual(result.sections[0].rowLabel, 'Flatten: 9216', 'section row_label');
  assertEqual(result.sections[1].rowLabel, null, '未定义 row_label 为 null');
});

test('层定义包含 id 属性', function() {
  const yaml = `
layers:
  - {id: layer_1, name: Input, type: input, size: "224x224x3"}
  - {name: Conv1, type: conv, kernel: 3, channels: 64}
`;
  const result = parseNetworkYaml(yaml);
  assertEqual(result.layers[0].id, 'layer_1', '显式指定的 id');
  assertEqual(result.layers[1].id, 'Conv1', '默认 id 使用 name');
});

test('sections.layers 使用 id 引用', function() {
  const yaml = `
name: TestNet
sections:
  - name: 特征提取器
    layers: [layer_1, layer_2]
  - name: 分类器
    layers: [layer_3]
layers:
  - {id: layer_1, name: Input, type: input, size: "224x224x3"}
  - {id: layer_2, name: Conv1, type: conv, kernel: 3, channels: 64}
  - {id: layer_3, name: FC1, type: fc, size: 1000}
`;
  const result = parseNetworkYaml(yaml);
  assertEqual(result.sections[0].layers[0], 'layer_1', 'section 使用 id 引用');
  assertEqual(result.sections[0].layers[1], 'layer_2', 'section 使用 id 引用');
  assertEqual(result.sections[1].layers[0], 'layer_3', 'section 使用 id 引用');
});

test('sections.layers 支持名称引用（自动转换为 id）', function() {
  const yaml = `
name: TestNet
sections:
  - name: 特征提取器
    layers: [Input, Conv1]  # 使用 name 引用，自动转换为 id
layers:
  - {id: input_id, name: Input, type: input, size: "224x224x3"}
  - {name: Conv1, type: conv, kernel: 3, channels: 64}
`;
  const result = parseNetworkYaml(yaml);
  assertEqual(result.sections[0].layers[0], 'input_id', 'name 引用转换为 id');
  assertEqual(result.sections[0].layers[1], 'Conv1', 'name 引用转换为默认 id');
});

test('id 重复时报错', function() {
  const yaml = `
layers:
  - {id: duplicate_id, name: Layer1, type: input}
  - {id: duplicate_id, name: Layer2, type: conv}
`;
  try {
    parseNetworkYaml(yaml);
    throw new Error('应该抛出异常但没有');
  } catch (e) {
    if (!e.message.includes('id 重复')) {
      throw new Error('错误信息应包含 id 重复: ' + e.message);
    }
  }
});

test('生成顺序连接', function() {
  const yaml = `
layers:
  - {name: A, type: input, size: "10"}
  - {name: B, type: conv, kernel: 3, channels: 64}
  - {name: C, type: output, size: 10}
`;
  const result = parseNetworkYaml(yaml);
  assertEqual(result.connections.length, 2, '连接数量');
  assertEqual(result.connections[0].from, 'A', '第一个连接起点');
  assertEqual(result.connections[0].to, 'B', '第一个连接终点');
  assertEqual(result.connections[1].from, 'B', '第二个连接起点');
  assertEqual(result.connections[1].to, 'C', '第二个连接终点');
});

test('解析残差块', function() {
  const yaml = `
layers:
  - {name: Input, type: input, size: "224x224x3"}
blocks:
  - name: ResBlock1
    type: residual
    main:
      - {name: conv1, type: conv, kernel: 3, channels: 64, act: ReLU}
      - {name: conv2, type: conv, kernel: 3, channels: 64}
    skip: identity
    merge: add
    act: ReLU
`;
  const result = parseNetworkYaml(yaml);
  assertEqual(result.blocks.length, 1, 'blocks 数量');
  const block = result.blocks[0];
  assertEqual(block.name, 'ResBlock1', 'block 名称');
  assertEqual(block.type, 'residual', 'block 类型');
  assertEqual(block.main.length, 2, 'main 路径层数');
  assertEqual(block.skip, 'identity', 'skip 类型');
  assertEqual(block.merge, 'add', 'merge 类型');
});

test('解析并行块', function() {
  const yaml = `
blocks:
  - name: MultiHead
    type: parallel
    branches:
      - {name: Q, type: fc, size: 64}
      - {name: K, type: fc, size: 64}
      - {name: V, type: fc, size: 64}
    merge: concat
`;
  const result = parseNetworkYaml(yaml);
  const block = result.blocks[0];
  assertEqual(block.type, 'parallel', 'block 类型');
  assertEqual(block.branches.length, 3, '分支数量');
  assertEqual(block.branches[0].name, 'Q', '第一个分支名称');
  assertEqual(block.merge, 'concat', 'merge 类型');
});

test('解析重复块（stack）', function() {
  const yaml = `
blocks:
  - name: EncoderBlock
    type: stack
    repeat: 6
    layers:
      - {name: FF1, type: fc, size: 2048}
      - {name: FF2, type: fc, size: 512}
`;
  const result = parseNetworkYaml(yaml);
  const block = result.blocks[0];
  assertEqual(block.type, 'stack', 'block 类型');
  assertEqual(block.repeat, 6, '重复次数');
  assertEqual(block.layers.length, 2, '内部层数量');
});

test('解析无效 YAML 报错', function() {
  const yaml = `
layers:
  - {name: Test, type: conv
`;  // 缺少闭合括号
  try {
    parseNetworkYaml(yaml);
    throw new Error('应该抛出异常但没有');
  } catch (e) {
    if (!e.message.includes('YAML')) {
      throw new Error('错误信息应包含 YAML: ' + e.message);
    }
  }
});

test('空输入报错', function() {
  try {
    parseNetworkYaml('');
    throw new Error('应该抛出异常但没有');
  } catch (e) {
    assertEqual(e.message, 'YAML 解析错误: 输入为空', '空输入错误信息');
  }
});

test('解析结果为空报错', function() {
  try {
    parseNetworkYaml('# comment only');
    throw new Error('应该抛出异常但没有');
  } catch (e) {
    assertEqual(e.message, 'YAML 解析错误: 解析结果为空', '空结果错误信息');
  }
});

// === 模板测试 ===

test('解析 VGG16 模板', function() {
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

  const result = parseNetworkYaml(vgg16Yaml);
  assertEqual(result.name, 'VGG16', 'VGG16 网络名称');
  assertEqual(result.layers.length, 23, 'VGG16 层数量（应为 23）');
  assertEqual(result.sections.length, 2, 'VGG16 sections 数量');
  assertEqual(result.sections[0].name, '特征提取器', 'VGG16 第一个 section');
  assertEqual(result.sections[0].layers.length, 19, 'VGG16 特征提取器层数');
  assertEqual(result.sections[1].name, '分类器', 'VGG16 第二个 section');
  assertEqual(result.sections[1].layers.length, 4, 'VGG16 分类器层数');
  assertEqual(result.connections.length, 22, 'VGG16 连接数量');
});

test('解析 ResNet18 模板', function() {
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

  - name: ResBlock2
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

  const result = parseNetworkYaml(resnet18Yaml);
  assertEqual(result.name, 'ResNet18', 'ResNet18 网络名称');
  assertEqual(result.layers.length, 3, 'ResNet18 初始层数量');
  assertEqual(result.blocks.length, 2, 'ResNet18 blocks 数量');
  assertEqual(result.blocks[0].type, 'residual', 'ResNet18 第一个 block 类型');
  assertEqual(result.blocks[0].main.length, 2, 'ResNet18 block main 路径层数');
  assertEqual(result.layersAfterBlocks.length, 3, 'ResNet18 layers_after_blocks 数量');
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

test('解析 Transformer 模板', function() {
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
      - name: MultiHeadAttention
        type: parallel
        branches:
          - {name: Q, type: fc, size: 64}
          - {name: K, type: fc, size: 64}
          - {name: V, type: fc, size: 64}
        merge: concat
      - {name: AttnOut, type: fc, size: 512}
      - name: AddNorm1
        type: residual
        skip: identity
        merge: add
        norm: layer
      - {name: FF1, type: fc, size: 2048, act: ReLU}
      - {name: FF2, type: fc, size: 512}
      - name: AddNorm2
        type: residual
        skip: identity
        merge: add
        norm: layer

layers_after_blocks:
  - {name: Output, type: output, size: 10000}`;

  const result = parseNetworkYaml(transformerYaml);
  assertEqual(result.name, 'Transformer Encoder', 'Transformer 网络名称');
  assertEqual(result.layers.length, 2, 'Transformer 初始层数量');
  assertEqual(result.layers[0].type, 'input', 'Transformer Input 层类型');
  assertEqual(result.layers[1].type, 'embedding', 'Transformer Embedding 层类型');
  assertEqual(result.blocks.length, 1, 'Transformer blocks 数量');
  assertEqual(result.blocks[0].type, 'stack', 'Transformer block 类型');
  assertEqual(result.blocks[0].repeat, 6, 'Transformer block 重复次数');
  assertEqual(result.layersAfterBlocks.length, 1, 'Transformer layers_after_blocks 数量');
});

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

// === 模板属性测试 ===

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