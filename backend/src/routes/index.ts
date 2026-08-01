import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { dashboardRouter } from "./dashboard.routes.js";
import { notificationsRouter } from "./notifications.routes.js";
import { optionsRouter } from "./options.routes.js";
import { reportsRouter } from "./reports.routes.js";
import { servicesRouter } from "./services.routes.js";
import { ticketsRouter } from "./tickets.routes.js";
import { usersRouter } from "./users.routes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/tickets", ticketsRouter);
apiRouter.use("/services", servicesRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/options", optionsRouter);
apiRouter.use("/reports", reportsRouter);
