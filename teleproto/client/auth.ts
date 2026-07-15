import { Api } from "../tl";
import * as utils from "../Utils";
import { sleep } from "../Helpers";
import { computeCheck as computePasswordSrpCheck } from "../Password";
import { UnauthorizedError } from "../errors";
import type { TelegramClient } from "./TelegramClient";
import { Buffer } from "node:buffer";

export interface EmailVerificationOptions {
    googleSigninAllowed?: boolean;
    appleSigninAllowed?: boolean;
    emailPattern?: string;
    codeLength?: number;
    resetAvailablePeriod?: number;
    resetPendingDate?: number;
}

export type EmailVerificationResult =
    | { type: "code"; code: string }
    | { type: "google"; token: string }
    | { type: "apple"; token: string };

export interface UserAuthParams {
    phoneNumber: string | (() => Promise<string>);
    phoneCode: (isCodeViaApp?: boolean) => Promise<string>;
    password?: (hint?: string) => Promise<string>;
    firstAndLastNames?: () => Promise<[string, string?]>;
    qrCode?: (qrCode: { token: Buffer; expires: number }) => Promise<void>;
    onError: (err: Error) => Promise<boolean> | void;
    forceSMS?: boolean;
    reCaptchaCallback?: (siteKey: string) => Promise<string>;
    emailVerification?: (
        options: EmailVerificationOptions
    ) => Promise<EmailVerificationResult>;
    emailAddress?: () => Promise<string>;
}

export interface UserPasswordAuthParams {
    password?: (hint?: string) => Promise<string>;
    onError: (err: Error) => Promise<boolean> | void;
}

export interface QrCodeAuthParams extends UserPasswordAuthParams {
    qrCode?: (qrCode: { token: Buffer; expires: number }) => Promise<void>;
    onError: (err: Error) => Promise<boolean> | void;
    abortSignal?: AbortSignal;
}

interface ReturnString {
    (): string;
}

export interface BotAuthParams {
    botAuthToken: string | ReturnString;
}

export interface ApiCredentials {
    apiId: number;
    apiHash: string;
}

const QR_CODE_TIMEOUT = 30000;

export async function start(
    client: TelegramClient,
    authParams?: UserAuthParams | BotAuthParams
) {
    if (!client.connected) {
        await client.connect();
    }

    let authError: Error | undefined;
    try {
        await client.api.updates.getState();
        return;
    } catch (e: any) {
        authError = e;
    }

    if (
        !authParams ||
        (!("phoneNumber" in authParams) && !("botAuthToken" in authParams))
    ) {
        throw (
            authError ??
            new UnauthorizedError(
                "Not authorized and no auth parameters were provided to log in.",
                undefined as any
            )
        );
    }

    const apiCredentials = {
        apiId: client.apiId,
        apiHash: client.apiHash,
    };

    await _authFlow(client, apiCredentials, authParams);
}

export async function checkAuthorization(client: TelegramClient) {
    try {
        await client.api.updates.getState();
        return true;
    } catch (e) {
        return false;
    }
}

export async function logOut(client: TelegramClient): Promise<boolean> {
    let success = true;
    try {
        await client.api.auth.logOut();
    } catch (e) {
        client._log.warn("auth.LogOut failed: " + (e as Error).message);
        success = false;
    }
    await client.disconnect();
    await client.session.delete();
    return success;
}

export async function signInUser(
    client: TelegramClient,
    apiCredentials: ApiCredentials,
    authParams: UserAuthParams
): Promise<Api.TypeUser> {
    let phoneNumber: string = "";
    let phoneCodeHash: string = "";
    let isCodeViaApp = false;

    while (1) {
        try {
            if (typeof authParams.phoneNumber === "function") {
                try {
                    phoneNumber = await authParams.phoneNumber();
                } catch (err: any) {
                    if (err.errorMessage === "RESTART_AUTH_WITH_QR") {
                        return client.signInUserWithQrCode(
                            apiCredentials,
                            authParams
                        );
                    }

                    throw err;
                }
            } else {
                phoneNumber = authParams.phoneNumber;
            }
            const sendCodeResult = await client.sendCode(
                apiCredentials,
                phoneNumber,
                authParams.forceSMS,
                authParams.reCaptchaCallback
            );
            phoneCodeHash = sendCodeResult.phoneCodeHash;
            isCodeViaApp = sendCodeResult.isCodeViaApp;

            if (typeof phoneCodeHash !== "string") {
                throw new Error("Failed to retrieve phone code hash");
            }

            if (sendCodeResult.emailRequired) {
                if (!authParams.emailAddress || !authParams.emailVerification) {
                    throw new Error(
                        "Email verification required but emailAddress or emailVerification callback not provided"
                    );
                }

                const email = await authParams.emailAddress();

                const emailCodeResult = await sendVerifyEmailCode(
                    client,
                    phoneNumber,
                    phoneCodeHash,
                    email
                );

                const verification = await authParams.emailVerification({
                    ...sendCodeResult.emailOptions,
                    emailPattern: emailCodeResult.emailPattern,
                    codeLength: emailCodeResult.length,
                });

                const verifyResult = await verifyEmail(
                    client,
                    phoneNumber,
                    phoneCodeHash,
                    verification
                );

                if (verifyResult.sentCode instanceof Api.auth.SentCode) {
                    phoneCodeHash = verifyResult.sentCode.phoneCodeHash;
                    isCodeViaApp =
                        verifyResult.sentCode.type instanceof
                        Api.auth.SentCodeTypeApp;
                }
            } else if (sendCodeResult.emailCodeSent) {
                if (!authParams.emailVerification) {
                    throw new Error(
                        "Email code sent but emailVerification callback not provided"
                    );
                }

                const verification = await authParams.emailVerification(
                    sendCodeResult.emailOptions || {}
                );

                const verifyResult = await verifyEmail(
                    client,
                    phoneNumber,
                    phoneCodeHash,
                    verification
                );

                if (verifyResult.sentCode instanceof Api.auth.SentCode) {
                    phoneCodeHash = verifyResult.sentCode.phoneCodeHash;
                    isCodeViaApp =
                        verifyResult.sentCode.type instanceof
                        Api.auth.SentCodeTypeApp;
                }
            }

            break;
        } catch (err: any) {
            if (typeof authParams.phoneNumber !== "function") {
                throw err;
            }

            const shouldWeStop = await authParams.onError(err);
            if (shouldWeStop) {
                throw new Error("AUTH_USER_CANCEL");
            }
        }
    }

    let phoneCode;
    let isRegistrationRequired = false;
    let termsOfService;

    while (1) {
        try {
            try {
                phoneCode = await authParams.phoneCode(isCodeViaApp);
            } catch (err: any) {
                if (err.errorMessage === "RESTART_AUTH") {
                    return client.signInUser(apiCredentials, authParams);
                }
            }

            if (!phoneCode) {
                throw new Error("Code is empty");
            }

            const result = await client.invoke(
                new Api.auth.SignIn({
                    phoneNumber,
                    phoneCodeHash,
                    phoneCode,
                })
            );

            if (result instanceof Api.auth.AuthorizationSignUpRequired) {
                isRegistrationRequired = true;
                termsOfService = result.termsOfService;
                break;
            }

            return result.user;
        } catch (err: any) {
            if (err.errorMessage === "SESSION_PASSWORD_NEEDED") {
                return client.signInWithPassword(apiCredentials, authParams);
            } else {
                const shouldWeStop = await authParams.onError(err);
                if (shouldWeStop) {
                    throw new Error("AUTH_USER_CANCEL");
                }
            }
        }
    }

    if (isRegistrationRequired) {
        while (1) {
            try {
                let lastName;
                let firstName = "first name";
                if (authParams.firstAndLastNames) {
                    const result = await authParams.firstAndLastNames();
                    firstName = result[0];
                    lastName = result[1];
                }
                if (!firstName) {
                    throw new Error("First name is required");
                }

                const { user } = (await client.invoke(
                    new Api.auth.SignUp({
                        phoneNumber,
                        phoneCodeHash,
                        firstName,
                        lastName,
                    })
                )) as Api.auth.Authorization;

                if (termsOfService) {
                    await client.invoke(
                        new Api.help.AcceptTermsOfService({
                            id: termsOfService.id,
                        })
                    );
                }

                return user;
            } catch (err: any) {
                const shouldWeStop = await authParams.onError(err);
                if (shouldWeStop) {
                    throw new Error("AUTH_USER_CANCEL");
                }
            }
        }
    }

    await authParams.onError(new Error("Auth failed"));
    return client.signInUser(apiCredentials, authParams);
}

function qrAbortError(): Error {
    const err = new Error("QR login aborted");
    err.name = "AbortError";
    return err;
}

export async function signInUserWithQrCode(
    client: TelegramClient,
    apiCredentials: ApiCredentials,
    authParams: QrCodeAuthParams
): Promise<Api.TypeUser> {
    if (authParams.qrCode == undefined) {
        throw new Error("qrCode callback not defined");
    }

    const { abortSignal } = authParams;
    if (abortSignal?.aborted) throw qrAbortError();

    let isScanningComplete = false;
    const stopped = () => isScanningComplete || !!abortSignal?.aborted;

    const inputPromise = (async () => {
        while (!stopped()) {
            const result = await client.invoke(
                new Api.auth.ExportLoginToken({
                    apiId: Number(apiCredentials.apiId),
                    apiHash: apiCredentials.apiHash,
                    exceptIds: [],
                })
            );
            if (!(result instanceof Api.auth.LoginToken)) {
                throw new Error("Unexpected");
            }

            const { token, expires } = result;
            await Promise.race([
                authParams.qrCode!({ token, expires }),
                sleep(QR_CODE_TIMEOUT),
            ]);
            await sleep(QR_CODE_TIMEOUT);
        }
    })();

    const Raw = require("../events/Raw").Raw;
    const rawEvent = new Raw({});
    const onUpdate = (update: Api.TypeUpdate) => {
        if (update instanceof Api.UpdateLoginToken) resolveUpdate();
    };
    let resolveUpdate!: () => void;
    const updatePromise = new Promise<void>((resolve) => (resolveUpdate = resolve));
    client.addEventHandler(onUpdate, rawEvent);

    const abortPromise = new Promise<never>((_, reject) =>
        abortSignal?.addEventListener("abort", () => reject(qrAbortError()), {
            once: true,
        })
    );

    try {
        await Promise.race([updatePromise, inputPromise, abortPromise]);
    } finally {
        isScanningComplete = true;
        client.removeEventHandler(onUpdate, rawEvent);
    }

    try {
        const result2 = await client.invoke(
            new Api.auth.ExportLoginToken({
                apiId: Number(apiCredentials.apiId),
                apiHash: apiCredentials.apiHash,
                exceptIds: [],
            })
        );
        if (
            result2 instanceof Api.auth.LoginTokenSuccess &&
            result2.authorization instanceof Api.auth.Authorization
        ) {
            return result2.authorization.user;
        } else if (result2 instanceof Api.auth.LoginTokenMigrateTo) {
            await client._switchDC(result2.dcId);
            const migratedResult = await client.invoke(
                new Api.auth.ImportLoginToken({
                    token: result2.token,
                })
            );

            if (
                migratedResult instanceof Api.auth.LoginTokenSuccess &&
                migratedResult.authorization instanceof Api.auth.Authorization
            ) {
                return migratedResult.authorization.user;
            } else {
                client._log.error(
                    `Received unknown result while scanning QR ${result2.className}`
                );
                throw new Error(
                    `Received unknown result while scanning QR ${result2.className}`
                );
            }
        } else {
            client._log.error(
                `Received unknown result while scanning QR ${result2.className}`
            );
            throw new Error(
                `Received unknown result while scanning QR ${result2.className}`
            );
        }
    } catch (err: any) {
        if (err.errorMessage === "SESSION_PASSWORD_NEEDED") {
            return client.signInWithPassword(apiCredentials, authParams);
        }
        throw err;
    }

    await authParams.onError(new Error("QR auth failed"));
    throw new Error("QR auth failed");
}

export interface SendCodeResult {
    phoneCodeHash: string;
    isCodeViaApp: boolean;
    emailRequired?: boolean;
    emailCodeSent?: boolean;
    emailOptions?: EmailVerificationOptions;
}

export async function sendCode(
    client: TelegramClient,
    apiCredentials: ApiCredentials,
    phoneNumber: string,
    forceSMS = false,
    reCaptchaCallback?: (siteKey: string) => Promise<string>
): Promise<SendCodeResult> {
    try {
        const { apiId, apiHash } = apiCredentials;
        const request = new Api.auth.SendCode({
            phoneNumber,
            apiId,
            apiHash,
            settings: new Api.CodeSettings({}),
        });

        let sendResult: any;

        try {
            sendResult = await client.invoke(request);
        } catch (err: any) {
            const match = err.errorMessage?.match(/RECAPTCHA_CHECK_.*(6Le[-\w]+)/);
            if (match && reCaptchaCallback) {
                const siteKey = match[1];
                const token = await reCaptchaCallback(siteKey);
                sendResult = await client.invoke(
                    new Api.InvokeWithReCaptcha({
                        token: token,
                        query: request,
                    })
                );
            } else {
                throw err;
            }
        }

        if (sendResult instanceof Api.auth.SentCodeSuccess)
            throw new Error("logged in right after sending the code");

        if (!(sendResult instanceof Api.auth.SentCode)) {
            return {
                phoneCodeHash: sendResult.phoneCodeHash,
                isCodeViaApp: false,
            };
        }

        if (
            sendResult.type instanceof Api.auth.SentCodeTypeSetUpEmailRequired
        ) {
            return {
                phoneCodeHash: sendResult.phoneCodeHash,
                isCodeViaApp: false,
                emailRequired: true,
                emailOptions: {
                    googleSigninAllowed: sendResult.type.googleSigninAllowed,
                    appleSigninAllowed: sendResult.type.appleSigninAllowed,
                },
            };
        }

        if (sendResult.type instanceof Api.auth.SentCodeTypeEmailCode) {
            return {
                phoneCodeHash: sendResult.phoneCodeHash,
                isCodeViaApp: false,
                emailCodeSent: true,
                emailOptions: {
                    googleSigninAllowed: sendResult.type.googleSigninAllowed,
                    appleSigninAllowed: sendResult.type.appleSigninAllowed,
                    emailPattern: sendResult.type.emailPattern,
                    codeLength: sendResult.type.length,
                    resetAvailablePeriod: sendResult.type.resetAvailablePeriod,
                    resetPendingDate: sendResult.type.resetPendingDate,
                },
            };
        }

        if (!forceSMS || sendResult.type instanceof Api.auth.SentCodeTypeSms) {
            return {
                phoneCodeHash: sendResult.phoneCodeHash,
                isCodeViaApp: sendResult.type instanceof Api.auth.SentCodeTypeApp,
            };
        }

        const resendResult = await client.invoke(
            new Api.auth.ResendCode({
                phoneNumber,
                phoneCodeHash: sendResult.phoneCodeHash,
            })
        );
        if (resendResult instanceof Api.auth.SentCodeSuccess)
            throw new Error("logged in right after resending the code");

        if (!(resendResult instanceof Api.auth.SentCode)) {
            return {
                phoneCodeHash: resendResult.phoneCodeHash,
                isCodeViaApp: false,
            };
        }

        if (
            resendResult.type instanceof Api.auth.SentCodeTypeSetUpEmailRequired
        ) {
            return {
                phoneCodeHash: resendResult.phoneCodeHash,
                isCodeViaApp: false,
                emailRequired: true,
                emailOptions: {
                    googleSigninAllowed: resendResult.type.googleSigninAllowed,
                    appleSigninAllowed: resendResult.type.appleSigninAllowed,
                },
            };
        }

        if (resendResult.type instanceof Api.auth.SentCodeTypeEmailCode) {
            return {
                phoneCodeHash: resendResult.phoneCodeHash,
                isCodeViaApp: false,
                emailCodeSent: true,
                emailOptions: {
                    googleSigninAllowed: resendResult.type.googleSigninAllowed,
                    appleSigninAllowed: resendResult.type.appleSigninAllowed,
                    emailPattern: resendResult.type.emailPattern,
                    codeLength: resendResult.type.length,
                    resetAvailablePeriod: resendResult.type.resetAvailablePeriod,
                    resetPendingDate: resendResult.type.resetPendingDate,
                },
            };
        }

        return {
            phoneCodeHash: resendResult.phoneCodeHash,
            isCodeViaApp: resendResult.type instanceof Api.auth.SentCodeTypeApp,
        };
    } catch (err: any) {
        if (err.errorMessage === "AUTH_RESTART") {
            return sendCode(
                client,
                apiCredentials,
                phoneNumber,
                forceSMS,
                reCaptchaCallback
            );
        } else {
            throw err;
        }
    }
}

export async function signInWithPassword(
    client: TelegramClient,
    apiCredentials: ApiCredentials,
    authParams: UserPasswordAuthParams
): Promise<Api.TypeUser> {
    let emptyPassword = false;
    while (1) {
        try {
            const passwordSrpResult = await client.invoke(
                new Api.account.GetPassword()
            );
            if (!authParams.password) {
                emptyPassword = true;
                break;
            }

            const password = await authParams.password(passwordSrpResult.hint);
            if (!password) {
                throw new Error("Password is empty");
            }

            const passwordSrpCheck = await computePasswordSrpCheck(
                passwordSrpResult,
                password
            );
            const { user } = (await client.invoke(
                new Api.auth.CheckPassword({
                    password: passwordSrpCheck,
                })
            )) as Api.auth.Authorization;

            return user;
        } catch (err: any) {
            const shouldWeStop = await authParams.onError(err);
            if (shouldWeStop) {
                throw new Error("AUTH_USER_CANCEL");
            }
        }
    }
    if (emptyPassword) {
        throw new Error("Account has 2FA enabled.");
    }
    return undefined!;
}

export async function signInBot(
    client: TelegramClient,
    apiCredentials: ApiCredentials,
    authParams: BotAuthParams
) {
    const { apiId, apiHash } = apiCredentials;
    let { botAuthToken } = authParams;
    if (!botAuthToken) {
        throw new Error("a valid BotToken is required");
    }
    if (typeof botAuthToken === "function") {
        let token;
        while (true) {
            token = await botAuthToken();
            if (token) {
                botAuthToken = token;
                break;
            }
        }
    }

    const { user } = (await client.invoke(
        new Api.auth.ImportBotAuthorization({
            apiId,
            apiHash,
            botAuthToken,
        })
    )) as Api.auth.Authorization;
    return user;
}

export async function _authFlow(
    client: TelegramClient,
    apiCredentials: ApiCredentials,
    authParams: UserAuthParams | BotAuthParams
) {
    const me =
        "phoneNumber" in authParams
            ? await client.signInUser(apiCredentials, authParams)
            : await client.signInBot(apiCredentials, authParams);

    client._log.info("Signed in successfully as " + utils.getDisplayName(me));
}

export interface SentEmailCodeResult {
    emailPattern: string;
    length: number;
}

export async function sendVerifyEmailCode(
    client: TelegramClient,
    phoneNumber: string,
    phoneCodeHash: string,
    email: string
): Promise<SentEmailCodeResult> {
    const result = await client.invoke(
        new Api.account.SendVerifyEmailCode({
            purpose: new Api.EmailVerifyPurposeLoginSetup({
                phoneNumber,
                phoneCodeHash,
            }),
            email,
        })
    );

    return {
        emailPattern: result.emailPattern,
        length: result.length,
    };
}

export interface EmailVerifiedLoginResult {
    email: string;
    sentCode: Api.auth.TypeSentCode;
}

export async function verifyEmail(
    client: TelegramClient,
    phoneNumber: string,
    phoneCodeHash: string,
    verification: EmailVerificationResult
): Promise<EmailVerifiedLoginResult> {
    let emailVerification: Api.TypeEmailVerification;

    switch (verification.type) {
        case "code":
            emailVerification = new Api.EmailVerificationCode({
                code: verification.code,
            });
            break;
        case "google":
            emailVerification = new Api.EmailVerificationGoogle({
                token: verification.token,
            });
            break;
        case "apple":
            emailVerification = new Api.EmailVerificationApple({
                token: verification.token,
            });
            break;
    }

    const result = await client.invoke(
        new Api.account.VerifyEmail({
            purpose: new Api.EmailVerifyPurposeLoginSetup({
                phoneNumber,
                phoneCodeHash,
            }),
            verification: emailVerification,
        })
    );

    if (!(result instanceof Api.account.EmailVerifiedLogin)) {
        throw new Error(
            "Expected EmailVerifiedLogin but got " + result.className
        );
    }

    return {
        email: result.email,
        sentCode: result.sentCode,
    };
}

export async function resetLoginEmail(
    client: TelegramClient,
    phoneNumber: string,
    phoneCodeHash: string
): Promise<Api.auth.TypeSentCode> {
    return await client.invoke(
        new Api.auth.ResetLoginEmail({
            phoneNumber,
            phoneCodeHash,
        })
    );
}
