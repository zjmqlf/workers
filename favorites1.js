import { DurableObject } from "cloudflare:workers";
import { TelegramClient, Api, sessions, utils } from "./teleproto";
import { LogLevel } from "./teleproto/extensions/Logger";
import { apiString } from "./apiString";
import bigInt from "big-integer";

export class WebSocketServer extends DurableObject {
  // webSocket = [];
  ws = null;
  stop = 0;
  apiCount = 0;
  currentStep = 0;
  compress = false;
  batch = false;
  api = apiString.slice(this.env.BEGIN_INDEX, this.env.END_INDEX);
  clientCount = 0;
  tg = [];
  waitTime = 60000;
  pingTime = 5000;
  filterType = -1;
  limit = 0;
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
    //     //   "clientCount": this.clientCount,
    //     //   "operate": "constructor",
    //     //   "message": "添加ws成功",
    //     //   "date": new Date().getTime(),
    //     // });
    //   }
    // });

    // this.ctx.blockConcurrencyWhile(async () => {
    //   this.init();
    //   if (!this.client[0]) {
    //     await this.open(1, 0);
    //   }
    // });

    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong"),
    );
  }

  getExcludeIndex(option, begin, end, exclude) {
    const temp = [];
    for (let clientIndex = begin; clientIndex < end; clientIndex++) {
      if (exclude.includes(clientIndex) === false) {
        temp.push(this.api[clientIndex]);
        if (option.clientCount && option.clientCount > 0) {
          if (temp.length === option.clientCount) {
            break;
          }
        }
      }
    }
    this.api = temp;
    this.clientCount = this.api.length;
    this.tg = Array(this.clientCount).fill(null);
  }

  getExcludeId(option, begin, end, exclude) {
    const temp = [];
    for (let clientIndex = begin; clientIndex < end; clientIndex++) {
      if (exclude.includes(this.api[clientIndex].id) === false) {
        temp.push(this.api[clientIndex]);
        if (option.clientCount && option.clientCount > 0) {
          if (temp.length === option.clientCount) {
            break;
          }
        }
      }
    }
    this.api = temp;
    this.clientCount = this.api.length;
    this.tg = Array(this.clientCount).fill(null);
  }

  getClientCount(option, begin, end) {
    this.api = this.api.slice(begin, end);
    if (option.clientCount && option.clientCount > 0) {
      this.api = this.api.slice(0, option.clientCount);
    }
    this.clientCount = this.api.length;
    this.tg = Array(this.clientCount).fill(null);
  }

  init(option) {
    if (!this.stop || this.stop === 0) {
      if (option) {
        if (option.compress) {
          this.compress = option.compress;
        }
        if (option.batch) {
          this.batch = option.batch;
        }
        if (option.filterType) {
          this.filterType = option.filterType;
        }
        if (option.limit && option.limit > 0) {
          this.limit = option.limit;
        }
      } else {
        this.compress = true;
        this.batch = false;
        this.filterType = 0;
        this.limit = 0;
      }
      // this.ws = null;
      // this.stop = 0;
      // this.webSocket = [];
      this.apiCount = 0;
      this.currentStep = 0;
      this.api = apiString.slice(this.env.BEGIN_INDEX, this.env.END_INDEX);
      this.clientCount = this.api.length;
      this.tg = Array(this.clientCount).fill(null);
      this.waitTime = 60000;
      this.pingTime = 5000;
      this.errorMessage = "Too many API requests by single Worker invocation. To configure this limit, refer to https://developers.cloudflare.com/workers/wrangler/configuration/#limits";
      this.messageArray = [];
      this.cacheMessage = null;
      this.batchMessage = [];
      this.dialogArray = [];
      if (option.includeIndex && option.includeIndex.length && option.includeIndex.length > 0) {
        const temp = [];
        for (let clientIndex = 0; clientIndex < this.clientCount; clientIndex++) {
          if (option.includeIndex.includes(clientIndex) === true) {
            temp.push(this.api[clientIndex]);
            if (option.clientCount && option.clientCount > 0) {
              if (temp.length === option.clientCount) {
                break;
              }
            }
          }
        }
        this.api = temp;
        this.clientCount = this.api.length;
        this.tg = Array(this.clientCount).fill(null);
      } else if (option.includeId && option.includeId.length && option.includeId.length > 0) {
        const temp = [];
        for (let clientIndex = 0; clientIndex < this.clientCount; clientIndex++) {
          if (option.includeId.includes(this.api[clientIndex].id) === true) {
            temp.push(this.api[clientIndex]);
            if (option.clientCount && option.clientCount > 0) {
              if (temp.length === option.clientCount) {
                break;
              }
            }
          }
        }
        this.api = temp;
        this.clientCount = this.api.length;
        this.tg = Array(this.clientCount).fill(null);
      } else if (option.beginIndex && option.beginIndex > 0) {
        if (option.endIndex && option.endIndex > 0) {
          if (option.excludeIndex && option.excludeIndex.length && option.excludeIndex.length > 0) {
            this.getExcludeIndex(option, option.beginIndex, option.endIndex, option.excludeIndex);
          } else if (option.excludeId && option.excludeId.length && option.excludeId.length > 0) {
            this.getExcludeId(option, option.beginIndex, option.endIndex, option.excludeId);
          } else {
            this.getClientCount(option, option.beginIndex, option.endIndex);
          }
        } else {
          if (option.excludeIndex && option.excludeIndex.length && option.excludeIndex.length > 0) {
            this.getExcludeIndex(option, option.beginIndex, this.clientCount, option.excludeIndex);
          } else if (option.excludeId && option.excludeId.length && option.excludeId.length > 0) {
            this.getExcludeId(option, option.beginIndex, this.clientCount, option.excludeId);
          } else {
            this.getClientCount(option, option.beginIndex, this.clientCount);
          }
        }
      } else if (option.endIndex && option.endIndex > 0) {
        if (option.excludeIndex && option.excludeIndex.length && option.excludeIndex.length > 0) {
          this.getExcludeIndex(option, 0, option.endIndex, option.excludeIndex);
        } else if (option.excludeId && option.excludeId.length && option.excludeId.length > 0) {
          this.getExcludeId(option, 0, option.endIndex, option.excludeId);
        } else {
          this.getClientCount(option, 0, option.endIndex);
        }
      } else if (option.beginId && option.beginId > 0) {
        if (option.endId && option.endId > 0) {
          if (option.excludeIndex && option.excludeIndex.length && option.excludeIndex.length > 0) {
            const temp = [];
            for (let clientIndex = 0; clientIndex < this.clientCount; clientIndex++) {
              if (this.api[clientIndex].id >= option.beginId && this.api[clientIndex].id <= option.endId) {
                if (option.excludeIndex.includes(clientIndex) === false) {
                  temp.push(this.api[clientIndex]);
                  if (option.clientCount && option.clientCount > 0) {
                    if (temp.length === option.clientCount) {
                      break;
                    }
                  }
                }
              }
            }
            this.api = temp;
          } else if (option.excludeId && option.excludeId.length && option.excludeId.length > 0) {
            const temp = [];
            for (let clientIndex = 0; clientIndex < this.clientCount; clientIndex++) {
              if (this.api[clientIndex].id >= option.beginId && this.api[clientIndex].id <= option.endId) {
                if (option.excludeId.includes(this.api[clientIndex].id) === false) {
                  temp.push(this.api[clientIndex]);
                  if (option.clientCount && option.clientCount > 0) {
                    if (temp.length === option.clientCount) {
                      break;
                    }
                  }
                }
              }
            }
            this.api = temp;
          } else {
            const temp = [];
            for (let clientIndex = 0; clientIndex < this.clientCount; clientIndex++) {
              if (this.api[clientIndex].id >= option.beginId && this.api[clientIndex].id <= option.endId) {
                temp.push(this.api[clientIndex]);
                if (option.clientCount && option.clientCount > 0) {
                  if (temp.length === option.clientCount) {
                    break;
                  }
                }
              }
            }
            this.api = temp;
            if (option.clientCount && option.clientCount > 0) {
              this.api = this.api.slice(0, option.clientCount);
            }
          }
        } else {
          if (option.excludeIndex && option.excludeIndex.length && option.excludeIndex.length > 0) {
            const temp = [];
            for (let clientIndex = option.beginIndex; clientIndex < this.clientCount; clientIndex++) {
              if (this.api[clientIndex].id >= option.beginId) {
                if (option.excludeIndex.includes(clientIndex) === false) {
                  temp.push(this.api[clientIndex]);
                  if (option.clientCount && option.clientCount > 0) {
                    if (temp.length === option.clientCount) {
                      break;
                    }
                  }
                }
              }
            }
            this.api = temp;
          } else if (option.excludeId && option.excludeId.length && option.excludeId.length > 0) {
            const temp = [];
            for (let clientIndex = 0; clientIndex < this.clientCount; clientIndex++) {
              if (this.api[clientIndex].id >= option.beginId) {
                if (option.excludeId.includes(this.api[clientIndex].id) === false) {
                  temp.push(this.api[clientIndex]);
                  if (option.clientCount && option.clientCount > 0) {
                    if (temp.length === option.clientCount) {
                      break;
                    }
                  }
                }
              }
            }
            this.api = temp;
          } else {
            const temp = [];
            for (let clientIndex = 0; clientIndex < this.clientCount; clientIndex++) {
              if (this.api[clientIndex].id >= option.beginId) {
                temp.push(this.api[clientIndex]);
                if (option.clientCount && option.clientCount > 0) {
                  if (temp.length === option.clientCount) {
                    break;
                  }
                }
              }
            }
            this.api = temp;
            if (option.clientCount && option.clientCount > 0) {
              this.api = this.api.slice(0, option.clientCount);
            }
          }
        }
        this.clientCount = this.api.length;
        this.tg = Array(this.clientCount).fill(null);
      } else if (option.endId && option.endId > 0) {
        if (option.excludeIndex && option.excludeIndex.length && option.excludeIndex.length > 0) {
          const temp = [];
          for (let clientIndex = 0; clientIndex < this.clientCount; clientIndex++) {
            if (this.api[clientIndex].id <= option.endId) {
              if (option.excludeIndex.includes(clientIndex) === false) {
                temp.push(this.api[clientIndex]);
                if (option.clientCount && option.clientCount > 0) {
                  if (temp.length === option.clientCount) {
                    break;
                  }
                }
              }
            }
          }
          this.api = temp;
        } else if (option.excludeId && option.excludeId.length && option.excludeId.length > 0) {
          const temp = [];
          for (let clientIndex = 0; clientIndex < this.clientCount; clientIndex++) {
            if (this.api[clientIndex].id <= option.endId) {
              if (option.excludeId.includes(this.api[clientIndex].id) === false) {
                temp.push(this.api[clientIndex]);
                if (option.clientCount && option.clientCount > 0) {
                  if (temp.length === option.clientCount) {
                    break;
                  }
                }
              }
            }
          }
          this.api = temp;
        } else {
          const temp = [];
          for (let clientIndex = 0; clientIndex < this.clientCount; clientIndex++) {
            if (this.api[clientIndex].id <= option.endId) {
              temp.push(this.api[clientIndex]);
              if (option.clientCount && option.clientCount > 0) {
                if (temp.length === option.clientCount) {
                  break;
                }
              }
            }
          }
          this.api = temp;
          if (option.clientCount && option.clientCount > 0) {
            this.api = this.api.slice(0, option.clientCount);
          }
        }
        this.clientCount = this.api.length;
        this.tg = Array(this.clientCount).fill(null);
      } else {
        if (option.excludeIndex && option.excludeIndex.length && option.excludeIndex.length > 0) {
          this.getExcludeIndex(option, 0, this.clientCount, option.excludeIndex);
        } else if (option.excludeId && option.excludeId.length && option.excludeId.length > 0) {
          this.getExcludeId(option, 0, this.clientCount, option.excludeId);
        } else if (option.clientCount && option.clientCount > 0) {
          this.api = this.api.slice(0, option.clientCount);
          this.clientCount = this.api.length;
          this.tg = Array(this.clientCount).fill(null);
        }
      }
      // this.sendLog(0, "init", "clientCount : " + this.clientCount, null, false);  //测试
      this.broadcast({
        "step": this.currentStep,
        "operate": "init",
        "message": "clientCount : " + this.clientCount,
        "date": new Date().getTime(),
      });  //测试
    }
  }

  broadcast(message) {
    if (message === "ping") {
      this.ctx.getWebSockets().forEach((ws) => {
      // this.webSocket.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(message);
          } catch (err) {
          }
        }
      });
      return;
    } else if (this.compress === true) {
      if (message.operate === "open") {
      } else if (message.operate === "close") {
      } else if (message.operate === "checkChat") {
      } else if (message.operate === "chat") {
      } else if (message.status === "limit") {
      } else if (message.status === "flood") {
      } else if (!message.error) {
        if (!message.result) {
          return;
        }
      }
      if (this.batch === true) {
        if (this.batchMessage.length < this.tg[clientIndex].limit) {
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
      if (this.batchMessage.length < this.tg[clientIndex].limit) {
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
          //   //   "clientCount": this.clientCount,
          //   //   "operate": "broadcast",
          //   //   "message": "删除ws成功",
          //   //   "date": new Date().getTime(),
          //   // });
          // } else {
          //   // console.log("(" + this.currentStep + ")没找到该ws");
          //   this.broadcast({
          //     "step": this.currentStep,
          //     "clientCount": this.clientCount,
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

  sendGrid(clientIndex, operate, message, status, error) {
    this.broadcast({
      "step": this.currentStep,
      "clientCount": this.clientCount,
      "clientIndex": clientIndex + 1,
      "clientId": this.tg[clientIndex].clientId,
      "filterType": this.tg[clientIndex].filterType,
      "chatId": this.tg[clientIndex].chatId,
      "offsetId": this.tg[clientIndex].offsetId,
      "operate": operate,
      "message": message,
      "status": status,
      "error": error,
      "date": new Date().getTime(),
    });
  }

  sendLog(clientIndex, operate, message, status, error) {
    this.broadcast({
      "step": this.currentStep,
      "clientCount": this.clientCount,
      "clientIndex": clientIndex + 1,
      "clientId": this.tg[clientIndex].clientId,
      "filterType": this.tg[clientIndex].filterType,
      "chatId": this.tg[clientIndex].chatId,
      "operate": operate,
      "message": message,
      "status": status,
      "error": error,
      "date": new Date().getTime(),
    });
  }

  sendForward(clientIndex, operate, message, messageLength, status, error) {
    this.broadcast({
      "step": this.currentStep,
      "clientCount": this.clientCount,
      "clientIndex": clientIndex + 1,
      "clientId": this.tg[clientIndex].clientId,
      "filterType": this.tg[clientIndex].filterType,
      "chatId": this.tg[clientIndex].chatId,
      "offsetId": this.tg[clientIndex].offsetId,
      "operate": operate,
      "messageLength": messageLength,
      "message": message,
      "status": status,
      "error": error,
      "date": new Date().getTime(),
    });
  }

  async close(clientIndex) {
    if (this.tg[clientIndex].client) {
      await this.tg[clientIndex].client.destroy();
      this.tg[clientIndex].client = null;
      // console.log("断开服务器" + (clientIndex + 1) + "成功");
      this.sendLog(clientIndex, "close", "断开服务器" + (clientIndex + 1) + "成功", null, false);
    }
  }

  async open(clientIndex, tryCount) {
    try {
      this.tg[clientIndex].client = new TelegramClient(new sessions.StringSession(this.api[clientIndex].sessionString), this.api[clientIndex].apiId, this.api[clientIndex].apiHash, {
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
      if (this.api[clientIndex].dc === 5) {
        this.tg[clientIndex].client.session.setDC(5, "91.108.56.128", 80);
      }
      this.tg[clientIndex].client.setLogLevel(LogLevel.ERROR);
      await this.tg[clientIndex].client.connect();
    } catch (err) {
      // console.log(err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendLog(clientIndex, "open", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (tryCount === 5) {
        // console.log("(" + this.currentStep + ")open超出tryCount限制");
        this.sendLog(clientIndex, "open", "超出tryCount限制", null, true);
        await this.close(clientIndex);
      } else {
        await scheduler.wait(30000);
        if (this.stop === 1) {
          await this.open(clientIndex, tryCount + 1);
        } else if (this.stop === 2) {
          this.broadcast({
            "result": "pause",
          });
          await this.close();
        }
      }
      return;
    }
    // console.log("连接服务器" + (clientIndex + 1) + "成功");
    this.sendLog(clientIndex, "open", "连接服务器" + (clientIndex + 1) + "成功", null, false);  //测试
    // console.log(this.tg[clientIndex].client);  //测试
    await scheduler.wait(5000);
  }

  async closeAll() {
    for (let clientIndex = 0; clientIndex < this.clientCount; clientIndex++) {
      await this.close(clientIndex);
    }
    this.stop = 0;
    this.ws.close();
    this.ctx.abort("reset");
  }

  async insertConfigError(clientIndex, tryCount) {
    if (tryCount === 5) {
      // console.log("(" + this.currentStep + ")insertConfig超出tryCount限制");
      this.sendLog(clientIndex, "insertConfig", "超出tryCount限制", null, true);
      await this.close(clientIndex);
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.insertConfig(clientIndex, tryCount + 1);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async switchType(clientIndex) {
    switch (this.tg[clientIndex].filterType) {
      case 0:
        this.tg[clientIndex].filter = Api.InputMessagesFilterPhotoVideo;
        break;
      case 1:
        //this.tg[clientIndex].filterTitle = "图片";
        this.tg[clientIndex].filter = Api.InputMessagesFilterPhotos;
        break;
      case 2:
        //this.tg[clientIndex].filterTitle = "视频";
        this.tg[clientIndex].filter = Api.InputMessagesFilterVideo;
        break;
      case 3:
        //this.tg[clientIndex].filterTitle = "文件";
        this.tg[clientIndex].filter = Api.InputMessagesFilterDocument;
        break;
      case 4:
        //this.tg[clientIndex].filterTitle = "动图";
        this.tg[clientIndex].filter = Api.InputMessagesFilterGif;
        break;
      case 5:
        this.tg[clientIndex].filter = Api.InputMessagesFilterVoice;
        break;
      case 6:
        this.tg[clientIndex].filter = Api.InputMessagesFilterMusic;
        break;
      case 7:
        this.tg[clientIndex].filter = Api.InputMessagesFilterChatPhotos;
        break;
      case 8:
        this.tg[clientIndex].filter = Api.InputMessagesFilterRoundVoice;
        break;
      case 9:
        this.tg[clientIndex].filter = Api.InputMessagesFilterRoundVideo;
        break;
      default:
        this.tg[clientIndex].filter = Api.InputMessagesFilterPhotoVideo;
    }
  }

  async insertConfig(clientIndex, tryCount) {
    this.apiCount += 1;
    let configResult = {};
    try {
      configResult = await this.env.MAINDB.prepare("INSERT INTO `CONFIG` (tgId, name, chatId, reverse, limited) VALUES (?, ?, ?, ?, ?);").bind(this.tg[clientIndex].clientId, 'favorites', this.tg[clientIndex].chatId, this.tg[clientIndex].reverse, this.tg[clientIndex].limit).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] insertConfig : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);;
      this.sendLog(clientIndex, "insertConfig", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.closeAll();
      } else {
        await this.insertConfigError(clientIndex, tryCount);
      }
      return;
    }
    // console.log(configResult);  //测试
    if (configResult.success === true) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] 插入config数据成功");
      this.sendLog(clientIndex, "insertConfig", "插入config数据成功", "success", false);
    } else {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] 插入config数据失败");
      this.sendLog(clientIndex, "insertConfig", "插入config数据失败", "error", true);
      await this.insertConfigError(clientIndex, tryCount);
    }
  }

  async getConfigError(clientIndex, tryCount, option) {
    if (tryCount === 5) {
      // console.log("(" + this.currentStep + ")getConfig超出tryCount限制");
      this.sendLog(clientIndex, "getConfig", "超出tryCount限制", null, true);
      await this.close(clientIndex);
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.getConfig(clientIndex, tryCount + 1, option);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async getConfig(clientIndex, tryCount, option) {
    this.apiCount += 1;
    let configResult = {};
    try {
      configResult = await this.env.MAINDB.prepare("SELECT * FROM `CONFIG` WHERE `tgId` = ? AND `name` = 'favorites' LIMIT 1;").bind(this.tg[clientIndex].clientId).run();
    } catch (err) {
      // console.log("getConfig : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendLog(clientIndex, "getConfig", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.closeAll();
      } else {
        await this.getConfigError(clientIndex, tryCount, option);
      }
      return;
    }
    // console.log("configResult : " + configResult);  //测试
    if (configResult.success === true) {
      if (configResult.results && configResult.results.length > 0) {
        const result = configResult.results[0];
        if (this.filterType >= 0) {
          this.tg[clientIndex].filterType = this.filterType;
          if (result.filterType && this.filterType === result.filterType) {
            if (result.chatId && result.chatId > 0) {
              this.tg[clientIndex].chatId = result.chatId;
              this.tg[clientIndex].lastChat = this.tg[clientIndex].chatId;
            }
          }
        } else {
          if (result.filterType && result.filterType >= 0) {
            this.tg[clientIndex].filterType = result.filterType;
          }
          if (result.chatId && result.chatId > 0) {
            this.tg[clientIndex].chatId = result.chatId;
            this.tg[clientIndex].lastChat = this.tg[clientIndex].chatId;
          }
        }
        this.switchType(clientIndex);
        if (result.reverse) {
          this.tg[clientIndex].reverse = Boolean(result.reverse);
        }
        if (this.limit > 0) {
          this.tg[clientIndex].limit = this.limit;
        } else {
          if (result.limited && result.limited > 0) {
            this.tg[clientIndex].limit = result.limited;
          }
        }
      } else {
        // console.log("没有预设config");
        // this.sendLog(clientIndex, "getConfig", "没有预设config", null, false);
        this.tg[clientIndex].chatId = 1;
        this.tg[clientIndex].lastChat = this.tg[clientIndex].chatId;
        this.tg[clientIndex].filterType = 1;
        this.tg[clientIndex].reverse = true;
        this.tg[clientIndex].limit = 100;
        this.switchType(clientIndex);
        await this.insertConfig(clientIndex, 1);
      }
    } else {
      // console.log("查询config失败");
      this.sendLog(clientIndex, "getConfig", "查询config失败", null, true);
      await this.getConfigError(clientIndex, tryCount, option);
    }
  }

  async updateConfigError(clientIndex, tryCount) {
    if (tryCount === 5) {
      // console.log("(" + this.currentStep + ")updateConfig超出tryCount限制");
      this.sendLog(clientIndex, "updateConfig", "超出tryCount限制", null, true);
      await this.close(clientIndex);
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.updateConfig(clientIndex, tryCount + 1);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async updateConfig(clientIndex, tryCount) {
    this.apiCount += 1;
    let configResult = {};
    try {
      configResult = await this.env.MAINDB.prepare("UPDATE `CONFIG` SET `chatId` = ?, `filterType` = ? WHERE `tgId` = ? AND `name` = 'favorites';").bind(this.tg[clientIndex].chatId, this.tg[clientIndex].filterType, this.tg[clientIndex].clientId).run();
    } catch (err) {
      // console.log("updateConfig : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendLog(clientIndex, "updateConfig", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.closeAll();
      } else {
        await this.updateConfigError(clientIndex, tryCount);
      }
      return;
    }
    // console.log(configResult);  //测试
    if (configResult.success === true) {
      // console.log("更新config数据成功");
      this.sendLog(clientIndex, "updateConfig", "更新config数据成功", null, false);
    } else {
      // console.log("更新config数据失败");
      this.sendLog(clientIndex, "updateConfig", "更新config数据失败", null, true);
      await this.updateConfigError(clientIndex, tryCount);
    }
  }

  async setOffsetId(clientIndex, chatResult) {
    if (this.tg[clientIndex].filterType === 0) {
      this.tg[clientIndex].offsetId = chatResult.current;
    } else if (this.tg[clientIndex].filterType === 1) {
      this.tg[clientIndex].offsetId = chatResult.photo;
    } else if (this.tg[clientIndex].filterType === 2) {
      this.tg[clientIndex].offsetId = chatResult.video;
    } else if (this.tg[clientIndex].filterType === 3) {
      this.tg[clientIndex].offsetId = chatResult.document;
    } else if (this.tg[clientIndex].filterType === 4) {
      this.tg[clientIndex].offsetId = chatResult.gif;
    }
  }

  async contrastChat(clientIndex) {
    return !this.tg[clientIndex].endChat || this.tg[clientIndex].endChat === 0 || (this.tg[clientIndex].endChat > 0 && this.tg[clientIndex].chatId <= this.tg[clientIndex].endChat);
  }

  async noExistChatError(clientIndex, tryCount, Cindex) {
    if (tryCount === 5) {
      // console.log("(" + this.currentStep + ")noExistChat超出tryCount限制");
      this.sendLog(clientIndex, "noExistChat", "超出tryCount限制", null, true);
      await this.close(clientIndex);
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.noExistChat(clientIndex, tryCount + 1, Cindex);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async noExistChat(clientIndex, tryCount, Cindex) {
    this.apiCount += 1;
    let chatResult = {};
    try {
      chatResult = await this.env.MAINDB.prepare("UPDATE `FORWARDCHAT` SET `exist` = 0 WHERE `Cindex` = ?;").bind(Cindex).run();
    } catch (err) {
      // console.log("noExistChat : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendLog(clientIndex, "noExistChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.closeAll();
      } else {
        await this.noExistChatError(clientIndex, tryCount, Cindex);
      }
      return;
    }
    // console.log(chatResult);  //测试
    if (chatResult.success === true) {
      // console.log("更新不存在chat数据成功");
      this.sendLog(clientIndex, "noExistChat", "更新不存在chat数据成功", null, false);
    } else {
      // console.log("更新不存在chat数据失败");
      this.sendLog(clientIndex, "noExistChat", "更新不存在chat数据失败", null, true);
      await this.noExistChatError(clientIndex, tryCount, Cindex);
    }
  }

  async noforwardChatError(clientIndex, tryCount, Cindex) {
    if (tryCount === 5) {
      // console.log("(" + this.currentStep + ")noforwardChat超出tryCount限制");
      this.sendLog(clientIndex, "noforwardChat", "超出tryCount限制", null, true);
      await this.close(clientIndex);
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.noforwardChat(clientIndex, tryCount + 1, Cindex);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async noforwardChat(clientIndex, tryCount, Cindex) {
    this.apiCount += 1;
    let chatResult = {};
    try {
      chatResult = await this.env.MAINDB.prepare("UPDATE `FORWARDCHAT` SET `noforwards` = 1 WHERE `Cindex` = ?;").bind(Cindex).run();
    } catch (err) {
      // console.log("noforwardChat : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendLog(clientIndex, "noforwardChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.closeAll();
      } else {
        await this.noforwardChatError(clientIndex, tryCount, Cindex);
      }
      return;
    }
    // console.log(chatResult);  //测试
    if (chatResult.success === true) {
      // console.log("更新不允许转发消息的chat数据成功");
      this.sendLog(clientIndex, "noforwardChat", "更新不允许转发消息的chat数据成功", null, false);
    } else {
      // console.log("更新不允许转发消息的chat数据失败");
      this.sendLog(clientIndex, "noforwardChat", "更新不允许转发消息的chat数据失败", null, true);
      await this.noforwardChatError(clientIndex, tryCount, Cindex);
    }
  }

  async nextFilter(clientIndex) {
    this.tg[clientIndex].filterType += 1;
    if (this.tg[clientIndex].filterType > 4) {
      this.tg[clientIndex].filterType = 1;
    }
    this.tg[clientIndex].chatId = 0;
    await this.nextChat(clientIndex, 1, true);
  }

  async checkChat(clientIndex, tryCount, chatResult) {
    if (chatResult.channelId && chatResult.accessHash) {
      let result = null;
      try {
        result = await this.tg[clientIndex].client.invoke(new Api.channels.GetChannels({
          id: [new Api.InputChannel({
            channelId: bigInt(chatResult.channelId),
            accessHash: bigInt(chatResult.accessHash),
          })],
        }));
      } catch (err) {
        // console.log("(" + this.currentStep + ") : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
        this.sendLog(clientIndex, "checkChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
        if (err.name === "ChannelPrivateError" || err.errorMessage === "CHANNEL_INVALID" || err.errorMessage === "CHANNEL_PRIVATE" || err.code === 400) {
          await this.noExistChat(clientIndex, 1, chatResult.Cindex);
          this.tg[clientIndex].chatId += 1;
          if (this.contrastChat(clientIndex)) {
            // console.log(chatResult.title + " : chat已不存在了");  //测试
            this.sendLog(clientIndex, "checkChat", chatResult.title + " : chat已不存在了", null, true);
            await this.nextChat(clientIndex, 1, true);
          } else {
            // console.log(this.tg[clientIndex].endChat + " : 超过最大chat了");  //测试
            this.sendLog(clientIndex, "checkChat", this.tg[clientIndex].endChat + " : 超过最大chat了", null, true);
            await this.nextFilter(clientIndex);
          }
        } else {
          if (tryCount === 5) {
            // console.log("(" + this.currentStep + ")checkChat超出tryCount限制");
            this.sendLog(clientIndex, "checkChat", "超出tryCount限制", null, true);
            await this.close(clientIndex);
          } else {
            await scheduler.wait(10000);
            if (this.stop === 1) {
              await this.checkChat(clientIndex, tryCount + 1, chatResult);
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
      // console.log(this.tg[clientIndex].fromPeer);  //测试
      if (result && result.chats && result.chats.length > 0) {
        this.tg[clientIndex].chatId = chatResult.Cindex;
        if (this.contrastChat(clientIndex)) {
          if (result.chats[0].noforwards === true) {
            await this.noforwardChat(clientIndex, 1, chatResult.Cindex);
            this.tg[clientIndex].chatId = chatResult.Cindex + 1;
            if (this.contrastChat(clientIndex)) {
              // console.log(chatResult.title + " : chat不允许转发消息");  //测试
              this.sendLog(clientIndex, "checkChat", chatResult.title + " : chat不允许转发消息", null, true);
              await this.nextChat(clientIndex, 1, true);
            } else {
              // console.log(this.tg[clientIndex].endChat + " : 超过最大chat了");  //测试
              this.sendLog(clientIndex, "checkChat", this.tg[clientIndex].endChat + " : 超过最大chat了", null, true);
              await this.nextFilter(clientIndex);
            }
          } else {
            this.tg[clientIndex].fromPeer = result.chats[0];
            if (this.tg[clientIndex].fromPeer) {
              this.setOffsetId(clientIndex, chatResult);
              this.tg[clientIndex].errorCount = await this.ctx.storage.get(this.tg[clientIndex].chatId) || 0;
              this.sendForward(clientIndex, "checkChat", this.tg[clientIndex].chatId + " : " + chatResult.title, 0, "add", false);
            } else {
              await this.noExistChat(clientIndex, 1, chatResult.Cindex);
              this.tg[clientIndex].chatId = chatResult.Cindex + 1;
              if (this.contrastChat(clientIndex)) {
                // console.log(chatResult.title + " : chat已不存在了");  //测试
                this.sendLog(clientIndex, "checkChat", chatResult.title + " : chat已不存在了", null, true);
                await this.nextChat(clientIndex, 1, true);
              } else {
                // console.log(this.tg[clientIndex].endChat + " : 超过最大chat了");  //测试
                this.sendLog(clientIndex, "checkChat", this.tg[clientIndex].endChat + " : 超过最大chat了", null, true);
                await this.nextFilter(clientIndex);
              }
            }
          }
        } else {
          // console.log(this.tg[clientIndex].endChat + " : 超过最大chat了");  //测试
          this.sendLog(clientIndex, "checkChat", this.tg[clientIndex].endChat + " : 超过最大chat了", null, true);
          await this.nextFilter(clientIndex);
        }
      } else {
        await this.noExistChat(clientIndex, 1, chatResult.Cindex);
        this.tg[clientIndex].chatId = chatResult.Cindex + 1;
        if (this.contrastChat(clientIndex)) {
          // console.log(chatResult.title + " : chat已不存在了");  //测试
          this.sendLog(clientIndex, "checkChat", chatResult.title + " : chat已不存在了", null, true);
          await this.nextChat(clientIndex, 1, true);
        } else {
          // console.log(this.tg[clientIndex].endChat + " : 超过最大chat了");  //测试
          this.sendLog(clientIndex, "checkChat", this.tg[clientIndex].endChat + " : 超过最大chat了", null, true);
          await this.nextFilter(clientIndex);
        }
      }
    } else {
      this.tg[clientIndex].chatId = chatResult.Cindex + 1;
      if (this.contrastChat(clientIndex)) {
        // console.log(chatResult.title + " : channelId或accessHash出错");  //测试
        this.sendLog(clientIndex, "checkChat", chatResult.title + " : channelId或accessHash出错", null, true);
        await this.nextChat(clientIndex, 1, true);
      } else {
        // console.log(this.tg[clientIndex].endChat + " : 超过最大chat了");  //测试
        this.sendLog(clientIndex, "checkChat", this.tg[clientIndex].endChat + " : 超过最大chat了", null, true);
        await this.nextFilter(clientIndex);
      }
    }
  }

  async nextChatError(clientIndex, tryCount, check) {
    if (tryCount === 5) {
      // console.log("(" + this.currentStep + ")nextChat超出tryCount限制");
      this.sendLog(clientIndex, "nextChat", "超出tryCount限制", null, true);
      await this.close(clientIndex);
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.nextChat(clientIndex, tryCount + 1, check);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async nextChat(clientIndex, tryCount, check) {
    this.apiCount += 1;
    let chatResult = {};
    try {
      chatResult = await this.env.MAINDB.prepare("SELECT * FROM `FORWARDCHAT` WHERE `tgId` = ? AND `Cindex` >= ? AND `noforwards` = 0 AND `exist` = 1 ORDER BY `Cindex` ASC LIMIT 1;").bind(this.tg[clientIndex].clientId, this.tg[clientIndex].chatId).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ") : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendLog(clientIndex, "nextChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.closeAll();
      } else {
        await this.nextChatError(clientIndex, tryCount, check);
      }
      return;
    }
    // console.log("chatResult : " + chatResult);  //测试
    if (chatResult.success === true) {
      if (chatResult.results && chatResult.results.length > 0) {
        if (check === true) {
          await this.checkChat(clientIndex, 1, chatResult.results[0]);
        } else {
          this.tg[clientIndex].chatId = chatResult.results[0].Cindex;
          this.tg[clientIndex].errorCount = await this.ctx.storage.get(this.tg[clientIndex].chatId) || 0;
          this.sendGrid(clientIndex, "nextChat", this.tg[clientIndex].chatId + " : " + chatResult.results[0].title, "add", false);
        }
      } else {
        this.tg[clientIndex].chatId = -1;
        // console.log("没有更多chat了");
        this.sendLog(clientIndex, "nextChat", "没有更多chat了", null, true);
      }
    } else {
      // console.log("查询chat失败");
      this.sendLog(clientIndex, "nextChat", "查询chat失败", null, true);
      await this.nextChatError(clientIndex, tryCount, check);
    }
  }

  async getChat(clientIndex) {
    if (this.tg[clientIndex].chatId && this.tg[clientIndex].chatId > 0) {
      if (this.contrastChat(clientIndex)) {
        await this.nextChat(clientIndex, 1, true);
      } else {
        // console.log(this.tg[clientIndex].endChat + " : 超过最大chat了");  //测试
        this.sendLog(clientIndex, "getChat", this.tg[clientIndex].endChat + " : 超过最大chat了", null, true);
        await this.nextFilter(clientIndex);
      }
    } else {
      if (this.contrastChat(clientIndex)) {
        let tryCount = 0;
        while (tryCount < 30) {
          this.apiCount += 1;
          let chatResult = {};
          try {
            // if (this.tg[clientIndex].filterType === 0) {
            //   chatResult = await this.env.MAINDB.prepare("SELECT * FROM `FORWARDCHAT` WHERE `tgId` = ? AND `current` = 0 AND `noforwards` = 0 AND `exist` = 1 ORDER BY `Cindex` ASC LIMIT 1;").bind(this.tg[clientIndex].clientId).run();
            // } else if (this.tg[clientIndex].filterType === 1) {
            //   chatResult = await this.env.MAINDB.prepare("SELECT * FROM `FORWARDCHAT` WHERE `tgId` = ? AND `photo` = 0 AND `noforwards` = 0 AND `exist` = 1 ORDER BY `Cindex` ASC LIMIT 1;").bind(this.tg[clientIndex].clientId).run();
            // } else if (this.tg[clientIndex].filterType === 2) {
            //   chatResult = await this.env.MAINDB.prepare("SELECT * FROM `FORWARDCHAT` WHERE `tgId` = ? AND `video` = 0 AND `noforwards` = 0 AND `exist` = 1 ORDER BY `Cindex` ASC LIMIT 1;").bind(this.tg[clientIndex].clientId).run();
            // } else if (this.tg[clientIndex].filterType === 3) {
            //   chatResult = await this.env.MAINDB.prepare("SELECT * FROM `FORWARDCHAT` WHERE `tgId` = ? AND `document` = 0 AND `noforwards` = 0 AND `exist` = 1 ORDER BY `Cindex` ASC LIMIT 1;").bind(this.tg[clientIndex].clientId).run();
            // } else if (this.tg[clientIndex].filterType === 4) {
            //   chatResult = await this.env.MAINDB.prepare("SELECT * FROM `FORWARDCHAT` WHERE `tgId` = ? AND `gif` = 0 AND `noforwards` = 0 AND `exist` = 1 ORDER BY `Cindex` ASC LIMIT 1;").bind(this.tg[clientIndex].clientId).run();
            // }
            chatResult = await this.env.MAINDB.prepare("SELECT * FROM `FORWARDCHAT` WHERE `tgId` = ? AND `Cindex` > ? AND `noforwards` = 0 AND `exist` = 1 ORDER BY `Cindex` ASC LIMIT 1;").bind(this.tg[clientIndex].clientId, this.tg[clientIndex].chatId).run();
          } catch (err) {
            tryCount += 1;
            // console.log("(" + this.currentStep + ")getChat : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
            this.sendLog(clientIndex, "getChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
            if (err.message === this.errorMessage) {
              this.stop = 2;
              this.broadcast({
                "result": "pause",
              });
              await this.closeAll();
              break;
            }
            await scheduler.wait(10000);
          }
          // console.log("chatResult : " + chatResult);  //测试
          if (chatResult.success === true) {
            if (chatResult.results && chatResult.results.length > 0) {
              await this.checkChat(clientIndex, 1, chatResult.results[0]);
            } else {
              this.tg[clientIndex].chatId = -1;
              // console.log("没有更多chat了");
              this.sendLog(clientIndex, "getChat", "没有更多chat了", null, true);
            }
            break;
          } else {
            // console.log("查询chat失败");
            this.sendLog(clientIndex, "getChat", "查询chat失败", null, true);
          }
        }
      } else {
        // console.log(this.tg[clientIndex].endChat + " : 超过最大chat了");  //测试
        this.sendLog(clientIndex, "getChat", this.tg[clientIndex].endChat + " : 超过最大chat了", null, true);
        await this.nextFilter(clientIndex);
      }
    }
  }

  async getMessage(clientIndex, tryCount) {
    try {
      // let count = 0;
      // this.messageArray = [];
      this.tg[clientIndex].count = 0;
      for await (const message of this.tg[clientIndex].client.iterMessages(
        this.tg[clientIndex].fromPeer,
        //"me",  //测试
        {
          limit: this.tg[clientIndex].limit,
          //limit: 20,  //测试
          reverse: this.tg[clientIndex].reverse,
          //reverse: false,  //测试
          addOffset: this.tg[clientIndex].reverse ? -this.tg[clientIndex].offsetId : this.tg[clientIndex].offsetId,
          //addOffset: 0,  //测试
          filter: this.tg[clientIndex].filter,
          //filter: Api.InputMessagesFilterVideo,  //测试
          waitTime: 60,
        })
      ) {
        // count += 1;
        this.tg[clientIndex].count += 1;
        if (message) {
          // if (message.noforwards === false) {
            if (message.media) {
              if (message.media.document) {
                this.messageArray.push(message);
              } else if (message.media.photo) {
                this.messageArray.push(message);
              }
            }
          // }
        }
      }
      if (this.tg[clientIndex].count > this.tg[clientIndex].limit) {
        // console.log("(" + this.currentStep + ") messageCount比limit大");
        this.sendLog(clientIndex, "getMessage", "messageCount比limit大", null, true);
      }
      // return count;
    } catch (err) {
      this.messageArray = [];
      // this.tg[clientIndex].count = 0;
      // console.log("(" + this.currentStep + ")getMessage : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendLog(clientIndex, "getMessage", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.name === "ChannelPrivateError" || err.errorMessage === "CHANNEL_INVALID" || err.errorMessage === "CHANNEL_PRIVATE" || err.code === 400) {
        await this.noExistChat(clientIndex, 1, this.tg[clientIndex].chatId);
        this.tg[clientIndex].fromPeer = null;
        this.tg[clientIndex].chatId += 1;
        if (this.contrastChat(clientIndex)) {
          // console.log("chat已不存在了");  //测试
          this.sendLog(clientIndex, "getMessage", "chat已不存在了", null, true);
          await this.getChat(clientIndex);
        } else {
          // console.log(this.tg[clientIndex].endChat + " : 超过最大chat了");  //测试
          this.sendLog(clientIndex, "getMessage", this.tg[clientIndex].endChat + " : 超过最大chat了", null, true);
          await this.nextFilter(clientIndex);
        }
      } else if (err.name === "FloodWaitError" || err.errorMessage?.includes("FLOOD_WAIT_") === true || err.code === 420) {
        // this.waitTime += 120000;
        if (err.seconds && err.seconds > 0) {
          this.tg[clientIndex].flood = new Date().getTime() + 60000 + err.seconds * 1000;
          await this.ctx.storage.put("client" + this.tg[clientIndex].clientId, this.tg[clientIndex].flood);
        }
        // console.log("(" + this.currentStep + ") 触发了洪水警告，请求太频繁 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
        this.sendLog(clientIndex, "getMessage", "触发了洪水警告，请求太频繁 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "flood", true);
      } else {
        if (tryCount === 5) {
          // console.log("(" + this.currentStep + ")getMessage超出tryCount限制");
          this.sendLog(clientIndex, "getMessage", "超出tryCount限制", null, true);
          await this.close(clientIndex);
        } else {
          await scheduler.wait(10000);
          if (this.stop === 1) {
            await this.getMessage(clientIndex, tryCount + 1);
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

  async updateChatError(clientIndex, tryCount, messageLength) {
    if (tryCount === 5) {
      // console.log("(" + this.currentStep + ")updateChat超出tryCount限制");
      this.sendLog(clientIndex, "updateChat", "超出tryCount限制", null, true);
      await this.close(clientIndex);
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.updateChat(clientIndex, tryCount + 1, messageLength);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async updateChat(clientIndex, tryCount, messageLength) {
    this.apiCount += 1;
    let chatResult = {};
    try {
      if (this.tg[clientIndex].filterType === 0) {
        chatResult = await this.env.MAINDB.prepare("UPDATE `FORWARDCHAT` SET `current` = ?, `updated` = ? WHERE `Cindex` = ?;").bind(this.tg[clientIndex].offsetId, new Date().getTime(), this.tg[clientIndex].chatId).run();
      } else if (this.tg[clientIndex].filterType === 1) {
        chatResult = await this.env.MAINDB.prepare("UPDATE `FORWARDCHAT` SET `photo` = ?, `updated` = ? WHERE `Cindex` = ?;").bind(this.tg[clientIndex].offsetId, new Date().getTime(), this.tg[clientIndex].chatId).run();
      } else if (this.tg[clientIndex].filterType === 2) {
        chatResult = await this.env.MAINDB.prepare("UPDATE `FORWARDCHAT` SET `video` = ?, `updated` = ? WHERE `Cindex` = ?;").bind(this.tg[clientIndex].offsetId, new Date().getTime(), this.tg[clientIndex].chatId).run();
      } else if (this.tg[clientIndex].filterType === 3) {
        chatResult = await this.env.MAINDB.prepare("UPDATE `FORWARDCHAT` SET `document` = ?, `updated` = ? WHERE `Cindex` = ?;").bind(this.tg[clientIndex].offsetId, new Date().getTime(), this.tg[clientIndex].chatId).run();
      } else if (this.tg[clientIndex].filterType === 4) {
        chatResult = await this.env.MAINDB.prepare("UPDATE `FORWARDCHAT` SET `gif` = ?, `updated` = ? WHERE `Cindex` = ?;").bind(this.tg[clientIndex].offsetId, new Date().getTime(), this.tg[clientIndex].chatId).run();
      }
    } catch (err) {
      // console.log("(" + this.currentStep + ")updateChat : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendLog(clientIndex, "updateChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.closeAll();
      } else {
        await this.updateChatError(clientIndex, tryCount, messageLength);
      }
      return;
    }
    // console.log(chatResult);  //测试
    if (chatResult.success === true) {
      // console.log("(" + this.currentStep + ")更新chat数据成功 - " + messageLength);
      this.sendLog(clientIndex, "updateChat", "更新chat数据成功 - " + messageLength, null, false);
    } else {
      // console.log("(" + this.currentStep + ")更新chat数据失败 - " + messageLength);
      this.sendLog(clientIndex, "updateChat", "更新chat数据失败 - " + messageLength, null, true);
      await this.updateChatError(clientIndex, tryCount, messageLength);
    }
  }

  async getNext(clientIndex) {
    this.tg[clientIndex].fromPeer = null;
    this.tg[clientIndex].chatId += 1;
    this.tg[clientIndex].count = 0;
    if (this.contrastChat(clientIndex)) {
      await this.getChat(clientIndex);
      if (this.tg[clientIndex].fromPeer) {
        if (this.tg[clientIndex].chatId != this.tg[clientIndex].lastChat) {
          if (this.tg[clientIndex].lastChat != 0) {
            await this.updateConfig(clientIndex, 1);
          }
          this.tg[clientIndex].lastChat = this.tg[clientIndex].chatId;
        }
      } else {
        if (this.clientCount === 1) {
          // console.log("(" + this.currentStep + ")全部client的chat采集完毕");
          this.sendLog(clientIndex, "getNext", "全部client的chat采集完毕", null, false);
          this.tg[clientIndex].filterType += 1;
          if (this.tg[clientIndex].filterType > 4) {
            this.tg[clientIndex].filterType = 1;
            // this.broadcast({
            //   "result": "over",
            // });
            // await this.close(clientIndex);
          }
          this.tg[clientIndex].chatId = 0;
          await this.getNext(clientIndex);
        } else {
          // console.log("(" + this.currentStep + ")当前client的全部chat采集完毕");
          this.sendLog(clientIndex, "getNext", "当前client的全部chat采集完毕", null, false);
          this.tg[clientIndex].filterType += 1;
          if (this.tg[clientIndex].filterType > 4) {
            this.tg[clientIndex].filterType = 1;
            // await this.close(clientIndex);
          }
          this.tg[clientIndex].chatId = 0;
          await this.getNext(clientIndex);
        }
      }
    } else {
      // console.log(this.tg[clientIndex].endChat + " : 超过最大chat了");  //测试
      this.sendLog(clientIndex, "getNext", this.tg[clientIndex].endChat + " : 超过最大chat了", null, true);
      this.tg[clientIndex].filterType += 1;
      if (this.tg[clientIndex].filterType > 4) {
        this.tg[clientIndex].filterType = 1;
        await this.close(clientIndex);
      }
      this.tg[clientIndex].chatId = 0;
      await this.getNext(clientIndex);
    }
  }

  async forwardMessage(clientIndex, idArray, fileIdArray) {
    const messageLength = idArray.length;
    if (messageLength > this.tg[clientIndex].limit) {
      // console.log("(" + this.currentStep + ") messageLength比limit大");
      this.sendForward(clientIndex, "forwardMessage", "messageLength比limit大", 0, "error", true);
    }
    // console.log(length);  //测试
    if (this.tg[clientIndex].flood && this.tg[clientIndex].flood > 0) {
      this.tg[clientIndex].count = 0;
      if (this.tg[clientIndex].flood > new Date().getTime()) {
        // console.log("(" + this.currentStep + ") 还需等待" + ((this.tg[clientIndex].flood - new Date().getTime()) / 1000) + "秒的洪水警告时间");
        this.sendForward(clientIndex, "forwardMessage", "还需等待" + Math.ceil((this.tg[clientIndex].flood - new Date().getTime()) / 1000) + "秒的洪水警告时间", 0, "flood", true);
        return;
      } else {
        this.tg[clientIndex].flood = 0;
        await this.ctx.storage.put("client" + this.tg[clientIndex].clientId, 0);
      }
    } else {
      if (this.tg[clientIndex].time && this.tg[clientIndex].time > 0) {
        const time = this.waitTime - (new Date().getTime() - this.tg[clientIndex].time);
        if (time > 0) {
          // console.log("(" + this.currentStep + ") 还需等待" + (time / 1000) + "秒");
          this.sendForward(clientIndex, "forwardMessage", "还需等待" + Math.ceil(time / 1000) + "秒", 0, "wait", true);
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
                await this.closeAll();
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
    }
    if (messageLength > 0) {
      try {
        const forwardResult = await this.tg[clientIndex].client.invoke(new Api.messages.ForwardMessages({
          fromPeer: this.tg[clientIndex].fromPeer,
          id: idArray,
          randomId: fileIdArray,
          toPeer: "me",
          silent: true,
          background: true,
          withMyScore: true,
          dropAuthor: true,
          dropMediaCaptions: true,
          // noforwards: true,
          // scheduleDate: 0,
          // sendAs: "username",
        }));
        // console.log(forwardResult);
        // this.sendLog(clientIndex, "forwardMessage", JSON.stringify(forwardResult), null, false);
      } catch (err) {
        if (err.errorMessage === "RANDOM_ID_DUPLICATE" || err.code === 500) {
          // console.log("(" + this.currentStep + ") " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
          this.sendForward(clientIndex, "forwardMessage", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, 0, "error", true);
        } else if (err.errorMessage === "CHAT_FORWARDS_RESTRICTED" || err.code === 400) {
          this.tg[clientIndex].offsetId += this.tg[clientIndex].count;
          this.tg[clientIndex].count = 0;
          // console.log("(" + this.currentStep + ") 消息不允许转发 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
          this.sendForward(clientIndex, "forwardMessage", "消息不允许转发 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, 0, "error", true);
          await this.getNext(clientIndex);
          return;
        } else if (err.name === "FloodWaitError" || err.errorMessage?.includes("FLOOD_WAIT_") === true || err.code === 420) {
          this.tg[clientIndex].count = 0;
          // this.waitTime += 120000;
          if (err.seconds && err.seconds > 0) {
            this.tg[clientIndex].flood = new Date().getTime() + 60000 + err.seconds * 1000;
            await this.ctx.storage.put("client" + this.tg[clientIndex].clientId, this.tg[clientIndex].flood);
          }
          // console.log("(" + this.currentStep + ") 触发了洪水警告，请求太频繁 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
          this.sendForward(clientIndex, "forwardMessage", "触发了洪水警告，请求太频繁 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, 0, "flood", true);
          return;
        } else {
          this.tg[clientIndex].count = 0;
          // console.log("(" + this.currentStep + ") 转发消息时发生错误 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
          this.sendForward(clientIndex, "forwardMessage", "转发消息时发生错误 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, 0, "error", true);
          return;
        }
      }
      this.tg[clientIndex].offsetId += this.tg[clientIndex].count;
      this.tg[clientIndex].count = 0;
      await this.updateChat(clientIndex, 1, messageLength);
      // console.log("(" + this.currentStep + ") 成功转发了" + length + "条消息");
      this.sendForward(clientIndex, "forwardMessage", "成功转发了" + messageLength + "条消息", messageLength, "update", false);
    } else {
      this.tg[clientIndex].offsetId += this.tg[clientIndex].count;
      this.tg[clientIndex].count = 0;
      await this.updateChat(clientIndex, 1, 0);
      this.tg[clientIndex].errorCount += 1;
      if (this.tg[clientIndex].errorCount >= 3) {
        await this.ctx.storage.put(this.tg[clientIndex].chatId, 0);
        // console.log("(" + this.currentStep + ") 连续2轮的消息无需转发");
        this.sendForward(clientIndex, "forwardMessage", "连续2轮的消息无需转发", 0, "error", true);
        await this.getNext(clientIndex);
      } else {
        await this.ctx.storage.put(this.tg[clientIndex].chatId, this.tg[clientIndex].errorCount);
        // console.log("(" + this.currentStep + ") 第" + this.tg[clientIndex].errorCount + "轮消息无需转发");
        this.sendForward(clientIndex, "forwardMessage", "第" + this.tg[clientIndex].errorCount + "轮消息无需转发", 0, "error", true);
      }
    }
    this.tg[clientIndex].time = new Date().getTime();
  }

  async waitNext(time, flood) {
    if (time && time > 0) {
      if (flood === false) {
        // console.log("(" + this.currentStep + ") 还需等待" + (time / 1000) + "秒");
        this.sendForward("waitNext", "还需等待" + Math.ceil(time / 1000) + "秒", 0, "wait", true);
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
      if (this.apiCount < 900) {
        this.currentStep += 1;
        for (let clientIndex = 0; clientIndex < this.clientCount; clientIndex++) {
          if (this.tg[clientIndex].client) {
            if (this.tg[clientIndex].flood && this.tg[clientIndex].flood > 0) {
              this.tg[clientIndex].count = 0;
              if (this.tg[clientIndex].flood > new Date().getTime()) {
                const time = this.tg[clientIndex].flood - new Date().getTime();
                // console.log("(" + this.currentStep + ") 还需等待" + ((this.tg[clientIndex].flood - new Date().getTime()) / 1000) + "秒的洪水警告时间");
                this.sendLog(clientIndex, "nextStep", "还需等待" + Math.ceil((this.tg[clientIndex].flood - new Date().getTime()) / 1000) + "秒的洪水警告时间", "flood", true);
                await this.waitNext(time, true);
                continue;
              } else {
                this.tg[clientIndex].flood = 0;
                await this.ctx.storage.put("client" + this.tg[clientIndex].clientId, 0);
              }
            }
            this.getMessage(clientIndex, 1);
            await scheduler.wait(5000);
            // this.tg[clientIndex].count = this.getMessage(clientIndex, 1);
            // if (this.tg[clientIndex].count > this.tg[clientIndex].limit) {
            //   // console.log("(" + this.currentStep + ") messageCount比limit大");
            //   this.sendLog(clientIndex, "nextStep", "messageCount比limit大", null, true);
            // }
            const messageArray = this.messageArray.slice();
            const messageLength = messageArray.length;
            this.messageArray = [];
            // console.log("(" + this.currentStep + ")messageLength : " + messageLength);  //测试
            // this.sendLog(clientIndex, "nextStep", "messageLength : " + messageLength, null, false);  //测试
            if (messageLength > this.tg[clientIndex].limit) {
              // console.log("(" + this.currentStep + ") messageLength比limit大");
              this.sendLog(clientIndex, "nextStep", "messageLength比limit大", null, true);
            }
            if (messageLength && messageLength > 0) {
              if (this.stop === 1) {
                const idArray = [];
                const fileIdArray = [];
                for (let messageIndex = 0; messageIndex < messageLength; messageIndex++) {
                  if (messageArray[messageIndex]) {
                    if (!messageArray[messageIndex].noforwards || messageArray[messageIndex].noforwards === false) {
                      let fileId = null;
                      const id = messageArray[messageIndex].id;
                      if (this.tg[clientIndex].filterType === 2) {
                        if (messageArray[messageIndex].media) {
                          if (messageArray[messageIndex].media.document) {
                            fileId = messageArray[messageIndex].media.document.id;
                          }
                        }
                      } else if (this.tg[clientIndex].filterType === 1) {
                        if (messageArray[messageIndex].media) {
                          if (messageArray[messageIndex].media.photo) {
                            fileId = messageArray[messageIndex].media.photo.id;
                          }
                        }
                      } else if (this.tg[clientIndex].filterType === 3) {
                        if (messageArray[messageIndex].media) {
                          if (messageArray[messageIndex].media.document) {
                            const mimeType = messageArray[messageIndex].media.document.mimeType;
                            if (mimeType.startsWith("video/")) {
                              fileId = messageArray[messageIndex].media.document.id;
                            } else if (mimeType.startsWith("image/")) {
                              fileId = messageArray[messageIndex].media.document.id;
                            // } else if (mimeType.startsWith("application/")) {
                            // } else {
                            }
                          }
                        }
                      } else if (this.tg[clientIndex].filterType === 4) {
                        if (messageArray[messageIndex].media) {
                          if (messageArray[messageIndex].media.document) {
                            fileId = messageArray[messageIndex].media.document.id;
                          }
                        }
                      } else if (this.tg[clientIndex].filterType === 0) {
                        if (messageArray[messageIndex].media) {
                          if (messageArray[messageIndex].media.document) {
                            fileId = messageArray[messageIndex].media.document.id;
                          } else if (messageArray[messageIndex].media.photo) {
                            fileId = messageArray[messageIndex].media.photo.id;
                          }
                        }
                      }
                      if (id && fileId) {
                        idArray.push(id);
                        fileIdArray.push(fileId);
                      }
                    }
                  }
                }
                await this.forwardMessage(clientIndex, idArray, fileIdArray);
              } else if (this.stop === 2) {
                this.broadcast({
                  "result": "pause",
                });
                await this.closeAll();
              }
            } else if (this.tg[clientIndex].count > 0) {
              this.tg[clientIndex].offsetId += this.tg[clientIndex].count;
              this.tg[clientIndex].count = 0;
              await this.updateChat(clientIndex, 1, 0);
              this.tg[clientIndex].errorCount += 1;
              if (this.tg[clientIndex].errorCount >= 3) {
                await this.ctx.storage.put(this.tg[clientIndex].chatId, 0);
                // console.log("(" + this.currentStep + ") 连续3轮没有获取到包含有效媒体的消息");
                this.sendForward(clientIndex, "nextStep", "连续3轮没有获取到包含有效媒体的消息", 0, "error", true);
                await this.getNext(clientIndex);
              } else {
                await this.ctx.storage.put(this.tg[clientIndex].chatId, this.tg[clientIndex].errorCount);
                // console.log("(" + this.currentStep + ") 第" + this.tg[clientIndex].errorCount + "轮没有获取到包含有效媒体的消息");
                this.sendForward(clientIndex, "nextStep", "第" + this.tg[clientIndex].errorCount + "轮没有获取到包含有效媒体的消息", 0, "error", true);
              }
              if (this.stop === 2) {
                this.broadcast({
                  "result": "pause",
                });
                await this.closeAll();
              }
            } else {
              this.tg[clientIndex].count = 0;
              await this.updateChat(clientIndex, 1, 0);
              this.tg[clientIndex].fromPeer = null;
              // console.log("(" + this.currentStep + ")" + this.tg[clientIndex].chatId + " : 当前chat采集完毕");
              this.sendLog(clientIndex, "nextStep", "当前chat采集完毕", null, false);
              this.broadcast({
                "result": "end",
              });
              this.tg[clientIndex].chatId += 1;
              if (this.contrastChat(clientIndex)) {
                await this.getChat(clientIndex);
                if (this.tg[clientIndex].fromPeer) {
                  if (this.tg[clientIndex].chatId != this.tg[clientIndex].lastChat) {
                    if (this.tg[clientIndex].lastChat != 0) {
                      await this.updateConfig(clientIndex, 1);
                    }
                    this.tg[clientIndex].lastChat = this.tg[clientIndex].chatId;
                  }
                  if (this.stop === 2) {
                    this.broadcast({
                      "result": "pause",
                    });
                    await this.closeAll();
                  }
                } else {
                  if (this.clientCount === 1) {
                    // console.log("(" + this.currentStep + ")全部client的chat采集完毕");
                    this.sendLog(clientIndex, "nextStep", "全部client的chat采集完毕", null, false);
                    this.tg[clientIndex].filterType += 1;
                    if (this.tg[clientIndex].filterType > 4) {
                      this.tg[clientIndex].filterType = 1;
                      // this.broadcast({
                      //   "result": "over",
                      // });
                      // await this.close(clientIndex);
                      // this.api.splice(clientIndex, 1);
                      // this.tg.splice(clientIndex, 1);
                      // this.clientCount--;
                      // clientIndex--;
                    }
                    this.tg[clientIndex].chatId = 0;
                    await this.getChat(clientIndex);
                  } else {
                    // console.log("(" + this.currentStep + ")当前client的全部chat采集完毕");
                    this.sendLog(clientIndex, "nextStep", "当前client的全部chat采集完毕", null, false);
                      this.tg[clientIndex].filterType += 1;
                    if (this.tg[clientIndex].filterType > 4) {
                      this.tg[clientIndex].filterType = 1;
                      // await this.close(clientIndex);
                      // this.api.splice(clientIndex, 1);
                      // this.tg.splice(clientIndex, 1);
                      // this.clientCount--;
                      // clientIndex--;
                    }
                    this.tg[clientIndex].chatId = 0;
                    await this.getChat(clientIndex);
                  }
                }
              } else {
                // console.log(this.tg[clientIndex].endChat + " : 超过最大chat了");  //测试
                this.sendLog(clientIndex, "nextStep", this.tg[clientIndex].endChat + " : 超过最大chat了", null, true);
                this.tg[clientIndex].filterType += 1;
                if (this.tg[clientIndex].filterType > 4) {
                  this.tg[clientIndex].filterType = 1;
                  // await this.close(clientIndex);
                  // this.api.splice(clientIndex, 1);
                  // this.tg.splice(clientIndex, 1);
                  // this.clientCount--;
                  // clientIndex--;
                }
                this.tg[clientIndex].chatId = 0;
                await this.getChat(clientIndex);
              }
            }
          } else {
            this.tg[clientIndex].count = 0;
            if (this.tg[clientIndex].flood && this.tg[clientIndex].flood > 0) {
              if (this.tg[clientIndex].flood > new Date().getTime()) {
                const time = this.tg[clientIndex].flood - new Date().getTime();
                // console.log("(" + this.currentStep + ") 还需等待" + ((this.tg[clientIndex].flood - new Date().getTime()) / 1000) + "秒的洪水警告时间");
                this.sendLog(clientIndex, "nextStep", "还需等待" + Math.ceil((this.tg[clientIndex].flood - new Date().getTime()) / 1000) + "秒的洪水警告时间", "flood", true);
                await this.waitNext(time, true);
                continue;
              } else {
                this.tg[clientIndex].flood = 0;
                await this.ctx.storage.put("client" + this.tg[clientIndex].clientId, 0);
                await this.open(clientIndex, 1);
                if (this.tg[clientIndex].client) {
                  await this.getConfig(clientIndex, 1, option);
                  await this.getNext(clientIndex);
                } else {
                  // console.log("连接TG服务" + (clientIndex + 1) + "失败");
                  this.sendLog(clientIndex, "nextStep", "连接TG服务" + (clientIndex + 1) + "失败", null, true);
                }
              }
            } else {
              // console.log("连接TG服务" + (clientIndex + 1) + "失败");
              this.sendLog(clientIndex, "nextStep", "连接TG服务" + (clientIndex + 1) + "失败", null, true);
            }
          }
        }
        if (this.stop === 1) {
          if (this.apiCount < 900) {
            await this.nextStep();
          } else {
            this.stop = 2;
            // console.log("(" + this.currentStep + ")nextStep超出apiCount限制");
            this.sendLog(clientIndex, "nextStep", "超出apiCount限制", "limit", true);
            await this.closeAll();
            // this.ctx.abort("reset");
          }
        } else if (this.stop === 2) {
          this.broadcast({
            "result": "pause",
          });
          await this.closeAll();
        }
      } else {
        this.stop = 2;
        // console.log("(" + this.currentStep + ")nextStep超出apiCount限制");
        this.sendLog(clientIndex, "nextStep", "超出apiCount限制", "limit", true);
        await this.closeAll();
        // this.ctx.abort("reset");
      }
    } else if (this.stop === 2) {
      this.broadcast({
        "result": "pause",
      });
      await this.closeAll();
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
    // if (this.client || this.stop === 1) {
    if (this.stop === 1) {
      this.ws.send(JSON.stringify({
        "step": this.currentStep,
        "clientCount": this.clientCount,
        "operate": "start",
        "message": "服务已经运行过了",
        "error": true,
        "date": new Date().getTime(),
      }));
      return;
    }
    this.init(option);
    this.stop = 1;
    this.currentStep += 1;
    for (let clientIndex = 0; clientIndex < this.clientCount; clientIndex++) {
      this.tg[clientIndex] = {
        "clientId": 0,
        "client": null,
        "chatId": 0,
        "endChat": 0,
        "lastChat": 0,
        "filterType": 2,
        "filter": Api.InputMessagesFilterVideo,
        // "filterTitle": "媒体",
        "reverse": true,
        "count": 0,
        "limit": 100,
        "offsetId": 0,
        "fromPeer": null,
        "errorCount": 0,
        "flood": 0,
        "time": 0,
      };
      this.tg[clientIndex].clientId = this.api[clientIndex].id;
      this.tg[clientIndex].flood = await this.ctx.storage.get("client" + this.tg[clientIndex].clientId) || 0;
      if (this.tg[clientIndex].flood > 0) {
        if (this.tg[clientIndex].flood > new Date().getTime()) {
          const time = this.tg[clientIndex].flood - new Date().getTime();
          // console.log("(" + this.currentStep + ") 还需等待" + ((this.tg[clientIndex].flood - new Date().getTime()) / 1000) + "秒的洪水警告时间");
          this.sendLog(clientIndex, "start", "还需等待" + Math.ceil((this.tg[clientIndex].flood - new Date().getTime()) / 1000) + "秒的洪水警告时间", "flood", true);
          await this.waitNext(time, true);
          continue;
        } else {
          this.tg[clientIndex].flood = 0;
          await this.ctx.storage.put("client" + this.tg[clientIndex].clientId, 0);
        }
      }
      await this.open(clientIndex, 1);
      if (this.tg[clientIndex].client) {
        await this.getConfig(clientIndex, 1, option);
        await this.getChat(clientIndex);
        if (this.tg[clientIndex].fromPeer) {
          if (this.tg[clientIndex].chatId != this.tg[clientIndex].lastChat) {
            if (this.tg[clientIndex].lastChat != 0) {
              await this.updateConfig(clientIndex, 1);
            }
            this.tg[clientIndex].lastChat = this.tg[clientIndex].chatId;
          }
          if (this.stop === 1) {
            await this.getMessage(clientIndex, 1);
            await scheduler.wait(5000);
            // this.tg[clientIndex].count = await this.getMessage(clientIndex, 1);
            // if (this.tg[clientIndex].count > this.tg[clientIndex].limit) {
            //   // console.log("(" + this.currentStep + ") messageCount比limit大");
            //   this.sendLog(clientIndex, "start", "messageCount比limit大", null, true);
            // }
            const messageArray = this.messageArray.slice();
            const messageLength = messageArray.length;
            this.messageArray = [];
            // console.log("(" + this.currentStep + ")messageLength : " + messageLength);  //测试
            // this.sendLog(clientIndex, "start", "messageLength : " + messageLength, null, false);  //测试
            if (messageLength > this.tg[clientIndex].limit) {
              // console.log("(" + this.currentStep + ") messageLength比limit大");
              this.sendLog(clientIndex, "start", "messageLength比limit大", null, true);
            }
            if (messageLength && messageLength > 0) {
              const idArray = [];
              const fileIdArray = [];
              for (let messageIndex = 0; messageIndex < messageLength; messageIndex++) {
                if (messageArray[messageIndex]) {
                  if (!messageArray[messageIndex].noforwards || messageArray[messageIndex].noforwards === false) {
                    let fileId = null;
                    const id = messageArray[messageIndex].id;
                    if (this.tg[clientIndex].filterType === 2) {
                      if (messageArray[messageIndex].media) {
                        if (messageArray[messageIndex].media.document) {
                          fileId = messageArray[messageIndex].media.document.id;
                        }
                      }
                    } else if (this.tg[clientIndex].filterType === 1) {
                      if (messageArray[messageIndex].media) {
                        if (messageArray[messageIndex].media.photo) {
                          fileId = messageArray[messageIndex].media.photo.id;
                        }
                      }
                    } else if (this.tg[clientIndex].filterType === 3) {
                      if (messageArray[messageIndex].media) {
                        if (messageArray[messageIndex].media.document) {
                          const mimeType = messageArray[messageIndex].media.document.mimeType;
                          if (mimeType.startsWith("video/")) {
                            fileId = messageArray[messageIndex].media.document.id;
                          } else if (mimeType.startsWith("image/")) {
                            fileId = messageArray[messageIndex].media.document.id;
                          // } else if (mimeType.startsWith("application/")) {
                          // } else {
                          }
                        }
                      }
                    } else if (this.tg[clientIndex].filterType === 4) {
                      if (messageArray[messageIndex].media) {
                        if (messageArray[messageIndex].media.document) {
                          fileId = messageArray[messageIndex].media.document.id;
                        }
                      }
                    } else if (this.tg[clientIndex].filterType === 0) {
                      if (messageArray[messageIndex].media) {
                        if (messageArray[messageIndex].media.document) {
                          fileId = messageArray[messageIndex].media.document.id;
                        } else if (messageArray[messageIndex].media.photo) {
                          fileId = messageArray[messageIndex].media.photo.id;
                        }
                      }
                    }
                    if (id && fileId) {
                      idArray.push(id);
                      fileIdArray.push(fileId);
                    }
                  }
                }
              }
              await this.forwardMessage(clientIndex, idArray, fileIdArray);
            } else if (this.tg[clientIndex].count > 0) {
              this.tg[clientIndex].offsetId += this.tg[clientIndex].count;
              this.tg[clientIndex].count = 0;
              await this.updateChat(clientIndex, 1, 0);
              this.tg[clientIndex].errorCount += 1;
              if (this.tg[clientIndex].errorCount >= 3) {
                await this.ctx.storage.put(this.tg[clientIndex].chatId, 0);
                // console.log("(" + this.currentStep + ") 连续3轮没有获取到包含有效媒体的消息");
                this.sendForward(clientIndex, "start", "连续3轮没有获取到包含有效媒体的消息", 0, "error", true);
                await this.getNext(clientIndex);
              } else {
                await this.ctx.storage.put(this.tg[clientIndex].chatId, this.tg[clientIndex].errorCount);
                // console.log("(" + this.currentStep + ") 第" + this.tg[clientIndex].errorCount + "轮没有获取到包含有效媒体的消息");
                this.sendForward(clientIndex, "start", "第" + this.tg[clientIndex].errorCount + "轮没有获取到包含有效媒体的消息", 0, "error", true);
              }
              if (this.stop === 2) {
                this.broadcast({
                  "result": "pause",
                });
                await this.closeAll();
              }
            } else {
              this.tg[clientIndex].count = 0;
              await this.updateChat(clientIndex, 1, 0);
              this.tg[clientIndex].fromPeer = null;
              // console.log("(" + this.currentStep + ")" + this.tg[clientIndex].chatId + " : 当前chat采集完毕");
              this.sendLog(clientIndex, "start", "当前chat采集完毕", null, false);
              this.broadcast({
                "result": "end",
              });
              this.tg[clientIndex].chatId += 1;
              if (this.contrastChat(clientIndex)) {
                await this.getChat(clientIndex);
                if (this.tg[clientIndex].fromPeer) {
                  if (this.tg[clientIndex].chatId != this.tg[clientIndex].lastChat) {
                    if (this.tg[clientIndex].lastChat != 0) {
                      await this.updateConfig(clientIndex, 1);
                    }
                    this.tg[clientIndex].lastChat = this.tg[clientIndex].chatId;
                  }
                  if (this.stop === 2) {
                    this.broadcast({
                      "result": "pause",
                    });
                    await this.closeAll();
                  }
                } else {
                  if (this.clientCount === 1) {
                    // console.log("(" + this.currentStep + ")全部client的chat采集完毕");
                    this.sendLog(clientIndex, "start", "全部client的chat采集完毕", null, false);
                    this.tg[clientIndex].filterType += 1;
                    if (this.tg[clientIndex].filterType > 4) {
                      this.tg[clientIndex].filterType = 1;
                      // this.broadcast({
                      //   "result": "over",
                      // });
                      // await this.close(clientIndex);
                      // this.api.splice(clientIndex, 1);
                      // this.tg.splice(clientIndex, 1);
                      // this.clientCount--;
                      // clientIndex--;
                    }
                    this.tg[clientIndex].chatId = 0;
                    await this.getChat(clientIndex);
                  } else {
                    // console.log("(" + this.currentStep + ")当前client的全部chat采集完毕");
                    this.sendLog(clientIndex, "start", "当前client的全部chat采集完毕", null, false);
                    this.tg[clientIndex].filterType += 1;
                    if (this.tg[clientIndex].filterType > 4) {
                      this.tg[clientIndex].filterType = 1;
                      // await this.close(clientIndex);
                      // this.api.splice(clientIndex, 1);
                      // this.tg.splice(clientIndex, 1);
                      // this.clientCount--;
                      // clientIndex--;
                    }
                    this.tg[clientIndex].chatId = 0;
                    await this.getChat(clientIndex);
                  }
                }
              } else {
                // console.log(this.tg[clientIndex].endChat + " : 超过最大chat了");  //测试
                this.sendLog(clientIndex, "start", this.tg[clientIndex].endChat + " : 超过最大chat了", null, true);
                this.tg[clientIndex].filterType += 1;
                if (this.tg[clientIndex].filterType > 4) {
                  this.tg[clientIndex].filterType = 1;
                  // await this.close(clientIndex);
                  // this.api.splice(clientIndex, 1);
                  // this.tg.splice(clientIndex, 1);
                  // this.clientCount--;
                  // clientIndex--;
                }
                this.tg[clientIndex].chatId = 0;
                await this.getChat(clientIndex);
              }
            }
          } else if (this.stop === 2) {
            this.broadcast({
              "result": "pause",
            });
            await this.closeAll();
          }
        } else {
          this.tg[clientIndex].count = 0;
          if (this.clientCount === 1) {
            // console.log("(" + this.currentStep + ")全部client的chat采集完毕");
            this.sendLog(clientIndex, "start", "全部client的chat采集完毕", null, false);
            this.broadcast({
              "result": "over",
            });
          } else {
            // console.log("(" + this.currentStep + ")当前client的全部chat采集完毕");
            this.sendLog(clientIndex, "start", "当前client的全部chat采集完毕", null, false);
          }
          this.tg[clientIndex].filterType += 1;
          if (this.tg[clientIndex].filterType > 4) {
            this.tg[clientIndex].filterType = 1;
            // await this.close(clientIndex);
            // this.api.splice(clientIndex, 1);
            // this.tg.splice(clientIndex, 1);
            // this.clientCount--;
            // clientIndex--;
          }
          this.tg[clientIndex].chatId = 0;
          await this.getChat(clientIndex);
        }
      } else {
        // console.log("连接TG服务" + (clientIndex + 1) + "失败");
        this.sendLog(clientIndex, "start", "连接TG服务" + (clientIndex + 1) + "失败", null, true);
      }
    }
    if (this.stop === 1) {
      if (this.apiCount < 900) {
        await this.nextStep();
      } else {
        this.stop = 2;
        // console.log("(" + this.currentStep + ")start超出apiCount限制");
        this.sendLog(clientIndex, "start", "超出apiCount限制", "limit", true);
        await this.closeAll();
        // this.ctx.abort("reset");
      }
    } else if (this.stop === 2) {
      this.broadcast({
        "result": "pause",
      });
      await this.closeAll();
    }
  }

  async getDialog(clientIndex, tryCount) {
    try {
      for await (const dialog of this.tg[clientIndex].client.iterDialogs({})) {
        if (dialog.isChannel === true) {
          this.dialogArray.push(dialog);
        }
      }
    } catch (err) {
      this.dialogArray = [];
      // console.log("(" + this.currentStep + ")getDialog : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendLog(clientIndex, "getDialog", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (tryCount === 5) {
        // console.log("(" + this.currentStep + ")getDialog超出tryCount限制");
        this.sendLog(clientIndex, "getDialog", "超出tryCount限制", null, true);
        await this.close(clientIndex);
      } else {
        await scheduler.wait(10000);
        if (this.stop === 1) {
          await this.getDialog(clientIndex, tryCount + 1);
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

  async selectChatError(clientIndex, tryCount, channelId) {
    if (tryCount === 5) {
      // console.log("selectChat超出tryCount限制");
      this.sendLog(clientIndex, "selectChat", "超出tryCount限制", null, true);
      await this.close(clientIndex);
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.selectChat(clientIndex, tryCount + 1, channelId);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async selectChat(clientIndex, tryCount, channelId) {
    this.apiCount += 1;
    let chatResult = {};
    try {
      chatResult = await this.env.MAINDB.prepare("SELECT Cindex, username, title, COUNT(*) FROM `FORWARDCHAT` WHERE `tgId` = ? AND `channelId` = ? LIMIT 1;").bind(this.tg[clientIndex].clientId, channelId).run();
    } catch (err) {
      // console.log("selectChat : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendLog(clientIndex, "selectChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.closeAll();
      } else {
        await this.selectChatError(clientIndex, tryCount, channelId);
      }
      return;
    }
    // console.log("chatResult : " + chatResult);  //测试
    if (chatResult.success === true) {
      if (chatResult.results && chatResult.results.length > 0) {
        return chatResult.results[0];
      }
    } else {
      await this.selectChatError(clientIndex, tryCount, channelId);
    }
  }

  async insertChatError(clientIndex, tryCount, channelId, accessHash, username, title, noforwards) {
    if (tryCount === 5) {
      // console.log("insertChat超出tryCount限制");
      this.sendLog(clientIndex, "insertChat", "超出tryCount限制", null, true);
      await this.close(clientIndex);
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.insertChat(clientIndex, tryCount + 1, channelId, accessHash, username, title, noforwards);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async insertChat(clientIndex, tryCount, channelId, accessHash, username, title, noforwards) {
    this.apiCount += 1;
    let chatResult = {};
    try {
      chatResult = await this.env.MAINDB.prepare("INSERT INTO `FORWARDCHAT` (tgId, channelId, accessHash, username, title, noforwards, current, photo, video, document, gif, currentForward, photoForward, videoForward, documentForward, gifForward, exist) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);").bind(this.tg[clientIndex].clientId, channelId, accessHash, username, title, noforwards, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1).run();
    } catch (err) {
      // console.log("insertChat : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);;
      this.sendLog(clientIndex, "insertChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.closeAll();
      } else {
        await this.insertChatError(clientIndex, tryCount, channelId, accessHash, username, title, noforwards);
      }
      return;
    }
    // console.log(chatResult);  //测试
    if (chatResult.success === true) {
      // console.log("插入chat数据成功");
      this.sendLog(clientIndex, "insertChat", "插入chat数据成功", "success", false);
    } else {
      // console.log("插入chat数据失败");
      this.sendLog(clientIndex, "insertChat", "插入chat数据失败", "error", true);
      await this.insertChatError(clientIndex, tryCount, channelId, accessHash, username, title, noforwards);
    }
  }

  async setChatError(clientIndex, tryCount, Cindex, username, title) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")setChat超出tryCount限制");
      this.sendLog("setChat", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.setChat(clientIndex, tryCount + 1, Cindex, username, title);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async setChat(clientIndex, tryCount, Cindex, username, title) {
    this.apiCount += 1;
    let chatResult = {};
    try {
      if (username) {
        if (title) {
          chatResult = await this.env.MAINDB.prepare("UPDATE `FORWARDCHAT` SET `username` = ?, `title` = ? WHERE `Cindex` = ?;").bind(username, title, Cindex).run();
        } else {
          chatResult = await this.env.MAINDB.prepare("UPDATE `FORWARDCHAT` SET `username` = ? WHERE `Cindex` = ?;").bind(username, Cindex).run();
        }
      } else {
        if (title) {
          chatResult = await this.env.MAINDB.prepare("UPDATE `FORWARDCHAT` SET `title` = ? WHERE `Cindex` = ?;").bind(title, Cindex).run();
        }
      }
    } catch (err) {
      // console.log("(" + this.currentStep + ")setChat : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendLog("setChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.setChatError(clientIndex, tryCount, Cindex, username, title);
      }
      return;
    }
    // console.log(chatResult);  //测试
    if (chatResult.success === true) {
      // console.log("(" + this.currentStep + ")更新chat数据成功");
      this.sendLog("setChat", "更新chat数据成功", null, false);
    } else {
      // console.log("(" + this.currentStep + ")更新chat数据失败");
      this.sendLog("setChat", "更新chat数据失败", null, true);
      await this.setChatError(clientIndex, tryCount, Cindex, username, title);
    }
  }

  async chat(option) {
    // // if (this.client || this.stop === 1) {
    // if (this.stop === 1) {
    //   this.ws.send(JSON.stringify({
    //     "step": this.currentStep,
    //     "clientCount": this.clientCount,
    //     "operate": "chat",
    //     "message": "服务已经运行过了",
    //     "error": true,
    //     "date": new Date().getTime(),
    //   }));
    //   return;
    // }
    this.init(option);
    this.stop = 1;
    let currentIndex = 0;
    for (let clientIndex = 0; clientIndex < this.clientCount; clientIndex++) {
      if (this.stop === 1) {
        if (this.apiCount < 900) {
          this.tg[clientIndex] = {
            "clientId": 0,
            "client": null,
          };
          this.tg[clientIndex].clientId = this.api[clientIndex].id;
          await this.open(clientIndex, 1);
          if (this.tg[clientIndex].client) {
            currentIndex += 1;
            let count = 0;
            await this.getDialog(clientIndex, 1);
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
                    if (dialog.isChannel === true) {
                      channelId = dialog.inputEntity.channelId.toString();
                      accessHash = dialog.inputEntity.accessHash.toString();
                    } else {
                      // channelId = dialog.id.toString();
                      continue;
                    }
                    // console.log(channelId + " : " + accessHash);  //测试
                    if (channelId && accessHash) {
                      const chatResult = await this.selectChat(clientIndex, 1, channelId);
                      // console.log("chatResult : " + chatResult);  //测试
                      if (chatResult) {
                        const username = dialog.entity.username || dialog.draft._entity.username || "";
                        if (parseInt(chatResult["COUNT(*)"]) === 0) {
                          count += 1;
                          const noforwards = (dialog.entity.noforwards === true || dialog.draft._entity.noforwards === true) ? 1 : 0;
                          await this.insertChat(clientIndex, 1, channelId, accessHash, chatType, username, title, noforwards);
                          // console.log("chat - 新插入chat了 : " + title);
                          this.sendLog(clientIndex, "chat", this.tg[clientIndex].clientId + " : 新插入chat了 : " + title, null, false);
                        } else {
                          if (chatResult.title !== title) {
                            if (chatResult.username !== username) {
                              await this.setChat(clientIndex, tryCount, chatResult.Cindex, username, title);
                            } else {
                              await this.setChat(clientIndex, tryCount, chatResult.Cindex, "", title);
                            }
                          } else {
                            if (chatResult.username !== username) {
                              await this.setChat(clientIndex, tryCount, chatResult.Cindex, username, "");
                            }
                          }
                          // console.log("chat - " + count + " : chat已在数据库中 - " + title);
                          this.sendLog(clientIndex, "chat", this.tg[clientIndex].clientId + " : chat已在数据库中 - " + title, null, false);
                        }
                      } else {
                        // console.log("chat - chatResult错误 : " + title);
                        this.sendLog(clientIndex, "chat", this.tg[clientIndex].clientId + " : chatResult错误 : " + title, null, true);
                      }
                    } else {
                      // console.log("chat - channelId或accessHash错误 : " + title);
                      this.sendLog(clientIndex, "chat", this.tg[clientIndex].clientId + " : channelId或accessHash错误 : " + title, null, true);
                    }
                  }
                } else {
                  this.stop = 2;
                  // console.log("chat - 超出apiCount限制");
                  this.sendLog(clientIndex, "chat", "超出apiCount限制", "limit", true);
                  await this.closeAll();
                  // this.ctx.abort("reset");
                }
              } else if (this.stop === 2) {
                this.broadcast({
                  "result": "pause",
                });
                await this.closeAll();
              }
            }
            if (count > 0) {
              // console.log("chat - 新插入了" + count + "条chat数据");
              this.sendLog(clientIndex, "chat", this.tg[clientIndex].clientId + " : 新插入了" + count + "条chat数据", null, false);
            }
            await this.close(clientIndex);
            if (currentIndex === 2) {
              break;
            }
          } else {
            // console.log("连接TG服务" + (clientIndex + 1) + "失败");
            this.sendLog(clientIndex, "chat", this.tg[clientIndex].clientId + " - 连接TG服务" + (clientIndex + 1) + "失败", null, true);
          }
        } else {
          this.stop = 2;
          // console.log("chat - 超出apiCount限制");
          this.sendLog(clientIndex, "chat", "超出apiCount限制", "limit", true);
          await this.closeAll();
          // this.ctx.abort("reset");
        }
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.closeAll();
      }
    }
    // console.log("chat - 全部client获取chat完毕");
    this.sendLog("chat", "全部client获取chat完毕", null, false);
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
        this.broadcast({
          "step": this.currentStep,
          "clientCount": this.clientCount,
          "operate": "webSocketMessage",
          "message": err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err,
          "error": true,
          "date": new Date().getTime(),
        });
      }
    // }
    if (command === "start") {
      await this.start(option);
    } else if (command === "pause") {
      this.stop = 2;
    } else if (command === "close") {
      this.stop = 2;
      await this.closeAll();
    } else if (command === "over") {
      this.stop = 2;
      this.broadcast({
        "result": "over",
      });
      await this.closeAll();
    } else if (command === "clear") {
      await this.ctx.storage.deleteAll();
      // console.log("删除cache成功");
      this.broadcast({
        "operate": "clearCache",
        "step": this.currentStep,
        "message": "删除cache成功",
        "error": true,
        "date": new Date().getTime(),
      });
    } else if (command === "chat") {
      await this.chat(option);
    } else if (command === "compress") {
      this.compress = true;
    } else if (command === "noCompress") {
      this.compress = false;
    } else if (command === "batch") {
      this.batch = true;
    } else if (command === "noBatch") {
      this.batch = false;
    } else if (command === "chatId") {
      if (data.chatId && data.chatId >= 0 && this.tg[clientIndex].chatId !== data.chatId) {
        for (let clientIndex = 0; clientIndex < this.clientCount; clientIndex++) {
          if (this.tg[clientIndex].clientId == data.chatId) {
            this.tg[clientIndex].chatId = data.chatId;
            break;
          }
        }
      }
    } else if (command === "offsetId") {
      if (data.offsetId && data.offsetId >= 0 && this.tg[clientIndex].offsetId !== data.offsetId) {
        for (let clientIndex = 0; clientIndex < this.clientCount; clientIndex++) {
          if (this.tg[clientIndex].clientId == data.chatId) {
            this.tg[clientIndex].offsetId = data.offsetId;
            break;
          }
        }
      }
    } else if (command === "endChat") {
      if (data.endChat && data.endChat > 0 && this.tg[clientIndex].endChat !== data.endChat) {
        for (let clientIndex = 0; clientIndex < this.clientCount; clientIndex++) {
          if (this.tg[clientIndex].clientId == data.chatId) {
            this.tg[clientIndex].endChat = data.endChat;
            break;
          }
        }
      }
    } else if (command === "setChat") {
      if (data.clientId && data.clientId >= 0 && data.chatId && data.chatId > 0) {
        for (let clientIndex = 0; clientIndex < this.clientCount; clientIndex++) {
          if (this.tg[clientIndex].clientId == data.chatId) {
            await this.getNext(clientIndex);
            break;
          }
        }
      }
    } else {
      this.broadcast({
        "step": this.currentStep,
        "clientCount": this.clientCount,
        "operate": "webSocketMessage",
        "message": "未知消息",
        "error": true,
        "date": new Date().getTime(),
      });
    }
  }

  // async alarm() {
  //   this.ws.send("ping");
  // }

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
    }

    return new Response("error");
  },
};
