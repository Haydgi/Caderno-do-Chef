# 🧪 Guia de Teste Rápido - Correções CORS

## ✅ Checklist de Testes

### Pré-Teste
- [ ] Backend parado (feche se estiver rodando)
- [ ] Frontend parado (feche se estiver rodando)
- [ ] Navegador fechado (para limpar cache)

---

## 🚀 Teste 1: Acesso Local (localhost)

### Passos:
1. **Inicie o servidor:**
   ```bash
   python start_server.py
   ```

2. **Aguarde as mensagens:**
   ```
   ✅ Backend rodando em http://0.0.0.0:3001
   ✅ Frontend rodando em http://0.0.0.0:5173
   ```

3. **Abra o navegador:**
   - URL: `http://localhost:5173`

4. **Faça login**

5. **Teste as páginas:**
   - [ ] Receitas carregam? (sem erro de CORS)
   - [ ] Despesas carregam? (sem erro de CORS)
   - [ ] Ingredientes carregam? (sem erro de CORS)
   - [ ] Relatórios funcionam? (já estava funcionando)

6. **Verifique o console (F12):**
   - [ ] Nenhum erro de CORS
   - [ ] Requisições para `http://localhost:3001`

### ✅ Resultado Esperado:
- Todas as páginas carregam normalmente
- Sem erros no console
- Dados aparecem corretamente

---

## 🌐 Teste 2: Acesso Via IP Local

### Passos:
1. **Anote o IP mostrado pelo script:**
   ```
   📱 Acesso na Rede Local:
      Frontend: http://192.168.X.X:5173
   ```

2. **No mesmo computador, abra nova aba:**
   - URL: `http://192.168.X.X:5173` (use o IP real)

3. **Faça login novamente**

4. **Teste as mesmas páginas:**
   - [ ] Receitas
   - [ ] Despesas
   - [ ] Ingredientes
   - [ ] Relatórios

5. **Verifique o console (F12):**
   - [ ] Nenhum erro de CORS
   - [ ] Requisições para `http://192.168.X.X:3001`

### ✅ Resultado Esperado:
- Funciona exatamente como localhost
- Axios detecta o IP automaticamente

---

## 📱 Teste 3: Acesso de Outro Dispositivo

### Passos:
1. **Conecte outro dispositivo na mesma Wi-Fi:**
   - Celular, tablet, ou outro computador

2. **Abra o navegador no outro dispositivo:**
   - URL: `http://192.168.X.X:5173` (o IP do servidor)

3. **Faça login**

4. **Teste navegação:**
   - [ ] Receitas
   - [ ] Despesas
   - [ ] Ingredientes
   - [ ] Relatórios

### ✅ Resultado Esperado:
- Sistema funciona normalmente
- Sem erros de CORS
- Múltiplos dispositivos podem usar simultaneamente

---

## 🔄 Teste 4: Estabilidade (Restart Automático)

### Passos:
1. **Com o servidor rodando, simule uma falha:**
   
   **No terminal do backend** (se conseguir identificar):
   ```bash
   # Windows: Encontre o PID e mate
   netstat -ano | findstr :3001
   taskkill /F /PID <PID>
   ```

2. **Observe o terminal do Python:**
   ```
   ⚠️  Backend encerrado inesperadamente. Tentando reiniciar (1/3)...
   🚀 Iniciando backend...
   ```

3. **Aguarde alguns segundos**

4. **Teste o sistema novamente:**
   - [ ] Backend voltou a funcionar?
   - [ ] Frontend continua acessível?

### ✅ Resultado Esperado:
- Backend reinicia automaticamente
- Sistema volta a funcionar em poucos segundos
- Até 3 tentativas de reinício

---

## 🧹 Teste 5: Limpeza de Cache

### Se ainda houver problemas de CORS:

1. **Limpe o cache do navegador:**
   ```
   Chrome/Edge: Ctrl + Shift + Delete
   Firefox: Ctrl + Shift + Delete
   Safari: Cmd + Option + E
   ```

2. **Selecione:**
   - [x] Cookies e outros dados de sites
   - [x] Imagens e arquivos armazenados em cache
   - Período: "Todo o período"

3. **Clique em "Limpar dados"**

4. **Feche e abra o navegador novamente**

5. **Teste novamente:** `http://localhost:5173`

---

## 📊 Tabela de Verificação Final

| Item | localhost | IP Local | Outro Dispositivo |
|------|-----------|----------|-------------------|
| Receitas | ☐ | ☐ | ☐ |
| Despesas | ☐ | ☐ | ☐ |
| Ingredientes | ☐ | ☐ | ☐ |
| Relatórios | ☐ | ☐ | ☐ |
| Login | ☐ | ☐ | ☐ |
| Sem CORS | ☐ | ☐ | ☐ |

**Meta:** Todos os ☐ devem virar ✅

---

## 🐛 Troubleshooting Durante os Testes

### Erro: "Não consegui conectar"
**Solução:**
```bash
# Verifique se os servidores estão rodando
# Terminal deve mostrar:
🚀 Servidor rodando em http://0.0.0.0:3001 (backend)
  VITE v... ready in ... ms (frontend)
```

### Erro: "Ainda tenho CORS"
**Solução:**
1. Pare o servidor (Ctrl+C)
2. Limpe cache do navegador
3. Reinicie: `python start_server.py`
4. Espere 5-10 segundos
5. Acesse novamente

### Erro: "Página carrega mas dados não"
**Solução:**
1. Abra F12 (DevTools)
2. Vá para aba "Network"
3. Recarregue a página
4. Veja quais requisições falharam
5. Verifique se o token está no localStorage

### Erro: "Frontend fecha sozinho"
**Solução:**
- Observe o terminal do Python
- Deve mostrar mensagem de reinício
- Se não reiniciar, verifique logs de erro
- Pode ser erro no código JS (veja console do navegador)

---

## ✅ Critérios de Sucesso

### O teste passou se:
1. ✅ Você consegue acessar via `localhost:5173`
2. ✅ Você consegue acessar via `IP:5173`
3. ✅ Outros dispositivos conseguem acessar
4. ✅ Receitas, Despesas e Ingredientes carregam
5. ✅ Nenhum erro de CORS no console
6. ✅ Sistema funciona por mais de 5 minutos sem cair

### Se algum item falhar:
1. Leia o arquivo `CORRECOES_CORS_ESTABILIDADE.md`
2. Verifique se todas as mudanças foram aplicadas
3. Consulte a seção de Troubleshooting
4. Se necessário, reinstale dependências

---

## 📝 Registro de Teste

Data do teste: ___/___/______

### Resultados:

**Teste 1 - localhost:**
- Status: ☐ Passou ☐ Falhou
- Observações: ________________

**Teste 2 - IP Local:**
- Status: ☐ Passou ☐ Falhou
- Observações: ________________

**Teste 3 - Outro Dispositivo:**
- Status: ☐ Passou ☐ Falhou
- Observações: ________________

**Teste 4 - Restart:**
- Status: ☐ Passou ☐ Falhou
- Observações: ________________

**Conclusão:**
- ☐ Todos os testes passaram - Sistema pronto!
- ☐ Alguns testes falharam - Ver observações acima

---

**Tempo estimado de teste:** 10-15 minutos  
**Após sucesso:** Sistema está pronto para uso! 🎉
