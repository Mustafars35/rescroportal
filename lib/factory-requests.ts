import type {Translate} from "@/lib/i18n";
import {workStations,type WorkStation} from '@/lib/production-model';
import type {PoolItem,PoolOrder} from '@/lib/order-pool';
import type {SessionUser} from '@/lib/auth';
export const requestCategories=['Fabrika Bildiri / Yeniden Üretim','Parça Gönderme'] as const;
export const legacyInfoCategory='Pratik & Gezer / Eksik Bilgi' as const;
export type RequestCategory=typeof requestCategories[number]|typeof legacyInfoCategory;
export const requestStatuses=['Onay Bekliyor','Üretime Hazır','Üretime Verildi','Üretimde','Üretim Tamamlandı','Paketlendi','Gönderildi','Reddedildi','İptal Edildi','Bilgi Bekleniyor','Kapatıldı'] as const;
export type RequestStatus=typeof requestStatuses[number];
export const partTypes=['Tül','Perde','Tül + Perde','Bant','Plastikler','Profil'] as const;
export const profileTypes=['Kanat','Kanallı','Kanalsız','Eşik'] as const;
export const profileColors=['Beyaz 9016','Antrasit 7016','Siyah 9005','Kırık Beyaz 9010','Krem 9001'] as const;
export const plasticTypes=['Standart Köşe Takozu (Takım)','Standart Köşe Kapağı (Takım)','Eşiksiz Köşe Kapağı (Takım)','Eşiksiz Köşe Takozu (Takım)','Tekerlek (Eşiksiz)','Tekerlek (Standart)'] as const;
export const plasticColors=profileColors.slice(0,3);
export const isFabricPart=(operation:string)=>['Tül','Perde','Tül + Perde'].includes(operation);
export function itemSummary(item:PoolItem,index:number,t:Translate=(key)=>key??"",locale="tr-TR"){const cm=(v:number)=>new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(v/10);return `${t("Kalem")} ${index+1} / ${item.widthMm&&item.heightMm?`${cm(item.widthMm)} × ${cm(item.heightMm)}`:t("Ölçü kayıtlı değil")} / ${item.color} / ${item.name} / ${item.reference||'—'}`;}
export function jobSpecifications(j:RequestJob,t:Translate=(key)=>key??""){return [j.operation==='Profil'?j.profileLengthMm?`${j.profileLengthMm} mm`:'':j.lengthCm?`${j.lengthCm} cm`:j.widthMm&&j.heightMm?`${j.widthMm} × ${j.heightMm} mm`:'',t(j.profileType),t(j.plasticType),j.meshType?`${t("Tül")}: ${j.meshType}`:'',j.curtainType?`${t("Perde")}: ${j.curtainType}`:'',j.curtainColor?`${t("Perde Rengi")}: ${j.curtainColor}`:'',j.color,j.productType].filter(Boolean).join(' · ');}
// Adapt old saved part fields only when opening the edit form; no record migration.
export function editableJob(job:RequestJob):RequestJob{const j={...job};if(['Tül','Perde'].includes(j.operation)){if(j.operation==='Tül')j.meshType??=j.productType;else{j.curtainType??=j.productType;j.curtainColor??=j.color;}}if(j.operation.includes('profil')){j.profileLengthMm=j.lengthCm?String(Number(j.lengthCm)*10):'';j.profileType=j.operation==='Eşik profili'?'Eşik':j.operation==='Kanalsız profil'?'Kanalsız':profileTypes.includes(j.profileType as typeof profileTypes[number])?j.profileType:'';j.operation='Profil';const colors:Record<string,string>={'White':'Beyaz 9016','Anthracite':'Antrasit 7016','RAL 7016':'Antrasit 7016','Black':'Siyah 9005','RAL 9005':'Siyah 9005','RAL 9010':'Kırık Beyaz 9010','RAL 9001':'Krem 9001'};j.color=colors[j.color]??j.color;}return j;}
export const remakeReasons=['Yanlış üretim','Hasar','Kargo kaybı','Depoda bulunamadı','Diğer'] as const;
export type TaskStation=WorkStation|'Transport';
export type RequestJob={id:string;itemId:string;itemName:string;original:PoolItem;quantity:number;operation:string;reason:string;widthMm:string;heightMm:string;lengthCm:string;color:string;productType:string;profileType:string;profileLengthMm?:string;plasticType?:string;meshType?:string;curtainType?:string;curtainColor?:string;properties:string;note:string;destination:'Müşteriye'|'Depoya';topic:string;expected:string;contactNote:string;lastContact:string;reminders:number;stations:TaskStation[];step:number;releasedAt:string|null;completions:{station:TaskStation;userId:string;userName:string;at:string}[]};
export type RequestAttachment={id:string;name:string;mime:string;data:string};
export type FactoryRequest={id:string;number:string;orderId:string;category:RequestCategory;priority:'Normal'|'Acil';description:string;status:RequestStatus;creatorId:string;creatorName:string;createdAt:string;updatedAt:string;version:number;jobs:RequestJob[];attachments:RequestAttachment[];history:{action:string;userName:string;at:string;detail:string}[]};
export function canViewRequests(user:SessionUser){return user.role==='Admin'||user.role==='Customer Service';}
export function canCreateRequests(user:SessionUser){return user.role==='Admin'||user.role==='Customer Service'||user.permissions.includes('Create Factory Requests');}
export function canEditRequest(user:SessionUser,request:FactoryRequest){return user.role==='Admin'||(request.creatorId===user.id&&['Onay Bekliyor','Bilgi Bekleniyor'].includes(request.status)&&canCreateRequests(user));}
export function canDoTask(user:SessionUser,station:TaskStation){return user.role==='Admin'||(station==='Transport'?user.role==='Transport'&&user.permissions.includes('Manage Shipping'):user.permissions.includes(`Complete ${station}`));}
export function taskStation(job:RequestJob):TaskStation|null{return job.releasedAt&&job.step<job.stations.length?job.stations[job.step]:null;}
export function jobStatus(job:RequestJob):RequestStatus{if(!job.releasedAt)return 'Üretime Hazır';if(job.step===job.stations.length)return 'Gönderildi';const station=taskStation(job);if(station==='Transport')return 'Paketlendi';if(station==='Packaging')return 'Üretim Tamamlandı';return job.step===0?'Üretime Verildi':'Üretimde';}
export function requestProgress(request:FactoryRequest){const total=request.jobs.reduce((n,j)=>n+j.stations.length,0);const done=request.jobs.reduce((n,j)=>n+j.step,0);return {total,done,percent:total?Math.round(done/total*100):0};}
export function recalculateStatus(request:FactoryRequest):RequestStatus{if(['Bilgi Bekleniyor','Kapatıldı','Reddedildi','İptal Edildi','Onay Bekliyor'].includes(request.status))return request.status;if(!request.jobs.some(j=>j.releasedAt))return 'Üretime Hazır';const values=request.jobs.map(jobStatus);const order=['Üretime Hazır','Üretime Verildi','Üretimde','Üretim Tamamlandı','Paketlendi','Gönderildi'] as const;return order.find(s=>values.includes(s))??'Üretime Hazır';}
export function defaultStations(category:RequestCategory,operation:string):TaskStation[]{if(category===legacyInfoCategory)return [];if(category===requestCategories[0])return [...workStations,'Transport'];if(isFabricPart(operation))return ['Mesh','Cord & Eyelet','Quality Control','Packaging','Transport'];if(operation==='İp')return ['Cord & Eyelet','Quality Control','Packaging','Transport'];if(operation==='Profil'||operation.includes('profil'))return ['Frame','Quality Control','Packaging','Transport'];return ['Quality Control','Packaging','Transport'];}
export function newJob(item:PoolItem,category:RequestCategory):RequestJob{return {id:crypto.randomUUID(),itemId:item.id,itemName:item.name,original:item,quantity:item.quantity,operation:category===requestCategories[0]?'Yeniden Üretim':category===requestCategories[1]?'':'Eksik Bilgi',reason:remakeReasons[0],widthMm:String(item.widthMm??''),heightMm:String(item.heightMm??''),lengthCm:'',color:item.color,productType:item.name,profileType:'',profileLengthMm:'',plasticType:'',meshType:'',curtainType:'',curtainColor:'',properties:item.properties??'',note:'',destination:'Müşteriye',topic:'',expected:'',contactNote:'',lastContact:'',reminders:0,stations:defaultStations(category,''),step:0,releasedAt:null,completions:[]};}
export function validateRequestInput(value:unknown,orders:PoolOrder[]):{orderId:string;category:RequestCategory;priority:'Normal'|'Acil';description:string;jobs:RequestJob[];attachments:RequestAttachment[]}{
 const v=value as Record<string,unknown>;if(!v||!requestCategories.includes(v.category as typeof requestCategories[number])||!['Normal','Acil'].includes(String(v.priority)))throw new Error('VALIDATION: Talep türü ve öncelik seçin.');
 const order=orders.find(o=>o.id===v.orderId);if(!order)throw new Error('VALIDATION: Sipariş bulunamadı.');
 const text=(x:unknown,max=5000)=>{if(typeof x!=='string'||x.length>max)throw new Error('VALIDATION: Geçersiz veya çok uzun metin.');return x;};
 if(!Array.isArray(v.jobs)||!v.jobs.length)throw new Error('VALIDATION: En az bir iş ekleyin.');
 const category=v.category as RequestCategory;const ids=new Set<string>();
 const jobs=v.jobs.map((raw:Record<string,unknown>)=>{const item=order.items.find(i=>i.id===raw.itemId);if(!item||!item.manufactured)throw new Error('VALIDATION: Geçersiz sipariş kalemi.');const id=text(raw.id,100);if(!id||ids.has(id))throw new Error('VALIDATION: İş kimliği tekrarlanıyor.');ids.add(id);
 const quantity=Number(raw.quantity);if(!Number.isInteger(quantity)||quantity<1||quantity>10000)throw new Error('VALIDATION: Adet 1-10000 olmalı.');
 const operation=category===requestCategories[0]?'Yeniden Üretim':text(raw.operation,100);if(category===requestCategories[1]&&!partTypes.includes(operation as typeof partTypes[number]))throw new Error('VALIDATION: Parça türü seçin.');
 const reason=text(raw.reason,100);const topic=text(raw.topic??'',100);if(category===requestCategories[0]&&!remakeReasons.includes(reason as typeof remakeReasons[number]))throw new Error('VALIDATION: Neden seçin.');
 const dimension=(x:unknown)=>{const s=text(x??'',30);if(s!==''&&(!Number.isFinite(Number(s))||Number(s)<=0||Number(s)>100000))throw new Error('VALIDATION: Ölçü pozitif sayı olmalı.');return s;};
 const sourceDimensions=category===requestCategories[0]||isFabricPart(operation);
 const widthMm=sourceDimensions?String(item.widthMm??''):operation==='Bant'?dimension(raw.widthMm):'';
 const heightMm=sourceDimensions?String(item.heightMm??''):operation==='Bant'?dimension(raw.heightMm):'';
 const lengthCm=operation==='Bant'?dimension(raw.lengthCm):'';
 const profileLengthMm=operation==='Profil'?dimension(raw.profileLengthMm):'';
 const profileType=operation==='Profil'?text(raw.profileType,200):'';
 const plasticType=operation==='Plastikler'?text(raw.plasticType,200):'';
 const meshType=['Tül','Tül + Perde'].includes(operation)?text(raw.meshType??'',200):'';
 const curtainType=['Perde','Tül + Perde'].includes(operation)?text(raw.curtainType??'',200):'';
 const curtainColor=['Perde','Tül + Perde'].includes(operation)?text(raw.curtainColor??'',100):'';
 const color=text(raw.color,100);
 if(operation==='Profil'&&(!profileLengthMm||!profileTypes.includes(profileType as typeof profileTypes[number])||!profileColors.includes(color as typeof profileColors[number])))throw new Error('VALIDATION: Profil türü, ölçüsü ve listeden renk seçin.');
 if(operation==='Plastikler'&&(!plasticTypes.includes(plasticType as typeof plasticTypes[number])||!plasticColors.includes(color as typeof plasticColors[number])))throw new Error('VALIDATION: Plastik türü ve listeden renk seçin.');
 if(['Tül','Tül + Perde'].includes(operation)&&!meshType.trim())throw new Error('VALIDATION: Tül türü girin.');
 if(['Perde','Tül + Perde'].includes(operation)&&(!curtainType.trim()||!curtainColor.trim()))throw new Error('VALIDATION: Perde türü ve rengi girin.');
 const stations=defaultStations(category,operation);
 const reminders=Number(raw.reminders);if(!Number.isInteger(reminders)||reminders<0||reminders>10000)throw new Error('VALIDATION: Hatırlatma sayısı geçersiz.');
 if(!['Müşteriye','Depoya'].includes(String(raw.destination)))throw new Error('VALIDATION: Gönderim yeri seçin.');
 return {id,itemId:item.id,itemName:item.name,original:{...item},quantity,operation,reason,widthMm,heightMm,lengthCm,color,productType:category===requestCategories[0]?text(raw.productType,200):'',profileType,profileLengthMm,plasticType,meshType,curtainType,curtainColor,properties:text(raw.properties),note:text(raw.note),destination:raw.destination as RequestJob['destination'],topic,expected:text(raw.expected),contactNote:text(raw.contactNote),lastContact:text(raw.lastContact,30),reminders,stations,step:0,releasedAt:null,completions:[]};});
 const attachments=Array.isArray(v.attachments)?v.attachments as RequestAttachment[]:[];if(attachments.length>3)throw new Error('VALIDATION: En fazla 3 dosya.');let bytes=0;for(const f of attachments){text(f.id,100);text(f.name,200);text(f.mime,100);if(!/^[A-Za-z0-9+/]*={0,2}$/.test(f.data)||f.data.length>2800000)throw new Error('VALIDATION: Dosya en fazla 2 MB olmalı.');bytes+=f.data.length;}if(bytes>3500000)throw new Error('VALIDATION: Dosyaların toplam boyutu çok büyük.');
 return {orderId:order.id,category,priority:v.priority as 'Normal'|'Acil',description:text(v.description),jobs,attachments};
}
