import type { types } from "@constl/ipa";
import {
  MaybeRef,
  Ref,
  UnwrapRef,
  ref,
  isRef,
  computed,
  watchEffect,
  onUnmounted,
} from "vue";
import { type DébalerRéf } from "./types.js";
import { Stabilisateur, débalerRéfsArgs } from "./utils.js";

export const rechercher = <
  U,
  W extends
    | types.schémaRetourFonctionRechercheParN
    | types.schémaRetourFonctionRechercheParProfondeur,
  T extends { [clef: string]: MaybeRef<types.élémentsBd | undefined> } = Record<
    string,
    never
  >,
>(
  fonc: (
    args: {
      [K in keyof T]: DébalerRéf<
        T[K] extends Ref ? Ref<Exclude<UnwrapRef<T[K]>, undefined>> : T[K]
      >;
    } & { f: types.schémaFonctionSuivi<U> },
  ) => Promise<W>,
  args: T = {} as T,
): { résultats: Ref<U | undefined>; onTravaille: Ref<boolean> } => {
  const réfRésultat: Ref<U | undefined> = ref();
  const onTravaille = ref(true);

  const stab = new Stabilisateur();
  const dynamique = Object.values(args).some((x) => isRef(x));

  let fOublier: types.schémaFonctionOublier | undefined = undefined;
  let fChangerNOuProfondeur: (n: number) => Promise<void>;
  const vérifierSiParProfondeur = (
    x:
      | types.schémaRetourFonctionRechercheParN
      | types.schémaRetourFonctionRechercheParProfondeur,
  ): x is types.schémaRetourFonctionRechercheParProfondeur => {
    return !!(x as types.schémaRetourFonctionRechercheParProfondeur)
      .fChangerProfondeur;
  };

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
    onTravaille.value = true;

    if (fOublier) {
      fOublier(); // Très bizare... `await` ici détruit la réactivité
      fOublier = undefined;
    }

    if (définis.value) {
      // Si les intrants sont dynamiques, stabiliser
      if (dynamique) {
        const stable = await stab.stabiliser(définis.value);
        if (!stable) return;
      }

      const retour = await fonc({
        ...définis.value,
        f: (x) => {
          réfRésultat.value = x;
          onTravaille.value = false;
        },
      });
      fOublier = retour.fOublier;

      fChangerNOuProfondeur = vérifierSiParProfondeur(retour)
        ? retour.fChangerProfondeur
        : retour.fChangerN;
    } else {
      réfRésultat.value = undefined;
      onTravaille.value = false;
    }
  });
  const réfNOuProfondeur = computed<number | undefined>(() => {
    return (args["nRésultatsDésirés"] || args["pronfondeur"]) as
      | number
      | undefined;
  });
  watchEffect(async () => {
    if (fChangerNOuProfondeur && réfNOuProfondeur.value)
      fChangerNOuProfondeur(réfNOuProfondeur.value);
  });

  onUnmounted(async () => {
    if (fOublier) await fOublier();
  });

  return {
    résultats: réfRésultat,
    onTravaille,
  };
};
