// ==================== KONFIGURASI TOKEN ====================
// TOKEN LU YANG ASLI
const CONFIG = {
    github: {
        token: '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',
        username: 'zamxs-oblivion'
    },
    vercel: {
        token: 'vcp_1qApXhS4tujXkZBWnm0uxSTBtyor5zT3LNxMka14aZHRldXBw12ybMCt'
    },
    netlify: {
        // Netlify token opsional
    }
};

// ==================== STATE MANAGEMENT ====================
let currentFiles = [];
let currentPlatform = 'vercel';
let isDeploying = false;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    init();
});

function init() {
    setupDragDrop();
    setupPlatformButtons();
    setupEventListeners();
    loadConfig();
    addLog('✅ System ready! Tokens loaded');
    addLog(`🔑 GitHub: ${maskToken(CONFIG.github.token)}`);
    addLog(`🔑 Vercel: ${maskToken(CONFIG.vercel.token)}`);
}

function maskToken(token) {
    return token.substring(0, 10) + '...' + token.substring(token.length - 5);
}

// ==================== CONFIG LOADER ====================
function loadConfig() {
    try {
        const configElement = document.getElementById('configData');
        if (configElement && configElement.textContent) {
            const config = JSON.parse(configElement.textContent);
            Object.assign(CONFIG, config);
            addLog('✅ External config loaded');
        }
    } catch (e) {
        console.log('Using default config');
    }
}

// ==================== DRAG & DROP SETUP ====================
function setupDragDrop() {
    const area = document.getElementById('uploadArea');
    const input = document.getElementById('fileInput');
    
    area.addEventListener('click', () => input.click());
    
    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('dragover');
    });
    
    area.addEventListener('dragleave', () => {
        area.classList.remove('dragover');
    });
    
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    
    input.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
}

// ==================== FILE HANDLING ====================
async function handleFiles(files) {
    currentFiles = [];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Handle ZIP files
        if (file.name.endsWith('.zip')) {
            addLog(`📦 Extracting ZIP: ${file.name}...`);
            const extracted = await extractZip(file);
            currentFiles.push(...extracted);
            addLog(`✅ Extracted ${extracted.length} files from ZIP`);
        } else {
            currentFiles.push(file);
        }
    }
    
    displayFiles();
    document.getElementById('deployBtn').disabled = false;
    addLog(`✅ ${currentFiles.length} files ready: ${currentFiles.map(f => f.name).join(', ')}`);
}

async function extractZip(zipFile) {
    const zip = new JSZip();
    const contents = await zip.loadAsync(zipFile);
    const extractedFiles = [];
    
    for (const [filename, file] of Object.entries(contents.files)) {
        if (!file.dir) {
            const content = await file.async('blob');
            const newFile = new File([content], filename, {
                type: file.name.endsWith('.json') ? 'application/json' : 
                      file.name.endsWith('.js') ? 'application/javascript' : 
                      'text/html'
            });
            extractedFiles.push(newFile);
        }
    }
    
    return extractedFiles;
}

function displayFiles() {
    const container = document.getElementById('fileList');
    container.innerHTML = '';
    
    currentFiles.forEach((file, index) => {
        const ext = file.name.split('.').pop();
        const fileCard = document.createElement('div');
        fileCard.className = 'file-card';
        fileCard.innerHTML = `
            <div class="file-info">
                <span class="file-icon">${getFileIcon(ext)}</span>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">${formatBytes(file.size)} • .${ext}</div>
                </div>
            </div>
            <button class="remove-file" onclick="removeFile(${index})">✖</button>
        `;
        container.appendChild(fileCard);
    });
}

function getFileIcon(ext) {
    const icons = {
        html: '🌐',
        htm: '🌐',
        js: '⚡',
        json: '📊',
        css: '🎨',
        zip: '📦'
    };
    return icons[ext] || '📄';
}

function removeFile(index) {
    currentFiles.splice(index, 1);
    displayFiles();
    if (currentFiles.length === 0) {
        document.getElementById('deployBtn').disabled = true;
    }
    addLog(`📁 File removed. ${currentFiles.length} files remaining`);
}

// ==================== PLATFORM HANDLING ====================
function setupPlatformButtons() {
    document.querySelectorAll('.platform-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.platform-btn').forEach(b => 
                b.classList.remove('active'));
            this.classList.add('active');
            currentPlatform = this.dataset.platform;
            updateDomainPreview();
            addLog(`🎯 Platform switched to: ${currentPlatform}`);
        });
    });
}

function updateDomainPreview() {
    const domains = {
        vercel: 'vercel.app',
        github: 'github.io',
        netlify: 'netlify.app'
    };
    document.getElementById('previewDomain').textContent = domains[currentPlatform];
}

// ==================== UI HELPERS ====================
function setupEventListeners() {
    document.getElementById('siteName').addEventListener('input', updatePreview);
}

function updatePreview() {
    const name = document.getElementById('siteName').value || 'zamxs-deploy';
    const clean = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    document.getElementById('previewName').textContent = clean;
}

function addLog(message, type = 'info') {
    const log = document.getElementById('logContainer');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `⟫ ${message}`;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==================== DEPLOY FUNCTIONS ====================
async function deploy() {
    if (currentFiles.length === 0) {
        addLog('❌ No files selected!', 'error');
        return;
    }
    
    const siteName = document.getElementById('siteName').value.toLowerCase()
        .replace(/[^a-z0-9-]/g, '-');
    
    if (siteName.length < 3) {
        addLog('❌ Site name must be at least 3 characters!', 'error');
        return;
    }
    
    if (isDeploying) return;
    isDeploying = true;
    
    const btn = document.getElementById('deployBtn');
    btn.disabled = true;
    btn.textContent = '⏳ DEPLOYING...';
    
    addLog('🚀 ===== DEPLOYMENT STARTED =====', 'success');
    addLog(`📦 Files: ${currentFiles.length}`);
    addLog(`🌐 Name: ${siteName}`);
    addLog(`🎯 Platform: ${currentPlatform}`);
    
    try {
        let url;
        switch(currentPlatform) {
            case 'github':
                url = await deployToGitHub(siteName);
                break;
            case 'vercel':
                url = await deployToVercel(siteName);
                break;
            case 'netlify':
                url = await deployToNetlify(siteName);
                break;
        }
        
        showResult(url);
    } catch (error) {
        addLog(`❌ Deployment failed: ${error.message}`, 'error');
    }
    
    btn.disabled = false;
    btn.textContent = '🚀 DEPLOY SEKARANG';
    isDeploying = false;
}

// ==================== GITHUB DEPLOY ====================
async function deployToGitHub(siteName) {
    addLog('🐙 Connecting to GitHub API...');
    
    // Check if repo exists
    const checkRes = await fetch(`https://api.github.com/repos/${CONFIG.github.username}/${siteName}`, {
        headers: { 'Authorization': `token ${CONFIG.github.token}` }
    });
    
    if (checkRes.ok) {
        throw new Error(`Repository ${siteName} already exists!`);
    }
    
    // Create repository
    addLog('📦 Creating repository...');
    const createRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
            'Authorization': `token ${CONFIG.github.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: siteName,
            description: 'Deployed by ZAMXS DEPLOYER',
            private: false,
            auto_init: true
        })
    });
    
    if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.message);
    }
    
    // Upload files
    for (const file of currentFiles) {
        addLog(`📤 Uploading ${file.name}...`);
        const content = await readFileAsBase64(file);
        
        const uploadRes = await fetch(
            `https://api.github.com/repos/${CONFIG.github.username}/${siteName}/contents/${file.name}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${CONFIG.github.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Add ${file.name}`,
                    content: content.split(',')[1]
                })
            }
        );
        
        if (!uploadRes.ok) {
            const err = await uploadRes.json();
            throw new Error(`Failed to upload ${file.name}: ${err.message}`);
        }
    }
    
    // Enable GitHub Pages
    addLog('🔧 Enabling GitHub Pages...');
    await new Promise(r => setTimeout(r, 2000));
    
    await fetch(`https://api.github.com/repos/${CONFIG.github.username}/${siteName}/pages`, {
        method: 'POST',
        headers: {
            'Authorization': `token ${CONFIG.github.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            source: { branch: 'main', path: '/' }
        })
    });
    
    const url = `https://${CONFIG.github.username}.github.io/${siteName}/`;
    addLog('✅ GitHub Pages activated!', 'success');
    
    return url;
}

// ==================== VERCEL DEPLOY ====================
async function deployToVercel(siteName) {
    addLog('▲ Connecting to Vercel API...');
    
    const formData = new FormData();
    
    // Add all files
    for (const file of currentFiles) {
        formData.append('file', file);
    }
    
    // Add vercel.json configuration
    const vercelConfig = {
        version: 2,
        builds: currentFiles.some(f => f.name.endsWith('.js')) 
            ? [{ src: '*.js', use: '@vercel/node' }]
            : [{ src: '*.html', use: '@vercel/static' }],
        routes: [{ src: '/(.*)', dest: '/$1' }]
    };
    
    const configFile = new File(
        [JSON.stringify(vercelConfig, null, 2)],
        'vercel.json',
        { type: 'application/json' }
    );
    formData.append('file', configFile);
    
    const deployRes = await fetch('https://api.vercel.com/v12/now/deployments', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CONFIG.vercel.token}`
        },
        body: formData
    });
    
    if (!deployRes.ok) {
        const err = await deployRes.json();
        throw new Error(err.error?.message || 'Vercel deployment failed');
    }
    
    const data = await deployRes.json();
    return `https://${data.alias?.[0] || data.url}`;
}

// ==================== NETLIFY DEPLOY ====================
async function deployToNetlify(siteName) {
    addLog('🚀 Connecting to Netlify API...');
    addLog('⚠️ Netlify deployment coming soon!');
    return `https://${siteName}.netlify.app`;
}

// ==================== UTILITIES ====================
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function showResult(url) {
    const container = document.getElementById('resultContainer');
    container.innerHTML = `
        <div class="result-card">
            <h3>✅ DEPLOYMENT SUCCESSFUL!</h3>
            <p>Your website is live at:</p>
            <div class="url-box">
                <a href="${url}" target="_blank">${url}</a>
                <button class="copy-btn" onclick="copyToClipboard('${url}')">📋 Copy</button>
            </div>
            <p class="note">⏱️ DNS propagation may take 1-2 minutes</p>
        </div>
    `;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    addLog('📋 URL copied to clipboard!');
}

// ==================== EXPOSE TO WINDOW ====================
window.deploy = deploy;
window.removeFile = removeFile;
window.copyToClipboard = copyToClipboard;
