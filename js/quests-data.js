// ============================================================
//  quests-data.js — работа с квестами и уликами через Supabase
// ============================================================

import { getSupabaseClient, isSupabaseReady, waitForSupabase } from './supabase-client.js';

// ============================================================
//  LOCALSTORAGE (fallback)
// ============================================================

const STORAGE_KEY = 'questsData';

function getDefaultQuests() {
    return [
        {
            id: 1,
            title: 'Призрак инженера',
            description: 'Городская легенда о пропавшем инженере. Найди 7 улик и раскрой тайну.',
            level: 'средний',
            isPaid: false,
            price: 0,
            finalCoords: '59.1220, 37.9080',
            clues: [
                { type: 'photo', value: 'assets/bridge_old.jpg', caption: 'Найди место со снимка', code: 'BELOV-01', question: 'Какой год указан на табличке моста?', answer: '1905' },
                { type: 'text', value: 'На старой водонапорной башне есть табличка с датой. Найди её и запиши последние две цифры.', caption: '', code: 'BELOV-02', question: '', answer: '' },
                { type: 'photo', value: 'assets/house_mezzanine.jpg', caption: 'Найди дом с мезонином', code: 'BELOV-03', question: '', answer: '' },
                { type: 'text', value: 'Подземный переход у Дворца металлургов. На стене есть граффити с цифрой. Какая?', caption: '', code: 'BELOV-04', question: '', answer: '' },
                { type: 'coords', value: '59.1180, 37.9000', caption: 'Инженер любил сидеть на этом месте', code: 'BELOV-05', question: '', answer: '' },
                { type: 'photo', value: 'assets/factory_old.jpg', caption: 'Руины старой фабрики', code: 'BELOV-06', question: '', answer: '' },
                { type: 'text', value: 'Смотровая площадка на Соборной горке. Отсюда видно весь город.', caption: '', code: 'BELOV-07', question: 'Сколько ступеней ведёт к площадке?', answer: '12' }
            ]
        }
    ];
}

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

function getLocalQuestById(id) {
    return getLocalQuests().find(q => q.id === id);
}

function generateLocalId() {
    const quests = getLocalQuests();
    return quests.length > 0 ? Math.max(...quests.map(q => q.id)) + 1 : 1;
}

// ============================================================
//  ПУБЛИЧНЫЕ ФУНКЦИИ (сначала Supabase, потом localStorage)
// ============================================================

export async function getQuests() {
    await waitForSupabase();
    if (isSupabaseReady()) {
        try {
            const client = getSupabaseClient();
            const { data, error } = await client
                .from('quests')
                .select('*')
                .order('id', { ascending: true });
            if (error) throw error;
            // Для каждого квеста загружаем улики
            const quests = await Promise.all(data.map(async (q) => {
                const cluesData = await getCluesByQuestId(q.id);
                return { ...q, clues: cluesData };
            }));
            return quests;
        } catch (e) {
            console.warn('⚠️ Ошибка загрузки квестов из Supabase, используем localStorage', e);
            return getLocalQuests();
        }
    } else {
        return getLocalQuests();
    }
}

export async function getCluesByQuestId(questId) {
    if (isSupabaseReady()) {
        try {
            const client = getSupabaseClient();
            const { data, error } = await client
                .from('clues')
                .select('*')
                .eq('quest_id', questId)
                .order('order_index', { ascending: true });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn('⚠️ Ошибка загрузки улик из Supabase', e);
            // fallback: если квест в localStorage, возвращаем его улики
            const local = getLocalQuestById(questId);
            return local ? local.clues : [];
        }
    } else {
        const local = getLocalQuestById(questId);
        return local ? local.clues : [];
    }
}

export async function getQuestById(id) {
    const quests = await getQuests();
    return quests.find(q => q.id === id) || null;
}

export async function addQuest(questData) {
    await waitForSupabase();
    const { clues, ...questWithoutClues } = questData;

    if (isSupabaseReady()) {
        try {
            const client = getSupabaseClient();
            // Вставляем квест
            const { data: quest, error: qError } = await client
                .from('quests')
                .insert([questWithoutClues])
                .select();
            if (qError) throw qError;
            const questId = quest[0].id;

            // Вставляем улики
            if (clues && clues.length > 0) {
                const cluesWithQuestId = clues.map((c, idx) => ({
                    ...c,
                    quest_id: questId,
                    order_index: idx
                }));
                const { error: cError } = await client
                    .from('clues')
                    .insert(cluesWithQuestId);
                if (cError) throw cError;
            }

            // Возвращаем полный объект
            return { ...quest[0], clues: clues || [] };
        } catch (e) {
            console.warn('⚠️ Ошибка добавления квеста в Supabase, сохраняем в localStorage', e);
            // fallback: сохраняем локально
            const localQuests = getLocalQuests();
            const newId = generateLocalId();
            const newQuest = { ...questData, id: newId };
            localQuests.push(newQuest);
            saveLocalQuests(localQuests);
            return newQuest;
        }
    } else {
        // Только localStorage
        const localQuests = getLocalQuests();
        const newId = generateLocalId();
        const newQuest = { ...questData, id: newId };
        localQuests.push(newQuest);
        saveLocalQuests(localQuests);
        return newQuest;
    }
}

export async function updateQuest(id, questData) {
    await waitForSupabase();
    const { clues, ...questWithoutClues } = questData;

    if (isSupabaseReady()) {
        try {
            const client = getSupabaseClient();
            // Обновляем квест
            const { error: qError } = await client
                .from('quests')
                .update(questWithoutClues)
                .eq('id', id);
            if (qError) throw qError;

            // Удаляем старые улики
            await client.from('clues').delete().eq('quest_id', id);

            // Вставляем новые
            if (clues && clues.length > 0) {
                const cluesWithQuestId = clues.map((c, idx) => ({
                    ...c,
                    quest_id: id,
                    order_index: idx
                }));
                const { error: cError } = await client
                    .from('clues')
                    .insert(cluesWithQuestId);
                if (cError) throw cError;
            }

            return { ...questWithoutClues, id, clues: clues || [] };
        } catch (e) {
            console.warn('⚠️ Ошибка обновления квеста в Supabase, обновляем в localStorage', e);
            // fallback
            const localQuests = getLocalQuests();
            const index = localQuests.findIndex(q => q.id === id);
            if (index === -1) return null;
            localQuests[index] = { ...questData, id };
            saveLocalQuests(localQuests);
            return localQuests[index];
        }
    } else {
        const localQuests = getLocalQuests();
        const index = localQuests.findIndex(q => q.id === id);
        if (index === -1) return null;
        localQuests[index] = { ...questData, id };
        saveLocalQuests(localQuests);
        return localQuests[index];
    }
}

export async function deleteQuest(id) {
    await waitForSupabase();
    if (isSupabaseReady()) {
        try {
            const client = getSupabaseClient();
            // Улики удалятся каскадно
            const { error } = await client
                .from('quests')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('⚠️ Ошибка удаления квеста из Supabase, удаляем из localStorage', e);
            // fallback
            let localQuests = getLocalQuests();
            localQuests = localQuests.filter(q => q.id !== id);
            saveLocalQuests(localQuests);
            return true;
        }
    } else {
        let localQuests = getLocalQuests();
        localQuests = localQuests.filter(q => q.id !== id);
        saveLocalQuests(localQuests);
        return true;
    }
}

// Для совместимости со старыми функциями
export function getBoxes() {
    // возвращаем промис, но в старом коде синхронно, поэтому обернём
    return getQuests();
}

export function getBoxById(id) {
    return getQuestById(id);
}

export function saveBoxes(quests) {
    // в новой версии используем add/update, но для совместимости
    // просто сохраняем в localStorage
    saveLocalQuests(quests);
}

export function generateBoxId() {
    return generateLocalId();
}
