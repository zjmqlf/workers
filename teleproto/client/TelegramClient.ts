import {
    PROD_DC_IPV4,
    PROD_DC_IPV6,
    TelegramBaseClient,
    TelegramClientParams,
    webSocketDcAddress,
} from "./telegramBaseClient";

import * as authMethods from "./auth";
import * as botMethods from "./bots";
import * as buttonsMethods from "./buttons";
import * as downloadMethods from "./downloads";
import * as parseMethods from "./messageParse";
import * as messageMethods from "./messages";
import * as updateMethods from "./updates/dispatch";
import * as uploadMethods from "./uploads";
import * as userMethods from "./users";
import * as chatMethods from "./chats";
import * as inviteLinkMethods from "./inviteLinks";
import * as accountMethods from "./account";
import * as contactMethods from "./contacts";
import * as dialogMethods from "./dialogs";
import * as twoFA from "./2fa";
import * as forumMethods from "./forums";
import * as storyMethods from "./stories";
import * as folderMethods from "./folders";
import * as stickerMethods from "./stickers";
import type { BigInteger } from "big-integer";
import type {
    ButtonLike,
    Entity,
    EntityLike,
    FileLike,
    MessageIDLike,
} from "../define";
import { Api } from "../tl";
import { createApiProxy } from "../tl/runtime/apiProxy";
import { HTMLParser } from "../extensions/html";
import { MarkdownParser } from "../extensions/markdown";
import { MarkdownV2Parser } from "../extensions/markdownv2";
import type { EventBuilder } from "../events/common";
import { MTProtoSender } from "../network";
import type { SessionLease } from "../network/Network";
import { LAYER } from "../tl/runtime/registry";
import { DownloadMediaInterface } from "./downloads";
import { NewMessage, NewMessageEvent } from "../events";
import { _handleUpdate, _updateLoop, catchUp } from "./updates/dispatch";
import { ClientUpdates } from "./updates/composer";
import { Session } from "../sessions";
import { Album, AlbumEvent } from "../events/Album";
import { CallbackQuery, CallbackQueryEvent } from "../events/CallbackQuery";
import { EditedMessage, EditedMessageEvent } from "../events/EditedMessage";
import { DeletedMessage, DeletedMessageEvent } from "../events/DeletedMessage";
import { Buffer } from "node:buffer";

export class TelegramClient<
    S extends Session = Session
> extends TelegramBaseClient<S> {
    private _updates?: ClientUpdates;

    get updates(): ClientUpdates {
        if (!this._updates) this._updates = new ClientUpdates(this);
        return this._updates;
    }

    constructor(
        session: string | S,
        apiId: number,
        apiHash: string,
        clientParams: TelegramClientParams
    ) {
        super(session, apiId, apiHash, clientParams);
    }

    start(authParams?: authMethods.UserAuthParams | authMethods.BotAuthParams) {
        return authMethods.start(this, authParams);
    }

    checkAuthorization() {
        return authMethods.checkAuthorization(this);
    }

    logOut() {
        return authMethods.logOut(this);
    }

    signInUser(
        apiCredentials: authMethods.ApiCredentials,
        authParams: authMethods.UserAuthParams
    ) {
        return authMethods.signInUser(this, apiCredentials, authParams);
    }

    signInUserWithQrCode(
        apiCredentials: authMethods.ApiCredentials,
        authParams: authMethods.QrCodeAuthParams
    ) {
        return authMethods.signInUserWithQrCode(
            this,
            apiCredentials,
            authParams
        );
    }

    sendCode(
        apiCredentials: authMethods.ApiCredentials,
        phoneNumber: string,
        forceSMS = false,
        reCaptchaCallback?: (siteKey: string) => Promise<string>
    ) {
        return authMethods.sendCode(
            this,
            apiCredentials,
            phoneNumber,
            forceSMS,
            reCaptchaCallback
        );
    }


    sendVerifyEmailCode(
        phoneNumber: string,
        phoneCodeHash: string,
        email: string
    ) {
        return authMethods.sendVerifyEmailCode(
            this,
            phoneNumber,
            phoneCodeHash,
            email
        );
    }

    verifyEmail(
        phoneNumber: string,
        phoneCodeHash: string,
        verification: authMethods.EmailVerificationResult
    ) {
        return authMethods.verifyEmail(
            this,
            phoneNumber,
            phoneCodeHash,
            verification
        );
    }

    resetLoginEmail(phoneNumber: string, phoneCodeHash: string) {
        return authMethods.resetLoginEmail(this, phoneNumber, phoneCodeHash);
    }

    signInWithPassword(
        apiCredentials: authMethods.ApiCredentials,
        authParams: authMethods.UserPasswordAuthParams
    ) {
        return authMethods.signInWithPassword(this, apiCredentials, authParams);
    }

    signInBot(
        apiCredentials: authMethods.ApiCredentials,
        authParams: authMethods.BotAuthParams
    ) {
        return authMethods.signInBot(this, apiCredentials, authParams);
    }

    signInWithWebToken(
        apiCredentials: authMethods.ApiCredentials,
        webAuthToken: string
    ) {
        return authMethods.signInWithWebToken(
            this,
            apiCredentials,
            webAuthToken
        );
    }
    async updateTwoFaSettings({
        isCheckPassword,
        currentPassword,
        newPassword,
        hint = "",
        email,
        emailCodeCallback,
        onEmailCodeError,
    }: twoFA.TwoFaParams) {
        return twoFA.updateTwoFaSettings(this, {
            isCheckPassword,
            currentPassword,
            newPassword,
            hint,
            email,
            emailCodeCallback,
            onEmailCodeError,
        });
    }

    inlineQuery(
        bot: EntityLike,
        query: string,
        entity?: Api.InputPeerSelf,
        offset?: string,
        geoPoint?: Api.TypeInputGeoPoint
    ) {
        return botMethods.inlineQuery(
            this,
            bot,
            query,
            entity,
            offset,
            geoPoint
        );
    }

    buildReplyMarkup(
        buttons:
            | Api.TypeReplyMarkup
            | undefined
            | ButtonLike
            | ButtonLike[]
            | ButtonLike[][],
        inlineOnly: boolean = false
    ) {
        return buttonsMethods.buildReplyMarkup(buttons, inlineOnly);
    }

    downloadFile(
        inputLocation: Api.TypeInputFileLocation,
        fileParams: downloadMethods.DownloadFileParams = {}
    ) {
        return downloadMethods.downloadFile(this, inputLocation, fileParams);
    }

    downloadProfilePhoto(
        entity: EntityLike,
        downloadProfilePhotoParams:
            | downloadMethods.DownloadProfilePhotoParams
            | string = {
            isBig: false,
        }
    ) {
        if (typeof downloadProfilePhotoParams === "string") {
            downloadProfilePhotoParams = {
                outputFile: downloadProfilePhotoParams,
            };
        }
        return downloadMethods.downloadProfilePhoto(
            this,
            entity,
            downloadProfilePhotoParams
        );
    }

    downloadMedia(
        messageOrMedia: Api.Message | Api.TypeMessageMedia,
        downloadParams?: DownloadMediaInterface | string
    ) {
        if (typeof downloadParams === "string") {
            downloadParams = { outputFile: downloadParams };
        }
        return downloadMethods.downloadMedia(
            this,
            messageOrMedia,
            downloadParams?.outputFile,
            downloadParams?.thumb,
            downloadParams?.progressCallback,
            {
                signal: downloadParams?.signal,
                requestTimeout: downloadParams?.requestTimeout,
            }
        );
    }

    get parseMode() {
        return this._parseMode;
    }

    setParseMode(
        mode:
            | "md"
            | "md2"
            | "markdown"
            | "markdownv2"
            | "html"
            | parseMethods.ParseInterface
            | undefined
    ) {
        if (mode) {
            this._parseMode = this._sanitizeParseMode(mode);
        } else {
            this._parseMode = undefined;
        }
    }

    _sanitizeParseMode(
        mode: string | parseMethods.ParseInterface
    ): parseMethods.ParseInterface {
        if (mode === "md" || mode === "markdown") {
            return MarkdownParser;
        }
        if (mode === "md2" || mode === "markdownv2") {
            return MarkdownV2Parser;
        }
        if (mode == "html") {
            return HTMLParser;
        }
        if (typeof mode == "object" && "parse" in mode && "unparse" in mode) {
            return mode;
        }
        throw new Error(`Invalid parse mode type ${mode}`);
    }

    iterMessages(
        entity: EntityLike | undefined,
        iterParams: Partial<messageMethods.IterMessagesParams> = {}
    ) {
        return messageMethods.iterMessages(this, entity, iterParams);
    }

    getMessages(
        entity: EntityLike | undefined,
        getMessagesParams: Partial<messageMethods.IterMessagesParams> = {}
    ) {
        return messageMethods.getMessages(this, entity, getMessagesParams);
    }

    getCommentData(entity: EntityLike, message: number | Api.Message) {
        return messageMethods.getCommentData(this, entity, message);
    }

    sendMessage(
        entity: EntityLike,
        sendMessageParams: messageMethods.SendMessageParams = {}
    ) {
        return messageMethods.sendMessage(this, entity, sendMessageParams);
    }

    forwardMessages(
        entity: EntityLike,
        forwardMessagesParams: messageMethods.ForwardMessagesParams
    ) {
        return messageMethods.forwardMessages(
            this,
            entity,
            forwardMessagesParams
        );
    }

    editMessage(
        entity: EntityLike,
        editMessageParams: messageMethods.EditMessageParams
    ) {
        return messageMethods.editMessage(this, entity, editMessageParams);
    }

    deleteMessages(
        entity: EntityLike | undefined,
        messageIds: MessageIDLike[],
        { revoke = true }
    ) {
        return messageMethods.deleteMessages(this, entity, messageIds, {
            revoke: revoke,
        });
    }

    pinMessage(
        entity: EntityLike,
        message?: undefined,
        pinMessageParams?: messageMethods.UpdatePinMessageParams
    ): Promise<Api.messages.AffectedHistory>;
    pinMessage(
        entity: EntityLike,
        message: MessageIDLike,
        pinMessageParams?: messageMethods.UpdatePinMessageParams
    ): Promise<Api.Message>;
    pinMessage(
        entity: EntityLike,
        message?: any,
        pinMessageParams?: messageMethods.UpdatePinMessageParams
    ) {
        return messageMethods.pinMessage(
            this,
            entity,
            message,
            pinMessageParams
        );
    }

    unpinMessage(
        entity: EntityLike,
        message?: undefined,
        pinMessageParams?: messageMethods.UpdatePinMessageParams
    ): Promise<Api.messages.AffectedHistory>;
    unpinMessage(
        entity: EntityLike,
        message: MessageIDLike,
        pinMessageParams?: messageMethods.UpdatePinMessageParams
    ): Promise<undefined>;
    unpinMessage(
        entity: EntityLike,
        message?: any,
        unpinMessageParams?: messageMethods.UpdatePinMessageParams
    ) {
        return messageMethods.unpinMessage(
            this,
            entity,
            message,
            unpinMessageParams
        ) as Promise<Api.messages.AffectedHistory | undefined>;
    }

    markAsRead(
        entity: EntityLike,
        message?: MessageIDLike | MessageIDLike[],
        markAsReadParams?: messageMethods.MarkAsReadParams
    ) {
        return messageMethods.markAsRead(
            this,
            entity,
            message,
            markAsReadParams
        );
    }

    sendReaction(
        entity: EntityLike,
        messageId: number,
        reaction?: Api.TypeReaction[],
        big?: boolean,
        addToRecent?: boolean
    ) {
        return messageMethods.sendReaction(
            this,
            entity,
            messageId,
            reaction,
            big,
            addToRecent
        );
    }

    getReactionUsers(
        entity: EntityLike,
        messageId: number,
        params?: {
            reaction?: string | Api.TypeReaction;
            limit?: number;
            offset?: string;
        }
    ) {
        return messageMethods.getReactionUsers(
            this,
            entity,
            messageId,
            params
        );
    }

    sendPoll(
        entity: EntityLike,
        poll: messageMethods.SendPollParams,
        params?: Omit<uploadMethods.SendFileInterface, "file" | "caption">
    ) {
        return messageMethods.sendPoll(this, entity, poll, params);
    }

    vote(
        entity: EntityLike,
        message: MessageIDLike,
        options: number | number[] | Buffer | Buffer[]
    ) {
        return messageMethods.vote(this, entity, message, options);
    }

    closePoll(entity: EntityLike, message: MessageIDLike) {
        return messageMethods.closePoll(this, entity, message);
    }

    getScheduledMessages(entity: EntityLike, ids?: number | number[]) {
        return messageMethods.getScheduledMessages(this, entity, ids);
    }

    sendScheduledMessages(entity: EntityLike, ids: number | number[]) {
        return messageMethods.sendScheduledMessages(this, entity, ids);
    }

    deleteScheduledMessages(entity: EntityLike, ids: number | number[]) {
        return messageMethods.deleteScheduledMessages(this, entity, ids);
    }

    copyMessages(
        entity: EntityLike,
        copyMessagesParams: Omit<
            messageMethods.ForwardMessagesParams,
            "dropAuthor"
        >
    ) {
        return messageMethods.copyMessages(this, entity, copyMessagesParams);
    }

    saveDraft(entity: EntityLike, params?: messageMethods.SaveDraftParams) {
        return messageMethods.saveDraft(this, entity, params);
    }

    clearDraft(entity: EntityLike) {
        return messageMethods.clearDraft(this, entity);
    }

    clearAllDrafts() {
        return messageMethods.clearAllDrafts(this);
    }

    getMessageByLink(link: string) {
        return messageMethods.getMessageByLink(this, link);
    }

    getDiscussionMessage(entity: EntityLike, message: MessageIDLike) {
        return messageMethods.getDiscussionMessage(this, entity, message);
    }

    getRichMessage(entity: EntityLike, message: MessageIDLike) {
        return messageMethods.getRichMessage(this, entity, message);
    }

    iterDialogs(iterDialogsParams: dialogMethods.IterDialogsParams = {}) {
        return dialogMethods.iterDialogs(this, iterDialogsParams);
    }

    getDialogs(params: dialogMethods.IterDialogsParams = {}) {
        return dialogMethods.getDialogs(this, params);
    }

    iterParticipants(
        entity: EntityLike,
        params: chatMethods.IterParticipantsParams = {}
    ) {
        return chatMethods.iterParticipants(this, entity, params);
    }

    getParticipants(
        entity: EntityLike,
        params: chatMethods.IterParticipantsParams = {}
    ) {
        return chatMethods.getParticipants(this, entity, params);
    }

    kickParticipant(entity: EntityLike, participant: EntityLike) {
        return chatMethods.kickParticipant(this, entity, participant);
    }

    getParticipant(entity: EntityLike, participant: EntityLike) {
        return chatMethods.getParticipant(this, entity, participant);
    }

    editBanned(
        entity: EntityLike,
        participant: EntityLike,
        params?: chatMethods.EditBannedParams | Api.ChatBannedRights
    ) {
        return chatMethods.editBanned(this, entity, participant, params);
    }

    editAdmin(
        entity: EntityLike,
        participant: EntityLike,
        params: chatMethods.EditAdminParams | Api.ChatAdminRights
    ) {
        return chatMethods.editAdmin(this, entity, participant, params);
    }

    editChatDefaultBannedRights(
        entity: EntityLike,
        params: chatMethods.EditBannedParams | Api.ChatBannedRights
    ) {
        return chatMethods.editChatDefaultBannedRights(this, entity, params);
    }

    editTitle(entity: EntityLike, title: string) {
        return chatMethods.editTitle(this, entity, title);
    }

    editPhoto(entity: EntityLike, photo?: FileLike | Api.TypeInputChatPhoto) {
        return chatMethods.editPhoto(this, entity, photo);
    }

    editChatAbout(entity: EntityLike, about: string) {
        return chatMethods.editChatAbout(this, entity, about);
    }

    toggleSlowMode(entity: EntityLike, seconds?: number) {
        return chatMethods.toggleSlowMode(this, entity, seconds);
    }
    createChannel(params: chatMethods.CreateChannelParams) {
        return chatMethods.createChannel(this, params);
    }

    createChat(params: chatMethods.CreateChatParams) {
        return chatMethods.createChat(this, params);
    }

    joinChannel(entity: EntityLike) {
        return chatMethods.joinChannel(this, entity);
    }

    importChatInvite(link: string) {
        return chatMethods.importChatInvite(this, link);
    }

    leaveChannel(entity: EntityLike) {
        return chatMethods.leaveChannel(this, entity);
    }

    deleteHistory(
        entity: EntityLike,
        params?: chatMethods.DeleteHistoryParams
    ) {
        return chatMethods.deleteHistory(this, entity, params);
    }

    editPeerFolders(entity: EntityLike | EntityLike[], folderId: number) {
        return chatMethods.editPeerFolders(this, entity, folderId);
    }

    iterAdminLog(entity: EntityLike, params?: chatMethods.AdminLogParams) {
        return chatMethods.iterAdminLog(this, entity, params);
    }

    getAdminLog(entity: EntityLike, params?: chatMethods.AdminLogParams) {
        return chatMethods.getAdminLog(this, entity, params);
    }

    setTyping(
        entity: EntityLike,
        action?: chatMethods.ChatActionType | Api.TypeSendMessageAction,
        params?: { topMsgId?: number }
    ) {
        return chatMethods.setTyping(this, entity, action, params);
    }

    getCommonChats(
        entity: EntityLike,
        params?: userMethods.GetCommonChatsParams
    ) {
        return userMethods.getCommonChats(this, entity, params);
    }

    exportChatInvite(
        entity: EntityLike,
        params?: inviteLinkMethods.ExportChatInviteParams
    ) {
        return inviteLinkMethods.exportChatInvite(this, entity, params);
    }

    editExportedChatInvite(
        entity: EntityLike,
        link: string,
        params: inviteLinkMethods.EditExportedChatInviteParams
    ) {
        return inviteLinkMethods.editExportedChatInvite(
            this,
            entity,
            link,
            params
        );
    }

    getExportedChatInvite(entity: EntityLike, link: string) {
        return inviteLinkMethods.getExportedChatInvite(this, entity, link);
    }

    deleteExportedChatInvite(entity: EntityLike, link: string) {
        return inviteLinkMethods.deleteExportedChatInvite(this, entity, link);
    }

    deleteRevokedExportedChatInvites(entity: EntityLike, admin?: EntityLike) {
        return inviteLinkMethods.deleteRevokedExportedChatInvites(
            this,
            entity,
            admin
        );
    }

    getAdminsWithInvites(entity: EntityLike) {
        return inviteLinkMethods.getAdminsWithInvites(this, entity);
    }

    iterExportedChatInvites(
        entity: EntityLike,
        params?: inviteLinkMethods.ExportedChatInvitesParams
    ) {
        return inviteLinkMethods.iterExportedChatInvites(this, entity, params);
    }

    getExportedChatInvites(
        entity: EntityLike,
        params?: inviteLinkMethods.ExportedChatInvitesParams
    ) {
        return inviteLinkMethods.getExportedChatInvites(this, entity, params);
    }

    iterChatInviteImporters(
        entity: EntityLike,
        params?: inviteLinkMethods.ChatInviteImportersParams
    ) {
        return inviteLinkMethods.iterChatInviteImporters(this, entity, params);
    }

    getChatInviteImporters(
        entity: EntityLike,
        params?: inviteLinkMethods.ChatInviteImportersParams
    ) {
        return inviteLinkMethods.getChatInviteImporters(this, entity, params);
    }

    hideChatJoinRequest(
        entity: EntityLike,
        user: EntityLike,
        params?: { approved?: boolean }
    ) {
        return inviteLinkMethods.hideChatJoinRequest(
            this,
            entity,
            user,
            params
        );
    }

    hideAllChatJoinRequests(
        entity: EntityLike,
        params?: { approved?: boolean; link?: string }
    ) {
        return inviteLinkMethods.hideAllChatJoinRequests(this, entity, params);
    }

    checkChatInvite(link: string) {
        return inviteLinkMethods.checkChatInvite(this, link);
    }

    updateProfile(params: accountMethods.UpdateProfileParams) {
        return accountMethods.updateProfile(this, params);
    }

    updateUsername(username: string) {
        return accountMethods.updateUsername(this, username);
    }

    updateStatus(online?: boolean) {
        return accountMethods.updateStatus(this, online);
    }

    uploadProfilePhoto(params: accountMethods.UploadProfilePhotoParams) {
        return accountMethods.uploadProfilePhoto(this, params);
    }

    updateProfilePhoto(
        photo: Api.TypeInputPhoto | Api.TypePhoto,
        params?: { fallback?: boolean; bot?: EntityLike }
    ) {
        return accountMethods.updateProfilePhoto(this, photo, params);
    }

    deleteProfilePhotos(photos: (Api.TypeInputPhoto | Api.TypePhoto)[]) {
        return accountMethods.deleteProfilePhotos(this, photos);
    }

    getUserPhotos(
        entity: EntityLike,
        params?: accountMethods.GetUserPhotosParams
    ) {
        return accountMethods.getUserPhotos(this, entity, params);
    }

    getContacts() {
        return contactMethods.getContacts(this);
    }

    addContact(entity: EntityLike, params: contactMethods.AddContactParams) {
        return contactMethods.addContact(this, entity, params);
    }

    deleteContacts(users: EntityLike | EntityLike[]) {
        return contactMethods.deleteContacts(this, users);
    }

    importContacts(contacts: contactMethods.ImportContactEntry[]) {
        return contactMethods.importContacts(this, contacts);
    }

    block(entity: EntityLike, params?: { myStoriesFrom?: boolean }) {
        return contactMethods.block(this, entity, params);
    }

    unblock(entity: EntityLike, params?: { myStoriesFrom?: boolean }) {
        return contactMethods.unblock(this, entity, params);
    }

    getBlocked(params?: contactMethods.GetBlockedParams) {
        return contactMethods.getBlocked(this, params);
    }

    resetAuthorization(hash?: BigInteger) {
        return accountMethods.resetAuthorization(this, hash);
    }

    getAuthorizations() {
        return accountMethods.getAuthorizations(this);
    }

    getPrivacy(key: Api.TypeInputPrivacyKey) {
        return accountMethods.getPrivacy(this, key);
    }

    setPrivacy(
        key: Api.TypeInputPrivacyKey,
        rules: Api.TypeInputPrivacyRule[]
    ) {
        return accountMethods.setPrivacy(this, key, rules);
    }

    getNotifySettings(entity: EntityLike | Api.TypeInputNotifyPeer) {
        return accountMethods.getNotifySettings(this, entity);
    }

    updateNotifySettings(
        entity: EntityLike | Api.TypeInputNotifyPeer,
        params: accountMethods.UpdateNotifySettingsParams
    ) {
        return accountMethods.updateNotifySettings(this, entity, params);
    }

    getAccountTTL() {
        return accountMethods.getAccountTTL(this);
    }

    setAccountTTL(days: number) {
        return accountMethods.setAccountTTL(this, days);
    }

    getGlobalPrivacySettings() {
        return accountMethods.getGlobalPrivacySettings(this);
    }

    setGlobalPrivacySettings(settings: Api.TypeGlobalPrivacySettings) {
        return accountMethods.setGlobalPrivacySettings(this, settings);
    }

    createForumTopic(
        entity: EntityLike,
        params: forumMethods.CreateForumTopicParams
    ) {
        return forumMethods.createForumTopic(this, entity, params);
    }

    editForumTopic(
        entity: EntityLike,
        topicId: number,
        params: forumMethods.EditForumTopicParams
    ) {
        return forumMethods.editForumTopic(this, entity, topicId, params);
    }

    updatePinnedForumTopic(
        entity: EntityLike,
        topicId: number,
        pinned: boolean
    ) {
        return forumMethods.updatePinnedForumTopic(
            this,
            entity,
            topicId,
            pinned
        );
    }

    reorderPinnedForumTopics(
        entity: EntityLike,
        order: number[],
        params?: { force?: boolean }
    ) {
        return forumMethods.reorderPinnedForumTopics(
            this,
            entity,
            order,
            params
        );
    }

    getForumTopics(
        entity: EntityLike,
        params?: forumMethods.GetForumTopicsParams
    ) {
        return forumMethods.getForumTopics(this, entity, params);
    }

    getForumTopicsByID(entity: EntityLike, topicIds: number | number[]) {
        return forumMethods.getForumTopicsByID(this, entity, topicIds);
    }

    toggleForum(entity: EntityLike, enabled: boolean, tabs?: boolean) {
        return forumMethods.toggleForum(this, entity, enabled, tabs);
    }

    toggleViewForumAsMessages(entity: EntityLike, enabled: boolean) {
        return forumMethods.toggleViewForumAsMessages(this, entity, enabled);
    }

    sendStory(entity: EntityLike, params: storyMethods.SendStoryParams) {
        return storyMethods.sendStory(this, entity, params);
    }

    editStory(
        entity: EntityLike,
        storyId: number,
        params: storyMethods.EditStoryParams
    ) {
        return storyMethods.editStory(this, entity, storyId, params);
    }

    deleteStories(entity: EntityLike, ids: number | number[]) {
        return storyMethods.deleteStories(this, entity, ids);
    }

    toggleStoriesPinned(
        entity: EntityLike,
        ids: number | number[],
        pinned?: boolean
    ) {
        return storyMethods.toggleStoriesPinned(this, entity, ids, pinned);
    }

    canSendStory(entity: EntityLike) {
        return storyMethods.canSendStory(this, entity);
    }

    getAllStories(params?: storyMethods.GetAllStoriesParams) {
        return storyMethods.getAllStories(this, params);
    }

    getPeerStories(entity: EntityLike) {
        return storyMethods.getPeerStories(this, entity);
    }

    getStoriesByID(entity: EntityLike, ids: number | number[]) {
        return storyMethods.getStoriesByID(this, entity, ids);
    }

    getPinnedStories(
        entity: EntityLike,
        params?: storyMethods.GetStoriesPageParams
    ) {
        return storyMethods.getPinnedStories(this, entity, params);
    }

    getStoriesArchive(
        entity: EntityLike,
        params?: storyMethods.GetStoriesPageParams
    ) {
        return storyMethods.getStoriesArchive(this, entity, params);
    }

    readStories(entity: EntityLike, maxId?: number) {
        return storyMethods.readStories(this, entity, maxId);
    }

    incrementStoryViews(entity: EntityLike, ids: number | number[]) {
        return storyMethods.incrementStoryViews(this, entity, ids);
    }

    getStoryViewsList(
        entity: EntityLike,
        storyId: number,
        params?: storyMethods.GetStoryViewsListParams
    ) {
        return storyMethods.getStoryViewsList(this, entity, storyId, params);
    }

    exportStoryLink(entity: EntityLike, storyId: number) {
        return storyMethods.exportStoryLink(this, entity, storyId);
    }

    sendStoryReaction(
        entity: EntityLike,
        storyId: number,
        reaction?: string | BigInteger | Api.TypeReaction,
        params?: { addToRecent?: boolean }
    ) {
        return storyMethods.sendStoryReaction(
            this,
            entity,
            storyId,
            reaction,
            params
        );
    }

    getDialogFilters() {
        return folderMethods.getDialogFilters(this);
    }

    updateDialogFilter(id: number, filter?: Api.TypeDialogFilter) {
        return folderMethods.updateDialogFilter(this, id, filter);
    }

    updateDialogFiltersOrder(order: number[]) {
        return folderMethods.updateDialogFiltersOrder(this, order);
    }

    getStickerSet(set: stickerMethods.InputStickerSetLike) {
        return stickerMethods.getStickerSet(this, set);
    }

    getAllStickers() {
        return stickerMethods.getAllStickers(this);
    }

    installStickerSet(
        set: stickerMethods.InputStickerSetLike,
        params?: { archived?: boolean }
    ) {
        return stickerMethods.installStickerSet(this, set, params);
    }

    uninstallStickerSet(set: stickerMethods.InputStickerSetLike) {
        return stickerMethods.uninstallStickerSet(this, set);
    }

    getRecentStickers(params?: { attached?: boolean }) {
        return stickerMethods.getRecentStickers(this, params);
    }

    saveRecentSticker(
        document: Api.TypeInputDocument | Api.Document,
        params?: { unsave?: boolean; attached?: boolean }
    ) {
        return stickerMethods.saveRecentSticker(this, document, params);
    }

    clearRecentStickers(params?: { attached?: boolean }) {
        return stickerMethods.clearRecentStickers(this, params);
    }

    getFavedStickers() {
        return stickerMethods.getFavedStickers(this);
    }

    faveSticker(
        document: Api.TypeInputDocument | Api.Document,
        params?: { unfave?: boolean }
    ) {
        return stickerMethods.faveSticker(this, document, params);
    }

    getCustomEmojiDocuments(documentIds: BigInteger[]) {
        return stickerMethods.getCustomEmojiDocuments(this, documentIds);
    }

    setBotCommands(
        commands: botMethods.BotCommandEntry[],
        params?: botMethods.BotCommandScopeParams
    ) {
        return botMethods.setBotCommands(this, commands, params);
    }

    getBotCommands(params?: botMethods.BotCommandScopeParams) {
        return botMethods.getBotCommands(this, params);
    }

    resetBotCommands(params?: botMethods.BotCommandScopeParams) {
        return botMethods.resetBotCommands(this, params);
    }

    setBotInfo(params: botMethods.SetBotInfoParams) {
        return botMethods.setBotInfo(this, params);
    }

    getBotInfo(params?: { bot?: EntityLike; langCode?: string }) {
        return botMethods.getBotInfo(this, params);
    }

    setBotMenuButton(user: EntityLike, button: Api.TypeBotMenuButton) {
        return botMethods.setBotMenuButton(this, user, button);
    }

    getBotMenuButton(user: EntityLike) {
        return botMethods.getBotMenuButton(this, user);
    }

    translateText(params: messageMethods.TranslateTextParams) {
        return messageMethods.translateText(this, params);
    }

    getMessagesViews(
        entity: EntityLike,
        ids: number | number[],
        increment?: boolean
    ) {
        return messageMethods.getMessagesViews(this, entity, ids, increment);
    }

    getOutboxReadDate(entity: EntityLike, message: MessageIDLike) {
        return messageMethods.getOutboxReadDate(this, entity, message);
    }

    getMessageReadParticipants(entity: EntityLike, message: MessageIDLike) {
        return messageMethods.getMessageReadParticipants(
            this,
            entity,
            message
        );
    }

    iterDownload(
        file:
            | Api.Message
            | Api.MessageMediaDocument
            | Api.MessageMediaPhoto
            | Api.TypeInputFileLocation,
        params?: downloadMethods.IterDownloadParams
    ) {
        return downloadMethods.iterDownload(this, file, params);
    }

    on(event: NewMessage): (f: (event: NewMessageEvent) => void) => void;
    on(event: CallbackQuery): (f: (event: CallbackQueryEvent) => void) => void;
    on(event: Album): (f: (event: AlbumEvent) => void) => void;
    on(event: EditedMessage): (f: (event: EditedMessageEvent) => void) => void;
    on(event: DeletedMessage): (f: (event: DeletedMessageEvent) => void) => void;
    on(event?: EventBuilder): (f: (event: any) => void) => void;
    on(event?: EventBuilder) {
        return updateMethods.on(this, event);
    }

    addEventHandler(
        callback: { (event: NewMessageEvent): void },
        event: NewMessage
    ): void;
    addEventHandler(
        callback: { (event: CallbackQueryEvent): void },
        event: CallbackQuery
    ): void;
    addEventHandler(
        callback: { (event: AlbumEvent): void },
        event: Album
    ): void;
    addEventHandler(
        callback: { (event: EditedMessageEvent): void },
        event: EditedMessage
    ): void;
    addEventHandler(
        callback: { (event: DeletedMessageEvent): void },
        event: DeletedMessage
    ): void;
    addEventHandler(
        callback: { (event: any): void },
        event?: EventBuilder
    ): void;
    addEventHandler(callback: { (event: any): void }, event?: EventBuilder) {
        return updateMethods.addEventHandler(this, callback, event);
    }

    removeEventHandler(callback: CallableFunction, event: EventBuilder) {
        return updateMethods.removeEventHandler(this, callback, event);
    }

    listEventHandlers() {
        return updateMethods.listEventHandlers(this);
    }

    async catchUp() {
        return catchUp(this);
    }

    uploadFile(fileParams: uploadMethods.UploadFileParams) {
        return uploadMethods.uploadFile(this, fileParams);
    }

    sendFile(
        entity: EntityLike,
        sendFileParams: uploadMethods.SendFileInterface
    ) {
        return uploadMethods.sendFile(this, entity, sendFileParams);
    }

    invoke<R extends Api.AnyRequest>(
        request: R,
        dcId?: number
    ): Promise<R["__response"]> {
        return userMethods.invoke(this, request, dcId);
    }
    
    invokeWithSender<R extends Api.AnyRequest>(
        request: R,
        sender?: MTProtoSender | SessionLease
    ): Promise<R["__response"]> {
        return userMethods.invoke(this, request, undefined, sender);
    }

    private _apiProxy?: Api.ApiFacade;

    get api(): Api.ApiFacade {
        if (!this._apiProxy) {
            this._apiProxy = createApiProxy(
                Api as unknown as Record<string, unknown>,
                (request, dcId) =>
                    this.invoke(request as Api.AnyRequest, dcId)
            ) as Api.ApiFacade;
        }
        return this._apiProxy;
    }

    getMe(inputPeer: true): Promise<Api.InputPeerUser>;
    getMe(inputPeer?: false): Promise<Api.User>;
    getMe(inputPeer = false) {
        return userMethods.getMe(this, inputPeer);
    }

    isBot() {
        return userMethods.isBot(this);
    }

    isUserAuthorized() {
        return userMethods.isUserAuthorized(this);
    }

    getEntity(entity: EntityLike): Promise<Entity>;
    getEntity(entity: EntityLike[]): Promise<Entity[]>;
    getEntity(entity: any) {
        return userMethods.getEntity(this, entity);
    }

    getInputEntity(entity: EntityLike) {
        return userMethods.getInputEntity(this, entity);
    }

    getPeerId(peer: EntityLike, addMark = true) {
        return userMethods.getPeerId(this, peer, addMark);
    }

    _getInputDialog(peer: any) {
        return userMethods._getInputDialog(this, peer);
    }

    _getInputNotify(notify: any) {
        return userMethods._getInputNotify(this, notify);
    }

    async _handleReconnect() {
        this._log.info("Handling reconnect!");
        try {
            await this.getMe();
        } catch (e) {
            if (this._sender?.userDisconnected) {
                this._log.debug(
                    `Reconnect probe cancelled by disconnect: ${
                        e instanceof Error ? e.message : e
                    }`
                );
                return;
            }
            if ((e as { code?: number })?.code === 401) {
                this._log.debug(
                    `Reconnect probe skipped: not authorized yet (${
                        (e as { errorMessage?: string }).errorMessage
                    })`
                );
            } else {
                this._log.error(`Error while trying to reconnect`, e);
                if (this._errorHandler) {
                    await this._errorHandler(e as Error);
                }
            }
        }
        if (!this._loopStarted && !this._destroyed) {
            this._log.info("Restarting update loop after reconnect");
            _updateLoop(this);
            this._loopStarted = true;
        }
    }

    async connect() {
        await this._initSession();
        if (this._sender === undefined) {
            const dcId = this.session.dcId || 4;
            const sessionKey = this.session.getAuthKey(dcId);
            const dcenter = this._dcenters.get(
                dcId,
                sessionKey
            );
            if (sessionKey && sessionKey !== dcenter.authKey) {
                await dcenter.authKey.setKey(sessionKey.getKey());
            }
            // Dcenter is canonical per-DC state shared by main and pooled
            // senders, so persist this very object rather than a copy.
            this.session.setAuthKey(dcenter.authKey, dcId);
            this._sender = new MTProtoSender(dcenter.authKey, {
                logger: this._log,
                dcId,
                retries: this._connectionRetries,
                delay: this._retryDelay,
                autoReconnect: this._autoReconnect,
                connectTimeout: this._timeout,
                authKeyCallback: this._authKeyCallback.bind(this),
                updateCallback: _handleUpdate.bind(this),
                isMainSender: true,
                client: this,
                securityChecks: this._securityChecks,
                autoReconnectCallback: this._handleReconnect.bind(this),
                reconnectRetries: this._reconnectRetries,
                dcenter,
            });
        }

        if (this._sender.isConnected()) {
            if (!this._loopStarted) {
                _updateLoop(this);
                this._loopStarted = true;
            }
            return false;
        }

        const connection = new this._connection({
            ip: this.session.serverAddress,
            port: this.session.port || 80,
            dcId: this.session.dcId,
            loggers: this._log,
            socket: this.networkSocket,
            keepAliveInterval: this._keepAliveInterval,
        });
        this._log.info(`Using LAYER ${LAYER} for initial connect`);
        await this._connectSender(this._sender, this.session.dcId, connection);
        this.session.setAuthKey(this._sender.authKey);
        this.session.save();

        if (!this._loopStarted) {
            _updateLoop(this);
            this._loopStarted = true;
        }
        this._connectedDeferred.resolve();
        this._isSwitchingDc = false;
        return true;
    }

    async _switchDC(newDc: number) {
        this._log.info(`Reconnecting to new data center ${newDc}`);
        const DC = await this.getDC(newDc);
        this.session.setDC(newDc, DC.ipAddress, DC.port);
        this.session.save();
        this._isSwitchingDc = true;
        await this._media.purge();
        await this._network.purge();
        await this._disconnect();
        this._sender = undefined;
        return await this.connect();
    }

    async getDC(
        dcId: number,
        downloadDC = false
    ): Promise<{ id: number; ipAddress: string; port: number }> {
        this._log.debug(`Getting DC ${dcId}`);
        if (this.networkSocket.isWebSocket) {
            const address = webSocketDcAddress(dcId, downloadDC);
            if (address) {
                return { id: dcId, ipAddress: address, port: 443 };
            }
            throw new Error(`Cannot find the DC with the ID of ${dcId}`);
        }
        if (!this._config) {
            try {
                this._config = await this.api.help.getConfig();
            } catch (e) {
                this._log.warn(
                    `help.GetConfig failed, falling back to built-in DC seeds: ${e}`
                );
            }
        }
        const lookup = this._lookupDcOption(dcId, downloadDC);
        if (lookup) {
            return lookup;
        }
        const ipv4Table = PROD_DC_IPV4;
        const ipv6Table = PROD_DC_IPV6;
        const ipAddress = (this._useIPV6 ? ipv6Table : ipv4Table)[dcId];
        if (ipAddress) {
            return { id: dcId, ipAddress, port: 443 };
        }
        throw new Error(`Cannot find the DC with the ID of ${dcId}`);
    }

    private _lookupDcOption(
        dcId: number,
        mediaCluster: boolean
    ): { id: number; ipAddress: string; port: number } | undefined {
        if (!this._config) return undefined;
        let candidates = this._config.dcOptions.filter((DC) => {
            if (DC.id !== dcId) return false;
            if (DC.cdn) return false;
            if (DC.mediaOnly && !mediaCluster) return false;
            if (DC.secret && DC.secret.length) return false;
            if (DC.tcpoOnly) return false;
            return !!DC.ipv6 === this._useIPV6;
        });
        if (!candidates.length) return undefined;
        if (mediaCluster && candidates.some((DC) => DC.mediaOnly)) {
            candidates = candidates.filter((DC) => DC.mediaOnly);
        }
        const failures =
            this._dcConnectFailures.get(`${dcId}:${mediaCluster}`) ?? 0;
        const chosen = candidates[failures % candidates.length];
        return {
            id: chosen.id,
            ipAddress: chosen.ipAddress,
            port: chosen.port || 443,
        };
    }

    async _getDownloadConcurrency(fileSize: number): Promise<number> {
        if (!this._appConfig) {
            try {
                const result = await this.api.help.getAppConfig({ hash: 0 });
                if (result instanceof Api.help.AppConfig) {
                    this._appConfig = {};
                    const walk = (v: any): any => {
                        if (v instanceof Api.JsonObject) {
                            const obj: any = {};
                            for (const kv of v.value) {
                                obj[kv.key] = walk(kv.value);
                            }
                            return obj;
                        }
                        if (v instanceof Api.JsonArray) return v.value.map(walk);
                        if (v instanceof Api.JsonString) return v.value;
                        if (v instanceof Api.JsonNumber) return v.value;
                        if (v instanceof Api.JsonBool) return v.value;
                        if (v instanceof Api.JsonNull) return null;
                        return v;
                    };
                    this._appConfig = walk(result.config);
                }
            } catch {
                this._appConfig = {};
            }
        }
        const smallLimit = this._appConfig?.small_queue_max_active_operations_count ?? 4;
        const largeLimit = this._appConfig?.large_queue_max_active_operations_count ?? 8;
        return fileSize > 20 * 1024 * 1024 ? largeLimit : smallLimit;
    }

    _getResponseMessage(req: any, result: any, inputChat: any) {
        return parseMethods._getResponseMessage(this, req, result, inputChat);
    }

    static get events() {
        return import("../events");
    }
}
