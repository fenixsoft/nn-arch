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
  identity: { fill: '#f8f8f8', stroke: '#999999' }
};

// 样式配置（放大 250%）
const SVG_CONFIG = {
  fontSizeName: 21,      // 8.4 * 2.5
  fontSizeDetail: 18,    // 7.2 * 2.5
  fontSizeTitle: 30,     // 12 * 2.5
  fontSizeSection: 21,   // 8.4 * 2.5
  cornerRadius: 12,      // 4.8 * 2.5
  strokeWidth: 3,        // 1.2 * 2.5
  arrowWidth: 2.25,      // 0.9 * 2.5
  scale: 2.5             // 显示放大倍数
};

/**
 * 生成 SVG 字符串
 * @param {object} layout - 布局结果
 * @returns {string} SVG 字符串
 */
function generateSvg(layout) {
  const svgParts = [];
  const scale = SVG_CONFIG.scale;

  // 计算显示尺寸（放大 250%）
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

  // 层
  layout.layers.forEach(layer => {
    svgParts.push(generateLayer(layer));
  });

  // 连接箭头
  layout.connections.forEach(conn => {
    svgParts.push(generateConnection(conn));
  });

  // 行间连接（带标注）
  layout.rowConnections.forEach(conn => {
    svgParts.push(generateRowConnection(conn));
  });

  // SVG 结尾
  svgParts.push('</svg>');

  return svgParts.join('\n');
}

/**
 * 生成定义区（defs）
 */
function generateDefs() {
  const arrowScale = SVG_CONFIG.scale;
  return `
  <defs>
    <marker id="arrowhead" markerWidth="${4.8 * arrowScale}" markerHeight="${3.6 * arrowScale}" refX="${4.2 * arrowScale}" refY="${1.8 * arrowScale}" orient="auto">
      <polygon points="0 0, ${4.8 * arrowScale} ${1.8 * arrowScale}, 0 ${3.6 * arrowScale}" fill="#999"/>
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
 * 生成 section 区域框
 */
function generateSection(section) {
  const strokeColor = section.strokeColor || '#b8d8e8';
  const titleY = section.titleY || (section.y + SVG_CONFIG.fontSizeSection);
  return `<rect x="${section.x}" y="${section.y}" width="${section.width}" height="${section.height}" fill="none" stroke="${strokeColor}" stroke-width="${SVG_CONFIG.strokeWidth}" stroke-dasharray="${7.5},${7.5}" rx="${SVG_CONFIG.cornerRadius * 1.25}"/>
<text x="${section.x + section.width / 2}" y="${titleY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeSection}" font-family="Arial, sans-serif" fill="#5a7d9a">${section.name}</text>`;
}

/**
 * 生成层矩形框
 */
function generateLayer(layer) {
  const colors = COLORS[layer.type] || COLORS.input;
  const content = generateLayerContent(layer);

  return `
<rect x="${layer.x}" y="${layer.y}" width="${layer.width}" height="${layer.height}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="${SVG_CONFIG.strokeWidth}" rx="${SVG_CONFIG.cornerRadius}"/>
${content}`;
}

/**
 * 生成层内容文本
 */
function generateLayerContent(layer) {
  const centerX = layer.x + layer.width / 2;
  const data = layer.data;

  // 层名称
  const nameY = layer.y + SVG_CONFIG.fontSizeName + 3;
  let content = `<text x="${centerX}" y="${nameY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeName}" font-weight="bold" font-family="Arial, sans-serif" fill="#333">${layer.name}</text>`;

  // 参数详情
  const detailY = nameY + SVG_CONFIG.fontSizeDetail + 3;
  const detail = getLayerDetail(layer);
  if (detail) {
    content += `<text x="${centerX}" y="${detailY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeDetail}" font-family="Arial, sans-serif" fill="#666">${detail}</text>`;
  }

  // 输出尺寸
  if (data.out) {
    const outY = detailY + SVG_CONFIG.fontSizeDetail;
    content += `<text x="${centerX}" y="${outY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeDetail}" font-family="Arial, sans-serif" fill="#666">${data.out}</text>`;
  }

  // 激活函数
  if (data.act) {
    const actY = (data.out ? detailY + SVG_CONFIG.fontSizeDetail * 2 : detailY + SVG_CONFIG.fontSizeDetail);
    content += `<text x="${centerX}" y="${actY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeDetail}" font-family="Arial, sans-serif" fill="#27ae60">${data.act}</text>`;
  }

  return content;
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
 * 生成行间连接（带标注）
 */
function generateRowConnection(conn) {
  // 垂直连线
  const path = `<path d="M${conn.x1} ${conn.y1} L${conn.x2} ${conn.y2}" stroke="#999" stroke-width="${SVG_CONFIG.arrowWidth}" fill="none" marker-end="url(#arrowhead)"/>`;

  // 标注文本
  const label = `<text x="${conn.labelX}" y="${conn.labelY}" text-anchor="start" font-size="${SVG_CONFIG.fontSizeDetail}" font-family="Arial, sans-serif" fill="#666">${conn.label}</text>`;

  return path + '\n' + label;
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
    getLayerDetail,
    COLORS,
    SVG_CONFIG
  };
}