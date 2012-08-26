from django.template import RequestContext
from django.shortcuts import render_to_response
from django.http import HttpResponse, HttpResponseRedirect

def index(request):
    return render_to_response('index.html', context_instance = RequestContext(request))

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

def headGIF(request):
    return HttpResponse(open('index/templates/img/head.gif'))
    
