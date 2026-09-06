// もしも闘技場 - データ整合性と判定ロジックの検証
// 実行: node --test test/
const test = require("node:test");
const assert = require("node:assert");
const { STATS, FIGURES, FIELDS, findFigure, calcScore, judge } = require("../arena.js");

// --- データ整合性 -----------------------------------------------------------
// 数値が主観である以上、せめて「欠けがない・矛盾がない」ことは機械で保証する。

test("人物IDが重複していない", () => {
  const ids = FIGURES.map((f) => f.id);
  assert.strictEqual(new Set(ids).size, ids.length);
});

test("人物名が重複していない", () => {
  const names = FIGURES.map((f) => f.name);
  assert.strictEqual(new Set(names).size, names.length);
});

test("全人物が6ステータスすべてを 0〜100 の範囲で持つ", () => {
  for (const figure of FIGURES) {
    for (const stat of STATS) {
      const value = figure.stats[stat.key];
      assert.strictEqual(typeof value, "number", `${figure.name} の ${stat.label} が数値でない`);
      assert.ok(value >= 0 && value <= 100, `${figure.name} の ${stat.label} が範囲外: ${value}`);
    }
  }
});

test("全ステータスに根拠テキストが書かれている", () => {
  // このアプリの価値は数値ではなく根拠なので、空の根拠は不合格にする。
  for (const figure of FIGURES) {
    for (const stat of STATS) {
      const note = figure.notes[stat.key];
      assert.ok(typeof note === "string" && note.length >= 5,
        `${figure.name} の ${stat.label} に根拠がない`);
    }
  }
});

test("全人物に時代と地域が入っている", () => {
  for (const figure of FIGURES) {
    assert.ok(figure.era && figure.region, `${figure.name} の時代/地域が欠けている`);
  }
});

test("各土俵の重みの合計が 1.0 である", () => {
  // 合計が1.0でないと、スコアが0〜100に収まらず勝率の意味が壊れる。
  for (const field of FIELDS) {
    const total = Object.values(field.weights).reduce((sum, w) => sum + w, 0);
    assert.ok(Math.abs(total - 1.0) < 1e-9, `${field.name} の重み合計が ${total}`);
  }
});

test("土俵の重みキーが実在するステータスを指している", () => {
  const validKeys = STATS.map((s) => s.key);
  for (const field of FIELDS) {
    for (const key of Object.keys(field.weights)) {
      assert.ok(validKeys.includes(key), `${field.name} に未知のステータス ${key}`);
    }
  }
});

// --- スコア計算 -------------------------------------------------------------

test("スコアは常に 0〜100 に収まる", () => {
  for (const figure of FIGURES) {
    for (const field of FIELDS) {
      const score = calcScore(figure, field);
      assert.ok(score >= 0 && score <= 100, `${figure.name}/${field.name} が ${score}`);
    }
  }
});

// --- 判定ロジック -----------------------------------------------------------

test("同一人物どうしは必ず 50% ずつになる", () => {
  const result = judge("nobunaga", "nobunaga", "tenka");
  assert.strictEqual(result.winRateA, 50);
  assert.strictEqual(result.winRateB, 50);
  assert.strictEqual(result.winner, "draw");
});

test("勝率の合計は必ず 100 になる", () => {
  for (const field of FIELDS) {
    for (const a of FIGURES) {
      for (const b of FIGURES) {
        const result = judge(a.id, b.id, field.key);
        assert.strictEqual(result.winRateA + result.winRateB, 100);
      }
    }
  }
});

test("左右を入れ替えても勝率が対称になる", () => {
  const forward = judge("ryofu", "newton", "ikki");
  const reverse = judge("newton", "ryofu", "ikki");
  assert.strictEqual(forward.winRateA, reverse.winRateB);
});

test("同じ引数なら何度呼んでも同じ結果になる（乱数を使っていないことの保証の保証）", () => {
  const first = judge("nobunaga", "caesar", "tenka");
  const second = judge("nobunaga", "caesar", "tenka");
  assert.strictEqual(first.winRateA, second.winRateA);
  assert.strictEqual(first.decisive.key, second.decisive.key);
});

test("一騎討ちでは呂布がニュートンに圧勝する", () => {
  const result = judge("ryofu", "newton", "ikki");
  assert.strictEqual(result.winner, "a");
  assert.ok(result.winRateA >= 90, `勝率が低すぎる: ${result.winRateA}`);
});

test("発明レースでは逆転してニュートンが呂布に勝つ", () => {
  // 土俵を変えると勝敗が入れ替わる、というアプリの核が機能しているかの確認。
  const result = judge("ryofu", "newton", "hatsumei");
  assert.strictEqual(result.winner, "b");
});

test("決め手として最も寄与の大きいステータスが選ばれる", () => {
  // 発明レースでのダ・ヴィンチ対呂布なら、決め手は「発明」になるはず。
  const result = judge("davinci", "ryofu", "hatsumei");
  assert.strictEqual(result.decisive.key, "hatsumei");
});

test("内訳には6ステータスすべてが含まれる", () => {
  // 重み0のステータスも「効かなかった」情報として残す設計。
  const result = judge("davinci", "ryofu", "ikki");
  assert.strictEqual(result.breakdown.length, STATS.length);
});

test("存在しない人物や土俵を渡すと例外になる", () => {
  assert.throws(() => judge("no_such_person", "ryofu", "ikki"), /人物が見つかりません/);
  assert.throws(() => judge("ryofu", "newton", "no_such_field"), /土俵が見つかりません/);
});

test("findFigure は未知のIDに対して null を返す", () => {
  assert.strictEqual(findFigure("no_such_person"), null);
});
