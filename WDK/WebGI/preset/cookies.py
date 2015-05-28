from WDK.WebGI import preset
import time

# Cookies get/set middleware
def mw_cookies(appmw):
    # Splite key-value
    def cook_spkv(cstr):
        pos=cstr.find("=")
        return (cstr[:pos],cstr[pos:])
    # Splite item
    cook_spitm = lambda cstr: map(cook_spkv,cstr.split(";"))
    # Auto set cookies on response call
    def cookrepo(env,rpo):
        return preset.response_rep(rpo,None,lambda:env["wdk.setcookies"].genHttpHeader())
    def execute(env,rpo):
        if "HTTP_COOKIE" in env and env["HTTP_COOKIE"]:
            env["wdk.fromcookie"]=cookie.fromstr(env["HTTP_COOKIE"])
        env["wdk.setcookies"]=cookie()
        return appmw(env,cookrepo(env,rpo))
    return execute

# Cookies information manager
class cookie(object):
    # Cookie item serialize class
    class cookitem(object):
        def __init__(I,name=None,value=None,path=None,life=None,ver="Dirty"):
            I.name=name
            I.value=value
            I.path=path
            I.life=life
            I.ver=ver
        # Format cookie string
        def __str__(I):
            if not I.name:return ""
            value =I.value if type(I.value)==str else str(I.value)
            return "".join([I.safe_shift(I.name),"=",I.safe_shift(value),
                    (I.path and ("; Path=%s" % I.path)) or "",
                    (I.life and time.strftime("; Expires=%a, %d %b %Y %H:%M:%S GMT",
                        time.gmtime(I.life))) or "",
                    (I.ver and ("; Version=%s" % I.ver)) or ""])

        @staticmethod
        def safe_shift(usstr):# Reference RFC2109
            usstr.replace("%","%25")
            usstr.replace(";","%3b")
            usstr.replace("\r","%0d")
            usstr.replace("\n","%0a")
            usstr.replace(",","%2c")
            usstr.replace("'","%27")
            usstr.replace('"',"%22")
            usstr.replace('=',"%3D")
            return usstr

        @staticmethod
        def reverse_shift(sstr):
            sstr.replace("%3D",'=')
            sstr.replace("%3b",";")
            sstr.replace("%0d","\r")
            sstr.replace("%0a","\n")
            sstr.replace("%2c",",")
            sstr.replace("%27","'")
            sstr.replace("%22",'"')
            sstr.replace("%25","%")
            return sstr
        # Read cookies string 
        @classmethod
        def fromstr(C,cookstr):
            pos = cookstr.find("=")
            if (pos): return C(C.reverse_shift(cookstr[:pos]),C.reverse_shift(cookstr[pos+1:]))
            else: return None

    def __init__(I):
        I.cookdict={}

    def setCookie(I,name,value,path=None,life=None,ver=None):
        I.cookdict[name]=I.cookitem(name,value,path,life,ver)

    def __getitem__(I,name):
        return I.cookdict[name]
    
    def __contains__(I,name):
        return name in I.cookdict

    def __delitem__(I,name):
        del I.cookdict[name]

    def __iter__(I):
        return I.cookdict.values()

    # Generate HTTP response parameter
    def genHttpHeader(I):
        return [("Set-Cookie",str(co)) for co in filter(lambda v:v.name, I.cookdict.values())]

    # Read from cookies string
    @classmethod
    def fromstr(C,cookstr):
        cookgrp = cookstr.split(";")
        return { co.name:co.value for co in map(lambda v:C.cookitem.fromstr(v.strip()),cookgrp) }
