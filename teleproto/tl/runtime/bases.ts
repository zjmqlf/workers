import type { TlBaseClass } from "./defineClass";
import { CustomMessage } from "../custom/message";

const customMessage = (): TlBaseClass =>
    CustomMessage as unknown as TlBaseClass;

export const tlBases: Record<string, () => TlBaseClass> = {
    Message: customMessage,
    MessageService: customMessage,
    MessageEmpty: customMessage,
};
