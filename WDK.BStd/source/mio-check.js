/* Mio-DSL Browser check
 * ------------------------
 * This file is part of WDK
 * WDK is free software: you can redistribute it and/or modify it under the terms of the GNU
 * General Public License version 2.0 as published by the Free Software Foundation.
 * see <http://www.gnu.org/licenses/>
 * Copyright Fiathux Su, 2017
 ******************/

"use strict";

(() => {
  var glob = this;
  var navi = navigator;
  var doc = document;
  var _f = glob._MIO_SYS_;

  //Common method{{{
  var verspliter = (verarray) => _f.list((subver) => Number(subver))(_f.iList)(verarray);
  var verstrspliter = (verstr) =>
    (/[0-9]+_/.test(verstr) && verstr.split("_")) || verstr.split(".");
  //Apple version convert
  var apple_ver = (verstr) => verspliter(verstrspliter(verstr));
  //General version convert
  var gen_ver = (verstr) => verspliter(verstr.split("."));
  //}}}

  //Feature parse define{{{
  var feature=[];

  function versionapply(ua,parse,key,idx,convert){
    var valgrp=parse.exec(ua);
    if (valgrp){
      this[key]=convert(valgrp[idx]);
      return valgrp;
    }
  }

  //Mozilla version{{{
  feature.push(function(ua){
    versionapply.call(this,ua,/Mozilla\/([0-9\.]+)/,'mozilla',1,Number);
    return ua;
  });
  //}}}
  //iOS system parse{{{
  feature.push(function(ua){
    function ios_device(typename){
      this[typename]=true;
      this["os"]="ios";
      this["mobile"]=true;
      return ua;
    }
    function ios_feature(parse,device){
      return versionapply.call(this,ua,parse,'ios',1,apple_ver) && 
        ios_device.call(this,device);
    }
    return ios_feature.call(this,/iPad; CPU OS ([0-9_]+) like Mac OS X/,'ipad') ||
      ios_feature.call(this,/iPhone; CPU iPhone OS ([0-9_]+) like Mac OS X/,'iphone') || 
      ios_feature.call(this,/iPod touch; CPU iPhone OS ([0-9_]+) like Mac OS X/,'ipod') ||
      ua;
  });
  //}}}
  //Android system parse{{{
  feature.push(function(ua){
    if (versionapply.call(this,ua,/Android\s+([0-9\.]+)/,'android',1,gen_ver)){
      this["os"]="android";
      this["mobile"]=true;
    }else{//Parse custom version
      var pgrp=/Android\s+(.+);/.exec(ua);
      if (pgrp){
        this["os"]="custom-android";
        this["custom-android"]=pgrp[1];
        this["mobile"]=true;
      }
    }
    return ua;
  });
  //}}}
  //Windows system parse{{{
  feature.push(function(ua){
    function ms_device(typename,mob){
      this["os"]="windows";
      if (mob)this["mobile"]=mob;
      return ua;
    }
    return (versionapply.call(this,ua,/Windows NT ([0-9\.]+)/,'winnt',1,gen_ver) &&
      ms_device.call(this,'winnt',false)) ||
      (versionapply.call(this,ua,/Windows Phone (OS )?([0-9\.]+)/,'winphone',2,gen_ver) &&
      ms_device.call(this,'winphone',true)) || ua;
  });
  //}}}
  //OS X system parse{{{
  feature.push(function(ua){
    if (versionapply.call(this,ua,/Macintosh;\s*.*Mac OS X ([0-9_\.]+)/,'osx',1,apple_ver))
      this["os"]="osx";
    return ua;
  });
  //}}}
  //Linux system parse{{{
  feature.push(function(ua){
    if (/Linux/.test(ua))this['linux']=true;
    if (/Ubuntu/.test(ua))this['Ubuntu']=true;
    return ua;
  });
  //}}}
  //Engine WebKit parse{{{
  feature.push(function(ua){
    if (versionapply.call(this,ua,/AppleWebKit\/([0-9\.]+)/,'webkit',1,gen_ver))
      this["engine"]="webkit";
    return ua;
  });
  //}}}
  //Engine Gecko parse{{{
  feature.push(function(ua){
    if (versionapply.call(this,ua,/Gecko\/([0-9]+)/,'gecko',1,gen_ver))
      this["engine"]="gecko";
    return ua;
  });
  //}}}
  //Engine Presto parse{{{
  feature.push(function(ua){
    if (versionapply.call(this,ua,/Presto\/([0-9\.]+)/,'presto',1,gen_ver))
      this["engine"]="presto";
    return ua;
  });
  //}}}
  //Engine Trident parse{{{
  feature.push(function(ua){
    if (versionapply.call(this,ua,/Trident\/([0-9\.]+)/,'trident',1,gen_ver))
      this["engine"]="trident";
    return ua;
  });
  //}}}
  //Browser Safari parse{{{
  feature.push(function(ua){
    if (versionapply.call(this,ua,/Safari\/([0-9\.]+)/,'safari',1,gen_ver))
      this["browser"]="safari";
    return ua;
  });
  //}}}
  //Browser Chrome parse{{{
  feature.push(function(ua){
    if (versionapply.call(this,ua,/Chrome\/([0-9\.]+)/,'chrome',1,gen_ver))
      this["browser"]="chrome";
    if (versionapply.call(this,ua,/Chromium\/([0-9\.]+)/,'chromium',1,gen_ver))//Chromium
      this["browser"]="chromium";
    return ua;
  });
  //}}}
  //Browser Firefox parse{{{
  feature.push(function(ua){
    if (versionapply.call(this,ua,/Firefox\/([0-9\.]+)/,'firefox',1,gen_ver))
      this["browser"]="firefox";
    return ua;
  });
  //}}}
  //Browser Opera parse{{{
  feature.push(function(ua){
    if ( (this['engine']=="webkit" && 
      versionapply.call(this,ua,/\sOPR\/([0-9\.]+)/,'opera',1,gen_ver)) ||
      versionapply.call(this,ua,/Opera\/.*\sVersion\/([0-9\.]+)/,'opera',1,gen_ver) )
      this["browser"]="opera";
    return ua;
  });
  //}}}
  //Browser IE parse{{{
  feature.push(function(ua){
    if (versionapply.call(this,ua,/MSIE ([0-9\.]+)/,'ie',1,gen_ver)){
      this["browser"]="ie";
      if (this['ie'][0]<8){
        this["engine"]="trident";
        if (this['ie'][0]==7)this["trident"]=[3,0];
        else if (this['ie'][0]==6)this["trident"]=[2,0];
        else this["trident"]=[0,0];
      }
    }else if (this["engine"]=="trident" && versionapply.call(this,ua,/\srv:([0-9\.]+)/,'ie',1,gen_ver)){
      this["browser"]="ie";
    }
    return ua;
  });
  //}}}
  //Media parse{{{
  feature.push(function(ua){
    var testdom = doc.createElementNS && 
      doc.createElementNS("http://www.w3.org/2000/svg", "svg");
    if (testdom && testdom.createSVGRect) this["svg"]=true;
    testdom = doc.createElement("video");
    if (testdom && testdom.play) this["video"]=true;
    testdom = doc.createElement("audio");
    if (testdom && testdom.play) this["audio"]=true;
    testdom = doc.createElement("canvas");
    if (testdom && testdom.getContext){
      if (testdom && testdom.getContext("2d")) this["2d"]=true;
      testdom = doc.createElement("canvas");
      if (testdom && testdom.getContext("webgl")) this["webgl"]=true;
    }
    return ua;
  });
  //}}}
  //API parse{{{
  feature.push(function(ua){
    if (glob.Gamepad) this["gamepad"]=true;
    try{
    if (glob.localStorage) this["storage"]=true;
    if (glob.sessionStorage) this["tempstorage"]=true;
    } catch(e){}
    if (glob.ArrayBuffer) this["buffer"]=true;
    if (doc.querySelector) this["selector"]=true;
    if (glob.JSON) this["json"]=true;
    return ua;
  });
  //}}}

  //}}}

  _f._toy_((env, plugins, dna)=>{
    env.navinf = new (function(ua){
      var fobj=this;
      _f.each((f,newua) => f.call(fobj,newua))(_f.iList, ua)(feature)
    })(navi.userAgent);
    _f.sysinfo = (name) => name ? env.navinf[name] : env.navinf;
  })()

})();
