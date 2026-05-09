"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { PosModifierGroup, PosProduct } from "@backend/services/product-service";
import type { CartModifier } from "@frontend/stores/pos-cart-store";

type ModifierDialogProps = {
  product: PosProduct;
  groups: PosModifierGroup[];
  onAdd: (modifiers: CartModifier[], note: string) => void;
  onClose: () => void;
};

export function ModifierDialog({ product, groups, onAdd, onClose }: ModifierDialogProps) {
  const [selectedOptionIds, setSelectedOptionIds] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedModifiers = useMemo(() => {
    return groups.flatMap((group) => {
      const selectedIds = selectedOptionIds[group.id] ?? [];
      return group.modifier_options
        .filter((option) => selectedIds.includes(option.id))
        .map((option) => ({
          groupName: group.name,
          optionName: option.name,
          priceDelta: Number(option.price_delta),
        }));
    });
  }, [groups, selectedOptionIds]);

  function toggleOption(group: PosModifierGroup, optionId: string) {
    setError(null);
    setSelectedOptionIds((current) => {
      const selected = current[group.id] ?? [];
      const exists = selected.includes(optionId);
      const nextSelected = exists ? selected.filter((id) => id !== optionId) : [...selected, optionId];
      return {
        ...current,
        [group.id]: group.max_select === 1 ? [optionId] : nextSelected.slice(0, group.max_select),
      };
    });
  }

  function submit() {
    const missingGroup = groups.find((group) => group.is_required && (selectedOptionIds[group.id] ?? []).length === 0);
    if (missingGroup) {
      setError(`Please select ${missingGroup.name}`);
      return;
    }

    onAdd(selectedModifiers, note);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-md bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold">{product.name}</h2>
            <p className="text-sm text-stone-600">Choose modifiers</p>
          </div>
          <button
            aria-label="Close modifiers"
            className="inline-flex size-9 items-center justify-center rounded-md border border-stone-300"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          {groups.map((group) => (
            <fieldset className="space-y-3" key={group.id}>
              <legend className="text-sm font-semibold text-stone-800">
                {group.name}
                {group.is_required ? <span className="text-red-600"> *</span> : null}
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.modifier_options
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((option) => {
                    const selected = (selectedOptionIds[group.id] ?? []).includes(option.id);
                    return (
                      <button
                        className={`min-h-12 rounded-md border px-3 py-2 text-left text-sm ${
                          selected
                            ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                            : "border-stone-300 bg-white text-stone-700"
                        }`}
                        key={option.id}
                        onClick={() => toggleOption(group, option.id)}
                        type="button"
                      >
                        <span className="font-medium">{option.name}</span>
                        {Number(option.price_delta) > 0 ? (
                          <span className="ml-2 text-stone-500">+{Number(option.price_delta).toFixed(2)}</span>
                        ) : null}
                      </button>
                    );
                  })}
              </div>
            </fieldset>
          ))}

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Item note</span>
            <textarea
              className="min-h-20 w-full rounded-md border border-stone-300 px-3 py-2"
              onChange={(event) => setNote(event.target.value)}
              value={note}
            />
          </label>

          {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button className="h-12 w-full rounded-md bg-stone-950 px-4 font-semibold text-white" onClick={submit}>
            Add to cart
          </button>
        </div>
      </section>
    </div>
  );
}

