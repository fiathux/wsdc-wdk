/* Mio-DSL Ajax
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
  var _f = glob._MIO_SYS_;

  //try create IE request
  var winReqTry = () => {
    return _f.except(() => {
      var try = new glob.ActiveXObject("Msxml2.XMLHTTP");
      return () => new glob.ActiveXObject("Msxml2.XMLHTTP");
    })((e)=>{
      _f.except(() => {
        var try = new glob.ActiveXObject("Microsoft.XMLHTTP");
        return () => new glob.ActiveXObject("Microsoft.XMLHTTP");
      })((e)=> null)()
    })();
  };
  //try create W3C request
  var w3cReqTry = () => glob.XMLHttpRequest && (() => new XMLHttpRequest());

  //prepare http requester
  var Requester = w3cReqTry() || winReqTry();
  if (!Requester){
    glob.console && glob.console.log("check x-http-request error!");
    return;
  }

  var reqCoder = {
    "json" : {
      "type":"application/json",
      "coder": (params) => {
        var obj = {};
        var keyexist = {};
        _f.each((pf) => {
          pf((k,v)=>{
            if (keyexist[k]){
              if (typeof(obj[k]) != "object") obj[k] = [obj[k]];
              obj[k].push(v);
            }else{
              obj[k] = v;
            }
            keyexist[k] = true;
          });
        })(_f.iList)(params)
        return JSON.stringify(obj);
      }
    },
    "uri" : {
      "type":"application/x-www-form-urlencoded",
      "coder": (params) => {
        return _f.list((pf) => {
          return pf((k,v)=>{
            return encodeURIComponent(k) + "=" + encodeURIComponent(v);
          });
        })(_f.iList)(params).join("&")
      }
    }
  }

  //Request data module
  var dataReq = function(){
    var mod = {};
    mod.header = [];
    mod.method = null;
    mod.async = true;
    mod.parameter = [];
    mod.onsuccess = [];
    mod.onerror = [];
    mod.onstate = [];
    mod.rawdata = null;
    //prepare HTTP hander
    mod.addHeader = (key, val) => {
      key = String(key);
      val = String(val);
      mod.header.push((req) => {
        req.setRequestHeader(key, val)
      });
    };
    //prepare HTTP parameter
    mod.addParameter = (key, val) => {
      key = String(key);
      val = String(val);
      mod.header.push((creator) => creator(key, val));
    }
    //add success listener
    mod.addSuccess = (handle) => {
      onsuccess.push(handle)
    }
    //add error listener
    mod.addError = (handle) => {
      onerror.push(handle)
    }
    //add state listener
    mod.addState = (handle) => {
      onstate.push(handle)
    }
    //create Request
    mod.req = (url) => {
    }

    //export module
    return mod;
  }
})();
