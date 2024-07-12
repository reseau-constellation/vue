import type { types } from "@constl/ipa";
import type { DébalerRéfsArgs } from "./types.js";

import deepEqual from "deep-equal";
import { MaybeRef, unref } from "vue";

export class Stabilisateur {
  n: number;
  valeurAntérieure?: { [clef: string]: types.élémentsBd | undefined };

  constructor(n = 1000) {
    this.n = n;
  }
  async stabiliser(args: {
    [clef: string]: types.élémentsBd | undefined;
  }): Promise<boolean> {
    // Arrêter tout de suite si ces valeurs ont déjà été soumises
    if (deepEqual(args, this.valeurAntérieure)) return false;

    this.valeurAntérieure = args;

    return new Promise((résoudre) => {
      setTimeout(
        () => résoudre(deepEqual(args, this.valeurAntérieure)),
        this.n,
      );
    });
  }
}

export const débalerRéfsArgs = <
  T extends { [clef: string]: MaybeRef<types.élémentsBd | undefined> },
>(
  args: T,
): DébalerRéfsArgs<T> => {
  return Object.fromEntries(
    Object.entries(args).map(([clef, val]) => [clef, unref(val)]),
  ) as DébalerRéfsArgs<T>;
};
