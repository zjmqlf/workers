const fs = require("fs");
// import fs from "fs";

const showfilesbot = [];
const tgjmqbot = [];
const blgjlqbot = [];
const fileLeakBot = [];
const nnfilebot = [];
const tangBRebot = [];
const decoderrobot = [];
// const tebiejiebot = [];
const mmyzybot = [];
// const kkjmqmbot = [];
// const paniangbot = [];
// const KodeXFilesbot = [];
// const kodexfilebot = [];
// const KodeXMedia1bot = [];
// const AllXFilesbot = [];
// const MediaXFilebot = [];
const KodeXFiles2bot = [];
// const DEANIgniteNationsbot = [];
const RyumaSepongMilkubot = [];
// const HikkiTusbolPaijobot = [];
const LunindiaCipokSuprettobot = [];
// const PaijoKontolBurikbot = [];
const Steviarchiverbot = [];
const DghuddvhiBOT = [];
const Hijautebalbot = [];
const FilesHubRobot = [];
const filespanindobot = [];
const KodeXChatsINDbot = [];
const MassFilesStoreBot = [];
const betapahatitakbahagiabot = [];
const QQfilebot = [];
// const Zhuahihaibot = [];
// const REDDFILEBOT = [];
const wenjianjibot = [];
const amumujiemabot = [];
const parludecodingBot = [];
const teestpanbot = [];
const atfileslinksbot = [];
const lockHivebot = [];
const tgdecoderbot = [];
const ZYXFilesBot = [];
const ntmjmqbot = [];
const newjmqbot = [];
const filepanbot = [];
// const messengercode = [];
const myseseXBot = [];
const save2BoxBot = [];
const mtfxqbot = [];
const mtfxq2bot = [];
const mediaBK2Bot = [];
const mouseFilebot = [];
const dataPanBot = [];
const filesPan1Bot = [];
const showfilesbotRegexp = /(showfilesbot_\d*p*_*\d*v*_*\d*d*_[A-Za-z0-9]{20})/gi;   //showfilesbot
const showfiles3botRegexp = /(showfiles3bot_\d*p*_*\d*v*_*\d*d*_[A-Za-z0-9]{20})/gi;   //showfiles3bot
const tgjmq1botRegexp = /(tgjmq1bot_\d*p*\d*v*\d*d*_[A-Za-z0-9]{16})/gi;   //tgjmq1bot
const tgjmq3botRegexp = /(tgjmq3bot_\d*p*\d*v*\d*d*_[A-Za-z0-9]{16})/gi;   //tgjmq3bot
const tgjmq5botRegexp = /(tgjmq5bot_\d*p*\d*v*\d*d*_[A-Za-z0-9]{16})/gi;   //tgjmq5bot
const tgjmq01botRegexp = /(tgjmq01bot_\d*p*\d*v*\d*d*_[A-Za-z0-9]{16})/gi;   //tgjmq01bot
const blgjlqbotRegexp = /(blgjlqbot_\d+p\d+v\d+d_[A-Za-z0-9]{16})/gi;   //blgjlqbot
const fileLeakBotRegexp = /(fileLeakBot_\d+p_\d+v_\d+d_[A-Za-z0-9]{13})/gi;   //fileLeakBot
const nnfilebotRegexp = /(nnfilebot_[A-Za-z0-9]*_[A-Za-z0-9]*_[A-Za-z0-9]*_[A-Za-z0-9]{12})/gi;   //nnfilebot
const tangBRebotRegexp = /(TangBRebot_\d+p_\d+v_\d+d_[A-Za-z0-9]{12})/gi;   //tangBRebot
const decoderrobotRegexp = /(files_\d+v_\d+p_\d+d_[a-z0-9]{12})/gi;   //decoderrobot
// const tebiejie1botRegexp = /(tebiejie1_\d*V*\d*P*\d*D*_[A-Za-z0-9]{22})/gi;   //tebiejie1bot
// const tebiejie3botRegexp = /(tebiejie3bot_\d+V_\d+P_\d+D_[A-Za-z0-9]{12})/gi;   //tebiejie3bot
const mmyzybot1Regexp = /(mmyzy_bot_v:[A-Za-z0-9]{32})/gi;   //mmyzybot
const mmyzybot2Regexp = /(mmyzy_bot_p:[A-Za-z0-9]{32})/gi;   //mmyzybot
const mmyzybot3Regexp = /(mmyzy_bot_d:[A-Za-z0-9]{32})/gi;   //mmyzybot
const mmyzybot4Regexp = /(mmyzy_bot_col:[A-Za-z0-9]{32})/gi;   //mmyzybot
// const paniangbot1Regexp = /(paniang_bot_v:[A-Za-z0-9]{32})/gi;   //paniangbot
// const paniangbot2Regexp = /(paniang_bot_p:[A-Za-z0-9]{32})/gi;   //paniangbot
// const paniangbot3Regexp = /(paniang_bot_d:[A-Za-z0-9]{32})/gi;   //paniangbot
// const paniangbot4Regexp = /(paniang_bot_col:[A-Za-z0-9]{32})/gi;   //paniangbot
// const kkjmqmbot1Regexp = /(kkjmqmbot_v:[A-Za-z0-9]{32})/gi;   //kkjmqmbot
// const kkjmqmbot2Regexp = /(kkjmqmbot_p:[A-Za-z0-9]{32})/gi;   //kkjmqmbot
// const kkjmqmbot3Regexp = /(kkjmqmbot_d:[A-Za-z0-9]{32})/gi;   //kkjmqmbot
// const kkjmqmbot4Regexp = /(kkjmqmbot_col:[A-Za-z0-9]{32})/gi;   //kkjmqmbot
// const KodeXFilesbot1Regexp = /(KodeXFiles_bot_v:[A-Za-z0-9]{32})/gi;   //KodeXFilesbot
// const KodeXFilesbot2Regexp = /(KodeXFiles_bot_p:[A-Za-z0-9]{32})/gi;   //KodeXFilesbot
// const KodeXFilesbot3Regexp = /(KodeXFiles_bot_d:[A-Za-z0-9]{32})/gi;   //KodeXFilesbot
// const KodeXFilesbot4Regexp = /(KodeXFiles_bot_col:[A-Za-z0-9]{32})/gi;   //KodeXFilesbot
// const kodexfilebot1Regexp = /(kodexfilebot_v:[A-Za-z0-9]{32})/gi;   //kodexfilebot
// const kodexfilebot2Regexp = /(kodexfilebot_p:[A-Za-z0-9]{32})/gi;   //kodexfilebot
// const kodexfilebot3Regexp = /(kodexfilebot_d:[A-Za-z0-9]{32})/gi;   //kodexfilebot
// const kodexfilebot4Regexp = /(kodexfilebot_col:[A-Za-z0-9]{32})/gi;   //kodexfilebot
// const KodeXMedia1bot1Regexp = /(KodeXMedia1bot_v:[A-Za-z0-9]{32})/gi;   //KodeXMedia1bot
// const KodeXMedia1bot2Regexp = /(KodeXMedia1bot_p:[A-Za-z0-9]{32})/gi;   //KodeXMedia1bot
// const KodeXMedia1bot3Regexp = /(KodeXMedia1bot_d:[A-Za-z0-9]{32})/gi;   //KodeXMedia1bot
// const KodeXMedia1bot4Regexp = /(KodeXMedia1bot_col:[A-Za-z0-9]{32})/gi;   //KodeXMedia1bot
// const AllXFilesbot1Regexp = /(AllXFilesbot_v:[A-Za-z0-9]{32})/gi;   //AllXFilesbot
// const AllXFilesbot2Regexp = /(AllXFilesbot_p:[A-Za-z0-9]{32})/gi;   //AllXFilesbot
// const AllXFilesbot3Regexp = /(AllXFilesbot_d:[A-Za-z0-9]{32})/gi;   //AllXFilesbot
// const AllXFilesbot4Regexp = /(AllXFilesbot_col:[A-Za-z0-9]{32})/gi;   //AllXFilesbot
// const MediaXFilebot1Regexp = /(MediaXFilebot_v:[A-Za-z0-9]{32})/gi;   //MediaXFilebot
// const MediaXFilebot2Regexp = /(MediaXFilebot_p:[A-Za-z0-9]{32})/gi;   //MediaXFilebot
// const MediaXFilebot3Regexp = /(MediaXFilebot_d:[A-Za-z0-9]{32})/gi;   //MediaXFilebot
// const MediaXFilebot4Regexp = /(MediaXFilebot_col:[A-Za-z0-9]{32})/gi;   //MediaXFilebot
const KodeXFiles2bot1Regexp = /(KodeXFiles2bot_v:[A-Za-z0-9]{32})/gi;   //KodeXFiles2bot
const KodeXFiles2bot2Regexp = /(KodeXFiles2bot_p:[A-Za-z0-9]{32})/gi;   //KodeXFiles2bot
const KodeXFiles2bot3Regexp = /(KodeXFiles2bot_d:[A-Za-z0-9]{32})/gi;   //KodeXFiles2bot
const KodeXFiles2bot4Regexp = /(KodeXFiles2bot_col:[A-Za-z0-9]{32})/gi;   //KodeXFiles2bot
// const DEANIgniteNationsbot1Regexp = /(DEANIgniteNations_bot_v:[A-Za-z0-9]{32})/gi;   //DEANIgniteNationsbot
// const DEANIgniteNationsbot2Regexp = /(DEANIgniteNations_bot_p:[A-Za-z0-9]{32})/gi;   //DEANIgniteNationsbot
// const DEANIgniteNationsbot3Regexp = /(DEANIgniteNations_bot_d:[A-Za-z0-9]{32})/gi;   //DEANIgniteNationsbot
// const DEANIgniteNationsbot4Regexp = /(DEANIgniteNations_bot_col:[A-Za-z0-9]{32})/gi;   //DEANIgniteNationsbot
const RyumaSepongMilkubot1Regexp = /(RyumaSepongMilku_bot_v:[A-Za-z0-9]{32})/gi;   //RyumaSepongMilkubot
const RyumaSepongMilkubot2Regexp = /(RyumaSepongMilku_bot_p:[A-Za-z0-9]{32})/gi;   //RyumaSepongMilkubot
const RyumaSepongMilkubot3Regexp = /(RyumaSepongMilku_bot_d:[A-Za-z0-9]{32})/gi;   //RyumaSepongMilkubot
const RyumaSepongMilkubot4Regexp = /(RyumaSepongMilku_bot_col:[A-Za-z0-9]{32})/gi;   //RyumaSepongMilkubot
// const HikkiTusbolPaijobot1Regexp = /(HikkiTusbolPaijo_bot_v:[A-Za-z0-9]{32})/gi;   //HikkiTusbolPaijobot
// const HikkiTusbolPaijobot2Regexp = /(HikkiTusbolPaijo_bot_p:[A-Za-z0-9]{32})/gi;   //HikkiTusbolPaijobot
// const HikkiTusbolPaijobot3Regexp = /(HikkiTusbolPaijo_bot_d:[A-Za-z0-9]{32})/gi;   //HikkiTusbolPaijobot
// const HikkiTusbolPaijobot4Regexp = /(HikkiTusbolPaijo_bot_col:[A-Za-z0-9]{32})/gi;   //HikkiTusbolPaijobot
const LunindiaCipokSuprettobot1Regexp = /(LunindiaCipokSupretto_bot_v:[A-Za-z0-9]{32})/gi;   //LunindiaCipokSuprettobot
const LunindiaCipokSuprettobot2Regexp = /(LunindiaCipokSupretto_bot_p:[A-Za-z0-9]{32})/gi;   //LunindiaCipokSuprettobot
const LunindiaCipokSuprettobot3Regexp = /(LunindiaCipokSupretto_bot_d:[A-Za-z0-9]{32})/gi;   //LunindiaCipokSuprettobot
const LunindiaCipokSuprettobot4Regexp = /(LunindiaCipokSupretto_bot_col:[A-Za-z0-9]{32})/gi;   //LunindiaCipokSuprettobot
// const PaijoKontolBurikbot1Regexp = /(PaijoKontolBurik_bot_v:[A-Za-z0-9]{32})/gi;   //PaijoKontolBurikbot
// const PaijoKontolBurikbot2Regexp = /(PaijoKontolBurik_bot_p:[A-Za-z0-9]{32})/gi;   //PaijoKontolBurikbot
// const PaijoKontolBurikbot3Regexp = /(PaijoKontolBurik_bot_d:[A-Za-z0-9]{32})/gi;   //PaijoKontolBurikbot
// const PaijoKontolBurikbot4Regexp = /(PaijoKontolBurik_bot_col:[A-Za-z0-9]{32})/gi;   //PaijoKontolBurikbot
const Steviarchiverbot1Regexp = /(mov_\d+_[A-Za-z0-9]{8})/gi;   //Steviarchiverbot
const Steviarchiverbot2Regexp = /(pic_\d+_[A-Za-z0-9]{8})/gi;   //Steviarchiverbot
const Steviarchiverbot3Regexp = /(grp_\d+_[A-Za-z0-9]{8})/gi;   //Steviarchiverbot
const Steviarchiverbot4Regexp = /(gif_\d+_[A-Za-z0-9]{8})/gi;   //Steviarchiverbot
const Steviarchiverbot5Regexp = /(doc_\d+_[A-Za-z0-9]{8})/gi;   //Steviarchiverbot
const DghuddvhiBOTRegexp = /(DghuddvhiBOT:[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})/gi;   //DghuddvhiBOT
const HijautebalbotRegexp = /(Hijautebal_bot:[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})/gi;   //Hijautebalbot
const filespanindobotRegexp = /(filespanindobot:[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})/gi;   //filespanindobot
const KodeXChatsINDbotRegexp = /(KodeXChatsINDbot:[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})/gi;   //KodeXChatsINDbot
const FilesHubRobotRegexp = /(FilesHub_Robot_[a-z0-9]{20})/gi;   //FilesHubRobot
const MassFilesStoreBotRegexp = /(Mass_Files_Store_Bot_[A-Za-z0-9_]{16})/gi;   //MassFilesStoreBot
const betapahatitakbahagiabotRegexp = /(betapahatitakbahagia_bot:[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})/gi;   //betapahatitakbahagiabot
const QQfilebotRegexp = /(QQfile_bot:[0-9]{5}_[0-9]{5,6}_[0-9]{3})/gi;   //QQfilebot
// const QQfilebot1Regexp = /(QQfile_bot:[0-9]{5}_[0-9]{5,6}_[0-9]{3}-\d*P_\d*V_\d*D)/gi;   //QQfilebot
// const QQfilebot2Regexp = /(QQfile_bot:[0-9]{5}_[0-9]{5,6}_[0-9]{3}-\d*P_\d*D)/gi;   //QQfilebot
// const QQfilebot3Regexp = /(QQfile_bot:[0-9]{5}_[0-9]{5,6}_[0-9]{3}-\d*V_\d*D)/gi;   //QQfilebot
// const QQfilebot4Regexp = /(QQfile_bot:[0-9]{5}_[0-9]{5,6}_[0-9]{3}-\d*P_\d*V)/gi;   //QQfilebot
// const QQfilebot5Regexp = /(QQfile_bot:[0-9]{5}_[0-9]{5,6}_[0-9]{3}-\d*P)/gi;   //QQfilebot
// const QQfilebot6Regexp = /(QQfile_bot:[0-9]{5}_[0-9]{5,6}_[0-9]{3}-\d*V)/gi;   //QQfilebot
// const QQfilebot7Regexp = /(QQfile_bot:[0-9]{5}_[0-9]{5,6}_[0-9]{3}-\d*D)/gi;   //QQfilebot
// const QQfile2botRegexp = /(QQfile2_bot:[a-z0-9]{12})/gi;   //QQfile2bot
const QQfile2bot1Regexp = /(QQfile2_bot:[a-z0-9]{12}_\d*P_\d*V_\d*D)/gi;   //QQfile2bot
const QQfile2bot2Regexp = /(QQfile2_bot:[a-z0-9]{12}_\d*P_\d*D)/gi;   //QQfile2bot
const QQfile2bot3Regexp = /(QQfile2_bot:[a-z0-9]{12}_\d*V_\d*D)/gi;   //QQfile2bot
const QQfile2bot4Regexp = /(QQfile2_bot:[a-z0-9]{12}_\d*P_\d*V)/gi;   //QQfile2bot
const QQfile2bot5Regexp = /(QQfile2_bot:[a-z0-9]{12}_\d*P)/gi;   //QQfile2bot
const QQfile2bot6Regexp = /(QQfile2_bot:[a-z0-9]{12}_\d*V)/gi;   //QQfile2bot
const QQfile2bot7Regexp = /(QQfile2_bot:[a-z0-9]{12}_\d*D)/gi;   //QQfile2bot
// const QQfile4botRegexp = /(QQfile4_bot:[a-z0-9]{12})/gi;   //QQfile4bot
const QQfile4bot1Regexp = /(QQfile4_bot:[a-z0-9]{12}_\d*P_\d*V_\d*D)/gi;   //QQfile4bot
const QQfile4bot2Regexp = /(QQfile4_bot:[a-z0-9]{12}_\d*P_\d*D)/gi;   //QQfile4bot
const QQfile4bot3Regexp = /(QQfile4_bot:[a-z0-9]{12}_\d*V_\d*D)/gi;   //QQfile4bot
const QQfile4bot4Regexp = /(QQfile4_bot:[a-z0-9]{12}_\d*P_\d*V)/gi;   //QQfile4bot
const QQfile4bot5Regexp = /(QQfile4_bot:[a-z0-9]{12}_\d*P)/gi;   //QQfile4bot
const QQfile4bot6Regexp = /(QQfile4_bot:[a-z0-9]{12}_\d*V)/gi;   //QQfile4bot
const QQfile4bot7Regexp = /(QQfile4_bot:[a-z0-9]{12}_\d*D)/gi;   //QQfile4bot
// const QQfile10botRegexp = /(QQfile10_bot:[a-z0-9]{12})/gi;   //QQfile10bot
const QQfile10bot1Regexp = /(QQfile10_bot:[a-z0-9]{16}_\d*P_\d*V_\d*D)/gi;   //QQfile10bot
const QQfile10bot2Regexp = /(QQfile10_bot:[a-z0-9]{16}_\d*P_\d*D)/gi;   //QQfile10bot
const QQfile10bot3Regexp = /(QQfile10_bot:[a-z0-9]{16}_\d*V_\d*D)/gi;   //QQfile10bot
const QQfile10bot4Regexp = /(QQfile10_bot:[a-z0-9]{16}_\d*P_\d*V)/gi;   //QQfile10bot
const QQfile10bot5Regexp = /(QQfile10_bot:[a-z0-9]{16}_\d*P)/gi;   //QQfile10bot
const QQfile10bot6Regexp = /(QQfile10_bot:[a-z0-9]{16}_\d*V)/gi;   //QQfile10bot
const QQfile10bot7Regexp = /(QQfile10_bot:[a-z0-9]{16}_\d*D)/gi;   //QQfile10bot
// const QQfile11botRegexp = /(QQfile11_bot:[a-z0-9]{12})/gi;   //QQfile11bot
const QQfile11bot1Regexp = /(QQfile11_bot:[a-z0-9]{16}_\d*P_\d*V_\d*D)/gi;   //QQfile11bot
const QQfile11bot2Regexp = /(QQfile11_bot:[a-z0-9]{16}_\d*P_\d*D)/gi;   //QQfile11bot
const QQfile11bot3Regexp = /(QQfile11_bot:[a-z0-9]{16}_\d*V_\d*D)/gi;   //QQfile11bot
const QQfile11bot4Regexp = /(QQfile11_bot:[a-z0-9]{16}_\d*P_\d*V)/gi;   //QQfile11bot
const QQfile11bot5Regexp = /(QQfile11_bot:[a-z0-9]{16}_\d*P)/gi;   //QQfile11bot
const QQfile11bot6Regexp = /(QQfile11_bot:[a-z0-9]{16}_\d*V)/gi;   //QQfile11bot
const QQfile11bot7Regexp = /(QQfile11_bot:[a-z0-9]{16}_\d*D)/gi;   //QQfile11bot
// const QQn8zwbotRegexp = /(QQn8zw_bot:[a-z0-9]{12})/gi;   //QQn8zwbot
const QQn8zwbot1Regexp = /(QQn8zw_bot:[a-z0-9]{16}_\d*P_\d*V_\d*D)/gi;   //QQn8zwbot
const QQn8zwbot2Regexp = /(QQn8zw_bot:[a-z0-9]{16}_\d*P_\d*D)/gi;   //QQn8zwbot
const QQn8zwbot3Regexp = /(QQn8zw_bot:[a-z0-9]{16}_\d*V_\d*D)/gi;   //QQn8zwbot
const QQn8zwbot4Regexp = /(QQn8zw_bot:[a-z0-9]{16}_\d*P_\d*V)/gi;   //QQn8zwbot
const QQn8zwbot5Regexp = /(QQn8zw_bot:[a-z0-9]{16}_\d*P)/gi;   //QQn8zwbot
const QQn8zwbot6Regexp = /(QQn8zw_bot:[a-z0-9]{16}_\d*V)/gi;   //QQn8zwbot
const QQn8zwbot7Regexp = /(QQn8zw_bot:[a-z0-9]{16}_\d*D)/gi;   //QQn8zwbot
// const QQirfubotRegexp = /(QQirfu_bot:[a-z0-9]{12})/gi;   //QQirfubot
const QQirfubot1Regexp = /(QQirfu_bot:[a-z0-9]{16}_\d*P_\d*V_\d*D)/gi;   //QQirfubot
const QQirfubot2Regexp = /(QQirfu_bot:[a-z0-9]{16}_\d*P_\d*D)/gi;   //QQirfubot
const QQirfubot3Regexp = /(QQirfu_bot:[a-z0-9]{16}_\d*V_\d*D)/gi;   //QQirfubot
const QQirfubot4Regexp = /(QQirfu_bot:[a-z0-9]{16}_\d*P_\d*V)/gi;   //QQirfubot
const QQirfubot5Regexp = /(QQirfu_bot:[a-z0-9]{16}_\d*P)/gi;   //QQirfubot
const QQirfubot6Regexp = /(QQirfu_bot:[a-z0-9]{16}_\d*V)/gi;   //QQirfubot
const QQirfubot7Regexp = /(QQirfu_bot:[a-z0-9]{16}_\d*D)/gi;   //QQirfubot
// const QQz32obotRegexp = /(QQz32o_bot:[a-z0-9]{12})/gi;   //QQz32obot
const QQz32obot1Regexp = /(QQz32o_bot:[a-z0-9]{16}_\d*P_\d*V_\d*D)/gi;   //QQz32obot
const QQz32obot2Regexp = /(QQz32o_bot:[a-z0-9]{16}_\d*P_\d*D)/gi;   //QQz32obot
const QQz32obot3Regexp = /(QQz32o_bot:[a-z0-9]{16}_\d*V_\d*D)/gi;   //QQz32obot
const QQz32obot4Regexp = /(QQz32o_bot:[a-z0-9]{16}_\d*P_\d*V)/gi;   //QQz32obot
const QQz32obot5Regexp = /(QQz32o_bot:[a-z0-9]{16}_\d*P)/gi;   //QQz32obot
const QQz32obot6Regexp = /(QQz32o_bot:[a-z0-9]{16}_\d*V)/gi;   //QQz32obot
const QQz32obot7Regexp = /(QQz32o_bot:[a-z0-9]{16}_\d*D)/gi;   //QQz32obot
// const QQdvbkbotRegexp = /(QQdvbk_bot:[a-z0-9]{12})/gi;   //QQdvbkbot
const QQdvbkbot1Regexp = /(QQdvbk_bot:[a-z0-9]{16}_\d*P_\d*V_\d*D)/gi;   //QQdvbkbot
const QQdvbkbot2Regexp = /(QQdvbk_bot:[a-z0-9]{16}_\d*P_\d*D)/gi;   //QQdvbkbot
const QQdvbkbot3Regexp = /(QQdvbk_bot:[a-z0-9]{16}_\d*V_\d*D)/gi;   //QQdvbkbot
const QQdvbkbot4Regexp = /(QQdvbk_bot:[a-z0-9]{16}_\d*P_\d*V)/gi;   //QQdvbkbot
const QQdvbkbot5Regexp = /(QQdvbk_bot:[a-z0-9]{16}_\d*P)/gi;   //QQdvbkbot
const QQdvbkbot6Regexp = /(QQdvbk_bot:[a-z0-9]{16}_\d*V)/gi;   //QQdvbkbot
const QQdvbkbot7Regexp = /(QQdvbk_bot:[a-z0-9]{16}_\d*D)/gi;   //QQdvbkbot
// const QQer16botRegexp = /(QQer16_bot:[a-z0-9]{12})/gi;   //QQer16bot
const QQer16bot1Regexp = /(QQer16_bot:[a-z0-9]{16}_\d*P_\d*V_\d*D)/gi;   //QQer16bot
const QQer16bot2Regexp = /(QQer16_bot:[a-z0-9]{16}_\d*P_\d*D)/gi;   //QQer16bot
const QQer16bot3Regexp = /(QQer16_bot:[a-z0-9]{16}_\d*V_\d*D)/gi;   //QQer16bot
const QQer16bot4Regexp = /(QQer16_bot:[a-z0-9]{16}_\d*P_\d*V)/gi;   //QQer16bot
const QQer16bot5Regexp = /(QQer16_bot:[a-z0-9]{16}_\d*P)/gi;   //QQer16bot
const QQer16bot6Regexp = /(QQer16_bot:[a-z0-9]{16}_\d*V)/gi;   //QQer16bot
const QQer16bot7Regexp = /(QQer16_bot:[a-z0-9]{16}_\d*D)/gi;   //QQer16bot
// const QQan4cbotRegexp = /(QQan4c_bot:[a-z0-9]{12})/gi;   //QQan4cbot
const QQan4cbot1Regexp = /(QQan4c_bot:[a-z0-9]{16}_\d*P_\d*V_\d*D)/gi;   //QQan4cbot
const QQan4cbot2Regexp = /(QQan4c_bot:[a-z0-9]{16}_\d*P_\d*D)/gi;   //QQan4cbot
const QQan4cbot3Regexp = /(QQan4c_bot:[a-z0-9]{16}_\d*V_\d*D)/gi;   //QQan4cbot
const QQan4cbot4Regexp = /(QQan4c_bot:[a-z0-9]{16}_\d*P_\d*V)/gi;   //QQan4cbot
const QQan4cbot5Regexp = /(QQan4c_bot:[a-z0-9]{16}_\d*P)/gi;   //QQan4cbot
const QQan4cbot6Regexp = /(QQan4c_bot:[a-z0-9]{16}_\d*V)/gi;   //QQan4cbot
const QQan4cbot7Regexp = /(QQan4c_bot:[a-z0-9]{16}_\d*D)/gi;   //QQan4cbot
// // const ZhuahihaibotRegexp = /(QQfile_bot:[0-9]{5}_[0-9]{5,6}_[0-9]{3})/gi;   //Zhuahihaibot
// const Zhuahihaibot1Regexp = /(Zhuahihaibot:[0-9]{5}_[0-9]{5,6}_[0-9]{3}-\d*P_\d*V_\d*D)/gi;   //Zhuahihaibot
// const Zhuahihaibot2Regexp = /(Zhuahihaibot:[0-9]{5}_[0-9]{5,6}_[0-9]{3}-\d*P_\d*D)/gi;   //Zhuahihaibot
// const Zhuahihaibot3Regexp = /(Zhuahihaibot:[0-9]{5}_[0-9]{5,6}_[0-9]{3}-\d*V_\d*D)/gi;   //Zhuahihaibot
// const Zhuahihaibot4Regexp = /(Zhuahihaibot:[0-9]{5}_[0-9]{5,6}_[0-9]{3}-\d*P_\d*V)/gi;   //Zhuahihaibot
// const Zhuahihaibot5Regexp = /(Zhuahihaibot:[0-9]{5}_[0-9]{5,6}_[0-9]{3}-\d*P)/gi;   //Zhuahihaibot
// const Zhuahihaibot6Regexp = /(Zhuahihaibot:[0-9]{5}_[0-9]{5,6}_[0-9]{3}-\d*V)/gi;   //Zhuahihaibot
// const Zhuahihaibot7Regexp = /(Zhuahihaibot:[0-9]{5}_[0-9]{5,6}_[0-9]{3}-\d*D)/gi;   //Zhuahihaibot
// const REDDFILEBOTRegexp = /(REDDFILEBOT_\d*v*\d*p*\d*d*_[A-Za-z0-9]{20})/gi;    //REDDFILEBOT
const wenjianjibotRegexp = /(wenjianjibot_\d*p*_*\d*v*_*\d*d*_[A-Za-z0-9]{16})/gi;   //wenjianjibot
const amumujiemabotRegexp = /(amumujiemabot_[a-z0-9]{10})/gi;   //amumujiemabot
const parludecodingBotRegexp = /(ParludecodingBot_\d+p\d+v\d+d_[A-Za-z0-9]{16})/gi;   //parludecodingBot
const teestpanbotRegexp = /(@Teestpanbot:_\d*P*_*\d*V*_*\d*D*_[A-Za-z0-9]{12})/gi;   //teestpanbot
const atfileslinksbotRegexp = /(atfileslinksbot_\d*p*_*\d*v*_*\d*d*_[A-Za-z0-9]{20})/gi;   //atfileslinksbot
const lockHivebot1Regexp = /(LH_[A-Za-z0-9]{16})/gi;   //lockHivebot
const lockHivebot2Regexp = /(LockHivebot_[A-Za-z0-9]{16})/gi;   //lockHivebot
const tgdecoderbotRegexp = /(decoder_\d+p_\d+v_\d+d_[A-Za-z0-9]{12})/gi;   //tgdecoderbot
// const tgdecoderbot1Regexp = /([a-z0-9]{32})/gi;   //tgdecoderbot
const ZYXFilesBotRegexp = /(📌 取件码：[A-Za-z0-9]+)/gi;   //ZYXFilesBot
const ntmjmqbotRegexp = /(ntmjmqbot_\d+p_\d+v_\d+d_[A-Za-z0-9]{13})/gi;   //ntmjmqbot
const newjmqbotRegexp = /(newjmqbot_\d+p_\d+v_\d+d_[A-Za-z0-9]{13})/gi;   //newjmqbot
const filepanbotRegexp = /(@filepan_bot:_\d*P*_*\d*V*_*\d*D*_[A-Za-z0-9]{12})/gi;   //filepanbot
const myseseXBotRegexp = /(myseseXBot_\d+p_\d+v_\d+d_[A-Za-z0-9]{13})/gi;   //myseseXBot
const save2BoxBotRegexp = /(Save2BoxBot_\d+p_\d+v_\d+d_[A-Za-z0-9]{13})/gi;   //save2BoxBot
const mtfxqbotRegexp = /(mtfxqbot_[0-9PVD_]*_[A-Za-z0-9]{20})/gi;   //mtfxqbot
const mtfxq2botRegexp = /(mtfxq2bot_[0-9PVD_]*_[A-Za-z0-9]{20})/gi;   //mtfxq2bot
const grpRegexp = /([A-Za-z0-9]{12}_[A-Za-z0-9]{11}=_grp)/gi;   //grp
const mdaRegexp = /([A-Za-z0-9-\+]*=_mda)/gi;   //mda
const v_Regexp = /(v_BAACAg[A-Za-z0-9_\-]*)/gi;   //v_
const vi_Regexp = /(vi_BAACAg[A-Za-z0-9_\-]*)/gi;   //vi_
const p_Regexp = /(p_AgACAg[A-Za-z0-9_\-]*)/gi;   //p_
const d_Regexp = /(d_BQACAg[A-Za-z0-9_\-]*)/gi;   //d_
const P_DataPanBotRegexp = /(P_DataPanBot_[A-Za-z0-9_\-]*)/gi;   //p_FilesPan1Bot
const V_DataPanBotRegexp = /(V_DataPanBot_[A-Za-z0-9_\-]*)/gi;   //v_FilesPan1Bot
const D_DataPanBotRegexp = /(D_DataPanBot_[A-Za-z0-9_\-]*)/gi;   //p_FilesPan1Bot
const p_FilesPan1BotRegexp = /(p_FilesPan1Bot_[A-Za-z0-9_\-]*)/gi;   //p_FilesPan1Bot
const v_FilesPan1BotRegexp = /(v_FilesPan1Bot_[A-Za-z0-9_\-]*)/gi;   //v_FilesPan1Bot
// const str = "炼铜基地原创媒体组分此条媒体分此条媒体分享newjmqbot_0p_32v_4d_uaBpSUCc8NAEd载下来慢慢看这个有人有更多吗结尾 [主要推";
let all = 0;
let data = [];
try {
  // data = fs.readFileSync("./source/ntmssqbot.txt", "utf-8");
  // data = fs.readFileSync("./source/ntmssqbot1.txt", "utf-8");
  // data = fs.readFileSync("./source/@YUYUYUYU.txt", "utf-8");
  // data = fs.readFileSync("./source/6.1-1.31.txt", "utf-8");
  // data = fs.readFileSync("./source/2.1-2.4.txt", "utf-8");
  // data = fs.readFileSync("./source/4月30.txt", "utf-8");
  // data = fs.readFileSync("./source/6.26爬楼收集.txt", "utf-8");
  // data = fs.readFileSync("./source/9.29.txt", "utf-8");
  // data = fs.readFileSync("./source/2025.1.10.0002.txt", "utf-8");
  // data = fs.readFileSync("./source/2025.1.10.txt", "utf-8");
  // data = fs.readFileSync("./source/2025.1.11.0003.txt", "utf-8");
  // data = fs.readFileSync("./source/2025.1.11.txt", "utf-8");
  // data = fs.readFileSync("./source/2025.1.15.txt", "utf-8");
  // data = fs.readFileSync("./source/2025.1.28.txt", "utf-8");
  // data = fs.readFileSync("./source/2025.1.30.txt", "utf-8");
  // data = fs.readFileSync("./source/2025.2.3.txt", "utf-8");
  // data = fs.readFileSync("./source/2025.2.5.txt", "utf-8");
  // data = fs.readFileSync("./source/2025.2.9.txt", "utf-8");
  // data = fs.readFileSync("./source/2025.2.13.txt", "utf-8");
  // data = fs.readFileSync("./source/2025.2.14.txt", "utf-8");
  // data = fs.readFileSync("./source/20251.11.0002.txt", "utf-8");
  // data = fs.readFileSync("./source/20251.11.0002.txt", "utf-8");
  // data = fs.readFileSync("./source/codes_all.txt", "utf-8");
  // data = fs.readFileSync("./source/codes_all1.txt", "utf-8");
  // data = fs.readFileSync("./source/codes_all2.txt", "utf-8");
  // data = fs.readFileSync("./source/linkoutput1.txt", "utf-8");
  // data = fs.readFileSync("./source/MediaBK和sync的一些资源.txt", "utf-8");
  // data = fs.readFileSync("./source/output.txt", "utf-8");
  // data = fs.readFileSync("./source/summary.txt", "utf-8");
  // data = fs.readFileSync("./source/summary1.txt", "utf-8");
  // data = fs.readFileSync("./source/telegram_messages.txt", "utf-8");
  // data = fs.readFileSync("./source/telegram_messages (2).txt", "utf-8");
  // data = fs.readFileSync("./source/百丽宫-3.30.txt", "utf-8");
  // data = fs.readFileSync("./source/百丽宫5.26-5.31 所有代码.txt", "utf-8");
  // data = fs.readFileSync("./source/别人卖的代码合集.txt", "utf-8");
  // data = fs.readFileSync("./source/代码.txt", "utf-8");
  // data = fs.readFileSync("./source/代码1.txt", "utf-8");
  // data = fs.readFileSync("./source/代码合集1.txt", "utf-8");
  // data = fs.readFileSync("./source/代码合集2.txt", "utf-8");
  // data = fs.readFileSync("./source/各种资源.txt", "utf-8");
  // data = fs.readFileSync("./source/合集 (1).txt", "utf-8");
  // data = fs.readFileSync("./source/合集 (2).txt", "utf-8");
  // data = fs.readFileSync("./source/合集.txt", "utf-8");
  // data = fs.readFileSync("./source/a.txt", "utf-8");
  // data = fs.readFileSync("./source/精选资源合集 齐心协力·正能量 整理.txt", "utf-8");
  // data = fs.readFileSync("./source/精选资源合集.txt", "utf-8");
  // data = fs.readFileSync("./source/爬楼.txt", "utf-8");
  // data = fs.readFileSync("./source/爬楼结果.txt", "utf-8");
  // data = fs.readFileSync("./source/去重 (2).txt", "utf-8");
  // data = fs.readFileSync("./source/去重.txt", "utf-8");
  // data = fs.readFileSync("./source/去重代码合集.txt", "utf-8");
  // data = fs.readFileSync("./source/软件源码合集.txt", "utf-8");
  // data = fs.readFileSync("./source/投稿群2.txt", "utf-8");
  // data = fs.readFileSync("./source/文件代码合集.txt", "utf-8");
  // data = fs.readFileSync("./source/2月整合.txt", "utf-8");
  // data = fs.readFileSync("./source/3月整合.txt", "utf-8");
  // data = fs.readFileSync("./source/FilesDriveRobot.txt", "utf-8");
  // data = fs.readFileSync("./source/newjmqbot自整理资源3.0.txt", "utf-8");
  // data = fs.readFileSync("./source/newjmqbot自整理资源3.5.txt", "utf-8");
  // data = fs.readFileSync("./source/代码合集去重2 java10.txt", "utf-8");
  // data = fs.readFileSync("./source/ntmssqbot2.txt", "utf-8");
  // data = fs.readFileSync("./source/文件码总结1761491151718.txt", "utf-8");
  // data = fs.readFileSync("./source/新.txt", "utf-8");
  // data = fs.readFileSync("./source/新2.txt", "utf-8");
  // data = fs.readFileSync("./source/一万个代码，采集的.txt", "utf-8");
  // data = fs.readFileSync("./source/正能量代码.txt", "utf-8");
  // data = fs.readFileSync("./source/正能量基地-3.29.txt", "utf-8");
  // data = fs.readFileSync("./source/新建文本文档.txt", "utf-8");
  // data = fs.readFileSync("./source/资源 (2).txt", "utf-8");
  // data = fs.readFileSync("./source/资源 (3).txt", "utf-8");
  // data = fs.readFileSync("./source/4.26更新资源.txt", "utf-8");
  // data = fs.readFileSync("./source/资源.txt", "utf-8");
  // data = fs.readFileSync("./source/资源1.txt", "utf-8");
  // data = fs.readFileSync("./source/5.txt", "utf-8");
  // data = fs.readFileSync("./source/7.txt", "utf-8");
  // data = fs.readFileSync("./source/bgyc.txt", "utf-8");
  // data = fs.readFileSync("./source/cha.txt", "utf-8");
  // data = fs.readFileSync("./source/douyin.txt", "utf-8");
  // data = fs.readFileSync("./source/luoli3.txt", "utf-8");
  // data = fs.readFileSync("./source/luoli4.txt", "utf-8");
  // data = fs.readFileSync("./source/luoli6.txt", "utf-8");
  // data = fs.readFileSync("./source/telegram_消息.txt", "utf-8");
  // data = fs.readFileSync("./source/xiao马.txt", "utf-8");
  // data = fs.readFileSync("./source/白丝.txt", "utf-8");
  // data = fs.readFileSync("./source/处中.txt", "utf-8");
  // data = fs.readFileSync("./source/二院.txt", "utf-8");
  // data = fs.readFileSync("./source/高中.txt", "utf-8");
  // data = fs.readFileSync("./source/集合.txt", "utf-8");
  // data = fs.readFileSync("./source/快手.txt", "utf-8");
  // data = fs.readFileSync("./source/乱伦.txt", "utf-8");
  // data = fs.readFileSync("./source/萝莉1.txt", "utf-8");
  // data = fs.readFileSync("./source/萝莉2.txt", "utf-8");
  // data = fs.readFileSync("./source/萝莉5.txt", "utf-8");
  // data = fs.readFileSync("./source/哪吒头.txt", "utf-8");
  // data = fs.readFileSync("./source/去衣.txt", "utf-8");
  // data = fs.readFileSync("./source/日本.txt", "utf-8");
  // data = fs.readFileSync("./source/射.txt", "utf-8");
  // data = fs.readFileSync("./source/偷拍.txt", "utf-8");
  // data = fs.readFileSync("./source/我从一堆东西里翻出来的代码整合（4w＋）原名：output.txt", "utf-8");
  // data = fs.readFileSync("./source/舞蹈.txt", "utf-8");
  // data = fs.readFileSync("./source/新3.txt", "utf-8");
  // data = fs.readFileSync("./source/新4.txt", "utf-8");
  // data = fs.readFileSync("./source/新5.txt", "utf-8");
  // data = fs.readFileSync("./source/呦钕.txt", "utf-8");
  // data = fs.readFileSync("./source/新建文本文档 (2).txt", "utf-8");
  // data = fs.readFileSync("./source/整合【教程，代码都在里面】.txt", "utf-8");
  // data = fs.readFileSync("./source/代码导出.txt", "utf-8");
  // data = fs.readFileSync("./source/正太.txt", "utf-8");
  // data = fs.readFileSync("./source/种资源.txt", "utf-8");
  // data = fs.readFileSync("./source/资源10.txt", "utf-8");
  // data = fs.readFileSync("./source/足.txt", "utf-8");
  // data = fs.readFileSync("./source/1.txt", "utf-8");
  // data = fs.readFileSync("./source/message.txt", "utf-8");
  // data = fs.readFileSync("./source/messages.txt", "utf-8");
  data = fs.readFileSync("./source/messages.html", "utf-8");
  const array = data.split("\n");
  const length = array.length;
  console.log("length : " + length);  //测试
  if (length > 1) {
    for (let i = 0; i < length; i++) {
      const str = array[i].trim();
      // console.log("str : " + str);  //测试
      if (str) {
        const showfilesbotMatches = str.match(showfilesbotRegexp);
        // console.log(showfilesbotMatches);  //测试
        if (showfilesbotMatches) {
          const showfilesbotMatchesLength = showfilesbotMatches.length;
          // console.log("showfilesbotMatchesLength : " + showfilesbotMatchesLength);  //测试
          if (showfilesbotMatchesLength > 0) {
            for (let j = 0; j < showfilesbotMatchesLength; j++) {
              if (showfilesbotMatches[j]) {
                showfilesbot.push(showfilesbotMatches[j]);
              }
            }
          }
        }

        const showfiles3botMatches = str.match(showfiles3botRegexp);
        // console.log(showfiles3botMatches);  //测试
        if (showfiles3botMatches) {
          const showfiles3botMatchesLength = showfiles3botMatches.length;
          // console.log("showfiles3botMatchesLength : " + showfiles3botMatchesLength);  //测试
          if (showfiles3botMatchesLength > 0) {
            for (let j = 0; j < showfiles3botMatchesLength; j++) {
              if (showfiles3botMatches[j]) {
                showfilesbot.push(showfiles3botMatches[j]);
              }
            }
          }
        }

        const tgjmq1botMatches = str.match(tgjmq1botRegexp);
        // console.log(tgjmq1botMatches);  //测试
        if (tgjmq1botMatches) {
          const tgjmq1botMatchesLength = tgjmq1botMatches.length;
          // console.log("tgjmq1botMatchesLength : " + tgjmq1botMatchesLength);  //测试
          if (tgjmq1botMatchesLength > 0) {
            for (let j = 0; j < tgjmq1botMatchesLength; j++) {
              if (tgjmq1botMatches[j]) {
                tgjmqbot.push(tgjmq1botMatches[j]);
              }
            }
          }
        }

        const tgjmq3botMatches = str.match(tgjmq3botRegexp);
        // console.log(tgjmq3botMatches);  //测试
        if (tgjmq3botMatches) {
          const tgjmq3botMatchesLength = tgjmq3botMatches.length;
          // console.log("tgjmq3botMatchesLength : " + tgjmq3botMatchesLength);  //测试
          if (tgjmq3botMatchesLength > 0) {
            for (let j = 0; j < tgjmq3botMatchesLength; j++) {
              if (tgjmq3botMatches[j]) {
                tgjmqbot.push(tgjmq3botMatches[j]);
              }
            }
          }
        }

        const tgjmq5botMatches = str.match(tgjmq5botRegexp);
        // console.log(tgjmq5botMatches);  //测试
        if (tgjmq5botMatches) {
          const tgjmq5botMatchesLength = tgjmq5botMatches.length;
          // console.log("tgjmq5botMatchesLength : " + tgjmq5botMatchesLength);  //测试
          if (tgjmq5botMatchesLength > 0) {
            for (let j = 0; j < tgjmq5botMatchesLength; j++) {
              if (tgjmq5botMatches[j]) {
                tgjmqbot.push(tgjmq5botMatches[j]);
              }
            }
          }
        }

        const tgjmq01botMatches = str.match(tgjmq01botRegexp);
        // console.log(tgjmq01botMatches);  //测试
        if (tgjmq01botMatches) {
          const tgjmq01botMatchesLength = tgjmq01botMatches.length;
          // console.log("tgjmq01botMatchesLength : " + tgjmq01botMatchesLength);  //测试
          if (tgjmq01botMatchesLength > 0) {
            for (let j = 0; j < tgjmq01botMatchesLength; j++) {
              if (tgjmq01botMatches[j]) {
                tgjmqbot.push(tgjmq01botMatches[j]);
              }
            }
          }
        }

        const blgjlqbotMatches = str.match(blgjlqbotRegexp);
        // console.log(blgjlqbotMatches);  //测试
        if (blgjlqbotMatches) {
          const blgjlqbotMatchesLength = blgjlqbotMatches.length;
          // console.log("blgjlqbotMatchesLength : " + blgjlqbotMatchesLength);  //测试
          if (blgjlqbotMatchesLength > 0) {
            for (let j = 0; j < blgjlqbotMatchesLength; j++) {
              if (blgjlqbotMatches[j]) {
                blgjlqbot.push(blgjlqbotMatches[j]);
              }
            }
          }
        }

        const fileLeakBotMatches = str.match(fileLeakBotRegexp);
        // console.log(fileLeakBotMatches);  //测试
        if (fileLeakBotMatches) {
          const fileLeakBotMatchesLength = fileLeakBotMatches.length;
          // console.log("fileLeakBotMatchesLength : " + fileLeakBotMatchesLength);  //测试
          if (fileLeakBotMatchesLength > 0) {
            for (let j = 0; j < fileLeakBotMatchesLength; j++) {
              if (fileLeakBotMatches[j]) {
                fileLeakBot.push(fileLeakBotMatches[j]);
              }
            }
          }
        }

        const nnfilebotMatches = str.match(nnfilebotRegexp);
        // console.log(nnfilebotMatches);  //测试
        if (nnfilebotMatches) {
          const nnfilebotMatchesLength = nnfilebotMatches.length;
          // console.log("nnfilebotMatchesLength : " + nnfilebotMatchesLength);  //测试
          if (nnfilebotMatchesLength > 0) {
            for (let j = 0; j < nnfilebotMatchesLength; j++) {
              if (nnfilebotMatches[j]) {
                nnfilebot.push(nnfilebotMatches[j]);
              }
            }
          }
        }

        const tangBRebotMatches = str.match(tangBRebotRegexp);
        // console.log(tangBRebotMatches);  //测试
        if (tangBRebotMatches) {
          const tangBRebotMatchesLength = tangBRebotMatches.length;
          // console.log("tangBRebotMatchesLength : " + tangBRebotMatchesLength);  //测试
          if (tangBRebotMatchesLength > 0) {
            for (let j = 0; j < tangBRebotMatchesLength; j++) {
              if (tangBRebotMatches[j]) {
                tangBRebot.push(tangBRebotMatches[j]);
              }
            }
          }
        }

        const decoderrobotMatches = str.match(decoderrobotRegexp);
        // console.log(decoderrobotMatches);  //测试
        if (decoderrobotMatches) {
          const decoderrobotMatchesLength = decoderrobotMatches.length;
          // console.log("decoderrobotMatchesLength : " + decoderrobotMatchesLength);  //测试
          if (decoderrobotMatchesLength > 0) {
            for (let j = 0; j < decoderrobotMatchesLength; j++) {
              if (decoderrobotMatches[j]) {
                decoderrobot.push(decoderrobotMatches[j]);
              }
            }
          }
        }

        // const tebiejie1botMatches = str.match(tebiejie1botRegexp);
        // // console.log(tebiejie1botMatches);  //测试
        // if (tebiejie1botMatches) {
        //   const tebiejie1botMatchesLength = tebiejie1botMatches.length;
        //   // console.log("tebiejie1botMatchesLength : " + tebiejie1botMatchesLength);  //测试
        //   if (tebiejie1botMatchesLength > 0) {
        //     for (let j = 0; j < tebiejie1botMatchesLength; j++) {
        //       if (tebiejie1botMatches[j]) {
        //         tebiejiebot.push(tebiejie1botMatches[j]);
        //       }
        //     }
        //   }
        // }

        const mmyzybot1Matches = str.match(mmyzybot1Regexp);
        // console.log(mmyzybot1Matches);  //测试
        if (mmyzybot1Matches) {
          const mmyzybot1MatchesLength = mmyzybot1Matches.length;
          // console.log("mmyzybot1MatchesLength : " + mmyzybot1MatchesLength);  //测试
          if (mmyzybot1MatchesLength > 0) {
            for (let j = 0; j < mmyzybot1MatchesLength; j++) {
              if (mmyzybot1Matches[j]) {
                mmyzybot.push(mmyzybot1Matches[j]);
              }
            }
          }
        }

        const mmyzybot2Matches = str.match(mmyzybot2Regexp);
        // console.log(mmyzybot2Matches);  //测试
        if (mmyzybot2Matches) {
          const mmyzybot2MatchesLength = mmyzybot2Matches.length;
          // console.log("mmyzybot2MatchesLength : " + mmyzybot2MatchesLength);  //测试
          if (mmyzybot2MatchesLength > 0) {
            for (let j = 0; j < mmyzybot2MatchesLength; j++) {
              if (mmyzybot2Matches[j]) {
                mmyzybot.push(mmyzybot2Matches[j]);
              }
            }
          }
        }

        const mmyzybot3Matches = str.match(mmyzybot3Regexp);
        // console.log(mmyzybot3Matches);  //测试
        if (mmyzybot3Matches) {
          const mmyzybot3MatchesLength = mmyzybot3Matches.length;
          // console.log("mmyzybot3MatchesLength : " + mmyzybot3MatchesLength);  //测试
          if (mmyzybot3MatchesLength > 0) {
            for (let j = 0; j < mmyzybot3MatchesLength; j++) {
              if (mmyzybot3Matches[j]) {
                mmyzybot.push(mmyzybot3Matches[j]);
              }
            }
          }
        }

        const mmyzybot4Matches = str.match(mmyzybot4Regexp);
        // console.log(mmyzybot4Matches);  //测试
        if (mmyzybot4Matches) {
          const mmyzybot4MatchesLength = mmyzybot4Matches.length;
          // console.log("mmyzybot4MatchesLength : " + mmyzybot4MatchesLength);  //测试
          if (mmyzybot4MatchesLength > 0) {
            for (let j = 0; j < mmyzybot4MatchesLength; j++) {
              if (mmyzybot4Matches[j]) {
                mmyzybot.push(mmyzybot4Matches[j]);
              }
            }
          }
        }

        // const paniangbot1Matches = str.match(paniangbot1Regexp);
        // // console.log(paniangbot1Matches);  //测试
        // if (paniangbot1Matches) {
        //   const paniangbot1MatchesLength = paniangbot1Matches.length;
        //   // console.log("paniangbot1MatchesLength : " + paniangbot1MatchesLength);  //测试
        //   if (paniangbot1MatchesLength > 0) {
        //     for (let j = 0; j < paniangbot1MatchesLength; j++) {
        //       if (paniangbot1Matches[j]) {
        //         paniangbot.push(paniangbot1Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const paniangbot2Matches = str.match(paniangbot2Regexp);
        // // console.log(paniangbot2Matches);  //测试
        // if (paniangbot2Matches) {
        //   const paniangbot2MatchesLength = paniangbot2Matches.length;
        //   // console.log("paniangbot2MatchesLength : " + paniangbot2MatchesLength);  //测试
        //   if (paniangbot2MatchesLength > 0) {
        //     for (let j = 0; j < paniangbot2MatchesLength; j++) {
        //       if (paniangbot2Matches[j]) {
        //         paniangbot.push(paniangbot2Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const paniangbot3Matches = str.match(paniangbot3Regexp);
        // // console.log(paniangbot3Matches);  //测试
        // if (paniangbot3Matches) {
        //   const paniangbot3MatchesLength = paniangbot3Matches.length;
        //   // console.log("paniangbot3MatchesLength : " + paniangbot3MatchesLength);  //测试
        //   if (paniangbot3MatchesLength > 0) {
        //     for (let j = 0; j < paniangbot3MatchesLength; j++) {
        //       if (paniangbot3Matches[j]) {
        //         paniangbot.push(paniangbot3Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const paniangbot4Matches = str.match(paniangbot4Regexp);
        // // console.log(paniangbot4Matches);  //测试
        // if (paniangbot4Matches) {
        //   const paniangbot4MatchesLength = paniangbot4Matches.length;
        //   // console.log("paniangbot4MatchesLength : " + paniangbot4MatchesLength);  //测试
        //   if (paniangbot4MatchesLength > 0) {
        //     for (let j = 0; j < paniangbot4MatchesLength; j++) {
        //       if (paniangbot4Matches[j]) {
        //         paniangbot.push(paniangbot4Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const kkjmqmbot1Matches = str.match(kkjmqmbot1Regexp);
        // // console.log(kkjmqmbot1Matches);  //测试
        // if (kkjmqmbot1Matches) {
        //   const kkjmqmbot1MatchesLength = kkjmqmbot1Matches.length;
        //   // console.log("kkjmqmbot1MatchesLength : " + kkjmqmbot1MatchesLength);  //测试
        //   if (kkjmqmbot1MatchesLength > 0) {
        //     for (let j = 0; j < kkjmqmbot1MatchesLength; j++) {
        //       if (kkjmqmbot1Matches[j]) {
        //         kkjmqmbot.push(kkjmqmbot1Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const kkjmqmbot2Matches = str.match(kkjmqmbot2Regexp);
        // // console.log(kkjmqmbot2Matches);  //测试
        // if (kkjmqmbot2Matches) {
        //   const kkjmqmbot2MatchesLength = kkjmqmbot2Matches.length;
        //   // console.log("kkjmqmbot2MatchesLength : " + kkjmqmbot2MatchesLength);  //测试
        //   if (kkjmqmbot2MatchesLength > 0) {
        //     for (let j = 0; j < kkjmqmbot2MatchesLength; j++) {
        //       if (kkjmqmbot2Matches[j]) {
        //         kkjmqmbot.push(kkjmqmbot2Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const kkjmqmbot3Matches = str.match(kkjmqmbot3Regexp);
        // // console.log(kkjmqmbot3Matches);  //测试
        // if (kkjmqmbot3Matches) {
        //   const kkjmqmbot3MatchesLength = kkjmqmbot3Matches.length;
        //   // console.log("kkjmqmbot3MatchesLength : " + kkjmqmbot3MatchesLength);  //测试
        //   if (kkjmqmbot3MatchesLength > 0) {
        //     for (let j = 0; j < kkjmqmbot3MatchesLength; j++) {
        //       if (kkjmqmbot3Matches[j]) {
        //         kkjmqmbot.push(kkjmqmbot3Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const kkjmqmbot4Matches = str.match(kkjmqmbot4Regexp);
        // // console.log(kkjmqmbot4Matches);  //测试
        // if (kkjmqmbot4Matches) {
        //   const kkjmqmbot4MatchesLength = kkjmqmbot4Matches.length;
        //   // console.log("kkjmqmbot4MatchesLength : " + kkjmqmbot4MatchesLength);  //测试
        //   if (kkjmqmbot4MatchesLength > 0) {
        //     for (let j = 0; j < kkjmqmbot4MatchesLength; j++) {
        //       if (kkjmqmbot4Matches[j]) {
        //         kkjmqmbot.push(kkjmqmbot4Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const KodeXFilesbot1Matches = str.match(KodeXFilesbot1Regexp);
        // // console.log(KodeXFilesbot1Matches);  //测试
        // if (KodeXFilesbot1Matches) {
        //   const KodeXFilesbot1MatchesLength = KodeXFilesbot1Matches.length;
        //   // console.log("KodeXFilesbot1MatchesLength : " + KodeXFilesbot1MatchesLength);  //测试
        //   if (KodeXFilesbot1MatchesLength > 0) {
        //     for (let j = 0; j < KodeXFilesbot1MatchesLength; j++) {
        //       if (KodeXFilesbot1Matches[j]) {
        //         KodeXFilesbot.push(KodeXFilesbot1Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const KodeXFilesbot2Matches = str.match(KodeXFilesbot2Regexp);
        // // console.log(KodeXFilesbot2Matches);  //测试
        // if (KodeXFilesbot2Matches) {
        //   const KodeXFilesbot2MatchesLength = KodeXFilesbot2Matches.length;
        //   // console.log("KodeXFilesbot2MatchesLength : " + KodeXFilesbot2MatchesLength);  //测试
        //   if (KodeXFilesbot2MatchesLength > 0) {
        //     for (let j = 0; j < KodeXFilesbot2MatchesLength; j++) {
        //       if (KodeXFilesbot2Matches[j]) {
        //         KodeXFilesbot.push(KodeXFilesbot2Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const KodeXFilesbot3Matches = str.match(KodeXFilesbot3Regexp);
        // // console.log(KodeXFilesbot3Matches);  //测试
        // if (KodeXFilesbot3Matches) {
        //   const KodeXFilesbot3MatchesLength = KodeXFilesbot3Matches.length;
        //   // console.log("KodeXFilesbot3MatchesLength : " + KodeXFilesbot3MatchesLength);  //测试
        //   if (KodeXFilesbot3MatchesLength > 0) {
        //     for (let j = 0; j < KodeXFilesbot3MatchesLength; j++) {
        //       if (KodeXFilesbot3Matches[j]) {
        //         KodeXFilesbot.push(KodeXFilesbot3Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const KodeXFilesbot4Matches = str.match(KodeXFilesbot4Regexp);
        // // console.log(KodeXFilesbot4Matches);  //测试
        // if (KodeXFilesbot4Matches) {
        //   const KodeXFilesbot4MatchesLength = KodeXFilesbot4Matches.length;
        //   // console.log("KodeXFilesbot4MatchesLength : " + KodeXFilesbot4MatchesLength);  //测试
        //   if (KodeXFilesbot4MatchesLength > 0) {
        //     for (let j = 0; j < KodeXFilesbot4MatchesLength; j++) {
        //       if (KodeXFilesbot4Matches[j]) {
        //         KodeXFilesbot.push(KodeXFilesbot4Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const kodexfilebot1Matches = str.match(kodexfilebot1Regexp);
        // // console.log(kodexfilebot1Matches);  //测试
        // if (kodexfilebot1Matches) {
        //   const kodexfilebot1MatchesLength = kodexfilebot1Matches.length;
        //   // console.log("kodexfilebot1MatchesLength : " + kodexfilebot1MatchesLength);  //测试
        //   if (kodexfilebot1MatchesLength > 0) {
        //     for (let j = 0; j < kodexfilebot1MatchesLength; j++) {
        //       if (kodexfilebot1Matches[j]) {
        //         kodexfilebot.push(kodexfilebot1Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const kodexfilebot2Matches = str.match(kodexfilebot2Regexp);
        // // console.log(kodexfilebot2Matches);  //测试
        // if (kodexfilebot2Matches) {
        //   const kodexfilebot2MatchesLength = kodexfilebot2Matches.length;
        //   // console.log("kodexfilebot2MatchesLength : " + kodexfilebot2MatchesLength);  //测试
        //   if (kodexfilebot2MatchesLength > 0) {
        //     for (let j = 0; j < kodexfilebot2MatchesLength; j++) {
        //       if (kodexfilebot2Matches[j]) {
        //         kodexfilebot.push(kodexfilebot2Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const kodexfilebot3Matches = str.match(kodexfilebot3Regexp);
        // // console.log(kodexfilebot3Matches);  //测试
        // if (kodexfilebot3Matches) {
        //   const kodexfilebot3MatchesLength = kodexfilebot3Matches.length;
        //   // console.log("kodexfilebot3MatchesLength : " + kodexfilebot3MatchesLength);  //测试
        //   if (kodexfilebot3MatchesLength > 0) {
        //     for (let j = 0; j < kodexfilebot3MatchesLength; j++) {
        //       if (kodexfilebot3Matches[j]) {
        //         kodexfilebot.push(kodexfilebot3Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const kodexfilebot4Matches = str.match(kodexfilebot4Regexp);
        // // console.log(kodexfilebot4Matches);  //测试
        // if (kodexfilebot4Matches) {
        //   const kodexfilebot4MatchesLength = kodexfilebot4Matches.length;
        //   // console.log("kodexfilebot4MatchesLength : " + kodexfilebot4MatchesLength);  //测试
        //   if (kodexfilebot4MatchesLength > 0) {
        //     for (let j = 0; j < kodexfilebot4MatchesLength; j++) {
        //       if (kodexfilebot4Matches[j]) {
        //         kodexfilebot.push(kodexfilebot4Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const KodeXMedia1bot1Matches = str.match(KodeXMedia1bot1Regexp);
        // // console.log(KodeXMedia1bot1Matches);  //测试
        // if (KodeXMedia1bot1Matches) {
        //   const KodeXMedia1bot1MatchesLength = KodeXMedia1bot1Matches.length;
        //   // console.log("KodeXMedia1bot1MatchesLength : " + KodeXMedia1bot1MatchesLength);  //测试
        //   if (KodeXMedia1bot1MatchesLength > 0) {
        //     for (let j = 0; j < KodeXMedia1bot1MatchesLength; j++) {
        //       if (KodeXMedia1bot1Matches[j]) {
        //         KodeXMedia1bot.push(KodeXMedia1bot1Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const KodeXMedia1bot2Matches = str.match(KodeXMedia1bot2Regexp);
        // // console.log(KodeXMedia1bot2Matches);  //测试
        // if (KodeXMedia1bot2Matches) {
        //   const KodeXMedia1bot2MatchesLength = KodeXMedia1bot2Matches.length;
        //   // console.log("KodeXMedia1bot2MatchesLength : " + KodeXMedia1bot2MatchesLength);  //测试
        //   if (KodeXMedia1bot2MatchesLength > 0) {
        //     for (let j = 0; j < KodeXMedia1bot2MatchesLength; j++) {
        //       if (KodeXMedia1bot2Matches[j]) {
        //         KodeXMedia1bot.push(KodeXMedia1bot2Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const KodeXMedia1bot3Matches = str.match(KodeXMedia1bot3Regexp);
        // // console.log(KodeXMedia1bot3Matches);  //测试
        // if (KodeXMedia1bot3Matches) {
        //   const KodeXMedia1bot3MatchesLength = KodeXMedia1bot3Matches.length;
        //   // console.log("KodeXMedia1bot3MatchesLength : " + KodeXMedia1bot3MatchesLength);  //测试
        //   if (KodeXMedia1bot3MatchesLength > 0) {
        //     for (let j = 0; j < KodeXMedia1bot3MatchesLength; j++) {
        //       if (KodeXMedia1bot3Matches[j]) {
        //         KodeXMedia1bot.push(KodeXMedia1bot3Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const KodeXMedia1bot4Matches = str.match(KodeXMedia1bot4Regexp);
        // // console.log(KodeXMedia1bot4Matches);  //测试
        // if (KodeXMedia1bot4Matches) {
        //   const KodeXMedia1bot4MatchesLength = KodeXMedia1bot4Matches.length;
        //   // console.log("KodeXMedia1bot4MatchesLength : " + KodeXMedia1bot4MatchesLength);  //测试
        //   if (KodeXMedia1bot4MatchesLength > 0) {
        //     for (let j = 0; j < KodeXMedia1bot4MatchesLength; j++) {
        //       if (KodeXMedia1bot4Matches[j]) {
        //         KodeXMedia1bot.push(KodeXMedia1bot4Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const AllXFilesbot1Matches = str.match(AllXFilesbot1Regexp);
        // // console.log(AllXFilesbot1Matches);  //测试
        // if (AllXFilesbot1Matches) {
        //   const AllXFilesbot1MatchesLength = AllXFilesbot1Matches.length;
        //   // console.log("AllXFilesbot1MatchesLength : " + AllXFilesbot1MatchesLength);  //测试
        //   if (AllXFilesbot1MatchesLength > 0) {
        //     for (let j = 0; j < AllXFilesbot1MatchesLength; j++) {
        //       if (AllXFilesbot1Matches[j]) {
        //         AllXFilesbot.push(AllXFilesbot1Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const AllXFilesbot2Matches = str.match(AllXFilesbot2Regexp);
        // // console.log(AllXFilesbot2Matches);  //测试
        // if (AllXFilesbot2Matches) {
        //   const AllXFilesbot2MatchesLength = AllXFilesbot2Matches.length;
        //   // console.log("AllXFilesbot2MatchesLength : " + AllXFilesbot2MatchesLength);  //测试
        //   if (AllXFilesbot2MatchesLength > 0) {
        //     for (let j = 0; j < AllXFilesbot2MatchesLength; j++) {
        //       if (AllXFilesbot2Matches[j]) {
        //         AllXFilesbot.push(AllXFilesbot2Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const AllXFilesbot3Matches = str.match(AllXFilesbot3Regexp);
        // // console.log(AllXFilesbot3Matches);  //测试
        // if (AllXFilesbot3Matches) {
        //   const AllXFilesbot3MatchesLength = AllXFilesbot3Matches.length;
        //   // console.log("AllXFilesbot3MatchesLength : " + AllXFilesbot3MatchesLength);  //测试
        //   if (AllXFilesbot3MatchesLength > 0) {
        //     for (let j = 0; j < AllXFilesbot3MatchesLength; j++) {
        //       if (AllXFilesbot3Matches[j]) {
        //         AllXFilesbot.push(AllXFilesbot3Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const AllXFilesbot4Matches = str.match(AllXFilesbot4Regexp);
        // // console.log(AllXFilesbot4Matches);  //测试
        // if (AllXFilesbot4Matches) {
        //   const AllXFilesbot4MatchesLength = AllXFilesbot4Matches.length;
        //   // console.log("AllXFilesbot4MatchesLength : " + AllXFilesbot4MatchesLength);  //测试
        //   if (AllXFilesbot4MatchesLength > 0) {
        //     for (let j = 0; j < AllXFilesbot4MatchesLength; j++) {
        //       if (AllXFilesbot4Matches[j]) {
        //         AllXFilesbot.push(AllXFilesbot4Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const MediaXFilebot1Matches = str.match(MediaXFilebot1Regexp);
        // // console.log(MediaXFilebot1Matches);  //测试
        // if (MediaXFilebot1Matches) {
        //   const MediaXFilebot1MatchesLength = MediaXFilebot1Matches.length;
        //   // console.log("MediaXFilebot1MatchesLength : " + MediaXFilebot1MatchesLength);  //测试
        //   if (MediaXFilebot1MatchesLength > 0) {
        //     for (let j = 0; j < MediaXFilebot1MatchesLength; j++) {
        //       if (MediaXFilebot1Matches[j]) {
        //         MediaXFilebot.push(MediaXFilebot1Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const MediaXFilebot2Matches = str.match(MediaXFilebot2Regexp);
        // // console.log(MediaXFilebot2Matches);  //测试
        // if (MediaXFilebot2Matches) {
        //   const MediaXFilebot2MatchesLength = MediaXFilebot2Matches.length;
        //   // console.log("MediaXFilebot2MatchesLength : " + MediaXFilebot2MatchesLength);  //测试
        //   if (MediaXFilebot2MatchesLength > 0) {
        //     for (let j = 0; j < MediaXFilebot2MatchesLength; j++) {
        //       if (MediaXFilebot2Matches[j]) {
        //         MediaXFilebot.push(MediaXFilebot2Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const MediaXFilebot3Matches = str.match(MediaXFilebot3Regexp);
        // // console.log(MediaXFilebot3Matches);  //测试
        // if (MediaXFilebot3Matches) {
        //   const MediaXFilebot3MatchesLength = MediaXFilebot3Matches.length;
        //   // console.log("MediaXFilebot3MatchesLength : " + MediaXFilebot3MatchesLength);  //测试
        //   if (MediaXFilebot3MatchesLength > 0) {
        //     for (let j = 0; j < MediaXFilebot3MatchesLength; j++) {
        //       if (MediaXFilebot3Matches[j]) {
        //         MediaXFilebot.push(MediaXFilebot3Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const MediaXFilebot4Matches = str.match(MediaXFilebot4Regexp);
        // // console.log(MediaXFilebot4Matches);  //测试
        // if (MediaXFilebot4Matches) {
        //   const MediaXFilebot4MatchesLength = MediaXFilebot4Matches.length;
        //   // console.log("MediaXFilebot4MatchesLength : " + MediaXFilebot4MatchesLength);  //测试
        //   if (MediaXFilebot4MatchesLength > 0) {
        //     for (let j = 0; j < MediaXFilebot4MatchesLength; j++) {
        //       if (MediaXFilebot4Matches[j]) {
        //         MediaXFilebot.push(MediaXFilebot4Matches[j]);
        //       }
        //     }
        //   }
        // }

        const KodeXFiles2bot1Matches = str.match(KodeXFiles2bot1Regexp);
        // console.log(KodeXFiles2bot1Matches);  //测试
        if (KodeXFiles2bot1Matches) {
          const KodeXFiles2bot1MatchesLength = KodeXFiles2bot1Matches.length;
          // console.log("KodeXFiles2bot1MatchesLength : " + KodeXFiles2bot1MatchesLength);  //测试
          if (KodeXFiles2bot1MatchesLength > 0) {
            for (let j = 0; j < KodeXFiles2bot1MatchesLength; j++) {
              if (KodeXFiles2bot1Matches[j]) {
                KodeXFiles2bot.push(KodeXFiles2bot1Matches[j]);
              }
            }
          }
        }

        const KodeXFiles2bot2Matches = str.match(KodeXFiles2bot2Regexp);
        // console.log(KodeXFiles2bot2Matches);  //测试
        if (KodeXFiles2bot2Matches) {
          const KodeXFiles2bot2MatchesLength = KodeXFiles2bot2Matches.length;
          // console.log("KodeXFiles2bot2MatchesLength : " + KodeXFiles2bot2MatchesLength);  //测试
          if (KodeXFiles2bot2MatchesLength > 0) {
            for (let j = 0; j < KodeXFiles2bot2MatchesLength; j++) {
              if (KodeXFiles2bot2Matches[j]) {
                KodeXFiles2bot.push(KodeXFiles2bot2Matches[j]);
              }
            }
          }
        }

        const KodeXFiles2bot3Matches = str.match(KodeXFiles2bot3Regexp);
        // console.log(KodeXFiles2bot3Matches);  //测试
        if (KodeXFiles2bot3Matches) {
          const KodeXFiles2bot3MatchesLength = KodeXFiles2bot3Matches.length;
          // console.log("KodeXFiles2bot3MatchesLength : " + KodeXFiles2bot3MatchesLength);  //测试
          if (KodeXFiles2bot3MatchesLength > 0) {
            for (let j = 0; j < KodeXFiles2bot3MatchesLength; j++) {
              if (KodeXFiles2bot3Matches[j]) {
                KodeXFiles2bot.push(KodeXFiles2bot3Matches[j]);
              }
            }
          }
        }

        const KodeXFiles2bot4Matches = str.match(KodeXFiles2bot4Regexp);
        // console.log(KodeXFiles2bot4Matches);  //测试
        if (KodeXFiles2bot4Matches) {
          const KodeXFiles2bot4MatchesLength = KodeXFiles2bot4Matches.length;
          // console.log("KodeXFiles2bot4MatchesLength : " + KodeXFiles2bot4MatchesLength);  //测试
          if (KodeXFiles2bot4MatchesLength > 0) {
            for (let j = 0; j < KodeXFiles2bot4MatchesLength; j++) {
              if (KodeXFiles2bot4Matches[j]) {
                KodeXFiles2bot.push(KodeXFiles2bot4Matches[j]);
              }
            }
          }
        }

        // const DEANIgniteNationsbot1Matches = str.match(DEANIgniteNationsbot1Regexp);
        // // console.log(DEANIgniteNationsbot1Matches);  //测试
        // if (DEANIgniteNationsbot1Matches) {
        //   const DEANIgniteNationsbot1MatchesLength = DEANIgniteNationsbot1Matches.length;
        //   // console.log("DEANIgniteNationsbot1MatchesLength : " + DEANIgniteNationsbot1MatchesLength);  //测试
        //   if (DEANIgniteNationsbot1MatchesLength > 0) {
        //     for (let j = 0; j < DEANIgniteNationsbot1MatchesLength; j++) {
        //       if (DEANIgniteNationsbot1Matches[j]) {
        //         DEANIgniteNationsbot.push(DEANIgniteNationsbot1Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const DEANIgniteNationsbot2Matches = str.match(DEANIgniteNationsbot2Regexp);
        // // console.log(DEANIgniteNationsbot2Matches);  //测试
        // if (DEANIgniteNationsbot2Matches) {
        //   const DEANIgniteNationsbot2MatchesLength = DEANIgniteNationsbot2Matches.length;
        //   // console.log("DEANIgniteNationsbot2MatchesLength : " + DEANIgniteNationsbot2MatchesLength);  //测试
        //   if (DEANIgniteNationsbot2MatchesLength > 0) {
        //     for (let j = 0; j < DEANIgniteNationsbot2MatchesLength; j++) {
        //       if (DEANIgniteNationsbot2Matches[j]) {
        //         DEANIgniteNationsbot.push(DEANIgniteNationsbot2Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const DEANIgniteNationsbot3Matches = str.match(DEANIgniteNationsbot3Regexp);
        // // console.log(DEANIgniteNationsbot3Matches);  //测试
        // if (DEANIgniteNationsbot3Matches) {
        //   const DEANIgniteNationsbot3MatchesLength = DEANIgniteNationsbot3Matches.length;
        //   // console.log("DEANIgniteNationsbot3MatchesLength : " + DEANIgniteNationsbot3MatchesLength);  //测试
        //   if (DEANIgniteNationsbot3MatchesLength > 0) {
        //     for (let j = 0; j < DEANIgniteNationsbot3MatchesLength; j++) {
        //       if (DEANIgniteNationsbot3Matches[j]) {
        //         DEANIgniteNationsbot.push(DEANIgniteNationsbot3Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const DEANIgniteNationsbot4Matches = str.match(DEANIgniteNationsbot4Regexp);
        // // console.log(DEANIgniteNationsbot4Matches);  //测试
        // if (DEANIgniteNationsbot4Matches) {
        //   const DEANIgniteNationsbot4MatchesLength = DEANIgniteNationsbot4Matches.length;
        //   // console.log("DEANIgniteNationsbot4MatchesLength : " + DEANIgniteNationsbot4MatchesLength);  //测试
        //   if (DEANIgniteNationsbot4MatchesLength > 0) {
        //     for (let j = 0; j < DEANIgniteNationsbot4MatchesLength; j++) {
        //       if (DEANIgniteNationsbot4Matches[j]) {
        //         DEANIgniteNationsbot.push(DEANIgniteNationsbot4Matches[j]);
        //       }
        //     }
        //   }
        // }

        const RyumaSepongMilkubot1Matches = str.match(RyumaSepongMilkubot1Regexp);
        // console.log(RyumaSepongMilkubot1Matches);  //测试
        if (RyumaSepongMilkubot1Matches) {
          const RyumaSepongMilkubot1MatchesLength = RyumaSepongMilkubot1Matches.length;
          // console.log("RyumaSepongMilkubot1MatchesLength : " + RyumaSepongMilkubot1MatchesLength);  //测试
          if (RyumaSepongMilkubot1MatchesLength > 0) {
            for (let j = 0; j < RyumaSepongMilkubot1MatchesLength; j++) {
              if (RyumaSepongMilkubot1Matches[j]) {
                RyumaSepongMilkubot.push(RyumaSepongMilkubot1Matches[j]);
              }
            }
          }
        }

        const RyumaSepongMilkubot2Matches = str.match(RyumaSepongMilkubot2Regexp);
        // console.log(RyumaSepongMilkubot2Matches);  //测试
        if (RyumaSepongMilkubot2Matches) {
          const RyumaSepongMilkubot2MatchesLength = RyumaSepongMilkubot2Matches.length;
          // console.log("RyumaSepongMilkubot2MatchesLength : " + RyumaSepongMilkubot2MatchesLength);  //测试
          if (RyumaSepongMilkubot2MatchesLength > 0) {
            for (let j = 0; j < RyumaSepongMilkubot2MatchesLength; j++) {
              if (RyumaSepongMilkubot2Matches[j]) {
                RyumaSepongMilkubot.push(RyumaSepongMilkubot2Matches[j]);
              }
            }
          }
        }

        const RyumaSepongMilkubot3Matches = str.match(RyumaSepongMilkubot3Regexp);
        // console.log(RyumaSepongMilkubot3Matches);  //测试
        if (RyumaSepongMilkubot3Matches) {
          const RyumaSepongMilkubot3MatchesLength = RyumaSepongMilkubot3Matches.length;
          // console.log("RyumaSepongMilkubot3MatchesLength : " + RyumaSepongMilkubot3MatchesLength);  //测试
          if (RyumaSepongMilkubot3MatchesLength > 0) {
            for (let j = 0; j < RyumaSepongMilkubot3MatchesLength; j++) {
              if (RyumaSepongMilkubot3Matches[j]) {
                RyumaSepongMilkubot.push(RyumaSepongMilkubot3Matches[j]);
              }
            }
          }
        }

        const RyumaSepongMilkubot4Matches = str.match(RyumaSepongMilkubot4Regexp);
        // console.log(RyumaSepongMilkubot4Matches);  //测试
        if (RyumaSepongMilkubot4Matches) {
          const RyumaSepongMilkubot4MatchesLength = RyumaSepongMilkubot4Matches.length;
          // console.log("RyumaSepongMilkubot4MatchesLength : " + RyumaSepongMilkubot4MatchesLength);  //测试
          if (RyumaSepongMilkubot4MatchesLength > 0) {
            for (let j = 0; j < RyumaSepongMilkubot4MatchesLength; j++) {
              if (RyumaSepongMilkubot4Matches[j]) {
                RyumaSepongMilkubot.push(RyumaSepongMilkubot4Matches[j]);
              }
            }
          }
        }

        // const HikkiTusbolPaijobot1Matches = str.match(HikkiTusbolPaijobot1Regexp);
        // // console.log(HikkiTusbolPaijobot1Matches);  //测试
        // if (HikkiTusbolPaijobot1Matches) {
        //   const HikkiTusbolPaijobot1MatchesLength = HikkiTusbolPaijobot1Matches.length;
        //   // console.log("HikkiTusbolPaijobot1MatchesLength : " + HikkiTusbolPaijobot1MatchesLength);  //测试
        //   if (HikkiTusbolPaijobot1MatchesLength > 0) {
        //     for (let j = 0; j < HikkiTusbolPaijobot1MatchesLength; j++) {
        //       if (HikkiTusbolPaijobot1Matches[j]) {
        //         HikkiTusbolPaijobot.push(HikkiTusbolPaijobot1Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const HikkiTusbolPaijobot2Matches = str.match(HikkiTusbolPaijobot2Regexp);
        // // console.log(HikkiTusbolPaijobot2Matches);  //测试
        // if (HikkiTusbolPaijobot2Matches) {
        //   const HikkiTusbolPaijobot2MatchesLength = HikkiTusbolPaijobot2Matches.length;
        //   // console.log("HikkiTusbolPaijobot2MatchesLength : " + HikkiTusbolPaijobot2MatchesLength);  //测试
        //   if (HikkiTusbolPaijobot2MatchesLength > 0) {
        //     for (let j = 0; j < HikkiTusbolPaijobot2MatchesLength; j++) {
        //       if (HikkiTusbolPaijobot2Matches[j]) {
        //         HikkiTusbolPaijobot.push(HikkiTusbolPaijobot2Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const HikkiTusbolPaijobot3Matches = str.match(HikkiTusbolPaijobot3Regexp);
        // // console.log(HikkiTusbolPaijobot3Matches);  //测试
        // if (HikkiTusbolPaijobot3Matches) {
        //   const HikkiTusbolPaijobot3MatchesLength = HikkiTusbolPaijobot3Matches.length;
        //   // console.log("HikkiTusbolPaijobot3MatchesLength : " + HikkiTusbolPaijobot3MatchesLength);  //测试
        //   if (HikkiTusbolPaijobot3MatchesLength > 0) {
        //     for (let j = 0; j < HikkiTusbolPaijobot3MatchesLength; j++) {
        //       if (HikkiTusbolPaijobot3Matches[j]) {
        //         HikkiTusbolPaijobot.push(HikkiTusbolPaijobot3Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const HikkiTusbolPaijobot4Matches = str.match(HikkiTusbolPaijobot4Regexp);
        // // console.log(HikkiTusbolPaijobot4Matches);  //测试
        // if (HikkiTusbolPaijobot4Matches) {
        //   const HikkiTusbolPaijobot4MatchesLength = HikkiTusbolPaijobot4Matches.length;
        //   // console.log("HikkiTusbolPaijobot4MatchesLength : " + HikkiTusbolPaijobot4MatchesLength);  //测试
        //   if (HikkiTusbolPaijobot4MatchesLength > 0) {
        //     for (let j = 0; j < HikkiTusbolPaijobot4MatchesLength; j++) {
        //       if (HikkiTusbolPaijobot4Matches[j]) {
        //         HikkiTusbolPaijobot.push(HikkiTusbolPaijobot4Matches[j]);
        //       }
        //     }
        //   }
        // }

        const LunindiaCipokSuprettobot1Matches = str.match(LunindiaCipokSuprettobot1Regexp);
        // console.log(LunindiaCipokSuprettobot1Matches);  //测试
        if (LunindiaCipokSuprettobot1Matches) {
          const LunindiaCipokSuprettobot1MatchesLength = LunindiaCipokSuprettobot1Matches.length;
          // console.log("LunindiaCipokSuprettobot1MatchesLength : " + LunindiaCipokSuprettobot1MatchesLength);  //测试
          if (LunindiaCipokSuprettobot1MatchesLength > 0) {
            for (let j = 0; j < LunindiaCipokSuprettobot1MatchesLength; j++) {
              if (LunindiaCipokSuprettobot1Matches[j]) {
                LunindiaCipokSuprettobot.push(LunindiaCipokSuprettobot1Matches[j]);
              }
            }
          }
        }

        const LunindiaCipokSuprettobot2Matches = str.match(LunindiaCipokSuprettobot2Regexp);
        // console.log(LunindiaCipokSuprettobot2Matches);  //测试
        if (LunindiaCipokSuprettobot2Matches) {
          const LunindiaCipokSuprettobot2MatchesLength = LunindiaCipokSuprettobot2Matches.length;
          // console.log("LunindiaCipokSuprettobot2MatchesLength : " + LunindiaCipokSuprettobot2MatchesLength);  //测试
          if (LunindiaCipokSuprettobot2MatchesLength > 0) {
            for (let j = 0; j < LunindiaCipokSuprettobot2MatchesLength; j++) {
              if (LunindiaCipokSuprettobot2Matches[j]) {
                LunindiaCipokSuprettobot.push(LunindiaCipokSuprettobot2Matches[j]);
              }
            }
          }
        }

        const LunindiaCipokSuprettobot3Matches = str.match(LunindiaCipokSuprettobot3Regexp);
        // console.log(LunindiaCipokSuprettobot3Matches);  //测试
        if (LunindiaCipokSuprettobot3Matches) {
          const LunindiaCipokSuprettobot3MatchesLength = LunindiaCipokSuprettobot3Matches.length;
          // console.log("LunindiaCipokSuprettobot3MatchesLength : " + LunindiaCipokSuprettobot3MatchesLength);  //测试
          if (LunindiaCipokSuprettobot3MatchesLength > 0) {
            for (let j = 0; j < LunindiaCipokSuprettobot3MatchesLength; j++) {
              if (LunindiaCipokSuprettobot3Matches[j]) {
                LunindiaCipokSuprettobot.push(LunindiaCipokSuprettobot3Matches[j]);
              }
            }
          }
        }

        const LunindiaCipokSuprettobot4Matches = str.match(LunindiaCipokSuprettobot4Regexp);
        // console.log(LunindiaCipokSuprettobot4Matches);  //测试
        if (LunindiaCipokSuprettobot4Matches) {
          const LunindiaCipokSuprettobot4MatchesLength = LunindiaCipokSuprettobot4Matches.length;
          // console.log("LunindiaCipokSuprettobot4MatchesLength : " + LunindiaCipokSuprettobot4MatchesLength);  //测试
          if (LunindiaCipokSuprettobot4MatchesLength > 0) {
            for (let j = 0; j < LunindiaCipokSuprettobot4MatchesLength; j++) {
              if (LunindiaCipokSuprettobot4Matches[j]) {
                LunindiaCipokSuprettobot.push(LunindiaCipokSuprettobot4Matches[j]);
              }
            }
          }
        }

        // const PaijoKontolBurikbot1Matches = str.match(PaijoKontolBurikbot1Regexp);
        // // console.log(PaijoKontolBurikbot1Matches);  //测试
        // if (PaijoKontolBurikbot1Matches) {
        //   const PaijoKontolBurikbot1MatchesLength = PaijoKontolBurikbot1Matches.length;
        //   // console.log("PaijoKontolBurikbot1MatchesLength : " + PaijoKontolBurikbot1MatchesLength);  //测试
        //   if (PaijoKontolBurikbot1MatchesLength > 0) {
        //     for (let j = 0; j < PaijoKontolBurikbot1MatchesLength; j++) {
        //       if (PaijoKontolBurikbot1Matches[j]) {
        //         PaijoKontolBurikbot.push(PaijoKontolBurikbot1Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const PaijoKontolBurikbot2Matches = str.match(PaijoKontolBurikbot2Regexp);
        // // console.log(PaijoKontolBurikbot2Matches);  //测试
        // if (PaijoKontolBurikbot2Matches) {
        //   const PaijoKontolBurikbot2MatchesLength = PaijoKontolBurikbot2Matches.length;
        //   // console.log("PaijoKontolBurikbot2MatchesLength : " + PaijoKontolBurikbot2MatchesLength);  //测试
        //   if (PaijoKontolBurikbot2MatchesLength > 0) {
        //     for (let j = 0; j < PaijoKontolBurikbot2MatchesLength; j++) {
        //       if (PaijoKontolBurikbot2Matches[j]) {
        //         PaijoKontolBurikbot.push(PaijoKontolBurikbot2Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const PaijoKontolBurikbot3Matches = str.match(PaijoKontolBurikbot3Regexp);
        // // console.log(PaijoKontolBurikbot3Matches);  //测试
        // if (PaijoKontolBurikbot3Matches) {
        //   const PaijoKontolBurikbot3MatchesLength = PaijoKontolBurikbot3Matches.length;
        //   // console.log("PaijoKontolBurikbot3MatchesLength : " + PaijoKontolBurikbot3MatchesLength);  //测试
        //   if (PaijoKontolBurikbot3MatchesLength > 0) {
        //     for (let j = 0; j < PaijoKontolBurikbot3MatchesLength; j++) {
        //       if (PaijoKontolBurikbot3Matches[j]) {
        //         PaijoKontolBurikbot.push(PaijoKontolBurikbot3Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const PaijoKontolBurikbot4Matches = str.match(PaijoKontolBurikbot4Regexp);
        // // console.log(PaijoKontolBurikbot4Matches);  //测试
        // if (PaijoKontolBurikbot4Matches) {
        //   const PaijoKontolBurikbot4MatchesLength = PaijoKontolBurikbot4Matches.length;
        //   // console.log("PaijoKontolBurikbot4MatchesLength : " + PaijoKontolBurikbot4MatchesLength);  //测试
        //   if (PaijoKontolBurikbot4MatchesLength > 0) {
        //     for (let j = 0; j < PaijoKontolBurikbot4MatchesLength; j++) {
        //       if (PaijoKontolBurikbot4Matches[j]) {
        //         PaijoKontolBurikbot.push(PaijoKontolBurikbot4Matches[j]);
        //       }
        //     }
        //   }
        // }

        const Steviarchiverbot1Matches = str.match(Steviarchiverbot1Regexp);
        // console.log(Steviarchiverbot1Matches);  //测试
        if (Steviarchiverbot1Matches) {
          const Steviarchiverbot1MatchesLength = Steviarchiverbot1Matches.length;
          // console.log("Steviarchiverbot1MatchesLength : " + Steviarchiverbot1MatchesLength);  //测试
          if (Steviarchiverbot1MatchesLength > 0) {
            for (let j = 0; j < Steviarchiverbot1MatchesLength; j++) {
              if (Steviarchiverbot1Matches[j]) {
                Steviarchiverbot.push(Steviarchiverbot1Matches[j]);
              }
            }
          }
        }

        const Steviarchiverbot2Matches = str.match(Steviarchiverbot2Regexp);
        // console.log(Steviarchiverbot2Matches);  //测试
        if (Steviarchiverbot2Matches) {
          const Steviarchiverbot2MatchesLength = Steviarchiverbot2Matches.length;
          // console.log("Steviarchiverbot2MatchesLength : " + Steviarchiverbot2MatchesLength);  //测试
          if (Steviarchiverbot2MatchesLength > 0) {
            for (let j = 0; j < Steviarchiverbot2MatchesLength; j++) {
              if (Steviarchiverbot2Matches[j]) {
                Steviarchiverbot.push(Steviarchiverbot2Matches[j]);
              }
            }
          }
        }

        const Steviarchiverbot3Matches = str.match(Steviarchiverbot3Regexp);
        // console.log(Steviarchiverbot3Matches);  //测试
        if (Steviarchiverbot3Matches) {
          const Steviarchiverbot3MatchesLength = Steviarchiverbot3Matches.length;
          // console.log("Steviarchiverbot3MatchesLength : " + Steviarchiverbot3MatchesLength);  //测试
          if (Steviarchiverbot3MatchesLength > 0) {
            for (let j = 0; j < Steviarchiverbot3MatchesLength; j++) {
              if (Steviarchiverbot3Matches[j]) {
                Steviarchiverbot.push(Steviarchiverbot3Matches[j]);
              }
            }
          }
        }

        const Steviarchiverbot4Matches = str.match(Steviarchiverbot4Regexp);
        // console.log(Steviarchiverbot4Matches);  //测试
        if (Steviarchiverbot4Matches) {
          const Steviarchiverbot4MatchesLength = Steviarchiverbot4Matches.length;
          // console.log("Steviarchiverbot4MatchesLength : " + Steviarchiverbot4MatchesLength);  //测试
          if (Steviarchiverbot4MatchesLength > 0) {
            for (let j = 0; j < Steviarchiverbot4MatchesLength; j++) {
              if (Steviarchiverbot4Matches[j]) {
                Steviarchiverbot.push(Steviarchiverbot4Matches[j]);
              }
            }
          }
        }

        const Steviarchiverbot5Matches = str.match(Steviarchiverbot5Regexp);
        // console.log(Steviarchiverbot5Matches);  //测试
        if (Steviarchiverbot5Matches) {
          const Steviarchiverbot5MatchesLength = Steviarchiverbot5Matches.length;
          // console.log("Steviarchiverbot5MatchesLength : " + Steviarchiverbot5MatchesLength);  //测试
          if (Steviarchiverbot5MatchesLength > 0) {
            for (let j = 0; j < Steviarchiverbot5MatchesLength; j++) {
              if (Steviarchiverbot5Matches[j]) {
                Steviarchiverbot.push(Steviarchiverbot5Matches[j]);
              }
            }
          }
        }

        const DghuddvhiBOTMatches = str.match(DghuddvhiBOTRegexp);
        // console.log(DghuddvhiBOTMatches);  //测试
        if (DghuddvhiBOTMatches) {
          const DghuddvhiBOTMatchesLength = DghuddvhiBOTMatches.length;
          // console.log("DghuddvhiBOTMatchesLength : " + DghuddvhiBOTMatchesLength);  //测试
          if (DghuddvhiBOTMatchesLength > 0) {
            for (let j = 0; j < DghuddvhiBOTMatchesLength; j++) {
              if (DghuddvhiBOTMatches[j]) {
                DghuddvhiBOT.push(DghuddvhiBOTMatches[j]);
              }
            }
          }
        }

        const HijautebalbotMatches = str.match(HijautebalbotRegexp);
        // console.log(HijautebalbotMatches);  //测试
        if (HijautebalbotMatches) {
          const HijautebalbotMatchesLength = HijautebalbotMatches.length;
          // console.log("HijautebalbotMatchesLength : " + HijautebalbotMatchesLength);  //测试
          if (HijautebalbotMatchesLength > 0) {
            for (let j = 0; j < HijautebalbotMatchesLength; j++) {
              if (HijautebalbotMatches[j]) {
                Hijautebalbot.push(HijautebalbotMatches[j]);
              }
            }
          }
        }

        const FilesHubRobotMatches = str.match(FilesHubRobotRegexp);
        // console.log(FilesHubRobotMatches);  //测试
        if (FilesHubRobotMatches) {
          const FilesHubRobotMatchesLength = FilesHubRobotMatches.length;
          // console.log("FilesHubRobotMatchesLength : " + FilesHubRobotMatchesLength);  //测试
          if (FilesHubRobotMatchesLength > 0) {
            for (let j = 0; j < FilesHubRobotMatchesLength; j++) {
              if (FilesHubRobotMatches[j]) {
                FilesHubRobot.push(FilesHubRobotMatches[j]);
              }
            }
          }
        }

        const filespanindobotMatches = str.match(filespanindobotRegexp);
        // console.log(filespanindobotMatches);  //测试
        if (filespanindobotMatches) {
          const filespanindobotMatchesLength = filespanindobotMatches.length;
          // console.log("filespanindobotMatchesLength : " + filespanindobotMatchesLength);  //测试
          if (filespanindobotMatchesLength > 0) {
            for (let j = 0; j < filespanindobotMatchesLength; j++) {
              if (filespanindobotMatches[j]) {
                filespanindobot.push(filespanindobotMatches[j]);
              }
            }
          }
        }

        const KodeXChatsINDbotMatches = str.match(KodeXChatsINDbotRegexp);
        // console.log(KodeXChatsINDbotMatches);  //测试
        if (KodeXChatsINDbotMatches) {
          const KodeXChatsINDbotMatchesLength = KodeXChatsINDbotMatches.length;
          // console.log("KodeXChatsINDbotMatchesLength : " + KodeXChatsINDbotMatchesLength);  //测试
          if (KodeXChatsINDbotMatchesLength > 0) {
            for (let j = 0; j < KodeXChatsINDbotMatchesLength; j++) {
              if (KodeXChatsINDbotMatches[j]) {
                KodeXChatsINDbot.push(KodeXChatsINDbotMatches[j]);
              }
            }
          }
        }

        const MassFilesStoreBotMatches = str.match(MassFilesStoreBotRegexp);
        // console.log(MassFilesStoreBotMatches);  //测试
        if (MassFilesStoreBotMatches) {
          const MassFilesStoreBotMatchesLength = MassFilesStoreBotMatches.length;
          // console.log("MassFilesStoreBotMatchesLength : " + MassFilesStoreBotMatchesLength);  //测试
          if (MassFilesStoreBotMatchesLength > 0) {
            for (let j = 0; j < MassFilesStoreBotMatchesLength; j++) {
              if (MassFilesStoreBotMatches[j]) {
                MassFilesStoreBot.push(MassFilesStoreBotMatches[j]);
              }
            }
          }
        }

        const betapahatitakbahagiabotMatches = str.match(betapahatitakbahagiabotRegexp);
        // console.log(betapahatitakbahagiabotMatches);  //测试
        if (betapahatitakbahagiabotMatches) {
          const betapahatitakbahagiabotMatchesLength = betapahatitakbahagiabotMatches.length;
          // console.log("betapahatitakbahagiabotMatchesLength : " + betapahatitakbahagiabotMatchesLength);  //测试
          if (betapahatitakbahagiabotMatchesLength > 0) {
            for (let j = 0; j < betapahatitakbahagiabotMatchesLength; j++) {
              if (betapahatitakbahagiabotMatches[j]) {
                betapahatitakbahagiabot.push(betapahatitakbahagiabotMatches[j]);
              }
            }
          }
        }

        const QQfilebotMatches = str.match(QQfilebotRegexp);
        // console.log(QQfilebotMatches);  //测试
        if (QQfilebotMatches) {
          const QQfilebotMatchesLength = QQfilebotMatches.length;
          // console.log("QQfilebotMatchesLength : " + QQfilebotMatchesLength);  //测试
          if (QQfilebotMatchesLength > 0) {
            for (let j = 0; j < QQfilebotMatchesLength; j++) {
              if (QQfilebotMatches[j]) {
                QQfilebot.push(QQfilebotMatches[j]);
              }
            }
          }
        }

        // const QQfilebot1Matches = str.match(QQfilebot1Regexp);
        // // console.log(QQfilebot1Matches);  //测试
        // if (QQfilebot1Matches) {
        //   const QQfilebot1MatchesLength = QQfilebot1Matches.length;
        //   // console.log("QQfilebot1MatchesLength : " + QQfilebot1MatchesLength);  //测试
        //   if (QQfilebot1MatchesLength > 0) {
        //     for (let j = 0; j < QQfilebot1MatchesLength; j++) {
        //       if (QQfilebot1Matches[j]) {
        //         QQfilebot.push(QQfilebot1Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const QQfilebot2Matches = str.match(QQfilebot2Regexp);
        // // console.log(QQfilebot2Matches);  //测试
        // if (QQfilebot2Matches) {
        //   const QQfilebot2MatchesLength = QQfilebot2Matches.length;
        //   // console.log("QQfilebot2MatchesLength : " + QQfilebot2MatchesLength);  //测试
        //   if (QQfilebot2MatchesLength > 0) {
        //     for (let j = 0; j < QQfilebot2MatchesLength; j++) {
        //       if (QQfilebot2Matches[j]) {
        //         QQfilebot.push(QQfilebot2Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const QQfilebot3Matches = str.match(QQfilebot3Regexp);
        // // console.log(QQfilebot3Matches);  //测试
        // if (QQfilebot3Matches) {
        //   const QQfilebot3MatchesLength = QQfilebot3Matches.length;
        //   // console.log("QQfilebot3MatchesLength : " + QQfilebot3MatchesLength);  //测试
        //   if (QQfilebot3MatchesLength > 0) {
        //     for (let j = 0; j < QQfilebot3MatchesLength; j++) {
        //       if (QQfilebot3Matches[j]) {
        //         QQfilebot.push(QQfilebot3Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const QQfilebot4Matches = str.match(QQfilebot4Regexp);
        // // console.log(QQfilebot4Matches);  //测试
        // if (QQfilebot4Matches) {
        //   const QQfilebot4MatchesLength = QQfilebot4Matches.length;
        //   // console.log("QQfilebot4MatchesLength : " + QQfilebot4MatchesLength);  //测试
        //   if (QQfilebot4MatchesLength > 0) {
        //     for (let j = 0; j < QQfilebot4MatchesLength; j++) {
        //       if (QQfilebot4Matches[j]) {
        //         QQfilebot.push(QQfilebot4Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const QQfilebot5Matches = str.match(QQfilebot5Regexp);
        // // console.log(QQfilebot5Matches);  //测试
        // if (QQfilebot5Matches) {
        //   const QQfilebot5MatchesLength = QQfilebot5Matches.length;
        //   // console.log("QQfilebot5MatchesLength : " + QQfilebot5MatchesLength);  //测试
        //   if (QQfilebot5MatchesLength > 0) {
        //     for (let j = 0; j < QQfilebot5MatchesLength; j++) {
        //       if (QQfilebot5Matches[j]) {
        //         QQfilebot.push(QQfilebot5Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const QQfilebot6Matches = str.match(QQfilebot6Regexp);
        // // console.log(QQfilebot6Matches);  //测试
        // if (QQfilebot6Matches) {
        //   const QQfilebot6MatchesLength = QQfilebot6Matches.length;
        //   // console.log("QQfilebot6MatchesLength : " + QQfilebot6MatchesLength);  //测试
        //   if (QQfilebot6MatchesLength > 0) {
        //     for (let j = 0; j < QQfilebot6MatchesLength; j++) {
        //       if (QQfilebot6Matches[j]) {
        //         QQfilebot.push(QQfilebot6Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const QQfilebot7Matches = str.match(QQfilebot7Regexp);
        // // console.log(QQfilebot7Matches);  //测试
        // if (QQfilebot7Matches) {
        //   const QQfilebot7MatchesLength = QQfilebot7Matches.length;
        //   // console.log("QQfilebot7MatchesLength : " + QQfilebot7MatchesLength);  //测试
        //   if (QQfilebot7MatchesLength > 0) {
        //     for (let j = 0; j < QQfilebot7MatchesLength; j++) {
        //       if (QQfilebot7Matches[j]) {
        //         QQfilebot.push(QQfilebot7Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const QQfile2botMatches = str.match(QQfile2botRegexp);
        // // console.log(QQfile2botMatches);  //测试
        // if (QQfile2botMatches) {
        //   const QQfile2botMatchesLength = QQfile2botMatches.length;
        //   // console.log("QQfile2botMatchesLength : " + QQfile2botMatchesLength);  //测试
        //   if (QQfile2botMatchesLength > 0) {
        //     for (let j = 0; j < QQfile2botMatchesLength; j++) {
        //       if (QQfile2botMatches[j]) {
        //         QQfilebot.push(QQfile2botMatches[j]);
        //       }
        //     }
        //   }
        // }

        const QQfile2bot1Matches = str.match(QQfile2bot1Regexp);
        // console.log(QQfile2bot1Matches);  //测试
        if (QQfile2bot1Matches) {
          const QQfile2bot1MatchesLength = QQfile2bot1Matches.length;
          // console.log("QQfile2bot1MatchesLength : " + QQfile2bot1MatchesLength);  //测试
          if (QQfile2bot1MatchesLength > 0) {
            for (let j = 0; j < QQfile2bot1MatchesLength; j++) {
              if (QQfile2bot1Matches[j]) {
                QQfilebot.push(QQfile2bot1Matches[j]);
              }
            }
          }
        }

        const QQfile2bot2Matches = str.match(QQfile2bot2Regexp);
        // console.log(QQfile2bot2Matches);  //测试
        if (QQfile2bot2Matches) {
          const QQfile2bot2MatchesLength = QQfile2bot2Matches.length;
          // console.log("QQfile2bot2MatchesLength : " + QQfile2bot2MatchesLength);  //测试
          if (QQfile2bot2MatchesLength > 0) {
            for (let j = 0; j < QQfile2bot2MatchesLength; j++) {
              if (QQfile2bot2Matches[j]) {
                QQfilebot.push(QQfile2bot2Matches[j]);
              }
            }
          }
        }

        const QQfile2bot3Matches = str.match(QQfile2bot3Regexp);
        // console.log(QQfile2bot3Matches);  //测试
        if (QQfile2bot3Matches) {
          const QQfile2bot3MatchesLength = QQfile2bot3Matches.length;
          // console.log("QQfile2bot3MatchesLength : " + QQfile2bot3MatchesLength);  //测试
          if (QQfile2bot3MatchesLength > 0) {
            for (let j = 0; j < QQfile2bot3MatchesLength; j++) {
              if (QQfile2bot3Matches[j]) {
                QQfilebot.push(QQfile2bot3Matches[j]);
              }
            }
          }
        }

        const QQfile2bot4Matches = str.match(QQfile2bot4Regexp);
        // console.log(QQfile2bot4Matches);  //测试
        if (QQfile2bot4Matches) {
          const QQfile2bot4MatchesLength = QQfile2bot4Matches.length;
          // console.log("QQfile2bot4MatchesLength : " + QQfile2bot4MatchesLength);  //测试
          if (QQfile2bot4MatchesLength > 0) {
            for (let j = 0; j < QQfile2bot4MatchesLength; j++) {
              if (QQfile2bot4Matches[j]) {
                QQfilebot.push(QQfile2bot4Matches[j]);
              }
            }
          }
        }

        const QQfile2bot5Matches = str.match(QQfile2bot5Regexp);
        // console.log(QQfile2bot5Matches);  //测试
        if (QQfile2bot5Matches) {
          const QQfile2bot5MatchesLength = QQfile2bot5Matches.length;
          // console.log("QQfile2bot5MatchesLength : " + QQfile2bot5MatchesLength);  //测试
          if (QQfile2bot5MatchesLength > 0) {
            for (let j = 0; j < QQfile2bot5MatchesLength; j++) {
              if (QQfile2bot5Matches[j]) {
                QQfilebot.push(QQfile2bot5Matches[j]);
              }
            }
          }
        }

        const QQfile2bot6Matches = str.match(QQfile2bot6Regexp);
        // console.log(QQfile2bot6Matches);  //测试
        if (QQfile2bot6Matches) {
          const QQfile2bot6MatchesLength = QQfile2bot6Matches.length;
          // console.log("QQfile2bot6MatchesLength : " + QQfile2bot6MatchesLength);  //测试
          if (QQfile2bot6MatchesLength > 0) {
            for (let j = 0; j < QQfile2bot6MatchesLength; j++) {
              if (QQfile2bot6Matches[j]) {
                QQfilebot.push(QQfile2bot6Matches[j]);
              }
            }
          }
        }

        const QQfile2bot7Matches = str.match(QQfile2bot7Regexp);
        // console.log(QQfile2bot7Matches);  //测试
        if (QQfile2bot7Matches) {
          const QQfile2bot7MatchesLength = QQfile2bot7Matches.length;
          // console.log("QQfile2bot7MatchesLength : " + QQfile2bot7MatchesLength);  //测试
          if (QQfile2bot7MatchesLength > 0) {
            for (let j = 0; j < QQfile2bot7MatchesLength; j++) {
              if (QQfile2bot7Matches[j]) {
                QQfilebot.push(QQfile2bot7Matches[j]);
              }
            }
          }
        }

        // const QQfile4botMatches = str.match(QQfile4botRegexp);
        // // console.log(QQfile4botMatches);  //测试
        // if (QQfile4botMatches) {
        //   const QQfile4botMatchesLength = QQfile4botMatches.length;
        //   // console.log("QQfile4botMatchesLength : " + QQfile4botMatchesLength);  //测试
        //   if (QQfile4botMatchesLength > 0) {
        //     for (let j = 0; j < QQfile4botMatchesLength; j++) {
        //       if (QQfile4botMatches[j]) {
        //         QQfilebot.push(QQfile4botMatches[j]);
        //       }
        //     }
        //   }
        // }

        const QQfile4bot1Matches = str.match(QQfile4bot1Regexp);
        // console.log(QQfile4bot1Matches);  //测试
        if (QQfile4bot1Matches) {
          const QQfile4bot1MatchesLength = QQfile4bot1Matches.length;
          // console.log("QQfile4bot1MatchesLength : " + QQfile4bot1MatchesLength);  //测试
          if (QQfile4bot1MatchesLength > 0) {
            for (let j = 0; j < QQfile4bot1MatchesLength; j++) {
              if (QQfile4bot1Matches[j]) {
                QQfilebot.push(QQfile4bot1Matches[j]);
              }
            }
          }
        }

        const QQfile4bot2Matches = str.match(QQfile4bot2Regexp);
        // console.log(QQfile4bot2Matches);  //测试
        if (QQfile4bot2Matches) {
          const QQfile4bot2MatchesLength = QQfile4bot2Matches.length;
          // console.log("QQfile4bot2MatchesLength : " + QQfile4bot2MatchesLength);  //测试
          if (QQfile4bot2MatchesLength > 0) {
            for (let j = 0; j < QQfile4bot2MatchesLength; j++) {
              if (QQfile4bot2Matches[j]) {
                QQfilebot.push(QQfile4bot2Matches[j]);
              }
            }
          }
        }

        const QQfile4bot3Matches = str.match(QQfile4bot3Regexp);
        // console.log(QQfile4bot3Matches);  //测试
        if (QQfile4bot3Matches) {
          const QQfile4bot3MatchesLength = QQfile4bot3Matches.length;
          // console.log("QQfile4bot3MatchesLength : " + QQfile4bot3MatchesLength);  //测试
          if (QQfile4bot3MatchesLength > 0) {
            for (let j = 0; j < QQfile4bot3MatchesLength; j++) {
              if (QQfile4bot3Matches[j]) {
                QQfilebot.push(QQfile4bot3Matches[j]);
              }
            }
          }
        }

        const QQfile4bot4Matches = str.match(QQfile4bot4Regexp);
        // console.log(QQfile4bot4Matches);  //测试
        if (QQfile4bot4Matches) {
          const QQfile4bot4MatchesLength = QQfile4bot4Matches.length;
          // console.log("QQfile4bot4MatchesLength : " + QQfile4bot4MatchesLength);  //测试
          if (QQfile4bot4MatchesLength > 0) {
            for (let j = 0; j < QQfile4bot4MatchesLength; j++) {
              if (QQfile4bot4Matches[j]) {
                QQfilebot.push(QQfile4bot4Matches[j]);
              }
            }
          }
        }

        const QQfile4bot5Matches = str.match(QQfile4bot5Regexp);
        // console.log(QQfile4bot5Matches);  //测试
        if (QQfile4bot5Matches) {
          const QQfile4bot5MatchesLength = QQfile4bot5Matches.length;
          // console.log("QQfile4bot5MatchesLength : " + QQfile4bot5MatchesLength);  //测试
          if (QQfile4bot5MatchesLength > 0) {
            for (let j = 0; j < QQfile4bot5MatchesLength; j++) {
              if (QQfile4bot5Matches[j]) {
                QQfilebot.push(QQfile4bot5Matches[j]);
              }
            }
          }
        }

        const QQfile4bot6Matches = str.match(QQfile4bot6Regexp);
        // console.log(QQfile4bot6Matches);  //测试
        if (QQfile4bot6Matches) {
          const QQfile4bot6MatchesLength = QQfile4bot6Matches.length;
          // console.log("QQfile4bot6MatchesLength : " + QQfile4bot6MatchesLength);  //测试
          if (QQfile4bot6MatchesLength > 0) {
            for (let j = 0; j < QQfile4bot6MatchesLength; j++) {
              if (QQfile4bot6Matches[j]) {
                QQfilebot.push(QQfile4bot6Matches[j]);
              }
            }
          }
        }

        const QQfile4bot7Matches = str.match(QQfile4bot7Regexp);
        // console.log(QQfile4bot7Matches);  //测试
        if (QQfile4bot7Matches) {
          const QQfile4bot7MatchesLength = QQfile4bot7Matches.length;
          // console.log("QQfile4bot7MatchesLength : " + QQfile4bot7MatchesLength);  //测试
          if (QQfile4bot7MatchesLength > 0) {
            for (let j = 0; j < QQfile4bot7MatchesLength; j++) {
              if (QQfile4bot7Matches[j]) {
                QQfilebot.push(QQfile4bot7Matches[j]);
              }
            }
          }
        }

        // const QQfile10botMatches = str.match(QQfile10botRegexp);
        // // console.log(QQfile10botMatches);  //测试
        // if (QQfile10botMatches) {
        //   const QQfile10botMatchesLength = QQfile10botMatches.length;
        //   // console.log("QQfile10botMatchesLength : " + QQfile10botMatchesLength);  //测试
        //   if (QQfile10botMatchesLength > 0) {
        //     for (let j = 0; j < QQfile10botMatchesLength; j++) {
        //       if (QQfile10botMatches[j]) {
        //         QQfilebot.push(QQfile10botMatches[j]);
        //       }
        //     }
        //   }
        // }

        const QQfile10bot1Matches = str.match(QQfile10bot1Regexp);
        // console.log(QQfile10bot1Matches);  //测试
        if (QQfile10bot1Matches) {
          const QQfile10bot1MatchesLength = QQfile10bot1Matches.length;
          // console.log("QQfile10bot1MatchesLength : " + QQfile10bot1MatchesLength);  //测试
          if (QQfile10bot1MatchesLength > 0) {
            for (let j = 0; j < QQfile10bot1MatchesLength; j++) {
              if (QQfile10bot1Matches[j]) {
                QQfilebot.push(QQfile10bot1Matches[j]);
              }
            }
          }
        }

        const QQfile10bot2Matches = str.match(QQfile10bot2Regexp);
        // console.log(QQfile10bot2Matches);  //测试
        if (QQfile10bot2Matches) {
          const QQfile10bot2MatchesLength = QQfile10bot2Matches.length;
          // console.log("QQfile10bot2MatchesLength : " + QQfile10bot2MatchesLength);  //测试
          if (QQfile10bot2MatchesLength > 0) {
            for (let j = 0; j < QQfile10bot2MatchesLength; j++) {
              if (QQfile10bot2Matches[j]) {
                QQfilebot.push(QQfile10bot2Matches[j]);
              }
            }
          }
        }

        const QQfile10bot3Matches = str.match(QQfile10bot3Regexp);
        // console.log(QQfile10bot3Matches);  //测试
        if (QQfile10bot3Matches) {
          const QQfile10bot3MatchesLength = QQfile10bot3Matches.length;
          // console.log("QQfile10bot3MatchesLength : " + QQfile10bot3MatchesLength);  //测试
          if (QQfile10bot3MatchesLength > 0) {
            for (let j = 0; j < QQfile10bot3MatchesLength; j++) {
              if (QQfile10bot3Matches[j]) {
                QQfilebot.push(QQfile10bot3Matches[j]);
              }
            }
          }
        }

        const QQfile10bot4Matches = str.match(QQfile10bot4Regexp);
        // console.log(QQfile10bot4Matches);  //测试
        if (QQfile10bot4Matches) {
          const QQfile10bot4MatchesLength = QQfile10bot4Matches.length;
          // console.log("QQfile10bot4MatchesLength : " + QQfile10bot4MatchesLength);  //测试
          if (QQfile10bot4MatchesLength > 0) {
            for (let j = 0; j < QQfile10bot4MatchesLength; j++) {
              if (QQfile10bot4Matches[j]) {
                QQfilebot.push(QQfile10bot4Matches[j]);
              }
            }
          }
        }

        const QQfile10bot5Matches = str.match(QQfile10bot5Regexp);
        // console.log(QQfile10bot5Matches);  //测试
        if (QQfile10bot5Matches) {
          const QQfile10bot5MatchesLength = QQfile10bot5Matches.length;
          // console.log("QQfile10bot5MatchesLength : " + QQfile10bot5MatchesLength);  //测试
          if (QQfile10bot5MatchesLength > 0) {
            for (let j = 0; j < QQfile10bot5MatchesLength; j++) {
              if (QQfile10bot5Matches[j]) {
                QQfilebot.push(QQfile10bot5Matches[j]);
              }
            }
          }
        }

        const QQfile10bot6Matches = str.match(QQfile10bot6Regexp);
        // console.log(QQfile10bot6Matches);  //测试
        if (QQfile10bot6Matches) {
          const QQfile10bot6MatchesLength = QQfile10bot6Matches.length;
          // console.log("QQfile10bot6MatchesLength : " + QQfile10bot6MatchesLength);  //测试
          if (QQfile10bot6MatchesLength > 0) {
            for (let j = 0; j < QQfile10bot6MatchesLength; j++) {
              if (QQfile10bot6Matches[j]) {
                QQfilebot.push(QQfile10bot6Matches[j]);
              }
            }
          }
        }

        const QQfile10bot7Matches = str.match(QQfile10bot7Regexp);
        // console.log(QQfile10bot7Matches);  //测试
        if (QQfile10bot7Matches) {
          const QQfile10bot7MatchesLength = QQfile10bot7Matches.length;
          // console.log("QQfile10bot7MatchesLength : " + QQfile10bot7MatchesLength);  //测试
          if (QQfile10bot7MatchesLength > 0) {
            for (let j = 0; j < QQfile10bot7MatchesLength; j++) {
              if (QQfile10bot7Matches[j]) {
                QQfilebot.push(QQfile10bot7Matches[j]);
              }
            }
          }
        }

        // const QQfile11botMatches = str.match(QQfile11botRegexp);
        // // console.log(QQfile11botMatches);  //测试
        // if (QQfile11botMatches) {
        //   const QQfile11botMatchesLength = QQfile11botMatches.length;
        //   // console.log("QQfile11botMatchesLength : " + QQfile11botMatchesLength);  //测试
        //   if (QQfile11botMatchesLength > 0) {
        //     for (let j = 0; j < QQfile11botMatchesLength; j++) {
        //       if (QQfile11botMatches[j]) {
        //         QQfilebot.push(QQfile11botMatches[j]);
        //       }
        //     }
        //   }
        // }

        const QQfile11bot1Matches = str.match(QQfile11bot1Regexp);
        // console.log(QQfile11bot1Matches);  //测试
        if (QQfile11bot1Matches) {
          const QQfile11bot1MatchesLength = QQfile11bot1Matches.length;
          // console.log("QQfile11bot1MatchesLength : " + QQfile11bot1MatchesLength);  //测试
          if (QQfile11bot1MatchesLength > 0) {
            for (let j = 0; j < QQfile11bot1MatchesLength; j++) {
              if (QQfile11bot1Matches[j]) {
                QQfilebot.push(QQfile11bot1Matches[j]);
              }
            }
          }
        }

        const QQfile11bot2Matches = str.match(QQfile11bot2Regexp);
        // console.log(QQfile11bot2Matches);  //测试
        if (QQfile11bot2Matches) {
          const QQfile11bot2MatchesLength = QQfile11bot2Matches.length;
          // console.log("QQfile11bot2MatchesLength : " + QQfile11bot2MatchesLength);  //测试
          if (QQfile11bot2MatchesLength > 0) {
            for (let j = 0; j < QQfile11bot2MatchesLength; j++) {
              if (QQfile11bot2Matches[j]) {
                QQfilebot.push(QQfile11bot2Matches[j]);
              }
            }
          }
        }

        const QQfile11bot3Matches = str.match(QQfile11bot3Regexp);
        // console.log(QQfile11bot3Matches);  //测试
        if (QQfile11bot3Matches) {
          const QQfile11bot3MatchesLength = QQfile11bot3Matches.length;
          // console.log("QQfile11bot3MatchesLength : " + QQfile11bot3MatchesLength);  //测试
          if (QQfile11bot3MatchesLength > 0) {
            for (let j = 0; j < QQfile11bot3MatchesLength; j++) {
              if (QQfile11bot3Matches[j]) {
                QQfilebot.push(QQfile11bot3Matches[j]);
              }
            }
          }
        }

        const QQfile11bot4Matches = str.match(QQfile11bot4Regexp);
        // console.log(QQfile11bot4Matches);  //测试
        if (QQfile11bot4Matches) {
          const QQfile11bot4MatchesLength = QQfile11bot4Matches.length;
          // console.log("QQfile11bot4MatchesLength : " + QQfile11bot4MatchesLength);  //测试
          if (QQfile11bot4MatchesLength > 0) {
            for (let j = 0; j < QQfile11bot4MatchesLength; j++) {
              if (QQfile11bot4Matches[j]) {
                QQfilebot.push(QQfile11bot4Matches[j]);
              }
            }
          }
        }

        const QQfile11bot5Matches = str.match(QQfile11bot5Regexp);
        // console.log(QQfile11bot5Matches);  //测试
        if (QQfile11bot5Matches) {
          const QQfile11bot5MatchesLength = QQfile11bot5Matches.length;
          // console.log("QQfile11bot5MatchesLength : " + QQfile11bot5MatchesLength);  //测试
          if (QQfile11bot5MatchesLength > 0) {
            for (let j = 0; j < QQfile11bot5MatchesLength; j++) {
              if (QQfile11bot5Matches[j]) {
                QQfilebot.push(QQfile11bot5Matches[j]);
              }
            }
          }
        }

        const QQfile11bot6Matches = str.match(QQfile11bot6Regexp);
        // console.log(QQfile11bot6Matches);  //测试
        if (QQfile11bot6Matches) {
          const QQfile11bot6MatchesLength = QQfile11bot6Matches.length;
          // console.log("QQfile11bot6MatchesLength : " + QQfile11bot6MatchesLength);  //测试
          if (QQfile11bot6MatchesLength > 0) {
            for (let j = 0; j < QQfile11bot6MatchesLength; j++) {
              if (QQfile11bot6Matches[j]) {
                QQfilebot.push(QQfile11bot6Matches[j]);
              }
            }
          }
        }

        const QQfile11bot7Matches = str.match(QQfile11bot7Regexp);
        // console.log(QQfile11bot7Matches);  //测试
        if (QQfile11bot7Matches) {
          const QQfile11bot7MatchesLength = QQfile11bot7Matches.length;
          // console.log("QQfile11bot7MatchesLength : " + QQfile11bot7MatchesLength);  //测试
          if (QQfile11bot7MatchesLength > 0) {
            for (let j = 0; j < QQfile11bot7MatchesLength; j++) {
              if (QQfile11bot7Matches[j]) {
                QQfilebot.push(QQfile11bot7Matches[j]);
              }
            }
          }
        }

        // const QQn8zwbotMatches = str.match(QQn8zwbotRegexp);
        // // console.log(QQn8zwbotMatches);  //测试
        // if (QQn8zwbotMatches) {
        //   const QQn8zwbotMatchesLength = QQn8zwbotMatches.length;
        //   // console.log("QQn8zwbotMatchesLength : " + QQn8zwbotMatchesLength);  //测试
        //   if (QQn8zwbotMatchesLength > 0) {
        //     for (let j = 0; j < QQn8zwbotMatchesLength; j++) {
        //       if (QQn8zwbotMatches[j]) {
        //         QQfilebot.push(QQn8zwbotMatches[j]);
        //       }
        //     }
        //   }
        // }

        const QQn8zwbot1Matches = str.match(QQn8zwbot1Regexp);
        // console.log(QQn8zwbot1Matches);  //测试
        if (QQn8zwbot1Matches) {
          const QQn8zwbot1MatchesLength = QQn8zwbot1Matches.length;
          // console.log("QQn8zwbot1MatchesLength : " + QQn8zwbot1MatchesLength);  //测试
          if (QQn8zwbot1MatchesLength > 0) {
            for (let j = 0; j < QQn8zwbot1MatchesLength; j++) {
              if (QQn8zwbot1Matches[j]) {
                QQfilebot.push(QQn8zwbot1Matches[j]);
              }
            }
          }
        }

        const QQn8zwbot2Matches = str.match(QQn8zwbot2Regexp);
        // console.log(QQn8zwbot2Matches);  //测试
        if (QQn8zwbot2Matches) {
          const QQn8zwbot2MatchesLength = QQn8zwbot2Matches.length;
          // console.log("QQn8zwbot2MatchesLength : " + QQn8zwbot2MatchesLength);  //测试
          if (QQn8zwbot2MatchesLength > 0) {
            for (let j = 0; j < QQn8zwbot2MatchesLength; j++) {
              if (QQn8zwbot2Matches[j]) {
                QQfilebot.push(QQn8zwbot2Matches[j]);
              }
            }
          }
        }

        const QQn8zwbot3Matches = str.match(QQn8zwbot3Regexp);
        // console.log(QQn8zwbot3Matches);  //测试
        if (QQn8zwbot3Matches) {
          const QQn8zwbot3MatchesLength = QQn8zwbot3Matches.length;
          // console.log("QQn8zwbot3MatchesLength : " + QQn8zwbot3MatchesLength);  //测试
          if (QQn8zwbot3MatchesLength > 0) {
            for (let j = 0; j < QQn8zwbot3MatchesLength; j++) {
              if (QQn8zwbot3Matches[j]) {
                QQfilebot.push(QQn8zwbot3Matches[j]);
              }
            }
          }
        }

        const QQn8zwbot4Matches = str.match(QQn8zwbot4Regexp);
        // console.log(QQn8zwbot4Matches);  //测试
        if (QQn8zwbot4Matches) {
          const QQn8zwbot4MatchesLength = QQn8zwbot4Matches.length;
          // console.log("QQn8zwbot4MatchesLength : " + QQn8zwbot4MatchesLength);  //测试
          if (QQn8zwbot4MatchesLength > 0) {
            for (let j = 0; j < QQn8zwbot4MatchesLength; j++) {
              if (QQn8zwbot4Matches[j]) {
                QQfilebot.push(QQn8zwbot4Matches[j]);
              }
            }
          }
        }

        const QQn8zwbot5Matches = str.match(QQn8zwbot5Regexp);
        // console.log(QQn8zwbot5Matches);  //测试
        if (QQn8zwbot5Matches) {
          const QQn8zwbot5MatchesLength = QQn8zwbot5Matches.length;
          // console.log("QQn8zwbot5MatchesLength : " + QQn8zwbot5MatchesLength);  //测试
          if (QQn8zwbot5MatchesLength > 0) {
            for (let j = 0; j < QQn8zwbot5MatchesLength; j++) {
              if (QQn8zwbot5Matches[j]) {
                QQfilebot.push(QQn8zwbot5Matches[j]);
              }
            }
          }
        }

        const QQn8zwbot6Matches = str.match(QQn8zwbot6Regexp);
        // console.log(QQn8zwbot6Matches);  //测试
        if (QQn8zwbot6Matches) {
          const QQn8zwbot6MatchesLength = QQn8zwbot6Matches.length;
          // console.log("QQn8zwbot6MatchesLength : " + QQn8zwbot6MatchesLength);  //测试
          if (QQn8zwbot6MatchesLength > 0) {
            for (let j = 0; j < QQn8zwbot6MatchesLength; j++) {
              if (QQn8zwbot6Matches[j]) {
                QQfilebot.push(QQn8zwbot6Matches[j]);
              }
            }
          }
        }

        const QQn8zwbot7Matches = str.match(QQn8zwbot7Regexp);
        // console.log(QQn8zwbot7Matches);  //测试
        if (QQn8zwbot7Matches) {
          const QQn8zwbot7MatchesLength = QQn8zwbot7Matches.length;
          // console.log("QQn8zwbot7MatchesLength : " + QQn8zwbot7MatchesLength);  //测试
          if (QQn8zwbot7MatchesLength > 0) {
            for (let j = 0; j < QQn8zwbot7MatchesLength; j++) {
              if (QQn8zwbot7Matches[j]) {
                QQfilebot.push(QQn8zwbot7Matches[j]);
              }
            }
          }
        }

        // const QQirfubotMatches = str.match(QQirfubotRegexp);
        // // console.log(QQirfubotMatches);  //测试
        // if (QQirfubotMatches) {
        //   const QQirfubotMatchesLength = QQirfubotMatches.length;
        //   // console.log("QQirfubotMatchesLength : " + QQirfubotMatchesLength);  //测试
        //   if (QQirfubotMatchesLength > 0) {
        //     for (let j = 0; j < QQirfubotMatchesLength; j++) {
        //       if (QQirfubotMatches[j]) {
        //         QQfilebot.push(QQirfubotMatches[j]);
        //       }
        //     }
        //   }
        // }

        const QQirfubot1Matches = str.match(QQirfubot1Regexp);
        // console.log(QQirfubot1Matches);  //测试
        if (QQirfubot1Matches) {
          const QQirfubot1MatchesLength = QQirfubot1Matches.length;
          // console.log("QQirfubot1MatchesLength : " + QQirfubot1MatchesLength);  //测试
          if (QQirfubot1MatchesLength > 0) {
            for (let j = 0; j < QQirfubot1MatchesLength; j++) {
              if (QQirfubot1Matches[j]) {
                QQfilebot.push(QQirfubot1Matches[j]);
              }
            }
          }
        }

        const QQirfubot2Matches = str.match(QQirfubot2Regexp);
        // console.log(QQirfubot2Matches);  //测试
        if (QQirfubot2Matches) {
          const QQirfubot2MatchesLength = QQirfubot2Matches.length;
          // console.log("QQirfubot2MatchesLength : " + QQirfubot2MatchesLength);  //测试
          if (QQirfubot2MatchesLength > 0) {
            for (let j = 0; j < QQirfubot2MatchesLength; j++) {
              if (QQirfubot2Matches[j]) {
                QQfilebot.push(QQirfubot2Matches[j]);
              }
            }
          }
        }

        const QQirfubot3Matches = str.match(QQirfubot3Regexp);
        // console.log(QQirfubot3Matches);  //测试
        if (QQirfubot3Matches) {
          const QQirfubot3MatchesLength = QQirfubot3Matches.length;
          // console.log("QQirfubot3MatchesLength : " + QQirfubot3MatchesLength);  //测试
          if (QQirfubot3MatchesLength > 0) {
            for (let j = 0; j < QQirfubot3MatchesLength; j++) {
              if (QQirfubot3Matches[j]) {
                QQfilebot.push(QQirfubot3Matches[j]);
              }
            }
          }
        }

        const QQirfubot4Matches = str.match(QQirfubot4Regexp);
        // console.log(QQirfubot4Matches);  //测试
        if (QQirfubot4Matches) {
          const QQirfubot4MatchesLength = QQirfubot4Matches.length;
          // console.log("QQirfubot4MatchesLength : " + QQirfubot4MatchesLength);  //测试
          if (QQirfubot4MatchesLength > 0) {
            for (let j = 0; j < QQirfubot4MatchesLength; j++) {
              if (QQirfubot4Matches[j]) {
                QQfilebot.push(QQirfubot4Matches[j]);
              }
            }
          }
        }

        const QQirfubot5Matches = str.match(QQirfubot5Regexp);
        // console.log(QQirfubot5Matches);  //测试
        if (QQirfubot5Matches) {
          const QQirfubot5MatchesLength = QQirfubot5Matches.length;
          // console.log("QQirfubot5MatchesLength : " + QQirfubot5MatchesLength);  //测试
          if (QQirfubot5MatchesLength > 0) {
            for (let j = 0; j < QQirfubot5MatchesLength; j++) {
              if (QQirfubot5Matches[j]) {
                QQfilebot.push(QQirfubot5Matches[j]);
              }
            }
          }
        }

        const QQirfubot6Matches = str.match(QQirfubot6Regexp);
        // console.log(QQirfubot6Matches);  //测试
        if (QQirfubot6Matches) {
          const QQirfubot6MatchesLength = QQirfubot6Matches.length;
          // console.log("QQirfubot6MatchesLength : " + QQirfubot6MatchesLength);  //测试
          if (QQirfubot6MatchesLength > 0) {
            for (let j = 0; j < QQirfubot6MatchesLength; j++) {
              if (QQirfubot6Matches[j]) {
                QQfilebot.push(QQirfubot6Matches[j]);
              }
            }
          }
        }

        const QQirfubot7Matches = str.match(QQirfubot7Regexp);
        // console.log(QQirfubot7Matches);  //测试
        if (QQirfubot7Matches) {
          const QQirfubot7MatchesLength = QQirfubot7Matches.length;
          // console.log("QQirfubot7MatchesLength : " + QQirfubot7MatchesLength);  //测试
          if (QQirfubot7MatchesLength > 0) {
            for (let j = 0; j < QQirfubot7MatchesLength; j++) {
              if (QQirfubot7Matches[j]) {
                QQfilebot.push(QQirfubot7Matches[j]);
              }
            }
          }
        }

        // const QQz32obotMatches = str.match(QQz32obotRegexp);
        // // console.log(QQz32obotMatches);  //测试
        // if (QQz32obotMatches) {
        //   const QQz32obotMatchesLength = QQz32obotMatches.length;
        //   // console.log("QQz32obotMatchesLength : " + QQz32obotMatchesLength);  //测试
        //   if (QQz32obotMatchesLength > 0) {
        //     for (let j = 0; j < QQz32obotMatchesLength; j++) {
        //       if (QQz32obotMatches[j]) {
        //         QQfilebot.push(QQz32obotMatches[j]);
        //       }
        //     }
        //   }
        // }

        const QQz32obot1Matches = str.match(QQz32obot1Regexp);
        // console.log(QQz32obot1Matches);  //测试
        if (QQz32obot1Matches) {
          const QQz32obot1MatchesLength = QQz32obot1Matches.length;
          // console.log("QQz32obot1MatchesLength : " + QQz32obot1MatchesLength);  //测试
          if (QQz32obot1MatchesLength > 0) {
            for (let j = 0; j < QQz32obot1MatchesLength; j++) {
              if (QQz32obot1Matches[j]) {
                QQfilebot.push(QQz32obot1Matches[j]);
              }
            }
          }
        }

        const QQz32obot2Matches = str.match(QQz32obot2Regexp);
        // console.log(QQz32obot2Matches);  //测试
        if (QQz32obot2Matches) {
          const QQz32obot2MatchesLength = QQz32obot2Matches.length;
          // console.log("QQz32obot2MatchesLength : " + QQz32obot2MatchesLength);  //测试
          if (QQz32obot2MatchesLength > 0) {
            for (let j = 0; j < QQz32obot2MatchesLength; j++) {
              if (QQz32obot2Matches[j]) {
                QQfilebot.push(QQz32obot2Matches[j]);
              }
            }
          }
        }

        const QQz32obot3Matches = str.match(QQz32obot3Regexp);
        // console.log(QQz32obot3Matches);  //测试
        if (QQz32obot3Matches) {
          const QQz32obot3MatchesLength = QQz32obot3Matches.length;
          // console.log("QQz32obot3MatchesLength : " + QQz32obot3MatchesLength);  //测试
          if (QQz32obot3MatchesLength > 0) {
            for (let j = 0; j < QQz32obot3MatchesLength; j++) {
              if (QQz32obot3Matches[j]) {
                QQfilebot.push(QQz32obot3Matches[j]);
              }
            }
          }
        }

        const QQz32obot4Matches = str.match(QQz32obot4Regexp);
        // console.log(QQz32obot4Matches);  //测试
        if (QQz32obot4Matches) {
          const QQz32obot4MatchesLength = QQz32obot4Matches.length;
          // console.log("QQz32obot4MatchesLength : " + QQz32obot4MatchesLength);  //测试
          if (QQz32obot4MatchesLength > 0) {
            for (let j = 0; j < QQz32obot4MatchesLength; j++) {
              if (QQz32obot4Matches[j]) {
                QQfilebot.push(QQz32obot4Matches[j]);
              }
            }
          }
        }

        const QQz32obot5Matches = str.match(QQz32obot5Regexp);
        // console.log(QQz32obot5Matches);  //测试
        if (QQz32obot5Matches) {
          const QQz32obot5MatchesLength = QQz32obot5Matches.length;
          // console.log("QQz32obot5MatchesLength : " + QQz32obot5MatchesLength);  //测试
          if (QQz32obot5MatchesLength > 0) {
            for (let j = 0; j < QQz32obot5MatchesLength; j++) {
              if (QQz32obot5Matches[j]) {
                QQfilebot.push(QQz32obot5Matches[j]);
              }
            }
          }
        }

        const QQz32obot6Matches = str.match(QQz32obot6Regexp);
        // console.log(QQz32obot6Matches);  //测试
        if (QQz32obot6Matches) {
          const QQz32obot6MatchesLength = QQz32obot6Matches.length;
          // console.log("QQz32obot6MatchesLength : " + QQz32obot6MatchesLength);  //测试
          if (QQz32obot6MatchesLength > 0) {
            for (let j = 0; j < QQz32obot6MatchesLength; j++) {
              if (QQz32obot6Matches[j]) {
                QQfilebot.push(QQz32obot6Matches[j]);
              }
            }
          }
        }

        const QQz32obot7Matches = str.match(QQz32obot7Regexp);
        // console.log(QQz32obot7Matches);  //测试
        if (QQz32obot7Matches) {
          const QQz32obot7MatchesLength = QQz32obot7Matches.length;
          // console.log("QQz32obot7MatchesLength : " + QQz32obot7MatchesLength);  //测试
          if (QQz32obot7MatchesLength > 0) {
            for (let j = 0; j < QQz32obot7MatchesLength; j++) {
              if (QQz32obot7Matches[j]) {
                QQfilebot.push(QQz32obot7Matches[j]);
              }
            }
          }
        }

        // const QQdvbkbotMatches = str.match(QQdvbkbotRegexp);
        // // console.log(QQdvbkbotMatches);  //测试
        // if (QQdvbkbotMatches) {
        //   const QQdvbkbotMatchesLength = QQdvbkbotMatches.length;
        //   // console.log("QQdvbkbotMatchesLength : " + QQdvbkbotMatchesLength);  //测试
        //   if (QQdvbkbotMatchesLength > 0) {
        //     for (let j = 0; j < QQdvbkbotMatchesLength; j++) {
        //       if (QQdvbkbotMatches[j]) {
        //         QQfilebot.push(QQdvbkbotMatches[j]);
        //       }
        //     }
        //   }
        // }

        const QQdvbkbot1Matches = str.match(QQdvbkbot1Regexp);
        // console.log(QQdvbkbot1Matches);  //测试
        if (QQdvbkbot1Matches) {
          const QQdvbkbot1MatchesLength = QQdvbkbot1Matches.length;
          // console.log("QQdvbkbot1MatchesLength : " + QQdvbkbot1MatchesLength);  //测试
          if (QQdvbkbot1MatchesLength > 0) {
            for (let j = 0; j < QQdvbkbot1MatchesLength; j++) {
              if (QQdvbkbot1Matches[j]) {
                QQfilebot.push(QQdvbkbot1Matches[j]);
              }
            }
          }
        }

        const QQdvbkbot2Matches = str.match(QQdvbkbot2Regexp);
        // console.log(QQdvbkbot2Matches);  //测试
        if (QQdvbkbot2Matches) {
          const QQdvbkbot2MatchesLength = QQdvbkbot2Matches.length;
          // console.log("QQdvbkbot2MatchesLength : " + QQdvbkbot2MatchesLength);  //测试
          if (QQdvbkbot2MatchesLength > 0) {
            for (let j = 0; j < QQdvbkbot2MatchesLength; j++) {
              if (QQdvbkbot2Matches[j]) {
                QQfilebot.push(QQdvbkbot2Matches[j]);
              }
            }
          }
        }

        const QQdvbkbot3Matches = str.match(QQdvbkbot3Regexp);
        // console.log(QQdvbkbot3Matches);  //测试
        if (QQdvbkbot3Matches) {
          const QQdvbkbot3MatchesLength = QQdvbkbot3Matches.length;
          // console.log("QQdvbkbot3MatchesLength : " + QQdvbkbot3MatchesLength);  //测试
          if (QQdvbkbot3MatchesLength > 0) {
            for (let j = 0; j < QQdvbkbot3MatchesLength; j++) {
              if (QQdvbkbot3Matches[j]) {
                QQfilebot.push(QQdvbkbot3Matches[j]);
              }
            }
          }
        }

        const QQdvbkbot4Matches = str.match(QQdvbkbot4Regexp);
        // console.log(QQdvbkbot4Matches);  //测试
        if (QQdvbkbot4Matches) {
          const QQdvbkbot4MatchesLength = QQdvbkbot4Matches.length;
          // console.log("QQdvbkbot4MatchesLength : " + QQdvbkbot4MatchesLength);  //测试
          if (QQdvbkbot4MatchesLength > 0) {
            for (let j = 0; j < QQdvbkbot4MatchesLength; j++) {
              if (QQdvbkbot4Matches[j]) {
                QQfilebot.push(QQdvbkbot4Matches[j]);
              }
            }
          }
        }

        const QQdvbkbot5Matches = str.match(QQdvbkbot5Regexp);
        // console.log(QQdvbkbot5Matches);  //测试
        if (QQdvbkbot5Matches) {
          const QQdvbkbot5MatchesLength = QQdvbkbot5Matches.length;
          // console.log("QQdvbkbot5MatchesLength : " + QQdvbkbot5MatchesLength);  //测试
          if (QQdvbkbot5MatchesLength > 0) {
            for (let j = 0; j < QQdvbkbot5MatchesLength; j++) {
              if (QQdvbkbot5Matches[j]) {
                QQfilebot.push(QQdvbkbot5Matches[j]);
              }
            }
          }
        }

        const QQdvbkbot6Matches = str.match(QQdvbkbot6Regexp);
        // console.log(QQdvbkbot6Matches);  //测试
        if (QQdvbkbot6Matches) {
          const QQdvbkbot6MatchesLength = QQdvbkbot6Matches.length;
          // console.log("QQdvbkbot6MatchesLength : " + QQdvbkbot6MatchesLength);  //测试
          if (QQdvbkbot6MatchesLength > 0) {
            for (let j = 0; j < QQdvbkbot6MatchesLength; j++) {
              if (QQdvbkbot6Matches[j]) {
                QQfilebot.push(QQdvbkbot6Matches[j]);
              }
            }
          }
        }

        const QQdvbkbot7Matches = str.match(QQdvbkbot7Regexp);
        // console.log(QQdvbkbot7Matches);  //测试
        if (QQdvbkbot7Matches) {
          const QQdvbkbot7MatchesLength = QQdvbkbot7Matches.length;
          // console.log("QQdvbkbot7MatchesLength : " + QQdvbkbot7MatchesLength);  //测试
          if (QQdvbkbot7MatchesLength > 0) {
            for (let j = 0; j < QQdvbkbot7MatchesLength; j++) {
              if (QQdvbkbot7Matches[j]) {
                QQfilebot.push(QQdvbkbot7Matches[j]);
              }
            }
          }
        }

        // const QQer16botMatches = str.match(QQer16botRegexp);
        // // console.log(QQer16botMatches);  //测试
        // if (QQer16botMatches) {
        //   const QQer16botMatchesLength = QQer16botMatches.length;
        //   // console.log("QQer16botMatchesLength : " + QQer16botMatchesLength);  //测试
        //   if (QQer16botMatchesLength > 0) {
        //     for (let j = 0; j < QQer16botMatchesLength; j++) {
        //       if (QQer16botMatches[j]) {
        //         QQfilebot.push(QQer16botMatches[j]);
        //       }
        //     }
        //   }
        // }

        const QQer16bot1Matches = str.match(QQer16bot1Regexp);
        // console.log(QQer16bot1Matches);  //测试
        if (QQer16bot1Matches) {
          const QQer16bot1MatchesLength = QQer16bot1Matches.length;
          // console.log("QQer16bot1MatchesLength : " + QQer16bot1MatchesLength);  //测试
          if (QQer16bot1MatchesLength > 0) {
            for (let j = 0; j < QQer16bot1MatchesLength; j++) {
              if (QQer16bot1Matches[j]) {
                QQfilebot.push(QQer16bot1Matches[j]);
              }
            }
          }
        }

        const QQer16bot2Matches = str.match(QQer16bot2Regexp);
        // console.log(QQer16bot2Matches);  //测试
        if (QQer16bot2Matches) {
          const QQer16bot2MatchesLength = QQer16bot2Matches.length;
          // console.log("QQer16bot2MatchesLength : " + QQer16bot2MatchesLength);  //测试
          if (QQer16bot2MatchesLength > 0) {
            for (let j = 0; j < QQer16bot2MatchesLength; j++) {
              if (QQer16bot2Matches[j]) {
                QQfilebot.push(QQer16bot2Matches[j]);
              }
            }
          }
        }

        const QQer16bot3Matches = str.match(QQer16bot3Regexp);
        // console.log(QQer16bot3Matches);  //测试
        if (QQer16bot3Matches) {
          const QQer16bot3MatchesLength = QQer16bot3Matches.length;
          // console.log("QQer16bot3MatchesLength : " + QQer16bot3MatchesLength);  //测试
          if (QQer16bot3MatchesLength > 0) {
            for (let j = 0; j < QQer16bot3MatchesLength; j++) {
              if (QQer16bot3Matches[j]) {
                QQfilebot.push(QQer16bot3Matches[j]);
              }
            }
          }
        }

        const QQer16bot4Matches = str.match(QQer16bot4Regexp);
        // console.log(QQer16bot4Matches);  //测试
        if (QQer16bot4Matches) {
          const QQer16bot4MatchesLength = QQer16bot4Matches.length;
          // console.log("QQer16bot4MatchesLength : " + QQer16bot4MatchesLength);  //测试
          if (QQer16bot4MatchesLength > 0) {
            for (let j = 0; j < QQer16bot4MatchesLength; j++) {
              if (QQer16bot4Matches[j]) {
                QQfilebot.push(QQer16bot4Matches[j]);
              }
            }
          }
        }

        const QQer16bot5Matches = str.match(QQer16bot5Regexp);
        // console.log(QQer16bot5Matches);  //测试
        if (QQer16bot5Matches) {
          const QQer16bot5MatchesLength = QQer16bot5Matches.length;
          // console.log("QQer16bot5MatchesLength : " + QQer16bot5MatchesLength);  //测试
          if (QQer16bot5MatchesLength > 0) {
            for (let j = 0; j < QQer16bot5MatchesLength; j++) {
              if (QQer16bot5Matches[j]) {
                QQfilebot.push(QQer16bot5Matches[j]);
              }
            }
          }
        }

        const QQer16bot6Matches = str.match(QQer16bot6Regexp);
        // console.log(QQer16bot6Matches);  //测试
        if (QQer16bot6Matches) {
          const QQer16bot6MatchesLength = QQer16bot6Matches.length;
          // console.log("QQer16bot6MatchesLength : " + QQer16bot6MatchesLength);  //测试
          if (QQer16bot6MatchesLength > 0) {
            for (let j = 0; j < QQer16bot6MatchesLength; j++) {
              if (QQer16bot6Matches[j]) {
                QQfilebot.push(QQer16bot6Matches[j]);
              }
            }
          }
        }

        const QQer16bot7Matches = str.match(QQer16bot7Regexp);
        // console.log(QQer16bot7Matches);  //测试
        if (QQer16bot7Matches) {
          const QQer16bot7MatchesLength = QQer16bot7Matches.length;
          // console.log("QQer16bot7MatchesLength : " + QQer16bot7MatchesLength);  //测试
          if (QQer16bot7MatchesLength > 0) {
            for (let j = 0; j < QQer16bot7MatchesLength; j++) {
              if (QQer16bot7Matches[j]) {
                QQfilebot.push(QQer16bot7Matches[j]);
              }
            }
          }
        }

        // const QQan4cbotMatches = str.match(QQan4cbotRegexp);
        // // console.log(QQan4cbotMatches);  //测试
        // if (QQan4cbotMatches) {
        //   const QQan4cbotMatchesLength = QQan4cbotMatches.length;
        //   // console.log("QQan4cbotMatchesLength : " + QQan4cbotMatchesLength);  //测试
        //   if (QQan4cbotMatchesLength > 0) {
        //     for (let j = 0; j < QQan4cbotMatchesLength; j++) {
        //       if (QQan4cbotMatches[j]) {
        //         QQfilebot.push(QQan4cbotMatches[j]);
        //       }
        //     }
        //   }
        // }

        const QQan4cbot1Matches = str.match(QQan4cbot1Regexp);
        // console.log(QQan4cbot1Matches);  //测试
        if (QQan4cbot1Matches) {
          const QQan4cbot1MatchesLength = QQan4cbot1Matches.length;
          // console.log("QQan4cbot1MatchesLength : " + QQan4cbot1MatchesLength);  //测试
          if (QQan4cbot1MatchesLength > 0) {
            for (let j = 0; j < QQan4cbot1MatchesLength; j++) {
              if (QQan4cbot1Matches[j]) {
                QQfilebot.push(QQan4cbot1Matches[j]);
              }
            }
          }
        }

        const QQan4cbot2Matches = str.match(QQan4cbot2Regexp);
        // console.log(QQan4cbot2Matches);  //测试
        if (QQan4cbot2Matches) {
          const QQan4cbot2MatchesLength = QQan4cbot2Matches.length;
          // console.log("QQan4cbot2MatchesLength : " + QQan4cbot2MatchesLength);  //测试
          if (QQan4cbot2MatchesLength > 0) {
            for (let j = 0; j < QQan4cbot2MatchesLength; j++) {
              if (QQan4cbot2Matches[j]) {
                QQfilebot.push(QQan4cbot2Matches[j]);
              }
            }
          }
        }

        const QQan4cbot3Matches = str.match(QQan4cbot3Regexp);
        // console.log(QQan4cbot3Matches);  //测试
        if (QQan4cbot3Matches) {
          const QQan4cbot3MatchesLength = QQan4cbot3Matches.length;
          // console.log("QQan4cbot3MatchesLength : " + QQan4cbot3MatchesLength);  //测试
          if (QQan4cbot3MatchesLength > 0) {
            for (let j = 0; j < QQan4cbot3MatchesLength; j++) {
              if (QQan4cbot3Matches[j]) {
                QQfilebot.push(QQan4cbot3Matches[j]);
              }
            }
          }
        }

        const QQan4cbot4Matches = str.match(QQan4cbot4Regexp);
        // console.log(QQan4cbot4Matches);  //测试
        if (QQan4cbot4Matches) {
          const QQan4cbot4MatchesLength = QQan4cbot4Matches.length;
          // console.log("QQan4cbot4MatchesLength : " + QQan4cbot4MatchesLength);  //测试
          if (QQan4cbot4MatchesLength > 0) {
            for (let j = 0; j < QQan4cbot4MatchesLength; j++) {
              if (QQan4cbot4Matches[j]) {
                QQfilebot.push(QQan4cbot4Matches[j]);
              }
            }
          }
        }

        const QQan4cbot5Matches = str.match(QQan4cbot5Regexp);
        // console.log(QQan4cbot5Matches);  //测试
        if (QQan4cbot5Matches) {
          const QQan4cbot5MatchesLength = QQan4cbot5Matches.length;
          // console.log("QQan4cbot5MatchesLength : " + QQan4cbot5MatchesLength);  //测试
          if (QQan4cbot5MatchesLength > 0) {
            for (let j = 0; j < QQan4cbot5MatchesLength; j++) {
              if (QQan4cbot5Matches[j]) {
                QQfilebot.push(QQan4cbot5Matches[j]);
              }
            }
          }
        }

        const QQan4cbot6Matches = str.match(QQan4cbot6Regexp);
        // console.log(QQan4cbot6Matches);  //测试
        if (QQan4cbot6Matches) {
          const QQan4cbot6MatchesLength = QQan4cbot6Matches.length;
          // console.log("QQan4cbot6MatchesLength : " + QQan4cbot6MatchesLength);  //测试
          if (QQan4cbot6MatchesLength > 0) {
            for (let j = 0; j < QQan4cbot6MatchesLength; j++) {
              if (QQan4cbot6Matches[j]) {
                QQfilebot.push(QQan4cbot6Matches[j]);
              }
            }
          }
        }

        const QQan4cbot7Matches = str.match(QQan4cbot7Regexp);
        // console.log(QQan4cbot7Matches);  //测试
        if (QQan4cbot7Matches) {
          const QQan4cbot7MatchesLength = QQan4cbot7Matches.length;
          // console.log("QQan4cbot7MatchesLength : " + QQan4cbot7MatchesLength);  //测试
          if (QQan4cbot7MatchesLength > 0) {
            for (let j = 0; j < QQan4cbot7MatchesLength; j++) {
              if (QQan4cbot7Matches[j]) {
                QQfilebot.push(QQan4cbot7Matches[j]);
              }
            }
          }
        }

        // // const ZhuahihaibotMatches = str.match(ZhuahihaibotRegexp);
        // // // console.log(ZhuahihaibotMatches);  //测试
        // // if (ZhuahihaibotMatches) {
        // //   const ZhuahihaibotMatchesLength = ZhuahihaibotMatches.length;
        // //   // console.log("ZhuahihaibotMatchesLength : " + ZhuahihaibotMatchesLength);  //测试
        // //   if (ZhuahihaibotMatchesLength > 0) {
        // //     for (let j = 0; j < ZhuahihaibotMatchesLength; j++) {
        // //       if (ZhuahihaibotMatches[j]) {
        // //         Zhuahihaibot.push(ZhuahihaibotMatches[j]);
        // //       }
        // //     }
        // //   }
        // // }

        // const Zhuahihaibot1Matches = str.match(Zhuahihaibot1Regexp);
        // // console.log(Zhuahihaibot1Matches);  //测试
        // if (Zhuahihaibot1Matches) {
        //   const Zhuahihaibot1MatchesLength = Zhuahihaibot1Matches.length;
        //   // console.log("Zhuahihaibot1MatchesLength : " + Zhuahihaibot1MatchesLength);  //测试
        //   if (Zhuahihaibot1MatchesLength > 0) {
        //     for (let j = 0; j < Zhuahihaibot1MatchesLength; j++) {
        //       if (Zhuahihaibot1Matches[j]) {
        //         Zhuahihaibot.push(Zhuahihaibot1Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const Zhuahihaibot2Matches = str.match(Zhuahihaibot2Regexp);
        // // console.log(Zhuahihaibot2Matches);  //测试
        // if (Zhuahihaibot2Matches) {
        //   const Zhuahihaibot2MatchesLength = Zhuahihaibot2Matches.length;
        //   // console.log("Zhuahihaibot2MatchesLength : " + Zhuahihaibot2MatchesLength);  //测试
        //   if (Zhuahihaibot2MatchesLength > 0) {
        //     for (let j = 0; j < Zhuahihaibot2MatchesLength; j++) {
        //       if (Zhuahihaibot2Matches[j]) {
        //         Zhuahihaibot.push(Zhuahihaibot2Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const Zhuahihaibot3Matches = str.match(Zhuahihaibot3Regexp);
        // // console.log(Zhuahihaibot3Matches);  //测试
        // if (Zhuahihaibot3Matches) {
        //   const Zhuahihaibot3MatchesLength = Zhuahihaibot3Matches.length;
        //   // console.log("Zhuahihaibot3MatchesLength : " + Zhuahihaibot3MatchesLength);  //测试
        //   if (Zhuahihaibot3MatchesLength > 0) {
        //     for (let j = 0; j < Zhuahihaibot3MatchesLength; j++) {
        //       if (Zhuahihaibot3Matches[j]) {
        //         Zhuahihaibot.push(Zhuahihaibot3Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const Zhuahihaibot4Matches = str.match(Zhuahihaibot4Regexp);
        // // console.log(Zhuahihaibot4Matches);  //测试
        // if (Zhuahihaibot4Matches) {
        //   const Zhuahihaibot4MatchesLength = Zhuahihaibot4Matches.length;
        //   // console.log("Zhuahihaibot4MatchesLength : " + Zhuahihaibot4MatchesLength);  //测试
        //   if (Zhuahihaibot4MatchesLength > 0) {
        //     for (let j = 0; j < Zhuahihaibot4MatchesLength; j++) {
        //       if (Zhuahihaibot4Matches[j]) {
        //         Zhuahihaibot.push(Zhuahihaibot4Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const Zhuahihaibot5Matches = str.match(Zhuahihaibot5Regexp);
        // // console.log(Zhuahihaibot5Matches);  //测试
        // if (Zhuahihaibot5Matches) {
        //   const Zhuahihaibot5MatchesLength = Zhuahihaibot5Matches.length;
        //   // console.log("Zhuahihaibot5MatchesLength : " + Zhuahihaibot5MatchesLength);  //测试
        //   if (Zhuahihaibot5MatchesLength > 0) {
        //     for (let j = 0; j < Zhuahihaibot5MatchesLength; j++) {
        //       if (Zhuahihaibot5Matches[j]) {
        //         Zhuahihaibot.push(Zhuahihaibot5Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const Zhuahihaibot6Matches = str.match(Zhuahihaibot6Regexp);
        // // console.log(Zhuahihaibot6Matches);  //测试
        // if (Zhuahihaibot6Matches) {
        //   const Zhuahihaibot6MatchesLength = Zhuahihaibot6Matches.length;
        //   // console.log("Zhuahihaibot6MatchesLength : " + Zhuahihaibot6MatchesLength);  //测试
        //   if (Zhuahihaibot6MatchesLength > 0) {
        //     for (let j = 0; j < Zhuahihaibot6MatchesLength; j++) {
        //       if (Zhuahihaibot6Matches[j]) {
        //         Zhuahihaibot.push(Zhuahihaibot6Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const Zhuahihaibot7Matches = str.match(Zhuahihaibot7Regexp);
        // // console.log(Zhuahihaibot7Matches);  //测试
        // if (Zhuahihaibot7Matches) {
        //   const Zhuahihaibot7MatchesLength = Zhuahihaibot7Matches.length;
        //   // console.log("Zhuahihaibot7MatchesLength : " + Zhuahihaibot7MatchesLength);  //测试
        //   if (Zhuahihaibot7MatchesLength > 0) {
        //     for (let j = 0; j < Zhuahihaibot7MatchesLength; j++) {
        //       if (Zhuahihaibot7Matches[j]) {
        //         Zhuahihaibot.push(Zhuahihaibot7Matches[j]);
        //       }
        //     }
        //   }
        // }

        // const REDDFILEBOTMatches = str.match(REDDFILEBOTRegexp);
        // // console.log(REDDFILEBOTMatches);  //测试
        // if (REDDFILEBOTMatches) {
        //   const REDDFILEBOTMatchesLength = REDDFILEBOTMatches.length;
        //   // console.log("REDDFILEBOTMatchesLength : " + REDDFILEBOTMatchesLength);  //测试
        //   if (REDDFILEBOTMatchesLength > 0) {
        //     for (let j = 0; j < REDDFILEBOTMatchesLength; j++) {
        //       if (REDDFILEBOTMatches[j]) {
        //         REDDFILEBOT.push(REDDFILEBOTMatches[j]);
        //       }
        //     }
        //   }
        // }

        const wenjianjibotMatches = str.match(wenjianjibotRegexp);
        // console.log(wenjianjibotMatches);  //测试
        if (wenjianjibotMatches) {
          const wenjianjibotMatchesLength = wenjianjibotMatches.length;
          // console.log("wenjianjibotMatchesLength : " + wenjianjibotMatchesLength);  //测试
          if (wenjianjibotMatchesLength > 0) {
            for (let j = 0; j < wenjianjibotMatchesLength; j++) {
              if (wenjianjibotMatches[j]) {
                wenjianjibot.push(wenjianjibotMatches[j]);
              }
            }
          }
        }

        const amumujiemabotMatches = str.match(amumujiemabotRegexp);
        // console.log(amumujiemabotMatches);  //测试
        if (amumujiemabotMatches) {
          const amumujiemabotMatchesLength = amumujiemabotMatches.length;
          // console.log("amumujiemabotMatchesLength : " + amumujiemabotMatchesLength);  //测试
          if (amumujiemabotMatchesLength > 0) {
            for (let j = 0; j < amumujiemabotMatchesLength; j++) {
              if (amumujiemabotMatches[j]) {
                amumujiemabot.push(amumujiemabotMatches[j]);
              }
            }
          }
        }

        const parludecodingBotMatches = str.match(parludecodingBotRegexp);
        // console.log(parludecodingBotMatches);  //测试
        if (parludecodingBotMatches) {
          const parludecodingBotMatchesLength = parludecodingBotMatches.length;
          // console.log("parludecodingBotMatchesLength : " + parludecodingBotMatchesLength);  //测试
          if (parludecodingBotMatchesLength > 0) {
            for (let j = 0; j < parludecodingBotMatchesLength; j++) {
              if (parludecodingBotMatches[j]) {
                parludecodingBot.push(parludecodingBotMatches[j]);
              }
            }
          }
        }

        const teestpanbotMatches = str.match(teestpanbotRegexp);
        // console.log(teestpanbotMatches);  //测试
        if (teestpanbotMatches) {
          const teestpanbotMatchesLength = teestpanbotMatches.length;
          // console.log("teestpanbotMatchesLength : " + teestpanbotMatchesLength);  //测试
          if (teestpanbotMatchesLength > 0) {
            for (let j = 0; j < teestpanbotMatchesLength; j++) {
              if (teestpanbotMatches[j]) {
                teestpanbot.push(teestpanbotMatches[j]);
              }
            }
          }
        }

        const atfileslinksbotMatches = str.match(atfileslinksbotRegexp);
        // console.log(atfileslinksbotMatches);  //测试
        if (atfileslinksbotMatches) {
          const atfileslinksbotMatchesLength = atfileslinksbotMatches.length;
          // console.log("atfileslinksbotMatchesLength : " + atfileslinksbotMatchesLength);  //测试
          if (atfileslinksbotMatchesLength > 0) {
            for (let j = 0; j < atfileslinksbotMatchesLength; j++) {
              if (atfileslinksbotMatches[j]) {
                atfileslinksbot.push(atfileslinksbotMatches[j]);
              }
            }
          }
        }

        const lockHivebot1Matches = str.match(lockHivebot1Regexp);
        // console.log(lockHivebot1Matches);  //测试
        if (lockHivebot1Matches) {
          const lockHivebot1MatchesLength = lockHivebot1Matches.length;
          // console.log("lockHivebot1MatchesLength : " + lockHivebot1MatchesLength);  //测试
          if (lockHivebot1MatchesLength > 0) {
            for (let j = 0; j < lockHivebot1MatchesLength; j++) {
              if (lockHivebot1Matches[j]) {
                lockHivebot.push(lockHivebot1Matches[j]);
              }
            }
          }
        }

        const lockHivebot2Matches = str.match(lockHivebot2Regexp);
        // console.log(lockHivebot2Matches);  //测试
        if (lockHivebot2Matches) {
          const lockHivebot2MatchesLength = lockHivebot2Matches.length;
          // console.log("lockHivebot2MatchesLength : " + lockHivebot2MatchesLength);  //测试
          if (lockHivebot2MatchesLength > 0) {
            for (let j = 0; j < lockHivebot2MatchesLength; j++) {
              if (lockHivebot2Matches[j]) {
                lockHivebot.push(lockHivebot2Matches[j]);
              }
            }
          }
        }

        const tgdecoderbotMatches = str.match(tgdecoderbotRegexp);
        // console.log(tgdecoderbotMatches);  //测试
        if (tgdecoderbotMatches) {
          const tgdecoderbotMatchesLength = tgdecoderbotMatches.length;
          // console.log("tgdecoderbotMatchesLength : " + tgdecoderbotMatchesLength);  //测试
          if (tgdecoderbotMatchesLength > 0) {
            for (let j = 0; j < tgdecoderbotMatchesLength; j++) {
              if (tgdecoderbotMatches[j]) {
                tgdecoderbot.push(tgdecoderbotMatches[j]);
              }
            }
          }
        }

        // const tgdecoderbot1Matches = str.match(tgdecoderbot1Regexp);
        // // console.log(tgdecoderbot1Matches);  //测试
        // if (tgdecoderbot1Matches) {
        //   const tgdecoderbot1MatchesLength = tgdecoderbot1Matches.length;
        //   // console.log("tgdecoderbot1MatchesLength : " + tgdecoderbot1MatchesLength);  //测试
        //   if (tgdecoderbot1MatchesLength > 0) {
        //     for (let j = 0; j < tgdecoderbot1MatchesLength; j++) {
        //       if (tgdecoderbot1Matches[j]) {
        //         tgdecoderbot.push(tgdecoderbot1Matches[j]);
        //       }
        //     }
        //   }
        // }

        const ZYXFilesBotMatches = str.match(ZYXFilesBotRegexp);
        // console.log(ZYXFilesBotMatches);  //测试
        if (ZYXFilesBotMatches) {
          const ZYXFilesBotMatchesLength = ZYXFilesBotMatches.length;
          // console.log("ZYXFilesBotMatchesLength : " + ZYXFilesBotMatchesLength);  //测试
          if (ZYXFilesBotMatchesLength > 0) {
            for (let j = 0; j < ZYXFilesBotMatchesLength; j++) {
              if (ZYXFilesBotMatches[j]) {
                ZYXFilesBot.push(ZYXFilesBotMatches[j].replace("📌 取件码：", ""));
              }
            }
          }
        }

        const ntmjmqbotMatches = str.match(ntmjmqbotRegexp);
        // console.log(ntmjmqbotMatches);  //测试
        if (ntmjmqbotMatches) {
          const ntmjmqbotMatchesLength = ntmjmqbotMatches.length;
          // console.log("ntmjmqbotMatchesLength : " + ntmjmqbotMatchesLength);  //测试
          if (ntmjmqbotMatchesLength > 0) {
            for (let j = 0; j < ntmjmqbotMatchesLength; j++) {
              if (ntmjmqbotMatches[j]) {
                ntmjmqbot.push(ntmjmqbotMatches[j]);
              }
            }
          }
        }

        const newjmqbotMatches = str.match(newjmqbotRegexp);
        // console.log(newjmqbotMatches);  //测试
        if (newjmqbotMatches) {
          const newjmqbotMatchesLength = newjmqbotMatches.length;
          // console.log("newjmqbotMatchesLength : " + newjmqbotMatchesLength);  //测试
          if (newjmqbotMatchesLength > 0) {
            for (let j = 0; j < newjmqbotMatchesLength; j++) {
              if (newjmqbotMatches[j]) {
                newjmqbot.push(newjmqbotMatches[j]);
              }
            }
          }
        }

        const filepanbotMatches = str.match(filepanbotRegexp);
        // console.log(filepanbotMatches);  //测试
        if (filepanbotMatches) {
          const filepanbotMatchesLength = filepanbotMatches.length;
          // console.log("filepanbotMatchesLength : " + filepanbotMatchesLength);  //测试
          if (filepanbotMatchesLength > 0) {
            for (let j = 0; j < filepanbotMatchesLength; j++) {
              if (filepanbotMatches[j]) {
                filepanbot.push(filepanbotMatches[j]);
              }
            }
          }
        }

        const myseseXBotMatches = str.match(myseseXBotRegexp);
        // console.log(myseseXBotMatches);  //测试
        if (myseseXBotMatches) {
          const myseseXBotMatchesLength = myseseXBotMatches.length;
          // console.log("myseseXBotMatchesLength : " + myseseXBotMatchesLength);  //测试
          if (myseseXBotMatchesLength > 0) {
            for (let j = 0; j < myseseXBotMatchesLength; j++) {
              if (myseseXBotMatches[j]) {
                myseseXBot.push(myseseXBotMatches[j]);
              }
            }
          }
        }

        const save2BoxBotMatches = str.match(save2BoxBotRegexp);
        // console.log(save2BoxBotMatches);  //测试
        if (save2BoxBotMatches) {
          const save2BoxBotMatchesLength = save2BoxBotMatches.length;
          // console.log("save2BoxBotMatchesLength : " + save2BoxBotMatchesLength);  //测试
          if (save2BoxBotMatchesLength > 0) {
            for (let j = 0; j < save2BoxBotMatchesLength; j++) {
              if (save2BoxBotMatches[j]) {
                save2BoxBot.push(save2BoxBotMatches[j]);
              }
            }
          }
        }

        const mtfxqbotMatches = str.match(mtfxqbotRegexp);
        // console.log(mtfxqbotMatches);  //测试
        if (mtfxqbotMatches) {
          const mtfxqbotMatchesLength = mtfxqbotMatches.length;
          // console.log("mtfxqbotMatchesLength : " + mtfxqbotMatchesLength);  //测试
          if (mtfxqbotMatchesLength > 0) {
            for (let j = 0; j < mtfxqbotMatchesLength; j++) {
              if (mtfxqbotMatches[j]) {
                mtfxqbot.push(mtfxqbotMatches[j]);
              }
            }
          }
        }

        const mtfxq2botMatches = str.match(mtfxq2botRegexp);
        // console.log(mtfxq2botMatches);  //测试
        if (mtfxq2botMatches) {
          const mtfxq2botMatchesLength = mtfxq2botMatches.length;
          // console.log("mtfxq2botMatchesLength : " + mtfxq2botMatchesLength);  //测试
          if (mtfxq2botMatchesLength > 0) {
            for (let j = 0; j < mtfxq2botMatchesLength; j++) {
              if (mtfxq2botMatches[j]) {
                mtfxq2bot.push(mtfxq2botMatches[j]);
              }
            }
          }
        }

        const grpMatches = str.match(grpRegexp);
        // console.log(grpMatches);  //测试
        if (grpMatches) {
          const grpMatchesLength = grpMatches.length;
          // console.log("grpMatchesLength : " + grpMatchesLength);  //测试
          if (grpMatchesLength > 0) {
            for (let j = 0; j < grpMatchesLength; j++) {
              if (grpMatches[j]) {
                mediaBK2Bot.push(grpMatches[j]);
              }
            }
          }
        }

        const mdaMatches = str.match(mdaRegexp);
        // console.log(mdaMatches);  //测试
        if (mdaMatches) {
          const mdaMatchesLength = mdaMatches.length;
          // console.log("mdaMatchesLength : " + mdaMatchesLength);  //测试
          if (mdaMatchesLength > 0) {
            for (let j = 0; j < mdaMatchesLength; j++) {
              if (mdaMatches[j]) {
                mediaBK2Bot.push(mdaMatches[j]);
              }
            }
          }
        }

        const v_Matches = str.match(v_Regexp);
        // console.log(v_Matches);  //测试
        if (v_Matches) {
          const v_MatchesLength = v_Matches.length;
          // console.log("v_MatchesLength : " + v_MatchesLength);  //测试
          if (v_MatchesLength > 0) {
            for (let j = 0; j < v_MatchesLength; j++) {
              if (v_Matches[j]) {
                mouseFilebot.push(v_Matches[j]);
              }
            }
          }
        }

        const vi_Matches = str.match(vi_Regexp);
        // console.log(vi_Matches);  //测试
        if (vi_Matches) {
          const vi_MatchesLength = vi_Matches.length;
          // console.log("vi_MatchesLength : " + vi_MatchesLength);  //测试
          if (vi_MatchesLength > 0) {
            for (let j = 0; j < vi_MatchesLength; j++) {
              if (vi_Matches[j]) {
                mouseFilebot.push(vi_Matches[j]);
              }
            }
          }
        }

        const p_Matches = str.match(p_Regexp);
        // console.log(p_Matches);  //测试
        if (p_Matches) {
          const p_MatchesLength = p_Matches.length;
          // console.log("p_MatchesLength : " + p_MatchesLength);  //测试
          if (p_MatchesLength > 0) {
            for (let j = 0; j < p_MatchesLength; j++) {
              if (p_Matches[j]) {
                mouseFilebot.push(p_Matches[j]);
              }
            }
          }
        }

        const d_Matches = str.match(d_Regexp);
        // console.log(d_Matches);  //测试
        if (d_Matches) {
          const d_MatchesLength = d_Matches.length;
          // console.log("d_MatchesLength : " + d_MatchesLength);  //测试
          if (d_MatchesLength > 0) {
            for (let j = 0; j < d_MatchesLength; j++) {
              if (d_Matches[j]) {
                mouseFilebot.push(d_Matches[j]);
              }
            }
          }
        }

        const P_DataPanBotMatches = str.match(P_DataPanBotRegexp);
        // console.log(P_DataPanBotMatches);  //测试
        if (P_DataPanBotMatches) {
          const P_DataPanBotMatchesLength = P_DataPanBotMatches.length;
          // console.log("P_DataPanBotMatchesLength : " + P_DataPanBotMatchesLength);  //测试
          if (P_DataPanBotMatchesLength > 0) {
            for (let j = 0; j < P_DataPanBotMatchesLength; j++) {
              if (P_DataPanBotMatches[j]) {
                dataPanBot.push(P_DataPanBotMatches[j]);
              }
            }
          }
        }

        const V_DataPanBotMatches = str.match(V_DataPanBotRegexp);
        // console.log(V_DataPanBotMatches);  //测试
        if (V_DataPanBotMatches) {
          const V_DataPanBotMatchesLength = V_DataPanBotMatches.length;
          // console.log("V_DataPanBotMatchesLength : " + V_DataPanBotMatchesLength);  //测试
          if (V_DataPanBotMatchesLength > 0) {
            for (let j = 0; j < V_DataPanBotMatchesLength; j++) {
              if (V_DataPanBotMatches[j]) {
                dataPanBot.push(V_DataPanBotMatches[j]);
              }
            }
          }
        }

        const D_DataPanBotMatches = str.match(D_DataPanBotRegexp);
        // console.log(D_DataPanBotMatches);  //测试
        if (D_DataPanBotMatches) {
          const D_DataPanBotMatchesLength = D_DataPanBotMatches.length;
          // console.log("D_DataPanBotMatchesLength : " + D_DataPanBotMatchesLength);  //测试
          if (D_DataPanBotMatchesLength > 0) {
            for (let j = 0; j < D_DataPanBotMatchesLength; j++) {
              if (D_DataPanBotMatches[j]) {
                dataPanBot.push(D_DataPanBotMatches[j]);
              }
            }
          }
        }

        const p_FilesPan1BotMatches = str.match(p_FilesPan1BotRegexp);
        // console.log(p_FilesPan1BotMatches);  //测试
        if (p_FilesPan1BotMatches) {
          const p_FilesPan1BotMatchesLength = p_FilesPan1BotMatches.length;
          // console.log("p_FilesPan1BotMatchesLength : " + p_FilesPan1BotMatchesLength);  //测试
          if (p_FilesPan1BotMatchesLength > 0) {
            for (let j = 0; j < p_FilesPan1BotMatchesLength; j++) {
              if (p_FilesPan1BotMatches[j]) {
                filesPan1Bot.push(p_FilesPan1BotMatches[j]);
              }
            }
          }
        }

        const v_FilesPan1BotMatches = str.match(v_FilesPan1BotRegexp);
        // console.log(v_FilesPan1BotMatches);  //测试
        if (v_FilesPan1BotMatches) {
          const v_FilesPan1BotMatchesLength = v_FilesPan1BotMatches.length;
          // console.log("v_FilesPan1BotMatchesLength : " + v_FilesPan1BotMatchesLength);  //测试
          if (v_FilesPan1BotMatchesLength > 0) {
            for (let j = 0; j < v_FilesPan1BotMatchesLength; j++) {
              if (v_FilesPan1BotMatches[j]) {
                filesPan1Bot.push(v_FilesPan1BotMatches[j]);
              }
            }
          }
        }

        // break;  //测试
      }
    }
  } else {
    console.log("split错误");
  }

  all += showfilesbot.length;
  console.log("showfilesbot : " + showfilesbot.length);  //测试
  if (showfilesbot.length > 0) {
    const data = fs.readFileSync("./code/showfilesbot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...showfilesbot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/showfilesbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += tgjmqbot.length;
  console.log("tgjmqbot : " + tgjmqbot.length);  //测试
  if (tgjmqbot.length > 0) {
    const data = fs.readFileSync("./code/tgjmqbot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...tgjmqbot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/tgjmqbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += blgjlqbot.length;
  console.log("blgjlqbot : " + blgjlqbot.length);  //测试
  if (blgjlqbot.length > 0) {
    const data = fs.readFileSync("./code/blgjlqbot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...blgjlqbot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/blgjlqbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += fileLeakBot.length;
  console.log("fileLeakBot : " + fileLeakBot.length);  //测试
  if (fileLeakBot.length > 0) {
    const data = fs.readFileSync("./code/fileLeakBot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...fileLeakBot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/fileLeakBot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += nnfilebot.length;
  console.log("nnfilebot : " + nnfilebot.length);  //测试
  if (nnfilebot.length > 0) {
    const data = fs.readFileSync("./code/nnfilebot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...nnfilebot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/nnfilebot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += tangBRebot.length;
  console.log("tangBRebot : " + tangBRebot.length);  //测试
  if (tangBRebot.length > 0) {
    const data = fs.readFileSync("./code/tangBRebot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...tangBRebot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/tangBRebot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += decoderrobot.length;
  console.log("decoderrobot : " + decoderrobot.length);  //测试
  if (decoderrobot.length > 0) {
    const data = fs.readFileSync("./code/decoderrobot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...decoderrobot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/decoderrobot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  // all += tebiejiebot.length;
  // console.log("tebiejiebot : " + tebiejiebot.length);  //测试
  // if (tebiejiebot.length > 0) {
  //   const data = fs.readFileSync("./code/tebiejiebot.txt", "utf-8");
  //   try {
  //     let uniqueArr = JSON.parse(data);
  //     const oldLength = uniqueArr.length;
  //     uniqueArr = [...uniqueArr, ...tebiejiebot];
  //     uniqueArr = [...new Set(uniqueArr)];
  //     if (uniqueArr.length > oldLength) {
  //       fs.writeFile("./code/tebiejiebot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
  //         if (err) {
  //           console.log(err);
  //         }
  //       });
  //     // } else {
  //     //   console.log("没有新加数据");
  //     }
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  all += mmyzybot.length;
  console.log("mmyzybot : " + mmyzybot.length);  //测试
  if (mmyzybot.length > 0) {
    const data = fs.readFileSync("./code/mmyzybot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...mmyzybot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/mmyzybot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  // all += paniangbot.length;
  // console.log("paniangbot : " + paniangbot.length);  //测试
  // if (paniangbot.length > 0) {
  //   const data = fs.readFileSync("./code/paniangbot.txt", "utf-8");
  //   try {
  //     let uniqueArr = JSON.parse(data);
  //     const oldLength = uniqueArr.length;
  //     uniqueArr = [...uniqueArr, ...paniangbot];
  //     uniqueArr = [...new Set(uniqueArr)];
  //     if (uniqueArr.length > oldLength) {
  //       fs.writeFile("./code/paniangbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
  //         if (err) {
  //           console.log(err);
  //         }
  //       });
  //     // } else {
  //     //   console.log("没有新加数据");
  //     }
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  // all += kkjmqmbot.length;
  // console.log("kkjmqmbot : " + kkjmqmbot.length);  //测试
  // if (kkjmqmbot.length > 0) {
  //   const data = fs.readFileSync("./code/kkjmqmbot.txt", "utf-8");
  //   try {
  //     let uniqueArr = JSON.parse(data);
  //     const oldLength = uniqueArr.length;
  //     uniqueArr = [...uniqueArr, ...kkjmqmbot];
  //     uniqueArr = [...new Set(uniqueArr)];
  //     if (uniqueArr.length > oldLength) {
  //       fs.writeFile("./code/kkjmqmbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
  //         if (err) {
  //           console.log(err);
  //         }
  //       });
  //     // } else {
  //     //   console.log("没有新加数据");
  //     }
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  // all += KodeXFilesbot.length;
  // console.log("KodeXFilesbot : " + KodeXFilesbot.length);  //测试
  // if (KodeXFilesbot.length > 0) {
  //   const data = fs.readFileSync("./code/KodeXFilesbot.txt", "utf-8");
  //   try {
  //     let uniqueArr = JSON.parse(data);
  //     const oldLength = uniqueArr.length;
  //     uniqueArr = [...uniqueArr, ...KodeXFilesbot];
  //     uniqueArr = [...new Set(uniqueArr)];
  //     if (uniqueArr.length > oldLength) {
  //       fs.writeFile("./code/KodeXFilesbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
  //         if (err) {
  //           console.log(err);
  //         }
  //       });
  //     // } else {
  //     //   console.log("没有新加数据");
  //     }
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  // all += kodexfilebot.length;
  // console.log("kodexfilebot : " + kodexfilebot.length);  //测试
  // if (kodexfilebot.length > 0) {
  //   const data = fs.readFileSync("./code/kodexfilebot.txt", "utf-8");
  //   try {
  //     let uniqueArr = JSON.parse(data);
  //     const oldLength = uniqueArr.length;
  //     uniqueArr = [...uniqueArr, ...kodexfilebot];
  //     uniqueArr = [...new Set(uniqueArr)];
  //     if (uniqueArr.length > oldLength) {
  //       fs.writeFile("./code/kodexfilebot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
  //         if (err) {
  //           console.log(err);
  //         }
  //       });
  //     // } else {
  //     //   console.log("没有新加数据");
  //     }
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  // all += KodeXMedia1bot.length;
  // console.log("KodeXMedia1bot : " + KodeXMedia1bot.length);  //测试
  // if (KodeXMedia1bot.length > 0) {
  //   const data = fs.readFileSync("./code/KodeXMedia1bot.txt", "utf-8");
  //   try {
  //     let uniqueArr = JSON.parse(data);
  //     const oldLength = uniqueArr.length;
  //     uniqueArr = [...uniqueArr, ...KodeXMedia1bot];
  //     uniqueArr = [...new Set(uniqueArr)];
  //     if (uniqueArr.length > oldLength) {
  //       fs.writeFile("./code/KodeXMedia1bot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
  //         if (err) {
  //           console.log(err);
  //         }
  //       });
  //     // } else {
  //     //   console.log("没有新加数据");
  //     }
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  // all += AllXFilesbot.length;
  // console.log("AllXFilesbot : " + AllXFilesbot.length);  //测试
  // if (AllXFilesbot.length > 0) {
  //   const data = fs.readFileSync("./code/AllXFilesbot.txt", "utf-8");
  //   try {
  //     let uniqueArr = JSON.parse(data);
  //     const oldLength = uniqueArr.length;
  //     uniqueArr = [...uniqueArr, ...AllXFilesbot];
  //     uniqueArr = [...new Set(uniqueArr)];
  //     if (uniqueArr.length > oldLength) {
  //       fs.writeFile("./code/AllXFilesbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
  //         if (err) {
  //           console.log(err);
  //         }
  //       });
  //     // } else {
  //     //   console.log("没有新加数据");
  //     }
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  // all += MediaXFilebot.length;
  // console.log("MediaXFilebot : " + MediaXFilebot.length);  //测试
  // if (MediaXFilebot.length > 0) {
  //   const data = fs.readFileSync("./code/MediaXFilebot.txt", "utf-8");
  //   try {
  //     let uniqueArr = JSON.parse(data);
  //     const oldLength = uniqueArr.length;
  //     uniqueArr = [...uniqueArr, ...MediaXFilebot];
  //     uniqueArr = [...new Set(uniqueArr)];
  //     if (uniqueArr.length > oldLength) {
  //       fs.writeFile("./code/MediaXFilebot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
  //         if (err) {
  //           console.log(err);
  //         }
  //       });
  //     // } else {
  //     //   console.log("没有新加数据");
  //     }
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  all += KodeXFiles2bot.length;
  console.log("KodeXFiles2bot : " + KodeXFiles2bot.length);  //测试
  if (KodeXFiles2bot.length > 0) {
    const data = fs.readFileSync("./code/KodeXFiles2bot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...KodeXFiles2bot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/KodeXFiles2bot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  // all += DEANIgniteNationsbot.length;
  // console.log("DEANIgniteNationsbot : " + DEANIgniteNationsbot.length);  //测试
  // if (DEANIgniteNationsbot.length > 0) {
  //   const data = fs.readFileSync("./code/DEANIgniteNationsbot.txt", "utf-8");
  //   try {
  //     let uniqueArr = JSON.parse(data);
  //     const oldLength = uniqueArr.length;
  //     uniqueArr = [...uniqueArr, ...DEANIgniteNationsbot];
  //     uniqueArr = [...new Set(uniqueArr)];
  //     if (uniqueArr.length > oldLength) {
  //       fs.writeFile("./code/DEANIgniteNationsbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
  //         if (err) {
  //           console.log(err);
  //         }
  //       });
  //     // } else {
  //     //   console.log("没有新加数据");
  //     }
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  all += RyumaSepongMilkubot.length;
  console.log("RyumaSepongMilkubot : " + RyumaSepongMilkubot.length);  //测试
  if (RyumaSepongMilkubot.length > 0) {
    const data = fs.readFileSync("./code/RyumaSepongMilkubot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...RyumaSepongMilkubot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/RyumaSepongMilkubot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  // all += HikkiTusbolPaijobot.length;
  // console.log("HikkiTusbolPaijobot : " + HikkiTusbolPaijobot.length);  //测试
  // if (HikkiTusbolPaijobot.length > 0) {
  //   const data = fs.readFileSync("./code/HikkiTusbolPaijobot.txt", "utf-8");
  //   try {
  //     let uniqueArr = JSON.parse(data);
  //     const oldLength = uniqueArr.length;
  //     uniqueArr = [...uniqueArr, ...HikkiTusbolPaijobot];
  //     uniqueArr = [...new Set(uniqueArr)];
  //     if (uniqueArr.length > oldLength) {
  //       fs.writeFile("./code/HikkiTusbolPaijobot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
  //         if (err) {
  //           console.log(err);
  //         }
  //       });
  //     // } else {
  //     //   console.log("没有新加数据");
  //     }
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  all += LunindiaCipokSuprettobot.length;
  console.log("LunindiaCipokSuprettobot : " + LunindiaCipokSuprettobot.length);  //测试
  if (LunindiaCipokSuprettobot.length > 0) {
    const data = fs.readFileSync("./code/LunindiaCipokSuprettobot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...LunindiaCipokSuprettobot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/LunindiaCipokSuprettobot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  // all += PaijoKontolBurikbot.length;
  // console.log("PaijoKontolBurikbot : " + PaijoKontolBurikbot.length);  //测试
  // if (PaijoKontolBurikbot.length > 0) {
  //   const data = fs.readFileSync("./code/PaijoKontolBurikbot.txt", "utf-8");
  //   try {
  //     let uniqueArr = JSON.parse(data);
  //     const oldLength = uniqueArr.length;
  //     uniqueArr = [...uniqueArr, ...PaijoKontolBurikbot];
  //     uniqueArr = [...new Set(uniqueArr)];
  //     if (uniqueArr.length > oldLength) {
  //       fs.writeFile("./code/PaijoKontolBurikbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
  //         if (err) {
  //           console.log(err);
  //         }
  //       });
  //     // } else {
  //     //   console.log("没有新加数据");
  //     }
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  all += Steviarchiverbot.length;
  console.log("Steviarchiverbot : " + Steviarchiverbot.length);  //测试
  if (Steviarchiverbot.length > 0) {
    const data = fs.readFileSync("./code/Steviarchiverbot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...Steviarchiverbot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/Steviarchiverbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += DghuddvhiBOT.length;
  console.log("DghuddvhiBOT : " + DghuddvhiBOT.length);  //测试
  if (DghuddvhiBOT.length > 0) {
    const data = fs.readFileSync("./code/DghuddvhiBOT.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...DghuddvhiBOT];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/DghuddvhiBOT.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += Hijautebalbot.length;
  console.log("Hijautebalbot : " + Hijautebalbot.length);  //测试
  if (Hijautebalbot.length > 0) {
    const data = fs.readFileSync("./code/Hijautebalbot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...Hijautebalbot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/Hijautebalbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += FilesHubRobot.length;
  console.log("FilesHubRobot : " + FilesHubRobot.length);  //测试
  if (FilesHubRobot.length > 0) {
    const data = fs.readFileSync("./code/FilesHubRobot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...FilesHubRobot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/FilesHubRobot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += filespanindobot.length;
  console.log("filespanindobot : " + filespanindobot.length);  //测试
  if (filespanindobot.length > 0) {
    const data = fs.readFileSync("./code/filespanindobot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...filespanindobot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/filespanindobot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += KodeXChatsINDbot.length;
  console.log("KodeXChatsINDbot : " + KodeXChatsINDbot.length);  //测试
  if (KodeXChatsINDbot.length > 0) {
    const data = fs.readFileSync("./code/KodeXChatsINDbot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...KodeXChatsINDbot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/KodeXChatsINDbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += MassFilesStoreBot.length;
  console.log("MassFilesStoreBot : " + MassFilesStoreBot.length);  //测试
  if (MassFilesStoreBot.length > 0) {
    const data = fs.readFileSync("./code/MassFilesStoreBot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...MassFilesStoreBot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/MassFilesStoreBot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += betapahatitakbahagiabot.length;
  console.log("betapahatitakbahagiabot : " + betapahatitakbahagiabot.length);  //测试
  if (betapahatitakbahagiabot.length > 0) {
    const data = fs.readFileSync("./code/betapahatitakbahagiabot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...betapahatitakbahagiabot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/betapahatitakbahagiabot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += QQfilebot.length;
  console.log("QQfilebot : " + QQfilebot.length);  //测试
  if (QQfilebot.length > 0) {
    const data = fs.readFileSync("./code/QQfilebot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...QQfilebot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/QQfilebot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  // all += Zhuahihaibot.length;
  // console.log("Zhuahihaibot : " + Zhuahihaibot.length);  //测试
  // if (Zhuahihaibot.length > 0) {
  //   const data = fs.readFileSync("./code/Zhuahihaibot.txt", "utf-8");
  //   try {
  //     let uniqueArr = JSON.parse(data);
  //     const oldLength = uniqueArr.length;
  //     uniqueArr = [...uniqueArr, ...Zhuahihaibot];
  //     uniqueArr = [...new Set(uniqueArr)];
  //     if (uniqueArr.length > oldLength) {
  //       fs.writeFile("./code/Zhuahihaibot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
  //         if (err) {
  //           console.log(err);
  //         }
  //       });
  //     // } else {
  //     //   console.log("没有新加数据");
  //     }
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  // all += REDDFILEBOT.length;
  // console.log("REDDFILEBOT : " + REDDFILEBOT.length);  //测试
  // if (REDDFILEBOT.length > 0) {
  //   const data = fs.readFileSync("./code/REDDFILEBOT.txt", "utf-8");
  //   try {
  //     let uniqueArr = JSON.parse(data);
  //     const oldLength = uniqueArr.length;
  //     uniqueArr = [...uniqueArr, ...REDDFILEBOT];
  //     uniqueArr = [...new Set(uniqueArr)];
  //     if (uniqueArr.length > oldLength) {
  //       fs.writeFile("./code/REDDFILEBOT.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
  //         if (err) {
  //           console.log(err);
  //         }
  //       });
  //     // } else {
  //     //   console.log("没有新加数据");
  //     }
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  all += wenjianjibot.length;
  console.log("wenjianjibot : " + wenjianjibot.length);  //测试
  if (wenjianjibot.length > 0) {
    const data = fs.readFileSync("./code/wenjianjibot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...wenjianjibot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/wenjianjibot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += amumujiemabot.length;
  console.log("amumujiemabot : " + amumujiemabot.length);  //测试
  if (amumujiemabot.length > 0) {
    const data = fs.readFileSync("./code/amumujiemabot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...amumujiemabot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/amumujiemabot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += parludecodingBot.length;
  console.log("parludecodingBot : " + parludecodingBot.length);  //测试
  if (parludecodingBot.length > 0) {
    const data = fs.readFileSync("./code/parludecodingBot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...parludecodingBot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/parludecodingBot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += teestpanbot.length;
  console.log("teestpanbot : " + teestpanbot.length);  //测试
  if (teestpanbot.length > 0) {
    const data = fs.readFileSync("./code/teestpanbot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...teestpanbot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/teestpanbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += atfileslinksbot.length;
  console.log("atfileslinksbot : " + atfileslinksbot.length);  //测试
  if (atfileslinksbot.length > 0) {
    const data = fs.readFileSync("./code/atfileslinksbot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...atfileslinksbot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/atfileslinksbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += lockHivebot.length;
  console.log("lockHivebot : " + lockHivebot.length);  //测试
  if (lockHivebot.length > 0) {
    const data = fs.readFileSync("./code/lockHivebot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...lockHivebot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/lockHivebot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += tgdecoderbot.length;
  console.log("tgdecoderbot : " + tgdecoderbot.length);  //测试
  if (tgdecoderbot.length > 0) {
    const data = fs.readFileSync("./code/tgdecoderbot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...tgdecoderbot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/tgdecoderbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += ZYXFilesBot.length;
  console.log("ZYXFilesBot : " + ZYXFilesBot.length);  //测试
  if (ZYXFilesBot.length > 0) {
    const data = fs.readFileSync("./code/ZYXFilesBot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...ZYXFilesBot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/ZYXFilesBot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += ntmjmqbot.length;
  console.log("ntmjmqbot : " + ntmjmqbot.length);  //测试
  if (ntmjmqbot.length > 0) {
    const data = fs.readFileSync("./code/ntmjmqbot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...ntmjmqbot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/ntmjmqbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += newjmqbot.length;
  console.log("newjmqbot : " + newjmqbot.length);  //测试
  if (newjmqbot.length > 0) {
    const data = fs.readFileSync("./code/newjmqbot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...newjmqbot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/newjmqbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += filepanbot.length;
  console.log("filepanbot : " + filepanbot.length);  //测试
  if (filepanbot.length > 0) {
    const data = fs.readFileSync("./code/filepanbot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...filepanbot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/filepanbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += myseseXBot.length;
  console.log("myseseXBot : " + myseseXBot.length);  //测试
  if (myseseXBot.length > 0) {
    const data = fs.readFileSync("./code/myseseXBot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...myseseXBot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/myseseXBot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += save2BoxBot.length;
  console.log("save2BoxBot : " + save2BoxBot.length);  //测试
  if (save2BoxBot.length > 0) {
    const data = fs.readFileSync("./code/save2BoxBot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...save2BoxBot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/save2BoxBot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += mtfxqbot.length;
  console.log("mtfxqbot : " + mtfxqbot.length);  //测试
  if (mtfxqbot.length > 0) {
    const data = fs.readFileSync("./code/mtfxqbot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...mtfxqbot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/mtfxqbot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += mtfxq2bot.length;
  console.log("mtfxq2bot : " + mtfxq2bot.length);  //测试
  if (mtfxq2bot.length > 0) {
    const data = fs.readFileSync("./code/mtfxq2bot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...mtfxq2bot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/mtfxq2bot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += mediaBK2Bot.length;
  console.log("mediaBK2Bot : " + mediaBK2Bot.length);  //测试
  if (mediaBK2Bot.length > 0) {
    const data = fs.readFileSync("./code/mediaBK2Bot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...mediaBK2Bot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/mediaBK2Bot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += mouseFilebot.length;
  console.log("mouseFilebot : " + mouseFilebot.length);  //测试
  if (mouseFilebot.length > 0) {
    const data = fs.readFileSync("./code/mouseFilebot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...mouseFilebot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/mouseFilebot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += dataPanBot.length;
  console.log("dataPanBot : " + dataPanBot.length);  //测试
  if (dataPanBot.length > 0) {
    const data = fs.readFileSync("./code/dataPanBot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...dataPanBot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/dataPanBot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  all += filesPan1Bot.length;
  console.log("filesPan1Bot : " + filesPan1Bot.length);  //测试
  if (filesPan1Bot.length > 0) {
    const data = fs.readFileSync("./code/filesPan1Bot.txt", "utf-8");
    try {
      let uniqueArr = JSON.parse(data);
      const oldLength = uniqueArr.length;
      uniqueArr = [...uniqueArr, ...filesPan1Bot];
      uniqueArr = [...new Set(uniqueArr)];
      if (uniqueArr.length > oldLength) {
        fs.writeFile("./code/filesPan1Bot.txt", JSON.stringify(uniqueArr, null, 2), function(err) {
          if (err) {
            console.log(err);
          }
        });
      // } else {
      //   console.log("没有新加数据");
      }
    } catch (e) {
      console.log(e);
    }
  }

  console.log("all : " + all);  //测试
} catch (e) {
  console.log(e);
}


//console.log(sha2Result);

