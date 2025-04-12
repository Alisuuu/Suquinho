<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $links = $_POST['links'];
    $file_path = __DIR__ . '/links.txt'; // Caminho absoluto para o arquivo
    if (file_put_contents($file_path, $links) === false) {
        http_response_code(500); // Internal Server Error
        echo 'Erro ao salvar links no arquivo: ' . $file_path;
    }
} else {
    http_response_code(405); // Method Not Allowed
    echo 'Método não permitido.';
}
?>
