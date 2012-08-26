from django.conf.urls.defaults import patterns, url

urlpatterns = patterns('index.views', 
        url(r'^$', 'index'),
        url(r'^base.css$','baseCSS'),
        url(r'^tabs.css$','tabsCSS'),
        url(r'^salas.css$','salasCSS'),
        url(r'^commersial_script.ttf$','fuenteTTF'),
        url(r'^tabs.js$','tabsJS'),
        url(r'^jquery-ui-personalized.js$','jquerytabsJS'),
        url(r'^head.gif$','headGIF'),
    )
