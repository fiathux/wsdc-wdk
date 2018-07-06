# PipiMi GI Module
# ------------------------
# object port for WSGI
# Fiathux Su, 2017-2018

from urllib import parse as urlparse
from collections import namedtuple
from . import rfc_default
import json
import re

# default content encoding
DftEncode = "utf-8"

# General type defined {{{
# prototype of server info
ServerInfo = namedtuple("ServerInfo", (
    "name", "port", "gateway", "protocol", "software", "multithread",
    "multiprocess", "wsgiVersion"
    ))
# Standard HTTP header info
StdHttpInfo = namedtuple("StdHttpInfo", (
    "host", "connection", "userAgent", "accept", "acceptEncode",
    "acceptLanguage", "acceptCharset"
    ))
# Remote info
RemoteInfo = namedtuple("RemoteInfo", ("addr", "port"))
# Language info
LangInfoProto = namedtuple("LangInfoProto", ("name", "script", "region", "origin", "quality"))
# Mime-type info
MimeInfo = namedtuple("MimeInfo", ("type", "subtype", "fullname", "quality"))
# Charset info
CharsetInfo = namedtuple("EncodingInfo", ("encoding", "quality"))
# Content-type info
ContentInfo = namedtuple("ContentInfo", ("type", "charset", "boundary", "length", "reader"))

# Serializable language info
class LangInfo(LangInfo):
    def __str__(me):
        if not name:
            return "Unknown language: [%s] with quality %f" % ("-".join(me.origin), me.quality)
        out = ["[%s] with quality %f - %s" % (
            me.name, me.quality, RFCLanguage[ShortLang][me.name],)]
        if me.script:
            out.append("    > [%s] %s" % (me.script, RFCLanguage[Script][me.script],))
        if me.region:
            out.append("    > [%s] %s" % (me.region, RFCLanguage[Region][me.region],))
        return "\n".join(out)

    def __repr__(me):
        q = ";q=%f" % me.quality
        if not me.name:
            return "-".join(me.origin) + q
        out = [me.name]
        if me.script: out.append(me.script)
        if me.region: out.append(me.region)
        return "-".join(out) + q

# Request content model
class Contenter(ContentInfo):
    def eof(me):
        pass
    def readRaw(me):
        pass
    def readJson(me):
        pass
    def readURI(me):
        pass
    def readMultiPart(me):
        pass
#}}}

# Request parameter support{{{
# check and get env value from WSGI
def WSGIEnvReader(env):
    return lambda name: env[name].strip() if name in env else None

# http header split
def HeadSplit(val):
    if not val: return None
    return tuple(tuple(ss.strip() for ss in s.strip().split(";")) for s in val.split(","))

# Parse headline column
def HeadListParse(parse):
    def export(val):
        valgrp = HeadSplit(val)
        if not valgrp: return None
        return tuple(filter(lambda x: x, (parse(per) for per in valgrp))) or None

# Parse association quality
_ParseQuality = re.compile("q=(0\\.[0-9]{1,2}|1)")
def AssociationQuality(params):
    quality = 1
    for param in params:
        qmch = _ParseQuality.match(param)
        if qmch: quality = float(qmch.group(1))
    return quality

# parse RFC language tags
def LangTagParse(lang):
    # parse script part
    def parseScript(lgrp):
        if not lgrp or not lgrp[0] or len(lgrp[0]) != 4:
            return None, lgrp
        scrTag = lgrp[0][0].upper() + lgrp[0][1:].lower()
        if scrTag not in RFCLanguage["Script"]:
            return None, lgrp
        return scrTag, lgrp[1:]

    # parse region part
    def parseRegion(lgrp):
        if not lgrp or not lgrp[0] or len(lgrp[0]) != 2:
            return None, lgrp
        rgnTag = lgrp[0].upper()
        if rgnTag not in RFCLanguage["Region"]:
            return None, lgrp
        return rgnTag, lgrp[1:]
    if not lang or not lang[0]:
        return None

    quality = AssociationQuality(lang[1:])
    # parse language tag
    langrp = tuple(lang[0].split("-"))
    if len(langrp[0]) != 2 or langrp[0].lower() not in RFCLanguage["ShortLang"]:
        return LangInfo(None, None, None, langrp, quality)
    lang = langrp[0].lower()
    scri, grpstk = parseScript(langrp[1:])
    regi, grpstk = parseRegion(grpstk)
    return LangInfo(lang, scri, regi, langrp, quality)

# parse mime-type
def MimeParse(mime):
    if not mime or not mime[0]:
        return None
    quality = AssociationQuality(mime[1:])
    mimegrp = mime[0].lower().split("/")
    mastertype = mimegrp[0]
    subtype = "/".join(mimegrp[1:]) if len(mimegrp) > 1 else None
    return MimeInfo(mastertype, subtype, mime[0].lower(), quality)

# parse charset
def CharsetParse(enco):
    if enco or not enco[0]:
        return None
    quality = AssociationQuality(enco[1:])
    return CharsetInfo(enco[0], quality)

# parse path
def PathParse(path):
    pathgrp = list(filter(lambda a: a, (path or "").split("/")))
    pathgrp.insert(0, "/")
    return pathgrp

# parse Content type and parameter
_ParseCharset = re.compile("charset=(.+)")
_ParseBoundary = re.compile("boundary=(.+)")
def ContentParse(cnthead, cntlen, read):
    # content charset parser
    def parseCharset(params):
        for p in params:
            pr = _ParseCharset.match(p.strip())
            if pr :return pr.group(1)
        return DftEncode
    
    # multi-part boundary parser
    def parseBoundary(params):
        for p in params:
            pr = _ParseBoundary.match(p.strip())
            if pr :return pr.group(1)
    # parse content length
    try:
        length = (cntlen and int(cntlen)) or 0
    except:
        length = 0
    if not cnthead: return ContentInfo("unknow", None, None, length)
    cntgrp = cnthead.split(";")
    return ContentInfo(cntgrp[0].strip() or "unknow",
            parseCharset(cntgrp[1:]), parseBoundary(cntgrp[1:]), length, read)
#}}}

# General Requester class
class Request(object):
    def __init__(me, wsgiEnv, baseReqEnv = {}):
        me._innerDict = baseReqEnv
        me.wsgiEnv = wsgiEnv
        me._parseWSGI(wsgiEnv)
        me._onread = []

    # parse property from WSGI environment
    def _parseWSGI(me, wsgiEnv):
        reader = WSGIEnvReader(wsgiEnv)
        me.server = ServerInfo(
                reader("SERVER_NAME"),
                reader("SERVER_PORT"),
                reader("GATEWAY_INTERFACE"),
                reader("SERVER_PROTOCOL"),
                reader("SERVER_SOFTWARE"),
                reader("wsgi.multithread"),
                reader("wsgi.multiprocess"),
                reader("wsgi.version"),
            )
        me.header = StdHttpInfo(
                reader("HTTP_HOST"),
                reader("HTTP_CONNECTION"),
                reader("HTTP_USER_AGENT"),
                HeadListParse(MimeParse)(reader("HTTP_ACCEPT")),
                HeadSplit(reader("HTTP_ACCEPT_ENCODING")),
                HeadListParse(LangTagParse)(reader("HTTP_ACCEPT_LANGUAGE")),
                HeadListParse(CharsetParse)(reader("HTTP_ACCEPT_CHARSET")),
            )
        me.remote = RemoteInfo(
                reader("REMOTE_ADDR"),
                reader("REMOTE_PORT")
            )
        me.path = PathParse(reader("PATH_INFO"))
        me.qs = reader("QUERY_STRING")
        me.method = reader("REQUEST_METHOD")
        me._contentIO = reader("wsgi.input")
        me._contentRead = lambda l: me._contentIO.read(l)
        me._errorIO = reader("wsgi.errors")
        me.content = ContentParse(reader("CONTENT_TYPE"),
                reader("CONTENT_LENGTH"), me._readContent)

    # Apply a decorator to content read method
    def readDecorator(me, advfunc):
        me._contentRead = advfunc(me._contentRead)

    def _readContent(me, length):
        return me._contentRead(length)

    def _writeError(me, data):
        return me._errorIO.write(data)

#
class Rsponse(object):
    pass
