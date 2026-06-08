import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { analyzeCriteriaDirect, analyzeVehiclePulseProxy } from "./src/domain/analysis/analysisPipelines";

// Ensure standard path resolutions in ES modules
const __dirname = path.dirname(new URL(import.meta.url).pathname);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Configure standard global middlewares
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // 2. Setup REST API Endpoints

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // API to fetch list of available golden cases
  app.get("/api/v1/golden-cases", (req, res) => {
    try {
      const fixturesDir = path.join(process.cwd(), "fixtures", "golden-cases");
      if (!fs.existsSync(fixturesDir)) {
        return res.json([]);
      }
      const files = fs.readdirSync(fixturesDir).filter((f) => f.endsWith(".json"));
      
      const cases = files.map((file) => {
        const filePath = path.join(fixturesDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        return {
          id: file.replace(".json", ""),
          label: file.replace(".json", "").replace(/-/g, " ").toUpperCase(),
          mode: data.mode,
          collision_type: data.scenario.collision_type,
          speed: data.scenario.vehicle_speed_kph,
          delta_v: data.scenario.delta_v_kph,
          belted: data.restraint ? data.restraint.belted : null,
          has_intrusion: !!(data.signals && data.signals.intrusion_cm)
        };
      });

      res.json(cases);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to list baseline profiles", details: err.message });
    }
  });

  // API to retrieve content of a specific golden case profile
  app.get("/api/v1/golden-cases/:id", (req, res) => {
    try {
      const caseId = req.params.id;
      const targetFile = path.join(process.cwd(), "fixtures", "golden-cases", `${caseId}.json`);
      if (!fs.existsSync(targetFile)) {
        return res.status(404).json({ error: `Scenario profile '${caseId}' not found` });
      }
      const fileContent = fs.readFileSync(targetFile, "utf-8");
      res.json(JSON.parse(fileContent));
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load scenario profile", details: err.message });
    }
  });

  // CORE ANALYSIS API: processes frontal or side collisions using direct/proxy modes
  app.post("/api/v1/injury-analysis", (req, res) => {
    try {
      const payload = req.body;
      if (!payload || !payload.mode) {
        return res.status(400).json({ error: "Invalid analysis payload: 'mode' is required" });
      }

      const mode = payload.mode;
      let result;
      if (mode === "criteria_direct") {
        result = analyzeCriteriaDirect(payload);
      } else if (mode === "vehicle_pulse_proxy") {
        result = analyzeVehiclePulseProxy(payload);
      } else {
        return res.status(400).json({ error: `Unsupported computational mode: '${mode}'` });
      }

      res.json(result);
    } catch (err: any) {
      console.error("Collision computation fault:", err);
      res.status(500).json({ 
        error: "Biomechanical crunch failed", 
        details: err.message, 
        stack: process.env.NODE_ENV !== "production" ? err.stack : undefined 
      });
    }
  });

  // 3. Mount UI assets / static paths
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode, mounting Vite dev server...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode, serving static UI...");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static frontend files from 'dist' directory
    app.use(express.static(distPath));
    
    // Serve index.html for Single Page App client routing fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // 4. Listen on standard network ports
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`====================================================`);
    console.log(`Collision Injury Analysis Server is running successfully.`);
    console.log(`Local and ingress routing bound: http://0.0.0.0:${PORT}`);
    console.log(`====================================================`);
  });
}

startServer();
