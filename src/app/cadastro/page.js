
'use client';

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import "../../css/cadastro.css";

export default function CadastroPage() {
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleCadastro = () => {
    const name = document.getElementById("nameCadastro").value;
    const username = document.getElementById("usernameCadastro").value;
    const password = document.getElementById("passwordCadastro").value;
    const role = document.getElementById("userType").value;

    if (!name || !username || !password) {
      setErrorMsg("Preencha todos os campos!");
      setSuccessMsg('');
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      setErrorMsg("Usuário deve conter apenas letras e números!");
      setSuccessMsg('');
      return;
    }

    const usersSalvos = JSON.parse(localStorage.getItem("users")) || [];
    const userExistente = usersSalvos.find(u => u.username === username);
    const nameExistente = usersSalvos.find(u => u.name === name);

    if (userExistente) {
      setErrorMsg("Usuário já existe!");
      setSuccessMsg('');
      return;
    }

    if (nameExistente) {
      setErrorMsg("Nome já está em uso!");
      setSuccessMsg('');
      return;
    }

    const novoUsuario = { name, username, password, role };
    usersSalvos.push(novoUsuario);
    localStorage.setItem("users", JSON.stringify(usersSalvos));

    setErrorMsg('');
    setSuccessMsg("Usuário cadastrado com sucesso!");
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);
  };

  return (  
    <div className="right-section">
      <div className="image-logo">
        <Image
          src="https://i.postimg.cc/rF05ggZG/corpflow.png"
          alt="corpflow logo"
          className="logo"  
          width={200}
          height={140}
        />
      </div>
      <div className="cadastro-box">
        <h1 style={{ color: "#003087" }}>Cadastro</h1>
        {errorMsg && <div className="error-message">{errorMsg}</div>}
        {successMsg && <div className="success-message">{successMsg}</div>}
        <div className="dropdown-container">
          <label htmlFor="userType">Cadastrar-se como:</label>
          <select id="userType">
            <option value="gerente">Gerente</option>
            <option value="funcionario">Funcionário</option>
          </select>
        </div>
        <div className="input-group">
          <label>Nome</label>
          <input type="text" id="nameCadastro" placeholder="Digite seu nome" />
        </div>
        <div className="input-group">
          <label>Usuário</label>
          <input type="text" id="usernameCadastro" placeholder="Crie seu usuário" />
        </div>
        <div className="input-group">
          <label>Senha</label>
          <input type="password" id="passwordCadastro" placeholder="Crie sua senha" />
        </div>
        <button className="cadastro-button" onClick={handleCadastro}>Cadastrar</button>
        <p className="login-text">
          Já tem conta? <Link href="/" className="login-link">Ir para Login</Link>
        </p>
        <div className="footer">
          <p>
            Suporte CorpFlow <br />
            (51) 3333-4444 <br />
            <Link href="https://www.corpflow.com.br" target="_blank">
              www.corpflow.com.br
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}