from django.conf.urls.defaults import patterns,url

urlpatterns = patterns('chat.views',
    url(r'^chat$', 'index'),
    url(r'^chatonLoad.js$','chatonLoadjs'),
    url(r'^chat.css$','chatCSS'),
    url(r'^VideoIO.swf$','videoIOFla'),
    url(r'^ingresar/', 'ingresar'),
    url(r'^salas/', 'salas'),
    url(r'^recv/', 'recv'),
    url(r'^who/', 'who'),
    url(r'^setNearID/', 'setNearID'),
    url(r'^send/', 'send'),
    url(r'^part/', 'part'),
    url(r'^sala/','sala'),
    #url(r'^receta/(?P<id_receta>\d+)$','principal.views.detalle_receta'),
)
