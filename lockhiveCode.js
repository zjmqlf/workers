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
    const sessionString = "1BQAWZmxvcmEud2ViLnRlbGVncmFtLm9yZwG7be+PddSzlPTzgS/mbCsxeZYLhE9ohnesT10Ntv+pdypA3wfrAUdXGXBLb2uturgLlkO49XMxAsIoELAdi8OprHkYfeEWZrQPF9RqjucdgWviAVd3oy/JIHk6lbB6NCS06US2CMdLZMxAsLFLu2JTgWiI07Xm2tpCIaaYED9mmH7NiROvqBx+jpB2GoFM4xzqaoB3y43BURo/ZYPEM3uUB4AVsS7IwdK0/j8pJL/ChB3buNnNtyVADe8wFvEAcbMn/385Xz53T21BdYqanzMuZX2O9cv4UNCpA9P6HoEYRn0D9XsljY6xJFNdR/RRKGHBqlVLK/Xt6PagRm321YBAvw==";
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
      if (e.errorMessage.includes("FLOOD_WAIT_") === true || e.code === 420) {
        //console.log("(" + this.currentStep + ") 触发了洪水警告，请求太频繁" + e);
        this.sendLog("getMessage", "触发了洪水警告，请求太频繁 : " + JSON.stringify(e), "flood", true);
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

  async waitNext(time, flood) {
    if (time && time > 0) {
      if (flood === false) {
        //console.log("(" + this.currentStep + ") 还需等待" + (time / 1000) + "秒");
        this.sendLog("waitNext", "还需等待" + Math.ceil(time / 1000) + "秒", "wait", true);
      }
      // const pingInterval = setInterval(function () {
      //   // this.ws.ping();
      //   this.ws.send("ping");
      // }, 30000);
      // await this.ctx.storage.setAlarm(30000);
      // await scheduler.wait(time);
      // clearInterval(pingInterval);
      // await this.ctx.storage.deleteAlarm();
      if (time > this.pingTime) {
        // const timeLength = Math.floor(time / 60000);
        const timeLength = Math.ceil(time / this.pingTime);
        for (let i = 0; i < timeLength; i++) {
          if (this.stop === 2) {
            this.broadcast({
              "result": "pause",
            });
            await this.close();
            break;
          } else {
            await scheduler.wait(this.pingTime);
            // this.ws.ping();
            // this.ws.send({
            //   "result": "ping",
            // });
            this.broadcast({
              "result": "ping",
            });
          }
        }
      } else {
        await scheduler.wait(time);
      }
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
        if (this.stop === 1) {
          let temp = null;
          let status = false;
          for (let messageIndex = 0; messageIndex < messageLength; messageIndex++) {
            if (messageArray[messageIndex]) {
              const id = messageArray[messageIndex].id;
              const message = messageArray[messageIndex].message.trim();
              if (message) {
                const regexp = /✅ 自动发送完成！成功 \d+\/\d+/i;
                const string = message.split(":");
                if (string[0] === "DEANIgniteNations_bot_v") {
                  await this.ctx.storage.put(message, 1);
                  //console.log("(" + this.currentStep + ") 代码入库完毕");
                  this.sendForward("nextStep", "代码入库完毕", "", "add", false);
                } else if (regexp.test(message) === true) {
                  temp = null;
                  const text = message.replace("✅ 自动发送完成！成功 ", "");
                  const regexp = /(\d+)/gi;
                  const matches = message.match(regexp);
                  if (matches) {
                    if (matches.length === 2) {
                      if (matches[0] === matches[1]) {
                        temp = null;
                      }
                    } else {
                      //console.log("(" + this.currentStep + ") " + text);
                      this.sendForward("start", "", text, "update", false);
                    }
                  }
                }
              }
            }
          }
          if (this.stop === 1) {
            await this.nextStep();
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
        if (this.count > 0) {
          this.offsetId += this.count;
          this.count = 0;
          await this.ctx.storage.put("offsetId", this.offsetId);
        }
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
            if (messageArray[messageIndex]) {
              const id = messageArray[messageIndex].id;
              const message = messageArray[messageIndex].message.trim();
              if (message) {
                const regexp = /✅ 自动发送完成！成功 \d+\/\d+/i;
                const string = message.split(":");
                if (string[0] === "DEANIgniteNations_bot_v") {
                  await this.ctx.storage.put(message, 1);
                  //console.log("(" + this.currentStep + ") 代码入库完毕");
                  this.sendForward("start", "代码入库完毕", "", "add", false);
                } else if (regexp.test(message) === true) {
                  temp = null;
                  const text = message.replace("✅ 自动发送完成！成功 ", "");
                  const regexp = /(\d+)/gi;
                  const matches = message.match(regexp);
                  if (matches) {
                    if (matches.length === 2) {
                      if (matches[0] === matches[1]) {
                        temp = null;
                      }
                    } else {
                      //console.log("(" + this.currentStep + ") " + text);
                      this.sendForward("start", "", text, "update", false);
                    }
                  }
                }
              }
            }
          }
          if (this.stop === 1) {
            await this.nextStep();
          } else if (this.stop === 2) {
            this.broadcast({
              "result": "pause",
            });
            await this.close();
          }
        } else {
          if (this.count > 0) {
            this.offsetId += this.count;
            this.count = 0;
            await this.ctx.storage.put("offsetId", this.offsetId);
          }
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
      //console.log("全部chat采集完毕");
      this.sendLog("start", "全部chat采集完毕", null, false);
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
    // if (this.stop === 1) {
    //   await this.updateChat(1);
    // }
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
      const id = env.WEBSOCKET_SERVER.idFromName("lockhiveCode");
      const stub = env.WEBSOCKET_SERVER.get(id);
      return stub.fetch(request);
    }

    return new Response("error");
  },
};
