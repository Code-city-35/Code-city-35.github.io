const SUPABASE_URL = 'https://gyjdhxknzijscmjfehbm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Iy1IDODIWq4HW24ncRGUdA_dT944nP4';

let supabaseClient = null;
let useSupabase = false;
let clientReady = false;
const readyCallbacks = [];

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
