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
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const zoomResetBtn = document.getElementById('zoomResetBtn');
const zoomLevel = document.getElementById('zoomLevel');

// 当前生成的 SVG 内容
let currentSvgContent = '';
let currentNetworkName = '';
let currentZoom = 100;  // 当前缩放比例（百分比）

/**
 * 初始化
 */
function init() {
  // 绑定事件
  generateBtn.addEventListener('click', handleGenerate);
  clearBtn.addEventListener('click', handleClear);
  downloadBtn.addEventListener('click', handleDownload);
  templateDropdown.addEventListener('change', handleTemplateSelect);
  zoomInBtn.addEventListener('click', handleZoomIn);
  zoomOutBtn.addEventListener('click', handleZoomOut);
  zoomResetBtn.addEventListener('click', handleZoomReset);
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

    // 重置缩放
    currentZoom = 100;
    updateZoomDisplay();
    applyZoom();

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
  currentZoom = 100;
  updateZoomDisplay();
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
 * 放大
 */
function handleZoomIn() {
  if (currentZoom < 500) {
    currentZoom += 25;
    updateZoomDisplay();
    applyZoom();
  }
}

/**
 * 缩小
 */
function handleZoomOut() {
  if (currentZoom > 25) {
    currentZoom -= 25;
    updateZoomDisplay();
    applyZoom();
  }
}

/**
 * 重置缩放
 */
function handleZoomReset() {
  currentZoom = 100;
  updateZoomDisplay();
  applyZoom();
}

/**
 * 更新缩放显示
 */
function updateZoomDisplay() {
  zoomLevel.textContent = `${currentZoom}%`;
}

/**
 * 应用缩放到 SVG
 */
function applyZoom() {
  const svgElement = svgPreview.querySelector('svg');
  if (svgElement) {
    // 使用 CSS transform 缩放
    svgElement.style.transform = `scale(${currentZoom / 100})`;
    svgElement.style.transformOrigin = 'center center';
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