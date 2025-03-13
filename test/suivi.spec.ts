import { describe, test } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { suivre } from "@/suivi";
import { defineComponent, ref } from "vue";
import {
  schémaFonctionOublier,
  schémaFonctionSuivi,
} from "@constl/ipa/dist/types";
import { TypedEmitter } from "tiny-typed-emitter";

const générerFSuivi = () => {
  const signaleur = new TypedEmitter<{
    init: () => void;
    modif: (args: { [clef: string]: number }) => void;
  }>();
  const fSuivre = async <T extends { [clef: string]: number }>(
    args: T & { f: schémaFonctionSuivi<T> },
  ): Promise<schémaFonctionOublier> => {
    const { f } = args;
    const autresArgs = Object.fromEntries(
      Object.entries(args).filter(([clef, _val]) => clef !== "f"),
    ) as T;

    // Pour simuler une attente avant la première réponse
    await new Promise<void>(résoudre => signaleur.once("init", résoudre));
    
    await f(autresArgs);

    const fModif = (args: { [clef: string]: number }) => f(args as T);
    signaleur.on("modif", fModif);

    return async () => {
      signaleur.off("modif", fModif);
    };
  };
  return { signaleur, fSuivre };
};

describe("suivre", function () {
  describe("Sans paramètres", function () {
    const { fSuivre, signaleur } = générerFSuivi();
    const ComposanteTest = defineComponent({
      setup() {
        return {
          // Nous appelons le composable et l'exposons dans le retour de l'instance du composant. Nous pourrons donc ensuite y accéder dans `enveloppe.vm`.
          valeurSuivie: suivre(fSuivre),
        };
      },
      render() {
        return "";
      },
    });

    const enveloppe = mount(ComposanteTest, {});

    test("Non défini pour commencer", async ({ expect }) => {
      await flushPromises();
      expect(enveloppe.vm.valeurSuivie).toBeUndefined();
    });

    test("Première valeur", async ({ expect }) => {
      signaleur.emit("init");
      await flushPromises();
      expect(enveloppe.vm.valeurSuivie).to.deep.equal({});
    });

    test("Valeur dynamique", async ({ expect }) => {
      signaleur.emit("modif", { a: 1 });
      await flushPromises();
      expect(enveloppe.vm.valeurSuivie).to.deep.equal({ a: 1 });
    });
  });

  describe("Avec paramètres statiques", function () {
    const { fSuivre, signaleur } = générerFSuivi();

    const ComposanteTest = defineComponent({
      setup() {
        return {
          // @ts-expect-error À voir
          valeurSuivie: suivre(fSuivre, { a: 1, b: 2 }),
        };
      },
      render() {
        return "";
      },
    });

    const enveloppe = mount(ComposanteTest, {});

    test("Non défini pour commencer", async ({ expect }) => {
      await flushPromises();
      expect(enveloppe.vm.valeurSuivie).toBeUndefined();
    });

    test("Première valeur", async ({ expect }) => {
      signaleur.emit("init");
      await flushPromises();
      expect(enveloppe.vm.valeurSuivie).to.deep.equal({ a: 1, b: 2 });
    });

    test("Valeur dynamique", async ({ expect }) => {
      signaleur.emit("modif", { c: 3 });
      expect(enveloppe.vm.valeurSuivie).to.deep.equal({ c: 3 });
    });
  });

  describe("Avec paramètre non défini", function () {
    const { fSuivre, signaleur } = générerFSuivi();

    const ComposanteTest = defineComponent({
      setup() {
        return {
          // @ts-expect-error À voir
          valeurSuivie: suivre(fSuivre, { a: 1, b: undefined }),
        };
      },
      render() {
        return "";
      },
    });

    const enveloppe = mount(ComposanteTest, {});

    test("Non défini pour commencer", async ({ expect }) => {
      await flushPromises();
      expect(enveloppe.vm.valeurSuivie).toBeUndefined();
    });

    test("Toujours non défini", async ({ expect }) => {
      signaleur.emit("init");
      signaleur.emit("modif", { c: 3 });
      await flushPromises();
      expect(enveloppe.vm.valeurSuivie).toBeUndefined();
    });
  });

  describe("Avec paramètres dynamiques", function () {
    const { fSuivre, signaleur } = générerFSuivi();
    const a = ref(1);
    const b = ref<number|undefined>(2);
    const ComposanteTest = defineComponent({
      setup() {
        return {
          a,
          b,
          // @ts-expect-error Faudrait voir pourquoi
          valeurSuivie: suivre(fSuivre, { a, b }),
        };
      },
      render() {
        return "";
      },
    });

    const enveloppe = mount(ComposanteTest, {});

    test("Non défini pour commencer", async ({ expect }) => {
      await flushPromises();
      expect(enveloppe.vm.valeurSuivie).toBeUndefined();
    });

    test("Première valeur", async ({ expect }) => {
      signaleur.emit("init");
      await flushPromises()
      expect(enveloppe.vm.valeurSuivie).to.deep.equal({ a: 1, b: 2 });
    });

    test("Valeur dynamique", async ({ expect }) => {
      b.value = 3
      await flushPromises();

      // Toujours la valeur précédente avant que fSuivre n'aie retournée une valeur
      expect(enveloppe.vm.valeurSuivie).to.deep.equal({ a: 1, b: 2 });


      signaleur.emit("init");

      await flushPromises();
      // Là on a la nouvelle valeur
      expect(enveloppe.vm.valeurSuivie).to.deep.equal({ a: 1, b: 3 });
    });

    test("Paramètre non défini", async ({ expect }) => {
      b.value = undefined;
      await flushPromises()
      expect(enveloppe.vm.valeurSuivie).toBeUndefined();
    });
  });
});
