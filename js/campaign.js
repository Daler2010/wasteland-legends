// ===== Сюжетная кампания: карты по цепочке, этапы и волны, спасение героев =====
// Daler начинает один. Каждая карта: этап 1 (две волны → ключ → ворота), этап 2 (две волны → страж с ключом → ворота),
// этап 3 (босс и клетка с пленником). Победа открывает следующую карту, нового героя и постройку в лагере.

const CHAIN = ['desert', 'factory', 'forest', 'metro', 'japan', 'gates'];
// после какой по счёту победы герой в отряде и постройка в лагере
const HERO_STEP = { daler: 0, stimme: 1, babaduk: 2, maga: 3, bilol: 4, jaha: 4, akemi: 5, chonguk: 5 };
const ZONE_STEP = { hero: 0, exit: 0, desert: 0, factory: 1, shop: 1, story: 1, forest: 2, talent: 2, train: 2,
  metro: 3, daily: 3, ach: 3, japan: 4, rush: 4, gates: 5 };
const STEP_NEWS = ['', 'Лавка торговца и Летопись', 'Додзё и Тренировочная площадка', 'Алтарь испытаний и Зал славы',
  'Пещера боссов', 'Врата миров', 'сложность «Кошмар» и бесконечный режим'];
const QUESTS = [
  'Задание: иди в портал «Радиоактивная пустыня» — спаси STIMME',
  'Задание: портал «Заброшенный завод» — спаси BABADUK',
  'Задание: портал «Мёртвый лес» — спаси Maga',
  'Задание: портал «Заброшенное метро» — спаси BILOL и JAHA',
  'Задание: тории «Остров сакуры» — спаси ISOSHA и ISKA',
  'Задание: «Врата миров» — победи ALANIATOR3000',
  'Сюжет пройден! Попробуй «Кошмар», Пещеру боссов и испытание дня',
];
// чем дальше карта, тем крепче враги (первая — мягкая, для новичка без улучшений)
const TIER = [{ hp: 0.8, dmg: 0.85, rate: 0.85 }, { hp: 0.95, dmg: 0.95, rate: 0.95 }, { hp: 1.1, dmg: 1.05, rate: 1 },
  { hp: 1.25, dmg: 1.15, rate: 1.05 }, { hp: 1.4, dmg: 1.25, rate: 1.1 }, { hp: 1.6, dmg: 1.4, rate: 1.15 }];

// ---------------------------------------------------------------- ТЕКСТ СЮЖЕТА
// who: '@' — герой, которым сейчас играют
Story.INTRO_SCENE = [
  { who: 'daler', side: 'right', text: 'Восемь нас было у этого костра. Восемь друзей — отряд «Легенды пустоши». Этой ночью в дозоре стоял я.' },
  { who: 'alan',  side: 'left',  text: 'Бу-га-га! Я — ALANIATOR3000, отличник тёмных наук! Вы не взяли меня в отряд — значит, отряда у вас больше не будет!' },
  { who: 'daler', side: 'right', text: 'Пока я бежал к лагерю, он утащил всех семерых. У костра остались только следы и чей-то недоеденный бутерброд.' },
  { who: 'alan',  side: 'left',  text: 'Каждого я раздал своим чудищам. Клетки заперты, ключи — у стражей. А сам я жду за Вратами миров. Попробуй дойти, эльф!' },
  { who: 'daler', side: 'right', text: 'Дойду. Следы STIMME ведут в пустыню — портал у лагеря уже светится. Начну с неё.' },
];
Story.ENDING_SCENE = [
  { who: 'alan',    side: 'left',  text: 'Н-не может быть... У меня же пятёрка по тёмной алхимии! Мама узнает — убьёт...' },
  { who: 'babaduk', side: 'right', text: 'Ты похитил семерых героев. Дневник на стол, ALANIATOR.' },
  { who: 'alan',    side: 'left',  text: 'Я просто хотел в отряд! А вы сказали: «Сначала подрасти»...' },
  { who: 'stimme',  side: 'right', text: 'Мог бы просто попросить ещё раз. Без клеток и чудовищ.' },
  { who: 'daler',   side: 'left',  text: 'Ладно. Будешь носить рюкзаки и чистить котёл. Испытательный срок — год.' },
  { who: 'maga',    side: 'right', text: 'Му-ха! А пустошь ещё покажет зубы: открылись сложность «Кошмар» и бесконечный режим. Кто со мной?' },
];
Object.assign(Story.HERO, {
  daler:   { taunt: 'Вот ты где. Отпирай клетку — или я открою её стрелой.', reply: 'Значит, по-плохому. Я всё равно хотел размяться.' },
  stimme:  { taunt: 'Отдай пленников по-хорошему. Я умею просить громко.', reply: 'Тогда слушай внимательно — это последняя песня, которую ты услышишь.' },
  babaduk: { taunt: 'Именем отряда — отпусти моих друзей. Сдавайся или защищайся!', reply: 'Хороший ответ. Честный бой — лучшее, что есть в этой пустоши.' },
  maga:    { taunt: 'Му-ха! Наконец-то противник моего размера. Ключи — сюда, или рога — туда.', reply: 'Тебя я уложу за двадцать ударов. Считай!' },
});
Object.assign(Story.BOSS, {
  scorpion: 'Кш-ш-ш... Певчая птичка в клетке — подарок хозяина. Хочешь её забрать? Сначала пройди мимо моего жала.',
  robot:    'ОБЪЕКТ «РЫЦАРЬ» ПОМЕЩЁН НА ХРАНЕНИЕ. ПРИКАЗ ALANIATOR3000: НАРУШИТЕЛЕЙ — ПОД ПРЕСС.',
  giant:    'Ма-а-аленькие... Бычок мой. Игрушка моя. И вы теперь мои игрушки.',
  queen:    'Два вкусных кокона зреют в моём гнезде. Хозяин велел стеречь. А вы станете третьим и четвёртым.',
  oni:      'ГР-Р-РА! Этот остров — мой! Двое ваших уже в клетке, и для остальных место найдётся!',
  alan:     'Я — ALANIATOR3000, отличник тёмных наук! Вы не взяли меня в отряд — значит, отряда не будет! Контрольная отменяется НАВСЕГДА!',
});

// intro — при первом входе на карту, mid — на втором этапе, win — после первой победы над боссом
const MAP_STORY = {
  desert: { title: 'Глава 1. Голос в песках',
    intro: [
      { who: 'daler', side: 'right', text: 'Следы ведут в пески. STIMME где-то здесь — ветер доносит эхо её голоса.' },
      { who: 'daler', side: 'right', text: 'План простой: отбить волны тварей, забрать ключ и пройти в ворота. И так — до самого логова.' }],
    mid: [
      { who: 'stimme', side: 'left',  text: 'Daler! Я в клетке у скорпиона! Ключ от ворот — у стража, здоровенного громилы!' },
      { who: 'daler',  side: 'right', text: 'Держись. Я уже рядом.' }],
    win: [
      { who: 'stimme', side: 'left',  text: 'Свобода! Ещё час в этой клетке — и я спела бы скорпиону колыбельную. Навсегда.' },
      { who: 'daler',  side: 'right', text: 'Рад, что ты цела. Остальных он раздал другим чудищам.' },
      { who: 'stimme', side: 'left',  text: 'BABADUK на заводе: я слышала, как робот тащил его и гремел. Идём за братом!' },
      { who: 'daler',  side: 'right', text: 'В лагерь пришёл торговец — у него улучшения за монеты. Заглянем к нему перед дорогой.' }] },
  factory: { title: 'Глава 2. Рыцарь под прессом',
    intro: [
      { who: '@',      side: 'right', text: 'Завод гудит, как улей. Где-то в цехах заперт BABADUK.' },
      { who: 'stimme', side: 'left',  text: 'Брат упрямый. Наверняка уже пробует сломать клетку лбом.' }],
    mid: [
      { who: 'babaduk', side: 'left',  text: 'Эй! Я в прессовочном цехе! Рыцарь не зовёт на помощь... но клетка крепкая!' },
      { who: '@',       side: 'right', text: 'Уже идём. Осталось снять ключ со стража.' }],
    win: [
      { who: 'babaduk', side: 'left',  text: 'Клянусь мечом, я почти выбрался сам! ...Ладно. Спасибо.' },
      { who: 'stimme',  side: 'right', text: 'Ты застрял шлемом в решётке, братик.' },
      { who: 'babaduk', side: 'left',  text: 'Это был манёвр. Maga утащили в Мёртвый лес — великан нёс его под мышкой, как щенка.' },
      { who: 'daler',   side: 'right', text: 'В лагере открылись додзё и тренировочная площадка. Подготовимся — и в лес.' }] },
  forest: { title: 'Глава 3. Игрушка великана',
    intro: [
      { who: '@',       side: 'right', text: 'Мёртвый лес. Тихо так, что слышно, как скрипят деревья.' },
      { who: 'babaduk', side: 'left',  text: 'Maga где-то в чаще. Ищите самое громкое «Му-ха!».' }],
    mid: [
      { who: 'maga', side: 'left',  text: 'МУ-ХА! Кто там шумит? Вытащите меня — великан играет мной в куклы!' },
      { who: '@',    side: 'right', text: 'Потерпи, гладиатор. Ключ почти у нас.' }],
    win: [
      { who: 'maga',   side: 'left',  text: 'Му-ха! Свобода! Двадцать зомби я бы раскидал, но великан сел на клетку сверху.' },
      { who: 'daler',  side: 'right', text: 'Кого ещё ты видел?' },
      { who: 'maga',   side: 'left',  text: 'Ниндзя BILOL и короля JAHA уволокли под землю, в метро. Слизь по колено, бр-р.' },
      { who: 'stimme', side: 'right', text: 'У лагеря зажёгся Алтарь испытаний и открылся Зал славы. А потом — вниз.' }] },
  metro: { title: 'Глава 4. Король в коконе',
    intro: [
      { who: '@',    side: 'right', text: 'Метро. Темно, сыро, и что-то чавкает.' },
      { who: 'maga', side: 'left',  text: 'Матка слизней лепит из пленников коконы. Поторопимся, пока король не стал желе.' }],
    mid: [
      { who: 'jaha',  side: 'left',  text: 'Подданные! Ваш король приклеен к потолку. Это унизительно. Поспешите!' },
      { who: 'bilol', side: 'right', text: '...Я мог бы уйти сам. Но король храпит, а бросать его нельзя.' }],
    win: [
      { who: 'jaha',  side: 'left',  text: 'Король благодарит вас. И никогда, слышите, никогда не вспоминайте, что он висел вверх ногами.' },
      { who: 'bilol', side: 'right', text: '...Спасибо. Слизь не отстирывается.' },
      { who: 'jaha',  side: 'left',  text: 'ISOSHA и ISKA увезли на Остров сакуры. Там хозяйничает демон Они.' },
      { who: 'bilol', side: 'right', text: 'У лагеря открылась Пещера боссов. Там можно потренироваться на тех, кого уже встречал.' }] },
  japan: { title: 'Глава 5. Песня духов',
    intro: [
      { who: '@',     side: 'right', text: 'Сакура посреди пустоши... Красиво. И подозрительно тихо.' },
      { who: 'bilol', side: 'left',  text: 'Они выпил духов острова. ISOSHA и ISKA — в его храме.' }],
    mid: [
      { who: 'chonguk', side: 'left',  text: 'Эй, публика! Клетка — не лучшая сцена, но я держусь. ISOSHA уже пилит прутья!' },
      { who: 'akemi',   side: 'right', text: 'Кунаем, а не шпилькой, как он всем рассказывает. Ключ у стража — торопитесь.' }],
    win: [
      { who: 'akemi',   side: 'left',  text: 'Он пал. Духи острова снова поют — слышите?' },
      { who: 'chonguk', side: 'right', text: 'Слышу. Под такую музыку я готов махать катаной хоть до самых Врат.' },
      { who: 'daler',   side: 'left',  text: 'Все семеро свободны. Остался тот, кто всё это устроил.' },
      { who: 'babaduk', side: 'right', text: 'Врата миров открыты. ALANIATOR3000 ждёт — не будем заставлять его скучать.' }] },
  gates: { title: 'Глава 6. Врата миров',
    intro: [
      { who: 'daler', side: 'right', text: 'Врата миров. Вся восьмёрка снова вместе — пора вернуть должок.' },
      { who: 'maga',  side: 'left',  text: 'Му-ха! Чур, я бью первым!' }],
    mid: [
      { who: 'alan', side: 'left',  text: 'Вы прошли моих стражей?! Так нечестно! Я ещё не сделал уроки по злодейству!' },
      { who: '@',    side: 'right', text: 'Сдавай тетрадь, отличник. Мы идём.' }],
    win: null },
};

// главы в Летописи
Story.CHAPTERS = [{ id: 'prolog', title: 'Пролог. Ночь у костра', hint: '', open: () => true, scene: Story.INTRO_SCENE }];
CHAIN.forEach((id, i) => {
  const M = MAP_STORY[id];
  Story.CHAPTERS.push({ id: 'in_' + id, title: M.title, hint: 'войди на карту по сюжету', open: () => Campaign.s().step > i || !!Campaign.s().seenIn[id], scene: M.intro.concat(M.mid) });
  if (M.win) Story.CHAPTERS.push({ id: 'win_' + id, title: M.title.split('.')[0] + '. Спасение', hint: 'победи босса этой карты', open: () => Campaign.s().step > i, scene: M.win });
});
Story.CHAPTERS.push({ id: 'ending', title: 'Финал. Новенький в отряде', hint: 'победи ALANIATOR3000', open: () => Save.data.endingSeen, scene: Story.ENDING_SCENE });
TALK.daler[0] = 'Семерых утащили, пока я стоял в дозоре. Больше я такого не допущу.';

// У костра спасённые герои говорят о том, что сейчас происходит в истории (первая реплика при подходе)
const CAMP_TALK = [
  {},
  { stimme: 'Брат на заводе, я слышала лязг робота. Портал уже открыт — поспешим?',
    daler: 'Одну вернули. Осталось шестеро. Следующий портал — завод.' },
  { stimme: 'Maga в Мёртвом лесу. Он большой, но без нас ему там одиноко.',
    babaduk: 'В клетке я считал заклёпки на прессе. Их четыреста двенадцать. Больше туда не хочу.',
    daler: 'Великан унёс Maga в лес. Загляни в додзё — таланты пригодятся.' },
  { stimme: 'Под землёй сыро и темно. Зато там хорошее эхо.',
    babaduk: 'Король и ниндзя в метро. Матка слизней лепит из пленников коконы — надо торопиться.',
    maga: 'Му-ха! Великан кормил меня шишками. ШИШКАМИ! В метро я это кому-нибудь припомню.',
    daler: 'Дальше — метро. Там BILOL и JAHA.' },
  { stimme: 'Остров сакуры... Говорят, там красиво. Было — пока не пришёл Они.',
    babaduk: 'Осталось двое: ISOSHA и ISKA. Демон держит их в храме.',
    maga: 'Демон Они? Рога у меня не хуже. Посмотрим, чьи крепче.',
    jaha: 'Висеть в коконе было унизительно. Зато выспался. Теперь — на остров, за остальными.',
    bilol: '...Следы Они ведут к тории на востоке лагеря. Я проверил.',
    daler: 'Двое ещё в плену. Тории на востоке ведут на Остров сакуры.' },
  { stimme: 'Все семеро свободны. Остался мальчишка, который всё это начал.',
    babaduk: 'Врата миров открыты. ALANIATOR3000 ждёт за ними — и мы придём все вместе.',
    maga: 'Му-ха! Отличник тёмных наук? Сейчас поставим ему двойку.',
    jaha: 'Король лично объявит этому школьнику выговор. С занесением.',
    bilol: '...У Врат три этапа стражи. Бери лучшего бойца.',
    akemi: 'Я распилила бы ту клетку сама. Через недельку. Спасибо, что не пришлось.',
    chonguk: 'В клетке была ужасная акустика. У Врат я наконец спою как следует.',
    daler: 'Вся восьмёрка в сборе. Пора к Вратам.' },
  { stimme: 'ALANIATOR чистит котёл и напевает. Кажется, ему у нас нравится.',
    babaduk: 'Новенький спросил, можно ли ему меч. Я сказал: сначала научись мыть посуду.',
    maga: 'Му-ха! На «Кошмаре» враги злее. Вот это я понимаю — разминка.',
    jaha: 'Королевство вернуть труднее, чем друзей. Но начало положено.',
    bilol: '...Тихо. Непривычно. Сходим в Пещеру боссов?',
    akemi: 'Остров снова цветёт. Загляни туда ещё раз — просто посмотреть.',
    chonguk: 'Я написал песню про наш поход. Двенадцать куплетов, и во всех — я.',
    daler: 'Отряд цел. Значит, дозор прошёл не зря.' },
];
const _campTalk = heroTalk;
heroTalk = function (c, prev, first) {
  const line = (CAMP_TALK[Math.min(Campaign.s().step, CAMP_TALK.length - 1)] || {})[c.id];
  return first && line ? line : _campTalk(c, prev === line ? null : prev, false);
};

const REVIVE_COST = 50;
const hexDark = (hex, k) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');

// ---------------------------------------------------------------- ПРОГРЕСС КАМПАНИИ
const Campaign = {
  s() { return Save.data.story || (Save.data.story = { step: 0, seen: 0, seenIn: {} }); },
  done() { return this.s().step >= CHAIN.length; },
  heroOpen(id) { return this.s().step >= (HERO_STEP[id] || 0); },

  // Первый вход на сюжетную карту — короткая сцена
  enterMap(id, go) {
    const S = this.s();
    if (CHAIN[S.step] !== id || S.seenIn[id]) return go();
    S.seenIn[id] = true; Save.store();
    Game.state = 'menu';
    Story.scene(MAP_STORY[id].intro, go, Save.data.hero);
  },

  // В лагере видны только уже открытые постройки и порталы
  apply() {
    const H = Hub, S = this.s();
    if (!H.allZones) { H.allZones = H.zones; H.allSolids = H.solids; }
    H.zones = H.allZones.filter(z => (ZONE_STEP[z.id] || 0) <= S.step);
    const vis = new Set(H.zones.map(z => z.id));
    H.solids = H.allSolids.filter(s => !s.zid || vis.has(s.zid));
    H.labels.innerHTML = H.zones.map((z, i) => `<div class="hub-label" data-i="${i}">${z.name}</div>`).join('');
    H.near = null;
    $('hub-quest').textContent = QUESTS[Math.min(S.step, QUESTS.length - 1)];
  },

  // Карта пути: вся цепочка карт, что пройдено и кто ещё в плену
  showPath() {
    const S = this.s();
    $('story-title').textContent = 'Путь к Вратам';
    $('story-text').innerHTML = CHAIN.map((id, i) => {
      const l = LOCATIONS.find(x => x.id === id), done = S.step > i, now = S.step === i;
      const who = CHARACTERS.filter(c => HERO_STEP[c.id] === i + 1), names = who.map(c => c.name).join(' и ');
      const text = done ? 'Пройдено. ' + (names ? 'В отряде: ' + names : 'ALANIATOR3000 повержен')
        : now ? 'Босс: ' + BOSSES[l.boss].name + (names ? ' · в плену: ' + names : ' · последний бой')
        : 'Закрыто. Сначала пройди предыдущую карту';
      return `<div class="path-row ${done ? 'done' : now ? 'now' : 'lock'}">
        <span class="path-mark">${done ? '✔' : now ? '▶' : i + 1}</span>
        <div class="path-info"><div class="card-name">${l.name}</div><div class="muted">${text}</div></div>
        <div class="path-who">${who.map(c => `<img src="${iconURL(c.sprite, 48)}" alt="" class="${done ? '' : 'caged'}">`).join('')}</div>
      </div>`;
    }).join('');
    const b = $('story-next');
    b.style.display = ''; b.textContent = 'Назад';
    b.onclick = () => { UI.click(); UI.showMenu(); };
    UI.show('story');
  },

  // Награда за каждую впервые пройденную карту: один из трёх подарков на выбор
  reward(then) {
    const S = this.s(), d = Save.data, hero = CHARACTERS.find(c => c.id === d.hero) || CHARACTERS[0];
    const gifts = [
      { name: 'Мешок монет', desc: '+150 монет — на улучшения в лавке', icon: 'coin', take: () => { d.coins += 150; } },
      { name: 'Свиток мастерства', desc: '+8 очков талантов герою ' + hero.name + ' (тратятся в додзё)', icon: 'i_star',
        take: () => { const t = d.talents[hero.id] || (d.talents[hero.id] = { pts: 0, ranks: {} }); t.pts += 8; } },
      { name: 'Талисман отряда', desc: '+6 к здоровью всех героев — навсегда', icon: 'heart', take: () => { S.hp = (S.hp || 0) + 6; } },
    ];
    Game.state = 'menu';
    $('story-title').textContent = 'Награда за карту';
    $('story-text').innerHTML = '<p>Спасённые друзья принесли подарки. Выбери один:</p>' + gifts.map((g, i) =>
      `<button class="btn gift" data-i="${i}"><img src="${iconURL(g.icon, 32)}" alt=""><span><b>${g.name}</b><br><small>${g.desc}</small></span></button>`).join('');
    $('story-next').style.display = 'none';
    $('story-text').querySelectorAll('button').forEach(b => {
      b.onclick = () => {
        gifts[+b.dataset.i].take();
        S.rewarded = S.step; Save.store();
        Sound.init(); Sound.sfx('chest');
        $('story-next').style.display = '';
        then();
      };
    });
    UI.show('story');
  },

  // Вторая жизнь: один раз за забег можно встать за монеты
  askRevive(R) {
    R.revived = true;
    Game.state = 'levelup';
    UI.showLevelUp([{ kind: 'revive' }, { kind: 'giveup' }], 'ТЫ ПАЛ... ВСТАТЬ СНОВА?');
  },
  answerRevive(yes) {
    const R = Game.run, p = R.p;
    if (yes) {
      const fromRun = Math.min(R.coins, REVIVE_COST);
      R.coins -= fromRun; Save.data.coins -= REVIVE_COST - fromRun; Save.store();
      R.ending = false;
      p.hp = Math.ceil(p.maxHp * 0.5); p.invT = 3;
      R.effects.push({ type: 'ring', x: p.x, y: p.y, r: 4, maxR: 110, t: 0, dur: 0.5, dmg: 30, kb: 320, c: '#ffcd75', hit: new Set() });
      R.flashT = 0.25; R.ebullets = [];
      burst(R, p.x, p.y, 30, '#ffcd75');
      Sound.startMusic(R.boss && !R.boss.dead ? 'boss' : R.loc.music);
      Sound.sfx('levelup');
      UI.banner('ВТОРАЯ ЖИЗНЬ!', 2);
    }
    Game.state = 'playing';
    UI.show(null);
  },

  init() {
    const d = Save.data;
    // старое сохранение: сюжет начинается заново, монеты, улучшения, таланты и достижения остаются
    if (!d.story) {
      d.story = { step: 0, seen: 0, seenIn: {} };
      d.cleared = {}; d.clearedN = {}; d.chap = {}; d.talked = {};
      d.introSeen = false; d.endingSeen = false; d.nightmare = false; d.hero = 'daler';
      Save.store();
    }

    // настройки: начать сюжет заново (монеты и улучшения остаются); второе нажатие подтверждает
    const again = $('set-newstory');
    again.onclick = () => {
      UI.click();
      if (!again.dataset.sure) { again.dataset.sure = '1'; again.textContent = 'Точно? Нажми ещё раз'; return; }
      d.story = null; Save.store();
      location.reload();
    };

    // сюжетный забег идёт по этапам, а не по таймеру
    const start = Game.start.bind(Game);
    Game.start = (c, l, o) => {
      start(c, l, o);
      const R = Game.run;
      if (R && !R.rush && !R.daily && !R.training) Stage.begin(R);
      // талисман отряда (награда за карты) прибавляет здоровье во всех режимах
      if (R && this.s().hp) { R.p.baseHp += this.s().hp; recalcStats(); R.p.hp = R.p.maxHp; }
    };
    // вторая жизнь: свои карточки на экране выбора
    const info = UI.optionInfo.bind(UI);
    UI.optionInfo = o => o.kind === 'revive' ? { icon: 'heart', name: 'Вторая жизнь', tag: REVIVE_COST + ' монет', desc: 'Встать с половиной здоровья и отбросить врагов. Один раз за забег', isNew: true }
      : o.kind === 'giveup' ? { icon: 'i_skull', name: 'Сдаться', tag: '', desc: 'Вернуться в лагерь. Карта начнётся с первого этапа' } : info(o);
    const choose = Game.choose.bind(Game);
    Game.choose = o => { if (o && (o.kind === 'revive' || o.kind === 'giveup')) { if (Game.state === 'levelup') this.answerRevive(o.kind === 'revive'); } else choose(o); };
    $('hub-quest').onclick = () => { if (Game.state === 'hub') { UI.click(); Game.state = 'menu'; this.showPath(); } };
    const endless = Game.continueEndless.bind(Game);
    Game.continueEndless = () => {
      const R = Game.run;
      if (R && R.won && R.st) { R.st = null; R.t = Math.max(R.t, RUN_TIME); } // дальше — обычный поток врагов
      endless();
    };

    // лагерь: скрытые постройки, задание и стрелка к цели
    const enter = Hub.enter.bind(Hub);
    Hub.enter = () => {
      const S = this.s();
      if ((S.rewarded || 0) < S.step) return this.reward(() => Hub.enter()); // сначала подарок за пройденную карту
      this.apply();
      enter();
      if (S.seen < S.step) {
        S.seen = S.step; Save.store();
        UI.banner('ОТКРЫТО: ' + STEP_NEWS[S.step], 4);
        Sound.sfx('chest');
      }
    };
    const render = Hub.render.bind(Hub);
    Hub.render = (ctx, W, H) => {
      render(ctx, W, H);
      const z = Hub.zones.find(q => q.id === CHAIN[this.s().step]), p = Hub.p;
      if (!z || Hub.bigMap) return;
      const dx = z.x - p.x, dy = z.y - 6 - p.y, dist = Math.hypot(dx, dy);
      if (dist < 60) return;
      // пунктирная стрелка от героя к сюжетному порталу
      const ox = Math.round(p.x - Game.camX), oy = Math.round(p.y - Game.camY), ph = (Hub.t * 2) % 1;
      for (let i = 0; i < 3; i++) {
        const r = 22 + (i + ph) * 7, s = i === 2 ? 3 : 2;
        ctx.fillStyle = '#14162a'; ctx.fillRect(Math.round(ox + dx / dist * r) - 1, Math.round(oy + dy / dist * r) - 1, s + 2, s + 2);
        ctx.fillStyle = '#ffcd75'; ctx.fillRect(Math.round(ox + dx / dist * r), Math.round(oy + dy / dist * r), s, s);
      }
    };

    // главное меню: вместо осколков — сколько друзей спасено
    const showMenu = UI.showMenu.bind(UI);
    UI.showMenu = () => {
      showMenu();
      const n = CHARACTERS.filter(c => this.heroOpen(c.id)).length - 1;
      $('shards').textContent = this.done() ? 'Сюжет пройден · отряд в сборе ★' : 'Спасено друзей: ' + n + ' из ' + (CHARACTERS.length - 1);
    };
    UI.showMenu();

    // экран итогов: что открылось; бесконечный режим — только после финала
    const showEnd = UI.showEnd.bind(UI);
    UI.showEnd = R => {
      showEnd(R);
      if (!this.done()) $('btn-endless').classList.add('hidden');
      let row = '';
      if (R.campNew) row = `<div class="ach-row done"><span class="mark">★</span><div class="shop-info"><div class="card-name">В лагере открыто: ${STEP_NEWS[this.s().step]}</div><div class="muted">Стрелка в лагере покажет, куда идти дальше</div></div></div>`;
      else if (R.st && !R.won) row = `<div class="ach-row"><span class="mark">!</span><div class="shop-info"><div class="card-name">Дошёл до этапа ${R.st.n} из 3</div><div class="muted">Монеты остаются у тебя. Купи улучшения в лагере и попробуй снова</div></div></div>`;
      if (row) $('end-ach').insertAdjacentHTML('afterbegin', row);
      R.campNew = false;
    };
  },
};

// первая победа на очередной карте цепочки двигает сюжет
const _campFinish = finishRun;
finishRun = function (R) {
  const S = Campaign.s();
  if (R.st && R.won && CHAIN[S.step] === R.loc.id) {
    S.step++;
    R.campNew = true;
    R.recruited = CHARACTERS.filter(c => HERO_STEP[c.id] === S.step).map(c => c.id);
    const win = MAP_STORY[R.loc.id].win;
    if (win) R.extraScenes = [win];
  }
  _campFinish(R);
};

// ---------------------------------------------------------------- ЭТАПЫ И ВОЛНЫ
// vt — «время сложности» в начале и конце волны (как секунды старого 10-минутного забега), dur — сколько секунд идут враги
const Stage = {
  WAVES: [{ vt: [20, 80], dur: 40 }, { vt: [100, 200], dur: 50 }, { vt: [220, 320], dur: 55 }, { vt: [340, 460], dur: 60 }],

  // Задания по картам: [этап 1, этап 2], в каждом по два задания подряд.
  // kill — перебить волну, survive — продержаться, zone — зажечь сигнальный костёр, стоя в кругу
  PLAN: {
    desert:  [['kill', 'kill'], ['kill', 'survive']],
    factory: [['kill', 'zone'], ['kill', 'survive']],
    forest:  [['kill', 'survive'], ['zone', 'kill']],
    metro:   [['zone', 'kill'], ['survive', 'zone']],
    japan:   [['kill', 'zone'], ['survive', 'kill']],
    gates:   [['survive', 'zone'], ['kill', 'survive']],
  },
  KIND_NAME: { kill: 'идёт волна врагов', survive: 'надо будет продержаться', zone: 'надо зажечь сигнальный костёр' },

  begin(R) {
    const T = TIER[Math.max(0, CHAIN.indexOf(R.loc.id))];
    R.diff.hp *= T.hp; R.diff.dmg *= T.dmg; R.diff.rate *= T.rate;
    R.p.xpMul *= 1.5; // забег короче старого 10-минутного — сборка должна успеть раскрыться
    R.st = { n: 1, wave: -1, phase: 'rest', next: 'wave', t: 3, wt: 0, vt: 20, left: 0, acc: 0, elite: true, evT: 50,
      lastX: 0, lastY: 0, target: null, guard: null, alive: 0, kind: 'kill', time: 0, zone: null, carry: false, cage: null,
      plan: this.PLAN[R.loc.id] || this.PLAN.desert, base: R.loc };
  },
  // Каждый этап выглядит по-своему: на втором грунты меняются местами и препятствий больше,
  // логово босса — тёмная пустая арена с багровым светом
  variant(base, n) {
    const key = base.id + '#' + n, T = TILES[base.id], A = base.ambient;
    if (!TILES[key]) {
      const dk = g => ({ style: g.style, base: hexDark(g.base, 0.62), dark: hexDark(g.dark, 0.62), light: hexDark(g.light, 0.62), accent: '#b13e53' });
      TILES[key] = n === 2 ? { a: T.b, b: T.a } : { a: richTiles(dk(base.ground2), base.seed + 7), b: richTiles(dk(base.ground), base.seed + 8) };
    }
    const v = Object.create(base);
    v.tiles = key;
    if (n === 2) { v.density = base.density * 1.35; v.ambient = Object.assign({}, A, { tint: 'rgba(255,150,80,0.07)' }); }
    else { v.density = base.density * 0.45; v.ambient = Object.assign({}, A, { dark: Math.max(A.dark || 0, 0.38), color: A.color || '#12060c', tint: 'rgba(200,40,70,0.08)' }); }
    return v;
  },
  // какое задание будет следующим (для подсказки в передышке)
  nextKind(st) { const w = st.wave + 1; return st.plan[w >> 1][w % 2]; },

  tick(R, dt) {
    const st = R.st;
    updateEvent(R, dt);
    let alive = 0;
    for (const e of R.enemies) if (!e.dead && !e.boss) alive++;
    st.alive = alive;

    if (st.phase === 'rest') {
      st.t -= dt;
      if (st.t > 0) return;
      if (st.next === 'boss') { st.phase = 'boss'; bossList(R).forEach(id => spawnBoss(R, id, 1.2)); }
      else this.startWave(R);
    } else if (st.phase === 'wave') {
      const W = this.WAVES[st.wave];
      st.wt += dt;
      const q = Math.min(1, st.wt / W.dur);
      st.vt = W.vt[0] + (W.vt[1] - W.vt[0]) * q;
      if (st.kind !== 'kill') {
        // «продержись» и «костёр»: враги идут без счёта, пока задание не выполнено
        const cap = Math.min(280, (25 + st.vt * 0.42) * R.diff.rate);
        st.acc += (0.7 + st.vt / 58) * R.diff.rate * (st.kind === 'zone' ? 0.85 : 1.1) * dt;
        while (st.acc >= 1) { st.acc -= 1; if (alive < cap) { alive++; spawnAround(R, pickEnemyType(R)); } }
        if (!st.elite && q > 0.5) { st.elite = true; spawnElite(R); }
        let done = false;
        if (st.kind === 'survive') { st.time -= dt; done = st.time <= 0; }
        else {
          const z = st.zone, inside = Math.hypot(z.k.x - R.p.x, z.k.y - R.p.y) < z.r;
          z.q = clamp(z.q + (inside ? dt / 22 : -dt / 90), 0, 1);
          z.inside = inside;
          z.k.spr = 'h_fire' + (Math.floor(R.t * 8) % 2);
          done = z.q >= 1;
          if (done) { z.k.done = true; st.zone = null; st.target = null; burst(R, z.k.x, z.k.y, 40, '#ffcd75'); R.flashT = 0.25; }
        }
        if (done) { this.scatter(R); this.waveCleared(R); }
      } else if (st.left > 0) {
        const cap = Math.min(280, (25 + st.vt * 0.42) * R.diff.rate);
        st.acc += (0.7 + st.vt / 58) * R.diff.rate * dt;
        while (st.acc >= 1 && st.left > 0) {
          if (alive >= cap) { st.acc = 1; break; }
          st.acc -= 1; st.left--; alive++;
          spawnAround(R, pickEnemyType(R));
        }
        if (!st.elite && q > 0.5) { st.elite = true; spawnElite(R); }
        // события (сундук, торговец, буря) — только в разгар волны
        st.evT -= dt;
        if (st.evT <= 0) { st.evT = 70; startEvent(R); }
      } else if (alive === 0) this.waveCleared(R);
      else if (alive <= 6) {
        // недобитые сами бегут к герою, чтобы волну не пришлось заканчивать погоней
        for (const e of R.enemies) if (!e.dead && !e.hunt) { e.hunt = true; e.speed = Math.max(e.speed * 1.5, 45); }
        // застрявшие за препятствием или убежавшие не должны держать волну: через 15 секунд они гибнут сами
        st.huntT += dt;
        if (st.huntT > 15) for (const e of R.enemies.slice()) if (!e.dead && !e.boss) killEnemy(R, e);
      }
    } else if (st.phase === 'key' || st.phase === 'gate') {
      // ключ и ворота берутся с запасом по расстоянию; ключ, до которого долго не дойти, прилетает сам
      const k = st.target, d = Math.hypot(k.x - R.p.x, k.y - R.p.y);
      st.t += dt;
      if (st.phase === 'gate' && st.carry) this.trickle(R, dt, (0.7 + st.vt / 58) * 0.5, 60); // ключ несём под натиском
      if (!k.done && (d < 22 || (st.phase === 'key' && st.t > 12))) collect(R, k);
    } else if (st.phase === 'guard') {
      if (st.guard.dead) this.dropKey(R, st.guard.x, st.guard.y);
      else this.trickle(R, dt, 0.8, 25);
    } else if (st.phase === 'boss') {
      this.trickle(R, dt, 1, 40); // в логове босса врагов немного
    }
  },

  trickle(R, dt, rate, cap) {
    const st = R.st;
    st.acc += rate * R.diff.rate * dt;
    while (st.acc >= 1) { st.acc -= 1; if (st.alive < cap) spawnAround(R, pickEnemyType(R)); }
  },

  startWave(R) {
    const st = R.st;
    st.wave++;
    const W = this.WAVES[st.wave], mid = (W.vt[0] + W.vt[1]) / 2;
    st.phase = 'wave'; st.wt = 0; st.vt = W.vt[0]; st.acc = 0; st.huntT = 0;
    st.kind = st.plan[st.wave >> 1][st.wave % 2];
    st.left = st.kind === 'kill' ? Math.round((0.7 + mid / 58) * R.diff.rate * W.dur) : 0;
    st.elite = st.wave === 0; // в самом первом задании элиты нет
    // задание начинается с кольца врагов вокруг героя
    const type = weightedPick({ zombie: R.loc.weights.zombie, rat: R.loc.weights.rat }), n = 8 + st.wave * 5;
    for (let i = 0; i < n; i++) spawnAround(R, type, i / n * Math.PI * 2);
    if (st.kind === 'survive') {
      st.time = W.dur * 0.8;
      UI.banner('ПРОДЕРЖИСЬ ' + Math.round(st.time) + ' СЕКУНД!', 2.2);
    } else if (st.kind === 'zone') {
      // костёр ставим рядом, на свободном месте
      const p = R.p, k = { type: 'beacon', spr: 'h_fire0', x: p.x, y: p.y - 70, static: true };
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2;
        k.x = p.x + Math.cos(a) * 75; k.y = p.y + Math.sin(a) * 75;
        if (!solidAt(R.loc, k.x, k.y) && !solidAt(R.loc, k.x, k.y + 14) && !solidAt(R.loc, k.x + 14, k.y) && !solidAt(R.loc, k.x - 14, k.y)) break;
      }
      resolveSolids(R.loc, k, 12, 0);
      R.pickups.push(k);
      st.zone = { k, r: 46, q: 0, inside: false };
      st.target = k;
      UI.banner('ЗАЖГИ СИГНАЛЬНЫЙ КОСТЁР!', 2.2);
    } else UI.banner('ВОЛНА ВРАГОВ!', 1.8);
    Sound.sfx('warn');
  },

  // Задание выполнено — уцелевшие враги разбегаются, бросая кристаллы
  scatter(R) {
    let n = 0;
    for (const e of R.enemies) {
      if (e.dead || e.boss) continue;
      e.dead = true;
      dropGem(R, e.x, e.y, e.elite ? 12 : e.def.xp);
      if (n++ < 40) burst(R, e.x, e.y, 4, e.def.color);
    }
    R.ebullets = [];
  },

  waveCleared(R) {
    const st = R.st;
    for (const k of R.pickups) if (!k.static) k.mag = true; // всё, что выпало, летит к герою
    if (st.wave % 2 === 0) {
      st.phase = 'rest'; st.next = 'wave'; st.t = 4;
      UI.banner(st.kind === 'kill' ? 'ВОЛНА ОТБИТА!' : st.kind === 'zone' ? 'КОСТЁР ГОРИТ!' : 'ВЫСТОЯЛ!', 1.8);
      Sound.sfx('chest');
    } else if (st.n === 1) this.dropKey(R, st.lastX, st.lastY);
    else this.spawnGuard(R);
  },

  // Страж ворот: огромный громила, ключ у него
  spawnGuard(R) {
    const st = R.st, a = Math.random() * Math.PI * 2, d = spawnDist();
    const e = makeEnemy(R, 'brute', R.p.x + Math.cos(a) * d, R.p.y + Math.sin(a) * d);
    e.elite = true; e.guard = true; e.sc = 2.6; e.r *= 2;
    e.lunge = { range: 120, wind: 0.5, time: 0.5, mul: 3.4, cd: 3.5 };
    e.hp *= 12; e.maxHp = e.hp; e.dmg *= 1.4; e.speed *= 1.5;
    R.enemies.push(e);
    st.guard = e; st.target = e; st.phase = 'guard'; st.acc = 0;
    R.shake = 5;
    UI.banner('СТРАЖ ВОРОТ!', 2.5);
    Sound.sfx('roar');
  },

  dropKey(R, x, y) {
    const st = R.st, p = R.p;
    // ключ не дальше сотни шагов от героя
    const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy);
    if (!d) { x = p.x + 40; y = p.y; } else if (d > 100) { x = p.x + dx / d * 100; y = p.y + dy / d * 100; }
    const k = { type: 'key', spr: 'key', x, y, static: true };
    resolveSolids(R.loc, k, 12, 0);
    R.pickups.push(k);
    st.phase = 'key'; st.target = k; st.t = 0;
    UI.banner('ВЫПАЛ КЛЮЧ!', 2);
    Sound.sfx('chest');
  },

  gotKey(R) {
    const st = R.st, p = R.p, k = { type: 'gate', spr: 'h_portal', x: 0, y: 0, static: true };
    // на втором этапе (кроме первой карты) ворота далеко: ключ надо донести под натиском врагов
    st.carry = st.n === 2 && R.loc.id !== 'desert';
    const dist = st.carry ? 260 : 120, steps = Math.floor(dist / 15);
    // ворота ставим так, чтобы к ним вела прямая дорога без препятствий
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2;
      k.x = p.x + Math.cos(a) * dist; k.y = p.y + Math.sin(a) * dist;
      let free = true;
      for (let s = 1; s <= steps && free; s++) if (solidAt(R.loc, p.x + Math.cos(a) * 15 * s, p.y + 8 + Math.sin(a) * 15 * s)) free = false;
      if (free) break;
    }
    resolveSolids(R.loc, k, 14, 0);
    R.pickups.push(k);
    st.phase = 'gate'; st.target = k; st.t = 0; st.acc = 0;
    burst(R, R.p.x, R.p.y, 20, '#ffcd75');
    UI.banner(st.carry ? 'ДОНЕСИ КЛЮЧ ДО ВОРОТ!' : 'ВОРОТА ОТКРЫТЫ!', 2.2);
    Sound.sfx('levelup');
  },

  // Прошли в ворота: новая часть карты, небольшой отдых и следующий этап
  nextStage(R) {
    const st = R.st, p = R.p;
    for (const k of R.pickups) {
      if (k.done || k.static) continue;
      if (k.type === 'gem') addXp(R, k.v); else if (k.type === 'coin') R.coins += k.v;
    }
    R.pickups = []; R.enemies = []; R.ebullets = []; R.projs = []; R.effects = []; R.storm = 0;
    R.loc = this.variant(st.base, st.n + 1);
    p.x += 900; p.y += 420;
    resolveSolids(R.loc, p, 4, 8);
    R.cx = p.x; R.cy = p.y;
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.3);
    R.flashT = 0.25; R.shake = 4;
    st.n++; st.target = null; st.guard = null; st.phase = 'rest'; st.t = 3; st.carry = false;
    st.next = st.n >= 3 ? 'boss' : 'wave';
    const S = Campaign.s(), M = MAP_STORY[R.loc.id];
    if (st.n >= 3) {
      st.vt = 480;
      // в логове босса стоит клетка с теми, кого мы пришли спасать (только при первом прохождении карты)
      const ids = CHAIN[S.step] === R.loc.id ? CHARACTERS.filter(c => HERO_STEP[c.id] === S.step + 1).map(c => c.id) : [];
      if (ids.length) { st.cage = { x: p.x, y: p.y - 62, ids }; resolveSolids(R.loc, st.cage, 16, 0); }
    }
    UI.banner(st.n >= 3 ? 'ЭТАП 3: ЛОГОВО БОССА' : 'ЭТАП ' + st.n, 2.5);
    Sound.sfx('win');
    // при первом прохождении карты на втором этапе слышен голос пленника
    if (st.n === 2 && M && CHAIN[S.step] === R.loc.id && !S.seenIn[R.loc.id + '2']) {
      S.seenIn[R.loc.id + '2'] = true; Save.store();
      R.flashT = 0; // вспышка не должна застыть под диалогом
      Story.scene(M.mid, () => UI.show(null), R.ch.id);
    }
  },

  // Строка задания под счётчиком этапов
  objective(R) {
    const st = R.st;
    if (!st || R.ending) return '';
    if (st.phase === 'boss' || (R.boss && !R.boss.dead)) {
      return st.cage ? 'Победи босса — освободи ' + st.cage.ids.map(id => CHARACTERS.find(c => c.id === id).name).join(' и ') : '';
    }
    if (st.phase === 'rest') return st.next === 'boss' ? 'Босс уже близко...' : 'Приготовься: ' + this.KIND_NAME[this.nextKind(st)];
    if (st.phase === 'wave') {
      const tag = 'ЗАДАНИЕ ' + (st.wave % 2 + 1) + '/2 · ';
      if (st.kind === 'survive') return tag + 'ПРОДЕРЖИСЬ: ' + fmtTime(Math.max(0, Math.ceil(st.time)));
      if (st.kind === 'zone') return tag + (st.zone.inside ? 'костёр разгорается: ' : 'ВСТАНЬ В КРУГ у костра: ') + Math.floor(st.zone.q * 100) + '%';
      return tag + 'перебей волну, врагов: ' + (st.left + st.alive);
    }
    if (st.phase === 'guard') return 'Убей СТРАЖА — ключ у него · ' + Math.max(1, Math.ceil(st.guard.hp / st.guard.maxHp * 100)) + '%';
    if (st.phase === 'key') return 'Подбери КЛЮЧ';
    if (st.phase === 'gate') return st.carry ? 'ДОНЕСИ КЛЮЧ до ворот — враги идут следом' : 'Иди в ВОРОТА — на следующий этап';
    return '';
  },
};

const _campSpawns = updateSpawns;
updateSpawns = function (R, dt) { if (R.st) Stage.tick(R, dt); else _campSpawns(R, dt); };

const _campKill = killEnemy;
killEnemy = function (R, e) { _campKill(R, e); if (R.st) { R.st.lastX = e.x; R.st.lastY = e.y; } };

const _campHurt = hurtPlayer;
hurtPlayer = function (R, dmg) {
  _campHurt(R, dmg);
  if (R.st && R.ending && !R.won && !R.revived && R.coins + Save.data.coins >= REVIVE_COST) Campaign.askRevive(R);
};

const _campCollect = collect;
collect = function (R, k) {
  if (k.type === 'key') { k.done = true; Stage.gotKey(R); }
  else if (k.type === 'gate') { k.done = true; Stage.nextStage(R); }
  else if (k.type !== 'beacon') _campCollect(R, k); // костёр не подбирается — у него надо стоять
};

// указатель на цель этапа: ключ, ворота или страж
const _campOverlay = drawOverlay;
drawOverlay = function (ctx, R, cx, cy, W, H) {
  _campOverlay(ctx, R, cx, cy, W, H);
  const st = R.st, t = st && st.target;
  // последние враги волны: точки у края экрана показывают, где они
  if (st && st.phase === 'wave' && st.left === 0 && Math.floor(R.t * 4) % 2) {
    for (const e of R.enemies) {
      if (e.dead || !e.hunt) continue;
      const ex = e.x - cx, ey = e.y - cy;
      if (ex >= 0 && ex <= W && ey >= 0 && ey <= H) continue;
      const ax = clamp(ex, 7, W - 8), ay = clamp(ey, 7, H - 8);
      pxDisc(ctx, ax, ay, 3, '#14162a'); pxDisc(ctx, ax, ay, 2, '#ef3b5b');
    }
  }
  if (st && st.zone) {
    // круг у сигнального костра: внутреннее кольцо растёт вместе с огнём
    const z = st.zone, zx = z.k.x - cx, zy = z.k.y - cy;
    ctx.globalAlpha = z.inside ? 0.9 : 0.5 + Math.sin(R.t * 6) * 0.2;
    pxCircle(ctx, zx, zy, z.r, z.inside ? '#ffcd75' : '#f4f4f4');
    ctx.globalAlpha = 0.8;
    if (z.q > 0.03) pxCircle(ctx, zx, zy, z.r * z.q, '#f59e42');
    ctx.globalAlpha = 1;
  }
  if (st && st.phase === 'gate') sprFeet(ctx, 'key', R.p.x, R.p.y - 20 + Math.sin(R.t * 5), false, false, 1, 1); // ключ над головой героя
  if (st && st.cage) {
    // клетки с пленниками; после победы прутья исчезают, а спасённые прыгают от радости
    const c = st.cage, n = c.ids.length, now = performance.now() / 1000;
    // если бой увёл далеко от клетки, спасённые выбегают к герою
    if (R.won && !c.freed) {
      c.freed = true;
      if (Math.abs(c.x - cx - W / 2) > W / 2 - 20 || Math.abs(c.y - cy - H / 2) > H / 2 - 30) { c.x = R.p.x + 30; c.y = R.p.y - 4; }
    }
    c.ids.forEach((id, i) => {
      const x = c.x + (i - (n - 1) / 2) * 34, ch = CHARACTERS.find(h => h.id === id);
      const hop = R.won ? Math.abs(Math.sin(now * 8 + i)) * 4 : 0;
      shadow(ctx, x, c.y + 10, 12);
      sprFeet(ctx, ch.sprite + '_i' + (Math.floor(now * 2 + i) % 2), x, c.y + 12 - hop, i % 2 === 1, false, HERO_SC, HERO_SC);
      if (!R.won) sprFeet(ctx, 'cage', x, c.y + 14, false, false, 1, 1);
    });
    const kx = c.x - cx, ky = c.y - cy;
    if (!R.won && (kx < 0 || kx > W || ky < 0 || ky > H) && Math.floor(R.t * 3) % 2) {
      const ax = clamp(kx, 8, W - 9), ay = clamp(ky, 8, H - 9);
      pxDisc(ctx, ax, ay, 4, '#14162a'); pxDisc(ctx, ax, ay, 3, '#73eff7');
    }
  }
  if (!t || t.done || t.dead) return;
  const sx = t.x - cx, sy = t.y - cy;
  if (t.type === 'gate') {
    // вихрь в проёме ворот
    ctx.fillStyle = '#14162a'; ctx.fillRect(Math.round(sx - 6), Math.round(sy - 6), 12, 20);
    for (let i = 0; i < 22; i++) {
      const a = R.t * 3 + i * 0.55, r = 1 + (i % 11) * 0.9;
      ctx.fillStyle = i % 3 ? '#ffcd75' : '#f4f4f4';
      ctx.fillRect(Math.round(sx + Math.cos(a) * r * 0.6), Math.round(sy + 4 + Math.sin(a) * r), 1, 1);
    }
  }
  if (sx < 0 || sx > W || sy < 0 || sy > H) {
    const ax = clamp(sx, 9, W - 10), ay = clamp(sy, 9, H - 10);
    pxDisc(ctx, ax, ay, 5, '#14162a');
    pxDisc(ctx, ax, ay, 4, Math.floor(R.t * 5) % 2 ? '#ffcd75' : '#f4f4f4');
  } else if (!t.guard) {
    // стрелка над целью
    const by = Math.round(sy - 20 + Math.sin(R.t * 6) * 2), bx = Math.round(sx);
    ctx.fillStyle = '#14162a'; ctx.fillRect(bx - 3, by - 1, 7, 3); ctx.fillRect(bx - 2, by + 2, 5, 2); ctx.fillRect(bx - 1, by + 4, 3, 2);
    ctx.fillStyle = '#ffcd75'; ctx.fillRect(bx - 2, by, 5, 1); ctx.fillRect(bx - 1, by + 1, 3, 2); ctx.fillRect(bx, by + 3, 1, 2);
  }
};

const _campSprites = initSprites;
initSprites = function () {
  _campSprites();
  registerSprite('key', paintSprite(10, 12, R => {
    const G = '#ffcd75', D = '#d59a3b', K = '#14162a';
    R(2, 0, 6, 6, K); R(3, 1, 4, 4, G); R(4, 2, 2, 2, K); R(3, 1, 4, 1, '#fff2c4');
    R(4, 5, 3, 7, K); R(5, 5, 1, 6, G); R(6, 8, 2, 1, D); R(6, 10, 2, 1, D);
  }));
  // клетка: между прутьями видно пленника
  registerSprite('cage', paintSprite(26, 36, R => {
    const S = '#566c86', H = '#94b0c2', K = '#14162a';
    R(1, 0, 24, 4, K); R(2, 1, 22, 2, S); R(2, 1, 22, 1, H); R(11, 0, 4, 1, '#ffcd75');
    for (let x = 2; x <= 22; x += 5) { R(x, 4, 2, 28, K); R(x, 4, 1, 28, H); }
    R(0, 32, 26, 4, K); R(1, 33, 24, 2, S); R(1, 33, 24, 1, H);
    R(11, 16, 4, 5, K); R(12, 17, 2, 3, '#ffcd75'); // замок
  }));
};
