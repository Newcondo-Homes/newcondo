import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/lib/uploadthing";

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  
  // Apply an (optional) custom config:
  config: {
    // Set custom limits if needed
    // uploadthingId: process.env.UPLOADTHING_APP_ID,
    // uploadthingSecret: process.env.UPLOADTHING_SECRET,
    // Configure CORS if needed
    // corsOptions: {
    //   origin: process.env.NODE_ENV === "development" ? "*" : "https://yourdomain.com",
    // },
  },
});