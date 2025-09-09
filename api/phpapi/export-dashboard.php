<?php
require_once __DIR__ . '/vendor/autoload.php';

$mpdf = new \Mpdf\Mpdf();

if (empty($_POST['ingredientes'])) {
    die("Nenhum ingrediente selecionado recebido.");
}


try {
    $pdo = new PDO('mysql:host=localhost;dbname=crud;charset=utf8', 'root', 'fatec', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    die("Erro na conexão com o banco: " . $e->getMessage());
}

$ingredientes = array_map('trim', $_POST['ingredientes'] ?? []);

$html = '
<h1>Relatório de Custo Histórico dos Ingredientes</h1>
<style>
    table {
        border-collapse: collapse;
        margin-bottom: 16px;
        width: 100%;
    }
    th, td {
        border: 1px solid #333;
        padding: 6px;
        text-align: left;
    }
    th {
        background: #eee;
    }
</style>
';

foreach ($ingredientes as $nome) {
    $stmt = $pdo->prepare("
        SELECT h.Data_Alteracoes, p.Custo_Unitario, i.Unidade_De_Medida
        FROM historico_alteracoes h
        JOIN ingredientes i ON h.ID_Ingrediente = i.ID_Ingredientes
        JOIN preco p ON p.ID_Ingrediente = i.ID_Ingredientes AND p.ID_Historico = h.ID
        WHERE i.Nome_Ingrediente = ?
        ORDER BY h.Data_Alteracoes ASC
    ");
    $stmt->execute([$nome]);
    $dados = $stmt->fetchAll();

    $html .= "<h2>$nome</h2>";
    if (!$dados) {
        $html .= "<p><em>Sem histórico encontrado.</em></p>";
        continue;
    }

    $html .= '<table><tr><th>Data</th><th>Custo pela Unidade de Medida</th></tr>';
    foreach ($dados as $linha) {
        $data = date('d/m/Y', strtotime($linha['Data_Alteracoes']));
        $custo = number_format($linha['Custo_Unitario'], 2, ',', '.');
        $unidade = htmlspecialchars($linha['Unidade_De_Medida']);
        $html .= "<tr><td>$data</td><td>R$ $custo / $unidade</td></tr>";
    }
    $html .= '</table>';
}

$mpdf->WriteHTML($html);
$mpdf->Output('dashboard.pdf', 'I');
