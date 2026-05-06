/**
 * YAML 网络定义解析器
 * 将 YAML 文本转换为结构化的网络定义对象
 */

// 获取 js-yaml 库（Node.js 导入或浏览器全局变量）
let jsyaml;
if (typeof require !== 'undefined') {
  jsyaml = require('js-yaml');
} else if (typeof window !== 'undefined' && window.jsyaml) {
  jsyaml = window.jsyaml;
} else if (typeof globalThis !== 'undefined' && globalThis.jsyaml) {
  jsyaml = globalThis.jsyaml;
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

  // 先处理 layers，建立 id -> layer 映射
  let layers = [];
  if (parsed.layers) {
    layers = parsed.layers.map(layer => normalizeLayer(layer));
  }

  // 验证 id 唯一性
  const idSet = new Set();
  const nameToIdMap = new Map();  // 记录 name -> id 的映射，用于更详细的错误提示
  for (const layer of layers) {
    const layerId = layer.id;
    const layerName = layer.name;

    if (idSet.has(layerId)) {
      // 检查是否是因为 name 重复且没有显式 id 导致的
      const existingLayer = nameToIdMap.get(layerId);
      if (existingLayer && existingLayer.id === existingLayer.name) {
        // 原层也是用 name 作为默认 id，说明是因为 name 重复
        throw new Error(`层 name 重复导致 id 冲突: "${layerId}"。\n提示: 多个层使用相同 name 时，请为每个层指定不同的 id，且 YAML inline 格式中冒号后需有空格（如 id: block1）`);
      }
      throw new Error(`层 id 重复: "${layerId}"`);
    }
    idSet.add(layerId);
    nameToIdMap.set(layerName, layer);
  }

  const network = {
    name: parsed.name || 'Unnamed Network',
    layout: parsed.layout || 'horizontal',
    sections: [],  // 稍后处理
    layers: layers,
    blocks: parsed.blocks ? parsed.blocks.map(block => normalizeBlock(block)) : [],
    connections: [],
    layersAfterBlocks: parsed.layers_after_blocks ? parsed.layers_after_blocks.map(layer => normalizeLayer(layer)) : [],
    rowLabels: parsed.row_labels || []  // 行间连接标注
  };

  // 处理 sections，将层名称转换为 id
  if (parsed.sections) {
    network.sections = parsed.sections.map(s => normalizeSection(s, network.layers));
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
    id: layer.id || layer.name,  // id 默认使用 name，但必须唯一
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
 * @param {array} layers - 已标准化的层列表（用于名称到 id 的转换）
 * @returns {object} 标准化后的 section 定义
 */
function normalizeSection(section, layers) {
  // 将 sections.layers 中的名称转换为 id
  const layerIds = (section.layers || []).map(layerRef => {
    // 如果已经是 id（直接引用），直接使用
    // 否则查找对应层的 id
    const layer = layers.find(l => l.id === layerRef || l.name === layerRef);
    if (layer) {
      return layer.id;
    }
    // 找不到时返回原始引用（可能是错误）
    return layerRef;
  });

  return {
    name: section.name,
    layers: layerIds,  // 使用 id 而不是 name
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
    norm: block.norm || null,
    style: block.style || 'arc',
    expand: block.expand || false
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