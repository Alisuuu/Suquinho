import os
import time
import hashlib
import google.generativeai as genai
from pathlib import Path
import re

# --- CONFIGURAÇÃO GLOBAL ---
CONFIG = {
    # IMPORTANTE: A chave abaixo foi inserida conforme solicitado.
    # Recomenda-se fortemente usar variáveis de ambiente ou um método seguro para armazenar chaves de API.
    "api_key": "AIzaSyADiSjV66rnvJJrsncjMhJlUVXKtQatrYo",
    "backup_dir": "_material_backups",
    "mod_dir": "mod",
    "extensoes": ('.js', '.css', '.html', '.htm'),
    "delay": 1,
    "model_name": "gemini-1.5-flash-latest"
}

# --- ELEMENTOS DO TEMA PARA CUSTOMIZAÇÃO ---
# Dicionário que define quais partes da UI terão opacidade customizável.
THEME_ELEMENTS = {
    "fundo_principal": {"name": "Fundo Principal da página (body)", "default": 0.25},
    "conteineres": {"name": "Contêineres (cards, modais, headers)", "default": 0.2},
    "botoes": {"name": "Botões", "default": 0.5},
    "bordas": {"name": "Bordas dos elementos", "default": 0.6}
}


# --- FUNÇÕES PRINCIPAIS ---

def inicializar_gemini():
    """Configura e testa a conexão com a API do Gemini."""
    api_key = CONFIG['api_key']
    if "AIzaSy" not in api_key: # Checagem simples para uma chave potencialmente vazia/errada.
        print("\n🚨 ERRO CRÍTICO: A API Key parece estar inválida ou não foi definida corretamente.")
        print("Por favor, verifique a chave na variável CONFIG.")
        return None

    try:
        genai.configure(api_key=api_key)
        modelo = genai.GenerativeModel(CONFIG['model_name'])
        
        print(f"✅ Conectando ao modelo: {CONFIG['model_name']}...")
        modelo.generate_content("Teste de conexão.")
        print("🚀 Conexão com o Gemini bem-sucedida!")
        return modelo
        
    except Exception as e:
        print(f"\n🚨 ERRO CRÍTICO: Falha na inicialização do Gemini.")
        print(f"Motivo: {str(e)}")
        print("\n--- Soluções Possíveis ---")
        print("1. Verifique se a API key fornecida é válida e tem permissões.")
        print(f"2. Confirme se o nome do modelo ('{CONFIG['model_name']}') está correto.")
        return None

def get_rgb_from_color(cor_nome_ou_hex: str) -> str:
    """Converte um nome de cor ou código hexadecimal para uma string 'R,G,B'."""
    cor_input = cor_nome_ou_hex.lower().strip()
    cores_predefinidas = {
        "red": "255,0,0", "green": "0,128,0", "blue": "0,0,255",
        "yellow": "255,255,0", "orange": "255,165,0", "purple": "128,0,128",
        "pink": "255,192,203", "cyan": "0,255,255", "magenta": "255,0,255",
        "white": "255,255,255", "black": "0,0,0", "gray": "128,128,128"
    }
    
    if cor_input in cores_predefinidas:
        return cores_predefinidas[cor_input]
    
    if cor_input.startswith("#") and len(cor_input) in [4, 7]:
        hex_val = cor_input[1:]
        try:
            if len(hex_val) == 3:
                hex_val = "".join([c * 2 for c in hex_val])
            
            r = int(hex_val[0:2], 16)
            g = int(hex_val[2:4], 16)
            b = int(hex_val[4:6], 16)
            return f"{r},{g},{b}"
        except ValueError:
            print(f"⚠️ Cor hexadecimal inválida: {cor_input}. Usando cor padrão (azul).")
            return "0,0,255"
    
    print(f"⚠️ Cor '{cor_input}' não reconhecida. Usando cor padrão (azul).")
    return "0,0,255"

def aplicar_tema(codigo: str, extensao: str, modelo, cores_rgba: dict) -> str:
    """Envia o código para a IA com instruções detalhadas e granulares para aplicar o tema."""
    prompt = f"""
    **Tarefa de Redesign de UI: Aplicar Tema Glassmorphism/Material You**

    **Objetivo:** Modernizar o código {extensao} a seguir. O resultado deve ser uma interface visualmente impactante, com profundidade e fluidez, usando o efeito de "vidro fosco" (Glassmorphism).

    **Paleta de Cores e Efeitos de Transparência (CRÍTICO):**

    1.  **Fundo Principal (body):**
        * `background-color`: `{cores_rgba['fundo_principal']}`
        * `backdrop-filter`: `blur(20px)` (se houver elementos sobrepostos)

    2.  **Contêineres (cards, painéis, modais, headers, footers):**
        * `background-color`: `{cores_rgba['conteineres']}`
        * `backdrop-filter`: `blur(12px)`
        * **IMPORTANTE**: Esta é a principal cor para elementos de agrupamento.

    3.  **Botões e Elementos Interativos:**
        * `background-color`: `{cores_rgba['botoes']}`
        * `backdrop-filter`: `blur(5px)` (opcional, para um efeito sutil)
        
    4.  **Bordas:**
        * `border`: `1px solid {cores_rgba['bordas']}`
        * Aplique em contêineres e botões para definir melhor suas formas.

    **Diretrizes Gerais de Estilo:**

    * **Legibilidade Primeiro:** O texto, ícones e imagens devem ser **SEMPRE OPACOS** (opacidade 1). A transparência se aplica SOMENTE aos fundos e bordas.
    * **Cantos Arredondados:** Use `border-radius` generosamente (ex: 16px para cards, 24px para botões) para um visual orgânico.
    * **Espaçamento:** Aumente o `padding` e `margin` para um layout limpo e arejado.
    * **Animações:** Adicione `transition: all 0.3s ease;` para efeitos de `hover` em elementos interativos.

    **Instruções Técnicas:**

    * **Modifique, Não Substitua:** Altere as classes CSS existentes. Não crie novas classes se não for absolutamente necessário.
    * **Comentários:** Adicione `/* MD3 Applied */` acima de cada regra CSS modificada.
    * **Funcionalidade Intacta:** Preserve 100% da funcionalidade original.
    * **Retorno Limpo:** Retorne APENAS o código modificado completo, sem nenhuma explicação ou ```.

    **Código Original ({extensao}):**
    ```
    {codigo}
    ```
    """

    for tentativa in range(3):
        try:
            print("🧠 A IA está analisando e aplicando o tema granular...")
            resposta = modelo.generate_content(prompt)
            texto_limpo = re.sub(r'```[\w\s-]*\n?', '', resposta.text)
            texto_limpo = re.sub(r'```$', '', texto_limpo).strip()
            
            if texto_limpo:
                print("✨ Tema aplicado com sucesso!")
                return texto_limpo
            else:
                print(f"⚠️ Tentativa {tentativa+1}: A IA retornou uma resposta vazia.")
            time.sleep(CONFIG['delay'])
        except Exception as e:
            print(f"⚠️ Tentativa {tentativa+1} falhou: {str(e)}")
            time.sleep(2)
    
    print("❌ A IA não conseguiu processar o arquivo. Retornando o código original.")
    return codigo

def processar_arquivos():
    """Função principal que orquestra todo o processo."""
    pasta_atual = Path.cwd()
    backup_dir = pasta_atual / CONFIG['backup_dir']
    mod_dir = pasta_atual / CONFIG['mod_dir']

    backup_dir.mkdir(exist_ok=True)
    mod_dir.mkdir(exist_ok=True)
    
    print(f"\n📂 Diretório de trabalho: {pasta_atual}")
    
    modelo = inicializar_gemini()
    if not modelo:
        print("\nProcesso interrompido.")
        return

    # --- Coleta de inputs do usuário de forma granular ---
    print("\n--- Configuração do Tema Visual ---")
    cor_base = input("🎨 Qual cor base você gostaria de usar? (ex: purple, #8A2BE2): ").strip()
    base_rgb_str = get_rgb_from_color(cor_base)

    print("\nAgora, defina a opacidade para cada parte do layout (0.0 = transparente, 1.0 = opaco).")
    
    cores_rgba_finais = {}
    for key, info in THEME_ELEMENTS.items():
        while True:
            try:
                prompt_text = f" прозрачность  для '{info['name']}' (padrão: {info['default']}): "
                opacidade_str = input(prompt_text).strip().replace(",", ".")
                if not opacidade_str: # Se o usuário apertar Enter, usa o padrão.
                    opacidade = info['default']
                    print(f"   Usando padrão: {opacidade}")
                    break
                opacidade = float(opacidade_str)
                if 0.0 <= opacidade <= 1.0:
                    break
                else:
                    print("🚨 Valor inválido. Por favor, insira um número entre 0.0 e 1.0.")
            except ValueError:
                print("🚨 Entrada inválida. Por favor, insira um número decimal (ex: 0.5).")
        
        opacidade_css = f"{opacidade:.2f}".replace(",", ".")
        cores_rgba_finais[key] = f"rgba({base_rgb_str},{opacidade_css})"

    print("\n--- Tema Configurado ---")
    for key, value in cores_rgba_finais.items():
        print(f"🎨 {THEME_ELEMENTS[key]['name']:<40}: {value}")
    print("-" * 26)
    
    if input("Deseja continuar com estas configurações? (s/n): ").lower() != 's':
        print("Processo cancelado pelo usuário.")
        return

    resultados = {'sucesso': 0, 'falha': 0, 'ignorados': 0}

    # Percorre todos os arquivos e pastas.
    for raiz, _, arquivos in os.walk(pasta_atual):
        if CONFIG['backup_dir'] in raiz or CONFIG['mod_dir'] in raiz:
            continue
            
        for arquivo in arquivos:
            if not arquivo.lower().endswith(CONFIG['extensoes']):
                continue
                
            caminho_original = Path(raiz) / arquivo
            print("-" * 50)
            print(f"▶️ Processando: {caminho_original.relative_to(pasta_atual)}")
            
            try:
                conteudo_original = caminho_original.read_text(encoding='utf-8', errors='ignore')
                
                if not conteudo_original.strip():
                    print("⏩ Ignorado (arquivo vazio).")
                    resultados['ignorados'] += 1
                    continue
                
                hash_backup = hashlib.md5(conteudo_original.encode('utf-8')).hexdigest()[:8]
                nome_backup = f"{caminho_original.stem}_{hash_backup}{caminho_original.suffix}"
                caminho_backup = backup_dir / nome_backup
                caminho_backup.write_text(conteudo_original, encoding='utf-8')
                print(f"💾 Backup salvo em: {caminho_backup.relative_to(pasta_atual)}")
                
                novo_conteudo = aplicar_tema(conteudo_original, caminho_original.suffix, modelo, cores_rgba_finais)
                
                caminho_relativo = caminho_original.relative_to(pasta_atual)
                caminho_modificado = mod_dir / caminho_relativo
                caminho_modificado.parent.mkdir(parents=True, exist_ok=True)

                if novo_conteudo != conteudo_original:
                    caminho_modificado.write_text(novo_conteudo, encoding='utf-8')
                    print(f"✅ Modificado e salvo em: {caminho_modificado.relative_to(pasta_atual)}")
                    resultados['sucesso'] += 1
                else:
                    print("⏩ Ignorado (sem mudanças detectadas pela IA).")
                    resultados['ignorados'] += 1
                
                time.sleep(CONFIG['delay'])
            
            except Exception as e:
                print(f"❌ Erro ao processar '{arquivo}': {e}")
                resultados['falha'] += 1

    # --- Relatório Final ---
    print("\n" + "="*50)
    print("📊 RELATÓRIO FINAL DA OPERAÇÃO 📊")
    print("="*50)
    print(f"✔️ Sucesso: {resultados['sucesso']}")
    print(f"❌ Falhas: {resultados['falha']}")
    print(f"➡️ Ignorados: {resultados['ignorados']}")
    print(f"\n💾 Backups estão em: '{backup_dir}'")
    print(f"📁 Arquivos modificados estão em: '{mod_dir}'")
    print("\n🎉 Processo concluído! 🎉")

# --- PONTO DE ENTRADA DO SCRIPT ---
if __name__ == "__main__":
    print("="*50)
    print("🎨 Aplicador de Tema v5.0 (Controle Granular) 🎨")
    print("="*50)
    processar_arquivos()

