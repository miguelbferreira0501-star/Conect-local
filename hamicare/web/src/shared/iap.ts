// Produtos do Lumbi+ nas lojas (os mesmos IDs são cadastrados no App Store Connect).
export const IAP_PRODUCTS = { mensal: 'com.hamicare.app.plus.mensal', anual: 'com.hamicare.app.plus.anual' } as const;
export type IapPlan = keyof typeof IAP_PRODUCTS;
export const IAP_IDS: readonly string[] = Object.values(IAP_PRODUCTS);
export const planOfProduct = (id: string): IapPlan | null => (id === IAP_PRODUCTS.mensal ? 'mensal' : id === IAP_PRODUCTS.anual ? 'anual' : null);
