type Mode = "baseline" | "disruption";

const states = [
  { name: "Arunachal Pradesh", shortName: "AR", x: 78, y: 18, accessibility: 84, status: "stable" },
  { name: "Assam", shortName: "AS", x: 54, y: 43, accessibility: 91, status: "stable" },
  { name: "Meghalaya", shortName: "ML", x: 39, y: 58, accessibility: 88, status: "stable" },
  { name: "Nagaland", shortName: "NL", x: 77, y: 48, accessibility: 79, status: "watch" },
  { name: "Manipur", shortName: "MN", x: 71, y: 69, accessibility: 72, status: "watch" },
  { name: "Mizoram", shortName: "MZ", x: 57, y: 82, accessibility: 86, status: "stable" },
  { name: "Tripura", shortName: "TR", x: 39, y: 77, accessibility: 93, status: "stable" },
  { name: "Sikkim", shortName: "SK", x: 20, y: 33, accessibility: 89, status: "stable" },
];

const baselineCorridors = [
  { id: "nh-27", name: "NH-27 · Guwahati–Tinsukia", points: [[34, 47], [54, 43], [72, 35]], status: "open", accessibility: 96, risk: 12 },
  { id: "nh-6", name: "NH-6 · Shillong–Silchar", points: [[39, 58], [47, 67], [57, 73]], status: "open", accessibility: 92, risk: 18 },
  { id: "nh-102", name: "NH-102 · Imphal–Moreh", points: [[71, 69], [82, 78]], status: "watch", accessibility: 83, risk: 34 },
  { id: "nh-29", name: "NH-29 · Dimapur–Kohima", points: [[66, 48], [77, 48], [87, 55]], status: "open", accessibility: 89, risk: 25 },
  { id: "nh-306", name: "NH-306 · Aizawl–Silchar", points: [[57, 82], [54, 70], [47, 67]], status: "open", accessibility: 87, risk: 27 },
  { id: "nh-10", name: "NH-10 · Siliguri–Gangtok", points: [[20, 33], [11, 25], [7, 39]], status: "open", accessibility: 94, risk: 15 },
];

const baselineVehicles = [
  { id: "NER-014", x: 49, y: 52, status: "Moving", cargo: "Medicine" },
  { id: "NER-022", x: 64, y: 62, status: "Moving", cargo: "Food grains" },
  { id: "NER-031", x: 46, y: 72, status: "Delayed", cargo: "Construction" },
  { id: "NER-087", x: 73, y: 45, status: "Moving", cargo: "Emergency goods" },
  { id: "NER-104", x: 37, y: 50, status: "Moving", cargo: "Agricultural produce" },
  { id: "NER-118", x: 59, y: 78, status: "Offline", cargo: "Medical supplies" },
];

const baselineIncidents = [
  { id: "INC-248", x: 67, y: 65, type: "Road damage", severity: "moderate" },
  { id: "INC-251", x: 43, y: 60, type: "Traffic blockage", severity: "low" },
  { id: "INC-255", x: 74, y: 51, type: "Weather hazard", severity: "moderate" },
];

const hubs = [
  { name: "Guwahati Hub", x: 51, y: 44, stockLevel: 88 },
  { name: "Imphal Hub", x: 71, y: 69, stockLevel: 42 },
  { name: "Shillong Hub", x: 39, y: 58, stockLevel: 76 },
  { name: "Aizawl Hub", x: 57, y: 82, stockLevel: 69 },
];

const predictionsBase = [
  {
    id: "PRED-102",
    title: "Landslide risk",
    corridor: "NH-102 · Imphal–Moreh",
    probability: 42,
    confidence: 78,
    window: "Next 12 hours",
    factors: ["Saturated slope", "Historical incidents", "Rising traffic"],
    impact: "One medicine delivery and 3 vehicles could be delayed.",
    recommendation: "Monitor the corridor and stage NER-014 at Imphal Hub.",
    alternative: "Use NH-2 via Mao if risk exceeds 55%.",
    level: "moderate",
  },
];

const disruptionPredictions = [
  {
    id: "PRED-102",
    title: "Landslide risk",
    corridor: "NH-102 · Imphal–Moreh",
    probability: 82,
    confidence: 87,
    window: "Next 6 hours",
    factors: ["184 mm rainfall forecast", "Steep saturated terrain", "7 historical incidents", "Recent field report"],
    impact: "2 critical medicine deliveries and 6 vehicles are exposed.",
    recommendation: "Reroute critical deliveries via NH-2 and dispatch a field verification mission.",
    alternative: "Hold all non-critical cargo at Imphal Hub until the weather window passes.",
    level: "critical",
  },
  {
    id: "PRED-088",
    title: "Flash flood exposure",
    corridor: "NH-6 · Shillong–Silchar",
    probability: 61,
    confidence: 81,
    window: "Next 18 hours",
    factors: ["Upstream rainfall", "River level +0.8m", "Drainage capacity"],
    impact: "Meghalaya accessibility may fall by 9 points.",
    recommendation: "Pre-position food grains at Shillong Hub.",
    alternative: "Prioritize airlift contingency for low-lying districts.",
    level: "high",
  },
];

const supplyRisksBase = [
  { district: "Imphal East", item: "Medicine", daysRemaining: 2.1, incomingEta: "8 hours", roadRisk: "HIGH", risk: "CRITICAL", recommendation: "Prioritize medicine delivery." },
  { district: "Churachandpur", item: "Food grains", daysRemaining: 3.4, incomingEta: "18 hours", roadRisk: "MEDIUM", risk: "WATCH", recommendation: "Keep alternate route on standby." },
  { district: "Kolasib", item: "Construction material", daysRemaining: 6.8, incomingEta: "2 days", roadRisk: "LOW", risk: "STABLE", recommendation: "Proceed on planned schedule." },
];

const supplyRisksDisruption = [
  { district: "Imphal East", item: "Medicine", daysRemaining: 1.4, incomingEta: "14 hours", roadRisk: "CRITICAL", risk: "CRITICAL", recommendation: "Reroute critical medicine delivery now." },
  { district: "Churachandpur", item: "Food grains", daysRemaining: 2.7, incomingEta: "26 hours", roadRisk: "HIGH", risk: "CRITICAL", recommendation: "Dispatch NER-014 from Imphal Hub." },
  { district: "Senapati", item: "Emergency goods", daysRemaining: 3.1, incomingEta: "30 hours", roadRisk: "HIGH", risk: "WATCH", recommendation: "Stage a backup vehicle at Mao." },
];

const activityBase = [
  { id: "ACT-01", time: "08:42", title: "Route check completed", detail: "NH-102 accessibility confirmed at 83%", tone: "teal" },
  { id: "ACT-02", time: "08:36", title: "Delivery moving", detail: "NER-014 carrying critical medicine to Imphal East", tone: "green" },
  { id: "ACT-03", time: "08:21", title: "Field report acknowledged", detail: "Traffic blockage near Nongpoh, Meghalaya", tone: "amber" },
];

let simulationActive = false;
let incidents = [...baselineIncidents.map((incident, index) => ({
  id: incident.id,
  type: incident.type,
  district: index === 0 ? "Imphal East" : index === 1 ? "Ri-Bhoi" : "Kohima",
  road: index === 0 ? "NH-102" : index === 1 ? "NH-6" : "NH-29",
  severity: incident.severity,
  status: "NEW",
  timestamp: "Today · " + ["08:21", "07:54", "07:31"][index],
  description: ["Debris reported on shoulder; one lane open.", "Heavy vehicles queueing near the checkpoint.", "Visibility reduced by low cloud cover."][index],
}))];
let alerts = [
  { id: "ALT-102", title: "Critical corridor exposure", message: "Rainfall has increased landslide probability on NH-102 to 82%. Two critical medicine deliveries are using this corridor.", severity: "critical", status: "OPEN", createdAt: "4 min ago", actions: ["acknowledge", "assign", "escalate"] },
  { id: "ALT-088", title: "Supply buffer narrowing", message: "Imphal East medicine stock is down to 2.1 days. Incoming delivery is exposed to the NH-102 risk window.", severity: "high", status: "OPEN", createdAt: "18 min ago", actions: ["acknowledge", "assign", "resolve"] },
];

function now() {
  return new Date().toISOString();
}

export function dashboard() {
  const disrupted = simulationActive;
  const corridors = disrupted
    ? baselineCorridors.map((corridor) => corridor.id === "nh-102"
      ? { ...corridor, status: "high-risk", accessibility: 58, risk: 82 }
      : corridor.id === "nh-6"
        ? { ...corridor, status: "watch", accessibility: 79, risk: 61 }
        : corridor)
    : baselineCorridors;
  const mapVehicles = disrupted
    ? baselineVehicles.map((vehicle) => vehicle.id === "NER-014"
      ? { ...vehicle, x: 63, y: 65, status: "Rerouting" }
      : vehicle.id === "NER-022"
        ? { ...vehicle, x: 69, y: 61, status: "Delayed" }
        : vehicle)
    : baselineVehicles;
  const mapIncidents = disrupted
    ? [...baselineIncidents, { id: "INC-260", x: 75, y: 68, type: "Landslide", severity: "critical" }]
    : baselineIncidents;
  return {
    mode: (disrupted ? "disruption" : "baseline") as Mode,
    updatedAt: now(),
    kpis: {
      accessibility: disrupted ? 76 : 88,
      activeVehicles: disrupted ? 38 : 42,
      deliveries: disrupted ? 18 : 21,
      criticalDeliveries: disrupted ? 4 : 2,
      riskCorridors: disrupted ? 3 : 1,
      incidents: disrupted ? 4 : 3,
      predictions: disrupted ? 3 : 1,
      averageDelay: disrupted ? 47 : 18,
    },
    map: {
      states: states.map((state) => state.name === "Manipur" && disrupted
        ? { ...state, accessibility: 61, status: "critical" }
        : state),
      corridors,
      vehicles: mapVehicles,
      incidents: mapIncidents,
      hubs: disrupted ? hubs.map((hub) => hub.name === "Imphal Hub" ? { ...hub, stockLevel: 31 } : hub) : hubs,
    },
    predictions: disrupted ? disruptionPredictions : predictionsBase,
    supplyRisks: disrupted ? supplyRisksDisruption : supplyRisksBase,
    activity: disrupted
      ? [
          { id: "ACT-10", time: "08:46", title: "AI prediction escalated", detail: "NH-102 landslide probability crossed 80%", tone: "red" },
          { id: "ACT-11", time: "08:45", title: "Critical delivery protected", detail: "Alternative route generated via NH-2", tone: "green" },
          { id: "ACT-12", time: "08:44", title: "Emergency mission created", detail: "Field verification assigned to R. Singh", tone: "amber" },
          ...activityBase,
        ]
      : activityBase,
    impact: disrupted
      ? { deliveriesProtected: 2, vehiclesRerouted: 6, riskAvoided: "₹18.4L", delayAvoided: "6h 24m", responseTime: "2m 18s" }
      : { deliveriesProtected: 0, vehiclesRerouted: 0, riskAvoided: "—", delayAvoided: "—", responseTime: "—" },
  };
}

export function setSimulation(active: boolean) {
  simulationActive = active;
  return dashboard();
}

export function listVehicles() {
  return [
    { id: "NER-014", type: "Medium truck", cargo: "Critical medicine", capacity: 82, driver: "Arun K.", origin: "Guwahati", destination: "Imphal East", speed: 42, eta: simulationActive ? "04:18" : "03:42", fuel: 74, priority: "CRITICAL", risk: simulationActive ? "HIGH" : "LOW", status: simulationActive ? "Rerouting" : "Moving" },
    { id: "NER-022", type: "Heavy truck", cargo: "Food grains", capacity: 68, driver: "M. Devi", origin: "Shillong", destination: "Churachandpur", speed: 31, eta: simulationActive ? "09:26" : "07:18", fuel: 61, priority: "HIGH", risk: simulationActive ? "HIGH" : "MEDIUM", status: simulationActive ? "Delayed" : "Moving" },
    { id: "NER-031", type: "Flatbed", cargo: "Construction material", capacity: 91, driver: "T. Ao", origin: "Dimapur", destination: "Kohima", speed: 18, eta: "02:04", fuel: 44, priority: "NORMAL", risk: "MEDIUM", status: "Delayed" },
    { id: "NER-087", type: "Utility van", cargo: "Emergency goods", capacity: 54, driver: "R. Singh", origin: "Imphal", destination: "Senapati", speed: 47, eta: "01:52", fuel: 83, priority: "HIGH", risk: "LOW", status: simulationActive ? "Emergency" : "Moving" },
    { id: "NER-104", type: "Refrigerated", cargo: "Agricultural produce", capacity: 76, driver: "P. Bora", origin: "Jorhat", destination: "Guwahati", speed: 52, eta: "01:12", fuel: 68, priority: "NORMAL", risk: "LOW", status: "Moving" },
  ];
}

export function listDeliveries() {
  return [
    { id: "DEL-441", cargo: "Medicine", quantity: 240, origin: "Guwahati Hub", destination: "Imphal East", eta: simulationActive ? "14 hours" : "8 hours", priority: "CRITICAL", status: simulationActive ? "Rerouting" : "In transit", risk: simulationActive ? "CRITICAL" : "LOW" },
    { id: "DEL-438", cargo: "Food grains", quantity: 820, origin: "Shillong Hub", destination: "Churachandpur", eta: simulationActive ? "26 hours" : "18 hours", priority: "HIGH", status: "In transit", risk: simulationActive ? "HIGH" : "MEDIUM" },
    { id: "DEL-432", cargo: "Emergency goods", quantity: 190, origin: "Imphal Hub", destination: "Senapati", eta: "30 hours", priority: "HIGH", status: "Queued", risk: simulationActive ? "HIGH" : "LOW" },
    { id: "DEL-427", cargo: "Construction material", quantity: 460, origin: "Dimapur Hub", destination: "Kohima", eta: "2 days", priority: "NORMAL", status: "In transit", risk: "LOW" },
];
}

export function listDistricts() {
  return [
    { id: "imphal-east", name: "Imphal East", state: "Manipur", population: 456113, accessibility: simulationActive ? 61 : 78, daysOfSupply: simulationActive ? 1.4 : 2.1, activeIncidents: simulationActive ? 2 : 1, weather: simulationActive ? "Heavy rain · 184 mm" : "Overcast · 42 mm", risk: simulationActive ? "CRITICAL" : "HIGH", criticalNeeds: ["Medicine", "Emergency goods"] },
    { id: "ri-bhoi", name: "Ri-Bhoi", state: "Meghalaya", population: 258840, accessibility: simulationActive ? 79 : 88, daysOfSupply: 4.3, activeIncidents: 1, weather: "Light rain · 18 mm", risk: "WATCH", criticalNeeds: ["Food grains"] },
    { id: "kohima", name: "Kohima", state: "Nagaland", population: 267988, accessibility: 84, daysOfSupply: 5.7, activeIncidents: 1, weather: "Cloudy · 12 mm", risk: "WATCH", criticalNeeds: ["Construction material"] },
    { id: "aizawl", name: "Aizawl", state: "Mizoram", population: 400309, accessibility: 91, daysOfSupply: 6.8, activeIncidents: 0, weather: "Clear · 4 mm", risk: "STABLE", criticalNeeds: ["Agricultural produce"] },
  ];
}

export function listIncidents() {
  return incidents;
}

export function createIncident(input: { type: string; district: string; road: string; severity: string; description: string }) {
  const incident = { id: `INC-${260 + incidents.length}`, ...input, status: "NEW", timestamp: now(), };
  incidents.unshift(incident);
  simulationActive = true;
  alerts.unshift({
    id: `ALT-${110 + incidents.length}`,
    title: "New field report received",
    message: `${input.type} reported on ${input.road} in ${input.district}. Risk engine recalculation started.`,
    severity: input.severity,
    status: "OPEN",
    createdAt: "Just now",
    actions: ["acknowledge", "assign", "escalate"],
  });
  return incident;
}

export function listAlerts() {
  return alerts;
}

export function actionAlert(id: string, action: string) {
  const alert = alerts.find((item) => item.id === id);
  if (!alert) return undefined;
  alert.status = action === "resolve" ? "RESOLVED" : action === "acknowledge" ? "ACKNOWLEDGED" : action.toUpperCase();
  return alert;
}

export function calculateRoutes(input: { origin: string; destination: string; cargo: string; quantity: number; priority: string; vehicleType: string }) {
  const urgency = input.priority === "CRITICAL" ? 1.2 : input.priority === "HIGH" ? 1.08 : 1;
  const riskBoost = simulationActive ? 1.35 : 1;
  return [
    { id: "route-safe", name: "Safest route · NH-2 via Mao", recommended: true, distance: "328 km", eta: simulationActive ? "08h 42m" : "07h 58m", weatherRisk: Math.round(18 * riskBoost), landslideRisk: Math.round(14 * riskBoost), floodRisk: 9, traffic: "Moderate", accessibility: 92, fuel: "38.4 L", overallRisk: "LOW", score: Math.round(91 / urgency), explanation: ["92% road accessibility", "Low flood and landslide risk", "21% less disruption probability", "44 minutes slower than fastest route"] },
    { id: "route-fast", name: "Fastest route · NH-102", recommended: false, distance: "284 km", eta: simulationActive ? "07h 18m" : "06h 24m", weatherRisk: Math.round(47 * riskBoost), landslideRisk: Math.round(82 * riskBoost), floodRisk: 33, traffic: "Heavy", accessibility: simulationActive ? 58 : 83, fuel: "34.2 L", overallRisk: simulationActive ? "CRITICAL" : "MEDIUM", score: Math.round((72 - (simulationActive ? 24 : 0)) / urgency), explanation: ["Shortest travel time", "Landslide probability is 82% on exposed segment", "Two critical deliveries currently use this corridor"] },
    { id: "route-low-risk", name: "Lowest risk · NH-6 east link", recommended: false, distance: "351 km", eta: "09h 18m", weatherRisk: 22, landslideRisk: 11, floodRisk: 12, traffic: "Light", accessibility: 89, fuel: "41.1 L", overallRisk: "LOW", score: Math.round(86 / urgency), explanation: ["Lowest combined disruption probability", "Light traffic across 84% of the route", "Adds 1h 20m to delivery window"] },
  ];
}

export function createMission(input: { mission: string; destination: string; cargo: string; quantity: number; deadline: string; priority: string }) {
  return {
    id: `MIS-${410 + incidents.length}`,
    mission: input.mission,
    destination: input.destination,
    vehicle: "NER-014 · Arun K.",
    route: "NH-2 via Mao · safest route",
    backupRoute: "NH-6 east link",
    eta: "08h 42m",
    risk: "LOW",
    status: "DISPATCHED",
  };
}

export function analytics() {
  return {
    deliverySuccess: simulationActive ? 94.2 : 96.8,
    averageDelay: simulationActive ? 47 : 18,
    routeReliability: simulationActive ? 88.4 : 93.1,
    shortages: simulationActive ? 4 : 2,
    incidents: simulationActive ? 31 : 27,
    utilization: simulationActive ? 84.6 : 81.2,
    accessibility: simulationActive ? 76 : 88,
    responseTime: simulationActive ? 2.3 : 4.8,
  };
}