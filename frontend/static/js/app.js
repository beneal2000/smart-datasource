const API_BASE = '/api';

let allSources = {};
let installStatus = {};
let currentCompareSelection = [];

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initFilters();
    initModal();
    loadInitialData();
});

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

function initFilters() {
    document.getElementById('filter-source-type').addEventListener('change', filterSources);
    document.getElementById('filter-data-type').addEventListener('change', filterSources);
    document.getElementById('filter-install-status').addEventListener('change', filterSources);
    document.getElementById('search-input').addEventListener('input', filterSources);
    document.getElementById('show-missing-btn').addEventListener('click', showMissingPackages);
    document.getElementById('compare-btn').addEventListener('click', doCompare);
}

function initModal() {
    const modal = document.getElementById('source-modal');
    const closeBtn = document.getElementById('modal-close');
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

async function loadInitialData() {
    try {
        const [sourcesRes, summaryRes, dataTypesRes, installRes, availabilityRes] = await Promise.all([
            fetch(`${API_BASE}/sources`),
            fetch(`${API_BASE}/summary`),
            fetch(`${API_BASE}/data-types`),
            fetch(`${API_BASE}/install-status`),
            fetch(`${API_BASE}/availability`)
        ]);
        
        allSources = await sourcesRes.json();
        const summary = await summaryRes.json();
        const dataTypes = await dataTypesRes.json();
        installStatus = await installRes.json();
        const availability = await availabilityRes.json();
        
        updateOverview(summary, availability);
        populateDataTypes(dataTypes);
        renderSourcesTable();
        renderRecommendTypes(dataTypes);
        renderCompareCheckboxes();
        loadMatrix();
        
    } catch (error) {
        console.error('Failed to load initial data:', error);
    }
}

function updateOverview(summary, availability) {
    const totalSources = Object.keys(summary).length;
    const freeSources = Object.values(summary).filter(s => s.is_free).length;
    const installedSources = Object.values(installStatus).filter(v => v).length;
    
    document.getElementById('total-sources').textContent = totalSources;
    document.getElementById('free-sources').textContent = freeSources;
    document.getElementById('installed-sources').textContent = installedSources;
    
    const chinaFree = Object.values(summary).filter(s => s.type === 'china_free').length;
    const chinaPaid = Object.values(summary).filter(s => s.type === 'china_paid').length;
    const intlFree = Object.values(summary).filter(s => s.type === 'international_free').length;
    const intlPaid = Object.values(summary).filter(s => s.type === 'international_paid').length;
    
    document.getElementById('china-free-count').textContent = chinaFree;
    document.getElementById('china-paid-count').textContent = chinaPaid;
    document.getElementById('intl-free-count').textContent = intlFree;
    document.getElementById('intl-paid-count').textContent = intlPaid;
    
    const progress = (installedSources / totalSources) * 100;
    document.getElementById('install-progress').style.width = `${progress}%`;
    document.getElementById('install-text').textContent = `${installedSources}/${totalSources} 已安装`;
    
    const dataTypesGrid = document.getElementById('data-types-grid');
    dataTypesGrid.innerHTML = '';
    Object.entries(availability).slice(0, 12).forEach(([type, sources]) => {
        const item = document.createElement('div');
        item.className = 'data-type-item';
        item.innerHTML = `
            <span>${type}</span>
            <span class="count">${sources.length}</span>
        `;
        dataTypesGrid.appendChild(item);
    });
    
    const topSources = Object.entries(summary)
        .sort((a, b) => b[1].priority_score - a[1].priority_score)
        .slice(0, 5);
    
    const topSourcesList = document.getElementById('top-sources-list');
    topSourcesList.innerHTML = '';
    topSources.forEach(([name, info], index) => {
        const item = document.createElement('div');
        item.className = 'top-source-item';
        item.innerHTML = `
            <span class="rank">${index + 1}</span>
            <div class="source-info">
                <div class="source-name">${name}</div>
                <div class="source-score">优先级: ${info.priority_score} | ${info.is_free ? '免费' : '付费'}</div>
            </div>
        `;
        topSourcesList.appendChild(item);
    });
    
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            document.querySelector('[data-tab="sources"]').click();
            document.getElementById('filter-source-type').value = type;
            filterSources();
        });
    });
}

function populateDataTypes(dataTypes) {
    const select = document.getElementById('filter-data-type');
    dataTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
    });
}

function renderSourcesTable() {
    const tbody = document.getElementById('sources-tbody');
    tbody.innerHTML = '';
    
    const sortedSources = Object.entries(allSources)
        .sort((a, b) => b[1].priority_score - a[1].priority_score);
    
    sortedSources.forEach(([name, info]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${name}</strong></td>
            <td>${getTypeLabel(info.source_type)}</td>
            <td><span class="status-badge ${info.is_free ? 'free' : 'paid'}">${info.is_free ? '免费' : '付费'}</span></td>
            <td><span class="status-badge ${info.is_installed ? 'installed' : 'not-installed'}">${info.is_installed ? '已安装' : '未安装'}</span></td>
            <td><span class="priority-badge ${getPriorityClass(info.priority_score)}">${info.priority_score}</span></td>
            <td>
                <div class="data-types-tags">
                    ${info.data_types.slice(0, 4).map(t => `<span class="data-type-tag">${t}</span>`).join('')}
                    ${info.data_types.length > 4 ? `<span class="data-type-tag">+${info.data_types.length - 4}</span>` : ''}
                </div>
            </td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="showSourceDetail('${name}')">详情</button>
                ${info.install_command ? `<button class="btn btn-primary btn-sm" onclick="copyInstall('${info.install_command}')">复制安装</button>` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterSources() {
    const sourceType = document.getElementById('filter-source-type').value;
    const dataType = document.getElementById('filter-data-type').value;
    const installStatusFilter = document.getElementById('filter-install-status').value;
    const search = document.getElementById('search-input').value.toLowerCase();
    
    const rows = document.querySelectorAll('#sources-tbody tr');
    
    rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const type = row.cells[1].textContent;
        const isFree = row.cells[2].textContent.includes('免费');
        const isInstalled = row.cells[3].textContent.includes('已安装');
        const dataTypesText = row.cells[4].textContent;
        
        let show = true;
        
        if (sourceType) {
            const typeMap = {
                'china_free': '中国免费',
                'china_paid': '中国付费',
                'international_free': '国际免费',
                'international_paid': '国际付费'
            };
            if (!type.includes(typeMap[sourceType])) show = false;
        }
        
        if (dataType && !dataTypesText.includes(dataType)) show = false;
        
        if (installStatusFilter === 'installed' && !isInstalled) show = false;
        if (installStatusFilter === 'not-installed' && isInstalled) show = false;
        
        if (search && !name.includes(search)) show = false;
        
        row.style.display = show ? '' : 'none';
    });
}

function getTypeLabel(type) {
    const labels = {
        'china_free': '中国免费',
        'china_paid': '中国付费',
        'international_free': '国际免费',
        'international_paid': '国际付费'
    };
    return labels[type] || type;
}

function getPriorityClass(score) {
    if (score >= 85) return 'high';
    if (score >= 70) return 'medium';
    return 'low';
}

async function showSourceDetail(name) {
    const modal = document.getElementById('source-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = name;
    
    const source = allSources[name];
    if (!source) return;
    
    modalBody.innerHTML = `
        <div class="detail-section">
            <h4>基本信息</h4>
            <p><strong>类型:</strong> ${getTypeLabel(source.source_type)}</p>
            <p><strong>免费:</strong> ${source.is_free ? '是' : '否'}</p>
            <p><strong>需要注册:</strong> ${source.requires_registration ? '是' : '否'}</p>
            <p><strong>需要API Key:</strong> ${source.requires_api_key ? '是' : '否'}</p>
            <p><strong>官网:</strong> <a href="${source.website}" target="_blank">${source.website}</a></p>
        </div>
        <div class="detail-section">
            <h4>安装命令</h4>
            <p><code>${source.install_command || 'N/A'}</code></p>
        </div>
        <div class="detail-section">
            <h4>支持的数据类型</h4>
            <p>${source.data_types.join(', ')}</p>
        </div>
        <div class="detail-section">
            <h4>优点</h4>
            <ul class="detail-list">
                ${source.pros ? source.pros.map(p => `<li>${p}</li>`).join('') : '<li>N/A</li>'}
            </ul>
        </div>
        <div class="detail-section">
            <h4>缺点</h4>
            <ul class="detail-list">
                ${source.cons ? source.cons.map(c => `<li>${c}</li>`).join('') : '<li>N/A</li>'}
            </ul>
        </div>
    `;
    
    modal.classList.add('active');
}

function copyInstall(command) {
    navigator.clipboard.writeText(command).then(() => {
        alert('安装命令已复制: ' + command);
    });
}

function showMissingPackages() {
    document.querySelector('[data-tab="sources"]').click();
    document.getElementById('filter-install-status').value = 'not-installed';
    filterSources();
}

function renderRecommendTypes(dataTypes) {
    const container = document.getElementById('recommend-type-buttons');
    container.innerHTML = '';
    
    dataTypes.forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'data-type-btn';
        btn.innerHTML = `
            <span>${type}</span>
            <span>→</span>
        `;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.data-type-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadRecommendation(type);
        });
        container.appendChild(btn);
    });
}

async function loadRecommendation(dataType) {
    const container = document.getElementById('recommend-results');
    container.innerHTML = '<div class="empty-state"><p>加载中...</p></div>';
    
    try {
        const res = await fetch(`${API_BASE}/recommend/${dataType}`);
        const data = await res.json();
        
        container.innerHTML = '<div class="recommendation-list"></div>';
        const list = container.querySelector('.recommendation-list');
        
        data.recommended_sources.forEach((name, index) => {
            const source = allSources[name];
            if (!source) return;
            
            const item = document.createElement('div');
            item.className = `recommendation-item ${index === 0 ? 'first' : ''}`;
            item.innerHTML = `
                <span class="rec-rank">${index + 1}</span>
                <div class="rec-content">
                    <div class="rec-name">${name} ${source.is_free ? '(免费)' : '(付费)'}</div>
                    <div class="rec-reason">${data.reasons[name] || ''}</div>
                    <div class="rec-install">${source.install_command || ''}</div>
                </div>
            `;
            list.appendChild(item);
        });
        
    } catch (error) {
        container.innerHTML = '<div class="empty-state"><p>加载失败</p></div>';
    }
}

function renderCompareCheckboxes() {
    const container = document.getElementById('compare-checkboxes');
    container.innerHTML = '';
    
    Object.keys(allSources).forEach(name => {
        const label = document.createElement('label');
        label.className = 'compare-checkbox';
        label.innerHTML = `
            <input type="checkbox" value="${name}">
            <span>${name}</span>
        `;
        label.querySelector('input').addEventListener('change', (e) => {
            if (e.target.checked) {
                if (currentCompareSelection.length >= 5) {
                    e.target.checked = false;
                    alert('最多选择5个数据源进行对比');
                    return;
                }
                currentCompareSelection.push(name);
            } else {
                currentCompareSelection = currentCompareSelection.filter(s => s !== name);
            }
        });
        container.appendChild(label);
    });
}

async function doCompare() {
    if (currentCompareSelection.length < 2) {
        alert('请至少选择2个数据源进行对比');
        return;
    }
    
    const container = document.getElementById('compare-results');
    container.innerHTML = '<div class="empty-state"><p>加载中...</p></div>';
    
    try {
        const res = await fetch(`${API_BASE}/compare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sources: currentCompareSelection })
        });
        const data = await res.json();
        
        container.innerHTML = '<div class="compare-grid"></div>';
        const grid = container.querySelector('.compare-grid');
        
        Object.entries(data).forEach(([name, info]) => {
            const item = document.createElement('div');
            item.className = 'compare-item';
            item.innerHTML = `
                <h4>${name}</h4>
                <div class="compare-detail">
                    <div class="compare-detail-item"><span>免费:</span><span>${info.is_free ? '是' : '否'}</span></div>
                    <div class="compare-detail-item"><span>优先级:</span><span>${info.priority_score}</span></div>
                    <div class="compare-detail-item"><span>需要注册:</span><span>${info.requires_registration ? '是' : '否'}</span></div>
                    <div class="compare-detail-item"><span>需要API Key:</span><span>${info.requires_api_key ? '是' : '否'}</span></div>
                </div>
                <div style="margin-top: 0.75rem;">
                    <strong>优点:</strong> ${info.pros.slice(0, 3).join(', ')}
                </div>
                <div style="margin-top: 0.5rem;">
                    <strong>缺点:</strong> ${info.cons.slice(0, 2).join(', ')}
                </div>
            `;
            grid.appendChild(item);
        });
        
    } catch (error) {
        container.innerHTML = '<div class="empty-state"><p>加载失败</p></div>';
    }
}

async function loadMatrix() {
    try {
        const res = await fetch(`${API_BASE}/matrix`);
        const matrix = await res.json();
        
        const thead = document.getElementById('matrix-thead');
        const tbody = document.getElementById('matrix-tbody');
        
        const allSourceNames = new Set();
        Object.values(matrix).forEach(sources => {
            Object.keys(sources).forEach(name => allSourceNames.add(name));
        });
        const sourceNames = Array.from(allSourceNames).slice(0, 10);
        
        thead.innerHTML = `
            <tr>
                <th>数据类型</th>
                ${sourceNames.map(n => `<th>${n}</th>`).join('')}
            </tr>
        `;
        
        tbody.innerHTML = '';
        Object.entries(matrix).forEach(([dataType, sources]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${dataType}</td>
                ${sourceNames.map(name => {
                    const score = sources[name];
                    if (score === undefined) return '<td>-</td>';
                    return `<td><span class="matrix-score ${getPriorityClass(score)}">${score}</span></td>`;
                }).join('')}
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Failed to load matrix:', error);
    }
}
