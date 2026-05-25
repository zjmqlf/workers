import { botString } from "../src/botString";

interface PagesEnv {
  WS_SERVER: DurableObjectNamespace;
}

export const onRequest: PagesFunction<PagesEnv> = async ({ request, env, params }) => {
  const upgrade = request.headers.get('Upgrade');
  if (upgrade !== 'websocket') {
    return new Response('expected WebSocket Upgrade', { status: 426 });
  }
  // const raw = Array.isArray(params.name) ? params.name[0] : params.name;
  // const gameName = (raw ?? '').toString().toLowerCase();

  const upgradeHeader = request.headers.get("Upgrade");
  if (!upgradeHeader || upgradeHeader !== "websocket") {
    return new Response("Worker expected Upgrade: websocket", {
        status: 426,
    });
  }
  const bot:string = params.bot;
  if (bot) {
    if (botString[bot]) {
      if (bot === "1") {
        const id = env.qqfile10_WebSocketServer.idFromName(botString[bot]);
        const stub = env.qqfile10_WebSocketServer.get(id);
        return stub.fetch(request);
      } else if (bot === "2") {
        const id = env.lockhive_WebSocketServer.idFromName(botString[bot]);
        const stub = env.lockhive_WebSocketServer.get(id);
        return stub.fetch(request);
      } else if (bot === "3") {
        const id = env.paniang_WebSocketServer.idFromName(botString[bot]);
        const stub = env.paniang_WebSocketServer.get(id);
        return stub.fetch(request);
      } else if (bot === "4") {
        const id = env.zyxfiles_WebSocketServer.idFromName(botString[bot]);
        const stub = env.zyxfiles_WebSocketServer.get(id);
        return stub.fetch(request);
      } else if (bot === "5") {
        const id = env.kodexfiles2_WebSocketServer.idFromName(botString[bot]);
        const stub = env.kodexfiles2_WebSocketServer.get(id);
        return stub.fetch(request);
      } else if (bot === "6") {
        const id = env.kodexmedia1_WebSocketServer.idFromName(botString[bot]);
        const stub = env.kodexmedia1_WebSocketServer.get(id);
        return stub.fetch(request);
      } else if (bot === "7") {
        const id = env.deanignitenations_WebSocketServer.idFromName(botString[bot]);
        const stub = env.deanignitenations_WebSocketServer.get(id);
        return stub.fetch(request);
      } else if (bot === "8") {
        const id = env.ryumasepongmilku_WebSocketServer.idFromName(botString[bot]);
        const stub = env.ryumasepongmilku_WebSocketServer.get(id);
        return stub.fetch(request);
      } else if (bot === "9") {
        const id = env.lunindiacipoksupretto_WebSocketServer.idFromName(botString[bot]);
        const stub = env.lunindiacipoksupretto_WebSocketServer.get(id);
        return stub.fetch(request);
      } else {
        return new Response("ERROR", { status: 400 });
      }
    } else {
      return new Response("No Bot find", { status: 404 });
    }
  } else {
    return new Response("No Bot select", { status: 404 });
  }
};
