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
 */
function generateLayer(layer) {
  const colors = COLORS[layer.type] || COLORS.input;
  const content = generateLayerContent(layer);

  return `
<rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="${SVG_CONFIG.strokeWidth}" rx="${SVG_CONFIG.cornerRadius}"/>
${content}`;
}

/**
 * 生成层内容文本（包含 pool、dropout 等）
 */
function generateLayerContent(layer) {
  const centerX = layer.x + layer.width / 2;
  const data = layer.data;

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
      return `k=${data.kernel}${data.stride ? `, s=${data.stride}` : ''}`;
    case 'pool':
      return `k=${data.kernel}${data.stride ? `, s=${data.stride}` : ''}`;
    case 'fc':
      return data.size;
    case 'output':
      return `${data.size} 类`;
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
 */
function generateRowConnection(conn) {
  // 折线路径
  const path = `<path d="M${conn.fromX} ${conn.fromY} L${conn.fromX} ${conn.midY} L${conn.toX} ${conn.midY} L${conn.toX} ${conn.toY}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`;

  // 标注文本（如果有）
  if (conn.label) {
    const label = `<text x="${conn.labelX}" y="${conn.labelY}" text-anchor="start" font-size="${SVG_CONFIG.fontSizeDetail}" font-family="Arial, sans-serif" fill="#666">${conn.label}</text>`;
    return path + '\n' + label;
  }

  return path;
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

  // 容器矩形（虚线边框）
  parts.push(`<rect x="${block.x}" y="${block.y}" width="${block.width}" height="${block.height}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="${SVG_CONFIG.strokeWidth}" stroke-dasharray="${9},${9}" rx="${SVG_CONFIG.cornerRadius}"/>`);

  // 标题（block 名称或带重复标记）
  const titleText = block.repeat ? `${block.name} ×${block.repeat}` : block.name;
  const titleY = block.titleY || (block.y + SVG_CONFIG.fontSizeSection);
  parts.push(`<text x="${centerX}" y="${titleY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeSection}" font-weight="bold" font-family="Arial, sans-serif" fill="#333">${titleText}</text>`);

  // 内部层
  if (block.layers) {
    block.layers.forEach(layer => {
      parts.push(generateLayer(layer));
    });
  }

  // 并行块：生成 fork/merge 连接
  if (block.type === 'parallel' && block.forkPoint && block.mergePoint) {
    parts.push(generateParallelConnections(block));
  }

  // 残差块：生成 skip 连接
  if (block.type === 'residual') {
    parts.push(generateSkipConnection(block));
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

  if (!fork || !merge || !block.layers || block.layers.length === 0) {
    return '';
  }

  // 如果有 branchLayerGroups，使用它来确定每个分支的首尾层
  if (block.branchLayerGroups && block.branchLayerGroups.length > 0) {
    block.branchLayerGroups.forEach(branchLayers => {
      if (branchLayers.length === 0) return;

      const firstLayer = branchLayers[0];
      const lastLayer = branchLayers[branchLayers.length - 1];

      // Fork 线：从 fork 点到分支第一层左侧
      const firstLayerCenterY = firstLayer.y + firstLayer.height / 2;
      parts.push(`<path d="M${fork.x} ${fork.y} L${firstLayer.x} ${firstLayerCenterY}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`);

      // Merge 线：从分支最后一层右侧到 merge 点
      const lastLayerCenterY = lastLayer.y + lastLayer.height / 2;
      parts.push(`<path d="M${lastLayer.x + lastLayer.width} ${lastLayerCenterY} L${merge.x} ${merge.y}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`);

      // 分支内部连接：如果分支有多层，生成层间连接
      for (let i = 0; i < branchLayers.length - 1; i++) {
        const fromLayer = branchLayers[i];
        const toLayer = branchLayers[i + 1];
        const fromY = fromLayer.y + fromLayer.height / 2;
        const toY = toLayer.y + toLayer.height / 2;
        parts.push(`<path d="M${fromLayer.x + fromLayer.width} ${fromY} L${toLayer.x} ${toY}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`);
      }
    });
  } else {
    // 旧格式：所有层都是独立分支
    block.layers.forEach(layer => {
      const layerCenterY = layer.y + layer.height / 2;
      // Fork 线：从 fork 点到层左侧
      parts.push(`<path d="M${fork.x} ${fork.y} L${layer.x} ${layerCenterY}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`);
      // Merge 线：从层右侧到 merge 点
      parts.push(`<path d="M${layer.x + layer.width} ${layerCenterY} L${merge.x} ${merge.y}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`);
    });
  }

  return parts.join('\n');
}

/**
 * 生成残差块的 skip 连接
 * @param {object} block - 块布局数据
 * @returns {string} SVG 字符串
 */
function generateSkipConnection(block) {
  const parts = [];

  // 弧形样式：在块上方绘制弧形
  if (block.skipStyle === 'arc' && block.skipArc) {
    const arc = block.skipArc;
    const dx = arc.x2 - arc.x1;
    const dr = Math.abs(dx);
    // 使用二次贝塞尔曲线绘制弧形
    parts.push(`<path d="M${arc.x1} ${arc.y1} Q${(arc.x1 + arc.x2) / 2} ${arc.midY} ${arc.x2} ${arc.y2}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`);
  }

  // 平行样式：在块下方绘制直线
  if (block.skipStyle === 'parallel' && block.skipLine) {
    const line = block.skipLine;
    parts.push(`<path d="M${line.x1} ${line.y1} L${line.x2} ${line.y2}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`);
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
    generateLayerContent,
    generateConnection,
    generateRowConnection,
    generateSectionRowConnection,
    generateBlockConnection,
    generateErrorSvg,
    generateBlock,
    generateParallelConnections,
    generateSkipConnection,
    getDisplayName,
    getLayerDetail,
    COLORS,
    SVG_CONFIG
  };
}