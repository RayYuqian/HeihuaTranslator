import './style.css';
import { translateText, TranslationResult } from './api';

// DOM Elements
const sourceText = document.getElementById('source-text') as HTMLTextAreaElement;
const targetText = document.getElementById('target-text') as HTMLDivElement;
const swapBtn = document.getElementById('swap-btn') as HTMLButtonElement;
const translateBtn = document.getElementById('translate-btn') as HTMLButtonElement;
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
const sourceLabel = document.getElementById('source-label') as HTMLSpanElement;
const targetLabel = document.getElementById('target-label') as HTMLSpanElement;
const loader = document.getElementById('loader') as HTMLDivElement;
const errorMessage = document.getElementById('error-message') as HTMLSpanElement;
const btnText = document.querySelector('.btn-text') as HTMLSpanElement;

// State
let isToHeihua = true;
let currentResult: TranslationResult | null = null;
const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';

// Initialization
function init() {
  if (!apiKey) {
    showError('警告：未在 .env 中设置 VITE_OPENROUTER_API_KEY，翻译功能将不可用！');
  }
  updateUI();
  setupEventListeners();
}

function updateUI() {
  if (isToHeihua) {
    sourceLabel.textContent = '大白话 (人话)';
    targetLabel.textContent = '大厂PPT黑话';
    sourceText.placeholder = '输入你想翻译的内容，比如：今天我们开个会...';
    btnText.textContent = '一键生成黑话';
    document.documentElement.style.setProperty('--primary-color', '#FF6A00'); // Ali Orange
  } else {
    sourceLabel.textContent = '大厂PPT黑话';
    targetLabel.textContent = '大白话 (人话)';
    sourceText.placeholder = '输入你想翻译的内容，比如：咱们今天拉通对齐一下颗粒度...';
    btnText.textContent = '一键戳破黑话';
    document.documentElement.style.setProperty('--primary-color', '#0052D9'); // Tencent Blue
  }
}

function setupEventListeners() {
  swapBtn.addEventListener('click', () => {
    isToHeihua = !isToHeihua;
    
    // Swap contents: put translation result into input box
    const currentTargetTranslation = currentResult ? currentResult.translation : '';
    sourceText.value = currentTargetTranslation;
    targetText.innerHTML = '';
    currentResult = null;
    
    // Add flip animation
    swapBtn.style.transform = isToHeihua ? 'rotate(0deg)' : 'rotate(180deg)';
    
    updateUI();
  });

  translateBtn.addEventListener('click', async () => {
    const text = sourceText.value;
    
    if (!text.trim()) {
      showError('请先输入需要翻译的内容');
      sourceText.focus();
      return;
    }

    setLoading(true);
    showError(''); // Clear error

    try {
      const result = await translateText(text, isToHeihua, apiKey);
      currentResult = result;
      renderResult(result);
    } catch (error: any) {
      showError(error.message);
      targetText.textContent = '翻译失败，请看页面底部错误提示。';
    } finally {
      setLoading(false);
    }
  });

  copyBtn.addEventListener('click', () => {
    if (!currentResult) {
      showError('没有可以复制的内容');
      return;
    }
    
    let textToCopy = currentResult.translation;
    if (currentResult.explanations && currentResult.explanations.length > 0) {
      textToCopy += '\\n\\n【附知识点】\\n' + currentResult.explanations.map(e => 
        e.word + ': ' + e.meaning + (e.origin ? ' (典故：' + e.origin + ')' : '')
      ).join('\\n');
    }
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalTitle = copyBtn.title;
      copyBtn.title = '复制成功！';
      setTimeout(() => {
        copyBtn.title = originalTitle;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy', err);
      showError('复制失败，请手动选择复制');
    });
  });
}

function setLoading(isLoading: boolean) {
  translateBtn.disabled = isLoading;
  loader.style.display = isLoading ? 'block' : 'none';
  btnText.style.opacity = isLoading ? '0' : '1';
}

function showError(msg: string) {
  errorMessage.textContent = msg;
}

function renderResult(result: TranslationResult) {
  let html = '<div class="result-card"><h3 class="card-title">翻译结果</h3><p class="card-content">' + 
    result.translation.replace(/\\n/g, '<br>') + '</p></div>';

  if (result.explanations && result.explanations.length > 0) {
    html += '<div class="result-card"><h3 class="card-title">知识点讲解</h3><div class="card-list">';
    html += result.explanations.map(exp => {
      let itemHtml = '<div class="explanation-item">';
      itemHtml += '<h4 class="word">' + exp.word + '</h4>';
      itemHtml += '<p><strong>含义：</strong>' + exp.meaning + '</p>';
      if (exp.origin) {
        itemHtml += '<p class="origin"><strong>典故：</strong>' + exp.origin + '</p>';
      }
      itemHtml += '</div>';
      return itemHtml;
    }).join('');
    html += '</div></div>';
  }

  targetText.innerHTML = html;
}

// Start app
init();
