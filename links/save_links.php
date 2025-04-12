<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $links = $_POST['links'];
    if (file_put_contents('links.txt', $links) === false) {
        http_response_code(500); // Internal Server Error
        echo 'Erro ao salvar links.';
    }
} else {
    http_response_code(405); // Method Not Allowed
    echo 'Método não permitido.';
}
?>