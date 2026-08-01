import { MouseEvent, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import HourglassTopOutlinedIcon from "@mui/icons-material/HourglassTopOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PlaylistAddOutlinedIcon from "@mui/icons-material/PlaylistAddOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { roleLabels } from "../data/labels";
import type { Notification } from "../types";
import { formatDate } from "../utils/format";

const adminDrawerWidth = 270;
const userDrawerWidth = 250;

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? "K"}${lastName?.[0] ?? "T"}`.toUpperCase();
}

export function AppLayout({ variant }: { variant: "admin" | "user" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = window.location.pathname;
  const drawerWidth = variant === "user" ? userDrawerWidth : adminDrawerWidth;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationAnchor, setNotificationAnchor] = useState<HTMLElement | null>(null);

  const navItems = useMemo(
    () =>
      variant === "admin"
        ? [
            { label: "Tableau de bord", path: "/admin", icon: <DashboardOutlinedIcon /> },
            { label: "Demandes", path: "/admin/tickets", icon: <SupportAgentOutlinedIcon /> },
            { label: "Liste d'attente", path: "/admin/waiting-list", icon: <HourglassTopOutlinedIcon /> },
            { label: "Rapports", path: "/admin/reports", icon: <AssessmentOutlinedIcon /> },
            { label: "Utilisateurs", path: "/admin/users", icon: <PeopleAltOutlinedIcon /> },
            { label: "Parametres", path: "/admin/settings", icon: <SettingsOutlinedIcon /> },
          ]
        : [
            { label: "Mes interventions", path: "/user", icon: <DescriptionOutlinedIcon /> },
            { label: "Nouvelle demande", path: "/user/new-ticket", icon: <PlaylistAddOutlinedIcon /> },
            { label: "File d'attente", path: "/user/waiting-list", icon: <PersonOutlineOutlinedIcon /> },
          ],
    [variant],
  );

  const pageTitle =
    pathname.includes("waiting-list")
      ? "File d'attente des interventions"
      : pathname.includes("new-ticket")
        ? "Nouvelle demande"
        : variant === "user"
          ? "Mes interventions"
          : "Gestion des interventions informatiques";

  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  async function loadNotifications() {
    const { data } = await api.get<Notification[]>("/notifications");
    setNotifications(data);
  }

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user?.id]);

  async function openNotifications(event: MouseEvent<HTMLElement>) {
    setNotificationAnchor(event.currentTarget);
    await loadNotifications();
  }

  async function markNotificationRead(notification: Notification) {
    if (!notification.readAt) {
      await api.patch(`/notifications/${notification.id}/read`);
      setNotifications((items) => items.map((item) => (item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item)));
    }
  }

  async function openNotification(notification: Notification) {
    await markNotificationRead(notification);
    setNotificationAnchor(null);
    if (notification.ticket?.id) {
      navigate(variant === "admin" ? `/admin/tickets/${notification.ticket.id}` : `/user/tickets/${notification.ticket.id}`);
    }
  }

  async function markAllNotificationsRead() {
    await api.patch("/notifications/read-all");
    const now = new Date().toISOString();
    setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt ?? now })));
  }

  const drawer = (
    <div className="flex h-full bg-white text-slate-900">
      <div className="flex min-h-0 w-full flex-col px-3 py-6">
        <div className="flex items-center gap-3 px-2">
          <img src="/kelibia-logo.png" alt="Municipalite de Kelibia" className="h-14 w-14 rounded-lg object-contain" />
          <div>
            <p className="text-lg font-bold leading-tight">KeliTech</p>
            <p className="text-sm text-slate-600">Municipalite de Kelibia</p>
          </div>
        </div>
        <nav className="mt-10 flex-1 space-y-2 overflow-y-auto pr-1">
          {navItems.map((item) => (
            <NavLink
              key={`${item.path}-${item.label}`}
              to={item.path}
              end={item.path === "/admin" || item.path === "/user"}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                [
                  "group flex min-h-12 items-center gap-3 rounded-md px-3 text-[15px] font-semibold transition",
                  isActive ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50 hover:text-blue-700",
                ].join(" ")
              }
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center [&>svg]:text-[22px]">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 border-t border-slate-200 pt-4">
          <Button
            fullWidth
            color="inherit"
            startIcon={<LogoutOutlinedIcon />}
            onClick={() => {
              logout();
              navigate("/login");
            }}
            sx={{ justifyContent: "flex-start", color: "#0f172a" }}
          >
            Deconnexion
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8fafc" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: "rgba(255,255,255,0.96)",
          color: "#0f172a",
          borderBottom: "1px solid #e2e8f0",
          backdropFilter: "blur(14px)",
        }}
      >
        <Toolbar sx={{ minHeight: 80, gap: 2, px: { xs: 2, lg: 4 } }}>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ display: { md: "none" } }}>
            <MenuIcon />
          </IconButton>
          {variant === "user" ? null : <ViewListOutlinedIcon sx={{ display: { xs: "none", sm: "block" }, color: "#2563eb" }} />}
          <Typography variant="body1" sx={{ flexGrow: 1, color: variant === "user" ? "#0f172a" : "#5b6b86", fontWeight: 700 }}>
            {pageTitle}
          </Typography>
          <Tooltip title="Notifications">
            <IconButton sx={{ mr: 1 }} onClick={openNotifications}>
              <Badge color="error" badgeContent={unreadCount} max={99}>
                <NotificationsNoneOutlinedIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={() => setNotificationAnchor(null)}
            PaperProps={{ sx: { width: 360, maxWidth: "calc(100vw - 32px)", mt: 1, borderRadius: 2 } }}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-950">Notifications</p>
                <p className="text-xs text-slate-500">{unreadCount ? `${unreadCount} non lue(s)` : "Tout est lu"}</p>
              </div>
              <Button size="small" disabled={!unreadCount} onClick={markAllNotificationsRead}>
                Tout lire
              </Button>
            </div>
            <Divider />
            {notifications.length ? (
              notifications.map((notification) => (
                <MenuItem key={notification.id} onClick={() => openNotification(notification)} sx={{ alignItems: "flex-start", gap: 1.5, whiteSpace: "normal", py: 1.5 }}>
                  <span className={["mt-1 h-2.5 w-2.5 shrink-0 rounded-full", notification.readAt ? "bg-slate-300" : "bg-blue-600"].join(" ")} />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-950">{notification.title}</span>
                    <span className="mt-0.5 block text-sm text-slate-600">{notification.message}</span>
                    <span className="mt-1 block text-xs text-slate-400">{formatDate(notification.createdAt)}</span>
                  </span>
                </MenuItem>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-slate-500">Aucune notification</div>
            )}
          </Menu>
          <div className="flex min-w-0 items-center gap-3">
            <Avatar sx={{ width: 44, height: 44, bgcolor: "#2563eb", fontWeight: 800 }}>{initials(user?.firstName, user?.lastName)}</Avatar>
            <span className="hidden text-left leading-tight md:block">
              <span className="block text-sm font-bold">{user ? `${user.firstName} ${user.lastName}` : "KeliTech"}</span>
              <span className="block text-xs text-slate-500">{user ? roleLabels[user.role] : ""}</span>
            </span>
          </div>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, border: 0 },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${drawerWidth}px)` }, pt: 12, px: { xs: 2, lg: variant === "user" ? 3 : 4 }, pb: 5 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
