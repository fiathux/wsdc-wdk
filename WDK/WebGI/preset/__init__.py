import ioimport tracebackdef getMWPath(instname):    def mw_path(default):        def execute(env,rpo):            if not env.path.current():return default(env,rpo)            try:                reqmod = instname + env.path.current()                module = __import__(reqmod,None,None,["appEntry"])                if not hasattr(module,"appEntry"):                    env.log("Invailed module in path: %s : %(svrPath)s - %s",                            env.path.current(),reqmod,level="error")                    return default(env,rpo)                return module.appEntry(env,rpo)            except Exception as e:                env.log("Invailed path import :%s",repr(e),level="error")            return default(env,rpo)        return execute    return mw_path