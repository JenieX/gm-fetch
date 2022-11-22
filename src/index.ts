import { parseGMResponse } from "./utils";

export default async function GM_fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = new Request(input, init);

  let data: string | undefined;
  if (init?.body) {
    data = await request.text();
  }

  return await XHR(request, data);
}

function XHR(request: Request, data: string | undefined): Promise<Response> {
  return new Promise((resolve, reject) => {
    if (request.signal && request.signal.aborted) {
      return reject(new DOMException("Aborted", "AbortError"));
    }

    GM.xmlHttpRequest({
      url: request.url,
      method: gmXHRMethod(request.method.toUpperCase()),
      headers: toGmHeaders(request.headers),
      data: data,
      responseType: "blob",
      onload(res) {
        resolve(parseGMResponse(res));
      },
      onabort() {
        reject(new DOMException("Aborted", "AbortError"));
      },
      ontimeout() {
        reject(new TypeError("Network request failed, timeout"));
      },
      onerror(err) {
        reject(new TypeError("Failed to fetch: " + err.finalUrl));
      },
    });
  });
}

const httpMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "TRACE", "OPTIONS", "CONNECT"] as const;

// a ts type helper to narrow type
function includes<T extends U, U>(array: ReadonlyArray<T>, element: U): element is T {
  return array.includes(element as T);
}

function gmXHRMethod(method: string): typeof httpMethods[number] {
  if (includes(httpMethods, method)) {
    return method;
  }

  throw new Error(`unsupported http method ${method}`);
}

function toGmHeaders(h: Headers | undefined): { [header: string]: string } | undefined {
  if (!h) {
    return undefined;
  }

  const t: { [header: string]: string } = {};
  h.forEach((value, key) => {
    t[value] = key;
  });

  return t;
}
