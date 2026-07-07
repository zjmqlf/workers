import { DurableObject } from "cloudflare:workers";
import { TelegramClient, Api, sessions } from "./teleproto";
import { LogLevel } from "./teleproto/extensions";
import bigInt from "big-integer";

export class WebSocketServer extends DurableObject {
  // webSocket = [];
  ws = null;
  stop = 0;
  apiCount = 0;
  currentStep = 0;
  compress = false;
  batch = false;
  client = null;
  reverse = true;
  limit = 100;
  offsetId = 0;
  fromPeer = null;
  errorMessage = "Too many API requests by single Worker invocation. To configure this limit, refer to https://developers.cloudflare.com/workers/wrangler/configuration/#limits";
  messageArray = [];
  cacheMessage = null;
  batchMessage = [];

  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    this.storage = ctx.storage;
    // this.sql = ctx.storage.sql;
    this.env = env;

    // this.ctx.getWebSockets().forEach((ws) => {
    //   const found = this.webSocket.find(element => element === ws);
    //   if (!found) {
    //     this.webSocket.push(ws);
    //     //console.log("(" + this.currentStep + ")添加ws成功");
    //     // this.broadcast({
    //     //   "step": this.currentStep,
    //     //   "operate": "constructor",
    //     //   "message": "添加ws成功",
    //     //   "date": new Date().getTime(),
    //     // });
    //   }
    // });

    // this.ctx.blockConcurrencyWhile(async () => {
    //   this.init();
    //   if (!this.client) {
    //     await this.open(1);
    //   }
    // });

    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong"),
    );
  }

  init(option) {
    if (!this.client || !this.stop || this.stop === 0) {
    // if (!this.stop || this.stop === 0) {
      if (option) {
        if (option.compress) {
          this.compress = option.compress;
        }
        if (option.batch) {
          this.batch = option.batch;
        }
        if (option.reverse) {
          this.reverse = option.reverse;
        }
        if (option.limit && option.limit > 0) {
          this.limit = option.limit;
        }
        if (option.offsetId && option.offsetId > 0) {
          this.offsetId = option.offsetId;
        }
      } else {
        this.compress = false;
        this.batch = false;
        this.reverse = true;
        this.limit = 100;
        this.offsetId = 0;
      }
      // this.ws = null;
      // this.client = null;
      // this.stop = 0;
      // this.webSocket = [];
      this.apiCount = 0;
      this.currentStep = 0;
      this.fromPeer = null;
      this.errorMessage = "Too many API requests by single Worker invocation. To configure this limit, refer to https://developers.cloudflare.com/workers/wrangler/configuration/#limits";
      this.messageArray = [];
      this.cacheMessage = null;
      this.batchMessage = [];
    }
  }

  updateTime(date) {
    if (date && (date >= this.cacheMessage.time)) {
      this.cacheMessage.date = date;
      if (date >= this.cacheMessage.time) {
        this.cacheMessage.useTime = date - this.cacheMessage.time;
      }
    }
  }

  broadcast(message) {
    if (this.compress === true) {
      if (message.operate === "open") {
      } else if (message.operate === "close") {
      } else if (message.status === "limit") {
      } else if (message.status === "flood") {
      } else if (!message.error) {
        if (!message.result) {
          return;
        }
      }
      if (this.batch === true) {
        if (this.batchMessage.length < this.limit) {
          this.batchMessage.push(message);
          return;
        } else {
          const temp = message;
          message = this.batchMessage;
          // this.batchMessage = [];
          // this.batchMessage.push(temp);
          this.batchMessage = [temp];
        }
      }
    } else if (this.batch === true) {
      if (this.batchMessage.length < this.limit) {
        this.batchMessage.push(message);
        return;
      } else {
        const temp = message;
        message = this.batchMessage;
        // this.batchMessage = [];
        // this.batchMessage.push(temp);
        this.batchMessage = [temp];
      }
    }
    // if (typeof message !== "string") {
      message = JSON.stringify(message);
    // }
    this.ctx.getWebSockets().forEach((ws) => {
    // this.webSocket.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          // ws.send(JSON.stringify(message));
          ws.send(message);
        } catch (e) {
          // console.log(e);
          // const index = this.webSocket.findIndex(element => element === ws);
          // if (index > -1) {
          //   this.webSocket.splice(index, 1);
          //   //console.log("(" + this.currentStep + ")删除ws成功");
          //   // this.broadcast({
          //   //   "step": this.currentStep,
          //   //   "operate": "broadcast",
          //   //   "message": "删除ws成功",
          //   //   "date": new Date().getTime(),
          //   // });
          // } else {
          //   //console.log("(" + this.currentStep + ")没找到该ws");
          //   this.broadcast({
          //     "step": this.currentStep,
          //     "operate": "broadcast",
          //     "message": "没找到该ws",
          //     "error": true,
          //     "date": new Date().getTime(),
          //   });
          // }
        }
      }
    });
  }

  sendGrid(operate, message, status, error) {
    this.broadcast({
      "step": this.currentStep,
      "offsetId": this.offsetId,
      "operate": operate,
      "message": message,
      "status": status,
      "error": error,
      "date": new Date().getTime(),
    });
  }

  sendLog(operate, message, status, error) {
    this.broadcast({
      "step": this.currentStep,
      "operate": operate,
      "message": message,
      "status": status,
      "error": error,
      "date": new Date().getTime(),
    });
  }

  async close() {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      //console.log("断开服务器成功");
      this.sendLog("close", "断开服务器成功", null, false);
    }
    this.stop = 0;
    this.ws.close();
    this.ctx.abort("reset");
  }

  async open(tryCount) {
    // const apiId = 1334621;
    // const apiHash = "2bc36173f487ece3052a00068be59e7b";
    // const sessionString = "1BQANOTEuMTA4LjU2LjE0NwG7BOSn4tw5dznEmJS7Z58vPhNf6Oi9oHukQBdWc+bAGh/UKzkp+DAa+OJCDQ2Pt/DYmsPN+xNe6TvnlQFlhGMp1lvMfedMcOWP/ZKU+M7xVizs57ZKk0lGIq0pbdaRwavH7CSdqPyDhLQSLaQs/HRv2ESqxY+SqNB16C0ZBT28vvOEqb3/3MJzbhimVL3ccPiAeEv4vOsc6E0Y+h1d+fM7QuhtwW9wSyD1Jsl5f/kcPK5wahRVV3+ZbCWA6XFaQXZ5pDfDevFKDn/zyOhmwdvqbOKk9rbKU8fqhVnC+5XsVDeZQEqidyOmf6nTF8mJm4P2kR6wrftOXL2Y+nEgOclPNw==";
    const apiId = 25429403;
    const apiHash = "2bb9a1bfd8f598da6cb5c511f0e5fbdf";
    const sessionString = "1BQANOTEuMTA4LjU2LjExMwG7AU805ztc1oA8tvnUgxwqXOJXnS0DtG1WVCK8EiohmAV0fZwxlbIvX9opqaU4rUjAk6yaarBHiTOgSAHX8+q/OfoCGqttGWSQ1yQpzOgqxu1tWY9txhr7/9SexpYtk8YFhNX2KUNw4y8e+legfUVIpfgLNgRbyPlyPsomSpXrPdRROie3lqiqm2UI5RjMWQxzD293SpSG3uUED0FseMSbZggXff7Z1kxIw0YbgdSlnFT+x+o4GDjQ/T5247E5ZQxC3Qfzq67mNlKWT93/yjTruqdxr2zM0gB5/8ciPiFLgAOLVZPxOInV+kcZ3OZw1uky/LD0Kn/oCpNAkaxzAFV8xA==";
    try {
      this.client = new TelegramClient(new sessions.StringSession(sessionString), apiId, apiHash, {
        connectionRetries: Number.MAX_VALUE,
        autoReconnect: true,
        deviceModel: "Desktop",
        systemVersion: "Windows 11",
        appVersion: "6.7.6 x64",
        langCode: "en",
        systemLangCode: "en-US",
        // langCode: "zhcncc",
        // systemLangCode: "zh-CN",
      });
      this.client.session.setDC(5, "91.108.56.128", 80);
      this.client.setLogLevel(LogLevel.ERROR);
      await this.client.connect();
    } catch (e) {
      //console.log("login出错 : " + e);
      this.sendLog("open", "login出错 : " + e, null, true);
      if (tryCount === 20) {
        this.stop = 2;
        //console.log("(" + this.currentStep + ")open超出tryCount限制");
        this.sendLog("open", "超出tryCount限制", null, true);
        await this.close();
      } else {
        await scheduler.wait(30000);
        await this.open(tryCount + 1);
      }
      return;
    }
    this.stop = 1;
    //console.log("连接服务器成功");
    this.sendLog("open", "连接服务器成功", null, false);  //测试
    //console.log(this.client);  //测试
    //await scheduler.wait(5000);
  }

  async getChat(tryCount) {
    let result = null;
    try {
      result = await this.client.invoke(
        new Api.channels.GetChannels({
          id: [new Api.InputChannel({
            channelId: bigInt(3982534960),   //蜂巢热门密钥
            accessHash: bigInt(6100294192930071508),
          })],
        })
      );
    } catch (e) {
      //console.log("(" + this.currentStep + ")出错 : " + e);
      this.sendLog("getChat", "出错 : " + JSON.stringify(e), null, true);
      if (e.errorMessage === "CHANNEL_INVALID" || e.errorMessage === "CHANNEL_PRIVATE" || e.code === 400) {
        //console.log("chat已不存在了");  //测试
        this.sendLog("getChat", "chat已不存在了", null, true);
      } else {
        if (tryCount === 20) {
          this.stop = 2;
          //console.log("(" + this.currentStep + ")getChat超出tryCount限制");
          this.sendLog("getChat", "超出tryCount限制", null, true);
          await this.close();
        } else {
          await scheduler.wait(10000);
          await this.getChat(tryCount + 1);
        }
      }
      return;
    }
    // console.log(this.fromPeer);  //测试this.
    if (result && result.chats && result.chats.length > 0) {
      this.fromPeer = result.chats[0];
      if (this.fromPeer) {
        this.sendLog("getChat", "caht", "add", false);
      } else {
        //console.log("chat已不存在了");  //测试
        this.sendLog("getChat", "chat已不存在了", null, true);
      }
    } else {
      //console.log("chat已不存在了");  //测试
      this.sendLog("getChat", "chat已不存在了", null, true);
    }
  }

  async getMessage(tryCount) {
    try {
      // this.messageArray = [];
      for await (const message of this.client.iterMessages(
        this.fromPeer,
        //"me",  //测试
        {
          limit: this.limit,
          //limit: 20,  //测试
          reverse: this.reverse,
          //reverse: false,  //测试
          addOffset: -this.offsetId,
          //addOffset: 0,  //测试
          waitTime: 60,
        })
      ) {
        this.messageArray.push(message);
      }
    } catch (e) {
      this.messageArray = [];
      if (e.errorMessage === "CHANNEL_INVALID" || e.errorMessage === "CHANNEL_PRIVATE" || e.code === 400) {
        this.fromPeer = null;
        //console.log("chat已不存在了");  //测试
        this.sendLog("getMessage", "chat已不存在了", null, true);
      } else {
        //console.log("(" + this.currentStep + ")getMessage出错 : " + e);
        this.sendLog("getMessage", "出错 : " + JSON.stringify(e), null, true);
        if (tryCount === 20) {
          this.stop = 2;
          //console.log("(" + this.currentStep + ")getMessage超出tryCount限制");
          this.sendLog("getMessage", "超出tryCount限制", null, true);
          await this.close();
        } else {
          await scheduler.wait(10000);
          await this.getMessage(tryCount + 1);
        }
      }
      return;
    }
  }

  async selectCodeError(tryCount, code) {
    if (tryCount === 20) {
      this.stop = 2;
      //console.log("(" + this.currentStep + ")selectCode超出tryCount限制");
      this.sendLog("selectCode", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      await this.selectCode(tryCount + 1, code);
    }
  }

  async selectCode(tryCount, code) {
    this.apiCount += 1;
    let codeResult = {};
    try {
      codeResult = await this.env.MAINDB.prepare("SELECT COUNT(code) FROM `CODE` WHERE `code` = ? LIMIT 1;").bind(code).run();
    } catch (e) {
      //console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : selectCode出错 : " + e);
      this.sendGrid("selectCode", "出错 : " + e.message, "try", true);
      if (e.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.selectCodeError(tryCount, code);
      }
      return;
    }
    //console.log("codeResult : " + codeResult["COUNT(code)"]);  //测试
    if (codeResult.success === true) {
      if (codeResult.results && codeResult.results.length > 0) {
        return codeResult.results[0]["COUNT(code)"];
      }
    } else {
      await this.selectCodeError(tryCount, code);
    }
  }

  async insertCodeError(tryCount, code) {
    if (tryCount === 20) {
      this.stop = 2;
      //console.log("(" + this.currentStep + ")insertCode超出tryCount限制");
      this.sendLog("insertCode", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      await this.insertCode(tryCount + 1, code);
    }
  }

  async insertCode(tryCount, code) {
    this.apiCount += 1;
    let codeResult = {};
    try {
      codeResult = await this.env.MAINDB.prepare("INSERT INTO `CODE` (code, status) VALUES (?, ?);").bind(code, 0).run();
    } catch (e) {
      //console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] : insertCode出错 : " + e);;
      this.sendGrid("insertCode", "出错 : " + e.message, "try", true);
      if (e.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.insertCodeError(tryCount, code);
      }
      return;
    }
    //console.log(codeResult);  //测试
    if (codeResult.success === true) {
      //console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] : 插入code数据成功");
      this.sendGrid("insertCode", "", "success", false);
    } else {
      //console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] : 插入code数据失败");
      this.sendGrid("insertCode", "插入code数据失败", "error", true);
      await this.insertCodeError(tryCount, code);
    }
  }

  async nextMessage(messageLength, messageIndex, message) {
    if (this.stop === 1) {
      if (this.apiCount < 900) {
        if (message) {
          const messageId = message.id;
          const entities = message.entities;
          this.broadcast({
            "step": this.currentStep,
            "operate": "nextMessage",
            // "messageLength": messageLength,
            // "messageIndex": messageIndex,
            "chatId": this.chatId,
            "offsetId": this.offsetId,
            "messageId": messageId,
            "status": "add",
            "date": new Date().getTime(),
          });
          if (entities) {
            for (const item of entities) {
              const url = item.url?.trim();
              if (url) {
                const string = url.split("https://t.me/Turnautobot?start=");
                if (string.length === 2) {
                  const code = string[1].replace("f_", "LH_").replace("F_", "LH_");
                  if (code) {
                    const codeCount = await this.selectCode(1, code);
                    if (parseInt(codeCount) === 0) {
                      await this.insertCode(1, code);
                    } else {
                      //console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : message已在数据库中");
                      this.sendGrid("nextMessage", "", "exist", false);
                    }
                  } else {
                    //console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : code为空");
                    this.sendGrid("nextMessage", "code为空", "error", true);
                  }
                  break;
                }
              }
            }
            this.offsetId += 1;
          } else {
            //console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 错误的消息");
            this.sendGrid("nextMessage", "txt为空", "error", true);
            this.offsetId += 1;
          }
        } else {
          //console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 错误的消息");
          this.sendGrid("nextMessage", "错误的消息", "error", true);
          this.offsetId += 1;
        }
      } else {
        this.stop = 2;
        //console.log("(" + this.currentStep + ")nextMessage超出apiCount限制");
        this.sendGrid("nextMessage", "超出apiCount限制", "limit", true);
        await this.close();
        // this.ctx.abort("reset");
      }
    } else if (this.stop === 2) {
      this.broadcast({
        "result": "pause",
      });
      await this.close();
    }
  }

  async nextStep() {
    if (this.stop === 1) {
      this.currentStep += 1;
      await this.getMessage(1);
      await scheduler.wait(5000);
      const messageArray = this.messageArray.slice();
      const messageLength = messageArray.length;
      this.messageArray = [];
      //console.log("(" + this.currentStep + ")messageLength : " + messageLength);  //测试
      // this.sendLog("nextStep", "messageLength : " + messageLength, null, false);  //测试
      // if (messageLength > this.limit) {
      //   //console.log("(" + this.currentStep + ") messageLength比limit大");
      //   this.sendLog("nextStep", "messageLength比limit大", null, true);
      // }
      if (messageLength && messageLength > 0) {
        //console.log("(" + this.currentStep + ")messageLength : " + messageLength);
        this.sendLog("nextStep", "messageLength : " + messageLength, null, false);
        if (this.stop === 1) {
          for (let messageIndex = 0; messageIndex < messageLength; messageIndex++) {
            await this.nextMessage(messageLength, messageIndex + 1, messageArray[messageIndex]);
            // this.offsetId += 1;
          }
          if (this.stop === 1) {
            if (this.apiCount < 900) {
              await this.nextStep();
            } else {
              this.stop = 2;
              //console.log("(" + this.currentStep + ")nextStep超出apiCount限制");
              this.sendLog("nextStep", "超出apiCount限制", "limit", true);
              await this.close();
              // this.ctx.abort("reset");
            }
          } else if (this.stop === 2) {
            this.broadcast({
              "result": "pause",
            });
            await this.close();
          }
        } else if (this.stop === 2) {
          this.broadcast({
            "result": "pause",
          });
          await this.close();
        }
      } else {
        //console.log("(" + this.currentStep + ") 没有获取到有效的消息");
        this.sendLog("nextStep", "没有获取到有效的消息", "error", true);
        if (this.stop === 1) {
          await this.nextStep();
        } else if (this.stop === 2) {
          this.broadcast({
            "result": "pause",
          });
          await this.close();
        }
      }
    } else if (this.stop === 2) {
      this.broadcast({
        "result": "pause",
      });
      await this.close();
    }
  }

  async fetch(request) {
    const webSocketPair = new WebSocketPair();
    const [wsClient, wsServer] = Object.values(webSocketPair);
    this.ctx.acceptWebSocket(wsServer);
    // wsServer.send("chat success");  //测试
    this.ws = wsServer;
    return new Response(null, {
      status: 101,
      webSocket: wsClient,
    });
  }

  async start(option) {
    if (this.client || this.stop === 1) {
    // if (this.stop === 1) {
      this.ws.send(JSON.stringify({
        "step": this.currentStep,
        "operate": "start",
        "message": "服务已经运行过了",
        "error": true,
        "date": new Date().getTime(),
      }));
      return;
    }
    this.init(option);
    // this.stop = 1;
    await this.open(1);
    await this.getChat(1);
    if (this.fromPeer) {
      if (this.stop === 1) {
        this.currentStep += 1;
        await this.getMessage(1);
        await scheduler.wait(5000);
        const messageArray = this.messageArray.slice();
        const messageLength = messageArray.length;
        this.messageArray = [];
        //console.log("(" + this.currentStep + ")messageLength : " + messageLength);  //测试
        // this.sendLog("start", "messageLength : " + messageLength, null, false);  //测试
        // if (messageLength > this.limit) {
        //   //console.log("(" + this.currentStep + ") messageLength比limit大");
        //   this.sendLog("start", "messageLength比limit大", null, true);
        // }
        if (messageLength && messageLength > 0) {
          for (let messageIndex = 0; messageIndex < messageLength; messageIndex++) {
            await this.nextMessage(messageLength, messageIndex + 1, messageArray[messageIndex]);
            // this.offsetId += 1;
          }
          if (this.stop === 1) {
            if (this.apiCount < 900) {
              await this.nextStep();
            } else {
              this.stop = 2;
              //console.log("(" + this.currentStep + ")start超出apiCount限制");
              this.sendLog("start", "超出apiCount限制", "limit", true);
              await this.close();
              // this.ctx.abort("reset");
            }
          } else if (this.stop === 2) {
            this.broadcast({
              "result": "pause",
            });
            await this.close();
          }
        } else {
          //console.log("(" + this.currentStep + ") 没有获取到有效的消息");
          this.sendLog("start", "没有获取到有效的消息", "error", true);
          if (this.stop === 1) {
            await this.nextStep();
          } else if (this.stop === 2) {
            this.broadcast({
              "result": "pause",
            });
            await this.close();
          }
        }
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    } else {
      //console.log("查找不到fromPeer");
      this.sendLog("start", "查找不到fromPeer", null, false);
      this.broadcast({
        "result": "over",
      });
      await this.close();
    }
  }

  async webSocketMessage(ws, data) {
    let command = "";
    let option = null;
    // if (typeof data === "string") {
      try {
        data = JSON.parse(data);
        command = data.command;
        delete data.command;
        if (JSON.stringify(data) !== "{}") {
          option = data;
        }
      } catch (e) {
        command = data;
        //console.log("parse出错 : " + e);
        this.sendLog("webSocketMessage", "parse出错 : " + e, null, true);
      }
    // }
    if (command === "start") {
      await this.start(option);
    } else if (command === "pause") {
      this.stop = 2;
    } else if (command === "close") {
      this.stop = 2;
      await this.close();
    } else if (command === "over") {
      this.stop = 2;
      this.broadcast({
        "result": "over",
      });
      await this.close();
    } else if (command === "compress") {
      this.compress = true;
    } else if (command === "noCompress") {
      this.compress = false;
    } else if (command === "batch") {
      this.batch = true;
    } else if (command === "noBatch") {
      this.batch = false;
    } else if (command === "offsetId") {
      if (data.offsetId && data.offsetId >= 0 && this.offsetId !== data.offsetId) {
        this.offsetId = data.offsetId;
      }
    } else {
      this.broadcast({
        "operate": "webSocketMessage",
        "message": "未知消息",
        "error": true,
        "date": new Date().getTime(),
      });
    }
  }

  async webSocketClose(ws, code, reason, wasClean) {
    // this.stop = 0;
    ws.close(code, "Durable Object is closing WebSocket");
  }
}

export default {
  async fetch(request, env, ctx) {
    // const { pathname } = new URL(request.url);
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname === "/ws") {
      const upgradeHeader = request.headers.get("Upgrade");
      if (!upgradeHeader || upgradeHeader !== "websocket") {
        return new Response("Worker expected Upgrade: websocket", {
          status: 426,
        });
      }
      const id = env.WEBSOCKET_SERVER.idFromName("lockhivecode");
      const stub = env.WEBSOCKET_SERVER.get(id);
      return stub.fetch(request);
    }

    return new Response("error");
  },
};
