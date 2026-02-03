import express, { type Request, type Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'node:path';
import { app, ipcMain } from 'electron';
import type { Server } from 'node:http';
import * as databaseService from './databaseService';
import * as settingsService from './settingsService';
import type { Question, Settings, ExamResult } from '../../shared/types';

let server: Server | null = null;
let expressApp: express.Application | null = null;
const DEFAULT_PORT = 3000;

export const webServerService = {
  start: async (port: number = DEFAULT_PORT): Promise<number> => {
    if (server) {
      console.log('Web server already running');
      return port;
    }

    expressApp = express();

    // Middleware
    expressApp.use(cors());
    expressApp.use(bodyParser.json());
    expressApp.use(bodyParser.urlencoded({ extended: true }));

    // Serve static files from renderer directory in production
    const rendererPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'dist-renderer')
      : path.join(__dirname, '../../renderer');

    expressApp.use(express.static(rendererPath));

    // API Routes
    // Get all questions
    expressApp.get('/api/questions', async (_req: Request, res: Response) => {
      try {
        const questions = await databaseService.getAllQuestions();
        res.json({ success: true, data: questions });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });

    // Search questions
    expressApp.get('/api/questions/search', async (req: Request, res: Response) => {
      try {
        const queryParam = req.query.q;
        const query = Array.isArray(queryParam) ? queryParam[0] : queryParam;
        if (!query || typeof query !== 'string') {
          return res.status(400).json({ success: false, error: 'Search query required' });
        }
        const questions = await databaseService.searchQuestions(query);
        res.json({ success: true, data: questions });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });

    // Get question by ID - Note: Not implemented in databaseService yet
    expressApp.get('/api/questions/:id', async (req: Request, res: Response) => {
      try {
        const idParam = req.params.id;
        const id = Number.parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
        const allQuestions = databaseService.getAllQuestions();
        const question = allQuestions.find(q => (q as any).id === id);
        if (!question) {
          return res.status(404).json({ success: false, error: 'Question not found' });
        }
        res.json({ success: true, data: question });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });

    // Get random questions for quiz
    expressApp.get('/api/questions/random/:count', async (req: Request, res: Response) => {
      try {
        const countParam = req.params.count;
        const count = Number.parseInt(Array.isArray(countParam) ? countParam[0] : countParam) || 10;
        const questions = await databaseService.getRandomQuestions(count);
        res.json({ success: true, data: questions });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });

    // Save exam result - Note: Not fully implemented in databaseService yet
    expressApp.post('/api/results', async (req: Request, res: Response) => {
      try {
        // For now, just acknowledge receipt
        res.json({ success: true, message: 'Result saving not yet implemented' });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });

    // Get exam results - Note: Not implemented in databaseService yet
    expressApp.get('/api/results', async (_req: Request, res: Response) => {
      try {
        // Return empty array for now
        res.json({ success: true, data: [] });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });

    // Get settings
    expressApp.get('/api/settings', async (_req: Request, res: Response) => {
      try {
        const settings = settingsService.getSettings();
        res.json({ success: true, data: settings });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });

    // Update settings
    expressApp.post('/api/settings', async (req: Request, res: Response) => {
      try {
        const settings: Settings = req.body;
        settingsService.updateSettings(settings);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });

    // Get statistics
    expressApp.get('/api/statistics', async (_req: Request, res: Response) => {
      try {
        const stats = await databaseService.getStatistics();
        res.json({ success: true, data: stats });
      } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
      }
    });

    // Serve mobile-optimized HTML for mobile devices
    expressApp.get('/', (req: Request, res: Response) => {
      const userAgent = req.headers['user-agent'] || '';
      const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);
      
      if (isMobile) {
        res.sendFile(path.join(rendererPath, 'mobile.html'));
      } else {
        res.sendFile(path.join(rendererPath, 'index.html'));
      }
    });

    // Catch-all route for SPA
    expressApp.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(rendererPath, 'index.html'));
    });

    // Start server with port fallback
    return new Promise((resolve, reject) => {
      const tryPort = (currentPort: number, maxAttempts = 10) => {
        if (maxAttempts === 0) {
          reject(new Error('Could not find available port'));
          return;
        }

        const serverInstance = expressApp!.listen(currentPort, () => {
          server = serverInstance;
          console.log(`Web server started on port ${currentPort}`);
          console.log(`Access at: http://localhost:${currentPort}`);
          resolve(currentPort);
        }).on('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE') {
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

  stop: async (): Promise<void> => {
    if (server) {
      return new Promise((resolve) => {
        server!.close(() => {
          console.log('Web server stopped');
          server = null;
          expressApp = null;
          resolve();
        });
      });
    }
  },

  isRunning: (): boolean => {
    return server !== null;
  },

  getPort: (): number | null => {
    if (server && server.address()) {
      const address = server.address();
      if (typeof address === 'object' && address !== null) {
        return address.port;
      }
    }
    return null;
  },
};

// IPC handlers for web server control
ipcMain.handle('web-server:start', async (_event, port?: number) => {
  try {
    const actualPort = await webServerService.start(port || DEFAULT_PORT);
    return { success: true, port: actualPort };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('web-server:stop', async () => {
  try {
    await webServerService.stop();
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('web-server:status', async () => {
  return {
    isRunning: webServerService.isRunning(),
    port: webServerService.getPort(),
  };
});
