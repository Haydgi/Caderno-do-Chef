#!/usr/bin/env python3
"""
Script para iniciar o servidor local do Caderno do Chef
Permite acesso de outros dispositivos na rede local
"""

import socket
import subprocess
import sys
import os
import time
import platform
import json
from pathlib import Path
import signal
import atexit

# Cores para output no terminal
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

# Lista de processos para cleanup
processes = []

def get_local_ip():
    """Obtém o IP local da máquina na rede"""
    try:
        # Cria um socket para descobrir o IP local
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception as e:
        print(f"{Colors.FAIL}❌ Erro ao obter IP local: {e}{Colors.ENDC}")
        return "127.0.0.1"

def print_header():
    """Imprime o cabeçalho do script"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}")
    print("═" * 60)
    print("  🍳 CADERNO DO CHEF - Servidor Local de Rede")
    print("═" * 60)
    print(f"{Colors.ENDC}\n")

def check_node_installed():
    """Verifica se o Node.js está instalado"""
    try:
        result = subprocess.run(['node', '--version'], 
                              capture_output=True, 
                              text=True,
                              shell=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"{Colors.OKGREEN}✅ Node.js instalado: {version}{Colors.ENDC}")
            return True
        return False
    except Exception as e:
        print(f"{Colors.FAIL}❌ Node.js não encontrado: {e}{Colors.ENDC}")
        return False

def check_npm_installed():
    """Verifica se o npm está instalado"""
    try:
        result = subprocess.run(['npm', '--version'], 
                              capture_output=True, 
                              text=True,
                              shell=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"{Colors.OKGREEN}✅ npm instalado: {version}{Colors.ENDC}")
            return True
        return False
    except Exception as e:
        print(f"{Colors.FAIL}❌ npm não encontrado: {e}{Colors.ENDC}")
        return False

def check_dependencies(directory):
    """Verifica se as dependências estão instaladas"""
    node_modules = Path(directory) / 'node_modules'
    return node_modules.exists()

def install_dependencies(directory, name):
    """Instala as dependências do projeto"""
    print(f"\n{Colors.WARNING}📦 Instalando dependências do {name}...{Colors.ENDC}")
    
    if platform.system() == "Windows":
        shell_cmd = True
    else:
        shell_cmd = False
    
    try:
        process = subprocess.Popen(
            ['npm', 'install'],
            cwd=directory,
            shell=shell_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        
        for line in process.stdout:
            print(f"  {line.rstrip()}")
        
        process.wait()
        
        if process.returncode == 0:
            print(f"{Colors.OKGREEN}✅ Dependências do {name} instaladas com sucesso!{Colors.ENDC}")
            return True
        else:
            print(f"{Colors.FAIL}❌ Erro ao instalar dependências do {name}{Colors.ENDC}")
            return False
    except Exception as e:
        print(f"{Colors.FAIL}❌ Erro: {e}{Colors.ENDC}")
        return False

def update_env_file(backend_dir, host_ip, backend_port):
    """Atualiza ou cria o arquivo .env com as configurações corretas"""
    env_file = Path(backend_dir) / '.env'
    
    # Lê o arquivo .env existente ou cria um novo
    env_vars = {}
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    
    # Atualiza as variáveis necessárias
    env_vars['HOST'] = host_ip
    env_vars['PORT'] = str(backend_port)
    
    # Garante que as variáveis essenciais existam
    if 'DB_HOST' not in env_vars:
        env_vars['DB_HOST'] = 'localhost'
    if 'DB_USER' not in env_vars:
        env_vars['DB_USER'] = 'root'
    if 'DB_PASSWORD' not in env_vars:
        env_vars['DB_PASSWORD'] = ''
    if 'DB_NAME' not in env_vars:
        env_vars['DB_NAME'] = 'caderno_chef'
    if 'SECRET_JWT' not in env_vars:
        env_vars['SECRET_JWT'] = 'your-secret-key-here-change-in-production'
    
    # Escreve o arquivo .env atualizado
    with open(env_file, 'w', encoding='utf-8') as f:
        f.write("# Configurações do Servidor\n")
        f.write(f"HOST={env_vars['HOST']}\n")
        f.write(f"PORT={env_vars['PORT']}\n\n")
        
        f.write("# Configurações do Banco de Dados\n")
        f.write(f"DB_HOST={env_vars['DB_HOST']}\n")
        f.write(f"DB_USER={env_vars['DB_USER']}\n")
        f.write(f"DB_PASSWORD={env_vars['DB_PASSWORD']}\n")
        f.write(f"DB_NAME={env_vars['DB_NAME']}\n\n")
        
        f.write("# Segurança\n")
        f.write(f"SECRET_JWT={env_vars['SECRET_JWT']}\n\n")
        
        # Escreve outras variáveis que possam existir
        for key, value in env_vars.items():
            if key not in ['HOST', 'PORT', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'SECRET_JWT']:
                f.write(f"{key}={value}\n")
    
    print(f"{Colors.OKGREEN}✅ Arquivo .env atualizado{Colors.ENDC}")

def update_vite_config(frontend_dir, host_ip, backend_port, frontend_port):
    """Atualiza o arquivo vite.config.js com as configurações de rede"""
    vite_config = Path(frontend_dir) / 'vite.config.js'
    
    config_content = f'''import {{ defineConfig }} from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({{ mode }}) => ({{
  base: mode === "production" ? "/Caderno-do-Chef/" : "/",
  plugins: [react()],
  server: {{
    host: '{host_ip}', // Permite acesso de outros dispositivos na rede
    port: {frontend_port},
    strictPort: true,
    proxy: {{
      "/api": {{
        target: "http://{host_ip}:{backend_port}",
        changeOrigin: true,
        secure: false,
      }},
    }},
  }},
}}));
'''
    
    with open(vite_config, 'w', encoding='utf-8') as f:
        f.write(config_content)
    
    print(f"{Colors.OKGREEN}✅ vite.config.js atualizado{Colors.ENDC}")

def update_axios_config(frontend_dir, host_ip, backend_port):
    """Atualiza o arquivo axios.js com a URL correta do backend"""
    axios_config = Path(frontend_dir) / 'src' / 'config' / 'axios.js'
    
    if not axios_config.exists():
        print(f"{Colors.WARNING}⚠️  Arquivo axios.js não encontrado{Colors.ENDC}")
        return
    
    # Lê o arquivo atual
    with open(axios_config, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Substitui a baseURL
    import re
    new_content = re.sub(
        r"axios\.defaults\.baseURL\s*=\s*['\"].*?['\"]",
        f"axios.defaults.baseURL = 'http://{host_ip}:{backend_port}'",
        content
    )
    
    # Escreve o arquivo atualizado
    with open(axios_config, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"{Colors.OKGREEN}✅ axios.js atualizado{Colors.ENDC}")

def update_backend_cors(backend_dir, host_ip, frontend_port):
    """Atualiza o arquivo index.js do backend com as configurações CORS corretas"""
    index_file = Path(backend_dir) / 'index.js'
    
    if not index_file.exists():
        print(f"{Colors.WARNING}⚠️  Arquivo index.js não encontrado{Colors.ENDC}")
        return
    
    # Lê o arquivo atual
    with open(index_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Atualiza as configurações CORS
    import re
    
    # Procura pelo bloco CORS e substitui
    cors_pattern = r'app\.use\s*\(\s*cors\s*\(\s*\{[^}]*origin:\s*\[[^\]]*\][^}]*\}\s*\)\s*\)'
    
    new_cors = f'''app.use(
  cors({{
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://{host_ip}:{frontend_port}",
      "http://127.0.0.1:{frontend_port}"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }})
)'''
    
    if re.search(cors_pattern, content):
        new_content = re.sub(cors_pattern, new_cors, content)
    else:
        # Se não encontrar o padrão, tenta uma abordagem mais simples
        print(f"{Colors.WARNING}⚠️  Padrão CORS não encontrado, verifique manualmente{Colors.ENDC}")
        return
    
    # Escreve o arquivo atualizado
    with open(index_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"{Colors.OKGREEN}✅ Configuração CORS do backend atualizada{Colors.ENDC}")

def start_backend(backend_dir, host_ip, backend_port):
    """Inicia o servidor backend"""
    print(f"\n{Colors.OKCYAN}🚀 Iniciando backend em http://{host_ip}:{backend_port}...{Colors.ENDC}")
    
    env = os.environ.copy()
    env['HOST'] = host_ip
    env['PORT'] = str(backend_port)
    
    if platform.system() == "Windows":
        process = subprocess.Popen(
            ['npm', 'start'],
            cwd=backend_dir,
            shell=True,
            env=env,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
        )
    else:
        process = subprocess.Popen(
            ['npm', 'start'],
            cwd=backend_dir,
            env=env,
            preexec_fn=os.setsid
        )
    
    processes.append(('backend', process))
    return process

def start_frontend(frontend_dir, host_ip, frontend_port):
    """Inicia o servidor frontend"""
    print(f"\n{Colors.OKCYAN}🚀 Iniciando frontend em http://{host_ip}:{frontend_port}...{Colors.ENDC}")
    
    if platform.system() == "Windows":
        process = subprocess.Popen(
            ['npm', 'run', 'dev'],
            cwd=frontend_dir,
            shell=True,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
        )
    else:
        process = subprocess.Popen(
            ['npm', 'run', 'dev'],
            cwd=frontend_dir,
            preexec_fn=os.setsid
        )
    
    processes.append(('frontend', process))
    return process

def cleanup():
    """Encerra todos os processos ao sair"""
    print(f"\n{Colors.WARNING}🛑 Encerrando servidores...{Colors.ENDC}")
    
    for name, process in processes:
        try:
            if platform.system() == "Windows":
                subprocess.run(['taskkill', '/F', '/T', '/PID', str(process.pid)], 
                             capture_output=True)
            else:
                os.killpg(os.getpgid(process.pid), signal.SIGTERM)
            print(f"{Colors.OKGREEN}✅ {name} encerrado{Colors.ENDC}")
        except Exception as e:
            print(f"{Colors.WARNING}⚠️  Erro ao encerrar {name}: {e}{Colors.ENDC}")

def print_access_info(host_ip, backend_port, frontend_port):
    """Imprime as informações de acesso"""
    print(f"\n{Colors.OKGREEN}{Colors.BOLD}")
    print("=" * 60)
    print("  ✅ SERVIDORES INICIADOS COM SUCESSO!")
    print("=" * 60)
    print(f"{Colors.ENDC}")
    
    print(f"\n{Colors.OKBLUE}🌐 Acesso Local:{Colors.ENDC}")
    print(f"   Frontend: http://localhost:{frontend_port}")
    print(f"   Backend:  http://localhost:{backend_port}")
    
    print(f"\n{Colors.OKCYAN}📱 Acesso na Rede Local:{Colors.ENDC}")
    print(f"   Frontend: http://{host_ip}:{frontend_port}")
    print(f"   Backend:  http://{host_ip}:{backend_port}")
    
    print(f"\n{Colors.WARNING}📝 Instruções:{Colors.ENDC}")
    print(f"   1. Certifique-se de que o firewall permite conexões nas portas {backend_port} e {frontend_port}")
    print(f"   2. Outros dispositivos devem estar na mesma rede")
    print(f"   3. Use o endereço http://{host_ip}:{frontend_port} em outros dispositivos")
    print(f"   4. Pressione Ctrl+C para encerrar os servidores")
    
    print(f"\n{Colors.HEADER}{'=' * 60}{Colors.ENDC}\n")

def main():
    """Função principal"""
    print_header()
    
    # Registra a função de cleanup
    atexit.register(cleanup)
    
    # Diretórios do projeto
    script_dir = Path(__file__).parent.absolute()
    backend_dir = script_dir / 'backend'
    frontend_dir = script_dir / 'frontend'
    
    # Configurações
    backend_port = 3001
    frontend_port = 5173
    
    # Verifica se os diretórios existem
    if not backend_dir.exists():
        print(f"{Colors.FAIL}❌ Diretório backend não encontrado: {backend_dir}{Colors.ENDC}")
        sys.exit(1)
    
    if not frontend_dir.exists():
        print(f"{Colors.FAIL}❌ Diretório frontend não encontrado: {frontend_dir}{Colors.ENDC}")
        sys.exit(1)
    
    # Verifica Node.js e npm
    print(f"{Colors.OKBLUE}🔍 Verificando dependências do sistema...{Colors.ENDC}\n")
    if not check_node_installed() or not check_npm_installed():
        print(f"\n{Colors.FAIL}❌ Node.js e npm são necessários. Instale em: https://nodejs.org/{Colors.ENDC}")
        sys.exit(1)
    
    # Obtém o IP local
    host_ip = get_local_ip()
    print(f"\n{Colors.OKGREEN}✅ IP local detectado: {host_ip}{Colors.ENDC}\n")
    
    # Verifica e instala dependências
    print(f"{Colors.OKBLUE}📦 Verificando dependências do projeto...{Colors.ENDC}\n")
    
    if not check_dependencies(backend_dir):
        print(f"{Colors.WARNING}⚠️  Dependências do backend não encontradas{Colors.ENDC}")
        if not install_dependencies(backend_dir, "backend"):
            sys.exit(1)
    else:
        print(f"{Colors.OKGREEN}✅ Dependências do backend já instaladas{Colors.ENDC}")
    
    if not check_dependencies(frontend_dir):
        print(f"{Colors.WARNING}⚠️  Dependências do frontend não encontradas{Colors.ENDC}")
        if not install_dependencies(frontend_dir, "frontend"):
            sys.exit(1)
    else:
        print(f"{Colors.OKGREEN}✅ Dependências do frontend já instaladas{Colors.ENDC}")
    
    # Atualiza arquivos de configuração
    print(f"\n{Colors.OKBLUE}⚙️  Configurando arquivos para acesso em rede...{Colors.ENDC}\n")
    
    # Apenas atualiza o .env do backend
    # Os arquivos frontend (vite.config.js e axios.js) agora são dinâmicos
    update_env_file(backend_dir, host_ip, backend_port)
    print(f"{Colors.OKGREEN}✅ Configurações frontend são dinâmicas (auto-detectam IP){Colors.ENDC}")
    
    # Inicia os servidores
    print(f"\n{Colors.OKBLUE}🚀 Iniciando servidores...{Colors.ENDC}")
    
    backend_process = start_backend(backend_dir, host_ip, backend_port)
    time.sleep(3)  # Aguarda o backend iniciar
    
    frontend_process = start_frontend(frontend_dir, host_ip, frontend_port)
    time.sleep(3)  # Aguarda o frontend iniciar
    
    # Imprime informações de acesso
    print_access_info(host_ip, backend_port, frontend_port)
    
    # Mantém o script rodando e monitora os processos
    print(f"\n{Colors.OKCYAN}🔍 Monitorando servidores... (Pressione Ctrl+C para encerrar){Colors.ENDC}\n")
    
    backend_restarts = 0
    frontend_restarts = 0
    max_restarts = 3
    
    try:
        while True:
            time.sleep(2)  # Verifica a cada 2 segundos
            
            # Verifica se o backend ainda está rodando
            if backend_process.poll() is not None:
                backend_restarts += 1
                if backend_restarts <= max_restarts:
                    print(f"\n{Colors.WARNING}⚠️  Backend encerrado inesperadamente. Tentando reiniciar ({backend_restarts}/{max_restarts})...{Colors.ENDC}")
                    time.sleep(2)
                    backend_process = start_backend(backend_dir, host_ip, backend_port)
                    time.sleep(3)
                else:
                    print(f"\n{Colors.FAIL}❌ Backend falhou após {max_restarts} tentativas de reinício{Colors.ENDC}")
                    break
            
            # Verifica se o frontend ainda está rodando
            if frontend_process.poll() is not None:
                frontend_restarts += 1
                if frontend_restarts <= max_restarts:
                    print(f"\n{Colors.WARNING}⚠️  Frontend encerrado inesperadamente. Tentando reiniciar ({frontend_restarts}/{max_restarts})...{Colors.ENDC}")
                    time.sleep(2)
                    frontend_process = start_frontend(frontend_dir, host_ip, frontend_port)
                    time.sleep(3)
                else:
                    print(f"\n{Colors.FAIL}❌ Frontend falhou após {max_restarts} tentativas de reinício{Colors.ENDC}")
                    break
    
    except KeyboardInterrupt:
        print(f"\n\n{Colors.WARNING}👋 Encerrando servidores...{Colors.ENDC}")
    
    finally:
        cleanup()
        print(f"\n{Colors.OKGREEN}✅ Servidores encerrados com sucesso!{Colors.ENDC}\n")

if __name__ == "__main__":
    main()
