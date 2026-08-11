// ============================================================
//  boxes-data.js — данные боксов (с поддержкой вопросов, видео и аудио)
// ============================================================

const DEFAULT_BOXES = [
    {
        id: 1,
        title: 'Призрак инженера',
        description: 'Городская легенда о пропавшем инженере. Найди 7 улик и раскрой тайну.',
        level: 'средний',
        isPaid: false,
        price: 0,
        clues: [
            {
                type: 'photo',
                value: 'assets/bridge_old.jpg',
                caption: 'Найди место со снимка',
                code: 'BELOV-01',
                question: 'Какой год указан на табличке моста?',
                answer: '1905'
            },
            {
                type: 'text',
                value: 'На старой водонапорной башне есть табличка с датой. Найди её и запиши последние две цифры.',
                caption: '',
                code: 'BELOV-02',
                question: '',
                answer: ''
            },
            {
                type: 'photo',
                value: 'assets/house_mezzanine.jpg',
                caption: 'Найди дом с мезонином',
                code: 'BELOV-03',
                question: '',
                answer: ''
            },
            {
                type: 'text',
                value: 'Подземный переход у Дворца металлургов. На стене есть граффити с цифрой. Какая?',
                caption: '',
                code: 'BELOV-04',
                question: '',
                answer: ''
            },
            {
                type: 'coords',
                value: '59.1180, 37.9000',
                caption: 'Инженер любил сидеть на этом месте',
                code: 'BELOV-05',
                question: '',
                answer: ''
            },
            {
                type: 'photo',
                value: 'assets/factory_old.jpg',
                caption: 'Руины старой фабрики',
                code: 'BELOV-06',
                question: '',
                answer: ''
            },
            {
                type: 'text',
                value: 'Смотровая площадка на Соборной горке. Отсюда видно весь город.',
                caption: '',
                code: 'BELOV-07',
                question: 'Сколько ступеней ведёт к площадке?',
                answer: '12'
            },
            // === НОВЫЕ УЛИКИ С ВИДЕО И АУДИО ===
            {
                type: 'video',
                value: 'assets/video/clue_video.mp4',
                caption: 'Видеозапись с камеры наблюдения у входа в подземелье. В кадре мелькает тень.',
                code: 'BELOV-08',
                question: 'Что было в руках у тени? (одно слово)',
                answer: 'фонарь'
            },
            {
                type: 'audio',
                value: 'assets/audio/clue_audio.mp3',
                caption: 'Аудиозапись голоса, найденная на диктофоне инженера. Он что-то шепчет.',
                code: 'BELOV-09',
                question: 'Какую фразу он повторяет? (три слова)',
                answer: 'я знаю правду'
            }
        ],
        finalCoords: '59.1220, 37.9080'
    }
];

function getBoxes() {
    const stored = localStorage.getItem('boxesData');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return DEFAULT_BOXES;
        }
    }
    return DEFAULT_BOXES;
}

function saveBoxes(boxes) {
    localStorage.setItem('boxesData', JSON.stringify(boxes));
}

function getBoxById(id) {
    const boxes = getBoxes();
    return boxes.find(b => b.id === id);
}

function generateBoxId() {
    const boxes = getBoxes();
    let maxId = 0;
    boxes.forEach(b => { if (b.id > maxId) maxId = b.id; });
    return maxId + 1;
}