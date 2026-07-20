/** Money & misc formatters for the dashboard. */
export const ngn = (n: number) => "₦" + Math.abs(n).toLocaleString("en-NG");
export const signNgn = (n: number) => (n < 0 ? "−" : "+") + ngn(n);
export const hoursLabel = (h: number) => (h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h`);
export const minsLabel = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;
export const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
