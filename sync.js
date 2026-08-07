import { DurableObject } from "cloudflare:workers";

export class WebSocketServer extends DurableObject {
  // webSocket = [];
  ws = null;
  stop = 0;
  apiCount = 0;
  currentStep = 0;
  compress = false;
  batch = false;
  endChat = 0;
  lastChat = 0;
  limit = 100;
  count = 0;
  offsetId = 0;
  errorMessage = "Too many API requests by single Worker invocation. To configure this limit, refer to https://developers.cloudflare.com/workers/wrangler/configuration/#limits";
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
    // });

    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong"),
    );
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
      if (message.operate === "insertMedia") {
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
      } else if (message.operate === "insertMediaIndex") {
        if (this.cacheMessage) {
          if (message.offsetId === this.cacheMessage.offsetId) {
            if (message.status === "success") {
              this.cacheMessage["insertIndex"] = true;
            } else if (message.status === "error") {
              this.cacheMessage["insertIndex"] = false;
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

  sendGrid(operate, message, status, error) {
    this.broadcast({
      "step": this.currentStep,
      "operate": operate,
      "offsetId": this.offsetId,
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

  async getConfigError(tryCount, option) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")getConfig超出tryCount限制");
      this.sendLog("getConfig", "超出tryCount限制", null, true);
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
      configResult = await this.env.MAINDB.prepare("SELECT * FROM `CONFIG` WHERE `name` = 'hash' AND `tgId` = 0 LIMIT 1;").run();
    } catch (err) {
      // console.log("getConfig : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendLog("getConfig", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
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
        if (!option || !option.filterType) {
          if (result.filterType && result.filterType > 0 && result.filterType <= 9) {
            this.filterType = result.filterType;
          }
        }
        if (!option || !option.limited) {
          if (result.limited && result.limited > 0) {
            this.limit = result.limited;
          }
        }
      } else {
        // console.log("没有预设config");
        this.sendLog("getConfig", "没有预设config", null, false);
      }
    } else {
      // console.log("查询config失败");
      this.sendLog("getConfig", "查询config失败", null, true);
      await this.getConfigError(tryCount, option);
    }
  }

  async updateConfigError(tryCount) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")updateConfig超出tryCount限制");
      this.sendLog("updateConfig", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.updateConfig(tryCount + 1);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async updateConfig(tryCount) {
    this.apiCount += 1;
    let configResult = {};
    try {
      configResult = await this.env.MAINDB.prepare("UPDATE `CONFIG` SET `chatId` = ? WHERE `name` = 'hash' AND `tgId` = 0;").bind(this.chatId).run();
    } catch (err) {
      // console.log("updateConfig : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendLog("updateConfig", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.updateConfigError(tryCount);
      }
      return;
    }
    // console.log(configResult);  //测试
    if (configResult.success === true) {
      // console.log("更新config数据成功");
      this.sendLog("updateConfig", "更新config数据成功", null, false);
    } else {
      // console.log("更新config数据失败");
      this.sendLog("updateConfig", "更新config数据失败", null, true);
      await this.updateConfigError(tryCount);
    }
  }

  async countMedia() {
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
      this.sendLog("selectMediaIndex", "超出tryCount限制", null, true);
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
      mediaResult = await this.env.MAINDB.prepare("SELECT `id`, `accessHash` FROM `MEDIAINDEX` WHERE `Vindex` >= ? ORDER BY `Vindex` ASC LIMIT 100;").bind(this.offsetId).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : selectMediaIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendGrid("selectMediaIndex", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
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

  async insertMediaIndexError(tryCount, Vindex, id) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")insertMediaIndex超出tryCount限制");
      this.sendLog("insertMediaIndex", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.insertMediaIndex(tryCount + 1, Vindex, id);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async insertMediaIndex(tryCount, Vindex, id) {
    this.apiCount += 1;
    let indexResult = {};
    try {
      indexResult = await this.env.MAINDB.prepare("INSERT INTO `MEDIAINDEX` (Vindex, id) VALUES (?, ?);").bind(Vindex, id).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : insertMediaIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendGrid("insertMediaIndex", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.insertMediaIndexError(tryCount, Vindex, id);
      }
      return;
    }
    // console.log(indexResult);  //测试
    if (indexResult.success === true) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 插入mediaIndex数据成功");
      this.sendGrid("insertMediaIndex", "", "success", false);
    } else {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 插入mediaIndex数据失败");
      this.sendGrid("insertMediaIndex", "插入mediaIndex数据失败", "error", true);
      await this.insertMediaIndexError(tryCount, Vindex, id);
    }
  }

  async selectPhotoIndexError(tryCount, type) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")selectPhotoIndex超出tryCount限制");
      this.sendLog("selectPhotoIndex", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.selectPhotoIndex(tryCount + 1, type);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async selectPhotoIndex(tryCount, type) {
    this.apiCount += 1;
    let photoResult = {};
    try {
      photoResult = await this.env.MAINDB.prepare("SELECT `id`, `accessHash` FROM `PHOTOINDEX` WHERE `Pindex` >= ? ORDER BY `Pindex` ASC LIMIT 100;").bind(this.offsetId, type).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : selectPhotoIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendGrid("selectPhotoIndex", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.selectPhotoIndexError(tryCount, type);
      }
      return;
    }
    // console.log("photoResult : " + photoResult);  //测试
    if (photoResult.success === true) {
      if (photoResult.results && photoResult.results.length > 0) {
        return photoResult.results;
      }
    } else {
      await this.selectPhotoIndexError(tryCount, type);
    }
  }

  async insertPhotoIndexError(tryCount, Pindex, id, type) {
    if (tryCount === 5) {
      this.stop = 2;
      // console.log("(" + this.currentStep + ")insertPhotoIndex超出tryCount限制");
      this.sendLog("insertPhotoIndex", "超出tryCount限制", null, true);
      await this.close();
    } else {
      await scheduler.wait(10000);
      if (this.stop === 1) {
        await this.insertPhotoIndex(tryCount + 1, Pindex, id, type);
      } else if (this.stop === 2) {
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      }
    }
  }

  async insertPhotoIndex(tryCount, Pindex, id, type) {
    this.apiCount += 1;
    let photoResult = {};
    try {
      photoResult = await this.env.MAINDB.prepare("INSERT INTO `PHOTOINDEX` (Pindex, id, sizeType) VALUES (?, ?, ?);").bind(Pindex, id, type).run();
    } catch (err) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : insertPhotoIndex : " + err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err);
      this.sendGrid("insertPhotoIndex", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, "try", true);
      if (err.message === this.errorMessage) {
        this.stop = 2;
        this.broadcast({
          "result": "pause",
        });
        await this.close();
      } else {
        await this.insertPhotoIndexError(tryCount, Pindex, id, type);
      }
      return;
    }
    // console.log(photoResult);  //测试
    if (photoResult.success === true) {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 插入photoIndex数据成功");
      this.sendGrid("insertPhotoIndex", "", "success", false);
    } else {
      // console.log("(" + this.currentStep + ")[" + messageLength +"/" + messageIndex + "] " + this.offsetId + " : 插入photoIndex数据失败");
      this.sendGrid("insertPhotoIndex", "插入photoIndex数据失败", "error", true);
      await this.insertPhotoIndexError(tryCount, Pindex, id, type);
    }
  }

  async syncMediaIndex() {
    this.count = await this.countMedia();
    // console.log("mediaCount : " + this.count);  //测试
    this.sendLog("syncMediaIndex", "mediaCount : " + this.count, null, false);  //测试
    if (this.count < 0) {
      while (this.offsetId < this.count) {
        const results = await this.selectMediaIndex();
        const length = results.length;
        // console.log("mediaLength : " + length);  //测试
        this.sendLog("syncMediaIndex", "mediaLength : " + length, null, false);  //测试
        for (let index = 0; index < length; index++) {
          // console.log(JSON.stringify(results[index]));
          await this.ctx.storage.put(results[index].id, "[]");
          // this.sendLog("syncPhotoIndex", "id : " + results[index].id, null, false);  //测试
        }
        // await scheduler.wait(5000);  //测试
        this.offsetId += 100;
      }
    } else {
      console.log("mediaCount小于0");
    }
  }

  async syncPhotoIndex() {
    this.count = await this.countPhoto();
    // console.log("PhotoCount : " + this.count);  //测试
    this.sendLog("syncPhotoIndex", "mediaCount : " + this.count, null, false);  //测试
    if (this.count < 0) {
      while (this.offsetId < this.count) {
        const results = await this.selectPhotoIndex();
        const length = results.length;
        // console.log("photoLength : " + length);  //测试
        this.sendLog("syncPhotoIndex", "photoLength : " + length, null, false);  //测试
        for (let index = 0; index < length; index++) {
          // console.log(JSON.stringify(results[index]));
          await this.ctx.storage.put(results[index].id, "[]");
          // this.sendLog("syncPhotoIndex", "id : " + results[index].id, null, false);  //测试
        }
        // await scheduler.wait(5000);  //测试
        this.offsetId += 100;
      }
    } else {
      console.log("PhotoCount小于0");
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
    if (this.stop === 1) {
      this.ws.send(JSON.stringify({
        "step": this.currentStep,
        "operate": "start",
        "message": "服务已经运行过了",
        "error": true,
        "date": new Date().getTime(),
      }));
      return;
    }
    // this.stop = 1;
    await this.syncMediaIndex();
    this.offsetId = 0;
    await this.syncPhotoIndex();
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
        this.sendLog("webSocketMessage", err instanceof Error ? (err.name ? err.name + " : " : "") + err.message : err, null, true);
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
    // } else if (command === "clear") {
    //   await this.ctx.storage.deleteAll();
    //   // console.log("删除cache成功");
    //   this.broadcast({
    //     "step": this.currentStep,
    //     "operate": "clearCache",
    //     "message": "删除cache成功",
    //     "error": true,
    //     "date": new Date().getTime(),
    //   });
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
      const id = env.WEBSOCKET_SERVER.idFromName(env.APP_NAME);
      const stub = env.WEBSOCKET_SERVER.get(id);
      return stub.fetch(request);
    }

    return new Response("error");
  },
};
