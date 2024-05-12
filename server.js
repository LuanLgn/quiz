const express = require("express");
const session = require("express-session");
const app = express();
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
  session({
    secret: "sua_chave_secreta_aqui",
    resave: false,
    saveUninitialized: false,
  })
);

// Conectar ao banco de dados SQLite em arquivo
const dbPath = path.join(__dirname, "public", "database.sqlite");
const db = new sqlite3.Database(dbPath);

// Crie a tabela de usuários se ela ainda não existir
db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, points INTEGER)"
  );
});

// Rota para o registro de novos usuários
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  // Insira o novo usuário no banco de dados
  db.run(
    "INSERT INTO users (username, password, points) VALUES (?, ?, ?)",
    [username, password, 0],
    function (err) {
      if (err) {
        console.error("Erro ao inserir usuário:", err);
        res.status(500).send("Erro ao inserir usuário");
      } else {
        console.log("Usuário registrado com sucesso!");
        res.send("Usuário registrado com sucesso!");
      }
    }
  );
});

// Rota para o login de usuários
// Rota para o login de usuários
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Verificar as credenciais no banco de dados
  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, row) => {
      if (err) {
        console.error("Erro ao verificar credenciais:", err);
        res.status(500).send("Erro ao verificar credenciais.");
      } else {
        if (row) {
          // Credenciais válidas, armazenar informações do usuário na sessão
          req.session.username = username;
          req.session.points = row.points; // Você pode inicializar os pontos conforme desejar

          // Redirecionar para a página hall.html passando o nome de usuário como parâmetro
          res.redirect(`/hall.html?username=${username}`);
        } else {
          // Credenciais inválidas, retornar mensagem de erro
          res
            .status(401)
            .send("Credenciais inválidas. Por favor, tente novamente.");
        }
      }
    }
  );
});

// Proteger as rotas que requerem autenticação
app.use((req, res, next) => {
  if (req.session.username) {
    // Se o usuário estiver autenticado, permita o acesso à próxima rota
    next();
  } else {
    // Se o usuário não estiver autenticado, redirecione para a página de login
    res.redirect("/index.html"); // Supondo que você tenha uma página de login chamada login.html
  }
});

app.get("/getUserInfo", (req, res) => {
  // Obter informações do usuário da sessão
  const username = req.session.username;
  const points = req.session.points;

  // Enviar informações do usuário como resposta
  res.json({ username, points });
});

// Rota para obter os pontos do usuário
app.get("/getUserPoints", (req, res) => {
  // Obter informações do usuário da sessão
  const username = req.session.username;

  // Consultar o banco de dados para obter os pontos do usuário
  db.get(
    "SELECT points FROM users WHERE username = ?",
    [username],
    (err, row) => {
      if (err) {
        console.error("Erro ao obter pontos do usuário:", err);
        res.status(500).send("Erro ao obter pontos do usuário");
      } else {
        // Atualizar os pontos do usuário na sessão, se necessário
        req.session.points = row.points;

        // Enviar os pontos do usuário como resposta
        res.json(row);
      }
    }
  );
});

// Rota para adicionar pontos ao usuário
app.post("/addPoints", (req, res) => {
  const { username, pointsToAdd } = req.body;

  // Consultar o banco de dados para obter os pontos atuais do usuário
  db.get(
    "SELECT points FROM users WHERE username = ?",
    [username],
    (err, row) => {
      if (err) {
        console.error("Erro ao obter pontos do usuário:", err);
        res.status(500).send("Erro ao obter pontos do usuário");
      } else {
        // Calcular os novos pontos do usuário
        const currentPoints = row.points;
        const newPoints = currentPoints + parseInt(pointsToAdd);

        // Atualizar os pontos do usuário no banco de dados
        db.run(
          "UPDATE users SET points = ? WHERE username = ?",
          [newPoints, username],
          (err) => {
            if (err) {
              console.error("Erro ao atualizar os pontos do usuário:", err);
              res.status(500).send("Erro ao atualizar os pontos do usuário");
            } else {
              // Responder com os novos pontos do usuário
              res.json({ points: newPoints });
            }
          }
        );
      }
    }
  );
});

// Rota para efetuar logout
app.get("/logout", (req, res) => {
  // Destruir a sessão
  req.session.destroy((err) => {
    if (err) {
      console.error("Erro ao efetuar logout:", err);
      res.status(500).send("Erro ao efetuar logout");
    } else {
      // Redirecionar para a página de login após o logout
      res.redirect("/index.html"); // Supondo que você tenha uma página de login chamada login.html
    }
  });
});
// Rota para obter o ranking de usuários
app.get("/getRanking", (req, res) => {
  // Consultar o banco de dados para obter o ranking de usuários
  db.all(
    "SELECT username, points FROM users ORDER BY points DESC",
    (err, rows) => {
      if (err) {
        console.error("Erro ao obter ranking de usuários:", err);
        res.status(500).send("Erro ao obter ranking de usuários");
      } else {
        // Enviar o ranking como resposta
        res.json(rows);
      }
    }
  );
});

// Rota para efetuar logout
app.get("/logout", (req, res) => {
  // Destruir a sessão
  req.session.destroy((err) => {
    if (err) {
      console.error("Erro ao efetuar logout:", err);
      res.status(500).send("Erro ao efetuar logout");
    } else {
      // Redirecionar para a página de login após o logout
      res.redirect("/index.html"); // Supondo que você tenha uma página de login chamada login.html
    }
  });
});

// Iniciando o servidor na porta 3000
app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
