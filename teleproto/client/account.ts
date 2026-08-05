import type { TelegramClient } from "./TelegramClient";
import type { EntityLike, FileLike } from "../define";
import type { BigInteger } from "big-integer";
import { TotalList } from "../Helpers";
import * as utils from "../Utils";
import { Api } from "../tl";
import { _fileToMedia } from "./uploads";

export interface UpdateProfileParams {
    firstName?: string;
    lastName?: string;
    about?: string;
}

export async function updateProfile(
    client: TelegramClient,
    params: UpdateProfileParams
): Promise<Api.TypeUser> {
    return client.api.account.updateProfile({
        firstName: params.firstName,
        lastName: params.lastName,
        about: params.about,
    });
}

export async function updateUsername(
    client: TelegramClient,
    username: string
): Promise<Api.TypeUser> {
    return client.api.account.updateUsername({ username: username });
}

export async function updateStatus(
    client: TelegramClient,
    online: boolean = true
): Promise<boolean> {
    return client.api.account.updateStatus({ offline: !online });
}

async function _toInputFile(
    client: TelegramClient,
    file: FileLike
): Promise<Api.TypeInputFile> {
    const { fileHandle } = await _fileToMedia(client, {
        file: file,
        asImage: true,
    });
    if (!fileHandle) {
        throw new Error(`Cannot upload ${file} as a profile photo`);
    }
    return fileHandle;
}

export interface UploadProfilePhotoParams {
    file?: FileLike;
    video?: FileLike;
    videoStartTs?: number;
    videoEmojiMarkup?: Api.TypeVideoSize;
    fallback?: boolean;
    bot?: EntityLike;
}

export async function uploadProfilePhoto(
    client: TelegramClient,
    params: UploadProfilePhotoParams
): Promise<Api.photos.Photo> {
    return client.invoke(
        new Api.photos.UploadProfilePhoto({
            file: params.file
                ? await _toInputFile(client, params.file)
                : undefined,
            video: params.video
                ? await _toInputFile(client, params.video)
                : undefined,
            videoStartTs: params.videoStartTs,
            videoEmojiMarkup: params.videoEmojiMarkup,
            fallback: params.fallback,
            bot: params.bot
                ? ((await client.getInputEntity(
                      params.bot
                  )) as unknown as Api.TypeInputUser)
                : undefined,
        })
    );
}

export async function updateProfilePhoto(
    client: TelegramClient,
    photo: Api.TypeInputPhoto | Api.TypePhoto,
    params: { fallback?: boolean; bot?: EntityLike } = {}
): Promise<Api.photos.Photo> {
    return client.invoke(
        new Api.photos.UpdateProfilePhoto({
            id: utils.getInputPhoto(photo),
            fallback: params.fallback,
            bot: params.bot
                ? ((await client.getInputEntity(
                      params.bot
                  )) as unknown as Api.TypeInputUser)
                : undefined,
        })
    );
}

export async function deleteProfilePhotos(
    client: TelegramClient,
    photos: (Api.TypeInputPhoto | Api.TypePhoto)[]
) {
    return client.invoke(
        new Api.photos.DeletePhotos({
            id: photos.map((photo) => utils.getInputPhoto(photo)),
        })
    );
}

export interface GetUserPhotosParams {
    offset?: number;
    maxId?: BigInteger;
    limit?: number;
}

export async function getUserPhotos(
    client: TelegramClient,
    entity: EntityLike,
    params: GetUserPhotosParams = {}
): Promise<TotalList<Api.TypePhoto>> {
    const user = await client.getInputEntity(entity);
    const result = await client.invoke(
        new Api.photos.GetUserPhotos({
            userId: user as unknown as Api.TypeInputUser,
            offset: params.offset ?? 0,
            maxId: params.maxId,
            limit: params.limit ?? 100,
        })
    );
    const photos = new TotalList<Api.TypePhoto>();
    photos.push(...result.photos);
    photos.total =
        result instanceof Api.photos.PhotosSlice
            ? result.count
            : result.photos.length;
    return photos;
}

export async function getAuthorizations(
    client: TelegramClient
): Promise<Api.account.Authorizations> {
    return client.api.account.getAuthorizations({});
}

export async function resetAuthorization(
    client: TelegramClient,
    hash?: BigInteger
): Promise<boolean> {
    if (hash == undefined || hash.isZero()) {
        return client.api.auth.resetAuthorizations({});
    }
    return client.api.account.resetAuthorization({ hash: hash });
}

export async function getPrivacy(
    client: TelegramClient,
    key: Api.TypeInputPrivacyKey
): Promise<Api.account.PrivacyRules> {
    return client.invoke(new Api.account.GetPrivacy({ key: key }));
}

export async function setPrivacy(
    client: TelegramClient,
    key: Api.TypeInputPrivacyKey,
    rules: Api.TypeInputPrivacyRule[]
): Promise<Api.account.PrivacyRules> {
    return client.invoke(new Api.account.SetPrivacy({ key: key, rules: rules }));
}

export async function getNotifySettings(
    client: TelegramClient,
    entity: EntityLike | Api.TypeInputNotifyPeer
): Promise<Api.TypePeerNotifySettings> {
    return client.invoke(
        new Api.account.GetNotifySettings({
            peer: await client._getInputNotify(entity),
        })
    );
}

export interface UpdateNotifySettingsParams {
    showPreviews?: boolean;
    silent?: boolean;
    muteUntil?: number;
    sound?: Api.TypeNotificationSound;
    storiesMuted?: boolean;
    storiesHideSender?: boolean;
    storiesSound?: Api.TypeNotificationSound;
}

export async function updateNotifySettings(
    client: TelegramClient,
    entity: EntityLike | Api.TypeInputNotifyPeer,
    params: UpdateNotifySettingsParams
): Promise<boolean> {
    return client.invoke(
        new Api.account.UpdateNotifySettings({
            peer: await client._getInputNotify(entity),
            settings: new Api.InputPeerNotifySettings({
                showPreviews: params.showPreviews,
                silent: params.silent,
                muteUntil: params.muteUntil,
                sound: params.sound,
                storiesMuted: params.storiesMuted,
                storiesHideSender: params.storiesHideSender,
                storiesSound: params.storiesSound,
            }),
        })
    );
}

export async function getAccountTTL(client: TelegramClient): Promise<number> {
    const result = await client.api.account.getAccountTTL({});
    return result.days;
}

export async function setAccountTTL(
    client: TelegramClient,
    days: number
): Promise<boolean> {
    return client.invoke(
        new Api.account.SetAccountTTL({
            ttl: new Api.AccountDaysTTL({ days: days }),
        })
    );
}

export async function getGlobalPrivacySettings(
    client: TelegramClient
): Promise<Api.TypeGlobalPrivacySettings> {
    return client.api.account.getGlobalPrivacySettings({});
}

export async function setGlobalPrivacySettings(
    client: TelegramClient,
    settings: Api.TypeGlobalPrivacySettings
): Promise<Api.TypeGlobalPrivacySettings> {
    return client.invoke(
        new Api.account.SetGlobalPrivacySettings({ settings: settings })
    );
}