// ============================================================
//  news-data.js — работа с новостями (Supabase + localStorage)
// ============================================================

import { getSupabaseClient, isSupabaseReady, waitForSupabase } from './supabase-client.js';

const STORAGE_KEY = 'newsData';

function getDefaultNews() {
    return [
        {
            id: 1,
            title: 'Добро пожаловать в мир расследований!',
            date: new Date().toISOString(),
            content: 'Это первая новость нашего проекта. Здесь будут появляться анонсы новых квестов, обновления и интересные события.',
            preview: 'Это первая новость нашего проекта. Здесь будут появляться анонсы новых квестов...',
            image: ''
        }
    ];
}

function getLocalNews() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try { return JSON.parse(stored); } catch { return getDefaultNews(); }
    }
    return getDefaultNews();
}

function saveLocalNews(news) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(news));
}

function generateLocalNewsId() {
    const news = getLocalNews();
    return news.length > 0 ? Math.max(...news.map(n => n.id)) + 1 : 1;
}

// ============================================================
//  ПУБЛИЧНЫЕ ФУНКЦИИ
// ============================================================

export async function getNews() {
    await waitForSupabase();
    if (isSupabaseReady()) {
        try {
            const client = getSupabaseClient();
            const { data, error } = await client
                .from('news')
                .select('*')
                .order('date', { ascending: false });
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn('⚠️ Ошибка загрузки новостей из Supabase, используем localStorage', e);
            return getLocalNews();
        }
    } else {
        return getLocalNews();
    }
}

export async function getLatestNews() {
    const news = await getNews();
    return news.length > 0 ? news[0] : null;
}

export async function addNews(item) {
    await waitForSupabase();
    if (isSupabaseReady()) {
        try {
            const client = getSupabaseClient();
            const { data, error } = await client
                .from('news')
                .insert([item])
                .select();
            if (error) throw error;
            return data[0];
        } catch (e) {
            console.warn('⚠️ Ошибка добавления новости в Supabase, сохраняем в localStorage', e);
            return addLocalNews(item);
        }
    } else {
        return addLocalNews(item);
    }
}

function addLocalNews(item) {
    const news = getLocalNews();
    const newId = generateLocalNewsId();
    const newItem = { ...item, id: newId, date: new Date().toISOString() };
    news.unshift(newItem);
    saveLocalNews(news);
    return newItem;
}

export async function updateNews(id, updates) {
    await waitForSupabase();
    if (isSupabaseReady()) {
        try {
            const client = getSupabaseClient();
            const { data, error } = await client
                .from('news')
                .update(updates)
                .eq('id', id)
                .select();
            if (error) throw error;
            return data[0];
        } catch (e) {
            console.warn('⚠️ Ошибка обновления новости в Supabase, обновляем в localStorage', e);
            return updateLocalNews(id, updates);
        }
    } else {
        return updateLocalNews(id, updates);
    }
}

function updateLocalNews(id, updates) {
    const news = getLocalNews();
    const index = news.findIndex(n => n.id === id);
    if (index === -1) return null;
    news[index] = { ...news[index], ...updates };
    saveLocalNews(news);
    return news[index];
}

export async function deleteNews(id) {
    await waitForSupabase();
    if (isSupabaseReady()) {
        try {
            const client = getSupabaseClient();
            const { error } = await client
                .from('news')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return true;
        } catch (e) {
            console.warn('⚠️ Ошибка удаления новости из Supabase, удаляем из localStorage', e);
            return deleteLocalNews(id);
        }
    } else {
        return deleteLocalNews(id);
    }
}

function deleteLocalNews(id) {
    let news = getLocalNews();
    news = news.filter(n => n.id !== id);
    saveLocalNews(news);
    return true;
}
