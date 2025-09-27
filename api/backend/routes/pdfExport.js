import express from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.post('/export-dashboard', (req, res) => {
  try {
    const { ingredientes, userId } = req.body;
    
    if (!ingredientes || !Array.isArray(ingredientes) || ingredientes.length === 0) {
      return res.status(400).json({ error: 'Nenhum ingrediente selecionado' });
    }

    console.log('PDF Export requested for ingredients:', ingredientes);
    console.log('User ID:', userId);

    // Create PHP script content with real database queries
    const phpContent = `<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    // Load mPDF
    require_once __DIR__ . '/../phpapi/vendor/autoload.php';
    
    // Database connection
    $pdo = new PDO('mysql:host=localhost;dbname=crud;charset=utf8', 'root', 'fatec', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    // Set the ingredients and userId in POST array
    $_POST['ingredientes'] = array(
${ingredientes.map(ing => `        '${ing.replace(/'/g, "\\'").replace(/"/g, '\\"')}',`).join('\n')}
    );
    $_POST['userId'] = ${userId ? userId : 'null'};
    
    // Create mPDF instance
    $mpdf = new \\Mpdf\\Mpdf([
        'mode' => 'utf-8',
        'format' => 'A4',
        'margin_left' => 15,
        'margin_right' => 15,
        'margin_top' => 20,
        'margin_bottom' => 20,
        'margin_header' => 10,
        'margin_footer' => 10
    ]);
    
    $mpdf->SetTitle('Relatório de Custo Histórico dos Ingredientes');
    $mpdf->SetAuthor('Caderno do Chef');
    $mpdf->SetCreator('Sistema Caderno do Chef');
    
    // Start HTML content
    $currentDate = date('d/m/Y H:i:s');
    $html = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Relatório de Custo Histórico dos Ingredientes</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                color: #333;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #4CAF50;
                padding-bottom: 15px;
            }
            .header h1 {
                color: #4CAF50;
                margin: 0;
                font-size: 24px;
            }
            .header .date {
                color: #666;
                font-size: 12px;
                margin-top: 5px;
            }
            .ingredient-section {
                margin-bottom: 30px;
                page-break-inside: avoid;
            }
            .ingredient-title {
                background: #f8f9fa;
                padding: 10px;
                border-left: 4px solid #4CAF50;
                margin-bottom: 15px;
                font-size: 18px;
                font-weight: bold;
            }
            table {
                border-collapse: collapse;
                margin-bottom: 20px;
                width: 100%;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            th {
                background: #4CAF50;
                color: white;
                padding: 12px 8px;
                text-align: center;
                font-weight: bold;
                border: 1px solid #45a049;
            }
            td {
                border: 1px solid #ddd;
                padding: 10px 8px;
                text-align: center;
            }
            tr:nth-child(even) {
                background: #f9f9f9;
            }
            .no-data {
                color: #666;
                font-style: italic;
                text-align: center;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 4px;
            }
            .summary {
                background: #e8f5e8;
                padding: 10px;
                border-radius: 4px;
                margin-top: 10px;
                font-size: 12px;
            }
            .cost-high { color: #d32f2f; font-weight: bold; }
            .cost-medium { color: #f57c00; }
            .cost-low { color: #388e3c; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Relatório de Custo Histórico dos Ingredientes</h1>
            <div class="date">Gerado em: ' . $currentDate . '</div>
        </div>';
    
    $totalIngredients = count($_POST['ingredientes']);
    $processedCount = 0;
    
    foreach ($_POST['ingredientes'] as $nomeIngrediente) {
        $nomeEscapado = htmlspecialchars($nomeIngrediente);
        
        // Query for ingredient historical data from historico_alteracoes and preco tables
        $stmt = $pdo->prepare("
            SELECT h.Data_Alteracoes as createdAt, 
                   p.Custo_Unitario as costPerUnit, 
                   h.Taxa_Desperdicio as wasteRate, 
                   p.Unidade_Medida as Unidade_De_Medida,
                   i.ID_Ingredientes, 
                   i.Nome_Ingrediente
            FROM historico_alteracoes h
            JOIN ingredientes i ON h.ID_Ingrediente = i.ID_Ingredientes
            JOIN preco p ON p.ID_Historico = h.ID_Historico
            WHERE i.Nome_Ingrediente = ?
            " . ($_POST['userId'] ? " AND h.ID_Usuario = " . intval($_POST['userId']) : "") . "
            ORDER BY h.Data_Alteracoes ASC
        ");
        
        try {
            $stmt->execute([$nomeIngrediente]);
            $dados = $stmt->fetchAll();
            $processedCount++;
        } catch (PDOException $e) {
            error_log("Error fetching data for ingredient $nomeIngrediente: " . $e->getMessage());
            continue;
        }
        
        $html .= '<div class="ingredient-section">';
        $html .= "<div class='ingredient-title'>$nomeEscapado</div>";
        
        if (!$dados || count($dados) === 0) {
            $html .= '<div class="no-data">Sem histórico encontrado para este ingrediente.</div>';
            $html .= '</div>';
            continue;
        }
        
        $html .= '<table>';
        $html .= '<thead>';
        $html .= '<tr><th>Data</th><th>Custo Unitário</th><th>Taxa de Desperdício (%)</th><th>Unidade</th></tr>';
        $html .= '</thead>';
        $html .= '<tbody>';
        
        $custos = [];
        foreach ($dados as $linha) {
            $data = 'N/A';
            if (!empty($linha['createdAt'])) {
                $dataObj = new DateTime($linha['createdAt']);
                $data = $dataObj->format('d/m/Y');
            }
            
            $custo = floatval($linha['costPerUnit'] ?? 0);
            $custos[] = $custo;
            $custoFormatado = number_format($custo, 2, ',', '.');
            
            $desperdicio = floatval($linha['wasteRate'] ?? 0);
            $desperdicioFormatado = number_format($desperdicio, 1, ',', '.');
            
            $unidade = htmlspecialchars($linha['Unidade_De_Medida'] ?? 'N/A');
            
            // Color coding based on cost
            $costClass = '';
            if ($custo > 10) $costClass = 'cost-high';
            elseif ($custo > 5) $costClass = 'cost-medium';
            else $costClass = 'cost-low';
            
            $html .= "<tr>";
            $html .= "<td>$data</td>";
            $html .= "<td class='$costClass'>R$ $custoFormatado</td>";
            $html .= "<td>$desperdicioFormatado%</td>";
            $html .= "<td>$unidade</td>";
            $html .= "</tr>";
        }
        
        $html .= '</tbody>';
        $html .= '</table>';
        
        // Add summary statistics
        if (!empty($custos)) {
            $custoMinimo = min($custos);
            $custoMaximo = max($custos);
            $custoMedio = array_sum($custos) / count($custos);
            
            $html .= '<div class="summary">';
            $html .= '<strong>Resumo:</strong> ';
            $html .= 'Custo mínimo: R$ ' . number_format($custoMinimo, 2, ',', '.') . ' | ';
            $html .= 'Custo máximo: R$ ' . number_format($custoMaximo, 2, ',', '.') . ' | ';
            $html .= 'Custo médio: R$ ' . number_format($custoMedio, 2, ',', '.') . ' | ';
            $html .= 'Total de registros: ' . count($dados);
            $html .= '</div>';
        }
        
        $html .= '</div>';
    }
    
    $html .= '</body></html>';
    
    $mpdf->WriteHTML($html);
    echo $mpdf->Output('', 'S');
    
} catch (Exception $e) {
    file_put_contents(__DIR__ . '/../../temp/pdf_error.log', 'Error: ' . $e->getMessage() . "\nTrace: " . $e->getTraceAsString());
    echo 'Error: ' . $e->getMessage();
    exit(1);
}
?>`;

    // Ensure temp directory exists
    const tempDir = path.resolve(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Write PHP script to temporary file
    const tempScriptPath = path.resolve(tempDir, `export_${Date.now()}.php`);
    fs.writeFileSync(tempScriptPath, phpContent, 'utf8');
    
    console.log(`Executing PHP script: ${tempScriptPath}`);
    
    // Execute the PHP script
    exec(`php "${tempScriptPath}"`, { encoding: 'binary', maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      // Clean up temporary file
      if (fs.existsSync(tempScriptPath)) {
        fs.unlinkSync(tempScriptPath);
      }
      
      if (error) {
        console.error('PHP execution error:', error);
        return res.status(500).json({ error: 'Erro ao executar PHP: ' + error.message });
      }
      
      if (stderr && stderr.trim()) {
        console.error('PHP stderr:', stderr);
        return res.status(500).json({ error: 'Erro no PHP: ' + stderr });
      }
      
      if (!stdout || stdout.length < 100) {
        console.error('Empty or small PDF output. Length:', stdout ? stdout.length : 0);
        return res.status(500).json({ error: 'PDF output is empty or invalid' });
      }
      
      console.log('PDF generated successfully. Size:', stdout.length, 'bytes');
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio_ingredientes_${new Date().toISOString().split('T')[0]}.pdf"`);
      res.setHeader('Content-Length', stdout.length);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      
      // Send PDF as binary
      res.end(Buffer.from(stdout, 'binary'));
    });
    
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
});

export default router;