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
  },

  transformer_full: {
    name: 'Transformer (Full Architecture)',
    description: '完整的 Transformer 编码器-解码器架构，来自 "Attention is All You Need" 论文',
    template: `name: Transformer Architecture
layout: parallel-columns

columns:
  - name: Encoder
    layers:
      - {id: enc_input, name: Input Embedding, type: embedding, size: "+Positional Encoding"}
    blocks:
      - name: Encoder Block
        type: stack
        repeat: 6
        expand: false
        layers:
          - {id: enc_mha, name: Multi-Head Attention, type: attention, size: ""}
          - {id: enc_add1, name: Add & Norm, type: norm, size: ""}
          - {id: enc_ffn, name: Feed Forward, type: dense, size: ""}
          - {id: enc_add2, name: Add & Norm, type: norm, size: ""}

  - name: Decoder
    layers:
      - {id: dec_input, name: Output Embedding, type: embedding, size: "+Positional Encoding"}
    blocks:
      - name: Decoder Block
        type: stack
        repeat: 6
        expand: false
        layers:
          - {id: dec_masked_mha, name: Masked Multi-Head Attention, type: attention, size: ""}
          - {id: dec_add1, name: Add & Norm, type: norm, size: ""}
          - {id: dec_cross_attn, name: Multi-Head Attention, type: attention, size: ""}
          - {id: dec_add2, name: Add & Norm, type: norm, size: ""}
          - {id: dec_ffn, name: Feed Forward, type: dense, size: ""}
          - {id: dec_add3, name: Add & Norm, type: norm, size: ""}
    layers_after_blocks:
      - {id: linear, name: Linear, type: dense, size: ""}
      - {id: softmax, name: Softmax, type: activation, size: ""}

cross_connections:
  - {from: enc_add2, to: [dec_cross_attn, dec_cross_attn], labels: [K, V], label_position: "Encoder Output"}

fork_connections:
  - {from: enc_input, to: enc_mha, labels: [Q, K, V]}
  - {from: dec_input, to: dec_masked_mha, labels: [Q, K, V]}`
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

  resblock_identity: {
    name: 'ResBlock (Identity)',
    description: '维度相同的残差块 - skip connection 直接传递，不改变维度',
    template: `name: ResBlock - Identity Shortcut
layout: horizontal

layers:
  - {id: input, name: Input, type: input, size: "56x56x64"}

blocks:
  - name: Identity ResBlock
    type: residual
    style: arc
    main:
      - {id: conv1, name: Conv1, type: conv, kernel: 3, pad: 1, channels: 64, act: ReLU}
      - {id: conv2, name: Conv2, type: conv, kernel: 3, pad: 1, channels: 64}
    skip: identity
    merge: add
    act: ReLU

layers_after_blocks:
  - {id: output, name: Output, type: output, size: "56x56x64"}`
  },

  resblock_identity_parallel: {
    name: 'ResBlock (Identity Parallel)',
    description: '维度相同的残差块 - parallel 样式展示主路径和skip并行',
    template: `name: ResBlock - Identity (Parallel Style)
layout: horizontal

layers:
  - {id: input, name: Input, type: input, size: "56x56x64"}

blocks:
  - name: Identity ResBlock
    type: residual
    style: parallel
    main:
      - {id: conv1, name: Conv1, type: conv, kernel: 3, pad: 1, channels: 64, act: ReLU}
      - {id: conv2, name: Conv2, type: conv, kernel: 3, pad: 1, channels: 64}
    skip: identity
    merge: add
    act: ReLU

layers_after_blocks:
  - {id: output, name: Output, type: output, size: "56x56x64"}`
  },

  resblock_projection: {
    name: 'ResBlock (Projection)',
    description: '维度不同的残差块 - skip 分支使用 1x1 conv 调整维度，进行下采样',
    template: `name: ResBlock - Projection Shortcut
layout: horizontal

layers:
  - {id: input, name: Input, type: input, size: "56x56x64"}

blocks:
  - name: Projection ResBlock
    type: residual
    style: parallel
    main:
      - {id: conv1, name: Conv1, type: conv, kernel: 3, stride: 2, pad: 1, channels: 128, act: ReLU}
      - {id: conv2, name: Conv2, type: conv, kernel: 3, pad: 1, channels: 128}
    skip:
      - {id: skip_conv, name: "1×1 Conv", type: conv, kernel: 1, stride: 2, channels: 128}
    merge: add
    act: ReLU

layers_after_blocks:
  - {id: output, name: Output, type: output, size: "28x28x128"}`
  },

  resblock_projection_arc: {
    name: 'ResBlock (Projection Arc)',
    description: '维度不同的残差块 - arc 样式，skip 分支有投影层',
    template: `name: ResBlock - Projection (Arc Style)
layout: horizontal

layers:
  - {id: input, name: Input, type: input, size: "56x56x64"}

blocks:
  - name: Projection ResBlock
    type: residual
    style: arc
    main:
      - {id: conv1, name: Conv1, type: conv, kernel: 3, stride: 2, pad: 1, channels: 128, act: ReLU}
      - {id: conv2, name: Conv2, type: conv, kernel: 3, pad: 1, channels: 128}
    skip:
      - {id: skip_conv, name: "1×1 Conv", type: conv, kernel: 1, stride: 2, channels: 128}
    merge: add
    act: ReLU

layers_after_blocks:
  - {id: output, name: Output, type: output, size: "28x28x128"}`
  },

  resblock_comparison: {
    name: 'ResBlock Comparison',
    description: '对比两种残差块：Identity vs Projection',
    template: `name: ResBlock Comparison
layout: vertical

sections:
  - name: Identity Block (维度相同)
    layers: [input1, identity_block]
  - name: Projection Block (维度变化)
    layers: [input2, projection_block]

layers:
  - {id: input1, name: Input, type: input, size: "56x56x64"}
  - {id: input2, name: Input, type: input, size: "56x56x64"}

blocks:
  - name: Identity Block
    type: residual
    style: arc
    main:
      - {id: id_conv1, name: Conv1, type: conv, kernel: 3, pad: 1, channels: 64, act: ReLU}
      - {id: id_conv2, name: Conv2, type: conv, kernel: 3, pad: 1, channels: 64}
    skip: identity
    merge: add
    act: ReLU

  - name: Projection Block
    type: residual
    style: parallel
    main:
      - {id: proj_conv1, name: Conv1, type: conv, kernel: 3, stride: 2, pad: 1, channels: 128, act: ReLU}
      - {id: proj_conv2, name: Conv2, type: conv, kernel: 3, pad: 1, channels: 128}
    skip:
      - {id: proj_skip, name: "1×1", type: conv, kernel: 1, stride: 2, channels: 128}
    merge: add
    act: ReLU

layers_after_blocks:
  - {id: output1, name: "56x56x64", type: output}
  - {id: output2, name: "28x28x128", type: output}`
  },

  dcgan: {
    name: 'DCGAN',
    description: 'Deep Convolutional GAN - 生成器使用反卷积上采样，判别器使用卷积下采样',
    template: `name: DCGAN
layout: horizontal

sections:
  - name: 生成器 (Generator)
    layers: [z_input, g_proj, g_conv1, g_conv2, g_conv3, g_conv4, g_output]
    row_direction: bidirectional
  - name: 判别器 (Discriminator)
    layers: [d_input, d_conv1, d_conv2, d_conv3, d_conv4, d_output]

layers:
  # === 生成器 ===
  - {id: z_input, name: Noise z, type: input, size: "100"}
  - {id: g_proj, name: Project+Reshape, type: fc, size: "4x4x1024", act: ReLU}
  - {id: g_conv1, name: DeConv1, type: conv, kernel: 4, stride: 2, channels: 512, out: "8x8x512", act: ReLU}
  - {id: g_conv2, name: DeConv2, type: conv, kernel: 4, stride: 2, channels: 256, out: "16x16x256", act: ReLU}
  - {id: g_conv3, name: DeConv3, type: conv, kernel: 4, stride: 2, channels: 128, out: "32x32x128", act: ReLU}
  - {id: g_conv4, name: DeConv4, type: conv, kernel: 4, stride: 2, channels: 64, out: "64x64x64", act: ReLU}
  - {id: g_output, name: Generated Image, type: output, size: "64x64x3", act: Tanh}
  # === 判别器 ===
  - {id: d_input, name: Real/Fake Image, type: input, size: "64x64x3"}
  - {id: d_conv1, name: Conv1, type: conv, kernel: 4, stride: 2, channels: 64, out: "32x32x64", act: LeakyReLU}
  - {id: d_conv2, name: Conv2, type: conv, kernel: 4, stride: 2, channels: 128, out: "16x16x128", act: LeakyReLU}
  - {id: d_conv3, name: Conv3, type: conv, kernel: 4, stride: 2, channels: 256, out: "8x8x256", act: LeakyReLU}
  - {id: d_conv4, name: Conv4, type: conv, kernel: 4, stride: 2, channels: 512, out: "4x4x512", act: LeakyReLU}
  - {id: d_output, name: Real/Fake, type: output, size: 1, act: Sigmoid}`
  },

  rnn_unrolled: {
    name: 'Vanilla RNN (Unrolled)',
    description: '标准 RNN 沿时间轴展开 - 展示隐藏状态如何在时间步之间流动',
    template: `name: Vanilla RNN (Unrolled)
layout: horizontal

sections:
  - name: 时间步 t=0
    layers: [x0, h0, y0]
    row_label: "h₀→h₁"
  - name: 时间步 t=1
    layers: [x1, h1, y1]
    row_label: "h₁→h₂"
  - name: 时间步 t=2
    layers: [x2, h2, y2]
    row_label: "h₂→h₃"
  - name: 时间步 t=3
    layers: [x3, h3, y3]

layers:
  - {id: x0, name: "x₀", type: input, size: 128}
  - {id: h0, name: "RNN h₀", type: rnn, size: 256, act: tanh}
  - {id: y0, name: "y₀", type: output, size: 10}
  - {id: x1, name: "x₁", type: input, size: 128}
  - {id: h1, name: "RNN h₁", type: rnn, size: 256, act: tanh}
  - {id: y1, name: "y₁", type: output, size: 10}
  - {id: x2, name: "x₂", type: input, size: 128}
  - {id: h2, name: "RNN h₂", type: rnn, size: 256, act: tanh}
  - {id: y2, name: "y₂", type: output, size: 10}
  - {id: x3, name: "x₃", type: input, size: 128}
  - {id: h3, name: "RNN h₃", type: rnn, size: 256, act: tanh}
  - {id: y3, name: "y₃", type: output, size: 10}`
  },

  seq2seq: {
    name: 'Seq2Seq (Encoder-Decoder)',
    description: '序列到序列模型 - 编码器将输入序列编码为上下文向量，解码器从上下文向量生成输出序列',
    template: `name: Seq2Seq (Encoder-Decoder)
layout: horizontal

sections:
  - name: 编码器 (Encoder)
    layers: [enc_input, enc_embed, enc_h1, enc_h2, enc_h3]
    row_label: "Context Vector"
    row_direction: down
  - name: 解码器 (Decoder)
    layers: [dec_h1, dec_h2, dec_h3, dec_fc, dec_output]

layers:
  - {id: enc_input, name: "输入序列", type: input, size: "tokens"}
  - {id: enc_embed, name: Embedding, type: embedding, size: 256}
  - {id: enc_h1, name: "RNN h₁", type: rnn, size: 512, act: tanh}
  - {id: enc_h2, name: "RNN h₂", type: rnn, size: 512, act: tanh}
  - {id: enc_h3, name: "RNN h₃", type: rnn, size: 512, act: tanh}
  - {id: dec_h1, name: "RNN h₁", type: rnn, size: 512, act: tanh}
  - {id: dec_h2, name: "RNN h₂", type: rnn, size: 512, act: tanh}
  - {id: dec_h3, name: "RNN h₃", type: rnn, size: 512, act: tanh}
  - {id: dec_fc, name: FC, type: fc, size: 10000}
  - {id: dec_output, name: "输出序列", type: output, size: 10000, act: Softmax}`
  },

  seq2seq_flow: {
    name: 'Seq2Seq (Data Flow)',
    description: '序列到序列模型 - 单行数据流布局，显式展示编码器到解码器的上下文向量传递',
    template: `name: Seq2Seq (Data Flow)
layout: horizontal

layers:
  - {id: enc_input, name: "Input Seq", type: input, size: "tokens"}
  - {id: enc_embed, name: Embedding, type: embedding, size: 256}
  - {id: enc_h1, name: "Enc h₁", type: rnn, size: 512, act: tanh}
  - {id: enc_h2, name: "Enc h₂", type: rnn, size: 512, act: tanh}
  - {id: enc_h3, name: "Enc h₃", type: rnn, size: 512, act: tanh}
  - {id: context, name: Context, type: fc, size: 512}
  - {id: dec_h1, name: "Dec h₁", type: rnn, size: 512, act: tanh}
  - {id: dec_h2, name: "Dec h₂", type: rnn, size: 512, act: tanh}
  - {id: dec_h3, name: "Dec h₃", type: rnn, size: 512, act: tanh}
  - {id: dec_fc, name: FC, type: fc, size: 10000}
  - {id: dec_output, name: "Output Seq", type: output, size: 10000, act: Softmax}`
  },

  googlenet_collapsed: {
    name: 'GoogLeNet (Collapsed Inception)',
    template: `name: GoogLeNet (Collapsed)
layout: horizontal

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