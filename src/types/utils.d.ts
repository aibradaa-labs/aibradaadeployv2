type ExtractedType<T> = T extends (infer U)[] ? U : T;
type PhoneNumberInfo = { number: number; isMobile: boolean };