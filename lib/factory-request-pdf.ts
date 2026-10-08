import {translate,locales,type Language} from "@/lib/i18n";
import {PDFDocument,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {gunzipSync} from 'node:zlib';
import {factoryPdfFont} from '@/lib/factory-pdf-font';
import {requestCategories,legacyInfoCategory,isFabricPart,jobSpecifications,type FactoryRequest,type RequestJob} from '@/lib/factory-requests';
type Entry={request:FactoryRequest;job:RequestJob};
export async function factoryRequestPdf(requests:FactoryRequest[],copies:1|2,jobIds?:string[],language:Language="en"){
 const t=(key:string|null|undefined,values?:Record<string,string|number>)=>translate(language,key,values);
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(gunzipSync(Buffer.from(factoryPdfFont,'base64')),{subset:true});pdf.setTitle(t('RESCRO Factory Production List'));pdf.setAuthor('RESCRO');
 const entries=requests.filter(r=>r.category!==legacyInfoCategory&&!['Reddedildi','İptal Edildi','Kapatıldı'].includes(r.status)).flatMap(request=>request.jobs.filter(job=>!jobIds||jobIds.includes(job.id)).map(job=>({request,job})));
 if(!entries.length)throw new Error('Üretim listesine uygun iş seçilmedi.');
 const characters=new Set(font.getCharacterSet());
 const clean=(text:string)=>Array.from(text).map(c=>c==='\n'||characters.has(c.codePointAt(0)!)?c:'?').join('');
 const wrap=(text:string,width:number,size:number)=>{const lines:string[]=[];for(const paragraph of clean(text).split('\n')){let line='';for(const word of paragraph.split(/\s+/)){if(!word)continue;const candidate=line?`${line} ${word}`:word;if(font.widthOfTextAtSize(candidate,size)<=width){line=candidate;continue;}if(line){lines.push(line);line='';}let part='';for(const c of word){if(font.widthOfTextAtSize(part+c,size)>width){lines.push(part);part='';}part+=c;}line=part;}lines.push(line);}return lines;};
 const groups=[{title:'Üretim / Yeniden Üretim',entries:entries.filter(e=>e.request.category===requestCategories[0]),headers:['Sipariş No / Talep','Kalem','Adet','İşlem','Ölçü / Renk'],widths:[107,142,37,87,142]}, {title:'Tül / Perde',entries:entries.filter(e=>e.request.category===requestCategories[1]&&isFabricPart(e.job.operation)),headers:['Sipariş No / Talep','Kalem','Adet','Parça','Ölçü / Renk'],widths:[107,142,37,87,142]}, {title:'Profil / Diğer Parçalar',entries:entries.filter(e=>e.request.category===requestCategories[1]&&!isFabricPart(e.job.operation)),headers:['Sipariş No / Talep','Kalem','Adet','Parça / Profil','Ölçü / Renk'],widths:[107,122,37,117,132]}].filter(g=>g.entries.length);
 let page!:PDFPage;let y=0;let floor=40;const left=40;const size=9;let copy=1;let pageNo=0;
 function text(value:string,x:number,yPos:number,fontSize=size){page.drawText(clean(value),{x,y:yPos,font,size:fontSize,color:rgb(.12,.12,.12)});}
 function newPage(){page=pdf.addPage([595.28,841.89]);pageNo++;y=797;floor=40;text('RESCRO',left,y,17);text(t('FACTORY PRODUCTION LIST - Copy {0}/{1}',{0:copy,1:copies}),left,y-22,12);text(new Date().toLocaleDateString(locales[language]),455,y,9);y-=48;text(t('Talep işleri ana siparişin durumunu değiştirmez.'),left,y,8);y-=22;page.drawLine({start:{x:left,y},end:{x:555,y},thickness:.7,color:rgb(.7,.7,.7)});y-=18;}
 function space(height:number){if(y-height<floor)newPage();}
 function header(group:typeof groups[number]){space(52);text(t(group.title),left,y,11);y-=22;const lines=group.headers.map((v,i)=>wrap(t(v),group.widths[i]-10,8));const height=Math.max(...lines.map(v=>v.length))*11+12;page.drawRectangle({x:left,y:y-height+5,width:515,height,color:rgb(.92,.92,.92)});let x=left;lines.forEach((values,i)=>{values.forEach((v,k)=>text(v,x+5,y-7-k*11,8));x+=group.widths[i];});y-=height+6;}
 function cells(entry:Entry){const {request:r,job:j}=entry;return [`${r.orderId}\n${r.number}${r.priority==='Acil'?` / ${t('Acil')}`:''}`,j.itemName,String(j.quantity),[t(j.operation),t(j.profileType),t(j.plasticType)].filter(Boolean).join('\n'),jobSpecifications({...j,profileType:'',plasticType:''},t)];}
 function note(entry:Entry){const {request:r,job:j}=entry;return [`${t("Üretim / Paketleme Notu:")} ${j.note||'-'}`,j.properties?`${t("Properties:")} ${j.properties}`:'',r.description?`${t("Description:")} ${r.description}`:'',`${t("Destination:")} ${t(j.destination)}${r.category===requestCategories[0]?` / ${t("Reason:")} ${t(j.reason)}`:''}`].filter(Boolean).join('\n');}
 const estimated=groups.reduce((n,g)=>n+52+g.entries.reduce((m,e)=>m+Math.max(...cells(e).map((c,i)=>wrap(c,g.widths[i]-10,size).length))*13+wrap(note(e),505,size).length*13+24,0),0);
 const halfCopies=copies===2&&estimated<=292;
 for(copy=1;copy<=copies;copy++){
  if(copy===2&&halfCopies){page.drawLine({start:{x:left,y:421},end:{x:555,y:421},thickness:.5,color:rgb(.7,.7,.7),dashArray:[3,3]});y=395;floor=40;text('RESCRO',left,y,17);text(t('FACTORY PRODUCTION LIST - Copy {0}/{1}',{0:2,1:2}),left,y-22,12);y-=55;}
  else{newPage();if(halfCopies)floor=440;}
  for(const group of groups){header(group);for(const entry of group.entries){const lines=cells(entry).map((c,i)=>wrap(c,group.widths[i]-10,size));const rows=Math.max(...lines.map(c=>c.length));if(y-rows*13-12<floor){newPage();header(group);}let x=left;lines.forEach((values,i)=>{values.forEach((line,k)=>text(line,x+5,y-k*13));x+=group.widths[i];});y-=rows*13+7;
    const notes=wrap(note(entry),505,size);for(const line of notes){if(y-13<floor){newPage();header(group);text(`${entry.request.orderId} / ${entry.request.number} - ${t("Note continued")}`,left,y,9);y-=17;}text(line,left+5,y);y-=13;}
    page.drawLine({start:{x:left,y:y-3},end:{x:555,y:y-3},thickness:.5,color:rgb(.8,.8,.8)});y-=17;
  }y-=8;}
 }
 pdf.getPages().forEach((p,i)=>p.drawText(t("Page {0} / {1}",{0:i+1,1:pdf.getPageCount()}),{x:470,y:20,font,size:8,color:rgb(.4,.4,.4)}));return pdf.save();
}
