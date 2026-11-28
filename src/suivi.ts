import {
  type ComputedRef,
  type MaybeRef,
  type Ref,
  type UnwrapRef,
  computed,
  isRef,
  onUnmounted,
  ref,
  watchEffect,
} from "vue";
import type { DébalerRéf, PossiblementUnePromesse } from "./types.js";
import { Stabilisateur, débalerRéfsArgs } from "./utils.js";
import type { Oublier, Suivi } from "@constl/interface";
import type { DagCborEncodable } from "@orbitdb/core";

export const suivre = <
  U,
  V extends U | undefined,
  W extends Oublier,
  T extends { [clef: string]: MaybeRef<DagCborEncodable | undefined> } = Record<
    string,
    never
  >,
>(
  fonc: (
    args: {
      [K in keyof T]: DébalerRéf<
        T[K] extends Ref ? Ref<Exclude<UnwrapRef<T[K]>, undefined>> : T[K]
      >;
    } & { f: Suivi<U> },
  ) => PossiblementUnePromesse<W | (() => void)>,
  args: T = {} as T,
  défaut?: V,
): ComputedRef<U | V> => {
  const val = ref(défaut) as Ref<U | V>;
  const stab = new Stabilisateur();

  let fOublier: Oublier | (() => void) | undefined =
    undefined;
  const dynamique = Object.values(args).some((x) => isRef(x));

  const définis = computed(() => {
    const argsFinaux = débalerRéfsArgs(args);
    if (Object.values(argsFinaux).every((x) => x !== undefined)) {
      return argsFinaux as {
        [K in keyof T]: DébalerRéf<
          T[K] extends Ref ? Ref<Exclude<UnwrapRef<T[K]>, undefined>> : T[K]
        >;
      };
    } else {
      return undefined;
    }
  });

  watchEffect(async () => {
    if (fOublier) {
      fOublier(); // Très bizare... `await` ici détruit la réactivité
      fOublier = undefined;
    }
    if (définis.value) {
      // Si les intrants sont dynamiques, stabiliser suite à la première exécution
      if (dynamique && fOublier) {
        const stable = await stab.stabiliser(définis.value);
        if (!stable) return;
      }

      fOublier = await fonc({
        ...définis.value,
        f: (x: U) => (val.value = x),
      });
    } else {
      val.value = undefined as U | V;
    }
  });

  onUnmounted(async () => {
    if (fOublier) await fOublier();
  });

  return computed(() => val.value);
};
