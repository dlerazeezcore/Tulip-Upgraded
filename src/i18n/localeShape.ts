// The contract every locale file must satisfy.
//
// `en.ts` is the source of truth and ends in `as const`, which makes each of its
// values a LITERAL type — so a plain `satisfies typeof en` in ar.ts/ku.ts would
// demand the Arabic and Kurdish wording be byte-identical to the English. `Widen`
// keeps en's exact key STRUCTURE while relaxing every leaf back to `string`.
//
// Why bother: en/ar/ku were previously three unrelated object literals, so a key
// added to en and forgotten in ar/ku still compiled and shipped — the missing
// string only surfaced at runtime, as a raw key path on screen, in the locale the
// developer was least likely to be looking at. With `satisfies LocaleShape` a
// missing key fails `tsc --noEmit` in CI, and an extra one does too (satisfies
// performs excess-property checking on object literals).

type Widen<T> = T extends string
  ? string
  : T extends readonly (infer _U)[]
    ? readonly string[]
    : { [K in keyof T]: Widen<T[K]> };

/** en's key structure, with any string permitted at the leaves. */
export type LocaleShape = Widen<typeof import('./locales/en')['default']>;
