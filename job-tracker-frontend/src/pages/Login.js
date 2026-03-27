import { useState } from "react";
import { API_BASE_URL } from "../utils/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Login successful");

        // 🔥 Save token
        localStorage.setItem("token", data.token);

      } else {
        alert(data.message);
      }

    } catch (error) {
      console.log(error);
      alert("Error logging in");
    }
  };

  return (
    <div>
      <h2>Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

export default Login;