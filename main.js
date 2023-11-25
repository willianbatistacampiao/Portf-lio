// Constante que armazena a URL da API
const API_URL = "https://tdiniz-bff-projeto-final-2b5fb2481b5c.herokuapp.com/api";

// Variáveis globais
let isEdit = false;
let selectedTodo = null;

// Elementos do DOM
const username = document.getElementById("username");
const password = document.getElementById("password");
const formTitle = document.getElementById("formTitle");
const titulo = document.getElementById("editTodoTitle");
const descricao = document.getElementById("editTodoDescription");
const checkboxLabel = document.getElementById("editTodoStatus");
const statusCheckbox = document.getElementById("editTodoStatusCheckbox");
const saveBtn = document.getElementById("saveEditedTodo");
const loginBtn = document.getElementById("loginBtn");
const deletBtn = document.getElementById("deleteEditedTodo");
const todoList = document.getElementById("todoList");

// Verifica se o usuário está autenticado
window.onload = checkToken();


// Função que verifica se o usuário está autenticado
function checkToken() {
    if (window.location.pathname == "/index.html" || window.location.pathname == "/") {
        if (!sessionStorage.getItem("accessToken")) {
            window.location.href = "login.html";
        } else {
            getTodos();
        }
    }
}

// Função de login
function login() {
    if (!username.value || !password.value) {
        showToastWarning("Por favor, preencha todos os campos.");
        return;
    }

    const data = {
        username: username.value,
        password: password.value,
    };

    fetch(API_URL + "/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                showToastWarning("Login falhou. Verifique suas credenciais.");
                username.value = "";
                password.value = "";
            }
        })
        .then((data) => {
            if (!data) return;
            const accessToken = data.accessToken;
            sessionStorage.setItem("accessToken", accessToken);
            window.location.href = "index.html";
        });
}

// Função que busca todos os To Do's
function getTodos() {
    const todos = JSON.parse(sessionStorage.getItem("todos")) || [];
    if (todos.length === 0) {
        fetch(API_URL + "/todo/all", {
            method: "Post",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                accessToken: sessionStorage.getItem("accessToken"),
            }),
        })
            .then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    showToastWarning("Falha ao carregar a lista de tarefas.");
                }
            })
            .then((data) => {
                if (!data) return;
                if (data.message === "Não autorizado") {
                    logout();
                    return;
                }
                const todos = data.todos;
                sessionStorage.setItem("todos", JSON.stringify(todos));
                loadTodos();
            });
    } else {
        loadTodos();
    }
}

// Função que carrega os To Do's na tela
function loadTodos() {
    const todos = JSON.parse(sessionStorage.getItem("todos")) || [];

    todoList.innerHTML = "";

    if (todos.length === 0) {
        const message = document.createElement("p");
        message.textContent = "Não há To Do's cadastrados. Crie um novo To Do!";
        todoList.appendChild(message);
    } else {
        todos.forEach((todo) => {
            const listItem = document.createElement("li");

            const title = document.createElement("span");
            title.textContent = todo.titulo;
            title.classList.add("todo-title");

            const description = document.createElement("span");
            description.textContent = todo.descricao;
            description.classList.add("todo-description");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = todo.realizado;
            checkbox.id = `todoCheckbox_${todo.titulo}`;
            checkbox.addEventListener("change", () =>
                updateTodo(todo.titulo, null, checkbox.checked)
            );

            const label = document.createElement("label");
            label.textContent = "Realizado: ";
            label.setAttribute("for", `todoCheckbox_${todo.titulo}`);

            label.appendChild(checkbox);

            const editIcon = document.createElement("i");
            editIcon.classList.add("fas", "fa-edit");

            const editButton = document.createElement("button");
            const editButtonSpan = document.createElement("span");
            editButtonSpan.appendChild(editIcon);
            editButton.innerHTML = editButtonSpan.outerHTML;
            editButton.classList.add("edit-button");
            editButton.addEventListener("click", () => editTodo(todo));

            listItem.appendChild(title);
            listItem.appendChild(description);
            listItem.appendChild(label);
            listItem.appendChild(editButton);

            todoList.appendChild(listItem);
        });
    }
}

// Função que alterna entre o formulário de criação e edição de To Do's
toogleForm = (isFormEdit) => {
    isEdit = isFormEdit;
    if (isEdit) {
        formTitle.textContent = "Editar To Do";
        deletBtn.style.display = "block";
        checkboxLabel.style.display = "block";
        titulo.disabled = true;
    } else {
        formTitle.textContent = "Criar To Do";
        deletBtn.style.display = "none";
        checkboxLabel.style.display = "none";
        titulo.disabled = false;
    }
};

// Função que deleta um To Do
function deleteTodo() {
    const todos = JSON.parse(sessionStorage.getItem("todos")) || [];
    const todoIndex = todos.findIndex((todo) => todo.titulo === titulo.value);
    if (todoIndex !== -1) {
        todos.splice(todoIndex, 1);
        const accessToken = sessionStorage.getItem("accessToken");

        fetch(API_URL + "/todo/delete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                accessToken,
                titulo: titulo.value,
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Erro ao apagar o do To Do.");
                }
                data = response.json();
                if (data.message === "Não autorizado") {
                    logout();
                    return;
                }
                showToast("To Do apagado com sucesso!");
                sessionStorage.setItem("todos", JSON.stringify(todos));
                loadTodos();    
                clearForm();
                toogleForm(false);
            })
            .catch((error) => {
                showToastWarning(error.message);
            });
    }
}

// Função que edita um To Do
function editTodo(todo) {
    selectedTodo = todo.titulo;
    toogleForm(true);
    titulo.value = todo.titulo;
    descricao.value = todo.descricao;
    descricao.focus();
    statusCheckbox.checked = todo.realizado;
}

// Função que salva um To Do editado
function saveEditedTodo() {
    updateTodo(selectedTodo, descricao.value, statusCheckbox.checked);
}

// Função que atualiza um To Do
function updateTodo(titulo, descricao, realizado) {
    const todos = JSON.parse(sessionStorage.getItem("todos")) || [];
    const todoIndex = todos.findIndex((todo) => todo.titulo === titulo);

    if (todoIndex !== -1) {
        todos[todoIndex].realizado = realizado;
        todos[todoIndex].descricao = descricao;
        sessionStorage.setItem("todos", JSON.stringify(todos));

        const accessToken = sessionStorage.getItem("accessToken");

        fetch(API_URL + "/todo/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                accessToken,
                titulo,
                descricao,
                realizado,
            }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Erro ao atualizar o do To Do.");
                }
                data = response.json();
                if (data.message === "Não autorizado") {
                    logout();
                    return;
                }
                showToast("To Do atualizado com sucesso!");
                loadTodos();
                clearForm();
                toogleForm(false);
            })
            .catch((error) => {
                showToastWarning(error.message);
            });

    }
}

// Função que limpa o formulário
function clearForm() {
    selectedTodo = null;
    titulo.value = "";
    descricao.value = "";
    statusCheckbox.checked = false;
}

// Função que exibe um toast de aviso
function showToastWarning(message) {
    Toastify({
        text: message,
        className: "info",
        duration: 3000,
    }).showToast();
}

// Função que exibe um toast de sucesso
function showToast(message) {
    Toastify({
        text: message,
        className: "success",
        duration: 3000,
    }).showToast();
}

// Função de logout
function logout() {
    sessionStorage.removeItem("accessToken");
    window.location.href = "login.html";
}

// Função que cria um novo To Do
function createTodo() {
    if (!titulo.value) {
        showToastWarning("Por favor, preencha o título do To Do.");
        return;
    }

    // criar o novo todo no sessionStorage
    const todos = JSON.parse(sessionStorage.getItem("todos")) || [];
    const todoIndex = todos.findIndex((todo) => todo.titulo === titulo.value);
    if (todoIndex !== -1) {
        showToastWarning("Já existe um To Do com esse título.");
        return;
    }

    todos.push({
        titulo: titulo.value,
        descricao: descricao.value,
        realizado: false,
    });


    const accessToken = sessionStorage.getItem("accessToken");

    fetch(API_URL + "/todo/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            accessToken,
            titulo: titulo.value,
            descricao: descricao.value,
        }),
    })
        .then((response) => {
            if (!response.ok) {
                data = response.json();
                if (data.message === "Não autorizado") {
                    logout();
                    return;
                }
                throw new Error("Erro ao criar o To Do.");
            }
            showToast("To Do criado com sucesso!");
            titulo.value = "";
            descricao.value = "";
            sessionStorage.setItem("todos", JSON.stringify(todos));
            loadTodos();
        })
        .catch((error) => {
            showToastWarning(error.message);
        });

}

// Event listeners
if(loginBtn){
    loginBtn.addEventListener("click", () => {
        login();
    });
}

if(saveBtn){
    saveBtn.addEventListener("click", () => {
        if (!isEdit) {
            createTodo();
        } else {
            saveEditedTodo();
        }
    });
}

if(deletBtn){
    deletBtn.addEventListener("click", () => {
        deleteTodo();
    });
}
