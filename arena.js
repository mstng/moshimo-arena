// もしも闘技場 - データと判定ロジック
// 歴史上の偉人を6つのステータスで数値化し、土俵ごとの重み付けで勝率を算出する。
// 乱数を一切使わないので、同じ組み合わせなら必ず同じ結果になる（＝検証可能）。

// ステータスの定義。key はデータ側、label は画面表示用。
const STATS = [
  { key: "buyu",     label: "武勇",     desc: "自ら戦う力。個の強さ" },
  { key: "tosotsu",  label: "統率",     desc: "軍・組織を動かし、維持する力" },
  { key: "chiryaku", label: "知略",     desc: "策を立て、状況を読む力" },
  { key: "seiji",    label: "政治",     desc: "制度・人事・交渉で勝つ力" },
  { key: "hatsumei", label: "発明",     desc: "新しい仕組みや技術を生む力" },
  { key: "charisma", label: "カリスマ", desc: "地位も実績もない状態で、人が付いてくる力" },
];

// 人物データ。
// stats の各値は「作者の主観」だが、notes に必ず史実の根拠を1行添える。
// 数値そのものより「なぜその数値なのか」を読ませることが、このアプリの目的。
const FIGURES = [
  {
    id: "nobunaga", name: "織田信長", era: "1534-1582", region: "日本 / 戦国",
    stats: { buyu: 72, tosotsu: 88, chiryaku: 85, seiji: 82, hatsumei: 70, charisma: 78 },
    notes: {
      buyu:     "桶狭間では自ら先陣を切ったが、本分は指揮官の側",
      tosotsu:  "兵農分離による常備軍で、動員速度を当時最速にした",
      chiryaku: "長篠では鉄砲を組織的に運用し、騎馬突撃を無力化した",
      seiji:    "楽市楽座と関所撤廃で、経済圏そのものを作り替えた",
      hatsumei: "鉄甲船や鉄砲の量産など、新兵器の導入判断が異常に速い",
      charisma: "うつけと侮られた時期が長く、人望は実績とともに後からついた",
    },
  },
  {
    id: "ieyasu", name: "徳川家康", era: "1543-1616", region: "日本 / 戦国",
    stats: { buyu: 68, tosotsu: 85, chiryaku: 88, seiji: 95, hatsumei: 45, charisma: 70 },
    notes: {
      buyu:     "三方ヶ原では自ら出陣し、大敗しながら生き延びた",
      tosotsu:  "関ヶ原で寄せ集めの東軍を一日で勝利までまとめ切った",
      chiryaku: "待つ・耐える・機を捉えるという判断が生涯一貫している",
      seiji:    "幕藩体制を設計し、結果として260年の泰平を残した",
      hatsumei: "新技術より制度の設計に資源を割いたタイプ",
      charisma: "人質から身を起こしたが、忠誠を支えたのは譜代という家の構造",
    },
  },
  {
    id: "yoshitsune", name: "源義経", era: "1159-1189", region: "日本 / 平安末",
    stats: { buyu: 90, tosotsu: 78, chiryaku: 82, seiji: 25, hatsumei: 40, charisma: 82 },
    notes: {
      buyu:     "一ノ谷・壇ノ浦ともに自ら最前線に立って戦っている",
      tosotsu:  "奇襲部隊の指揮は天才的だが、大軍の長期運用は未知数",
      chiryaku: "鵯越の逆落とし、水手を射る戦法など常識の外から入る",
      seiji:    "頼朝との関係を自ら壊し、政治的に完全に孤立した",
      hatsumei: "新しい道具ではなく、既存の戦法を破ることに長けた",
      charisma: "敗れて追われてなお慕われ、判官贔屓という言葉を残した",
    },
  },
  {
    id: "koumei", name: "諸葛亮", era: "181-234", region: "中国 / 三国",
    stats: { buyu: 30, tosotsu: 88, chiryaku: 92, seiji: 93, hatsumei: 85, charisma: 85 },
    notes: {
      buyu:     "陣中で指揮を執る人であり、自ら斬り結ぶ将ではない",
      tosotsu:  "五度の北伐を通じて、遠征の兵站を破綻させなかった",
      chiryaku: "天下三分の計を提示し、実際にその通りに情勢を動かした",
      seiji:    "蜀の法と財政を整え、自身の死後も体制が持ちこたえた",
      hatsumei: "木牛流馬・連弩の改良など、器具の記録が複数残る",
      charisma: "無官の在野にありながら、三顧の礼をもって迎えられた",
    },
  },
  {
    id: "sousou", name: "曹操", era: "155-220", region: "中国 / 三国",
    stats: { buyu: 70, tosotsu: 90, chiryaku: 90, seiji: 88, hatsumei: 55, charisma: 76 },
    notes: {
      buyu:     "若年から自ら従軍し、負傷しながらも生還している",
      tosotsu:  "官渡で圧倒的な兵力差を覆し、華北を統一した",
      chiryaku: "屯田制によって兵糧問題を戦術ではなく構造から解決した",
      seiji:    "唯才是挙を掲げ、門閥ではなく能力で人を採った",
      hatsumei: "制度と運用の刷新に強く、器物の発明は多くない",
      charisma: "宦官の孫という出自の不利を、官職と実績で塗り替えていった",
    },
  },
  {
    id: "ryofu", name: "呂布", era: "?-199", region: "中国 / 三国",
    stats: { buyu: 99, tosotsu: 55, chiryaku: 35, seiji: 15, hatsumei: 20, charisma: 42 },
    notes: {
      buyu:     "人中に呂布、馬中に赤兎と並び称された当代最強の武人",
      tosotsu:  "兵を動かすことはできたが、組織として保てなかった",
      chiryaku: "陳宮の献策を退け続け、下邳で包囲され敗れた",
      seiji:    "主君を二度手にかけ、諸侯からの信用を完全に失った",
      hatsumei: "新しい仕組みを生んだ記録は残っていない",
      charisma: "武威で従わせただけで、最期は自らの部下に裏切られた",
    },
  },
  {
    id: "napoleon", name: "ナポレオン", era: "1769-1821", region: "フランス",
    stats: { buyu: 65, tosotsu: 95, chiryaku: 92, seiji: 85, hatsumei: 60, charisma: 90 },
    notes: {
      buyu:     "砲兵将校の出身。トゥーロンでは自ら砲台を指揮した",
      tosotsu:  "アウステルリッツで、数で勝る連合軍を機動で撃破した",
      chiryaku: "軍団制と行軍速度によって、数の不利を構造ごと覆した",
      seiji:    "ナポレオン法典は今も各国の民法の原型になっている",
      hatsumei: "食料保存の賞金公募が缶詰を生むなど実用技術を推進した",
      charisma: "地位も軍も失った状態で、討伐に来た軍が無血で寝返った",
    },
  },
  {
    id: "caesar", name: "ユリウス・カエサル", era: "前100-前44", region: "ローマ",
    stats: { buyu: 72, tosotsu: 92, chiryaku: 88, seiji: 90, hatsumei: 50, charisma: 84 },
    notes: {
      buyu:     "ガリア戦役では前線に立ち、兵と同じ物を食べたと伝わる",
      tosotsu:  "アレシアで内外二重の包囲陣を築き、挟撃を凌ぎ切った",
      chiryaku: "ルビコン渡河は軍事ではなく政治的タイミングの勝負だった",
      seiji:    "制定したユリウス暦は千六百年にわたり使われ続けた",
      hatsumei: "土木・架橋の工兵運用そのものが実質的な武器だった",
      charisma: "兵と同じ物を食べたが、名門の地位と財力が土台にあった",
    },
  },
  {
    id: "alexandros", name: "アレクサンドロス大王", era: "前356-前323", region: "マケドニア",
    stats: { buyu: 92, tosotsu: 93, chiryaku: 85, seiji: 60, hatsumei: 45, charisma: 86 },
    notes: {
      buyu:     "近衛騎兵の先頭で突撃し、生涯に何度も重傷を負っている",
      tosotsu:  "ガウガメラで数倍のペルシア軍を破り、帝国を崩壊させた",
      chiryaku: "ゴルディオンの結び目に象徴される、前提を壊す発想",
      seiji:    "征服の速度に統治の設計が追いつかず、死後すぐ分裂した",
      hatsumei: "攻城技術は専門の技師団に依存していた",
      charisma: "最前線で負傷し続けた点は本物だが、王子という地位が前提にある",
    },
  },
  {
    id: "jeanne", name: "ジャンヌ・ダルク", era: "1412-1431", region: "フランス",
    stats: { buyu: 60, tosotsu: 82, chiryaku: 55, seiji: 40, hatsumei: 15, charisma: 98 },
    notes: {
      buyu:     "旗を掲げて前線に立ち、矢を受けても戦列に戻った",
      tosotsu:  "半年続いたオルレアン包囲を、到着から9日で解いた",
      chiryaku: "細かな戦術は将に委ね、決断の速さで押し切る型",
      seiji:    "政治的な後ろ盾を得られず、裁判で切り捨てられた",
      hatsumei: "技術的な発明の記録はない",
      charisma: "地位も実績もない17歳の農民が、敗け続けた国王軍を動かした",
    },
  },
  {
    id: "chingis", name: "チンギス・ハン", era: "1162-1227", region: "モンゴル",
    stats: { buyu: 85, tosotsu: 97, chiryaku: 88, seiji: 78, hatsumei: 50, charisma: 88 },
    notes: {
      buyu:     "少年期から実戦を重ね、草原の部族戦を勝ち抜いてきた",
      tosotsu:  "十進法の軍制で、ユーラシアを横断する遠征を可能にした",
      chiryaku: "偽装退却と広域の情報網を、感覚ではなく体系として使った",
      seiji:    "ヤサ法典と駅伝制で、広すぎる領域を一つに繋いだ",
      hatsumei: "攻城技術は征服地の技術者をそのまま取り込んで調達した",
      charisma: "部族に見捨てられた孤児の状態から、人を集め直した",
    },
  },
  {
    id: "davinci", name: "レオナルド・ダ・ヴィンチ", era: "1452-1519", region: "イタリア",
    stats: { buyu: 45, tosotsu: 35, chiryaku: 88, seiji: 50, hatsumei: 99, charisma: 66 },
    notes: {
      buyu:     "怪力の逸話は残るが、戦闘の経験そのものはない",
      tosotsu:  "工房を率いた経験はあるが、軍を指揮したことはない",
      chiryaku: "観察と分解によって、対象の構造を見抜く力に長けた",
      seiji:    "君主に仕えながら立場を渡り歩く処世は巧みだった",
      hatsumei: "飛行機械・装甲車・人体解剖図を500年前に描いていた",
      charisma: "名声はあったが、常にパトロンの庇護を必要とした",
    },
  },
  {
    id: "edison", name: "トーマス・エジソン", era: "1847-1931", region: "アメリカ",
    stats: { buyu: 30, tosotsu: 68, chiryaku: 75, seiji: 72, hatsumei: 95, charisma: 60 },
    notes: {
      buyu:     "発明家であり、戦闘に関する記録はない",
      tosotsu:  "メンロパークに、世界初の組織的な研究所を作り上げた",
      chiryaku: "理論より試行回数で解に到達する、力押しの探索型",
      seiji:    "電流戦争では世論操作と特許を武器として使った",
      hatsumei: "生涯で取得した特許は1093件にのぼる",
      charisma: "発明王としての人気は、実績が出たあとに生まれたもの",
    },
  },
  {
    id: "newton", name: "アイザック・ニュートン", era: "1642-1727", region: "イギリス",
    stats: { buyu: 20, tosotsu: 40, chiryaku: 97, seiji: 65, hatsumei: 80, charisma: 38 },
    notes: {
      buyu:     "戦闘に関する記録は一切ない",
      tosotsu:  "造幣局長官として組織は動かしたが、軍歴はない",
      chiryaku: "プリンキピアで、宇宙の運動を数式の体系に落とし込んだ",
      seiji:    "造幣局で贋金犯を自ら追い詰めるなど、実務でも成果を出した",
      hatsumei: "反射望遠鏡を自作し、微積分の手法を確立した",
      charisma: "論争で敵を作り続け、人が集まってくる人物ではなかった",
    },
  },
  {
    id: "cleopatra", name: "クレオパトラ7世", era: "前69-前30", region: "エジプト",
    stats: { buyu: 30, tosotsu: 55, chiryaku: 85, seiji: 90, hatsumei: 40, charisma: 82 },
    notes: {
      buyu:     "自ら武器を取って戦う立場にはなかった",
      tosotsu:  "アクティウムの海戦で艦隊を維持し切れず、戦線が崩れた",
      chiryaku: "絨毯に包まれてカエサルの前に現れた逸話が象徴的",
      seiji:    "ローマの二大実力者を続けて味方につけ、王国を延命させた",
      hatsumei: "自ら発明はしないが、学術都市の保護者ではあった",
      charisma: "対面の魅力は本物だが、女王という地位あっての交渉だった",
    },
  },
  {
    id: "musashi", name: "宮本武蔵", era: "1584-1645", region: "日本 / 江戸初期",
    stats: { buyu: 95, tosotsu: 45, chiryaku: 80, seiji: 35, hatsumei: 60, charisma: 62 },
    notes: {
      buyu:     "生涯六十余戦して無敗であると、自ら五輪書に記した",
      tosotsu:  "個人の剣客であり、軍を率いた実績はほとんどない",
      chiryaku: "五輪書で、勝つための「兵法の利」を理論として体系化した",
      seiji:    "仕官の時期が遅く、大きな地位を得ることはなかった",
      hatsumei: "二天一流という流派そのものを新しく作り出した",
      charisma: "門人は集まったが、組織や勢力にまではならなかった",
    },
  },
];

// 土俵。土俵ごとにステータスの重みが変わる＝同じ人物でも土俵次第で勝敗が入れ替わる。
// 重みの合計は必ず 1.0 になるようにしている（テストで検証）。
const FIELDS = [
  {
    key: "ikki", name: "一騎討ち", icon: "⚔️",
    desc: "一対一で刃を交える。組織も制度も関係ない、個の強さだけの勝負",
    weights: { buyu: 0.85, chiryaku: 0.09, charisma: 0.04, tosotsu: 0.02 },
  },
  {
    key: "kaisen", name: "会戦", icon: "🚩",
    desc: "大軍を率いて正面からぶつかる。動かせる兵の数ではなく、動かし方で決まる",
    weights: { tosotsu: 0.45, chiryaku: 0.25, charisma: 0.15, buyu: 0.15 },
  },
  {
    key: "bouryaku", name: "謀略戦", icon: "🎭",
    desc: "戦場に出ずに勝つ。調略・政争・交渉だけで相手を無力化する",
    weights: { chiryaku: 0.40, seiji: 0.40, charisma: 0.20 },
  },
  {
    key: "hatsumei", name: "発明レース", icon: "💡",
    desc: "同じ時代・同じ資源を与えられたとき、どちらが先に新しいものを生むか",
    weights: { hatsumei: 0.60, chiryaku: 0.30, seiji: 0.10 },
  },
  {
    key: "jinshin", name: "人心掌握", icon: "🔥",
    desc: "兵も領土も地位もない状態から始める。どちらが先に、人を集められるか",
    weights: { charisma: 0.75, tosotsu: 0.15, chiryaku: 0.10 },
  },
  {
    key: "tenka", name: "天下取り", icon: "👑",
    desc: "同じ乱世に生まれ落ちたら、最後に立っているのはどちらか",
    weights: { tosotsu: 0.25, seiji: 0.25, chiryaku: 0.20, charisma: 0.20, buyu: 0.10 },
  },
];

// 勝率カーブの傾き。スコア差がこの値のとき勝率は約91%になる。
// 小さくすると番狂わせが起きにくい（差がすぐ100%に振り切れる）ので、
// 「格上でも絶対ではない」感を残すために大きめの値にしている。
const RATING_SCALE = 25;

// 表示上の勝率の下限・上限。0%や100%と言い切らないための安全弁。
const MIN_WIN_RATE = 1;
const MAX_WIN_RATE = 99;

// id から人物を引く。見つからなければ null。
function findFigure(id) {
  return FIGURES.find((figure) => figure.id === id) || null;
}

// key から土俵を引く。見つからなければ null。
function findField(key) {
  return FIELDS.find((field) => field.key === key) || null;
}

// ある人物の、その土俵における総合スコア（0〜100）を計算する。
// 重みの合計が1.0なので、結果もそのまま0〜100に収まる。
function calcScore(figure, field) {
  let score = 0;
  for (const [statKey, weight] of Object.entries(field.weights)) {
    score += figure.stats[statKey] * weight;
  }
  return score;
}

// スコア差から勝率（0〜1）を求める。Elo と同じロジスティック関数。
// 差が0なら0.5、差が大きいほど1に近づくが、決して1にはならない。
function scoreToWinRate(scoreA, scoreB) {
  return 1 / (1 + Math.pow(10, (scoreB - scoreA) / RATING_SCALE));
}

// 勝敗を判定して、根拠まで含めた結果オブジェクトを返す。
// 乱数を使わないので、同じ引数なら常に同じ結果になる。
function judge(idA, idB, fieldKey) {
  const a = findFigure(idA);
  const b = findFigure(idB);
  const field = findField(fieldKey);

  // 不正な入力は早い段階で落とす。画面側で握りつぶさないよう例外にする。
  if (!a) throw new Error(`人物が見つかりません: ${idA}`);
  if (!b) throw new Error(`人物が見つかりません: ${idB}`);
  if (!field) throw new Error(`土俵が見つかりません: ${fieldKey}`);

  const scoreA = calcScore(a, field);
  const scoreB = calcScore(b, field);

  // 生の勝率を丸めたうえで、上下限に収める。
  const rawRateA = scoreToWinRate(scoreA, scoreB) * 100;
  const winRateA = Math.min(MAX_WIN_RATE, Math.max(MIN_WIN_RATE, Math.round(rawRateA)));
  // 合計が必ず100になるよう、片方から引いて求める。
  const winRateB = 100 - winRateA;

  // ステータスごとの内訳。この土俵で重みが0のステータスも「効かなかった」事実として残す。
  const breakdown = STATS.map((stat) => {
    const weight = field.weights[stat.key] || 0;
    const valueA = a.stats[stat.key];
    const valueB = b.stats[stat.key];
    return {
      key: stat.key,
      label: stat.label,
      weight,
      valueA,
      valueB,
      noteA: a.notes[stat.key],
      noteB: b.notes[stat.key],
      // 重み × 差分 ＝ そのステータスが勝敗に効いた量。
      contribution: (valueA - valueB) * weight,
    };
  });

  // 決め手＝勝敗への寄与が最も大きかったステータス。
  const decisive = breakdown.reduce((best, current) =>
    Math.abs(current.contribution) > Math.abs(best.contribution) ? current : best
  );

  return {
    a, b, field,
    scoreA, scoreB,
    winRateA, winRateB,
    winner: winRateA === winRateB ? "draw" : (winRateA > winRateB ? "a" : "b"),
    breakdown,
    decisive,
  };
}

// ブラウザでは classic script のグローバルとして、Node ではモジュールとして使えるようにする。
// （ビルド不要でローカルの file:// でもそのまま開けるようにするための書き方）
if (typeof module !== "undefined" && module.exports) {
  module.exports = { STATS, FIGURES, FIELDS, RATING_SCALE, MIN_WIN_RATE, MAX_WIN_RATE, findFigure, findField, calcScore, scoreToWinRate, judge };
}
