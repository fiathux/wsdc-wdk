// vim: filetype=javascript

/* Wonder-mask standard javascript library
 * Basic support module
 * ---------------------------------------------
 * GNU LESSER GENERAL PUBLIC LICENSE
 * This program is free software : you can redistribute it and/or modify
 * it under the terms of the Lesser GNU General Public License as published
 * by the Free Software Foundation.
 * ---------------------------------------------
 * Fiathux Su
 * 2014-5-1
 */

//Initialize block
(function(initfunc){
    //Framework Core{{{
    var _WStdCore=(function(){
        //DNA Library object {{{
        var coreObj=function(){//Core object prototype
            this.__WSTDVersion=2;
        };
        
        var DNA=function(){
            var me=this;
            
            var exceptIterEnd=function(){//Exception constructor who is flag iterate must be stop
                this.msg="IterEnd";
                this.addit=arguments;
            }

            var protoList=function(){//Custom list prototype
                this.length=0;
                this.__isList=true;
            }

            //Data type support {{{ 
            me.isDef=function(vrb){//Check if variable is defined
                return vrb!==undefined;
            }

            me.isNull=function(vrb){//Check if variable is null
                return vrb===null;
            }

            me.isNone=function(vrb){//Check if object is not been quoted
                return !me.isDef(vrb) || me.isNull(vrb);
            }

            me.isList=function(vrb){//Check if variable is list
                function isArray(){ return vrb instanceof Array; };
                function hadLen(){ return !me.isNone(vrb.length); };
                function hadItem(){ return me.isDef(vrb[0]) && me.isDef(vrb[vrb.length-1]); };
                //function zeroItem(){ return vrb.length===0 && !(vrb instanceof Function); };
                function isCustom(){ return vrb.__isList==true; };
                function setForce(){ return vrb instanceof protoList; }
                function notNone(){ 
                    return isArray() || setForce() || 
                        (hadLen() && !me.isStr(vrb) && (isCustom() || hadItem()));
                }
                return !me.isNone(vrb) && notNone();
            }

            me.isObj=function(vrb){
                return typeof vrb=="object";
            }

            me.isCore=function(vrb){//Check if variable is the Core-object
                return vrb instanceof coreObj;
            }

            me.isFunc=function(vrb){
                return typeof vrb=="function";
            }

            me.isIter=function(vrb){
                return me.isFunc(vrb) && vrb.__isIterator && vrb.__genLoop;
            }

            me.isNum=function(vrb){
                return typeof vrb=="number";
            }

            me.isStr=function(vrb){
                return typeof vrb=="string";
            }

            me.isBool=function(vrb){
                return typeof vrb=="boolean";
            }

            me.LIST=function(){//Custom list-object's prototype
                return new protoList();
            }
            //}}}

            me.exception=function(e){//Make an exception
                throw e;
            };

            me.ITEREND=function(){//Stop iterate
                me.exception((arguments.length && new exceptIterEnd(arguments[0])) ||
                        new exceptIterEnd());
            };

            me.allTrap=function(exec){ //Catch all exception
                return function(iep){
                    return function(){
                        try{ return exec.apply(this,arguments); }
                        catch(e){
                            return iep && iep(e,arguments);
                        }
                    }
                }
            }

            me.oneTrap=function(exceptProto,exec){ //Catch an exception
                return function(iep){
                    return me.allTrap(exec)(function(e,args){
                        return e instanceof exceptProto ?
                                iep && iep(e,args) : me.exception(e);
                    });
                }
            }

            me.IterEndTrap=function(exec){//Catch iterate-end exception
                return function(iep){ return me.oneTrap(exceptIterEnd,exec)(
                        function(e,args){ return iep && iep(e.addit,args) }); }
            }

            //common iterator support {{{
            me.iterFactory=function(init,iter,quote,custom){
                function genloop(cut,master){
                    var first=true;
                    return (custom && function(){
                        if (first) first=false;
                        else master=master.next();
                        return master();
                    }) || function(){
                        if (first) first=false;
                        else cut=iter(cut);
                        return quote ? quote(cut) : cut;
                    };
                }
                function producer(current){
                    var result=function(){return quote ? quote(current) : current;}
                    result.next=function(){ return producer(iter(current)); }
                    result.__isIterator=true;
                    result.__genLoop=function(){return genloop(current,result);};
                    return (custom && custom(result)) || result;
                }
                return producer(init);
            }

            /*me.iterFactory=function(entity,iter,quote,custom){
                function generalQuote(){ return this; }
                if (!quote) quote=generalQuote;
                var result = function() { return quote.apply(entity,arguments); }
                result.next = function() {
                    return me.iterFactory(iter(entity),iter,quote,custom);
                }
                result.__isIterator=true;
                if (custom)result = custom(result);
                return result;
            }*/

            me.stepper_=function(begin,step){//Numbers stepper iterator
                begin=begin || 0;
                step=step || 1;
                return me.iterFactory(begin,function(ent){return ent+step;});
            }

            me.range_=function(begin,end){//Integer range iterator
                var bg=(!me.isNone(end) && begin) || 0;
                var ed=me.isNone(end) ? begin : end;
                if (bg==ed)return me.NONE_();
                var stp=(bg<ed && 1) || -1;
                return me.iterFactory(bg,function(ent){
                    return ent+stp!=ed ? ent+stp : me.ITEREND();
                });
            }

            me.evolve_=function(origi_iter,func,custom){//Map iterator‘s result
                function quote(data){ return func.apply(data(),arguments); }
                function iter(prev){ return prev.next(); }
                return me.iterFactory(origi_iter,iter,quote,custom);
            }

            me.infinity_=function(){//Infinity iterator
                function iter(prev){ return prev; };
                return me.iterFactory(true,iter);
            };

            me.NONE_=function(){//Nothing iterator
                return me.iterFactory(null,me.ITEREND,me.ITEREND);
            }

            var indexIter=function(start,end,len){//Baisc index iterator
                function posi(val,len){ 
                    var fix=val<0 && len+val || val;
                    return ( fix>0 && ((fix<=len && fix) || len) ) || 0
                }
                var posiS=posi(start,len);
                var posiE=posi(end,len);
                function noneIter(a,b){ return a==b && me.NONE_() ;};
                //function rIter(a,b){ return (a<b && me.range(a,b)) || me.range(b,a) ;}
                function rIter(a,b){ return (a<b && me.range_(a,b)) || me.range_(b,a) ;}
                var rg=noneIter(posiS,posiE) || rIter(posiS,posiE);
                function iter(prev){ return prev.next(); }
                return function(agent){ return me.iterFactory(rg,iter,agent) }
            }

            me.list_=function(li,start,end){//List iterator
                var len=li.length || 0;
                return indexIter(start || 0,me.isDef(end) ? (end || 0) : len,len)(
                        function(data){ return li[data()]; });
            };

            me.catalog_=function(hs){//Hash-table list iterator
                var keys=[];
                for (var k in hs) keys.push(k);
                return me.list_(keys);
            };

            me.chars_=function(str){//String characters iterator
                return indexIter(0,str.length,str.length)(function(data){
                    return str.charAt(data());
                });
            }

            me.charu_=function(str){//String unicode iterator
                return indexIter(0,str.length,str.length)(function(data){
                    return str.charCodeAt(data());
                });
            }

            me.various_=function(obj){//Various object convert to iterator
                function singleIter(obj){
                    var iter=function(prev){ return me.ITEREND(); }
                    return me.iterFactory(obj,iter);
                }
                function stay_iter(obj){ return me.isIter(obj) && obj; }
                function conv_list(obj){ return me.isList(obj) && me.list_(obj); }
                return stay_iter(obj) || conv_list(obj) || singleIter(obj);
            }

            me.mlist_=function(one){//Multi-list iterator
                function exceptSubIterEnd(upper){//Custom IterEnd for sub-unit
                    this.msg="SubIterEnd";
                    this.addit=upper;
                }
                function mkSubIter(orig_iter,parent_iter){//Create sub-unit iterator
                    var subexcpt=new exceptSubIterEnd(parent_iter);
                    function quote(data){ return data(); }
                    function iter(ent){
                        return me.IterEndTrap(ent.next)(function(){ me.exception(subexcpt); })(); 
                    }
                    function custom(r){
                        r.__isSubIter=true;
                        return r;
                    }
                    return me.iterFactory(orig_iter,iter,quote,custom);
                }
                var atList=function(something){
                    function jumpEmptyRoot(li){//Pass empty root-unit
                        var iterTest=me.IterEndTrap(function(itm){ itm(); return true; })(
                                function(){ return false; });
                        while(true){
                            var item=li();
                            if (me.isList(item) && item.length) 
                                return mkSubIter(me.list_(item),li);
                            else if (me.isIter(item) && iterTest(item)) 
                                return mkSubIter(item,li);
                            else if (!me.isList(item) && !me.isIter(item)) return li;
                            li=li.next();
                        }
                    }
                    function quote(data){ return data(); }
                    function iter(ent){
                        function sub_iter(){
                            return me.oneTrap(exceptSubIterEnd,function(){
                                return ent.next();
                            })(function(e){
                                return jumpEmptyRoot(e.addit.next());
                            })();
                        }
                        return (ent.__isSubIter && sub_iter()) || jumpEmptyRoot(ent.next());
                    }
                    rootL=me.various_(something);
                    return me.IterEndTrap(function(){
                        return me.iterFactory (jumpEmptyRoot(rootL),iter,quote);
                    })(function(){
                        return me.NONE_();
                    })();
                }
                return (arguments.length>1 && atList(arguments)) || atList(one);
            }
            //}}}

            var quickArgs=function(args,tail){//Quick parse function arguments
                if (args.length < (tail.length+1))
                    me.exception("Function takes at least "+ (tail.length+1) +" arguments");
                var result={
                    "args": (args.length > tail.length+1 && 
                            me.mlist_(me.list_(args,0,args.length-tail.length))) || 
                        me.various_(args[0])
                    };
                var atail=args.length-tail.length;
                for (var i=0;i<tail.length;i++) result[tail[i]]=args[atail+i];
                return result;
            }

            var mapFactory=function(func){
                return function(){
                    function defaultFunc(args){
                        function defaultFunc(args){
                            args[args.length]=(function(obj){ return obj; });
                            args.length++;
                            return args;
                        }
                        var func=args[args.length-1];
                        return (me.isFunc(func) && !me.isIter(func) && args) || defaultFunc(args)
                    }
                    var qa=quickArgs(defaultFunc(arguments),["func"]);
                    var result=[];
                    return me.IterEndTrap(func.call(result,qa))(function(e,args){
                        if (e.length) result.push(e[0]);
                        return result;
                    })();
                }
            }

            me._map=function(){//Loop method(full)
                var mpfunc=function(qa){
                    var result=this;
                    return function(){
                        for (;true;qa.args=qa.args.next())
                            result.push( qa.func(qa.args(),qa.args) );
                    }
                }
                return mapFactory(mpfunc).apply(this,arguments);
            };

            me.map=function(){//Loop method(quick)
                var mpfunc=function(qa){
                    var result=this;
                    return function(){
                        var qvs=qa.args.__genLoop();
                        for (;;) result.push( qa.func(qvs()) );
                    }
                }
                return mapFactory(mpfunc).apply(this,arguments);
            };

            var reduceFactory=function(func){
                return function(){
                    var qa=(arguments.length<3 && quickArgs(arguments,["func"])) || 
                        quickArgs(arguments,["init","func"]);
                    var result=[qa.init];
                    return me.IterEndTrap(func.call(result,qa))(function(e,args){ 
                        return e.length ? e[0] : result[0];
                    })();
                }
            };

            me._reduce=function(){//Reduce data(quick)
                var redfunc=function(qa){
                    var result=this;
                    return function(){
                        for (;true;qa.args=qa.args.next())
                            result[0]=qa.func(qa.args(),result[0],qa.args);
                    }
                }
                return reduceFactory(redfunc).apply(this,arguments);
            };

            me.reduce=function(){//Reduce data(quick)
                var redfunc=function(qa){
                    var result=this;
                    return function(){
                        var qvs=qa.args.__genLoop();
                        for (;;) result[0]=qa.func(qvs(),result[0]);
                    }
                }
                return reduceFactory(redfunc).apply(this,arguments);
            };

            me.each=function(input,func){//Enumerate array(Same as JQuery)
                me.IterEndTrap(function(){
                    for (var iIt=me.various_(input).__genLoop(); true;) func(iIt());
                })()();
                return input;
            };

            me.clone=function(source,original){//do Shallow copy
                 return me.reduce(me.catalog_(source),original || {},function(k,obj){
                    obj[k]=source[k];
                    return obj;
                });
            };

            //A constructor that  from source object do shallow copy and inherit specify prototype
            me.imitator=function(source,proto){
                var pnc=function(){};
                pnc.prototype=(me.isNone(proto) && {}) || proto;
                return me.clone(source,new pnc());
            };

            //Create currying function
            me.currying=function(func){
                var c=function(f,a){
                    var step=function(args){
                        return c(f,a.concat(_DNA.map(args)));
                    }
                    var exec=function(env){
                        return f.apply(env,a);
                    }
                    return function(){
                        return (arguments.length && step(arguments)) || exec(this)
                    }
                }
                return c(func,[]);
            }
        }
        DNA.prototype=new coreObj();
        var _DNA=new DNA();
        //}}}
        
        //Automation support {{{
        var decorator_ns=function(owner,env){//Constructor of decorator namespace
            this.$=owner;
            this.$me=env;
            this.$DNA=function(){ return new DNA(); }
            this.$AutoExt=createAutoObj;
        }
        decorator_ns.prototype=new DNA();

        var decorator_original=function(owner,env,func){//decorator acceptor
            return function(){ return func.apply(new env(owner,this),arguments); }
        }

        var autoObj=function(keys,parse,env){//Automation interface prototype
            this.keys=keys || {};
            this.parse=parse || [];
            this.decorator=env;
        }
        autoObj.prototype=new coreObj();

        var createAutoObj=function(keys,parse,env){//Create automation interface
            return new autoObj(keys,parse,env);
        }

        var pluginsAutoObj=function(plugin,original){//Add automation plugins
            function advDecorator(){
                return original.decorator && plugin.decorator(original.decorator);
            }
            function advOriginal(){ return plugin.decorator(decorator_original); }
            original.keys=_DNA.clone(plugin.keys,original.keys);
            original.parse.concat(_DNA.map(plugin.parse));
            original.decorator=plugin.decorator && (advDecorator() || advOriginal());
            return true;
        }

        var keyFilter=function(owner,auto,args){//
            return auto.keys[args[0]] && function(){
                return auto.keys[args[0]](args,owner);
            }
        }

        var parseFilter=function(owner,auto,args){//
            return function(){
                _DNA.reduce(auto.parse,function(pObj,result){
                    var pobj=pObj(args[0]);
                    return pobj && _DNA.ITEREND(pobj(args,owner));
                });
            }
        }

        var automationFilter=function(owner,auto,args){//
            return (_DNA.isStr(args[0]) && keyFilter(owner,auto,args)) || 
                parseFilter(owner,auto,args);
        }

        var decoratorFilter=function(owner,auto,args){//
            return _DNA.isFunc(args[0]) && function(){
                return (auto.decorator || decorator_original)(owner,decorator_ns,args[0]);
            }
        }

        var pluginsFilter=function(owner,auto,args){//
            return args[0] instanceof autoObj && function(){ return pluginsAutoObj(args[0],auto); }
        }

        var defaultFilter=function(owner,auto,args){//
            return !args.length && function(){ return automationCore(); }
        }

        var automationCore=function(){//Create automation core
            var ao=createAutoObj();//Automation interface
            var af=function(){//Automation core
                return (defaultFilter(af,ao,arguments) || decoratorFilter(af,ao,arguments) ||
                    pluginsFilter(af,ao,arguments) || automationFilter(af,ao,arguments))();
            }
            return af;
        }
        //}}}

        return automationCore();//Main automation
    })()(function(){ console.log(this); return this.clone(this.$DNA(),this.$) })();
    //}}}

    initfunc(_WStdCore);
})(function(core){ _GWonder=core; });
