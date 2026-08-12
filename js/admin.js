// ============================================================
//  admin.js — Админка с Supabase
// ============================================================

import { getSupabaseClient, waitForSupabase, isSupabaseReady } from './supabase-client.js';

const ADMIN_PASSWORD = 'admin123';
let editingId = null;

// ============================================================
//  ЛОГИН
// ============================================================
function showLogin() {
    document.getElementById('adminContent').innerHTML = `
        <div class="admin-login">
            <h2 style="color:#ff6b35;">🔐 Вход</h2>
            <p style="color:#8a9bb5;">Пароль: admin123</p>
            <input type="password" id="adminPass" placeholder="Пароль" autofocus>
            <button id="loginBtn">Войти</button>
            <div id="loginError" style="color:#ff6b6b; margin-top:8px; display:none;">❌ Неверный пароль</div>
        </div>
    `;
    document.getElementById('loginBtn').onclick = () => {
        const pass = document.getElementById('adminPass').value;
        if (pass === ADMIN_PASSWORD) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            showPanel();
        } else {
            document.getElementById('loginError').style.display = 'block';
        }
    };
    document.getElementById('adminPass').addEventListener('keydown', e => {
        if (e.key === 'Enter') document.getElementById('loginBtn').click();
    });
}

// ============================================================
//  ПАНЕЛЬ
// ============================================================
function showPanel() {
    document.getElementById('adminContent').innerHTML = `
        <div class="admin-panel">
            <div class="admin-toolbar">
                <h3 style="color:#ff6b35;">⚙️ Квесты</h3>
                <div>
                    <button id="addBtn">➕ Добавить</button>
                    <button id="logoutBtn" class="danger">🚪 Выйти</button>
                </div>
            </div>
            <div id="list"></div>
        </div>
    `;
    document.getElementById('addBtn').onclick = () => openModal();
    document.getElementById('logoutBtn').onclick = () => {
        sessionStorage.removeItem('adminLoggedIn');
        location.reload();
    };
    loadList();
}

// ============================================================
//  ЗАГРУЗКА СПИСКА
// ============================================================
async function loadList() {
    const list = document.getElementById('list');
    try {
        await waitForSupabase();
        if (!isSupabaseReady()) {
            list.innerHTML = `<p style="color:#ff6b6b;">⚠️ Supabase не подключён. Проверь ключи в supabase-client.js</p>`;
            return;
        }
        const client = getSupabaseClient();
        const { data, error } = await client.from('quests').select('*').order('id');
        if (error) throw error;
        if (!data || data.length === 0) {
            list.innerHTML = `<p style="color:#5a6a80;">Нет квестов. Добавьте первый!</p>`;
            return;
        }
        let html = '';
        for (const q of data) {
            const { data: clues } = await client.from('clues').select('*').eq('quest_id', q.id);
            const count = clues ? clues.length : 0;
            html += `
                <div class="admin-item">
                    <div class="info">
                        <div class="title">${q.title}</div>
                        <div class="sub">${count} улик · ${q.is_paid ? q.price + ' ₽' : 'Бесплатно'}</div>
                    </div>
                    <div class="actions">
                        <button class="edit" data-id="${q.id}">✏️</button>
                        <button class="delete danger" data-id="${q.id}">🗑️</button>
                    </div>
                </div>
            `;
        }
        list.innerHTML = html;
        list.querySelectorAll('.edit').forEach(btn => btn.onclick = () => openModal(parseInt(btn.dataset.id)));
        list.querySelectorAll('.delete').forEach(btn => btn.onclick = () => deleteQuest(parseInt(btn.dataset.id)));
    } catch (e) {
        list.innerHTML = `<p style="color:#ff6b6b;">Ошибка: ${e.message}</p>`;
    }
}

// ============================================================
//  МОДАЛКА
// ============================================================
async function openModal(id = null) {
    editingId = id;
    let quest = null;
    let clues = [];
    if (id) {
        const client = getSupabaseClient();
        const { data } = await client.from('quests').select('*').eq('id', id).single();
        quest = data;
        const { data: c } = await client.from('clues').select('*').eq('quest_id', id).order('order_index');
        clues = c || [];
    }
    const title = quest ? '✏️ Редактировать' : '➕ Новый квест';

    let cluesHtml = '';
    if (clues.length === 0) {
        cluesHtml = generateClueBlock(0, null);
    } else {
        clues.forEach((c, i) => cluesHtml += generateClueBlock(i, c));
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <h3>${title}</h3>
            <div class="field">
                <label>Название</label>
                <input id="fTitle" value="${quest ? quest.title : ''}" placeholder="Название квеста">
            </div>
            <div class="field">
                <label>Описание</label>
                <input id="fDesc" value="${quest ? quest.description : ''}" placeholder="Описание">
            </div>
            <div class="field">
                <label>Уровень</label>
                <select id="fLevel">
                    <option value="легкий" ${quest?.level === 'легкий' ? 'selected' : ''}>Легкий</option>
                    <option value="средний" ${quest?.level === 'средний' ? 'selected' : ''}>Средний</option>
                    <option value="сложный" ${quest?.level === 'сложный' ? 'selected' : ''}>Сложный</option>
                </select>
            </div>
            <div class="field">
                <label><input type="checkbox" id="fIsPaid" ${quest?.is_paid ? 'checked' : ''}> Платный</label>
            </div>
            <div class="field" id="priceField" style="${quest?.is_paid ? 'display:block' : 'display:none'}">
                <label>Цена (₽)</label>
                <input type="number" id="fPrice" value="${quest?.price || 0}">
            </div>
            <div class="field">
                <label>Финальные координаты</label>
                <input id="fCoords" value="${quest?.final_coords || ''}" placeholder="59.1200, 37.9050">
            </div>
            <div class="field">
                <label>Улики</label>
                <div id="cluesContainer">${cluesHtml}</div>
                <button type="button" id="addClueBtn" style="margin-top:8px;">➕ Добавить улику</button>
            </div>
            <div class="modal-actions">
                <button class="cancel" id="closeModalBtn">Отмена</button>
                <button class="save" id="saveBtn">💾 Сохранить</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('closeModalBtn').onclick = () => modal.remove();
    document.getElementById('saveBtn').onclick = saveQuest;

    const paid = document.getElementById('fIsPaid');
    const priceField = document.getElementById('priceField');
    paid.onchange = () => priceField.style.display = paid.checked ? 'block' : 'none';

    document.getElementById('addClueBtn').onclick = () => {
        const container = document.getElementById('cluesContainer');
        container.insertAdjacentHTML('beforeend', generateClueBlock(container.children.length, null));
    };

    document.querySelectorAll('.remove-clue').forEach(btn => {
        btn.onclick = function() {
            const block = this.closest('.clue-block');
            if (document.querySelectorAll('.clue-block').length <= 1) {
                alert('Должна быть хотя бы одна улика');
                return;
            }
            block.remove();
            document.querySelectorAll('.clue-block').forEach((el, i) => {
                el.querySelector('.clue-index').textContent = `Улика #${i+1}`;
            });
        };
    });
}

function generateClueBlock(index, clue) {
    const type = clue ? clue.type : 'photo';
    const value = clue ? clue.value || '' : '';
    const caption = clue ? clue.caption || '' : '';
    const code = clue ? clue.code || '' : '';
    const question = clue ? clue.question || '' : '';
    const answer = clue ? clue.answer || '' : '';

    return `
        <div class="clue-block">
            <div style="display:flex; justify-content:space-between;">
                <span class="clue-index" style="color:#4a5a6e;">Улика #${index+1}</span>
                <button type="button" class="remove-clue" style="background:transparent; border:1px solid #ff6b6b; color:#ff6b6b; padding:0 8px; cursor:pointer;">✕</button>
            </div>
            <div class="clue-row">
                <div><label>Тип</label><select class="clue-type"><option value="photo" ${type==='photo'?'selected':''}>Фото</option><option value="text" ${type==='text'?'selected':''}>Текст</option><option value="coords" ${type==='coords'?'selected':''}>Координаты</option><option value="video" ${type==='video'?'selected':''}>Видео</option><option value="audio" ${type==='audio'?'selected':''}>Аудио</option></select></div>
                <div><label>Код</label><input class="clue-code" value="${code}" placeholder="CODE-01"></div>
            </div>
            <div><label>Значение</label><input class="clue-value" value="${value}" placeholder="assets/photo.jpg"></div>
            <div><label>Подпись</label><input class="clue-caption" value="${caption}" placeholder="Подпись"></div>
            <div class="clue-row">
                <div><label>Вопрос</label><input class="clue-question" value="${question}" placeholder="Вопрос"></div>
                <div><label>Ответ</label><input class="clue-answer" value="${answer}" placeholder="Ответ"></div>
            </div>
        </div>
    `;
}

// ============================================================
//  СОХРАНЕНИЕ
// ============================================================
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
    let ok = true;
    blocks.forEach(block => {
        const type = block.querySelector('.clue-type').value;
        const value = block.querySelector('.clue-value').value.trim();
        const caption = block.querySelector('.clue-caption').value.trim();
        const code = block.querySelector('.clue-code').value.trim() || `CODE-${String(Math.floor(Math.random()*10000)).padStart(4,'0')}`;
        const question = block.querySelector('.clue-question').value.trim();
        const answer = block.querySelector('.clue-answer').value.trim();
        if (!value) { ok = false; return; }
        clues.push({ type, value, caption, code, question, answer });
    });
    if (!ok) { alert('Заполните все улики'); return; }
    if (clues.length === 0) { alert('Добавьте улики'); return; }

    const questData = {
        title,
        description: desc,
        level,
        is_paid: isPaid,
        price: isPaid ? price : 0,
        final_coords: coords
    };

    try {
        const client = getSupabaseClient();
        await waitForSupabase();
        let questId;
        if (editingId) {
            await client.from('quests').update(questData).eq('id', editingId);
            await client.from('clues').delete().eq('quest_id', editingId);
            questId = editingId;
        } else {
            const { data } = await client.from('quests').insert([questData]).select();
            questId = data[0].id;
        }
        if (clues.length > 0) {
            const cluesWithQuest = clues.map((c, i) => ({ ...c, quest_id: questId, order_index: i }));
            await client.from('clues').insert(cluesWithQuest);
        }
        document.querySelector('.modal-overlay').remove();
        alert('✅ Квест сохранён!');
        loadList();
    } catch (e) {
        alert('❌ Ошибка: ' + e.message);
    }
}

// ============================================================
//  УДАЛЕНИЕ
// ============================================================
async function deleteQuest(id) {
    if (!confirm('Удалить квест?')) return;
    try {
        const client = getSupabaseClient();
        await waitForSupabase();
        await client.from('clues').delete().eq('quest_id', id);
        await client.from('quests').delete().eq('id', id);
        alert('✅ Удалено');
        loadList();
    } catch (e) {
        alert('❌ Ошибка: ' + e.message);
    }
}

// ============================================================
//  СТАРТ
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        showPanel();
    } else {
        showLogin();
    }
});
