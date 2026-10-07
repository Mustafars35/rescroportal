import {PDFDocument,rgb,type PDFPage,type PDFFont} from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {gunzipSync} from 'node:zlib';
import {factoryPdfFont} from '@/lib/factory-pdf-font';
import {requestCategories,type FactoryRequest,type RequestJob} from '@/lib/factory-requests';
type Entry={request:FactoryRequest;job:RequestJob};
export async function factoryRequestPdf(requests:FactoryRequest[],copies:1|2,jobIds?:string[]){
 const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);const font=await pdf.embedFont(gunzipSync(Buffer.from(factoryPdfFont,'base64')),{subset:true});pdf.setTitle('RESCRO Fabrika Üretim Listesi');pdf.setAuthor('RESCRO');
 const entries=requests.filter(r=>r.category!==requestCategories[2]&&!['Reddedildi','İptal Edildi','Kapatıldı'].includes(r.status)).flatMap(request=>request.jobs.filter(job=>!jobIds||jobIds.includes(job.id)).map(job=>({request,job})));
 if(!entries.length)throw new Error('Üretim listesine uygun iş seçilmedi.');
 const characters=new Set(font.getCharacterSet());
 const clean=(text:string)=>Array.from(text).map(c=>c==='\n'||characters.has(c.codePointAt(0)!)?c:'?').join('');
 const wrap=(text:string,width:number,size:number)=>{const lines:string[]=[];for(const paragraph of clean(text).split('\n')){let line='';for(const word of paragraph.split(/\s+/)){if(!word)continue;const candidate=line?`${line} ${word}`:word;if(font.widthOfTextAtSize(candidate,size)<=width){line=candidate;continue;}if(line){lines.push(line);line='';}let part='';for(const c of word){if(font.widthOfTextAtSize(part+c,size)>width){lines.push(part);part='';}part+=c;}line=part;}lines.push(line);}return lines;};
 const groups=[{title:'Üretim / Yeniden Üretim',entries:entries.filter(e=>e.request.category===requestCategories[0]),headers:['Sipariş No / Talep','Kalem','Adet','İşlem','Ölçü / Renk'],widths:[107,142,37,87,142]}, {title:'Tül / Perde',entries:entries.filter(e=>e.request.category===requestCategories[1]&&['Tül','Perde'].includes(e.job.operation)),headers:['Sipariş No / Talep','Kalem','Adet','Parça','Ölçü / Renk'],widths:[107,142,37,87,142]}, {title:'Profil / Diğer Parçalar',entries:entries.filter(e=>e.request.category===requestCategories[1]&&!['Tül','Perde'].includes(e.job.operation)),headers:['Sipariş No / Talep','Kalem','Adet','Parça / Profil','Boy / Renk'],widths:[107,122,37,117,132]}].filter(g=>g.entries.length);
 let page!:PDFPage;let y=0;let floor=40;const left=40;const size=9;let copy=1;let pageNo=0;
 function text(value:string,x:number,yPos:number,fontSize=size){page.drawText(clean(value),{x,y:yPos,font,size:fontSize,color:rgb(.12,.12,.12)});}
 function newPage(){page=pdf.addPage([595.28,841.89]);pageNo++;y=797;floor=40;text('RESCRO',left,y,17);text(`FABRİKA ÜRETİM LİSTESİ - Kopya ${copy}/${copies}`,left,y-22,12);text(new Date().toLocaleDateString('tr-TR'),455,y,9);y-=48;text('Talep işleri ana siparişin durumunu değiştirmez.',left,y,8);y-=22;page.drawLine({start:{x:left,y},end:{x:555,y},thickness:.7,color:rgb(.7,.7,.7)});y-=18;}
 function space(height:number){if(y-height<floor)newPage();}
 function header(group:typeof groups[number]){space(52);text(group.title,left,y,11);y-=22;page.drawRectangle({x:left,y:y-18,width:515,height:23,color:rgb(.92,.92,.92)});let x=left;group.headers.forEach((v,i)=>{text(v,x+5,y-10,8);x+=group.widths[i];});y-=29;}
 function cells(entry:Entry){const {request:r,job:j}=entry;return [`${r.orderId}\n${r.number}${r.priority==='Acil'?' / ACİL':''}`,j.itemName,String(j.quantity),j.operation+(j.profileType?`\n${j.profileType}`:''),[j.operation.includes('profil')||!['Tül','Perde','Yeniden Üretim'].includes(j.operation)?j.lengthCm?`${j.lengthCm} cm`:'':`${j.widthMm} × ${j.heightMm} mm`,j.color,j.productType].filter(Boolean).join('\n')];}
 function note(entry:Entry){const {request:r,job:j}=entry;return [`Üretim / Paketleme Notu: ${j.note||'-'}`,j.properties?`Özellikler: ${j.properties}`:'',r.description?`Açıklama: ${r.description}`:'',`Gönderim: ${j.destination}${r.category===requestCategories[0]?` / Neden: ${j.reason}`:''}`].filter(Boolean).join('\n');}
 const estimated=groups.reduce((n,g)=>n+52+g.entries.reduce((m,e)=>m+Math.max(...cells(e).map((c,i)=>wrap(c,g.widths[i]-10,size).length))*13+wrap(note(e),505,size).length*13+24,0),0);
 const halfCopies=copies===2&&estimated<=292;
 for(copy=1;copy<=copies;copy++){
  if(copy===2&&halfCopies){page.drawLine({start:{x:left,y:421},end:{x:555,y:421},thickness:.5,color:rgb(.7,.7,.7),dashArray:[3,3]});y=395;floor=40;text('RESCRO',left,y,17);text('FABRİKA ÜRETİM LİSTESİ - Kopya 2/2',left,y-22,12);y-=55;}
  else{newPage();if(halfCopies)floor=440;}
  for(const group of groups){header(group);for(const entry of group.entries){const lines=cells(entry).map((c,i)=>wrap(c,group.widths[i]-10,size));const rows=Math.max(...lines.map(c=>c.length));if(y-rows*13-12<floor){newPage();header(group);}let x=left;lines.forEach((values,i)=>{values.forEach((line,k)=>text(line,x+5,y-k*13));x+=group.widths[i];});y-=rows*13+7;
    const notes=wrap(note(entry),505,size);for(const line of notes){if(y-13<floor){newPage();header(group);text(`${entry.request.orderId} / ${entry.request.number} - Not devamı`,left,y,9);y-=17;}text(line,left+5,y);y-=13;}
    page.drawLine({start:{x:left,y:y-3},end:{x:555,y:y-3},thickness:.5,color:rgb(.8,.8,.8)});y-=17;
  }y-=8;}
 }
 pdf.getPages().forEach((p,i)=>p.drawText(`Sayfa ${i+1} / ${pdf.getPageCount()}`,{x:470,y:20,font,size:8,color:rgb(.4,.4,.4)}));return pdf.save();
}
