// ============================================================
//  main.js — главная и каталог
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    const catalogContainer = document.getElementById('catalogList');
    if (catalogContainer) {
        renderCatalog(catalogContainer);
    }

    const statEl = document.getElementById('totalBoxes');
    if (statEl) {
        const boxes = getBoxes();
        statEl.textContent = boxes.length + '+';
    }
});

function renderCatalog(container) {
    const boxes = getBoxes();
    console.log('📦 Количество боксов:', boxes.length);

    if (boxes.length === 0) {
        container.innerHTML = `
            <div class="line dim">> Нет доступных боксов.</div>
            <div class="line dim">> Возможно, данные не загрузились или были удалены.</div>
            <div style="margin-top: 16px;">
                <a href="admin.html" class="terminal-btn danger">⚙️ Перейти в админку</a>
                <button class="terminal-btn" onclick="window.resetData()" style="margin-left: 12px;">🔄 Сбросить данные</button>
            </div>
            <div class="line dim" style="margin-top: 12px; font-size: 13px;">
                > Сброс восстановит дефолтные боксы (3 штуки).
            </div>
        `;
        return;
    }

    let html = '<div class="box-list">';
    boxes.forEach(box => {
        const levelClass = box.level === 'легкий' ? 'easy' : box.level === 'средний' ? 'medium' : 'hard';
        const priceClass = box.isPaid ? 'paid' : 'free';
        const priceText = box.isPaid ? `${box.price} ₽` : 'Бесплатно';
        html += `
            <div class="box-item">
                <div class="info">
                    <div class="title">${box.title}</div>
                    <div class="desc">${box.description}</div>
                    <span class="level ${levelClass}">${box.level}</span>
                </div>
                <div class="actions">
                    <span class="price ${priceClass}">${priceText}</span>
                    <a href="box.html?id=${box.id}" class="terminal-btn" style="padding: 6px 16px; font-size: 14px;">
                        ${box.isPaid ? '💰 Взять' : '🆓 Открыть'}
                    </a>
                </div>
            </div>
        `;
    });
    html += '</div>';
    html += `
        <div style="margin-top: 24px; text-align: right;">
            <a href="admin.html" class="terminal-link" style="font-size: 12px; color: #4a5a6e;">⚙️ Админка</a>
        </div>
    `;
    container.innerHTML = html;
}

window.resetData = function() {
    if (confirm('Сбросить данные боксов к дефолтным? Все созданные боксы будут потеряны.')) {
        localStorage.removeItem('boxesData');
        location.reload();
    }
};