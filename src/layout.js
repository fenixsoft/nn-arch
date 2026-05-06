/**
 * 布局算法
 * 计算网络各层在 SVG 中的位置坐标
 */

// 样式参数常量（放大 300%，箭头缩小 50%）
const LAYOUT_CONFIG = {
  layerWidth: 216,       // 72 * 3
  layerHeight: 126,      // 42 * 3
  layerGap: 27,          // 9 * 3
  arrowLength: 27,       // 9 * 3
  sectionPadding: 27,    // 9 * 3
  fontSizeName: 25.2,    // 8.4 * 3
  fontSizeDetail: 21.6,  // 7.2 * 3
  fontSizeTitle: 36,     // 12 * 3
  fontSizeSection: 25.2, // 8.4 * 3
  titleGap: 18,          // 标题与内容的间隙
  sectionTitleGap: 5,    // section 标题与层之间的间隙
  rowGap: 87,            // 行间距（用于换行时的连线区域）
  rowWrapGap: 20,        // 换行时额外增加的间距
  startX: 63,            // 21 * 3
  startY: 81,            // 27 * 3 - 顶部边距
  bottomPadding: 6,      // 2 * 3 - 底部边距（不超过2px）
  maxLayersPerRow: 6,    // 每行最多放置的层数量
  // Block layout constants
  blockPadding: 27,      // block 内边距
  blockTitleGap: 18,     // block 标题与内容间距
  branchGap: 27,         // 并行分支间距
  arcRadius: 40,         // 跳线弧线半径
  stackLoopGap: 36       // stack 循环间距
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
  layout.height = currentY + layerHeight + LAYOUT_CONFIG.bottomPadding;

  // 计算标题位置（居中，下方留空隙）
  layout.title.x = layout.width / 2;
  layout.title.y = LAYOUT_CONFIG.fontSizeTitle + LAYOUT_CONFIG.titleGap;

  // 计算连接箭头
  layout.connections = calculateConnections(layout.layers);
}

/**
 * 按 sections 分行布局（每个 section 内支持换行）
 */
function calculateSectionsLayout(network, layout) {
  const layerHeight = LAYOUT_CONFIG.layerHeight;
  const layerWidth = LAYOUT_CONFIG.layerWidth;
  let currentY = LAYOUT_CONFIG.startY;

  // 计算标题位置
  layout.title.y = LAYOUT_CONFIG.fontSizeTitle + LAYOUT_CONFIG.titleGap;

  // 按 sections 分行
  network.sections.forEach((section, sectionIndex) => {
    const sectionLayerIds = section.layers;
    const rowStartX = LAYOUT_CONFIG.startX;

    // section 的起始 Y（包含标题空间）
    const sectionStartY = currentY;
    const sectionTitleY = currentY + LAYOUT_CONFIG.fontSizeSection + LAYOUT_CONFIG.sectionTitleGap / 2;

    // 记录该 section 的层
    const sectionLayers = [];
    let layerStartY = sectionTitleY + LAYOUT_CONFIG.fontSizeSection + LAYOUT_CONFIG.sectionTitleGap;
    let currentX = rowStartX;
    let rowCount = 0;

    // 将层分配到多行（每行最多 maxLayersPerRow 个）
    sectionLayerIds.forEach((layerId, idx) => {
      const layerData = network.layers.find(l => l.id === layerId || l.name === layerId);
      if (layerData) {
        // 检查是否需要换行
        const positionInRow = idx % LAYOUT_CONFIG.maxLayersPerRow;
        if (positionInRow === 0 && idx > 0) {
          // 换行，增加额外的换行间距
          rowCount++;
          currentX = rowStartX;
          layerStartY += layerHeight + LAYOUT_CONFIG.layerGap + LAYOUT_CONFIG.rowWrapGap;
        }

        const layer = {
          name: layerData.name,
          type: layerData.type,
          x: currentX,
          y: layerStartY,
          width: layerWidth,
          height: layerHeight,
          data: layerData,
          sectionIndex: sectionIndex,
          rowIndex: rowCount
        };
        layout.layers.push(layer);
        sectionLayers.push(layer);
        currentX += layerWidth + LAYOUT_CONFIG.layerGap;
      }
    });

    // 计算 section 框位置（可能包含多行）
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
        strokeColor: sectionIndex % 2 === 0 ? '#b8d8e8' : '#b8e8c8',  // 蓝色/绿色交替
        rowCount: rowCount + 1
      });

      // 更新下一 section 的起始 Y
      currentY = maxY + LAYOUT_CONFIG.rowGap;
    }
  });

  // 计算各 section 内的连接
  layout.connections = calculateConnections(layout.layers);

  // 计算 section 内换行的折线连接
  layout.sectionRowConnections = [];
  layout.sections.forEach((section, sectionIndex) => {
    const sectionLayers = layout.layers.filter(l => l.sectionIndex === sectionIndex);
    if (section.rowCount > 1) {
      // 有多行，需要计算行间连接
      for (let row = 0; row < section.rowCount - 1; row++) {
        const rowLayers = sectionLayers.filter(l => l.rowIndex === row);
        const nextRowLayers = sectionLayers.filter(l => l.rowIndex === row + 1);

        if (rowLayers.length > 0 && nextRowLayers.length > 0) {
          const fromLayer = rowLayers[rowLayers.length - 1]; // 当前行最后一个
          const toLayer = nextRowLayers[0]; // 下一行第一个

          // 折线连接：从当前行最后元素底部 -> 中间 -> 下一行第一个元素顶部
          const fromX = fromLayer.x + fromLayer.width / 2;
          const fromY = fromLayer.y + fromLayer.height;
          const toX = toLayer.x + toLayer.width / 2;
          const toY = toLayer.y;
          const midY = fromY + (toY - fromY) / 2;

          layout.sectionRowConnections.push({
            from: fromLayer.name,
            to: toLayer.name,
            fromX: fromX,
            fromY: fromY,
            midY: midY,
            toX: toX,
            toY: toY,
            sectionIndex: sectionIndex
          });
        }
      }
    }
  });

  // 计算行间连接（折线：从上一section底部到下一section顶部）
  for (let i = 0; i < layout.sections.length - 1; i++) {
    const currentSection = layout.sections[i];
    const nextSection = layout.sections[i + 1];

    // 找到当前 section 的最后一层和下一个 section 的第一层
    const currentSectionLayers = layout.layers.filter(l => l.sectionIndex === i);
    const nextSectionLayers = layout.layers.filter(l => l.sectionIndex === i + 1);

    if (currentSectionLayers.length > 0 && nextSectionLayers.length > 0) {
      const fromLayer = currentSectionLayers[currentSectionLayers.length - 1];
      const toLayer = nextSectionLayers[0];

      // 折线连接的关键点
      const fromX = fromLayer.x + fromLayer.width / 2;
      const fromY = fromLayer.y + fromLayer.height;

      // 下一个 section 顶部中心位置
      const toX = nextSection.x + nextSection.width / 2;
      const toY = nextSection.y;

      // 中间转折点
      const midY = fromY + (toY - fromY) / 2;

      // 从 section 定义或 network 获取标注
      const rowLabel = network.sections[i].rowLabel || network.rowLabels[i] || '';

      layout.rowConnections.push({
        from: fromLayer.name,
        to: toLayer.name,
        fromX: fromX,
        fromY: fromY,
        midY: midY,
        toX: toX,
        toY: toY,
        label: rowLabel,
        labelX: Math.max(fromX, toX) + LAYOUT_CONFIG.layerGap,
        labelY: midY
      });
    }
  }

  // 计算总尺寸
  const maxX = Math.max(...layout.layers.map(l => l.x + l.width));
  const maxY = Math.max(...layout.sections.map(s => s.y + s.height));
  layout.width = maxX + LAYOUT_CONFIG.startX;
  layout.height = maxY + LAYOUT_CONFIG.bottomPadding;
  layout.title.x = layout.width / 2;
}

/**
 * 计算垂直布局
 */
function calculateVerticalLayout(network, layout) {
  let currentX = LAYOUT_CONFIG.startX;
  let currentY = layout.title.y + 18;
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
  layout.height = currentY + LAYOUT_CONFIG.bottomPadding;
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

    // 只连接同一 row 内的层（rowIndex 相同）
    if (from.rowIndex !== undefined && to.rowIndex !== undefined && from.rowIndex !== to.rowIndex) {
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

/**
 * 计算 block 布局
 * @param {object} block - block 定义
 * @param {number} startX - 起始 X 坐标
 * @param {number} startY - 起始 Y 坐标
 * @returns {object} block 布局结果
 */
function calculateBlockLayout(block, startX, startY) {
  const layout = {
    name: block.name,
    type: block.type,
    style: block.style,
    expand: block.expand,
    repeat: block.repeat,
    merge: block.merge,
    act: block.act,
    norm: block.norm,
    x: startX,
    y: startY,
    width: 0,
    height: 0,
    titleY: startY + LAYOUT_CONFIG.fontSizeSection + LAYOUT_CONFIG.blockTitleGap / 2,
    layers: [],
    connections: [],
    skipConnection: null,
    forkPoint: null,
    mergePoint: null
  };

  // 根据类型调用不同的布局计算
  switch (block.type) {
    case 'parallel':
      calculateParallelBlockLayout(block, layout, startX, startY);
      break;
    case 'residual':
      calculateResidualBlockLayout(block, layout, startX, startY);
      break;
    case 'stack':
      calculateStackBlockLayout(block, layout, startX, startY);
      break;
    default:
      // 未知类型，返回空布局
      break;
  }

  return layout;
}

/**
 * 计算 parallel block 布局
 * 分支垂直堆叠
 */
function calculateParallelBlockLayout(block, layout, startX, startY) {
  const layerWidth = LAYOUT_CONFIG.layerWidth;
  const layerHeight = LAYOUT_CONFIG.layerHeight;
  const branchGap = LAYOUT_CONFIG.branchGap;
  const padding = LAYOUT_CONFIG.blockPadding;

  const branches = block.branches || [];
  if (branches.length === 0) return;

  // 标题区域高度
  const titleHeight = LAYOUT_CONFIG.fontSizeSection + LAYOUT_CONFIG.blockTitleGap;

  // 计算每个分支的位置（垂直堆叠）
  let currentY = startY + titleHeight;
  const contentStartX = startX + padding;

  branches.forEach((branch, index) => {
    layout.layers.push({
      name: branch.name,
      type: branch.type,
      x: contentStartX,
      y: currentY,
      width: layerWidth,
      height: layerHeight,
      data: branch,
      branchIndex: index
    });

    currentY += layerHeight + (index < branches.length - 1 ? branchGap : 0);
  });

  // 计算容器尺寸
  layout.width = layerWidth + padding * 2;
  layout.height = currentY - startY + padding;

  // 计算分支间的连接（如果有）
  layout.connections = calculateConnections(layout.layers, 'vertical');

  // 计算 fork 和 merge 点
  const firstLayer = layout.layers[0];
  const lastLayer = layout.layers[layout.layers.length - 1];

  layout.forkPoint = {
    x: startX + padding + layerWidth / 2,
    y: startY + titleHeight - branchGap / 2
  };

  layout.mergePoint = {
    x: startX + padding + layerWidth / 2,
    y: lastLayer.y + layerHeight + branchGap / 2
  };
}

/**
 * 计算 residual block 布局
 * arc 样式：主路径水平，skip 弧线在上
 * parallel 样式：主路径和 skip 并行
 */
function calculateResidualBlockLayout(block, layout, startX, startY) {
  const layerWidth = LAYOUT_CONFIG.layerWidth;
  const layerHeight = LAYOUT_CONFIG.layerHeight;
  const layerGap = LAYOUT_CONFIG.layerGap;
  const padding = LAYOUT_CONFIG.blockPadding;
  const arcRadius = LAYOUT_CONFIG.arcRadius;

  const mainLayers = block.main || [];
  if (mainLayers.length === 0) return;

  // 标题区域高度
  const titleHeight = LAYOUT_CONFIG.fontSizeSection + LAYOUT_CONFIG.blockTitleGap;

  if (block.style === 'parallel') {
    // parallel 样式：主路径和 skip 并行排列
    const skipLayers = block.skip || [];

    // 主路径起始位置
    const mainStartX = startX + padding;
    const mainStartY = startY + titleHeight;

    // 计算 skip 路径是否需要额外空间
    const hasSkipLayers = Array.isArray(skipLayers) && skipLayers.length > 0;

    // 主路径层
    let currentX = mainStartX;
    mainLayers.forEach((layer, index) => {
      layout.layers.push({
        name: layer.name,
        type: layer.type,
        x: currentX,
        y: mainStartY,
        width: layerWidth,
        height: layerHeight,
        data: layer,
        path: 'main'
      });
      currentX += layerWidth + layerGap;
    });

    // skip 路径（如果有的话）
    let skipX = mainStartX;
    if (hasSkipLayers) {
      const skipStartY = mainStartY + layerHeight + LAYOUT_CONFIG.branchGap;

      skipLayers.forEach((layer, index) => {
        layout.layers.push({
          name: layer.name,
          type: layer.type,
          x: skipX,
          y: skipStartY,
          width: layerWidth,
          height: layerHeight,
          data: layer,
          path: 'skip'
        });
        skipX += layerWidth + layerGap;
      });
    }

    // 计算尺寸 - 需要考虑主路径和 skip 路径的最大宽度
    const mainEndX = currentX - layerGap;
    const skipEndX = skipX - layerGap;
    const maxEndX = Math.max(mainEndX, skipEndX);
    layout.width = maxEndX + padding - startX;
    layout.height = hasSkipLayers
      ? titleHeight + layerHeight * 2 + LAYOUT_CONFIG.branchGap + padding
      : titleHeight + layerHeight + padding;

    // 主路径连接
    layout.connections = calculateConnections(
      layout.layers.filter(l => l.path === 'main')
    );

    // skip connection（parallel 样式）
    layout.skipConnection = {
      type: 'parallel',
      startX: mainStartX,
      endX: maxEndX
    };

  } else {
    // arc 样式（默认）：主路径水平，skip 弧线在上
    const mainStartY = startY + titleHeight + arcRadius;

    // 主路径层
    let currentX = startX + padding;
    mainLayers.forEach((layer, index) => {
      layout.layers.push({
        name: layer.name,
        type: layer.type,
        x: currentX,
        y: mainStartY,
        width: layerWidth,
        height: layerHeight,
        data: layer
      });
      currentX += layerWidth + layerGap;
    });

    // 计算尺寸
    layout.width = currentX - layerGap + padding - startX;
    layout.height = titleHeight + arcRadius + layerHeight + padding;

    // 主路径连接
    layout.connections = calculateConnections(layout.layers);

    // skip connection（arc 样式）
    const firstLayer = layout.layers[0];
    const lastLayer = layout.layers[layout.layers.length - 1];

    layout.skipConnection = {
      type: 'arc',
      startX: firstLayer.x + layerWidth / 2,
      startY: firstLayer.y,
      endX: lastLayer.x + layerWidth / 2,
      endY: lastLayer.y,
      radius: arcRadius
    };
  }

  // fork 和 merge 点
  const firstLayer = layout.layers.find(l => l.path === 'main' || l.path === undefined);
  const lastMainLayer = [...layout.layers].reverse().find(l => l.path === 'main' || l.path === undefined);

  if (firstLayer && lastMainLayer) {
    layout.forkPoint = {
      x: firstLayer.x + layerWidth / 2,
      y: firstLayer.y + layerHeight / 2
    };
    layout.mergePoint = {
      x: lastMainLayer.x + layerWidth / 2,
      y: lastMainLayer.y + layerHeight / 2
    };
  }
}

/**
 * 计算 stack block 布局
 * expand=false：显示一次，带重复标记
 * expand=true：展开所有重复
 */
function calculateStackBlockLayout(block, layout, startX, startY) {
  const layerWidth = LAYOUT_CONFIG.layerWidth;
  const layerHeight = LAYOUT_CONFIG.layerHeight;
  const layerGap = LAYOUT_CONFIG.layerGap;
  const padding = LAYOUT_CONFIG.blockPadding;
  const stackLoopGap = LAYOUT_CONFIG.stackLoopGap;

  const layers = block.layers || [];
  const repeat = block.repeat || 1;
  const expand = block.expand === true;

  if (layers.length === 0) return;

  // 标题区域高度
  const titleHeight = LAYOUT_CONFIG.fontSizeSection + LAYOUT_CONFIG.blockTitleGap;

  const contentStartX = startX + padding;
  const contentStartY = startY + titleHeight;

  if (expand) {
    // 展开所有重复
    let currentX = contentStartX;

    for (let r = 0; r < repeat; r++) {
      layers.forEach((layer, index) => {
        const layerName = repeat > 1 ? `${layer.name}_${r + 1}` : layer.name;
        layout.layers.push({
          name: layerName,
          type: layer.type,
          x: currentX,
          y: contentStartY,
          width: layerWidth,
          height: layerHeight,
          data: layer,
          repeatIndex: r
        });
        currentX += layerWidth + layerGap;
      });

      // 循环之间额外间距（除了最后一次）
      if (r < repeat - 1) {
        currentX += stackLoopGap - layerGap;
      }
    }

    layout.width = currentX - layerGap + padding - startX;
    layout.height = titleHeight + layerHeight + padding;

    // 连接
    layout.connections = calculateConnections(layout.layers);

  } else {
    // 只显示一次，带重复标记
    let currentX = contentStartX;

    layers.forEach((layer, index) => {
      layout.layers.push({
        name: layer.name,
        type: layer.type,
        x: currentX,
        y: contentStartY,
        width: layerWidth,
        height: layerHeight,
        data: layer
      });
      currentX += layerWidth + layerGap;
    });

    layout.width = currentX - layerGap + padding - startX;
    layout.height = titleHeight + layerHeight + padding;

    // 重复标记
    layout.repeatMarker = {
      count: repeat,
      x: contentStartX + (currentX - contentStartX - layerGap) / 2,
      y: contentStartY + layerHeight + 10
    };

    // 连接
    layout.connections = calculateConnections(layout.layers);
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateLayout,
    LAYOUT_CONFIG,
    calculateBlockLayout
  };
}