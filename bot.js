import { TelegramClient, Api, sessions, utils } from "./teleproto";
import { LogLevel } from "./teleproto/extensions";
import bigInt from "big-integer";

export default {
  async fetch(request, env, ctx) {
    const clientIndex = 0;
    const client = [null, null, null];
    const apiIdArray = [
      1334621,   //zjm1985
      8851987,   //zjm2023
      25429403,   //zjm4038
      33043873   //zjm4039
    ];
    const apiHashArray = [
      "2bc36173f487ece3052a00068be59e7b",
      "8c353f36d876aa5b71b671dd221d763c",
      "2bb9a1bfd8f598da6cb5c511f0e5fbdf",
      "770d14fcd25ebebc574c5d2a6358a0b3"
    ];
    const sessionStringArray = [
      "1BQANOTEuMTA4LjU2LjE4MwG7hRgdaJwLQk6Z3MtsGp1GpAt7DMmmevLD8PvAMyH7B2tj7AM2j0fFAdtDywbosx8DK1rDuRnOcYbaIqAcvysfutIUm1G5AHRjhh5P6RYQB0AsN/uWCriKte4Pm1TXAH/9xhdP/JNqWj4r6eQTdzsezRv2c7fhya1j/7ZcfnImp6EnzmziDxB1tbXu/FOjOpjPRwNmO9qZqfCdTxRHyvL8zNZEzJrAcfJiud3ysF649DikJOx7hDEacc6rR3oQCkSk7rkCw2LzXJtMFIVDd8QIdZ7zd3IpnBxXBOnTUU+bNCmvcaOxxgpHtmuukw/6Q/zJGGraOte3IZhkTNPyDqbzmQ==",
      "1BQANOTEuMTA4LjU2LjEyOABQLHDMD4nttp5nlyYavCPWP5Mu6WVqx7EprUCty5ZofNENdyWJn6FsczIjIQ95L/qNm5v3Z/pCBJ7kC25NdWudkeIAKXQBrE37b16VObxHq+0oXQk/ySOspHUPJSFy3E1UDPQjFdWS0lbKiAs4Fhd1/P7FYFNpXeGobfi9lfWY8TZlbS0m5+7s2L6bxj/JGWbNFtPL+0B+F0QbhGW9pFdmpdw/eEAiw7ZENCZxY0hJ74KNiPRqunDHXQRiXLPlXU/NoxygvOizxKFsCduCKrcloIrjZTLnbeF26SmNR3EdC8MmC1emxoPyfxd1KpQyWUPRmx+nZBV4NRDZPS3Y8JetHw==",
      "1BQAWZmxvcmEud2ViLnRlbGVncmFtLm9yZwG7be+PddSzlPTzgS/mbCsxeZYLhE9ohnesT10Ntv+pdypA3wfrAUdXGXBLb2uturgLlkO49XMxAsIoELAdi8OprHkYfeEWZrQPF9RqjucdgWviAVd3oy/JIHk6lbB6NCS06US2CMdLZMxAsLFLu2JTgWiI07Xm2tpCIaaYED9mmH7NiROvqBx+jpB2GoFM4xzqaoB3y43BURo/ZYPEM3uUB4AVsS7IwdK0/j8pJL/ChB3buNnNtyVADe8wFvEAcbMn/385Xz53T21BdYqanzMuZX2O9cv4UNCpA9P6HoEYRn0D9XsljY6xJFNdR/RRKGHBqlVLK/Xt6PagRm321YBAvw==",
      "1AQAOMTQ5LjE1NC4xNzUuNTEBuy4sBpNWS3AGvzOzpaxdcW/u15EswUdbFZimjS+y+EyJzgU+mfNZnvDBUGUz57eY85qmRUYgMTduQi1OPS2j8pZOmLVWkigkyUVRsfAUZ/IY9cWdIwjzNfZXDyE0wMEqn66NrBx/oSQauJEpsyljZfb99tdQUW+P6Zg4FDMltO3uxqrWyMu9OKJLf6tgup47dALQDSCsHBuZR+RVHRFdvUbzVye7sBM5NwyYdRBlxGig/aAbpqO9jiUYPqKwrSDWLuH5uVRtOK4Dr9ukhcpXOZcfq9qzwtdDlt6t9c6w7svQiYB6drg6YjEfkaBnr2yibFpPkHIlUCsKvuIpCtrcYa0="
    ];

    async function open(index) {
      client[index] = new TelegramClient(new sessions.StringSession(sessionStringArray[index]), apiIdArray[index], apiHashArray[index], {
        // connectionRetries : Number.MAX_VALUE,
        timeout: 5,
        retryDelay: 1000,
        connectionRetries: 5,
        autoReconnect: true,
        deviceModel: "Desktop",
        systemVersion: "Windows 11",
        appVersion: "6.7.6 x64",
        langCode: "en",
        systemLangCode: "en-US",
        // langCode: "zhcncc",
        // systemLangCode: "zh-CN",
      });
      client[index].session.setDC(5, "91.108.56.128", 80);
      client[index].setLogLevel("error");
      await client[index].connect();
      console.log("连接服务器" + (index + 1) + "成功");  //测试
      //console.log(client[index]);  //测试
      await scheduler.wait(2000);
    }

    async function close(index) {
      if (client[index]) {
        await client[index].destroy();
        console.log("断开服务器" + (index + 1) + "成功");
        //await scheduler.wait(1000);
      }
    }

    await open(clientIndex);
    if (client[clientIndex]) {
      for await (const dialog of client[clientIndex].iterDialogs({})) {
        // index += 1;
        // if (index === 5) {
        // //   const cache = [];
        // //   const json_str = JSON.stringify(dialog, function(key, value) {
        // //     if (typeof value === 'object' && value !== null) {
        // //       if (cache.indexOf(value) !== -1) {
        // //         return;
        // //       }
        // //       cache.push(value);
        // //     }
        // //     return value;
        // //   });
        // //   console.log(json_str);  //测试
        // //   break;  //测试
        //   if (dialog.isChannel === true) {
        //     console.log(dialog.entity.username);  //测试
        //     console.log(dialog.draft._entity.username);  //测试
        //     break;  //测试
        //   }
        // }
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
        // console.log(dialog);  //测试
        // console.log(dialog.username);  //测试
        // console.log(JSON.stringify(dialog));  //测试
        //id = dialog.id;
        //console.log(id);  //测试
        // channelId = dialog.inputEntity.channelId;
        // // channelId = dialog.draft._peer.channelId;
        // // channelId = dialog.draft._entity.id;
        // // channelId = dialog.entity.id;
        // accessHash = dialog.inputEntity.accessHash;
        // // accessHash = dialog.draft._entity.accessHash;
        // // accessHash = dialog.entity.accessHash;
        // console.log({"channelId1" : channelId});  //测试
        // console.log({"accessHash2" : accessHash});  //测试
        // break;  //测试
      }
      await close(clientIndex);  //测试
      return;  //测试

      let fromPeer = null;
      // const users = await client[clientIndex].invoke(
      //   new Api.users.GetUsers({
      //     id: [
      //       new Api.InputUser({
      //         // userId: 7585811878,
      //         // accessHash: bigInt.zero,
      //         // userId: bigInt("777000"),  //Telegram
      //         // accessHash: bigInt("4676278659094415168"),
      //         userId: bigInt("8644136882"),  //nnfilebot
      //         accessHash: bigInt("-1388224743701786177"),
      //       }),
      //     ],
      //   })
      // );
      // if (users.length && !(users[0] instanceof Api.UserEmpty)) {
      //   fromPeer = utils.getInputPeer(users[0]);
      // }
      // console.log(JSON.stringify(fromPeer));  //测试

      const result = await client[clientIndex].invoke(
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

      // const idArray = [];
      // const fileIdArray = [];
      for await (const message of client[clientIndex].iterMessages(
        // "me",
        fromPeer,
        {
          limit: 5,
          reverse: false,
          // reverse: true,
          // addOffset: 10000,
          // addOffset: -1,
          addOffset: 0,
          // filter: Api.InputMessagesFilterVideo,
          waitTime: 60,
        })
      ) {
        // const forwardResult = await client[clientIndex].invoke(new Api.messages.ForwardMessages({
        //   silent: true,
        //   background: true,
        //   withMyScore: true,
        //   fromPeer: fromPeer,
        //   toPeer: toPeer,
        //   id: [message.id],
        //   randomId: [message.id],
        //   //scheduleDate: 0,
        // }));
        // // console.log(JSON.stringify(forwardResult));  //测试
        // console.log("-------------------------------------------------------------");  //测试
        // break;
        // //console.log(forwardResult);  //测试
        console.log(message);  //测试
        // const regexp = /^\d+$/i;
        // if (message.replyMarkup) {
        //   if (message.replyMarkup.rows) {
        //     console.log(message);  //测试
        //     // for (const row of message.replyMarkup.rows) {
        //     //   // console.log(row);  //测试
        //     //   for (const button of row.buttons) {
        //     //     // console.log(button);  //测试
        //     //     // if (button.text === "加入队列全部推送") {
        //     //     // if (button.text === "下一页 ➡️") {
        //     //     if (button.text === "▶️ 自动发送") {
        //     //     // if (button.text.includes("➡️ 查看下一组 (") === true) {
        //     //       // console.log(button.text);  //测试
        //     //       const result = await client[clientIndex].invoke(new Api.messages.GetBotCallbackAnswer({
        //     //         peer: fromPeer,
        //     //         msgId: message.id,
        //     //         data: button.data,
        //     //       }));
        //     //       console.log(result);  //测试
        //     //     }
        //     //     // console.log(button.text + " : " + regexp.test(button.text));  //测试
        //     //   }
        //     // }
        //   }
        // }
      }
      // console.log(idArray);  //测试
      // console.log(idArray.length);  //测试
      await close(clientIndex);
  }

//    const me = await client[clientIndex].getEntity("me");
//    console.log("My name is",utils.getDisplayName(me));  //测试
//    const chat = await client[clientIndex].getInputEntity("username");
//    console.log(chat);  //测试
//    await close(clientIndex);

    return new Response("error");
  },
};
