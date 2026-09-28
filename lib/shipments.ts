export type ShipmentStatus = "Created" | "Loading" | "Departed" | "Arrived" | "Completed";
export type ShipmentDocument = { name:string; type:"xlsx"|"pdf"; url?:string };
export type Shipment = {
  id:string; vehiclePlate:string; departureDate:string; estimatedArrival:string; destination:string;
  transportCompany?:string; driver?:string; notes?:string; status:ShipmentStatus;
  orderIds:string[]; documents:ShipmentDocument[];
};

export const shipments:Shipment[]=[
  {id:"SHP-2026-008",vehiclePlate:"20 ABC 123",departureDate:"2026-09-28",estimatedArrival:"2026-10-03",destination:"Woerden, Netherlands",transportCompany:"JBM Transport",driver:"Mehmet Kaya",notes:"NL warehouse delivery. Priority orders loaded first.",status:"Departed",orderIds:["NL101-11216","NL101-10669","DE101-11048","NL101-11051","FR101-11042","NL101-11036"],documents:[{name:"packing-list-008.xlsx",type:"xlsx"},{name:"shipment-list-008.pdf",type:"pdf"}]},
  {id:"SHP-2026-007",vehiclePlate:"20 ACD 248",departureDate:"2026-09-26",estimatedArrival:"2026-10-01",destination:"Woerden, Netherlands",transportCompany:"JBM Transport",driver:"Ali Yılmaz",status:"Loading",orderIds:["NL101-11024","DE101-11021","NL101-11018","UK101-11015"],documents:[{name:"packing-list-007.xlsx",type:"xlsx"}]},
  {id:"SHP-2026-006",vehiclePlate:"20 KLM 680",departureDate:"2026-09-20",estimatedArrival:"2026-09-25",destination:"Woerden, Netherlands",transportCompany:"JBM Transport",status:"Arrived",orderIds:["NL101-11012","FR101-11009","ES101-11006","PL101-11003"],documents:[{name:"shipment-list-006.pdf",type:"pdf"}]},
  {id:"SHP-2026-005",vehiclePlate:"20 BRS 510",departureDate:"2026-09-13",estimatedArrival:"2026-09-18",destination:"Woerden, Netherlands",transportCompany:"JBM Transport",status:"Completed",orderIds:["NL101-11000","DE101-10997","NL101-10994"],documents:[{name:"packing-list-005.xlsx",type:"xlsx"}]},
];

export function shipmentLabel(status:ShipmentStatus){return status==="Departed"?"In Transit":status;}
export function nextShipmentId(list:Shipment[]=shipments){const max=Math.max(...list.map(item=>Number(item.id.split("-").at(-1))),0);return `SHP-2026-${String(max+1).padStart(3,"0")}`;}
