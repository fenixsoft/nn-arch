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