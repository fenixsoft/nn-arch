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