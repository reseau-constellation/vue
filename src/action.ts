import type { types } from "@constl/ipa";
import { computed, onMounted, ref, type ComputedRef } from "vue";

export const obt = <
  U,
  T extends { [clef: string]: types.élémentsBd | undefined } = Record<
    string,
    never
  >,
>(
  fonc: (args: T) => Promise<U>,
  args: T = {} as T,
): ComputedRef<U | undefined> => {
  const val = ref<U | undefined>();
  onMounted(async () => {
    const résultat = await fonc(args);
    val.value = résultat;
  });
  return computed(() => val.value);
};
