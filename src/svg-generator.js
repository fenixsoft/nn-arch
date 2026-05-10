/**
 * SVG 生成器
 * 根据布局结果生成 SVG 图形
 */

// 颜色配置
const COLORS = {
  input: { fill: '#fff8f0', stroke: '#f0a559' },
  conv: { fill: '#e8f4f8', stroke: '#5ba5d9' },
  pool: { fill: '#f0e8f8', stroke: '#a559f0' },
  fc: { fill: '#e8f8f0', stroke: '#5bd9a5' },
  output: { fill: '#ffe8e8', stroke: '#f5a5a5' },
  embedding: { fill: '#f8f8e8', stroke: '#d9a55b' },
  attention: { fill: '#e8f0f8', stroke: '#5990d9' },
  norm: { fill: '#f8e8f8', stroke: '#d959f0' },
  activation: { fill: '#f8f0e8', stroke: '#d9b559' },
  merge: { fill: '#f0f8e8', stroke: '#59d9b5' },
  identity: { fill: '#f8f8f8', stroke: '#999999' },
  rnn: { fill: '#f8ece0', stroke: '#c07040' },    // RNN/LSTM 循环层
  note: { fill: '#f8f8f8', stroke: '#cccccc' },  // 注释/说明方块
  // Block colors
  block_residual: { fill: '#e8f0f8', stroke: '#5990d9' },
  block_parallel: { fill: '#e8f8f0', stroke: '#59d9b5' },
  block_stack: { fill: '#f8f8e8', stroke: '#d9b559' }
};

// 样式配置（放大 300%，箭头缩小 50%）
const SVG_CONFIG = {
  fontSizeName: 25.2,    // 8.4 * 3
  fontSizeDetail: 21.6,  // 7.2 * 3
  fontSizeTitle: 36,     // 12 * 3
  fontSizeSection: 25.2, // 8.4 * 3
  cornerRadius: 14.4,    // 4.8 * 3
  strokeWidth: 3.6,      // 1.2 * 3
  arrowWidth: 2.7,       // 0.9 * 3
  scale: 3,              // 显示放大倍数
  nameGap: 12,           // name 上下的额外空隙 (4px * 3)
  // 箭头标记尺寸（缩小 50%）
  arrowMarkerWidth: 7.2,   // 4.8 * 3 * 0.5
  arrowMarkerHeight: 5.4,  // 3.6 * 3 * 0.5
  arrowRefX: 6.3,          // 4.2 * 3 * 0.5
  arrowRefY: 2.7           // 1.8 * 3 * 0.5
};

// Collapsed block 配置（由 layout.js 定义并导出到 globalThis）
// 直接使用 globalThis.COLLAPSED_CONFIG，不重新声明以避免与 layout.js 的 const 冲突

/**
 * 生成 SVG 字符串
 * @param {object} layout - 布局结果
 * @returns {string} SVG 字符串
 */
function generateSvg(layout) {
  const svgParts = [];
  const scale = SVG_CONFIG.scale;

  // 计算显示尺寸（放大 300%）
  const displayWidth = Math.round(layout.width * scale);
  const displayHeight = Math.round(layout.height * scale);

  // SVG 开头：viewBox 保持原始尺寸，width/height 放大
  svgParts.push(`<svg viewBox="0 0 ${layout.width} ${layout.height}" width="${displayWidth}" height="${displayHeight}" xmlns="http://www.w3.org/2000/svg">`);

  // 定义区：箭头标记和样式
  svgParts.push(generateDefs());

  // 白色背景
  svgParts.push(`<rect width="${layout.width}" height="${layout.height}" fill="#ffffff"/>`);

  // 标题
  svgParts.push(generateTitle(layout.title));

  // sections 区域框
  layout.sections.forEach(section => {
    svgParts.push(generateSection(section));
  });

  // 收集 block 内部层的名称，用于跳过
  const blockInternalLayerNames = new Set();
  if (layout.blocks && layout.blocks.length > 0) {
    layout.blocks.forEach(block => {
      if (block.layers) {
        block.layers.forEach(layer => {
          blockInternalLayerNames.add(layer.name);
        });
      }
    });
  }

  // 层（跳过 block 内部层，它们由 generateBlock 渲染）
  layout.layers.forEach(layer => {
    if (!blockInternalLayerNames.has(layer.name)) {
      svgParts.push(generateLayer(layer));
    }
  });

  // blocks（渲染块容器和内部层）
  if (layout.blocks && layout.blocks.length > 0) {
    layout.blocks.forEach(block => {
      svgParts.push(generateBlock(block));
    });
  }

  // 连接箭头
  layout.connections.forEach(conn => {
    svgParts.push(generateConnection(conn));
  });

  // section 内元素之间的连接（包括 blocks）
  if (layout.sectionInternalConnections && layout.sectionInternalConnections.length > 0) {
    layout.sectionInternalConnections.forEach(conn => {
      svgParts.push(generateSectionInternalConnection(conn));
    });
  }

  // block 连接（入口/出口）
  if (layout.blockConnections && layout.blockConnections.length > 0) {
    layout.blockConnections.forEach(conn => {
      svgParts.push(generateBlockConnection(conn));
    });
  }

  // section 内换行连接（折线）
  if (layout.sectionRowConnections) {
    layout.sectionRowConnections.forEach(conn => {
      svgParts.push(generateSectionRowConnection(conn));
    });
  }

  // 行间连接（带标注）
  layout.rowConnections.forEach(conn => {
    svgParts.push(generateRowConnection(conn));
  });

  // SVG 结尾
  svgParts.push('</svg>');

  return svgParts.join('\n');
}

/**
 * 生成定义区（defs）- 箭头缩小 50%
 */
function generateDefs() {
  return `
  <defs>
    <marker id="arrowhead" markerWidth="${SVG_CONFIG.arrowMarkerWidth}" markerHeight="${SVG_CONFIG.arrowMarkerHeight}" refX="${SVG_CONFIG.arrowRefX}" refY="${SVG_CONFIG.arrowRefY}" orient="auto">
      <polygon points="0 0, ${SVG_CONFIG.arrowMarkerWidth} ${SVG_CONFIG.arrowRefY}, 0 ${SVG_CONFIG.arrowMarkerHeight}" fill="#999"/>
    </marker>
    <marker id="arrowhead-collapsed" markerWidth="${globalThis.COLLAPSED_CONFIG?.arrowMarkerWidth || 3.6}" markerHeight="${globalThis.COLLAPSED_CONFIG?.arrowMarkerHeight || 2.7}" refX="${(globalThis.COLLAPSED_CONFIG?.arrowMarkerWidth || 3.6) * 0.875}" refY="${(globalThis.COLLAPSED_CONFIG?.arrowMarkerHeight || 2.7) / 2}" orient="auto">
      <polygon points="0 0, ${globalThis.COLLAPSED_CONFIG?.arrowMarkerWidth || 3.6} ${(globalThis.COLLAPSED_CONFIG?.arrowMarkerHeight || 2.7) / 2}, 0 ${globalThis.COLLAPSED_CONFIG?.arrowMarkerHeight || 2.7}" fill="#999"/>
    </marker>
  </defs>`;
}

/**
 * 生成标题
 */
function generateTitle(title) {
  return `<text x="${title.x}" y="${title.y}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeTitle}" font-weight="bold" font-family="Arial, sans-serif" fill="#333">${title.text}</text>`;
}

/**
 * 生成 section 区域框（标题粗体）
 */
function generateSection(section) {
  const strokeColor = section.strokeColor || '#b8d8e8';
  const titleY = section.titleY || (section.y + SVG_CONFIG.fontSizeSection);
  return `<rect x="${section.x}" y="${section.y}" width="${section.width}" height="${section.height}" fill="none" stroke="${strokeColor}" stroke-width="${SVG_CONFIG.strokeWidth}" stroke-dasharray="${9},${9}" rx="${SVG_CONFIG.cornerRadius * 1.25}"/>
<text x="${section.x + section.width / 2}" y="${titleY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeSection}" font-weight="bold" font-family="Arial, sans-serif" fill="#5a7d9a">${section.name}</text>`;
}

/**
 * 生成层矩形框（显示 pool 和 dropout）
 * note 类型使用虚线边框，只显示文本
 */
function generateLayer(layer) {
  const colors = COLORS[layer.type] || COLORS.input;
  const content = generateLayerContent(layer);

  // note 类型使用虚线边框
  if (layer.type === 'note') {
    return `
<rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="${SVG_CONFIG.strokeWidth}" stroke-dasharray="${6},${4}" rx="${SVG_CONFIG.cornerRadius}"/>
${content}`;
  }

  return `
<rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="${SVG_CONFIG.strokeWidth}" rx="${SVG_CONFIG.cornerRadius}"/>
${content}`;
}

/**
 * 生成 collapsed 层矩形框（无文字，仅颜色）
 * @param {object} layer - 层布局数据
 * @returns {string} SVG 字符串
 */
function generateCollapsedLayer(layer) {
  const colors = COLORS[layer.type] || COLORS.input;
  const config = globalThis.COLLAPSED_CONFIG || {};
  const cornerRadius = config.cornerRadius || 4.8;
  const strokeWidth = config.strokeWidth || SVG_CONFIG.strokeWidth;

  // Minimal rectangle without any text, with thinner stroke
  return `
	<rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="${strokeWidth}" rx="${cornerRadius}"/>`;
}

/**
 * 生成层内容文本（包含 pool、dropout 等）
 * note 类型显示 name 和 label（如有）
 */
function generateLayerContent(layer) {
  const centerX = layer.x + layer.width / 2;
  const data = layer.data;

  // note 类型：显示 name，label 作为额外提示（如有）
  if (layer.type === 'note') {
    const nameY = layer.y + layer.height / 2 - SVG_CONFIG.fontSizeDetail / 2;
    let content = `<text x="${centerX}" y="${nameY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeName}" font-family="Arial, sans-serif" fill="#666">${layer.name}</text>`;

    // 如果有 label，在 name 下方显示
    if (data.label) {
      const labelY = nameY + SVG_CONFIG.fontSizeName + 6;
      content += `<text x="${centerX}" y="${labelY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeDetail}" font-family="Arial, sans-serif" fill="#999">${data.label}</text>`;
    }

    return content;
  }

  // 层名称（上方增加空隙）
  const nameY = layer.y + SVG_CONFIG.nameGap + SVG_CONFIG.fontSizeName;
  // 名称可能包含附加信息（+Pool, +Dropout）
  const displayName = getDisplayName(layer);
  let content = `<text x="${centerX}" y="${nameY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeName}" font-weight="bold" font-family="Arial, sans-serif" fill="#333">${displayName}</text>`;

  // 参数详情（name下方增加空隙）
  const detailY = nameY + SVG_CONFIG.nameGap + SVG_CONFIG.fontSizeDetail;
  const detail = getLayerDetail(layer);
  if (detail) {
    content += `<text x="${centerX}" y="${detailY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeDetail}" font-family="Arial, sans-serif" fill="#666">${detail}</text>`;
  }

  // 输出尺寸
  let nextY = detailY + SVG_CONFIG.fontSizeDetail;
  if (data.out) {
    content += `<text x="${centerX}" y="${nextY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeDetail}" font-family="Arial, sans-serif" fill="#666">${data.out}</text>`;
    nextY += SVG_CONFIG.fontSizeDetail;
  }

  // Pool 信息（如果有）
  if (data.pool) {
    const poolText = typeof data.pool === 'object'
      ? `Pool: k=${data.pool.kernel || ''}${data.pool.stride ? `, s=${data.pool.stride}` : ''}`
      : `+Pool`;
    content += `<text x="${centerX}" y="${nextY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeDetail}" font-family="Arial, sans-serif" fill="#a559f0">${poolText}</text>`;
    nextY += SVG_CONFIG.fontSizeDetail;
  }

  // Dropout 信息（如果有）
  if (data.dropout) {
    const dropoutText = data.dropout === true ? '+Dropout' : `Dropout: ${data.dropout}`;
    content += `<text x="${centerX}" y="${nextY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeDetail}" font-family="Arial, sans-serif" fill="#d9a55b">${dropoutText}</text>`;
    nextY += SVG_CONFIG.fontSizeDetail;
  }

  // 激活函数
  if (data.act) {
    content += `<text x="${centerX}" y="${nextY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeDetail}" font-family="Arial, sans-serif" fill="#27ae60">${data.act}</text>`;
  }

  return content;
}

/**
 * 获取层显示名称
 */
function getDisplayName(layer) {
  return layer.name;
}

/**
 * 获取层参数详情文本
 */
function getLayerDetail(layer) {
  const data = layer.data;
  switch (layer.type) {
    case 'input':
      return data.size;
    case 'conv':
      let convDetail = `k=${data.kernel}`;
      if (data.channels) convDetail += `, c=${data.channels}`;
      if (data.stride) convDetail += `, s=${data.stride}`;
      return convDetail;
    case 'pool':
      return `k=${data.kernel}${data.stride ? `, s=${data.stride}` : ''}`;
    case 'fc':
      return data.size;
    case 'output':
      return data.size;
    case 'embedding':
      return data.size;
    case 'attention':
      return `heads=${data.heads || 'N/A'}`;
    default:
      return null;
  }
}

/**
 * 生成连接箭头
 */
function generateConnection(conn) {
  if (conn.type === 'sequential') {
    return `<path d="M${conn.x1} ${conn.y1} L${conn.x2} ${conn.y2}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`;
  }
  return '';
}

/**
 * 生成行间连接（折线）
 * 支持单向 (down) 和双向 (bidirectional) 连接
 */
function generateRowConnection(conn) {
  const offset = SVG_CONFIG.arrowWidth * 5;  // 双向箭头的左右偏移量

  if (conn.direction === 'bidirectional') {
    // 双向连接：两条平行折线，左线下行（箭头向下），右线上行（箭头向上）
    const leftPath = `<path d="M${conn.fromX - offset} ${conn.fromY} L${conn.fromX - offset} ${conn.midY} L${conn.toX - offset} ${conn.midY} L${conn.toX - offset} ${conn.toY}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`;
    const rightPath = `<path d="M${conn.toX + offset} ${conn.toY} L${conn.toX + offset} ${conn.midY} L${conn.fromX + offset} ${conn.midY} L${conn.fromX + offset} ${conn.fromY}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`;

    let result = leftPath + '\n' + rightPath;

    // 标注文本居中显示在两条线之间
    if (conn.label) {
      const labelX = conn.labelX;
      const labelY = conn.labelY;
      result += `\n<text x="${labelX}" y="${labelY}" text-anchor="start" font-size="${SVG_CONFIG.fontSizeDetail}" font-family="Arial, sans-serif" fill="#666">${conn.label}</text>`;
    }

    return result;
  }

  // 单向连接（默认）
  const path = `<path d="M${conn.fromX} ${conn.fromY} L${conn.fromX} ${conn.midY} L${conn.toX} ${conn.midY} L${conn.toX} ${conn.toY}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`;

  // 标注文本（如果有）
  if (conn.label) {
    const label = `<text x="${conn.labelX}" y="${conn.labelY}" text-anchor="start" font-size="${SVG_CONFIG.fontSizeDetail}" font-family="Arial, sans-serif" fill="#666">${conn.label}</text>`;
    return path + '\n' + label;
  }

  return path;
}

/**
 * 生成 section 内元素之间的连接（包括 blocks）
 * 水平布局：直线连接
 */
function generateSectionInternalConnection(conn) {
  // section 内相邻元素的直线连接
  return `<path d="M${conn.x1} ${conn.y1} L${conn.x2} ${conn.y2}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`;
}

/**
 * 生成 section 内换行连接（折线）
 */
function generateSectionRowConnection(conn) {
  // 折线路径：从上一行最后元素 -> 向下到中间 -> 水平移动 -> 向上到下一行第一个元素
  return `<path d="M${conn.fromX} ${conn.fromY} L${conn.fromX} ${conn.midY} L${conn.toX} ${conn.midY} L${conn.toX} ${conn.toY}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`;
}

/**
 * 生成 block 连接（入口/出口箭头）
 * @param {object} conn - 连接信息
 * @returns {string} SVG 字符串
 */
function generateBlockConnection(conn) {
  // block 入口/出口连接（直线）
  return `<path d="M${conn.x1} ${conn.y1} L${conn.x2} ${conn.y2}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`;
}

/**
 * 生成错误提示 SVG
 * @param {string} errorMessage - 错误信息
 * @returns {string} SVG 字符串
 */
function generateErrorSvg(errorMessage) {
  const width = 600;
  const height = 200;
  const scale = SVG_CONFIG.scale;

  const svgParts = [];
  svgParts.push(`<svg viewBox="0 0 ${width} ${height}" width="${width * scale}" height="${height * scale}" xmlns="http://www.w3.org/2000/svg">`);

  // 白色背景
  svgParts.push(`<rect width="${width}" height="${height}" fill="#ffffff"/>`);

  // 错误框背景
  svgParts.push(`<rect x="30" y="30" width="${width - 60}" height="${height - 60}" fill="#f8d7da" stroke="#f5a5a5" stroke-width="3" rx="15"/>`);

  // 错误图标（感叹号）
  const iconX = 60;
  const iconY = 70;
  svgParts.push(`<circle cx="${iconX}" cy="${iconY}" r="25" fill="#dc3545"/>`);
  svgParts.push(`<text x="${iconX}" y="${iconY + 8}" text-anchor="middle" font-size="36" font-weight="bold" font-family="Arial, sans-serif" fill="#fff">!</text>`);

  // 错误标题
  svgParts.push(`<text x="100" y="75" font-size="28" font-weight="bold" font-family="Arial, sans-serif" fill="#721c24">生成错误</text>`);

  // 错误信息（换行处理）
  const lines = wrapText(errorMessage, 50);
  let textY = 110;
  lines.forEach(line => {
    svgParts.push(`<text x="100" y="${textY}" font-size="18" font-family="Arial, sans-serif" fill="#721c24">${line}</text>`);
    textY += 24;
  });

  // 提示信息
  svgParts.push(`<text x="${width / 2}" y="${height - 20}" text-anchor="middle" font-size="14" font-family="Arial, sans-serif" fill="#999">请检查 YAML 格式是否正确</text>`);

  svgParts.push('</svg>');

  return svgParts.join('\n');
}

/**
 * 生成块容器 SVG
 * @param {object} block - 块布局数据
 * @returns {string} SVG 字符串
 */
function generateBlock(block) {
  const parts = [];
  const colors = COLORS[`block_${block.type}`] || COLORS.block_residual;
  const centerX = block.x + block.width / 2;
  const collapsedConfig = globalThis.COLLAPSED_CONFIG || {};
  const isCollapsed = block.layers && block.layers.some(l => l.collapsed);
  const strokeWidth = isCollapsed ? (collapsedConfig.strokeWidth || SVG_CONFIG.strokeWidth) : SVG_CONFIG.strokeWidth;
  const cornerRadius = isCollapsed ? (collapsedConfig.cornerRadius || SVG_CONFIG.cornerRadius) : SVG_CONFIG.cornerRadius;

  // 容器矩形（虚线边框）- collapsed 使用更细的边框
  parts.push(`<rect x="${block.x}" y="${block.y}" width="${block.width}" height="${block.height}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="${strokeWidth}" stroke-dasharray="${9},${9}" rx="${cornerRadius}"/>`);

  // 标题（block 名称或带重复标记）
  // 显示 ×N 当：expand !== true (即 false、collapsed 或 undefined/默认值) 且 repeat > 1
  let titleText = block.name;
  if (block.type === 'stack' && block.expand !== true && block.repeat > 1) {
    titleText = `${block.name} ×${block.repeat}`;
  }
  const titleY = block.titleY || (block.y + SVG_CONFIG.fontSizeSection);
  parts.push(`<text x="${centerX}" y="${titleY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeSection}" font-weight="bold" font-family="Arial, sans-serif" fill="#333">${titleText}</text>`);

  // 内部层
  if (block.layers) {
    block.layers.forEach(layer => {
      if (layer.collapsed) {
        parts.push(generateCollapsedLayer(layer));
      } else {
        parts.push(generateLayer(layer));
      }
    });
  }

  // 并行块：生成 fork/merge 连接
  if (block.type === 'parallel' && block.forkPoint && block.mergePoint) {
    parts.push(generateParallelConnections(block));
  }

  // 残差块：生成内部连接
  if (block.type === 'residual') {
    if (block.residualConnections) {
      parts.push(generateResidualConnections(block));
    } else if (block.skipConnection) {
      // 兼容旧格式
      parts.push(generateSkipConnection(block));
    }
    // 生成 block 内部的顺序连接（如 Conv1 → Conv2）
    if (block.connections && block.connections.length > 0) {
      block.connections.forEach(conn => {
        parts.push(generateConnection(conn));
      });
    }
  }

  return parts.join('\n');
}

/**
 * 生成并行块的 fork/merge 连接线
 * 支持多层分支：只连接每个分支的第一个层和最后一个层
 * @param {object} block - 块布局数据
 * @returns {string} SVG 字符串
 */
function generateParallelConnections(block) {
  const parts = [];
  const fork = block.forkPoint;
  const merge = block.mergePoint;
  const direction = block.direction || 'horizontal';
  const collapsedConfig = globalThis.COLLAPSED_CONFIG || {};
  const isCollapsed = block.layers && block.layers.some(l => l.collapsed);
  const arrowWidth = isCollapsed ? (collapsedConfig.arrowWidth || SVG_CONFIG.arrowWidth) : SVG_CONFIG.arrowWidth;
  const arrowMarker = isCollapsed ? 'arrowhead-collapsed' : 'arrowhead';

  if (!fork || !merge || !block.layers || block.layers.length === 0) {
    return '';
  }

  // 如果有 branchLayerGroups，使用它来确定每个分支的首尾层
  if (block.branchLayerGroups && block.branchLayerGroups.length > 0) {
    if (direction === 'vertical') {
      // 垂直布局：使用折线连接，不穿过block内部内容
      // Fork: 从fork点向下 -> 水平分叉 -> 向下到各分支顶部
      // 需要一个分叉点，位于标题下方、第一层上方之间的区域
      const firstLayer = block.branchLayerGroups[0][0];
      const forkSplitY = fork.y + arrowWidth * 2; // fork点稍微向下作为分叉点

      // 绘制主fork线（从fork点到分叉点）
      parts.push(`<path d="M${fork.x} ${fork.y} L${fork.x} ${forkSplitY}" stroke="#999" stroke-width="${arrowWidth}" fill="none"/>`);

      // 从分叉点水平分叉到各分支，再向下到分支顶部
      block.branchLayerGroups.forEach(branchLayers => {
        if (branchLayers.length === 0) return;
        const firstLayer = branchLayers[0];
        const firstLayerCenterX = firstLayer.x + firstLayer.width / 2;

        // 从分叉点水平到分支中心，然后向下到分支顶部（箭头）
        parts.push(`<path d="M${fork.x} ${forkSplitY} L${firstLayerCenterX} ${forkSplitY} L${firstLayerCenterX} ${firstLayer.y}" stroke="#999" stroke-width="${arrowWidth}" fill="none" marker-end="url(#${arrowMarker})"/>`);

        // 分支内部连接
        for (let i = 0; i < branchLayers.length - 1; i++) {
          const fromLayer = branchLayers[i];
          const toLayer = branchLayers[i + 1];
          const fromX = fromLayer.x + fromLayer.width / 2;
          parts.push(`<path d="M${fromX} ${fromLayer.y + fromLayer.height} L${fromX} ${toLayer.y}" stroke="#999" stroke-width="${arrowWidth}" fill="none" marker-end="url(#${arrowMarker})"/>`);
        }

        // Merge: 从分支底部向下 -> 水平汇聚 -> 向下到merge点
        const lastLayer = branchLayers[branchLayers.length - 1];
        const lastLayerCenterX = lastLayer.x + lastLayer.width / 2;
        const mergeSplitY = merge.y - arrowWidth * 2; // merge点稍微向上作为汇聚点

        // 从分支底部向下到汇聚点水平线，然后水平到中心，然后向下到merge点
        parts.push(`<path d="M${lastLayerCenterX} ${lastLayer.y + lastLayer.height} L${lastLayerCenterX} ${mergeSplitY} L${merge.x} ${mergeSplitY} L${merge.x} ${merge.y}" stroke="#999" stroke-width="${arrowWidth}" fill="none" marker-end="url(#${arrowMarker})"/>`);
      });

    } else {
      // 水平布局（默认）- 同样使用折线避免穿过内容
      // 找到所有分支的第一层，确定分叉点的Y位置
      const firstLayers = block.branchLayerGroups.map(bg => bg[0]);
      const minY = Math.min(...firstLayers.map(l => l.y));
      const maxY = Math.max(...firstLayers.map(l => l.y + l.height));
      const forkSplitX = fork.x + arrowWidth * 2; // fork点稍微向右作为分叉点

      // 绘制主fork线（从fork点到分叉点）
      parts.push(`<path d="M${fork.x} ${fork.y} L${forkSplitX} ${fork.y}" stroke="#999" stroke-width="${arrowWidth}" fill="none"/>`);

      block.branchLayerGroups.forEach(branchLayers => {
        if (branchLayers.length === 0) return;
        const firstLayer = branchLayers[0];
        const lastLayer = branchLayers[branchLayers.length - 1];
        const firstLayerCenterY = firstLayer.y + firstLayer.height / 2;

        // 从分叉点向下/上到分支中心，然后向右到分支左侧（箭头）
        parts.push(`<path d="M${forkSplitX} ${fork.y} L${forkSplitX} ${firstLayerCenterY} L${firstLayer.x} ${firstLayerCenterY}" stroke="#999" stroke-width="${arrowWidth}" fill="none" marker-end="url(#${arrowMarker})"/>`);

        // 分支内部连接
        for (let i = 0; i < branchLayers.length - 1; i++) {
          const fromLayer = branchLayers[i];
          const toLayer = branchLayers[i + 1];
          const fromY = fromLayer.y + fromLayer.height / 2;
          parts.push(`<path d="M${fromLayer.x + fromLayer.width} ${fromY} L${toLayer.x} ${fromY}" stroke="#999" stroke-width="${arrowWidth}" fill="none" marker-end="url(#${arrowMarker})"/>`);
        }

        // Merge: 从分支右侧 -> 水平汇聚 -> 向右到merge点
        const lastLayerCenterY = lastLayer.y + lastLayer.height / 2;
        const mergeSplitX = merge.x - arrowWidth * 2;

        parts.push(`<path d="M${lastLayer.x + lastLayer.width} ${lastLayerCenterY} L${mergeSplitX} ${lastLayerCenterY} L${mergeSplitX} ${merge.y} L${merge.x} ${merge.y}" stroke="#999" stroke-width="${arrowWidth}" fill="none" marker-end="url(#${arrowMarker})"/>`);
      });
    }
  } else {
    // 旧格式：所有层都是独立分支
    if (direction === 'vertical') {
      block.layers.forEach(layer => {
        const layerCenterX = layer.x + layer.width / 2;
        // Fork 线：折线连接
        parts.push(`<path d="M${fork.x} ${fork.y} L${fork.x} ${fork.y + 10} L${layerCenterX} ${fork.y + 10} L${layerCenterX} ${layer.y}" stroke="#999" stroke-width="${arrowWidth}" fill="none" marker-end="url(#${arrowMarker})"/>`);
        // Merge 线：折线连接
        parts.push(`<path d="M${layerCenterX} ${layer.y + layer.height} L${layerCenterX} ${merge.y - 10} L${merge.x} ${merge.y - 10} L${merge.x} ${merge.y}" stroke="#999" stroke-width="${arrowWidth}" fill="none" marker-end="url(#${arrowMarker})"/>`);
      });
    } else {
      block.layers.forEach(layer => {
        const layerCenterY = layer.y + layer.height / 2;
        // Fork 线：折线连接
        parts.push(`<path d="M${fork.x} ${fork.y} L${fork.x + 10} ${fork.y} L${fork.x + 10} ${layerCenterY} L${layer.x} ${layerCenterY}" stroke="#999" stroke-width="${arrowWidth}" fill="none" marker-end="url(#${arrowMarker})"/>`);
        // Merge 线：折线连接
        parts.push(`<path d="M${layer.x + layer.width} ${layerCenterY} L${merge.x - 10} ${layerCenterY} L${merge.x - 10} ${merge.y} L${merge.x} ${merge.y}" stroke="#999" stroke-width="${arrowWidth}" fill="none" marker-end="url(#${arrowMarker})"/>`);
      });
    }
  }

  return parts.join('\n');
}

/**
 * 生成残差块的内部连接（新的折线方式）
 * @param {object} block - 块布局数据
 * @returns {string} SVG 字符串
 */
function generateResidualConnections(block) {
  const parts = [];
  const conn = block.residualConnections;
  const collapsedConfig = globalThis.COLLAPSED_CONFIG || {};
  const isCollapsed = block.layers && block.layers.some(l => l.collapsed);
  const strokeWidth = isCollapsed ? (collapsedConfig.arrowWidth || SVG_CONFIG.arrowWidth) : SVG_CONFIG.arrowWidth;
  const arrowMarker = isCollapsed ? 'arrowhead-collapsed' : 'arrowhead';

  if (!conn) return '';

  // 生成折线
  function generatePolyline(connData, addArrow = true) {
    const points = connData.points;
    if (!points || points.length < 2) return '';

    // 构建 path d 属性
    let d = `M${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L${points[i].x} ${points[i].y}`;
    }

    const arrow = addArrow ? ` marker-end="url(#${arrowMarker})"` : '';
    return `<path d="${d}" stroke="#999" stroke-width="${strokeWidth}" fill="none"${arrow}/>`;
  }

  // 生成直线
  function generateLine(connData, addArrow = true) {
    const arrow = addArrow ? ` marker-end="url(#${arrowMarker})"` : '';
    return `<path d="M${connData.from.x} ${connData.from.y} L${connData.to.x} ${connData.to.y}" stroke="#999" stroke-width="${strokeWidth}" fill="none"${arrow}/>`;
  }

  // Skip connection（折线，用于 arc 样式的 identity shortcut）
  if (conn.skip) {
    parts.push(generatePolyline(conn.skip, true));
  }

  // 入口分叉到 Conv1（折线）
  if (conn.entryToConv1) {
    parts.push(generatePolyline(conn.entryToConv1, true));
  }

  // 入口分叉到 Skip（折线，用于 parallel 样式的 projection shortcut）
  if (conn.entryToSkip) {
    parts.push(generatePolyline(conn.entryToSkip, true));
  }

  // 主路径（直线）
  if (conn.conv1ToConv2) {
    parts.push(generateLine(conn.conv1ToConv2, true));
  }

  // Conv2 出口汇聚（折线）
  if (conn.conv2ToExit) {
    parts.push(generatePolyline(conn.conv2ToExit, true));
  }

  // Skip 出口汇聚（折线，用于 parallel 样式的 projection shortcut）
  if (conn.skipToExit) {
    parts.push(generatePolyline(conn.skipToExit, true));
  }

  return parts.join('\n');
}

/**
 * 生成残差块的 skip 连接（兼容旧格式）
 * @param {object} block - 块布局数据
 * @returns {string} SVG 字符串
 */
function generateSkipConnection(block) {
  const parts = [];
  const skip = block.skipConnection;
  const collapsedConfig = globalThis.COLLAPSED_CONFIG || {};
  const isCollapsed = block.layers && block.layers.some(l => l.collapsed);
  const strokeWidth = isCollapsed ? (collapsedConfig.arrowWidth || SVG_CONFIG.arrowWidth) : SVG_CONFIG.arrowWidth;
  const arrowMarker = isCollapsed ? 'arrowhead-collapsed' : 'arrowhead';

  if (!skip) {
    // Legacy format: check for skipArc/skipLine
    if (block.skipStyle === 'arc' && block.skipArc) {
      const arc = block.skipArc;
      parts.push(`<path d="M${arc.x1} ${arc.y1} Q${(arc.x1 + arc.x2) / 2} ${arc.midY} ${arc.x2} ${arc.y2}" stroke="#999" stroke-width="${strokeWidth}" fill="none" marker-end="url(#${arrowMarker})"/>`);
    }
    if (block.skipStyle === 'parallel' && block.skipLine) {
      const line = block.skipLine;
      parts.push(`<path d="M${line.x1} ${line.y1} L${line.x2} ${line.y2}" stroke="#999" stroke-width="${strokeWidth}" fill="none" marker-end="url(#${arrowMarker})"/>`);
    }
    return parts.join('\n');
  }

  if (skip.type === 'arc') {
    // 水平布局的弧形：从第一层顶部绕到最后一层顶部
    const midY = skip.startY - skip.radius;
    parts.push(`<path d="M${skip.startX} ${skip.startY} Q${(skip.startX + skip.endX) / 2} ${midY} ${skip.endX} ${skip.endY}" stroke="#999" stroke-width="${strokeWidth}" fill="none" marker-end="url(#${arrowMarker})"/>`);
  } else if (skip.type === 'arc-vertical') {
    // 垂直布局的弧形：从第一层左侧绕到最后一层左侧
    const midX = skip.startX - skip.radius;
    parts.push(`<path d="M${skip.startX} ${skip.startY} Q${midX} ${(skip.startY + skip.endY) / 2} ${skip.endX} ${skip.endY}" stroke="#999" stroke-width="${strokeWidth}" fill="none" marker-end="url(#${arrowMarker})"/>`);
  } else if (skip.type === 'parallel') {
    // 平行样式：直线（无 skip 层，纯 identity shortcut）
    parts.push(`<path d="M${skip.startX} ${skip.startY} L${skip.endX} ${skip.startY} L${skip.endX} ${skip.endY}" stroke="#999" stroke-width="${strokeWidth}" fill="none" marker-end="url(#${arrowMarker})"/>`);
  } else if (skip.type === 'parallel-with-layers') {
    // 平行样式 + skip 层：路径绕过主路径层，不穿过 Conv
    // 1. 从 block 入口中心向下到 skip 层入口高度，然后水平到 skip 层
    // 2. 从 skip 层出口水平到 block 出口，然后向上到 block 出口中心

    const forkX = skip.forkX;
    const forkY = skip.forkY;  // block 入口中心
    const mergeX = skip.mergeX;
    const mergeY = skip.mergeY;  // block 出口中心
    const skipCenterX = skip.skipCenterX;

    // 1. 从 block 入口中心向下到 skip 层入口 y，然后水平到 skip 层中心
    parts.push(`<path d="M${forkX} ${forkY} L${forkX} ${skip.skipLayerStartY} L${skipCenterX} ${skip.skipLayerStartY}" stroke="#999" stroke-width="${strokeWidth}" fill="none" marker-end="url(#${arrowMarker})"/>`);

    // 2. 从 skip 层出口水平到 block 出口 x，然后向上到 block 出口中心
    parts.push(`<path d="M${skipCenterX} ${skip.skipLayerEndY} L${mergeX} ${skip.skipLayerEndY} L${mergeX} ${mergeY}" stroke="#999" stroke-width="${strokeWidth}" fill="none" marker-end="url(#${arrowMarker})"/>`);
  } else if (skip.type === 'parallel-vertical') {
    // 垂直布局的平行样式
    parts.push(`<path d="M${skip.startX} ${skip.startY} L${skip.endX} ${skip.startY} L${skip.endX} ${skip.endY}" stroke="#999" stroke-width="${strokeWidth}" fill="none" marker-end="url(#${arrowMarker})"/>`);
  }

  return parts.join('\n');
}

/**
 * 文本换行辅助函数
 * @param {string} text - 原始文本
 * @param {number} maxChars - 每行最大字符数
 * @returns {array} 分行后的文本数组
 */
function wrapText(text, maxChars) {
  const lines = [];
  let remaining = text;
  while (remaining.length > maxChars) {
    lines.push(remaining.substring(0, maxChars));
    remaining = remaining.substring(maxChars);
  }
  if (remaining.length > 0) {
    lines.push(remaining);
  }
  return lines;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateSvg,
    generateDefs,
    generateTitle,
    generateSection,
    generateLayer,
    generateCollapsedLayer,
    generateLayerContent,
    generateConnection,
    generateRowConnection,
    generateSectionRowConnection,
    generateSectionInternalConnection,
    generateBlockConnection,
    generateErrorSvg,
    generateBlock,
    generateParallelConnections,
    generateResidualConnections,
    generateSkipConnection,
    getDisplayName,
    getLayerDetail,
    COLORS,
    SVG_CONFIG
  };
}