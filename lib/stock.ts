export const stockDepartments=["Tül & Kuşgözü","Testere","Montaj","Kalite Kontrol","Paketleme"] as const;
export type StockDepartment=typeof stockDepartments[number];
export type StockUnit="pcs"|"Piece"|"Set"|"Roll"|"Box"|"Meter"|"Kg"|string;
export type StockMaterial={id:string;department:StockDepartment;name:string;unit:StockUnit;quantity:number;minimum:number;sku?:string;notes?:string;archived?:boolean};
export type StockLog={id:string;at:string;user:string;department:StockDepartment;materialId:string;material:string;action:"Material Created"|"Stock Added"|"Stock Reduced"|"Material Archived";quantity:number;previous:number;next:number;reason?:string;note?:string;unit:StockUnit};
export const stockStorageKey="rescro-stock-materials"; export const stockLogStorageKey="rescro-stock-logs";
export const defaultMaterials:StockMaterial[]=[
 {id:"mesh-300-black",department:"Tül & Kuşgözü",name:"Siyah Tül 300 cm",unit:"Roll",quantity:0,minimum:5,sku:"MESH-BLK-300"},{id:"mesh-240-black",department:"Tül & Kuşgözü",name:"Siyah Tül 240 cm",unit:"Roll",quantity:3,minimum:5,sku:"MESH-BLK-240"},{id:"eyelet-black",department:"Tül & Kuşgözü",name:"Kuşgözü Siyah",unit:"pcs",quantity:800,minimum:1000},{id:"cord-black",department:"Tül & Kuşgözü",name:"İp Siyah",unit:"Roll",quantity:7,minimum:3},
 {id:"saw-blade",department:"Testere",name:"Kesim Bıçağı",unit:"Piece",quantity:2,minimum:3},{id:"profile-white",department:"Testere",name:"Beyaz Profil",unit:"Meter",quantity:540,minimum:250},{id:"profile-anthracite",department:"Testere",name:"Antrasit Profil",unit:"Meter",quantity:140,minimum:200},
 {id:"corner-black",department:"Montaj",name:"Siyah Köşe Seti",unit:"Set",quantity:620,minimum:500},{id:"handle-black",department:"Montaj",name:"Siyah Tutamak",unit:"pcs",quantity:190,minimum:250},{id:"screw-set",department:"Montaj",name:"Vida Seti",unit:"Box",quantity:12,minimum:8},
 {id:"qc-label",department:"Kalite Kontrol",name:"QC Kontrol Etiketi",unit:"Roll",quantity:4,minimum:5},{id:"measure-tape",department:"Kalite Kontrol",name:"Ölçüm Bandı",unit:"Piece",quantity:9,minimum:4},
 {id:"packing-tape",department:"Paketleme",name:"Paketleme Bandı",unit:"Roll",quantity:4,minimum:10},{id:"carton-large",department:"Paketleme",name:"Büyük Koli",unit:"Piece",quantity:68,minimum:50},{id:"bubble-wrap",department:"Paketleme",name:"Balonlu Naylon",unit:"Roll",quantity:1,minimum:3}
];
export const stockStatus=(material:StockMaterial)=>material.quantity===0?"Out of Stock":material.quantity<=material.minimum?"Low Stock":"In Stock";
export const readStock=():StockMaterial[]=>typeof window==="undefined"?defaultMaterials:JSON.parse(localStorage.getItem(stockStorageKey)||JSON.stringify(defaultMaterials));
export const readStockLogs=():StockLog[]=>typeof window==="undefined"?[]:JSON.parse(localStorage.getItem(stockLogStorageKey)||"[]");
export const writeStock=(items:StockMaterial[])=>localStorage.setItem(stockStorageKey,JSON.stringify(items));
export const writeStockLogs=(items:StockLog[])=>localStorage.setItem(stockLogStorageKey,JSON.stringify(items));
