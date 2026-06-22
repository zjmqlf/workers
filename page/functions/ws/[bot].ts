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
    "2": env.zyxfiles_WebSocketServer,
    "3": env.ryumasepongmilku_WebSocketServer,
    "4": env.lunindiacipoksupretto_WebSocketServer,
    "5": env.hijautebal_WebSocketServer,
    "6": env.fileshubro_WebSocketServer,
    "7": env.filespanindo_WebSocketServer,
    "8": env.kodexchatsind_WebSocketServer,
    "9": env.massfilesstore_WebSocketServer,
    "10": env.steviarchiver_WebSocketServer,
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
