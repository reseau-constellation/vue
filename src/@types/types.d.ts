import type { எண்ணிக்கை } from "ennikkai";
import type { Nuchabäl } from "nuchabal";

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $எண்ணிக்கை: எண்ணிக்கை;
    $nuchabäl: Nuchabäl;
  }
}

export {};
