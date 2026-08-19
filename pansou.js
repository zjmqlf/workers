import { DurableObject } from "cloudflare:workers";
import { TelegramClient, Api, sessions } from "./teleproto";
import { LogLevel } from "./teleproto/extensions/Logger";
import bigInt from "big-integer";

async function countMessage(env) {
  const messageResult = await env.PANSOUDB.prepare("SELECT COUNT(*) FROM `PANMESSAGE` WHERE 1 = 1;").run();
  // console.log("messageResult : " + messageResult["COUNT(*)"]);  //测试
  if (messageResult.success === true) {
    if (messageResult.results && messageResult.results.length > 0) {
      return messageResult.results[0]["COUNT(*)"];
    }
  }
  return -1;
}

function getDB(id) {
  const database = [
    "52bec4a2-a12a-484d-8f58-4f254b8cffd0",  //0 : main
    "97d41e14-a9b6-45a9-b5cc-f60eb29acc02",  //1 : pansou1
  ];
  const length = database.length;
  if (id < length) {
    return database[id];
  } else {
    return undefined;
  }
}

async function exportDB(databaseId) {
  const accountId = "399e535af535f1efb41355caef170840";
  const d1ApiKey = "5IJ_fW5LT68yr15tRIJIU0ekKLVWGiH4vL5Wdj8b";
  const d1Url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/export`;
  const method = "POST";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${d1ApiKey}`,
  };
  const bookmarkRes = await fetch(d1Url, {
    method,
    headers,
    body: JSON.stringify({ output_format: "polling" }),
  });
  // console.log(bookmarkRes);  //测试
  const { result: bookmarkResult } = await bookmarkRes.json();
  // console.log(bookmarkResult);  //测试
  if (bookmarkResult && bookmarkResult.at_bookmark) {
    // console.log(bookmarkResult.at_bookmark);  //测试
    const urlRes = await fetch(d1Url, {
      method,
      headers,
      body: JSON.stringify({ current_bookmark: bookmarkResult.at_bookmark }),
    });
    // console.log(urlRes);  //测试
    const { result: urlResult } = await urlRes.json();
    // console.log(urlResult);  //测试
    if (urlResult) {
      // console.log(urlResult.signed_url);  //测试
      return urlResult.signed_url;
    } else {
      // console.log("signed_url错误");
      return "";
    }
  } else {
    // console.log("at_bookmark错误");
    return "";
  }
}

export class WebSocketServer extends DurableObject {
  // webSocket = [];
  ws = null;
  stop = 0;
  apiCount = 0;
  currentStep = 0;
  compress = false;
  batch = false;
  client = null;
  chatId = 0;
  endChat = 0;
  lastChat = 0;
  reverse = true;
  limit = 100;
  beginId = 0;
  endId = 0;
  syncIndex = 0;
  syncCount = 0;
  offsetId = 0;
  fromPeer = null;
  errorMessage = "Too many API requests by single Worker invocation. To configure this limit, refer to https://developers.cloudflare.com/workers/wrangler/configuration/#limits";
  messageArray = [];
  cacheMessage = null;
  batchMessage = [];
  dialogArray = [];

  constructor(ctx, env) {
    super(ctx, env);
    this.ctx = ctx;
    // this.storage = ctx.storage;
    // this.sql = ctx.storage.sql;
    this.env = env;

    // this.ctx.getWebSockets().forEach((ws) => {
    //   const found = this.webSocket.find(element => element === ws);
    //   if (!found) {
    //     this.webSocket.push(ws);
    //     // console.log("(" + this.currentStep + ")添加ws成功");
    //     // this.broadcast({
    //     //   "step": this.currentStep,
    //     //   "type": "log",
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
        if (option.chatId && option.chatId > 0) {
          this.chatId = option.chatId;
        }
        if (option.endChat && option.endChat > 0) {
          this.endChat = option.endChat;
        }
        if (option.reverse) {
          this.reverse = option.reverse;
        }
        if (option.limit && option.limit > 0) {
          this.limit = option.limit;
        }
        if (option.beginId) {
          this.beginId = option.beginId;
        }
        if (option.endId) {
          this.endId = option.endId;
        }
        if (option.syncIndex) {
          this.syncIndex = option.syncIndex;
        }
        if (option.syncCount) {
          this.syncCount = option.syncCount;
        }
        if (option.offsetId && option.offsetId > 0) {
          this.offsetId = option.offsetId;
        }
      } else {
        this.compress = false;
        this.batch = false;
        this.chatId = 0;
        this.endChat = 0;
        this.reverse = true;
        this.limit = 100;
        this.beginId = 0;
        this.endId = 0;
        this.syncIndex = 0;
        this.syncCount = 0;
        this.offsetId = 0;
      }
      // this.ws = null;
      // this.client = null;
      // this.stop = 0;
      // this.webSocket = [];
      this.apiCount = 0;
      this.currentStep = 0;
      this.lastChat = 0;
      this.fromPeer = null;
      this.errorMessage = "Too many API requests by single Worker invocation. To configure this limit, refer to https://developers.cloudflare.com/workers/wrangler/configuration/#limits";
      this.messageArray = [];
      this.cacheMessage = null;
      this.batchMessage = [];
      this.dialogArray = [];
    }
  }

  broadcast(message) {
    if (this.compress === true) {
      if (message.operate === "nextMessage") {
        if (message.status === "add") {
          if (this.cacheMessage) {
            if (message.offsetId > this.cacheMessage.offsetId) {
              const temp = message;
              message = this.cacheMessage;
              this.cacheMessage = temp;
            } else {
              this.cacheMessage = null;
              return;
            }
          } else {
            this.cacheMessage = message;
            return;
          }
        } else if (message.status === "update") {
          if (this.cacheMessage) {
            if (message.offsetId === this.cacheMessage.offsetId) {
              const {
                offsetId,
                operate,
                status,
                ...Items
              } = message;
              for (const name in Items) {
                this.cacheMessage[name] = Items[name];
              }
            }
          }
          return;
        } else if (message.status === "indexExist") {
          if (this.cacheMessage) {
            if (message.offsetId === this.cacheMessage.offsetId) {
              this.cacheMessage["selectMessageIndex"] = true;
            }
          }
          return;
        } else if (message.status === "exist") {
          if (this.cacheMessage) {
            if (message.offsetId === this.cacheMessage.offsetId) {
              this.cacheMessage["selectMessage"] = true;
            }
          }
          return;
        } else if (message.status === "webpage") {
          if (this.cacheMessage) {
            if (message.offsetId === this.cacheMessage.offsetId) {
              this.cacheMessage["webpage"] = true;
            }
          }
          return;
        } else if (message.status === "error") {
        } else if (message.status === "limit") {
        } else if (!message.error) {
        } else {
          return;
        }
      } else if (message.operate === "insertMessage") {
        if (this.cacheMessage) {
          if (message.offsetId === this.cacheMessage.offsetId) {
            if (message.status === "success") {
              this.cacheMessage["insertMessage"] = true;
            } else if (message.status === "error") {
              this.cacheMessage["insertMessage"] = false;
            }
          }
        }
        return;
      // } else if (message.operate === "insertMessageIndex") {
      //   if (this.cacheMessage) {
      //     if (message.offsetId === this.cacheMessage.offsetId) {
      //       if (message.status === "success") {
      //         this.cacheMessage["insertMessageIndex"] = true;
      //       } else if (message.status === "error") {
      //         this.cacheMessage["insertMessageIndex"] = false;
      //       }
      //     }
      //   }
      //   return;
      } else if (message.operate === "cache") {
      } else if (message.operate === "open") {
      } else if (message.operate === "close") {
      } else if (message.operate === "checkChat") {
      } else if (message.operate === "chat") {
      } else if (message.operate === "index") {
      } else if (message.operate === "syncMessageIndex") {
      } else if (message.operate === "backup") {
      } else if (message.status === "limit") {
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
        } catch (err) {
          // console.log(err);
          // const index = this.webSocket.findIndex(element => element === ws);
          // if (index > -1) {
          //   this.webSocket.splice(index, 1);
          //   // console.log("(" + this.currentStep + ")删除ws成功");
          //   // this.broadcast({
          //   //   "step": this.currentStep,
          //   //   "type": "log",
          //   //   "operate": "broadcast",
          //   //   "message": "删除ws成功",
          //   //   "date": new Date().getTime(),
          //   // });
          // } else {
          //   // console.log("(" + this.currentStep + ")没找到该ws");
          //   this.broadcast({
          //     "step": this.currentStep,
          //     "type": "log",
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

  sendMessage(type, operate, message, status, error) {
    this.broadcast({
      "step": this.currentStep,
      "type": type,
      "offsetId": this.offsetId,
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
      // console.log("断开服务器成功");
      this.sendMessage("log", "close", "断开服务器成功", null, false);
    }
    this.stop = 0;
    this.ws.close();
    this.ctx.abort("reset");
  }

  async open(tryCount) {
    try {
      this.client = new TelegramClient(new sessions.StringSession(this.env.SESSION_STRING), this.env.API_ID, this.env.API_HASH, {
        timeout: 5,
        retryDelay: 1000,
        connectionRetries: 5,
        autoReconnect: true,
        deviceModel: "Desktop",
        systemVersion: "Windows 11",
        appVersion: "6.7.6 x64",
        langCode: "en",
        systemLangCode: "en-US",
      });
      this.client.session.setDC(5, "91.108.56.128", 80);
      this.client.setLogLevel(LogLevel.ERROR);
      await this.client.connect();
    } catch (err) {
      // console.log(err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("log", "open", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (tryCount === 5) {
        this.stop = 2;
        // console.log("(" + this.currentStep + ")open超出tryCount限制");
        this.sendMessage("log", "open", "超出tryCount限制", null, true);
        await this.close();
      } else {
        await scheduler.wait(30000);
        if (this.stop === 1) {
          await this.open(tryCount + 1);
        } else if (this.stop === 2) {
          this.broadcast({
            "result": "pause",
          });
          await this.close();
        }
      }
      return;
    }
    this.stop = 1;
    // console.log("连接服务器成功");
    this.sendMessage("log", "open", "连接服务器成功", null, false);  //测试
    // console.log(this.client);  //测试
    //await scheduler.wait(5000);
  }

  async getConfigError(tryCount, type, option) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")getConfig超出tryCount限制");
      this.sendMessage("log", "getConfig", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.getConfig(tryCount + 1, type, option);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async getConfig(tryCount, type, option) {
    this.apiCount += 1;
    let configResult = {};
    try {
      if (type === "pansou") {
        configResult = await this.env.MAINDB.prepare("SELECT * FROM `CONFIG` WHERE `name` = 'pansou' LIMIT 1;").run();
      } else if (type === "sync") {
        configResult = await this.env.MAINDB.prepare("SELECT * FROM `CONFIG` WHERE `name` = 'sync' LIMIT 1;").run();
      }
    } catch (err) {
      // console.log("getConfig : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("log", "getConfig", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.getConfigError(tryCount, type, option);
      }
      return;
    }
    // console.log("configResult : " + configResult);  //测试
    if (configResult.success === true) {
      if (configResult.results && configResult.results.length > 0) {
        const result = configResult.results[0];
        if (!option || !option.chatId) {
          if (result.chatId && result.chatId > 0) {
            if (type === "pansou") {
              this.chatId = result.chatId;
              this.lastChat = this.chatId;
            } else if (type === "sync") {
              this.offsetId = result.chatId;
            }
          }
        }
        if (!option || !option.reverse) {
          if (result.reverse) {
            this.reverse = Boolean(result.reverse);
          }
        }
        if (!option || !option.limited) {
          if (result.limited && result.limited > 0) {
            if (type === "pansou") {
              this.limit = result.limited;
            } else if (type === "sync") {
              this.endId = result.limited;
            }
          }
        }
      } else {
        // console.log("没有预设config");
        this.sendMessage("log", "getConfig", "没有预设config", null, false);
      }
    } else {
      // console.log("查询config失败");
      this.sendMessage("log", "getConfig", "查询config失败", null, true);
      await this.getConfigError(tryCount, type, option);
    }
  }

  async updateConfigError(tryCount, type) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")updateConfig超出tryCount限制");
      this.sendMessage("log", "updateConfig", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.updateConfig(tryCount + 1, type);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async updateConfig(tryCount, type) {
    this.apiCount += 1;
    let configResult = {};
    try {
      if (type === "pansou") {
        configResult = await this.env.MAINDB.prepare("UPDATE `CONFIG` SET `chatId` = ? WHERE `name` = 'pansou';").bind(this.chatId).run();
      } else if (type === "sync") {
        configResult = await this.env.MAINDB.prepare("UPDATE `CONFIG` SET `chatId` = ? WHERE `name` = 'sync';").bind(this.offsetId).run();
      }
    } catch (err) {
      // console.log("updateConfig : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("log", "updateConfig", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.updateConfigError(tryCount, type);
      }
      return;
    }
    // console.log(configResult);  //测试
    if (configResult.success === true) {
      // console.log("更新config数据成功");
      this.sendMessage("log", "updateConfig", "更新config数据成功", null, false);
    } else {
      // console.log("更新config数据失败");
      this.sendMessage("log", "updateConfig", "更新config数据失败", null, true);
      await this.updateConfigError(tryCount, type);
    }
  }

  async noExistChatError(tryCount, Cindex) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")noExistChat超出tryCount限制");
      this.sendMessage("log", "noExistChat", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.noExistChat(tryCount + 1, Cindex);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async noExistChat(tryCount, Cindex) {
    this.apiCount += 1;
    let chatResult = {};
    try {
      chatResult = await this.env.MAINDB.prepare("UPDATE `PANCHAT` SET `exist` = 0 WHERE `Cindex` = ?;").bind(Cindex).run();
    } catch (err) {
      // console.log("noExistChat : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("log", "noExistChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.noExistChatError(tryCount, Cindex);
      }
      return;
    }
    // console.log(chatResult);  //测试
    if (chatResult.success === true) {
      // console.log("更新不存在chat数据成功");
      this.sendMessage("log", "noExistChat", "更新不存在chat数据成功", null, false);
    } else {
      // console.log("更新不存在chat数据失败");
      this.sendMessage("log", "noExistChat", "更新不存在chat数据失败", null, true);
      await this.noExistChatError(tryCount, Cindex);
    }
  }

  async checkChat(tryCount, chatResult) {
    if (chatResult.channelId && chatResult.accessHash) {
      let result = null;
      try {
        result = await this.client.invoke(new Api.channels.GetChannels({
          id: [new Api.InputChannel({
            channelId: bigInt(chatResult.channelId),
            accessHash: bigInt(chatResult.accessHash),
          })],
        }));
      } catch (err) {
        // console.log("(" + this.currentStep + ") : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
        this.sendMessage("log", "checkChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
        if (err.name === "ChannelPrivateError" || err.errorMessage === "CHANNEL_INVALID" || err.errorMessage === "CHANNEL_PRIVATE" || err.code === 400) {
          await this.noExistChat(1, chatResult.Cindex);
          this.chatId += 1;
          if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
            // console.log(chatResult.title + " : chat已不存在了");  //测试
            this.sendMessage("log", "checkChat", chatResult.title + " : chat已不存在了", null, true);
            await this.nextChat(1, true);
          } else {
            // console.log(this.endChat + " : 超过最大chat了");  //测试
            this.sendMessage("log", "checkChat", this.endChat + " : 超过最大chat了", null, true);
          }
        } else {
          if (tryCount === 5) {
            this.stop = 2;
            // console.log("(" + this.currentStep + ")checkChat超出tryCount限制");
            this.sendMessage("log", "checkChat", "超出tryCount限制", null, true);
            await this.close();
          } else {
            await scheduler.wait(10000);
            if (this.stop === 1) {
              await this.checkChat(tryCount + 1, chatResult);
            } else if (this.stop === 2) {
              this.broadcast({
                "result": "pause",
              });
              await this.close();
            }
          }
        }
        return;
      }
      // console.log(this.fromPeer);  //测试
      if (result && result.chats && result.chats.length > 0) {
        this.chatId = chatResult.Cindex;
        if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
          this.fromPeer = result.chats[0];
          if (this.fromPeer) {
            this.offsetId = chatResult.current;
            this.sendMessage("log", "checkChat", this.chatId + " : " + chatResult.title, "add", false);
          } else {
            await this.noExistChat(1, chatResult.Cindex);
            this.chatId = chatResult.Cindex + 1;
            if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
              // console.log(chatResult.title + " : chat已不存在了");  //测试
              this.sendMessage("log", "checkChat", chatResult.title + " : chat已不存在了", null, true);
              await this.nextChat(1, true);
            } else {
              // console.log(this.endChat + " : 超过最大chat了");  //测试
              this.sendMessage("log", "checkChat", this.endChat + " : 超过最大chat了", null, true);
            }
          }
        } else {
          // console.log(this.endChat + " : 超过最大chat了");  //测试
          this.sendMessage("log", "checkChat", this.endChat + " : 超过最大chat了", null, true);
        }
      } else {
        this.chatId = chatResult.Cindex + 1;
        if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
          // console.log(chatResult.title + " : chat已不存在了");  //测试
          this.sendMessage("log", "checkChat", chatResult.title + " : chat已不存在了", null, true);
          await this.nextChat(1, true);
        } else {
          // console.log(this.endChat + " : 超过最大chat了");  //测试
          this.sendMessage("log", "checkChat", this.endChat + " : 超过最大chat了", null, true);
        }
      }
    } else {
      await this.noExistChat(1, chatResult.Cindex);
      this.chatId = chatResult.Cindex + 1;
      if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
        // console.log(chatResult.title + " : channelId或accessHash出错");  //测试
        this.sendMessage("log", "checkChat", chatResult.title + " : channelId或accessHash出错", null, true);
        await this.nextChat(1, true);
      } else {
        // console.log(this.endChat + " : 超过最大chat了");  //测试
        this.sendMessage("log", "checkChat", this.endChat + " : 超过最大chat了", null, true);
      }
    }
  }

  async nextChatError(tryCount, check) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")nextChat超出tryCount限制");
      this.sendMessage("log", "nextChat", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.nextChat(tryCount + 1, check);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async nextChat(tryCount, check) {
    this.apiCount += 1;
    let chatResult = {};
    try {
      chatResult = await this.env.MAINDB.prepare("SELECT * FROM `PANCHAT` WHERE `Cindex` >= ? AND `exist` = 1 LIMIT 1;").bind(this.chatId).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ") : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("log", "nextChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.nextChatError(tryCount, check);
      }
      return;
    }
    // console.log("chatResult : " + chatResult);  //测试
    if (chatResult.success === true) {
      if (chatResult.results && chatResult.results.length > 0) {
        if (check === true) {
          await this.checkChat(1, chatResult.results[0]);
        } else {
          this.chatId = chatResult.results[0].Cindex;
        }
      } else {
        this.chatId = -1;
        // console.log("没有更多chat了");
        this.sendMessage("log", "nextChat", "没有更多chat了", null, true);
      }
    } else {
      // console.log("查询chat失败");
      this.sendMessage("log", "nextChat", "查询chat失败", null, true);
      await this.nextChatError(tryCount, check);
    }
  }

  async getChat() {
    if (this.chatId === 0) {
      this.fromPeer = "me";
      let tryCount = 0;
      while (tryCount < 30) {
        this.apiCount += 1;
        let chatResult = {};
        try {
          chatResult = await this.env.MAINDB.prepare("SELECT * FROM `PANCHAT` WHERE `Cindex` = 0 LIMIT 1;").run();
        } catch (err) {
          tryCount += 1;
          // console.log("(" + this.currentStep + ")getChat : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
          this.sendMessage("log", "getChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
          if (err.message === this.errorMessage) {
            this.stop = 2;
            this.broadcast({
              "result": "pause",
            });
            await this.close();
            break;
          }
          await scheduler.wait(10000);
        }
        // console.log("chatResult : " + chatResult);  //测试
        if (chatResult.success === true) {
          if (chatResult.results && chatResult.results.length > 0) {
            this.offsetId = chatResult.results[0].current;
            break;
          }
        } else {
          // console.log("查询me失败");  //测试
          this.sendMessage("log", "getChat", "查询me失败", null, true);
        }
      }
    } else if (this.chatId && this.chatId > 0) {
      if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
        await this.nextChat(1, true);
      } else {
        // console.log(this.endChat + " : 超过最大chat了");  //测试
        this.sendMessage("log", "getChat", this.endChat + " : 超过最大chat了", null, true);
      }
    } else {
      if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
        let tryCount = 0;
        while (tryCount < 30) {
          this.apiCount += 1;
          let chatResult = {};
          try {
            chatResult = await this.env.MAINDB.prepare("SELECT * FROM `PANCHAT` WHERE `current` = 0 AND `exist` = 1 ORDER BY `Cindex` ASC LIMIT 1;").run();
          } catch (err) {
            tryCount += 1;
            // console.log("(" + this.currentStep + ")getChat : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
            this.sendMessage("log", "getChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
            await scheduler.wait(10000);
            return;
          }
          // console.log("chatResult : " + chatResult);  //测试
          if (chatResult.success === true) {
            if (chatResult.results && chatResult.results.length > 0) {
              await this.checkChat(1, chatResult.results[0]);
            } else {
              this.chatId = -1;
              // console.log("没有更多chat了");
              this.sendMessage("log", "getChat", "没有更多chat了", null, true);
            }
            break;
          } else {
            // console.log("查询chat失败");
            this.sendMessage("log", "getChat", "查询chat失败", null, false);
          }
        }
      } else {
        // console.log(this.endChat + " : 超过最大chat了");  //测试
        this.sendMessage("log", "getChat", this.endChat + " : 超过最大chat了", null, true);
      }
    }
  }

  async updateChatError(tryCount) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")updateChat超出tryCount限制");
      this.sendMessage("log", "updateChat", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.updateChat(tryCount + 1);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async updateChat(tryCount) {
    this.apiCount += 1;
    let chatResult = {};
    try {
      chatResult = await this.env.MAINDB.prepare("UPDATE `PANCHAT` SET `current` = ?, `updated` = ? WHERE `Cindex` = ?;").bind(this.offsetId, new Date().getTime(), this.chatId).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")updateChat : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("log", "updateChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.updateChatError(tryCount);
      }
      return;
    }
    // console.log(chatResult);  //测试
    if (chatResult.success === true) {
      // console.log("(" + this.currentStep + ")更新chat数据成功");
      this.sendMessage("log", "updateChat", "更新chat数据成功", null, false);
    } else {
      // console.log("(" + this.currentStep + ")更新chat数据失败");
      this.sendMessage("log", "updateChat", "更新chat数据失败", null, true);
      await this.updateChatError(tryCount);
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
        // if (message.message) {
        //   this.messageArray.push(message);
        // }
        this.messageArray.push(message);
      }
    } catch (err) {
      this.messageArray = [];
      // console.log("(" + this.currentStep + ")getMessage : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("log", "getMessage", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.name === "ChannelPrivateError" || err.errorMessage === "CHANNEL_INVALID" || err.errorMessage === "CHANNEL_PRIVATE" || err.code === 400) {
        await this.noExistChat(1, this.chatId);
        this.fromPeer = null;
        this.chatId += 1;
        if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
          // console.log("chat已不存在了");  //测试
          this.sendMessage("log", "getMessage", "chat已不存在了", null, true);
          await this.getChat();
        } else {
          // console.log(this.endChat + " : 超过最大chat了");  //测试
          this.sendMessage("log", "getMessage", this.endChat + " : 超过最大chat了", null, true);
        }
      } else if (err.name === "FloodWaitError" || err.errorMessage?.includes("FLOOD_WAIT_") === true || err.code === 420) {
        // console.log("(" + this.currentStep + ") 触发了洪水警告，请求太频繁 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
        this.sendMessage("log", "getMessage", "触发了洪水警告，请求太频繁 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "flood", true);
      } else {
        if (tryCount === 5) {
          this.stop = 2;
          // console.log("(" + this.currentStep + ")getMessage超出tryCount限制");
          this.sendMessage("log", "getMessage", "超出tryCount限制", null, true);
          await this.close();
        } else {
          await scheduler.wait(10000);
          if (this.stop === 1) {
            await this.getMessage(tryCount + 1);
          } else if (this.stop === 2) {
            this.broadcast({
              "result": "pause",
            });
            await this.close();
          }
        }
      }
      return;
    }
  }

  // async selectMessageIndex(tryCount, messageId) {
  //   const messageResult = this.sql.exec(`SELECT COUNT(*) FROM CHAT${this.chatId} WHERE id = ?;`, messageId).one();
  //   // console.log("messageResult : " + messageResult["COUNT(*)"]);  //测试
  //   if (messageResult) {
  //     return messageResult["COUNT(*)"];
  //   }
  //   // let cacheResult = {};
  //   // try {
  //   //   cacheResult = await fetch(`https://index.zjmqlf2022.workers.dev/getDB?chatId=${this.chatId}&id=${messageId}`);
  //   // } catch (err) {
  //   //   // console.log(err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
  //   //   this.sendMessage("log", "selectMessageIndex", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
  //   //   if (tryCount === 5) {
  //   //     this.stop = 2;
  //   //     // console.log("(" + this.currentStep + ")selectMessageIndex超出tryCount限制");
  //   //     this.sendMessage("log", "selectMessageIndex", "超出tryCount限制", null, true);
  //   //     await this.close();
  //   //   } else {
  //   //     await scheduler.wait(30000);
  //   //     if (this.stop === 1) {
  //   //       await this.selectMessageIndex(tryCount + 1, messageId);
  //   //     } else if (this.stop === 2) {
  //   //       this.broadcast({
  //   //         "result": "pause",
  //   //       });
  //   //       await this.close();
  //   //     }
  //   //   }
  //   //   return;
  //   // }
  //   // if (cacheResult) {
  //   //   if (cacheResult.error) {
  //   //     // console.log("(" + this.currentStep + ")selectMessageIndex - " + cacheResult.error);
  //   //     this.sendMessage("log", "selectMessageIndex", cacheResult.error, null, true);
  //   //   } else {
  //   //     return cacheResult.result;
  //   //   }
  //   // } else {
  //   //   // console.log("(" + this.currentStep + ")selectMessageIndex - " + messageId + " : 插入cache数据出错);
  //   //   this.sendMessage("log", "selectMessageIndex", messageId + " : 插入cache数据出错", null, true);
  //   // }
  // }

  // async insertMessageIndex(tryCount, messageId) {
  //   this.sql.exec(`INSERT INTO CHAT${this.chatId} (id) VALUES (?);`, messageId);
  //   // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 插入messageIndex数据库成功");
  //   this.sendMessage("grid", "insertMessageIndex", "插入messageIndex数据库成功", "success", false);
  //   // let cacheResult = {};
  //   // try {
  //   //   // cacheResult = await this.env.SERVERS.fetch(`https://test.zjmqlf2022.workers.dev/put?chatId=${this.chatId}&id=${messageId}&dbId=1`);
  //   //   cacheResult = await fetch(`https://index.zjmqlf2022.workers.dev/put?chatId=${this.chatId}&id=${messageId}&dbId=1`);
  //   // } catch (err) {
  //   //   // console.log(err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
  //   //   this.sendMessage("log", "insertMessageIndex", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
  //   //   if (tryCount === 5) {
  //   //     this.stop = 2;
  //   //     // console.log("(" + this.currentStep + ")insertMessageIndex超出tryCount限制");
  //   //     this.sendMessage("log", "insertMessageIndex", "超出tryCount限制", null, true);
  //   //     await this.close();
  //   //   } else {
  //   //     await scheduler.wait(30000);
  //   //     if (this.stop === 1) {
  //   //       await this.insertMessageIndex(tryCount + 1, messageId);
  //   //     } else if (this.stop === 2) {
  //   //       this.broadcast({
  //   //         "result": "pause",
  //   //       });
  //   //       await this.close();
  //   //     }
  //   //   }
  //   //   return;
  //   // }
  //   // this.ws.send(JSON.stringify({
  //   //   "step": this.currentStep,
  //   //   "operate": "insertMessageIndex",
  //   //   "message": "cacheResult : " + JSON.stringify(cacheResult),
  //   //   "error": true,
  //   //   "date": new Date().getTime(),
  //   // }));  //测试
  //   // if (cacheResult && cacheResult.error) {
  //   //   // console.log("(" + this.currentStep + ")insertMessageIndex - 插入cache数据 ; " + cacheResult.error);
  //   //   this.sendMessage("log", "insertMessageIndex", "插入cache数据 ; " + cacheResult.error, null, true);
  //   // } else {
  //   //   // console.log("(" + this.currentStep + ")insertMessageIndex - " + messageId + " : 插入cache数据出错);
  //   //   this.sendMessage("log", "insertMessageIndex", messageId + " : 插入cache数据出错", null, true);
  //   // }
  // }

  async selectMessageError(tryCount, messageId) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")selectMessage超出tryCount限制");
      this.sendMessage("log", "selectMessage", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.selectMessage(tryCount + 1, messageId);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async selectMessage(tryCount, messageId) {
    this.apiCount += 1;
    let messageResult = {};
    try {
      messageResult = await this.env.PANSOUDB.prepare("SELECT COUNT(*) FROM `PANMESSAGE` WHERE `chatId` = ? AND `id` = ? LIMIT 1;").bind(this.chatId, messageId).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : selectMessage : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("grid", "selectMessage", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.selectMessageError(tryCount, messageId);
      }
      return;
    }
    // console.log("messageResult : " + messageResult["COUNT(*)"]);  //测试
    if (messageResult.success === true) {
      if (messageResult.results && messageResult.results.length > 0) {
        return messageResult.results[0]["COUNT(*)"];
      }
    } else {
      await this.selectMessageError(tryCount, messageId);
    }
  }

  async insertMessageError(tryCount, messageId, txt, id, url) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")insertMessage超出tryCount限制");
      this.sendMessage("log", "insertMessage", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.insertMessage(tryCount + 1, messageId, txt, id, url);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async insertMessage(tryCount, messageId, txt, id, url) {
    this.apiCount += 1;
    let messageResult = {};
    try {
      messageResult = await this.env.PANSOUDB.prepare("INSERT INTO `PANMESSAGE` (chatId, id, txt, webpage, url) VALUES (?, ?, ?, ?, ?);").bind(this.chatId, messageId, txt, id, url).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : insertMessage : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);;
      this.sendMessage("grid", "insertMessage", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.insertMessageError(tryCount, messageId, txt, id, url);
      }
      return;
    }
    // console.log(messageResult);  //测试
    if (messageResult.success === true) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 插入message数据成功");
      this.sendMessage("grid", "insertMessage", "", "success", false);
    } else {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 插入message数据失败");
      this.sendMessage("grid", "insertMessage", "插入message数据失败", "error", true);
      await this.insertMessageError(tryCount, messageId, txt, id, url);
    }
  }

  async nextMessage(messageLength, messageIndex, message) {
    if (this.stop === 1) {
      if (this.apiCount < 900) {
        if (message) {
          const messageId = message.id;
          const txt = message.message;
          this.broadcast({
            "step": this.currentStep,
            "type": "grid",
            "operate": "nextMessage",
            // "messageLength": messageLength,
            // "messageIndex": messageIndex,
            "chatId": this.chatId,
            "offsetId": this.offsetId,
            "messageId": messageId,
            "status": "add",
            "date": new Date().getTime(),
          });
          if (txt) {
            if (await this.ctx.storage.get(this.chatId + "|" + messageId)) {
              // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : messageIndex已在数据库中");
              this.sendMessage("grid", "nextMessage", "", "indexExist", false);
            } else {
              const messageCount = await this.selectMessage(1, messageId);
              if (parseInt(messageCount) === 0) {
                let webpage = "";
                let url = "";
                if (message.media) {
                  if (message.media.webpage) {
                    this.sendMessage("grid", "nextMessage", "", "webpage", false);
                    if (message.media.webpage.id) {
                      webpage = message.media.webpage.id.toString();
                    }
                    if (message.media.webpage.url) {
                      url = message.media.webpage.url;
                    }
                  }
                }
                await this.insertMessage(1, messageId, txt, webpage, url);
                await this.ctx.storage.put(this.chatId + "|" + messageId, "[]");
              } else {
                // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : message已在数据库中");
                this.sendMessage("grid", "nextMessage", "", "exist", false);
              }
            }
            this.offsetId += 1;
          } else {
            // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 错误的消息");
            this.sendMessage("grid", "nextMessage", "txt为空", "error", true);
            this.offsetId += 1;
          }
        } else {
          // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 错误的消息");
          this.sendMessage("grid", "nextMessage", "错误的消息", "error", true);
          this.offsetId += 1;
        }
      } else {
        this.stop = 2;
        // console.log("(" + this.currentStep + ")nextMessage超出apiCount限制");
        this.sendMessage("grid", "nextMessage", "超出apiCount限制", "limit", true);
        await this.updateChat(1);
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
      if (this.apiCount < 900) {
        await this.updateChat(1);
        this.currentStep += 1;
        await this.getMessage(1);
        await scheduler.wait(3000);
        const messageArray = this.messageArray.slice();
        const messageLength = messageArray.length;
        this.messageArray = [];
        if (messageLength && messageLength > 0) {
          // console.log("(" + this.currentStep + ")messageLength : " + messageLength);
          this.sendMessage("log", "nextStep", "messageLength : " + messageLength, null, false);
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
                // console.log("(" + this.currentStep + ")nextStep超出apiCount限制");
                this.sendMessage("log", "nextStep", "超出apiCount限制", "limit", true);
                await this.updateChat(1);
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
          await this.updateChat(1);
          this.fromPeer = null;
          // console.log("(" + this.currentStep + ")" + this.chatId + " : 当前chat采集完毕");
          this.sendMessage("log", "nextStep", this.chatId + " : 当前chat采集完毕", null, false);
          this.broadcast({
            "result": "end",
          });
          this.chatId += 1;
          if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
            await this.getChat();
            if (this.fromPeer) {
              if (this.chatId != this.lastChat) {
                if (this.lastChat != 0) {
                  await this.updateConfig(1, "pansou");
                }
                this.lastChat = this.chatId;
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
              // console.log("(" + this.currentStep + ")全部chat采集完毕");
              this.sendMessage("log", "nextStep", "全部chat采集完毕", null, false);
              this.broadcast({
                "result": "over",
              });
              await this.close();
            }
          } else {
            // console.log(this.endChat + " : 超过最大chat了");  //测试
            this.sendMessage("log", "nextStep", this.endChat + " : 超过最大chat了", null, true);
          }
        }
      } else {
        this.stop = 2;
        // console.log("(" + this.currentStep + ")nextStep超出apiCount限制");
        this.sendMessage("log", "nextStep", "超出apiCount限制", "limit", true);
        await this.updateChat(1);
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
    if (!option || !option.chatId || !option.reverse || !option.limited) {
      await this.getConfig(1, "pansou", option);
    }
    await this.getChat();
    if (this.fromPeer) {
      if (this.chatId != this.lastChat) {
        if (this.lastChat != 0) {
          await this.updateConfig(1, "pansou");
        }
        this.lastChat = this.chatId;
      }
      if (this.stop === 1) {
        this.currentStep += 1;
        await this.getMessage(1);
        await scheduler.wait(3000);
        const messageArray = this.messageArray.slice();
        const messageLength = messageArray.length;
        this.messageArray = [];
        this.sendMessage("log", "start", "messageLength : " + messageLength, null, false);  //测试
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
              // console.log("(" + this.currentStep + ")start超出apiCount限制");
              this.sendMessage("log", "start", "超出apiCount限制", "limit", true);
              await this.updateChat(1);
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
          await this.updateChat(1);
          this.fromPeer = null;
          // console.log("(" + this.currentStep + ")" + this.chatId + " : 当前chat采集完毕");
          this.sendMessage("log", "start", this.chatId + " : 当前chat采集完毕", null, false);
          this.broadcast({
            "result": "end",
          });
          this.chatId += 1;
          if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
            await this.getChat();
            if (this.fromPeer) {
              if (this.chatId != this.lastChat) {
                if (this.lastChat != 0) {
                  await this.updateConfig(1, "pansou");
                }
                this.lastChat = this.chatId;
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
              // console.log("(" + this.currentStep + ")全部chat采集完毕");
              this.sendMessage("log", "start", "全部chat采集完毕", null, false);
              this.broadcast({
                "result": "over",
              });
              await this.close();
            }
          } else {
            // console.log(this.endChat + " : 超过最大chat了");  //测试
            this.sendMessage("log", "start", this.endChat + " : 超过最大chat了", null, true);
          }
        }
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    } else {
      // console.log("全部chat采集完毕");
      this.sendMessage("log", "start", "全部chat采集完毕", null, false);
      this.broadcast({
        "result": "over",
      });
      await this.close();
    }
  }

  async getDialog(tryCount) {
    try {
      for await (const dialog of this.client.iterDialogs({})) {
        if (dialog.isChannel === true) {
          this.dialogArray.push(dialog);
        }
      }
    } catch (err) {
      this.dialogArray = [];
      // console.log("(" + this.currentStep + ")getDialog : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("log", "getDialog", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (tryCount === 5) {
        this.stop = 2;
        // console.log("(" + this.currentStep + ")getDialog超出tryCount限制");
        this.sendMessage("log", "getDialog", "超出tryCount限制", null, true);
        await this.close();
      } else {
        await scheduler.wait(10000);
        if (this.stop === 1) {
          await this.getDialog(tryCount + 1);
        } else if (this.stop === 2) {
          this.broadcast({
            "result": "pause",
          });
          await this.close();
        }
      }
      return;
    }
  }

  async selectChatError(tryCount, channelId) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("selectChat超出tryCount限制");
      this.sendMessage("log", "selectChat", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.selectChat(tryCount + 1, channelId);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async selectChat(tryCount, channelId) {
    this.apiCount += 1;
    let chatResult = {};
    try {
      chatResult = await this.env.MAINDB.prepare("SELECT Cindex, username, title, COUNT(*) FROM `PANCHAT` WHERE `channelId` = ? LIMIT 1;").bind(channelId).run();
    } catch (err) {
      // console.log("selectChat : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("log", "selectChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.selectChatError(tryCount, channelId);
      }
      return;
    }
    // console.log("chatResult : " + chatResult);  //测试
    if (chatResult.success === true) {
      if (chatResult.results && chatResult.results.length > 0) {
        return chatResult.results[0];
      }
    } else {
      await this.selectChatError(tryCount, channelId);
    }
  }

  async setChatError(tryCount, Cindex, username, title) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")setChat超出tryCount限制");
      this.sendMessage("log", "setChat", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.setChat(tryCount + 1, Cindex, username, title);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async setChat(tryCount, Cindex, username, title) {
    this.apiCount += 1;
    let chatResult = {};
    try {
      if (username) {
        if (title) {
          chatResult = await this.env.MAINDB.prepare("UPDATE `PANCHAT` SET `username` = ?, `title` = ? WHERE `Cindex` = ?;").bind(username, title, Cindex).run();
        } else {
          chatResult = await this.env.MAINDB.prepare("UPDATE `PANCHAT` SET `username` = ? WHERE `Cindex` = ?;").bind(username, Cindex).run();
        }
      } else {
        if (title) {
          chatResult = await this.env.MAINDB.prepare("UPDATE `PANCHAT` SET `title` = ? WHERE `Cindex` = ?;").bind(title, Cindex).run();
        }
      }
    } catch (err) {
      // console.log("(" + this.currentStep + ")setChat : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("log", "setChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.setChatError(tryCount, Cindex, username, title);
      }
      return;
    }
    // console.log(chatResult);  //测试
    if (chatResult.success === true) {
      // console.log("(" + this.currentStep + ")更新chat数据成功");
      this.sendMessage("log", "setChat", "更新chat数据成功", null, false);
    } else {
      // console.log("(" + this.currentStep + ")更新chat数据失败");
      this.sendMessage("log", "setChat", "更新chat数据失败", null, true);
      await this.setChatError(tryCount, Cindex, username, title);
    }
  }

  async insertChatError(tryCount, channelId, accessHash, username, title, noforwards) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("insertChat超出tryCount限制");
      this.sendMessage("log", "insertChat", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.insertChat(tryCount + 1, channelId, accessHash, username, title, noforwards);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async insertChat(tryCount, channelId, accessHash, username, title, noforwards) {
    this.apiCount += 1;
    let chatResult = {};
    try {
      chatResult = await this.env.MAINDB.prepare("INSERT INTO `PANCHAT` (channelId, accessHash, username, title, current, exist) VALUES (?, ?, ?, ?, ?, ?);").bind(channelId, accessHash, username, title, 0, 1).run();
    } catch (err) {
      // console.log("insertChat : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);;
      this.sendMessage("log", "insertChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.insertChatError(tryCount, channelId, accessHash, username, title, noforwards);
      }
      return;
    }
    // console.log(chatResult);  //测试
    if (chatResult.success === true) {
      // console.log("插入chat数据成功");
      this.sendMessage("log", "insertChat", "插入chat数据成功", "success", false);
    } else {
      // console.log("插入chat数据失败");
      this.sendMessage("log", "insertChat", "插入chat数据失败", "error", true);
      await this.insertChatError(tryCount, channelId, accessHash, username, title, noforwards);
    }
  }

  async chat() {
    // if (this.client || this.stop === 1) {
    // // if (this.stop === 1) {
    //   this.ws.send(JSON.stringify({
    //     "step": this.currentStep,
    //     "operate": "chat",
    //     "message": "服务已经运行过了",
    //     "error": true,
    //     "date": new Date().getTime(),
    //   }));
    //   return;
    // }
    // this.stop = 1;
    if (!this.client) {
      await this.open(1);
    }
    let count = 0;
    await this.getDialog(1);
    const dialogArray = this.dialogArray;
    // const dialogLength = dialogArray.length;
    this.dialogArray = [];
    // for (let dialogIndex = 0; dialogIndex < dialogLength; dialogIndex++) {
    for await (const dialog of dialogArray) {
      const title = dialog.title;
      if (this.stop === 1) {
        if (this.apiCount < 900) {
          let channelId = "";
          let accessHash = "";
          if (dialog.isChannel === true) {
            channelId = dialog.inputEntity.channelId.toString();
            accessHash = dialog.inputEntity.accessHash.toString();
          } else {
            // channelId = dialog.id.toString();
            continue;
          }
          // console.log(channelId + " : " + accessHash);  //测试
          if (channelId && accessHash) {
            const chatResult = await this.selectChat(1, channelId);
            // console.log("chatResult : " + chatResult);  //测试
            if (chatResult) {
              const username = dialog.entity.username || dialog.draft._entity.username || "";
              if (parseInt(chatResult["COUNT(*)"]) === 0) {
                count += 1;
                const noforwards = (dialog.entity.noforwards === true || dialog.draft._entity.noforwards === true) ? 1 : 0;
                await this.insertChat(1, channelId, accessHash, username, title, noforwards);
                // console.log("chat - 新插入chat了 : " + title);
                this.sendMessage("log", "chat", "新插入chat了 : " + title, null, false);
              } else {
                if (chatResult.title !== title) {
                  if (chatResult.username !== username) {
                    await this.setChat(tryCount, chatResult.Cindex, username, title);
                  } else {
                    await this.setChat(tryCount, chatResult.Cindex, "", title);
                  }
                } else {
                  if (chatResult.username !== username) {
                    await this.setChat(tryCount, chatResult.Cindex, username, "");
                  }
                }
                // console.log("chat - " + count + " : chat已在数据库中 - " + title);
                this.sendMessage("log", "chat", "chat已在数据库中 - " + title, null, false);
              }
            } else {
              // console.log("chat - chatResult错误 : " + title);
              this.sendMessage("log", "chat", "chatResult错误 : " + title, null, true);
            }
          } else {
            // console.log("chat - channelId或accessHash错误 : " + title);
            this.sendMessage("log", "chat", "channelId或accessHash错误 : " + title, null, true);
          }
        } else {
          this.stop = 2;
          // console.log("chat - 超出apiCount限制");
          this.sendMessage("log", "chat", "超出apiCount限制", "limit", true);
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
    if (count > 0) {
      // console.log("chat - 新插入了" + count + "条chat数据");
      this.sendMessage("log", "chat", "新插入了" + count + "条chat数据", null, false);
    }
    await this.close();
  }

  // async cache(tryCount) {
  //   if (this.apiCount < 900) {
  //     // if (this.offsetId === 1) {
  //     //   this.sql.exec(`CREATE TABLE IF NOT EXISTS CHAT${this.chatId}(
  //     //       id    INTEGER PRIMARY KEY
  //     //     );`
  //     //   );
  //     // }
  //     this.currentStep += 1;
  //     // console.log("(" + this.currentStep + ")cache - offsetId : " + this.offsetId);  //测试
  //     this.sendMessage("log", "cache", "("+ this.chatId + ") - offsetId : " + this.offsetId, null, false);  //测试
  //     this.apiCount += 1;
  //     let messageResult = {};
  //     this.chatId = 131;  //测试
  //     try {
  //       messageResult = await this.env.PANSOUDB.prepare("SELECT `Mindex`,`id` FROM `PANMESSAGE` WHERE `chatId` = ? AND  `Mindex` >= ? ORDER BY Mindex ASC LIMIT 0,20;").bind(this.chatId, this.offsetId).run();
  //     } catch (err) {
  //       // console.log("(" + this.currentStep + ")cache : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
  //       this.sendMessage("log", "cache", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
  //       if (err.message === this.errorMessage) {
  //         this.stop = 2;
  //         this.broadcast({
  //           "result": "pause",
  //         });
  //         await this.close();
  //       } else {
  //         if (tryCount === 5) {
  //           this.stop = 2;
  //           // console.log("(" + this.currentStep + ")cache超出tryCount限制");
  //           this.sendMessage("log", "cache", "超出tryCount限制", null, true);
  //           await this.close();
  //         } else {
  //           await scheduler.wait(10000);
  //           if (this.stop === 1) {
  //             await this.cache(tryCount + 1);
  //           } else if (this.stop === 2) {
  //             this.broadcast({
  //               "result": "pause",
  //             });
  //             await this.close();
  //           }
  //         }
  //       }
  //       return;
  //     }
  //     // console.log("messageResult : " + messageResult.results);  //测试
  //     const messageLength = messageResult.results.length;
  //     // console.log("(" + this.currentStep + ")cache - messageLength : " + messageLength);
  //     this.sendMessage("log", "cache", "("+ this.chatId + ") - messageLength : " + messageLength, null, false);
  //     if (messageLength > 0) {
  //       // let temp = [];
  //       for (let messageIndex = 0; messageIndex < messageLength; messageIndex++) {
  //         // temp.push("(" + messageResult.results[messageIndex].id + ")");
  //         // this.offsetId = messageResult.results[messageLength - 1].Mindex;
  //         // console.log("(" + this.currentStep + ")cache - " + "["+ this.chatId + "] " + this.offsetId + " : " + messageResult.results[messageIndex].id);
  //         this.offsetId = messageResult.results[messageIndex].Mindex;  //测试
  //         this.sendMessage("log", "cache", "["+ this.chatId + "] " + this.offsetId + " : " + messageResult.results[messageIndex].id, null, false);  //测试
  //         // await this.ctx.storage.put(this.chatId + "|" + messageResult.results[messageIndex].id, "[]");
  //       }
  //       this.offsetId += 1;  //测试
  //       // this.offsetId = parseInt(messageResult.results[messageLength - 1].Mindex) + 1;
  //       // this.sql.exec(`INSERT INTO CHAT${this.chatId} (id) VALUES 
  //       //   ${temp.join(",")};`
  //       // );
  //       await this.cache(1);
  //     } else {
  //       // console.log("(" + this.currentStep + ")" + this.chatId + " : 当前chat缓存完毕");
  //       this.sendMessage("log", "cache", this.chatId + " : 当前chat缓存完毕", null, false);
  //       this.broadcast({
  //         "result": "end",
  //       });
  //       this.chatId += 1;
  //       this.offsetId = 0;
  //       await this.nextChat(1, false);
  //       if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
  //         await this.cache(1);
  //       } else {
  //         // console.log(this.endChat + " : 超过最大chat了");  //测试
  //         this.sendMessage("log", "cache", this.endChat + " : 超过最大chat了", null, true);
  //       }
  //     }
  //   } else {
  //     this.stop = 2;
  //     // console.log("(" + this.currentStep + ")cache超出apiCount限制");
  //     this.sendMessage("log", "cache", "超出apiCount限制", "limit", true);
  //     await this.close();
  //     // this.ctx.abort("reset");
  //   }
  // }

  async countMessageIndex() {
    const messageResult = await env.PANSOUDB.prepare("SELECT COUNT(*) FROM `PANMESSAGE` WHERE 1 = 1;").run();
    // console.log("messageResult : " + messageResult["COUNT(*)"]);  //测试
    if (messageResult.success === true) {
      if (messageResult.results && messageResult.results.length > 0) {
        return messageResult.results[0]["COUNT(*)"];
      }
    }
    return -1;
  }

  async selectMessageIndexError(tryCount) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")selectMessageIndex超出tryCount限制");
      this.sendMessage("log", "selectMessageIndex", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.selectMessageIndex(tryCount + 1);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async selectMessageIndex(tryCount) {
    this.apiCount += 1;
    let messageResult = {};
    try {
      // messageResult = await this.env.PANSOUDB.prepare("SELECT `chatId`, `id`, `Mindex` FROM `PANMESSAGE` WHERE `Mindex` >= ? ORDER BY `Mindex` ASC LIMIT 100;").bind(this.offsetId).run();
      messageResult = await this.env.PANSOUDB.prepare("SELECT `id`, `Mindex` FROM `PANMESSAGE` WHERE `chatId` = 4 AND `Mindex` >= ? ORDER BY `Mindex` ASC LIMIT 100;").bind(this.offsetId).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : selectMessageIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("log", "selectMessageIndex", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.selectMessageIndexError(tryCount);
      }
      return;
    }
    // console.log("messageResult : " + messageResult);  //测试
    if (messageResult.success === true) {
      if (messageResult.results && messageResult.results.length > 0) {
        return messageResult.results;
      }
    } else {
      await this.selectMessageIndexError(tryCount);
    }
  }

  async syncMessageIndex() {
    if (this.endId && this.endId > 0) {
      if (this.endId > this.offsetId) {
        while (this.offsetId <= this.endId) {
          if (this.apiCount < 900) {
            const results = await this.selectMessageIndex(1);
            if (results) {
              const length = results.length;
              // console.log("messageLength : " + length);  //测试
              if (length > 1) {
                for (let index = 0; index < length; index++) {
                  this.offsetId = results[index].Mindex;
                  // this.sendMessage("log", "syncMessageIndex", "messageLength : " + length, null, false);  //测试
                  this.sendMessage("log", "syncMessageIndex", "offsetId : " + this.offsetId, null, false);  //测试
                  // if (this.offsetId > this.endId) {
                  //   // console.log("offsetId超过end");
                  //   this.sendMessage("log", "syncMessageIndex", "offsetId超过end", null, true);
                  //   break;
                  // }
                  // if (results[index].chatId === 4 || results[index].chatId === 365) {
                  //   continue;
                  // }
                  // if (!await this.ctx.storage.get(results[index].chatId + "|" + results[index].id)) {
                  //   await this.ctx.storage.put(results[index].chatId + "|" + results[index].id, "[]");
                  //   // console.log("id : " + this.offsetId);  //测试
                  //   // this.sendMessage("log", "syncMessageIndex", "id : " + this.offsetId, null, false);  //测试
                  // }
                  if (await this.ctx.storage.get("4|" + results[index].id)) {
                    // await this.ctx.storage.delete("4|" + results[index].id);
                    this.sendMessage("log", "syncMessageIndex", "id : " + this.offsetId, null, false);  //测试
                  }
                }
                // await scheduler.wait(5000);  //测试
                await this.updateConfig(1, "sync");
              } else {
                // console.log("messageLength为0");
                this.sendMessage("log", "syncMessageIndex", "messageLength为0", null, true);
                this.broadcast({
                  "result": "over",
                });
                break;
              }
            } else {
              // console.log("messageLength为0");
              this.sendMessage("log", "syncMessageIndex", "messageResult为空", null, true);
              this.broadcast({
                "result": "over",
              });
              break;
            }
          } else {
            this.stop = 2;
            // console.log("syncMessageIndex - 超出apiCount限制");
            this.sendMessage("log", "syncMessageIndex", "超出apiCount限制", "limit", true);
            await this.close();
            // this.ctx.abort("reset");
          }
        }
      } else {
        // console.log("offsetId超过end");
        this.sendMessage("log", "syncMessageIndex", "offsetId超过end", null, true);
      }
    } else {
      this.syncCount = await this.countMessageIndex();
      // console.log("messageCount : " + this.syncCount);  //测试
      this.sendMessage("log", "syncMessageIndex", "messageCount : " + this.syncCount, null, false);  //测试
      if (this.syncCount > 0) {
        while (this.syncIndex <= this.syncCount) {
          if (this.apiCount < 900) {
            const results = await this.selectMessageIndex(1);
            if (results) {
              const length = results.length;
              // console.log("messageLength : " + length);  //测试
              // this.sendMessage("log", "syncMessageIndex", "messageLength : " + length, null, false);  //测试
              this.sendMessage("log", "syncMessageIndex", "offsetId : " + this.offsetId, null, false);  //测试
              if (length > 1) {
                for (let index = 0; index < length; index++) {
                  this.offsetId = results[index].Mindex;
                  if (results[index].chatId === 4 || results[index].chatId === 365) {
                    continue;
                  }
                  if (!await this.ctx.storage.get(results[index].chatId + "|" + results[index].id)) {
                    await this.ctx.storage.put(results[index].chatId + "|" + results[index].id, "[]");
                    // console.log("id : " + this.offsetId);  //测试
                    // this.sendMessage("log", "syncMessageIndex", "id : " + this.offsetId, null, false);  //测试
                  }
                }
                // await scheduler.wait(5000);  //测试
                this.syncIndex += length;
                await this.updateConfig(1, "sync");
              } else {
                // console.log("messageLength为0");
                this.sendMessage("log", "syncMessageIndex", "messageLength为0", null, true);
                this.broadcast({
                  "result": "over",
                });
                break;
              }
            } else {
              // console.log("messageLength为0");
              this.sendMessage("log", "syncMessageIndex", "messageResult为空", null, true);
              this.broadcast({
                "result": "over",
              });
              break;
            }
          } else {
            this.stop = 2;
            // console.log("syncMessageIndex - 超出apiCount限制");
            this.sendMessage("log", "syncMessageIndex", "超出apiCount限制", "limit", true);
            await this.close();
            // this.ctx.abort("reset");
          }
        }
      } else {
        // console.log("messageCount为0");
        this.sendMessage("log", "syncMessageIndex", "messageCount为0", null, true);
      }
    }
  }

  async index(option) {
    if (this.stop === 1) {
      this.ws.send(JSON.stringify({
        "step": this.currentStep,
        "operate": "index",
        "message": "服务已经运行过了",
        "error": true,
        "date": new Date().getTime(),
      }));
      return;
    }
    this.init(option);
    await this.getConfig(1, "sync", option);
    await this.syncMessageIndex();
    // await this.updateConfig(1, "sync");
  }

  async selectIndexError(tryCount) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")selectIndex超出tryCount限制");
      this.sendMessage("log", "selectIndex", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.selectIndex(tryCount + 1);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async selectIndex(tryCount, txt) {
    this.apiCount += 1;
    let messageResult = {};
    try {
      messageResult = await this.env.MAINDB.prepare("SELECT COUNT(*) FROM `PANINDEX` WHERE `txt` = ? LIMIT 1;").bind(txt).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : selectIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("log", "selectIndex", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.selectIndexError(tryCount, txt);
      }
      return;
    }
    // console.log("messageResult : " + messageResult["COUNT(*)"]);  //测试
    if (messageResult.success === true) {
      if (messageResult.results && messageResult.results.length > 0) {
        return messageResult.results[0]["COUNT(*)"];
      }
    } else {
      await this.selectIndexError(tryCount, txt);
    }
  }

  async insertIndexError(tryCount, txt) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")insertIndex超出tryCount限制");
      this.sendMessage("log", "insertIndex", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.insertIndex(tryCount + 1, txt);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async insertIndex(tryCount, txt) {
    this.apiCount += 1;
    let messageResult = {};
    try {
      messageResult = await this.env.MAINDB.prepare("INSERT INTO `PANINDEX` (chatId, txt) VALUES (?, ?);").bind(4, txt).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : insertIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);;
      this.sendMessage("log", "insertIndex", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.insertIndexError(tryCount, txt);
      }
      return;
    }
    // console.log(messageResult);  //测试
    if (messageResult.success === true) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 插入message数据成功");
      // this.sendMessage("log", "insertIndex", "", "success", false);
    } else {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 插入message数据失败");
      this.sendMessage("log", "insertIndex", "插入message数据失败", "error", true);
      await this.insertIndexError(tryCount, txt);
    }
  }

  async selectDuplicateMessageError(tryCount) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")selectDuplicateMessage超出tryCount限制");
      this.sendMessage("log", "selectDuplicateMessage", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.selectDuplicateMessage(tryCount + 1);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async selectDuplicateMessage(tryCount) {
    this.apiCount += 1;
    let messageResult = {};
    try {
      messageResult = await this.env.PANSOUDB.prepare("SELECT `txt`, `Mindex` FROM `PANMESSAGE` WHERE `chatId` = 4 AND `Mindex` >= ? ORDER BY `Mindex` ASC LIMIT 100;").bind(this.offsetId).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : selectDuplicateMessage : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("log", "selectDuplicateMessage", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.selectDuplicateMessageError(tryCount);
      }
      return;
    }
    // console.log("messageResult : " + messageResult);  //测试
    if (messageResult.success === true) {
      if (messageResult.results && messageResult.results.length > 0) {
        return messageResult.results;
      }
    } else {
      await this.selectDuplicateMessageError(tryCount);
    }
  }

  async deleteMessageError(tryCount, id) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")deleteMessage超出tryCount限制");
      this.sendMessage("log", "deleteMessage", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.deleteMessage(tryCount + 1, id);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async deleteMessage(tryCount, id) {
    this.apiCount += 1;
    let messageResult = {};
    try {
      messageResult = await this.env.PANSOUDB.prepare("DELETE FROM `PANMESSAGE` WHERE `Mindex` = ?;").bind(id).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : deleteMessage : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);;
      this.sendMessage("log", "deleteMessage", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.deleteMessageError(tryCount, id);
      }
      return;
    }
    // console.log(messageResult);  //测试
    if (messageResult.success === true) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 插入message数据成功");
      // this.sendMessage("log", "deleteMessage", "", "success", false);
    } else {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 插入message数据失败");
      this.sendMessage("log", "deleteMessage", "删除message数据失败", "error", true);
      await this.deleteMessageError(tryCount, id);
    }
  }

  async duplicateMessage() {
    if (this.endId && this.endId > 0) {
      if (this.endId > this.offsetId) {
        while (this.offsetId <= this.endId) {
          if (this.apiCount < 600) {
            const results = await this.selectDuplicateMessage(1);
            if (results) {
              const length = results.length;
              // console.log("messageLength : " + length);  //测试
              // this.sendMessage("log", "duplicateMessage", "messageLength : " + length, null, false);  //测试
              this.sendMessage("log", "duplicateMessage", "offsetId : " + this.offsetId, null, false);  //测试
              if (length > 1) {
                for (let index = 0; index < length; index++) {
                  this.offsetId = results[index].Mindex;
                  // if (this.offsetId > this.endId) {
                  //   // console.log("offsetId超过end");
                  //   this.sendMessage("log", "duplicateMessage", "offsetId超过end", null, true);
                  //   break;
                  // }
                  const indexCount = await this.selectIndex(1, results[index].txt);
                  if (parseInt(indexCount) === 0) {
                    await this.insertIndex(1, results[index].txt);
                  } else {
                    await this.deleteMessage(1, this.offsetId);
                    // console.log("(" + this.currentStep + ")" + this.offsetId + " : index已在数据库中");
                    this.sendMessage("log", "duplicateMessage", "exist", "exist", false);
                  }
                }
                // await scheduler.wait(5000);  //测试
                await this.updateConfig(1, "sync");
              } else {
                // console.log("messageLength为0");
                this.sendMessage("log", "duplicateMessage", "messageLength为0", null, true);
                this.broadcast({
                  "result": "over",
                });
                break;
              }
            } else {
              // console.log("messageLength为0");
              this.sendMessage("log", "duplicateMessage", "messageResult为空", null, true);
              this.broadcast({
                "result": "over",
              });
              break;
            }
          } else {
            this.stop = 2;
            // console.log("duplicateMessage - 超出apiCount限制");
            this.sendMessage("log", "duplicateMessage", "超出apiCount限制", "limit", true);
            await this.close();
            // this.ctx.abort("reset");
          }
        }
      } else {
        // console.log("offsetId超过end");
        this.sendMessage("log", "duplicateMessage", "offsetId超过end", null, true);
      }
    } else {
      this.syncCount = await this.countMessageIndex();
      // console.log("messageCount : " + this.syncCount);  //测试
      this.sendMessage("log", "duplicateMessage", "messageCount : " + this.syncCount, null, false);  //测试
      if (this.syncCount > 0) {
        while (this.syncIndex <= this.syncCount) {
          if (this.apiCount < 600) {
            const results = await this.selectDuplicateMessage(1);
            if (results) {
              const length = results.length;
              // console.log("messageLength : " + length);  //测试
              this.sendMessage("log", "duplicateMessage", "messageLength : " + length, null, false);  //测试
              if (length > 1) {
                for (let index = 0; index < length; index++) {
                  this.offsetId = results[index].Mindex;
                  const indexCount = await this.selectIndex(1, results[index].txt);
                  if (parseInt(indexCount) === 0) {
                    await this.insertIndex(1, results[index].txt);
                  } else {
                    await this.deleteMessage(1, this.offsetId);
                    // console.log("(" + this.currentStep + ")" + this.offsetId + " : index已在数据库中");
                    this.sendMessage("log", "duplicateMessage", "exist", "exist", false);
                  }
                }
                // await scheduler.wait(5000);  //测试
                this.syncIndex += length;
                await this.updateConfig(1, "sync");
              } else {
                // console.log("messageLength为0");
                this.sendMessage("log", "duplicateMessage", "messageLength为0", null, true);
                this.broadcast({
                  "result": "over",
                });
                break;
              }
            } else {
              // console.log("messageLength为0");
              this.sendMessage("log", "duplicateMessage", "messageResult为空", null, true);
              this.broadcast({
                "result": "over",
              });
              break;
            }
          } else {
            this.stop = 2;
            // console.log("duplicateMessage - 超出apiCount限制");
            this.sendMessage("log", "duplicateMessage", "超出apiCount限制", "limit", true);
            await this.close();
            // this.ctx.abort("reset");
          }
        }
      } else {
        // console.log("messageCount为0");
        this.sendMessage("log", "duplicateMessage", "messageCount为0", null, true);
      }
    }
  }

  async duplicate(option) {
    if (this.stop === 1) {
      this.ws.send(JSON.stringify({
        "step": this.currentStep,
        "operate": "duplicate",
        "message": "服务已经运行过了",
        "error": true,
        "date": new Date().getTime(),
      }));
      return;
    }
    this.init(option);
    await this.getConfig(1, "sync", option);
    await this.duplicateMessage();
    // await this.updateConfig(1, "sync");
  }

  // async clear() {
  //   // await this.ctx.storage.deleteAll();
  //   let begin = 0;
  //   let end = 100;
  //   while (true) {
  //     const results = await this.ctx.storage.list({
  //       start: begin,
  //       // startAfter: 0,
  //       end: end,
  //       // prefix: "4|",
  //       // prefix: "365_",
  //       // reverse : true,
  //       limit: 100,
  //     });
  //     if (results) {
  //       for (const item of results) {
  //         // console.log(item[0]);  //测试
  //         if (item[0].substr(0, 2) === "4|") {
  //           begin -= 1;
  //           await this.ctx.storage.delete(item[0]);
  //           this.sendMessage("log", "clear", item[0], null, false);  //测试
  //         }
  //       }
  //       begin += 100;
  //       end += 100;
  //     } else {
  //       break;
  //     }
  //   }
  //   // console.log("删除cache成功");
  //   this.broadcast({
  //     "step": this.currentStep,
  //     "type": "log",
  //     "operate": "clearCache",
  //     "message": "删除cache成功",
  //     "error": true,
  //     "date": new Date().getTime(),
  //   });
  // }

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
      } catch (err) {
        command = data;
        // console.log("parse : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
        this.sendMessage("log", "webSocketMessage", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      }
    // }
    if (command === "start") {
      // await this.start(option);
      await this.duplicate(option);  //测试
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
    // } else if (command === "clear") {
    //   await this.clear();
    } else if (command === "index") {
      await this.index(option);
    } else if (command === "duplicate") {
      await this.duplicate(option);
    } else if (command === "chat") {
      await this.chat();
    // } else if (command === "cache") {
    //   this.init(option);
    //   await this.nextChat(1, false);
    //   if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
    //     await this.cache(1);
    //   } else {
    //     // console.log(this.endChat + " : 超过最大chat了");  //测试
    //     this.sendMessage("log", "webSocketMessage", this.endChat + " : 超过最大chat了", null, true);
    //   }
    } else if (command === "compress") {
      this.compress = true;
    } else if (command === "noCompress") {
      this.compress = false;
    } else if (command === "batch") {
      this.batch = true;
    } else if (command === "noBatch") {
      this.batch = false;
    } else if (command === "chatId") {
      if (data.chatId && data.chatId >= 0 && this.chatId !== data.chatId) {
        this.chatId = data.chatId;
      }
    } else if (command === "offsetId") {
      if (data.offsetId && data.offsetId >= 0 && this.offsetId !== data.offsetId) {
        this.offsetId = data.offsetId;
      }
    } else if (command === "endChat") {
      if (data.endChat && data.endChat > 0 && this.endChat !== data.endChat) {
        this.endChat = data.endChat;
      }
    } else if (command === "backup") {
      if (option && option.id && option.id >= 0) {
        const name = getDB(option.id);
        if (name) {
          const signed_url = await exportDB(name);
          if (signed_url) {
            this.broadcast({
              "type": "log",
              "operate": "backup",
              "message": signed_url,
              "date": new Date().getTime(),
            });
          } else {
            this.broadcast({
              "type": "log",
              "operate": "backup",
              "message": "获取signed_url失败",
              "error": true,
              "date": new Date().getTime(),
            });
          }
        } else {
          this.broadcast({
            "type": "log",
            "operate": "backup",
            "message": "获取db失败",
            "error": true,
            "date": new Date().getTime(),
          });
        }
      } else {
        this.broadcast({
          "type": "log",
          "operate": "backup",
          "message": "要备份的数据库id不能为空",
          "error": true,
          "date": new Date().getTime(),
        });
      }
    } else {
      this.broadcast({
        "type": "log",
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
      const id = env.WEBSOCKET_SERVER.idFromName(env.APP_NAME);
      const stub = env.WEBSOCKET_SERVER.get(id);
      return stub.fetch(request);
    } else if (pathname === "/count") {
      const messageResult = await countMessage(env);
      if (messageResult >= 0) {
        return new Response(messageResult);
      } else {
        return new Response("获取message总数失败");
      }
    } else if (pathname === "/backup") {
      const id = url.searchParams.get('id');
      if (id && id >= 0) {
        const name = getDB(id);
        if (name) {
          const signed_url = await exportDB(name);
          if (signed_url) {
            return new Response(signed_url);
          } else {
            return new Response("获取signed_url失败");
          }
        } else {
          return new Response("获取db失败");
        }
      } else {
        return new Response("要备份的数据库id不能为空");
      }
    }

    return new Response("error");
  },
};
