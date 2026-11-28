import type { DébalerRéfsArgs } from "./types.js";

import deepEqual from "deep-equal";
import { type MaybeRef, unref } from "vue";
import type { DagCborEncodable } from "@orbitdb/core";

export class Stabilisateur {
  n: number;
  valeurAntérieure?: { [clef: string]: DagCborEncodable | undefined };

  constructor(n = 1000) {
    this.n = n;
  }
  async stabiliser(args: {
    [clef: string]: DagCborEncodable | undefined;
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
  T extends { [clef: string]: MaybeRef<DagCborEncodable | undefined> },
>(
  args: T,
): DébalerRéfsArgs<T> => {
  return Object.fromEntries(
    Object.entries(args).map(([clef, val]) => [clef, unref(val)]),
  ) as DébalerRéfsArgs<T>;
};
