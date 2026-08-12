// ============================================================
//  pass.js — генерация пропуска (с отладкой)
// ============================================================

import { getQuests } from './quests-data.js';

// ============================================================
//  ОТЛАДКА (вывод на экран)
// ============================================================
function showDebug(msg, isError = false) {
    let el = document.getElementById('debugInfo');
    if (!el) {
        el = document.createElement('div');
        el.id = 'debugInfo';
        el.style.cssText = 'background:#111;color:#0f0;padding:12px;margin:12px;border:1px solid #ff6b35;font-family:monospace;font-size:13px;white-space:pre-wrap;max-height:300px;overflow:auto;z-index:9999;position:relative;';
        document.body.prepend(el);
    }
    el.innerHTML += `<div style="color:${isError ? '#ff6b6b' : '#6fcf97'}">${msg}</div>`;
    console.log(msg);
}

// ============================================================
//  ЗАГРУЗКА СПИСКА КВЕСТОВ
// ============================================================
document.addEventListener('DOMContentLoaded', async function() {
    showDebug('🔄 Загрузка pass.js...');
    const select = document.getElementById('questSelect');
    if (!select) {
        showDebug('❌ Элемент #questSelect не найден', true);
        return;
    }

    try {
        showDebug('📥 Вызов getQuests()...');
        const quests = await getQuests();
        showDebug('✅ Получено квестов: ' + (quests ? quests.length : 0));
        select.innerHTML = '<option value="">— Выберите квест —</option>';
        if (!quests || quests.length === 0) {
            showDebug('⚠️ Квесты не найдены (пустой массив)', true);
            const option = document.createElement('option');
            option.value = '';
            option.textContent = '❌ Нет доступных квестов';
            option.disabled = true;
            select.appendChild(option);
            return;
        }
        quests.forEach(q => {
            const option = document.createElement('option');
            option.value = q.id;
            option.textContent = `${q.icon || '📦'} ${q.title}`;
            select.appendChild(option);
        });
        showDebug('✅ Список квестов загружен в select');
    } catch (e) {
        showDebug('❌ Ошибка: ' + e.message, true);
        select.innerHTML = '<option value="">❌ Ошибка загрузки</option>';
    }
});

// ============================================================
//  ГЕНЕРАЦИЯ ПРОПУСКА (глобальная функция)
// ============================================================
window.generatePass = async function() {
    showDebug('🔄 Генерация пропуска...');
    const nameInput = document.getElementById('playerName');
    const questSelect = document.getElementById('questSelect');
    const passCard = document.getElementById('passCard');

    if (!nameInput || !questSelect || !passCard) {
        alert('Ошибка: не найдены элементы формы');
        return;
    }

    const name = nameInput.value.trim();
    const questId = parseInt(questSelect.value);

    if (!name) {
        alert('Введите ваше имя');
        nameInput.focus();
        return;
    }
    if (!questId) {
        alert('Выберите квест');
        questSelect.focus();
        return;
    }

    try {
        const quests = await getQuests();
        const quest = quests.find(q => q.id === questId);
        if (!quest) {
            alert('Квест не найден. Попробуйте обновить страницу.');
            return;
        }

        const now = new Date();
        const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const passId = `PASS-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
        const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const expiresStr = expires.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const weekdays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
        const dayOfWeek = weekdays[now.getDay()];
        const signatureText = 'Code-city-35';

        passCard.innerHTML = `
            <div class="pass-card" id="passCardInner">
                <div class="pass-header">
                    <span class="logo">🗺️ Код города</span>
                    <span class="stamp">#${passId}</span>
                </div>
                <div class="pass-body">
                    <div class="field full">
                        <span class="label">Участник</span>
                        <span class="value">${escapeHtml(name)}</span>
                    </div>
                    <div class="field">
                        <span class="label">Квест</span>
                        <span class="value">${escapeHtml(quest.icon || '📦')} ${escapeHtml(quest.title)}</span>
                    </div>
                    <div class="field">
                        <span class="label">Уровень</span>
                        <span class="value">${escapeHtml(quest.level || 'средний')}</span>
                    </div>
                    <div class="field">
                        <span class="label">Дата</span>
                        <span class="value">${dateStr} (${dayOfWeek})</span>
                    </div>
                    <div class="field">
                        <span class="label">Время</span>
                        <span class="value">${timeStr}</span>
                    </div>
                    <div class="field full">
                        <span class="label">Действителен до</span>
                        <span class="value">${expiresStr} 23:59</span>
                    </div>
                </div>
                <div class="signature-line">
                    <div class="signature-drawing">
                        <span class="signature-name">${escapeHtml(signatureText)}</span>
                        <span class="signature-label">Уполномоченное лицо</span>
                    </div>
                </div>
                <div class="pass-footer">
                    <span class="signature">◈ Организатор: Команда Код города</span>
                </div>
                <div class="pass-disclaimer">
                    * Участник городского квеста «Код города». Игрок ищет QR-коды и выполняет задания на городских объектах. 
                    Действует в рамках официальной игры и законодательства РФ. Данный пропуск не дает права проходить на частные и/или режимные объекты. При возникновении вопросов обращайтесь к организатору: 
                    <span style="color: #00ff41;">code-city@mail.ru</span>
                </div>
            </div>
            <div class="pass-actions">
                <button onclick="downloadPass()">📥 Скачать</button>
                <button onclick="printPass()">🖨️ Печать</button>
            </div>
        `;

        passCard.style.display = 'block';
        showDebug('✅ Пропуск сгенерирован');
    } catch (e) {
        alert('Ошибка загрузки квеста: ' + e.message);
        showDebug('❌ Ошибка генерации: ' + e.message, true);
    }
};

// ============================================================
//  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function downloadPass() {
    const card = document.getElementById('passCardInner');
    if (!card) return;
    if (typeof html2canvas === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => capturePass(card);
        document.head.appendChild(script);
    } else {
        capturePass(card);
    }
}

function capturePass(card) {
    html2canvas(card, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        borderRadius: '16px',
        logging: false
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Пропуск_Код_города_${new Date().toISOString().slice(0,10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }).catch(() => {
        alert('Не удалось создать изображение. Попробуйте сделать скриншот.');
    });
}

function printPass() {
    const card = document.getElementById('passCardInner');
    if (!card) return;
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    printWindow.document.write(`
        <html>
            <head>
                <title>Пропуск Код города</title>
                <style>
                    body { margin: 0; padding: 20px; background: #0a0a0a; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: 'Courier New', monospace; }
                    * { box-sizing: border-box; }
                    .pass-card { border: 2px solid #000; padding: 24px 20px; border-radius: 16px; background: #fff; max-width: 500px; }
                    .pass-card .pass-header { display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 12px; }
                    .pass-card .pass-header .logo { font-size: 18px; font-weight: 800; color: #000; }
                    .pass-card .pass-header .stamp { font-size: 12px; color: #666; }
                    .pass-card .pass-body { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; margin-bottom: 12px; }
                    .pass-card .pass-body .field { display: flex; flex-direction: column; }
                    .pass-card .pass-body .field .label { font-size: 9px; text-transform: uppercase; color: #666; letter-spacing: 0.5px; }
                    .pass-card .pass-body .field .value { font-size: 14px; color: #000; font-weight: 600; font-family: monospace; }
                    .pass-card .pass-body .field.full { grid-column: 1 / -1; }
                    .pass-card .signature-line { margin-top: 6px; border-top: 1px solid #ccc; padding-top: 6px; display: flex; justify-content: flex-end; }
                    .pass-card .signature-line .signature-name { font-family: 'Brush Script MT', cursive; font-size: 22px; color: #000; display: block; text-align: right; }
                    .pass-card .signature-line .signature-label { font-size: 9px; text-transform: uppercase; color: #666; margin-top: 2px; display: block; text-align: right; }
                    .pass-card .pass-footer { border-top: 1px solid #ccc; padding-top: 10px; font-size: 11px; color: #666; }
                    .pass-card .pass-footer .signature { color: #000; opacity: 0.6; }
                    .pass-card .pass-disclaimer { font-size: 8px; color: #555; border-top: 1px solid #ccc; padding-top: 8px; margin-top: 10px; font-family: Arial, sans-serif; line-height: 1.4; }
                    .pass-card .pass-disclaimer span { color: #000 !important; font-weight: bold; }
                </style>
            </head>
            <body>
                ${card.outerHTML}
                <script>
                    window.onload = function() { window.print(); }
                <\/script>
            </body>
        </html>
    `);
    printWindow.document.close();
}
