# nn-arch 开发指南

## 项目概述

nn-arch 是一个神经网络架构可视化工具，支持通过 YAML 语法定义网络架构并生成 SVG 图形。

## 开发规则

### 测试图片存放

测试生成的 SVG/PNG 图片统一存放在 `images/` 目录中，便于追踪测试历史和对比结果。

示例：
```bash
# 测试生成的图片保存到 images 目录
node -e "const NNArch = require('./src/nn-arch.js'); ..."
cp /tmp/test_output.svg images/test_output.svg
```

### 代码结构

- `src/parser.js` - YAML 解析器
- `src/layout.js` - 布局算法
- `src/svg-generator.js` - SVG 生成器
- `src/templates.js` - 预置模板
- `src/app.js` - Web 应用逻辑
- `index.html` - Web 界面

### 布局类型

- `horizontal` - 水平布局（默认）
- `vertical` - 垂直布局
- `parallel-columns` - 双列并排布局（用于编码器-解码器架构）

### 新增功能（2026-05-17）

1. **parallel-columns 布局**：支持编码器-解码器并排架构
2. **cross_connections**：支持跨列连接（如编码器输出到解码器 Cross-Attention）
3. **transformer_full 模板**：完整的 Transformer 架构模板
