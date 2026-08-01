import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("admin@municipalite.tn");
  const [password, setPassword] = useState("Admin123!");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (auth.isAuthenticated) {
    return <Navigate to={auth.isAdminArea ? "/admin" : "/user"} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await auth.login(email, password);
      const fallback = user.role === "USER" ? "/user" : "/admin";
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from ?? fallback, { replace: true });
    } catch {
      setError("Courriel ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="grid min-h-[calc(100vh-2rem)] overflow-hidden rounded-lg bg-white shadow-soft md:min-h-[calc(100vh-3rem)] md:grid-cols-[minmax(360px,520px),1fr]">
        <section className="flex items-center px-6 py-10 md:px-12">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-10 text-center">
              <img src="/kelibia-logo.png" alt="Municipalite de Kelibia" className="mx-auto mb-5 h-20 w-auto object-contain" />
              <h1 className="text-2xl font-bold text-slate-950">KeliTech Interventions</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">Municipalite de Kelibia</p>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-950">Connexion a votre compte</h2>
              <p className="mt-1 text-sm text-slate-500">Entrez vos identifiants pour acceder a la plateforme.</p>
            </div>

            {error ? (
              <Alert severity="error" className="mb-4">
                {error}
              </Alert>
            ) : null}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Courriel"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <TextField
                fullWidth
                label="Mot de passe"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title={showPassword ? "Masquer" : "Afficher"}>
                        <IconButton onClick={() => setShowPassword((value) => !value)} edge="end">
                          {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
              <p className="font-semibold text-slate-700">Comptes de demonstration</p>
              <p>Administrateur / Technicien: admin@municipalite.tn / Admin123!</p>
              <p>Utilisateur: ahmed@municipalite.tn / User123!</p>
            </div>
          </div>
        </section>
        <section className="relative hidden min-h-full md:block">
          <img src="/kelibia-municipality.jpg" alt="Municipalite de Kelibia" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/65 via-white/10 to-black/10" />
          <div className="absolute bottom-8 left-8 max-w-sm rounded-lg bg-white/85 p-4 shadow-soft backdrop-blur">
            <p className="text-sm font-bold text-slate-950">Municipalite de Kelibia</p>
            <p className="mt-1 text-sm text-slate-600">Service informatique</p>
          </div>
        </section>
      </div>
    </main>
  );
}
