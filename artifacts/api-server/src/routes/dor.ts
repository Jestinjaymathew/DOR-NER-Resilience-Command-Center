import { Router, type IRouter } from "express";
import {
  GetDashboardResponse,
  ListDistrictsResponse,
  ListVehiclesResponse,
  ListDeliveriesResponse,
  ListIncidentsResponse,
  CreateIncidentBody,
  CreateIncidentResponse,
  ListAlertsResponse,
  ActionAlertParams,
  ActionAlertBody,
  ActionAlertResponse,
  CalculateRoutesBody,
  CalculateRoutesResponse,
  CreateMissionBody,
  CreateMissionResponse,
  GetAnalyticsQueryParams,
  GetAnalyticsResponse,
  SimulateDisruptionResponse,
  ResetSimulationResponse,
} from "@workspace/api-zod";
import {
  actionAlert,
  analytics,
  calculateRoutes,
  createIncident,
  createMission,
  dashboard,
  listAlerts,
  listDeliveries,
  listDistricts,
  listIncidents,
  listVehicles,
  setSimulation,
} from "../lib/dor-data";

const router: IRouter = Router();

router.get("/dashboard", (_req, res) => res.json(GetDashboardResponse.parse(dashboard())));
router.get("/districts", (_req, res) => res.json(ListDistrictsResponse.parse(listDistricts())));
router.get("/vehicles", (_req, res) => res.json(ListVehiclesResponse.parse(listVehicles())));
router.get("/deliveries", (_req, res) => res.json(ListDeliveriesResponse.parse(listDeliveries())));
router.get("/incidents", (_req, res) => res.json(ListIncidentsResponse.parse(listIncidents())));

router.post("/incidents", (req, res): void => {
  const parsed = CreateIncidentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.status(201).json(CreateIncidentResponse.parse(createIncident(parsed.data)));
});

router.get("/alerts", (_req, res) => res.json(ListAlertsResponse.parse(listAlerts())));
router.post("/alerts/:id/action", (req, res): void => {
  const params = ActionAlertParams.safeParse(req.params);
  const body = ActionAlertBody.safeParse(req.body);
  if (!params.success || !body.success) {
    const message = !params.success
      ? params.error.message
      : !body.success
        ? body.error.message
        : "Invalid request";
    res.status(400).json({ error: message });
    return;
  }
  const alert = actionAlert(params.data.id, body.data.action);
  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json(ActionAlertResponse.parse(alert));
});

router.post("/route-options", (req, res): void => {
  const parsed = CalculateRoutesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.json(CalculateRoutesResponse.parse(calculateRoutes(parsed.data)));
});

router.post("/missions", (req, res): void => {
  const parsed = CreateMissionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.status(201).json(CreateMissionResponse.parse(createMission(parsed.data)));
});

router.get("/analytics", (req, res): void => {
  const parsed = GetAnalyticsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.json(GetAnalyticsResponse.parse(analytics()));
});

router.post("/simulation/disruption", (_req, res) => {
  const result = { dashboard: setSimulation(true), chain: ["Weather changes", "AI detects increasing rainfall", "NH-102 flagged high risk", "Critical deliveries identified", "Alternative route calculated", "NER-014 selected", "Emergency mission created"], headline: "Severe rainfall scenario contained by DOR Resilience Engine" };
  res.json(SimulateDisruptionResponse.parse(result));
});

router.post("/simulation/reset", (_req, res) => {
  res.json(ResetSimulationResponse.parse(setSimulation(false)));
});

export default router;