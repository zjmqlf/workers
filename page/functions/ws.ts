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
  // if (!gameName) return new Response('empty game name', { status: 400 });
  // const id = env.GAME_ROOM.idFromName(gameName);
  // const stub = env.GAME_ROOM.get(id);
  // return stub.fetch(request);

  const upgradeHeader = request.headers.get("Upgrade");
  if (!upgradeHeader || upgradeHeader !== "websocket") {
    return new Response("Worker expected Upgrade: websocket", {
        status: 426,
    });
  }
  const id = env.WEBSOCKET_SERVER.idFromName("ws");
  const stub = env.WEBSOCKET_SERVER.get(id);
  return stub.fetch(request);
};
