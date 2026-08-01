import { FormEvent, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { api } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { useAppOptions } from "../../hooks/useAppOptions";
import type { AppOption, OptionCategory, Service } from "../../types";

export function SettingsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const { all: appOptions, refresh: refreshOptions } = useAppOptions();

  async function loadServices() {
    const { data } = await api.get<Service[]>("/services");
    setServices(data);
  }

  useEffect(() => {
    loadServices();
  }, []);

  async function createService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await api.post("/services", {
      name: formData.get("name"),
      code: formData.get("code"),
      departmentId: null,
    });
    event.currentTarget.reset();
    await loadServices();
  }

  async function updateService(id: string, form: HTMLFormElement) {
    const formData = new FormData(form);
    await api.patch(`/services/${id}`, {
      name: formData.get("name"),
      code: formData.get("code"),
    });
    await loadServices();
  }

  async function deleteService(id: string) {
    if (!confirm("Supprimer ce service ?")) return;
    await api.delete(`/services/${id}`);
    await loadServices();
  }

  async function updateOption(option: AppOption, form: HTMLFormElement) {
    const formData = new FormData(form);
    await api.patch(`/options/${option.id}`, {
      label: formData.get("label"),
      sortOrder: formData.get("sortOrder"),
      isActive: formData.get("isActive") === "on",
    });
    await refreshOptions();
  }

  async function createOption(category: OptionCategory, form: HTMLFormElement) {
    const formData = new FormData(form);
    await api.post("/options", {
      category,
      label: formData.get("label"),
      sortOrder: formData.get("sortOrder") || 99,
    });
    form.reset();
    await refreshOptions();
  }

  async function deleteOption(id: string) {
    if (!confirm("Supprimer cette option ?")) return;
    await api.delete(`/options/${id}`);
    await refreshOptions();
  }

  const groupedOptions = appOptions.reduce<Record<OptionCategory, AppOption[]>>(
    (acc, option) => {
      acc[option.category].push(option);
      return acc;
    },
    { status: [], priority: [], problemType: [] },
  );

  return (
    <>
      <PageHeader title="Parametres" subtitle="Services et options des listes" />

      <div className="grid gap-5 xl:grid-cols-2">
        <Paper elevation={0} className="rounded-lg border border-slate-200 p-4 shadow-soft">
          <h2 className="text-lg font-bold text-slate-950">Services</h2>
          <p className="mt-1 text-sm text-slate-500">Ces services alimentent les listes de service.</p>

          <form className="mt-4 grid gap-3 md:grid-cols-[1fr,120px,auto]" onSubmit={createService}>
            <TextField name="name" label="Nom du service" size="small" required />
            <TextField name="code" label="Code" size="small" required />
            <Button type="submit" variant="contained" startIcon={<AddOutlinedIcon />}>
              Ajouter
            </Button>
          </form>

          <div className="mt-4 space-y-3">
            {services.map((service) => (
              <form key={service.id} className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr,120px,auto,auto]" onSubmit={(event) => event.preventDefault()}>
                <TextField name="name" label="Nom" size="small" defaultValue={service.name} />
                <TextField name="code" label="Code" size="small" defaultValue={service.code} />
                <IconButton color="primary" onClick={(event) => updateService(service.id, event.currentTarget.closest("form")!)}>
                  <SaveOutlinedIcon />
                </IconButton>
                <IconButton color="error" onClick={() => deleteService(service.id)}>
                  <DeleteOutlineOutlinedIcon />
                </IconButton>
              </form>
            ))}
          </div>
        </Paper>

        <Paper elevation={0} className="rounded-lg border border-slate-200 p-4 shadow-soft">
          <h2 className="text-lg font-bold text-slate-950">Options des listes</h2>
          <p className="mt-1 text-sm text-slate-500">Ajoutez, modifiez, activez ou supprimez les valeurs disponibles.</p>

          <div className="mt-4 space-y-5">
            <OptionGroup title="Statuts" category="status" options={groupedOptions.status} onCreate={createOption} onDelete={deleteOption} onSave={updateOption} />
            <OptionGroup title="Priorites" category="priority" options={groupedOptions.priority} onCreate={createOption} onDelete={deleteOption} onSave={updateOption} />
            <OptionGroup title="Types de probleme" category="problemType" options={groupedOptions.problemType} onCreate={createOption} onDelete={deleteOption} onSave={updateOption} />
          </div>
        </Paper>
      </div>
    </>
  );
}

function OptionGroup({
  title,
  category,
  options,
  onCreate,
  onDelete,
  onSave,
}: {
  title: string;
  category: OptionCategory;
  options: AppOption[];
  onCreate: (category: OptionCategory, form: HTMLFormElement) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSave: (option: AppOption, form: HTMLFormElement) => Promise<void>;
}) {
  return (
    <section>
      <h3 className="text-sm font-bold uppercase text-slate-500">{title}</h3>
      <form className="mt-2 grid items-center gap-2 rounded-lg border border-dashed border-blue-200 bg-blue-50/40 p-2 md:grid-cols-[1fr,90px,auto]" onSubmit={(event) => event.preventDefault()}>
        <TextField name="label" label="Nouvelle option" size="small" required />
        <TextField name="sortOrder" label="Ordre" size="small" type="number" defaultValue={99} />
        <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={(event) => onCreate(category, event.currentTarget.closest("form")!)}>
          Ajouter
        </Button>
      </form>
      <div className="mt-2 space-y-2">
        {options.map((option) => (
          <form key={option.id} className="grid items-center gap-2 rounded-lg border border-slate-200 p-2 md:grid-cols-[1fr,90px,80px,auto,auto]" onSubmit={(event) => event.preventDefault()}>
            <TextField name="label" label="Libelle" size="small" defaultValue={option.label} />
            <TextField name="sortOrder" label="Ordre" size="small" type="number" defaultValue={option.sortOrder} />
            <label className="flex items-center text-sm font-semibold text-slate-600">
              <Checkbox name="isActive" defaultChecked={option.isActive} size="small" />
              Actif
            </label>
            <IconButton color="primary" onClick={(event) => onSave(option, event.currentTarget.closest("form")!)}>
              <SaveOutlinedIcon />
            </IconButton>
            <IconButton color="error" onClick={() => onDelete(option.id)}>
              <DeleteOutlineOutlinedIcon />
            </IconButton>
          </form>
        ))}
      </div>
    </section>
  );
}
