//-- Definição de constantes:
var HOLD_INFORMACAO = 2000;
var HOLD_ALERTA = 3000;
var HOLD_AVISO = 4000;
var HOLD_ERRO = 5000;

//-- Função para recuperar uma URL de google MAPS.
function getGoogleMapsUrl(endereco)
{
    if (endereco === undefined || endereco.trim() === '') return '';
    return 'https://maps.google.com/?q='+encodeURIComponent(endereco);
}

//-- Função para recuperar uma URL do google maps com base em coordenadas
function getGoogleMapsUrlGeo(latitude,longitude)
{
    return 'https://www.google.com/maps/embed/v1/place?ll='+latitude+','+longitude;
}

//-- Função para recuperar uma URL do google maps de rota entre dois pontos
function getGoogleMapsUrlGeoRoute(source,destination)
{
    return 'https://maps.google.com/maps?saddr='+source+'&daddr='+destination;
}

//-- Converte um número para float
function toFloat(number)
{
    number = ('0'+number).match(/(\d|,|\.)/g).join('');;
    if(number.indexOf(',') >= 0){
        return parseFloat((number+'').replace(/\./g,'').replace(',','.'))
    } else {
        return parseFloat(number);
    }
}

//-- Converte um número para inteiro
function toInt(number)
{
    return parseInt(toDecimal('0'+number,0));
}

//-- Converte um numero para String decimal
function toDecimal(number,decimais)
{
    if(decimais > 0){
        number = toFloat(number);
        return toFloat(number).toFixed(decimais || 2).replace('.',',');
    } else {
        return parseInt(toFloat(number).toFixed(0))+'';
    }
}

//-- Formata uma data YYYY-MM-DD para DD/MM/YYYY
function btod(data)
{
    return data.split('-').reverse().join('/');
}

//-- Formata uma data YYYY-MM-DD HH:mm:ss para DD/MM/YYYY HH:mm:ss
function btodh(data)
{
    data = data || '';
    var tmp = data.split(' ');
    tmp[0] = btod(tmp[0]);
    return tmp.join(' ');
}

//-- Formata uma data DD/MM/YYYY para YYYY-MM-DD
function dtob(data)
{
    return data.split('/').reverse().join('-');
}

//-- Retorna um Parse de string json ou um valor padrão definido
function parseJson(str,std)
{
    try {
        var ret = JSON.parse(str);
    } catch(ex) {
        var ret = std !== undefined ? std : {};
    }
    return ret;
}

//-- Trata valores
function sanitize(valor,tipo)
{
    valor = valor || '';
    switch(tipo){
        case 'telefone':
        valor = typeof(valor) === 'string' ? valor : valor.toString();
        valor = valor.replace(/\W/g,'');
        break;
    }
    return valor;
}

//-- Retorna propriedades de tema do usuário corrente
function getTemaInfo()
{
    return {'bg': 'blue', 'fonte': 'white'};
}

//-- Funções que precisam do cordova inicializado
if(cordova !== undefined)
{

    //-- Verifica a conexão, se passado primeiro parametro true, retornara o tipo de conexão
    function checkConnection(tipo)
    {
        tipo = tipo || false;
        //-- Força validação de conexão para um tipo definido
        var validacao = $VLKConfig.getParam('forceConnection');
        if(validacao != 'auto'){
            if(tipo !== false){
                return validacao == 'on' ? 'Conectado' : 'Desconectado';
            }
            return validacao == 'on';
        }
        //-- Verifica se é possível recuperar dados de conexão
        if(navigator.connection === undefined){
            return tipo ? 'Desconhecido' : false;
        }
        //-- Valida o tipo de conexão
        var networkState = navigator.connection.type;
        var states = {};
        states[Connection.UNKNOWN]  = 'Desconhecido';
        states[Connection.ETHERNET] = 'Ethernet';
        states[Connection.WIFI]     = 'WiFi';
        states[Connection.CELL_2G]  = '2G';
        states[Connection.CELL_3G]  = '3G';
        states[Connection.CELL_4G]  = '4G';
        states[Connection.CELL]     = 'Edge';
        states[Connection.NONE]     = 'Sem conexão';
        return tipo ? states[networkState] : networkState !== Connection.NONE;
    }

}

//-- Funções de compatibilidade
if (!Object.assign) {
    Object.defineProperty(Object, 'assign', {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function(target) {
            'use strict';
            if (target === undefined || target === null) {
                throw new TypeError('Cannot convert first argument to object');
            }

            var to = Object(target);
            for (var i = 1; i < arguments.length; i++) {
                var nextSource = arguments[i];
                if (nextSource === undefined || nextSource === null) {
                    continue;
                }
                nextSource = Object(nextSource);

                var keysArray = Object.keys(Object(nextSource));
                for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
                    var nextKey = keysArray[nextIndex];
                    var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                    if (desc !== undefined && desc.enumerable) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
            return to;
        }
    });
}

//-- Cria ação de pesquisa, oculta elementos com a classe: .searchable e procura o termo contido na classe: .searchstring
function pesquisaPadrao(obj)
{
    $$(obj).on('keyup',function(){
        var termo = this.value.trim().toLowerCase();
        var $lista = $$('.searchable');
        if($lista.length == 0){
            return;
        }
        if(termo === ''){
            return $lista.show();
        }
        $lista.hide();
        $lista.each(function(){
            var $this = $$(this);
            var valorPesquisa = $this.find('.searchstring').html().toLowerCase();
            if(valorPesquisa.indexOf(termo) !== -1) {
                $this.show();
            }
        });
    });
}

//-- Retorna um print de uma variável JSON em formato "human-readable"
function debugJson(json,espacos)
{
    espacos = espacos === undefined ? 4 : espacos;
    if(json === undefined){
        json = {};
    }
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, espacos);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return '<pre>'+json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    })+'</pre>';
}

//-- Define uma barra de progresso como erro
function pbarToError($el,msg)
{
    $el.removeClass('progressbar').removeClass('progressbar-infinite').addClass('progressbar').addClass('color-red');
    if(typeof msg !== 'undefined'){
        myApp.addNotification({'message': msg, 'hold': HOLD_ERRO});
    }
    return myApp.setProgressbar($el,100,1000);
}

//-- Define uma barra de progresso como infinito
function pbarToInfinite($el)
{
    return $el.removeClass('color-red').removeClass('progressbar').addClass('progressbar-infinite');
}

//-- Define uma barra de progresso como sucesso
function pbarToSuccess($el)
{
    $el.removeClass('color-red').removeClass('progressbar').removeClass('progressbar-infinite').addClass('progressbar');
    return myApp.setProgressbar($el,100,1000);
}

//-- Verifica se uma propriedade CSS existe
function cssPropertyExists(property)
{
    return property in document.body.style;
}

//-- Retorna um parametro
function getParametro(parametro, valor)
{
    var par = $VLKDatabase.reg('parametros', {'query': function(row){ return row.parametro == parametro; }});
    if ( typeof par !== 'undefined' ) {
        return par.valor;
    }
    return typeof valor === undefined ? '' : valor;
}

//-- Facilitador de chamadas de que necessitam de conexão com internet
function conectado(cSucesso,cErro)
{
    if(checkConnection()) {
        cSucesso = cSucesso || function() { myApp.alert('Conectado!'); };
        return cSucesso();
    } else {
        cErro = cErro || function() {  };
        return cErro();
    }
}


//-- Retorna o contexto da página
function pageCtx(obj)
{
    obj = obj || false;
    var sel = '.page[data-page="'+$$('.view-main').data('page')+'"] .page-content';
    return obj ? $$(sel).eq(0) : sel;
}


function novoLancamento(obj){
    obj = $$(obj).parents('.picker-modal.lancamento');
    var lanc = $VLKDatabase.novoObj('lancamentos');
    lanc.valor = toFloat(obj.find('#valor').val());
    lanc.tipo = obj.find('#tipo').hasClass('fa-thumbs-o-up') ? 'R' : 'P';
    lanc.descricao = obj.find('#descricao').val();
    console.log(obj,lanc);
    if ( lanc.valor > 0 ) {
        $VLKDatabase.insert('lancamentos',lanc);
        obj.find('#valor').val('0');
        obj.find('#tipo').removeClass('fa-thumbs-o-down').addClass('fa-thumbs-o-up');
        myApp.closeModal('.picker-modal.lancamento');
        $VLKLeiaute.carregarPagina('lancamentos');
    } else {
        myApp.alert('Valor deve ser maior que 0!');
    }
}


function demoCamera()
{
    $VLKCordova.Camera.capturarImagem(function(imagem){
        pageCtx(true).find('img.viewport100').attr('src',imagem);
    });
}

function demoCodBarras()
{
    $VLKCordova.Camera.capturarCodBarras(function(ret){
        myApp.alert('Cód Barras: '+ret.text);
    });
}

function demoGPS()
{
    myApp.showIndicator();
    $VLKCordova.Localizacao.capturarCoordenadas(function(posicao ) {
        myApp.alert('Coordenadas: '+posicao.coords.latitude+','+posicao.coords.longitude);
        myApp.hideIndicator();
    },function(){
        myApp.hideIndicator();
        myApp.alert('Falha na captura de GPS');
    });
}
