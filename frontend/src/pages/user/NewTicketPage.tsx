import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { api } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { useAuth } from "../../contexts/AuthContext";
import { useAppOptions } from "../../hooks/useAppOptions";
import type { Priority, ProblemType, Service } from "../../types";

export function NewTicketPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [problemType, setProblemType] = useState<ProblemType>("PRINTER");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { priorityOptions, problemTypeOptions } = useAppOptions();

  useEffect(() => {
    api.get<Service[]>("/services").then(({ data }) => {
      setServices(data);
      setServiceId(data[0]?.id ?? "");
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("serviceId", serviceId);
      formData.append("problemType", problemType);
      formData.append("priority", priority);
      Array.from(files ?? []).forEach((file) => formData.append("attachments", file));

      const { data } = await api.post("/tickets", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(auth.isAdminArea ? `/admin/tickets/${data.id}` : `/user/tickets/${data.id}`);
    } catch {
      setError("Impossible de creer le ticket.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="Nouveau ticket" subtitle="Creation d'une demande d'intervention informatique" />
      <Paper elevation={0} className="max-w-4xl rounded-lg border border-slate-200 p-5 shadow-soft">
        {error ? (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        ) : null}
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <TextField
            select
            label="Service"
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
            required
            fullWidth
          >
            {services.map((service) => (
              <MenuItem key={service.id} value={service.id}>
                {service.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Type de probleme"
            value={problemType}
            onChange={(event) => setProblemType(event.target.value as ProblemType)}
            required
            fullWidth
          >
            {problemTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Niveau d'urgence"
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
            required
            fullWidth
          >
            {priorityOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Titre" value={title} onChange={(event) => setTitle(event.target.value)} required fullWidth />
          <TextField
            className="md:col-span-2"
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            fullWidth
            multiline
            minRows={5}
          />
          <div className="md:col-span-2 flex flex-col gap-2 rounded-lg border border-dashed border-slate-300 p-4">
            <Button component="label" variant="outlined" startIcon={<UploadFileOutlinedIcon />} sx={{ alignSelf: "flex-start" }}>
              Piece jointe
              <input hidden type="file" multiple accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(event) => setFiles(event.target.files)} />
            </Button>
            <p className="text-sm text-slate-500">
              {files?.length ? `${files.length} fichier(s) selectionne(s)` : "Aucun fichier selectionne"}
            </p>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" variant="contained" size="large" startIcon={<SendOutlinedIcon />} disabled={loading}>
              {loading ? "Envoi..." : "Envoyer"}
            </Button>
          </div>
        </form>
      </Paper>
    </>
  );
}
