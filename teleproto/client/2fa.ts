import { generateRandomBytes } from "../Helpers";
import { computeCheck, computeDigest } from "../Password";
import type { TelegramClient } from "./TelegramClient";
import { Api } from "../tl";
import * as errors from "../errors";
import { Buffer } from "node:buffer";

export interface TwoFaParams {
    isCheckPassword?: boolean;
    currentPassword?: string;
    newPassword?: string;
    hint?: string;
    email?: string;
    emailCodeCallback?: (length: number) => Promise<string>;
    onEmailCodeError?: (err: Error) => void;
}

export async function updateTwoFaSettings(
    client: TelegramClient,
    {
        isCheckPassword,
        currentPassword,
        newPassword,
        hint = "",
        email,
        emailCodeCallback,
        onEmailCodeError,
    }: TwoFaParams
) {
    if (!newPassword && !currentPassword) {
        throw new Error(
            "Neither `currentPassword` nor `newPassword` is present"
        );
    }

    if (email && !(emailCodeCallback && onEmailCodeError)) {
        throw new Error(
            "`email` present without `emailCodeCallback` and `onEmailCodeError`"
        );
    }

    const pwd = await client.api.account.getPassword();

    if (!(pwd.newAlgo instanceof Api.PasswordKdfAlgoUnknown)) {
        pwd.newAlgo.salt1 = Buffer.concat([
            pwd.newAlgo.salt1,
            generateRandomBytes(32),
        ]);
    }
    if (!pwd.hasPassword && currentPassword) {
        currentPassword = undefined;
    }

    const password = currentPassword
        ? await computeCheck(pwd, currentPassword!)
        : new Api.InputCheckPasswordEmpty();

    if (isCheckPassword) {
        await client.invoke(new Api.auth.CheckPassword({ password }));
        return;
    }
    if (pwd.newAlgo instanceof Api.PasswordKdfAlgoUnknown) {
        throw new Error("Unknown password encryption method");
    }
    try {
        await client.invoke(
            new Api.account.UpdatePasswordSettings({
                password,
                newSettings: new Api.account.PasswordInputSettings({
                    newAlgo: pwd.newAlgo,
                    newPasswordHash: newPassword
                        ? await computeDigest(pwd.newAlgo, newPassword)
                        : Buffer.alloc(0),
                    hint,
                    email,
                    newSecureSettings: undefined,
                }),
            })
        );
    } catch (e) {
        if (e instanceof errors.EmailUnconfirmedError) {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                try {
                    const code = await emailCodeCallback!(e.codeLength);

                    if (!code) {
                        throw new Error("Code is empty");
                    }

                    await client.api.account.confirmPasswordEmail({ code });
                    break;
                } catch (err: any) {
                    onEmailCodeError!(err);
                }
            }
        } else {
            throw e;
        }
    }
}
