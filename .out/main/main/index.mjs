import { app, BrowserWindow, ipcMain, dialog, net } from "electron";
import path$1, { join } from "node:path";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import initSqlJs from "sql.js";
import * as fs from "fs";
import * as path from "path";
import Store from "electron-store";
import * as XLSX from "xlsx";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
function makeAppWithSingleInstanceLock(fn) {
  const isPrimaryInstance = app.requestSingleInstanceLock();
  !isPrimaryInstance ? app.quit() : fn();
}
const ENVIRONMENT = {
  IS_DEV: process.env.NODE_ENV === "development"
};
const PLATFORM = {
  IS_MAC: process.platform === "darwin",
  IS_WINDOWS: process.platform === "win32",
  IS_LINUX: process.platform === "linux"
};
function ignoreConsoleWarnings(warningsToIgnore) {
  const originalEmitWarning = process.emitWarning;
  process.emitWarning = (warning, ...args) => {
    if (typeof warning === "string" && warningsToIgnore.length > 0 && warningsToIgnore.some((ignoredWarning) => warning.includes(ignoredWarning))) {
      return;
    }
    originalEmitWarning(warning, ...args);
  };
}
const displayName = "quiz";
const name = "quiz";
const author$1 = { "name": "Dalton Menezes" };
const author = author$1.name;
const authorInKebabCase = author.replace(/\s+/g, "-");
const appId = `com.${authorInKebabCase}.${name}`.toLowerCase();
function makeAppId(id = appId) {
  return id;
}
function waitFor(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
ignoreConsoleWarnings(["Manifest version 2 is deprecated"]);
async function makeAppSetup(createWindow2) {
  let window = await createWindow2();
  app.on("activate", async () => {
    const windows = BrowserWindow.getAllWindows();
    if (!windows.length) {
      window = await createWindow2();
    } else {
      for (window of windows.reverse()) {
        window.restore();
      }
    }
  });
  app.on(
    "web-contents-created",
    (_, contents) => contents.on(
      "will-navigate",
      (event, _2) => !ENVIRONMENT.IS_DEV && event.preventDefault()
    )
  );
  app.on("window-all-closed", () => !PLATFORM.IS_MAC && app.quit());
  return window;
}
PLATFORM.IS_LINUX && app.disableHardwareAcceleration();
PLATFORM.IS_WINDOWS && app.setAppUserModelId(ENVIRONMENT.IS_DEV ? process.execPath : makeAppId());
app.commandLine.appendSwitch("force-color-profile", "srgb");
function createWindow({ id, ...settings }) {
  const window = new BrowserWindow(settings);
  if (ENVIRONMENT.IS_DEV) {
    window.loadURL(`http://localhost:4927/${id}`);
  } else {
    window.loadFile(join(__dirname, "../renderer/index.html"), {
      hash: `/${id}`
    });
  }
  window.on("closed", window.destroy);
  return window;
}
async function MainWindow() {
  const window = createWindow({
    id: "main",
    title: displayName,
    width: 1200,
    height: 800,
    show: true,
    center: true,
    movable: true,
    resizable: true,
    alwaysOnTop: false,
    autoHideMenuBar: true,
    backgroundColor: "#000000",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  window.webContents.on("did-finish-load", () => {
    if (ENVIRONMENT.IS_DEV) {
      window.webContents.openDevTools({ mode: "detach" });
    }
  });
  window.on("close", () => {
    for (const window2 of BrowserWindow.getAllWindows()) {
      window2.destroy();
    }
  });
  return window;
}
let db = null;
let SQL = null;
const DB_PATH = path.join(app.getPath("userData"), "quiz-app.db");
async function initializeDatabase() {
  try {
    SQL = await initSqlJs({
      locateFile: (file) => {
        if (app.isPackaged) {
          return path.join(process.resourcesPath, "app.asar.unpacked/node_modules/sql.js/dist", file);
        }
        return path.join(__dirname, "../../sql.js/dist", file);
      }
    });
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
      createTables();
      saveDatabase();
    }
    console.log("Database initialized at:", DB_PATH);
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}
function createTables() {
  if (!db) throw new Error("Database not initialized");
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      题干 TEXT NOT NULL,
      选项A TEXT NOT NULL,
      选项B TEXT NOT NULL,
      选项C TEXT,
      选项D TEXT,
      参考答案 TEXT NOT NULL,
      分类 TEXT,
      题型 TEXT,
      注释 TEXT,
      难度 TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      user_answer TEXT,
      is_correct INTEGER DEFAULT 0,
      attempt_count INTEGER DEFAULT 0,
      last_attempt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS mistake_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS mock_exam_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER NOT NULL,
      score REAL NOT NULL,
      duration INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS mock_exam_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      user_answer TEXT,
      is_correct INTEGER DEFAULT 0,
      FOREIGN KEY (exam_id) REFERENCES mock_exam_results(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    )
  `);
  console.log("Database tables created");
}
function saveDatabase() {
  if (!db) throw new Error("Database not initialized");
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}
function importQuestions(questions) {
  if (!db) {
    return { success: false, count: 0, error: "Database not initialized" };
  }
  try {
    db.run("DELETE FROM questions");
    const stmt = db.prepare(`
      INSERT INTO questions (题干, 选项A, 选项B, 选项C, 选项D, 参考答案, 分类, 题型, 注释, 难度)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const q of questions) {
      stmt.run([
        q.题干,
        q.选项A,
        q.选项B,
        q.选项C || "",
        q.选项D || "",
        q.参考答案,
        q.分类 || null,
        q.题型 || null,
        q.注释 || null,
        q.难度 || null
      ]);
    }
    stmt.free();
    saveDatabase();
    return { success: true, count: questions.length };
  } catch (error) {
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
function getAllQuestions() {
  if (!db) return [];
  const stmt = db.prepare("SELECT * FROM questions");
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();
  return results;
}
function getQuestionsByCategory(category) {
  if (!db) return [];
  const stmt = db.prepare("SELECT * FROM questions WHERE 分类 = ?");
  stmt.bind([category]);
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();
  return results;
}
function getQuestionsByType(type) {
  if (!db) return [];
  const stmt = db.prepare("SELECT * FROM questions WHERE 题型 = ?");
  stmt.bind([type]);
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();
  return results;
}
function getRandomQuestions(count) {
  if (!db) return [];
  const stmt = db.prepare("SELECT * FROM questions ORDER BY RANDOM() LIMIT ?");
  stmt.bind([count]);
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();
  return results;
}
function getMistakeQuestions() {
  if (!db) return [];
  const stmt = db.prepare(`
    SELECT DISTINCT q.* FROM questions q
    INNER JOIN user_progress up ON q.id = up.question_id
    WHERE up.is_correct = 0
    ORDER BY up.last_attempt DESC
  `);
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();
  return results;
}
function getFavoriteQuestions() {
  if (!db) return [];
  const stmt = db.prepare(`
    SELECT q.* FROM questions q
    INNER JOIN favorites f ON q.id = f.question_id
    ORDER BY f.created_at DESC
  `);
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();
  return results;
}
function searchQuestions(keyword) {
  if (!db) return [];
  const pattern = `%${keyword}%`;
  const stmt = db.prepare(`
    SELECT * FROM questions 
    WHERE 题干 LIKE ? OR 注释 LIKE ?
  `);
  stmt.bind([pattern, pattern]);
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();
  return results;
}
function recordAnswer(questionId, userAnswer, isCorrect) {
  if (!db) {
    return { success: false, error: "Database not initialized" };
  }
  try {
    const checkStmt = db.prepare("SELECT id, attempt_count FROM user_progress WHERE question_id = ?");
    checkStmt.bind([questionId]);
    if (checkStmt.step()) {
      const row = checkStmt.getAsObject();
      const attemptCount = row.attempt_count + 1;
      db.run(
        `UPDATE user_progress 
         SET user_answer = ?, is_correct = ?, attempt_count = ?, last_attempt = CURRENT_TIMESTAMP
         WHERE question_id = ?`,
        [userAnswer, isCorrect ? 1 : 0, attemptCount, questionId]
      );
    } else {
      db.run(
        `INSERT INTO user_progress (question_id, user_answer, is_correct, attempt_count)
         VALUES (?, ?, ?, 1)`,
        [questionId, userAnswer, isCorrect ? 1 : 0]
      );
    }
    checkStmt.free();
    saveDatabase();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
function toggleFavorite(questionId) {
  if (!db) {
    return { success: false, isFavorite: false, error: "Database not initialized" };
  }
  try {
    const checkStmt = db.prepare("SELECT id FROM favorites WHERE question_id = ?");
    checkStmt.bind([questionId]);
    const exists = checkStmt.step();
    checkStmt.free();
    if (exists) {
      db.run("DELETE FROM favorites WHERE question_id = ?", [questionId]);
      saveDatabase();
      return { success: true, isFavorite: false };
    } else {
      db.run("INSERT INTO favorites (question_id) VALUES (?)", [questionId]);
      saveDatabase();
      return { success: true, isFavorite: true };
    }
  } catch (error) {
    return {
      success: false,
      isFavorite: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
function isFavorite(questionId) {
  if (!db) return false;
  const stmt = db.prepare("SELECT id FROM favorites WHERE question_id = ?");
  stmt.bind([questionId]);
  const exists = stmt.step();
  stmt.free();
  return exists;
}
function saveMistakeNote(questionId, note) {
  if (!db) {
    return { success: false, error: "Database not initialized" };
  }
  try {
    const checkStmt = db.prepare("SELECT id FROM mistake_notes WHERE question_id = ?");
    checkStmt.bind([questionId]);
    if (checkStmt.step()) {
      db.run(
        "UPDATE mistake_notes SET note = ?, updated_at = CURRENT_TIMESTAMP WHERE question_id = ?",
        [note, questionId]
      );
    } else {
      db.run("INSERT INTO mistake_notes (question_id, note) VALUES (?, ?)", [questionId, note]);
    }
    checkStmt.free();
    saveDatabase();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
function getMistakeNote(questionId) {
  if (!db) return null;
  const stmt = db.prepare("SELECT note FROM mistake_notes WHERE question_id = ?");
  stmt.bind([questionId]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row.note;
  }
  stmt.free();
  return null;
}
function getCategories() {
  if (!db) return [];
  const stmt = db.prepare(`
    SELECT 分类 as category, COUNT(*) as count 
    FROM questions 
    WHERE 分类 IS NOT NULL AND 分类 != ""
    GROUP BY 分类
    ORDER BY 分类
  `);
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push({
      category: row.category,
      count: row.count
    });
  }
  stmt.free();
  return results;
}
function getStatistics() {
  if (!db) {
    return {
      totalQuestions: 0,
      attemptedQuestions: 0,
      correctAnswers: 0,
      mistakeCount: 0,
      favoriteCount: 0
    };
  }
  const totalStmt = db.prepare("SELECT COUNT(*) as count FROM questions");
  totalStmt.step();
  const totalQuestions = totalStmt.getAsObject().count || 0;
  totalStmt.free();
  const attemptedStmt = db.prepare("SELECT COUNT(DISTINCT question_id) as count FROM user_progress");
  attemptedStmt.step();
  const attemptedQuestions = attemptedStmt.getAsObject().count || 0;
  attemptedStmt.free();
  const correctStmt = db.prepare("SELECT COUNT(*) as count FROM user_progress WHERE is_correct = 1");
  correctStmt.step();
  const correctAnswers = correctStmt.getAsObject().count || 0;
  correctStmt.free();
  const mistakeStmt = db.prepare("SELECT COUNT(DISTINCT question_id) as count FROM user_progress WHERE is_correct = 0");
  mistakeStmt.step();
  const mistakeCount = mistakeStmt.getAsObject().count || 0;
  mistakeStmt.free();
  const favoriteStmt = db.prepare("SELECT COUNT(*) as count FROM favorites");
  favoriteStmt.step();
  const favoriteCount = favoriteStmt.getAsObject().count || 0;
  favoriteStmt.free();
  return {
    totalQuestions,
    attemptedQuestions,
    correctAnswers,
    mistakeCount,
    favoriteCount
  };
}
function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
  }
}
const schema = {
  lastFilePath: {
    type: "string",
    default: ""
  },
  theme: {
    type: "string",
    enum: ["light", "dark", "eye-care"],
    default: "light"
  },
  showAnswerDirectly: {
    type: "boolean",
    default: false
  },
  aiConfig: {
    type: "object",
    properties: {
      baseUrl: { type: "string", default: "http://127.0.0.1:8045/v1" },
      apiKey: { type: "string", default: "sk-b4d2fda36ce5455f80071026fed7469a" },
      model: { type: "string", default: "gemini-3-flash" }
    },
    default: {
      baseUrl: "http://127.0.0.1:8045/v1",
      apiKey: "sk-b4d2fda36ce5455f80071026fed7469a",
      model: "gemini-3-flash"
    }
  },
  sequentialProgress: {
    type: "object",
    properties: {
      lastQuestionIndex: { type: "number", default: 0 }
    },
    default: {
      lastQuestionIndex: 0
    }
  },
  categoryProgress: {
    type: "object",
    default: {}
  },
  aiExplanations: {
    type: "object",
    default: {}
  }
};
let store = null;
function initializeSettings() {
  store = new Store({ schema });
}
function getSettings() {
  if (!store) initializeSettings();
  return store.store;
}
function updateSettings(settings) {
  if (!store) initializeSettings();
  store.set(settings);
  return store.store;
}
function getSetting(key) {
  if (!store) initializeSettings();
  return store.get(key);
}
function setSetting(key, value) {
  if (!store) initializeSettings();
  store.set(key, value);
}
let server = null;
let expressApp = null;
const DEFAULT_PORT = 3e3;
const webServerService = {
  start: async (port = DEFAULT_PORT) => {
    if (server) {
      console.log("Web server already running");
      return port;
    }
    expressApp = express();
    expressApp.use(cors());
    expressApp.use(bodyParser.json());
    expressApp.use(bodyParser.urlencoded({ extended: true }));
    const rendererPath = app.isPackaged ? path$1.join(process.resourcesPath, "app.asar.unpacked", "dist-renderer") : path$1.join(__dirname, "../../renderer");
    expressApp.use(express.static(rendererPath));
    expressApp.get("/api/questions", async (_req, res) => {
      try {
        const questions = await getAllQuestions();
        res.json({ success: true, data: questions });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });
    expressApp.get("/api/questions/search", async (req, res) => {
      try {
        const queryParam = req.query.q;
        const query = Array.isArray(queryParam) ? queryParam[0] : queryParam;
        if (!query || typeof query !== "string") {
          return res.status(400).json({ success: false, error: "Search query required" });
        }
        const questions = await searchQuestions(query);
        res.json({ success: true, data: questions });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });
    expressApp.get("/api/questions/:id", async (req, res) => {
      try {
        const idParam = req.params.id;
        const id = Number.parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
        const allQuestions = getAllQuestions();
        const question = allQuestions.find((q) => q.id === id);
        if (!question) {
          return res.status(404).json({ success: false, error: "Question not found" });
        }
        res.json({ success: true, data: question });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });
    expressApp.get("/api/questions/random/:count", async (req, res) => {
      try {
        const countParam = req.params.count;
        const count = Number.parseInt(Array.isArray(countParam) ? countParam[0] : countParam) || 10;
        const questions = await getRandomQuestions(count);
        res.json({ success: true, data: questions });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });
    expressApp.post("/api/results", async (req, res) => {
      try {
        res.json({ success: true, message: "Result saving not yet implemented" });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });
    expressApp.get("/api/results", async (_req, res) => {
      try {
        res.json({ success: true, data: [] });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });
    expressApp.get("/api/settings", async (_req, res) => {
      try {
        const settings = getSettings();
        res.json({ success: true, data: settings });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });
    expressApp.post("/api/settings", async (req, res) => {
      try {
        const settings = req.body;
        updateSettings(settings);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });
    expressApp.get("/api/statistics", async (_req, res) => {
      try {
        const stats = await getStatistics();
        res.json({ success: true, data: stats });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });
    expressApp.get("/", (req, res) => {
      const userAgent = req.headers["user-agent"] || "";
      const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);
      if (isMobile) {
        res.sendFile(path$1.join(rendererPath, "mobile.html"));
      } else {
        res.sendFile(path$1.join(rendererPath, "index.html"));
      }
    });
    expressApp.get("*", (_req, res) => {
      res.sendFile(path$1.join(rendererPath, "index.html"));
    });
    return new Promise((resolve, reject) => {
      const tryPort = (currentPort, maxAttempts = 10) => {
        if (maxAttempts === 0) {
          reject(new Error("Could not find available port"));
          return;
        }
        const serverInstance = expressApp.listen(currentPort, () => {
          server = serverInstance;
          console.log(`Web server started on port ${currentPort}`);
          console.log(`Access at: http://localhost:${currentPort}`);
          resolve(currentPort);
        }).on("error", (err) => {
          if (err.code === "EADDRINUSE") {
            console.log(`Port ${currentPort} in use, trying ${currentPort + 1}`);
            tryPort(currentPort + 1, maxAttempts - 1);
          } else {
            reject(err);
          }
        });
      };
      tryPort(port);
    });
  },
  stop: async () => {
    if (server) {
      return new Promise((resolve) => {
        server.close(() => {
          console.log("Web server stopped");
          server = null;
          expressApp = null;
          resolve();
        });
      });
    }
  },
  isRunning: () => {
    return server !== null;
  },
  getPort: () => {
    if (server && server.address()) {
      const address = server.address();
      if (typeof address === "object" && address !== null) {
        return address.port;
      }
    }
    return null;
  }
};
ipcMain.handle("web-server:start", async (_event, port) => {
  try {
    const actualPort = await webServerService.start(port || DEFAULT_PORT);
    return { success: true, port: actualPort };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});
ipcMain.handle("web-server:stop", async () => {
  try {
    await webServerService.stop();
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});
ipcMain.handle("web-server:status", async () => {
  return {
    isRunning: webServerService.isRunning(),
    port: webServerService.getPort()
  };
});
function validateQuestion(row) {
  if (!row["题干"] || !row["参考答案"]) {
    return null;
  }
  if (!row["选项A"] || !row["选项B"]) {
    return null;
  }
  return {
    题干: String(row["题干"]).trim(),
    选项A: String(row["选项A"] || "").trim(),
    选项B: String(row["选项B"] || "").trim(),
    选项C: String(row["选项C"] || "").trim(),
    选项D: String(row["选项D"] || "").trim(),
    参考答案: String(row["参考答案"]).trim(),
    分类: row["分类"] ? String(row["分类"]).trim() : void 0,
    题型: row["题型"] ? String(row["题型"]).trim() : void 0,
    注释: row["注释"] ? String(row["注释"]).trim() : void 0,
    难度: row["难度"] ? String(row["难度"]).trim() : void 0
  };
}
async function selectExcelFile() {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Excel Files", extensions: ["xlsx", "xls"] },
      { name: "All Files", extensions: ["*"] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
}
function parseExcelFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        error: `File not found: ${filePath}`
      };
    }
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, {
      type: "buffer",
      cellDates: true,
      cellText: false
    });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return {
        success: false,
        error: "No sheets found in the Excel file"
      };
    }
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: ""
    });
    if (!rawData || rawData.length === 0) {
      return {
        success: false,
        error: "No data found in the Excel file"
      };
    }
    const questions = [];
    const errors = [];
    rawData.forEach((row, index) => {
      const question = validateQuestion(row);
      if (question) {
        questions.push(question);
      } else {
        errors.push(`Row ${index + 2}: Missing essential fields (题干 or 参考答案)`);
      }
    });
    if (questions.length === 0) {
      return {
        success: false,
        error: `No valid questions found. Errors:
${errors.join("\n")}`
      };
    }
    return {
      success: true,
      data: questions,
      filePath,
      error: errors.length > 0 ? `Skipped ${errors.length} invalid rows` : void 0
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to parse Excel file: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
function previewExcelFile(filePath, rowCount = 5) {
  const result = parseExcelFile(filePath);
  if (result.success && result.data) {
    return {
      ...result,
      data: result.data.slice(0, rowCount)
    };
  }
  return result;
}
async function getAiExplanation(question, answer, onStream) {
  const settings = getSettings();
  const { baseUrl, apiKey, model } = settings.aiConfig;
  if (!apiKey) {
    return {
      success: false,
      error: "API密钥缺失，请在设置中配置。"
    };
  }
  const prompt = `请详细解析以下题目：

**题目：**
${question}

**正确答案：**
${answer}

**解析要求：**
请按照以下结构提供详细的中文解析：

## 📝 正确答案
简要说明正确答案及其关键要点

## 🎯 核心知识点
说明本题考查的核心知识点和概念

## 💡 详细解析
1. **答案推理过程**：详细解释为什么选择这个答案，包括逻辑推理步骤
2. **关键依据**：列出支持该答案的关键依据和证据
3. **思路分析**：说明解题的思路和方法

## 📚 相关知识拓展
补充相关的背景知识、注意事项或易混淆点

## ⚠️ 常见误区
如有必要，说明其他常见错误选项及其错误原因

请使用清晰的Markdown格式，包括标题、列表、加粗等，让解析结构分明、易于理解。`;
  return new Promise((resolve) => {
    try {
      let url = baseUrl;
      if (!url.startsWith("http")) {
        url = `https://${url}`;
      }
      if (url.endsWith("/")) {
        url = url.slice(0, -1);
      }
      const endpoint = `${url}/chat/completions`;
      const request = net.request({
        method: "POST",
        url: endpoint,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        }
      });
      const useStream = !!onStream;
      const body = JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `你是一位资深的专业题目解析助手，具有以下特点：

**角色定位：**
- 深厚的学科知识背景
- 善于用通俗易懂的语言解释复杂概念
- 注重培养学生的解题思维和方法

**解析风格：**
- 使用中文进行所有解析
- 结构清晰、层次分明
- 善用Markdown格式增强可读性
- 注重知识点的系统性和关联性
- 既讲"是什么"，也讲"为什么"

**解析原则：**
1. 准确性：确保知识点准确无误
2. 全面性：涵盖核心知识和拓展内容
3. 易懂性：使用简洁明了的语言
4. 实用性：注重解题方法和技巧
5. 启发性：培养独立思考能力

请严格遵循用户要求的解析结构，提供高质量的中文解析内容。`
          },
          { role: "user", content: prompt }
        ],
        stream: useStream
      });
      request.write(body);
      request.on("response", (response) => {
        let data = "";
        let fullContent = "";
        response.on("data", (chunk) => {
          const chunkStr = chunk.toString();
          if (useStream) {
            const lines = chunkStr.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const jsonStr = line.slice(6).trim();
                if (jsonStr === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(jsonStr);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullContent += content;
                    onStream?.(content);
                  }
                } catch (e) {
                }
              }
            }
          } else {
            data += chunkStr;
          }
        });
        response.on("end", () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            try {
              if (useStream) {
                resolve({
                  success: true,
                  content: fullContent || "未生成解析内容。"
                });
              } else {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.message?.content;
                resolve({
                  success: true,
                  content: content || "未生成解析内容。"
                });
              }
            } catch (e) {
              resolve({
                success: false,
                error: "解析API响应失败。"
              });
            }
          } else {
            resolve({
              success: false,
              error: `API请求失败，状态码 ${response.statusCode}: ${data}`
            });
          }
        });
      });
      request.on("error", (error) => {
        resolve({
          success: false,
          error: `网络错误: ${error.message}`
        });
      });
      request.end();
    } catch (error) {
      resolve({
        success: false,
        error: `请求失败: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });
}
app.disableHardwareAcceleration();
function registerIpcHandlers() {
  ipcMain.handle("excel:select-file", async () => {
    try {
      const filePath = await selectExcelFile();
      return { success: true, filePath };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });
  ipcMain.handle("excel:parse-file", async (_event, filePath) => {
    try {
      return parseExcelFile(filePath);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });
  ipcMain.handle("excel:preview-file", async (_event, filePath, rowCount) => {
    try {
      return previewExcelFile(filePath, rowCount);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });
  ipcMain.handle("db:import-questions", async (_event, questions) => {
    return importQuestions(questions);
  });
  ipcMain.handle("db:get-all-questions", async () => {
    return getAllQuestions();
  });
  ipcMain.handle("db:get-questions-by-category", async (_event, category) => {
    return getQuestionsByCategory(category);
  });
  ipcMain.handle("db:get-questions-by-type", async (_event, type) => {
    return getQuestionsByType(type);
  });
  ipcMain.handle("db:get-random-questions", async (_event, count) => {
    return getRandomQuestions(count);
  });
  ipcMain.handle("db:get-mistake-questions", async () => {
    return getMistakeQuestions();
  });
  ipcMain.handle("db:get-favorite-questions", async () => {
    return getFavoriteQuestions();
  });
  ipcMain.handle("db:search-questions", async (_event, keyword) => {
    return searchQuestions(keyword);
  });
  ipcMain.handle("db:record-answer", async (_event, questionId, userAnswer, isCorrect) => {
    return recordAnswer(questionId, userAnswer, isCorrect);
  });
  ipcMain.handle("db:toggle-favorite", async (_event, questionId) => {
    return toggleFavorite(questionId);
  });
  ipcMain.handle("db:is-favorite", async (_event, questionId) => {
    return isFavorite(questionId);
  });
  ipcMain.handle("db:save-mistake-note", async (_event, questionId, note) => {
    return saveMistakeNote(questionId, note);
  });
  ipcMain.handle("db:get-mistake-note", async (_event, questionId) => {
    return getMistakeNote(questionId);
  });
  ipcMain.handle("db:get-categories", async () => {
    return getCategories();
  });
  ipcMain.handle("db:get-statistics", async () => {
    return getStatistics();
  });
  ipcMain.handle("settings:get", async () => {
    return getSettings();
  });
  ipcMain.handle("settings:update", async (_event, settings) => {
    return updateSettings(settings);
  });
  ipcMain.handle("settings:get-value", async (_event, key) => {
    return getSetting(key);
  });
  ipcMain.handle("settings:set-value", async (_event, key, value) => {
    setSetting(key, value);
    return { success: true };
  });
  ipcMain.handle("settings:get-theme", async () => {
    return getSetting("theme") || "light";
  });
  ipcMain.handle("settings:set-theme", async (_event, theme) => {
    setSetting("theme", theme);
    return { success: true };
  });
  ipcMain.handle("settings:save-sequential-progress", async (_event, index) => {
    setSetting("sequentialProgress", { lastQuestionIndex: index });
    return { success: true };
  });
  ipcMain.handle("settings:get-sequential-progress", async () => {
    return getSetting("sequentialProgress");
  });
  ipcMain.handle("settings:save-category-progress", async (_event, category, index) => {
    const categoryProgress = getSetting("categoryProgress") || {};
    categoryProgress[category] = index;
    setSetting("categoryProgress", categoryProgress);
    return { success: true };
  });
  ipcMain.handle("settings:get-category-progress", async (_event, category) => {
    const categoryProgress = getSetting("categoryProgress") || {};
    return categoryProgress[category] || 0;
  });
  ipcMain.handle("settings:save-ai-explanation", async (_event, questionId, explanation) => {
    const aiExplanations = getSetting("aiExplanations") || {};
    aiExplanations[questionId] = explanation;
    setSetting("aiExplanations", aiExplanations);
    return { success: true };
  });
  ipcMain.handle("settings:get-ai-explanation", async (_event, questionId) => {
    const aiExplanations = getSetting("aiExplanations") || {};
    return aiExplanations[questionId] || null;
  });
  ipcMain.handle("ai:get-explanation", async (event, question, answer, useStream = false) => {
    if (useStream) {
      return getAiExplanation(question, answer, (chunk) => {
        event.sender.send("ai:explanation-chunk", chunk);
      });
    } else {
      return getAiExplanation(question, answer);
    }
  });
}
makeAppWithSingleInstanceLock(async () => {
  await app.whenReady();
  await initializeDatabase();
  initializeSettings();
  registerIpcHandlers();
  try {
    const port = await webServerService.start();
    console.log(`Web server started on port ${port}`);
    console.log(`Access from mobile devices at: http://<your-local-ip>:${port}`);
  } catch (error) {
    console.error("Failed to start web server:", error);
  }
  const window = await makeAppSetup(MainWindow);
  if (ENVIRONMENT.IS_DEV) {
    window.webContents.once("devtools-opened", async () => {
      await waitFor(1e3);
      window.webContents.reload();
    });
  }
});
app.on("before-quit", () => {
  webServerService.stop();
  closeDatabase();
});
