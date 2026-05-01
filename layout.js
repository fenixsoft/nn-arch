/**
 * 布局算法
 * 计算网络各层在 SVG 中的位置坐标
 */

// 样式参数常量
const LAYOUT_CONFIG = {
  layerWidth: 120,
  layerHeight: 70,
  layerGap: 15,
  arrowLength: 15,
  sectionPadding: 10,
  fontSizeName: 14,
  fontSizeDetail: 12,
  fontSizeTitle: 20,
  fontSizeSection: 14,
  startX: 10,
  startY: 20
};

/**
 * 计算网络布局
 * @param {object} network - 解析后的网络定义
 * @returns {object} 布局结果，包含各层坐标和总尺寸
 */
function calculateLayout(network) {
  const layout = {
    width: 0,
    height: 0,
    title: { x: 0, y: 0, text: network.name },
    sections: [],
    layers: [],
    connections: [],
    blocks: []
  };

  // 计算标题位置
  layout.title.y = LAYOUT_CONFIG.fontSizeTitle + 5;

  // 根据布局类型计算
  if (network.layout === 'horizontal' || network.layout === 'auto') {
    calculateHorizontalLayout(network, layout);
  } else if (network.layout === 'vertical') {
    calculateVerticalLayout(network, layout);
  }

  return layout;
}

/**
 * 计算水平布局
 */
function calculateHorizontalLayout(network, layout) {
  let currentX = LAYOUT_CONFIG.startX;
  let currentY = LAYOUT_CONFIG.startY;
  const layerHeight = LAYOUT_CONFIG.layerHeight;

  // 计算各层位置
  network.layers.forEach((layer, index) => {
    layout.layers.push({
      name: layer.name,
      type: layer.type,
      x: currentX,
      y: currentY,
      width: LAYOUT_CONFIG.layerWidth,
      height: layerHeight,
      data: layer
    });

    currentX += LAYOUT_CONFIG.layerWidth + LAYOUT_CONFIG.layerGap;
  });

  // 计算总宽度（去掉最后一个间距，加上起始边距）
  const lastLayer = layout.layers[layout.layers.length - 1];
  layout.width = lastLayer ? lastLayer.x + lastLayer.width + LAYOUT_CONFIG.startX : LAYOUT_CONFIG.startX * 2;
  layout.height = currentY + layerHeight + LAYOUT_CONFIG.startY;

  // 计算连接箭头位置
  layout.connections = calculateConnections(layout.layers);
}

/**
 * 计算垂直布局
 */
function calculateVerticalLayout(network, layout) {
  let currentX = LAYOUT_CONFIG.startX;
  let currentY = layout.title.y + 15;
  const layerWidth = LAYOUT_CONFIG.layerWidth;
  const layerHeight = LAYOUT_CONFIG.layerHeight;

  network.layers.forEach((layer, index) => {
    layout.layers.push({
      name: layer.name,
      type: layer.type,
      x: currentX,
      y: currentY,
      width: layerWidth,
      height: layerHeight,
      data: layer
    });

    currentY += layerHeight + LAYOUT_CONFIG.layerGap;
  });

  layout.width = currentX + layerWidth + LAYOUT_CONFIG.startX;
  layout.height = currentY + LAYOUT_CONFIG.startY;

  layout.connections = calculateConnections(layout.layers, 'vertical');
}

/**
 * 计算连接箭头位置
 */
function calculateConnections(layers, direction = 'horizontal') {
  const connections = [];

  for (let i = 0; i < layers.length - 1; i++) {
    const from = layers[i];
    const to = layers[i + 1];

    if (direction === 'horizontal') {
      connections.push({
        from: from.name,
        to: to.name,
        x1: from.x + from.width,
        y1: from.y + from.height / 2,
        x2: to.x,
        y2: to.y + to.height / 2,
        type: 'sequential'
      });
    } else {
      connections.push({
        from: from.name,
        to: to.name,
        x1: from.x + from.width / 2,
        y1: from.y + from.height,
        x2: to.x + to.width / 2,
        y2: to.y,
        type: 'sequential'
      });
    }
  }

  return connections;
}

// 导出模块
module.exports = {
  calculateLayout,
  LAYOUT_CONFIG
};