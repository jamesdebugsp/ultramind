# 🧪 Testes E2E — AgendePro (Playwright)

## Pré-requisitos

- Node.js 18+
- npm ou yarn

## Instalação

```bash
# Na raiz do projeto, instale o Playwright
cd e2e
npm init -y
npm install -D @playwright/test
npx playwright install chromium
```

## Configuração das Credenciais

Defina suas credenciais de teste como variáveis de ambiente:

```bash
export TEST_EMAIL="seu-email-de-teste@email.com"
export TEST_PASSWORD="sua-senha-de-teste"
export BASE_URL="https://ultramind.lovable.app"  # ou sua URL local
```

Ou edite diretamente nos arquivos de teste (não recomendado para produção).

## Executar os Testes

```bash
# Dentro da pasta e2e/
npx playwright test

# Com interface visual
npx playwright test --ui

# Apenas um arquivo
npx playwright test tests/02-auth.spec.ts

# Com relatório HTML
npx playwright test --reporter=html
npx playwright show-report
```

## Estrutura

```
e2e/
├── playwright.config.ts    # Configuração do Playwright
├── pages/                  # Page Object Model
│   ├── HomePage.ts
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── ClientesPage.ts
│   └── ServicosPage.ts
├── tests/                  # Testes organizados por fluxo
│   ├── 01-homepage.spec.ts
│   ├── 02-auth.spec.ts
│   ├── 03-clientes.spec.ts
│   └── 04-servicos.spec.ts
└── README.md
```

## Relatório

Após rodar os testes, o relatório HTML é gerado em `playwright-report/`.

```bash
npx playwright show-report ../playwright-report
```

O relatório inclui:
- ✅ Testes aprovados
- ❌ Testes que falharam (com screenshots)
- ⏱️ Tempo de execução de cada teste
- 📹 Vídeo das falhas (quando habilitado)

## Boas Práticas Utilizadas

- **Page Object Model** — cada página tem sua classe com locators e ações
- **Esperas inteligentes** — `waitForURL`, `waitForLoadState`, `toBeVisible` com timeouts
- **Assertions claras** — `expect()` do Playwright com mensagens descritivas
- **Isolamento** — cada teste faz login independente
- **Nomes únicos** — `Date.now()` garante que registros de teste não colidam
