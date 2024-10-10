import type { Ref } from "vue";

export type DébalerRéfsArgs<T> = { [K in keyof T]: DébalerRéf<T[K]> };
export type DébalerRéf<T> = T extends Ref<infer R> ? R : T;
export type PossiblementUnePromesse<T> = T | Promise<T>;
