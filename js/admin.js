// ============================================================
//  admin.js — админка с вкладками «Квесты» и «Новости»
// ============================================================

import { getQuests, addQuest, updateQuest, deleteQuest, getQuestById, getCluesByQuestId } from './quests-data.js';
import { getNews, addNews, updateNews, deleteNews } from './news-data.js';

const ADMIN_PASSWORD = 'admin123';
let editingQuestId = null;
let editingNewsId = null;

// ============================================================
//  СТИЛИ (встроены, чтобы не зависеть от внешних)
// ============================================================
(function injectStyles() {
    if (document.getElementById('admin-styles')) return;
    const style = document.createElement('style');
    style.id = 'admin-styles';
    style.textContent = `
        .terminal-btn { display: inline-block; padding: 8px 20px; font-weight: 600; font-size: 14px; background: #ff6b35; color: #080c1a; border: none; cursor: pointer; font-family: 'Inter', sans-serif; text-decoration: none; transition: 0.2s; }
        .terminal-btn:hover { background: #ff8a5c; }
        .terminal-btn.danger { background: transparent; color: #ff6b6b; border: 1px solid #ff6b6b; }
        .terminal-btn.danger:hover { background: #ff6b6b; color: #080c1a; }
        .admin-login { max-width: 400px; margin: 20px auto; }
        .admin-login input { width: 100%; background: rgba(8,12,26,0.6); border: 1px solid rgba(255,255,255,0.06); color: #e8edf2; padding: 12px 16px; font-size: 16px; font-family: 'Inter', sans-serif; margin-top: 8px; }
        .admin-login input:focus { border-color: #ff6b35; outline: none; }
        .admin-login button { margin-top: 12px; }
        .admin-panel .admin-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
        .admin-panel .admin-stats { display: flex; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; }
        .admin-panel .admin-stats .stat { background: rgba(16,24,44,0.4); border: 1px solid rgba(255,255,255,0.05); padding: 12px 24px; text-align: center; flex: 1; min-width: 100px; }
        .admin-panel .admin-stats .stat .num { font-size: 28px; font-weight: 800; color: #ff6b35; display: block; }
        .admin-panel .admin-stats .stat .label { font-size: 12px; color: #5a6a80; }
        .admin-panel .admin-item { background: rgba(16,24,44,0.4); border: 1px solid rgba(255,255,255,0.05); padding: 16px 20px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
        .admin-panel .admin-item:hover { border-color: rgba(255,107,53,0.15); }
        .admin-panel .admin-item .info .title { font-size: 16px; font-weight: 700; color: #e8edf2; }
        .admin-panel .admin-item .info .sub { color: #8a9bb5; font-size: 13px; }
        .admin-panel .admin-item .actions button { background: transparent; border: 1px solid rgba(255,255,255,0.06); color: #8a9bb5; padding: 4px 14px; cursor: pointer; font-family: 'Inter', sans-serif; font-size: 13px; transition: 0.2s; }
        .admin-panel .admin-item .actions button:hover { border-color: #ff6b35; color: #e8edf2; }
        .admin-panel .admin-item .actions button.danger { color: #ff6b6b; border-color: rgba(255,107,107,0.2); }
        .admin-panel .admin-item .actions button.danger:hover { border-color: #ff6b6b; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: rgba(16,24,44,0.95); border: 1px solid rgba(255,255,255,0.06); padding: 32px 28px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; }
        .modal h3 { margin-bottom: 16px; font-size: 22px; font-weight: 700; color: #ff6b35; font-family: 'Oswald', sans-serif; text-transform: uppercase; }
        .modal .field { margin-bottom: 14px; }
        .modal .field label { display: block; color: #8a9bb5; font-size: 14px; font-weight: 600; margin-bottom: 4px; }
        .modal .field input, .modal .field textarea, .modal .field select { width: 100%; background: rgba(8,12,26,0.6); border: 1px solid rgba(255,255,255,0.06); color: #e8edf2; padding: 10px 14px; font-family: 'Inter', sans-serif; font-size: 14px; }
        .modal .field input:focus, .modal .field textarea:focus, .modal .field select:focus { border-color: #ff6b35; outline: none; }
        .modal .field textarea { min-height: 60px; resize: vertical; }
        .modal .field .toggle-group { display: flex; align-items: center; gap: 16px; }
        .modal .field .toggle-group label { display: flex; align-items: center; gap: 6px; cursor: pointer; color: #8a9bb5; }
        .modal .field .toggle-group input[type="checkbox"] { width: auto; accent-color: #ff6b35; }
        .modal .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
        .modal .modal-actions button { padding: 8px 24px; border: 1px solid rgba(255,255,255,0.06); background: transparent; color: #8a9bb5; font-family: 'Inter', sans-serif; cursor: pointer; transition: 0.2s; }
        .modal .modal-actions button:hover { border-color: #ff6b35; color: #e8edf2; }
        .modal .modal-actions button.cancel { color: #5a6a80; }
        .modal .modal-actions button.save { background: #ff6b35; color: #080c1a; border-color: #ff6b35; font-weight: 700; }
        .modal .modal-actions button.save:hover { background: #ff8a5c; }
        .clue-block { border: 1px solid rgba(255,255,255,0.06); padding: 12px; margin-top: 8px; background: rgba(8,12,26,0.4); }
        .clue-block label { display: block; color: #5a6a80; font-size: 12px; margin-bottom: 2px; }
        .clue-block input, .clue-block select { width: 100%; background: rgba(8,12,26,0.6); border: 1px solid rgba(255,255,255,0.06); color: #e8edf2; padding: 6px 10px; font-family: 'Inter', sans-serif; font-size: 14px; margin-bottom: 4px; }
        .clue-block input:focus, .clue-block select:focus { border-color: #ff6b35; outline: none; }
        .clue-block .clue-actions { display: flex; justify-content: flex-end; }
    `;
    document.head.appendChild(style);
})();

// ============================================================
//  ЗАГРУЗКА СТРАНИЦЫ
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const content = document.getElementById('adminContent');
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        showAdminPanel();
    } else {
        showLogin();
    }
});

// ============================================================
//  ЛОГИН
// ============================================================
function showLogin() {
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="admin-login">
            <h2 style="color:#ff6b35; text-align:center; margin-bottom:8px;">🔐 Вход в админку</h2>
            <p style="color:#8a9bb5; text-align:center; font-size:14px; margin-bottom:16px;">Пароль: admin123</p>
            <input type="password" id="adminPassword" placeholder="Введите пароль" autofocus>
            <button class="btn btn-primary" onclick="handleLogin()">Войти</button>
            <div id="loginError" style="color:#ff6b6b; margin-top:8px; display:none;">❌ Неверный пароль</div>
        </div>
    `;
    document.getElementById('adminPassword').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') handleLogin();
    });
}

function handleLogin() {
    const input = document.getElementById('adminPassword');
    const error = document.getElementById('loginError');
    if (input.value.trim() === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        showAdminPanel();
    } else {
        error.style.display = 'block';
        input.value = '';
        input.focus();
    }
}

// ============================================================
//  ПАНЕЛЬ УПРАВЛЕНИЯ
// ============================================================
function showAdminPanel() {
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="admin-panel">
            <div class="admin-toolbar">
                <h3 style="color:#ff6b35;">⚙️ Управление</h3>
                <div>
                    <button class="terminal-btn" onclick="switchTab('quests')">📋 Квесты</button>
                    <button class="terminal-btn" onclick="switchTab('news')">📰 Новости</button>
                    <button class="terminal-btn danger" onclick="logout()">🚪 Выйти</button>
                </div>
            </div>
            <div id="adminTabContent">
                <!-- Загружается вкладка -->
            </div>
        </div>
    `;
    switchTab('quests');
}

// ============================================================
//  ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ============================================================
window.switchTab = async function(tab) {
    const container = document.getElementById('adminTabContent');
    if (tab === 'quests') {
        await renderQuestsAdmin();
    } else if (tab === 'news') {
        await renderNewsAdmin();
    }
};

// ============================================================
//  ВКЛАДКА КВЕСТОВ
// ============================================================
async function renderQuestsAdmin() {
    const container = document.getElementById('adminTabContent');
    container.innerHTML = `
        <div class="admin-toolbar">
            <h3>📋 Квесты</h3>
            <button class="terminal-btn" onclick="openQuestModal()">➕ Добавить квест</button>
        </div>
        <div id="questAdminList"></div>
    `;
    await loadQuestsList();
}

async function loadQuestsList() {
    const listContainer = document.getElementById('questAdminList');
    try {
        const quests = await getQuests();
        if (quests.length === 0) {
            listContainer.innerHTML = `<p style="color:#5a6a80;">Нет квестов. Добавьте первый!</p>`;
            return;
        }
        let html = '';
        quests.forEach(q => {
            html += `
                <div class="admin-item">
                    <div class="info">
                        <div class="title">${escapeHtml(q.title)}</div>
                        <div class="sub">${q.clues ? q.clues.length : 0} улик · Уровень: ${q.level || 'средний'} · ${q.isPaid ? `${q.price} ₽` : 'Бесплатно'}</div>
                    </div>
                    <div class="actions">
                        <button onclick="openQuestModal(${q.id})">✏️</button>
                        <button class="danger" onclick="deleteQuestItem(${q.id})">🗑️</button>
                    </div>
                </div>
            `;
        });
        listContainer.innerHTML = html;
    } catch (e) {
        listContainer.innerHTML = `<p style="color:#ff6b6b;">Ошибка загрузки квестов: ${e.message}</p>`;
    }
}

// ============================================================
//  МОДАЛКА КВЕСТА
// ============================================================
function openQuestModal(id = null) {
    editingQuestId = id;
    if (id) {
        getQuestById(id).then(quest => {
            if (quest) {
                renderQuestModal(quest, '✏️ Редактировать квест');
            } else {
                renderQuestModal(null, '➕ Новый квест');
            }
        });
    } else {
        renderQuestModal(null, '➕ Новый квест');
    }
}

function renderQuestModal(quest, title) {
    const clues = quest ? quest.clues || [] : [];
    let cluesHtml = '';
    if (clues.length === 0) {
        cluesHtml = generateClueBlock(0, null);
    } else {
        clues.forEach((c, idx) => {
            cluesHtml += generateClueBlock(idx, c);
        });
    }

    const modalHTML = `
        <div class="modal-overlay" id="questModal">
            <div class="modal">
                <h3>${title}</h3>
                <div class="field">
                    <label>Название</label>
                    <input type="text" id="qTitle" value="${quest ? escapeHtml(quest.title) : ''}" placeholder="Тайник у моста">
                </div>
                <div class="field">
                    <label>Описание</label>
                    <input type="text" id="qDesc" value="${quest ? escapeHtml(quest.description) : ''}" placeholder="Краткое описание">
                </div>
                <div class="field">
                    <label>Уровень сложности</label>
                    <select id="qLevel">
                        <option value="легкий" ${quest && quest.level === 'легкий' ? 'selected' : ''}>Легкий</option>
                        <option value="средний" ${quest && quest.level === 'средний' ? 'selected' : ''}>Средний</option>
                        <option value="сложный" ${quest && quest.level === 'сложный' ? 'selected' : ''}>Сложный</option>
                    </select>
                </div>
                <div class="field">
                    <label>Тип доступа</label>
                    <div class="toggle-group">
                        <label>
                            <input type="checkbox" id="qIsPaid" ${quest && quest.isPaid ? 'checked' : ''}>
                            Платный
                        </label>
                        <span style="color:#4a5a6e; font-size:14px;">(отключено = бесплатно)</span>
                    </div>
                </div>
                <div class="field" id="priceField" style="${quest && quest.isPaid ? 'display:block;' : 'display:none;'}">
                    <label>Цена (₽)</label>
                    <input type="number" id="qPrice" value="${quest && quest.isPaid ? quest.price : 0}" min="0" step="50">
                </div>
                <div class="field">
                    <label>Финальные координаты</label>
                    <input type="text" id="qFinalCoords" value="${quest ? escapeHtml(quest.finalCoords || '') : ''}" placeholder="59.1200, 37.9050">
                </div>
                <div class="field">
                    <label>Улики</label>
                    <div id="cluesContainer">${cluesHtml}</div>
                    <button type="button" class="terminal-btn" onclick="addClueBlock()" style="margin-top:8px;">➕ Добавить улику</button>
                </div>
                <div class="modal-actions">
                    <button class="cancel" onclick="closeQuestModal()">Отмена</button>
                    <button class="save" onclick="saveQuest()">💾 Сохранить</button>
                </div>
            </div>
        </div>
    `;

    const oldModal = document.getElementById('questModal');
    if (oldModal) oldModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const paidCheckbox = document.getElementById('qIsPaid');
    const priceField = document.getElementById('priceField');
    paidCheckbox.addEventListener('change', function() {
        priceField.style.display = this.checked ? 'block' : 'none';
    });
}

function generateClueBlock(index, clue) {
    const type = clue ? clue.type : 'photo';
    const value = clue ? escapeHtml(clue.value || '') : '';
    const caption = clue ? escapeHtml(clue.caption || '') : '';
    const code = clue ? escapeHtml(clue.code || '') : '';
    const question = clue ? escapeHtml(clue.question || '') : '';
    const answer = clue ? escapeHtml(clue.answer || '') : '';

    return `
        <div class="clue-block" data-index="${index}">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="color:#4a5a6e; font-size:12px;">Улика #${index+1}</span>
                <button type="button" class="terminal-btn danger" style="padding:2px 10px; font-size:12px;" onclick="removeClueBlock(this)">✕</button>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                <div>
                    <label style="color:#8aa3c0; font-size:12px;">Тип</label>
                    <select class="clue-type" style="width:100%; background:#0a0a0a; border:1px solid #2a2a2a; color:#00ff41; padding:4px 8px; border-radius:4px;">
                        <option value="photo" ${type==='photo'?'selected':''}>Фото</option>
                        <option value="text" ${type==='text'?'selected':''}>Текст</option>
                        <option value="coords" ${type==='coords'?'selected':''}>Координаты</option>
                        <option value="video" ${type==='video'?'selected':''}>Видео</option>
                        <option value="audio" ${type==='audio'?'selected':''}>Аудио</option>
                    </select>
                </div>
                <div>
                    <label style="color:#8aa3c0; font-size:12px;">Код (QR)</label>
                    <input type="text" class="clue-code" value="${code}" placeholder="MOST-01" style="width:100%; background:#0a0a0a; border:1px solid #2a2a2a; color:#00ff41; padding:4px 8px; border-radius:4px;">
                </div>
            </div>
            <div style="margin-top:4px;">
                <label style="color:#8aa3c0; font-size:12px;">Значение</label>
                <input type="text" class="clue-value" value="${value}" placeholder="assets/photo.jpg" style="width:100%; background:#0a0a0a; border:1px solid #2a2a2a; color:#00ff41; padding:4px 8px; border-radius:4px;">
            </div>
            <div style="margin-top:4px;">
                <label style="color:#8aa3c0; font-size:12px;">Подпись</label>
                <input type="text" class="clue-caption" value="${caption}" placeholder="Найди место со снимка" style="width:100%; background:#0a0a0a; border:1px solid #2a2a2a; color:#00ff41; padding:4px 8px; border-radius:4px;">
            </div>
            <div style="margin-top:4px; display:flex; gap:8px;">
                <div style="flex:1;">
                    <label style="color:#8aa3c0; font-size:12px;">Вопрос</label>
                    <input type="text" class="clue-question" value="${question}" placeholder="Какой год на табличке?" style="width:100%; background:#0a0a0a; border:1px solid #2a2a2a; color:#00ff41; padding:4px 8px; border-radius:4px;">
                </div>
                <div style="flex:0 0 120px;">
                    <label style="color:#8aa3c0; font-size:12px;">Ответ</label>
                    <input type="text" class="clue-answer" value="${answer}" placeholder="1905" style="width:100%; background:#0a0a0a; border:1px solid #2a2a2a; color:#00ff41; padding:4px 8px; border-radius:4px;">
                </div>
            </div>
        </div>
    `;
}

function addClueBlock() {
    const container = document.getElementById('cluesContainer');
    const index = container.children.length;
    container.insertAdjacentHTML('beforeend', generateClueBlock(index, null));
}

function removeClueBlock(btn) {
    const block = btn.closest('.clue-block');
    if (block) {
        const container = document.getElementById('cluesContainer');
        if (container.children.length <= 1) {
            alert('Должна быть хотя бы одна улика');
            return;
        }
        block.remove();
        container.querySelectorAll('.clue-block').forEach((el, i) => {
            const label = el.querySelector('span');
            if (label) label.textContent = `Улика #${i+1}`;
        });
    }
}

async function saveQuest() {
    const title = document.getElementById('qTitle').value.trim();
    const desc = document.getElementById('qDesc').value.trim();
    const level = document.getElementById('qLevel').value;
    const isPaid = document.getElementById('qIsPaid').checked;
    const price = parseInt(document.getElementById('qPrice').value) || 0;
    const finalCoords = document.getElementById('qFinalCoords').value.trim();

    if (!title) { alert('Введите название'); return; }

    const clueBlocks = document.querySelectorAll('.clue-block');
    const clues = [];
    let valid = true;
    clueBlocks.forEach(block => {
        const type = block.querySelector('.clue-type').value;
        const value = block.querySelector('.clue-value').value.trim();
        const caption = block.querySelector('.clue-caption').value.trim();
        const code = block.querySelector('.clue-code').value.trim() || `CODE-${String(Math.floor(Math.random()*10000)).padStart(4,'0')}`;
        const question = block.querySelector('.clue-question').value.trim();
        const answer = block.querySelector('.clue-answer').value.trim();
        if (!value) { valid = false; return; }
        clues.push({ type, value, caption, code, question, answer });
    });
    if (!valid) { alert('Заполните все улики'); return; }
    if (clues.length === 0) { alert('Добавьте улики'); return; }

    const questData = { title, description: desc, level, isPaid, price, finalCoords, clues };

    try {
        if (editingQuestId) {
            await updateQuest(editingQuestId, questData);
        } else {
            await addQuest(questData);
        }
        closeQuestModal();
        await loadQuestsList();
        alert('✅ Квест сохранён!');
    } catch (e) {
        alert('❌ Ошибка: ' + e.message);
    }
}

function closeQuestModal() {
    const modal = document.getElementById('questModal');
    if (modal) modal.remove();
}

async function deleteQuestItem(id) {
    if (!confirm('Удалить квест?')) return;
    try {
        await deleteQuest(id);
        await loadQuestsList();
        alert('✅ Квест удалён');
    } catch (e) {
        alert('❌ Ошибка: ' + e.message);
    }
}

// ============================================================
//  ВКЛАДКА НОВОСТЕЙ
// ============================================================
async function renderNewsAdmin() {
    const container = document.getElementById('adminTabContent');
    container.innerHTML = `
        <div class="admin-toolbar">
            <h3>📰 Новости</h3>
            <button class="terminal-btn" onclick="openNewsModal()">➕ Добавить новость</button>
        </div>
        <div id="newsAdminList"></div>
    `;
    await loadNewsList();
}

async function loadNewsList() {
    const listContainer = document.getElementById('newsAdminList');
    try {
        const news = await getNews();
        if (news.length === 0) {
            listContainer.innerHTML = `<p style="color:#5a6a80;">Нет новостей. Добавьте первую!</p>`;
            return;
        }
        let html = '';
        news.forEach(item => {
            html += `
                <div class="admin-item">
                    <div class="info">
                        <div class="title">${escapeHtml(item.title)}</div>
                        <div class="sub">${new Date(item.date).toLocaleDateString('ru-RU')} · ${escapeHtml((item.preview || item.content || '').substring(0, 80))}...</div>
                    </div>
                    <div class="actions">
                        <button onclick="openNewsModal(${item.id})">✏️</button>
                        <button class="danger" onclick="deleteNewsItem(${item.id})">🗑️</button>
                    </div>
                </div>
            `;
        });
        listContainer.innerHTML = html;
    } catch (e) {
        listContainer.innerHTML = `<p style="color:#ff6b6b;">Ошибка загрузки новостей: ${e.message}</p>`;
    }
}

function openNewsModal(id = null) {
    editingNewsId = id;
    if (id) {
        getNews().then(news => {
            const item = news.find(n => n.id === id);
            renderNewsModal(item, '✏️ Редактировать новость');
        });
    } else {
        renderNewsModal(null, '➕ Новая новость');
    }
}

function renderNewsModal(item, title) {
    const modalHTML = `
        <div class="modal-overlay" id="newsModal">
            <div class="modal">
                <h3>${title}</h3>
                <div class="field">
                    <label>Заголовок</label>
                    <input type="text" id="newsTitle" value="${item ? escapeHtml(item.title) : ''}" placeholder="Заголовок новости">
                </div>
                <div class="field">
                    <label>Краткий текст (превью)</label>
                    <textarea id="newsPreview" rows="2">${item ? escapeHtml(item.preview || '') : ''}</textarea>
                </div>
                <div class="field">
                    <label>Полный текст</label>
                    <textarea id="newsContent" rows="5">${item ? escapeHtml(item.content || '') : ''}</textarea>
                </div>
                <div class="field">
                    <label>Ссылка на изображение</label>
                    <input type="text" id="newsImage" value="${item ? escapeHtml(item.image || '') : ''}" placeholder="https://example.com/image.jpg">
                </div>
                <div class="modal-actions">
                    <button class="cancel" onclick="closeNewsModal()">Отмена</button>
                    <button class="save" onclick="saveNewsItem()">💾 Сохранить</button>
                </div>
            </div>
        </div>
    `;
    const oldModal = document.getElementById('newsModal');
    if (oldModal) oldModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeNewsModal() {
    const modal = document.getElementById('newsModal');
    if (modal) modal.remove();
}

async function saveNewsItem() {
    const title = document.getElementById('newsTitle').value.trim();
    const preview = document.getElementById('newsPreview').value.trim();
    const content = document.getElementById('newsContent').value.trim();
    const image = document.getElementById('newsImage').value.trim();
    if (!title) { alert('Введите заголовок'); return; }
    if (!content) { alert('Введите текст'); return; }
    const data = { title, content, preview, image };
    try {
        if (editingNewsId) {
            await updateNews(editingNewsId, data);
        } else {
            await addNews(data);
        }
        closeNewsModal();
        await loadNewsList();
        alert('✅ Новость сохранена!');
    } catch (e) {
        alert('❌ Ошибка: ' + e.message);
    }
}

async function deleteNewsItem(id) {
    if (!confirm('Удалить новость?')) return;
    try {
        await deleteNews(id);
        await loadNewsList();
        alert('✅ Новость удалена');
    } catch (e) {
        alert('❌ Ошибка: ' + e.message);
    }
}

// ============================================================
//  ВЫХОД
// ============================================================
function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    location.reload();
}

// ============================================================
//  ВСПОМОГАТЕЛЬНЫЕ
// ============================================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
        }
// ============================================================
//  ДЕЛАЕМ ФУНКЦИИ ГЛОБАЛЬНЫМИ ДЛЯ onclick
// ============================================================
window.handleLogin = handleLogin;
window.switchTab = switchTab;
window.openQuestModal = openQuestModal;
window.saveQuest = saveQuest;
window.closeQuestModal = closeQuestModal;
window.deleteQuestItem = deleteQuestItem;
window.openNewsModal = openNewsModal;
window.saveNewsItem = saveNewsItem;
window.closeNewsModal = closeNewsModal;
window.deleteNewsItem = deleteNewsItem;
window.addClueBlock = addClueBlock;
window.removeClueBlock = removeClueBlock;
window.logout = logout;
}
