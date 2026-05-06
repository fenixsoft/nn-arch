const NNArch = require('../src/nn-arch.js');

console.log('=== Testing ResNet18 ===');
const resnetSvg = NNArch.generateFromTemplate('resnet18');
console.log('ResNet18 SVG generated, length:', resnetSvg.length);
console.log('Contains ResBlock:', resnetSvg.includes('ResBlock'));

console.log('\n=== Testing Transformer ===');
const transformerSvg = NNArch.generateFromTemplate('transformer');
console.log('Transformer SVG generated, length:', transformerSvg.length);
console.log('Contains EncoderBlock:', transformerSvg.includes('EncoderBlock'));

console.log('\n=== All templates OK ===');