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