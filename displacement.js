function chkClass(element, elementClass){
  return element.className&&new RegExp("(?:^|\\s)"+elementClass+"(\\s|$)").test(element.className);
}

function remClass(element, elementClass){
  element.className=element.className.replace(new RegExp("(?:^|\\s)"+elementClass+"(?!\\S)","g"),"");
}

var voidTags=("area, base, br, col, command, embed, hr, input, keygen, link, meta, param, source, track, wbr, svg, iframe").split(", ");
function isVoidTag(tag){
  tag=tag.toLowerCase();
  var voidTag;
  for (i in voidTags){
    if (tag==voidTags[i])
      return true;
  }
  return false
}

function noExponent(n){
  var s;
  if (n<0){s="-";}else{s="";}
  if (Math.abs(n)<1){
    var e=parseInt(n.toString().split("e-")[1]);
    if (e) {
      n*=Math.pow(10,e-1);
      n=s+"0."+(new Array(e-1)).join("0")+n.toString().replace("-","").replace(".","").split("e")[0];
    }
  }else{
    var e=parseInt(n.toString().split('e+')[1]);
    if (e>20){
        e-=20;
        n/=Math.pow(10,e);
        n+=(new Array(e+1)).join('0');
    }
  }
  return n;
}

function parseTransform(transform){
  if (!transform) return undefined;
  if (transform=="none") return [lal.clone(I3),"none"];
  var matrix=[];
  if (transform.match(/matrix3d/)){
    transform=transform.replace("matrix3d(","").replace(")","").split(",");
    for (i in transform){
      transform[i]=Number(transform[i]);
    }
    matrix[0]=[transform[5],transform[1],transform[8],transform[13]];
    matrix[1]=[transform[4],transform[0],transform[9],transform[12]];
    matrix[2]=[transform[6],transform[2],transform[10],transform[14]];
    matrix[3]=[transform[7],transform[3],transform[11],transform[15]];
    return [matrix,"3D"];
  }
  if (transform.match(/matrix/)&&!transform.match(/3d/)){
    transform=transform.replace("matrix(","").replace(")","").split(",");
    for (i in transform){
      transform[i]=Number(transform[i]);
    }
    matrix[0]=[transform[3],transform[1],transform[5]];
    matrix[1]=[transform[2],transform[0],transform[4]];
    matrix[2]=[0,0,1];
    return [matrix,"2D"];
  }
  return [undefined,undefined];
}

function toTransform(matrix){ //numeric.js has a pointwise function creator, but there is no documentation on it at all.
  return ("matrix("+
    noExponent(matrix[1][1])+","+
    noExponent(matrix[0][1])+","+
    noExponent(matrix[1][0])+","+
    noExponent(matrix[0][0])+","+
    noExponent(matrix[1][2])+","+
    noExponent(matrix[0][2])+")");
}

function toRotationMatrix(angle){
  return [[Math.cos(angle),Math.sin(angle)],[-Math.sin(angle),Math.cos(angle)]];
}

function fromRotationMatrix(matrix){
  return Math.acos(matrix[0][0])*sgn(Math.asin(matrix[0][1]));
}

function pythag(a,b){
  return Math.sqrt(a*a+b*b);
}

function eqv(a,b,tol){
  tol=(typeof tol==="undefined")?Number("1e-7"):tol;
  return Math.abs(a-b)<=tol;
}

function sgn(n){
  return n?n<0?-1:1:0;
}

var html=document.getElementsByTagName("html")[0];

var requestAnimationFrame = window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame;

lal=numeric;
var I3=lal.identity(3);
var I2=lal.identity(2);

var page=new function(){
  var windowFrame=lal.clone(I3);
  var windowOffset=lal.clone(I3);
  this.windowOffsetFactor=0.5;
  var translateEvent;
  var dataProperties=["doPosition","focus","limit","parallax","parallaxOrigin"];
  this.windowSize=[0,0];
  this.scrollableArea=lal.clone(I2);
  this.extents=[0,0];
  this.initialized=false;
  this.initialize=function(initialFrame){
    initialFrame=(typeof initialFrame==="undefined")?lal.clone(I3):initialFrame;
    /*if (document.createEventObject){
      translateEvent=document.createEvent("Event");
      //if (event.initEvent) event.initEvent("translate",true,true);
      if (event.initCustomEvent) event.initEvent("translate",true,true);
    }else if (CustomEvent){
      translateEvent=new CustomEvent("translate");
    }*/
    initialLayout(initialFrame);
    if (window.addEventListener){
      window.addEventListener("resize",resize,true);
    }else if (window.attachEvent){
      window.attachEvent('resize',resize);
    }
    //add dom mutation observer
    page.initialized=true;
  };
  function resize(){sizeWindow(); translateElements(windowFrame);};
  function sizeWindow(){
    page.windowSize=[window.innerHeight,window.innerWidth];
    var bodyObj=elementList.fetch(document.body);
    var halfDiagonal=pythag(page.windowSize[0],page.windowSize[1])/2;
    page.scrollableArea=[
      [page.extents[0][0],page.extents[0][1]],
      [page.extents[1][0],page.extents[1][1]]];
    windowOffset=[[1,0,page.windowSize[0]*page.windowOffsetFactor],[0,1,page.windowSize[1]*page.windowOffsetFactor],[0,0,1]];
    return;
  }
  function initialLayout(initialFrame){
    setLayout(document.body,true);
    sizeWindow();
    updateGlobalPositions(elementList.fetch(document.body));
    page.extents=page.getExtents();
    sizeWindow();
    translateElements(initialFrame,true);
    windowFrame=initialFrame;
  }
  this.shift=function(offset,rotation){
    offset=(typeof offset==="undefined")?[0,0]:offset;
    offset=lal.dot(lal.getBlock(windowFrame,[0,0],[1,1]),offset);
    page.move(offset,rotation);
  }
  this.move=function(offset,rotation){
    offset=(typeof offset==="undefined")?[0,0]:offset;
    rotation=(typeof rotation==="undefined")?0:rotation;
    if (typeof rotation=="number"){
      rotation=toRotationMatrix(rotation);
    }
    var windowRotation=[[windowFrame[0][0],windowFrame[0][1]],[windowFrame[1][0],windowFrame[1][1]]];
    windowRotation=lal.dot(rotation,windowRotation);
    var windowTranslation=[windowFrame[0][2]+offset[0],windowFrame[1][2]+offset[1]];
    page.goTo([
      [windowRotation[0][0],windowRotation[0][1],windowTranslation[0]],
      [windowRotation[1][0],windowRotation[1][1],windowTranslation[1]],
      [0,0,1],
    ]);
  };
  this.rotateTo=function(rotation){
    rotation=(typeof rotation==="undefined")?0:rotation;
    if (typeof rotation=="number"){
      rotation=toRotationMatrix(rotation);
    }
    var windowTranslation=[windowFrame[0][2],windowFrame[1][2]];
    page.goTo([
      [rotation[0][0],rotation[0][1],windowTranslation[0]],
      [rotation[1][0],rotation[1][1],windowTranslation[1]],
      [0,0,1],
    ]);
  };
  this.goTo=function(frame){
    frame=lal.clone(frame);
    if (frame){
      if (frame[0][2]<page.scrollableArea[0][0]) frame[0][2]=page.scrollableArea[0][0];
      if (frame[0][2]>page.scrollableArea[1][0]) frame[0][2]=page.scrollableArea[1][0];
      if (frame[1][2]<page.scrollableArea[0][1]) frame[1][2]=page.scrollableArea[0][1];
      if (frame[1][2]>page.scrollableArea[1][1]) frame[1][2]=page.scrollableArea[1][1];
      translateElements(frame);
      windowFrame=frame;
    }
  };
  this.reTranslate=function(){
    sizeWindow();
    translateElements(windowFrame,true);
  };
  function splitData(data){
    table={};
    if (!(typeof data==="string")) return table;
    data=data.replace(/\s+/g,"").split(";");
    for (i in data){
      data[i]=data[i].split(":");
      if (data[i].length==2){
        table[data[i][0]]=data[i][1];
      }
    }
    return table;
  }
  function parseData(data){
    if (!data) return null;
    var prop,key;
    for (i in dataProperties){
      key=dataProperties[i];
      prop=data[key];
      if (key=="focus"){
        if (prop){
          var num;
          prop=prop.split(",");
          if (prop[0]){
            num=Number(prop[0])
            if (!isNaN(num)) prop[0]=num;
          }
          num=null;
          if (prop[1]){
            num=Number(prop[1])
            if (!isNaN(num)) prop[1]=num;
          }
        }else prop=[0,0];
      }else if (key=="limit"){
        if (prop){
          prop=prop.split(",");
          for (i=0;i<4;i++){
            prop[i]=Number(prop[i]);
          }
        }else prop=[NaN,NaN,NaN,NaN];
      }else if (key=="parallax"){
        if (!prop){
          prop=lal.clone(I2);
        }else{
          if (!isNaN(Number(prop))){
            prop=Number(prop);
            prop=lal.diag([prop,prop]);
          }else{
            if (prop.match(/basis/)){
              prop=prop.replace("basis(","").replace(")","").split(",");
              for (i in prop){
                prop[i]=Number(prop[i]);
                if (isNaN(prop[i])){
                  prop=[1,0,0,1];
                  break;
                }
              }
              var matrix=[];
              matrix[0]=[prop[3],prop[1]];
              matrix[1]=[prop[2],prop[0]];
              prop=lal.clone(matrix);
              if (lal.det(prop)==0||lal.eig(prop).lambda.y) //if the parallax matrix is noninvertible or has rotation (complex eigenvalues) then set to identity matrix
                prop=lal.clone(I2);
            }else{
              prop=lal.clone(I2);
            }
          }
        }
      }else if (key=="parallaxOrigin"){
        prop=(prop==null)?"parent":prop;
        prop=prop.replace(/\s+/g,"").split(",");
        if (!(prop[0]=="parent"||prop[0]=="this")) prop[0]="parent";
        prop[1]=(isNaN(Number(prop[1])))?0:Number(prop[1]);
        prop[2]=(isNaN(Number(prop[2])))?0:Number(prop[2]);
      }else if (key=="snap"){
        prop=(typeof prop==="string")?prop:"nosnap";
      }
      data[key]=prop;
    }
    return data;
  }
  function getOffset(element){
    var offsetParent=element.offsetParent;
    var parent=element.parentNode;
    if (!offsetParent) return undefined;
    if (!parent) return undefined;
    if (parent==offsetParent){
      var style=elementList.getParent(elementList.fetch(element)).style;
      var borders={ //I may switch this to clientTop and clientLeft
        top:Number(style.borderTopWidth.replace("px","")),
        left:Number(style.borderLeftWidth.replace("px","")),
        bottom:Number(style.borderBottomWidth.replace("px","")),
        right:Number(style.borderRightWidth.replace("px",""))
      };
      return [element.offsetTop+borders["top"],element.offsetLeft+borders["left"]];
    }
    if (parent.offsetParent==offsetParent){
      return [element.offsetTop-parent.offsetTop,element.offsetLeft-parent.offsetLeft];
    }
    return undefined;
  }
  function translateElements(frame,reset){
    if (!lal.det(frame)) return false;
    var bodyObj=elementList.fetch(document.body)
    var bodystyle=bodyObj.style;
    var windowRotation=lal.getBlock(frame,[0,0],[1,1]);
    var list=elementList.getList();
    var invFrame=lal.inv(frame);
    var centerMT=[
      [0,0,-bodyObj.center[0]],
      [0,0,-bodyObj.center[1]],
      [0,0,0]];
    var bodyRelativePosition=lal.dot(lal.inv(windowRotation),[frame[0][2],frame[1][2]]);
    bodyRelativePosition=[
      [1,0,bodyRelativePosition[0]],
      [0,1,bodyRelativePosition[1]],
      [0,0,1]];
    for (i in list){
      if (list[i].element==document.body) continue;
      var elementObj=list[i]
      var transformed=false;
      var appliedTransform=toTransform(elementObj.originalTransform);
      if (elementObj.doPosition!="never"){
        if (elementList.getLevel(elementObj)==2){
          transformed=true;
          var centerPosition=[
            [1,0,elementObj.centerRelativeMatrix[0][2]],
            [0,1,elementObj.centerRelativeMatrix[1][2]],
            [0,0,1]];
          appliedTransform=toTransform(lal.dot(lal.add(windowOffset,centerMT),lal.dot(lal.inv(centerPosition),lal.dot(invFrame,centerPosition))))+" "+appliedTransform;
        }
        var tolerantDifference=lal.abs(lal.sub(elementObj.parallax,[[1,0],[0,1]]));
        elementObj.relativeToWindow=lal.dot(invFrame,elementObj.effectiveGlobalFrame);
        if (!lal.all(lal.lt(tolerantDifference,lal.epsilon))){
          transformed=true;
          var parentElementObj=elementList.getParent(elementObj);
          var frameRelativeToParent;
          if (elementList.getLevel(elementObj)==2)
            frameRelativeToParent=frame;
          else
            frameRelativeToParent=lal.dot(lal.inv(parentElementObj.effectiveGlobalFrame),frame);
          var positionFromOrigin=[frameRelativeToParent[0][2]-elementObj.parallaxOrigin[0],frameRelativeToParent[1][2]-elementObj.parallaxOrigin[1]];
          var parallaxAdjust=[[1-elementObj.parallax[0][0],-elementObj.parallax[0][1]],[-elementObj.parallax[1][0],1-elementObj.parallax[1][1]]]
          var transform=lal.dot(parallaxAdjust,positionFromOrigin);
          if (elementList.getLevel(elementObj)==2)
            transform=lal.dot(lal.inv(windowRotation),transform);
          transform=[
            [1,0,transform[0]],
            [0,1,transform[1]],
            [0,0,1]
          ];
          appliedTransform=toTransform(transform)+" "+appliedTransform;
        }
      }
      if (transformed||reset){
        elementObj.appliedTransform=appliedTransform;
        if ("transform" in bodystyle){
          if (reset){
            list[i].element.style.backfaceVisibility="hidden";
          }
          list[i].element.style.transform=appliedTransform+" translateZ(0)";
        }
        if ("-webkit-transform" in bodystyle){
          if (reset){
            //list[i].element.style.WebkitPerspective="1000";
            list[i].element.style.WebkitBackfaceVisibility="hidden";
          }
          list[i].element.style.WebkitTransform=appliedTransform+" translateZ(0)";
        }
        if ("-ms-transform" in bodystyle){
          if (reset){
            list[i].element.style.MsBackfaceVisibility="hidden";
          }
          list[i].element.style.MsTransform=appliedTransform+" translateZ(0)";
        }
        if ("-moz-transform" in bodystyle){
          if (reset){
            list[i].element.style.MozBackfaceVisibility="hidden";
          }
          list[i].element.style.MozTransform=appliedTransform+" translateZ(0)";
        }
        if ("-o-transform" in bodystyle){
          if (reset){
            list[i].element.style.OBackfaceVisibility="hidden";
          }
          list[i].element.style.OTransform=appliedTransform+" translateZ(0)";
        }
      }
    }
    //document.body.dispatchEvent(translateEvent);
    return true;
  }
  var setLayout=function(element,doLayoutChilds){
    if (isVoidTag(element.tagName))
      return;
    
    var parentElement=element.parentNode;
    var parentElementObj=elementList.fetch(parentElement);
    //check if an element has already been registered on the element list
    var elementObj=elementList.fetch(element);
    if (!elementObj){//create a list member if not registered
      elementObj=elementList.newElement(element);
      elementList.appendElement(elementObj,parentElementObj);
    }
    var data=parseData(splitData(element.getAttribute("data-displacement")));
    elementObj.data=data;
    if (element==document.body){
      if (element.getAttribute("id")!="framed"){
        setPosition(element,elementObj);
        element.setAttribute("id","framed");
      }
    }else{
      setPosition(element,elementObj);
    }
    element.scrollTop=0;
    element.scrollLeft=0;
    //position other children
    if (doLayoutChilds){
      var children=element.children;
      var i;
      for (i=0;i<children.length;i++){
        if (children[i]) setLayout(children[i],true);
      }
    }
    return;
  }
  function setPosition(element,elementObj){
    var data=elementObj.data
    if (element==document.body){
      //page.extents=[element.scrollHeight,element.scrollWidth];
      elementObj.doPosition="true";
      elementObj.size=page.extents;
      elementObj.center=lal.div(page.extents,2);
      if (data["focus"]){
        var num;
        var bodyCenter=data["focus"];
        if (bodyCenter[0]){
          num=Number(bodyCenter[0])
          if (!isNaN(num)) elementObj.center[0]=num;
        }
        num=null;
        if (bodyCenter[1]){
          num=Number(bodyCenter[1])
          if (!isNaN(num)) elementObj.center[1]=num;
        }
        elementObj.size=lal.mul(elementObj.center,2);
      }
      elementObj.contentSize=lal.clone(elementObj.size);
      elementObj.contentCenter=lal.clone(elementObj.center);
      elementObj.offsetParent=null;
      return;
    }
    var parentElement=element.parentNode;
    var parentElementObj=elementList.fetch(parentElement);
    var style=elementObj.style
    //positioning setup
    elementObj.doPosition=data["doPosition"];
    elementObj.doPosition=(elementObj.doPosition==null)?"true":elementObj.doPosition;
    if (chkClass(element,"F-absolute")){
      remClass(element,"F-absolute");
      element.className+=" A-absolute";
    }
    /*if (style.position!="absolute"){ //these elements will not have parallax effect, but their descendants may
      elementObj.doPosition="noparallax";
    }*/
    if (style.position=="fixed"){
      elementObj.doPosition="never";
    }
    if (parentElementObj.doPosition=="never"||elementObj.doPosition=="never"){ //these elements and their descendants will not have parallax effect
      elementObj.doPosition="never";
    }
    if (style.position=="fixed")
      elementObj.offsetParent=elementList.fetch(document.body);
    else
      elementObj.offsetParent=elementList.fetch(element.offsetParent);
    //get movement parallax/parallax 
    var parallax=data["parallax"];
    elementObj.parallax=parallax;
    //get relative positions
    elementObj.size=[element.offsetHeight,element.offsetWidth];
    elementObj.contentSize=[element.scrollHeight,element.scrollWidth];
    var borders={ //clientLeft, clientTop
    top:Number(style.borderTopWidth.replace("px","")),
    left:Number(style.borderLeftWidth.replace("px","")),
    bottom:Number(style.borderBottomWidth.replace("px","")),
    right:Number(style.borderRightWidth.replace("px",""))
    };
    
    elementObj.center[0]=(elementObj.size[0]+borders["top"]-borders["bottom"])/2; //there is this thing called borders that messes all the positioning up
    elementObj.center[1]=(elementObj.size[1]+borders["left"]-borders["right"])/2;
    elementObj.contentCenter=[elementObj.contentSize[0]/2,elementObj.contentSize[1]/2];
    
    var originalTransform=(style.getPropertyValue('transform')
    || style.getPropertyValue('-moz-transform')
    || style.getPropertyValue('-webkit-transform')
    || style.getPropertyValue('-ms-transform')
    || style.getPropertyValue('-o-transform'));
    
    var parsedTransform=parseTransform(originalTransform);
    elementObj.originalTransform=originalTransform=parsedTransform[0];
    var stylePosition=getOffset(element)||[0,0];
    stylePosition=[stylePosition[0],stylePosition[1]];
    var noTranslateTransform=lal.clone(originalTransform);
    
    if (parsedTransform[0]!="2D") //I am not factoring in 3D transforms
      elementObj.DOMRelativePosition=stylePosition;
    else{
      elementObj.DOMRelativePosition=lal.add(stylePosition,[originalTransform[0][2],originalTransform[1][2]]);
      noTranslateTransform[0][2]=0;
      noTranslateTransform[1][2]=0;
    }
    
    var centerPosition=[
      elementObj.DOMRelativePosition[0]+(elementObj.size[0]-parentElementObj.size[0])/2,
      elementObj.DOMRelativePosition[1]+(elementObj.size[1]-parentElementObj.size[1])/2,
    ];
    elementObj.centerRelativeMatrix=lal.dot([
      [1,0,centerPosition[0]],
      [0,1,centerPosition[1]],
      [0,0,1]
    ],noTranslateTransform);
    //now the parallax is factored into position
    var parallaxOrigin=data["parallaxOrigin"];
    if (parallaxOrigin[0]=="parent"){
      parallaxOrigin=[Number(parallaxOrigin[2]),Number(parallaxOrigin[1])];
    }else if (parallaxOrigin[0]=="this"){
      parallaxOrigin=[centerPosition[0]+Number(parallaxOrigin[2]),centerPosition[1]+Number(parallaxOrigin[1])];
    }else
      parallaxOrigin=[0,0];
    elementObj.parallaxOrigin=parallaxOrigin;
    var invParallax=lal.inv(parallax);
    var effectivePosition=lal.dot(
      invParallax,
      lal.sub(
        lal.add(
          centerPosition,
          lal.dot(
            parallax,
            parallaxOrigin
          )
        ),
        parallaxOrigin
      )
    ); //parallax^-1 x (centerPosition + parallax x parallaxOrigin - parallaxOrigin)
    var effectiveMatrix=lal.dot([
        [invParallax[0][0],invParallax[0][1],effectivePosition[0]],
        [invParallax[1][0],invParallax[1][1],effectivePosition[1]],
        [0,0,1]
      ],noTranslateTransform
    );
    elementObj.effectiveMatrix=effectiveMatrix;
    
    remClass(element,"A-absolute");
    if (elementObj.doPosition=="true"&&elementList.getLevel(elementObj)==2) element.className+=" F-absolute";
    //console.log([element],elementObj.DOMRelativePosition,centerPosition,elementObj.centerRelativeMatrix,parallaxOrigin,effectivePosition,effectiveMatrix);
    return;
  }
  function updateGlobalPositions(elementObj){
    var element=elementObj.element;
    if (element!=document.body){
      var parentElement=element.parentNode;
      var parentElementObj=elementList.fetch(parentElement);
      elementObj.effectiveGlobalFrame=lal.dot(parentElementObj.effectiveGlobalFrame,elementObj.effectiveMatrix);
      var SVD=lal.svd(lal.getBlock(elementObj.effectiveGlobalFrame,[0,0],[1,1])); //use SVD to extract the rotation aspect of a transformation matrix
      var rotation=lal.dot(SVD.U,lal.transpose(SVD.V));
      elementObj.effectiveDocumentFrame=lal.setBlock(lal.clone(elementObj.effectiveGlobalFrame),[0,0],[1,1],rotation);
      //console.log(element,elementObj.effectiveGlobalFrame,elementObj.effectiveDocumentFrame,elementObj.effectiveMatrix,lal.inv(elementObj.parallax));
    }
    var childs=elementList.getChildren(elementObj);
    if (childs){
      var i;
      for (i in childs){
        updateGlobalPositions(childs[i]);
      }
    }
  }
  this.getExtents=function(){
    var extents=[[0,0],[0,0]];
    var list=elementList.getList();
    var diagonal,test;
    for (i in list){
      if (!list[i]||list[i].element==document.body) continue;
      diagonal=pythag(list[i].size[0],list[i].size[1]);
      test=[list[i].effectiveDocumentFrame[0][2]-diagonal,list[i].effectiveDocumentFrame[1][2]-diagonal,list[i].effectiveDocumentFrame[0][2]+diagonal,list[i].effectiveDocumentFrame[1][2]+diagonal];
      if (test[0]<extents[0][0]) extents[0][0]=test[0];
      if (test[1]<extents[0][1]) extents[0][1]=test[1];
      if (test[2]>extents[1][0]) extents[1][0]=test[2];
      if (test[3]>extents[1][1]) extents[1][1]=test[3];
    }
    var bodyObj=elementList.fetch(document.body);
    if (!isNaN(bodyObj.data["limit"][0])) extents[0][1]=bodyObj.data["limit"][0];
    if (!isNaN(bodyObj.data["limit"][1])) extents[0][0]=bodyObj.data["limit"][1];
    if (!isNaN(bodyObj.data["limit"][2])) extents[1][1]=bodyObj.data["limit"][2];
    if (!isNaN(bodyObj.data["limit"][3])) extents[1][0]=bodyObj.data["limit"][3];
    return extents;
  };
  this.getFocus=function(element){
    var elementObj=elementList.fetch(element);
    return lal.dot(elementObj.effectiveGlobalFrame,[
      [1,0,elementObj.data["focus"][1]],
      [0,1,elementObj.data["focus"][0]],
      [0,0,1]]);
  };
  this.getFrame=function(){
    return lal.clone(windowFrame);
  }
};

var elementList=new function(){
  var lastChildID=0;
  var list={};
  var thisID="element";
  this.fetch=function(element){
    if (!element) return;
    var elementID;
    if (typeof element=="string")
      elementID=element;
    else{
      if (element.thisID)
        elementID=element.thisID;
      else if (element.getAttribute)
        elementID=element.getAttribute("data-elementID");
    }
    if (elementID){
      return list[elementID];
    }
    return null;
  };
  this.getParent=function(elementObj){
    thisID=elementObj.thisID;
    lastDash=thisID.lastIndexOf("-")
    parentID=thisID.slice(0,lastDash);
    if (parentID=="element")
      return null;
    else
      return list[parentID];
  };
  this.getLevel=function(elementObj){
    var elementID=elementObj;
    if (!(typeof elementID=="string"))
      elementID=elementObj.thisID;
    return elementID.match(/-/g).length;
  };
  this.getChildren=function(elementObj){
    var elementID=elementObj.thisID;
    var childLevel=elementList.getLevel(elementObj)+1;
    if (elementID){
      var childs=[];
      var key;
      for (key in list){
        if (key.search(elementID)>-1&&key!=elementID&&elementList.getLevel(key)==childLevel)
          childs.push(list[key]);
      }
      if (childs.length==0)
        return null;
      else
        return childs;
    }
    return null;
  };
  this.newElement=function(node){
    return {
      element:node,
      offsetParent:{},
      doPosition:false,
      style:window.getComputedStyle(node),
      data:{},
      thisID:"",
      lastChildID:0,
      parallax:lal.clone(I2),
      parallaxOrigin:[0,0],
      originalTransform:lal.clone(I3),
      appliedTransform:lal.clone(I3),
      size:[],
      contentSize:[],
      center:[],
      contentCenter:[],
      effectiveMatrix:[],
      effectiveGlobalFrame:lal.clone(I3),
      effectiveDocumentFrame:lal.clone(I3),
      DOMRelativePosition:[],
      centerRelativeMatrix:[],
      DOMRelativeToParallaxParent:[],
      centerRelativeToParallaxParent:[]
    };
  };
  this.appendElement=function(elementObj,parentObj){
    if (!parentObj){
      var parentID=thisID;
      lastChildID++;
      var newID=parentID+"-"+lastChildID;
      elementObj.thisID=newID;
      elementObj.element.setAttribute("data-elementID",newID);
      list[newID]=elementObj;
      return newID;
    }else{
      var parentID=parentObj.thisID;
      if (!parentID)
        return null;
      parentObj.lastChildID++;
      var newID=parentID+"-"+parentObj.lastChildID;
      elementObj.thisID=newID;
      elementObj.element.setAttribute("data-elementID",newID);
      list[newID]=elementObj;
      return newID;
    }
  };
  this.removeElement=function(elementObj,removeDescendants){
    var removedID=elementObj.thisID;
    if (removeDescendants){
      var childs=elementList.getChildren(elementObj);
      if (childs)
      {
        var i;
        for (i in childs){
          elementList.removeElement(childs[i],true);
        }
      }
    }
    delete list[removedID];
    return;
  };
  this.getList=function(){
    return list;
  };
};

var nav=new function(){
  var currentHash;
  var scrollTester,scrollSpanner,scrollCountdown=5;
  var eventElement,moveAction;
  var scrollCorner=[0,0];
  this.doScroll=false;
  this.doParallaxScroll=false;
  this.doDrag=false;
  this.doParallaxDrag=false;
  this.doSnap=false;
  var mouseHeld=false,dragging=false;
  this.mouseDragThreshold=4;
  var eventFired=false,refreshing=false,animation,animationTimeout;
  var mouseTarget={},lastMousePosition,recentMouseAction="click";
  var elementSnapTo;
  this.homeHash="";
  this.currentElement;
  this.doAnimate=0;
  this.animateTiming="linear";
  this.initialize=function(hash,animate){
    //page.windowOffsetFactor=1.5;
//    document.addEventListener("mousemove",function(event){console.log(event.target.tagName,document.elementFromPoint(event.clientX, event.clientY))});
    
    var browserOS=[BrowserDetect.browser,BrowserDetect.OS,BrowserDetect.version];
    
    scrollTester=document.createElement("div");
    scrollTester.className="scrolltester";
    scrollTester.setAttribute("data-displacement","doPosition:never;");
    
    scrollSpanner=document.createElement("div");
    scrollSpanner.setAttribute("id","scrollspanner");
    
    eventElement=document.createElement("div");
    eventElement.setAttribute("id","displacementEvent");
    
    document.body.appendChild(scrollTester);
    document.body.appendChild(scrollSpanner);
    document.body.appendChild(eventElement);
    scrollerSize();
    
    if (document.createEventObject||(browserOS[0]=="Explorer")){
      moveAction=document.createEvent("MouseEvents");
      moveAction.initMouseEvent("mouseover",true,true,window,0,0,0,0,0,false,false,false,false,0,null);
    }else if (Event){
      moveAction=new Event("mouseover");
    }
    
    if (window.addEventListener){
      window.addEventListener("resize",scrollerSize,false);
      window.addEventListener("scroll",scrolled,false);
      document.body.addEventListener("click",navClick,false);
      window.addEventListener("keydown",keymgr,false);
      window.addEventListener("mousemove",mouseMoved,false);
      window.addEventListener("mousedown",mouseButtonDown,false);
      window.addEventListener("mouseup",mouseButtonUp,false);
      //window.addEventListener("hashchange",hashChanged,false);
    }else if (window.attachEvent){
      window.attachEvent("resize",scrollerSize);
      document.body.attachEvent("scroll",scrolled);
      document.body.attachEvent("click",navClick);
      window.attachEvent("keydown",keymgr);
      window.attachEvent("mousemove",mousemoved);
      window.attachEvent("mousedown",mouseButtonDown);
      window.attachEvent("mouseup",mouseButtonUp);
      //window.attachEvent("hashchange",hashChanged);
    }
    
    //window.addEventListener("mousewheel",function(event){console.log(event.wheelDeltaX,event.wheelDeltaY,event.deltaZ)});
    //document.body.addEventListener("mousemove",function(event){console.log("move",event.target.getAttribute("id"));},false);
    if (browserOS[0].toLowerCase()=="firefox"&&browserOS[1].toLowerCase()=="windows"){
      firefoxwindows();
    }
    
    if (animate) nav.doAnimate=animate;
    if (!hash){
      if (window.location.hash!=""){
        hash=window.location.hash.replace("#","");
      }
    }else{
      nav.homeHash=hash;
    }
    if (hash&&page.initialized){
      currentHash=hash;
      nav.goTo(hash,0);
      page.reTranslate();
    }
  };
  function eventCall(fn){
    if (eventFired){
      eventFired=false;
      refreshing=true;
      var request;
      if (fn) requestAnimationFrame(function(){fn(); eventCall(fn);});
    }else refreshing=false;
  }
  function eventManager(fn){
    if (!refreshing){
      eventFired=true;
      eventCall(fn);
    }
  }
  function changeHash(hash){
    var location=document.getElementById(hash);
    if (location){
      var oldHash=window.location.hash.replace("#","");
      if (oldHash!=hash){
        currentHash=hash;
        location.id=""; //remove the original id/hash to prevent redirect
        //window.location.hash="";
        window.location.hash=hash; //change the hash
        location.id=hash; //replace the id
      }
    }else{
      currentHash=hash;
      window.location.hash=hash;
    }
    scrolled(true);
  }
  function navClick(event){
    var tgt=event.target;
    var chkLink=function(target){
      if (target.tagName=="A"){
        var link=target.getAttribute("href");
        if (link&&link.match(/^#/)){
          event.preventDefault();
          if (recentMouseAction=="click"){
            link=link.replace("#","");
            nav.goTo(link,nav.doAnimate);
          }else return false;
        }
        return true;
      }else return false;
    };
    while(!chkLink(tgt)){
      tgt=tgt.parentElement;
      if (tgt==document.body) break;
    }
  }
  function mouseButtonDown(event){
    if (event.button!=0) return;
    mouseHeld=true;
    event.preventDefault();
    nav.stopAnimation();
    recentMouseAction="click";
    if(window.getSelection){ //deselects all text if enabled, for non IE browsers
      window.getSelection().removeAllRanges();
    }
    if(document.selection){ //IE version of above code
      document.selection.empty();
    }
  }
  function mouseButtonUp(event){
    if (event.button!=0) return;
    mouseHeld=false;
    if (dragging){
      event.preventDefault();
      recentMouseAction="drag";
      dragging=false;
      snap();
    }else{
      recentMouseAction="click";
    }
  }
  function mouseMoved(event){
    var newPosition=[event.screenY,event.screenX];
    if (!dragging){
      if (!mouseHeld){
        if (!mouseTarget.elem||mouseTarget.elem!=event.target){
          mouseTarget.elem=event.target;
          mouseTarget.elemObj=elementList.fetch(mouseTarget.elem);
        }
        lastMousePosition=newPosition;
      }else{
        var diff=lal.sub(newPosition,lastMousePosition);
        if (Math.abs(diff[0])>nav.mouseDragThreshold||Math.abs(diff[1])>nav.mouseDragThreshold){
          dragging=true;
          lastMousePosition=newPosition;
          recentMouseAction="drag";
        }
      }
    }else{
      if (lastMousePosition){
        dragged(lastMousePosition,newPosition);
      }
      lastMousePosition=newPosition;
    }
  }
  function shift(newPosition,oldPosition,caller){
    var change=lal.sub(newPosition,oldPosition);
    var rotation,transform;
    if (page.initialized){
      eventElement.dispatchEvent(moveAction);
      window.scrollTo(scrollCorner[1],scrollCorner[0]);
      if (caller=="scrolled"&&nav.doParallaxScroll||caller=="dragged"&&nav.doParallaxDrag)
      {
        if (mouseTarget.elemObj&&mouseTarget.elemObj.effectiveDocumentFrame&&mouseTarget.elemObj.effectiveGlobalFrame){
          rotation=lal.dot(lal.inv(lal.getBlock(mouseTarget.elemObj.effectiveDocumentFrame,[0,0],[1,1])),lal.getBlock(page.getFrame(),[0,0],[1,1]));
          transform=lal.getBlock(mouseTarget.elemObj.effectiveGlobalFrame,[0,0],[1,1]);
          change=lal.dot(transform,lal.dot(rotation,change));
          page.move(change);
          return;
        }
      }
      page.shift(change)
      return;
    }
  }
  function dragged(newPosition,oldPosition){
    if (!nav.doDrag) return;
    shift(newPosition,oldPosition,"dragged");
    nav.stopAnimation();
  }
  function scrolled(reset){
    if (nav.doScroll){
      if (!(reset==true)){
        var newPosition=[document.body.scrollTop||document.documentElement.scrollTop,document.body.scrollLeft||document.documentElement.scrollLeft];
        if (scrollCountdown>0)
          scrollCountdown--;
        else
          shift(newPosition,scrollCorner,"scrolled");
        nav.stopAnimation();
        snap();
      }
    }
    window.scrollTo(scrollCorner[1],scrollCorner[0]);
  }
  /*function hashChanged(event){
    var hash=window.location.hash.replace("#","");
    nav.goTo(hash,nav.doAnimate)
  }*/
  this.getSnapTo=function(pos,elementObj){
    if (!elementObj) elementObj=elementList.fetch(document.elementFromPoint(pos[1],pos[0]));
    var noSnaps=true;
    if (elementObj){
      while (noSnaps){
        if (elementObj.element==document.body) break;
        if (elementObj.data["snap"]=="snap"){
          if (elementObj.element.id==currentHash)
            break;
          else{
            noSnaps=false;
          }
        }else{
          elementObj=elementList.getParent(elementObj);
        }
      }
    }
    return [elementObj,noSnaps];
  }
  function snap(){
    if (!nav.doSnap) return;
    nav.stopAnimation();
    var halfWindowSize=lal.div(page.windowSize,2);
    var snapper=function(){
      var snapTo=nav.getSnapTo(halfWindowSize);
      var elementObj=snapTo[0];
      var noSnaps=snapTo[1];
      if (!noSnaps){
        nav.goTo(elementObj.element.id,nav.doAnimate);
        //changeHash(elementObj.element.id);
      }else{
        var bounce=false;
        elementObj=elementList.fetch(document.getElementById(currentHash));
        if (elementObj){
          var relativeToElement=lal.inv(elementObj.relativeToWindow);
          var bounds=lal.div(elementObj.size,2);
          var limit=[bounds[0]-((bounds[0]<halfWindowSize[0])?bounds[0]:halfWindowSize[0]),bounds[1]-((bounds[1]<halfWindowSize[1])?bounds[1]:halfWindowSize[1])];
          var dist=[0,0];
          //console.log([relativeToElement[0][2],relativeToElement[1][2]],bounds);
          if (
            ((relativeToElement[0][2]+limit[0])>-halfWindowSize[0])&&
            ((relativeToElement[0][2]-limit[0])<halfWindowSize[0])&&
            ((relativeToElement[1][2]+limit[1])>-halfWindowSize[1])&&
            ((relativeToElement[1][2]-limit[1])<halfWindowSize[1])
          ){
            if ((relativeToElement[0][2]+limit[0])<0){
              bounce=true;
              dist[0]=relativeToElement[0][2]+limit[0];
              relativeToElement[0][2]=-limit[0];
            }
            if ((relativeToElement[0][2]-limit[0])>0){
              bounce=true;
              dist[0]=relativeToElement[0][2]-limit[0];
              relativeToElement[0][2]=limit[0];
            }
            if ((relativeToElement[1][2]+limit[1])<0){
              bounce=true;
              dist[1]=relativeToElement[1][2]+limit[1];
              relativeToElement[1][2]=-limit[1];
            }
            if ((relativeToElement[1][2]-limit[1])>0){
              bounce=true;
              dist[1]=relativeToElement[1][2]-limit[1];
              relativeToElement[1][2]=limit[1];
            }
          }else{
            changeHash("");
          }
          var destination=lal.dot(elementObj.effectiveGlobalFrame,relativeToElement);
          if (bounce){
            nav.goTo(destination,nav.doAnimate*(pythag(dist[0],dist[1])/pythag(halfWindowSize[0],halfWindowSize[1]))+100,"power-inout,2");
          }
        }
      }
    };
    animationTimeout=window.setTimeout(snapper,50);
  }
  this.goTo=function(id,animateTime,timing){
    var elementFrame,windowFrame,windowRotation,elementRotation;
    if (typeof id==="string"){
      var element=document.getElementById(id);
      var elementObj=elementList.fetch(element);
      if (!element||!elementObj) return;
      elementFrame=page.getFocus(elementObj);
      elementRotation=lal.getBlock(lal.clone(elementObj.effectiveDocumentFrame),[0,0],[1,1]);
      elementFrame=lal.setBlock(elementFrame,[0,0],[1,1],elementRotation);
    }else{
      if (Object.prototype.toString.call(id)==="[object Array]"){
        elementFrame=id;
        elementRotation=lal.getBlock(elementFrame,[0,0],[1,1]);
      }
    }
    nav.stopAnimation();
    elementRotation=fromRotationMatrix(elementRotation);
    
    windowFrame=page.getFrame();
    windowRotation=lal.getBlock(windowFrame,[0,0],[1,1]);
    windowRotation=fromRotationMatrix(windowRotation);
    
    var angle=elementRotation-windowRotation;
    if (angle>Math.PI) angle=angle-Math.PI*2;
    if (angle<-Math.PI) angle=angle+Math.PI*2;
    var difference=lal.sub([elementFrame[0][2],elementFrame[1][2]],[windowFrame[0][2],windowFrame[1][2]]);
    animateTime=Number(animateTime);
    if (!isNaN(animateTime)&&animateTime>0){
      timing=(typeof timing==="undefined")?nav.animateTiming:timing;
      var startTime,progress,matrix,coords;
      var frameAnimate=function(){
        progress=animateFunction((Date.now()-startTime)/animateTime,timing);
        matrix=toRotationMatrix(angle*progress+windowRotation);
        coords=lal.add([windowFrame[0][2],windowFrame[1][2]],lal.mul(difference,progress));
        page.goTo([
          [matrix[0][0],matrix[0][1],coords[0]],
          [matrix[1][0],matrix[1][1],coords[1]],
          [0,0,1]]);
      };
      startTime=Date.now();
      animation=window.setInterval(frameAnimate,1000/60);
      var animationCopy=animation;
      animationTimeout=window.setTimeout(function(){if (animation&&animation==animationCopy){nav.stopAnimation(); page.goTo(elementFrame); if (typeof id==="string") changeHash(id);}},animateTime);
    }else{
      page.goTo(elementFrame);
      if (typeof id==="string") changeHash(id);
    }
  }
  this.stopAnimation=function(){
    if (animation){
      window.clearInterval(animation);
      animation=null;
    }
    if (animationTimeout){
      window.clearTimeout(animationTimeout);
      animationTimeout=null;
    }
  }
  function animateFunction(progress,fn){
    fn=(typeof fn==="undefined")?"linear":fn;
    fn=fn.split(",");
    var pow=Number(fn[1]);
    if (isNaN(pow)) pow=2;
    fn=fn[0];
    var result;
    if (progress<0) result=0;
    if (progress>1) result=1;
    switch(fn)
    {
      case "sine-in":
        result=1-Math.cos(progress*Math.PI/2);
        break;
      case "sine-out":
        result=Math.sin(progress*Math.PI/2);
        break;
      case "sine-inout":
        result=0.5-(Math.cos(progress*Math.PI)/2);
        break;
      case "power-in":
        result=Math.pow(progress,pow);
        break;
      case "power-out":
        result=1-Math.pow(1-progress,pow);
        break;
      case "power-inout":
        result=(progress<=0.5)?(Math.pow(progress,pow)*Math.pow(2,pow-1)):1-Math.pow(2,pow-1)*Math.pow(1-progress,pow);
        break;
      case "circ-in":
        result=1-Math.sqrt(1-Math.pow(progress,2));
        break;
      case "circ-out":
        result=Math.sqrt(1-Math.pow(1-progress,2));
        break;
      case "circ-inout":
        result=(progress<=0.5)?0.5-Math.sqrt(0.25-Math.pow(progress,2)):0.5+Math.sqrt(0.25-Math.pow(1-progress,2));
        break;
      default:
        result=progress;
        break;
    }
    return result;
  }
  function keymgr(event){
    switch(event.keyCode)
    {
      case 9:
        event.preventDefault();
        break;
      case 36:
        event.preventDefault();
        nav.goTo(nav.homeHash,nav.doAnimate);
        break;
      default:
        break;
    }
  }
  function scrollerSize(noscroll){
    var width=scrollTester.offsetWidth-scrollTester.clientWidth;
    var height=scrollTester.offsetHeight-scrollTester.clientHeight;
    var windowSize=[window.innerHeight,window.innerWidth];
    var size=[windowSize[0]+height,windowSize[1]+width];
    var span=[windowSize[0]*3,windowSize[1]*3];
    scrollCorner=[windowSize[0],windowSize[1]];
    //document.body.style.height=size[0]+"px";
    //document.body.style.width=size[1]+"px";
    window.scrollTo(scrollCorner[1],scrollCorner[0]);
    document.body.removeChild(scrollSpanner);
    scrollSpanner.style.height=span[0]+"px";
    scrollSpanner.style.width=span[1]+"px";
    document.body.appendChild(scrollSpanner);
  }
  function firefoxwindows(){
    // left: 37, up: 38, right: 39, down: 40,
    // spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
    var keys = [32,33,34,37,38,39,40];
    var keyscroll={};
    keyscroll[32]=function(){window.scrollBy(0,scrollCorner[0]);};
    keyscroll[33]=function(){window.scrollBy(0,-scrollCorner[0]);};
    keyscroll[34]=function(){window.scrollBy(0,scrollCorner[0]);};
    keyscroll[37]=function(){window.scrollBy(-10,0);};
    keyscroll[38]=function(){window.scrollBy(0,-10);};
    keyscroll[39]=function(){window.scrollBy(10,0);};
    keyscroll[40]=function(){window.scrollBy(0,10);};
    function wheel(event){
      window.scrollBy(event.deltaX*10,event.deltaY*10);
      event.preventDefault();
    }
    function keydown(event){
      for (i in keys){
        if (event.keyCode===keys[i]){
          if (keyscroll[event.keyCode]) keyscroll[event.keyCode]();
        }
      }
    }
    window.addEventListener("wheel",wheel);
    window.addEventListener("keydown",keydown);
  }
}

