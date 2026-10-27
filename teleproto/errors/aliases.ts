import { FloodError } from "./RPCBaseErrors";
import {
    FrozenMethodInvalidError,
    FrozenParticipantMissingError,
} from "./RPCErrorList";

export const FrozenMethodError = FrozenMethodInvalidError;
export type FrozenMethodError = FrozenMethodInvalidError;

export const FrozenParticipantError = FrozenParticipantMissingError;
export type FrozenParticipantError = FrozenParticipantMissingError;

export const FrozenError = FloodError;
export type FrozenError = FloodError;
