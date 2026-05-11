/* 文献检索前端逻辑 */

const API = {
    config: '/literature/api/config',
    tasks: '/literature/api/tasks',
    task: (id) => `/literature/api/tasks/${id}`,
    pdf: (id) => `/literature/api/tasks/${id}/pdf`,
    scheduleStatus: '/literature/api/schedule',
    schedulePreset: '/literature/api/schedule/preset',
    scheduleRunNow: '/literature/api/schedule/run-now',
};

const state = {
    keywordGroups: {},
    selectedKeywords: new Set(),
    sources: [],
    selectedSources: new Set(),
    automatable: new Set(),
    currentTaskId: null,
    poller: null,
};

function el(tag, attrs = {}, children = []) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === 'class') n.className = v;
        else if (k === 'onClick') n.addEventListener('click', v);
        else if (k === 'text') n.textContent = v;
        else n.setAttribute(k, v);
    }
    (Array.isArray(children) ? children : [children]).forEach(c => {
        if (c == null) return;
        n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
}

async function init() {
    try {
        const r = await fetch(API.config);
        const cfg = await r.json();
        state.keywordGroups = cfg.keyword_groups || {};
        state.sources = cfg.sources || [];
        state.automatable = new Set(cfg.automatable_source_keys || []);
        renderSources();
        renderKeywords();
        renderJournals(cfg.target_journals || []);
        renderLLMStatus(cfg.deepseek_enabled);
    } catch (e) {
        alert('加载配置失败：' + e.message);
    }

    document.getElementById('kw-select-all').addEventListener('click', () => {
        Object.values(state.keywordGroups).flat().forEach(k => state.selectedKeywords.add(k));
        renderKeywords();
    });
    document.getElementById('kw-clear-all').addEventListener('click', () => {
        state.selectedKeywords.clear();
        renderKeywords();
    });
    document.getElementById('submit-btn').addEventListener('click', submitTask);
    document.getElementById('sched-save').addEventListener('click', savePreset);
    document.getElementById('sched-run-now').addEventListener('click', runPresetNow);
    loadScheduleStatus();
    setInterval(loadScheduleStatus, 30000);  // 每 30s 刷新一次调度状态
}

function renderSources() {
    const box = document.getElementById('sources-list');
    box.innerHTML = '';
    let disabledCount = 0;

    state.sources.forEach(src => {
        const auto = state.automatable.has(src.key);
        if (auto && state.selectedSources.size === 0) {
            state.selectedSources.add(src.key);
        }
        const checked = state.selectedSources.has(src.key);
        const chip = el('div', {
            class: 'chip' + (checked ? ' checked' : '') + (!auto ? ' disabled warn' : ''),
            title: src.note || '',
        });
        chip.addEventListener('click', () => {
            if (!auto) {
                alert(`${src.name} 暂不支持自动检索：\n${src.note}`);
                return;
            }
            if (state.selectedSources.has(src.key)) state.selectedSources.delete(src.key);
            else state.selectedSources.add(src.key);
            renderSources();
        });
        chip.appendChild(el('span', { text: src.name }));
        if (!auto) {
            chip.appendChild(el('span', { class: 'chip-badge', text: '未支持' }));
            disabledCount++;
        } else {
            chip.appendChild(el('span', { class: 'chip-badge', text: 'API' }));
        }
        box.appendChild(chip);
    });

    document.getElementById('sources-tip').textContent =
        `可用源 ${state.automatable.size} 个，受限 ${disabledCount} 个（点击查看原因）`;
}

function renderKeywords() {
    const box = document.getElementById('keyword-groups');
    box.innerHTML = '';
    for (const [group, kws] of Object.entries(state.keywordGroups)) {
        const wrap = el('div', { class: 'kw-group' });
        wrap.appendChild(el('div', { class: 'kw-group-title', text: group }));
        const chips = el('div', { class: 'chips' });
        kws.forEach(k => {
            const checked = state.selectedKeywords.has(k);
            const chip = el('div', { class: 'chip' + (checked ? ' checked' : ''), text: k });
            chip.addEventListener('click', () => {
                if (state.selectedKeywords.has(k)) state.selectedKeywords.delete(k);
                else state.selectedKeywords.add(k);
                renderKeywords();
            });
            chips.appendChild(chip);
        });
        wrap.appendChild(chips);
        box.appendChild(wrap);
    }
    document.getElementById('kw-count').textContent = `已选 ${state.selectedKeywords.size} 个关键词`;
}

function renderJournals(journals) {
    const ul = document.getElementById('journal-list');
    ul.innerHTML = '';
    journals.forEach(j => {
        const li = el('li');
        li.appendChild(el('div', { text: j.name }));
        li.appendChild(el('div', { class: 'pub', text: `${j.publisher}  ·  ISSN ${j.issn}` }));
        ul.appendChild(li);
    });
}

function renderLLMStatus(enabled) {
    const s = document.getElementById('llm-status');
    if (enabled) {
        s.className = 'tip ok';
        s.textContent = 'DeepSeek：已启用，将生成中文摘要。';
    } else {
        s.className = 'tip bad';
        s.textContent = 'DeepSeek：未配置 DEEPSEEK_API_KEY，将降级使用英文摘要截取（可在服务端设置环境变量启用）。';
    }
}

async function submitTask() {
    if (state.selectedKeywords.size === 0) {
        alert('请至少勾选一个关键词');
        return;
    }
    if (state.selectedSources.size === 0) {
        alert('请至少选择一个检索源');
        return;
    }
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = '提交中…';

    try {
        const r = await fetch(API.tasks, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                keywords: Array.from(state.selectedKeywords),
                sources: Array.from(state.selectedSources),
                days: parseInt(document.getElementById('days-select').value, 10),
            }),
        });
        if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${r.status}`);
        }
        const task = await r.json();
        state.currentTaskId = task.task_id;
        document.getElementById('task-actions').style.display = 'none';
        document.getElementById('articles-list').innerHTML = '';
        document.getElementById('articles-empty').classList.remove('show');
        pollTask();
    } catch (e) {
        alert('提交失败：' + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = '开始检索';
    }
}

function pollTask() {
    if (state.poller) clearInterval(state.poller);
    state.poller = setInterval(async () => {
        if (!state.currentTaskId) return;
        try {
            const r = await fetch(API.task(state.currentTaskId) + '?include_articles=1');
            const t = await r.json();
            updateProgress(t);
            if (t.status === 'done' || t.status === 'failed') {
                clearInterval(state.poller);
                state.poller = null;
                if (t.status === 'done') {
                    const link = document.getElementById('download-pdf');
                    link.href = API.pdf(t.task_id);
                    document.getElementById('task-actions').style.display = 'block';
                }
                renderArticles(t.articles || []);
            }
        } catch (e) {
            console.warn('poll error', e);
        }
    }, 1500);
}

function updateProgress(t) {
    document.getElementById('task-progress').style.width = (t.progress || 0) + '%';
    document.getElementById('task-status').textContent =
        `状态：${t.status}  ·  ${t.message || ''}  ·  命中 ${t.article_count || 0} 篇`;
}

function renderArticles(articles) {
    const box = document.getElementById('articles-list');
    box.innerHTML = '';
    const empty = document.getElementById('articles-empty');
    if (articles.length === 0) {
        empty.classList.add('show');
        return;
    }
    empty.classList.remove('show');
    articles.forEach((a, i) => {
        const card = el('div', { class: 'article-card' });
        card.appendChild(el('div', { class: 'article-title', text: `${i + 1}. ${a.title}` }));

        const metaBits = [];
        if (a.journal) metaBits.push(a.journal);
        if (a.published_date) metaBits.push(a.published_date);
        metaBits.push(`来源: ${a.source}`);
        if (a.doi) metaBits.push(`DOI: ${a.doi}`);
        const meta = el('div', { class: 'article-meta', text: metaBits.join('  ·  ') });
        card.appendChild(meta);

        if (a.keywords_matched && a.keywords_matched.length) {
            const kwRow = el('div', { class: 'article-meta' });
            a.keywords_matched.forEach(k => kwRow.appendChild(el('span', { class: 'article-kw-hit', text: k })));
            card.appendChild(kwRow);
        }

        card.appendChild(el('div', { class: 'article-summary', text: a.chinese_summary || '(未生成摘要)' }));

        if (a.url) {
            const linkRow = el('div', { class: 'article-meta' });
            const link = el('a', { href: a.url, target: '_blank', text: a.url });
            linkRow.appendChild(link);
            card.appendChild(linkRow);
        }

        box.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', init);

// ========== 定时任务 ==========
async function loadScheduleStatus() {
    try {
        const r = await fetch(API.scheduleStatus);
        const s = await r.json();
        const wdNames = ['周一','周二','周三','周四','周五','周六','周日'];
        const wdName = wdNames[s.weekday] || `Weekday ${s.weekday}`;
        const tz = s.timezone || '';
        document.getElementById('sched-summary').textContent =
            `状态：${s.enabled ? (s.running ? '运行中' : '已配置但未启动') : '已禁用'}  ·  ` +
            `每 ${wdName} ${pad2(s.hour)}:${pad2(s.minute)} (${tz})  ·  ` +
            `${s.has_user_preset ? '已保存自定义预设' : '使用默认预设（全量关键词）'}`;
        document.getElementById('sched-next').textContent =
            '下次运行：' + (s.next_run ? formatIso(s.next_run) : '--');
        if (s.last_run) {
            let line = '上次运行：' + formatIso(s.last_run);
            if (s.last_task_id) line += ` (任务 ${s.last_task_id})`;
            if (s.last_error) line += `  错误：${s.last_error}`;
            document.getElementById('sched-last').textContent = line;
        } else {
            document.getElementById('sched-last').textContent = '上次运行：尚未运行';
        }
    } catch (e) {
        document.getElementById('sched-summary').textContent = '加载调度状态失败: ' + e.message;
    }
}

async function savePreset() {
    if (state.selectedKeywords.size === 0 || state.selectedSources.size === 0) {
        alert('请先勾选至少一个关键词和一个检索源，再保存为周度预设。');
        return;
    }
    try {
        const r = await fetch(API.schedulePreset, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                keywords: Array.from(state.selectedKeywords),
                sources: Array.from(state.selectedSources),
                days: parseInt(document.getElementById('days-select').value, 10),
            }),
        });
        if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${r.status}`);
        }
        const data = await r.json();
        alert(`已保存：${data.preset.keywords.length} 关键词，${data.preset.sources.length} 个源，${data.preset.days} 天`);
        loadScheduleStatus();
    } catch (e) {
        alert('保存预设失败: ' + e.message);
    }
}

async function runPresetNow() {
    if (!confirm('将按当前保存的预设立即执行一次检索，继续？')) return;
    try {
        const r = await fetch(API.scheduleRunNow, { method: 'POST' });
        if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${r.status}`);
        }
        const data = await r.json();
        state.currentTaskId = data.task_id;
        document.getElementById('task-actions').style.display = 'none';
        document.getElementById('articles-list').innerHTML = '';
        pollTask();
        loadScheduleStatus();
    } catch (e) {
        alert('触发失败: ' + e.message);
    }
}

function pad2(n) { return String(n).padStart(2, '0'); }
function formatIso(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleString('zh-CN');
    } catch (e) { return iso; }
}
