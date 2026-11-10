window.addEventListener('load',function(){
  var q=new URLSearchParams(location.search);var page=q.get('page')||'home';
  window.postMessage({a:'init',settings:MOCK.settings,me:MOCK.me,ui:{}},'*');
  window.postMessage({a:'open',page:page},'*');
});