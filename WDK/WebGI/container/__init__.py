from WDK.WebGI.container.wdkenv import basicEnvdef getMWEnv(**arg):    if "custom" in arg: cEnv=arg["custom"]    else: cEnv = basicEnv()    if "fileconf" in arg and arg["fileconf"]:        cEnv.fileConf(arg["fileconf"],"fileenc" in arg and arg["fileenc"])    elif "strconf" in arg:        cEnv.strConf(arg["strconf"])    if "proc" in arg: cEnv=arg["proc"](cEnv)    if "item" in arg:        for k,v in arg["item"]: cEnv.addStatic(k,v)    def mw_env(appmw):        return lambda env,rpo: appmw(cEnv.begin(env),rpo)    return mw_env