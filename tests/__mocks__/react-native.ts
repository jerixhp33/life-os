export const Platform = { OS: 'ios', select: (obj: Record<string,unknown>) => obj.ios ?? obj.default };
export const StyleSheet = { create: (s: unknown) => s, hairlineWidth: 1 };
export const useColorScheme = () => 'light';
