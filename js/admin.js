// ============================================================
//  admin.js — Удобная админка с отдельными полями для улик
// ============================================================

const ADMIN_PASSWORD = '1771';
let editingBoxId = null;

// ============================================================
//  ВСТРАИВАЕМ СТИЛИ ПРЯМО В JS (гарантированно)
// ============================================================
(function injectStyles() {
    if (document.getElementById('admin-styles')) return;
    const style = document.createElement('style');
    style.id = 'admin-styles';
    style.textContent = `
        /* Глобальные стили для админки */
        .line {
            margin-bottom: 10px;
            line-height: 1.6;
            font-size: 16px;
            color: #e8edf2;
        }
        .line.dim {
            color: #5a6a80;
        }
        .line .error {
            color: #ff6b6b;
        }
        .line .success {
            color: #6fcf97;
        }
        .terminal-btn {
            display: inline-block;
            padding: 10px 28px;
            font-weight: 600;
            font-size: 16px;
            background: #ff6b35;
            color: #080c1a;
            border: none;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            text-decoration: none;
            transition: 0.2s;
        }
        .terminal-btn:hover {
            background: #ff8a5c;
        }
        .terminal-btn.danger {
            background: transparent;
            color: #ff6b6b;
            border: 1px solid #ff6b6b;
        }
        .terminal-btn.danger:hover {
            background: #ff6b6b;
            color: #080c1a;
        }
        .terminal-link {
            color: #ff6b35;
            text-decoration: none;
            border-bottom: 1px dashed rgba(255, 107, 53, 0.2);
            transition: 0.2s;
        }
        .terminal-link:hover {
            border-bottom-color: #ff6b35;
        }

        /* Стили для админ-панели */
        .admin-login {
            max-width: 400px;
            margin: 20px auto;
        }
        .admin-login input {
            width: 100%;
            background: rgba(8, 12, 26, 0.6);
            border: 1px solid rgba(255,255,255,0.06);
            color: #e8edf2;
            padding: 12px 16px;
            font-size: 16px;
            font-family: 'Inter', sans-serif;
            margin-top: 8px;
            transition: 0.2s;
        }
        .admin-login input:focus {
            border-color: #ff6b35;
            outline: none;
        }
        .admin-login button {
            margin-top: 12px;
        }

        .admin-panel .admin-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 20px;
        }
        .admin-panel .admin-stats {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        .admin-panel .admin-stats .stat {
            background: rgba(16, 24, 44, 0.4);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.05);
            padding: 12px 24px;
            text-align: center;
            flex: 1;
            min-width: 100px;
        }
        .admin-panel .admin-stats .stat .num {
            font-size: 28px;
            font-weight: 800;
            color: #ff6b35;
            display: block;
        }
        .admin-panel .admin-stats .stat .label {
            font-size: 12px;
            color: #5a6a80;
        }
        .admin-panel .box-admin-item {
            background: rgba(16, 24, 44, 0.4);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.05);
            padding: 16px 20px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
            transition: 0.3s;
        }
        .admin-panel .box-admin-item:hover {
            border-color: rgba(255, 107, 53, 0.15);
        }
        .admin-panel .box-admin-item .info .title {
            font-size: 16px;
            font-weight: 700;
            color: #e8edf2;
        }
        .admin-panel .box-admin-item .info .sub {
            color: #8a9bb5;
            font-size: 13px;
        }
        .admin-panel .box-admin-item .actions button {
            background: transparent;
            border: 1px solid rgba(255,255,255,0.06);
            color: #8a9bb5;
            padding: 4px 14px;
            border-radius: 0;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            font-size: 13px;
            transition: 0.2s;
        }
        .admin-panel .box-admin-item .actions button:hover {
            border-color: #ff6b35;
            color: #e8edf2;
        }
        .admin-panel .box-admin-item .actions button.danger {
            color: #ff6b6b;
            border-color: rgba(255, 107, 107, 0.2);
        }
        .admin-panel .box-admin-item .actions button.danger:hover {
            border-color: #ff6b6b;
        }

        /* Модалка */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.85);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        }
        .modal {
            background: rgba(16, 24, 44, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.06);
            padding: 32px 28px;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
        }
        .modal h3 {
            margin-bottom: 16px;
            font-size: 22px;
            font-weight: 700;
            color: #ff6b35;
            font-family: 'Oswald', sans-serif;
            text-transform: uppercase;
        }
        .modal .field {
            margin-bottom: 14px;
        }
        .modal .field label {
            display: block;
            color: #8a9bb5;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 4px;
        }
        .modal .field input,
        .modal .field textarea,
        .modal .field select {
            width: 100%;
            background: rgba(8, 12, 26, 0.6);
            border: 1px solid rgba(255,255,255,0.06);
            color: #e8edf2;
            padding: 10px 14px;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            transition: 0.2s;
        }
        .modal .field input:focus,
        .modal .field textarea:focus,
        .modal .field select:focus {
            border-color: #ff6b35;
            outline: none;
        }
        .modal .field textarea {
            min-height: 60px;
            resize: vertical;
        }
        .modal .field .toggle-group {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        .modal .field .toggle-group label {
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            color: #8a9bb5;
        }
        .modal .field .toggle-group input[type="checkbox"] {
            width: auto;
            accent-color: #ff6b35;
        }
        .modal .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 20px;
        }
        .modal .modal-actions button {
            padding: 8px 24px;
            border: 1px solid rgba(255,255,255,0.06);
            background: transparent;
            color: #8a9bb5;
            font-family: 'Inter', sans-serif;
            cursor: pointer;
            transition: 0.2s;
        }
        .modal .modal-actions button:hover {
            border-color: #ff6b35;
            color: #e8edf2;
        }
        .modal .modal-actions button.cancel {
            color: #5a6a80;
        }
        .modal .modal-actions button.save {
            background: #ff6b35;
            color: #080c1a;
            border-color: #ff6b35;
            font-weight: 700;
        }
        .modal .modal-actions button.save:hover {
            background: #ff8a5c;
        }

        /* Блок улик в админке */
        .modal .clue-block {
            border: 1px solid rgba(255,255,255,0.06);
            padding: 12px;
            margin-top: 8px;
            background: rgba(8, 12, 26, 0.4);
        }
        .modal .clue-block label {
            display: block;
            color: #5a6a80;
            font-size: 12px;
            margin-bottom: 2px;
        }
        .modal .clue-block input,
        .modal .clue-block select {
            width: 100%;
            background: rgba(8, 12, 26, 0.6);
            border: 1px solid rgba(255,255,255,0.06);
            color: #e8edf2;
            padding: 6px 10px;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            margin-bottom: 4px;
        }
        .modal .clue-block input:focus,
        .modal .clue-block select:focus {
            border-color: #ff6b35;
            outline: none;
        }
        .modal .clue-block .clue-actions {
            display: flex;
            justify-content: flex-end;
        }
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
            <div class="line">> Вход в админ-панель</div>
            <div class="line dim">> Введите пароль:</div>
            <input type="password" id="adminPassword" placeholder="Пароль" autofocus>
            <button class="terminal-btn" onclick="window.handleLogin()">Войти</button>
            <div id="loginError" style="color: #ff6b6b; margin-top: 8px; display: none;">❌ Неверный пароль</div>
        </div>
    `;
    document.getElementById('adminPassword').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') window.handleLogin();
    });
}

window.handleLogin = function() {
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
};

// ============================================================
//  ПАНЕЛЬ УПРАВЛЕНИЯ
// ============================================================
function showAdminPanel() {
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="admin-panel">
            <div class="admin-toolbar">
                <div class="line">> Управление боксами</div>
                <div>
                    <button class="terminal-btn" onclick="window.openBoxModal()">➕ Добавить бокс</button>
                    <button class="terminal-btn danger" onclick="window.logout()">🚪 Выйти</button>
                </div>
            </div>
            <div class="admin-stats" id="adminStats"></div>
            <div id="boxAdminList"></div>
        </div>
    `;
    renderAdminList();
}

function renderAdminList() {
    const boxes = getBoxes();
    const listContainer = document.getElementById('boxAdminList');
    const statsContainer = document.getElementById('adminStats');

    const total = boxes.length;
    const free = boxes.filter(b => !b.isPaid).length;
    const paid = boxes.filter(b => b.isPaid).length;
    statsContainer.innerHTML = `
        <div class="stat"><span class="num">${total}</span><span class="label">Всего</span></div>
        <div class="stat"><span class="num">${free}</span><span class="label">Бесплатных</span></div>
        <div class="stat"><span class="num">${paid}</span><span class="label">Платных</span></div>
    `;

    if (boxes.length === 0) {
        listContainer.innerHTML = `<div class="line dim">> Нет боксов. Добавьте первый!</div>`;
        return;
    }

    let html = '';
    boxes.forEach(box => {
        const levelClass = box.level === 'легкий' ? 'easy' : box.level === 'средний' ? 'medium' : 'hard';
        const priceText = box.isPaid ? `${box.price} ₽` : 'Бесплатно';
        html += `
            <div class="box-admin-item">
                <div class="info">
                    <div class="title">${box.title}</div>
                    <div class="sub">${box.description} · Уровень: <span class="level ${levelClass}">${box.level}</span> · ${priceText}</div>
                </div>
                <div class="actions">
                    <button onclick="window.openBoxModal(${box.id})">✏️</button>
                    <button class="danger" onclick="window.deleteBox(${box.id})">🗑️</button>
                </div>
            </div>
        `;
    });
    listContainer.innerHTML = html;
}

// ============================================================
//  ГЕНЕРАЦИЯ БЛОКА УЛИКИ
// ============================================================
function generateClueBlock(index, clue = null) {
    const type = clue ? clue.type : 'photo';
    const value = clue ? clue.value || '' : '';
    const caption = clue ? clue.caption || '' : '';
    const code = clue ? clue.code || '' : '';
    const question = clue ? clue.question || '' : '';
    const answer = clue ? clue.answer || '' : '';

    return `
        <div class="clue-block" data-index="${index}" style="border:1px solid #2a2a2a; padding:12px; margin-top:8px; border-radius:4px; background:#0f0f0f;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="color:#4a5a6e; font-size:12px;">Улика #${index+1}</span>
                <button type="button" class="terminal-btn danger" style="padding:2px 10px; font-size:12px;" onclick="window.removeClueBlock(this)">✕</button>
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
                <label style="color:#8aa3c0; font-size:12px;">Значение (путь к фото, видео, аудио, текст или координаты)</label>
                <input type="text" class="clue-value" value="${value}" placeholder="assets/photo.jpg или текст подсказки" style="width:100%; background:#0a0a0a; border:1px solid #2a2a2a; color:#00ff41; padding:4px 8px; border-radius:4px;">
            </div>
            <div style="margin-top:4px;">
                <label style="color:#8aa3c0; font-size:12px;">Подпись (отображается под уликой)</label>
                <input type="text" class="clue-caption" value="${caption}" placeholder="Найди место со снимка" style="width:100%; background:#0a0a0a; border:1px solid #2a2a2a; color:#00ff41; padding:4px 8px; border-radius:4px;">
            </div>
            <div style="margin-top:4px; display:flex; gap:8px;">
                <div style="flex:1;">
                    <label style="color:#8aa3c0; font-size:12px;">Вопрос (опционально)</label>
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

// ============================================================
//  ОТКРЫТЬ МОДАЛКУ БОКСА
// ============================================================
window.openBoxModal = function(boxId = null) {
    editingBoxId = boxId;
    let box = null;
    if (boxId) {
        box = getBoxById(boxId);
        if (!box) {
            alert('Бокс не найден');
            return;
        }
    }

    const title = box ? '✏️ Редактировать бокс' : '➕ Новый бокс';

    let cluesHtml = '';
    if (box && box.clues && box.clues.length > 0) {
        box.clues.forEach((clue, index) => {
            cluesHtml += generateClueBlock(index, clue);
        });
    } else {
        cluesHtml += generateClueBlock(0, null);
    }

    const modalHTML = `
        <div class="modal-overlay" id="boxModal">
            <div class="modal">
                <h3>${title}</h3>
                <div class="field">
                    <label>Название бокса</label>
                    <input type="text" id="bTitle" value="${box ? box.title : ''}" placeholder="Тайник у моста">
                </div>
                <div class="field">
                    <label>Описание</label>
                    <input type="text" id="bDesc" value="${box ? box.description : ''}" placeholder="Краткое описание">
                </div>
                <div class="field">
                    <label>Уровень сложности</label>
                    <select id="bLevel">
                        <option value="легкий" ${box && box.level === 'легкий' ? 'selected' : ''}>Легкий</option>
                        <option value="средний" ${box && box.level === 'средний' ? 'selected' : ''}>Средний</option>
                        <option value="сложный" ${box && box.level === 'сложный' ? 'selected' : ''}>Сложный</option>
                    </select>
                </div>
                <div class="field">
                    <label>Тип доступа</label>
                    <div class="toggle-group">
                        <label>
                            <input type="checkbox" id="bIsPaid" ${box && box.isPaid ? 'checked' : ''}>
                            Платный
                        </label>
                        <span style="color: #4a5a6e; font-size: 14px;">(отключено = бесплатно)</span>
                    </div>
                </div>
                <div class="field" id="priceField" style="${box && box.isPaid ? 'display:block;' : 'display:none;'}">
                    <label>Цена (₽)</label>
                    <input type="number" id="bPrice" value="${box && box.isPaid ? box.price : 0}" min="0" step="50">
                </div>

                <div class="field">
                    <label>Улики</label>
                    <div id="cluesContainer">
                        ${cluesHtml}
                    </div>
                    <button type="button" class="terminal-btn" onclick="window.addClueBlock()" style="margin-top: 8px;">➕ Добавить улику</button>
                </div>

                <div class="field">
                    <label>Финальные координаты</label>
                    <input type="text" id="bFinalCoords" value="${box ? box.finalCoords || '' : ''}" placeholder="59.1200, 37.9050">
                </div>
                <div class="modal-actions">
                    <button class="cancel" onclick="window.closeModal()">Отмена</button>
                    <button class="save" onclick="window.saveBox()">💾 Сохранить</button>
                </div>
            </div>
        </div>
    `;

    const oldModal = document.getElementById('boxModal');
    if (oldModal) oldModal.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const paidCheckbox = document.getElementById('bIsPaid');
    const priceField = document.getElementById('priceField');
    paidCheckbox.addEventListener('change', function() {
        priceField.style.display = this.checked ? 'block' : 'none';
    });
};

// ============================================================
//  ДОБАВЛЕНИЕ / УДАЛЕНИЕ УЛИК
// ============================================================
window.addClueBlock = function() {
    const container = document.getElementById('cluesContainer');
    const index = container.children.length;
    const newBlock = generateClueBlock(index, null);
    container.insertAdjacentHTML('beforeend', newBlock);
};

window.removeClueBlock = function(btn) {
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
};

// ============================================================
//  СОХРАНЕНИЕ БОКСА
// ============================================================
window.saveBox = function() {
    const title = document.getElementById('bTitle').value.trim();
    const desc = document.getElementById('bDesc').value.trim();
    const level = document.getElementById('bLevel').value;
    const isPaid = document.getElementById('bIsPaid').checked;
    const price = parseInt(document.getElementById('bPrice').value) || 0;
    const finalCoords = document.getElementById('bFinalCoords').value.trim();

    if (!title) {
        alert('Введите название бокса');
        return;
    }

    const clueBlocks = document.querySelectorAll('.clue-block');
    const clues = [];
    let valid = true;
    clueBlocks.forEach(block => {
        const type = block.querySelector('.clue-type').value;
        const value = block.querySelector('.clue-value').value.trim();
        const caption = block.querySelector('.clue-caption').value.trim();
        const code = block.querySelector('.clue-code').value.trim() || `CODE-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
        const question = block.querySelector('.clue-question').value.trim();
        const answer = block.querySelector('.clue-answer').value.trim();

        if (!value) {
            alert('Заполните значение для всех улик');
            valid = false;
            return;
        }
        clues.push({ type, value, caption, code, question, answer });
    });

    if (!valid) return;
    if (clues.length === 0) {
        alert('Добавьте хотя бы одну улику');
        return;
    }

    const boxData = {
        title,
        description: desc,
        level,
        isPaid,
        price: isPaid ? price : 0,
        clues,
        finalCoords: finalCoords || ''
    };

    let boxes = getBoxes();

    if (editingBoxId) {
        const index = boxes.findIndex(b => b.id === editingBoxId);
        if (index !== -1) {
            boxes[index] = { ...boxes[index], ...boxData };
        } else {
            alert('Ошибка: бокс не найден');
            return;
        }
    } else {
        boxData.id = generateBoxId();
        boxes.push(boxData);
    }

    saveBoxes(boxes);
    window.closeModal();
    renderAdminList();
    alert('✅ Бокс сохранён!');
};

// ============================================================
//  УДАЛЕНИЕ БОКСА И ВЫХОД
// ============================================================
window.closeModal = function() {
    const modal = document.getElementById('boxModal');
    if (modal) modal.remove();
};

window.deleteBox = function(id) {
    if (!confirm('Удалить бокс?')) return;
    let boxes = getBoxes();
    boxes = boxes.filter(b => b.id !== id);
    saveBoxes(boxes);
    renderAdminList();
    alert('🗑️ Бокс удалён');
};

window.logout = function() {
    sessionStorage.removeItem('adminLoggedIn');
    location.reload();
};