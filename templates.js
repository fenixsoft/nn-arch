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
    layers: [Input, Conv1, Conv2, Conv3, Conv4, Conv5]
  - name: 分类器
    layers: [FC1, FC2, FC3, Output]

layers:
  - {name: Input, type: input, size: "224x224x3"}
  - {name: Conv1, type: conv, kernel: 11, stride: 4, channels: 96, out: "55x55x96", act: ReLU, pool: {kernel: 3, stride: 2}}
  - {name: Conv2, type: conv, kernel: 5, stride: 1, channels: 256, out: "27x27x256", act: ReLU, pool: {kernel: 3, stride: 2}}
  - {name: Conv3, type: conv, kernel: 3, stride: 1, channels: 384, out: "13x13x384", act: ReLU}
  - {name: Conv4, type: conv, kernel: 3, stride: 1, channels: 384, out: "13x13x384", act: ReLU}
  - {name: Conv5, type: conv, kernel: 3, stride: 1, channels: 256, out: "13x13x256", act: ReLU, pool: {kernel: 3, stride: 2}}
  - {name: FC1, type: fc, size: 4096, act: ReLU, dropout: true}
  - {name: FC2, type: fc, size: 4096, act: ReLU, dropout: true}
  - {name: FC3, type: fc, size: 1000}
  - {name: Output, type: output, size: 1000, act: Softmax}`
  },

  vgg16: {
    name: 'VGG16',
    template: `name: VGG16
layout: horizontal

sections:
  - name: 特征提取器
    layers: [Input, Conv1_1, Conv1_2, Pool1, Conv2_1, Conv2_2, Pool2, Conv3_1, Conv3_2, Conv3_3, Pool3, Conv4_1, Conv4_2, Conv4_3, Pool4, Conv5_1, Conv5_2, Conv5_3, Pool5]
  - name: 分类器
    layers: [FC1, FC2, FC3, Output]

layers:
  - {name: Input, type: input, size: "224x224x3"}
  - {name: Conv1_1, type: conv, kernel: 3, channels: 64, act: ReLU}
  - {name: Conv1_2, type: conv, kernel: 3, channels: 64, act: ReLU}
  - {name: Pool1, type: pool, kernel: 2, stride: 2, out: "112x112x64"}
  - {name: Conv2_1, type: conv, kernel: 3, channels: 128, act: ReLU}
  - {name: Conv2_2, type: conv, kernel: 3, channels: 128, act: ReLU}
  - {name: Pool2, type: pool, kernel: 2, stride: 2, out: "56x56x128"}
  - {name: Conv3_1, type: conv, kernel: 3, channels: 256, act: ReLU}
  - {name: Conv3_2, type: conv, kernel: 3, channels: 256, act: ReLU}
  - {name: Conv3_3, type: conv, kernel: 3, channels: 256, act: ReLU}
  - {name: Pool3, type: pool, kernel: 2, stride: 2, out: "28x28x256"}
  - {name: Conv4_1, type: conv, kernel: 3, channels: 512, act: ReLU}
  - {name: Conv4_2, type: conv, kernel: 3, channels: 512, act: ReLU}
  - {name: Conv4_3, type: conv, kernel: 3, channels: 512, act: ReLU}
  - {name: Pool4, type: pool, kernel: 2, stride: 2, out: "14x14x512"}
  - {name: Conv5_1, type: conv, kernel: 3, channels: 512, act: ReLU}
  - {name: Conv5_2, type: conv, kernel: 3, channels: 512, act: ReLU}
  - {name: Conv5_3, type: conv, kernel: 3, channels: 512, act: ReLU}
  - {name: Pool5, type: pool, kernel: 2, stride: 2, out: "7x7x512"}
  - {name: FC1, type: fc, size: 4096, act: ReLU, dropout: true}
  - {name: FC2, type: fc, size: 4096, act: ReLU, dropout: true}
  - {name: FC3, type: fc, size: 1000}
  - {name: Output, type: output, size: 1000, act: Softmax}`
  },

  resnet18: {
    name: 'ResNet18',
    template: `name: ResNet18
layout: horizontal

layers:
  - {name: Input, type: input, size: "224x224x3"}
  - {name: Conv1, type: conv, kernel: 7, stride: 2, channels: 64, out: "56x56x64", act: ReLU}
  - {name: Pool1, type: pool, kernel: 3, stride: 2, out: "28x28x64"}

blocks:
  - name: ResBlock1
    type: residual
    main:
      - {name: conv1, type: conv, kernel: 3, channels: 64, act: ReLU}
      - {name: conv2, type: conv, kernel: 3, channels: 64}
    skip: identity
    merge: add
    act: ReLU

  - name: ResBlock2
    type: residual
    main:
      - {name: conv1, type: conv, kernel: 3, channels: 64, act: ReLU}
      - {name: conv2, type: conv, kernel: 3, channels: 64}
    skip: identity
    merge: add
    act: ReLU

layers_after_blocks:
  - {name: GlobalPool, type: pool, kernel: global, out: "1x1x512"}
  - {name: FC, type: fc, size: 1000}
  - {name: Output, type: output, size: 1000, act: Softmax}`
  },

  transformer: {
    name: 'Transformer Encoder',
    template: `name: Transformer Encoder
layout: horizontal

layers:
  - {name: Input, type: input, size: "512 tokens"}
  - {name: Embedding, type: embedding, size: 512}

blocks:
  - name: EncoderBlock
    type: stack
    repeat: 6
    layers:
      - name: MultiHeadAttention
        type: parallel
        branches:
          - {name: Q, type: fc, size: 64}
          - {name: K, type: fc, size: 64}
          - {name: V, type: fc, size: 64}
        merge: concat
      - {name: AttnOut, type: fc, size: 512}
      - name: AddNorm1
        type: residual
        skip: identity
        merge: add
        norm: layer
      - {name: FF1, type: fc, size: 2048, act: ReLU}
      - {name: FF2, type: fc, size: 512}
      - name: AddNorm2
        type: residual
        skip: identity
        merge: add
        norm: layer

layers_after_blocks:
  - {name: Output, type: output, size: 10000}`
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

module.exports = { TEMPLATES, getTemplateList, getTemplate };