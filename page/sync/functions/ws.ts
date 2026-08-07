interface PagesEnv {
  WS_SERVER: DurableObjectNamespace;
}

// export const onRequest: PagesFunction<PagesEnv> = async (context) => {
export const onRequest: PagesFunction<PagesEnv> = async ({ request, env }) => {
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
  const id = env.sync_WebSocketServer.idFromName("sync");
  const stub = env.sync_WebSocketServer.get(id);
  return stub.fetch(request);
};
