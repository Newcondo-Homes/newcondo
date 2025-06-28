// backend/gateway/src/types/gateway.ts
export interface ServiceConfig {
  name: string;
  url: string;
  healthEndpoint: string;
  timeout: number;
  retries: number;
}

export interface ProxyOptions {
  target: string;
  changeOrigin: boolean;
  pathRewrite?: { [key: string]: string };
  onError?: (err: any, req: any, res: any) => void;
  onProxyReq?: (proxyReq: any, req: any, res: any) => void;
  onProxyRes?: (proxyRes: any, req: any, res: any) => void;
}

export interface LoadBalancerConfig {
  strategy: "round-robin" | "least-connections" | "random";
  healthCheckInterval: number;
  healthCheckTimeout: number;
}
