import { DurableObject } from "cloudflare:workers";
import { TelegramClient, Api, sessions, utils } from "./teleproto";
import { LogLevel } from "./teleproto/extensions/Logger";
import { userString } from "./userString";
import bigInt from "big-integer";

export class WebSocketServer extends DurableObject {
  // webSocket = [];
  ws = null;
  // messageDBIndex = 0;
  stop = 0;
  apiCount = 0;
  currentStep = 0;
  compress = false;
  batch = false;
  client = null;
  chatId = 0;
  endChat = 0;
  lastChat = 0;
  // reverse = true;
  limit = 10;
  offsetId = 0;
  // error = false;
  fromPeer = null;
  waitTime = 60000;
  pingTime = 5000;
  count = 0;
  errorCount = 0;
  flood = 0;
  time = 0;
  // filterType = 0;
  // filter = Api.InputMessagesFilterVideo;
  // //filterTitle = "媒体";
  errorMessage = "Too many API requests by single Worker invocation. To configure this limit, refer to https://developers.cloudflare.com/workers/wrangler/configuration/#limits";
  messageArray = [];
  cacheMessage = null;
  batchMessage = [];
  dialogArray = [];
  chatArray = userString;

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
        // if (option.filterType) {
        //   this.filterType = option.filterType;
        // }
        // if (option.reverse) {
        //   this.reverse = option.reverse;
        // }
        if (option.limit && option.limit > 0) {
          this.limit = option.limit;
        }
        if (option.offsetId && option.offsetId > 0) {
          this.offsetId = option.offsetId;
        }
      } else {
        this.compress = false;
        this.batch = false;
        this.chatId = 0;
        this.endChat = 0;
        // this.filterType = 0;
        // this.reverse = true;
        this.limit = 20;
        this.offsetId = 0;
      }
      // this.ws = null;
      // this.client = null;
      // this.stop = 0;
      // this.webSocket = [];
      // this.messageDBIndex = this.env.MESSAGE_DB_INDEX;
      this.apiCount = 0;
      this.currentStep = 0;
      this.lastChat = 0;
      // this.error = false;
      this.fromPeer = null;
      this.waitTime = 60000;
      this.pingTime = 5000;
      this.count = 0;
      this.errorCount = 0;
      this.flood = 0;
      this.time = 0;
      // this.filter = Api.InputMessagesFilterVideo;
      // //this.filterTitle = "媒体";
      this.errorMessage = "Too many API requests by single Worker invocation. To configure this limit, refer to https://developers.cloudflare.com/workers/wrangler/configuration/#limits";
      this.messageArray = [];
      this.cacheMessage = null;
      this.batchMessage = [];
      this.dialogArray = [];
      // this.chatArray = JSON.parse(JSON.stringify(userString));
      this.chatArray = userString;
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
      if (message.operate === "forwardMessage") {
        if (message.status === "update") {
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
      } else if (message.operate === "open") {
      } else if (message.operate === "close") {
      } else if (message.operate === "getChat") {
      } else if (message.operate === "chat") {
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
        } catch (err) {
          // console.log(err);
          // const index = this.webSocket.findIndex(element => element === ws);
          // if (index > -1) {
          //   this.webSocket.splice(index, 1);
          //   // console.log("(" + this.currentStep + ")删除ws成功");
          //   // this.broadcast({
          //   //   "step": this.currentStep,
          //   //   "operate": "broadcast",
          //   //   "message": "删除ws成功",
          //   //   "date": new Date().getTime(),
          //   // });
          // } else {
          //   // console.log("(" + this.currentStep + ")没找到该ws");
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

  sendMessage(type, operate, message, status, error) {
    this.broadcast({
      "step": this.currentStep,
      "type": type,
      "operate": operate,
      "offsetId": this.offsetId,
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
      "offsetId": this.offsetId,
      "photoIndex": photoIndex,
      "message": message,
      "status": status,
      "error": error,
      "date": new Date().getTime(),
    });
  }

  sendForward(operate, message, messageLength, status, error) {
    this.broadcast({
      "step": this.currentStep,
      "type": "grid",
      "chatId": this.chatId,
      "offsetId": this.offsetId,
      "operate": operate,
      "messageLength": messageLength,
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

  async getClientError(tryCount) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")getClient超出tryCount限制");
      this.sendMessage("log", "getClient", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.getClient(tryCount + 1);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async getClient(tryCount) {
    this.apiCount += 1;
    let configResult = {};
    try {
      configResult = await this.env.MAINDB.prepare("SELECT * FROM `CONFIG` WHERE `name` = 'user' AND `tgId` = 999 LIMIT 1;").run();
    } catch (err) {
      // console.log("getClient : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("log", "getClient", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.getClientError(tryCount);
      }
      return;
    }
    // console.log("configResult : " + configResult);  //测试
    if (configResult.success === true) {
      if (configResult.results && configResult.results.length > 0) {
        const result = configResult.results[0];
        if (result.chatId && result.chatId > 0) {
          this.chatId = result.chatId;
          this.lastChat = this.chatId;
        }
      } else {
        // console.log("没有预设client");
        this.sendMessage("log", "getClient", "没有预设client", null, false);
      }
    } else {
      // console.log("查询client失败");
      this.sendMessage("log", "getClient", "查询client失败", null, true);
      await this.getClientError(tryCount);
    }
  }

  async updateClientError(tryCount) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")updateClient超出tryCount限制");
      this.sendMessage("log", "updateClient", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.updateClient(tryCount + 1);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async updateClient(tryCount) {
    this.apiCount += 1;
    let configResult = {};
    try {
      configResult = await this.env.MAINDB.prepare("UPDATE `CONFIG` SET `chatId` = ? WHERE `name` = 'user' AND `tgId` = 999;").bind(this.chatId).run();
    } catch (err) {
      // console.log("updateClient : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("log", "updateClient", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.updateClientError(tryCount);
      }
      return;
    }
    // console.log(configResult);  //测试
    if (configResult.success === true) {
      // console.log("更新client数据成功");
      this.sendMessage("log", "updateClient", "更新client数据成功", null, false);
    } else {
      // console.log("更新client数据失败");
      this.sendMessage("log", "updateClient", "更新client数据失败", null, true);
      await this.updateClientError(tryCount);
    }
  }

  async getConfigError(tryCount, option) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")getConfig超出tryCount限制");
      this.sendMessage("log", "getConfig", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.getConfig(tryCount + 1, option);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async getConfig(tryCount, option) {
    this.apiCount += 1;
    let configResult = {};
    try {
      configResult = await this.env.MAINDB.prepare("SELECT * FROM `CONFIG` WHERE `name` = 'user' AND `tgId` = ? LIMIT 1;").bind(this.chatId).run();
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
        await this.getConfigError(tryCount, option);
      }
      return;
    }
    // console.log("configResult : " + configResult);  //测试
    if (configResult.success === true) {
      if (configResult.results && configResult.results.length > 0) {
        const result = configResult.results[0];
        if (!option || !option.chatId) {
          if (result.chatId && result.chatId > 0) {
            // this.chatId = result.chatId;
            // this.lastChat = this.chatId;
            this.offsetId = result.chatId;
          }
        }
        // if (!option || !option.filterType) {
        //   if (result.filterType && result.filterType > 0 && result.filterType <= 9) {
        //     this.filterType = result.filterType;
        //   }
        // }
        // if (!option || !option.reverse) {
        //   if (result.reverse) {
        //     this.reverse = Boolean(result.reverse);
        //   }
        // }
        if (!option || !option.limited) {
          if (result.limited && result.limited > 0) {
            this.limit = result.limited;
          }
        }
      } else {
        // console.log("没有预设config");
        this.sendMessage("log", "getConfig", "没有预设config", null, false);
      }
    } else {
      // console.log("查询config失败");
      this.sendMessage("log", "getConfig", "查询config失败", null, true);
      await this.getConfigError(tryCount, option);
    }
  }

  async updateConfigError(tryCount, messageLength) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")updateConfig超出tryCount限制");
      this.sendMessage("log", "updateConfig", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.updateConfig(tryCount + 1, messageLength);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async updateConfig(tryCount, messageLength) {
    this.apiCount += 1;
    let configResult = {};
    try {
      configResult = await this.env.MAINDB.prepare("UPDATE `CONFIG` SET `chatId` = ? WHERE `name` = 'user' AND `tgId` = ?;").bind(this.offsetId, this.chatId).run();
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
        await this.updateConfigError(tryCount, messageLength);
      }
      return;
    }
    // console.log(configResult);  //测试
    if (configResult.success === true) {
      // console.log("更新config数据成功 - " + messageLength);
      this.sendMessage("log", "updateConfig", "更新config数据成功 - " + messageLength, null, false);
    } else {
      // console.log("更新config数据失败 - " + messageLength);
      this.sendMessage("log", "updateConfig", "更新config数据失败 - " + messageLength, null, true);
      await this.updateConfigError(tryCount, messageLength);
    }
  }

  // async switchType() {
  //   switch (this.filterType) {
  //     case 0:
  //       this.filter = Api.InputMessagesFilterPhotoVideo;
  //       break;
  //     case 1:
  //       //this.filterTitle = "图片";
  //       this.filter = Api.InputMessagesFilterPhotos;
  //       break;
  //     case 2:
  //       //this.filterTitle = "视频";
  //       this.filter = Api.InputMessagesFilterVideo;
  //       break;
  //     case 3:
  //       //this.filterTitle = "文件";
  //       this.filter = Api.InputMessagesFilterDocument;
  //       break;
  //     case 4:
  //       //this.filterTitle = "动图";
  //       this.filter = Api.InputMessagesFilterGif;
  //       break;
  //     case 5:
  //       this.filter = Api.InputMessagesFilterVoice;
  //       break;
  //     case 6:
  //       this.filter = Api.InputMessagesFilterMusic;
  //       break;
  //     case 7:
  //       this.filter = Api.InputMessagesFilterChatPhotos;
  //       break;
  //     case 8:
  //       this.filter = Api.InputMessagesFilterRoundVoice;
  //       break;
  //     case 9:
  //       this.filter = Api.InputMessagesFilterRoundVideo;
  //       break;
  //     default:
  //       this.filter = Api.InputMessagesFilterPhotoVideo;
  //   }
  // }

  async getChat(tryCount) {
    // if (this.chatId && this.chatId >= 0) {
    if (this.chatId >= 0) {
      if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
        if (this.chatArray[this.chatId]) {
          const id = bigInt(this.chatArray[this.chatId].id);
          const accessHash = this.chatArray[this.chatId].accessHash ? bigInt(this.chatArray[this.chatId].accessHash) : bigInt.zero;
          let users = null;
          try {
            users = await this.client.invoke(
              new Api.users.GetUsers({
                id: [
                  new Api.InputUser({
                    userId: id,
                    accessHash: accessHash,
                  }),
                ],
              })
            );
          } catch (err) {
            // console.log("(" + this.currentStep + ") : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
            this.sendMessage("log", "getChat", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
            if (err.message === this.errorMessage) {
              this.stop = 2;
              this.broadcast({
                "result": "pause",
              });
              await this.close();
            } else {
              if (tryCount === 5) {
                this.stop = 2;
                // console.log("(" + this.currentStep + ")getChat超出tryCount限制");
                this.sendMessage("log", "getChat", "超出tryCount限制", null, true);
                await this.close();
              } else {
                await scheduler.wait(10000);
                if (this.stop === 1) {
                  await this.getChat(tryCount + 1);
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
          if (users.length && !(users[0] instanceof Api.UserEmpty)) {
            if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
              this.fromPeer = utils.getInputPeer(users[0]);
              if (this.fromPeer) {
                // this.errorCount = await this.ctx.storage.get(this.chatId) || 0;
                this.sendMessage("log", "getChat", this.chatId + " : " + this.chatArray[this.chatId].name, "add", false);
              } else {
                this.chatId += 1;
                if (this.chatId >= 47) {
                  this.chatId = 0;
                }
                if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
                  // console.log(this.chatArray[this.chatId].name + " : chat已不存在了");  //测试
                  this.sendMessage("log", "getChat", this.chatArray[this.chatId].name + " : chat已不存在了", null, true);
                  await this.getChat(1);
                } else {
                  // console.log(this.endChat + " : 超过最大chat了");  //测试
                  this.sendMessage("log", "getChat", this.endChat + " : 超过最大chat了", null, true);
                }
              }
            } else {
              // console.log(this.endChat + " : 超过最大chat了");  //测试
              this.sendMessage("log", "getChat", this.endChat + " : 超过最大chat了", null, true);
            }
          } else {
            this.chatId += 1;
            if (this.chatId >= 47) {
              this.chatId = 0;
            }
            if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
              // console.log(this.chatArray[this.chatId].name + " : chat已不存在了");  //测试
              this.sendMessage("log", "getChat", this.chatArray[this.chatId].name + " : chat已不存在了", null, true);
              // await this.getChat(1);
            } else {
              // console.log(this.endChat + " : 超过最大chat了");  //测试
              this.sendMessage("log", "getChat", this.endChat + " : 超过最大chat了", null, true);
            }
          }
        } else {
          // console.log("chat出错");  //测试
          this.sendMessage("log", "getChat", "chat出错", null, true);
        }
      } else {
        // console.log(this.endChat + " : 超过最大chat了");  //测试
        this.sendMessage("log", "getChat", this.endChat + " : 超过最大chat了", null, true);
      }
    } else {
      // console.log("chatId出错");  //测试
      this.sendMessage("log", "getChat", "chatId出错", null, true);
    }
  }

  async getMessage(tryCount) {
    try {
      // let count = 0;
      // this.messageArray = [];
      this.count = 0;
      for await (const message of this.client.iterMessages(
        this.fromPeer,
        //"me",  //测试
        {
          limit: this.limit,
          //limit: 20,  //测试
          // reverse: this.reverse,
          reverse: true,
          addOffset: -this.offsetId,
          //addOffset: 0,  //测试
          // filter: this.filter,
          //filter: Api.InputMessagesFilterVideo,  //测试
          waitTime: 60,
        })
      ) {
        // count += 1;
        this.count += 1;
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
      // if (this.count > this.limit) {
      //   // console.log("(" + this.currentStep + ") messageCount比limit大");
      //   this.sendMessage("log", "getMessage", "messageCount比limit大", null, true);
      // }
      // return count;
    } catch (err) {
      this.messageArray = [];
      // this.count = 0;
      // console.log("(" + this.currentStep + ")getMessage : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("log", "getMessage", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.name === "ChannelPrivateError" || err.errorMessage === "CHANNEL_INVALID" || err.errorMessage === "CHANNEL_PRIVATE" || err.code === 400) {
        this.fromPeer = null;
        this.chatId += 1;
        if (this.chatId >= 47) {
          this.chatId = 0;
        }
        if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
          // console.log(this.chatArray[this.chatId].name + " : chat已不存在了");  //测试
          this.sendMessage("log", "getMessage", this.chatArray[this.chatId].name + " : chat已不存在了", null, true);
          await this.getChat(1);
          await this.updateClient(1);
          this.offsetId = 0;
          await this.getConfig(1);
        } else {
          // console.log(this.endChat + " : 超过最大chat了");  //测试
          this.sendMessage("log", "getMessage", this.endChat + " : 超过最大chat了", null, true);
        }
      } else if (err.name === "FloodWaitError" || err.errorMessage?.includes("FLOOD_WAIT_") === true || err.code === 420) {
        // this.waitTime += 120000;
        if (err.seconds && err.seconds > 0) {
          this.flood = new Date().getTime() + 60000 + err.seconds * 1000;
          await this.ctx.storage.put("client", this.flood);
        }
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

  // async selectMediaIndexError(tryCount, id) {
  //   if (tryCount === 5) {
  //     this.stop = 2;
  //     // console.log("(" + this.currentStep + ")selectMediaIndex超出tryCount限制");
  //     this.sendMessage("log", "selectMediaIndex", "超出tryCount限制", null, true);
  //     await this.close();
  //   } else {
  //     await scheduler.wait(10000);
  //     if (this.stop === 1) {
  //       await this.selectMediaIndex(tryCount + 1, id);
  //     } else if (this.stop === 2) {
  //       this.broadcast({
  //         "result": "pause",
  //       });
  //       await this.close();
  //     }
  //   }
  // }

  // async selectMediaIndex(tryCount, id) {
  //   this.apiCount += 1;
  //   let mediaResult = {};
  //   try {
  //     mediaResult = await this.env.MEDIADB.prepare("SELECT `Vindex`, COUNT(*) FROM `MEDIAINDEX` WHERE `id` = ? LIMIT 1;").bind(id).run();
  //   } catch (err) {
  //     // console.log("(" + this.currentStep + ") selectMediaIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
  //     this.sendMessage("grid", "selectMediaIndex", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
  //     if (err.message === this.errorMessage) {
  //       this.stop = 2;
  //       this.broadcast({
  //         "result": "pause",
  //       });
  //       await this.close();
  //     } else {
  //       await this.selectMediaIndexError(tryCount, i);
  //     }
  //     return;
  //   }
  //   // console.log("mediaResult : " + mediaResult);  //测试
  //   if (mediaResult.success === true) {
  //     if (mediaResult.results && mediaResult.results.length > 0) {
  //       return mediaResult.results[0];
  //     }
  //   } else {
  //     await this.selectMediaIndexError(tryCount, id);
  //   }
  // }

  // async insertMediaIndexError(tryCount, Vindex, id) {
  //   if (tryCount === 5) {
  //     this.stop = 2;
  //     // console.log("(" + this.currentStep + ")insertMediaIndex超出tryCount限制");
  //     this.sendMessage("log", "insertMediaIndex", "超出tryCount限制", null, true);
  //     await this.close();
  //   } else {
  //     await scheduler.wait(10000);
  //     if (this.stop === 1) {
  //       await this.insertMediaIndex(tryCount + 1, Vindex, id);
  //     } else if (this.stop === 2) {
  //       this.broadcast({
  //         "result": "pause",
  //       });
  //       await this.close();
  //     }
  //   }
  // }

  // async insertMediaIndex(tryCount, Vindex, id) {
  //   this.apiCount += 1;
  //   let indexResult = {};
  //   try {
  //     indexResult = await this.env.MEDIADB.prepare("INSERT INTO `MEDIAINDEX` (Vindex, id) VALUES (?, ?);").bind(Vindex, id).run();
  //   } catch (err) {
  //     // console.log("(" + this.currentStep + ") insertMediaIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
  //     this.sendMessage("grid", "insertMediaIndex", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
  //     if (err.message === this.errorMessage) {
  //       this.stop = 2;
  //       this.broadcast({
  //         "result": "pause",
  //       });
  //       await this.close();
  //     } else {
  //       await this.insertMediaIndexError(tryCount, Vindex, id);
  //     }
  //     return;
  //   }
  //   // console.log(indexResult);  //测试
  //   if (indexResult.success === true) {
  //     // console.log("(" + this.currentStep + ") 插入mediaIndex数据成功");
  //     this.sendMessage("grid", "insertMediaIndex", "", "success", false);
  //   } else {
  //     // console.log("(" + this.currentStep + ") 插入mediaIndex数据失败");
  //     this.sendMessage("grid", "insertMediaIndex", "插入mediaIndex数据失败", "error", true);
  //     await this.insertMediaIndexError(tryCount, Vindex, id);
  //   }
  // }

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
      // console.log("(" + this.currentStep + ") selectMedia : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
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

  async insertMediaError(tryCount, id, accessHash, dcId, fileName, mimeType, size, duration, width, height) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")insertMedia超出tryCount限制");
      this.sendMessage("log", "insertMedia", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.insertMedia(tryCount + 1, id, accessHash, dcId, fileName, mimeType, size, duration, width, height);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async insertMedia(tryCount, id, accessHash, dcId, fileName, mimeType, size, duration, width, height) {
    this.apiCount += 1;
    let mediaResult = {};
    try {
      mediaResult = await this.env.MEDIADB.prepare("INSERT INTO `MEDIA` (id, accessHash, dcId, fileName, mimeType, size, duration, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);").bind(id, accessHash, dcId, fileName, mimeType, size, duration, width, height).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ") insertMedia : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);;
      this.sendMessage("grid", "insertMedia", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.insertMediaError(tryCount, id, accessHash, dcId, fileName, mimeType, size, duration, width, height);
      }
      return;
    }
    // console.log(mediaResult);  //测试
    if (mediaResult.success === true) {
      // console.log("(" + this.currentStep + ") 插入media数据成功");
      this.sendMessage("grid", "insertMedia", "", "success", false);
      return mediaResult.meta.last_row_id;
    } else {
      // console.log("(" + this.currentStep + ") 插入media数据失败");
      this.sendMessage("grid", "insertMedia", "插入media数据失败", "error", true);
      await this.insertMediaError(tryCount, id, accessHash, dcId, fileName, mimeType, size, duration, width, height);
      return 0;
    }
  }

  async endMediaMessage(id, accessHash, dcId, fileName, mimeType, size, duration, width, height) {
    if (this.stop === 1) {
      const index = await this.insertMedia(1, id, accessHash, dcId, fileName, mimeType, size, duration, width, height);
      // if (index > 0) {
      //   await this.insertMediaIndex(1, index, id);
      // }
      return index;
    } else if (this.stop === 2) {
      await this.updateConfig(1, 0);
      this.broadcast({
        "result": "pause",
      });
      await this.close();
    }
  }

  // async selectPhotoIndexError(tryCount, id, type) {
  //   if (tryCount === 5) {
  //     this.stop = 2;
  //     // console.log("(" + this.currentStep + ")selectPhotoIndex超出tryCount限制");
  //     this.sendMessage("log", "selectPhotoIndex", "超出tryCount限制", null, true);
  //     await this.close();
  //   } else {
  //     await scheduler.wait(10000);
  //     if (this.stop === 1) {
  //       await this.selectPhotoIndex(tryCount + 1, id, type);
  //     } else if (this.stop === 2) {
  //       this.broadcast({
  //         "result": "pause",
  //       });
  //       await this.close();
  //     }
  //   }
  // }

  // async selectPhotoIndex(tryCount, id, type) {
  //   this.apiCount += 1;
  //   let photoResult = {};
  //   try {
  //     photoResult = await this.env.PHOTODB.prepare("SELECT `Pindex`, COUNT(*) FROM `PHOTOINDEX` WHERE `id` = ? AND `sizeType` = ? LIMIT 1;").bind(id, type).run();
  //   } catch (err) {
  //     // console.log("(" + this.currentStep + ") selectPhotoIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
  //     this.sendMessage("grid", "selectPhotoIndex", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
  //     if (err.message === this.errorMessage) {
  //       this.stop = 2;
  //       this.broadcast({
  //         "result": "pause",
  //       });
  //       await this.close();
  //     } else {
  //       await this.selectPhotoIndexError(tryCount, id, type);
  //     }
  //     return;
  //   }
  //   // console.log("photoResult : " + photoResult);  //测试
  //   if (photoResult.success === true) {
  //     if (photoResult.results && photoResult.results.length > 0) {
  //       return photoResult.results[0];
  //     }
  //   } else {
  //     await this.selectPhotoIndexError(tryCount, id, type);
  //   }
  // }

  // async insertPhotoIndexError(tryCount, Pindex, id, type) {
  //   if (tryCount === 5) {
  //     this.stop = 2;
  //     // console.log("(" + this.currentStep + ")insertPhotoIndex超出tryCount限制");
  //     this.sendMessage("log", "insertPhotoIndex", "超出tryCount限制", null, true);
  //     await this.close();
  //   } else {
  //     await scheduler.wait(10000);
  //     if (this.stop === 1) {
  //       await this.insertPhotoIndex(tryCount + 1, Pindex, id, type);
  //     } else if (this.stop === 2) {
  //       this.broadcast({
  //         "result": "pause",
  //       });
  //       await this.close();
  //     }
  //   }
  // }

  // async insertPhotoIndex(tryCount, Pindex, id, type) {
  //   this.apiCount += 1;
  //   let photoResult = {};
  //   try {
  //     photoResult = await this.env.PHOTODB.prepare("INSERT INTO `PHOTOINDEX` (Pindex, id, sizeType) VALUES (?, ?, ?);").bind(Pindex, id, type).run();
  //   } catch (err) {
  //     // console.log("(" + this.currentStep + ") insertPhotoIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
  //     this.sendMessage("grid", "insertPhotoIndex", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
  //     if (err.message === this.errorMessage) {
  //       this.stop = 2;
  //       this.broadcast({
  //         "result": "pause",
  //       });
  //       await this.close();
  //     } else {
  //       await this.insertPhotoIndexError(tryCount, Pindex, id, type);
  //     }
  //     return;
  //   }
  //   // console.log(photoResult);  //测试
  //   if (photoResult.success === true) {
  //     // console.log("(" + this.currentStep + ") 插入photoIndex数据成功");
  //     this.sendMessage("grid", "insertPhotoIndex", "", "success", false);
  //   } else {
  //     // console.log("(" + this.currentStep + ") 插入photoIndex数据失败");
  //     this.sendMessage("grid", "insertPhotoIndex", "插入photoIndex数据失败", "error", true);
  //     await this.insertPhotoIndexError(tryCount, Pindex, id, type);
  //   }
  // }

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
      // console.log("(" + this.currentStep + ") selectPhoto : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
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

  async insertPhotoError(tryCount, id, accessHash, dcId, photoIndex, type, size) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")insertPhoto超出tryCount限制");
      this.sendMessage("log", "insertPhoto", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.insertPhoto(tryCount + 1, id, accessHash, dcId, photoIndex, type, size);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async insertPhoto(tryCount, id, accessHash, dcId, photoIndex, type, size) {
    this.apiCount += 1;
    let photoResult = {};
    try {
      photoResult = await this.env.PHOTODB.prepare("INSERT INTO `PHOTO` (id, accessHash, dcId, sizeType, size) VALUES (?, ?, ?, ?, ?);").bind(id, accessHash, dcId, type, size).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ") (" + photoLength +"/" + photoIndex + ") insertPhoto : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendPhoto("insertPhoto", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, photoIndex, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.insertPhotoError(tryCount, id, accessHash, dcId, photoIndex, type, size);
      }
      return;
    }
    // console.log(photoResult);  //测试
    if (photoResult.success === true) {
      // console.log("(" + this.currentStep + ") 插入photo数据成功");
      this.sendPhoto("insertPhoto", "", photoIndex, "success", false);
      return photoResult.meta.last_row_id;
    } else {
      // console.log("(" + this.currentStep + ") 插入photo数据失败");
      this.sendPhoto("insertPhoto", "插入photo数据失败", photoIndex, "error", true);
      await this.insertPhotoError(tryCount, id, accessHash, dcId, photoIndex, type, size);
      return 0;
    }
  }

  async endPhotoMessage(id, accessHash, dcId, photoIndex, type, size) {
    if (this.stop === 1) {
      const index = await this.insertPhoto(1, id, accessHash, dcId, photoIndex, type, size);
      // if (index > 0) {
      //   await this.insertPhotoIndex(1, index, id, type);
      // }
      return index;
    } else if (this.stop === 2) {
      await this.updateConfig(1, 0);
      this.broadcast({
        "result": "pause",
      });
      await this.close();
    }
  }

  // async selectMediaMessageIndexError(tryCount, messageId) {
  //   if (tryCount === 5) {
  //     this.stop = 2;
  //     // console.log("(" + this.currentStep + ")selectMediaMessageIndex超出tryCount限制");
  //     this.sendMessage("log", "selectMediaMessageIndex", "超出tryCount限制", null, true);
  //     await this.close();
  //   } else {
  //     await scheduler.wait(10000);
  //     if (this.stop === 1) {
  //       await this.selectMediaMessageIndex(tryCount + 1, messageId);
  //     } else if (this.stop === 2) {
  //       this.broadcast({
  //         "result": "pause",
  //       });
  //       await this.close();
  //     }
  //   }
  // }

  // async selectMediaMessageIndex(tryCount, messageId) {
  //   this.apiCount += 1;
  //   let messageResult = null;
  //   try {
  //     messageResult = await this.env.MAINDB.prepare("SELECT COUNT(*) FROM `MESSAGEINDEX` WHERE `userId` = ? AND `id` = ? LIMIT 1;").bind(this.chatId, messageId).run();
  //   } catch (err) {
  //     // console.log("(" + this.currentStep + ") selectMediaMessageIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
  //     this.sendMessage("grid", "selectMediaMessageIndex", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
  //     if (err.message === this.errorMessage) {
  //       this.stop = 2;
  //       this.broadcast({
  //         "result": "pause",
  //       });
  //       await this.close();
  //     } else {
  //       await this.selectMediaMessageIndexError(tryCount, messageId);
  //     }
  //     return;
  //   }
  //   // console.log("messageResult : " + messageResult["COUNT(*)"]);  //测试
  //   if (messageResult.success === true) {
  //     if (messageResult.results && messageResult.results.length > 0) {
  //       return messageResult.results[0]["COUNT(*)"];
  //     }
  //   } else {
  //     await this.selectMediaMessageIndexError(tryCount, messageId);
  //   }
  // }

  async selectMediaMessageError(tryCount, messageId) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")selectMediaMessage超出tryCount限制");
      this.sendMessage("log", "selectMediaMessage", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.selectMediaMessage(tryCount + 1, messageId);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async selectMediaMessage(tryCount, messageId) {
    this.apiCount += 1;
    let messageResult = null;
    try {
      messageResult = await this.env.MESSAGEDB.prepare("SELECT `Mindex`, COUNT(*) FROM `MESSAGE` WHERE `userId` = ? AND `id` = ? LIMIT 1;").bind(this.chatId, messageId).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ") selectMediaMessage : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("grid", "selectMediaMessage", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.selectMediaMessageError(tryCount, messageId);
      }
      return;
    }
    // console.log("messageResult : " + messageResult);  //测试
    if (messageResult.success === true) {
      if (messageResult.results && messageResult.results.length > 0) {
        return messageResult.results[0];
      }
    } else {
      await this.selectMediaMessageError(tryCount, messageId);
    }
  }

  // async selectPhotoMessageIndexError(tryCount, messageId, type) {
  //   if (tryCount === 5) {
  //     this.stop = 2;
  //     // console.log("(" + this.currentStep + ")selectPhotoMessageIndex超出tryCount限制");
  //     this.sendMessage("log", "selectPhotoMessageIndex", "超出tryCount限制", null, true);
  //     await this.close();
  //   } else {
  //     await scheduler.wait(10000);
  //     if (this.stop === 1) {
  //       await this.selectPhotoMessageIndex(tryCount + 1, messageId, type);
  //     } else if (this.stop === 2) {
  //       this.broadcast({
  //         "result": "pause",
  //       });
  //       await this.close();
  //     }
  //   }
  // }

  // async selectPhotoMessageIndex(tryCount, messageId, type) {
  //   this.apiCount += 1;
  //   let messageResult = null;
  //   try {
  //     messageResult = await this.env.MAINDB.prepare("SELECT COUNT(*) FROM `MESSAGEINDEX` WHERE `userId` = ? AND `id` = ? AND `sizeType` = ? LIMIT 1;").bind(this.chatId, messageId, type).run();
  //   } catch (err) {
  //     // console.log("(" + this.currentStep + ") selectPhotoMessageIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
  //     this.sendMessage("grid", "selectPhotoMessageIndex", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
  //     if (err.message === this.errorMessage) {
  //       this.stop = 2;
  //       this.broadcast({
  //         "result": "pause",
  //       });
  //       await this.close();
  //     } else {
  //       await this.selectPhotoMessageIndexError(tryCount, messageId, type);
  //     }
  //     return;
  //   }
  //   // console.log("messageResult : " + messageResult["COUNT(*)"]);  //测试
  //   if (messageResult.success === true) {
  //     if (messageResult.results && messageResult.results.length > 0) {
  //       return messageResult.results[0]["COUNT(*)"];
  //     }
  //   } else {
  //     await this.selectPhotoMessageIndexError(tryCount, messageId, type);
  //   }
  // }

  async selectPhotoMessageError(tryCount, messageId, type) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")selectPhotoMessage超出tryCount限制");
      this.sendMessage("log", "selectPhotoMessage", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.selectPhotoMessage(tryCount + 1, messageId, type);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async selectPhotoMessage(tryCount, messageId, type) {
    this.apiCount += 1;
    let messageResult = null;
    try {
      messageResult = await this.env.MESSAGEDB.prepare("SELECT `Mindex`, COUNT(*) FROM `MESSAGE` WHERE `userId` = ? AND `id` = ? AND `sizeType` = ? LIMIT 1;").bind(this.chatId, messageId, type).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ") selectPhotoMessage : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendMessage("grid", "selectPhotoMessage", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.selectPhotoMessageError(tryCount, messageId, type);
      }
      return;
    }
    // console.log("messageResult : " + messageResult);  //测试
    if (messageResult.success === true) {
      if (messageResult.results && messageResult.results.length > 0) {
        return messageResult.results[0];
      }
    } else {
      await this.selectPhotoMessageError(tryCount, messageId, type);
    }
  }

  // async insertMessageIndexError(tryCount, Mindex, id) {
  //   if (tryCount === 5) {
  //     this.stop = 2;
  //     // console.log("(" + this.currentStep + ")insertMessageIndex超出tryCount限制");
  //     this.sendMessage("log", "insertMessageIndex", "超出tryCount限制", null, true);
  //     await this.close();
  //   } else {
  //     await scheduler.wait(10000);
  //     if (this.stop === 1) {
  //       await this.insertMessageIndex(tryCount + 1, Mindex, id);
  //     } else if (this.stop === 2) {
  //       this.broadcast({
  //         "result": "pause",
  //       });
  //       await this.close();
  //     }
  //   }
  // }

  // async insertMessageIndex(tryCount, Mindex, id) {
  //   this.apiCount += 1;
  //   let messageResult = {};
  //   try {
  //     messageResult = await this.env.MAINDB.prepare("INSERT INTO `MESSAGEINDEX` (dbIndex, userId, Mindex, id) VALUES (?, ?, ?, ?);").bind(this.messageDBIndex, this.chatId, Mindex, id).run();
  //   } catch (err) {
  //     // console.log("(" + this.currentStep + ") insertMessageIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);;
  //     this.sendMessage("grid", "insertMessageIndex", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
  //     if (err.message === this.errorMessage) {
  //       this.stop = 2;
  //       this.broadcast({
  //         "result": "pause",
  //       });
  //       await this.close();
  //     } else {
  //       await this.insertMessageIndexError(tryCount, Mindex, id);
  //     }
  //     return;
  //   }
  //   // console.log(messageResult);  //测试
  //   if (messageResult.success === true) {
  //     // console.log("(" + this.currentStep + ") 插入messageIndex数据成功");
  //     this.sendMessage("grid", "insertMessageIndex", "", "success", false);
  //   } else {
  //     // console.log("(" + this.currentStep + ") 插入messageIndex数据失败");
  //     this.sendMessage("grid", "insertMessageIndex", "插入messageIndex数据失败", "error", true);
  //     await this.insertMessageIndexError(tryCount, Mindex, id);
  //   }
  // }

  async insertMessageError(tryCount, messageId, category, type, mid, id, accessHash, txt) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")insertMessage超出tryCount限制");
      this.sendMessage("log", "insertMessage", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.insertMessage(tryCount + 1, messageId, category, type, mid, id, accessHash, txt);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async insertMessage(tryCount, messageId, category, type, mid, id, accessHash, txt) {
    this.apiCount += 1;
    let messageResult = {};
    try {
      messageResult = await this.env.MESSAGEDB.prepare("INSERT INTO `MESSAGE` (userId, id, category, sizeType, mid, accessId, accessHash, txt) VALUES (?, ?, ?, ?, ?, ?, ?, ?);").bind(this.chatId, messageId, category, type, mid, id, accessHash, txt).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ") insertMessage : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);;
      this.sendMessage("grid", "insertMessage", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.insertMessageError(tryCount, messageId, category, type, mid, id, accessHash, txt);
      }
      return;
    }
    // console.log(messageResult);  //测试
    if (messageResult.success === true) {
      // console.log("(" + this.currentStep + ") 插入message数据成功");
      this.sendMessage("grid", "insertMessage", "", "success", false);
      return messageResult.meta.last_row_id;
    } else {
      // console.log("(" + this.currentStep + ") 插入message数据失败");
      this.sendMessage("grid", "insertMessage", "插入message数据失败", "error", true);
      await this.insertMessageError(tryCount, messageId, category, type, mid, id, accessHash, txt);
      return 0;
    }
  }

  async endMediaInsert(messageId, category, mid, id, accessHash, txt) {
    // const messageIndexCount = await this.selectMediaMessageIndex(1, messageId, "");
    // if (parseInt(messageIndexCount) === 0) {
      const messageResult = await this.selectMediaMessage(1, messageId);
      if (messageResult) {
        const messageCount = parseInt(messageResult["COUNT(*)"]);
        if (messageCount === 0) {
          const Mindex = await this.insertMessage(1, messageId, category, "", mid, id, accessHash, txt);
          // await this.insertMessageIndex(1, Mindex, messageId);
        } else {
          // const Mindex = messageResult.Mindex;
          // await this.insertMessageIndex(1, Mindex, messageId);
          // console.log("(" + this.currentStep + ") message已在数据库中");
          this.sendMessage("grid", "endMediaInsert", "", "exist", false);
        }
      } else {
        // console.log("(" + this.currentStep + ") 图片的messageResult错误");
        this.sendMessage("grid", "endMediaInsert", "图片的messageResult错误", "error", true);
      }
    // } else {
    //   // console.log("(" + this.currentStep + ") message已在索引数据库中");
    //   this.sendMessage("grid", "endMediaInsert", "", "exist", false);
    // }
  }

  async endPhotoInsert(messageId, category, type, mid, id, accessHash, txt) {
    // const messageIndexCount = await this.selectPhotoMessageIndex(1, messageId, type);
    // if (parseInt(messageIndexCount) === 0) {
      const messageResult = await this.selectPhotoMessage(1, messageId, type);
      if (messageResult) {
        const messageCount = parseInt(messageResult["COUNT(*)"]);
        if (messageCount === 0) {
          const Mindex = await this.insertMessage(1, messageId, category, type, mid, id, accessHash, txt);
          // await this.insertMessageIndex(1, Mindex, messageId);
        } else {
          // const Mindex = messageResult.Mindex;
          // await this.insertMessageIndex(1, Mindex, messageId);
          // console.log("(" + this.currentStep + ") message已在数据库中");
          this.sendMessage("grid", "endPhotoInsert", "", "exist", false);
        }
      } else {
        // console.log("(" + this.currentStep + ") 图片的messageResult错误");
        this.sendMessage("grid", "endPhotoInsert", "视频的messageResult错误", "error", true);
      }
    // } else {
    //   // console.log("(" + this.currentStep + ") message已在索引数据库中");
    //   this.sendMessage("grid", "endPhotoInsert", "", "exist", false);
    // }
  }

  async getMedia(message) {
    const messageId = message.id;
    const id = message.media.document.id.toString();
    const accessHash = message.media.document.accessHash.toString();
    if (id && accessHash) {
      // const mediaIndexResult = await this.selectMediaIndex(1, id);
      // if (mediaIndexResult) {
        const category = 2;
        const txt = message.message;
      //   const mediaIndexCount = parseInt(mediaIndexResult["COUNT(*)"]);
      //   if (mediaIndexCount === 0) {
          const mediaResult = await this.selectMedia(1, id);
          if (mediaResult) {
            const mediaCount = parseInt(mediaResult["COUNT(*)"]);
            if (mediaCount === 0) {
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
              const dcId = message.media.document.dcId;
              const size = parseInt(message.media.document.size);
              const mimeType = message.media.document.mimeType;
              this.broadcast({
                "step": this.currentStep,
                "operate": "getMedia",
                "offsetId": this.offsetId,
                "category": category,
                "dcId": dcId,
                "size": size,
                "type": mimeType,
                "fileName": fileName,
                "duration": duration,
                "width": width,
                "height": height,
                "status": "update",
                "date": new Date().getTime(),
              });
              if (this.stop === 1) {
                const Vindex = await this.endMediaMessage(id, accessHash, dcId, fileName, mimeType, size, duration, width, height);
                await this.endMediaInsert(messageId, category, Vindex, id, accessHash, txt);
                this.offsetId += 1;
                return true;
              } else if (this.stop === 2) {
                await this.updateConfig(1, 0);
                this.broadcast({
                  "result": "pause",
                });
                await this.close();
              }
            } else {
              // console.log("(" + this.currentStep + ") 视频已入过库了");
              this.sendMessage("grid", "getMedia", "", "fileExist", false);
              const Vindex = mediaResult.Vindex;
              // if (Vindex && Vindex > 0) {
              //   await this.insertMediaIndex(1, Vindex, id);
              // }
              await this.endMediaInsert(messageId, category, Vindex, id, accessHash, txt);
              this.offsetId += 1;
            }
          } else {
            // console.log("(" + this.currentStep + ") 视频的mediaResult错误");
            this.sendMessage("grid", "getMedia", "视频的mediaResult错误", "error", true);
            this.offsetId += 1;
          }
      //   } else {
      //     // console.log("(" + this.currentStep + ") 视频已入过索引库了");
      //     this.sendMessage("grid", "getMedia", "", "indexExist", false);
      //     const Vindex = mediaIndexResult.Vindex;
      //     await this.endMediaInsert(messageId, category, Vindex, id, accessHash, txt);
      //     this.offsetId += 1;
      //   }
      // } else {
      //   // console.log("(" + this.currentStep + ") 视频的mediaIndexResult错误");
      //   this.sendMessage("grid", "getMedia", "视频的mediaIndexResult错误", "error", true);
      //   this.offsetId += 1;
      // }
    } else {
      // console.log("(" + this.currentStep + ") 视频的id或accessHash错误");
      this.sendMessage("grid", "getMedia", "视频的id或accessHash错误", "error", true);
      this.offsetId += 1;
    }
    return false;
  }

  async getPhoto(message) {
    const messageId = message.id;
    const id = message.media.photo.id.toString();
    const accessHash = message.media.photo.accessHash.toString();
    if (id && accessHash) {
      const ids = [];
      const photoInfo = utils.getPhotoInfo(message.media);
      const photoLength = photoInfo.length;
      // console.log("photoLength : " + photoLength);  //测试
      if (photoLength && photoLength > 0) {
        const category = 1;
        const txt = message.message;
        this.broadcast({
          "step": this.currentStep,
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
          // const photoIndexResult = await this.selectPhotoIndex(1, id, type);
          // if (photoIndexResult) {
          //   const photoIndexCount = parseInt(photoIndexResult["COUNT(*)"]);
          //   if (photoIndexCount === 0) {
              const photoResult = await this.selectPhoto(1, id, type);
              if (photoResult) {
                const photoCount = parseInt(photoResult["COUNT(*)"]);
                if (photoCount === 0) {
                  const dcId = photoInfo[index].dcId;
                  const size = photoInfo[index].size;
                  const time = new Date().getTime();
                  this.broadcast({
                    "step": this.currentStep,
                    "operate": "getPhoto",
                    "chatId": this.chatId,
                    "offsetId": this.offsetId,
                    "messageId": messageId,
                    "photoIndex": photoIndex,
                    "dcId": dcId,
                    "type": type,
                    "size": size,
                    "status": "update",
                    "time": time,
                    "date": time,
                  });
                  if (this.stop === 1) {
                    const Pindex = await this.endPhotoMessage(id, accessHash, dcId, photoIndex, type, size);
                    if (Pindex && Pindex > 0) {
                      ids.push(Pindex);
                    }
                    // await this.endPhotoInsert(messageId, category, type, Pindex, id, accessHash, txt);
                  } else if (this.stop === 2) {
                    await this.updateConfig(1, 0);
                    this.broadcast({
                      "result": "pause",
                    });
                    await this.close();
                  }
                } else {
                  // console.log("(" + this.currentStep + ") (" + photoLength +"/" + photoIndex + ") 图片"+ type + "已入过库了");
                  this.sendPhoto("getPhoto", "", photoIndex, "fileExist", false);
                  const Pindex = photoResult.Pindex;
                  if (Pindex && Pindex > 0) {
                    ids.push(Pindex);
                    // await this.insertPhotoIndex(1, Pindex, id);
                  }
                  // await this.endPhotoInsert(messageId, category, type, Pindex, id, accessHash, txt);
                }
              } else {
                // console.log("(" + this.currentStep + ") 图片的photoResult错误");
                this.sendPhoto("getPhoto", "图片的photoResult错误", photoIndex, "error", true);
              }
          //   } else {
          //     // console.log("(" + this.currentStep + ") 图片已入过索引库了");
          //     this.sendPhoto("getPhoto", "", photoIndex, "indexExist", false);
          //     const Pindex = photoIndexResult.Pindex;
          //     // await this.endPhotoInsert(messageId, category, type, Pindex, id, accessHash, txt);
          //   }
          // } else {
          //   // console.log("(" + this.currentStep + ") 图片的photoIndexResult错误");
          //   this.sendPhoto("getPhoto", "图片的photoIndexResult错误", photoIndex, "error", true);
          // }
        }
        await this.endPhotoInsert(messageId, category, "", JSON.stringify(ids), id, accessHash, txt);
        this.offsetId += 1;
        return true;
      } else {
        // console.log("(" + this.currentStep + ") 图片的info错误");
        this.sendPhoto("getPhoto", "图片的info错误", photoIndex, "error", true);
        this.offsetId += 1;
      }
    } else {
      // console.log("(" + this.currentStep + ") 图片的id或accessHash错误");
      this.sendPhoto("getPhoto", "图片的id或accessHash错误", photoIndex, "error", true);
      this.offsetId += 1;
    }
    return false;
  }

  async getFile(message) {
    const messageId = message.id;
    const id = message.media.document.id.toString();
    const accessHash = message.media.document.accessHash.toString();
    if (id && accessHash) {
      // const photoIndexResult = await this.selectPhotoIndex(1, id,"p");
      // if (photoIndexResult) {
        const category = 1;
        const txt = message.message;
        // const photoIndexCount = parseInt(photoIndexResult["COUNT(*)"]);
        // if (photoIndexCount === 0) {
          const photoResult = await this.selectPhoto(1, id,"p");
          if (photoResult) {
            const photoCount = parseInt(photoResult["COUNT(*)"]);
            if (photoCount === 0) {
              // console.log("(" + this.currentStep + ") 准备查询图片的hash");
              const dcId = message.media.document.dcId;
              const size = parseInt(message.media.document.size);
              const mimeType = message.media.document.mimeType;
              this.broadcast({
                "step": this.currentStep,
                "operate": "getFile",
                "offsetId": this.offsetId,
                "category": category,
                "dcId": dcId,
                "size": size,
                "type": mimeType,
                "status": "update",
                "date": new Date().getTime(),
              });
              if (this.stop === 1) {
                const Pindex = await this.endPhotoMessage(id, accessHash, dcId, 1, "p", size);
                await this.endMediaInsert(messageId, category, Pindex, id, accessHash, txt);
                this.offsetId += 1;
                return true;
              } else if (this.stop === 2) {
                await this.updateConfig(1, 0);
                this.broadcast({
                  "result": "pause",
                });
                await this.close();
              }
            } else {
              // console.log("(" + this.currentStep + ") 图片已入过库了");
              this.sendMessage("grid", "getFile", "", "fileExist", false);
              const Pindex = photoResult.Pindex;
              // if (Pindex && Pindex > 0) {
              //   await this.insertPhotoIndex(1, Pindex, id,"p");
              // }
              await this.endMediaInsert(messageId, category, Pindex, id, accessHash, txt);
              this.offsetId += 1;
            }
          } else {
            // console.log("(" + this.currentStep + ") 图片的photoResult错误");
            this.sendMessage("grid", "getFile", "图片的photoResult错误", "error", true);
            this.offsetId += 1;
          }
      //   } else {
      //     // console.log("(" + this.currentStep + ") 图片已入过索引库了");
      //     this.sendMessage("grid", "getFile", "", "indexExist", false);
      //     const Pindex = photoIndexResult.Pindex;
      //     await this.endMediaInsert(messageId, category, Pindex, id, accessHash, txt);
      //     this.offsetId += 1;
      //   }
      // } else {
      //   // console.log("(" + this.currentStep + ") 图片的photoIndexResult错误");
      //   this.sendMessage("grid", "getFile", "图片的photoIndexResult错误", "error", true);
      //   this.offsetId += 1;
      // }
    } else {
      // console.log("(" + this.currentStep + ") 图片的id或accessHash错误");
      this.sendMessage("grid", "getFile", "图片的id或accessHash错误", "error", true);
      this.offsetId += 1;
    }
    return false;
  }

  async getNext() {
    this.fromPeer = null;
    this.chatId += 1;
    if (this.chatId >= 47) {
      this.chatId = 0;
    }
    this.count = 0;
    if (!this.endChat || this.endChat === 0 || (this.endChat > 0 && this.chatId <= this.endChat)) {
      await this.getChat(1);
      await this.updateClient(1);
      this.offsetId = 0;
      await this.getConfig(1);
      if (this.fromPeer) {
        if (this.chatId != this.lastChat) {
          // if (this.lastChat != 48) {
            await this.updateConfig(1, 0);
          // }
          this.lastChat = this.chatId;
        }
        if (this.stop === 2) {
          this.broadcast({
            "result": "pause",
          });
          await this.close();
        }
      } else {
        // console.log("(" + this.currentStep + ")全部client的chat采集完毕");
        this.sendMessage("log", "getNext", "全部client的chat采集完毕", null, false);
        this.broadcast({
          "result": "over",
        });
        await this.close();
      }
    } else {
      // console.log(this.endChat + " : 超过最大chat了");  //测试
      this.sendMessage("log", "getNext", this.endChat + " : 超过最大chat了", null, true);
      await this.close();
    }
  }

  async forwardMessage(idArray, fileIdArray) {
    const messageLength = idArray.length;
    // if (messageLength > this.limit) {
    //   // console.log("(" + this.currentStep + ") messageLength比limit大");
    //   this.sendForward("forwardMessage", "messageLength比limit大", 0, "error", true);
    // }
    // console.log(length);  //测试
    if (this.flood && this.flood > 0) {
      this.count = 0;
      if (this.flood > new Date().getTime()) {
        // console.log("(" + this.currentStep + ") 还需等待" + ((this.flood - new Date().getTime()) / 1000) + "秒的洪水警告时间");
        this.sendForward("forwardMessage", "还需等待" + Math.ceil((this.flood - new Date().getTime()) / 1000) + "秒的洪水警告时间", 0, "flood", true);
        return;
      } else {
        this.flood = 0;
        await this.ctx.storage.put("client", 0);
      }
    } else {
      const time = this.waitTime - (new Date().getTime() - this.time);
      await this.waitNext(time, false);
    }
    if (messageLength > 0) {
      try {
        const forwardResult = await this.client.invoke(new Api.messages.ForwardMessages({
          fromPeer: this.fromPeer,
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
        // this.sendMessage("log", "forwardMessage", JSON.stringify(forwardResult), null, false);
      } catch (err) {
        if (err.errorMessage === "RANDOM_ID_DUPLICATE" || err.code === 500) {
          // console.log("(" + this.currentStep + ") " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
          this.sendForward("forwardMessage", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, 0, "error", true);
        } else if (err.errorMessage === "CHAT_FORWARDS_RESTRICTED" || err.code === 400) {
          // this.offsetId += this.count;
          this.count = 0;
          // console.log("(" + this.currentStep + ") 消息不允许转发 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
          this.sendForward("forwardMessage", "消息不允许转发 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, 0, "error", true);
          await this.getNext();
          return;
        } else if (err.name === "FloodWaitError" || err.errorMessage?.includes("FLOOD_WAIT_") === true || err.code === 420) {
          this.offsetId -= this.count;
          this.count = 0;
          // this.waitTime += 120000;
          if (err.seconds && err.seconds > 0) {
            this.flood = new Date().getTime() + 60000 + err.seconds * 1000;
            await this.ctx.storage.put("client", this.flood);
          }
          // console.log("(" + this.currentStep + ") 触发了洪水警告，请求太频繁 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
          this.sendForward("forwardMessage", "触发了洪水警告，请求太频繁 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, 0, "flood", true);
          return;
        } else {
          this.count = 0;
          // console.log("(" + this.currentStep + ") 转发消息时发生错误 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
          this.sendForward("forwardMessage", "转发消息时发生错误 : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, 0, "error", true);
          return;
        }
      }
      // this.offsetId += this.count;
      this.count = 0;
      await this.updateConfig(1, messageLength);
      // console.log("(" + this.currentStep + ") 成功转发了" + length + "条消息");
      this.sendForward("forwardMessage", "成功转发了" + messageLength + "条消息", messageLength, "update", false);
    } else {
      // this.offsetId += this.count;
      this.count = 0;
      await this.updateConfig(1, 0);
      this.errorCount += 1;
      // if (this.errorCount >= 3) {
      //   await this.ctx.storage.put(this.chatId, 0);
      //   // console.log("(" + this.currentStep + ") 连续2轮的消息无需转发");
      //   this.sendForward("forwardMessage", "连续2轮的消息无需转发", 0, "error", true);
      //   await this.getNext();
      // } else {
      //   await this.ctx.storage.put(this.chatId, this.errorCount);
        // console.log("(" + this.currentStep + ") 第" + this.errorCount + "轮消息无需转发");
        this.sendForward("forwardMessage", "第" + this.errorCount + "轮消息无需转发", 0, "error", true);
      // }
    }
    this.time = new Date().getTime();
  }

  async nextStep() {
    if (this.stop === 1) {
      if (this.apiCount < 300) {
        this.currentStep += 1;
        if (this.flood && this.flood > 0) {
          this.count = 0;
          if (this.flood > new Date().getTime()) {
            const time = this.flood - new Date().getTime();
            // console.log("(" + this.currentStep + ") 还需等待" + Math.ceil(time / 1000) + "秒的洪水警告时间");
            this.sendMessage("log", "nextStep", "还需等待" + Math.ceil(time / 1000) + "秒的洪水警告时间", "flood", true);
            await this.waitNext(time, true);
          } else {
            this.flood = 0;
            await this.ctx.storage.put("client", 0);
          }
        }
        await this.getMessage(1);
        await scheduler.wait(5000);
        const messageArray = this.messageArray.slice();
        const messageLength = messageArray.length;
        this.messageArray = [];
        // console.log("(" + this.currentStep + ")messageLength : " + messageLength);  //测试
        // this.sendMessage("log", "nextStep", "messageLength : " + messageLength, null, false);  //测试
        // if (messageLength > this.limit) {
        //   // console.log("(" + this.currentStep + ") messageLength比limit大");
        //   this.sendMessage("log", "nextStep", "messageLength比limit大", null, true);
        // }
        if (messageLength && messageLength > 0) {
          if (this.stop === 1) {
            const idArray = [];
            const fileIdArray = [];
            for (let messageIndex = 0; messageIndex < messageLength; messageIndex++) {
              if (messageArray[messageIndex]) {
                if (!messageArray[messageIndex].noforwards || messageArray[messageIndex].noforwards === false) {
                  let fileId = null;
                  const id = messageArray[messageIndex].id;
                  // if (this.tg[clientIndex].filterType === 2) {
                  //   if (messageArray[messageIndex].media) {
                  //     if (messageArray[messageIndex].media.document) {
                  //       const status = await this.getMedia(messageArray[messageIndex]);
                  //       if (status === true) {
                  //         fileId = messageArray[messageIndex].media.document.id;
                  //       }
                  //     }
                  //   }
                  // } else if (this.tg[clientIndex].filterType === 1) {
                  //   if (messageArray[messageIndex].media) {
                  //     if (messageArray[messageIndex].media.photo) {
                  //       const status = await this.getPhoto(messageArray[messageIndex]);
                  //       if (status === true) {
                  //         fileId = messageArray[messageIndex].media.photo.id;
                  //       }
                  //     }
                  //   }
                  // } else if (this.tg[clientIndex].filterType === 3) {
                  //   if (messageArray[messageIndex].media) {
                  //     if (messageArray[messageIndex].media.document) {
                  //       const mimeType = messageArray[messageIndex].media.document.mimeType;
                  //       if (mimeType.startsWith("video/")) {
                  //         const status = await this.getMedia(messageArray[messageIndex]);
                  //         if (status === true) {
                  //           fileId = messageArray[messageIndex].media.document.id;
                  //         }
                  //       } else if (mimeType.startsWith("image/")) {
                  //         const status = await this.getPhoto(messageArray[messageIndex]);
                  //         if (status === true) {
                  //           fileId = messageArray[messageIndex].media.document.id;
                  //         }
                  //       // } else if (mimeType.startsWith("application/")) {
                  //       // } else {
                  //       }
                  //     }
                  //   }
                  // } else if (this.tg[clientIndex].filterType === 4) {
                  //   if (messageArray[messageIndex].media) {
                  //     if (messageArray[messageIndex].media.document) {
                  //       const status = await this.getMedia(messageArray[messageIndex]);
                  //       if (status === true) {
                  //         fileId = messageArray[messageIndex].media.document.id;
                  //       }
                  //     }
                  //   }
                  // } else if (this.tg[clientIndex].filterType === 0) {
                  //   if (messageArray[messageIndex].media) {
                  //     if (messageArray[messageIndex].media.document) {
                  //       const id = messageArray[messageIndex].media.document.id;
                  //       const status = await this.getMedia(messageArray[messageIndex]);
                  //       if (status === true) {
                  //         fileId = messageArray[messageIndex].media.document.id;
                  //       }
                  //     } else if (messageArray[messageIndex].media.photo) {
                  //       const id = messageArray[messageIndex].media.photo.id;
                  //       const status = await this.getPhoto(messageArray[messageIndex]);
                  //       if (status === true) {
                  //         fileId = messageArray[messageIndex].media.photo.id;
                  //       }
                  //     }
                  //   }
                  // }
                  if (messageArray[messageIndex].media) {
                    const time = new Date().getTime();
                    this.broadcast({
                      "step": this.currentStep,
                      "operate": "nextStep",
                      "chatId": this.chatId,
                      "offsetId": this.offsetId,
                      "messageId": id,
                      "status": "add",
                      "time": time,
                      "date": time,
                    });
                    if (messageArray[messageIndex].media.document) {
                      const mimeType = messageArray[messageIndex].media.document.mimeType;
                      if (mimeType.startsWith("video/")) {
                        const status = await this.getMedia(messageArray[messageIndex]);
                        // if (status === true) {
                          fileId = messageArray[messageIndex].media.document.id;
                        // }
                      } else if (mimeType.startsWith("image/")) {
                        const status = await this.getPhoto(messageArray[messageIndex]);
                        // if (status === true) {
                          fileId = messageArray[messageIndex].media.document.id;
                        // }
                      // } else if (mimeType.startsWith("application/")) {
                      // } else {
                      }
                    } else if (messageArray[messageIndex].media.photo) {
                      fileId = messageArray[messageIndex].media.photo.id;
                      const status = await this.getPhoto(messageArray[messageIndex]);
                      // if (status === true) {
                        fileId = messageArray[messageIndex].media.photo.id;
                      // }
                    }
                  }
                  if (id && fileId) {
                    idArray.push(id);
                    fileIdArray.push(fileId);
                  }
                }
              }
            }
            await this.forwardMessage(idArray, fileIdArray);
            if (this.stop === 1) {
             if (this.apiCount < 300) {
                await this.nextStep();
              } else {
                this.stop = 2;
                // console.log("(" + this.currentStep + ")nextStep超出apiCount限制");
                this.sendMessage("log", "nextStep", "超出apiCount限制", "limit", true);
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
        } else if (this.count > 0) {
          // this.offsetId += this.count;
          this.count = 0;
          await this.updateConfig(1, 0);
          this.errorCount += 1;
          // if (this.errorCount >= 3) {
          //   await this.ctx.storage.put(this.chatId, 0);
          //   // console.log("(" + this.currentStep + ") 连续3轮没有获取到包含有效媒体的消息");
          //   this.sendForward("nextStep", "连续3轮没有获取到包含有效媒体的消息", 0, "error", true);
          //   await this.getNext();
          // } else {
          //   await this.ctx.storage.put(this.chatId, this.errorCount);
            // console.log("(" + this.currentStep + ") 第" + this.errorCount + "轮没有获取到包含有效媒体的消息");
            this.sendForward("nextStep", "第" + this.errorCount + "轮没有获取到包含有效媒体的消息", 0, "error", true);
          // }
          if (this.stop === 1) {
           if (this.apiCount < 300) {
              await this.nextStep();
            } else {
              this.stop = 2;
              // console.log("(" + this.currentStep + ")nextStep超出apiCount限制");
              this.sendMessage("log", "nextStep", "超出apiCount限制", "limit", true);
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
          await this.updateConfig(1, 0);
          // console.log("(" + this.currentStep + ")" + this.chatId + " : 当前chat采集完毕");
          this.sendMessage("log", "nextStep", "当前chat采集完毕", null, false);
          this.broadcast({
            "result": "end",
          });
          await this.getNext();
          if (this.stop === 1) {
          if (this.apiCount < 300) {
              await this.nextStep();
            } else {
              this.stop = 2;
              // console.log("(" + this.currentStep + ")nextStep超出apiCount限制");
              this.sendMessage("log", "nextStep", "超出apiCount限制", "limit", true);
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
      } else {
        this.stop = 2;
        // console.log("(" + this.currentStep + ")nextStep超出apiCount限制");
        this.sendMessage("log", "nextStep", "超出apiCount限制", "limit", true);
        await this.close();
        // this.ctx.abort("reset");
      }
    } else if (this.stop === 2) {
      await this.updateConfig(1, 0);
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
    await this.getClient(1);
    await this.getChat(1);
    if (this.fromPeer) {
      if (this.chatId != this.lastChat) {
        await this.updateClient(1);
        this.lastChat = this.chatId;
      }
      if (this.stop === 1) {
        this.currentStep += 1;
        this.flood = await this.ctx.storage.get("client") || 0;
        if (this.flood > 0) {
          if (this.flood > new Date().getTime()) {
            const time = this.flood - new Date().getTime();
            // console.log("(" + this.currentStep + ") 还需等待" + Math.ceil(time / 1000) + "秒的洪水警告时间");
            this.sendMessage("log", "start", "还需等待" + Math.ceil(time / 1000) + "秒的洪水警告时间", "flood", true);
            await this.waitNext(time, true);
          } else {
            this.flood = 0;
            await this.ctx.storage.put("client", 0);
          }
        }
        if (!option || !option.chatId || !option.filterType || !option.reverse || !option.limited) {
          await this.getConfig(1, option);
        }
        // this.switchType();
        await this.getMessage(1);
        await scheduler.wait(5000);
        const messageArray = this.messageArray.slice();
        const messageLength = messageArray.length;
        this.messageArray = [];
        // console.log("(" + this.currentStep + ")messageLength : " + messageLength);  //测试
        // this.sendMessage("log", "start", "messageLength : " + messageLength, null, false);  //测试
        // if (messageLength > this.limit) {
        //   // console.log("(" + this.currentStep + ") messageLength比limit大");
        //   this.sendMessage("log", "start", "messageLength比limit大", null, true);
        // }
        if (messageLength && messageLength > 0) {
          const idArray = [];
          const fileIdArray = [];
          for (let messageIndex = 0; messageIndex < messageLength; messageIndex++) {
            if (messageArray[messageIndex]) {
              if (!messageArray[messageIndex].noforwards || messageArray[messageIndex].noforwards === false) {
                let fileId = null;
                const id = messageArray[messageIndex].id;
                // if (this.tg[clientIndex].filterType === 2) {
                //   if (messageArray[messageIndex].media) {
                //     if (messageArray[messageIndex].media.document) {
                //       const status = await this.getMedia(messageArray[messageIndex]);
                //       if (status === true) {
                //         fileId = messageArray[messageIndex].media.document.id;
                //       }
                //     }
                //   }
                // } else if (this.tg[clientIndex].filterType === 1) {
                //   if (messageArray[messageIndex].media) {
                //     if (messageArray[messageIndex].media.photo) {
                //       const status = await this.getPhoto(messageArray[messageIndex]);
                //       if (status === true) {
                //         fileId = messageArray[messageIndex].media.photo.id;
                //       }
                //     }
                //   }
                // } else if (this.tg[clientIndex].filterType === 3) {
                //   if (messageArray[messageIndex].media) {
                //     if (messageArray[messageIndex].media.document) {
                //       const mimeType = messageArray[messageIndex].media.document.mimeType;
                //       if (mimeType.startsWith("video/")) {
                //         const status = await this.getMedia(messageArray[messageIndex]);
                //         if (status === true) {
                //           fileId = messageArray[messageIndex].media.document.id;
                //         }
                //       } else if (mimeType.startsWith("image/")) {
                //         const status = await this.getPhoto(messageArray[messageIndex]);
                //         if (status === true) {
                //           fileId = messageArray[messageIndex].media.document.id;
                //         }
                //       // } else if (mimeType.startsWith("application/")) {
                //       // } else {
                //       }
                //     }
                //   }
                // } else if (this.tg[clientIndex].filterType === 4) {
                //   if (messageArray[messageIndex].media) {
                //     if (messageArray[messageIndex].media.document) {
                //       const status = await this.getMedia(messageArray[messageIndex]);
                //       if (status === true) {
                //         fileId = messageArray[messageIndex].media.document.id;
                //       }
                //     }
                //   }
                // } else if (this.tg[clientIndex].filterType === 0) {
                //   if (messageArray[messageIndex].media) {
                //     if (messageArray[messageIndex].media.document) {
                //       const id = messageArray[messageIndex].media.document.id;
                //       const status = await this.getMedia(messageArray[messageIndex]);
                //       if (status === true) {
                //         fileId = messageArray[messageIndex].media.document.id;
                //       }
                //     } else if (messageArray[messageIndex].media.photo) {
                //       const id = messageArray[messageIndex].media.photo.id;
                //       const status = await this.getPhoto(messageArray[messageIndex]);
                //       if (status === true) {
                //         fileId = messageArray[messageIndex].media.photo.id;
                //       }
                //     }
                //   }
                // }
                if (messageArray[messageIndex].media) {
                  const time = new Date().getTime();
                  this.broadcast({
                    "step": this.currentStep,
                    "operate": "start",
                    "chatId": this.chatId,
                    "offsetId": this.offsetId,
                    "messageId": id,
                    "status": "add",
                    "time": time,
                    "date": time,
                  });
                  if (messageArray[messageIndex].media.document) {
                    const mimeType = messageArray[messageIndex].media.document.mimeType;
                    if (mimeType.startsWith("video/")) {
                      const status = await this.getMedia(messageArray[messageIndex]);
                      // if (status === true) {
                        fileId = messageArray[messageIndex].media.document.id;
                      // }
                    } else if (mimeType.startsWith("image/")) {
                      const status = await this.getPhoto(messageArray[messageIndex]);
                      // if (status === true) {
                        fileId = messageArray[messageIndex].media.document.id;
                      // }
                    // } else if (mimeType.startsWith("application/")) {
                    // } else {
                    }
                  } else if (messageArray[messageIndex].media.photo) {
                    fileId = messageArray[messageIndex].media.photo.id;
                    const status = await this.getPhoto(messageArray[messageIndex]);
                    // if (status === true) {
                      fileId = messageArray[messageIndex].media.photo.id;
                    // }
                  }
                }
                if (id && fileId) {
                  idArray.push(id);
                  fileIdArray.push(fileId);
                }
              }
            }
          }
          await this.forwardMessage(idArray, fileIdArray);
          if (this.stop === 1) {
           if (this.apiCount < 300) {
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
        } else if (this.count > 0) {
          // this.offsetId += this.count;
          this.count = 0;
          await this.updateConfig(1, 0);
          this.errorCount += 1;
          // if (this.errorCount >= 3) {
          //   await this.ctx.storage.put(this.chatId, 0);
          //   // console.log("(" + this.currentStep + ") 连续3轮没有获取到包含有效媒体的消息");
          //   this.sendForward("start", "连续3轮没有获取到包含有效媒体的消息", 0, "error", true);
          //   await this.getNext();
          // } else {
          //   await this.ctx.storage.put(this.chatId, this.errorCount);
            // console.log("(" + this.currentStep + ") 第" + this.errorCount + "轮没有获取到包含有效媒体的消息");
            this.sendForward("start", "第" + this.errorCount + "轮没有获取到包含有效媒体的消息", 0, "error", true);
          // }
          if (this.stop === 1) {
           if (this.apiCount < 300) {
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
        } else {
          await this.updateConfig(1, 0);
          // console.log("(" + this.currentStep + ")" + this.chatId + " : 当前chat采集完毕");
          this.sendMessage("log", "start", "当前chat采集完毕", null, false);
          this.broadcast({
            "result": "end",
          });
          await this.getNext();
          if (this.stop === 1) {
          if (this.apiCount < 300) {
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
      chatResult = await this.env.MAINDB.prepare("SELECT Cindex, username, title, COUNT(*) FROM `FORWARDCHAT` WHERE `tgId` = 0 AND `channelId` = ? LIMIT 1;").bind(channelId).run();
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
      chatResult = await this.env.MAINDB.prepare("INSERT INTO `FORWARDCHAT` (tgId, channelId, accessHash, chatType, username, title, noforwards, current, photo, video, document, gif, currentForward, photoForward, videoForward, documentForward, gifForward, exist) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);").bind(0, channelId, accessHash, chatType, username, title, noforwards, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1).run();
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
      await this.ctx.storage.deleteAll();
      // console.log("删除cache成功");
      this.broadcast({
        "step": this.currentStep,
        "operate": "clearCache",
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
    //   await this.updateConfig(1);
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
