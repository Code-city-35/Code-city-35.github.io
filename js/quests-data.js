import { getSupabaseClient, isSupabaseReady, waitForSupabase } from './supabase-client.js';

function showDebug(msg, isError = false) {
    let el = document.getElementById('debugInfo');
    if (!el) {
        el = document.createElement('div');
        el.id = 'debugInfo';
        el.style.cssText = 'background:#111;color:#0f0;padding:12px;margin:12px;border:1px solid #ff6b35;font-family:monospace;font-size:13px;white-space:pre-wrap;max-height:300px;overflow:auto;z-index:9999;position:relative;';
        document.body.prepend(el);
    }
    el.innerHTML += `<div style="color:${isError ? '#ff6b6b' : '#6fcf97'}">${msg}</div>`;
}

export async function getQuests() {
    showDebug('📥 Загрузка квестов...');
    await waitForSupabase();
    if (!isSupabaseReady()) {
        showDebug('❌ Supabase НЕ ГОТОВ!', true);
        return [];
    }
    try {
        const client = getSupabaseClient();
        showDebug('📡 Запрос к таблице quests...');
        const { data, error } = await client.from('quests').select('*').order('id');
        if (error) {
            showDebug('❌ Ошибка SQL: ' + error.message, true);
            throw error;
        }
        showDebug('✅ Получено квестов: ' + (data ? data.length : 0));
        if (!data || data.length === 0) {
            showDebug('⚠️ Таблица quests пуста! Добавь квест через админку.', true);
            return [];
        }
        const result = [];
        for (const q of data) {
            const { data: clues, error: cErr } = await client.from('clues').select('*').eq('quest_id', q.id).order('order_index');
            if (cErr) showDebug('⚠️ Ошибка загрузки улик для квеста ' + q.id + ': ' + cErr.message, true);
            result.push({ ...q, clues: clues || [] });
        }
        showDebug('✅ Загружено ' + result.length + ' квестов с уликами');
        return result;
    } catch (e) {
        showDebug('❌ Исключение: ' + e.message, true);
        return [];
    }
}

export async function getQuestById(id) {
    const quests = await getQuests();
    return quests.find(q => q.id === id) || null;
}

export async function getCluesByQuestId(questId) {
    await waitForSupabase();
    if (!isSupabaseReady()) return [];
    try {
        const client = getSupabaseClient();
        const { data } = await client.from('clues').select('*').eq('quest_id', questId).order('order_index');
        return data || [];
    } catch (e) {
        return [];
    }
}

export async function addQuest(questData) {
    await waitForSupabase();
    if (!isSupabaseReady()) throw new Error('Supabase не подключён');
    const client = getSupabaseClient();
    const { clues, ...questWithoutClues } = questData;
    const { data: quest, error } = await client.from('quests').insert([questWithoutClues]).select();
    if (error) throw error;
    const questId = quest[0].id;
    if (clues && clues.length > 0) {
        const cluesWithQuest = clues.map((c, i) => ({ ...c, quest_id: questId, order_index: i }));
        await client.from('clues').insert(cluesWithQuest);
    }
    return { ...quest[0], clues: clues || [] };
}

export async function updateQuest(id, questData) {
    await waitForSupabase();
    if (!isSupabaseReady()) throw new Error('Supabase не подключён');
    const client = getSupabaseClient();
    const { clues, ...questWithoutClues } = questData;
    await client.from('quests').update(questWithoutClues).eq('id', id);
    await client.from('clues').delete().eq('quest_id', id);
    if (clues && clues.length > 0) {
        const cluesWithQuest = clues.map((c, i) => ({ ...c, quest_id: id, order_index: i }));
        await client.from('clues').insert(cluesWithQuest);
    }
    return { ...questWithoutClues, id, clues: clues || [] };
}

export async function deleteQuest(id) {
    await waitForSupabase();
    if (!isSupabaseReady()) throw new Error('Supabase не подключён');
    const client = getSupabaseClient();
    await client.from('clues').delete().eq('quest_id', id);
    await client.from('quests').delete().eq('id', id);
    return true;
}
export function getBoxes() { return getQuests(); }
export function getBoxById(id) { return getQuestById(id); }
