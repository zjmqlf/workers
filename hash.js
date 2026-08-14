import { DurableObject } from "cloudflare:workers";
import { TelegramClient, Api, sessions, utils } from "./teleproto";
import { LogLevel } from "./teleproto/extensions/Logger";
import bigInt from "big-integer";

async function countMedia(env) {
  const mediaResult = await env.MEDIADB.prepare("SELECT COUNT(*) FROM `MEDIA` WHERE 1 = 1;").run();
  // console.log("mediaResult : " + mediaResult["COUNT(*)"]);  //测试
  if (mediaResult.success === true) {
    if (mediaResult.results && mediaResult.results.length > 0) {
      return mediaResult.results[0]["COUNT(*)"];
    }
  }
  return -1;
}

function getDB(id) {
  const database = [
    "97d41e14-a9b6-45a9-b5cc-f60eb29acc02",  //0 : main
    "619bf710-136f-4b05-b7a7-ce7ffef02990",  //1 : media1
  ];
  const length = database.length;
  if (id < length) {
    return database[id];
  } else {
    return undefined;
  }
}

async function exportDB(databaseId) {
  const accountId = "ac4c475ca3875ec3dea2d2306fde9c69";
  const d1ApiKey = "Vk_7LsZt_ZEwDMMU4tqHHaYghAApWQ8I5M5TV7x9";
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
  clientId = 0;
  photoDBIndex = 0;
  mediaDBIndex = 0;
  stop = 0;
  apiCount = 0;
  currentStep = 0;
  compress = false;
  batch = false;
  client = null;
  chatId = 0;
  endChat = 0;
  lastChat = 0;
  timeOver = 0;
  reverse = true;
  limit = 10;
  beginId = 0;
  endId = 0;
  syncIndex = 0;
  syncCount = 0;
  offsetId = 0;
  // error = false;
  fromPeer = null;
  filterType = 0;
  filter = Api.InputMessagesFilterVideo;
  //filterTitle = "媒体";
  errorMessage = "Too many API requests by single Worker invocation. To configure this limit, refer to https://developers.cloudflare.com/workers/wrangler/configuration/#limits";
  messageArray = [];
  cacheMessage = null;
  batchMessage = [];
  dialogArray = [];

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
        if (option.filterType) {
          this.filterType = option.filterType;
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
        this.filterType = 0;
        this.reverse = true;
        this.limit = 20;
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
      this.clientId = this.env.CLIENT_ID;
      this.photoDBIndex = this.env.PHOTO_DB_INDEX;
      this.mediaDBIndex = this.env.MEDIA_DB_INDEX;
      this.apiCount = 0;
      this.currentStep = 0;
      this.lastChat = 0;
      this.timeOver = 0;
      // this.error = false;
      this.fromPeer = null;
      this.messageArray = [];
      this.errorMessage = "Too many API requests by single Worker invocation. To configure this limit, refer to https://developers.cloudflare.com/workers/wrangler/configuration/#limits";
      this.filter = Api.InputMessagesFilterVideo;
      //this.filterTitle = "媒体";
      this.cacheMessage = null;
      this.batchMessage = [];
      this.dialogArray = [];
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
    // if (this.timeOver > 0) {
    //   clearTimeout(this.timeOver);
    //   this.timeOver = 0;
    // }
    if (this.compress === true) {
      if (message.operate === "nextHash") {
        if (message.status === "update") {
          if (this.cacheMessage) {
            if (message.offsetId === this.cacheMessage.offsetId) {
              this.cacheMessage["hashIndex"] = message.hashIndex;
              this.updateTime(message.date);
            }
          }
          return;
        }
      } else if (message.operate === "nextMessage") {
        if (message.status === "add") {
          if (this.cacheMessage) {
            if (message.offsetId > this.cacheMessage.offsetId) {
              const temp = message;
              message = this.cacheMessage;
              this.cacheMessage = temp;
              // this.updateTime(message.date);
            } else {
              this.cacheMessage = null;
              return;
            }
          } else {
            this.cacheMessage = message;
            // this.updateTime(message.date);
            return;
          }
        } else if (message.status === "error") {
        } else if (message.status === "limit") {
        } else if (!message.error) {
        } else {
          return;
        }
      } else if (message.operate === "getMedia" || message.operate === "getPhoto" || message.operate === "getFile") {
        if (message.status === "update") {
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
              this.updateTime(message.date);
            }
          }
          return;
        } else if (message.status === "indexExist") {
          if (this.cacheMessage) {
            if (message.offsetId === this.cacheMessage.offsetId) {
              this.cacheMessage["selectIndex"] = true;
              this.updateTime(message.date);
            }
          }
          return;
        } else if (message.status === "fileExist") {
          if (this.cacheMessage) {
            if (message.offsetId === this.cacheMessage.offsetId) {
              this.cacheMessage["selectFile"] = true;
              this.updateTime(message.date);
            }
          }
          return;
        } else if (message.status === "error") {
        } else if (message.status === "cache") {
        } else if (!message.error) {
        } else {
          return;
        }
      } else if (message.operate === "insertCache") {
      } else if (message.operate === "insertMedia") {
        if (this.cacheMessage) {
          if (message.offsetId === this.cacheMessage.offsetId) {
            if (message.status === "success") {
              this.cacheMessage["insertFile"] = true;
            } else if (message.status === "error") {
              this.cacheMessage["insertFile"] = false;
            }
            this.updateTime(message.date);
          }
        }
        return;
      } else if (message.operate === "insertPhoto") {
        if (this.cacheMessage) {
          if (message.offsetId === this.cacheMessage.offsetId) {
            if (message.status === "success") {
              this.cacheMessage["insertFile"] = true;
            } else if (message.status === "error") {
              this.cacheMessage["insertFile"] = false;
            }
            this.updateTime(message.date);
          }
        }
        return;
      } else if (message.operate === "insertMessage") {
        if (this.cacheMessage) {
          if (message.offsetId === this.cacheMessage.offsetId) {
            if (message.status === "success") {
              this.cacheMessage["insertMessage"] = true;
            } else if (message.status === "error") {
              this.cacheMessage["insertMessage"] = false;
            }
            this.updateTime(message.date);
          }
        }
        return;
      } else if (message.operate === "endInsert") {
        if (message.status === "exist") {
          if (this.cacheMessage) {
            if (message.offsetId === this.cacheMessage.offsetId) {
              this.cacheMessage["selectMessage"] = true;
              this.updateTime(message.date);
            }
          }
        }
        return;
      } else if (message.operate === "open") {
      } else if (message.operate === "close") {
      } else if (message.operate === "checkChat") {
      } else if (message.operate === "chat") {
      } else if (message.operate === "backup") {
      } else if (message.operate === "selectMediaIndex") {
      } else if (message.operate === "selectPhotoIndex") {
      } else if (message.operate === "syncMediaIndex") {
      } else if (message.operate === "syncPhotoIndex") {
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
    if (this.timeOver > 0) {
      clearTimeout(this.timeOver);
      this.timeOver = 0;
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

  sendHash(operate, message, hashIndex, status, error) {
    this.broadcast({
      "step": this.currentStep,
      "type": "grid",
      "operate": operate,
      "clientId": this.clientId,
      "offsetId": this.offsetId,
      "hashIndex": hashIndex,
      "message": message,
      "status": status,
      "error": error,
      "date": new Date().getTime(),
    });
  }

  sendPhoto(operate, message, photoIndex, status, error) {
    this.broadcast({
      "step": this.currentStep,
      "type": "grid",
      "operate": operate,
      "clientId": this.clientId,
      "offsetId": this.offsetId,
      "photoIndex": photoIndex,
      "message": message,
      "status": status,
      "error": error,
      "date": new Date().getTime(),
    });
  }

  sendMessage(type, operate, message, status, error) {
    this.broadcast({
      "step": this.currentStep,
      "type": type,
      "operate": operate,
      "clientId": this.clientId,
      "offsetId": this.offsetId,
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
        langCode: "zhcncc",
        systemLangCode: "zh-CN",
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
      if (type === "hash") {
        configResult = await this.env.MAINDB.prepare("SELECT * FROM `CONFIG` WHERE `name` = 'hash' AND `tgId` = 0 LIMIT 1;").run();
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
            if (type === "hash") {
              this.chatId = result.chatId;
              this.lastChat = this.chatId;
            } else if (type === "sync") {
              this.offsetId = result.chatId;
            }
          }
        }
        if (!option || !option.filterType) {
          if (result.filterType && result.filterType > 0 && result.filterType <= 9) {
            this.filterType = result.filterType;
          }
        }
        if (!option || !option.reverse) {
          if (result.reverse) {
            this.reverse = Boolean(result.reverse);
          }
        }
        if (!option || !option.limited) {
          if (result.limited && result.limited > 0) {
            if (type === "hash") {
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
      if (type === "hash") {
        configResult = await this.env.MAINDB.prepare("UPDATE `CONFIG` SET `chatId` = ? WHERE `name` = 'hash' AND `tgId` = 0;").bind(this.chatId).run();
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

  async switchType() {
    switch (this.filterType) {
      case 0:
        this.filter = Api.InputMessagesFilterPhotoVideo;
        break;
      case 1:
        //this.filterTitle = "图片";
        this.filter = Api.InputMessagesFilterPhotos;
        break;
      case 2:
        //this.filterTitle = "视频";
        this.filter = Api.InputMessagesFilterVideo;
        break;
      case 3:
        //this.filterTitle = "文件";
        this.filter = Api.InputMessagesFilterDocument;
        break;
      case 4:
        //this.filterTitle = "动图";
        this.filter = Api.InputMessagesFilterGif;
        break;
      case 5:
        this.filter = Api.InputMessagesFilterVoice;
        break;
      case 6:
        this.filter = Api.InputMessagesFilterMusic;
        break;
      case 7:
        this.filter = Api.InputMessagesFilterChatPhotos;
        break;
      case 8:
        this.filter = Api.InputMessagesFilterRoundVoice;
        break;
      case 9:
        this.filter = Api.InputMessagesFilterRoundVideo;
        break;
      default:
        this.filter = Api.InputMessagesFilterPhotoVideo;
    }
  }

  async setOffsetId(chatResult) {
    if (this.filterType === 0) {
      this.offsetId = chatResult.current;
    } else if (this.filterType === 1) {
      this.offsetId = chatResult.photo;
    } else if (this.filterType === 2) {
      this.offsetId = chatResult.video;
    } else if (this.filterType === 3) {
      this.offsetId = chatResult.document;
    } else if (this.filterType === 4) {
      this.offsetId = chatResult.gif;
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
      chatResult = await this.env.MAINDB.prepare("UPDATE `CHAT` SET `exist` = 0 WHERE `Cindex` = ?;").bind(Cindex).run();
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
    if (chatResult.chatType === 1) {
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
              this.setOffsetId(chatResult);
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
    } else if (chatResult.chatType === 2) {
      if (chatResult.channelId) {
        let users = null;
        try {
          users = await this.client.invoke(
            new Api.users.GetUsers({
              id: [
                new Api.InputUser({
                  userId: bigInt(chatResult.channelId),
                  accessHash: chatResult.accessHash ? bigInt(chatResult.accessHash) : bigInt.zero,
                }),
              ],
            })
          );
        } catch (err) {
          // console.log("(" + this.currentStep + ") : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
          this.sendMessage("log", "checkChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
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
          return;
        }
        if (users.length && !(users[0] instanceof Api.UserEmpty)) {
          if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
            this.chatId = chatResult.Cindex;
            this.fromPeer = utils.getInputPeer(users[0]);
            if (this.fromPeer) {
              this.setOffsetId(chatResult);
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
          // console.log(chatResult.title + " : channelId出错");  //测试
          this.sendMessage("log", "checkChat", chatResult.title + " : channelId出错", null, true);
          await this.nextChat(1, true);
        } else {
          // console.log(this.endChat + " : 超过最大chat了");  //测试
          this.sendMessage("log", "checkChat", this.endChat + " : 超过最大chat了", null, true);
        }
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
      chatResult = await this.env.MAINDB.prepare("SELECT * FROM `CHAT` WHERE `tgId` = 0 AND `Cindex` >= ? AND `exist` = 1 ORDER BY `Cindex` ASC LIMIT 1;").bind(this.chatId).run();
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
          chatResult = await this.env.MAINDB.prepare("SELECT * FROM `CHAT` WHERE `tgId` = 0 AND `Cindex` = 0 LIMIT 1;").run();
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
            this.setOffsetId(chatResult.results[0]);
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
            // if (this.filterType === 0) {
            //   chatResult = await this.env.MAINDB.prepare("SELECT * FROM `CHAT` WHERE `tgId` = 0 AND `current` = 0 AND `exist` = 1 ORDER BY `Cindex` ASC LIMIT 1;").run();
            // } else if (this.filterType === 1) {
            //   chatResult = await this.env.MAINDB.prepare("SELECT * FROM `CHAT` WHERE `tgId` = 0 AND `photo` = 0 AND `exist` = 1 ORDER BY `Cindex` ASC LIMIT 1;").run();
            // } else if (this.filterType === 2) {
            //   chatResult = await this.env.MAINDB.prepare("SELECT * FROM `CHAT` WHERE `tgId` = 0 AND `video` = 0 AND `exist` = 1 ORDER BY `Cindex` ASC LIMIT 1;").run();
            // } else if (this.filterType === 3) {
            //   chatResult = await this.env.MAINDB.prepare("SELECT * FROM `CHAT` WHERE `tgId` = 0 AND `document` = 0 AND `exist` = 1 ORDER BY `Cindex` ASC LIMIT 1;").run();
            // } else if (this.filterType === 4) {
            //   chatResult = await this.env.MAINDB.prepare("SELECT * FROM `CHAT` WHERE `tgId` = 0 AND `gif` = 0 AND `exist` = 1 ORDER BY `Cindex` ASC LIMIT 1;").run();
            // }
            chatResult = await this.env.MAINDB.prepare("SELECT * FROM `CHAT` WHERE `tgId` = 0 AND `Cindex` > ? AND `exist` = 1 ORDER BY `Cindex` ASC LIMIT 1;").run(this.chatId);
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
      if (this.filterType === 0) {
        chatResult = await this.env.MAINDB.prepare("UPDATE `CHAT` SET `current` = ?, `updated` = ? WHERE `Cindex` = ?;").bind(this.offsetId, new Date().getTime(), this.chatId).run();
      } else if (this.filterType === 1) {
        chatResult = await this.env.MAINDB.prepare("UPDATE `CHAT` SET `photo` = ?, `updated` = ? WHERE `Cindex` = ?;").bind(this.offsetId, new Date().getTime(), this.chatId).run();
      } else if (this.filterType === 2) {
        chatResult = await this.env.MAINDB.prepare("UPDATE `CHAT` SET `video` = ?, `updated` = ? WHERE `Cindex` = ?;").bind(this.offsetId, new Date().getTime(), this.chatId).run();
      } else if (this.filterType === 3) {
        chatResult = await this.env.MAINDB.prepare("UPDATE `CHAT` SET `document` = ?, `updated` = ? WHERE `Cindex` = ?;").bind(this.offsetId, new Date().getTime(), this.chatId).run();
      } else if (this.filterType === 4) {
        chatResult = await this.env.MAINDB.prepare("UPDATE `CHAT` SET `gif` = ?, `updated` = ? WHERE `Cindex` = ?;").bind(this.offsetId, new Date().getTime(), this.chatId).run();
      }
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
      let count = 0;
      // this.messageArray = [];
      for await (const message of this.client.iterMessages(
        this.fromPeer,
        //"me",  //测试
        {
          limit: this.limit,
          //limit: 20,  //测试
          reverse: this.reverse,
          //reverse: false,  //测试
          addOffset: this.reverse ? -this.offsetId : this.offsetId,
          //addOffset: 0,  //测试
          filter: this.filter,
          //filter: Api.InputMessagesFilterVideo,  //测试
          waitTime: 60,
        })
      ) {
        count += 1;
        if (message) {
          if (message.media) {
            if (message.media.document) {
              this.messageArray.push(message);
            } else if (message.media.photo) {
              this.messageArray.push(message);
            }
          }
        }
      }
      return count;
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

  async getHash(tryCount, location, sender, offset, hashIndex) {
    if (this.stop === 1) {
      try {
        // const timeOut = new Promise((resolve) => {
        //   setTimeout(function() {
        //     this.sendHash("getHash", "获取超时", hashIndex, "error", true);
        //     return resolve();
        //   }, 10000);
        // });
        // const results = await Promise.race([
        //   this.client.invokeWithSender(
        //     new Api.upload.GetFileHashes({
        //       location: location,
        //       offset: offset,
        //     }),
        //     sender
        //   ),
        //   timeOut
        // ]);
        const results = await this.client.invokeWithSender(
          new Api.upload.GetFileHashes({
            location: location,
            offset: offset,
          }),
          sender
        );
        return results;
      } catch (err) {
        if (err.name === "FloodWaitError" || err.errorMessage?.includes("FLOOD_WAIT_") === true || err.code === 420) {
          // console.log("(" + this.currentStep + ") 触发了洪水警告，请求太频繁 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
          this.sendMessage("log", "getHash", "触发了洪水警告，请求太频繁 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "flood", true);
        }
        this.sendHash("getHash", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, hashIndex, "try", true);
        // if (hashIndex === 1) {
        //   this.error = true;
        //   // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 查询首个hash : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
        //   await scheduler.wait(5000);
        // } else {
        //   // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 查询hash出错");
        //   await scheduler.wait(10000);
        //   await this.getHash(tryCount + 1, location, sender, offset, hashIndex);
        // }
        if (this.filterType === 1) {
          return;
        } else if (tryCount === 5) {
          this.stop = 2;
          // console.log("(" + this.currentStep + ")getHash超出tryCount限制");
          this.sendMessage("log", "getHash", "超出tryCount限制", null, true);
          await this.close();
        } else {
          await scheduler.wait(10000);
          if (this.stop === 1) {
            await this.getHash(tryCount + 1, location, sender, offset, hashIndex);
          } else if (this.stop === 2) {
            this.broadcast({
              "result": "pause",
            });
            await this.close();
          }
        }
        return;
      }
    } else if (this.stop === 2) {
      this.broadcast({
        "result": "pause",
      });
      await this.close();
    }
  }

  async nextHash(location, sender, category, id, accessHash, size, offset, hashLength, hashIndex, limit, hash) {
    if (this.stop === 1) {
      if (this.apiCount < 900) {
        if (offset < size) {
          hashIndex += 1;
          // console.log(hashLength + " - " + hashIndex);  //测试
          this.sendHash("nextHash", "", hashIndex, "update", false);
          const hashes = await this.getHash(1, location, sender, offset, hashIndex);
          // if (this.error === false) {
            if (hashes) {
              // console.log(hashes);
              const length = hashes.length;
              if (length && length > 0) {
                for (let i = 0; i < length; i++) {
                  offset += 131072;
                  const string = hashes[i].hash.toString("hex");
                  // console.log("sha2 : " + string);  //测试
                  if (string) {
                    hash.push(string);
                  }
                }
              }
            } else {
              if (this.filterType === 1) {
                return;
              }
              hashIndex -= 1;
              // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : hashes出错");
              this.sendMessage("grid", "nextHash", "hashes出错", "error", true);
            }
            if (offset < size) {
              limit += 1;
              if (limit === 50) {
                limit = 0;
                await this.insertCache(1, category, id, accessHash, offset, hashLength, hashIndex, hash);
              } else {
                await scheduler.wait(1000);
              }
              await this.nextHash(location, sender, category, id, accessHash, size, offset, hashLength, hashIndex, limit, hash);
            } else {
              return;
            }
          // }
        } else {
          return;
        }
      } else {
        this.stop = 2;
        // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : nextHash超出apiCount限制");
        this.sendMessage("grid", "nextHash", "超出apiCount限制", "limit", true);
        await this.updateChat(1);
        await this.insertCache(1, category, id, accessHash, offset, hashLength, hashIndex, hash);
        await this.close();
        // this.ctx.abort("reset");
      }
    } else if (this.stop === 2) {
      await this.updateChat(1);
      this.broadcast({
        "result": "pause",
      });
      await this.close();
    }
  }

  async getCache(id) {
    if (this.currentStep === 1) {
      if (this.filter === Api.InputMessagesFilterVideo || this.filter === Api.InputMessagesFilterPhotoVideo || this.filter === Api.InputMessagesFilterDocument) {
        if (id) {
          const cacheResult = await this.ctx.storage.get("c_" + id);
          if (cacheResult) {
            let cacheHash = undefined;
            try {
              cacheHash = JSON.parse(cacheResult);
            } catch (err) {
              // console.log(this.offsetId + " : 恢复cache失败");
              this.sendMessage("log", "getCache", this.offsetId + " : 恢复cache失败", null, true);
            }
            return cacheHash;
          } else {
            return undefined;
          }
        } else {
          return undefined;
        }
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  async insertCache(tryCount, category, id, accessHash, offset, hashLength, hashIndex, hash) {
    if (category === 2 && hash && hash.length && hash.length > 0) {
      try {
        await this.ctx.storage.put("c_" + id, JSON.stringify({
          "offset": offset,
          "hashIndex": hashIndex,
          "hash": hash,
        }));
      } catch (err) {
        // console.log("(" + this.currentStep + ")insertCache " + this.offsetId + " : ("+ hashLength + " | " + hashIndex + ")插入cache数据 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
        this.sendMessage("log", "insertCache", this.offsetId + " : ("+ hashLength + " | " + hashIndex + ")插入cache数据 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
        if (tryCount === 5) {
          this.stop = 2;
          // console.log("(" + this.currentStep + ")insertCache超出tryCount限制");
          this.sendMessage("log", "insertCache", "超出tryCount限制", null, true);
          await this.close();
        } else {
          await scheduler.wait(10000);
          if (this.stop === 1) {
            await this.insertCache(tryCount + 1, category, id, accessHash, offset, hashLength, hashIndex, hash);
          } else if (this.stop === 2) {
            this.broadcast({
              "result": "pause",
            });
            await this.close();
          }
        }
        return;
      }
      // console.log("(" + this.currentStep + ")insertCache " + this.offsetId + " : ("+ hashLength + " | " + hashIndex + ")插入cache数据成功");
      this.sendMessage("log", "insertCache", this.offsetId + " : ("+ hashLength + " | " + hashIndex + ")插入cache数据成功", null, false);
    } else {
      // console.log("(" + this.currentStep + ")cache("+ hashLength + " | " + hashIndex + ")数据错误");
      this.sendMessage("log", "insertCache", "cache("+ hashLength + " | " + hashIndex + ")数据错误", null, true);
    }
  }

  async selectMediaError(tryCount, id) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")selectMedia超出tryCount限制");
      this.sendMessage("log", "selectMedia", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.selectMedia(tryCount + 1, id);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async selectMedia(tryCount, id) {
    this.apiCount += 1;
    let mediaResult = {};
    try {
      mediaResult = await this.env.MEDIADB.prepare("SELECT `Vindex`, COUNT(*) FROM `MEDIA` WHERE `id` = ? LIMIT 1;").bind(id).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : selectMedia : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("grid", "selectMedia", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.selectMediaError(tryCount, id);
      }
      return;
    }
    // console.log("mediaResult : " + mediaResult);  //测试
    if (mediaResult.success === true) {
      if (mediaResult.results && mediaResult.results.length > 0) {
        return mediaResult.results[0];
      }
    } else {
      await this.selectMediaError(tryCount, id);
    }
  }

  async insertMediaError(tryCount, id, accessHash, dcId, fileName, mimeType, size, duration, width, height, hash) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")insertMedia超出tryCount限制");
      this.sendMessage("log", "insertMedia", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.insertMedia(tryCount + 1, id, accessHash, dcId, fileName, mimeType, size, duration, width, height, hash);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async insertMedia(tryCount, id, accessHash, dcId, fileName, mimeType, size, duration, width, height, hash) {
    this.apiCount += 1;
    let mediaResult = {};
    try {
      mediaResult = await this.env.MEDIADB.prepare("INSERT INTO `MEDIA` (id, accessHash, dcId, fileName, mimeType, size, duration, width, height, hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);").bind(id, accessHash, dcId, fileName, mimeType, size, duration, width, height, JSON.stringify(hash)).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : insertMedia : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);;
      this.sendMessage("grid", "insertMedia", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.insertMediaError(tryCount, id, accessHash, dcId, fileName, mimeType, size, duration, width, height, hash);
      }
      return;
    }
    // console.log(mediaResult);  //测试
    if (mediaResult.success === true) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 插入media数据成功");
      this.sendMessage("grid", "insertMedia", "", "success", false);
      return mediaResult.meta.last_row_id;
    } else {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 插入media数据失败");
      this.sendMessage("grid", "insertMedia", "插入media数据失败", "error", true);
      await this.insertMediaError(tryCount, id, accessHash, dcId, fileName, mimeType, size, duration, width, height, hash);
      return 0;
    }
  }

  async endMediaMessage(count, id, accessHash, dcId, fileName, mimeType, size, duration, width, height, hash) {
    if (this.stop === 1) {
      // console.log(count + " : " + hash.length);  //测试
      if (hash.length === count) {
        const index = await this.insertMedia(1, id, accessHash, dcId, fileName, mimeType, size, duration, width, height, hash);
        if (index > 0) {
          await this.ctx.storage.put("m_" + id, "[]");
        }
        return index;
      } else {
        // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : count不一至 : " + count + " - " + hash.length);
        this.sendMessage("grid", "endMediaMessage", "count不一至 : " + count + " - " + hash.length, "error", true);
        return 0;
      }
      //this.offsetId += 1;
    } else if (this.stop === 2) {
      await this.updateChat(1);
      this.broadcast({
        "result": "pause",
      });
      await this.close();
    }
  }

  async selectPhotoError(tryCount, id, type) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")selectPhoto超出tryCount限制");
      this.sendMessage("log", "selectPhoto", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.selectPhoto(tryCount + 1, id, type);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async selectPhoto(tryCount, id, type) {
    this.apiCount += 1;
    let photoResult = {};
    try {
      photoResult = await this.env.PHOTODB.prepare("SELECT `Pindex`, COUNT(*) FROM `PHOTO` WHERE `id` = ? AND `sizeType` = ? LIMIT 1;").bind(id, type).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : selectPhoto : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("grid", "selectPhoto", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.selectPhotoError(tryCount, id, type);
      }
      return;
    }
    // console.log("photoResult : " + photoResult);  //测试
    if (photoResult.success === true) {
      if (photoResult.results && photoResult.results.length > 0) {
        return photoResult.results[0];
      }
    } else {
      await this.selectPhotoError(tryCount, id, type);
    }
  }

  async insertPhotoError(tryCount, id, accessHash, dcId, photoIndex, type, size, hash) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")insertPhoto超出tryCount限制");
      this.sendMessage("log", "insertPhoto", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.insertPhoto(tryCount + 1, id, accessHash, dcId, photoIndex, type, size, hash);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async insertPhoto(tryCount, id, accessHash, dcId, photoIndex, type, size, hash) {
    this.apiCount += 1;
    let photoResult = {};
    try {
      photoResult = await this.env.PHOTODB.prepare("INSERT INTO `PHOTO` (id, accessHash, dcId, sizeType, size, hash) VALUES (?, ?, ?, ?, ?, ?);").bind(id, accessHash, dcId, type, size, JSON.stringify(hash)).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : (" + photoLength +"/" + photoIndex + ") insertPhoto : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendPhoto("insertPhoto", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, photoIndex, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.insertPhotoError(tryCount, id, accessHash, dcId, photoIndex, type, size, hash);
      }
      return;
    }
    // console.log(photoResult);  //测试
    if (photoResult.success === true) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 插入photo数据成功");
      this.sendPhoto("insertPhoto", "", photoIndex, "success", false);
      return photoResult.meta.last_row_id;
    } else {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 插入photo数据失败");
      this.sendPhoto("insertPhoto", "插入photo数据失败", photoIndex, "error", true);
      await this.insertPhotoError(tryCount, id, accessHash, dcId, photoIndex, type, size, hash);
      return 0;
    }
  }

  async endPhotoMessage(count, id, accessHash, dcId, photoIndex, type, size, hash) {
    if (this.stop === 1) {
      // console.log(count + " : " + hash.length);  //测试
      if (hash.length === count) {
        const index = await this.insertPhoto(1, id, accessHash, dcId, photoIndex, type, size, hash);
        if (index > 0) {
          await this.ctx.storage.put("p_" + type + "_" + id, "[]");
        }
        return index;
      } else {
        // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : count不一至 : " + count + " - " + hash.length);
        this.sendMessage("grid", "endPhotoMessage", "count不一至 : " + count + " - " + hash.length, "error", true);
        return 0;
      }
      //this.offsetId += 1;
    } else if (this.stop === 2) {
      await this.updateChat(1);
      this.broadcast({
        "result": "pause",
      });
      await this.close();
    }
  }

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
    let messageResult = null;
    try {
      messageResult = await this.env.MAINDB.prepare("SELECT COUNT(*) FROM `MESSAGE` WHERE `id` = ? LIMIT 1;").bind(messageId).run();
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

  async insertMessageError(tryCount, messageId, category, txt, ids, status) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")insertMessage超出tryCount限制");
      this.sendMessage("log", "insertMessage", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.insertMessage(tryCount + 1, messageId, category, txt, ids, status);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async insertMessage(tryCount, messageId, category, txt, ids, status) {
    this.apiCount += 1;
    let messageResult = {};
    let dbIndex = 0;
    if (category === 1) {
      dbIndex = this.photoDBIndex;
    } else if (category === 2) {
      dbIndex = this.mediaDBIndex;
    }
    try {
      messageResult = await this.env.MAINDB.prepare("INSERT INTO `MESSAGE` (id, dbIndex, category, txt, ids, status) VALUES (?, ?, ?, ?, ?, ?);").bind(messageId, dbIndex, category, txt, JSON.stringify(ids), status).run();
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
        await this.insertMessageError(tryCount, messageId, category, txt, ids, status);
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
      await this.insertMessageError(tryCount, messageId, category, txt, ids, status);
    }
  }

  async endInsert(messageId, category, txt, ids, status) {
    const messageCount = await this.selectMessage(1, messageId);
    if (parseInt(messageCount) === 0) {
      await this.insertMessage(1, messageId, category, txt, ids, status);
    } else {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : message已在数据库中");
      this.sendMessage("grid", "endInsert", "", "exist", false);
    }
  }

  async getMedia(message) {
    const messageId = message.id;
    const id = message.media.document.id.toString();
    const accessHash = message.media.document.accessHash.toString();
    if (id && accessHash) {
      let status = 0;
      const category = 2;
      const txt = message.message;
      const ids = [];
      const mediaIndexResult = await this.ctx.storage.get("m_" + id);
      if (mediaIndexResult) {
        const mediaResult = await this.selectMedia(1, id);
        if (mediaResult) {
          const mediaCount = parseInt(mediaResult["COUNT(*)"]);
          if (mediaCount === 0) {
            // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 准备查询视频的hash");
            let duration = 0;
            let width = 0;
            let height = 0;
            let fileName = "";
            const attributes = message.media.document.attributes;
            if (attributes.length > 0) {
              for (const attribute of attributes) {
                if (attribute) {
                  if (attribute.className === "DocumentAttributeVideo") {
                    duration = attribute.duration;
                    width = attribute.w;
                    height = attribute.h;
                  } else if (attribute.className === "DocumentAttributeFilename") {
                    fileName = attribute.fileName;
                  }
                }
              }
            }
            // console.log(duration + " - " + width + " - " + height + " - " + fileName);  //测试
            let offset = 0;
            let hashIndex = 0;
            let hash = [];
            const info = utils.getFileInfo(message.media);
            const dcId = info.dcId;
            const location = info.location;
            const size = parseInt(message.media.document.size);
            const mimeType = message.media.document.mimeType;
            const sender = await this.client.getSender(dcId);
            const count = Math.ceil(size / 131072);
            const hashLength = Math.ceil(size / (131072 * 8));
            this.broadcast({
              "step": this.currentStep,
              "type": "grid",
              "operate": "getMedia",
              "offsetId": this.offsetId,
              "category": category,
              "dcId": dcId,
              "size": size,
              "mimeType": mimeType,
              "fileName": fileName,
              "duration": duration,
              "width": width,
              "height": height,
              "hashLength": hashLength,
              "status": "update",
              "date": new Date().getTime(),
            });
            const cacheHash = await this.getCache(id);
            if (cacheHash) {
              if (cacheHash.offset) {
                offset = cacheHash.offset;
              }
              if (cacheHash.hashIndex) {
                hashIndex = cacheHash.hashIndex;
              }
              if (cacheHash.hash) {
                hash = cacheHash.hash;
              }
              // console.log(this.offsetId + " : 从(" + hashLength + " | " + hashIndex + ")处继续");
              this.sendMessage("log", "getMedia", this.offsetId + " : 从(" + hashLength + " | " + hashIndex + ")处继续", "cache", false);
            }
            if (hashLength > 0) {
              await this.nextHash(location, sender, category, id, accessHash, size, offset, hashLength, hashIndex, 0, hash);
            }
            // if (this.error === false) {
              if (this.stop === 1) {
                const lastId = await this.endMediaMessage(count, id, accessHash, dcId, fileName, mimeType, size, duration, width, height, hash);
                if (lastId && lastId > 0) {
                  status = 1;
                  ids.push(lastId);
                }
                await this.endInsert(messageId, category, txt, ids, status);
                this.offsetId += 1;
              } else if (this.stop === 2) {
                await this.updateChat(1);
                this.broadcast({
                  "result": "pause",
                });
                await this.close();
              }
            // } else {
            //   this.error = false;
            //   this.offsetId += 1;
            // }
          } else {
            // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 视频已入过库了");
            this.sendMessage("grid", "getMedia", "", "fileExist", false);
            const Vindex = mediaResult.Vindex;
            if (Vindex && Vindex > 0) {
              status = 1;
              ids.push(Vindex);
              await this.ctx.storage.put("m_" + id, "[]");
            }
            await this.endInsert(messageId, category, txt, ids, status);
            this.offsetId += 1;
          }
        } else {
          // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 视频的mediaResult错误");
          this.sendMessage("grid", "getMedia", "视频的mediaResult错误", "error", true);
          this.offsetId += 1;
        }
      } else {
        // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 视频已入过索引库了");
        this.sendMessage("grid", "getMedia", "", "indexExist", false);
        const Vindex = mediaIndexResult.Vindex;
        if (Vindex && Vindex > 0) {
          status = 1;
          ids.push(Vindex);
        }
        await this.endInsert(messageId, category, txt, ids, status);
        this.offsetId += 1;
      }
    } else {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 视频的id或accessHash错误");
      this.sendMessage("grid", "getMedia", "视频的id或accessHash错误", "error", true);
      this.offsetId += 1;
    }
  }

  async getPhoto(message) {
    const messageId = message.id;
    const id = message.media.photo.id.toString();
    const accessHash = message.media.photo.accessHash.toString();
    if (id && accessHash) {
      const photoInfo = utils.getPhotoInfo(message.media);
      const photoLength = photoInfo.length;
      // console.log("photoLength : " + photoLength);  //测试
      if (photoLength && photoLength > 0) {
        let status = 0;
        const category = 1;
        const txt = message.message;
        const ids = [];
        this.broadcast({
          "step": this.currentStep,
          "type": "grid",
          "operate": "getPhoto",
          "offsetId": this.offsetId,
          "category": category,
          "photoLength": photoLength,
          "status": "update",
          "date": new Date().getTime(),
        });
        for (let index = 0; index < photoLength; index++) {
          const photoIndex = index + 1;
          const type = photoInfo[index].type;
          const photoIndexResult = await this.ctx.storage.get("p_" + type + "_" + id);
          if (photoIndexResult) {
            const photoResult = await this.selectPhoto(1, id, type);
            if (photoResult) {
              const photoCount = parseInt(photoResult["COUNT(*)"]);
              if (photoCount === 0) {
                const dcId = photoInfo[index].dcId;
                const location = photoInfo[index].location;
                const size = photoInfo[index].size;
                // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : (" + photoLength +"/" + photoIndex + ") 准备查询图片"+ type + "的hash");
                this.broadcast({
                  "step": this.currentStep,
                  "type": "grid",
                  "operate": "getPhoto",
                  "offsetId": this.offsetId,
                  "photoIndex": photoIndex,
                  "dcId": dcId,
                  "type": type,
                  "size": size,
                  "status": "update",
                  "date": new Date().getTime(),
                });
                const hash = [];
                const sender = await this.client.getSender(dcId);
                const count = Math.ceil(size / 131072);
                const hashLength = Math.ceil(size / (131072 * 8));
                if (hashLength > 0) {
                  await this.nextHash(location, sender, category, id, accessHash, size, 0, hashLength, 0, 0, hash);
                }
                // if (this.error === false) {
                  if (this.stop === 1) {
                    const lastId = await this.endPhotoMessage(count, id, accessHash, dcId, photoIndex, type, size, hash);
                    if (lastId && lastId > 0) {
                      status = 1;
                      ids.push(lastId);
                    }
                    await scheduler.wait(1000);
                  } else if (this.stop === 2) {
                    await this.updateChat(1);
                    this.broadcast({
                      "result": "pause",
                    });
                    await this.close();
                  }
                // } else {
                //   this.error = false;
                // }
              } else {
                // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : (" + photoLength +"/" + photoIndex + ") 图片"+ type + "已入过库了");
                this.sendPhoto("getPhoto", "", photoIndex, "fileExist", false);
                const Pindex = photoResult.Pindex;
                if (Pindex && Pindex > 0) {
                  status = 1;
                  ids.push(Pindex);
                  await this.ctx.storage.put("p_" + type + "_" + id, "[]");
                }
              }
            } else {
              // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 图片的photoResult错误");
              this.sendPhoto("getPhoto", "图片的photoResult错误", photoIndex, "error", true);
            }
          } else {
            // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 图片已入过索引库了");
            this.sendPhoto("getPhoto", "", photoIndex, "indexExist", false);
            const Pindex = photoIndexResult.Pindex;
            if (Pindex && Pindex > 0) {
              status = 1;
              ids.push(Pindex);
            }
          }
          // await scheduler.wait(1000);
        }
        await this.endInsert(messageId, category, txt, ids, status);
        this.offsetId += 1;
      } else {
        // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 图片的info错误");
        this.sendPhoto("getPhoto", "图片的info错误", photoIndex, "error", true);
        this.offsetId += 1;
      }
    } else {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 图片的id或accessHash错误");
      this.sendPhoto("getPhoto", "图片的id或accessHash错误", photoIndex, "error", true);
      this.offsetId += 1;
    }
  }

  async getFile(message) {
    const messageId = message.id;
    const id = message.media.document.id.toString();
    const accessHash = message.media.document.accessHash.toString();
    if (id && accessHash) {
      const photoIndexResult = await this.ctx.storage.get("p_p_" + id);
      if (photoIndexResult) {
        let status = 0;
        const category = 1;
        const txt = message.message;
        const ids = [];
        const photoResult = await this.selectPhoto(1, id, "p");
        if (photoResult) {
          const photoCount = parseInt(photoResult["COUNT(*)"]);
          if (photoCount === 0) {
            // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 准备查询图片的hash");
            let offset = 0;
            let hashIndex = 0;
            let hash = [];
            const info = utils.getFileInfo(message.media);
            const dcId = info.dcId;
            const location = info.location;
            const size = parseInt(message.media.document.size);
            const mimeType = message.media.document.mimeType;
            const sender = await this.client.getSender(dcId);
            const count = Math.ceil(size / 131072);
            const hashLength = Math.ceil(size / (131072 * 8));
            this.broadcast({
              "step": this.currentStep,
              "type": "grid",
              "operate": "getFile",
              "offsetId": this.offsetId,
              "category": category,
              "dcId": dcId,
              "size": size,
              "mimeType": mimeType,
              "hashLength": hashLength,
              "status": "update",
              "date": new Date().getTime(),
            });
            if (hashLength > 0) {
              await this.nextHash(location, sender, category, id, accessHash, size, offset, hashLength, hashIndex, 0, hash);
            }
            // if (this.error === false) {
              if (this.stop === 1) {
                const lastId = await this.endPhotoMessage(count, id, accessHash, dcId, 1, "p", size, hash);
                if (lastId && lastId > 0) {
                  status = 1;
                  ids.push(lastId);
                }
                await this.endInsert(messageId, category, txt, ids, status);
                this.offsetId += 1;
              } else if (this.stop === 2) {
                await this.updateChat(1);
                this.broadcast({
                  "result": "pause",
                });
                await this.close();
              }
            // } else {
            //   this.error = false;
            //   this.offsetId += 1;
            // }
          } else {
            // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 图片已入过库了");
            this.sendMessage("grid", "getFile", "", "fileExist", false);
            const Pindex = photoResult.Pindex;
            if (Pindex && Pindex > 0) {
              status = 1;
              ids.push(Pindex);
              await this.ctx.storage.put("p_p_" + id, "[]");
            }
            await this.endInsert(messageId, category, txt, ids, status);
            this.offsetId += 1;
          }
        } else {
          // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 图片的photoResult错误");
          this.sendMessage("grid", "getFile", "图片的photoResult错误", "error", true);
          this.offsetId += 1;
        }
      } else {
        // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 图片已入过索引库了");
        this.sendMessage("grid", "getFile", "", "indexExist", false);
        const Pindex = photoIndexResult.Pindex;
        if (Pindex && Pindex > 0) {
          status = 1;
          ids.push(Pindex);
        }
        await this.endInsert(messageId, category, txt, ids, status);
        this.offsetId += 1;
      }
    } else {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 图片的id或accessHash错误");
      this.sendMessage("grid", "getFile", "图片的id或accessHash错误", "error", true);
      this.offsetId += 1;
    }
  }

  async nextMessage(messageLength, messageIndex, message) {
    if (this.stop === 1) {
      if (this.apiCount < 900) {
        if (message) {
          const time = new Date().getTime();
          this.broadcast({
            "step": this.currentStep,
            "type": "grid",
            "operate": "nextMessage",
            // "messageLength": messageLength,
            // "messageIndex": messageIndex,
            "chatId": this.chatId,
            "offsetId": this.offsetId,
            "messageId": message.id,
            "status": "add",
            "time": time,
            "date": time,
          });
          if (message.media) {
            if (message.media.document) {
              const mimeType = message.media.document.mimeType;
              if (mimeType.startsWith("video/")) {
                await this.getMedia(message);
              } else if (mimeType.startsWith("image/")) {
                await this.getFile(message);
              } else if (mimeType.startsWith("application/")) {
                // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : application");
                this.sendMessage("grid", "nextMessage", "application", "error", true);
                this.offsetId += 1;
              } else {
                // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 未知的媒体");
                this.sendMessage("grid", "nextMessage", "未知的媒体", "error", true);
                this.offsetId += 1;
              }
            } else if (message.media.photo) {
              await this.getPhoto(message);
            }
          } else {
            // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 消息不包含媒体");
            this.sendMessage("grid", "nextMessage", "消息不包含媒体", "error", true);
            this.offsetId += 1;
          }
        } else {
          // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 错误的消息");
          this.sendMessage("grid", "nextMessage", "错误的消息", "error", true);
          this.offsetId += 1;
        }
      } else {
        this.stop = 2;
        // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : nextMessage超出apiCount限制");
        this.sendMessage("grid", "nextMessage", "超出apiCount限制", "limit", true);
        await this.updateChat(1);
        //await this.insertCache(1, category, id, accessHash, offset, hashLength, photoIndex, hash);
        await this.close();
        // this.ctx.abort("reset");
      }
    } else if (this.stop === 2) {
      await this.updateChat(1);
      this.broadcast({
        "result": "pause",
      });
      await this.close();
    }
  }

  async nextStep() {
    if (this.stop === 1) {
      if (this.apiCount < 900) {
        this.currentStep += 1;
        const messageCount = await this.getMessage(1);
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
            await this.updateChat(1);
            if (this.stop === 1) {
              if (this.apiCount < 900) {
                await this.nextStep();
              } else {
                this.stop = 2;
                // console.log("(" + this.currentStep + ")nextStep超出apiCount限制");
                this.sendMessage("log", "nextStep", "超出apiCount限制", "limit", true);
                //await this.insertCache(1, category, id, accessHash, offset, hashLength, hashIndex, hash);
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
            await this.updateChat(1);
            this.broadcast({
              "result": "pause",
            });
            await this.close();
          }
        } else if (messageCount > 0) {
          // console.log("(" + this.currentStep + ")messageCount : " + messageCount);
          this.sendMessage("log", "nextStep", "messageCount : " + messageCount, null, true);
          this.offsetId += this.limit;
          await this.updateChat(1);
          if (this.stop === 1) {
            await this.nextStep();
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
                  await this.updateConfig(1, "hash");
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
        //await this.insertCache(1, category, id, accessHash, offset, hashLength, hashIndex, hash);
        await this.close();
        // this.ctx.abort("reset");
      }
    } else if (this.stop === 2) {
      await this.updateChat(1);
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

  async setCheck() {
    this.timeOver = setTimeout(async function() {
      this.sendMessage("log", "start", "过了1分钟没任何响应", null, true);
      let errorCount = await this.ctx.storage.get("c_" + this.offsetId) || 0;
      errorCount += 1;
      await this.ctx.storage.put("c_" + this.offsetId, errorCount);
      if (errorCount >= 5) {
        // await this.ctx.storage.delete("c_" + this.offsetId);
        this.offsetId += 1;
        await this.updateChat(1);
      }
      await this.close();
    }, 50000);
  }

  async start(option) {
    if (this.client || this.stop === 1) {
    // if (this.stop === 1) {
      await this.setCheck();
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
    if (!option || !option.chatId || !option.filterType || !option.reverse || !option.limited) {
      await this.getConfig(1, "hash", option);
    }
    await this.setCheck();
    this.switchType();
    await this.getChat();
    if (this.fromPeer) {
      if (this.chatId != this.lastChat) {
        if (this.lastChat != 0) {
          await this.updateConfig(1, "hash");
        }
        this.lastChat = this.chatId;
      }
      if (this.stop === 1) {
        this.currentStep += 1;
        const messageCount = await this.getMessage(1);
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
          await this.updateChat(1);
          if (this.stop === 1) {
            if (this.apiCount < 900) {
              await this.nextStep();
            } else {
              this.stop = 2;
              // console.log("(" + this.currentStep + ")start超出apiCount限制");
              this.sendMessage("log", "start", "超出apiCount限制", "limit", true);
              await this.close();
              // this.ctx.abort("reset");
            }
          } else if (this.stop === 2) {
            this.broadcast({
              "result": "pause",
            });
            await this.close();
          }
        } else if (messageCount > 0) {
          // console.log("(" + this.currentStep + ")messageCount : " + messageCount");
          this.sendMessage("log", "start", "messageCount : " + messageCount, null, true);
          this.offsetId += this.limit;
          await this.updateChat(1);
          if (this.stop === 1) {
            await this.nextStep();
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
                  await this.updateConfig(1, "hash");
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
        // if (dialog.isChannel === true) {
          this.dialogArray.push(dialog);
        // }
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
      chatResult = await this.env.MAINDB.prepare("SELECT Cindex, username, title, COUNT(*) FROM `CHAT` WHERE `tgId` = 0 AND `channelId` = ? LIMIT 1;").bind(channelId).run();
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

  async insertChatError(tryCount, channelId, accessHash, chatType, username, title, noforwards) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("insertChat超出tryCount限制");
      this.sendMessage("log", "insertChat", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.insertChat(tryCount + 1, channelId, accessHash, chatType, username, title, noforwards);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async insertChat(tryCount, channelId, accessHash, chatType, username, title, noforwards) {
    this.apiCount += 1;
    let chatResult = {};
    try {
      chatResult = await this.env.MAINDB.prepare("INSERT INTO `CHAT` (channelId, accessHash, chatType, username, title, noforwards, current, photo, video, document, gif, exist) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);").bind(channelId, accessHash, chatType, username, title, noforwards, 0, 0, 0, 0, 0, 1).run();
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
        await this.insertChatError(tryCount, channelId, accessHash, chatType, username, title, noforwards);
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
      await this.insertChatError(tryCount, channelId, accessHash, chatType, username, title, noforwards);
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
          chatResult = await this.env.MAINDB.prepare("UPDATE `CHAT` SET `username` = ?, `title` = ? WHERE `Cindex` = ?;").bind(username, title, Cindex).run();
        } else {
          chatResult = await this.env.MAINDB.prepare("UPDATE `CHAT` SET `username` = ? WHERE `Cindex` = ?;").bind(username, Cindex).run();
        }
      } else {
        if (title) {
          chatResult = await this.env.MAINDB.prepare("UPDATE `CHAT` SET `title` = ? WHERE `Cindex` = ?;").bind(title, Cindex).run();
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
          if (title === "test110") {
          } else {
            let channelId = "";
            let accessHash = "";
            let chatType = 0;
            if (dialog.isChannel === true) {
              chatType = 1;
              channelId = dialog.inputEntity.channelId.toString();
              accessHash = dialog.inputEntity.accessHash.toString();
            } else if (dialog.isUser === true) {
              chatType = 2;
              // if (dialog.draft._entity.bot === true && dialog.draft._entity.deleted === false) {
              // if (dialog.entity.bot === true && dialog.entity.deleted === false) {
              // if (dialog.draft._entity.bot === true) {
              if (dialog.entity.bot === true) {
                channelId = dialog.inputEntity.userId.toString();
                accessHash = dialog.inputEntity.accessHash.toString();
              }
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
                  await this.insertChat(1, channelId, accessHash, chatType, username, title, noforwards);
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

  async selectMediaIndexError(tryCount) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")selectMediaIndex超出tryCount限制");
      this.sendMessage("log", "selectMediaIndex", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.selectMediaIndex(tryCount + 1);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async selectMediaIndex(tryCount) {
    this.apiCount += 1;
    let mediaResult = {};
    try {
      mediaResult = await this.env.MAINDB.prepare("SELECT `id`, `rowid` FROM `MEDIAINDEX` WHERE `rowid` >= ? ORDER BY `rowid` ASC LIMIT 100;").bind(this.offsetId).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : selectMediaIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("log", "selectMediaIndex", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.selectMediaIndexError(tryCount);
      }
      return;
    }
    // console.log("mediaResult : " + mediaResult);  //测试
    if (mediaResult.success === true) {
      if (mediaResult.results && mediaResult.results.length > 0) {
        return mediaResult.results;
      }
    } else {
      await this.selectMediaIndexError(tryCount);
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

  async selectPhotoIndexError(tryCount) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")selectPhotoIndex超出tryCount限制");
      this.sendMessage("log", "selectPhotoIndex", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.selectPhotoIndex(tryCount + 1);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async selectPhotoIndex(tryCount) {
    this.apiCount += 1;
    let photoResult = {};
    try {
      photoResult = await this.env.MAINDB.prepare("SELECT `id`, `rowid`, `sizeType` FROM `PHOTOINDEX` WHERE `rowid` >= ? ORDER BY `rowid` ASC LIMIT 100;").bind(this.offsetId).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : selectPhotoIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("log", "selectPhotoIndex", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.selectPhotoIndexError(tryCount);
      }
      return;
    }
    // console.log("photoResult : " + photoResult);  //测试
    if (photoResult.success === true) {
      if (photoResult.results && photoResult.results.length > 0) {
        return photoResult.results;
      }
    } else {
      await this.selectPhotoIndexError(tryCount);
    }
  }

  async syncMediaIndex() {
    if (this.endId && this.endId > 0) {
      if (this.endId > this.offsetId) {
        while (this.offsetId <= this.endId) {
          const results = await this.selectMediaIndex(1);
          if (results) {
            const length = results.length;
            // console.log("mediaLength : " + length);  //测试
            this.sendMessage("log", "syncMediaIndex", "mediaLength : " + length, null, false);  //测试
            if (length > 0) {
              for (let index = 0; index < length; index++) {
                this.offsetId = results[index].rowid;
                // if (this.offsetId > this.endId) {
                //   // console.log("offsetId超过end");
                //   this.sendMessage("log", "syncMediaIndex", "offsetId超过end", null, true);
                //   break;
                // }
                if (!await this.ctx.storage.get("m_" + results[index].id)) {
                  await this.ctx.storage.put("m_" + results[index].id, "[]");
                  // console.log("id : " + this.offsetId);  //测试
                  // this.sendMessage("log", "syncMediaIndex", "id : " + this.offsetId, null, false);  //测试
                }
              }
              // await scheduler.wait(5000);  //测试
              await this.updateConfig(1, "sync");
            } else {
              // console.log("mediaLength为0");
              this.sendMessage("log", "syncMediaIndex", "mediaLength为0", null, true);
              break;
            }
          } else {
            // console.log("mediaLength为0");
            this.sendMessage("log", "syncMediaIndex", "mediaResult为空", null, true);
            break;
          }
        }
      } else {
        // console.log("offsetId超过end");
        this.sendMessage("log", "syncMediaIndex", "offsetId超过end", null, true);
      }
    } else {
      this.syncCount = await this.countMediaIndex();
      // console.log("mediaCount : " + this.syncCount);  //测试
      this.sendMessage("log", "syncMediaIndex", "mediaCount : " + this.syncCount, null, false);  //测试
      if (this.syncCount > 0) {
        while (this.syncIndex <= this.syncCount) {
          const results = await this.selectMediaIndex(1);
          if (results) {
            const length = results.length;
            // console.log("mediaLength : " + length);  //测试
            this.sendMessage("log", "syncMediaIndex", "mediaLength : " + length, null, false);  //测试
            if (length > 0) {
              for (let index = 0; index < length; index++) {
                this.offsetId = results[index].rowid;
                if (!await this.ctx.storage.get("m_" + results[index].id)) {
                  await this.ctx.storage.put("m_" + results[index].id, "[]");
                  // console.log("id : " + this.offsetId);  //测试
                  // this.sendMessage("log", "syncMediaIndex", "id : " + this.offsetId, null, false);  //测试
                }
              }
              // await scheduler.wait(5000);  //测试
              this.syncIndex += length;
              await this.updateConfig(1, "sync");
            } else {
              // console.log("mediaLength为0");
              this.sendMessage("log", "syncMediaIndex", "mediaLength为0", null, true);
              break;
            }
          } else {
            // console.log("mediaLength为0");
            this.sendMessage("log", "syncMediaIndex", "mediaResult为空", null, true);
            break;
          }
        }
      } else {
        // console.log("mediaCount为0");
        this.sendMessage("log", "syncMediaIndex", "mediaCount为0", null, true);
      }
    }
  }

  async syncPhotoIndex() {
    if (this.endId && this.endId > 0) {
      if (this.endId > this.offsetId) {
        while (this.offsetId <= this.endId) {
          const results = await this.selectPhotoIndex(1);
          if (results) {
            const length = results.length;
            // console.log("photoLength : " + length);  //测试
            this.sendMessage("log", "syncPhotoIndex", "photoLength : " + length, null, false);  //测试
            this.sendMessage("log", "syncPhotoIndex", "offsetId : " + this.offsetId, null, false);  //测试
            if (length > 0) {
              for (let index = 0; index < length; index++) {
                this.offsetId = results[index].rowid;
                // if (this.offsetId > this.endId) {
                //   // console.log("offsetId超过end");
                //   this.sendMessage("log", "syncMediaIndex", "offsetId超过end", null, true);
                //   break;
                // }
                if (!await this.ctx.storage.get("p_" + results[index].sizeType + "_" + results[index].id)) {
                  await this.ctx.storage.put("p_" + results[index].sizeType + "_" + results[index].id, "[]");
                  // console.log("id : " + this.offsetId);  //测试
                  // this.sendMessage("log", "syncPhotoIndex", "id : " + this.offsetId, null, false);  //测试
                }
              }
              // await scheduler.wait(5000);  //测试
              await this.updateConfig(1, "sync");
            } else {
              // console.log("photoLength为0");
              this.sendMessage("log", "syncPhotoIndex", "photoLength为0", null, true);
              break;
            }
          } else {
            // console.log("PhotoLength为0");
            this.sendMessage("log", "syncPhotoIndex", "PhotoResult为空", null, true);
            break;
          }
        }
      } else {
        // console.log("offsetId超过end");
        this.sendMessage("log", "syncPhotoIndex", "offsetId超过end", null, true);
      }
    } else {
      this.syncCount = await this.countPhotoIndex();
      // console.log("PhotoCount : " + this.syncCount);  //测试
      this.sendMessage("log", "syncPhotoIndex", "PhotoCount : " + this.syncCount, null, false);  //测试
      if (this.syncCount > 0) {
        while (this.syncIndex <= this.syncCount) {
          const results = await this.selectPhotoIndex(1);
          if (results) {
            const length = results.length;
            // console.log("photoLength : " + length);  //测试
            this.sendMessage("log", "syncPhotoIndex", "photoLength : " + length, null, false);  //测试
            if (length > 0) {
              for (let index = 0; index < length; index++) {
                this.offsetId = results[index].rowid;
                if (!await this.ctx.storage.get("p_" + results[index].sizeType + "_" + results[index].id)) {
                  await this.ctx.storage.put("p_" + results[index].sizeType + "_" + results[index].id, "[]");
                  // console.log("id : " + this.offsetId);  //测试
                  // this.sendMessage("log", "syncPhotoIndex", "id : " + this.offsetId, null, false);  //测试
                }
              }
              // await scheduler.wait(5000);  //测试
              this.syncIndex += length;
              await this.updateConfig(1, "sync");
            } else {
              // console.log("photoLength为0");
              this.sendMessage("log", "syncPhotoIndex", "photoLength为0", null, true);
              break;
            }
          } else {
            // console.log("PhotoLength为0");
            this.sendMessage("log", "syncPhotoIndex", "PhotoResult为空", null, true);
            break;
          }
        }
      } else {
        // console.log("PhotoCount为0");
        this.sendMessage("log", "syncPhotoIndex", "PhotoCount为0", null, true);
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
    if (this.filterType === 1) {
      await this.syncPhotoIndex();
    } else if (this.filterType === 2) {
      await this.syncMediaIndex();
    }
    // await this.updateConfig(1, "sync");
  }

  async sync(option) {
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
    // this.init(option);
    // await this.getConfig(1, "sync", option);
    const results = await this.ctx.storage.list({
      // start: 0,
      // startAfter: 0,
      // end: 0,
      // prefix: "c_",
      // reverse : true,
      // limit: 10,
    });
    for (const item of results) {
      // console.log(item[0]);  //测试
      this.sendMessage("log", "sync", item[0], null, false);  //测试
    }
    // await this.updateConfig(1, "sync");
  }

  async clear() {
    // await this.ctx.storage.deleteAll();
    const results = await this.ctx.storage.list({
      // start: 0,
      // startAfter: 0,
      // end: 0,
      prefix: "c_",
      // reverse : true,
      // limit: 100,
    });
    for (const item of results) {
      // console.log(item[0]);  //测试
      this.sendMessage("log", "clear", item[0], null, false);  //测试
    }
    // console.log("删除cache成功");
    this.broadcast({
      "step": this.currentStep,
      "type": "log",
      "operate": "clearCache",
      "message": "删除cache成功",
      "error": true,
      "date": new Date().getTime(),
    });
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
      } catch (err) {
        command = data;
        // console.log("parse : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
        this.sendMessage("log", "webSocketMessage", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
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
    } else if (command === "clear") {
      await this.clear();
    // } else if (command === "count") {
    //   const mediaResult = await countMedia(this.env);
    //   if (mediaResult >= 0) {
    //     // console.log(mediaResult);
    //     this.broadcast({
    //       "step": this.currentStep,
    //       "type": "log",
    //       "operate": "count",
    //       "message": mediaResult,
    //       "date": new Date().getTime(),
    //     });
    //   } else {
    //     // console.log("获取media总数失败");
    //     this.broadcast({
    //       "step": this.currentStep,
    //       "type": "log",
    //       "operate": "count",
    //       "message": "获取media总数失败",
    //       "error": true,
    //       "date": new Date().getTime(),
    //     });
    //   }
    } else if (command === "index") {
      await this.index(option);
    } else if (command === "sync") {
      await this.sync(option);
    } else if (command === "chat") {
      await this.chat();
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
    // } else if (pathname === "/clear") {
    } else if (pathname === "/count") {
      const mediaResult = await countMedia(env);
      if (mediaResult >= 0) {
        return new Response(mediaResult);
      } else {
        return new Response("获取media总数失败");
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
