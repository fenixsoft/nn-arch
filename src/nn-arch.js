/**
 * nn-arch.js - 神经网络架构可视化工具
 * 外部调用 API
 */

// Node.js 环境导入依赖，浏览器环境依赖通过 script 标签引入
let parseNetworkYaml, calculateLayout, generateSvg, getTemplate, getTemplateList;

if (typeof require !== 'undefined') {
  parseNetworkYaml = require('./parser.js').parseNetworkYaml;
  calculateLayout = require('./layout.js').calculateLayout;
  generateSvg = require('./svg-generator.js').generateSvg;
  getTemplate = require('./templates.js').getTemplate;
  getTemplateList = require('./templates.js').getTemplateList;
}

const NNArch = {
  /**
   * 从 YAML 文本生成 SVG
   * @param {string} yamlText - YAML 格式的网络定义文本
   * @returns {string} SVG 字符串，可直接插入 HTML
   * @throws {Error} 如果 YAML 解析失败或格式错误
   *
   * 示例：
   * const yaml = `
   * name: SimpleNet
   * layout: horizontal
   * layers:
   *   - {name: Input, type: input, size: "224x224x3"}
   *   - {name: Conv1, type: conv, kernel: 3, channels: 64, act: ReLU}
   *   - {name: Output, type: output, size: 10}
   * `;
   * const svg = NNArch.generateFromYaml(yaml);
   */
  generateFromYaml: function(yamlText) {
    // 解析 YAML
    const network = parseNetworkYaml(yamlText);

    // 计算布局
    const layout = calculateLayout(network);

    // 生成 SVG
    const svg = generateSvg(layout);

    return svg;
  },

  /**
   * 从预置模板生成 SVG
   * @param {string} templateKey - 模板键名：'alexnet', 'vgg16', 'resnet18', 'transformer'
   * @returns {string} SVG 字符串
   *
   * 示例：
   * const svg = NNArch.generateFromTemplate('vgg16');
   */
  generateFromTemplate: function(templateKey) {
    const yamlText = getTemplate(templateKey);
    if (!yamlText) {
      throw new Error(`模板 '${templateKey}' 不存在。可用模板: alexnet, vgg16, resnet18, transformer`);
    }
    return this.generateFromYaml(yamlText);
  },

  /**
   * 获取可用模板列表
   * @returns {array} 模板列表，每项包含 {key, name}
   *
   * 示例：
   * const templates = NNArch.getTemplateList();
   * // [{key: 'alexnet', name: 'AlexNet'}, {key: 'vgg16', name: 'VGG16'}, ...]
   */
  getTemplateList: function() {
    return getTemplateList();
  },

  /**
   * 获取模板 YAML 文本
   * @param {string} templateKey - 模板键名
   * @returns {string} YAML 文本
   */
  getTemplateYaml: function(templateKey) {
    return getTemplate(templateKey);
  },

  /**
   * 下载 SVG 文件
   * @param {string} svgContent - SVG 字符串
   * @param {string} filename - 文件名（不含扩展名）
   *
   * 示例：
   * const svg = NNArch.generateFromYaml(yaml);
   * NNArch.downloadSvg(svg, 'MyNetwork');
   */
  downloadSvg: function(svgContent, filename) {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_arch.svg`;
    a.click();

    URL.revokeObjectURL(url);
  },

  /**
   * 版本信息
   */
  version: '1.0.4'
};

// 导出模块（支持 Node.js 和浏览器）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NNArch;
}