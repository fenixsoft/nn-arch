/**
 * 预置模板
 * 提供常见网络架构的 YAML 定义模板
 */

const TEMPLATES = {
  alexnet: {
    name: 'AlexNet',
    template: `name: AlexNet
layout: horizontal

sections:
  - name: 特征提取器
    layers: [input, conv1, pool1, conv2, pool2, conv3, conv4, conv5, pool5]
    row_label: "Flatten: 9216"
  - name: 分类器
    layers: [fc1, fc2, fc3, output]

layers:
  - {id: input, name: Input, type: input, size: "224x224x3"}
  - {id: conv1, name: Conv1, type: conv, kernel: 11, stride: 4, channels: 96, out: "55x55x96", act: ReLU}
  - {id: pool1, name: Pool1, type: pool, kernel: 3, stride: 2, out: "27x27x96"}
  - {id: conv2, name: Conv2, type: conv, kernel: 5, stride: 1, channels: 256, out: "27x27x256", act: ReLU}
  - {id: pool2, name: Pool2, type: pool, kernel: 3, stride: 2, out: "13x13x256"}
  - {id: conv3, name: Conv3, type: conv, kernel: 3, stride: 1, channels: 384, out: "13x13x384", act: ReLU}
  - {id: conv4, name: Conv4, type: conv, kernel: 3, stride: 1, channels: 384, out: "13x13x384", act: ReLU}
  - {id: conv5, name: Conv5, type: conv, kernel: 3, stride: 1, channels: 256, out: "13x13x256", act: ReLU}
  - {id: pool5, name: Pool5, type: pool, kernel: 3, stride: 2, out: "6x6x256"}
  - {id: fc1, name: FC1, type: fc, size: 4096, act: ReLU, dropout: true}
  - {id: fc2, name: FC2, type: fc, size: 4096, act: ReLU, dropout: true}
  - {id: fc3, name: FC3, type: fc, size: 1000}
  - {id: output, name: Output, type: output, size: 1000, act: Softmax}`
  },

  vgg16: {
    name: 'VGG16',
    template: `name: VGG16
layout: horizontal

sections:
  - name: 特征提取器
    layers: [input, conv1_1, conv1_2, pool1, conv2_1, conv2_2, pool2, conv3_1, conv3_2, conv3_3, pool3, conv4_1, conv4_2, conv4_3, pool4, conv5_1, conv5_2, conv5_3, pool5]
    row_label: "Flatten: 25088"
  - name: 分类器
    layers: [fc1, fc2, fc3, output]

layers:
  - {id: input, name: Input, type: input, size: "224x224x3"}
  - {id: conv1_1, name: Conv1_1, type: conv, kernel: 3, channels: 64, act: ReLU}
  - {id: conv1_2, name: Conv1_2, type: conv, kernel: 3, channels: 64, act: ReLU}
  - {id: pool1, name: Pool1, type: pool, kernel: 2, stride: 2, out: "112x112x64"}
  - {id: conv2_1, name: Conv2_1, type: conv, kernel: 3, channels: 128, act: ReLU}
  - {id: conv2_2, name: Conv2_2, type: conv, kernel: 3, channels: 128, act: ReLU}
  - {id: pool2, name: Pool2, type: pool, kernel: 2, stride: 2, out: "56x56x128"}
  - {id: conv3_1, name: Conv3_1, type: conv, kernel: 3, channels: 256, act: ReLU}
  - {id: conv3_2, name: Conv3_2, type: conv, kernel: 3, channels: 256, act: ReLU}
  - {id: conv3_3, name: Conv3_3, type: conv, kernel: 3, channels: 256, act: ReLU}
  - {id: pool3, name: Pool3, type: pool, kernel: 2, stride: 2, out: "28x28x256"}
  - {id: conv4_1, name: Conv4_1, type: conv, kernel: 3, channels: 512, act: ReLU}
  - {id: conv4_2, name: Conv4_2, type: conv, kernel: 3, channels: 512, act: ReLU}
  - {id: conv4_3, name: Conv4_3, type: conv, kernel: 3, channels: 512, act: ReLU}
  - {id: pool4, name: Pool4, type: pool, kernel: 2, stride: 2, out: "14x14x512"}
  - {id: conv5_1, name: Conv5_1, type: conv, kernel: 3, channels: 512, act: ReLU}
  - {id: conv5_2, name: Conv5_2, type: conv, kernel: 3, channels: 512, act: ReLU}
  - {id: conv5_3, name: Conv5_3, type: conv, kernel: 3, channels: 512, act: ReLU}
  - {id: pool5, name: Pool5, type: pool, kernel: 2, stride: 2, out: "7x7x512"}
  - {id: fc1, name: FC1, type: fc, size: 4096, act: ReLU, dropout: true}
  - {id: fc2, name: FC2, type: fc, size: 4096, act: ReLU, dropout: true}
  - {id: fc3, name: FC3, type: fc, size: 1000}
  - {id: output, name: Output, type: output, size: 1000, act: Softmax}`
  },

  resnet18: {
    name: 'ResNet18',
    template: `name: ResNet18
layout: horizontal

layers:
  - {id: input, name: Input, type: input, size: "224x224x3"}
  - {id: conv1, name: Conv1, type: conv, kernel: 7, stride: 2, channels: 64, out: "56x56x64", act: ReLU}
  - {id: pool1, name: Pool1, type: pool, kernel: 3, stride: 2, out: "28x28x64"}

blocks:
  - name: ResBlock1
    type: residual
    main:
      - {id: rb1_conv1, name: conv1, type: conv, kernel: 3, channels: 64, act: ReLU}
      - {id: rb1_conv2, name: conv2, type: conv, kernel: 3, channels: 64}
    skip: identity
    merge: add
    act: ReLU

  - name: ResBlock2
    type: residual
    style: parallel
    main:
      - {id: rb2_conv1, name: conv1, type: conv, kernel: 3, channels: 64, act: ReLU}
      - {id: rb2_conv2, name: conv2, type: conv, kernel: 3, channels: 64}
    skip: identity
    merge: add
    act: ReLU

layers_after_blocks:
  - {id: globalpool, name: GlobalPool, type: pool, kernel: global, out: "1x1x512"}
  - {id: fc, name: FC, type: fc, size: 1000}
  - {id: output, name: Output, type: output, size: 1000, act: Softmax}`
  },

  transformer: {
    name: 'Transformer Encoder',
    template: `name: Transformer Encoder
layout: horizontal

layers:
  - {id: input, name: Input, type: input, size: "512 tokens"}
  - {id: embedding, name: Embedding, type: embedding, size: 512}

blocks:
  - name: EncoderBlock
    type: stack
    repeat: 6
    layers:
      - name: MultiHeadAttention
        type: parallel
        branches:
          - {id: q, name: Q, type: fc, size: 64}
          - {id: k, name: K, type: fc, size: 64}
          - {id: v, name: V, type: fc, size: 64}
        merge: concat
      - {id: attnout, name: AttnOut, type: fc, size: 512}
      - name: AddNorm1
        type: residual
        skip: identity
        merge: add
        norm: layer
      - {id: ff1, name: FF1, type: fc, size: 2048, act: ReLU}
      - {id: ff2, name: FF2, type: fc, size: 512}
      - name: AddNorm2
        type: residual
        skip: identity
        merge: add
        norm: layer

layers_after_blocks:
  - {id: output, name: Output, type: output, size: 10000}`
  },

  googlenet: {
    name: 'GoogLeNet (Inception v1)',
    template: `name: GoogLeNet
layout: vertical

layers:
  - {id: input, name: Input, type: input, size: "224x224x3"}
  - {id: conv1, name: Conv1, type: conv, kernel: 7, stride: 2, channels: 64, out: "112x112x64", act: ReLU}
  - {id: pool1, name: Pool1, type: pool, kernel: 3, stride: 2, out: "56x56x64"}

blocks:
  - name: Inception_3a
    type: parallel
    branches:
      # 分支1: 1x1 conv
      - {id: inc3a_1x1, name: "1x1 conv", type: conv, kernel: 1, channels: 64, act: ReLU}
      # 分支2: 3x3 reduce + 3x3 conv
      - [
          {id: inc3a_3x3r, name: "3x3 reduce", type: conv, kernel: 1, channels: 96, act: ReLU},
          {id: inc3a_3x3, name: "3x3 conv", type: conv, kernel: 3, channels: 128, act: ReLU}
        ]
      # 分支3: 5x5 reduce + 5x5 conv
      - [
          {id: inc3a_5x5r, name: "5x5 reduce", type: conv, kernel: 1, channels: 16, act: ReLU},
          {id: inc3a_5x5, name: "5x5 conv", type: conv, kernel: 5, channels: 32, act: ReLU}
        ]
      # 分支4: pool + 1x1 conv
      - [
          {id: inc3a_pool, name: pool, type: pool, kernel: 3, stride: 1},
          {id: inc3a_pool1x1, name: "pool+1x1", type: conv, kernel: 1, channels: 32, act: ReLU}
        ]
    merge: concat

  - name: Inception_3b
    type: parallel
    branches:
      - {id: inc3b_1x1, name: "1x1 conv", type: conv, kernel: 1, channels: 128, act: ReLU}
      - [
          {id: inc3b_3x3r, name: "3x3 reduce", type: conv, kernel: 1, channels: 128, act: ReLU},
          {id: inc3b_3x3, name: "3x3 conv", type: conv, kernel: 3, channels: 192, act: ReLU}
        ]
      - [
          {id: inc3b_5x5r, name: "5x5 reduce", type: conv, kernel: 1, channels: 32, act: ReLU},
          {id: inc3b_5x5, name: "5x5 conv", type: conv, kernel: 5, channels: 96, act: ReLU}
        ]
      - [
          {id: inc3b_pool, name: pool, type: pool, kernel: 3, stride: 1},
          {id: inc3b_pool1x1, name: "pool+1x1", type: conv, kernel: 1, channels: 64, act: ReLU}
        ]
    merge: concat

layers_after_blocks:
  - {id: pool2, name: Pool2, type: pool, kernel: 3, stride: 2}
  - {id: fc1, name: FC1, type: fc, size: 1024, act: ReLU, dropout: true}
  - {id: fc2, name: FC2, type: fc, size: 1000}
  - {id: output, name: Output, type: output, size: 1000, act: Softmax}`
  },

  inception_module: {
    name: 'Inception Module',
    template: `name: Inception Module
layout: vertical

layers:
  - {id: input, name: Input, type: input, size: "28x28x256"}

blocks:
  - name: Inception
    type: parallel
    branches:
      # 1x1 conv 分支
      - {id: branch_1x1, name: "1×1", type: conv, kernel: 1, channels: 64, act: ReLU}
      # 3x3 conv 分支 (先 1x1 reduce)
      - [
          {id: branch_3x3_reduce, name: "1×1", type: conv, kernel: 1, channels: 96, act: ReLU},
          {id: branch_3x3, name: "3×3", type: conv, kernel: 3, pad: 1, channels: 128, act: ReLU}
        ]
      # 5x5 conv 分支 (先 1x1 reduce)
      - [
          {id: branch_5x5_reduce, name: "1×1", type: conv, kernel: 1, channels: 16, act: ReLU},
          {id: branch_5x5, name: "5×5", type: conv, kernel: 5, pad: 2, channels: 32, act: ReLU}
        ]
      # pool 分支
      - [
          {id: branch_pool, name: Pool, type: pool, kernel: 3, stride: 1, pad: 1},
          {id: branch_pool_proj, name: "1×1", type: conv, kernel: 1, channels: 32, act: ReLU}
        ]
    merge: concat

layers_after_blocks:
  - {id: output, name: Output, type: output, size: "28x28x256"}`
  },

  googlenet_collapsed: {
    name: 'GoogLeNet (Collapsed Inception)',
    template: `name: GoogLeNet (Collapsed)
layout: vertical

sections:
  - name: 初始特征提取
    layers: [input, conv1, pool1, conv2, pool2]
  - name: Inception 堆叠
    layers: [Inception_3a, Inception_3b, pool3, Inception_4a, Inception_4b, Inception_4c, Inception_4d, Inception_4e, pool4, Inception_5a, Inception_5b]
  - name: 分类输出
    layers: [pool5, fc1, fc2, output]

layers:
  - {id: input, name: Input, type: input, size: "224x224x3"}
  - {id: conv1, name: Conv1, type: conv, kernel: 7, stride: 2, channels: 64, out: "112x112x64", act: ReLU}
  - {id: pool1, name: Pool1, type: pool, kernel: 3, stride: 2, out: "56x56x64"}
  - {id: conv2, name: Conv2, type: conv, kernel: 3, channels: 192, act: ReLU}
  - {id: pool2, name: Pool2, type: pool, kernel: 3, stride: 2, out: "28x28x192"}

blocks:
  - name: Inception_3a
    type: parallel
    expand: "collapsed"
    branches:
      - {id: inc3a_1x1, name: "1x1", type: conv, kernel: 1, channels: 64, act: ReLU}
      - [{id: inc3a_3x3r, name: "reduce", type: conv, kernel: 1, channels: 96, act: ReLU},
         {id: inc3a_3x3, name: "3x3", type: conv, kernel: 3, channels: 128, act: ReLU}]
      - [{id: inc3a_5x5r, name: "reduce", type: conv, kernel: 1, channels: 16, act: ReLU},
         {id: inc3a_5x5, name: "5x5", type: conv, kernel: 5, channels: 32, act: ReLU}]
      - [{id: inc3a_pool, name: "pool", type: pool, kernel: 3},
         {id: inc3a_proj, name: "proj", type: conv, kernel: 1, channels: 32, act: ReLU}]
    merge: concat

  - name: Inception_3b
    type: parallel
    expand: "collapsed"
    branches:
      - {id: inc3b_1x1, name: "1x1", type: conv, kernel: 1, channels: 128, act: ReLU}
      - [{id: inc3b_3x3r, name: "reduce", type: conv, kernel: 1, channels: 128, act: ReLU},
         {id: inc3b_3x3, name: "3x3", type: conv, kernel: 3, channels: 192, act: ReLU}]
      - [{id: inc3b_5x5r, name: "reduce", type: conv, kernel: 1, channels: 32, act: ReLU},
         {id: inc3b_5x5, name: "5x5", type: conv, kernel: 5, channels: 96, act: ReLU}]
      - [{id: inc3b_pool, name: "pool", type: pool, kernel: 3},
         {id: inc3b_proj, name: "proj", type: conv, kernel: 1, channels: 64, act: ReLU}]
    merge: concat

  - {id: pool3, name: Pool3, type: pool, kernel: 3, stride: 2}

  - name: Inception_4a
    type: parallel
    expand: "collapsed"
    branches:
      - {id: inc4a_1x1, name: "1x1", type: conv, kernel: 1, channels: 192, act: ReLU}
      - [{id: inc4a_3x3r, name: "reduce", type: conv, kernel: 1, channels: 96, act: ReLU},
         {id: inc4a_3x3, name: "3x3", type: conv, kernel: 3, channels: 208, act: ReLU}]
      - [{id: inc4a_5x5r, name: "reduce", type: conv, kernel: 1, channels: 16, act: ReLU},
         {id: inc4a_5x5, name: "5x5", type: conv, kernel: 5, channels: 48, act: ReLU}]
      - [{id: inc4a_pool, name: "pool", type: pool, kernel: 3},
         {id: inc4a_proj, name: "proj", type: conv, kernel: 1, channels: 64, act: ReLU}]
    merge: concat

  - name: Inception_4b
    type: parallel
    expand: "collapsed"
    branches:
      - {id: inc4b_1x1, name: "1x1", type: conv, kernel: 1, channels: 160, act: ReLU}
      - [{id: inc4b_3x3r, name: "reduce", type: conv, kernel: 1, channels: 112, act: ReLU},
         {id: inc4b_3x3, name: "3x3", type: conv, kernel: 3, channels: 224, act: ReLU}]
      - [{id: inc4b_5x5r, name: "reduce", type: conv, kernel: 1, channels: 24, act: ReLU},
         {id: inc4b_5x5, name: "5x5", type: conv, kernel: 5, channels: 64, act: ReLU}]
      - [{id: inc4b_pool, name: "pool", type: pool, kernel: 3},
         {id: inc4b_proj, name: "proj", type: conv, kernel: 1, channels: 64, act: ReLU}]
    merge: concat

  - name: Inception_4c
    type: parallel
    expand: "collapsed"
    branches:
      - {id: inc4c_1x1, name: "1x1", type: conv, kernel: 1, channels: 128, act: ReLU}
      - [{id: inc4c_3x3r, name: "reduce", type: conv, kernel: 1, channels: 128, act: ReLU},
         {id: inc4c_3x3, name: "3x3", type: conv, kernel: 3, channels: 256, act: ReLU}]
      - [{id: inc4c_5x5r, name: "reduce", type: conv, kernel: 1, channels: 24, act: ReLU},
         {id: inc4c_5x5, name: "5x5", type: conv, kernel: 5, channels: 64, act: ReLU}]
      - [{id: inc4c_pool, name: "pool", type: pool, kernel: 3},
         {id: inc4c_proj, name: "proj", type: conv, kernel: 1, channels: 64, act: ReLU}]
    merge: concat

  - name: Inception_4d
    type: parallel
    expand: "collapsed"
    branches:
      - {id: inc4d_1x1, name: "1x1", type: conv, kernel: 1, channels: 112, act: ReLU}
      - [{id: inc4d_3x3r, name: "reduce", type: conv, kernel: 1, channels: 144, act: ReLU},
         {id: inc4d_3x3, name: "3x3", type: conv, kernel: 3, channels: 288, act: ReLU}]
      - [{id: inc4d_5x5r, name: "reduce", type: conv, kernel: 1, channels: 32, act: ReLU},
         {id: inc4d_5x5, name: "5x5", type: conv, kernel: 5, channels: 64, act: ReLU}]
      - [{id: inc4d_pool, name: "pool", type: pool, kernel: 3},
         {id: inc4d_proj, name: "proj", type: conv, kernel: 1, channels: 64, act: ReLU}]
    merge: concat

  - name: Inception_4e
    type: parallel
    expand: "collapsed"
    branches:
      - {id: inc4e_1x1, name: "1x1", type: conv, kernel: 1, channels: 256, act: ReLU}
      - [{id: inc4e_3x3r, name: "reduce", type: conv, kernel: 1, channels: 160, act: ReLU},
         {id: inc4e_3x3, name: "3x3", type: conv, kernel: 3, channels: 320, act: ReLU}]
      - [{id: inc4e_5x5r, name: "reduce", type: conv, kernel: 1, channels: 32, act: ReLU},
         {id: inc4e_5x5, name: "5x5", type: conv, kernel: 5, channels: 128, act: ReLU}]
      - [{id: inc4e_pool, name: "pool", type: pool, kernel: 3},
         {id: inc4e_proj, name: "proj", type: conv, kernel: 1, channels: 128, act: ReLU}]
    merge: concat

  - {id: pool4, name: Pool4, type: pool, kernel: 3, stride: 2}

  - name: Inception_5a
    type: parallel
    expand: "collapsed"
    branches:
      - {id: inc5a_1x1, name: "1x1", type: conv, kernel: 1, channels: 256, act: ReLU}
      - [{id: inc5a_3x3r, name: "reduce", type: conv, kernel: 1, channels: 160, act: ReLU},
         {id: inc5a_3x3, name: "3x3", type: conv, kernel: 3, channels: 320, act: ReLU}]
      - [{id: inc5a_5x5r, name: "reduce", type: conv, kernel: 1, channels: 32, act: ReLU},
         {id: inc5a_5x5, name: "5x5", type: conv, kernel: 5, channels: 128, act: ReLU}]
      - [{id: inc5a_pool, name: "pool", type: pool, kernel: 3},
         {id: inc5a_proj, name: "proj", type: conv, kernel: 1, channels: 128, act: ReLU}]
    merge: concat

  - name: Inception_5b
    type: parallel
    expand: "collapsed"
    branches:
      - {id: inc5b_1x1, name: "1x1", type: conv, kernel: 1, channels: 384, act: ReLU}
      - [{id: inc5b_3x3r, name: "reduce", type: conv, kernel: 1, channels: 192, act: ReLU},
         {id: inc5b_3x3, name: "3x3", type: conv, kernel: 3, channels: 384, act: ReLU}]
      - [{id: inc5b_5x5r, name: "reduce", type: conv, kernel: 1, channels: 48, act: ReLU},
         {id: inc5b_5x5, name: "5x5", type: conv, kernel: 5, channels: 128, act: ReLU}]
      - [{id: inc5b_pool, name: "pool", type: pool, kernel: 3},
         {id: inc5b_proj, name: "proj", type: conv, kernel: 1, channels: 128, act: ReLU}]
    merge: concat

layers_after_blocks:
  - {id: pool5, name: Pool5, type: pool, kernel: 7, stride: 1}
  - {id: fc1, name: FC1, type: fc, size: 1024, act: ReLU, dropout: true}
  - {id: fc2, name: FC2, type: fc, size: 1000}
  - {id: output, name: Output, type: output, size: 1000, act: Softmax}`
  }
};

/**
 * 获取模板列表
 * @returns {array} 模板名称数组
 */
function getTemplateList() {
  return Object.keys(TEMPLATES).map(key => ({
    key: key,
    name: TEMPLATES[key].name
  }));
}

/**
 * 获取模板 YAML
 * @param {string} key - 模板键名
 * @returns {string} YAML 文本
 */
function getTemplate(key) {
  return TEMPLATES[key] ? TEMPLATES[key].template : '';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TEMPLATES, getTemplateList, getTemplate };
}