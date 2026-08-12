import { getQuests, addQuest, updateQuest, deleteQuest, getQuestById } from './quests-data.js';
import { getNews, addNews, updateNews, deleteNews } from './news-data.js';

const ADMIN_PASSWORD = 'J0X!5tceWU';
let editingQuestId = null;
let editingNewsId = null;

function showLogin() {
    document.getElementById('adminContent').innerHTML = `
        <div class="admin-login">
            <h2 style="color:#ff6b35;">🔐 Вход</h2>
            <p style="color:#8a9bb5;">Пароль: admin123</p>
            <input type="password" id="adminPass" placeholder="Пароль" autofocus>
            <button id="loginBtn">Войти</button>
            <div id="loginError" style="color:#ff6b6b; display:none;">❌ Неверный пароль</div>
        </div>
    `;
    document.getElementById('loginBtn').onclick = () => {
        if (document.getElementById('adminPass').value === ADMIN_PASSWORD) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            showAdminPanel();
        } else {
            document.getElementById('loginError').style.display = 'block';
        }
    };
}

function showAdminPanel() {
    document.getElementById('adminContent').innerHTML = `
        <div class="admin-panel">
            <div class="admin-toolbar">
                <h3 style="color:#ff6b35;">⚙️ Управление</h3>
                <div>
                    <button id="tabQuests">📋 Квесты</button>
                    <button id="tabNews">📰 Новости</button>
                    <button id="logoutBtn" class="danger">🚪 Выйти</button>
                </div>
            </div>
            <div id="adminTabContent"></div>
        </div>
    `;
    document.getElementById('tabQuests').onclick = () => renderQuests();
    document.getElementById('tabNews').onclick = () => renderNews();
    document.getElementById('logoutBtn').onclick = () => {
        sessionStorage.removeItem('adminLoggedIn');
        location.reload();
    };
    renderQuests();
}

// ============================================================
//  КВЕСТЫ
// ============================================================
async function renderQuests() {
    const container = document.getElementById('adminTabContent');
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:16px;">
            <h3 style="color:#fff;">📋 Квесты</h3>
            <button id="addQuestBtn">➕ Добавить</button>
        </div>
        <div id="questList"></div>
    `;
    document.getElementById('addQuestBtn').onclick = () => openQuestModal();
    await loadQuests();
}

async function loadQuests() {
    const list = document.getElementById('questList');
    try {
        const quests = await getQuests();
        if (!quests || quests.length === 0) {
            list.innerHTML = '<p style="color:#5a6a80;">Нет квестов</p>';
            return;
        }
        let html = '';
        for (const q of quests) {
            const count = q.clues ? q.clues.length : 0;
            html += `
                <div class="admin-item">
                    <div class="info"><div class="title">${q.title}</div><div class="sub">${count} улик · ${q.is_paid ? q.price + ' ₽' : 'Бесплатно'}</div></div>
                    <div class="actions">
                        <button class="edit-quest" data-id="${q.id}">✏️</button>
                        <button class="delete-quest danger" data-id="${q.id}">🗑️</button>
                    </div>
                </div>
            `;
        }
        list.innerHTML = html;
        list.querySelectorAll('.edit-quest').forEach(btn => btn.onclick = () => openQuestModal(parseInt(btn.dataset.id)));
        list.querySelectorAll('.delete-quest').forEach(btn => btn.onclick = () => deleteQuestItem(parseInt(btn.dataset.id)));
    } catch (e) {
        list.innerHTML = `<p style="color:#ff6b6b;">Ошибка: ${e.message}</p>`;
    }
}

async function openQuestModal(id = null) {
    editingQuestId = id;
    let quest = null;
    let clues = [];
    if (id) {
        quest = await getQuestById(id);
        clues = quest?.clues || [];
    }
    const title = quest ? '✏️ Редактировать' : '➕ Новый квест';
    let cluesHtml = clues.length === 0 ? generateClueBlock(0, null) : clues.map((c, i) => generateClueBlock(i, c)).join('');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <h3>${title}</h3>
            <div class="field"><label>Название</label><input id="fTitle" value="${quest?.title || ''}"></div>
            <div class="field"><label>Описание</label><input id="fDesc" value="${quest?.description || ''}"></div>
            <div class="field">
                <label>Уровень</label>
                <select id="fLevel">
                    <option value="легкий" ${quest?.level === 'легкий' ? 'selected' : ''}>Легкий</option>
                    <option value="средний" ${quest?.level === 'средний' ? 'selected' : ''}>Средний</option>
                    <option value="сложный" ${quest?.level === 'сложный' ? 'selected' : ''}>Сложный</option>
                </select>
            </div>
            <div class="field"><label><input type="checkbox" id="fIsPaid" ${quest?.is_paid ? 'checked' : ''}> Платный</label></div>
            <div class="field" id="priceField" style="${quest?.is_paid ? 'display:block' : 'display:none'}"><label>Цена</label><input type="number" id="fPrice" value="${quest?.price || 0}"></div>
            <div class="field"><label>Координаты</label><input id="fCoords" value="${quest?.final_coords || ''}"></div>
            <div class="field">
                <label>Улики</label>
                <div id="cluesContainer">${cluesHtml}</div>
                <button type="button" id="addClueBtn" style="margin-top:8px;">➕ Добавить улику</button>
            </div>
            <div class="modal-actions">
                <button class="cancel" id="closeModal">Отмена</button>
                <button class="save" id="saveQuestBtn">💾 Сохранить</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('closeModal').onclick = () => modal.remove();
    document.getElementById('saveQuestBtn').onclick = saveQuest;
    document.getElementById('addClueBtn').onclick = () => {
        document.getElementById('cluesContainer').insertAdjacentHTML('beforeend', generateClueBlock(document.querySelectorAll('.clue-block').length, null));
    };
    document.querySelectorAll('.remove-clue').forEach(btn => {
        btn.onclick = function() {
            if (document.querySelectorAll('.clue-block').length <= 1) { alert('Должна быть хотя бы одна улика'); return; }
            this.closest('.clue-block').remove();
            document.querySelectorAll('.clue-block').forEach((el, i) => el.querySelector('.clue-index').textContent = `Улика #${i+1}`);
        };
    });
    const paid = document.getElementById('fIsPaid');
    paid.onchange = () => document.getElementById('priceField').style.display = paid.checked ? 'block' : 'none';
}

function generateClueBlock(index, clue) {
    const type = clue?.type || 'photo';
    return `
        <div class="clue-block">
            <div style="display:flex; justify-content:space-between;">
                <span class="clue-index">Улика #${index+1}</span>
                <button type="button" class="remove-clue" style="background:transparent; border:1px solid #ff6b6b; color:#ff6b6b; padding:0 8px;">✕</button>
            </div>
            <div class="clue-row">
                <div><label>Тип</label><select class="clue-type"><option value="photo" ${type==='photo'?'selected':''}>Фото</option><option value="text" ${type==='text'?'selected':''}>Текст</option><option value="coords" ${type==='coords'?'selected':''}>Координаты</option><option value="video" ${type==='video'?'selected':''}>Видео</option><option value="audio" ${type==='audio'?'selected':''}>Аудио</option></select></div>
                <div><label>Код</label><input class="clue-code" value="${clue?.code || ''}"></div>
            </div>
            <div><label>Значение</label><input class="clue-value" value="${clue?.value || ''}"></div>
            <div><label>Подпись</label><input class="clue-caption" value="${clue?.caption || ''}"></div>
            <div class="clue-row">
                <div><label>Вопрос</label><input class="clue-question" value="${clue?.question || ''}"></div>
                <div><label>Ответ</label><input class="clue-answer" value="${clue?.answer || ''}"></div>
            </div>
        </div>
    `;
}

async function saveQuest() {
    const title = document.getElementById('fTitle').value.trim();
    const desc = document.getElementById('fDesc').value.trim();
    const level = document.getElementById('fLevel').value;
    const isPaid = document.getElementById('fIsPaid').checked;
    const price = parseInt(document.getElementById('fPrice').value) || 0;
    const coords = document.getElementById('fCoords').value.trim();
    if (!title) { alert('Введите название'); return; }
    const blocks = document.querySelectorAll('.clue-block');
    const clues = [];
    for (const block of blocks) {
        const type = block.querySelector('.clue-type').value;
        const value = block.querySelector('.clue-value').value.trim();
        if (!value) { alert('Заполните все улики'); return; }
        clues.push({
            type,
            value,
            caption: block.querySelector('.clue-caption').value.trim(),
            code: block.querySelector('.clue-code').value.trim() || `CODE-${Date.now()}`,
            question: block.querySelector('.clue-question').value.trim(),
            answer: block.querySelector('.clue-answer').value.trim()
        });
    }
    if (clues.length === 0) { alert('Добавьте улики'); return; }
    const data = { title, description: desc, level, is_paid: isPaid, price, final_coords: coords, clues };
    try {
        if (editingQuestId) await updateQuest(editingQuestId, data);
        else await addQuest(data);
        document.querySelector('.modal-overlay').remove();
        alert('✅ Сохранено');
        loadQuests();
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

async function deleteQuestItem(id) {
    if (!confirm('Удалить?')) return;
    try {
        await deleteQuest(id);
        loadQuests();
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

// ============================================================
//  НОВОСТИ
// ============================================================
async function renderNews() {
    const container = document.getElementById('adminTabContent');
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:16px;">
            <h3 style="color:#fff;">📰 Новости</h3>
            <button id="addNewsBtn">➕ Добавить</button>
        </div>
        <div id="newsList"></div>
    `;
    document.getElementById('addNewsBtn').onclick = () => openNewsModal();
    await loadNews();
}

async function loadNews() {
    const list = document.getElementById('newsList');
    try {
        const news = await getNews();
        if (!news || news.length === 0) {
            list.innerHTML = '<p style="color:#5a6a80;">Нет новостей</p>';
            return;
        }
        let html = '';
        for (const item of news) {
            html += `
                <div class="admin-item">
                    <div class="info"><div class="title">${item.title}</div><div class="sub">${new Date(item.date).toLocaleDateString()}</div></div>
                    <div class="actions">
                        <button class="edit-news" data-id="${item.id}">✏️</button>
                        <button class="delete-news danger" data-id="${item.id}">🗑️</button>
                    </div>
                </div>
            `;
        }
        list.innerHTML = html;
        list.querySelectorAll('.edit-news').forEach(btn => btn.onclick = () => openNewsModal(parseInt(btn.dataset.id)));
        list.querySelectorAll('.delete-news').forEach(btn => btn.onclick = () => deleteNewsItem(parseInt(btn.dataset.id)));
    } catch (e) { list.innerHTML = `<p style="color:#ff6b6b;">Ошибка: ${e.message}</p>`; }
}

function openNewsModal(id = null) {
    editingNewsId = id;
    let item = null;
    if (id) {
        getNews().then(news => {
            item = news.find(n => n.id === id);
            renderNewsModal(item);
        });
    } else {
        renderNewsModal(null);
    }
}

function renderNewsModal(item) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <h3>${item ? '✏️ Редактировать' : '➕ Новая новость'}</h3>
            <div class="field"><label>Заголовок</label><input id="nTitle" value="${item?.title || ''}"></div>
            <div class="field"><label>Превью</label><textarea id="nPreview" rows="2">${item?.preview || ''}</textarea></div>
            <div class="field"><label>Текст</label><textarea id="nContent" rows="5">${item?.content || ''}</textarea></div>
            <div class="field"><label>Картинка</label><input id="nImage" value="${item?.image || ''}" placeholder="https://..."></div>
            <div class="modal-actions">
                <button class="cancel" id="closeNewsModal">Отмена</button>
                <button class="save" id="saveNewsBtn">💾 Сохранить</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('closeNewsModal').onclick = () => modal.remove();
    document.getElementById('saveNewsBtn').onclick = saveNewsItem;
}

async function saveNewsItem() {
    const title = document.getElementById('nTitle').value.trim();
    const preview = document.getElementById('nPreview').value.trim();
    const content = document.getElementById('nContent').value.trim();
    const image = document.getElementById('nImage').value.trim();
    if (!title) { alert('Введите заголовок'); return; }
    if (!content) { alert('Введите текст'); return; }
    try {
        if (editingNewsId) await updateNews(editingNewsId, { title, content, preview, image });
        else await addNews({ title, content, preview, image });
        document.querySelector('.modal-overlay').remove();
        alert('✅ Сохранено');
        loadNews();
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

async function deleteNewsItem(id) {
    if (!confirm('Удалить?')) return;
    try {
        await deleteNews(id);
        loadNews();
    } catch (e) { alert('❌ Ошибка: ' + e.message); }
}

// ============================================================
//  СТАРТ
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('adminLoggedIn') === 'true') showAdminPanel();
    else showLogin();
});
