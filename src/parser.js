/**
 * YAML 网络定义解析器
 * 将 YAML 文本转换为结构化的网络定义对象
 */

// Node.js 环境导入 js-yaml
let jsyaml;
if (typeof require !== 'undefined') {
  jsyaml = require('js-yaml');
}

// 导出给浏览器和 Node.js 使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseNetworkYaml };
}

/**
 * 解析 YAML 网络定义
 * @param {string} yamlText - YAML 格式的网络定义文本
 * @returns {object} 解析后的网络定义对象
 */
function parseNetworkYaml(yamlText) {
  if (!yamlText || yamlText.trim() === '') {
    throw new Error('YAML 解析错误: 输入为空');
  }

  let parsed;
  try {
    parsed = jsyaml.load(yamlText);
  } catch (e) {
    throw new Error('YAML 解析错误: ' + e.message);
  }

  if (!parsed) {
    throw new Error('YAML 解析错误: 解析结果为空');
  }

  const network = {
    name: parsed.name || 'Unnamed Network',
    layout: parsed.layout || 'horizontal',
    sections: parsed.sections ? parsed.sections.map(s => normalizeSection(s)) : [],
    layers: [],
    blocks: parsed.blocks ? parsed.blocks.map(block => normalizeBlock(block)) : [],
    connections: [],
    layersAfterBlocks: parsed.layers_after_blocks ? parsed.layers_after_blocks.map(layer => normalizeLayer(layer)) : [],
    rowLabels: parsed.row_labels || []  // 行间连接标注
  };

  if (parsed.layers) {
    network.layers = parsed.layers.map(layer => normalizeLayer(layer));
  }

  network.connections = generateSequentialConnections(network.layers);

  return network;
}

/**
 * 标准化层定义
 * @param {object} layer - 原始层定义
 * @returns {object} 标准化后的层定义
 */
function normalizeLayer(layer) {
  return {
    name: layer.name,
    type: layer.type,
    size: layer.size || null,
    kernel: layer.kernel || null,
    stride: layer.stride || null,
    channels: layer.channels || null,
    out: layer.out || null,
    act: layer.act || null,
    pool: layer.pool || null,
    dropout: layer.dropout || false,
    norm: layer.norm || null
  };
}

/**
 * 标准化 section 定义
 * @param {object} section - 原始 section 定义
 * @returns {object} 标准化后的 section 定义
 */
function normalizeSection(section) {
  return {
    name: section.name,
    layers: section.layers || [],
    rowLabel: section.row_label || null  // 该 section 后的行间连接标注
  };
}

/**
 * 标准化块定义
 * @param {object} block - 原始块定义
 * @returns {object} 标准化后的块定义
 */
function normalizeBlock(block) {
  return {
    name: block.name,
    type: block.type,
    main: block.main ? block.main.map(layer => normalizeLayer(layer)) : [],
    skip: block.skip,
    branches: block.branches ? block.branches.map(branch => {
      if (Array.isArray(branch)) {
        return branch.map(layer => normalizeLayer(layer));
      }
      return normalizeLayer(branch);
    }) : [],
    layers: block.layers ? block.layers.map(layer => normalizeLayer(layer)) : [],
    merge: block.merge || null,
    repeat: block.repeat || 1,
    act: block.act || null,
    norm: block.norm || null
  };
}

/**
 * 生成顺序连接
 * @param {array} layers - 层数组
 * @returns {array} 连接数组
 */
function generateSequentialConnections(layers) {
  const connections = [];
  for (let i = 0; i < layers.length - 1; i++) {
    connections.push({
      from: layers[i].name,
      to: layers[i + 1].name,
      type: 'sequential'
    });
  }
  return connections;
}