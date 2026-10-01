// ===== Игровые данные: герои, оружие, враги, локации, боссы, магазин =====

const CHARACTERS = [
  { id: 'daler', name: 'Daler', title: 'Эльф-лучник', sprite: 'daler', hp: 80, speed: 74, armor: 0, regen: 0, weapon: 'bow',
    desc: 'Быстрый и меткий. Стреляет из лука в ближайшего врага. Ульта: град стрел.' },
  { id: 'stimme', name: 'STIMME', title: 'Принцесса', sprite: 'stimme', hp: 100, speed: 66, armor: 0, regen: 0.4, weapon: 'wave',
    desc: 'Её голос — оружие. Звуковая волна бьёт и отталкивает всех вокруг. Сама лечится со временем. Ульта: оглушающий крик.' },
  { id: 'babaduk', name: 'BABADUK', title: 'Рыцарь-принц', sprite: 'babaduk', hp: 165, speed: 60, armor: 3, regen: 0, weapon: 'sword',
    desc: 'Тяжёлая броня и много здоровья. Рубит мечом всех, кто подойдёт близко. Ульта: таран.' },
  { id: 'maga', name: 'Maga', title: 'Минотавр-гладиатор', sprite: 'maga', hp: 160, speed: 56, armor: 1, regen: 0, weapon: 'axe',
    desc: 'Гора мышц с золотой гривой. Мечет тяжёлые секиры, пробивающие всех на пути. Ульта: землетрясение.' },
];

const WEAPONS = {
  bow: { name: 'Лук', icon: 'i_bow',
    levels: [
      { dmg: 12, cd: 0.8, count: 1, pierce: 1 },
      { dmg: 14, cd: 0.8, count: 2, pierce: 1 },
      { dmg: 14, cd: 0.65, count: 2, pierce: 2 },
      { dmg: 18, cd: 0.65, count: 3, pierce: 2 },
      { dmg: 20, cd: 0.55, count: 4, pierce: 3 }],
    descs: ['Стреляет в ближайшего врага', '+1 стрела, +урон', 'Чаще, стрела пробивает 2 врагов', '+1 стрела, +урон', '+1 стрела, пробивает 3, ещё чаще'] },
  wave: { name: 'Звуковая волна', icon: 'i_wave',
    levels: [
      { dmg: 12, cd: 1.6, r: 48, rings: 1 },
      { dmg: 15, cd: 1.6, r: 52, rings: 1 },
      { dmg: 15, cd: 1.6, r: 62, rings: 1 },
      { dmg: 18, cd: 1.4, r: 64, rings: 1 },
      { dmg: 20, cd: 1.3, r: 74, rings: 2 }],
    descs: ['Волна вокруг героя, отталкивает врагов', '+урон', '+радиус', '+урон, чаще', 'Двойная волна, +радиус'] },
  sword: { name: 'Меч', icon: 'i_sword',
    levels: [
      { dmg: 26, cd: 0.8, r: 34, dirs: 1 },
      { dmg: 31, cd: 0.8, r: 35, dirs: 1 },
      { dmg: 31, cd: 0.8, r: 35, dirs: 2 },
      { dmg: 32, cd: 0.9, r: 36, dirs: 2 },
      { dmg: 40, cd: 0.85, r: 38, dirs: 4 }],
    descs: ['Рубит ближайших врагов', '+урон', 'Удар вперёд и назад', '+урон, +дальность, чаще', 'Удар во все 4 стороны!'] },
  molotov: { name: 'Коктейль Молотова', icon: 'bottle',
    levels: [
      { dmg: 6, cd: 3.0, count: 1, r: 20, dur: 3 },
      { dmg: 8, cd: 3.0, count: 1, r: 20, dur: 3 },
      { dmg: 8, cd: 2.8, count: 2, r: 22, dur: 3 },
      { dmg: 10, cd: 2.6, count: 2, r: 28, dur: 3.5 },
      { dmg: 12, cd: 2.4, count: 3, r: 30, dur: 4 }],
    descs: ['Бросает бутылку, поджигая землю', '+урон', '+1 бутылка', '+радиус огня, +урон', '+1 бутылка, горит дольше'] },
  saws: { name: 'Циркулярные пилы', icon: 'saw',
    levels: [
      { dmg: 8, count: 2, r: 30, spd: 3 },
      { dmg: 9, count: 3, r: 30, spd: 3 },
      { dmg: 12, count: 3, r: 32, spd: 3.3 },
      { dmg: 13, count: 4, r: 36, spd: 3.3 },
      { dmg: 16, count: 5, r: 38, spd: 3.8 }],
    descs: ['Пилы вращаются вокруг героя', '+1 пила', '+урон, быстрее', '+1 пила, +радиус', '+1 пила, +урон'] },
  tesla: { name: 'Тесла-катушка', icon: 'i_bolt',
    levels: [
      { dmg: 15, cd: 1.6, chains: 1, strikes: 1 },
      { dmg: 15, cd: 1.5, chains: 2, strikes: 1 },
      { dmg: 21, cd: 1.4, chains: 2, strikes: 1 },
      { dmg: 22, cd: 1.1, chains: 2, strikes: 2 },
      { dmg: 30, cd: 1.0, chains: 3, strikes: 2 }],
    descs: ['Молния бьёт врага и перескакивает на соседа', '+1 цепь', '+урон', '+1 молния, чаще', '+урон, +1 цепь'] },
};

// Эволюции: оружие 5-го уровня + нужный пассивный предмет = супер-версия
WEAPONS.bow.evo = { name: 'Огненный лук', need: 'might', desc: 'Горящие стрелы пробивают всех насквозь',
  stats: { dmg: 32, cd: 0.45, count: 5, pierce: 99 } };
WEAPONS.wave.evo = { name: 'Ария бури', need: 'magnet', desc: 'Тройная волна, притягивает кристаллы',
  stats: { dmg: 28, cd: 1.3, r: 95, rings: 3 } };
WEAPONS.sword.evo = { name: 'Клинок короля', need: 'armor', desc: 'Круговой удар огромной силы',
  stats: { dmg: 60, cd: 0.75, r: 50, dirs: 6 } };
WEAPONS.molotov.evo = { name: 'Напалм', need: 'medkit', desc: '4 бутылки, огромные долгие пожары',
  stats: { dmg: 16, cd: 2.0, count: 4, r: 38, dur: 6 } };
WEAPONS.saws.evo = { name: 'Кольцо лезвий', need: 'boots', desc: '8 пил, быстрее и больнее',
  stats: { dmg: 24, count: 8, r: 44, spd: 5.5 } };
WEAPONS.tesla.evo = { name: 'Гроза', need: 'clock', desc: '4 молнии с длинными цепями',
  stats: { dmg: 42, cd: 0.8, chains: 5, strikes: 4 } };

// ---------- Новое оружие ----------
Object.assign(WEAPONS, {
  axe: { name: 'Секира', icon: 'i_axe',
    levels: [
      { dmg: 16, cd: 1.8, count: 1, range: 78, pierce: 5 },
      { dmg: 20, cd: 1.8, count: 1, range: 78, pierce: 6 },
      { dmg: 20, cd: 1.7, count: 2, range: 82, pierce: 6 },
      { dmg: 25, cd: 1.7, count: 2, range: 96, pierce: 7 },
      { dmg: 29, cd: 1.55, count: 3, range: 100, pierce: 8 }],
    descs: ['Метает тяжёлую секиру — пробивает до 5 врагов', '+урон', '+1 секира', '+урон, летит дальше', '+1 секира, чаще'],
    evo: { name: 'Лабрис бури', need: 'might', desc: 'Пять гигантских секир во все стороны', stats: { dmg: 46, cd: 1.25, count: 5, range: 120, pierce: 14 } } },
  boomerang: { name: 'Бумеранг', icon: 'i_boomerang',
    levels: [
      { dmg: 14, cd: 1.6, count: 1, range: 70 },
      { dmg: 18, cd: 1.6, count: 1, range: 70 },
      { dmg: 18, cd: 1.5, count: 2, range: 75 },
      { dmg: 22, cd: 1.5, count: 2, range: 90 },
      { dmg: 24, cd: 1.3, count: 3, range: 95 }],
    descs: ['Летит к врагу и возвращается, пробивая всех', '+урон', '+1 бумеранг', '+дальность, +урон', '+1 бумеранг, чаще'],
    evo: { name: 'Клинок вихря', need: 'scope', desc: '5 огромных бумерангов', stats: { dmg: 42, cd: 1.0, count: 5, range: 115 } } },
  mines: { name: 'Мины', icon: 'mine',
    levels: [
      { dmg: 30, cd: 2.5, count: 1, r: 26 },
      { dmg: 40, cd: 2.5, count: 1, r: 26 },
      { dmg: 40, cd: 2.0, count: 1, r: 28 },
      { dmg: 50, cd: 2.0, count: 1, r: 34 },
      { dmg: 60, cd: 1.5, count: 1, r: 36 }],
    descs: ['Оставляет мину: взрывается, когда подойдёт враг', '+урон', 'Чаще', '+радиус взрыва, +урон', '+урон, ещё чаще'],
    evo: { name: 'Минное поле', need: 'wallet', desc: 'По 3 мощные мины за раз', stats: { dmg: 90, cd: 1.4, count: 3, r: 42 } } },
  flame: { name: 'Огнемёт', icon: 'i_flame',
    levels: [
      { dmg: 4, range: 42, half: 0.4 },
      { dmg: 5, range: 44, half: 0.4 },
      { dmg: 5, range: 54, half: 0.42 },
      { dmg: 7, range: 56, half: 0.5 },
      { dmg: 9, range: 62, half: 0.52 }],
    descs: ['Струя огня в ближайшего врага', '+урон', '+дальность', '+урон, шире струя', '+урон, +дальность'],
    evo: { name: 'Дыхание дракона', need: 'amp', desc: 'Широкий поток пламени на пол-экрана', stats: { dmg: 16, range: 84, half: 0.68 } } },
  frost: { name: 'Ледяной посох', icon: 'i_frost',
    levels: [
      { dmg: 16, cd: 1.8, r: 22, slow: 1.5 },
      { dmg: 22, cd: 1.8, r: 22, slow: 1.5 },
      { dmg: 22, cd: 1.7, r: 28, slow: 2.0 },
      { dmg: 28, cd: 1.4, r: 30, slow: 2.0 },
      { dmg: 36, cd: 1.2, r: 34, slow: 2.5 }],
    descs: ['Ледяная сфера: взрыв замедляет врагов', '+урон', '+радиус, дольше заморозка', '+урон, чаще', '+урон, +радиус'],
    evo: { name: 'Вечная мерзлота', need: 'cloak', desc: 'Огромный взрыв, заморозка на 4 секунды', stats: { dmg: 60, cd: 0.9, r: 50, slow: 4 } } },
  shotgun: { name: 'Дробовик', icon: 'i_shotgun',
    levels: [
      { dmg: 9, cd: 1.3, count: 4, pierce: 1 },
      { dmg: 9, cd: 1.3, count: 5, pierce: 1 },
      { dmg: 12, cd: 1.25, count: 5, pierce: 1 },
      { dmg: 12, cd: 1.15, count: 7, pierce: 1 },
      { dmg: 15, cd: 1.0, count: 8, pierce: 1 }],
    descs: ['Залп дроби веером в ближайшего врага', '+1 дробина', '+урон', '+2 дробины, чаще', '+урон, +1 дробина'],
    evo: { name: 'Картечница', need: 'heart', desc: '14 дробин, пробивают двоих', stats: { dmg: 22, cd: 0.8, count: 14, pierce: 2 } } },
});

// Ульты героев: заряжаются убийствами (E / Q или кнопка на экране)
const ULT_COST = 50, ULT_CD = 20;
const ULTS = {
  daler:   { name: 'Град стрел',  desc: 'Залп стрел во все стороны' },
  stimme:  { name: 'Крик',        desc: 'Оглушает и ранит всех врагов на экране' },
  babaduk: { name: 'Таран',       desc: '4 секунды неуязвимости: сносит врагов на бегу' },
  maga:    { name: 'Землетрясение', desc: 'Удар копытом: урон и оглушение всем вокруг' },
};

const PASSIVES = {
  armor:  { name: 'Броня',        icon: 'i_shield', desc: '-1 к получаемому урону', max: 5 },
  boots:  { name: 'Сапоги',       icon: 'i_boots',  desc: '+10% скорость',          max: 5 },
  might:  { name: 'Зелье силы',   icon: 'i_potion', desc: '+10% урон',              max: 5 },
  magnet: { name: 'Магнит',       icon: 'i_magnet', desc: '+35% радиус сбора',      max: 5 },
  medkit: { name: 'Аптечка',      icon: 'i_medkit', desc: '+0.5 HP в секунду',      max: 5 },
  clock:  { name: 'Часы',         icon: 'i_clock',  desc: '-8% перезарядка оружия', max: 5 },
  heart:  { name: 'Сердце',       icon: 'heart',    desc: '+20 макс. HP',           max: 5 },
  scope:  { name: 'Прицел',       icon: 'i_scope',  desc: '+5% шанс крита',         max: 5 },
  amp:    { name: 'Усилитель',    icon: 'i_amp',    desc: '+10% радиус атак',       max: 5 },
  cloak:  { name: 'Плащ теней',   icon: 'i_cloak',  desc: '+6% шанс уклониться',    max: 5 },
  wallet: { name: 'Кошель',       icon: 'i_wallet', desc: '+30% монет с врагов',    max: 5 },
};

const ENEMIES = {
  // ai: shamble — окружает и хватает вблизи; lunge — зигзаг и бросок; hop — прыжки; gunner — дистанция и стрельба
  zombie:    { sprite: 'zombie',   hp: 14, speed: 22, dmg: 8, xp: 1, r: 6, color: '#8fbf5a', ai: 'shamble', fps: 4 },
  rat:       { sprite: 'rat',      hp: 7,  speed: 40, dmg: 5, xp: 1, r: 5, color: '#94b0c2', ai: 'lunge', fps: 12,
               lunge: { range: 50, wind: 0.4, time: 0.3, mul: 3, cd: 2.8 } },
  slime:     { sprite: 'slime',    hp: 22, speed: 17, dmg: 8, xp: 2, r: 6, color: '#a7f070', ai: 'hop', split: true },
  minislime: { sprite: 'slime',    hp: 6,  speed: 26, dmg: 4, xp: 1, r: 4, color: '#a7f070', ai: 'hop', size: 10 },
  marauder:  { sprite: 'marauder', hp: 26, speed: 30, dmg: 8, xp: 3, r: 6, color: '#733e39', ai: 'gunner', fps: 6, ranged: true },
  // bomber — подбегает и взрывается; drone — летает кругами и стреляет;
  // brute — медленный здоровяк со щитом (armor срезает каждый удар); necro — поднимает зомби
  bomber:    { sprite: 'bomber',   hp: 16, speed: 48, dmg: 20, xp: 3, r: 6, color: '#ef7d57', ai: 'bomber', from: 0.25 },
  drone:     { sprite: 'drone',    hp: 12, speed: 52, dmg: 7,  xp: 3, r: 5, color: '#94b0c2', ai: 'drone',  from: 0.35 },
  brute:     { sprite: 'brute',    hp: 90, speed: 16, dmg: 14, xp: 6, r: 8, color: '#733e39', ai: 'shamble', size: 20, armor: 5, from: 0.45 },
  necro:     { sprite: 'necro',    hp: 30, speed: 24, dmg: 6,  xp: 6, r: 6, color: '#8a3f8a', ai: 'necro',  from: 0.55 },
};

// decor: [спрайт, масштаб, вес]
const LOCATIONS = [
  { id: 'desert', name: 'Радиоактивная пустыня', seed: 11, music: 'desert', boss: 'scorpion',
    desc: 'Раскалённые пески, ржавые бочки и светящиеся лужи. Здесь полно слизней.',
    ground: { style: 'sand', base: '#c9a661', dark: '#b08d4e', light: '#dcbd7c', accent: '#8a6d3b' },
    ground2: { style: 'cracked', base: '#a88750', dark: '#7d6238', light: '#bd9c60', accent: '#6a5230' },
    details: ['pebbles', 'tuft_dry', 'bone', 'pebbles', 'tuft_dry'],
    ambient: { dark: 0, tint: 'rgba(255,190,110,0.07)', fx: 'sand' },
    decor: [['cactus', 1, 3], ['rbarrel', 1, 2], ['skull', 1, 2], ['rock', 1, 2], ['puddle', 1, 2], ['car', 1, 0.5]], density: 2.4,
    weights: { zombie: 3, rat: 3, slime: 4, marauder: 2, bomber: 1.5, drone: 0.5, brute: 0.6, necro: 0.4 } },
  { id: 'factory', name: 'Заброшенный завод', seed: 23, music: 'factory', boss: 'robot',
    desc: 'Ржавые цеха и мазутные лужи. Мародёры устроили здесь засаду.',
    ground: { style: 'plate', base: '#4b5160', dark: '#363b47', light: '#5d6475', accent: '#7a4a32' },
    ground2: { style: 'concrete', base: '#63656d', dark: '#4c4e55', light: '#767881', accent: '#7a4a32' },
    details: ['nuts', 'rubble', 'nuts', 'rubble', 'bone'],
    ambient: { dark: 0.42, color: '#0a0c1a', tint: 'rgba(90,120,200,0.05)', fx: 'ash' },
    decor: [['crate', 1, 3], ['drum', 1, 3], ['scrap', 1, 2], ['skull', 1, 1], ['oil', 1, 2], ['machine', 1, 2], ['car', 1, 0.5]], density: 2.3,
    weights: { zombie: 3, rat: 3, slime: 1, marauder: 4, bomber: 1, drone: 2, brute: 0.6, necro: 0.3 } },
  { id: 'forest', name: 'Мёртвый лес', seed: 37, music: 'forest', boss: 'giant',
    desc: 'Сухие деревья, туман и светящиеся грибы. Орды зомби бродят меж стволов.',
    ground: { style: 'forest', base: '#3d3f2c', dark: '#2f3122', light: '#4c4f36', accent: '#5b6b34' },
    ground2: { style: 'grass', base: '#3f5230', dark: '#31412a', light: '#54703a', accent: '#6f8f3e' },
    details: ['tuft', 'leaves', 'glowshroom', 'tuft', 'pebbles', 'leaves'],
    ambient: { dark: 0.46, color: '#060a18', tint: 'rgba(80,110,160,0.06)', fx: 'fireflies' },
    decor: [['deadtree', 2, 4], ['stump', 1, 2], ['mushroom', 1, 2], ['rock', 1, 1], ['skull', 1, 1], ['tomb', 1, 2]], density: 2.4,
    weights: { zombie: 6, rat: 2, slime: 1, marauder: 2, bomber: 0.8, drone: 0.3, brute: 1, necro: 1.2 } },
  { id: 'metro', name: 'Заброшенное метро', seed: 53, music: 'metro', boss: 'queen',
    desc: 'Тёмные тоннели, брошенные вагоны и ядовитая слизь. Тут гнездятся дроны и подрывники.',
    ground: { style: 'concrete', base: '#3f4450', dark: '#2e323c', light: '#4f5563', accent: '#7b2cbf' },
    ground2: { style: 'plate', base: '#2f3a44', dark: '#232b33', light: '#3d4a56', accent: '#5a3a6a' },
    details: ['rubble', 'nuts', 'bone', 'rubble', 'glowshroom'],
    ambient: { dark: 0.6, color: '#04050e', tint: 'rgba(150,90,220,0.05)', fx: 'ash' },
    decor: [['wagon', 1, 1.5], ['drum', 1, 2], ['crate', 1, 2], ['toxic', 1, 3], ['machine', 1, 1], ['skull', 1, 2], ['scrap', 1, 2]], density: 2.4,
    weights: { zombie: 2, rat: 3, slime: 4, marauder: 1, bomber: 2.5, drone: 2.5, brute: 0.8, necro: 0.6 } },
];

// Финальная локация: открывается, когда собраны все четыре осколка
LOCATIONS.push({ id: 'gates', name: 'Врата миров', seed: 71, music: 'metro', boss: 'alan', final: true,
  desc: 'Руины лабиринта вокруг расколотых Врат. Здесь ждёт тот, кто всё это устроил.',
  ground: { style: 'plate', base: '#4a3f63', dark: '#352c49', light: '#5f527c', accent: '#c77dff' },
  ground2: { style: 'cracked', base: '#3a3350', dark: '#262038', light: '#4d4468', accent: '#7b2cbf' },
  details: ['rubble', 'glowshroom', 'bone', 'pebbles', 'glowshroom'],
  ambient: { dark: 0.5, color: '#0a0518', tint: 'rgba(170,110,255,0.06)', fx: 'fireflies' },
  decor: [['tomb', 1, 3], ['rock', 1, 3], ['machine', 1, 1], ['toxic', 1, 2], ['skull', 1, 2], ['crate', 1, 1]], density: 2.4,
  weights: { zombie: 3, rat: 3, slime: 2, marauder: 3, bomber: 2, drone: 2, brute: 1.2, necro: 1.2 } });

// погода: пустыня — песчаная буря, лес и завод — дождь, в метро погоды нет
for (const l of LOCATIONS) l.weather = { desert: 'sandstorm', forest: 'rain', factory: 'rain' }[l.id] || null;

const BOSSES = {
  scorpion: { name: 'Радскорпион', sprite: 'scorpion', hp: 10000, speed: 34, dmg: 18, r: 18, scale: 3, color: '#a7f070',
    attacks: [{ type: 'spread', cd: 2.2, n: 5 }, { type: 'dash', cd: 5.5 }] },
  robot: { name: 'Боевой робот «Молот»', sprite: 'robot', hp: 11500, speed: 24, dmg: 20, r: 18, scale: 3, color: '#ef7d57',
    attacks: [{ type: 'ring', cd: 3, n: 16 }, { type: 'spread', cd: 1.8, n: 3 }] },
  giant: { name: 'Зомби-великан', sprite: 'giant', hp: 13000, speed: 26, dmg: 24, r: 20, scale: 3, color: '#7a6a9a',
    attacks: [{ type: 'summon', cd: 6, n: 6 }, { type: 'ring', cd: 4, n: 12 }, { type: 'dash', cd: 7 }] },
  // Финальный босс: толстый школьник-переросток с усиками и галстуком
  alan: { name: 'ALANIATOR3000', sprite: 'alan', hp: 21000, speed: 27, dmg: 24, r: 22, scale: 3, color: '#ef3b5b',
    attacks: [{ type: 'rain', cd: 4.5, n: 7 }, { type: 'spread', cd: 2.2, n: 7 }, { type: 'dash', cd: 6 },
      { type: 'ring', cd: 3.6, n: 18 }, { type: 'summon', cd: 8, n: 5, spawn: 'rat' }] },
  queen: { name: 'Матка слизней', sprite: 'queen', hp: 12500, speed: 28, dmg: 20, r: 19, scale: 3, color: '#c77dff',
    attacks: [{ type: 'summon', cd: 5, n: 7, spawn: 'minislime' }, { type: 'ring', cd: 3.2, n: 14 }, { type: 'spread', cd: 2.6, n: 5 }] },
};

// Постоянные улучшения (цена уровня = cost * (текущий уровень + 1))
const META = [
  { id: 'hp',     name: 'Живучесть',      icon: 'heart',    desc: '+10 макс. HP',        max: 5, cost: 40 },
  { id: 'dmg',    name: 'Сила',           icon: 'i_potion', desc: '+6% урон',            max: 5, cost: 60 },
  { id: 'spd',    name: 'Скорость',       icon: 'i_boots',  desc: '+4% скорость',        max: 5, cost: 50 },
  { id: 'magnet', name: 'Притяжение',     icon: 'i_magnet', desc: '+15% радиус сбора',   max: 5, cost: 40 },
  { id: 'xp',     name: 'Мудрость',       icon: 'i_star',   desc: '+8% опыта',           max: 5, cost: 70 },
  { id: 'regen',  name: 'Восстановление', icon: 'i_medkit', desc: '+0.2 HP в секунду',   max: 5, cost: 60 },
  { id: 'armor',  name: 'Закалка',        icon: 'i_shield', desc: '+1 броня',            max: 3, cost: 120 },
];

// ===== Достижения: проверяются в конце забега, дают монеты =====
const ACHIEVEMENTS = [
  { id: 'kills100',  name: 'Первая кровь',   desc: 'Убить 100 врагов за забег',     coins: 10, test: R => R.kills >= 100 },
  { id: 'surv5',     name: 'Выживший',       desc: 'Продержаться 5 минут',          coins: 15, test: R => R.t >= 300 },
  { id: 'kills1000', name: 'Истребитель',    desc: 'Убить 1000 врагов за забег',    coins: 30, test: R => R.kills >= 1000 },
  { id: 'combo100',  name: 'Без передышки',  desc: 'Набрать комбо x100',            coins: 20, test: R => R.bestCombo >= 100 },
  { id: 'lvl20',     name: 'Ветеран',        desc: 'Достичь 20 уровня',             coins: 20, test: R => R.p.level >= 20 },
  { id: 'evo',       name: 'Эволюция',       desc: 'Получить эволюцию оружия',      coins: 25, test: R => R.p.weapons.some(w => w.evo) },
  { id: 'chest3',    name: 'Кладоискатель',  desc: 'Открыть 3 сундука за забег',    coins: 15, test: R => R.chests >= 3 },
  { id: 'pact',      name: 'Сделка с тьмой', desc: 'Принять сделку тёмного алтаря', coins: 15, test: R => R.pacts >= 1 },
  { id: 'elite5',    name: 'Охотник на элиту', desc: 'Убить 5 элитных врагов за забег', coins: 20, test: R => R.eliteKills >= 5 },
].concat(LOCATIONS.map(l => (
  { id: 'clear_' + l.id, name: 'Покоритель', desc: 'Победить босса: ' + l.name, coins: 40, test: R => R.everWon && R.loc.id === l.id }
)), [
  { id: 'allheroes', name: 'Легенды пустоши', desc: 'Победить каждым героем', coins: 100, test: (R, d) => CHARACTERS.every(c => d.wins[c.id]) },
  { id: 'nightmare', name: 'Повелитель кошмаров', desc: 'Победить босса на сложности «Кошмар»', coins: 80, test: R => R.everWon && R.nightmare },
  { id: 'daily',     name: 'Вызов принят',    desc: 'Продержаться 5 минут в испытании дня', coins: 25, test: R => R.daily && R.t >= 300 },
  { id: 'story',     name: 'Дорога домой',    desc: 'Победить ALANIATOR3000 и открыть Врата', coins: 100, test: (R, d) => LOCATIONS.filter(l => !l.side).every(l => d.cleared[l.id]) },
  { id: 'rush1',     name: 'Дуэлянт',        desc: 'Победить босса в комнате боссов',        coins: 15,  rush: true, test: R => R.everWon },
  { id: 'rush3',     name: 'Трое на одного', desc: 'Победить трёх боссов одновременно',      coins: 40,  rush: true, test: R => R.everWon && R.rush.length >= 3 },
  { id: 'rushall',   name: 'Гроза боссов',   desc: 'Победить всех боссов одновременно',      coins: 100, rush: true, test: R => R.everWon && R.rush.length >= Object.keys(BOSSES).length },
  { id: 'endless5',  name: 'За гранью',       desc: 'Прожить 5 минут в бесконечном режиме', coins: 60, test: R => R.endless && R.t >= RUN_TIME + 300 },
]);

// Костюмы: открываются победой за героя
const COSTUMES = { daler: 'Тёмный эльф', stimme: 'Ледяная принцесса', babaduk: 'Чёрный рыцарь', maga: 'Золотой бык' };
// Цвет фона портретов и комикс-панелей
const HERO_TINT = { daler: '#257179', stimme: '#a83266', babaduk: '#3b5dc9', maga: '#b86f32' };

// ===== Сохранение прогресса =====
const Save = {
  data: { coins: 0, meta: {}, cleared: {}, clearedN: {}, best: {}, ach: {}, wins: {}, costume: {}, talents: {}, daily: {},
    tutDone: false, introSeen: false, endingSeen: false, nightmare: false,
    settings: { music: true, sfx: true, musicVol: 1, sfxVol: 1, shake: 1, btn: 1, net: 1 } },
  load() {
    try {
      const d = JSON.parse(localStorage.getItem('wl_save'));
      if (d) {
        const def = this.data.settings;
        Object.assign(this.data, d);
        this.data.settings = Object.assign(def, d.settings);
      }
    } catch (e) { /* сохранение недоступно — играем без него */ }
  },
  store() {
    try { localStorage.setItem('wl_save', JSON.stringify(this.data)); } catch (e) { }
  },
  metaLvl(id) { return this.data.meta[id] || 0; },
};
