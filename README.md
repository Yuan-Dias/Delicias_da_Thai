#  Delícias da Thai

Um sistema completo de catálogo digital e gerenciamento de pedidos para uma confeitaria local. Desenvolvido para facilitar a visualização dos produtos pelos clientes e agilizar o processo de pedidos via WhatsApp, contando também com um painel administrativo seguro para a gestão do negócio.

 **Acesse o site ao vivo:** [deliciasdathai.vercel.app](https://deliciasdathai.vercel.app)

---

##  Funcionalidades

###  Para o Cliente (Área Pública)
* **Catálogo Digital:** Visualização de bolos de pote, doces e sobremesas com fotos, descrições e preços.
* **Integração com WhatsApp:** Geração automática da mensagem de pedido, enviando o cliente direto para o WhatsApp da loja com a lista de itens escolhidos.
* **PWA (Progressive Web App):** O site pode ser instalado no celular do cliente como se fosse um aplicativo nativo.
* **Design Responsivo:** Interface otimizada (Mobile-First) para funcionar perfeitamente em qualquer tamanho de tela.

###  Para a Administração (Área Privada)
* **Autenticação Segura:** Login via E-mail/Senha ou Google (Firebase Auth).
* **Controle de Acesso:** Apenas e-mails previamente autorizados conseguem acessar o painel (Rotas Privadas).
* **Gerenciamento de Produtos:** Adicionar, editar ou excluir itens do cardápio em tempo real.
* **Upload de Imagens:** Armazenamento seguro das fotos dos produtos.

---

## Tecnologias Utilizadas

Este projeto foi construído com as seguintes tecnologias:

* **[React](https://react.dev/)** + **[Vite](https://vitejs.dev/)**: Framework e bundler para uma interface rápida e moderna.
* **[TypeScript](https://www.typescriptlang.org/)**: Tipagem estática para um código mais seguro e previsível.
* **[Tailwind CSS](https://tailwindcss.com/)**: Estilização rápida, responsiva e padronizada.
* **[Firebase](https://firebase.google.com/)**: Backend as a Service (BaaS) utilizado para:
    * *Authentication:* Login seguro de administradores.
    * *Firestore:* Banco de dados NoSQL para salvar os produtos.
    * *Storage:* Armazenamento das fotos dos doces.
* **[React Router DOM](https://reactrouter.com/)**: Gerenciamento das rotas da aplicação (Navegação SPA e Rotas Privadas).
* **[Lucide React](https://lucide.dev/)**: Biblioteca de ícones modernos.
* **[Vercel](https://vercel.com/)**: Hospedagem e CI/CD.

---

##  Como rodar o projeto localmente

### 1. Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

### 2. Clonando o repositório
``` bash
git clone (https://github.com/Yuan-Dias/delicias-da-thai.git)
cd delicias-da-thai
```

### 3. Instalando as dependências
``` bash

npm install
# ou
yarn install
```

### 4. Configurando as Variáveis de Ambiente

Crie um arquivo .env na raiz do projeto e adicione as chaves do seu projeto Firebase:
Snippet de código

VITE_FIREBASE_API_KEY=sua_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_auth_domain_aqui
VITE_FIREBASE_PROJECT_ID=seu_project_id_aqui
VITE_FIREBASE_STORAGE_BUCKET=seu_storage_bucket_aqui
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id_aqui
VITE_FIREBASE_APP_ID=seu_app_id_aqui

### 5. Rodando a aplicação
``` bash

npm run dev
# ou
yarn dev

```
O servidor iniciará localmente. Acesse http://localhost:5173 no seu navegador.
 Estrutura de Pastas (Resumo)
Plaintext

src/
 ┣ assets/       # Imagens e ícones estáticos
 ┣ components/   # Componentes reutilizáveis (Botões, Cards, Navbar)
 ┣ pages/        # Páginas da aplicação
 ┃ ┣ admin/      # Páginas restritas (Login, Dashboard)
 ┃ ┗ client/     # Páginas públicas (Home, Catálogo)
 ┣ services/     # Configuração de serviços externos (Firebase)
 ┣ App.tsx       # Configuração das rotas principais e de proteção (Rota Privada)
 ┗ main.tsx      # Ponto de entrada do React

 Deploy

O deploy desta aplicação foi realizado na Vercel. O roteamento da SPA foi configurado através do arquivo vercel.json na raiz do projeto, garantindo que o react-router-dom funcione corretamente ao acessar URLs diretamente e evitando o erro 404.

Feito com 🩵 e muito código!