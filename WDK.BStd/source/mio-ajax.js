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
      var tryc = new glob.ActiveXObject("Msxml2.XMLHTTP");
      return () => new glob.ActiveXObject("Msxml2.XMLHTTP");
    })((e)=>{
      _f.except(() => {
        var tryc = new glob.ActiveXObject("Microsoft.XMLHTTP");
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

  //parameter codec
  var reqCoder = {
    "json" : {  //JSON codec
      "type":"application/json",
      "dataclass":"raw",
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
    "uri" : { //form URI codec
      "type":"application/x-www-form-urlencoded",
      "dataclass":"uri",
      "coder": (params) => {
        return _f.list((pf) => {
          return pf((k,v)=>{
            return encodeURIComponent(k) + "=" + encodeURIComponent(v);
          });
        })(_f.iList)(params).join("&")
      }
    }
  };

  //Request data module
  var dataReq = function(){
    var mod = {};
    var parameter = [];
    var header = [];
    var onsuccess = [];
    var onerror = [];
    var onstate = [];
    var paramraw = null;
    var paramcodc = reqCoder.uri.coder;
    var paramclass = reqCoder.uri.dataclass;

    mod.method = "GET";
    mod.async = true;
    mod.timeout = 30;
    mod.cnttype = reqCoder.uri.type;
    mod.user = null;
    mod.passwd = null;

    //prepare RAW data
    mod.setRaw = (raw) => {
      function rawStr(data){
        paramraw = data;
      };
      function rawObj(data){
        paramraw = JSON.stringfy(data);
        mod.cnttype = "application/json";
      };
      function rawNone(){ 
        paramraw = null;
      };
      typeof(raw) == "string" ? rawStr(raw) : (raw === null ? rawNone() : rawObj(raw));
    };
    mod.setParamCodec = (name) => {
      if (!reqCoder[name]) return false;
      paramcodc = reqCoder[name].coder;
      paramclass = reqCoder[name].dataclass;
      mod.cnttype = reqCoder[name].type;
      return true;
    }
    //prepare HTTP parameter
    mod.addParameter = (key, val) => {
      key = String(key);
      val = String(val);
      parameter.push((creator) => creator(key, val));
    };
    //prepare HTTP hander
    mod.addHeader = (key, val) => {
      if (key.toLowerCase() == "content-type"){
        mod.cnttype = val;
        return;
      }
      key = String(key);
      val = String(val);
      header.push((req) => req.setRequestHeader(key, val));
    };
    //add success listener
    //successhandle = (content, http_code)
    mod.addSuccess = (handle) => {
      onsuccess.push(handle)
    };
    //add error listener
    //errorhandle = (http_code) => {}
    mod.addError = (handle) => {
      onerror.push(handle)
    }
    //add state listener
    //statehandle = (ready_code, get_header, send_more) => {}
    mod.addState = (handle) => {
      onstate.push(handle)
    };
    //call state event
    var cbState = (readycode, req) => {
      var getheader = (name) => req.getResponseHeader(name);
      return onstate.length < 1 || _f.reduce(
        (a,b) => a && b, (evstate) => evstate(readycode, getheader))(_f.iList)(onstate);
    }
    //call state event
    var cbError = (code) => {
      _f.each((everror) => everror(code))(_f.iList)(onerror);
    };
    //call state event
    var cbSuccess = (content, code) => {
      _f.each((evsuccess) => evsuccess(content, code))(_f.iList)(onsuccess);
    };
    //reqire complete processor
    var stateComplete = (req) => {
      var httpstatus = req.status;
      if (Math.floor(httpstatus / 100) != 2) cbError(httpstatus);
      else cbSuccess(httpstatus.responseText, httpstatus);
    };
    //default state change processor
    var defaultState = (statecode ,req) => statecode == 4 && stateComplete(req);

    //Open url request
    var openURL = (req) => {
      var baseOpen = (method, url) => {
        var args = [method, url, mod.async]
        if (mod.user) args.push(mod.user);
        if (mod.passwd) args.push(mod.passwd);
        req.timeout = mod.timeout || 0;
        req.open.apply(req, args);
        _f.each((prochead) => prochead(req))(_f.iList)(header);
        req.setRequestHeader("Content-Type",mod.cnttype);
        return true;
      }
      //process addit parameter or RAW
      var procAdditData = (afterProc) => {
        var data = mod.paramraw || (parameter.length && paramcodc(parameter));
        return afterProc ? afterProc(data) : data;
      }
      //require with http-content
      var withContent = (method, url) => {
        return baseOpen(method, url) && (()=>{
          var data = procAdditData();
          if (data){
            req.send(data);
            req.send(null);
            return true;
          }else{
            var sender = (data) => {
              if (req.readyState >= 3) return false;
              req.send(data);
              return data === null ? true : sender;
            }
            return sender;
          }
        })();
      }
      //require without http-content
      var withoutContent = (method, url) => {
        var psplit = () => {
          var paramtest = /.+\?.*/;
          var paramnone = /.+\?$/;
          paramtest.test(url) ? (paramnone.test(url) ? "" : "&") : "?";
        }
        var pconv = paramclass == "uri" ? ((data) => data) : ((data) => encodeURIComponent(data));
        var url = procAdditData((data) => url + (data ? psplit() + pconv(data) : ""));
        return baseOpen(method, url) && (() => {
          req.send(null);
          return true;
        })();
      }
      return {
        "GET":(url) => withoutContent("GET"),
        "DELETE":(url) => withoutContent("DELETE"),
        "POST":(url) => withContent("POST"),
        "PUT":(url) => withContent("PUT")
      }
    }

    //create Request
    mod.req = (url) => {
      var req = Requester();
      //ready state change
      req.onreadystatechange = () => {
        var state_code = req.readyState;
        if (cbState(state_code, req) === false){
          req.abort();
          return;
        }
        defaultState(state_code, req);
      }
      var opener = openURL(req)
      return opener[mod.method] && opener[mod.method](url);
    };

    //export module
    return mod;
  }

  //append to glob
  _f.ajax = dataReq;
})();
