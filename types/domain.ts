export type UserRole = "admin" | "manager" | "cashier" | "barista";

export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled" | "refunded";

export type PaymentStatus = "unpaid" | "paid" | "refunded" | "failed";

export type PaymentMethod = "cash" | "promptpay_qr" | "qr_payment" | "credit_card" | "e_wallet";

