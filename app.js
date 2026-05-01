/**
 * 主逻辑
 * 处理用户交互，整合解析、布局、生成流程
 */

// DOM 元素引用
const yamlInput = document.getElementById('yamlInput');
const svgPreview = document.getElementById('svgPreview');
const errorMsg = document.getElementById('errorMsg');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const templateDropdown = document.getElementById('templateDropdown');

// 当前生成的 SVG 内容
let currentSvgContent = '';
let currentNetworkName = '';

/**
 * 初始化
 */
function init() {
  // 绑定事件
  generateBtn.addEventListener('click', handleGenerate);
  clearBtn.addEventListener('click', handleClear);
  downloadBtn.addEventListener('click', handleDownload);
  templateDropdown.addEventListener('change', handleTemplateSelect);
}

/**
 * 处理生成 SVG
 */
function handleGenerate() {
  const yamlText = yamlInput.value.trim();

  if (!yamlText) {
    showError('请输入 YAML 格式的网络定义');
    return;
  }

  try {
    // 解析 YAML
    const network = parseNetworkYaml(yamlText);
    currentNetworkName = network.name;

    // 计算布局
    const layout = calculateLayout(network);

    // 生成 SVG
    currentSvgContent = generateSvg(layout);

    // 显示预览
    svgPreview.innerHTML = currentSvgContent;

    // 隐藏错误，启用下载
    hideError();
    downloadBtn.disabled = false;

  } catch (e) {
    showError(e.message);
    downloadBtn.disabled = true;
  }
}

/**
 * 处理清空
 */
function handleClear() {
  yamlInput.value = '';
  svgPreview.innerHTML = '<p class="placeholder-text">输入 YAML 后点击"生成 SVG"</p>';
  currentSvgContent = '';
  currentNetworkName = '';
  hideError();
  downloadBtn.disabled = true;
  templateDropdown.value = '';
}

/**
 * 处理下载
 */
function handleDownload() {
  if (!currentSvgContent) {
    return;
  }

  const filename = `${currentNetworkName}_arch.svg`;
  const blob = new Blob([currentSvgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * 处理模板选择
 */
function handleTemplateSelect() {
  const key = templateDropdown.value;
  if (key) {
    const template = getTemplate(key);
    yamlInput.value = template;
    hideError();
  }
}

/**
 * 显示错误信息
 */
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.add('show');
}

/**
 * 隐藏错误信息
 */
function hideError() {
  errorMsg.textContent = '';
  errorMsg.classList.remove('show');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);