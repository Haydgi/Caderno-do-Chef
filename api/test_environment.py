#!/usr/bin/env python3
"""
Script de teste rápido para verificar o ambiente
"""

import sys
import subprocess
import socket

def test_python():
    """Testa a versão do Python"""
    version = sys.version_info
    print(f"✅ Python {version.major}.{version.minor}.{version.micro}")
    return version.major >= 3 and version.minor >= 7

def test_node():
    """Testa se Node.js está instalado"""
    try:
        result = subprocess.run(['node', '--version'], 
                              capture_output=True, 
                              text=True, 
                              shell=True)
        if result.returncode == 0:
            print(f"✅ Node.js {result.stdout.strip()}")
            return True
        return False
    except:
        print("❌ Node.js não encontrado")
        return False

def test_npm():
    """Testa se npm está instalado"""
    try:
        result = subprocess.run(['npm', '--version'], 
                              capture_output=True, 
                              text=True, 
                              shell=True)
        if result.returncode == 0:
            print(f"✅ npm {result.stdout.strip()}")
            return True
        return False
    except:
        print("❌ npm não encontrado")
        return False

def test_network():
    """Testa a conectividade de rede"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        print(f"✅ Rede detectada - IP: {ip}")
        return True
    except:
        print("❌ Sem conexão de rede")
        return False

def main():
    print("\n" + "="*50)
    print("🔍 TESTE DE AMBIENTE - Caderno do Chef")
    print("="*50 + "\n")
    
    tests = [
        ("Python 3.7+", test_python()),
        ("Node.js", test_node()),
        ("npm", test_npm()),
        ("Rede", test_network())
    ]
    
    print("\n" + "="*50)
    passed = sum(1 for _, result in tests if result)
    total = len(tests)
    
    if passed == total:
        print(f"✅ Todos os testes passaram! ({passed}/{total})")
        print("\n🚀 Você está pronto para executar:")
        print("   python start_server.py")
    else:
        print(f"⚠️  Alguns testes falharam ({passed}/{total})")
        print("\n❌ Instale os componentes faltantes:")
        if not tests[1][1]:
            print("   - Node.js: https://nodejs.org/")
        if not tests[2][1]:
            print("   - npm: Incluído com Node.js")
    
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
