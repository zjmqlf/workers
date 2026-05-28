import { botString } from "../../src/botString";
import { envString } from "../../src/botString";

interface PagesEnv {
  WS_SERVER: DurableObjectNamespace;
}

// export const onRequest: PagesFunction<PagesEnv> = async (context) => {
export const onRequest: PagesFunction<PagesEnv> = async ({ request, env, params }) => {
  const upgrade = request.headers.get('Upgrade');
  if (upgrade !== 'websocket') {
    return new Response('expected WebSocket Upgrade', { status: 426 });
  }
  const upgradeHeader = request.headers.get("Upgrade");
  if (!upgradeHeader || upgradeHeader !== "websocket") {
    return new Response("Worker expected Upgrade: websocket", {
        status: 426,
    });
  }
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
