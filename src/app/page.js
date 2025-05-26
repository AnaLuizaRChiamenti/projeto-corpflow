'use client';

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import "../css/login.css"; 

export default function HomePage() {
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("userType").value;

    if (!username || !password) {
      setErrorMsg("Preencha todos os campos!");
      return;
    }

    const users = JSON.parse(sessionStorage.getItem("users")) || [];

    const user = users.find(
      u => u.username === username && u.password === password && u.role === role
    );

    if (!user) {
      setErrorMsg("Usuário ou senha incorretos!");
      return;
    } else{
      sessionStorage.setItem("userLogado", JSON.stringify(user));
      window.location.href = '/dashboard'; 
    }
    
  };

  return (
    <div className="container">
      <div className="left-section">
        <div className="image-wrapper">
          <Image
            src="https://i.postimg.cc/xTDdDRT3/Captura-de-tela-2025-04-24-144543.png"
            alt="aviso de feriado"
            className="image"
            width={500}
            height={24}
          />
        </div>
      </div>

      <div className="right-section">
        <div className="login-box">
          <Image
            src="https://i.postimg.cc/rF05ggZG/corpflow.png"
            alt="corpflow logo"
            className="logo"  
            width={250}
            height={200}
          />

          {errorMsg && <div className="error-message">{errorMsg}</div>}

          <div className="dropdown-container">
            <label htmlFor="userType">Entrar como:</label>
            <select id="userType">
              <option value="gerente">Gerente</option>
              <option value="funcionario">Funcionário</option>
            </select>
          </div>

          

          <div className="input-group">
            <label>Usuário</label>
            <input type="text" id="username" placeholder="Digite seu usuário" />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <input type="password" id="password" placeholder="Digite sua senha" />
          </div>

          <button className="login-button" id="loginButton" onClick={handleLogin}>Entrar</button>
          <p className="cadastro-text">
            Ainda não tem conta? <Link href="/cadastro" className="cadastro-link">Cadastre-se</Link>
          </p>

          <div className="social-icons">
            <Link href="https://www.instagram.com/corpflow/" target="_blank">
              <Image src="https://i.postimg.cc/yNxkL8vJ/1200px-Instagram-icon.png" alt="Instagram" width={24} height={24}/>
            </Link>
            <Link href="https://www.facebook.com/p/CorpFlow-100063545143848/" target="_blank">
              <Image src="https://i.postimg.cc/2SfQ9hZ1/1200px-2023-Facebook-icon-svg.png" alt="Facebook" width={24} height={24}/>
            </Link>
            <Link href="https://www.linkedin.com/company/corpflow/" target="_blank">
              <Image src="https://i.postimg.cc/zBjKWdjC/linkedin-83.png" alt="LinkedIn" width={24} height={24}/>
            </Link>
          </div>

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
    </div>
  );
}