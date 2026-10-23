import type { TlBaseClass } from "./defineClass";

const customMessage = (): TlBaseClass =>
    import("../custom/message") as unknown as TlBaseClass;

export const tlBases: Record<string, () => TlBaseClass> = {
    Message: customMessage,
    MessageService: customMessage,
    MessageEmpty: customMessage,
};
