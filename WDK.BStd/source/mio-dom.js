/* Mio-DSL DOM
 * ------------------------
 * This file is part of WDK
 * WDK is free software: you can redistribute it and/or modify it under the terms of the GNU
 * General Public License version 2.0 as published by the Free Software Foundation.
 * see <http://www.gnu.org/licenses/>
 * Copyright Fiathux Su, 2017
 ******************/

"use strict";

//DOM plugins
(()=>{
  var glob = this;
  var doc = document;
  var _f = glob._MIO_SYS_;

  //Batch DOM find
  var expDOMFind = (base) => (parse) => {
    var qryOne = (p) => {
      return _f.list()(_f.aFilt(_f.aMap(_f.iList, (d)=>d.querySelector(p)), (d)=>d))(base);
    }
    var qryAll = (p) => {
      var rst = [];
      _f.each((grp)=>{
        if (grp.length) {
          rst = rst.concat(_f.list()(_f.iList)(grp))
        }
      })(_f.aFilt(_f.aMap(_f.iList, (d)=>d.querySelectorAll(p)), (d)=>d))(base);
      return rst;
    }
    var mch = /^(\/(\?)?\s*)./;
    var chk = mch.exec(parse);
    var domsel = chk && (chk[2] ? qryOne : qryAll);
    return domsel && (() => domsel(parse.substr(chk[1].length)));
  };

  var isDOMElem = (obj) => typeof(obj) == "object" && obj.nodeType &&
      (obj.nodeType == 1 || obj.nodeType == 9 || obj.nodeType == 11);
  var isDOMDoc = (obj) => typeof(obj) == "object" && obj.nodeType && obj.nodeType == 9;

  //conver style name from CSS-style to DOM-style
  var styCSS2DOM = (name) => {
    var nmgrp = name.split("-");
    return _f.list()(_f.iComb)(nmgrp[0], _f.aMap(_f.iList,(s)=>{
      return s.substr(0,1).toUpperCase() + s.substr(1)
    })(nmgrp,1)).join("");
  }

  //make pure DOM list
  var DomList = function(dom){
    var rst = {};
    var i = 0;
    _f.each((d)=>{
      rst[i++] = d;
    })(_f.iList)(dom);
    rst.length = i;
    return rst;
  }

  //batch operation for DOM list
  var _BATCHDOM = (dom) => {
    dom = DomList(dom);

    //CPS: enum each DOM object
    var dom_each = function(func){
      _f.each(func)(_f.iList)(dom);
      return dom_each;
    };

    //CPS: batch set style
    var dom_sty = function(name,val){
      var styname = styCSS2DOM(name)
      dom.each((d)=>{
        if (d.style) d.style[styname] = val;
      });
      return dom_sty;
    };

    //CPS: batch set attribute
    var dom_attr = function(name,val){
      dom.each((d)=>{
        d.setAttribute && d.setAttribute(name, val);
      });
      return dom_attr;
    };

    //CPS: batch set proprety
    var dom_prop = function(name,val){
      dom.each((d)=>{
        d[name] = val;
      });
      return dom_prop;
    };

    var setValElement = {
      "select" : (d,val) => { //for select element
        var options = d.options;
        var getOptVal = (idx) => {
          return  options[idx] && options[idx].value;
        }
        var selval = typeof(val) == "number" ? getOptVal(val) : val
        var selod;
        _f.each((od)=>{
          selod = (selval == od.value) || (!selod && od.selected) ? od : selod;
          od.selected = false;
        })(_f.iList)(options);
        if (selod) selod.selected = true;
      },
      "input" : (d,val) => { //for input element
        d.value = val;
      },
      "textarea" : (d,val) => {//for textarea element
        d.value = val;
      },
    };

    //CPS: batch set value
    var dom_val = function(val){
      dom.each((d)=>{
        var valProc = d.nodeType == 1 && setValElement[d.tagName.toLowerCase()];
        return valProc ? valProc(d, val) : null;
      });
      return dom_val;
    };

    //Chain: event bind
    var dom_bind = function(name, func, capture){
      var capture = (capture && true) || false; // fix data type
      //normal event handle
      var callevent = function(ev){
        var evnt = ev || event;
        func.call(this,evnt);
      };
      function bindIELegacy(d){ // bind event for legacy version of IE
        d.attachEvent("on"+name, callevent);
      };
      function bindGeneral(d){ // bind event for W3C
        d.addEventListener(name, callevent, capture);
      };
      function unbindIELegacy(d){ // unbind event for legacy version of IE
        d.detachEvent("on"+name, callevent);
      };
      function unbindGeneral(d){ // unbind event for W3C
        d.removeEventListener(name, callevent, capture);
      };
      var bindid = _f.uniqueID(8);
      dom.each((d)=>{
        if (!d._MIO_BIND_) d._MIO_BIND_ = {};
        d._MIO_BIND_[bindid] = {
          "remove":d.removeEventListener ?
            (() => unbindGeneral(d)) : (() => unbindIELegacy(d)),
          "action":name
        }
        d.addEventListener ? bindGeneral(d) : bindIELegacy(d);
      });
      return {
        "id":bindid,
        "bind":dom_bind,
      };
    };

    //CPS: event unbind
    var dom_unbind = function(bindid){
      dom.each((d)=>{
        if (!d._MIO_BIND_ || !d._MIO_BIND_[bindid]) return;
        d._MIO_BIND_[bindid].remove();
        delete d._MIO_BIND_[bindid];
      });
      return dom_unbind;
    }

    //CPS: batch set css
    var dom_css = function(){
      var options = arguments;
      var unsybList = (iter) => _f.aMap(iter, (c)=> {
        return c.substr(0,1) == "+" || c.substr(0,1) == "-" ? c.substr(1) : c
      })
      var toCssTab = (allcss) => {
        var rst = {};
        _f.each((c)=>{
          rst[c] = true;
        })(_f.iList)(allcss.split(" "));
        return rst;
      }
      var append = () => unsybList(_f.aFilt(_f.iList, (c)=> c.substr(0,1) != "-"))(options);
      var remove = () => unsybList(_f.aFilt(_f.iList, (c)=> c.substr(0,1) == "-"))(options);
      dom.each((d)=>{
        if (d.nodeType != 1) return;
        var mdfTab = (d.className && toCssTab(d.className)) || {};
        _f.each((c)=>{ //append class
          mdfTab[c] = true;
        })(append)();
        _f.each((c)=>{ //remove class
          mdfTab[c] = false;
        })(remove)();
        d.className = _f.list()(_f.aFilt(_f.iKey,(c) => mdfTab[c]))(mdfTab).join(" ");
      });
      return dom_css;
    };

    //Chain: append Element
    var dom_elem = function(){
      var genElem = ((elelist) => {
        var start = 0;
        var append = true;
        if (typeof(elelist[0]) == "boolean"){
          append = elelist[0];
          start = 1;
        }
        return (d) => {
          return _f.list((tagname) => {
            var curdoc = d.nodeType == 9 ? d : doc;
            var tagrst = curdoc.createElement(tagname);
            append && d.appendChild(tagrst);
            return tagrst;
          })(_f.iList)(elelist,start)
        }
      })(arguments);
      var rst = [];
      dom.each((d) => {
        rst = rst.concat(genElem(d))
      });
      return _BATCHDOM(rst);
    };

    var dom_elem

    //CPS: batch set child
    var dom_child = function(){
      var addContent = ((cntlist) => {
        return (d) => {
          _f.each((cnt) => {
            var addDOM = () => {
              d.appendChild(cnt.cloneNode(true));
            };
            var addMioDOM = () => {
              cnt.each((cntone) => {
                cntone.nodeType == 1 && d.appendChild(cntone.cloneNode(true));
              });
            };
            var addHTML = () => {
              if (d.nodeType != 1) return;
              d.innerHTML += cnt;
            };
            (typeof(cnt) == "string" ? addHTML : (cnt._MIO_DOMLIST ? addMioDOM : addDOM))();
          })(_f.iList)(cntlist);
        }
      })(arguments);
      dom.each((d)=>{
        addContent(d);
      });
      return dom_child;
    };

    var getValElement = {
      "select" : (d) => { //for select element
        var options = d.options;
        var selobj = _f.next(_f.aFilt(_f.iList, (od) => od.selected))(options)();
        return selobj && selobj() && selobj().value;
      },
      "input" : (d) => { //for input element
        return d.value;
      },
      "textarea" : (d) => {//for textarea element
        return d.value;
      },
    };

    var getActTab = {
      "sty":(val) => {
        var styname = styCSS2DOM(val);
        return _f.list((d)=>d.style && d.style[styname])(_f.iList)(dom)
      },
      "attr":(val) => {
        return _f.list((d)=>d.getAttribute && d.getAttribute(val))(_f.iList)(dom)
      },
      "prop":(val) => {
        return _f.list((d)=>d[val])(_f.iList)(dom)
      },
      "val":() => {
        return _f.list((d)=>((d.nodeType == 1 && getValElement[d.tagName.toLowerCase()]) ||
          (() => null))(d))(_f.iList)(dom);
      },
      "bind":() => {
        var mkBindInf = (d) => d._MIO_BIND_ && 
          _f.list((key) => [key, d._MIO_BIND_[key].name].join(":"))(_f.iKeys)(d._MIO_BIND_);
        return _f.list(mkBindInf)(_f.iList)(dom)
      },
      "css":() => {
        return _f.list((d)=>d.className && d.className.split(" "))(_f.iList)(dom)
      },
      "inner":() => {
        return _f.list((d)=>d.nodeType == 1 && d.innerHTML)(_f.iList)(dom)
      }
    }

    //get specify value
    dom.get = function(name, detail){
      var domfind = (finder) => finder && (() => _BATCHDOM(finder()));
      var getProc = domfind(expDOMFind(dom)(name)) || getActTab[name];
      return getProc(detail);
    };

    //export methods
    dom.each = dom_each;
    dom.sty = dom_sty;
    dom.attr = dom_attr;
    dom.prop = dom_prop;
    dom.val = dom_val;
    dom.bind = dom_bind;
    dom.unbind = dom_unbind;
    dom.css = dom_css;
    dom.elem = dom_elem;
    dom.child = dom_child;
    dom._MIO_DOMLIST = "4.0.0";
    return dom;
  };

  //Add plugins
  _f._toy_((env, plugins, dna)=>{
    plugins.push((args) => { //Plugin
      if (args.length > 1) return;
      var one = args[0];
      var condExp = () => typeof(one)=="string" && expDOMFind([doc])(one);
      var condDOM = () => isDOMElem(one) && (() => [one]);
      var condDOMList = () => args.length > 0 && isDOMElem(args[0]) &&
        (() => _f.list()(_f.aFilt(_f.iList, (d) => isDOMElem(d)))(args));
      var domRst = (li) => li && li.length > 0 && (() => _BATCHDOM(li));
      var argProc = condExp() || condDOM() || condDOMList();
      return domRst(argProc && argProc());
    })
  })()
})();
