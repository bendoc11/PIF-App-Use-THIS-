// Mock university dataset for the Recruit feature.
// Will be replaced by a real coaches database later.

export type Division = "D1" | "D2" | "D3" | "JUCO" | "NAIA";
export type AcademicLevel = "Good" | "Great" | "Elite";
export type SchoolSize = "Small" | "Medium" | "Large";

export interface MockCoach {
  name: string;
  title: string;
  email: string;
}

export interface MockSchool {
  id: string;
  name: string;
  city: string;
  state: string;
  stateCode: string;
  // [longitude, latitude]
  coordinates: [number, number];
  division: Division;
  academicLevel: AcademicLevel;
  enrollment: number;
  size: SchoolSize;
  coaches: MockCoach[];
}

const sized = (n: number): SchoolSize => (n < 3000 ? "Small" : n <= 10000 ? "Medium" : "Large");

const raw: Omit<MockSchool, "size">[] = [
  { id: "duke", name: "Duke University", city: "Durham", state: "North Carolina", stateCode: "NC", coordinates: [-78.9382, 36.0014], division: "D1", academicLevel: "Elite", enrollment: 6800, coaches: [
    { name: "Jon Scheyer", title: "Head Coach", email: "jon.scheyer@duke.edu" },
    { name: "Chris Carrawell", title: "Associate Head Coach", email: "chris.carrawell@duke.edu" },
    { name: "Jai Lucas", title: "Assistant Coach", email: "jai.lucas@duke.edu" },
  ]},
  { id: "unc", name: "University of North Carolina", city: "Chapel Hill", state: "North Carolina", stateCode: "NC", coordinates: [-79.0469, 35.9049], division: "D1", academicLevel: "Elite", enrollment: 19400, coaches: [
    { name: "Hubert Davis", title: "Head Coach", email: "hubert.davis@unc.edu" },
    { name: "Jeff Lebo", title: "Assistant Coach", email: "jeff.lebo@unc.edu" },
  ]},
  { id: "kentucky", name: "University of Kentucky", city: "Lexington", state: "Kentucky", stateCode: "KY", coordinates: [-84.5037, 38.0406], division: "D1", academicLevel: "Great", enrollment: 22500, coaches: [
    { name: "Mark Pope", title: "Head Coach", email: "mark.pope@uky.edu" },
    { name: "Cody Fueger", title: "Associate Head Coach", email: "cody.fueger@uky.edu" },
  ]},
  { id: "kansas", name: "University of Kansas", city: "Lawrence", state: "Kansas", stateCode: "KS", coordinates: [-95.2353, 38.9543], division: "D1", academicLevel: "Great", enrollment: 19400, coaches: [
    { name: "Bill Self", title: "Head Coach", email: "bill.self@ku.edu" },
    { name: "Norm Roberts", title: "Associate Head Coach", email: "norm.roberts@ku.edu" },
  ]},
  { id: "ucla", name: "UCLA", city: "Los Angeles", state: "California", stateCode: "CA", coordinates: [-118.4452, 34.0689], division: "D1", academicLevel: "Elite", enrollment: 32400, coaches: [
    { name: "Mick Cronin", title: "Head Coach", email: "mick.cronin@ucla.edu" },
    { name: "Darren Savino", title: "Assistant Coach", email: "darren.savino@ucla.edu" },
  ]},
  { id: "michigan", name: "University of Michigan", city: "Ann Arbor", state: "Michigan", stateCode: "MI", coordinates: [-83.7430, 42.2780], division: "D1", academicLevel: "Elite", enrollment: 32700, coaches: [
    { name: "Dusty May", title: "Head Coach", email: "dusty.may@umich.edu" },
    { name: "Kyle Church", title: "Assistant Coach", email: "kyle.church@umich.edu" },
  ]},
  { id: "gonzaga", name: "Gonzaga University", city: "Spokane", state: "Washington", stateCode: "WA", coordinates: [-117.4015, 47.6678], division: "D1", academicLevel: "Great", enrollment: 7400, coaches: [
    { name: "Mark Few", title: "Head Coach", email: "mark.few@gonzaga.edu" },
    { name: "Brian Michaelson", title: "Assistant Coach", email: "brian.michaelson@gonzaga.edu" },
  ]},
  { id: "villanova", name: "Villanova University", city: "Villanova", state: "Pennsylvania", stateCode: "PA", coordinates: [-75.3434, 40.0376], division: "D1", academicLevel: "Elite", enrollment: 10800, coaches: [
    { name: "Kyle Neptune", title: "Head Coach", email: "kyle.neptune@villanova.edu" },
    { name: "Mike Nardi", title: "Assistant Coach", email: "mike.nardi@villanova.edu" },
  ]},
  { id: "texas", name: "University of Texas", city: "Austin", state: "Texas", stateCode: "TX", coordinates: [-97.7431, 30.2849], division: "D1", academicLevel: "Great", enrollment: 51800, coaches: [
    { name: "Rodney Terry", title: "Head Coach", email: "rodney.terry@texas.edu" },
    { name: "Frank Haith", title: "Assistant Coach", email: "frank.haith@texas.edu" },
  ]},
  { id: "florida", name: "University of Florida", city: "Gainesville", state: "Florida", stateCode: "FL", coordinates: [-82.3549, 29.6436], division: "D1", academicLevel: "Great", enrollment: 52400, coaches: [
    { name: "Todd Golden", title: "Head Coach", email: "todd.golden@ufl.edu" },
    { name: "Korey McCray", title: "Assistant Coach", email: "korey.mccray@ufl.edu" },
  ]},
  // D2
  { id: "nova-southeastern", name: "Nova Southeastern University", city: "Fort Lauderdale", state: "Florida", stateCode: "FL", coordinates: [-80.2475, 26.0681], division: "D2", academicLevel: "Good", enrollment: 20500, coaches: [
    { name: "Jim Crutchfield", title: "Head Coach", email: "jim.crutchfield@nova.edu" },
    { name: "Greg Herenda", title: "Assistant Coach", email: "greg.herenda@nova.edu" },
  ]},
  { id: "grand-valley", name: "Grand Valley State University", city: "Allendale", state: "Michigan", stateCode: "MI", coordinates: [-85.8889, 42.9636], division: "D2", academicLevel: "Good", enrollment: 22400, coaches: [
    { name: "Cornell Mann", title: "Head Coach", email: "cornell.mann@gvsu.edu" },
    { name: "Joe Burton", title: "Assistant Coach", email: "joe.burton@gvsu.edu" },
  ]},
  { id: "west-liberty", name: "West Liberty University", city: "West Liberty", state: "West Virginia", stateCode: "WV", coordinates: [-80.5945, 40.1689], division: "D2", academicLevel: "Good", enrollment: 2400, coaches: [
    { name: "Ben Howlett", title: "Head Coach", email: "ben.howlett@westliberty.edu" },
    { name: "Drew Davis", title: "Assistant Coach", email: "drew.davis@westliberty.edu" },
  ]},
  // D3
  { id: "williams", name: "Williams College", city: "Williamstown", state: "Massachusetts", stateCode: "MA", coordinates: [-73.2073, 42.7128], division: "D3", academicLevel: "Elite", enrollment: 2200, coaches: [
    { name: "Kevin App", title: "Head Coach", email: "kevin.app@williams.edu" },
    { name: "Tyler Reynolds", title: "Assistant Coach", email: "tyler.reynolds@williams.edu" },
  ]},
  { id: "wash-u", name: "Washington University in St. Louis", city: "St. Louis", state: "Missouri", stateCode: "MO", coordinates: [-90.3057, 38.6488], division: "D3", academicLevel: "Elite", enrollment: 7800, coaches: [
    { name: "Pat Juckem", title: "Head Coach", email: "pat.juckem@wustl.edu" },
    { name: "Brian O'Mara", title: "Assistant Coach", email: "brian.omara@wustl.edu" },
  ]},
  { id: "amherst", name: "Amherst College", city: "Amherst", state: "Massachusetts", stateCode: "MA", coordinates: [-72.5168, 42.3709], division: "D3", academicLevel: "Elite", enrollment: 1900, coaches: [
    { name: "David Hixon", title: "Head Coach", email: "david.hixon@amherst.edu" },
    { name: "Aaron Toomey", title: "Assistant Coach", email: "aaron.toomey@amherst.edu" },
  ]},
  // JUCO
  { id: "salt-lake", name: "Salt Lake Community College", city: "Salt Lake City", state: "Utah", stateCode: "UT", coordinates: [-111.9286, 40.6717], division: "JUCO", academicLevel: "Good", enrollment: 28000, coaches: [
    { name: "Todd Phillips", title: "Head Coach", email: "todd.phillips@slcc.edu" },
    { name: "Marcus Jenkins", title: "Assistant Coach", email: "marcus.jenkins@slcc.edu" },
  ]},
  { id: "northwest-florida", name: "Northwest Florida State College", city: "Niceville", state: "Florida", stateCode: "FL", coordinates: [-86.4794, 30.5191], division: "JUCO", academicLevel: "Good", enrollment: 6300, coaches: [
    { name: "Steve DeMeo", title: "Head Coach", email: "steve.demeo@nwfsc.edu" },
    { name: "Tony Reid", title: "Assistant Coach", email: "tony.reid@nwfsc.edu" },
  ]},
  // NAIA
  { id: "indiana-wesleyan", name: "Indiana Wesleyan University", city: "Marion", state: "Indiana", stateCode: "IN", coordinates: [-85.6589, 40.5584], division: "NAIA", academicLevel: "Good", enrollment: 3100, coaches: [
    { name: "Greg Tonagel", title: "Head Coach", email: "greg.tonagel@indwes.edu" },
    { name: "Brad Sheafer", title: "Assistant Coach", email: "brad.sheafer@indwes.edu" },
  ]},
  { id: "lewis-clark", name: "Lewis-Clark State College", city: "Lewiston", state: "Idaho", stateCode: "ID", coordinates: [-117.0177, 46.4165], division: "NAIA", academicLevel: "Good", enrollment: 4000, coaches: [
    { name: "Austin Johnson", title: "Head Coach", email: "austin.johnson@lcsc.edu" },
    { name: "Ryan Looney", title: "Assistant Coach", email: "ryan.looney@lcsc.edu" },
  ]},
];

export const MOCK_SCHOOLS: MockSchool[] = raw.map((s) => ({ ...s, size: sized(s.enrollment) }));

export const DIVISION_COLORS: Record<Division, string> = {
  D1: "#2563eb", // blue-600
  D2: "#16a34a", // green-600
  D3: "#ea580c", // orange-600
  JUCO: "#9333ea", // purple-600
  NAIA: "#6b7280", // gray-500
};

export const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky",
  "Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri",
  "Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York",
  "North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
  "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington",
  "West Virginia","Wisconsin","Wyoming",
];
