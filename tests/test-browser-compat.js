/**
 * 浏览器兼容性测试
 * 验证各模块正确导出到 globalThis，确保浏览器环境正常工作
 */

test('LAYOUT_CONFIG 已导出到 globalThis', function() {
  assertEqual(typeof globalThis.LAYOUT_CONFIG, 'object', 'LAYOUT_CONFIG 应为对象');
  assertEqual(globalThis.LAYOUT_CONFIG.layerWidth, 216, 'layerWidth 应为 216');
});

test('COLLAPSED_CONFIG 已导出到 globalThis', function() {
  assertEqual(typeof globalThis.COLLAPSED_CONFIG, 'object', 'COLLAPSED_CONFIG 应为对象');
  assertEqual(globalThis.COLLAPSED_CONFIG.layerWidth, 50, 'layerWidth 应为 50');
  assertEqual(globalThis.COLLAPSED_CONFIG.layerHeight, 24, 'layerHeight 应为 24');
  assertEqual(globalThis.COLLAPSED_CONFIG.horizontalLayerWidth, 82, 'horizontalLayerWidth 应为 82');
});

test('parseNetworkYaml 已导出到 globalThis', function() {
  assertEqual(typeof globalThis.parseNetworkYaml, 'function', 'parseNetworkYaml 应为函数');
});

test('calculateLayout 已导出到 globalThis', function() {
  assertEqual(typeof globalThis.calculateLayout, 'function', 'calculateLayout 应为函数');
});

test('generateSvg 已导出到 globalThis', function() {
  assertEqual(typeof globalThis.generateSvg, 'function', 'generateSvg 应为函数');
});

test('generateErrorSvg 已导出到 globalThis', function() {
  assertEqual(typeof globalThis.generateErrorSvg, 'function', 'generateErrorSvg 应为函数');
});

test('generateBlock 已导出到 globalThis', function() {
  assertEqual(typeof globalThis.generateBlock, 'function', 'generateBlock 应为函数');
});

test('generateCollapsedLayer 已导出到 globalThis', function() {
  assertEqual(typeof globalThis.generateCollapsedLayer, 'function', 'generateCollapsedLayer 应为函数');
});

test('generateSkipConnection 已导出到 globalThis', function() {
  assertEqual(typeof globalThis.generateSkipConnection, 'function', 'generateSkipConnection 应为函数');
});

test('COLORS 已导出到 globalThis', function() {
  assertEqual(typeof globalThis.COLORS, 'object', 'COLORS 应为对象');
  assertEqual(typeof globalThis.COLORS.conv, 'object', 'COLORS.conv 应存在');
});

test('SVG_CONFIG 已导出到 globalThis', function() {
  assertEqual(typeof globalThis.SVG_CONFIG, 'object', 'SVG_CONFIG 应为对象');
});

test('getTemplate 已导出到 globalThis', function() {
  assertEqual(typeof globalThis.getTemplate, 'function', 'getTemplate 应为函数');
});

test('googlenet_collapsed 模板存在', function() {
  const yaml = globalThis.getTemplate('googlenet_collapsed');
  assertEqual(yaml.length > 0, true, 'googlenet_collapsed 模板应存在');
  assertEqual(yaml.includes('expand: "collapsed"'), true, '模板应包含 collapsed 配置');
});

test('完整流程测试：从 YAML 到 SVG', function() {
  const yaml = globalThis.getTemplate('googlenet_collapsed');
  const parsed = globalThis.parseNetworkYaml(yaml);
  const layout = globalThis.calculateLayout(parsed);
  const svg = globalThis.generateSvg(layout);

  assertEqual(svg.length > 0, true, 'SVG 应有内容');
  assertEqual(svg.includes('<svg'), true, 'SVG 应包含 svg 标签');
  assertEqual(svg.includes('Inception_3a'), true, 'SVG 应包含 Inception_3a');
});