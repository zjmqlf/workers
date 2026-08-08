import { DurableObject } from "cloudflare:workers";
// import { TelegramClient, Api, sessions, utils } from "./teleproto";
// import { LogLevel } from "./teleproto/extensions/Logger";
// import bigInt from "big-integer";
// import { Buffer } from "node:buffer";
// import * as crypto from "node:crypto";
// import { oneDriveAPI } from "./onedrive-api";

// const clientIndex = 3;
// const client = [null, null, null, null];
// const apiIdArray = [
//   1334621,   //zjm1985
//   8851987,   //zjm2023
//   25429403,   //zjm4038
//   33043873   //zjm4039
// ];
// const apiHashArray = [
//   "2bc36173f487ece3052a00068be59e7b",
//   "8c353f36d876aa5b71b671dd221d763c",
//   "2bb9a1bfd8f598da6cb5c511f0e5fbdf",
//   "770d14fcd25ebebc574c5d2a6358a0b3"
// ];
// const sessionStringArray = [
//   "1BQANOTEuMTA4LjU2LjE4MwG7hRgdaJwLQk6Z3MtsGp1GpAt7DMmmevLD8PvAMyH7B2tj7AM2j0fFAdtDywbosx8DK1rDuRnOcYbaIqAcvysfutIUm1G5AHRjhh5P6RYQB0AsN/uWCriKte4Pm1TXAH/9xhdP/JNqWj4r6eQTdzsezRv2c7fhya1j/7ZcfnImp6EnzmziDxB1tbXu/FOjOpjPRwNmO9qZqfCdTxRHyvL8zNZEzJrAcfJiud3ysF649DikJOx7hDEacc6rR3oQCkSk7rkCw2LzXJtMFIVDd8QIdZ7zd3IpnBxXBOnTUU+bNCmvcaOxxgpHtmuukw/6Q/zJGGraOte3IZhkTNPyDqbzmQ==",
//   "1BQANOTEuMTA4LjU2LjEyOABQLHDMD4nttp5nlyYavCPWP5Mu6WVqx7EprUCty5ZofNENdyWJn6FsczIjIQ95L/qNm5v3Z/pCBJ7kC25NdWudkeIAKXQBrE37b16VObxHq+0oXQk/ySOspHUPJSFy3E1UDPQjFdWS0lbKiAs4Fhd1/P7FYFNpXeGobfi9lfWY8TZlbS0m5+7s2L6bxj/JGWbNFtPL+0B+F0QbhGW9pFdmpdw/eEAiw7ZENCZxY0hJ74KNiPRqunDHXQRiXLPlXU/NoxygvOizxKFsCduCKrcloIrjZTLnbeF26SmNR3EdC8MmC1emxoPyfxd1KpQyWUPRmx+nZBV4NRDZPS3Y8JetHw==",
//   "1BQAWZmxvcmEud2ViLnRlbGVncmFtLm9yZwG7be+PddSzlPTzgS/mbCsxeZYLhE9ohnesT10Ntv+pdypA3wfrAUdXGXBLb2uturgLlkO49XMxAsIoELAdi8OprHkYfeEWZrQPF9RqjucdgWviAVd3oy/JIHk6lbB6NCS06US2CMdLZMxAsLFLu2JTgWiI07Xm2tpCIaaYED9mmH7NiROvqBx+jpB2GoFM4xzqaoB3y43BURo/ZYPEM3uUB4AVsS7IwdK0/j8pJL/ChB3buNnNtyVADe8wFvEAcbMn/385Xz53T21BdYqanzMuZX2O9cv4UNCpA9P6HoEYRn0D9XsljY6xJFNdR/RRKGHBqlVLK/Xt6PagRm321YBAvw==",
//   "1AQAOMTQ5LjE1NC4xNzUuNTIBu39JSkLGLhxMxV1cDu+FAOoWkI3GXJuYqPGSES/D+ysXQQp5Q/aA6mj0vLBNnGM058a3z2DN2OboRooX1QF877gSCY9a+T2xytDo0QaOZqC5AAbKXaGSL2vvguLpmY3Ch+cv3o1zQ3u1wok70NTf1URqCddd7x8zUtSb4gTByZ8frVU7NPjGfBgcN3aUFFO2A+SmheqEt8Uq5Q8MJ6Rha45PocWsM4UkuSc7Cxa5Cun7s2+SjWH2g/eTT+zYssy3eaeC9qW5u5UoSsH148e1tXOmOoY+yeySU5zTr3uP7YYOvh2q30mmWuW6gmVMOvF/foXGp0h5kK1LooLeOCXGafg="
// ];

// async function open(index) {
//   client[index] = new TelegramClient(new sessions.StringSession(sessionStringArray[index]), apiIdArray[index], apiHashArray[index], {
//     // connectionRetries : Number.MAX_VALUE,
//     timeout: 5,
//     retryDelay: 1000,
//     connectionRetries: 5,
//     autoReconnect: true,
//     deviceModel: "Desktop",
//     systemVersion: "Windows 11",
//     appVersion: "6.7.6 x64",
//     langCode: "en",
//     systemLangCode: "en-US",
//   });
//   // client[index].session.setDC(5, "91.108.56.128", 80);
//   client[index].setLogLevel("error");
//   await client[index].connect();
//   console.log("连接服务器" + (index + 1) + "成功");  //测试
//   // console.log(client[index]);  //测试
//   // await scheduler.wait(2000);
// }

// async function close(index) {
//   if (client[index]) {
//     await client[index].destroy();
//     console.log("断开服务器" + (index + 1) + "成功");
//     //await scheduler.wait(1000);
//   }
// }

export class WebSocketServer extends DurableObject {
  // messages = [];
  // clientIndex = 0;
  // client = null;
  // apiIdArray = [
  //   1334621,   //zjm1985
  //   8851987,   //zjm2023
  //   25429403,   //zjm4038
  //   33043873   //zjm4039
  // ];
  // apiHashArray = [
  //   "2bc36173f487ece3052a00068be59e7b",
  //   "8c353f36d876aa5b71b671dd221d763c",
  //   "2bb9a1bfd8f598da6cb5c511f0e5fbdf",
  //   "770d14fcd25ebebc574c5d2a6358a0b3"
  // ];
  // sessionStringArray = [
  //   "1BQANOTEuMTA4LjU2LjE4MwG7hRgdaJwLQk6Z3MtsGp1GpAt7DMmmevLD8PvAMyH7B2tj7AM2j0fFAdtDywbosx8DK1rDuRnOcYbaIqAcvysfutIUm1G5AHRjhh5P6RYQB0AsN/uWCriKte4Pm1TXAH/9xhdP/JNqWj4r6eQTdzsezRv2c7fhya1j/7ZcfnImp6EnzmziDxB1tbXu/FOjOpjPRwNmO9qZqfCdTxRHyvL8zNZEzJrAcfJiud3ysF649DikJOx7hDEacc6rR3oQCkSk7rkCw2LzXJtMFIVDd8QIdZ7zd3IpnBxXBOnTUU+bNCmvcaOxxgpHtmuukw/6Q/zJGGraOte3IZhkTNPyDqbzmQ==",
  //   "1BQANOTEuMTA4LjU2LjEyOABQLHDMD4nttp5nlyYavCPWP5Mu6WVqx7EprUCty5ZofNENdyWJn6FsczIjIQ95L/qNm5v3Z/pCBJ7kC25NdWudkeIAKXQBrE37b16VObxHq+0oXQk/ySOspHUPJSFy3E1UDPQjFdWS0lbKiAs4Fhd1/P7FYFNpXeGobfi9lfWY8TZlbS0m5+7s2L6bxj/JGWbNFtPL+0B+F0QbhGW9pFdmpdw/eEAiw7ZENCZxY0hJ74KNiPRqunDHXQRiXLPlXU/NoxygvOizxKFsCduCKrcloIrjZTLnbeF26SmNR3EdC8MmC1emxoPyfxd1KpQyWUPRmx+nZBV4NRDZPS3Y8JetHw==",
  //   "1BQAWZmxvcmEud2ViLnRlbGVncmFtLm9yZwG7be+PddSzlPTzgS/mbCsxeZYLhE9ohnesT10Ntv+pdypA3wfrAUdXGXBLb2uturgLlkO49XMxAsIoELAdi8OprHkYfeEWZrQPF9RqjucdgWviAVd3oy/JIHk6lbB6NCS06US2CMdLZMxAsLFLu2JTgWiI07Xm2tpCIaaYED9mmH7NiROvqBx+jpB2GoFM4xzqaoB3y43BURo/ZYPEM3uUB4AVsS7IwdK0/j8pJL/ChB3buNnNtyVADe8wFvEAcbMn/385Xz53T21BdYqanzMuZX2O9cv4UNCpA9P6HoEYRn0D9XsljY6xJFNdR/RRKGHBqlVLK/Xt6PagRm321YBAvw==",
  //   "1AQAOMTQ5LjE1NC4xNzUuNTEBuy4sBpNWS3AGvzOzpaxdcW/u15EswUdbFZimjS+y+EyJzgU+mfNZnvDBUGUz57eY85qmRUYgMTduQi1OPS2j8pZOmLVWkigkyUVRsfAUZ/IY9cWdIwjzNfZXDyE0wMEqn66NrBx/oSQauJEpsyljZfb99tdQUW+P6Zg4FDMltO3uxqrWyMu9OKJLf6tgup47dALQDSCsHBuZR+RVHRFdvUbzVye7sBM5NwyYdRBlxGig/aAbpqO9jiUYPqKwrSDWLuH5uVRtOK4Dr9ukhcpXOZcfq9qzwtdDlt6t9c6w7svQiYB6drg6YjEfkaBnr2yibFpPkHIlUCsKvuIpCtrcYa0="
  // ];

  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.storage = ctx.storage;
    this.sql = ctx.storage.sql;
    this.env = env;
  }

  // async open() {
  //   this.client = new TelegramClient(new sessions.StringSession(this.sessionStringArray[this.clientIndex]), this.apiIdArray[this.clientIndex], this.apiHashArray[this.clientIndex], {
  //     // connectionRetries : Number.MAX_VALUE,
  //     timeout: 5,
  //     retryDelay: 1000,
  //     connectionRetries: 5,
  //     autoReconnect: true,
  //     deviceModel: "Desktop",
  //     systemVersion: "Windows 11",
  //     appVersion: "6.7.6 x64",
  //     langCode: "en",
  //     systemLangCode: "en-US",
  //   });
  //   // this.client.session.setDC(5, "91.108.56.128", 80);
  //   this.client.setLogLevel("error");
  //   await this.client.connect();
  //   console.log("连接服务器成功");  //测试
  //   // console.log(this.client);  //测试
  //   await scheduler.wait(2000);
  // }

  // async close() {
  //   if (this.client) {
  //     await this.client.destroy();
  //     console.log("断开服务器成功");
  //     //await scheduler.wait(1000);
  //   }
  // }

  // async getMessage() {
  //   for await (const message of this.client.iterMessages(
  //     "me",
  //     {
  //       limit: 10,
  //       reverse: false,
  //       // reverse: true,
  //       // addOffset: 10000,
  //       // addOffset: -1,
  //       addOffset: 0,
  //       offsetDate: 0,
  //       // filter: Api.InputMessagesFilterVideo,
  //       waitTime: 60,
  //     })
  //   ) {
  //     this.messages.push(message.id);
  //   }
  // }

  async countMediaIndex() {
    const mediaResult = await env.MEDIADB.prepare("SELECT COUNT(*) FROM `MEDIAINDEX` WHERE 1 = 1;").run();
    // console.log("mediaResult : " + mediaResult["COUNT(*)"]);  //测试
    if (mediaResult.success === true) {
      if (mediaResult.results && mediaResult.results.length > 0) {
        return mediaResult.results[0]["COUNT(*)"];
      }
    }
    return -1;
  }

  async selectMediaIndex(id) {
    let mediaResult = {};
    try {
      mediaResult = await this.env.MAINDB.prepare("SELECT `id`, `Vindex` FROM `MEDIAINDEX` WHERE `Vindex` >= ? ORDER BY `Vindex` ASC LIMIT 100;").bind(id).run();
    } catch (err) {
      console.log("selectMediaIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      return;
    }
    // console.log("mediaResult : " + mediaResult);  //测试
    if (mediaResult.success === true) {
      if (mediaResult.results && mediaResult.results.length > 0) {
        return mediaResult.results;
      } else {
        return [];
      }
    }
  }

  async countPhotoIndex() {
    const photoResult = await env.MEDIADB.prepare("SELECT COUNT(*) FROM `PHOTOINDEX` WHERE 1 = 1;").run();
    // console.log("photoResult : " + photoResult["COUNT(*)"]);  //测试
    if (photoResult.success === true) {
      if (photoResult.results && photoResult.results.length > 0) {
        return photoResult.results[0]["COUNT(*)"];
      }
    }
    return -1;
  }

  async selectPhotoIndex(id) {
    let photoResult = {};
    try {
      photoResult = await this.env.MAINDB.prepare("SELECT `id`, `Pindex` FROM `PHOTOINDEX` WHERE `Pindex` >= ? ORDER BY `Pindex` ASC LIMIT 100;").bind(id).run();
    } catch (err) {
      console.log("selectPhotoIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      return;
    }
    // console.log("photoResult : " + photoResult);  //测试
    if (photoResult.success === true) {
      if (photoResult.results && photoResult.results.length > 0) {
        return photoResult.results;
      } else {
        return [];
      }
    }
  }

  async countMessage() {
    const messageResult = await env.MEDIADB.prepare("SELECT COUNT(*) FROM `MESSAGE` WHERE 1 = 1;").run();
    // console.log("messageResult : " + messageResult["COUNT(*)"]);  //测试
    if (messageResult.success === true) {
      if (messageResult.results && messageResult.results.length > 0) {
        return messageResult.results[0]["COUNT(*)"];
      }
    }
    return -1;
  }

  async selectMessage(id) {
    let messageResult = null;
    try {
      messageResult = await this.env.MAINDB.prepare("SELECT * FROM `MESSAGE` WHERE `Mindex` >= ? ORDER BY `Mindex` ASC LIMIT 100;").bind(id).run();
    } catch (err) {
      console.log("selectMessage : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      return;
    }
    // console.log("messageResult : " + messageResult);  //测试
    if (messageResult.success === true) {
      if (messageResult.results && messageResult.results.length > 0) {
        return messageResult.results;
      }
    } else {
        return [];
    }
  }

  async selectMessageIndex(messageId) {
    this.apiCount += 1;
    let messageResult = null;
    try {
      messageResult = await this.env.MAINDB.prepare("SELECT COUNT(*) FROM `MESSAGEINDEX` WHERE `id` = ? LIMIT 1;").bind(messageId).run();
    } catch (err) {
      console.log("selectMessageIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      return;
    }
    // console.log("messageResult : " + messageResult["COUNT(*)"]);  //测试
    if (messageResult.success === true) {
      if (messageResult.results && messageResult.results.length > 0) {
        return messageResult.results[0]["COUNT(*)"];
      }
    }
  }

  async insertMessageIndex(result) {
    let messageResult = {};
    try {
      messageResult = await this.env.MAINDB.prepare("INSERT INTO `MESSAGEINDEX` (dbIndex, userId, Mindex, id) VALUES (?, ?, ?, ?, ?);").bind(1, result.userId, result.Mindex, result.id).run();
    } catch (err) {
      console.log("insertMessageIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);;
      return;
    }
    // console.log(messageResult);  //测试
    if (messageResult.success === true) {
      // console.log("插入messageIndex数据成功");
    } else {
      console.log("插入messageIndex数据失败");
    }
  }

  async deleteMessage(Mindex) {
    let messageResult = {};
    try {
      messageResult = await this.env.MAINDB.prepare("DELETE FROM `MESSAGE` WHERE `Mindex` = ?;").bind(Mindex).run();
    } catch (err) {
      console.log("deleteMessage : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);;
      return;
    }
    // console.log(messageResult);  //测试
    if (messageResult.success === true) {
      // console.log("删除message数据成功");
    } else {
      console.log("删除message数据失败");
    }
  }

  async fetch() {
    // await this.sql.exec(`
    //   CREATE TABLE IF NOT EXISTS artist(
    //     artistid    INTEGER PRIMARY KEY,
    //     artistname  TEXT
    //   );
    //   INSERT INTO artist (artistid, artistname) VALUES
    //     (123, 'Alice'),
    //     (456, 'Bob'),
    //     (789, 'Charlie');
    //   `
    // );
    // // const size = this.sql.databaseSize;
    // const resultsArray = await this.sql.exec("SELECT * FROM artist ORDER BY artistname ASC;").toArray();
    // const length = resultsArray.length;
    // console.log("length : " + length);  //测试
    // for (let index = 0; index < length; index++) {
    //   console.log(JSON.stringify(resultsArray[index]));  //测试
    // }
    // const oneRow = await this.sql.exec("SELECT * FROM artist WHERE artistname = ?;", "Alice").one();

    // const array = [];
    // await this.ctx.storage.deleteAll();
    // await this.ctx.storage.put("1", "111");
    // await this.ctx.storage.put("2", "222");
    // await this.ctx.storage.put("3", "333");
    // await this.ctx.storage.put("4", "444");
    // await this.ctx.storage.put("5", "555");
    // // await this.ctx.storage.get();
    // // await this.ctx.storage.delete();
    // const result = await this.ctx.storage.get("2");
    // console.log(" result : " + result);  //测试
    // const results = await this.ctx.storage.list({
    //   // start: 0,
    //   // startAfter: 0,
    //   // end: 0,
    //   // prefix: "",
    //   // reverse : true,
    //   // limit: 10,
    // });
    // for (const item of results) {
    //   // console.log(JSON.stringify(item));  //测试
    //   array.push(item[0]);
    //   console.log(item[0] + " - " + item[1]);  //测试
    // }
    // // console.log(JSON.stringify(array));  //测试
    // return new Response(JSON.stringify(array));

    let id = 0;
    let current = 0;
    const count = await this.countMessage();
    console.log("messageCount : " + count);  //测试
    if (count < 0) {
      while (current <= count) {
        const results = await this.selectMessage(id);
        const length = results.length;
        console.log("length : " + length);  //测试
        for (let index = 0; index < length; index++) {
          // console.log(JSON.stringify(results[index]));  //测试
          id = results[index].Mindex;
          const exist = await this.selectMessageIndex(id);
          if (!exist || exist === 0) {
            await this.insertMessageIndex(results[index]);
          // } else if (exist > 0) {
          //   await this.deleteMessage(results[index].Mindex);
          }
        }
        // await scheduler.wait(5000);  //测试
        current += length;
      }
    } else {
      console.log("count小于0");
    }

    // let id = 0;
    // let current = 0;
    // const count = await this.countMediaIndex();
    // console.log("mediaCount : " + count);  //测试
    // if (count > 0) {
    //   while (current <= count) {
    //     const results = await this.selectMediaIndex(id);
    //     const length = results.length;
    //     console.log("length : " + length);  //测试
    //     for (let index = 0; index < length; index++) {
    //       // console.log(JSON.stringify(results[index]));
    //       id = results[index].Vindex;
    //       // if (!await this.ctx.storage.get(results[index].id)) {
    //         await this.ctx.storage.put(results[index].id, "[]");
    //       // }
    //     }
    //     // await scheduler.wait(5000);  //测试
    //     current += length;
    //   }
    // } else {
    //   console.log("mediaCount为0");
    // }

    // let id = 0;
    // let current = 0;
    // const count = await this.countPhotoIndex();
    // console.log("PhotoCount : " + count);  //测试
    // if (count > 0) {
    //   while (current <= count) {
    //     const results = await this.selectPhotoIndex(id);
    //     const length = results.length;
    //     console.log("length : " + length);  //测试
    //     for (let index = 0; index < length; index++) {
    //       // console.log(JSON.stringify(results[index]));
    //       id = results[index].Pindex;
    //       // if (!await this.ctx.storage.get(results[index].id)) {
    //         await this.ctx.storage.put(results[index].id, "[]");
    //       // }
    //     }
    //     // await scheduler.wait(5000);  //测试
    //     current += length;
    //   }
    // } else {
    //   console.log("PhotoCount为0");
    // }

    // try {
    //   const result = await this.ctx.storage.get("2");
    //   console.log(result);  //测试
    // } catch (err) {
    //   console.log(err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);  //测试
    // }

    // const client = this.client;
    // async function* fetchData() {
    //   // const messages = [];
    //   // function getMessage() {
    //   //   console.log(333);
    //   //   for (const message of client.iterMessages(
    //   //     "me",
    //   //     {
    //   //       limit: 10,
    //   //       reverse: false,
    //   //       // reverse: true,
    //   //       // addOffset: 10000,
    //   //       // addOffset: -1,
    //   //       addOffset: 0,
    //   //       offsetDate: 0,
    //   //       // filter: Api.InputMessagesFilterVideo,
    //   //       waitTime: 60,
    //   //     })
    //   //   ) {
    //   //     messages.push(message.id);
    //   //   }
    //   //   console.log(444);
    //   // }
    //   // // return messages;

    //   // yield getMessage();
    //   // yield messages;
    //   const messages = await client.iterMessages(
    //   // yield client.iterMessages(
    //     "me",
    //     {
    //       limit: 2,
    //       reverse: false,
    //       // reverse: true,
    //       // addOffset: 10000,
    //       // addOffset: -1,
    //       addOffset: 0,
    //       offsetDate: 0,
    //       // filter: Api.InputMessagesFilterVideo,
    //       waitTime: 60,
    //     });
    //   console.log(typeof messages);
    //   yield messages;
    // }

    // await this.open();
    // if (this.client) {
    //   // console.log(111);
    //   // // await this.getMessage();
    //   // // this.ctx.waitUntil(await this.getMessage());
    //   // // const results = await Promise.race([
    //   // // const results = await Promise.all([
    //   // //   this.getMessage()
    //   // // ]);
    //   // // console.log(this.messages);
    //   // const generator = await fetchData();
    //   // // generator.next();
    //   // // console.log(generator.next().value);
    //   // for await (const message of generator.next().value) {
    //   //   console.log(JSON.stringify(message));
    //   // }
    //   // // console.log(generator.next().value);
    //   // console.log(222);
    //   // await this.close();
    //   // return new Response(JSON.stringify(this.messages));
    //   for await (const dialog of this.client.iterDialogs({})) {
    //     if (dialog?.draft?._entity?.bot === true) {
    //     // if (dialog?.draft?._entity?.bot === true && dialog?.entity?.deleted === true) {
    //       const cache = [];
    //       const json_str = JSON.stringify(dialog, function(key, value) {
    //         if (typeof value === 'object' && value !== null) {
    //           if (cache.indexOf(value) !== -1) {
    //             return;
    //           }
    //           cache.push(value);
    //         }
    //         return value;
    //       });
    //       console.log(json_str);  //测试
    //     }
    //   }
    // }

    return new Response("ok");
  }
}

export default {
  async fetch(request, env, ctx) {
    const id = env.WEBSOCKET_SERVER.idFromName("test");
    const stub = env.WEBSOCKET_SERVER.get(id);
    return stub.fetch(request);

    // let channelId = 0;
    // let channelAccessHash = 0;
    // let dcId = 0;
    // let id = "";
    // let accessHash = "";
    // let fileReference = "";

    // async function selectMessage(messageId) {
    //   let messageResult = null;
    //   try {
    //     messageResult = await env.MAINDB.prepare("SELECT * FROM `MESSAGE` WHERE `id` = ? LIMIT 1;").bind(messageId).run();
    //   } catch (err) {
    //     console.log(messageId + " : selectMessage : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);  //测试
    //   }
    //   console.log("messageResult : ");  //测试
    //   console.log(messageResult);  //测试
    //   if (messageResult.success === true) {
    //     if (messageResult.results && messageResult.results.length > 0) {
    //       return messageResult.results[0];
    //     }
    //   }
    // }

    // function getDB(dbIndex) {
    //   const db = {
    //     "0": env.MEDIADB,
    //     "1": env.MEDIADB1,
    //     "2": env.MEDIADB2,
    //     "3": env.MEDIADB3,
    //     "4": env.MEDIADB4,
    //     "5": env.MEDIADB5,
    //     "6": env.MEDIADB6,
    //     "7": env.MEDIADB7,
    //     "8": env.MEDIADB8,
    //     '9': env.MEDIADB9,
    //     "10": env.MEDIADB10,
    //     "11": env.MEDIADB11,
    //     '12': env.MEDIADB12,
    //     "13": env.MEDIADB13,
    //     "14": env.MEDIADB14,
    //     "15": env.MEDIADB15,
    //     "16": env.MEDIADB16,
    //     "17": env.MEDIADB17,
    //     "18": env.MEDIADB18,
    //     "19": env.MEDIADB19,
    //   };
    //   return db[dbIndex];
    // }

    // async function selectMedia(dbIndex, Vindex) {
    //   const db = getDB(dbIndex);
    //   // console.log("db : " + db);  //测试
    //   let mediaResult = {};
    //   try {
    //     mediaResult = await db.prepare("SELECT * FROM `MEDIA` WHERE `Vindex` = ? LIMIT 1;").bind(Vindex).run();
    //   } catch (err) {
    //     console.log("selectMedia : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
    //   }
    //   console.log("mediaResult : ");  //测试
    //   console.log(mediaResult);  //测试
    //   if (mediaResult.success === true) {
    //     if (mediaResult.results && mediaResult.results.length > 0) {
    //       return mediaResult.results[0];
    //     }
    //   }
    // }

    // function getPath(str) {
    //   const strToArr = str.split("");
    //   let length = str.length;
    //   for (let i = 2; i < length; i += 3) {
    //     strToArr.splice(i, 0, "/");
    //     length += 1;
    //   }
    //   return strToArr.join("");
    // }

    // async function uploadFile(accessToken, drive, filename, sign, index) {
    //   // console.log("正准备异步上传");  //测试
    //   const filePath = getPath(md5Result.substring(8, 24));
    //   // console.log("filePath : " + filePath);  //测试
    //   oneDriveAPI.items.uploadSimple({
    //     accessToken: accessToken,
    //     drive: "site",
    //     driveId: drive,
    //     parentPath: filePath,
    //     filename: filename,
    //     readableStream: sign,
    //     // prefix: "",
    //     index: index,
    //   }).then(async (item) => {
    //     // console.log(item);  //测试
    //     if (item.id && item.webUrl) {
    //       console.log("itemId : " + item.id);  //测试
    //       console.log("webUrl : " + item.webUrl);  //测试
    //     } else {
    //       console.log(" 第" + index + "视频分块onedrive的id或url为空");
    //       await uploadFile(accessToken, drive, filePath, filename, sign, index);
    //     }
    //   });
    // }

    // await open(clientIndex);
    // // let id = 0;
    // if (client[clientIndex]) {
    //   // let id = 0;
    //   // let channelId = 0;
    //   // let accessHash = 0;
    //   // let index = 0;
    //   for await (const dialog of client[clientIndex].iterDialogs({})) {
    //     // index += 1;
    //     // if (index === 5) {
    //     // //   const cache = [];
    //     // //   const json_str = JSON.stringify(dialog, function(key, value) {
    //     // //     if (typeof value === 'object' && value !== null) {
    //     // //       if (cache.indexOf(value) !== -1) {
    //     // //         return;
    //     // //       }
    //     // //       cache.push(value);
    //     // //     }
    //     // //     return value;
    //     // //   });
    //     // //   console.log(json_str);  //测试
    //     // //   break;  //测试
    //     //   if (dialog.isChannel === true) {
    //     //     console.log(dialog.entity.username);  //测试
    //     //     console.log(dialog.draft._entity.username);  //测试
    //     //     break;  //测试
    //     //   }
    //     // }
    //     // if (dialog?.isUser === true) {
    //     if (dialog?.draft?._entity?.bot === true) {
    //     // if (dialog?.entity?.deleted === true) {
    //     // if (dialog?.draft?._entity?.bot === true && dialog?.entity?.deleted === true) {
    //       const cache = [];
    //       const json_str = JSON.stringify(dialog, function(key, value) {
    //         if (typeof value === 'object' && value !== null) {
    //           if (cache.indexOf(value) !== -1) {
    //             return;
    //           }
    //           cache.push(value);
    //         }
    //         return value;
    //       });
    //       console.log(json_str);  //测试
    //     }
    //     // console.log(dialog);  //测试
    //     // console.log(dialog.username);  //测试
    //     // console.log(JSON.stringify(dialog));  //测试
    //     //id = dialog.id;
    //     // console.log(id);  //测试
    //     // channelId = dialog.inputEntity.channelId;
    //     // // channelId = dialog.draft._peer.channelId;
    //     // // channelId = dialog.draft._entity.id;
    //     // // channelId = dialog.entity.id;
    //     // accessHash = dialog.inputEntity.accessHash;
    //     // // accessHash = dialog.draft._entity.accessHash;
    //     // // accessHash = dialog.entity.accessHash;
    //     // console.log({"channelId1" : channelId});  //测试
    //     // console.log({"accessHash2" : accessHash});  //测试
    //     // break;  //测试
    //   }
    //   await close(clientIndex);  //测试
    //   return;  //测试

    //   // const fromPeer = await client[clientIndex].getInputEntity("me");
    //   // // console.log(fromPeer);  //测试
    //   // console.log(JSON.stringify(fromPeer));  //测试
    //   let fromPeer = null;
    //   const users = await client[clientIndex].invoke(
    //     new Api.users.GetUsers({
    //       id: [
    //         new Api.InputUser({
    //           // userId: 7585811878,
    //           // accessHash: bigInt.zero,
    //           // userId: bigInt("777000"),  //Telegram
    //           // accessHash: bigInt("4676278659094415168"),
    //           // userId: bigInt("8644136882"),  //nnfilebot
    //           // accessHash: bigInt("-1388224743701786177"),
    //           userId: bigInt("7951507140"),  //HiveSeekbot
    //           accessHash: bigInt("5567208255070274409"),
    //         }),
    //       ],
    //     })
    //   );
    //   if (users.length && !(users[0] instanceof Api.UserEmpty)) {
    //     fromPeer = utils.getInputPeer(users[0]);
    //   }
    //   // console.log(JSON.stringify(fromPeer));  //测试

    //   // const peer = new Api.InputPeerSelf();
    //   // const message = "showfilesbot_4P_2V_U127T6s5B982l8i9R0k6";
    //   // const result = await client[clientIndex].invoke(
    //   //   new Api.messages.SendMessage({
    //   //     peer: fromPeer,
    //   //     message: message,
    //   //     silent: true,
    //   //   })
    //   // );
    //   // console.log(result);  //测试
    //   // await close(clientIndex);  //测试
    //   // return;  //测试

    //   // const timeOut = new Promise((resolve, reject) => {
    //   //   setTimeout(() => {
    //   //     return resolve();
    //   //     // return reject(new Error("error"));
    //   //   }, 5000);
    //   // });
    //   // // await Promise.race([
    //   // //   client[clientIndex].getInputEntity(8349419657),
    //   // //   timeOut
    //   // // ]).then((value) => {
    //   // //   console.log(value);  //测试
    //   // //   console.log({"value" : "111"});  //测试
    //   // // });
    //   // const value = await Promise.race([
    //   //   // client[clientIndex].getInputEntity(8349419657),
    //   //   client[clientIndex].invoke(
    //   //     new Api.users.GetUsers({
    //   //       id: [
    //   //         new Api.InputUser({
    //   //           userId: 7585811878,
    //   //           accessHash: bigInt.zero,
    //   //         }),
    //   //       ],
    //   //     })
    //   //   ),
    //   //   timeOut
    //   // ]);
    //   // console.log(value);  //测试
    //   // console.log({"value" : "111"});  //测试

    //   // let toPeer = null;
    //   // const toUsers = await client[clientIndex].invoke(
    //   //   new Api.users.GetUsers({
    //   //     id: [
    //   //       new Api.InputUser({
    //   //         userId: 2029656369,   //zjm4038
    //   //         accessHash: bigInt.zero,
    //   //       }),
    //   //     ],
    //   //   })
    //   // );
    //   // // console.log(toUsers);  //测试
    //   // // console.log(toUsers.length);  //测试
    //   // if (toUsers.length && !(toUsers[0] instanceof Api.UserEmpty)) {
    //   //   toPeer = utils.getInputPeer(toUsers[0]);
    //   // }
    //   // // console.log(toPeer);  //测试
    //   // // console.log(JSON.stringify(toPeer));  //测试

    //   // channelId = bigInt(channelId.toString());
    //   // accessHash = bigInt(accessHash.toString());
    //   // const result = await client[clientIndex].invoke(new Api.channels.GetChannels({
    //   //   id: [new Api.InputChannel({
    //   //     channelId: channelId,
    //   //     accessHash: accessHash,
    //   //   })],
    //   // }));
    //   // // console.log(result);  //测试
    //   // console.log(result.chats.length);  //测试
    //   // console.log(result.chats[0]);  //测试

    //   // await open(2);
    //   // for await (const dialog of client[2].iterDialogs({})) {
    //   //   // console.log(dialog);  //测试
    //   //   //id = dialog.id;
    //   //   // console.log(id);  //测试
    //   //   channelId = dialog.inputEntity.channelId;
    //   //   accessHash = dialog.inputEntity.accessHash;
    //   //   console.log({"channelId2" : channelId});  //测试
    //   //   console.log({"accessHash2" : accessHash});  //测试
    //   //   // console.log(JSON.stringify(dialog));  //测试
    //   //   break;
    //   // }

      // // const idArray = [];
      // // const fileIdArray = [];
      // for await (const message of client[clientIndex].iterMessages(
      //     // "me",
      //     fromPeer,
      //     {
      //       limit: 20,
      //       reverse: false,
      //       // reverse: true,
      //       // addOffset: 10000,
      //       // addOffset: -1,
      //       addOffset: 0,
      //       // filter: Api.InputMessagesFilterVideo,
      //       waitTime: 60,
      //     })
      //   ) {
      //     // const forwardResult = await client[clientIndex].invoke(new Api.messages.ForwardMessages({
      //     //   silent: true,
      //     //   background: true,
      //     //   withMyScore: true,
      //     //   fromPeer: fromPeer,
      //     //   toPeer: toPeer,
      //     //   id: [message.id],
      //     //   randomId: [message.id],
      //     //   //scheduleDate: 0,
      //     // }));
      //     // // console.log(JSON.stringify(forwardResult));  //测试
      //     // console.log("-------------------------------------------------------------");  //测试
      //     // break;
      //     // // console.log(forwardResult);  //测试
      //     // console.log(message);  //测试
      //     // const regexp = /^\d+$/i;
      //     if (message.replyMarkup) {
      //       if (message.replyMarkup.rows) {
      //         console.log(message);  //测试
      //         // for (const row of message.replyMarkup.rows) {
      //         //   // console.log(row);  //测试
      //         //   for (const button of row.buttons) {
      //         //     // console.log(button);  //测试
      //         //     // if (button.text === "加入队列全部推送") {
      //         //     // if (button.text === "下一页 ➡️") {
      //         //     if (button.text === "▶️ 自动发送") {
      //         //     // if (button.text?.includes("➡️ 查看下一组 (") === true) {
      //         //       // console.log(button.text);  //测试
      //         //       const result = await client[clientIndex].invoke(new Api.messages.GetBotCallbackAnswer({
      //         //         peer: fromPeer,
      //         //         msgId: message.id,
      //         //         data: button.data,
      //         //       }));
      //         //       console.log(result);  //测试
      //         //     }
      //         //     // console.log(button.text + " : " + regexp.test(button.text));  //测试
      //         //   }
      //         // }
      //       }
      //     }
      //     // if (message.media) {
      //     //   if (message.media.document) {
      //     //     try {
      //     //       // let media = message.media;
      //     //       // if (media instanceof Api.InputMediaUploadedDocument) {
      //     //       //   const r = await client[clientIndex].invoke(
      //     //       //     new Api.messages.UploadMedia({
      //     //       //       peer: toPeer,
      //     //       //       media: media,
      //     //       //     })
      //     //       //   );
      //     //       //   console.log(r);  //测试
      //     //       //   if (r instanceof Api.MessageMediaDocument) {
      //     //       //     media = utils.getInputMedia(r.document);
      //     //       //   }
      //     //       // }
      //     //       // console.log(media);  //测试
      //     //       message.noforwards = false;
      //     //       message.media.document.id = "0000000000000000000";
      //     //       message.media.document.accessHash = "0000000000000000000";
      //     //       const result = await client[clientIndex].invoke(new Api.messages.SendMedia({
      //     //         // peer: "me",
      //     //         peer: toPeer,
      //     //         media: message.media,
      //     //         message: message.message,
      //     //         // entities: msgEntities,
      //     //         // replyTo: replyObject,
      //     //         // replyMarkup: markup,
      //     //         // silent: silent,
      //     //         // scheduleDate: scheduleDate,
      //     //         // clearDraft: clearDraft,
      //     //         // noforwards: false,
      //     //         // sendAs: sendAs,
      //     //         // effect: effect,
      //     //         // invertMedia: invertMedia,
      //     //       }));
      //     //       console.log(result);  //测试
      //     //     } catch (err) {
      //     //       console.log(err);  //测试
      //     //     }
      //     //     // try {
      //     //     //   const forwardResult = await client[clientIndex].invoke(new Api.messages.ForwardMessages({
      //     //     //     fromPeer: fromPeer,
      //     //     //     id: [message.id],
      //     //     //     randomId: [message.media.document.id],
      //     //     //     toPeer: toPeer,
      //     //     //     silent: true,
      //     //     //     background: true,
      //     //     //     withMyScore: true,
      //     //     //     dropAuthor: true,
      //     //     //     dropMediaCaptions: true,
      //     //     //     // noforwards: true,
      //     //     //     // scheduleDate: 0,
      //     //     //     // sendAs: "username",
      //     //     //   }));
      //     //     //   console.log(forwardResult);  //测试
      //     //     // } catch (err) {
      //     //     //   console.log(e);  //测试
      //     //     // }
      //     //     // const messageId = message.id;
      //     //     // console.log("messageId : " + messageId);  //测试
      //     //     // if (messageId > 0) {
      //     //     //   const messageResult = await selectMessage(messageId);
      //     //     //   // console.log(messageResult);  //测试
      //     //     //   const dbIndex = messageResult.dbIndex;
      //     //     //   const ids = JSON.parse(messageResult.ids);
      //     //     //   const length = ids.length;
      //     //     //   if (dbIndex > 0 && length > 0) {
      //     //     //     const mediaResult = await selectMedia(dbIndex, ids[0]);
      //     //     //     const hash = JSON.parse(mediaResult.hash);
      //     //     //     console.log("hash : " + hash[0]);  //测试
      //     //     //     const hashLength = hash.length;
      //     //     //     const size = parseInt(message.media.document.size);
      //     //     //     const count = Math.ceil(size / 131072);
      //     //     //     if (count === hashLength) {
      //     //     //       const fileArray = [];
      //     //     //       const info = utils.getFileInfo(message.media);
      //     //     //       let sender = await client[clientIndex].getSender(info.dcId);
      //     //     //       for (let currentPart = 0; currentPart < count; currentPart++) {
      //     //     //         let result = undefined;
      //     //     //         try {
      //     //     //           result = await client[clientIndex].invokeWithSender(
      //     //     //             new Api.upload.GetFile({
      //     //     //               location: info.location,
      //     //     //               offset: currentPart * 131072,
      //     //     //               limit: 131072,
      //     //     //             }),
      //     //     //             sender
      //     //     //           );
      //     //     //         } catch (err) {
      //     //     //         }
      //     //     //         if (result) {
      //     //     //           const buffer = result.bytes;
      //     //     //           console.log("buffer length : " + buffer.length);  //测试
      //     //     //           const md5 = crypto.createHash("md5");
      //     //     //           md5.update(buffer);
      //     //     //           const md5Result = md5.digest("hex");
      //     //     //           console.log("md5 : " + md5Result);  //测试
      //     //     //           const sha1 = crypto.createHash("sha1");
      //     //     //           const sha1Result = sha1.update(buffer).digest("hex");
      //     //     //           console.log("sha1 : " + sha1Result);  //测试
      //     //     //           const sha2 = crypto.createHash("sha256");
      //     //     //           const sha2Result = sha2.update(buffer).digest("hex");
      //     //     //           console.log("sha2 : " + sha2Result);  //测试
      //     //     //           if (sha2Result === hash[0]) {
      //     //     //             const key = Buffer.from(sha2Result.substring(0, 32), "utf8");
      //     //     //             const iv = Buffer.from(md5Result.substring(8, 24), "utf8");
      //     //     //             const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
      //     //     //             let sign = [];
      //     //     //             sign.push(cipher.update(buffer));
      //     //     //             sign.push(cipher.final());
      //     //     //             sign = Buffer.concat(sign);
      //     //     //             // console.log("sign type : " + typeof sign);  //测试
      //     //     //             // console.log("sign : " + sign);  //测试
      //     //     //             console.log("sign length : " + sign.length);  //测试
      //     //     //             const newMd5 = crypto.createHash("md5");
      //     //     //             newMd5.update(sign);
      //     //     //             const filename = newMd5.digest("hex");
      //     //     //             console.log("filename : " + filename);  //测试
      //     //     //             fileArray.push(filename);
      //     //     //             // const accessToken = await getCurrentToken(driveIndex, i);
      //     //     //             // await uploadFile(accessToken, drive, filename, sign, currentPart);
      //     //     //           } else {
      //     //     //             console.log("!hash");  //测试
      //     //     //           }
      //     //     //         } else {
      //     //     //           console.log("!result");  //测试
      //     //     //         }
      //     //     //         break;  //测试
      //     //     //       }
      //     //     //     } else {
      //     //     //       console.log("!=");  //测试
      //     //     //     }
      //     //     //   }
      //     //     // }
      //     //     // break;  //测试
      //     //     // // console.log(message);  //测试
      //     //     // // console.log(JSON.stringify(message));  //测试
      //     //     // dcId = message.media.document.dcId;
      //     //     // id = message.media.document.id.toString();
      //     //     // accessHash = message.media.document.accessHash.toString();
      //     //     // fileReference = message.media.document.fileReference.toString("base64");
      //     //     // // fileReference = message.media.document.fileReference.toString("utf8");
      //     //     // // const decoder = new TextDecoder('utf-8');
      //     //     // // const decoder = new TextDecoder();
      //     //     // // fileReference = decoder.decode(message.media.document.fileReference);
      //     //     // // console.log(id);  //测试   6102674127003320582
      //     //     // // console.log(Number(message.media.document.id));  //测试   6102674127003320000
      //     //     // // console.log(dcId);  //测试
      //     //     // // console.log(id);  //测试
      //     //     // // console.log(accessHash);  //测试
      //     //     // // console.log(fileReference);  //测试
      //     //     // // const mediaInfo = await env.DB.prepare("INSERT INTO `MEDIA` (id, accessHash, dcId, fileReference) VALUES (?, ?, ?, ?);").bind(id, accessHash, dcId, fileReference).run();
      //     //     // // // console.log(mediaInfo);  //测试
      //     //     // // if (mediaInfo.success === true) {
      //     //     // //   console.log("插入media数据成功");
      //     //     // // } else {
      //     //     // //   console.log("插入media数据失败");
      //     //     // // }
      //     //     // // console.log(JSON.stringify(message));  //测试
      //     //     // // id = message.id;
      //     //     // // channelId = message.savedPeerId.channelId.toString();
      //     //     // // if (message.savedPeerId.accessHash) {
      //     //     // //   channelAccessHash = message.savedPeerId.accessHash.toString();
      //     //     // // }
      //     //     // // console.log(id);  //测试
      //     //     // // const result = await client[clientIndex].invoke(new Api.messages.GetMessages({
      //     //     // //   id: [new Api.InputMessageID({ id: id })],
      //     //     // // }));
      //     //     // // console.log(result);  //测试
      //     //     // // // console.log(result.chats.length);  //测试
      //     //     // // // console.log(result.chats[0]);  //测试
      //     //     // // console.log(result.messages.length);  //测试
      //     //     // // console.log(result.messages[0]);  //测试
      //     //     // const info = utils.getFileInfo(message.media);
      //     //     // let sender = await client[clientIndex].getSender(info.dcId);
      //     //     // let hashes = await client[clientIndex].invokeWithSender(
      //     //     //   new Api.upload.GetFileHashes({
      //     //     //     location: info.location,
      //     //     //     offset: 0,
      //     //     //   }),
      //     //     //   sender
      //     //     // );
      //     //     // let hash = [];
      //     //     // let length = hashes.length;
      //     //     // if (length > 0) {
      //     //     //   for (let i = 0; i < length; i++) {
      //     //     //     hash.push(hashes[i].hash.toString("hex"));
      //     //     //   }
      //     //     // }
      //     //     // // console.log(hash);  //测试
      //     //     // console.log(JSON.stringify(hash));  //测试

      //     //     // const mediaResult = await env.DB.prepare("SELECT * FROM `MEDIA` WHERE `id` = ? AND `accessHash` = ?;").bind(id, accessHash).first();
      //     //     // // console.log(mediaResult);  //测试
      //     //     // if (mediaResult) {
      //     //     //   dcId = mediaResult.dcId;
      //     //     //   id = mediaResult.id;
      //     //     //   accessHash = mediaResult.accessHash;
      //     //     //   fileReference = Buffer.from(mediaResult.fileReference);
      //     //     //   // console.log(dcId);  //测试
      //     //     //   // console.log(id);  //测试
      //     //     //   // console.log(accessHash);  //测试
      //     //     //   // console.log(fileReference);  //测试
      //     //     //   id = bigInt(id);
      //     //     //   accessHash = bigInt(accessHash);
      //     //     //   sender = await client[clientIndex].getSender(dcId);
      //     //     //   const location = await new Api.InputDocumentFileLocation({
      //     //     //     id: id,
      //     //     //     accessHash: accessHash,
      //     //     //     fileReference: fileReference,
      //     //     //     thumbSize: "",
      //     //     //   });
      //     //     //   hashes = await client[clientIndex].invokeWithSender(
      //     //     //     new Api.upload.GetFileHashes({
      //     //     //       location: location,
      //     //     //       offset: 0,
      //     //     //     }),
      //     //     //     sender
      //     //     //   );
      //     //     //   hash = [];
      //     //     //   length = hashes.length;
      //     //     //   if (length > 0) {
      //     //     //     for (let i = 0; i < length; i++) {
      //     //     //       hash.push(hashes[i].hash.toString("hex"));
      //     //     //     }
      //     //     //   }
      //     //     //   // console.log(hash);  //测试
      //     //     //   console.log(JSON.stringify(hash));  //测试
      //     //     // }
      //     //     // console.log("-------------------------------------------------------------");  //测试
      //     //     // break;  //测试
      //     //   }
      //     // // } else {
      //     // //   console.log(message);  //测试
      //     // //   idArray.push(message.id);  //测试
      //     // //   fileIdArray.push(message.id);  //测试
      //     // }
      //     // break;  //测试
      //   }
      //   // console.log(idArray);  //测试
      //   // console.log(idArray.length);  //测试
      
      // // const forwardResult = await client[clientIndex].invoke(new Api.messages.ForwardMessages({
      // //   fromPeer: "me",
      // //   id: idArray,
      // //   randomId: fileIdArray,
      // //   toPeer: toPeer,
      // //   silent: true,
      // //   background: true,
      // //   withMyScore: true,
      // //   dropAuthor: true,
      // //   dropMediaCaptions: true,
      // //   // noforwards: true,
      // //   // scheduleDate: 0,
      // //   // sendAs: "username",
      // // }));

      // await close(clientIndex);
      // await open(2);

      // id = bigInt(id);
      // accessHash = bigInt(accessHash);
      // fileReference = Buffer.from(fileReference, "base64");
      // // fileReference = Buffer.from(fileReference, "utf8");
      // // fileReference = new Uint8Array(fileReference).buffer;
      // // const encoder = new TextEncoder();
      // // fileReference = encoder.encode(fileReference).buffer;
      // // console.log(fileReference);  //测试
      // const sender = await client[2].getSender(dcId);
      // const location = await new Api.InputDocumentFileLocation({
      //   id: id,
      //   accessHash: accessHash,
      //   fileReference: fileReference,
      //   thumbSize: "",
      // });
      // const hashes = await client[2].invokeWithSender(
      //   new Api.upload.GetFileHashes({
      //     location: location,
      //     offset: 0,
      //   }),
      //   sender
      // );
      // const hash = [];
      // const length = hashes.length;
      // if (length > 0) {
      //   for (let i = 0; i < length; i++) {
      //     hash.push(hashes[i].hash.toString("hex"));
      //   }
      // }
      // // console.log(hash);  //测试
      // console.log(JSON.stringify(hash));  //测试

      // // const result = await client[2].invoke(new Api.messages.GetMessages({
      // //   id: [new Api.InputMessageID({ id: id })],
      // // }));

      // // channelId = bigInt(channelId);
      // // if (channelAccessHash) {
      // //   channelAccessHash = bigInt(channelAccessHash);
      // // } else {
      // //   channelAccessHash = bigInt.zero;
      // // }
      // // const result = await client[2].invoke(new Api.channels.GetMessages({
      // //   channel: new Api.InputChannel({
      // //     channelId: channelId,
      // //     accessHash: channelAccessHash,
      // //   }),
      // //   id: [new Api.InputMessageID({ id: id })],
      // // }));
      // // console.log(JSON.stringify(result));  //测试

      // console.log("-------------------------------------------------------------");  //测试
      // await close(2);
//   }

// //    const me = await client[clientIndex].getEntity("me");
// //    console.log("My name is",utils.getDisplayName(me));  //测试
// //    const chat = await client[clientIndex].getInputEntity("username");
// //    console.log(chat);  //测试
// //    await close(clientIndex);

//     return new Response("error");
  },
};
