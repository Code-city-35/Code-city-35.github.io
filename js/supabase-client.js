// ============================================================
//  supabase-client.js — инициализация Supabase
// ============================================================

// ⚠️ ВСТАВЬ СВОИ ДАННЫЕ ИЗ SUPABASE
const SUPABASE_URL = 'https://gyjdhxknzijscmjfehbm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Iy1IDODIWq4HW24ncRGUdA_dT944nP4';

// ============================================================

let supabaseClient = null;
let useSupabase = false;
let clientReady = false;
const readyCallbacks = [];

function initSupabase() {
    if (clientReady) return;
    if (!SUPABASE_URL || SUPABASE_URL === 'https://твой-проект.supabase.co' || !SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'твой-аннон-ключ') {
        console.warn('⚠️ Настройки Supabase не заполнены, используем localStorage');
        clientReady = true;
        return;
    }

    if (typeof supabase !== 'undefined') {
        const { createClient } = supabase;
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        useSupabase = true;
        clientReady = true;
        console.log('✅ Supabase подключён (уже загружен)');
        readyCallbacks.forEach(cb => cb());
        return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = () => {
        const { createClient } = supabase;
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        useSupabase = true;
        clientReady = true;
        console.log('✅ Supabase подключён');
        readyCallbacks.forEach(cb => cb());
    };
    script.onerror = () => {
        console.warn('⚠️ Не удалось загрузить Supabase, используем localStorage');
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
        if (clientReady) {
            resolve();
        } else {
            readyCallbacks.push(resolve);
        }
    });
}
