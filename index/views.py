from django.template import RequestContext
from django.shortcuts import render_to_response
from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import EmailMessage

def index(request):
    return render_to_response('index.html', context_instance = RequestContext(request))

def acerca(request):
    return render_to_response('acerca.html', context_instance = RequestContext(request))    

@csrf_exempt
def contacto(request):
    info_enviado = False
    nombre = ''
    email = ''
    web = ''
    asunto = ''
    mensaje = ''
    if request.method == "POST":
        info_enviado = True
        nombre = request.POST['nombre']
        email = request.POST['email']
        web = request.POST['web']
        asunto = request.POST['asunto']
        mensaje = request.POST['mensaje']
        titulo = 'Mensaje enviado desde fanfeando'
        contenido = "Autor: "+nombre+"\n"
        contenido += "Email: "+email+"\n"
        contenido += "web: "+ web + "\n"
        contenido += "Asunto: "+asunto+"\n"
        contenido += "Mensaje: " + mensaje + "\n"
        correo = EmailMessage(titulo, contenido, to=['arensiatik@hotmail.com'])
        correo.send()
        
    else:
        info_enviado = False
    cmx = {
        'info_enviado': info_enviado,
    }
    return render_to_response('contacto.html', cmx, context_instance = RequestContext(request))    

#Manejo de STATIC FILES
def baseCSS(request):
    #return render_to_response('css/base.css', context_instance=RequestContext(request))   
    return HttpResponse(open('index/templates/css/base.css'))

def tabsCSS(request):
    return HttpResponse(open('index/templates/css/tabs.css'))

def salasCSS(request):
    return HttpResponse(open('index/templates/css/salas.css'))

def tabsJS(request):
    #return render_to_response('js/tabs.js', context_instance=RequestContext(request))   
    return HttpResponse(open('index/templates/js/tabs.js'))

def jquerytabsJS(request):
    #return render_to_response('js/jquery-ui-personalized-1.5.2.packed.js', context_instance=RequestContext(request))   
    return HttpResponse(open('index/templates/js/jquery-ui-personalized-1.5.2.packed.js'))
    
def fuenteTTF(request):
    return HttpResponse(open('index/templates/css/commersial_script.ttf'))

def headGIF(request):
    return HttpResponse(open('index/templates/img/head.gif'))
    
