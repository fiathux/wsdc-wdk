/* Mio-DSL Core
 * ------------------------
 * This file is part of WDK
 * WDK is free software: you can redistribute it and/or modify it under the terms of the GNU
 * General Public License version 2.0 as published by the Free Software Foundation.
 * see <http://www.gnu.org/licenses/>
 * Copyright Fiathux Su, 2017
 ******************/

"use strict";

//Mio-sys kernel{{{
(() => {
  var glob = this;

  //functional DNA {{{
  var _DNA = (() => {
    //Excpetion: Iterator end
    function ExcIterEnd(){
      this.msg = "IterEnd";
    };

    //export{{{
    return (_M) => {
      //throw IterEnd
      _M.IterEnd = () => {
        throw new ExcIterEnd();
      };

      //check type IterEnd
      _M.isIterEnd = (exc) => {
        return exc instanceof ExcIterEnd;
      };

      //functional exception
      _M.except = (act) => (exc) => (fin) => function() {
        var e;
        try{
          return act.apply(this,arguments)
        }catch(e){
          return exc(e,(e)=>{throw e})
        }finally{
          if (fin) fin(this,arguments)
        }
      };

      //IterEnd checker
      _M.excIter = (act) => (fin) => {
        return _M.except(function(){
          act.apply(this, arguments);
          return true;
        })((e,thrw)=>{
          if (_M.isIterEnd(e)) return false;
          return thrw(e);
        })(fin)
      };

      //get next result function in iterator
      _M.next = (iter, fin) => function(){
        var iterobj = iter.apply(this,arguments)
        var roundRst;
        var itercall = _M.excIter(()=>{
          roundRst = iterobj();
        })(fin)
        return () => {
          var chkend = itercall()
          var cur = roundRst;
          return chkend && (() => cur);
        }
      }

      //export iterator to a list
      _M.list = (lmd, fin) => (iter) => function(){
        lmd = lmd || ((x) => x);
        var iterobj = iter.apply(this,arguments)
        var rst = [];
        while(_M.excIter(()=>{
            rst.push(lmd(iterobj()));
          })(fin)()) continue;
        return rst;
      };

      //reduce iterator
      _M.reduce = (reduce, preproc, fin) => (iter) => function(){
        preproc = preproc || ((x) => x);
        var iterobj = iter.apply(this,arguments)
        var rst;
        var round = _M.excIter((rec)=>{
            rec(preproc(iterobj()));
          })(fin)
        var initProc = (c) => {rst = c};
        var nextProc = (c) => {rst = reduce(rst, c)};
        for (var cur = round(initProc); cur; cur = round(nextProc)) continue;
        return rst;
      };

      //foreach iterator
      _M.each = (lmd, fin) => (iter, init) => function(){
        lmd = lmd || ((x) => x);
        var iterobj = iter.apply(this,arguments)
        var rst = init;
        while(_M.excIter(()=>{
            rst = lmd(iterobj(), rst);
          })(fin)()) continue;
        return rst; 
      };

      //loop CPS like coroutine
      _M.loop = (lmd) => function(){
        lmd = lmd.apply(this,arguments)
        while (lmd){
          lmd = lmd()
        }
      }

      //enum object keys
      _M.keys = (lmd) => (obj) => {
        lmd = lmd || ((x) => x);
        var rst = [];
        for (var k in obj){
          rst.push(lmd(k));
        }
        return rst;
      }

      //native iterators{{{
      //infinity
      _M.iInfi = (proc) => proc ? (() => proc()) : (() => true);
      
      //sequence
      _M.iSeq = (start,step) => {
        start = start || 0;
        step = step || 1;
        return () => {
          start = start + step;
          return start
        };
      };

      //number range
      _M.iRange = function(){
        var stop = arguments.length > 1 ? arguments[1] : arguments[0] || 0;
        var start = arguments.length > 1 ? arguments[0] || 0 : 0;
        var step = start > stop ? -1 : 1;
        var cond = start > stop ? ((cur) => cur >= stop) : ((cur) => cur <= stop);
        var iter = (cur) => cond(cur) ? cur : _M.IterEnd();
        return () => {
          var rst = start;
          start = iter(start + step);
          return rst;
        }
      };

      //enum list
      _M.iList = (list, start, end) => {
        end = (end || end == 0) && end <= list.length ? end : list.length;
        start = start && start <= end ? start : 0;
        var rng = _M.iRange(start, end);
        return () => list[rng()];
      };

      //object values
      _M.iVal = (obj) => {
        var vlist = _M.keys((k)=>obj[k])(obj);
        return _M.iList(vlist);
      };

      //object keys
      _M.iKey = (obj) => {
        var vlist = _M.keys()(obj);
        return _M.iList(vlist);
      };

      //union iterator
      _M.iComb = function(){
        var args = arguments;
        var iterlist = ()=> { //make combine iterator
          return _M.aMap(_M.iList, (arg) => {
            return typeof(arg) == "function" ? arg :
              (typeof(arg) == "object" && arg.length ? _M.iList(arg) : _M.iList([arg]));
          })(args)
        }
        var iExp = (rounds) => {
          var roundFactory = (rIter) => { //create per-round iterate
            rIter = rIter || _M.IterEnd();
            return _M.next(rIter)();
          }
          var jumpRound = () => { //jump empty
            var effRound, effVal, nextVal;
            var jumpProc = () => {
              effRound = roundFactory(rounds());
              nextVal = effRound()
              return nextVal ? null : jumpProc;
            };
            _M.loop(jumpProc)();
            return ()=>{
              effVal = nextVal;
              nextVal = effVal && effRound();
              return effVal;
            };
          }
          return ((rNext) => () => {  //result
            var nx = rNext();
            if (!nx){
              rNext = jumpRound();
              nx = rNext()
            }
            return nx();
          })(jumpRound());
        }
        return args.length ? iExp(_M.next(iterlist)()) : (()=>_M.IterEnd());
      }

      //advance iterator filter
      _M.aFilt = (iter, filter) => function(){
        var iterobj = iter.apply(this,arguments)
        return () => {
          var rst = iterobj()
          while (!filter(rst)) rst = iterobj();
          return rst;
        }
      };

      //advance iterator mapper
      _M.aMap = (iter, mapper) => function(){
        var iterobj = iter.apply(this,arguments)
        return () => {
          var rst = iterobj()
          return mapper(rst);
        }
      };
      //}}}

      return _M
    };
    //}}}
  })();
  //}}}

  var _f = _DNA({}); //Inner functional instance

  //generate event bind id
  var genUniqueID = (() => {
    var chartab = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];
    return (n) => {
      n = n || 8;
      var toHex = _f.list((onebyte) => chartab[onebyte >> 4] + chartab[onebyte & 0xf]);
      var iterByte = (num) => {
        num = Math.floor(num);
        return () => {
          var onebyte = typeof(num) == "number" ? num & 0xff : _f.IterEnd();
          num = num < 256 ? null : num >>> 8;
          return onebyte;
        }
      }
      var ts_hex = toHex(iterByte)((new Date()).getTime()).join("");
      var ts_rnd = toHex(_f.aMap(_f.iRange, (i)=>Math.floor(Math.random()*256)))(n).join("");
      return ts_hex+ts_rnd;
    }
  })()
  //compatible symbol
  var genSymbol = (() => {
    var symbImp = () => {
      return glob.Symbol();
    }
    return glob.Symbol ? symbImp : genUniqueID;
  })();

  //create Mio-sys kernel
  var createKernel = () => {
    var env = {};
    var plugins = [];

    //export kernel interface
    var exportMod = function() {
      var args = arguments;
      var exec = function(plugcall){
        return plugcall ? plugcall().call(this, env, plugins) : null;
      }
      return exec(_f.next(
        _f.aFilt(_f.aMap(_f.iList, (pone) => pone(args)), (pone)=>pone))(plugins)());
    }

    //default-plugins: kernel clone
    plugins.push((args) => {
      return (!args || args.length == 0) && (() => createKernel());
    });

    //tools: export advance function that contain kernel-domain
    exportMod._toy_ = (func) => function(){
      func.apply(this, _f.list()(_f.iComb)([env, plugins, _DNA], arguments));
    }

    //tools: export unique id factory
    exportMod.symbol = genSymbol;
    exportMod.uniqueID = genUniqueID;

    //append functional DNA
    return _DNA(exportMod);
  }

  glob._MIO_SYS_ = createKernel();
  if (!glob.$) glob.$ = glob._MIO_SYS_;
})();
//}}}

