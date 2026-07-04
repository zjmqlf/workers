import { botString } from "../../src/botString";

interface PagesEnv {
  WS_SERVER: DurableObjectNamespace;
}

// export const onRequest: PagesFunction<PagesEnv> = async (context) => {
export const onRequest: PagesFunction<PagesEnv> = async ({ request, env, params }) => {
  const upgrade = request.headers.get("Upgrade");
  if (upgrade !== "websocket") {
    return new Response("expected WebSocket Upgrade", { status: 426 });
  }
  const upgradeHeader = request.headers.get("Upgrade");
  if (!upgradeHeader || upgradeHeader !== "websocket") {
    return new Response("Worker expected Upgrade: websocket", {
        status: 426,
    });
  }
  const envString = {
    "0": env,
    "1": env.qqfile_WebSocketServer,
    // "2": env.lockhive_WebSocketServer,
    "2": env.fileport_WebSocketServer,
    "3": env.tebiejie_WebSocketServer,
    "4": env.xiumi_WebSocketServer,
    "5": env.wenjianji_WebSocketServer,
    "6": env.zyxfiles_WebSocketServer,
    "7": env.aotem_WebSocketServer,
    "8": env.jiematop_WebSocketServer,
    "9": env.uujie_WebSocketServer,
    "10": env.safsadf_WebSocketServer,
    "11": env.kodexfiles2_WebSocketServer,
    "12": env.lunindiacipoksupretto_WebSocketServer,
    "13": env.paniang_WebSocketServer,
    "14": env.ryumasepongmilku_WebSocketServer,
    "15": env.hijautebal_WebSocketServer,
    "16": env.fileshubro_WebSocketServer,
    "17": env.filespanindo_WebSocketServer,
    "18": env.kodexchatsind_WebSocketServer,
    "19": env.massfilesstore_WebSocketServer,
    "20": env.steviarchiver_WebSocketServer,
  };
  // const bot:string = context.params.bot;
  const bot:string = params.bot;
  // console.log(bot);  //测试
  // console.log(botString[bot]);  //测试
  // console.log(JSON.stringify(context.params.catchall);
  if (bot) {
    if (botString[bot]) {
      const id = envString[bot].idFromName(botString[bot]);
      const stub = envString[bot].get(id);
      return stub.fetch(request);
    } else {
      return new Response("No Bot find", { status: 404 });
    }
  } else {
    return new Response("No Bot select", { status: 404 });
  }
};
