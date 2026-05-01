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