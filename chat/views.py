# Create your views here.
from django.template import RequestContext
from django.shortcuts import render_to_response
from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt

import json
import time 

import tornado.web
from nucleo_tornado.decorator import asynchronous

#######################################################################
#Respuesta en chat en JSON
#######################################################################

class ChatResponseError(HttpResponse) :
    def __init__(self, message) :
        super(ChatResponseError, self).__init__(status=400, content=json.dumps({ 'error' : message }))
class ChatResponse(HttpResponse) :
    def __init__(self, data) :
        super(ChatResponse, self).__init__(content=json.dumps(data))

#######################################################################
#Funciones de SESSION
#Funciona como un arreglo de todos los usuarios que se registran
#Sin embargo no es una sesion que permanece vigente con el usuario
#######################################################################

class Usuario(object):
    SESSIONS = {}
    CUR_ID = 100 
    ID_NEXT = 0
    #Iniciando Sesion
    def __init__(self, nick):
        for i in self.SESSIONS.values():
            if i.nick == nick:
                raise "En uso"
        self.nick = nick
        Usuario.CUR_ID += 1
        self.id = Usuario.CUR_ID
        Usuario.SESSIONS[str(self.id)] = self
    
        self.status = 0
        self.nearid = 0

    def poke(self) :
        pass

    @classmethod
    def who(cls) :
        return [ s.nick for s in Usuario.SESSIONS.values() ]

    @classmethod
    def get(cls, id):
        return Usuario.SESSIONS.get(str(id), None)

    @classmethod
    def remove(cls, id) :
        cambio = False
        if id in cls.SESSIONS :
            del Usuario.SESSIONS[id]
            cambio = True
        return cambio

    #Metodo clave :D para traer ciertos mensajes qe contengan los ID
    @classmethod
    def getUsuario(cls, id):
        for i in Usuario.SESSIONS.values():
            if i.id == id:
                return i.nick

    @classmethod
    def setStatus(cls,id, status):
        for i in Usuario.SESSIONS.values():
            if i.id == id:
                i.status = status

    @classmethod
    def getStatus(cls,id):
        for i in Usuario.SESSIONS.values():
            if i.id == id:
                return i.status

    @classmethod
    def getCountUsuario(cls):
        return len(Usuario.SESSIONS)

    @classmethod
    def setNear(cls, idn, nearid):
        cambio = False
        for i in Usuario.SESSIONS.values():
            if i.id == int(idn):
                i.nearid = nearid
                cambio = True
        return cambio

    @classmethod
    def getNear(cls,id):
        for i in Usuario.SESSIONS.values():
            if i.id == id:
                return i.nearid

#######################################################################
#Funciones Channel
#######################################################################

class Channel(object):
    def __init__(self):
        self._messages = []
        self._callbacks = []

    def message(self, type, nick, text = "", id_nick=0, id_next=0, status =0, nearid=0):
        m = { 'type': type, 
            'timestamp' : int(time.time()), 
            'text' : text, 
            'nick' : nick,
            'id_nick':id_nick,
            'nick_next' : id_next,
            'status': status,
            'nearid': nearid
        }

        for cb in self._callbacks :
            cb([m])
        self._callbacks = []
        #Agregando mensajes
        self._messages.append(m)

    def query(self, cb, since) :
        msgs = [m for m in self._messages if m['timestamp'] > since]
        if msgs :
            return cb(msgs)
        self._callbacks.append(cb)

    def size(self):
        return 1024

    def setNext(self, id, id_next):
        cambio =False
        for m in self._messages:
            if m['id_nick'] == id_next:
                m['nick_next'] = id
                cambio = True
        return cambio

channel = Channel()

#######################################################################
#Funciones principales
#######################################################################

def index(request):
    if 'session-id-usuario' in request.COOKIES:
        return HttpResponseRedirect("salas/")
    else:
        return render_to_response('index_chat.html', context_instance=RequestContext(request))

def salas(request):
    if 'session-id-usuario' in request.COOKIES:
        id_usuario = request.COOKIES['session-id-usuario']
        usuario = request.COOKIES['session-usuario']
        rss = request.COOKIES['session-rss']
        starttime = request.COOKIES['session-starttime']
        cmx = { 'id': id_usuario, 
                'nick': usuario, 
                'rss': rss, 
                'starttime': starttime
                }
        return render_to_response('salas.html', cmx,  context_instance=RequestContext(request))
    else:
        return HttpResponseRedirect('/')

def who(request) :
    return ChatResponse({ 'nicks': Usuario.who(), 'rss' : channel.size() })

@csrf_exempt
def part(request) :
    id = request.POST['id']
    usuario = Usuario.get(id)
    if not usuario :
        return ChatResponseError('session expired')
    channel.message('part', usuario.nick, "", id)
    resp = Usuario.remove(id)
    return ChatResponse({ 'respuesta': resp })

@csrf_exempt
def setNearID(request):
    nearID = request.POST['nearid']
    idn = request.POST['idusu']
    setNe = Usuario.setNear(idn, nearID)
    return ChatResponse({ 'setNear' : setNe })


@csrf_exempt
def send(request) :
    id = request.POST['id']
    id_next = request.POST['id_next']
    usuario = Usuario.get(id)
    if not usuario :
        return ChatResponseError('session expired')
    
    status = Usuario.getStatus(id)

    channel.message('msg', usuario.nick, request.POST['text'], id,id_next, status)

    return ChatResponse({ 'rss' : channel.size() })

@csrf_exempt
def ingresar(request):
    nick = request.POST['usuario']

    if not nick:
        html = "<html><body>Error de nickname</body></html>"
        return HttpResponse(html)

    try:
        usuario = Usuario(nick)
    except Exception, e:
        html = "<html><body>Nick en uso</body></html>"
        return HttpResponse(html)

    #Agregando mensaje al canal
    channel.message('join', nick, "%s entro" % nick, usuario.id)

    #Session Django
    request.COOKIES['session-id-usuario'] = usuario.id
    request.COOKIES['session-usuario'] = usuario.nick
    request.COOKIES['session-rss'] = channel.size()
    request.COOKIES['session-starttime'] = int(time.time())

    cmx = { 
            'id' : usuario.id,
            'nick': usuario.nick,
            'rss': channel.size(), 
            'starttime': int(time.time()),
            'status': usuario.status,
        }

    return render_to_response('salas.html', cmx, context_instance=RequestContext(request))

@csrf_exempt
def sala(request):
    id_ne = int(request.POST['id_next'])
    since = int(request.POST['since'])
    id = int(request.POST['id'])
    nearid = request.POST['nearid']

    if not id:
        html = "<html>Error de ID</html>"
        return HttpResponse(html)

    if Usuario.getCountUsuario()<=1:
        html = "<html>ID no soportado </html>"
        return HttpResponse(html)

    #Poner al usuario enestatus disponible
    Usuario.setStatus(id, 0)
    Usuario.setStatus(id_ne, 0)

    #Buscar los id ya registrados e ir sumando 1
    id_next = id_ne + 1

    existente = Usuario.get(id_next)
    #Se regresa al principio
    if not existente:
        id_next = 101

    #obtener nick char
    usuario = Usuario.getUsuario(id)

    disponible = Usuario.getStatus(id_next)
    if(disponible == 0):
        Usuario.setStatus(id, 1)
        Usuario.setStatus(id_next, 1)
        channel.message('union', usuario, "El %d se unio con %d"%(id,id_next), id, id_next, 1, nearid)
        status = 1
    else:
        channel.message('nounion', usuario, "El %d no se UNIO con %d"%(id,id_next), id, id_next, 0, 0)
        status = 0
    
    cambiodenick = channel.setNext(id, id_next)

    if cambiodenick != True:
        html = "<html>No se cambio el ID </html>"
        return HttpResponse(html)        

    farID = Usuario.getNear(id_next)

    return ChatResponse({
            'id': id,
            'id_next': id_next,
            'rss': channel.size(),
            'starttime': int(time.time()),
            'status': status,
            'farID': farID
        })

@csrf_exempt
@asynchronous
def recv(request, handler):
    response = {}

    if 'since' not in request.POST:
        return ChatResponseError('Supply since parameter')
    if 'id' not in request.POST:
        return ChatResponseError('Supply id parameter')

    id = request.POST['id']
    id_next = request.POST['id_next']
    connUnion = int(request.POST['connectionUnion'])

    usuario = Usuario.get(id)
    if usuario:
        usuario.poke()
    
    since = int(request.POST['since'])

    def on_new_messages(messages):
        #Error
        if handler.request.connection.stream.closed():
            return
        handler.finish({ 'messages': messages, 'rss' : channel.size() })

    channel.query(handler.async_callback(on_new_messages), since)
    

#STATIC FILES
def chatonLoadjs(request):
    return render_to_response('js/chatonLoad.js', context_instance=RequestContext(request))        

def chatCSS(request):
    return HttpResponse(open('chat/templates/css/chat.css'))

def videoIOFla(request):
    #return HttpResponse('fla/VideoIO.swf', mimetype='application/x-shockwave-flash')
    return HttpResponse(open('chat/templates/fla/VideoIO.swf'))
