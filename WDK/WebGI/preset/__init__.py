import ioimport tracebackimport urllib.parseimport reimport os.path# Common mime-type mapmimetypes={    "*":"application/octet-stream", # Any binary data    "txt":"text/plain",    "text":"text/plain",    "html":"text/html",    "htm":"text/html",    "css":"text/css",    "js":"application/javascript",    "json":"application/json",    "xml":"application/xml",    "dtd":"application/xml-dtd",    "pdf":"application/pdf",    "zip":"application/zip",    "gz":"application/gzip",    "gzip":"application/gzip",    "jpg":"image/jpeg",    "jpeg":"image/jpeg",    "gif":"image/gif",    "png":"image/png",    "svg":"image/svg+xml",    "aac":"audio/mp4",    "m4a":"audio/mp4",    "mp3":"audio/mpeg",    "ogg":"audio/ogg",    "wav":"audio/vnd.wave",    "mp4":"video/mp4",    "webm":"video/webm",    "webp":"image/webp"    }# Refrance as:# http://www.wikipedia.org# http://www.iana.org/# fxcat 2015-05-11status = {    # Request generally successed    200:("200 OK",None),    # Request success in another source    201:("201 Created",None),    # Request accepted and it in process at another source    202:("202 Accepted",None),    # Request success but nothing in reponse    204:("204 No Content",None),    # For multi-redirect list page    300:("300 Multiple Choices",None),    # Redirect permanently    301:("301 Moved Permanently",None),    # Almost use as 303 in popular browser    302:("302 Found",None),    # Redirect to another URL using GET method (POST to current server)    303:("303 See Other",None),    # Resource same with browser cache    304:("304 Not Modified",None),    # Redirect to another URL and repeat request, browser do it parallel as posable    307:("307 Temporary Redirect",None),    # Same as 301, but it method not allow to change and do it parallel as posable    308:("308 Permanent Redirect",None),    # Can not process request, there are some problem in request data    400:("400 Bad Request","Some problem in your request. such as parameter or address missing"),    # Failed in request authorize    401:("401 Unauthorized","You must get authorize and retry your request"),    # Server refusing to response    403:("403 Forbidden","You are unable to access data. please contact webmaster"),    # Request data not found    404:("404 Not Found","Fail to process your request. please contact webmaster or try later"),    # Request method (POST or GET) not allowed    405:("405 Method Not Allowed","Your request not allowed. please contact webmaster"),    # Content not for accepted client    406:("406 Not Acceptable","Your request not allowed. please sign out and retry"),    # Request Timeout    408:("408 Request Timeout","Network is busy. please try your request later"),    # A jokes in RFC 2324 ^ ^    418:("418 I'm a teapot","I'm a teapot c<^>r~ ^ ^"),    # Out of server limited request    429:("429 Too Many Requests","Server is busy. please try your request later"),    # An error occur in server    500:("500 Internal Server Error","An error occurred in service program"),    # Request content not implemented    501:("501 Not Implemented","Fail to process your request. please contact webmaster"),    # Current server unavailable    503:("503 Service Unavailable","Unavailable request now")    }# Get HTTP response statusdef htStatus(code):    return code in status and status[code][0]# Get HTTP status detaildef htStatusUsr(code):    return code in status and status[code]# Get mime-type from file suffixdef mimeFind(suffix):    return (suffix in mimetypes and mimetypes[suffix]) or mimetypes["*"]# Override start_responsedef response_rep(rpo,s=None,h=None):    return lambda status,headers:\            rpo(status or (s and s()),\            (h and headers and list(headers)+list(h())) or (h and h()) or headers)# Get HTTP status middlewaredef genMWStatus(code):    def mw_status(appmw):        def execute(env,rpo):            return appmw(env,response_rep(rpo,lambda:htStatus(code)))        return execute    return mw_status# Get HTTP mime-type header middlewaredef genMWMimetype(suffix,encode=None):    def genRpo(rpo):        typestr=mimeFind(suffix)        if encode: typestr="%s;charset=%s" % (typestr,encode)        return response_rep(rpo,None,lambda:[("Content-Type",typestr)])    # Generate middleware    def mw_status(appmw):        def execute(env,rpo):            return appmw(env,genRpo(rpo))        return execute    return mw_status# Generate 200 OK middlewaredef genMWOk():    return genMWStatus(200)RDTYPES = { # Redirect type name to HTTP status code    "fixed":301,    # Full name    "temp":302,    "repeat":307,    "repeat+":308,    "f":301,        # Simple name    "t":302,    "r":307,    "r+":308    }# Generate redirect application# url : redirectory URL# rdtype : redirect type, may set follow values:#   'f' : redirect permanently. usually use GET method (HTTP 301)#   't' : redirect temporary. use GET method (HTTP 302)#   'r' : redirect temporary and repeat request. do it as parallel as possible (HTTP 307)#   'r+': redirect permanently and repeat request. do it as parallel as possible  (HTTP 308)def genAppRedirect(url,rdtype):    if rdtype not in RDTYPES: return None    @genMWStatus(RDTYPES[rdtype])    def app_rdir(env,rpo):        io=rpo(None,[("Location",url)])        return (b"",)    return app_rdir# Generate error report applicationdef genAppError(code,note=""):    if code<400 or code not in status: return None    note = (note and "<p>%s</p>" % (note,)) or ""    @genMWStatus(code)    @genMWMimetype("html","utf-8")    def app_error(env,rpo):        statcode,statinfo = htStatusUsr(code)        io=rpo(None,None)        return (("""<!DOCTYPE html><html><head><title>Error</title></head><body><h1>%s</h1><hr /><p>%s</p>%s</body>""" % (statcode,statinfo,note)).encode("utf-8"),)    return app_error# Generate 'not modified' application (HTTP 304)def genAppNotModify(note):    @genMWStatus(304)    def app_notmodify(env,rpo):        io=rpo(None,[])        return ((note and note.encode("utf-8")) or b"",)    return (note and genMWMimetype("txt","utf-8")(app_notmodify)) or app_notmodify# Generate path loader middlewaredef genMWPath(instname):    def mw_path(default):        appcache={}        def execute(env,rpo):            if not env.path.next(): return default(env,rpo)            if env.path.next() not in appcache:                reqmod = "%s.%s" % (instname,env.path.next())                try:                    module = __import__(reqmod,None,None,["appEntry"])                except Exception as e:                    env.inst.log("Invailed path import :%s",repr(e),level="debug")                    return default(env,rpo)                if not hasattr(module,"appEntry"):                    env.inst.log("Invailed module in path: %s - %s",                            env.path.current(),reqmod,level="error",env=env)                    return default(env,rpo)                appcache[env.path.next()] = module.appEntry            entry = appcache[env.path.next()]            env.path.pop()            try:                return entry(env,rpo)            except Exception as e:                env.inst.log("path app error: %s - %s",                            env.path.current(),repr(e),level="error",env=env)                return default(env,rpo)        return execute    return mw_path# Parse form data from post methoddef mw_postform(appmw):    def execute(env,rpo):        if "wdk.postform" in env: return appmw(env,rpo)        try:            if "REQUEST_METHOD" in env and env["REQUEST_METHOD"] == "POST" and "CONTENT_TYPE" in\                    env and env["CONTENT_TYPE"] == "application/x-www-form-urlencoded" and\                    "CONTENT_LENGTH" in env and int(env["CONTENT_LENGTH"]) > 0:                reqstr = env["wsgi.input"].read(int(env["CONTENT_LENGTH"])).decode("utf-8")                qsobj = urllib.parse.parse_qs(reqstr)                env["wdk.postform"] = qsobj        finally:            return appmw(env,rpo)    return execute# Parse form data from post methoddef mw_getform(appmw):    def execute(env,rpo):        if "wdk.getform" in env: return appmw(env,rpo)        try:            if "QUERY_STRING" in env and env["QUERY_STRING"]:                qsobj = urllib.parse.parse_qs(env["QUERY_STRING"])                env["wdk.getform"] = qsobj        finally:            return appmw(env,rpo)    return execute# Generate deny path rule middlewaredef genMWDenyPath(denyfile,denyapp=None):    skpcmt = lambda strline: strline and strline[0]!="#"    if type(denyfile) == str: # Read from file        denystr = open(denyfile,"r",encoding="utf-8").read()    else: # Read from io        denyfile.seek(0)        denystr = denyfile.read()    denygrp = filter(lambda itmstr: skpcmt(itmstr.strip()),denystr.split("\n"))    rules = [re.compile(itm) for itm in denygrp]    if not denyapp: denyapp = genAppError(403)    def mw_denypath(appmw):        def execute(env,rpo):            rpath = "/" + (env.path.relative() or "")            for r in rules:                if r.match(rpath): return denyapp(env,rpo)            return appmw(env,rpo)        return execute    return mw_denypath# Print full environment content@genMWOk()@genMWMimetype("txt")def app_env(env,rpo):    rpo(None,None)    li=[per for per in env.keys()]    li.sort()    return ("".join(["%s: %s\n" % (str(perli),str(env[perli])) for perli in li]).encode("utf-8"),            "\n----\nGlobal Configure:\n".encode("utf-8"),str(env.inst.conf).encode("utf-8"))# Rule for invalid path parserINVD_PATH = (re.compile("^\.+/").match,re.compile("/\.+/").search,re.compile(".*/\.+$").match)# Parser get file suffixSUFFIX_PATH = re.compile(".*\.([^\./]+)$")# Static file request for debugdef genAppStaticFile(baspath,errorapp=None):    if not errorapp: errorapp = genAppError(404)    def app_static(env,rpo):        rpath = env.path.relative()        if not rpath: return errorapp(env,rpo)        for r in INVD_PATH:            if r(rpath):return errorapp(env,rpo)        path = "%s/%s" % (baspath,rpath)        if not os.path.isfile(path): return errorapp(env,rpo)        sufmch = SUFFIX_PATH.match(rpath)        mimemw = (sufmch and genMWMimetype(sufmch.group(1))) or genMWMimetype("*")        try: # Try open file            size = os.path.getsize(path)            filedate = env.webTime(os.path.getmtime(path))            fp = open(path,"rb")        except:            env.inst.log("Can not read file '%s'",path,level="warning")            return errorapp(env,rpo)        # File data response        @genMWOk()        def app_fileresp(env,rpo):            io = rpo(None,[("Content-Length",str(size)),("Last-Modified",filedate)])            if size <= 524288:                return (fp.read(),)            else:                while True:                    buff = fp.read(524288)                    io(buff)                    if len(buff)<524288:return (b"",)        try:            return mimemw(app_fileresp)(env,rpo)        finally:            fp.close()    return app_static