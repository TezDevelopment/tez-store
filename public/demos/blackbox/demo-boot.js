window.addEventListener('load',function(){
  var q=new URLSearchParams(location.search);var page=q.get('page')||'desk';
  var me=Object.assign({},MOCK.me,{isStaff:true,isAdmin:true,duty:true});
  MOCK.settings.ghostEnabled=true;
  window.postMessage({a:'init',settings:MOCK.settings,me:me},'*');
  window.postMessage({a:'open',page:page,settings:MOCK.settings,me:me},'*');
  setTimeout(function(){var c=document.getElementById('btn-close');if(c)c.style.display='none';},300);
});