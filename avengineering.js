(function(){
  var backgr=document.createElement("div");
  backgr.style.position="fixed";
  backgr.style.height="100%";
  backgr.style.width="100%";
  backgr.style.zIndex="10000";
  backgr.style.background="grey";
  backgr.style.transition="opacity 0.5s linear";
  backgr.style.WebkitTransition="opacity 0.5s linear";
  backgr.setAttribute("data-displacement","doPosition:never;");
  var loading=document.createElement("div");
  loading.style.position="absolute";
  loading.style.height="72px";
  loading.style.fontSize="36px";
  loading.style.top="0";
  loading.style.bottom="0";
  loading.style.left="0";
  loading.style.right="0";
  loading.style.margin="auto";
  loading.style.textAlign="center";
  loading.style.fontWeight="bold";
  loading.style.fontVariant="small-caps";
  loading.style.zIndex="1";
  loading.innerHTML="Avengineering<br /> (and it is loading)";
  var loadgear=document.createElement("div");
  loadgear.className="gear";
  loadgear.style.position="absolute";
  loadgear.style.top="50%";
  loadgear.style.left="50%";
  loadgear.style.height="480px";
  loadgear.style.width="480px";
  loadgear.style.margin="-240px";
  backgr.appendChild(loading);
  backgr.appendChild(loadgear);
  var snapCursor;
  /*var snapCursor=document.createElement("svg");
  snapCursor.setAttribute("xmlns","http://www.w3.org/2000/svg");
  snapCursor.setAttribute("width","32");
  snapCursor.setAttribute("height","32");
  snapCursor.style.position="fixed";
  snapCursor.style.top="50%";
  snapCursor.style.left="50%";
  snapCursor.style.height="32px";
  snapCursor.style.width="32px";
  snapCursor.style.margin="-16px";
  snapCursor.style.zIndex="10000";
  snapCursor.style.background='url("cross.svg")';
  snapCursor.style.pointerEvents="none";*/
  var snapSelect;
  /*var snapSelect=document.createElement("svg");
  snapSelect.style.position="absolute";
  snapSelect.style.top="0";
  snapSelect.style.left="0";
  snapSelect.style.height="100%";
  snapSelect.style.width="100%";
  snapSelect.style.zIndex="10000";
  snapSelect.style.background="none";
  snapSelect.style.boxShadow="0 0 20px 20px rgba(0,255,0,0.5) inset";
  snapSelect.style.pointerEvents="none";
  snapSelect.id="snapSelect";*/
  var storage=document.createElement("div");
  var gear;
  document.onreadystatechange=function(){
    if (document.readyState=="interactive"){
      gear=document.getElementById("gear")
      document.body.appendChild(backgr);
      loadgear.style.animation="gearrotator 1.5s linear 0s infinite";
      loadgear.style.WebkitAnimation="gearrotator 1.5s linear 0s infinite";
      snapCursor=document.getElementById("snapCursor");
      storage.appendChild(snapCursor);
      snapCursor.style.visibility="visible";
      snapSelect=document.getElementById("snapSelect");
      storage.appendChild(snapSelect);
      snapSelect.style.visibility="visible";
    }
    if (document.readyState=="complete"){
      Displacement.transformInitialize([[1,0,0],[0,1,0],[0,0,1]]);
      Displacement.navigateInitialize();
      Displacement.setHomeHash("home");
      Displacement.setAnimateTime(800);
      Displacement.allowScrolling(true);
      //Displacement.useParallaxDependentScrolling(true);
      Displacement.allowDragging(true);
      Displacement.useParallaxDependentDragging(true);
      Displacement.useSnapping(true);
      Displacement.setAnimateTimingFunction("power-inout,5");
      backgr.style.opacity=0;
      gear.style.animation="gearrotator 3s cubic-bezier(.44,.72,.73,1)";
      gear.style.WebkitAnimation="gearrotator 3s cubic-bezier(.44,.72,.73,1)";
      proto_init();
      window.setTimeout(function(){
        elementList = Displacement.getElementList();
        elementList.removeElement(elementList.fetch(backgr),true);
        document.body.removeChild(backgr);
      },500);
    }
  };
  function proto_init(){
    if (window.addEventListener){
      document.getElementById("Displacement-Event").addEventListener("mouseover",snapIndicator,false);
    }else if (window.attachEvent){
      document.getElementById("Displacement-Event").attachEvent("mouseover",snapIndicator);
    }
  }
  var lastMouseOver=document.body,lastSnap=document.body,snapSelectTime=false,snapCursorTime=false;
  var heldOn=document.body;
  function snapIndicator(event){
    var halfWindowSize=lal.div([window.innerHeight,window.innerWidth],2);
    if (snapCursorTime!=false) window.clearTimeout(snapCursorTime);
    storage.appendChild(snapCursor);
    document.body.appendChild(snapCursor);
    snapCursor.style.opacity=1;
    snapCursor.style.animation="fadeout 0.6s linear 0.5s";
    snapCursor.style.WebkitAnimation="fadeout 0.6s linear 0.5s";
    snapCursorTime=window.setTimeout(function(){
      storage.appendChild(snapCursor);
    },1000);
  }
})();