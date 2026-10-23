export async function onRequest(context) {
  const url = new URL(context.request.url);
  const backendOrigin = 'https://gochina-portal.xz-sean-g.workers.dev';
  const targetUrl = `${backendOrigin}${url.pathname}${url.search}`;

  const request = new Request(targetUrl, {
    method: context.request.method,
    headers: context.request.headers,
    body: ['GET', 'HEAD'].includes(context.request.method) ? undefined : context.request.body,
    redirect: 'follow',
  });

  return fetch(request);
}
