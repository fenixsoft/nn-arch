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