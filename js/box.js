// ============================================================
//  box.js — страница квеста с отладкой на экране
// ============================================================

import { getQuestById, getCluesByQuestId } from './quests-data.js';

let currentBox = null;
let currentStep = 0;
let timerSeconds = 0;
let timerInterval = null;
let isFinished = false;
let isLocked = false;

// Стили (без изменений)
(function injectStyles() {
    if (document.getElementById('box-styles')) return;
    const style = document.createElement('style');
    style.id = 'box-styles';
    style.textContent = `
        .terminal { background: rgba(16,24,44,0.4); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.05); padding: 30px 28px; max-width: 700px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.2); font-family: 'Inter', sans-serif; color: #e8edf2; }
        .terminal .line { margin-bottom: 10px; line-height: 1.6; font-size: 16px; color: #e8edf2; }
        .terminal .line.dim { color: #5a6a80; }
        .terminal .line .error { color: #ff6b6b; }
        .terminal .line .success { color: #6fcf97; }
        .terminal .line .highlight { color: #ff6b35; }
        .terminal .input-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
        .terminal .input-row input { flex: 1; background: rgba(8,12,26,0.6); border: 1px solid rgba(255,255,255,0.06); color: #e8edf2; padding: 10px 14px; font-family: 'Inter', sans-serif; font-size: 16px; min-width: 140px; }
        .terminal .input-row input:focus { border-color: #ff6b35; outline: none; }
        .terminal .input-row input:disabled { opacity: 0.5; }
        .terminal .input-row button { padding: 10px 24px; font-weight: 600; font-size: 16px; background: #ff6b35; color: #080c1a; border: none; cursor: pointer; font-family: 'Inter', sans-serif; }
        .terminal .input-row button:hover { background: #ff8a5c; }
        .terminal .input-row button:disabled { opacity: 0.4; pointer-events: none; }
        .terminal .clue-block { background: rgba(16,24,44,0.4); backdrop-filter: blur(10px); padding: 20px; margin: 16px 0; border: 1px solid rgba(255,255,255,0.05); }
        .terminal .clue-block .clue-label { color: #5a6a80; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .terminal .clue-block .clue-content { margin-top: 8px; font-size: 16px; color: #e8edf2; }
        .terminal .clue-block .clue-content img, .terminal .clue-block .clue-content video { max-width: 100%; border: 1px solid rgba(255,255,255,0.05); }
        .terminal .terminal-link { color: #ff6b35; text-decoration: none; border-bottom: 1px dashed rgba(255,107,53,0.2); transition: 0.2s; }
        .terminal .terminal-link:hover { border-bottom-color: #ff6b35; }
        .terminal .terminal-btn { display: inline-block; padding: 10px 28px; font-weight: 600; font-size: 16px; background: #ff6b35; color: #080c1a; border: none; cursor: pointer; font-family: 'Inter', sans-serif; text-decoration: none; transition: 0.2s; }
        .terminal .terminal-btn:hover { background: #ff8a5c; }
        .terminal .terminal-btn.danger { background: transparent; color: #ff6b6b; border: 1px solid #ff6b6b; }
        .terminal .terminal-btn.danger:hover { background: #ff6b6b; color: #080c1a; }
    `;
    document.head.appendChild(style);
})();

document.addEventListener('DOMContentLoaded', async function() {
    const params = new URLSearchParams(window.location.search);
    const boxId = parseInt(params.get('id'));
    if (boxId) {
        try {
            showDebug('🔄 Загрузка квеста ID: ' + boxId);
            currentBox = await getQuestById(boxId);
            showDebug('📦 Получен квест: ' + (currentBox ? currentBox.title : 'null'));
            if (!currentBox) {
                document.getElementById('boxContent').innerHTML = `
                    <div class="line error">> Ошибка: бокс не найден</div>
                    <a href="catalog.html" class="terminal-link">← Вернуться в каталог</a>
                `;
                return;
            }
            if (!currentBox.clues || currentBox.clues.length === 0) {
                currentBox.clues = await getCluesByQuestId(boxId);
            }
            renderBox();
        } catch (e) {
            showDebug('❌ Ошибка: ' + e.message, true);
            document.getElementById('boxContent').innerHTML = `
                <div class="line error">> Ошибка загрузки квеста: ${e.message}</div>
                <a href="catalog.html" class="terminal-link">← Вернуться в каталог</a>
            `;
        }
    } else {
        document.getElementById('boxContent').innerHTML = `
            <div class="line error">> Не указан ID бокса</div>
            <a href="catalog.html" class="terminal-link">← Вернуться в каталог</a>
        `;
    }
});

function showDebug(msg, isError = false) {
    const el = document.getElementById('debugInfo') || (() => {
        const d = document.createElement('div');
        d.id = 'debugInfo';
        d.style.cssText = 'background:#111;color:#0f0;padding:12px;margin:12px;border:1px solid #ff6b35;font-family:monospace;font-size:13px;white-space:pre-wrap;max-height:200px;overflow:auto;';
        document.body.prepend(d);
        return d;
    })();
    el.innerHTML += `<div style="color:${isError ? '#ff6b6b' : '#6fcf97'}">${msg}</div>`;
}

// Остальные функции renderBox, showStep, finishBox, payBox, timer — такие же, как в прошлом box.js.
// (Я не буду дублировать 200 строк, они идентичны)
