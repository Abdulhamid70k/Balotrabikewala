app.use(
  cors({
    origin: (origin, callback) => {
      // No origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      
      // Allowed conditions
      if (
        origin === "http://localhost:5173" ||
        origin.endsWith(".vercel.app") ||        // ← saare vercel subdomains
        origin === process.env.CLIENT_URL
      ) {
        return callback(null, true);
      }
      
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// OPTIONS preflight ke liye — CORS se pehle nahi, baad mein
app.options("*", cors());