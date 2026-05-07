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

// Collapsed block 配置（最小尺寸方块）
const COLLAPSED_CONFIG = {
  layerWidth: 50,      // 最小方块宽度（vs 正常 216）
  layerHeight: 30,     // 最小方块高度（vs 正常 126）
  layerGap: 10,        // 最小方块间距（vs 正常 27）
  blockPadding: 15,    // collapsed block 内边距（vs 正常 27）
  titleGap: 10,        // 标题与内容间距（vs 正常 18）
  branchGap: 12,       // 分支间距（vs 正常 27）
  cornerRadius: 4.8    // 圆角半径（缩小以匹配小方块）
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
 * 计算水平布局（支持换行和 blocks）
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

  // 记录层分组边界（用于 block 连接）
  const layerGroups = {
    initialLayers: [],
    blocks: [],
    afterBlocks: []
  };

  // 1. 处理初始层
  network.layers.forEach((layer, index) => {
    const layerLayout = {
      name: layer.name,
      type: layer.type,
      x: currentX,
      y: currentY,
      width: layerWidth,
      height: layerHeight,
      data: layer
    };
    layout.layers.push(layerLayout);
    layerGroups.initialLayers.push(layerLayout);
    currentX += layerWidth + LAYOUT_CONFIG.layerGap;
  });

  // 2. 处理 blocks
  if (network.blocks && network.blocks.length > 0) {
    network.blocks.forEach((block, blockIndex) => {
      const blockLayout = calculateBlockLayout(block, currentX, currentY);
      layout.blocks.push(blockLayout);
      layerGroups.blocks.push(blockLayout);

      // 将 block 内部层添加到全局 layers 数组
      blockLayout.layers.forEach(layer => {
        layout.layers.push(layer);
      });

      // 更新 currentX 到 block 右边缘
      currentX = blockLayout.x + blockLayout.width + LAYOUT_CONFIG.layerGap;
    });
  }

  // 3. 处理 layers_after_blocks
  if (network.layersAfterBlocks && network.layersAfterBlocks.length > 0) {
    network.layersAfterBlocks.forEach((layer, index) => {
      const layerLayout = {
        name: layer.name,
        type: layer.type,
        x: currentX,
        y: currentY,
        width: layerWidth,
        height: layerHeight,
        data: layer
      };
      layout.layers.push(layerLayout);
      layerGroups.afterBlocks.push(layerLayout);
      currentX += layerWidth + LAYOUT_CONFIG.layerGap;
    });
  }

  // 计算总尺寸 - 需要考虑 blocks 可能向下延伸
  const lastLayer = layout.layers[layout.layers.length - 1];
  layout.width = lastLayer ? lastLayer.x + lastLayer.width + LAYOUT_CONFIG.startX : LAYOUT_CONFIG.startX * 2;

  // 计算 maxY：考虑所有层和所有 block 的高度
  let maxY = currentY + layerHeight;
  layout.blocks.forEach(block => {
    if (block.y + block.height > maxY) {
      maxY = block.y + block.height;
    }
  });

  layout.height = maxY + LAYOUT_CONFIG.bottomPadding;

  // 计算标题位置（居中，下方留空隙）
  layout.title.x = layout.width / 2;
  layout.title.y = LAYOUT_CONFIG.fontSizeTitle + LAYOUT_CONFIG.titleGap;

  // 垂直居中调整：普通层的高度可能小于 block 高度，需要居中
  // 计算最大元素高度（用于居中）
  let maxElementHeight = layerHeight;
  layout.blocks.forEach(block => {
    if (block.height > maxElementHeight) {
      maxElementHeight = block.height;
    }
  });

  // 如果 block 高度大于普通层高度，调整普通层的 Y 坐标使其居中
  if (maxElementHeight > layerHeight) {
    const yOffset = (maxElementHeight - layerHeight) / 2;

    // 调整初始层
    layerGroups.initialLayers.forEach(layer => {
      layer.y += yOffset;
    });

    // 调整 afterBlocks 层
    layerGroups.afterBlocks.forEach(layer => {
      layer.y += yOffset;
    });

    // block 内部的层不需要调整，因为 block 已经按自己的高度布局了
  }

  // 计算连接箭头（普通层间连接）
  layout.connections = calculateConnections(layout.layers);

  // 计算 block 连接（层到 block、block 到 block、block 到层）
  layout.blockConnections = calculateBlockConnections(layerGroups);
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
  const layerWidth = LAYOUT_CONFIG.layerWidth;
  const layerHeight = LAYOUT_CONFIG.layerHeight;
  const startX = LAYOUT_CONFIG.startX;

  // 记录层分组边界（用于 block 连接）
  const layerGroups = {
    initialLayers: [],
    blocks: [],
    afterBlocks: []
  };

  // 先计算所有 blocks 的布局以获取最大宽度
  let maxWidth = layerWidth;
  const tempBlockLayouts = [];

  if (network.blocks && network.blocks.length > 0) {
    network.blocks.forEach((block, blockIndex) => {
      // 计算每个 block 的布局（临时位置）
      const blockLayout = calculateBlockLayout(block, 0, 0, 'vertical');
      tempBlockLayouts.push(blockLayout);
      if (blockLayout.width > maxWidth) {
        maxWidth = blockLayout.width;
      }
    });
  }

  // 计算整体起始 X（居中）
  const centerX = startX + maxWidth / 2;
  const layerStartX = centerX - layerWidth / 2;
  let currentY = LAYOUT_CONFIG.startY;

  // 1. 处理初始层（居中放置）
  network.layers.forEach((layer, index) => {
    const layerLayout = {
      name: layer.name,
      type: layer.type,
      x: layerStartX,
      y: currentY,
      width: layerWidth,
      height: layerHeight,
      data: layer
    };
    layout.layers.push(layerLayout);
    layerGroups.initialLayers.push(layerLayout);
    currentY += layerHeight + LAYOUT_CONFIG.layerGap;
  });

  // 2. 处理 blocks（居中放置）
  if (network.blocks && network.blocks.length > 0) {
    network.blocks.forEach((block, blockIndex) => {
      const blockStartX = centerX - tempBlockLayouts[blockIndex].width / 2;
      const blockLayout = calculateBlockLayout(block, blockStartX, currentY, 'vertical');
      layout.blocks.push(blockLayout);
      layerGroups.blocks.push(blockLayout);

      // 将 block 内部层添加到全局 layers 数组
      blockLayout.layers.forEach(layer => {
        layout.layers.push(layer);
      });

      // 更新 currentY 到 block 底部边缘
      currentY = blockLayout.y + blockLayout.height + LAYOUT_CONFIG.layerGap;
    });
  }

  // 3. 处理 layers_after_blocks（居中放置）
  if (network.layersAfterBlocks && network.layersAfterBlocks.length > 0) {
    network.layersAfterBlocks.forEach((layer, index) => {
      const layerLayout = {
        name: layer.name,
        type: layer.type,
        x: layerStartX,
        y: currentY,
        width: layerWidth,
        height: layerHeight,
        data: layer
      };
      layout.layers.push(layerLayout);
      layerGroups.afterBlocks.push(layerLayout);
      currentY += layerHeight + LAYOUT_CONFIG.layerGap;
    });
  }

  // 计算总尺寸
  let maxY = currentY;
  layout.blocks.forEach(block => {
    if (block.y + block.height > maxY) {
      maxY = block.y + block.height;
    }
  });

  layout.width = maxWidth + startX * 2;
  layout.height = maxY + LAYOUT_CONFIG.bottomPadding;
  layout.title.x = layout.width / 2;
  layout.title.y = LAYOUT_CONFIG.fontSizeTitle + LAYOUT_CONFIG.titleGap;

  // 计算连接箭头（垂直方向）
  // 1. 初始层之间的连接
  layout.connections = calculateConnections(
    layerGroups.initialLayers,
    'vertical'
  );

  // 2. afterBlocks 层之间的连接
  if (layerGroups.afterBlocks.length > 1) {
    const afterBlockConnections = calculateConnections(
      layerGroups.afterBlocks,
      'vertical'
    );
    layout.connections = layout.connections.concat(afterBlockConnections);
  }

  // 计算 block 连接
  layout.blockConnections = calculateBlockConnectionsVertical(layerGroups);
}

/**
 * 计算连接箭头位置
 * note 类型不参与连接（跳过）
 */
function calculateConnections(layers, direction = 'horizontal') {
  const connections = [];

  // 过滤掉 note 类型的层
  const connectableLayers = layers.filter(l => l.type !== 'note');

  for (let i = 0; i < connectableLayers.length - 1; i++) {
    const from = connectableLayers[i];
    const to = connectableLayers[i + 1];

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
 * 计算 block 连接（层到 block、block 到 block、block 到层）
 * note 类型不参与连接
 * @param {object} layerGroups - 层分组对象 { initialLayers, blocks, afterBlocks }
 * @returns {array} block 连接列表
 */
function calculateBlockConnections(layerGroups) {
  const connections = [];
  const layerWidth = LAYOUT_CONFIG.layerWidth;
  const layerHeight = LAYOUT_CONFIG.layerHeight;

  // 过滤掉 note 类型
  const initialLayersFiltered = layerGroups.initialLayers.filter(l => l.type !== 'note');
  const afterBlocksFiltered = layerGroups.afterBlocks.filter(l => l.type !== 'note');

  // 1. initialLayers 到第一个 block 的连接
  if (initialLayersFiltered.length > 0 && layerGroups.blocks.length > 0) {
    const lastInitialLayer = initialLayersFiltered[initialLayersFiltered.length - 1];
    const firstBlock = layerGroups.blocks[0];

    connections.push({
      from: lastInitialLayer.name,
      to: firstBlock.name,
      x1: lastInitialLayer.x + lastInitialLayer.width,
      y1: lastInitialLayer.y + lastInitialLayer.height / 2,
      x2: firstBlock.x,
      y2: firstBlock.y + firstBlock.height / 2,
      type: 'block-entry'
    });
  }

  // 2. block 到 block 的连接
  for (let i = 0; i < layerGroups.blocks.length - 1; i++) {
    const fromBlock = layerGroups.blocks[i];
    const toBlock = layerGroups.blocks[i + 1];

    connections.push({
      from: fromBlock.name,
      to: toBlock.name,
      x1: fromBlock.x + fromBlock.width,
      y1: fromBlock.y + fromBlock.height / 2,
      x2: toBlock.x,
      y2: toBlock.y + toBlock.height / 2,
      type: 'block-to-block'
    });
  }

  // 3. 最后一个 block 到 afterBlocks 的连接（跳过 note）
  if (layerGroups.blocks.length > 0 && afterBlocksFiltered.length > 0) {
    const lastBlock = layerGroups.blocks[layerGroups.blocks.length - 1];
    const firstAfterLayer = afterBlocksFiltered[0];

    connections.push({
      from: lastBlock.name,
      to: firstAfterLayer.name,
      x1: lastBlock.x + lastBlock.width,
      y1: lastBlock.y + lastBlock.height / 2,
      x2: firstAfterLayer.x,
      y2: firstAfterLayer.y + firstAfterLayer.height / 2,
      type: 'block-exit'
    });
  }

  // 4. 如果没有 blocks，但 initialLayers 和 afterBlocks 都有，连接它们（跳过 note）
  if (layerGroups.blocks.length === 0 &&
      initialLayersFiltered.length > 0 &&
      afterBlocksFiltered.length > 0) {
    const lastInitialLayer = initialLayersFiltered[initialLayersFiltered.length - 1];
    const firstAfterLayer = afterBlocksFiltered[0];

    connections.push({
      from: lastInitialLayer.name,
      to: firstAfterLayer.name,
      x1: lastInitialLayer.x + lastInitialLayer.width,
      y1: lastInitialLayer.y + lastInitialLayer.height / 2,
      x2: firstAfterLayer.x,
      y2: firstAfterLayer.y + firstAfterLayer.height / 2,
      type: 'sequential'
    });
  }

  return connections;
}

/**
 * 计算 block 连接（垂直布局版本）
 * 连接方向从下到上
 * note 类型不参与连接
 */
function calculateBlockConnectionsVertical(layerGroups) {
  const connections = [];
  const layerWidth = LAYOUT_CONFIG.layerWidth;
  const layerHeight = LAYOUT_CONFIG.layerHeight;

  // 过滤掉 note 类型
  const initialLayersFiltered = layerGroups.initialLayers.filter(l => l.type !== 'note');
  const afterBlocksFiltered = layerGroups.afterBlocks.filter(l => l.type !== 'note');

  // 1. initialLayers 到第一个 block 的连接（从底部到顶部）
  if (initialLayersFiltered.length > 0 && layerGroups.blocks.length > 0) {
    const lastInitialLayer = initialLayersFiltered[initialLayersFiltered.length - 1];
    const firstBlock = layerGroups.blocks[0];

    connections.push({
      from: lastInitialLayer.name,
      to: firstBlock.name,
      x1: lastInitialLayer.x + lastInitialLayer.width / 2,
      y1: lastInitialLayer.y + lastInitialLayer.height,
      x2: firstBlock.x + firstBlock.width / 2,
      y2: firstBlock.y,
      type: 'block-entry'
    });
  }

  // 2. block 到 block 的连接
  for (let i = 0; i < layerGroups.blocks.length - 1; i++) {
    const fromBlock = layerGroups.blocks[i];
    const toBlock = layerGroups.blocks[i + 1];

    connections.push({
      from: fromBlock.name,
      to: toBlock.name,
      x1: fromBlock.x + fromBlock.width / 2,
      y1: fromBlock.y + fromBlock.height,
      x2: toBlock.x + toBlock.width / 2,
      y2: toBlock.y,
      type: 'block-to-block'
    });
  }

  // 3. 最后一个 block 到 afterBlocks 的连接（跳过 note）
  if (layerGroups.blocks.length > 0 && afterBlocksFiltered.length > 0) {
    const lastBlock = layerGroups.blocks[layerGroups.blocks.length - 1];
    const firstAfterLayer = afterBlocksFiltered[0];

    connections.push({
      from: lastBlock.name,
      to: firstAfterLayer.name,
      x1: lastBlock.x + lastBlock.width / 2,
      y1: lastBlock.y + lastBlock.height,
      x2: firstAfterLayer.x + firstAfterLayer.width / 2,
      y2: firstAfterLayer.y,
      type: 'block-exit'
    });
  }

  // 4. 如果没有 blocks，连接 initialLayers 和 afterBlocks（跳过 note）
  if (layerGroups.blocks.length === 0 &&
      initialLayersFiltered.length > 0 &&
      afterBlocksFiltered.length > 0) {
    const lastInitialLayer = initialLayersFiltered[initialLayersFiltered.length - 1];
    const firstAfterLayer = afterBlocksFiltered[0];

    connections.push({
      from: lastInitialLayer.name,
      to: firstAfterLayer.name,
      x1: lastInitialLayer.x + lastInitialLayer.width / 2,
      y1: lastInitialLayer.y + lastInitialLayer.height,
      x2: firstAfterLayer.x + firstAfterLayer.width / 2,
      y2: firstAfterLayer.y,
      type: 'sequential'
    });
  }

  return connections;
}

/**
 * 计算 block 布局
 * @param {object} block - block 定义
 * @param {number} startX - 起始 X 坐标
 * @param {number} startY - 起始 Y 坐标
 * @param {string} direction - 布局方向 ('horizontal' 或 'vertical')
 * @returns {object} block 布局结果
 */
function calculateBlockLayout(block, startX, startY, direction = 'horizontal') {
  const layout = {
    name: block.name,
    type: block.type,
    style: block.style,
    expand: block.expand,
    repeat: block.repeat,
    merge: block.merge,
    act: block.act,
    norm: block.norm,
    direction: direction,
    collapsed: block.expand === 'collapsed',
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
      calculateParallelBlockLayout(block, layout, startX, startY, direction);
      break;
    case 'residual':
      calculateResidualBlockLayout(block, layout, startX, startY, direction);
      break;
    case 'stack':
      calculateStackBlockLayout(block, layout, startX, startY, direction);
      break;
    default:
      // 未知类型，返回空布局
      break;
  }

  return layout;
}

/**
 * 计算 parallel block 布局
 * horizontal: 分支垂直堆叠，每个分支内部水平排列多层
 * vertical: 分支水平排列，每个分支内部垂直排列多层
 */
function calculateParallelBlockLayout(block, layout, startX, startY, direction = 'horizontal') {
  const layerWidth = LAYOUT_CONFIG.layerWidth;
  const layerHeight = LAYOUT_CONFIG.layerHeight;
  const layerGap = LAYOUT_CONFIG.layerGap;
  const branchGap = LAYOUT_CONFIG.branchGap;
  const padding = LAYOUT_CONFIG.blockPadding;

  const branches = block.branches || [];
  if (branches.length === 0) return;

  // 标题区域高度/宽度
  const titleHeight = LAYOUT_CONFIG.fontSizeSection + LAYOUT_CONFIG.blockTitleGap;
  const titleWidth = LAYOUT_CONFIG.fontSizeSection + LAYOUT_CONFIG.blockTitleGap;

  // 记录每个分支的层，用于计算 fork/merge
  const branchLayerGroups = [];

  if (direction === 'vertical') {
    // 垂直布局：分支水平排列（左右并行）
    // 先计算标题区域，再放置内容
    const contentStartY = startY + titleHeight + padding;
    let currentX = startX + padding;
    let maxBranchHeight = layerHeight;

    branches.forEach((branch, branchIndex) => {
      const branchLayers = [];

      if (Array.isArray(branch)) {
        // 多层分支：垂直排列（上下排列）
        let currentY = contentStartY;
        branch.forEach((layer, layerIndex) => {
          const layerData = {
            id: layer.id || `${block.name}_${branchIndex}_${layerIndex}`,
            name: layer.name,
            type: layer.type,
            x: currentX,
            y: currentY,
            width: layerWidth,
            height: layerHeight,
            data: layer,
            branchIndex: branchIndex
          };
          layout.layers.push(layerData);
          branchLayers.push(layerData);
          currentY += layerHeight + layerGap;
        });

        // 计算该分支的总高度
        const branchHeight = (branch.length - 1) * (layerHeight + layerGap) + layerHeight;
        if (branchHeight > maxBranchHeight) {
          maxBranchHeight = branchHeight;
        }

        currentX += layerWidth + (branchIndex < branches.length - 1 ? branchGap : 0);
      } else {
        // 单层分支
        const layerData = {
          id: branch.id || `${block.name}_${branchIndex}`,
          name: branch.name,
          type: branch.type,
          x: currentX,
          y: contentStartY,
          width: layerWidth,
          height: layerHeight,
          data: branch,
          branchIndex: branchIndex
        };
        layout.layers.push(layerData);
        branchLayers.push(layerData);

        currentX += layerWidth + (branchIndex < branches.length - 1 ? branchGap : 0);
      }

      branchLayerGroups.push(branchLayers);
    });

    // 计算容器尺寸（标题 + 顶部padding + 内容 + 底部padding）
    layout.width = currentX - startX + padding;
    layout.height = titleHeight + padding + maxBranchHeight + padding;

    // 计算 fork 点：block 内容区上方中心（标题下方）
    layout.forkPoint = {
      x: startX + layout.width / 2,
      y: startY + titleHeight
    };

    // 计算 merge 点：最后一层下方（在 block 底部 padding 区域）
    // contentStartY + maxBranchHeight 是最后一层底部位置
    layout.mergePoint = {
      x: layout.forkPoint.x,
      y: startY + titleHeight + padding + maxBranchHeight + padding / 2
    };

  } else {
    // 水平布局（默认）：分支垂直堆叠（上下并行）
    let currentY = startY + titleHeight;
    const contentStartX = startX + padding;
    let maxBranchWidth = layerWidth;

    branches.forEach((branch, branchIndex) => {
      const branchLayers = [];

      if (Array.isArray(branch)) {
        // 多层分支：水平排列（左右排列）
        let currentX = contentStartX;
        branch.forEach((layer, layerIndex) => {
          const layerData = {
            id: layer.id || `${block.name}_${branchIndex}_${layerIndex}`,
            name: layer.name,
            type: layer.type,
            x: currentX,
            y: currentY,
            width: layerWidth,
            height: layerHeight,
            data: layer,
            branchIndex: branchIndex
          };
          layout.layers.push(layerData);
          branchLayers.push(layerData);
          currentX += layerWidth + layerGap;
        });

        // 计算该分支的总宽度
        const branchWidth = (branch.length - 1) * (layerWidth + layerGap) + layerWidth;
        if (branchWidth > maxBranchWidth) {
          maxBranchWidth = branchWidth;
        }

        currentY += layerHeight + (branchIndex < branches.length - 1 ? branchGap : 0);
      } else {
        // 单层分支
        const layerData = {
          id: branch.id || `${block.name}_${branchIndex}`,
          name: branch.name,
          type: branch.type,
          x: contentStartX,
          y: currentY,
          width: layerWidth,
          height: layerHeight,
          data: branch,
          branchIndex: branchIndex
        };
        layout.layers.push(layerData);
        branchLayers.push(layerData);

        currentY += layerHeight + (branchIndex < branches.length - 1 ? branchGap : 0);
      }

      branchLayerGroups.push(branchLayers);
    });

    // 计算容器尺寸
    layout.width = maxBranchWidth + padding * 2;
    layout.height = currentY - startY + padding;

    // 计算 fork 点：block 左侧中心
    const contentHeight = currentY - startY - titleHeight - padding;
    layout.forkPoint = {
      x: startX + padding / 2,
      y: startY + titleHeight + contentHeight / 2
    };

    // 计算 merge 点：block 右侧中心
    layout.mergePoint = {
      x: startX + layout.width - padding / 2,
      y: layout.forkPoint.y
    };
  }

  // 记录分支层组，用于 SVG 渲染时计算分叉/汇聚连线
  layout.branchLayerGroups = branchLayerGroups;
}

/**
 * 计算 residual block 布局
 * arc 样式：主路径水平，skip 弧线在上
 * parallel 样式：主路径和 skip 并行
 * vertical 方向：主路径垂直排列
 */
function calculateResidualBlockLayout(block, layout, startX, startY, direction = 'horizontal') {
  // Select config based on collapsed mode
  const config = layout.collapsed ? COLLAPSED_CONFIG : LAYOUT_CONFIG;
  const layerWidth = config.layerWidth;
  const layerHeight = config.layerHeight;
  const layerGap = config.layerGap;
  const padding = config.blockPadding;
  const arcRadius = layout.collapsed ? COLLAPSED_CONFIG.layerHeight : LAYOUT_CONFIG.arcRadius;

  const mainLayers = block.main || [];
  if (mainLayers.length === 0) return;

  // Calculate title height with collapsed-aware gap
  const titleHeight = LAYOUT_CONFIG.fontSizeSection + (layout.collapsed ? COLLAPSED_CONFIG.titleGap : LAYOUT_CONFIG.blockTitleGap);
  const titleWidth = LAYOUT_CONFIG.fontSizeSection + LAYOUT_CONFIG.blockTitleGap;

  if (direction === 'vertical') {
    // 垂直布局：主路径垂直排列
    if (block.style === 'parallel') {
      // parallel 样式：主路径和 skip 并行（左右）
      const skipLayers = block.skip || [];
      const hasSkipLayers = Array.isArray(skipLayers) && skipLayers.length > 0;

      // 主路径起始位置
      const mainStartX = startX + titleWidth;
      const mainStartY = startY + padding;

      // 主路径层（垂直排列）
      let currentY = mainStartY;
      mainLayers.forEach((layer, index) => {
        layout.layers.push({
          name: layer.name,
          type: layer.type,
          x: mainStartX,
          y: currentY,
          width: layerWidth,
          height: layerHeight,
          data: layer,
          path: 'main',
          collapsed: layout.collapsed
        });
        currentY += layerHeight + layerGap;
      });

      // skip 路径（右侧）
      let skipY = mainStartY;
      if (hasSkipLayers) {
        const skipStartX = mainStartX + layerWidth + config.branchGap;

        skipLayers.forEach((layer, index) => {
          layout.layers.push({
            name: layer.name,
            type: layer.type,
            x: skipStartX,
            y: skipY,
            width: layerWidth,
            height: layerHeight,
            data: layer,
            path: 'skip',
            collapsed: layout.collapsed
          });
          skipY += layerHeight + layerGap;
        });
      }

      // 计算尺寸
      const mainEndY = currentY - layerGap;
      const skipEndY = skipY - layerGap;
      const maxEndY = Math.max(mainEndY, skipEndY);
      layout.height = maxEndY + padding - startY;
      layout.width = hasSkipLayers
        ? titleWidth + layerWidth * 2 + config.branchGap + padding
        : titleWidth + layerWidth + padding;

      // 主路径连接（垂直）
      layout.connections = calculateConnections(
        layout.layers.filter(l => l.path === 'main'),
        'vertical'
      );

      // skip connection
      layout.skipConnection = {
        type: 'parallel-vertical',
        startY: mainStartY,
        endY: maxEndY
      };

    } else {
      // arc 样式：主路径垂直，skip 弧线在左
      const mainStartX = startX + titleWidth + arcRadius;
      const mainStartY = startY + padding;

      // 主路径层（垂直排列）
      let currentY = mainStartY;
      mainLayers.forEach((layer, index) => {
        layout.layers.push({
          name: layer.name,
          type: layer.type,
          x: mainStartX,
          y: currentY,
          width: layerWidth,
          height: layerHeight,
          data: layer,
          collapsed: layout.collapsed
        });
        currentY += layerHeight + layerGap;
      });

      // 计算尺寸
      layout.width = titleWidth + arcRadius + layerWidth + padding;
      layout.height = currentY - layerGap + padding - startY;

      // 主路径连接（垂直）
      layout.connections = calculateConnections(layout.layers, 'vertical');

      // skip connection（arc 样式，垂直）
      const firstLayer = layout.layers[0];
      const lastLayer = layout.layers[layout.layers.length - 1];

      layout.skipConnection = {
        type: 'arc-vertical',
        startX: firstLayer.x + layerWidth / 2,
        startY: firstLayer.y,
        endX: lastLayer.x + layerWidth / 2,
        endY: lastLayer.y,
        radius: arcRadius
      };
    }

  } else {
    // 水平布局（原有逻辑）
    if (block.style === 'parallel') {
      // parallel 样式：主路径和 skip 并行排列
      const skipLayers = block.skip || [];

      // 主路径起始位置 - 与 arc 样式保持一致，预留 arcRadius 空间
      const mainStartX = startX + padding;
      const mainStartY = startY + titleHeight + arcRadius;

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
          path: 'main',
          collapsed: layout.collapsed
        });
        currentX += layerWidth + layerGap;
      });

      // skip 路径（如果有的话）
      let skipX = mainStartX;
      if (hasSkipLayers) {
        const skipStartY = mainStartY + layerHeight + config.branchGap;

        skipLayers.forEach((layer, index) => {
          layout.layers.push({
            name: layer.name,
            type: layer.type,
            x: skipX,
            y: skipStartY,
            width: layerWidth,
            height: layerHeight,
            data: layer,
            path: 'skip',
            collapsed: layout.collapsed
          });
          skipX += layerWidth + layerGap;
        });
      }

      // 计算尺寸 - 需要考虑主路径和 skip 路径的最大宽度
      const mainEndX = currentX - layerGap;
      const skipEndX = skipX - layerGap;
      const maxEndX = Math.max(mainEndX, skipEndX);
      layout.width = maxEndX + padding - startX;

      // 高度计算：与 arc 样式保持一致
      layout.height = titleHeight + arcRadius + layerHeight + padding;

      // 主路径连接
      layout.connections = calculateConnections(
        layout.layers.filter(l => l.path === 'main')
      );

      // skip connection（parallel 样式）- 在预留的 arcRadius 空间绘制
      layout.skipConnection = {
        type: 'parallel',
        startX: mainStartX,
        endX: maxEndX,
        startY: startY + titleHeight,
        endY: mainStartY + layerHeight
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
          data: layer,
          collapsed: layout.collapsed
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
 * vertical 方向：层垂直排列
 */
function calculateStackBlockLayout(block, layout, startX, startY, direction = 'horizontal') {
  const layerWidth = LAYOUT_CONFIG.layerWidth;
  const layerHeight = LAYOUT_CONFIG.layerHeight;
  const layerGap = LAYOUT_CONFIG.layerGap;
  const padding = LAYOUT_CONFIG.blockPadding;
  const stackLoopGap = LAYOUT_CONFIG.stackLoopGap;

  const layers = block.layers || [];
  const repeat = block.repeat || 1;
  const expand = block.expand === true;

  if (layers.length === 0) return;

  // 标题区域高度/宽度
  const titleHeight = LAYOUT_CONFIG.fontSizeSection + LAYOUT_CONFIG.blockTitleGap;
  const titleWidth = LAYOUT_CONFIG.fontSizeSection + LAYOUT_CONFIG.blockTitleGap;

  if (direction === 'vertical') {
    // 垂直布局
    const contentStartX = startX + titleWidth;
    const contentStartY = startY + padding;

    if (expand) {
      // 展开所有重复（垂直排列）
      let currentY = contentStartY;

      for (let r = 0; r < repeat; r++) {
        layers.forEach((layer, index) => {
          const layerName = repeat > 1 ? `${layer.name}_${r + 1}` : layer.name;
          layout.layers.push({
            name: layerName,
            type: layer.type,
            x: contentStartX,
            y: currentY,
            width: layerWidth,
            height: layerHeight,
            data: layer,
            repeatIndex: r
          });
          currentY += layerHeight + layerGap;
        });

        // 循环之间额外间距（除了最后一次）
        if (r < repeat - 1) {
          currentY += stackLoopGap - layerGap;
        }
      }

      layout.width = titleWidth + layerWidth + padding;
      layout.height = currentY - layerGap + padding - startY;

      // 连接（垂直）
      layout.connections = calculateConnections(layout.layers, 'vertical');

    } else {
      // 只显示一次，带重复标记（垂直排列）
      let currentY = contentStartY;

      layers.forEach((layer, index) => {
        layout.layers.push({
          name: layer.name,
          type: layer.type,
          x: contentStartX,
          y: currentY,
          width: layerWidth,
          height: layerHeight,
          data: layer
        });
        currentY += layerHeight + layerGap;
      });

      layout.width = titleWidth + layerWidth + padding;
      layout.height = currentY - layerGap + padding - startY;

      // 重复标记
      layout.repeatMarker = {
        count: repeat,
        x: contentStartX + layerWidth / 2,
        y: currentY + 10
      };

      // 连接（垂直）
      layout.connections = calculateConnections(layout.layers, 'vertical');
    }

  } else {
    // 水平布局（原有逻辑）
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
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateLayout,
    LAYOUT_CONFIG,
    COLLAPSED_CONFIG,
    calculateBlockLayout
  };
}