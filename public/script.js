// 全局变量
let originalImage = null;
let processedImage = null;
let currentBackgroundColor = '#ffffff';

// UI辅助函数
function showLoading(message = '处理中...') {
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.textContent = message;
    document.body.appendChild(loading);
    return loading;
}

function hideLoading(loadingElement) {
    if (loadingElement) {
        document.body.removeChild(loadingElement);
    }
}

function showMessage(message, type = 'error') {
    const messageDiv = document.createElement('div');
    messageDiv.className = type;
    messageDiv.textContent = message;
    document.querySelector('.container').prepend(messageDiv);
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// DOM元素
const fileInput = document.getElementById('fileInput');
const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');
const colorBtns = document.querySelectorAll('.color-btn');
const downloadBtn = document.getElementById('downloadBtn');
const secondaryDownloadBtn = document.getElementById('secondaryDownloadBtn');

// 初始化
function init() {
    // 绑定事件
    fileInput.addEventListener('change', handleFileUpload);
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentBackgroundColor = btn.dataset.color;
            // 添加选中状态
            colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updatePreview();
        });
    });
    // downloadBtn.addEventListener('click', handleDownload);
    secondaryDownloadBtn.addEventListener('click', handleSecondaryDownload);
}

// 处理文件上传
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                processImage();
                // 重置fileInput的value，以便可以再次选择同一个文件
                e.target.value = '';
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}



// 处理图片（使用remove.bg API进行抠图）
function processImage() {
    if (!originalImage) return;
    
    const loading = showLoading('正在抠图...');
    
    // 配置信息
    const apiKey = 'hFjZffNX3rpZQtmPpHmj8MxX';
    const apiUrl = 'https://api.remove.bg/v1.0/removebg';
    
    // 创建画布并绘制图片
    const canvas = document.createElement('canvas');
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(originalImage, 0, 0);
    
    // 将画布转换为Blob
    canvas.toBlob((blob) => {
        if (!blob) {
            throw new Error('无法创建图像Blob');
        }
        
        // 创建FormData
        const formData = new FormData();
        formData.append('image_file', blob);
        formData.append('size', 'auto');
        
        // 调用API
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey
            },
            body: formData
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`API请求失败: ${text}`);
                });
            }
            return response.blob();
        })
        .then(blob => {
            // 创建图片对象
            const img = new Image();
            img.onload = () => {
                processedImage = img;
                updatePreview();
                hideLoading(loading);
                showMessage('抠图成功！', 'success');
            };
            img.src = URL.createObjectURL(blob);
        })
        .catch(err => {
            console.error('抠图失败:', err);
            hideLoading(loading);
            showMessage('抠图失败，使用原图', 'error');
            // 如果抠图失败，使用原图
            processedImage = originalImage;
            updatePreview();
        });
    }, 'image/jpeg');
}

// 更新预览
function updatePreview() {
    if (!processedImage) return;
    
    // 设置预览画布大小（默认一寸照片尺寸）
    const width = 295;
    const height = 413;
    previewCanvas.width = width;
    previewCanvas.height = height;
    
    // 绘制背景
    previewCtx.fillStyle = currentBackgroundColor;
    previewCtx.fillRect(0, 0, width, height);
    
    // 计算图片位置和大小（保持比例）
    const imgRatio = processedImage.width / processedImage.height;
    const canvasRatio = width / height;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imgRatio > canvasRatio) {
        drawHeight = height;
        drawWidth = drawHeight * imgRatio;
        drawX = (width - drawWidth) / 2;
        drawY = 0;
    } else {
        drawWidth = width;
        drawHeight = drawWidth / imgRatio;
        drawX = 0;
        drawY = (height - drawHeight) / 2;
    }
    
    // 绘制图片
    previewCtx.drawImage(processedImage, drawX, drawY, drawWidth, drawHeight);
}

// 处理高清下载
function handleDownload() {
    if (!processedImage) {
        showMessage('请先上传或拍摄照片');
        return;
    }
    
    const loading = showLoading('正在处理订单...');
    
    // 1. 前端请求后端下单
    fetch('https://your-backend-api.com/api/order/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            product: '高清证件照',
            amount: 5, // 假设高清下载价格为5元
            callbackUrl: 'https://your-frontend.com/callback'
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('订单创建失败');
        return response.json();
    })
    .then(orderData => {
        // 2. 后端返回支付参数
        if (!orderData.success) throw new Error(orderData.message || '订单创建失败');
        
        hideLoading(loading);
        
        // 3. 唤起收银台（这里使用模拟实现，实际应使用真实的支付SDK）
        showMessage('请完成支付以获取高清下载', 'success');
        
        // 模拟支付流程
        setTimeout(() => {
            // 假设用户支付成功
            showMessage('支付成功，正在生成高清图片...', 'success');
            
            // 4. 生成高清图片并下载
            generateAndDownloadHighResImage();
        }, 2000);
    })
    .catch(err => {
        console.error('下单失败:', err);
        hideLoading(loading);
        showMessage('下单失败，请重试', 'error');
    });
}

// 生成并下载高清图片
function generateAndDownloadHighResImage() {
    // 创建高清画布（默认一寸照片尺寸，3倍高清）
    const width = 295 * 3;
    const height = 413 * 3;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // 绘制背景
    ctx.fillStyle = currentBackgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // 绘制图片
    const imgRatio = processedImage.width / processedImage.height;
    const canvasRatio = width / height;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imgRatio > canvasRatio) {
        drawHeight = height;
        drawWidth = drawHeight * imgRatio;
        drawX = (width - drawWidth) / 2;
        drawY = 0;
    } else {
        drawWidth = width;
        drawHeight = drawWidth / imgRatio;
        drawX = 0;
        drawY = (height - drawHeight) / 2;
    }
    
    ctx.drawImage(processedImage, drawX, drawY, drawWidth, drawHeight);
    
    // 下载图片
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `证件照_高清_${new Date().getTime()}.png`;
    link.click();
    
    showMessage('下载成功！', 'success');
}

// 处理普通下载
function handleSecondaryDownload() {
    if (!processedImage) {
        showMessage('请先上传或拍摄照片');
        return;
    }
    
    const loading = showLoading('正在生成图片...');
    
    // 创建普通画布（默认一寸照片尺寸）
    const width = 295;
    const height = 413;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // 绘制背景
    ctx.fillStyle = currentBackgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // 绘制图片
    const imgRatio = processedImage.width / processedImage.height;
    const canvasRatio = width / height;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imgRatio > canvasRatio) {
        drawHeight = height;
        drawWidth = drawHeight * imgRatio;
        drawX = (width - drawWidth) / 2;
        drawY = 0;
    } else {
        drawWidth = width;
        drawHeight = drawWidth / imgRatio;
        drawX = 0;
        drawY = (height - drawHeight) / 2;
    }
    
    ctx.drawImage(processedImage, drawX, drawY, drawWidth, drawHeight);
    
    // 下载图片
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `证件照_${new Date().getTime()}.png`;
    link.click();
    
    hideLoading(loading);
    showMessage('下载成功！', 'success');
}

// 初始化应用
init();