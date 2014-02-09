

/*  Controllers
 *
 *  These are the 'glue' between models and views.
 *  See: http://docs.angularjs.org/guide/dev_guide.mvc.understanding_controller
 *  
 *  Controllers are responsible for state, setting navigation, substate, etc.
*/


app.controller('ModelViewer', function($scope, $stateParams, $location) {
    // style active tab
    var tab = $location.path().split('/')[2];
    $('.mv-tabs li').removeClass('active');
    $('.'+tab+'-tab').addClass('active');


    var q_string = $location.search();

    // set selected workspace.
    // this is only used for the objtable tab right now
    //$scope.selected_ws = q_string.selected_ws;
    //$scope.selected_ws = q_string.selected_ws ? q_string.selected_ws :
    //                    $stateParams.selected_ws;
    $scope.selected_ws = q_string.selected_ws ? q_string.selected_ws : false;


    // set workspaces and ids.
    $scope.ws_param = q_string.ws;
    $scope.ids_param = q_string.ids;
    $scope.ws = q_string.ws ? q_string.ws.split('+') : '';
    $scope.ids = q_string.ids ? q_string.ids.split('+') : '';

    // show tabs if there are objects selected
    if ($scope.ids.length > 0) {
        $('.core-tab').removeClass('hide');
        $('.heatmap-tab').removeClass('hide');
    } else {
        $('.core-tab').addClass('hide');
        $('.heatmap-tab').addClass('hide');
    }

    // events for workspace and selected object sidebar
    $('.show-ws').unbind('click');
    $('.show-ws').click(function(){
        $(this).siblings('button').removeClass('active');
        $(this).addClass('active');
        $scope.showWSSelector();
    });

    $('.show-objs').unbind('click');    
    $('.show-objs').click(function(){
        $(this).siblings('button').removeClass('active');
        $(this).addClass('active');
        $scope.showSelectedObjs();

    });

    // define some functions for the navigation of the left sidebar
    $scope.showSelectedObjs = function() {
        $('.wsselector').toggle('slide', {
                                direction: 'left',
                                duration: 'fast',
                                    complete: function() {
                                    $('.selectedobjs').toggle('slide', {
                                        direction: 'left',
                                        duration: 'fast'});
                                }
        });
    }

    $scope.showWSSelector = function() {
        $('.selectedobjs').toggle('slide', {
                                    direction: 'left',
                                    duration: 'fast',
                                    complete: function() {
                                        $('.wsselector').toggle('slide', {
                                            direction: 'left',
                                            duration: 'fast'});
                                    }
        });
    }



    // removes items from the selected objects view
    $scope.removeItem = function(index){
        $scope.selectedObjs.splice(index, 1);
    }

})


.controller('Selector', function($scope, $location) {

})

.controller('RxnDetail', function($scope, $stateParams) {
    $scope.ids = $stateParams.ids.split('&');
})


.controller('CpdDetail', function($scope, $stateParams) {
    $scope.ids = $stateParams.ids.split('&');
})

.controller('MVHelp', function($scope, $stateParams, $location) {
    // Fixme: move out of controller
    $('.api-url-submit').click(function() {
        var form = $(this).parents('form');
        var url = '/'+form.attr('type')+'/'+form.find('#input1').val();
        if (form.find('#input2').val()) {
            url = url+'/'+form.find('#input2').val();
        }
    
        $scope.$apply( $location.path( url ) );
    });
})


.controller('GenomeDetail', function($scope, $stateParams) {
    $scope.params = {'genomeID' : $stateParams.id,
                     'workspaceID' : $stateParams.ws,
                     'kbCache' : kb}
})

.controller('GeneDetail', function($scope, $stateParams) {
    $scope.params = {'genomeID' : $stateParams.gid,
                     'featureID' : $stateParams.fid,
                     'workspaceID' : $stateParams.ws,
                     'version' : $stateParams.ver,
                     'kbCache' : kb}
})


.controller('MediaDetail', function($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
})

.controller('ModelDetailCards', function($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
})  

.controller('MemeDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id,
                     'ws': $stateParams.ws};
})

.controller('CmonkeyDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id,
                     'ws': $stateParams.ws};
})

.controller('InferelatorDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id,
                     'ws': $stateParams.ws};
})

.controller('MAKDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id,
                     'ws': $stateParams.ws};
})

.controller('RegpreciseDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id,
                     'ws': $stateParams.ws};
})

.controller('BambiDetail', function($scope, $stateParams) {
    $scope.params = {'bambi_run_result_id': $stateParams.id,
                     'workspace_id': $stateParams.ws}
})

.controller('PPIDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id,
		     'ws': $stateParams.ws};
})

.controller('SpecDetail', function($scope, $stateParams) {
    $scope.params = {
        'kind' : $stateParams.kind,
        'id' : $stateParams.id
    };
})


.controller('GPTypeDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id, 'ws':$stateParams.ws}
})

.controller('GTTypeDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id, 'ws':$stateParams.ws}
})

.controller('GVTypeDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id, 'ws':$stateParams.ws}
})

.controller('GGLTypeDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id, 'ws':$stateParams.ws}
})

.controller('GTVTypeDetail', function($scope, $stateParams) {
    $scope.params = {'id': $stateParams.id, 'ws':$stateParams.ws}
})


.controller('ModelDetail', function($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
})

.controller('ModelDetailCards', function($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
})

.controller('FBADetail', function($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
})

.controller('FBADetailCards', function($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
})

.controller('WSObjects', function($scope, $stateParams, $location) {
    var type = $location.path().match(/\/\w*\/*/g)[0]
             .replace('/','').replace('/','');

    $scope.type = type;
    $scope.ws = $stateParams.ws;
})

.controller('Trees', function($scope, $stateParams) {
    $scope.ws = $stateParams.ws;
    $scope.id = $stateParams.id;
})

.controller('WorkspaceBrowser', function($scope, $stateParams) {
    //changeNav('workspaces');
    $scope.selected_ws = $stateParams.ws;
})




.controller('Narrative', function($scope, $stateParams, $location, kbaseLogin, $modal, FeedLoad) {
    //changeNav('narrative', 'newsfeed');
    $scope.nar_url = configJSON.narrative_url; // used for links to narratives

    //to open the copy narrative dialog
    $scope.copyNarrativeForm = function (title) {

        //$scope.narr.title = title;

        var modalInstance = $modal.open({
          templateUrl: 'views/narrative/dialogboxes/copynarrative.html',
          controller: CopyNarrativeModalCtrl,
          resolve: {
                narr: function () {
                    return title;
                    }
                
            }
        });
    };

    // callback for ng-click 'loginUser':
    $scope.loginUser = function (user) {
        $("#loading-indicator").show();
        kbaseLogin.login(
            user.username,
            user.password,
            function(args) {
                console.log(args);
                if (args.success === 1) {
                        
                    this.registerLogin(args);
                    //this.data('_session', kbaseCookie);

                    //set the cookie
                    var c = $("#login-widget").kbaseLogin('get_kbase_cookie');
                    
                    console.log( 'Setting kbase_session cookie');
                    $.cookie('kbase_session',
                             'un=' + c.user_id
                             + '|'
                             + 'kbase_sessionid=' + c.kbase_sessionid
                             + '|'
                             + 'user_id=' + c.user_id
                             + '|'
                             + 'token=' + c.token.replace(/=/g, 'EQUALSSIGN').replace(/\|/g,'PIPESIGN'),
                             { path: '/',
                               domain: 'kbase.us' });
                    $.cookie('kbase_session',
                             'un=' + c.user_id
                             + '|'
                             + 'kbase_sessionid=' + c.kbase_sessionid
                             + '|'
                             + 'user_id=' + c.user_id
                             + '|'
                             + 'token=' + c.token.replace(/=/g, 'EQUALSSIGN').replace(/\|/g,'PIPESIGN'),
                             { path: '/'});

                    //this.data('_session', c);

                    USER_ID = $("#signin-button").kbaseLogin('session').user_id;
                    USER_TOKEN = $("#signin-button").kbaseLogin('session').token;

                    kb = new KBCacheClient(USER_TOKEN);

                    $location.path('/narrative/home/');

                    $scope.$apply();
                    
                } else {
                    console.log("error logging in");
                    $("#loading-indicator").hide();
                    $("#login_error").html(args.message);
                    $("#login_error").show();

                }

            }
        )
        
    };

})

/*
.controller('CopyNarrativeModalCtrl', function ($scope, $modalInstance) {
// controller for the modals to copy a featured narrative 
  $scope.save = function () {
    $modalInstance.dismiss('cancel');
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
})
*/
.controller('NarrativeProjects', function($scope, $stateParams) {
})


/* controller for the search box */
var SearchController = function ($scope, $location) {

    // callback for ng-click search:
    $scope.startSearch = function (searchquery) {
        window.location.replace("#search?" + searchquery);          
    };
};


/* controller for the copy narrative modal */
var CopyNarrativeModalCtrl = function ($scope, $modalInstance, $location, narr) {

    $scope.narr = narr;
    // callback for ng-click 'copy narrative':
    $scope.copyNarrative = function () {
        $('#loading-indicator').show();
        $('#copy-narr-button').attr("disabled", "disabled");
        kb.nar.copy_narrative({
            fq_id: $scope.narr,
            callback: function(results) {
                
                //console.log("copied narrative " + results.fq_id);
                window.location.replace("http://demo.kbase.us/narrative/" + results.fq_id);
                //$modalInstance.dismiss();

                
            },
            error_callback: function(message) {
                //console.log("error occurred " + message);

                if (!message.match("No object with name")) {
                    $('#loading-indicator').hide();

                    $scope.alerts = [];
                    $scope.alerts.push({type: 'danger', msg: "We were unable to copy the narrative and its datasets into your home workspace. Error: " + message});
                    //TODO need to retrieve the actual error message 
                    $scope.$apply();
                }
            }

        })
    }
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };

    $scope.closeAlert = function(index) {
        $scope.alerts.splice(index, 1);
    };

};



function Navigation($scope, $location) { 
    $scope.isActive = function (viewLocation) {
    console.log(viewLocation, $location.path()) 
        return viewLocation === $location.path();
    };
}

function LPHelp($scope, $stateParams, $location) {
    // Fixme: move out of controller
    $('.api-url-submit').click(function() {
        var form = $(this).parents('form');
        var url = '/'+form.attr('type')+'/'+form.find('#input1').val();
        if (form.find('#input2').val()) {
            url = url+'/'+form.find('#input2').val();
        }
    
        $scope.$apply( $location.path( url ) );
    });
}


function ScrollCtrl($scope, $location, $anchorScroll) {
  $scope.gotoAnchor = function (id){
    $location.hash(id);
    $anchorScroll();
  }
}



