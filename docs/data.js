// Dados construídos para esta demonstração. Não provêm da aplicação do Mac.
export const DEMO = Object.freeze({
  schemaVersion: 1, fictional: true, updatedAt: '2026-10-31T12:00:00Z',
  students: [
    {id:'demo-1',name:'Aluno Exemplo A',type:'Presencial',price:20},
    {id:'demo-2',name:'Aluno Exemplo B',type:'Presencial',price:18},
    {id:'demo-3',name:'Aluno Exemplo C',type:'Online',price:15},
    {id:'demo-4',name:'Aluno Exemplo D',type:'Online',price:16},
    {id:'demo-5',name:'Aluno Exemplo E',type:'Presencial',price:22},
  ],
  lessons: [
    {id:'lesson-1',date:'2026-10-31',studentId:'demo-1',type:'Presencial',value:20},
    {id:'lesson-2',date:'2026-10-30',studentId:'demo-3',type:'Online',value:15},
    {id:'lesson-3',date:'2026-10-29',studentId:'demo-2',type:'Presencial',value:18},
    {id:'lesson-4',date:'2026-10-28',studentId:'demo-4',type:'Online',value:16},
    {id:'lesson-5',date:'2026-10-27',studentId:'demo-5',type:'Presencial',value:22},
    {id:'lesson-6',date:'2026-10-24',studentId:'demo-1',type:'Presencial',value:20},
    {id:'lesson-7',date:'2026-10-23',studentId:'demo-3',type:'Online',value:15},
    {id:'lesson-8',date:'2026-09-30',studentId:'demo-2',type:'Presencial',value:18},
    {id:'lesson-9',date:'2026-09-25',studentId:'demo-4',type:'Online',value:16},
    {id:'lesson-10',date:'2026-09-22',studentId:'demo-5',type:'Presencial',value:22},
  ],
});
export function filterLessons(data,month,type='Todas',query='') {
  const q=query.trim().toLocaleLowerCase('pt-PT');
  return data.lessons.filter(l=>l.date.startsWith(month)&&(type==='Todas'||l.type===type)&&
    data.students.find(s=>s.id===l.studentId)?.name.toLocaleLowerCase('pt-PT').includes(q))
    .sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));
}
export function summary(lessons) {
  return {total:lessons.reduce((v,l)=>v+l.value,0),count:lessons.length,
    presencial:lessons.filter(l=>l.type==='Presencial').reduce((v,l)=>v+l.value,0),
    online:lessons.filter(l=>l.type==='Online').reduce((v,l)=>v+l.value,0)};
}
export function months(data) {return [...new Set(data.lessons.map(l=>l.date.slice(0,7)))].sort().reverse();}
