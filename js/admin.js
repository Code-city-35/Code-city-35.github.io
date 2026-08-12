// ============================================================
//  admin.js — админка (только localStorage, без Supabase)
// ============================================================

const ADMIN_PASSWORD = 'admin123';
const STORAGE_KEY = 'questsData';

let editingQuestId = null;

// ============================================================
//  ЛОГИН / ВЫХОД
// ============================================================
function showLogin() {
    const container = document.getElementById('adminContent');
    container.innerHTML = `
        <div class="admin-login">
            <h2 style="color:#ff6b35;">🔐 Вход в админку</h2>
            <p style="color:#8a9bb5; font-size:14px;">Пароль: admin123</p>
            <input type="password" id="adminPassword" placeholder="Введите пароль" autofocus>
            <button id="loginBtn">Войти</button>
            <div id="loginError" style="color:#ff6b6b; margin-top:8px; display:none;">❌ Неверный пароль</div>
        </div>
    `;
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('adminPassword').addEventListener('keydown', (e) => {
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

function logout() {
    sessionStorage.removeItem('adminLoggedIn');
    location.reload();
}

// ============================================================
//  РАБОТА С ДАННЫМИ (localStorage)
// ============================================================
function getLocalQuests() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try { return JSON.parse(stored); } catch { return getDefaultQuests(); }
    }
    return getDefaultQuests();
}

function saveLocalQuests(quests) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quests));
}

function getDefaultQuests() {
    return [
        {
            id: 1,
            title: 'Призрак инженера',
            description: 'Городская легенда о пропавшем инженере.',
            level: 'средний',
            isPaid: false,
            price: 0,
            finalCoords: '59.1220, 37.9080',
            clues: [
                { type: 'photo', value: 'assets/bridge_old.jpg', caption: 'Найди место со снимка', code: 'BELOV-01', question: 'Какой год?', answer: '1905' }
            ]
        }
    ];
}

function generateId() {
    const quests = getLocalQuests();
    return quests.length > 0 ? Math.max(...quests.map(q => q.id)) + 1 : 1;
}

// ============================================================
//  ПАНЕЛЬ УПРАВЛЕНИЯ
// ============================================================
function showAdminPanel() {
    const container = document.getElementById('adminContent');
    container.innerHTML = `
        <div class="admin-panel">
            <div class="admin-toolbar">
                <h3 style="color:#ff6b35;">⚙️ Управление квестами</h3>
                <div>
                    <button id="addQuestBtn">➕ Добавить квест</button>
                    <button id="logoutBtn" class="danger">🚪 Выйти</button>
                </div>
            </div>
            <div id="questList"></div>
        </div>
    `;

    document.getElementById('addQuestBtn').addEventListener('click', () => openQuestModal());
    document.getElementById('logoutBtn').addEventListener('click', logout);

    renderQuestList();
}

function renderQuestList() {
    const list = document.getElementById('questList');
    const quests = getLocalQuests();
    if (quests.length === 0) {
        list.innerHTML = `<p style="color:#5a6a80;">Нет квестов. Добавьте первый!</p>`;
        return;
    }
    let html = '';
    quests.forEach(q => {
        const clueCount = q.clues ? q.clues.length : 0;
        const priceText = q.isPaid ? `${q.price} ₽` : 'Бесплатно';
        html += `
            <div class="admin-item">
                <div class="info">
                    <div class="title">${escapeHtml(q.title)}</div>
                    <div class="sub">${clueCount} улик · Уровень: ${q.level || 'средний'} · ${priceText}</div>
                </div>
                <div class="actions">
                    <button class="edit-btn" data-id="${q.id}">✏️</button>
                    <button class="delete-btn danger" data-id="${q.id}">🗑️</button>
                </div>
            </div>
        `;
    });
    list.innerHTML = html;

    list.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openQuestModal(parseInt(btn.dataset.id)));
    });
    list.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteQuestItem(parseInt(btn.dataset.id)));
    });
}

// ============================================================
//  МОДАЛКА КВЕСТА
// ============================================================
function openQuestModal(id = null) {
    editingQuestId = id;
    let quest = null;
    let title = '➕ Новый квест';
    if (id) {
        quest = getLocalQuests().find(q => q.id === id);
        if (quest) title = '✏️ Редактировать квест';
    }

    const clues = quest ? quest.clues || [] : [];
    let cluesHtml = '';
    if (clues.length === 0) {
        cluesHtml = generateClueBlock(0, null);
    } else {
        clues.forEach((c, idx) => {
            cluesHtml += generateClueBlock(idx, c);
        });
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'questModal';
    modal.innerHTML = `
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
                <label>Уровень</label>
                <select id="qLevel">
                    <option value="легкий" ${quest && quest.level === 'легкий' ? 'selected' : ''}>Легкий</option>
                    <option value="средний" ${quest && quest.level === 'средний' ? 'selected' : ''}>Средний</option>
                    <option value="сложный" ${quest && quest.level === 'сложный' ? 'selected' : ''}>Сложный</option>
                </select>
            </div>
            <div class="field">
                <label><input type="checkbox" id="qIsPaid" ${quest && quest.isPaid ? 'checked' : ''}> Платный</label>
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
                <button type="button" id="addClueBtn" style="margin-top:8px;">➕ Добавить улику</button>
            </div>
            <div class="modal-actions">
                <button class="cancel" id="closeQuestModalBtn">Отмена</button>
                <button class="save" id="saveQuestBtn">💾 Сохранить</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('closeQuestModalBtn').addEventListener('click', () => modal.remove());
    document.getElementById('saveQuestBtn').addEventListener('click', saveQuest);

    const paidCheckbox = document.getElementById('qIsPaid');
    const priceField = document.getElementById('priceField');
    paidCheckbox.addEventListener('change', function() {
        priceField.style.display = this.checked ? 'block' : 'none';
    });

    document.getElementById('addClueBtn').addEventListener('click', () => {
        const container = document.getElementById('cluesContainer');
        const index = container.children.length;
        container.insertAdjacentHTML('beforeend', generateClueBlock(index, null));
    });

    document.querySelectorAll('.clue-block .remove-clue').forEach(btn => {
        btn.addEventListener('click', function() {
            const block = this.closest('.clue-block');
            const container = document.getElementById('cluesContainer');
            if (container.children.length <= 1) {
                alert('Должна быть хотя бы одна улика');
                return;
            }
            block.remove();
            container.querySelectorAll('.clue-block').forEach((el, i) => {
                const label = el.querySelector('.clue-index');
                if (label) label.textContent = `Улика #${i+1}`;
            });
        });
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
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span class="clue-index" style="color:#4a5a6e; font-size:12px;">Улика #${index+1}</span>
                <button type="button" class="remove-clue" style="background:transparent; border:1px solid #ff6b6b; color:#ff6b6b; padding:0 8px; cursor:pointer;">✕</button>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                <div>
                    <label>Тип</label>
                    <select class="clue-type">
                        <option value="photo" ${type==='photo'?'selected':''}>Фото</option>
                        <option value="text" ${type==='text'?'selected':''}>Текст</option>
                        <option value="coords" ${type==='coords'?'selected':''}>Координаты</option>
                        <option value="video" ${type==='video'?'selected':''}>Видео</option>
                        <option value="audio" ${type==='audio'?'selected':''}>Аудио</option>
                    </select>
                </div>
                <div>
                    <label>Код (QR)</label>
                    <input type="text" class="clue-code" value="${code}" placeholder="MOST-01">
                </div>
            </div>
            <div style="margin-top:4px;">
                <label>Значение</label>
                <input type="text" class="clue-value" value="${value}" placeholder="assets/photo.jpg">
            </div>
            <div style="margin-top:4px;">
                <label>Подпись</label>
                <input type="text" class="clue-caption" value="${caption}" placeholder="Найди место со снимка">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:4px;">
                <div>
                    <label>Вопрос</label>
                    <input type="text" class="clue-question" value="${question}" placeholder="Какой год?">
                </div>
                <div>
                    <label>Ответ</label>
                    <input type="text" class="clue-answer" value="${answer}" placeholder="1905">
                </div>
            </div>
        </div>
    `;
}

function saveQuest() {
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
    let quests = getLocalQuests();

    if (editingQuestId) {
        const index = quests.findIndex(q => q.id === editingQuestId);
        if (index !== -1) {
            quests[index] = { ...quests[index], ...questData };
        } else {
            alert('Ошибка: квест не найден');
            return;
        }
    } else {
        const newId = generateId();
        quests.push({ ...questData, id: newId });
    }
    saveLocalQuests(quests);
    document.getElementById('questModal').remove();
    renderQuestList();
    alert('✅ Квест сохранён!');
}

function deleteQuestItem(id) {
    if (!confirm('Удалить квест?')) return;
    let quests = getLocalQuests();
    quests = quests.filter(q => q.id !== id);
    saveLocalQuests(quests);
    renderQuestList();
    alert('✅ Квест удалён');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
//  ИНИЦИАЛИЗАЦИЯ
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        showAdminPanel();
    } else {
        showLogin();
    }
});
