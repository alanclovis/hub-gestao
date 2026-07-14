import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="hub-brand" style={{ justifyContent: "center", marginBottom: "1rem" }}>
          <span className="hub-brand-mark">HG</span>
        </div>
        <h1>Hub Gestão</h1>
        <p>
          Projetos, 1:1s, feedbacks e pendências — salvos no seu Gist privado.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("github", { redirectTo: "/" });
          }}
        >
          <button type="submit" className="hub-primary-btn">
            Entrar com GitHub
          </button>
        </form>
      </div>
    </div>
  );
}
