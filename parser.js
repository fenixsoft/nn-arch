/**
 * YAML 网络定义解析器
 * 将 YAML 文本转换为结构化的网络定义对象
 */

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
  // 使用 js-yaml 解析 YAML
  const parsed = jsyaml.load(yamlText);

  // 构建标准化的网络定义对象
  const network = {
    name: parsed.name || 'Unnamed Network',
    layout: parsed.layout || 'horizontal',
    sections: parsed.sections || [],
    layers: [],
    blocks: parsed.blocks || [],
    connections: [],
    layersAfterBlocks: parsed.layers_after_blocks || []
  };

  // 解析主层列表
  if (parsed.layers) {
    network.layers = parsed.layers.map(layer => normalizeLayer(layer));
  }

  // 解析块后层
  if (parsed.layers_after_blocks) {
    network.layersAfterBlocks = parsed.layers_after_blocks.map(layer => normalizeLayer(layer));
  }

  // 生成默认连接（顺序连接）
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