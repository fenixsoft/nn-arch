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

// 样式配置
const SVG_CONFIG = {
  fontSizeName: 14,
  fontSizeDetail: 12,
  fontSizeTitle: 20,
  fontSizeSection: 14,
  cornerRadius: 6,
  strokeWidth: 1,
  arrowWidth: 1
};

/**
 * 生成 SVG 字符串
 * @param {object} layout - 布局结果
 * @returns {string} SVG 字符串
 */
function generateSvg(layout) {
  const svgParts = [];

  // SVG 开头
  svgParts.push(`<svg viewBox="0 0 ${layout.width} ${layout.height}" width="${layout.width}" height="${layout.height}" xmlns="http://www.w3.org/2000/svg">`);

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

  // SVG 结尾
  svgParts.push('</svg>');

  return svgParts.join('\n');
}

/**
 * 生成定义区（defs）
 */
function generateDefs() {
  return `
  <defs>
    <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="#999"/>
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
  return `<rect x="${section.x}" y="${section.y}" width="${section.width}" height="${section.height}" fill="none" stroke="#b8d8e8" stroke-width="1" stroke-dasharray="5,5" rx="${SVG_CONFIG.cornerRadius}"/>
<text x="${section.x + section.width / 2}" y="${section.y + SVG_CONFIG.fontSizeSection}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeSection}" font-family="Arial, sans-serif" fill="#5a7d9a">${section.name}</text>`;
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
  const nameY = layer.y + 20;
  let content = `<text x="${centerX}" y="${nameY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeName}" font-weight="bold" font-family="Arial, sans-serif" fill="#333">${layer.name}</text>`;

  // 参数详情
  const detailY = layer.y + 38;
  const detail = getLayerDetail(layer);
  if (detail) {
    content += `<text x="${centerX}" y="${detailY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeDetail}" font-family="Arial, sans-serif" fill="#666">${detail}</text>`;
  }

  // 输出尺寸
  if (data.out) {
    const outY = layer.y + 52;
    content += `<text x="${centerX}" y="${outY}" text-anchor="middle" font-size="${SVG_CONFIG.fontSizeDetail}" font-family="Arial, sans-serif" fill="#666">${data.out}</text>`;
  }

  // 激活函数
  if (data.act) {
    const actY = layer.y + 66;
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
  // 其他类型连接（曲线等）将在后续任务实现
  return '';
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
    getLayerDetail,
    COLORS,
    SVG_CONFIG
  };
}