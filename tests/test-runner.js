/**
 * Node.js 测试运行器
 * 用于在命令行运行测试
 */

// 加载 js-yaml
const jsyaml = require('js-yaml');

// 简单的测试框架
let passed = 0, failed = 0;
const failures = [];

globalThis.test = function(name, fn) {
  try {
    fn();
    passed++;
    console.log(`\x1b[32m✓\x1b[0m ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e.message });
    console.log(`\x1b[31m✗\x1b[0m ${name}`);
    console.log(`  \x1b[90m${e.message}\x1b[0m`);
  }
};

globalThis.assertEqual = function(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
};

globalThis.assertDeepEqual = function(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error(`${msg}: expected ${b}, got ${a}`);
  }
};

// 加载 parser.js (它会使用全局的 jsyaml)
globalThis.jsyaml = jsyaml;
const parser = require('../src/parser.js');
globalThis.parseNetworkYaml = parser.parseNetworkYaml;

// 加载 templates.js
const templates = require('../src/templates.js');
globalThis.getTemplate = templates.getTemplate;

// 加载 layout.js
const layout = require('../src/layout.js');
globalThis.calculateLayout = layout.calculateLayout;
globalThis.LAYOUT_CONFIG = layout.LAYOUT_CONFIG;
globalThis.calculateBlockLayout = layout.calculateBlockLayout;

// 加载 svg-generator.js
const svgGenerator = require('../src/svg-generator.js');
globalThis.generateSvg = svgGenerator.generateSvg;
globalThis.generateDefs = svgGenerator.generateDefs;
globalThis.generateTitle = svgGenerator.generateTitle;
globalThis.generateSection = svgGenerator.generateSection;
globalThis.generateLayer = svgGenerator.generateLayer;
globalThis.generateLayerContent = svgGenerator.generateLayerContent;
globalThis.generateConnection = svgGenerator.generateConnection;
globalThis.generateBlock = svgGenerator.generateBlock;
globalThis.generateParallelConnections = svgGenerator.generateParallelConnections;
globalThis.generateSkipConnection = svgGenerator.generateSkipConnection;
globalThis.getLayerDetail = svgGenerator.getLayerDetail;
globalThis.COLORS = svgGenerator.COLORS;
globalThis.SVG_CONFIG = svgGenerator.SVG_CONFIG;

// 运行测试
console.log('\n=== Running Parser Tests ===\n');
require('./test-parser.js');

console.log('\n=== Running Layout Tests ===\n');
require('./test-layout.js');

console.log('\n=== Running SVG Generator Tests ===\n');
require('./test-svg.js');

// 输出总结
console.log('\n' + '='.repeat(40));
console.log(`Total: ${passed + failed} tests, ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('\n\x1b[31mFailed tests:\x1b[0m');
  failures.forEach(f => {
    console.log(`  - ${f.name}`);
  });
  process.exit(1);
}