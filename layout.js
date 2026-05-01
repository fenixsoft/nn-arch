/**
 * 布局算法
 * 计算网络各层在 SVG 中的位置坐标
 */

// 样式参数常量（放大 250%）
const LAYOUT_CONFIG = {
  layerWidth: 180,       // 72 * 2.5
  layerHeight: 105,      // 42 * 2.5
  layerGap: 22.5,        // 9 * 2.5
  arrowLength: 22.5,     // 9 * 2.5
  sectionPadding: 22.5,  // 9 * 2.5
  fontSizeName: 21,      // 8.4 * 2.5
  fontSizeDetail: 18,    // 7.2 * 2.5
  fontSizeTitle: 30,     // 12 * 2.5
  fontSizeSection: 21,   // 8.4 * 2.5
  titleGap: 15,          // 标题与内容的间隙
  sectionTitleGap: 12,   // section 标题与层之间的间隙
  rowGap: 60,            // 行间距（用于换行时的连线区域）
  startX: 52.5,          // 21 * 2.5
  startY: 67.5           // 27 * 2.5
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
    rowConnections: [],  // 行间连线
    blocks: []
  };

  // 根据布局类型计算
  if (network.layout === 'horizontal' || network.layout === 'auto') {
    calculateHorizontalLayout(network, layout);
  } else if (network.layout === 'vertical') {
    calculateVerticalLayout(network, layout);
  }

  return layout;
}

/**
 * 计算水平布局（支持换行）
 */
function calculateHorizontalLayout(network, layout) {
  let currentX = LAYOUT_CONFIG.startX;
  let currentY = LAYOUT_CONFIG.startY;
  const layerHeight = LAYOUT_CONFIG.layerHeight;
  const layerWidth = LAYOUT_CONFIG.layerWidth;

  // 如果有 sections，按 sections 分行布局
  if (network.sections && network.sections.length > 0) {
    calculateSectionsLayout(network, layout);
    return;
  }

  // 无 sections 时，单行布局
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

    currentX += layerWidth + LAYOUT_CONFIG.layerGap;
  });

  // 计算总尺寸
  const lastLayer = layout.layers[layout.layers.length - 1];
  layout.width = lastLayer ? lastLayer.x + lastLayer.width + LAYOUT_CONFIG.startX : LAYOUT_CONFIG.startX * 2;
  layout.height = currentY + layerHeight + LAYOUT_CONFIG.startY;

  // 计算标题位置（居中，下方留空隙）
  layout.title.x = layout.width / 2;
  layout.title.y = LAYOUT_CONFIG.fontSizeTitle + LAYOUT_CONFIG.titleGap;

  // 计算连接箭头
  layout.connections = calculateConnections(layout.layers);
}

/**
 * 按 sections 分行布局
 */
function calculateSectionsLayout(network, layout) {
  const layerHeight = LAYOUT_CONFIG.layerHeight;
  const layerWidth = LAYOUT_CONFIG.layerWidth;
  let currentRow = 0;
  let currentY = LAYOUT_CONFIG.startY;

  // 计算标题位置
  layout.title.y = LAYOUT_CONFIG.fontSizeTitle + LAYOUT_CONFIG.titleGap;

  // 按 sections 分行
  network.sections.forEach((section, sectionIndex) => {
    const sectionLayerNames = section.layers;
    const rowStartX = LAYOUT_CONFIG.startX;
    let currentX = rowStartX;

    // section 的起始 Y（包含标题空间）
    const sectionStartY = currentY;
    const sectionTitleY = currentY + LAYOUT_CONFIG.fontSizeSection + LAYOUT_CONFIG.sectionTitleGap / 2;

    // 记录该 section 的层
    const sectionLayers = [];
    sectionLayerNames.forEach(layerName => {
      const layerData = network.layers.find(l => l.name === layerName);
      if (layerData) {
        const layer = {
          name: layerData.name,
          type: layerData.type,
          x: currentX,
          y: sectionTitleY + LAYOUT_CONFIG.fontSizeSection + LAYOUT_CONFIG.sectionTitleGap,
          width: layerWidth,
          height: layerHeight,
          data: layerData,
          sectionIndex: sectionIndex
        };
        layout.layers.push(layer);
        sectionLayers.push(layer);
        currentX += layerWidth + LAYOUT_CONFIG.layerGap;
      }
    });

    // 计算 section 框位置
    if (sectionLayers.length > 0) {
      const minX = Math.min(...sectionLayers.map(l => l.x)) - LAYOUT_CONFIG.sectionPadding;
      const maxX = Math.max(...sectionLayers.map(l => l.x + l.width)) + LAYOUT_CONFIG.sectionPadding;
      const minY = sectionStartY;
      const maxY = Math.max(...sectionLayers.map(l => l.y + l.height)) + LAYOUT_CONFIG.sectionPadding;

      layout.sections.push({
        name: section.name,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        titleY: sectionTitleY,
        strokeColor: sectionIndex % 2 === 0 ? '#b8d8e8' : '#b8e8c8'  // 蓝色/绿色交替
      });

      // 更新下一行的起始 Y
      currentY = maxY + LAYOUT_CONFIG.rowGap;
      currentRow++;
    }
  });

  // 计算各 section 内的连接
  layout.connections = calculateConnections(layout.layers);

  // 计算行间连接（从一个 section 的最后一层到下一个 section 的第一层）
  for (let i = 0; i < layout.sections.length - 1; i++) {
    const currentSection = layout.sections[i];
    const nextSection = layout.sections[i + 1];

    // 找到当前 section 的最后一层和下一个 section 的第一层
    const currentSectionLayers = layout.layers.filter(l => l.sectionIndex === i);
    const nextSectionLayers = layout.layers.filter(l => l.sectionIndex === i + 1);

    if (currentSectionLayers.length > 0 && nextSectionLayers.length > 0) {
      const fromLayer = currentSectionLayers[currentSectionLayers.length - 1];
      const toLayer = nextSectionLayers[0];

      // 计算连线位置（垂直连线）
      const fromX = fromLayer.x + fromLayer.width / 2;
      const fromY = fromLayer.y + fromLayer.height;
      const toX = toLayer.x + toLayer.width / 2;
      const toY = toLayer.y;

      layout.rowConnections.push({
        from: fromLayer.name,
        to: toLayer.name,
        x1: fromX,
        y1: fromY,
        x2: toX,
        y2: toY,
        label: `Flatten: ${calculateFlattenSize(fromLayer.data)}`,
        labelX: fromX + LAYOUT_CONFIG.layerGap,
        labelY: fromY + (toY - fromY) / 2
      });
    }
  }

  // 计算总尺寸
  const maxX = Math.max(...layout.layers.map(l => l.x + l.width));
  const maxY = Math.max(...layout.sections.map(s => s.y + s.height));
  layout.width = maxX + LAYOUT_CONFIG.startX;
  layout.height = maxY + LAYOUT_CONFIG.startY;
  layout.title.x = layout.width / 2;
}

/**
 * 计算 Flatten 尺寸（估算）
 */
function calculateFlattenSize(layerData) {
  if (layerData.out) {
    // 解析输出尺寸，计算元素总数
    const parts = layerData.out.split(/[xX×]/);
    if (parts.length >= 2) {
      const total = parts.reduce((sum, p) => sum * parseInt(p.trim()), 1);
      if (total > 0) return total;
    }
  }
  return 'N/A';
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
  layout.title.x = layout.width / 2;
  layout.title.y = LAYOUT_CONFIG.fontSizeTitle + LAYOUT_CONFIG.titleGap;

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

    // 只连接同一 section 内的层（sectionIndex 相同或都无 sectionIndex）
    if (from.sectionIndex !== undefined && to.sectionIndex !== undefined && from.sectionIndex !== to.sectionIndex) {
      continue;
    }

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
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateLayout,
    LAYOUT_CONFIG
  };
}