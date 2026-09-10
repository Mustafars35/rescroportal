export type Stage =
  | "Waiting for Mesh"
  | "Waiting for Frame"
  | "Waiting for Assembly"
  | "Quality Control"
  | "Waiting for Packing"
  | "Packed"
  | "Finished";

export type Order = {
  id: string;
  customer: string;
  date: string;
  store: string;
  stage: Stage;
  last: string;
  eta: string;
  product: string;
  color: string;
  width: number;
  height: number;
  direction: "Vertical" | "Horizontal";
  threshold: string;
  quantity: number;
};

export const stages: Stage[] = [
  "Waiting for Mesh",
  "Waiting for Frame",
  "Waiting for Assembly",
  "Quality Control",
  "Waiting for Packing",
  "Packed",
  "Finished",
];

export const orders: Order[] = [
  {id:"NL101-11072",customer:"Sophie de Vries",date:"10/09/2026",store:".nl",stage:"Waiting for Mesh",last:"-",eta:"Upcoming 4 days",product:"Single screen",color:"White",width:100,height:220,direction:"Vertical",threshold:"None",quantity:1},
  {id:"DE101-4208",customer:"Lukas Schneider",date:"10/09/2026",store:".de",stage:"Waiting for Frame",last:"Mesh completed",eta:"Upcoming 3 days",product:"Single screen - Pollen",color:"Anthracite",width:118,height:214,direction:"Vertical",threshold:"None",quantity:1},
  {id:"FR101-1943",customer:"Camille Bernard",date:"09/09/2026",store:".fr",stage:"Waiting for Assembly",last:"Frame completed",eta:"Upcoming 2 days",product:"Double screen",color:"Black",width:196,height:224,direction:"Horizontal",threshold:"35 mm",quantity:1},
  {id:"NL101-11038",customer:"Daan Jansen",date:"09/09/2026",store:".nl",stage:"Quality Control",last:"Assembly completed",eta:"Upcoming 1 day",product:"Curtain screen",color:"Anthracite",width:182,height:230,direction:"Horizontal",threshold:"35 mm",quantity:2},
  {id:"ES101-572",customer:"María González",date:"08/09/2026",store:".es",stage:"Waiting for Packing",last:"QC completed",eta:"Today",product:"Single screen",color:"White",width:95,height:205,direction:"Vertical",threshold:"9 mm",quantity:1},
  {id:"DK101-806",customer:"Freja Nielsen",date:"08/09/2026",store:".dk",stage:"Packed",last:"Packing completed",eta:"Ready",product:"Double screen",color:"RAL 7016",width:210,height:238,direction:"Horizontal",threshold:"35 mm",quantity:1},
  {id:"UK101-2331",customer:"Oliver Taylor",date:"07/09/2026",store:".uk",stage:"Finished",last:"Manually finished",eta:"-",product:"Single screen",color:"Black",width:103,height:217,direction:"Vertical",threshold:"None",quantity:1},
  {id:"PL101-481",customer:"Zofia Kowalska",date:"07/09/2026",store:".pl",stage:"Waiting for Mesh",last:"-",eta:"Upcoming 5 days",product:"Curtain screen",color:"White",width:160,height:212,direction:"Horizontal",threshold:"35 mm",quantity:2},
  {id:"NL101-11021",customer:"Mila Smit",date:"06/09/2026",store:".nl",stage:"Packed",last:"Packing completed",eta:"Ready",product:"Single screen - Pollen",color:"Anthracite",width:112,height:228,direction:"Vertical",threshold:"None",quantity:1},
  {id:"DE101-4190",customer:"Anna Fischer",date:"06/09/2026",store:".de",stage:"Finished",last:"Manually finished",eta:"-",product:"Single screen",color:"White",width:91,height:198,direction:"Vertical",threshold:"9 mm",quantity:1},
];

export function getOrder(orderId: string) {
  return orders.find((order) => order.id === decodeURIComponent(orderId));
}
