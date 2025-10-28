<?php
declare(strict_types=1);

$isCli = PHP_SAPI === 'cli';

if (!$isCli) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

require_once __DIR__ . '/vendor/autoload.php';

function respondError(string $message, int $statusCode = 500): void
{
    global $isCli;

    if ($isCli) {
        fwrite(STDERR, $message . PHP_EOL);
        exit(1);
    }

    if (!headers_sent()) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
    }

    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function formatDateTimeLabel(?string $value): string
{
    if (empty($value)) {
        return date('d/m/Y H:i:s');
    }

    try {
        $date = new DateTime($value);
        return $date->format('d/m/Y H:i:s');
    } catch (Exception $exception) {
        return date('d/m/Y H:i:s');
    }
}

function formatDateLabel(?string $value): string
{
    if (empty($value)) {
        return 'N/A';
    }

    try {
        $date = new DateTime($value);
        return $date->format('d/m/Y');
    } catch (Exception $exception) {
        return 'N/A';
    }
}

function formatMoney(float $value): string
{
    return number_format($value, 2, ',', '.');
}

function determineCostClass(float $value): string
{
    if ($value > 10) {
        return 'cost-high';
    }

    if ($value > 5) {
        return 'cost-medium';
    }

    return 'cost-low';
}

function sanitizeHtml(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function normalizeHistorico(array $items): array
{
    $normalized = [];

    foreach ($items as $item) {
        if (!is_array($item)) {
            continue;
        }

        $costRaw = $item['costPerUnit'] ?? null;
        $cost = is_numeric($costRaw) ? (float) $costRaw : 0.0;

        $normalized[] = [
            'createdAt' => $item['createdAt'] ?? null,
            'costPerUnit' => $cost,
        ];
    }

    return $normalized;
}

function renderSection(array $section): string
{
    $nome = sanitizeHtml((string) ($section['nome'] ?? 'Ingrediente'));
    $message = $section['message'] ?? null;
    $historico = normalizeHistorico($section['historico'] ?? []);

    $html = '<div class="ingredient-section">';
    $html .= "<div class='ingredient-title'>{$nome}</div>";

    if ($message !== null && trim((string) $message) !== '') {
        $html .= '<div class="no-data">' . sanitizeHtml((string) $message) . '</div>';
        $html .= '</div>';
        return $html;
    }

    if (empty($historico)) {
        $html .= '<div class="no-data">Sem histórico encontrado para este ingrediente.</div>';
        $html .= '</div>';
        return $html;
    }

    $html .= '<table>';
    $html .= '<thead>';
    $html .= '<tr><th>Data</th><th>Custo pela Unidade de Medida</th></tr>';
    $html .= '</thead>';
    $html .= '<tbody>';

    $costs = [];

    foreach ($historico as $linha) {
        $dateLabel = formatDateLabel($linha['createdAt'] ?? null);
        $cost = isset($linha['costPerUnit']) ? (float) $linha['costPerUnit'] : 0.0;
        $costs[] = $cost;
        $costClass = determineCostClass($cost);
        $formattedCost = formatMoney($cost);

        $html .= '<tr>';
        $html .= '<td>' . $dateLabel . '</td>';
        $html .= "<td class=\"{$costClass}\">R$ {$formattedCost}</td>";
        $html .= '</tr>';
    }

    $html .= '</tbody>';
    $html .= '</table>';

    if (!empty($costs)) {
        $html .= '<div class="summary">';
        $html .= '<strong>Resumo:</strong> ';
        $html .= 'Custo mínimo: R$ ' . formatMoney(min($costs)) . ' | ';
        $html .= 'Custo máximo: R$ ' . formatMoney(max($costs)) . ' | ';
        $html .= 'Custo médio: R$ ' . formatMoney(array_sum($costs) / count($costs)) . ' | ';
        $html .= 'Total de registros: ' . count($historico);
        $html .= '</div>';
    }

    $html .= '</div>';

    return $html;
}

function buildReportHtml(array $sections, string $generatedAt): string
{
    $generatedLabel = sanitizeHtml($generatedAt);

    $html = <<<HTML
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
        <div class="date">Gerado em: {$generatedLabel}</div>
    </div>
HTML;

    foreach ($sections as $section) {
        $html .= renderSection($section);
    }

    $html .= '</body></html>';

    return $html;
}

function loadCliPayload(array $arguments): array
{
    $inputPath = $arguments[1] ?? null;

    if ($inputPath === null || $inputPath === '') {
        respondError('Caminho do payload JSON não informado.', 400);
    }

    if (!is_readable($inputPath)) {
        respondError('Não foi possível ler o payload JSON fornecido.', 400);
    }

    $payload = json_decode(file_get_contents($inputPath), true);

    if (!is_array($payload)) {
        respondError('Payload JSON inválido.', 400);
    }

    $sections = [];

    foreach ($payload['sections'] ?? [] as $section) {
        if (!is_array($section)) {
            continue;
        }

        $nome = trim((string) ($section['nome'] ?? ''));

        if ($nome === '') {
            continue;
        }

        $sections[] = [
            'nome' => $nome,
            'historico' => normalizeHistorico($section['historico'] ?? []),
            'message' => $section['message'] ?? null,
        ];
    }

    if (empty($sections)) {
        respondError('Nenhum dado disponível para gerar o relatório.', 400);
    }

    $currentDate = formatDateTimeLabel($payload['generatedAt'] ?? null);

    return [$sections, $currentDate];
}

function loadHttpPayload(): array
{
    $ingredientesInput = $_POST['ingredientes'] ?? [];

    if (!is_array($ingredientesInput) || empty($ingredientesInput)) {
        respondError('Nenhum ingrediente selecionado.', 400);
    }

    $userId = $_POST['userId'] ?? null;

    if ($userId === null || $userId === '') {
        respondError('Usuário não informado.', 400);
    }

    if (!extension_loaded('pdo_mysql')) {
        respondError('A extensão pdo_mysql não está habilitada no PHP. Habilite-a para gerar o relatório.', 500);
    }

    try {
        $pdo = new PDO('mysql:host=localhost;dbname=crud;charset=utf8', 'root', 'fatec', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (PDOException $exception) {
        respondError('Erro na conexão com o banco: ' . $exception->getMessage(), 500);
    }

    $sections = [];
    $ingredientes = array_map('trim', $ingredientesInput);

    foreach ($ingredientes as $nome) {
        if ($nome === '') {
            continue;
        }

        $stmtIngredient = $pdo->prepare('
            SELECT ID_Ingredientes 
            FROM ingredientes 
            WHERE Nome_Ingrediente = ? AND ID_Usuario = ?
        ');

        $stmtIngredient->execute([$nome, $userId]);
        $ingredientResult = $stmtIngredient->fetch();

        if (!$ingredientResult) {
            $sections[] = [
                'nome' => $nome,
                'historico' => [],
                'message' => 'Ingrediente não encontrado para este usuário.',
            ];
            continue;
        }

        $idIngrediente = $ingredientResult['ID_Ingredientes'];

        $stmt = $pdo->prepare('
            SELECT 
                h.Preco AS costPerUnit,
                h.Taxa_Desperdicio AS wasteRate,
                h.Data_Alteracoes AS createdAt
            FROM historico_alteracoes h
            WHERE h.ID_Ingrediente = ? AND h.ID_Usuario = ?
            ORDER BY h.Data_Alteracoes ASC
        ');

        try {
            $stmt->execute([$idIngrediente, $userId]);
            $dados = $stmt->fetchAll();

            $sections[] = [
                'nome' => $nome,
                'historico' => normalizeHistorico($dados),
                'message' => null,
            ];
        } catch (PDOException $exception) {
            $logPath = __DIR__ . '/../../temp/pdf_error.log';
            $errorMessage = '[' . date('c') . "] Erro ao buscar dados para {$nome}: " . $exception->getMessage() . PHP_EOL;
            @file_put_contents($logPath, $errorMessage, FILE_APPEND);

            $sections[] = [
                'nome' => $nome,
                'historico' => [],
                'message' => 'Erro ao buscar dados deste ingrediente.',
            ];
        }
    }

    if (empty($sections)) {
        respondError('Nenhum ingrediente válido informado.', 400);
    }

    return [$sections, date('d/m/Y H:i:s')];
}

[$sections, $currentDate] = $isCli ? loadCliPayload($argv) : loadHttpPayload();

if (empty($sections)) {
    respondError('Nenhum dado disponível para o relatório.', 400);
}

$html = buildReportHtml($sections, $currentDate);

try {
    $mpdf = new \Mpdf\Mpdf([
        'mode' => 'utf-8',
        'format' => 'A4',
        'margin_left' => 15,
        'margin_right' => 15,
        'margin_top' => 20,
        'margin_bottom' => 20,
        'margin_header' => 10,
        'margin_footer' => 10,
    ]);

    $mpdf->SetTitle('Relatório de Custo Histórico dos Ingredientes');
    $mpdf->SetAuthor('Caderno do Chef');
    $mpdf->SetCreator('Sistema Caderno do Chef');

    $mpdf->WriteHTML($html);

    if ($isCli) {
        echo $mpdf->Output('', 'S');
    } else {
        $mpdf->Output('relatorio_ingredientes_' . date('Y-m-d_H-i-s') . '.pdf', 'I');
    }
} catch (\Mpdf\MpdfException $exception) {
    respondError('Erro ao gerar PDF: ' . $exception->getMessage(), 500);
}
