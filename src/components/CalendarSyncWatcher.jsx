import {useEffect} from 'react';
import {secureApi} from '@/lib/secureApi';
import {useData} from '@/contexts/DataContext';
export default function CalendarSyncWatcher(){
 const {fetchData}=useData();
 useEffect(()=>{let pending=false,active=true;
 const sync=async()=>{if(pending||document.hidden)return;pending=true;try{const state=await secureApi('/api/calendar',{action:'status'});if(state.configured&&state.calendar_id&&state.auto_sync){await secureApi('/api/calendar',{action:'sync'});if(active)await fetchData({force:true});}}catch{}finally{pending=false;}};
 const timer=setInterval(sync,300000);window.addEventListener('focus',sync);window.addEventListener('kyro-calendar-connected',sync);
 return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',sync);window.removeEventListener('kyro-calendar-connected',sync);};
 },[fetchData]);return null;
}
