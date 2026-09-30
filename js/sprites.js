// ===== Пиксель-арт: палитра, спрайты, тайлы земли =====
// Каждый спрайт — массив строк, один символ = один пиксель, '.' = прозрачный.

const PALETTE = {
  k: '#1a1c2c', // контур
  w: '#f4f4f4', // белый
  s: '#f4c29a', S: '#c8875e', // кожа
  g: '#38b764', G: '#257179', // зелёный
  y: '#ffcd75', Y: '#d59a3b', // золото
  r: '#b13e53', R: '#ef7d57', // красный / оранжевый
  b: '#3b5dc9', B: '#41a6f6', // синий
  e: '#29366f',               // тёмно-синий
  p: '#e86a92', P: '#a83266', // розовый
  H: '#f7d56b', h: '#8b4a2b', // светлые волосы / коричневый
  m: '#94b0c2', M: '#566c86', n: '#333c57', // металл
  o: '#733e39',               // кожа/дерево
  z: '#8fbf5a', Z: '#4f7a3a', // кожа зомби
  l: '#a7f070',               // радиоактивный лайм
  c: '#73eff7',               // голубой (молния)
  O: '#f59e42',               // огонь
};

const SPRITE_DATA = {
  // ---------- ГЕРОИ ----------
  daler: { size: 16, rows: [
    '................',
    '.....kkkkkk.....',
    '....kggggggk....',
    '...kggggggggk...',
    '...kgHHHHHHgk...',
    '.sskHskssksHkss.',
    '...kHssssssHk...',
    '....kkSssSkk....',
    '...kgGooooGgk...',
    '..ksgGooooGgsk..',
    '..ksgggyggggsk..',
    '...kkggggggkk...',
    '....kGGkkGGk....',
    '....kookkook....',
    '....kook.kook...',
    '....kkk..kkk....'] },
  stimme: { size: 16, rows: [
    '......y.y.y.....',
    '......yyyyy.....',
    '.....kyryryk....',
    '....kHHHHHHHk...',
    '...kHHsssssHHk..',
    '...kHHsksksHHk..',
    '...kHHsspssHHk..',
    '...kHkpppppkHk..',
    '..kHkpPpppPpkHk.',
    '..kskppyyyppksk.',
    '...kpppppppppk..',
    '..kpppPpppPpppk.',
    '..kppPpppppPppk.',
    '.kpPppppppppPpk.',
    '.kkkkkkkkkkkkkk.',
    '....kyk..kyk....'] },
  babaduk: { size: 16, rows: [
    '........rr......',
    '.......rr.......',
    '.....ykykyk.....',
    '.....yyyyyy.....',
    '....kmmmmmmk....',
    '...kmmmmmmmmk...',
    '...kmkkkkkkmk...',
    '...kmkBkkBkmk...',
    '...kMmmmmmmMk...',
    '..bkkmmmmmmkkb..',
    '.bkmMmyyyymMmkb.',
    '.bkmkmmmmmmkmkb.',
    '.bbkkMmmmmMkkbb.',
    '.bb.kmmkkmmk.bb.',
    '....kMMkkMMk....',
    '....kkkk.kkkk...'] },

  // ---------- ВРАГИ ----------
  zombie: { size: 16, rows: [
    '................',
    '.....kkkkkk.....',
    '....kzzzzzzk....',
    '...kzZzzzzzzk...',
    '...kzkrzzkrzk...',
    '...kzzzzzzzzk...',
    '...kzZkkkkZzk...',
    '....kkzzzzkk....',
    '..kzkbbBbbbkzk..',
    '.kzzkbbbBbbkzzk.',
    'kzz.kbBbbbbk.zzk',
    '....kbbbkbbk....',
    '....koookook....',
    '....kook.kook...',
    '....kzzk.kzzk...',
    '....kkk...kkk...'] },
  rat: { size: 16, rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '..........kk....',
    '....kkkkkkMMk...',
    '...kMMMMMMMMrk..',
    '..kMMmmmmMMMMMpk',
    '.kMmmmmmmMMMMkk.',
    'pkMMMMMMMMMMk...',
    'p.kMkkMkkMkk....',
    '.pp.k..k........',
    '................',
    '................'] },
  slime: { size: 16, rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '......kkkk......',
    '....kkllllkk....',
    '...klllwllllk...',
    '..klllwwlllllk..',
    '..kllllllllllk..',
    '.kllkklllkklllk.',
    '.klllllllllllgk.',
    '.kglllllllllggk.',
    '..kggggggggggk..',
    '...kkkkkkkkkk...',
    '................'] },
  marauder: { size: 16, rows: [
    '................',
    '.....kkkkkk.....',
    '....koooooRk....',
    '...kooooooook...',
    '...koMMMMMMok...',
    '...koMwMMwMok...',
    '...kokMnnMkok...',
    '....kkMnnMkk....',
    '...kRooooooRk...',
    '..kSkRooooRkMMMk',
    '..kSkoooooknnk..',
    '...kkooyookk....',
    '....koookook....',
    '....kook.kook...',
    '....knnk.knnk...',
    '....kkk...kkk...'] },

  // ---------- БОССЫ ----------
  scorpion: { size: 16, pal: { Y: '#38b764', y: '#a7f070' }, rows: [
    '................',
    '...........kk...',
    '..........kyyk..',
    '..........kYk...',
    '.........kYYk...',
    '........kYYk....',
    '.kk....kYYk..kk.',
    'kYk...kYYYk..kYk',
    '.kYkkYYYYYYkkYk.',
    '..kkYYrYYrYYYkk.',
    '...kYYYYYYYYYk..',
    '..k.kYYYYYYYk.k.',
    '.k.k.kkkkkkk.k.k',
    'k.k.........k.k.',
    '................',
    '................'] },
  robot: { size: 16, rows: [
    '.......rr.......',
    '........k.......',
    '....kkkkkkkk....',
    '....kMMMMMMk....',
    '....kMrMMrMk....',
    '....kMMMMMMk....',
    '....kMnnnnMk....',
    '..kkkkkkkkkkkk..',
    '.kMkmmmmmmmmkMk.',
    '.kMkmmyyyymmkMk.',
    '.kMkmmyrrymmkMk.',
    '.kkkmmmmmmmmkkk.',
    '..kkkkkkkkkkkk..',
    '...kMMk..kMMk...',
    '...kMMk..kMMk...',
    '..kkkkk..kkkkk..'] },

  // ---------- ПРЕДМЕТЫ (8x8) ----------
  gem: { size: 8, rows: [
    '...kk...',
    '..kBBk..',
    '.kBwBBk.',
    'kBwBBBbk',
    'kBBBBbbk',
    '.kBBbbk.',
    '..kbbk..',
    '...kk...'] },
  coin: { size: 8, rows: [
    '..kkkk..',
    '.kyyyyk.',
    'kyywyyYk',
    'kywyyyYk',
    'kyyyyyYk',
    'kyyyyYYk',
    '.kYYYYk.',
    '..kkkk..'] },
  heart: { size: 8, rows: [
    '.kk..kk.',
    'kRRkkrrk',
    'kRwrrrrk',
    'krrrrrrk',
    '.krrrrk.',
    '..krrk..',
    '...kk...',
    '........'] },
  saw: { size: 8, rows: [
    'm.kkkk.m',
    '.kmmmmk.',
    'kmmMMmmk',
    'kmMkkMmk',
    'kmMkkMmk',
    'kmmMMmmk',
    '.kmmmmk.',
    'm.kkkk.m'] },
  bottle: { size: 8, rows: [
    '...Oy...',
    '...kk...',
    '...wk...',
    '..kggk..',
    '.kgGggk.',
    '.kggggk.',
    '.kgGggk.',
    '..kkkk..'] },

  // ---------- ИКОНКИ (8x8) ----------
  i_bow: { size: 8, rows: [
    '.....kkk',
    '......wk',
    '.....kmk',
    '....kok.',
    '...kok..',
    'r.kok...',
    '.rok....',
    'r.r.....'] },
  i_wave: { size: 8, rows: [
    '..pppp..',
    '.p....p.',
    'p..pp..p',
    'p.p..p.p',
    'p.p..p.p',
    'p..pp..p',
    '.p....p.',
    '..pppp..'] },
  i_sword: { size: 8, rows: [
    '......kk',
    '.....kwk',
    '....kwk.',
    'k..kwk..',
    '.kkwk...',
    '..kyk...',
    '.kokk...',
    'kok.....'] },
  i_bolt: { size: 8, rows: [
    '....kkk.',
    '...kcck.',
    '..kcck..',
    '.kccckk.',
    '.kkccck.',
    '...kcck.',
    '..kcck..',
    '..kkk...'] },
  i_shield: { size: 8, rows: [
    '.kkkkkk.',
    'kmmmmMMk',
    'kmwmmmMk',
    'kmmmmmMk',
    'kmmmmMMk',
    '.kmmmMk.',
    '..kmMk..',
    '...kk...'] },
  i_boots: { size: 8, rows: [
    '..kkk...',
    '..kok...',
    '..kok...',
    '..kokk..',
    '..koookk',
    '.koooook',
    '.kkkkkkk',
    '........'] },
  i_potion: { size: 8, rows: [
    '..kkkk..',
    '...kk...',
    '..kRRk..',
    '.kRrrRk.',
    'kRrwrrrk',
    'krrrrrrk',
    '.krrrrk.',
    '..kkkk..'] },
  i_magnet: { size: 8, rows: [
    'kkk..kkk',
    'kwk..kwk',
    'krk..kbk',
    'krk..kbk',
    'krrkkbbk',
    'krrrbbbk',
    '.krrbbk.',
    '..kkkk..'] },
  i_medkit: { size: 8, rows: [
    '.kkkkkk.',
    'kwwwwwwk',
    'kwwrrwwk',
    'kwrrrrwk',
    'kwrrrrwk',
    'kwwrrwwk',
    'kwwwwwwk',
    '.kkkkkk.'] },
  i_clock: { size: 8, rows: [
    '..kkkk..',
    '.kwwwwk.',
    'kwwkwwwk',
    'kwwkwwwk',
    'kwwkkkwk',
    'kwwwwwwk',
    '.kwwwwk.',
    '..kkkk..'] },
  i_star: { size: 8, rows: [
    '...kk...',
    '..kyyk..',
    'kkkyykkk',
    'kyyyyyyk',
    '.kyyyyk.',
    '.kykkyk.',
    'kyk..kyk',
    'kk....kk'] },
  i_skull: { size: 8, rows: [
    '..kkkk..',
    '.kwwwwk.',
    'kwwwwwwk',
    'kwkwwkwk',
    'kwwwwwwk',
    '.kwkkwk.',
    '..kwwk..',
    '...kk...'] },

  // ---------- ДЕКОР ----------
  cactus: { size: 16, rows: [
    '................',
    '......kkk.......',
    '.....kgGgk......',
    '.....kgGgk..kk..',
    '.kk..kgGgk.kgk..',
    'kgk..kgGgk.kgk..',
    'kgk..kgGgkkggk..',
    'kggkkkgGggggk...',
    '.kggggGGgkkk....',
    '..kkkkgGgk......',
    '.....kgGgk......',
    '.....kgGgk......',
    '.....kgGgk......',
    '....kkgGgkk.....',
    '...kYYYYYYYk....',
    '................'] },
  rbarrel: { size: 16, rows: [
    '................',
    '................',
    '....kkkkkkkk....',
    '...kYyyyyyyYk...',
    '...kkkkkkkkkk...',
    '...kyyykkyyyk...',
    '...kyykyykyyk...',
    '...kyykkkkyyk...',
    '...kyyyykyyyk...',
    '...kkkkkkkkkk...',
    '...kYyyyyyyYk...',
    '...kYyyyyyyYk...',
    '...kkkkkkkkkk...',
    '.....llll.......',
    '....llllll......',
    '................'] },
  skull: { size: 16, rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '......kkkk......',
    '.....kwwwwk.....',
    '....kwwwwwwk....',
    '....kwkwwkwk....',
    '....kwwwwwwk....',
    '.....kwkwkk.....',
    '......kkkk......',
    '..kwk......kwwk.',
    '..kwwwwk...kwk..',
    '...kkkk.........'] },
  rock: { size: 16, rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....kkkk.......',
    '...kkmmmmkk.....',
    '..kmmwmmmMMk....',
    '.kmmmmmMMMMk....',
    '.kMmmmMMMMnk....',
    '..kkkkkkkkk.....',
    '................'] },
  puddle: { size: 16, rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...Glllllll.....',
    '.GGllllwllllG...',
    'GlllllllllllllG.',
    '.GGllllllllGG...',
    '...GGGGGGGG.....',
    '................'] },
  crate: { size: 16, rows: [
    '................',
    '................',
    '................',
    '..kkkkkkkkkkkk..',
    '..kYYYYYYYYYYk..',
    '..kYyooooooyYk..',
    '..kYoyooooyoYk..',
    '..kYooyooyooYk..',
    '..kYoooyyoooYk..',
    '..kYoooyyoooYk..',
    '..kYooyooyooYk..',
    '..kYoyooooyoYk..',
    '..kYyooooooyYk..',
    '..kYYYYYYYYYYk..',
    '..kkkkkkkkkkkk..',
    '................'] },
  drum: { size: 16, rows: [
    '................',
    '................',
    '................',
    '....kkkkkkkk....',
    '...kBbbbbbbbk...',
    '...kbbbbbbbek...',
    '...kkkkkkkkkk...',
    '...kBbbbbbbek...',
    '...kBbbbbbbek...',
    '...kBbbbbbbek...',
    '...kkkkkkkkkk...',
    '...kBbbbbbbek...',
    '...kBbbbbbbek...',
    '....kkkkkkkk....',
    '................',
    '................'] },
  deadtree: { size: 16, rows: [
    '................',
    '................',
    '....k..k........',
    '.k..kk.kk..k....',
    '..k..kkok.k.....',
    '..kk..kok.k..k..',
    '...kk.kokk..kk..',
    '....kkkokk.kk...',
    '......kookkk....',
    '......koohk.....',
    '......koohk.....',
    '......koohk.....',
    '......koohk.....',
    '.....kkoohkk....',
    '....kkoooohkk...',
    '................'] },
  stump: { size: 16, rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '....kkkkkkk.....',
    '...khhhhhhhk....',
    '...khohhohhk....',
    '...kkkkkkkkk....',
    '...koohooook....',
    '...koohooook....',
    '..kkoohoooookk..',
    '................'] },
  mushroom: { size: 16, rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....kkkk.......',
    '....kpppPk......',
    '...kpwppPPk.....',
    '...kkkkkkkk.....',
    '.....kwwk.......',
    '.....kwwk...kk..',
    '....kkwwkk.kpPk.',
    '...........kwk..',
    '................'] },
};

// ---------- Крупные объекты и мелкие детали грунта ----------
const _d = n => '.'.repeat(n), _r = (ch, n) => ch.repeat(n);
Object.assign(SPRITE_DATA, {
  // ржавый остов машины 32x16
  car: { size: 32, h: 16, pal: { R: '#b86f32', r: '#733e39', o: '#4a2a2a' }, rows: [
    _d(32),
    _d(10) + _r('k', 12) + _d(10),
    _d(9) + 'k' + _r('M', 12) + 'k' + _d(9),
    _d(8) + 'kMcBBBkMMkBBBcMk' + _d(8),
    _d(7) + 'kMMcBBBkMMkBBBBcMk' + _d(7),
    '..' + _r('k', 6) + 'MM' + _r('k', 5) + 'MM' + _r('k', 6) + 'MM' + _r('k', 5) + '..',
    '.k' + _r('R', 27) + 'rk.',
    'kRRo' + _r('R', 22) + 'oRRrrk',
    'k' + _r('R', 11) + 'kk' + _r('R', 15) + 'rrk',
    'ky' + _r('R', 18) + 'o' + _r('R', 8) + 'rwk',
    'k' + _r('r', 30) + 'k',
    '.' + _r('k', 30) + '.',
    '...knnnk' + _d(16) + 'knnnk...',
    '...knMnk' + _d(16) + 'knMnk...',
    '....kkk.' + _d(16) + '.kkk....',
    _d(32)] },
  // заводской станок с огоньками 16x24
  machine: { size: 16, h: 24, rows: [
    '....kkkkkkkk....',
    '...kMMMMMMMMk...',
    '...kMnnnnnnMk...',
    '...kMnlnnrnMk...',
    '...kMnnnnnnMk...',
    '...kMMMMMMMMk...',
    '..kkkkkkkkkkkk..',
    '..kmmmmmmmmmmk..',
    '..kmMMMMMMMMmk..',
    '..kmMkkkkkkMmk..',
    '..kmMkyyyykMmk..',
    '..kmMkkkkkkMmk..',
    '..kmMMMMMMMMmk..',
    '..kmmmmmmmmmmk..',
    '..kmnmnmnmnmmk..',
    '..kmmmmmmmmmmk..',
    '.kkkkkkkkkkkkkk.',
    '.kMMMMMMMMMMMMk.',
    '.kMnMMMMMMMMnMk.',
    '.kMMMMMMMMMMMMk.',
    '.kkkkkkkkkkkkkk.',
    '..kk........kk..',
    '................',
    '................'] },
  // надгробие
  tomb: { size: 16, rows: [
    '................',
    '................',
    '.....kkkkkk.....',
    '....kmmmmmmk....',
    '...kmmwmmmmMk...',
    '...kmmmkmmmMk...',
    '...kmkkkkkmMk...',
    '...kmmmkmmmMk...',
    '...kmmmkmmmMk...',
    '...kmmmmmmmMk...',
    '...kmMmmmmMMk...',
    '...kmmmmmmmMk...',
    '..gkMMMMMMMMkg..',
    '.ggkkkkkkkkkkgg.',
    '..g.g......g.g..',
    '................'] },
  // ---- новые враги ----
  bomber: { size: 16, rows: [
    '................',
    '.....kkkkkk.....',
    '....kRRRRRRk....',
    '...kRRyRRRRRk...',
    '...kRkwRRkwRk...',
    '...kRRRRRRRRk...',
    '..kkRRkkkkRRkk..',
    '.kRRRRRRRRRRRRk.',
    'kRRyRRRyRRRRyRRk',
    'kRRRRRyRRRyRRRRk',
    'kRyRRRRRRRRRRyRk',
    '.kRRRyRRRRyRRRk.',
    '..kkRRRRRRRRkk..',
    '....kRRkkRRk....',
    '....kook.kook...',
    '....kkk...kkk...'] },
  drone: { size: 16, rows: [
    '................',
    '.kkkk......kkkk.',
    'kmmmmk....kmmmmk',
    '.kkkk.kkkk.kkkk.',
    '...kkkMMMMkkk...',
    '..kMMMMMMMMMMk..',
    '..kMnnnnnnnnMk..',
    '..kMnrrnnrrnMk..',
    '..kMnnnnnnnnMk..',
    '..kMMMMMMMMMMk..',
    '...kkMMnnMMkk...',
    '.....kknnkk.....',
    '.......kk.......',
    '................',
    '................',
    '................'] },
  brute: { size: 16, rows: [
    '................',
    '...kkkkkk.......',
    '..kzzzzzzk......',
    '..kzkrzkrk......',
    '..kzzzzzzk.kkkk.',
    '.kkzZkkZzkkmmmmk',
    'koooooooookmwmmk',
    'koOooooooOkmmmMk',
    'kooooooookkmmmMk',
    'kzkooooookzkmmMk',
    'kzkooyyookzkmMMk',
    '.kkoooooook.kMk.',
    '..kbbbkkbbbk.k..',
    '..kbbk..kbbk....',
    '..kzzk..kzzk....',
    '..kkkk..kkkk....'] },
  necro: { size: 16, pal: { d: '#5d275d', D: '#8a3f8a' }, rows: [
    '......kkkk....l.',
    '.....kddddk..lwl',
    '....kddddddk..l.',
    '....kdkkkkdk..o.',
    '....kdlkkldk..o.',
    '....kdkkkkdk..o.',
    '...kkddddddkk.o.',
    '..kddDddddDddko.',
    '..kdDddddddDdso.',
    '..kddddddddddko.',
    '...kddDddDddk.o.',
    '...kddddddddk.o.',
    '..kdddDddDdddko.',
    '..kddddddddddk..',
    '..kkkkkkkkkkkk..',
    '................'] },
  // ---- торговец ----
  merchant: { size: 16, rows: [
    '................',
    '.....kkkkkk.....',
    '....kYYYYYYk....',
    '...kYYYYYYYYk...',
    '...kYkkkkkkYk...',
    '...kYkswwskYk...',
    '...kYksssskYk...',
    '....kkwwwwkk....',
    '..kkYYYwwYYYkk..',
    '.khkYyYYYYyYkok.',
    '.khkYYYyyYYYkok.',
    '.khkYYYYYYYYkok.',
    '.kkkYYyYYyYYkkk.',
    '...kYYYYYYYYk...',
    '...kkkkkkkkkk...',
    '................'] },
  // ---- иконки нового оружия и предметов (8x8) ----
  i_axe: { size: 8, rows: ['.kkkk...', 'kmmmmk..', 'kmwmmokk', 'kmmmMook', '.kMMkokk', '..kk.ok.', '.....ok.', '.....kk.'] },
  i_boomerang: { size: 8, rows: ['..kkkk..', '.kyyyyk.', 'kyykkyyk', 'kyk..kyk', 'kyk..kyk', 'kYk..kYk', '.k....k.', '........'] },
  mine: { size: 8, rows: ['........', '...kk...', '..krrk..', '.kMMMMk.', 'kMmMMmMk', 'kMMMMMMk', '.kkkkkk.', '........'] },
  i_flame: { size: 8, rows: ['...k....', '..kRk...', '..kRRk..', '.kROORk.', 'kROyyORk', 'kROyyORk', '.kROORk.', '..kkkk..'] },
  i_frost: { size: 8, rows: ['...kk...', '.k.cc.k.', '..cBBc..', 'kcBwwBck', 'kcBwwBck', '..cBBc..', '.k.cc.k.', '...kk...'] },
  i_shotgun: { size: 8, rows: ['........', 'kkkkkkk.', 'kmmmmmMk', 'kkkkkkMk', '.....kok', '....koOk', '....kook', '....kkk.'] },
  i_scope: { size: 8, rows: ['..kkkk..', '.kr..rk.', 'kr.kk.rk', 'k.krrk.k', 'k.krrk.k', 'kr.kk.rk', '.kr..rk.', '..kkkk..'] },
  i_amp: { size: 8, rows: ['...kk...', '..kyyk..', '.kyOOyk.', 'kyOwwOyk', 'kyOwwOyk', '.kyOOyk.', '..kyyk..', '...kk...'] },
  i_cloak: { size: 8, pal: { d: '#5d275d', D: '#8a3f8a' }, rows: ['..kkkk..', '.kDDDDk.', 'kDdddDDk', 'kDddddDk', 'kDdddddk', 'kdddkddk', 'kddk.kdk', 'kkk...kk'] },
  i_wallet: { size: 8, rows: ['..kkkk..', '.kokkok.', '..kook..', '.koooook', 'koyooyok', 'kooyyook', 'koooooYk', '.kkkkkk.'] },
  // ---- сундук и алтарь ----
  chest: { size: 16, rows: [
    '................',
    '................',
    '................',
    '...kkkkkkkkkk...',
    '..khhhhhhhhhhk..',
    '.khyhhhhhhhhyhk.',
    '.khhhhhhhhhhhhk.',
    '.kyyyyykkyyyyyk.',
    '.kooooykykooook.',
    '.kohoookkooohok.',
    '.koooooooooooork'.slice(0, 16),
    '.kohooooooooohok'.slice(0, 16),
    '.kyyyyyyyyyyyyk.',
    '.kkkkkkkkkkkkkk.',
    '................',
    '................'] },
  altar: { size: 16, pal: { d: '#5d275d' }, rows: [
    '................',
    '.......rr.......',
    '......rRRr......',
    '......rRyr......',
    '.......rr.......',
    '....kkkkkkkk....',
    '...kMMMMMMMMk...',
    '...kMdMddMdMk...',
    '....kMMMMMMk....',
    '....kMdrrdMk....',
    '....kMdrrdMk....',
    '....kMMMMMMk....',
    '...kMMMMMMMMk...',
    '..kMMnMMMMnMMk..',
    '..kkkkkkkkkkkk..',
    '................'] },
  // мелочи 8x8
  pebbles: { size: 8, rows: ['........', '..mm....', '.mMMk...', '..kk....', '.....mm.', '....mMk.', '.....k..', '........'] },
  rubble: { size: 8, pal: { m: '#767881', M: '#4c4e55' }, rows: ['........', '..mm....', '.mMMk...', '..kk.m..', '....mMk.', '.m...k..', 'mMk.....', '........'] },
  tuft: { size: 8, pal: { y: '#6f8f3e', Y: '#3f5230' }, rows: ['........', '.y...y..', '.y.y.y.y', '..yYyYy.', '..YyYyY.', '...YYY..', '........', '........'] },
  tuft_dry: { size: 8, pal: { y: '#dcbd7c', Y: '#8a6d3b' }, rows: ['........', '.y...y..', '.y.y.y.y', '..yYyYy.', '..YyYyY.', '...YYY..', '........', '........'] },
  bone: { size: 8, rows: ['........', '........', '.w....w.', 'wwwwwwww', '.w....w.', '........', '........', '........'] },
  leaves: { size: 8, rows: ['........', '.R......', 'RO..h...', '.h.hO...', '....h.R.', '..O..RO.', '.Oh...h.', '........'] },
  nuts: { size: 8, rows: ['........', '.mm.....', 'mkkm..M.', 'mkkm.MkM', '.mm...M.', '....m...', '...mkm..', '....m...'] },
  glowshroom: { size: 8, rows: ['........', '........', '..cc....', '.cBBc...', '..ww..c.', '..ww.cBc', '......w.', '........'] },
});

// ---------- ГЕРОИ (16x24): тело 18 строк + кадры ног 6 строк ----------
// В кадрах ног: 1 = бедро, 2 = обувь (цвета задаются палитрой героя)
const LEG_FRAMES = {
  boots: [
    ['...k11k.k11k....', '...k11k.k11k....', '...k22k.k22k....', '...k22k.k22k....', '...k22k.k22k....', '...kkkk.kkkk....'],
    ['...k11k.k11k....', '...k11k.k22k....', '...k22k.k22k....', '...k22k.kkkk....', '...k22k.........', '...kkkk.........'],
    ['...k11k.k11k....', '...k22k.k11k....', '...k22k.k22k....', '...kkkk.k22k....', '........k22k....', '........kkkk....'],
  ],
  armor: [
    ['....k11kk11k....', '....k11kk11k....', '....k22kk22k....', '....k22kk22k....', '....k22kk22k....', '....kkkkkkkk....'],
    ['....k11kk11k....', '....k11kk22k....', '....k22kk22k....', '....k22kkkkk....', '....k22k........', '....kkkk........'],
    ['....k11kk11k....', '....k22kk11k....', '....k22kk22k....', '....kkkkk22k....', '........k22k....', '........kkkk....'],
  ],
  dress: [
    ['..kpppPppppkssk.', '.kppppPppppkssk.', '.kpppPpppppkssk.', '.kkkkkkkkkkkssk.', '....kyk....kyk..', '....kkk....kkk..'],
    ['..kpppPppppkssk.', '.kppppPppppkssk.', '.kpppPpppppkssk.', '.kkkkkkkkkkkssk.', '....kyk.....kyk.', '....kkk.....kkk.'],
    ['.kppppPpppkssk..', '.kppppPppppkssk.', '.kpppPpppppkssk.', '.kkkkkkkkkkkssk.', '...kyk.....kyk..', '...kkk.....kkk..'],
  ],
};

const HEROES = {
  // Эльф: длинные светлые волосы, повязка, открытая туника
  daler: { legs: 'boots', pal: { 1: '#f4c29a', 2: '#733e39' }, body: [
    '................',
    '.....kkkkkk.....',
    '....kHHHHHHk....',
    '...kHHyHHHHHk...',
    '...kHHHHHHHHk...',
    '..kgggggggggk...',
    '.skkHsssssHHksk.',
    'sskHHskssksHkss.',
    '..kHHssssssHk...',
    '..kHHksSSskHk...',
    '..kHkkssskkHk...',
    '..kHkgsssgkHk...',
    '.kskgGsSsGgksk..',
    '.kskgGgsgGgksk..',
    '.kSkgGgggGgkSk..',
    '.kskoyooooyksk..',
    '..kkgGgggGgkk...',
    '...kgGgkgGgk....'] },
  // Принцесса: корона, длинные волосы, платье с открытыми плечами и разрезом
  stimme: { legs: 'dress', pal: {}, body: [
    '......y.y.y.....',
    '......yyyyy.....',
    '.....kyryryk....',
    '....kHHHHHHHk...',
    '...kHHHHHHHHHk..',
    '...kHHsssssHHk..',
    '...kHsksskssHk..',
    '...kHsssssssHk..',
    '..kHHksspsskHHk.',
    '..kHHHkssskHHHk.',
    '..kHHsssssssHHk.',
    '..kHsspPpPpssHk.',
    '..kHskpppppksHk.',
    '..kHsskpPpkssHk.',
    '..kHskpppppksHk.',
    '...kkpppPpppkk..',
    '...kppPpppPppk..',
    '..kpppPpppPpppk.'] },
  // Рыцарь-принц: широкие плечи, шлем с плюмажем, плащ
  babaduk: { legs: 'armor', pal: { 1: '#94b0c2', 2: '#566c86' }, body: [
    '.......rrr......',
    '......rrRr......',
    '.....ykykyk.....',
    '.....yyyyyy.....',
    '....kmmmmmmk....',
    '...kmwmmmmmMk...',
    '...kmkkkkkkMk...',
    '...kmskssksMk...',
    '...kMssssssMk...',
    '....kMssssMk....',
    '..kkkkmmmmkkkk..',
    '.kmmmkmmmmkmmmk.',
    '.kmwmkmyymkmmMk.',
    'bkkMkkmyymkkMkkb',
    'bbkmkmmmmmmkmkbb',
    'bbkskyyrryykskbb',
    'bbbkkMmmmmMkkbbb',
    'bbb.kmmkkmmk.bbb'] },
};

// Палитры альтернативных костюмов
const HERO_ALT = {
  daler:   { g: '#7b2cbf', G: '#3a1a4a', H: '#e8e8f0', y: '#c7dcd0', o: '#262b44', 2: '#262b44' },
  stimme:  { p: '#41a6f6', P: '#3b5dc9', H: '#e8f4ff', r: '#73eff7', y: '#c7dcd0' },
  babaduk: { m: '#4a4e5a', M: '#2e323c', w: '#94b0c2', b: '#b13e53', r: '#ffcd75', R: '#f59e42', 1: '#4a4e5a', 2: '#2e323c' },
};

// Кадры героя: i0/i1 — дыхание на месте, w0..w3 — ходьба
function heroFrames(h) {
  const up = h.body, down = ['................'].concat(h.body.slice(0, 17)), L = LEG_FRAMES[h.legs];
  // в беге голова и плечи наклоняются вперёд на пиксель
  const lean = rows => rows.map((r, i) => (i < 10 ? '.' + r.slice(0, 15) : r));
  return { i0: up.concat(L[0]), i1: down.concat(L[0]),
    w0: lean(up).concat(L[1]), w1: lean(down).concat(L[0]), w2: lean(up).concat(L[2]), w3: lean(down).concat(L[0]) };
}

// Кадры шага врагов: заменяем нижние строки спрайта (start — с какой строки)
const ENEMY_WALK = {
  zombie: { start: 13,
    a: ['....kook.kook...', '....kzzk.kkkk...', '....kkk.........'],
    b: ['....kook.kook...', '....kkkk.kzzk...', '..........kkk...'] },
  marauder: { start: 13,
    a: ['....kook.kook...', '....knnk.kkkk...', '....kkk.........'],
    b: ['....kook.kook...', '....kkkk.knnk...', '..........kkk...'] },
  rat: { start: 11,
    a: ['pkMMMMMMMMMMk...', 'p.kMkkMkkMkk....', '.pp.k..k........'],
    b: ['.kMMMMMMMMMMk...', 'pp.kMkkMkkMk....', '....k...k.......'] },
};
function walkRows(rows, w, key) {
  const out = rows.slice();
  w[key].forEach((r, i) => { out[w.start + i] = r; });
  return out;
}

// Готовые спрайты: SPR[name] = { n, f (отражённый), w (белый силуэт), wf, w/h }
const SPR = {};
// Тайлы земли для каждой локации
const TILES = {};

function buildSprite(rows, size, pal, height) {
  const P = Object.assign({}, PALETTE, pal || {});
  const H = height || size;
  const c = makeCanvas(size, H), x = c.getContext('2d');
  for (let j = 0; j < H; j++) {
    const row = rows[j] || '';
    for (let i = 0; i < size; i++) {
      const ch = row[i];
      if (!ch || ch === '.' || ch === ' ') continue;
      const col = P[ch];
      if (!col) continue;
      x.fillStyle = col;
      x.fillRect(i, j, 1, 1);
    }
  }
  shadeSprite(c);
  return c;
}

// Автоматический объём: свет сверху-слева, тень снизу-справа, лёгкая фактура.
// Работает для всех спрайтов сразу — контур (цвет k) не трогаем.
function shadeSprite(c) {
  const x = c.getContext('2d'), w = c.width, h = c.height;
  const im = x.getImageData(0, 0, w, h), d = im.data, src = new Uint8ClampedArray(d);
  const empty = (i, j) => i < 0 || j < 0 || i >= w || j >= h || src[(j * w + i) * 4 + 3] === 0;
  const isK = (i, j) => { const o = (j * w + i) * 4; return src[o] === 26 && src[o + 1] === 28 && src[o + 2] === 44; };
  // «снаружи» — пустота или внешний контур; чёрные детали внутри (глаза, ремни) считаются телом
  const solid = (i, j) => {
    if (empty(i, j)) return false;
    if (!isK(i, j)) return true;
    return !(empty(i - 1, j) || empty(i + 1, j) || empty(i, j - 1) || empty(i, j + 1));
  };
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (empty(i, j) || isK(i, j)) continue;
    const o = (j * w + i) * 4;
    let f = 1;
    if (!solid(i, j - 1)) f = 1.2;                 // верхняя кромка — блик
    else if (!solid(i, j + 1)) f = 0.74;           // нижняя кромка — тень
    else if (!solid(i + 1, j)) f = 0.84;           // правая сторона темнее
    else if (!solid(i - 1, j)) f = 1.1;            // левая сторона светлее
    else if ((i * 7 + j * 13) % 11 === 0) f = 0.94; // редкая «зернистость» внутри
    d[o] = Math.min(255, src[o] * f); d[o + 1] = Math.min(255, src[o + 1] * f); d[o + 2] = Math.min(255, src[o + 2] * f);
  }
  x.putImageData(im, 0, 0);
}

function flipCanvas(src) {
  const c = makeCanvas(src.width, src.height), x = c.getContext('2d');
  x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
  return c;
}

function whiteCanvas(src) {
  const c = makeCanvas(src.width, src.height), x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height);
  return c;
}

function registerSprite(name, canvas) {
  const f = flipCanvas(canvas);
  SPR[name] = { n: canvas, f, w: whiteCanvas(canvas), wf: whiteCanvas(f), size: canvas.width, sw: canvas.width, sh: canvas.height };
}

function buildTiles(g, seed) {
  const rnd = mulberry32(seed), out = [];
  for (let v = 0; v < 4; v++) {
    const c = makeCanvas(16, 16), x = c.getContext('2d');
    const px = (col, i, j) => { x.fillStyle = col; x.fillRect(i, j, 1, 1); };
    x.fillStyle = g.base; x.fillRect(0, 0, 16, 16);
    if (g.style === 'plate') {
      x.fillStyle = g.dark; x.fillRect(0, 0, 16, 1); x.fillRect(0, 0, 1, 16);
      x.fillStyle = g.light; x.fillRect(1, 1, 15, 1); x.fillRect(1, 1, 1, 15);
      px(g.dark, 3, 3); px(g.dark, 12, 3); px(g.dark, 3, 12); px(g.dark, 12, 12);
    }
    const n = 8 + v * 5;
    for (let i = 0; i < n; i++) px(rnd() < 0.5 ? g.dark : g.light, (rnd() * 16) | 0, (rnd() * 16) | 0);
    if (v === 2) {
      if (g.style === 'sand') for (let i = 3; i < 12; i++) px(g.light, i, 8 + Math.round(Math.sin(i * 0.7) * 1.5));
      if (g.style === 'plate') for (let i = 0; i < 7; i++) px(g.accent, 5 + ((rnd() * 6) | 0), 5 + ((rnd() * 6) | 0));
      if (g.style === 'forest') for (let i = 0; i < 4; i++) { const a = 2 + ((rnd() * 12) | 0), b = 4 + ((rnd() * 10) | 0); px(g.accent, a, b); px(g.accent, a, b - 1); px(g.accent, a + 1, b); }
    }
    if (v === 3) {
      if (g.style === 'sand') { let a = 3, b = 4; for (let i = 0; i < 9; i++) { px(g.accent, a, b); a += 1; b += rnd() < 0.5 ? 1 : 0; } }
      if (g.style === 'plate') { x.fillStyle = g.dark; for (let i = 4; i < 12; i += 2) x.fillRect(4, i, 8, 1); }
      if (g.style === 'forest') for (let i = 0; i < 5; i++) px(rnd() < 0.5 ? '#8b4a2b' : '#b86f32', (rnd() * 16) | 0, (rnd() * 16) | 0);
    }
    out.push(c);
  }
  return out;
}

function initSprites() {
  for (const name in SPRITE_DATA) {
    const d = SPRITE_DATA[name];
    registerSprite(name, buildSprite(d.rows, d.size, d.pal, d.h));
  }
  // Герои: все кадры анимации + спрайт без суффикса для интерфейса
  buildHeroSprites(); // детальные герои 24x38 рисуются по слоям в heroart.js
  // Кадры шага врагов (имя_a / имя_b), великан — перекрашенный зомби
  const giantPal = { z: '#7a6a9a', Z: '#4a3a6a', b: '#733e39', B: '#8b4a2b', r: '#ff3030' };
  for (const name in ENEMY_WALK) {
    const w = ENEMY_WALK[name], rows = SPRITE_DATA[name].rows;
    for (const k of ['a', 'b']) {
      registerSprite(name + '_' + k, buildSprite(walkRows(rows, w, k), 16));
      if (name === 'zombie') registerSprite('giant_' + k, buildSprite(walkRows(rows, w, k), 16, giantPal));
    }
  }
  // Варианты через смену палитры
  registerSprite('giant', buildSprite(SPRITE_DATA.zombie.rows, 16, { z: '#7a6a9a', Z: '#4a3a6a', b: '#733e39', B: '#8b4a2b', r: '#ff3030' }));
  registerSprite('queen', buildSprite(SPRITE_DATA.slime.rows, 16, { l: '#c77dff', g: '#7b2cbf', w: '#f4f4f4' }));
  registerSprite('toxic', buildSprite(SPRITE_DATA.puddle.rows, 16, { l: '#c77dff', G: '#7b2cbf' }));
  registerSprite('wagon', buildSprite(SPRITE_DATA.car.rows, 32, { R: '#3b5dc9', r: '#29366f', o: '#1a1c2c' }, 16));
  registerSprite('gem2', buildSprite(SPRITE_DATA.gem.rows, 8, { B: '#a7f070', b: '#38b764' }));
  registerSprite('gem3', buildSprite(SPRITE_DATA.gem.rows, 8, { B: '#ef7d57', b: '#b13e53' }));
  registerSprite('oil', buildSprite(SPRITE_DATA.puddle.rows, 16, { l: '#262b44', G: '#1a1c2c', w: '#566c86' }));
  registerSprite('scrap', buildSprite(SPRITE_DATA.rock.rows, 16, { m: '#b86f32', M: '#733e39', w: '#ef7d57', n: '#5d275d' }));
  buildEnemySprites(); // детальные враги и боссы (enemyart.js) заменяют старые спрайты 16x16
  for (const loc of LOCATIONS) TILES[loc.id] = { a: richTiles(loc.ground, loc.seed), b: richTiles(loc.ground2, loc.seed + 1) };
}

// Детальные тайлы грунта: 6 вариантов на каждый тип поверхности
function richTiles(g, seed) {
  const rnd = mulberry32(seed), out = [];
  const R = n => (rnd() * n) | 0;
  for (let v = 0; v < 6; v++) {
    const c = makeCanvas(16, 16), x = c.getContext('2d');
    const px = (col, i, j, w, h) => { x.fillStyle = col; x.fillRect(i, j, w || 1, h || 1); };
    px(g.base, 0, 0, 16, 16);
    for (let i = 0; i < 14 + v * 3; i++) px(rnd() < 0.5 ? g.dark : g.light, R(16), R(16)); // зернистость
    switch (g.style) {
      case 'sand': // рябь барханов
        for (let k = 0; k < 2; k++) {
          const y0 = 3 + k * 8 + R(3);
          for (let i = 0; i < 16; i++) if ((i + v * 3) % 16 < 11) px(k ? g.dark : g.light, i, y0 + Math.round(Math.sin((i + v * 5) * 0.6) * 1.2));
        }
        if (v === 4) for (let i = 0; i < 5; i++) px(g.accent, 4 + R(8), 4 + R(8));
        break;
      case 'cracked': { // растрескавшаяся корка
        let a = R(3), b = R(3);
        for (let j = 0; j < 16; j++) { px(g.dark, a, j); if (rnd() < 0.35) a = clamp(a + (rnd() < 0.5 ? -1 : 1), 0, 15); }
        for (let i = 0; i < 16; i++) { px(g.dark, i, b); if (rnd() < 0.35) b = clamp(b + (rnd() < 0.5 ? -1 : 1), 0, 15); }
        if (v % 2) { let qx = 6 + R(4), qy = R(16); for (let i = 0; i < 7; i++) { px(g.accent, qx, qy); qx += rnd() < 0.5 ? 1 : 0; qy = (qy + 1) % 16; } }
        px(g.light, 5 + R(6), 5 + R(6), 2, 1);
        break;
      }
      case 'plate': // металлические плиты с заклёпками
        px(g.dark, 0, 0, 16, 1); px(g.dark, 0, 0, 1, 16); px(g.light, 1, 1, 15, 1); px(g.light, 1, 1, 1, 15);
        for (const [a, b] of [[3, 3], [12, 3], [3, 12], [12, 12]]) { px(g.dark, a, b); px(g.light, a, b + 1); }
        if (v === 2) for (let i = 0; i < 10; i++) px(g.accent, 4 + R(8), 4 + R(8));          // ржавчина
        if (v === 3) for (let j = 5; j < 12; j += 2) px(g.dark, 4, j, 8, 1);                 // решётка
        if (v === 4) for (let i = 0; i < 12; i++) px('#262b44', 3 + R(10), 6 + R(6));        // масляное пятно
        if (v === 5) for (let i = 2; i < 14; i++) px((i >> 1) % 2 ? '#d59a3b' : '#1a1c2c', i, 7, 1, 2); // жёлто-чёрная полоса
        break;
      case 'concrete': // бетон со швами и трещинами
        px(g.dark, 0, 15, 16, 1); px(g.dark, 15, 0, 1, 16);
        if (v % 3 === 1) { let a = 2 + R(12); for (let j = 0; j < 10; j++) { px(g.dark, a, j); if (rnd() < 0.4) a = clamp(a + (rnd() < 0.5 ? -1 : 1), 0, 14); } }
        if (v === 5) for (let i = 0; i < 7; i++) px(g.accent, 5 + R(6), 5 + R(6));
        break;
      case 'forest': // сырая земля с корешками и листьями
        for (let i = 0; i < 3; i++) { const a = 1 + R(14), b = 3 + R(12); px(g.accent, a, b); px(g.accent, a, b - 1); }
        if (v >= 3) for (let i = 0; i < 4; i++) px(rnd() < 0.5 ? '#8b4a2b' : '#b86f32', R(16), R(16));
        if (v === 5) { px(g.dark, 5, 6, 5, 3); px(g.dark, 6, 5, 3, 5); }
        break;
      case 'grass': // густая трава
        for (let i = 0; i < 12; i++) { const a = R(16), b = 2 + R(14); px(g.light, a, b); px(g.accent, a, b - 1); }
        for (let i = 0; i < 4; i++) px(g.dark, R(15), R(15), 2, 1);
        if (v === 4) { px('#e86a92', 6, 7); px('#ffcd75', 10, 4); }
        break;
    }
    out.push(c);
  }
  return out;
}

// Крупный портрет героя: голова и плечи на фоне с подсветкой
function portraitURL(name, tint) {
  const key = 'portrait:' + name + tint;
  if (_iconCache[key]) return _iconCache[key];
  // верхняя часть спрайта 24x38: голова, плечи, грудь
  const k = 8, SW = 24, SH = 24, c = makeCanvas(SW * k, (SH + 1) * k), x = c.getContext('2d');
  const g = x.createRadialGradient(12 * k, 11 * k, k, 12 * k, 12 * k, 17 * k);
  g.addColorStop(0, tint); g.addColorStop(1, '#14162a');
  x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
  // пиксельные лучи за спиной
  x.globalAlpha = 0.12; x.fillStyle = '#ffffff';
  for (let i = 0; i < 12; i++) {
    x.save(); x.translate(12 * k, 12 * k); x.rotate(i * Math.PI / 6);
    x.fillRect(-k / 2, 0, k, 20 * k); x.restore();
  }
  x.globalAlpha = 1;
  x.imageSmoothingEnabled = false;
  // светлая обводка-«наклейка» вокруг силуэта
  x.globalAlpha = 0.55;
  for (const [ox, oy] of [[-4, 0], [4, 0], [0, -4], [0, 4]]) x.drawImage(SPR[name].w, 0, 0, SW, SH, ox, k + oy, SW * k, SH * k);
  x.globalAlpha = 1;
  x.drawImage(SPR[name].n, 0, 0, SW, SH, 0, k, SW * k, SH * k);
  return (_iconCache[key] = c.toDataURL());
}

// ---------- Крупные планы для комикса ----------
// Алгоритм EPX (Scale2x): увеличивает пиксель-арт вдвое, сглаживая «лесенки» в ровные линии.
// Три прохода дают увеличение в 8 раз — получается гладкий рисунок в духе комикса.
function epx(src) {
  const w = src.width, h = src.height;
  const sd = new Uint32Array(src.getContext('2d').getImageData(0, 0, w, h).data.buffer);
  const out = makeCanvas(w * 2, h * 2), ox = out.getContext('2d'), im = ox.createImageData(w * 2, h * 2);
  const od = new Uint32Array(im.data.buffer);
  const at = (i, j) => sd[clamp(j, 0, h - 1) * w + clamp(i, 0, w - 1)];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const P = sd[j * w + i], A = at(i, j - 1), B = at(i + 1, j), C = at(i - 1, j), D = at(i, j + 1);
    const o = j * 2 * w * 2 + i * 2;
    od[o] = C === A && C !== D && A !== B ? A : P;
    od[o + 1] = A === B && A !== C && B !== D ? B : P;
    od[o + w * 2] = D === C && D !== B && C !== A ? C : P;
    od[o + w * 2 + 1] = B === D && B !== A && D !== C ? D : P;
  }
  ox.putImageData(im, 0, 0);
  return out;
}

// Крупный план персонажа: герой — по грудь, монстр — целиком. Жирная обводка, как в комиксе
function bustURL(name) {
  const key = 'bust:' + name;
  if (_iconCache[key]) return _iconCache[key];
  const s = SPR[name].n, hero = s.height > 30;
  let c = makeCanvas(s.width, hero ? 25 : s.height);
  c.getContext('2d').drawImage(s, 0, 0);
  for (let i = 0; i < 3; i++) c = epx(c);
  const pad = 10, out = makeCanvas(c.width + pad * 2, c.height + pad), x = out.getContext('2d');
  // силуэт для обводки
  const sil = makeCanvas(c.width, c.height), sx = sil.getContext('2d');
  sx.drawImage(c, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = '#0c0d18'; sx.fillRect(0, 0, c.width, c.height);
  for (let a = 0; a < 16; a++) x.drawImage(sil, pad + Math.cos(a * Math.PI / 8) * 6, pad + Math.sin(a * Math.PI / 8) * 6);
  x.drawImage(c, pad, pad);
  return (_iconCache[key] = out.toDataURL());
}

// Картинка спрайта для HTML-интерфейса
const _iconCache = {};
function iconURL(name, px) {
  const key = name + '@' + px;
  if (_iconCache[key]) return _iconCache[key];
  const s = SPR[name].n, ph = Math.round(px * s.height / s.width);
  const c = makeCanvas(px, ph), x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.drawImage(s, 0, 0, px, ph);
  return (_iconCache[key] = c.toDataURL());
}
