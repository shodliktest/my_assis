declare module "ws" {
  export default class WebSocket {
    constructor(address: string, options?: { headers?: Record<string, string> });
    send(data: string | Buffer): void;
    close(): void;
    on(event: "open", listener: () => void): this;
    on(event: "message", listener: (data: unknown, isBinary: boolean) => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "close", listener: () => void): this;
  }
}
