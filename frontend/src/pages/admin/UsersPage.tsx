import { FormEvent, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { api } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { EmptyBlock, LoadingBlock } from "../../components/StateBlocks";
import { roleLabels } from "../../data/labels";
import { useAsyncData } from "../../hooks/useAsyncData";
import type { Role, Service, User } from "../../types";
import { fullName } from "../../utils/format";

const roles: Role[] = ["USER", "ADMIN"];

export function UsersPage() {
  const [mode, setMode] = useState<"add" | "edit" | "view" | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const { data, loading, refresh } = useAsyncData(async () => {
    const response = await api.get<User[]>("/users");
    return response.data;
  }, []);

  async function loadServices() {
    const { data } = await api.get<Service[]>("/services");
    setServices(data);
  }

  useEffect(() => {
    loadServices();
  }, []);

  function openAddForm() {
    setSelectedUser(null);
    setMode("add");
  }

  function openEditForm(user: User) {
    setSelectedUser(user);
    setMode("edit");
  }

  function openView(user: User) {
    setSelectedUser(user);
    setMode("view");
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      password: formData.get("password") || undefined,
      role: formData.get("role"),
      phone: formData.get("phone"),
      serviceId: formData.get("serviceId") || null,
    };

    if (mode === "edit" && selectedUser) {
      await api.patch(`/users/${selectedUser.id}`, payload);
    } else {
      await api.post("/users", payload);
      form.reset();
    }

    setMode(null);
    setSelectedUser(null);
    await refresh();
  }

  async function deleteUser(user: User) {
    if (!confirm(`Supprimer ${fullName(user)} ?`)) return;
    await api.delete(`/users/${user.id}`);
    await refresh();
  }

  const showForm = mode === "add" || mode === "edit";
  const closePopup = () => {
    setMode(null);
    setSelectedUser(null);
  };

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        subtitle="Ajouter, consulter, modifier et supprimer les comptes"
        actions={
          <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={openAddForm}>
            Ajouter
          </Button>
        }
      />

      <Dialog open={mode === "view" && Boolean(selectedUser)} onClose={closePopup} fullWidth maxWidth="md">
        {selectedUser ? (
          <>
            <DialogTitle>Details utilisateur</DialogTitle>
            <DialogContent dividers>
              <div>
                <p className="text-sm font-semibold text-slate-500">Utilisateur</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-950">{fullName(selectedUser)}</h2>
                <p className="mt-1 text-slate-600">{selectedUser.email}</p>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Info label="Role" value={roleLabels[selectedUser.role]} />
                <Info label="Service" value={selectedUser.service?.name ?? "Non rattache"} />
                <Info label="Telephone" value={selectedUser.phone ?? "-"} />
                <Info label="Courriel" value={selectedUser.email} />
              </div>
            </DialogContent>
            <DialogActions>
              <Button color="inherit" onClick={closePopup}>
                Fermer
              </Button>
              <Button variant="contained" onClick={() => openEditForm(selectedUser)}>
                Modifier
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>

      <Dialog open={showForm} onClose={closePopup} fullWidth maxWidth="md">
        <form key={`${mode}-${selectedUser?.id ?? "new"}`} onSubmit={saveUser}>
          <DialogTitle>{mode === "edit" ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</DialogTitle>
          <DialogContent dividers>
            <div className="grid gap-3 md:grid-cols-2">
              <TextField name="firstName" label="Prenom" defaultValue={selectedUser?.firstName ?? ""} required />
              <TextField name="lastName" label="Nom" defaultValue={selectedUser?.lastName ?? ""} required />
              <TextField name="email" label="Courriel" type="email" defaultValue={selectedUser?.email ?? ""} required />
              <TextField name="password" label={mode === "edit" ? "Nouveau mot de passe" : "Mot de passe"} type="password" required={mode === "add"} helperText={mode === "edit" ? "Laisser vide pour garder l'ancien mot de passe" : "8 caracteres minimum"} />
              <TextField name="role" label="Role" select defaultValue={selectedUser?.role ?? "USER"}>
                {roles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {roleLabels[role]}
                  </MenuItem>
                ))}
              </TextField>
              <TextField name="serviceId" label="Service" select defaultValue={selectedUser?.serviceId ?? ""}>
                <MenuItem value="">Non rattache</MenuItem>
                {services.map((service) => (
                  <MenuItem key={service.id} value={service.id}>
                    {service.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField name="phone" label="Telephone" defaultValue={selectedUser?.phone ?? ""} />
            </div>
          </DialogContent>
          <DialogActions>
            <Button color="inherit" onClick={closePopup}>
              Annuler
            </Button>
            <Button type="submit" variant="contained">
              Enregistrer
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {loading ? <LoadingBlock /> : null}
      {!loading && data?.length === 0 ? <EmptyBlock label="Aucun utilisateur" /> : null}
      {!loading && data?.length ? (
        <>
        <div className="grid w-full min-w-0 gap-3 md:hidden">
          {data.map((user) => (
            <Paper key={user.id} elevation={0} className="w-full min-w-0 overflow-hidden rounded-lg border border-slate-200 p-4 shadow-soft">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-extrabold text-slate-950">{fullName(user)}</p>
                  <p className="mt-1 truncate text-sm text-slate-500">{user.email}</p>
                  <p className="mt-1 truncate text-sm text-slate-500">{user.service?.name ?? "Non rattache"} - {user.phone ?? "-"}</p>
                </div>
                <Chip className="shrink-0" label={roleLabels[user.role]} size="small" color={user.role === "ADMIN" ? "primary" : "default"} sx={{ maxWidth: 116 }} />
              </div>
              <div className="mt-3 flex justify-end gap-1">
                <Tooltip title="Voir">
                  <IconButton onClick={() => openView(user)}>
                    <VisibilityOutlinedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Modifier">
                  <IconButton color="primary" onClick={() => openEditForm(user)}>
                    <EditOutlinedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Supprimer">
                  <IconButton color="error" onClick={() => deleteUser(user)}>
                    <DeleteOutlineOutlinedIcon />
                  </IconButton>
                </Tooltip>
              </div>
            </Paper>
          ))}
        </div>
        <TableContainer component={Paper} elevation={0} className="hidden rounded-lg border border-slate-200 shadow-soft md:block" sx={{ maxWidth: "100%", overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom</TableCell>
                <TableCell>Courriel</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Telephone</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell className="font-semibold">{fullName(user)}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip label={roleLabels[user.role]} size="small" color={user.role === "ADMIN" ? "primary" : "default"} />
                  </TableCell>
                  <TableCell>{user.service?.name ?? "-"}</TableCell>
                  <TableCell>{user.phone ?? "-"}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Voir">
                      <IconButton onClick={() => openView(user)}>
                        <VisibilityOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifier">
                      <IconButton color="primary" onClick={() => openEditForm(user)}>
                        <EditOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton color="error" onClick={() => deleteUser(user)}>
                        <DeleteOutlineOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        </>
      ) : null}
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value}</p>
    </div>
  );
}
