//-- Inicialização do Framework7
var myApp = new Framework7({
    'material':                    true,
    'swipePanel':                  'left',
    'modalTitle':                  'Controle financeiro',
    'modalButtonCancel':           'Cancelar',
    'modalPreloaderTitle':         'Carregando...',
    'modalUsernamePlaceholder':    'Usuário',
    'modalPasswordPlaceholder':    'Senha',
    'smartSelectBackText':         'Voltar',
    'smartSelectPopupCloseText':   'Fechar',
    'smartSelectPickerCloseText':  'Pronto',
    'notificationCloseButtonText': 'Fechar',
    'onAjaxStart':                 function(){ myApp.showIndicator();},
    'onAjaxComplete':              function(){ myApp.hideIndicator();},
    'tapHold':                     false
});

window.onerror = function(error,url,line){
    myApp.addNotification({'message': "Erro JS: "+url.split('/').pop()+" ("+line+") Desc: "+error});
};

//-- Exporta manipulação de DOM.
var $$ = Dom7;

//-- Classe responsável pela manutenção do leiaute padrão do aplicativo
function VLKLeiaute()
{
    //-- Instancia da classe
    var lt = this;

    //-- Cache interno da classe
    var cache = {
        'htmlClass': ''
    };

    //-- Templates salvos
    lt.templates = {
        'sidePanelRightEmpty': '' //-- Template de menu lateral sem ações
    };

    //-- Inicializador padrão da classe
    lt.init = function()
    {
        cache.htmlClass = $$('html').attr('class');
        lt.carregarPagina('resumo');
        lt.criarEventos();
    };

    //-- Cria eventos de leiaute
    lt.criarEventos = function()
    {
        //-- Chamada de criação de páginas dinamicas
        $$(document).on('page:init', function (e) {
            var page = e.detail.page;
            switch(page.name) {
                //-- Página de demosntração de recursos do Cordova
                case 'camera':
                break;
                //-- Página de resumo de lançamentos
                case 'resumo':
                var info = {
                    'receber': 0,
                    'pagar': 0,
                    'saldo': 0
                };
                //-- Consulta lançamentos realizados e soma por tipo
                $VLKDatabase.regs('lancamentos',{'query':function(row){
                    if ( row.tipo == 'R' ) {
                        info.receber += toFloat(row.valor);
                    } else {
                        info.pagar += toFloat(row.valor);
                    }
                }});
                //-- Formata valores para visualização
                info.saldo = info.receber-info.pagar;
                info.receber = toDecimal(info.receber,2);
                info.pagar = toDecimal(info.pagar,2);
                info.saldo = (parseFloat(info.saldo) >= 0 ? '' : '-' )+toDecimal(info.saldo,2);
                //-- Compila o template e insere na página carregada.
                $$('.page-content').append($VLKLeiaute.carregarTemplate('script#dadosResumo',info));
                break;
                //-- Tela para efetuar lançamentos
                case 'lancamentos':
                //-- Consulta lançamentos realizados e monta a lista
                var dados = $VLKDatabase.regs('lancamentos',{'sort':[['ID','DESC']]});
                if ( dados.length > 0 ) {
                    //-- Formata valores e exibição
                    dados.forEach(function(lanc){
                        lanc.classe = lanc.tipo == 'R' ? 'up color-green' : 'down color-red';
                        lanc.lancamento = btod(lanc.lancamento);
                        lanc.valor = toDecimal(lanc.valor,2);
                    });
                    $$('.page-content').append($VLKLeiaute.carregarTemplate('script#listaLancamentos',dados));
                } else {
                    $$('.page-content').append('<div class="content-block">Nenhum lançamento efetuado!</div>');
                }
                break;
                default:
            }
            lt.eventosPagina();
        });
    };

    //-- Chama o carregamento de uma página
    lt.carregarPagina = function(pagina,args) {
        // myApp.showIndicator();
        myApp.closePanel();
        var _url = 'views/'+pagina+'.min.html?';
        args = args || {};
        args['_nocache'] = moment().format('X');
        var chaves  = Object.keys(args);
        var lArgs = chaves.length;
        if(lArgs > 0){
            try{
                var valores = Object.values(args);
            }catch(ex){
                //-- Navegadores antigos não tem Object.values, fazer a varredura manualmente
                var valores = [];
                for (var k in args){
                    valores.push(args[k]);
                }
            }
            var arr = [];
            for (var x = 0; x < lArgs;x++) {
                arr.push(chaves[x] + '=' + encodeURIComponent(valores[x]));
            }
            _url += arr.join('&');
        }
        return viewMain.router.loadPage({
            'url': _url,
            'ignoreCache': true
        });
    };

    //-- Carrega uma tela de ajuda
    lt.carregarPopup = function(template,dados,callback)
    {
        dados = dados || {};
        myApp.closePanel();
        myApp.popup(lt.carregarTemplate('script#'+template,dados));
        lt.eventosPagina();
        if(typeof callback !== 'undefined'){
            return callback();
        }
    };

    //-- Prepara eventos comuns em todas as páginas (maioria visual)
    lt.eventosPagina = function()
    {
        var tema = getTemaInfo();
        //-- Controle de temas em acordeões
        $$('.accordion-item').on('accordion:open', function () {
            $$(this).find('.item-link').addClass('bg-'+tema.bg+' '+'color-'+tema.fonte);
        });
        $$('.accordion-item').on('accordion:close', function (e) {
            $$(this).find('.item-link').removeClass('bg-'+tema.bg+' '+'color-'+tema.fonte);
        });
        //-- Controle de temas genéricos
        $$('.bg-padrao').removeClass('bg-padrao').addClass('bg-'+tema.bg);
        $$('.bg-padrao2').removeClass('bg-padrao2').addClass('bg-'+tema.fonte);
        $$('.color-padrao').removeClass('color-padrao').addClass('color-'+tema.fonte);
        $$('.color-padrao2').removeClass('color-padrao2').addClass('color-'+tema.bg);
        //-- Controle de campos requeridos
        $$('.temaRequerido').addClass('color-'+tema.bg);
        //-- Controle de itens removíveis
        $$('.removivel').on('click',function(){
            var $this = $$(this);
            $this.animate({'opacity': 0, 'height': 0}, {'duration': 150} );
            setTimeout(function(){$this.remove();},1000);
        });
        //-- Ajustes de largura de imagens em dispositivos sem suporte para vw
        if(!cssPropertyExists('flex')){
            $$('img.viewport100').css('max-width', (window.screen.width*0.6)+'px');
            $$('img.viewport50').css('max-width', ((window.screen.width*0.6)/2-16)+'px');
        }
        //-- Remove itens de desenvolvimento
        if ($VLKConfig.getParam('producao')) $$('.devonly').remove();

    };

    //-- Carrega e retorna um template7
    lt.carregarTemplate = function(el,dados){
        dados = dados === undefined ? false : dados;
        //-- Recupera dados de temas do usuário
        var tema = getTemaInfo();
        dados['tema'] = tema.bg;
        dados['tema_fonte'] = tema.fonte;
        //-- Caso seja um template estático não interpreta, apenas retorna
        if (el.substr(0,2) == '__') {
            if(lt.templates[el] === undefined || dados !== false){
                lt.templates[el] = dados;
            }
            return lt.templates[el];
        }
        //-- Verifica se tem cache para o template informado
        if(lt.templates[el] === undefined){
            lt.templates[el] = Template7.compile($$(el).html());
        }
        //-- Retorna o template traduzido
        return dados ? lt.templates[el](dados) : lt.templates[el];
    };

    //-- Carrega um dado tema
    lt.carregarTema = function(tema)
    {
        $$('html').attr('class',cache.htmlClass + ' theme-'+tema);
    };

    //-- Ajusta o tamanho dos itens de galeria
    lt.tamanhoItensGaleria = function(tamanho)
    {
        $$('.galeria-item-sm').removeClass('galeria-item-sm').addClass('galeria-item-'+tamanho);
        $$('.galeria-item-md').removeClass('galeria-item-md').addClass('galeria-item-'+tamanho);
        $$('.galeria-item-lg').removeClass('galeria-item-lg').addClass('galeria-item-'+tamanho);
        if(tamanho != 'sm'){
            $$('.dock-badge-sm').removeClass('dock-badge-sm').addClass('dock-badge-lg');
        } else {
            $$('.dock-badge-lg').removeClass('dock-badge-lg').addClass('dock-badge-sm');
        }
    };

    //-- Abre uma ou mais imagens em um slideshow
    lt.browserImagens = function(imgs,options)
    {
        var optPadrao = {'photos': imgs, 'theme': 'dark', 'type': 'standalone', 'backLinkText': 'Fechar'};
        return myApp.photoBrowser(Object.assign(optPadrao, options || {}));
    };

    //-- Inicializador padrão da classe
    lt.init();
}

//-- Classe responsável por manter as configurações pertinentes ao aplicativo (login usuário pode ser inserido aqui)
function VLKConfig()
{
    //-- Instância da classe
    var cf = this;

    //-- Parâmetros do aplicativo
    var params = {
        //-- Indica se é ambiente de produção
        'producao': false,
        //-- Indica versão do aplicativo
        'versao': '1.0.0',
        //-- Indica o nome do aplicativo
        'appName': 'Controle financeiro',
        //-- Indica tema padrão
        'temaPadrao': 'teal',
        //-- Força tipo de conexão (on = Ativo, off = Inativo, auto = Deixar o aplicativo identificar)
        'forceConnection': 'auto'
    };

    //-- Retorna uma configuração do sistema
    cf.getParam = function(param)
    {
        return params[param] !== undefined ? params[param] : null;
    };

    //-- Define um parâmetro
    cf.setParam = function(param,valor)
    {
        if(params[param] !== undefined){
            params[param] = valor;
        }
    };

    cf.paginaSobre = function()
    {
        return $VLKLeiaute.carregarPopup('sobre',{'aplicativo': params.appName, 'versao': params.versao});
    };

}


//-- Classe responsável por realizar chamadas de recursos do cordova
function VLKCordova()
{

    var sc = this;

    //-- Funções pertinentes à localização
    sc.Localizacao = {
        //-- Captura dados de coordenadas pelo GPS
        'capturarCoordenadas': function(cbSuccess,cbError,options){
            var optPadrao = {
                'maximumAge': 3000,
                'timeout': 5000,
                'enableHighAccuracy': true
            };
            options = options || {};
            cbError = cbError || function(error) { myApp.addNotification({'message': 'Falha na consulta: '+sc.Localizacao.traduzErroCaptura(error.code),'hold': HOLD_ALERTA})};
            navigator.geolocation.getCurrentPosition(cbSuccess, cbError,Object.assign(optPadrao,options));
        },
        //-- Retorna a interpretação do código de erro
        'traduzErroCaptura': function(codigo){
            switch (codigo){
                case 1:  return 'Permissão negada!';
                case 2:  return 'Posição indisponível!';
                case 3:  return 'Tempo de consulta esgotado';
                default: return 'Desconhecido';
            }
        }
    };

    //-- Funções pertinentes à chamadas de câmera
    sc.Camera = {
        //-- Captura uma imagem e retorna o caminho temporário gerado.
        'capturarImagem': function(cbSuccess,cbError,options){
            var optPadrao = {'destinationType': Camera.DestinationType.FILE_URI, 'quality': 50,'torchOn': false};
            options = options || {};
            cbError = cbError || function(msg) { myApp.addNotification({'message': 'Falha na captura: '+sc.Camera.traduzErroCaptura(msg)+'.','hold': HOLD_ALERTA})};
            navigator.camera.getPicture(cbSuccess, cbError, Object.assign(optPadrao,options));
        },
        //-- Traduz erro de capura
        'traduzErroCaptura': function(msg){
            switch(msg){
                case 'Camera cancelled.':
                case 'Selection cancelled.':
                return 'Cancelado';
                break;
                case 'Unable to write to file':
                return 'Falha ao gravar arquivo';
                break;
                case 'Can\'t write to external media storage.':
                return 'Não foi possível gravar no armazenamento externo.';
                break;
                case 'Can\'t write to internal media storage.':
                return 'Não foi possível gravar no armazenamento interno.';
                break;
                case 'Did not complete!':
                case 'Error capturing image.':
                case 'Selection did not complete!':
                default:
                return 'Não foi possível completar a captura';
            }
        },
        //-- Caputura uma leitura de código de barras
        'capturarCodBarras': function(cbSuccess,cbError,options){
            var optPadrao = {
                preferFrontCamera : false, // iOS and Android
                showFlipCameraButton : true, // iOS and Android
                showTorchButton : true, // iOS and Android
                torchOn: true, // Android, launch with the torch switched on (if available)
                prompt : "Posicione o código de barras dentro da área do scanner!", // Android
                resultDisplayDuration: 500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
                formats : "QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
            };
            options = options || {};
            cbError = cbError || function(msg) { myApp.addNotification({'message': 'Falha na leitura: '+msg})};
            cordova.plugins.barcodeScanner.scan(cbSuccess,cbError,Object.assign(optPadrao,options));
        },
    };

    //-- Funções de interação com arquivos do dispositivo
    sc.Arquivo = {
        //-- Realiza chamada de upload de arquivo
        'uploadArquivo': function(arquivo,options,onSuccess,onError){
            onSuccess = onSuccess || function (r) {
                myApp.addNotification({'message': "Code = " + r.responseCode});
                myApp.addNotification({'message': "Response = " + r.response});
                myApp.addNotification({'message': "Sent = " + r.bytesSent});
            };
            onError = onError || function (error) {
                myApp.Alert("An error has occurred: Code = " + error.code);
                myApp.addNotification({'message': "upload error source " + error.source});
                myApp.addNotification({'message': "upload error target " + error.target});
            };
            options = options || {};
            var optPadrao = new FileUploadOptions('file');
            optPadrao.fileName = arquivo.substr(arquivo.lastIndexOf('/') + 1);
            optPadrao.mimeType = "image/jpeg";
            optPadrao.params = {};
            optPadrao.headers = {'key': $VLKConfig.sync.getToken().key, 'apiversion': $VLKConfig.getParam('versaoAPI')};
            var ft = new FileTransfer();
            return ft.upload(arquivo, encodeURI($VLKConfig.getParam('syncUrl') + 'index.php?oper=uploadDados'), onSuccess, onError, Object.assign(optPadrao,options));
        },
        //-- Realiza chamada de remoção de arquivo
        'removerArquivo': function(arquivo,onSuccess,onError){
            onError = onError || function(error,origin){
                if(!$VLKConfig.getParam('producao')){
                    myApp.addNotification({'message': 'Erro ao realizar download da imagem: '+error.code,'hold': HOLD_ERRO});
                }
            };
            onSuccess = onSuccess || function(){};
            return window.resolveLocalFileSystemURL(arquivo, function(fs){
                fs.remove(function (file) {
                    if(!$VLKConfig.getParam('producao')){
                        myApp.addNotification({'message': 'Arquivo removido com sucesso: '+arquivo, 'hold': HOLD_ALERTA});
                    }
                    return onSuccess();
                }, function(error){ return onError(error);});
            }, function(error){ return onError(error);});
        },
        //-- Realiza a leitura de uma dada pasta retornando JSON com lista de arquivos.
        'lerDiretorio': function (path,onSuccess,onError){
            onError = onError || function(error,origin){
                if (!$VLKConfig.getParam('producao')){
                    myApp.addNotification({'message': 'Erro: '+origin+'('+error.code+'): '});
                }
            };
            onSuccess = onSuccess || function(arquivos){return arquivos;};
            window.resolveLocalFileSystemURL(path,
                function (fileSystem) {
                    var reader = fileSystem.createReader();
                    reader.readEntries(onSuccess,function(error){return onError(error,'fileSystem');});
                }, function(error){return onError(error,'resolveLocalFileSystemURL');}
                );
        },
        //-- Gravar arquivo
        'download': function(url,destino,cSuccess, cError) {
            //-- cSuccess - entry.toURL() recupera o caminho até o arquivo criado
            return new FileTransfer().download(encodeURI(url), destino, cSuccess, cError, true, {});
        },
        'apagarDiretorio': function(url,cSuccess,cError) {

            cError = function(error){
                var msg = error.code;
                switch(error.code) {
                    case  1: msg = 'Diretório não encontrado!'; break;
                    case  2: msg = 'Permissão negada!'; break;
                    case  3: msg = 'Abortado!'; break;
                    case  4: msg = 'Não foi possível realizar leitura!'; break;
                    case  5: msg = 'Erro de codificação!'; break;
                    case  6: msg = 'Não é permitido realizar modificações!'; break;
                    case  7: msg = 'Estado inválido!'; break;
                    case  8: msg = 'Erro de sintaxe!'; break;
                    case  9: msg = 'Modificação inválida!'; break;
                    case 10: msg = 'Quota excedida!'; break;
                    case 11: msg = 'Tipos incorretos!'; break;
                    case 12: msg = 'Caminho não existe!'; break;
                }
                if(!$VLKConfig.getParam('producao')){
                    myApp.addNotification({'message': 'Ocorreu um erro ao apagar o diretório informado: '+msg, 'hold': HOLD_ERRO});
                }
            };
            cSuccess = function(fs) {
                if ( fs.isDirectory ) {
                    fs.removeRecursively(function (file) {
                        if(!$VLKConfig.getParam('producao')){
                            myApp.addNotification({'message': 'Diretório '+fs.name+' removido com sucesso!', 'hold': HOLD_ALERTA});
                        }
                    }, cError);
                }
            };
            return window.resolveLocalFileSystemURL(url, cSuccess, cError);
        }
    };

    //-- Retorna informações do dispositivo
    sc.Dispositivo = {
        'getInfo': function(info){
            if(typeof device !== 'undefined'){
                return info === undefined ? device : (device[info] === undefined ? false : device[info]);
            } else {
                return undefined;
            }
        }
    };

}



//-- Classe responsável pela interação com banco de dados interno da aplicação
function VLKDatabase()
{
    //-- Instância da classe
    var db = this;

    //-- Configurações da classe VLKDatabase
    var config = {
        'permitirInclusaoAlteracao': true,
        'resetOnInit': false,
        'dbname': 'vlkcontrolefinanceiro'
    };

    //-- Instância da classe de abstração de SGBD com localStorage
    var lsdb = new localStorageDB(config.dbname,localStorage);

    //-- Definição de schema do banco de dados
    var schema = {
        //-- Campos de controle
        '__controle': {
            'ID'          : {'tipo' : 'autoincrement', 'valor_padrao': '',                      'validacao': '', 'requerido': false},
            'app_cri'     : {'tipo' : 'datetime',      'valor_padrao': 'v::datetime',           'validacao': '', 'requerido': false},
            'app_alt'     : {'tipo' : 'datetime',      'valor_padrao': 'v::datetime',           'validacao': '', 'requerido': false},
        },
        //-- Tabela de produtos
        'lancamentos': {
            'descricao'   : {'tipo' : 'str', 'valor_padrao': '', 'validacao': '', 'requerido': true},
            'valor'       : {'tipo' : 'float', 'valor_padrao': '', 'validacao': '', 'requerido': true},
            'tipo'        : {'tipo' : 'str', 'valor_padrao': 'R', 'validacao': '', 'requerido': true},
            'lancamento'  : {'tipo' : 'str', 'valor_padrao': 'v::date', 'validacao': '', 'requerido': true},
        },
        //-- Valida se um item do schema é numérico
        '__isNumber': function(tabela,campo){
            switch(schema[tabela][campo].tipo){
                case 'int':
                case 'float':
                case 'autoincrement':
                return true;
                break;
                default:
                return false;
            }
        },
        //-- Valida e retorna o valor padrão de um dado campo
        '__valorPadrao': function(tabela,campo){
            var valor;
            if (schema[tabela][campo].valor_padrao !== '') {
                //-- Existe valor padrão preenchido, interpreta se tem função
                var func = schema[tabela][campo].valor_padrao.substr(0,3) == 'v::' ? schema[tabela][campo].valor_padrao.substr(3) : schema[tabela][campo].valor_padrao;
                var funcAbr = func;
                var funcArg = '';
                if(func.indexOf('(') !== -1 ){
                    var strIni = func.indexOf('(');
                    var strFim = func.indexOf(')');
                    funcAbr = func.substr(0,strIni);
                    funcArg = func.substr(strIni+1,strFim-strIni-1);
                }
                switch(funcAbr){
                    //-- Datetime corrente
                    case 'datetime':
                    valor = new Date().getTime();
                    break;
                    case 'datahora':
                    valor = moment().format('YYYY-MM-DD HH:mm');
                    break;
                    case 'date':
                    valor = moment().format('YYYY-MM-DD');
                    break;
                    case 'hour':
                    valor = moment().format('HH:mm');
                    break;
                    //-- Função não desenvolvida ou é valor fixo.
                    default:
                    if (schema.__isNumber(tabela,campo)) {
                        if(schema[tabela][campo].tipo == 'int' || schema[tabela][campo].tipo == 'autoincrement'){
                            valor = parseInt(func);
                        } else if(schema[tabela][campo] == 'float') {
                            valor = parseFloat(func);
                        }
                    } else {
                        valor = func;
                    }
                    break;
                }
            } else {
                //-- Não existe valor padrão preenchido, preenche de acordo com o tipo de campo
                valor = schema.__isNumber(tabela,campo) ? 0 : '';
            }
            return valor;
        },
        //-- Retorna array de campos da tabela
        '__getFields': function(tabela){
            return [].concat(Object.keys(schema.__controle),Object.keys(schema[tabela]));
        }
    };

    //-- Localiza e remove registros (antigos) duplicados, mantendo os mais atualizados
    db.removerDuplicados = function(tabela,camposID,valores)
    {
        var regs = db.regs(tabela,{'query': function(row){
            var tof = true;
            for (var x in camposID){
                tof = tof && row[camposID[x]] == valores[x];
            }
            return tof;
        }, 'sort': [['app_alt','ASC']]});
        if(regs.length > 1){
            regs.pop();
            regs.forEach(function(reg){
                db.delete(tabela,reg.ID);
            });
        }
    };

    //-- Cria um novo objeto de acordo com a definição de schema
    db.novoObj = function(tabela)
    {
        if(schema[tabela]){
            var obj = {};
            for (var campo in schema[tabela]){
                obj[campo] = schema.__valorPadrao(tabela,campo);
            }
            return obj;
        } else {
            return false;
        }
    };

    //-- Valida um objeto de acordo com a definição de schema
    db.validarObj = function(tabela,obj,oper)
    {
        oper = oper || 'I';
        var valido = obj !== undefined;
        var erros = [];
        //-- Validar os valores inputados
        //-- Tudo está correto, alimentar os campos de controle
        if(valido){
            //-- Tratamento de campos de controle
            switch (oper) {
                //-- Inclusão, adiciona os campos
                case 'I':
                for (var campo in schema['__controle']){
                    if(obj[campo] === undefined)
                        obj[campo] = schema.__valorPadrao('__controle',campo);
                }
                break;
                //-- Alteração, alimenta o horário de atualização
                case 'A':
                obj.app_alt = schema.__valorPadrao('__controle','app_alt');
                break;
                //-- Atualiza o horário de sincronização do registro.
                case 'S':
                obj.app_syn = schema.__valorPadrao('__controle','app_alt');
                break;
            }
        } else {
            erros.push('Objeto recebido é nulo!');
        }
        return valido ? obj : {'erros': erros};
    };

    //-- Insere um registro no banco de dados
    db.insert = function(tabela,obj)
    {
        if (config.permitirInclusaoAlteracao) {
            //-- Valida o objeto
            obj = db.validarObj(tabela,obj,'I');
            //-- Campo ID criado,
            if(obj.erros === undefined){
                //-- Faz a inclusão no banco
                obj.ID = lsdb.insert(tabela,obj);
                //-- Valida a inclusão no banco
                if(obj.ID !== undefined){
                    lsdb.commit();
                    return obj;
                } else {
                    return {'erros': ['Falha ao incluir registro no banco de dados']};
                }
            } else {
                return obj;
            }
        } else {
            return {'erros': 'Banco de dados cheio!'};
        }
    };

    //-- Atualiza um registro no banco de dados
    db.update = function(tabela,obj)
    {
        if (config.permitirInclusaoAlteracao) {
            //-- Valida o objeto
            obj = db.validarObj(tabela,obj,'A');
            if (obj.erros === undefined && obj.ID !== undefined){
                //-- Faz a chamada no banco
                var res = lsdb.update(tabela,{'ID':obj.ID},function(row){ row = obj; return row;});
                if (res !== undefined && res > 0){
                    lsdb.commit();
                    return true;
                } else {
                    return false;
                }
            }
        }
        return false;
    };

    //-- Realiza um update manual (bloco)
    db.updateFunc = function(tabela,funcaoSelect,obj)
    {
        if (config.permitirInclusaoAlteracao) {
            //-- Valida o objeto
            obj = db.validarObj(tabela,obj,'A');
            if (obj.erros === undefined){
                //-- Faz a chamada no banco
                var res = lsdb.update(tabela,funcaoSelect,function(row){
                    for (var campo in obj){
                        if(campo !== 'ID' && row[campo] !== undefined){
                            row[campo] = obj[campo];
                        }
                    }
                    return row;
                });
                if (res !== undefined && res > 0){
                    lsdb.commit();
                    return true;
                } else {
                    return false;
                }
            }
        }
        return false;
    };

    //-- Apaga um registro no banco de dados por um dado ID
    db.delete = function(tabela,id)
    {
        //-- Faz a chamada no banco
        var res = lsdb.deleteRows(tabela,{'ID': id});
        if (res !== undefined){
            lsdb.commit();
            config.permitirInclusaoAlteracao = db.getDBSize();
            return true;
        } else {
            return false;
        }
    };

    //-- Apaga um ou mais registros dado uma consulta
    db.deleteWhere = function(tabela, where)
    {
        var res = lsdb.deleteRows(tabela,where);
        if (res !== undefined){
            lsdb.commit();
            config.permitirInclusaoAlteracao = db.getDBSize();
            return true;
        } else {
            return false;
        }
    };

    //-- Faz o truncate de uma tabela
    db.truncate = function(tabela)
    {
        lsdb.truncate(tabela);
        lsdb.commit();
    };

    //-- Retorna um conjunto de registros
    db.regs = function(tabela,options)
    {
        options = options || {};
        return lsdb.queryAll(tabela,options);
    };

    //-- Retorna o último ID
    db.ultimoIdTabela = function(tabela)
    {
        if ( lsdb.tableExists(tabela) ) {
            var info = JSON.parse(lsdb.serialize());
            return info.tables[tabela].auto_increment - 1;
        }
        return 0;
    };

    //-- Construtor da classe
    db.init = function()
    {
        if(!window.localStorage){
            return myApp.addNotification({'message':'Dispositivo incompatível!','hold':HOLD_ERRO});
        }
        config.permitirInclusaoAlteracao = db.getDBSize();
        if (config.resetOnInit ){
            lsdb.drop();
            lsdb = new localStorageDB(config.dbname, localStorage);
        }

        db.corrigirIntegridade();
    };

    //-- Verifica e corrige integridade da base de dados
    db.corrigirIntegridade = function()
    {
        var tabelasValidas = [];
        for (var tabela in schema) {
           if(tabela.substr(0,2) !== '__' && !lsdb.tableExists(tabela)){
            tabelasValidas.push(tabela);
            lsdb.createTable(tabela,schema.__getFields(tabela));
        } else if (tabela.substr(0,2) !== '__') {
            tabelasValidas.push(tabela);
            var camSchema = schema.__getFields(tabela).sort();
                //-- Verifica campos novos
                camSchema.forEach(function(campo){
                    if(!lsdb.columnExists(tabela,campo)){
                        lsdb.alterTable(tabela,campo);
                    }
                });
                //-- @TODO: Dropar colunas extras
            }
        }
        //-- Remove tabelas inexistentes no schema
        db.getTables().forEach(function(tabela){
            if(tabelasValidas.indexOf(tabela) === -1){
                lsdb.dropTable(tabela);
            }
        });
        //-- Efetiva modificações
        lsdb.commit();
    };

    //-- Retorna uma lista de tabelas
    db.getTables = function()
    {
        var obj = JSON.parse(lsdb.serialize());
        return Object.keys(obj.tables);
    };

    //-- Retorna a instância do banco de dados.
    db.getInstance = function()
    {
        return lsdb;
    };

    //-- Consulta tamanho utilizado do banco de dados
    db.getDBSize = function()
    {
        var mxLen = 5000000;
        var dbLen = localStorage.getItem('db_'+config.dbname).length;
        return dbLen < mxLen;
    };

    //-- Retorna uma configuração da classe
    db.getConfig = function(param)
    {
        return config[param] === undefined ? null : config[param];
    };

    //-- Reseta o banco de dados
    db.reset = function(full)
    {
        full = full || false;
        if(full){
            lsdb.drop();
            lsdb = new localStorageDB(config.dbname, localStorage);
            for (var tabela in schema) {
                if(tabela.substr(0,2) !== '__'){
                    lsdb.createTable(tabela,schema.__getFields(tabela));
                }
            }
        } else {
            for (var tabela in schema) {
                if(tabela.substr(0,2) !== '__' && tabela !== 'usuarios'){
                    db.truncate(tabela);
                }
            }
        }
        myApp.addNotification({'message': 'Reset finalizado','hold':HOLD_INFORMACAO});
    };

    //-- Recupera a lista de campos de controle
    db.getCamposControle = function()
    {
        return Object.keys(schema.__controle);
    };

    //-- Inicializador padrão
    db.init();

}


//-- Instancia view Principal
var viewMain = myApp.addView('.view-main', {});
var $VLKDatabase = new VLKDatabase();
var $VLKConfig   = new VLKConfig();
var $VLKLeiaute  = new VLKLeiaute();
var $VLKCordova  = new VLKCordova();


//-- Escuta chamada de dispositivo pronto do Cordova
$$(document).on('deviceready', function() {
    $VLKLeiaute.init();
    //-- Quando em desenvolvimento exibe o status da conexão para certificar que tudo carregou corretamente.
    if (!$VLKConfig.getParam('producao')){
        myApp.addNotification({ 'message': 'Conexão: '+ checkConnection(true), 'hold': HOLD_INFORMACAO });
    }
});

