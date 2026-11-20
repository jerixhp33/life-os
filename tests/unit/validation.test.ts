import { signUpSchema, signInSchema, taskSchema, transactionSchema, eventSchema, goalSchema } from '../../src/lib/validation/schemas';
describe('signUpSchema',()=>{
  const v={ full_name:'Alex Johnson', email:'alex@example.com', password:'SecurePass1', confirm_password:'SecurePass1' };
  it('passes valid data',()=>expect(signUpSchema.safeParse(v).success).toBe(true));
  it('rejects short name',()=>expect(signUpSchema.safeParse({...v,full_name:'A'}).success).toBe(false));
  it('rejects invalid email',()=>expect(signUpSchema.safeParse({...v,email:'bad'}).success).toBe(false));
  it('rejects password without uppercase',()=>expect(signUpSchema.safeParse({...v,password:'lowercase1',confirm_password:'lowercase1'}).success).toBe(false));
  it('rejects mismatched passwords',()=>expect(signUpSchema.safeParse({...v,confirm_password:'Different1'}).success).toBe(false));
});
describe('taskSchema',()=>{
  const v={ title:'Write tests', priority:'medium' as const };
  it('passes minimal task',()=>expect(taskSchema.safeParse(v).success).toBe(true));
  it('rejects empty title',()=>expect(taskSchema.safeParse({...v,title:''}).success).toBe(false));
  it('rejects too-long title',()=>expect(taskSchema.safeParse({...v,title:'x'.repeat(201)}).success).toBe(false));
  it('allows all priorities',()=>(['low','medium','high','urgent'] as const).forEach(p=>expect(taskSchema.safeParse({...v,priority:p}).success).toBe(true)));
});
describe('transactionSchema',()=>{
  const v={ type:'expense' as const, amount:25.50, currency:'USD', category:'Food', date:'2024-01-15', is_recurring:false };
  it('passes valid tx',()=>expect(transactionSchema.safeParse(v).success).toBe(true));
  it('rejects negative amount',()=>expect(transactionSchema.safeParse({...v,amount:-10}).success).toBe(false));
  it('rejects zero amount',()=>expect(transactionSchema.safeParse({...v,amount:0}).success).toBe(false));
  it('rejects short currency',()=>expect(transactionSchema.safeParse({...v,currency:'US'}).success).toBe(false));
});
describe('eventSchema',()=>{
  const now=new Date(), future=new Date(now.getTime()+3600000);
  const v={ title:'Meeting', start_at:now.toISOString(), end_at:future.toISOString(), all_day:false, color:'violet' as const };
  it('passes valid event',()=>expect(eventSchema.safeParse(v).success).toBe(true));
  it('rejects end before start',()=>expect(eventSchema.safeParse({...v,end_at:now.toISOString(),start_at:future.toISOString()}).success).toBe(false));
  it('allows same start/end for all-day',()=>expect(eventSchema.safeParse({...v,all_day:true,end_at:now.toISOString()}).success).toBe(true));
});
describe('goalSchema',()=>{
  const v={ title:'Learn TypeScript', category:'learning' as const };
  it('passes valid goal',()=>expect(goalSchema.safeParse(v).success).toBe(true));
  it('rejects invalid category',()=>expect(goalSchema.safeParse({...v,category:'sports'}).success).toBe(false));
});
