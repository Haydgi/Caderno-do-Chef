import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get('/test-connection', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    timestamp: new Date().toISOString(),
    status: 'OK'
  });
});

router.post('/test-pdf-simple', (req, res) => {
  const { ingredientes } = req.body;
  
  console.log('Received ingredients:', ingredientes);
  
  // Simple response for testing
  res.json({
    message: 'PDF export request received',
    ingredients: ingredientes,
    count: ingredientes ? ingredientes.length : 0
  });
});

router.post('/test-php-exec', (req, res) => {
  const phpScript = path.resolve(__dirname, '../../temp/test-simple.php');
  
  console.log(`Executing PHP script: php "${phpScript}"`);
  
  exec(`php "${phpScript}"`, { encoding: 'binary', maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
    if (error) {
      console.error('PHP execution error:', error);
      return res.status(500).json({ error: 'PHP execution failed: ' + error.message });
    }
    
    if (stderr && stderr.trim()) {
      console.error('PHP stderr:', stderr);
      return res.status(500).json({ error: 'PHP error: ' + stderr });
    }
    
    if (!stdout || stdout.length < 100) {
      console.error('Empty or too small PDF output. Length:', stdout.length);
      return res.status(500).json({ error: 'PDF output is empty or invalid' });
    }
    
    console.log('PDF generated successfully. Size:', stdout.length, 'bytes');
    
    // Set headers for PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="test.pdf"');
    res.setHeader('Content-Length', stdout.length);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Send PDF as binary
    res.end(Buffer.from(stdout, 'binary'));
  });
});

export default router;