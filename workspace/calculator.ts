// calculator.ts
// 計算ユーティリティ

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/**
 * 2つの数値を加算します。
 * 純粋関数で、エラーは戻り値で表現します。
 */
export function add(a: number, b: number): Result<number> {
  return { ok: true, value: a + b };
}

/**
 * 2つの数値を除算します。
 * ゼロ除算時は例外を投げる代わりにエラーを戻り値として返します。
 */
export function divide(a: number, b: number): Result<number> {
  if (b === 0) {
    return { ok: false, error: "Division by zero" };
  }
  return { ok: true, value: a / b };
}