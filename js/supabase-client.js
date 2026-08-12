// ============================================================
//  supabase-client.js — подключение к Supabase с отладкой на экране
// ============================================================

const SUPABASE_URL = 'https://твой-проект.supabase.co';
const SUPABASE_ANON_KEY = 'твой-аннон-ключ';

let supabaseClient = null;
let useSupabase = false;
let clientReady = false;
const readyCallbacks = [];

// Функция для вывода на экран
function showDebug(msg, isError = false) {
    const el = document.getElementById('debugInfo') || (() => {
        const d = document.createElement('div');
        d.id = 'debugInfo';
        d.style.cssText = 'background:#111;color:#0f0;padding:12px;margin:12px;border:1px solid #ff6b35;font-family:monospace;font-size:13px;white-space:pre-wrap;max-height:200px;overflow:auto;';
        document.body.prepend(d);
        return d;
    })();
    el.innerHTML += `<div style="color:${isError ? '#ff6b6b' : '#6fcf97'}">${msg}</div>`;
    console.log(msg);
}

function initSupabase() {
    showDebug('⏳ Инициализация Supabase...');
    if (clientReady) return;
    if (!SUPABASE_URL || SUPABASE_URL === 'https://твой-проект.supabase.co') {
        showDebug('⚠️ Настройки Supabase не заполнены!', true);
        clientReady = true;
        return;
    }

    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        useSupabase = true;
        clientReady = true;
        showDebug('✅ Supabase подключён (уже загружен)');
        readyCallbacks.forEach(cb => cb());
        return;
    }

    showDebug('📥 Загрузка клиента Supabase...');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        useSupabase = true;
        clientReady = true;
        showDebug('✅ Supabase подключён');
        readyCallbacks.forEach(cb => cb());
    };
    script.onerror = () => {
        showDebug('❌ Не удалось загрузить Supabase!', true);
        clientReady = true;
        readyCallbacks.forEach(cb => cb());
    };
    document.head.appendChild(script);
}

initSupabase();

export function getSupabaseClient() {
    return supabaseClient;
}
export function isSupabaseReady() {
    return useSupabase && clientReady && supabaseClient !== null;
}
export function waitForSupabase() {
    return new Promise((resolve) => {
        if (clientReady) resolve();
        else readyCallbacks.push(resolve);
    });
}
