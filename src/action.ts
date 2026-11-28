import { computed, onMounted, ref, type ComputedRef } from "vue";
import type { DagCborEncodable } from "@orbitdb/core";

export const obt = <
  U,
  T extends { [clef: string]: DagCborEncodable | undefined } = Record<
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
