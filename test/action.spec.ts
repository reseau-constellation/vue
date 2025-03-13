import { describe, test } from "vitest";
import { obt } from "@/action.js";
import { defineComponent } from "vue";
import { flushPromises, mount } from "@vue/test-utils";


describe("obt", function () {
  test("Sans paramètres", async ({ expect }) => {
    const ComposanteTest = defineComponent({
      setup () {
        return {
          // Nous appelons le composable et l'exposons dans le retour de l'instance du composant. Nous pourrons donc ensuite y accéder dans `enveloppe.vm`.
          valeurObtenue: obt(async ()=>3),
        };
      },
    });
  
    const enveloppe = mount(ComposanteTest, { });
  
    expect(enveloppe.vm.valeurObtenue).toBeUndefined();
    await flushPromises();
    expect(enveloppe.vm.valeurObtenue).to.equal(3);
  });
  test("Avec paramètres", async ({ expect }) => {

    const ComposanteTest = defineComponent({
      setup () {
        return {
          // Nous appelons le composable et l'exposons dans le retour de l'instance du composant. Nous pourrons donc ensuite y accéder dans `enveloppe.vm`.
          valeurObtenue: obt(async ({x}: {x: number})=>x**2, {x: 3}),
        };
      },
    });
  
    const enveloppe = mount(ComposanteTest, { });
  
    expect(enveloppe.vm.valeurObtenue).toBeUndefined();
    await flushPromises();
    expect(enveloppe.vm.valeurObtenue).to.equal(9);
  });
});
