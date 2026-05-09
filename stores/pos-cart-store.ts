import { create } from "zustand";
import { calculateItemTotal, calculateOrderTotals } from "@/lib/calculations/pos";

export type CartModifier = {
  groupName: string;
  optionName: string;
  priceDelta: number;
};

export type CartItem = {
  clientId: string;
  productId: string;
  productName: string;
  basePrice: number;
  quantity: number;
  modifiers: CartModifier[];
  note?: string;
};

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (clientId: string, quantity: number) => void;
  removeItem: (clientId: string) => void;
  clearCart: () => void;
  totals: () => ReturnType<typeof calculateOrderTotals>;
};

export const usePosCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) => set({ items: [...get().items, item] }),
  updateQuantity: (clientId, quantity) =>
    set({
      items: get().items.map((item) =>
        item.clientId === clientId ? { ...item, quantity: Math.max(quantity, 1) } : item,
      ),
    }),
  removeItem: (clientId) => set({ items: get().items.filter((item) => item.clientId !== clientId) }),
  clearCart: () => set({ items: [] }),
  totals: () =>
    calculateOrderTotals({
      items: get().items.map((item) => ({
        totalPrice: calculateItemTotal({
          basePrice: item.basePrice,
          modifierTotal: item.modifiers.reduce((sum, modifier) => sum + modifier.priceDelta, 0),
          quantity: item.quantity,
        }),
      })),
      discount: { type: "fixed", value: 0 },
      vatRate: 7,
      serviceChargeRate: 0,
    }),
}));

