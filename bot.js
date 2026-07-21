import { TelegramClient, Api, sessions, utils } from "./teleproto";
import { LogLevel } from "./teleproto/extensions/Logger";
import bigInt from "big-integer";

export default {
  async fetch(request, env, ctx) {
    let client = null;

    async function open() {
      client = new TelegramClient(new sessions.StringSession(env.SESSION_STRING), env.API_ID, env.API_HASH, {
        // connectionRetries : Number.MAX_VALUE,
        timeout: 5,
        retryDelay: 1000,
        connectionRetries: 5,
        autoReconnect: true,
        deviceModel: "Desktop",
        systemVersion: "Windows 11",
        appVersion: "6.7.6 x64",
        langCode: "zhcncc",
        systemLangCode: "zh-CN",
      });
      client.session.setDC(5, "91.108.56.128", 80);
      client.setLogLevel("error");
      await client.connect();
      console.log("连接服务器成功");  //测试
      // console.log(client);  //测试
      await scheduler.wait(2000);
    }

    async function close() {
      if (client) {
        await client.destroy();
        console.log("断开服务器成功");
        //await scheduler.wait(1000);
      }
    }

    await open();
    if (client) {
      for await (const dialog of client.iterDialogs({})) {
        // if (dialog?.isUser === true) {
        if (dialog?.draft?._entity?.bot === true) {
        // if (dialog?.entity?.deleted === true) {
        // if (dialog?.draft?._entity?.bot === true && dialog?.entity?.deleted === true) {
          const cache = [];
          const json_str = JSON.stringify(dialog, function(key, value) {
            if (typeof value === 'object' && value !== null) {
              if (cache.indexOf(value) !== -1) {
                return;
              }
              cache.push(value);
            }
            return value;
          });
          console.log(json_str);  //测试
        }
      }
      await close();  //测试
      return;  //测试

      let fromPeer = null;
      // const users = await client.invoke(
      //   new Api.users.GetUsers({
      //     id: [
      //       new Api.InputUser({
      //         // userId: 7585811878,
      //         // accessHash: bigInt.zero,
      //         // userId: bigInt("777000"),  //Telegram
      //         // accessHash: bigInt("4676278659094415168"),
      //       }),
      //     ],
      //   })
      // );
      // if (users.length && !(users[0] instanceof Api.UserEmpty)) {
      //   fromPeer = utils.getInputPeer(users[0]);
      // }
      // console.log(JSON.stringify(fromPeer));  //测试

      const result = await client.invoke(
        new Api.channels.GetChannels({
          id: [new Api.InputChannel({
            channelId: bigInt(3982534960),   //蜂巢热门密钥
            accessHash: bigInt(6100294192930071508),
          })],
        })
      );
      if (result && result.chats && result.chats.length > 0) {
        fromPeer = result.chats[0];
      }
      console.log(JSON.stringify(fromPeer));  //测试

      for await (const message of client.iterMessages(
        // "me",
        fromPeer,
        {
          limit: 10,
          reverse: false,
          // reverse: true,
          // addOffset: 10000,
          // addOffset: -1,
          addOffset: 0,
          // filter: Api.InputMessagesFilterVideo,
          waitTime: 60,
        })
      ) {
        console.log(message);  //测试
      }
      await close();
    }

    return new Response("error");
  },
};
