<?php
// Headers will be set by Node.js when called via API
if (!isset($_POST)) {
    header('Content-Type: application/pdf');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }
}

require_once __DIR__ . '/vendor/autoload.php';

if (empty($_POST['ingredientes'])) {
    http_response_code(400);
    die(json_encode(['error' => 'Nenhum ingrediente selecionado']));
}

try {
    $pdo = new PDO('mysql:host=localhost;dbname=crud;charset=utf8', 'root', 'fatec', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'Erro na conexão com o banco: ' . $e->getMessage()]));
}

$ingredientes = array_map('trim', $_POST['ingredientes'] ?? []);

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
        tr:hover {
            background: #f5f5f5;
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
    </div>
';

$totalIngredients = count($ingredientes);
$processedCount = 0;

foreach ($ingredientes as $nome) {
    $nomeEscapado = htmlspecialchars($nome);
    
    // First, get the ingredient ID based on name and user ID  
    $stmtIngredient = $pdo->prepare("
        SELECT ID_Ingredientes 
        FROM ingredientes 
        WHERE Nome_Ingrediente = ? AND ID_Usuario = ?
    ");
    
    $stmtIngredient->execute([$nome, $_POST['userId'] ?? null]);
    $ingredientResult = $stmtIngredient->fetch();
    
    if (!$ingredientResult) {
        // No ingredient found for this user, skip
        $html .= '<div class="ingredient-section">';
        $html .= "<div class='ingredient-title'>$nomeEscapado</div>";
        $html .= '<div class="no-data">Ingrediente não encontrado para este usuário.</div>';
        $html .= '</div>';
        continue;
    }
    
    $idIngrediente = $ingredientResult['ID_Ingredientes'];
    
    // Now get historical data using the same structure as historicoingredientes.js
    $stmt = $pdo->prepare("
        SELECT 
            h.Preco AS costPerUnit,
            h.Taxa_Desperdicio AS wasteRate,
            h.Data_Alteracoes AS createdAt
        FROM historico_alteracoes h
        WHERE h.ID_Ingrediente = ? AND h.ID_Usuario = ?
        ORDER BY h.Data_Alteracoes ASC
    ");
    
    try {
        $stmt->execute([$idIngrediente, $_POST['userId'] ?? null]);
        $dados = $stmt->fetchAll();
        $processedCount++;
    } catch (PDOException $e) {
        error_log("Error fetching data for ingredient $nome: " . $e->getMessage());
        continue;
    }

    $html .= '<div class="ingredient-section">';
    $html .= "<div class='ingredient-title'>$nomeEscapado</div>";
    
    if (!$dados) {
        $html .= '<div class="no-data">Sem histórico encontrado para este ingrediente.</div>';
        $html .= '</div>';
        continue;
    }

    $html .= '<table>';
    $html .= '<thead>';
    $html .= '<tr><th>Data</th><th>Custo pela Unidade de Medida</th></tr>';
    $html .= '</thead>';
    $html .= '<tbody>';
    
    $custos = [];
    foreach ($dados as $linha) {
        $data = 'N/A';
        if (!empty($linha['createdAt'])) {
            $data = date('d/m/Y', strtotime($linha['createdAt']));
        }
        
        $custo = floatval($linha['costPerUnit'] ?? 0);
        $custos[] = $custo;
        $custoFormatado = number_format($custo, 2, ',', '.');
        
        // Color coding based on cost
        $costClass = '';
        if ($custo > 10) $costClass = 'cost-high';
        elseif ($custo > 5) $costClass = 'cost-medium';
        else $costClass = 'cost-low';
        
        $html .= "<tr>";
        $html .= "<td>$data</td>";
        $html .= "<td class='$costClass'>R$ $custoFormatado</td>";
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

// Create mPDF instance with better configuration
try {
    $mpdf = new \Mpdf\Mpdf([
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
    
    $mpdf->WriteHTML($html);
    $mpdf->Output('relatorio_ingredientes_' . date('Y-m-d_H-i-s') . '.pdf', 'I');
} catch (\Mpdf\MpdfException $e) {
    http_response_code(500);
    die(json_encode(['error' => 'Erro ao gerar PDF: ' . $e->getMessage()]));
}
