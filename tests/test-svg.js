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