export default function Login() {
  return ( 
    <div>
  <h1>Login</h1>
  <form>
    <div>
    <label for="email"><b>Email</b></label>
    <input type="email" name="email"required></input>
</div>
    <div>

    <label for="psw"><b>Password</b></label>
    <input type="password" name="psw" required></input>
</div>
    <div>

     <button type="submit">Login</button>
</div>
  </form>
  </div>

  );
}