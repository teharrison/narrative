/**
 * @author Michael Sneddon <mwsneddon@lbl.gov>
 * @public
 */
(function( $, undefined ) {
    $.KBWidget({
        name: 'kbaseNarrativeExampleDataTab',
        parent: 'kbaseAuthenticatedWidget',
        version: '1.0.0',
        options: {
            ws_name: null, // must be the WS name, not the WS Numeric ID
            ws_url:"https://kbase.us/services/ws",
            landing_page_url: "/functional-site/#/", // !! always include trailing slash
            default_landing_page_url: "/functional-site/#/ws/json/", // ws_name/obj_name,
            loadingImage: 'static/kbase/images/ajax-loader.gif',
            exampleWsId: 2901, // designed to be a workspace with just a handful of objects
            exampleTypeOrder: [
                {name:'AssemblyInput', displayName: "Example Assembly Inputs", header:'Read data configured for sequence assembly.'},
                {name:'ContigSet', displayName: "Example Contig Sets", header:'A set of DNA sequences'},
                {name:'Genome', displayName: "Example Genomes", header:'Genomic sequence generally with attached functional annotations'},
                {name:'FBAModel', displayName: "Example FBAModels", header:'A metabolic model of an organism'},
                {name:'Media', displayName: "Example Media", header:'Specification of an environmental condition'}
                ]
            
        },

        ws: null,
        narWs:null,
        ws_landing_page_map: {},
        
        $mainPanel:null,
        $loadingDiv:null,
        
        
        /**
         * @method init
         * Builds the DOM structure for the widget.
         * Includes the tables and panel.
         * If any data was passed in (options.data), that gets shoved into the datatable.
         * @param {Object} - the options set.
         * @returns {Object} this shiny new widget.
         * @private
         */
        init: function(options) {
            this._super(options);
            var self = this;
            this.getLandingPageMap();  //start off this request so that we hopefully get something back right away
            
            this.$loadingDiv = $('<div>').addClass('kb-data-loading')
                                 .append('<img src="' + this.options.loadingImage + '">');
            this.$elem.append(this.$loadingDiv);
            this.$mainPanel = $('<div>')
                .css({'overflow-y':'auto'});
            this.$elem.append(this.$mainPanel);
            
            if (window.kbconfig && window.kbconfig.urls) {
                this.options.ws_url = window.kbconfig.urls.workspace;
            }
            this.showLoading();
            
            var self = this;
            $(document).on('setWorkspaceName.Narrative', function(e, info){
                self.narWs = info.wsId;
                self.getExampleDataAndRender();
            })
            return this;
        },
        
        refresh: function() { },
        
        objectList:null,
        
        getExampleDataAndRender: function() {
            var self = this;
            if (self.narWs && self.ws) {
                self.ws.list_objects({
                        ids : [self.options.exampleWsId],
                        includeMetadata: 1
                    },
                    function(infoList) {
                        self.objectList = [];
                        // object_info:
                        // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
                        // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
                        // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
                        // [9] : int size // [10] : usermeta meta
                        for (var i=0; i<infoList.length; i++) {
                            // skip narrative objects
                            if (infoList[i][2].indexOf('KBaseNarrative') == 0) { continue; }
                            self.objectList.push({
                                    $div:self.renderObjectRowDiv(infoList[i]), // we defer rendering the div until it is shown
                                    info:infoList[i]
                                }
                            );
                        }
                        self.renderData();
                    }, 
                    function(error) {
                        self.$mainPanel.show();
                        self.$mainPanel.append("error: ");
                        self.$mainPanel.append(error.error.message);
                        console.error(error);
                        self.hideLoading();
                    });
            }
            
        },
        
        
        renderData: function() {
            var self = this;
            if (!self.objectList) { return; }
            
            var typeDivs = {};
            for(var t=0; t<self.options.exampleTypeOrder.length; t++) {
                var typeInfo = self.options.exampleTypeOrder[t];
                var name = typeInfo.name;
                if (typeInfo.displayName) {
                    name = typeInfo.displayName;
                }
                var $tc = $('<div>')
                            .append($('<div>').css({'margin':'15px'})
                                .append($('<div>').css({'margin':'4px','margin-top':'15px','color':'#555','font-size':'large','font-weight':'bold'})
                                        .append(name))
                                .append($('<div>').css({'margin':'4px','color':'#555'})
                                        .append(typeInfo.header)));
                typeDivs[typeInfo.name] = $tc;
            }
            var $tc = $('<div>')
                            .append($('<div>').css({'margin':'15px'})
                                .append($('<div>').css({'margin':'4px','margin-top':'15px','color':'#555','font-size':'large','font-weight':'bold'})
                                        .append('Other Examples'))
                                .append($('<div>').css({'margin':'4px','color':'#555'})
                                        .append('Assorted data types used in more advanced analyses')));
            typeDivs['other.types'] = $tc;
            
            var hasOthers = false;
            for (var k=0; k<self.objectList.length; k++) {
                var obj = self.objectList[k];
                var typeName = obj.info[2].split('-')[0].split('.')[1];
                if (typeDivs.hasOwnProperty(typeName)) {
                    typeDivs[typeName].append(obj.$div);
                } else {
                    typeDivs['other.types'].append(obj.$div);
                    hasOthers = true;
                }
            }
            
            for(var t=0; t<self.options.exampleTypeOrder.length; t++) {
                self.$mainPanel.append(typeDivs[self.options.exampleTypeOrder[t].name]);
            }
            if (hasOthers) {
                self.$mainPanel.append(typeDivs['other.types']);
            }
            
            self.hideLoading();
        },
        
        getObjData: function(type, ignoreVersion) {
            if (type) {
                var dataSet = {};
                if (typeof type === 'string') {
                    type = [type];
                }
                for (var i=0; i<type.length; i++) {
                    if (this.obj_data[type[i]]) {
                        dataSet[type[i]]=this.obj_data[type[i]];
                    }
                }
                return dataSet;
            }
            return this.obj_data;  
        },
        
        renderObjectRowDiv: function(object_info) {
            var self = this;
            // object_info:
            // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
            // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
            // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
            // [9] : int size // [10] : usermeta meta
            var type_tokens = object_info[2].split('.')
            var type_module = type_tokens[0];
            var type = type_tokens[1].split('-')[0];
            
            var $addDiv =
                $('<div>').addClass('col-md-2').append(
                    $('<button>').addClass('btn btn-default')
                        .append($('<span>').addClass('fa fa-chevron-circle-left').append(' Add'))
                        .on('click',function() { // probably should move action outside of render func, but oh well
                            $(this).attr("disabled","disabled");
                            $(this).html('<img src="'+self.options.loadingImage+'">');
                            
                            var thisBtn = this;
                            self.ws.copy_object({
                                to:   {ref: self.narWs     + "/" + object_info[1]},
                                from: {ref: object_info[6] + "/" + object_info[0]} },
                                function (info) {
                                    $(thisBtn).html('Added');
                                    self.trigger('updateDataList.Narrative');
                                },
                                function(error) {
                                    $(thisBtn).html('Error');
                                    console.error(error);
                                });
                            
                        }));
            
            var shortName = object_info[1]; var isShortened=false;
            /*if (shortName.length>this.options.max_name_length) {
                shortName = shortName.substring(0,this.options.max_name_length-3)+'...';
                isShortened=true;
            }*/
            var $name = $('<span>').addClass("kb-data-list-name").append(shortName);
            if (isShortened) { $name.tooltip({title:object_info[1], placement:'bottom'}); }
           
            var metadata = object_info[10];
            var metadataText = '';
            for(var key in metadata) {
                if (metadata.hasOwnProperty(key)) {
                    metadataText += '<tr><th>'+ key +'</th><td>'+ metadata[key] + '</td></tr>';
                }
            }
            
            var landingPageLink = this.options.default_landing_page_url +object_info[7]+ '/' + object_info[1];
            if (this.ws_landing_page_map) {
                if (this.ws_landing_page_map[type_module]) {
                    if (this.ws_landing_page_map[type_module][type]) {
                        landingPageLink = this.options.landing_page_url +
                            this.ws_landing_page_map[type_module][type] + "/" +
                            object_info[7]+ '/' + object_info[1];
                    }
                }
            }
            
            var $moreRow  = $('<div>').addClass("kb-data-list-more-div").hide()
                                .append($('<div>').css({'text-align':'center','margin':'5pt'})
                                            .append('<a href="'+landingPageLink+'" target="_blank">'+
                                                        'explore data</a>&nbsp&nbsp|&nbsp&nbsp')
                                            .append('<a href="'+this.options.landing_page_url+'objgraphview/'+object_info[7] +'/'+object_info[1] +'" target="_blank">'+
                                                        'view provenance</a><br>'))
                                .append(
                                    $('<table style="width=100%">')
                                        .append("<tr><th>Permament Id</th><td>" +object_info[6]+ "/" +object_info[0]+ "/" +object_info[4] + '</td></tr>')
                                        .append(metadataText));
            
            var $toggleAdvancedViewBtn = $('<span>').addClass('btn btn-default btn-xs kb-data-list-more-btn')
                .html('<span class="fa fa-plus" style="color:#999" aria-hidden="true"/>')
                .on('click',function() {
                        var $more = $(this).closest(".kb-data-list-obj-row").find(".kb-data-list-more-div");
                        if ($more.is(':visible')) {
                            $more.slideToggle('fast');
                            $(this).html('<span class="fa fa-plus" style="color:#999" aria-hidden="true" />');
                        } else {
                            $more.slideToggle('fast');
                            $(this).html('<span class="fa fa-minus" style="color:#999" aria-hidden="true" />');
                        }
                    });
                    
            var $mainDiv  = $('<div>').addClass('col-md-10 kb-data-list-info')
                                .append($('<span>')
                                            .addClass("kb-data-list-logo")
                                            .css({'background-color':this.logoColorLookup(type)})
                                            .append(type.substring(0,1)))
                                .append($('<span>').css({'margin':'10px'}).append($name));
        
            var $row = $('<div>').css({'margin':'5px'}).append(
                            $('<div>').addClass('row kb-data-list-obj-row-main')
                                .append($addDiv)
                                .append($mainDiv));
            return $row;
        },
        
        

        renderMore: function() {
            var self=this;
            if (self.objectList) {
                
                if (!self.searchFilterOn) { // if search filter is off, then we just are showing everything
                    var start = self.n_objs_rendered;
                    for(var i=start; i<self.objectList.length; i++) {
                        // only show them as we scroll to them
                        if (self.n_objs_rendered >= start+self.options.objs_to_render_on_scroll) {
                            break;
                        }
                        self.attachRow(i);
                    }
                    //console.log('showing '+ self.n_objs_rendered + ' of ' + self.objectList.length);
                } else {
                    // search filter is on, so we have to base this on what is currently filtered
                    var start = self.n_filteredObjsRendered;
                    for(var i=start; i<self.currentMatch.length; i++) {
                        // only show them as we scroll to them
                        if (self.n_filteredObjsRendered >= start+self.options.objs_to_render_on_scroll) {
                            break;
                        }
                        self.attachRowElement(self.currentMatch[i]);
                        self.n_filteredObjsRendered++;
                    }
                    //console.log('showing '+ self.n_filteredObjsRendered + ' of ' + self.currentMatch.length + ' objs matching search filter');
                }
            }
        },
        
        attachRow: function(index) {
            if (this.objectList[index].attached) { return; }
            if (this.objectList[index].$div) {
                this.$mainListDiv.append(this.objectList[index].$div);
            } else {
                this.objectList[index].$div = this.renderObjectRowDiv(this.objectList[index].info);
                this.$mainListDiv.append(this.objectList[index].$div);
            }
            this.objectList[index].attached = true;
            this.n_objs_rendered++;
        },
        attachRowElement: function(row) {
            if (row.attached) { return; } // return if we are already attached
            if (row.$div) {
                this.$mainListDiv.append(row.$div);
            } else {
                row.$div = this.renderObjectRowDiv(row.info);
                this.$mainListDiv.append(row.$div);
            }
            row.attached = true;
            this.n_objs_rendered++;
        },
        
        detachAllRows: function() {
            for (var i=0; i<this.objectList.length; i++) {
                this.detachRow(i);
            }
            this.$mainListDiv.children().detach();
            this.n_objs_rendered=0;
            this.renderedAll = false;
        },
        detachRow: function(index) {
            if (this.objectList[index].attached) {
                if (this.objectList[index].$div) {
                    this.objectList[index].$div.detach();
                }
                this.objectList[index].attached = false;
                this.n_objs_rendered--;
            }
        },
        
        
        renderList: function() {
            var self = this;
            self.showLoading();
            
            self.detachAllRows();
            
            if (self.objectList.length>0) {
                for(var i=0; i<self.objectList.length; i++) {
                    // only show up to the given number
                    if (i>=self.options.objs_to_render_to_start) {
                        self.n_objs_rendered = i;
                        break;
                    }
                    self.attachRow(i);
                }
            } else {
                // todo: show an upload button or some other message if there are no elements
                self.$mainListDiv.append($('<div>').css({'text-align':'center','margin':'20pt'}).append("No data added yet."));
            }
            
            self.hideLoading();
        },
        
        renderController: function() {
            var self = this;
            
            var $byDate = $('<label id="nar-data-list-default-sort-label" class="btn btn-default">').addClass('btn btn-default')
                                .append($('<input type="radio" name="options" id="nar-data-list-default-sort-option" autocomplete="off">'))
                                .append("date")
                                .on('click',function() {
                                    self.sortData(function(a,b) {
                                        if (a.info[3] > b.info[3]) return -1; // sort by date
                                        if (a.info[3] < b.info[3]) return 1;  // sort by date
                                        return 0;
                                    });
                                });
                                
            var $byName = $('<label class="btn btn-default">')
                                .append($('<input type="radio" name="options" id="option2" autocomplete="off">'))
                                .append("name")
                                .on('click',function() {
                                    self.sortData(function(a,b) {
                                        if (a.info[1].toUpperCase() < b.info[1].toUpperCase()) return -1; // sort by name
                                        if (a.info[1].toUpperCase() > b.info[1].toUpperCase()) return 1; 
                                        return 0;
                                    });
                                });
                                
            var $byType = $('<label class="btn btn-default">')
                                .append($('<input type="radio" name="options" id="option3" autocomplete="off">'))
                                .append("type")
                                .on('click',function() {
                                    self.sortData(function(a,b) {
                                        if (a.info[2].toUpperCase() > b.info[2].toUpperCase()) return -1; // sort by type
                                        if (a.info[2].toUpperCase() < b.info[2].toUpperCase()) return 1;
                                        return 0;
                                    });
                                });
            var $upOrDown = $('<button class="btn btn-default btn-sm" type="button">').css({'margin-left':'5px'})
                                .append('<span class="glyphicon glyphicon-sort" style="color:#777" aria-hidden="true" />')
                                .on('click',function() {
                                    self.reverseData();
                                });
            
            var $sortByGroup = $('<div data-toggle="buttons">')
                                    .addClass("btn-group btn-group-sm")
                                    .css({"margin":"2px"})
                                    .append($byDate)
                                    .append($byName)
                                    .append($byType);
            
            var $addDataBtn = $('<button>')
                                .addClass("btn btn-warning kb-data-list-get-data-button")
                                .append('<span class="fa fa-plus" style="color:#fff" aria-hidden="true" /> Get Data')
                                .on('click',function() {
                                    self.trigger('toggleSidePanelOverlay.Narrative');

                                      // Lovely hack to make the 'Get Data' button behave like a method/app panel button.
                                    /*  self.methClient.get_method_spec({ 'ids' : ['import_genome_data_generic'] },
                                          function(spec) {
                                              self.trigger('methodClicked.Narrative', spec[0]);
                                          },
                                          function(error) {
                                              self.showError(error);
                                          }
                                      );*/
                                });
            
            
            var $openSearch = $('<span>').addClass('btn btn-default kb-data-list-nav-buttons')
                .html('<span class="fa fa-search" style="color:#666" aria-hidden="true"/>')
                .on('click',function() {
                    if(!self.$searchDiv.is(':visible')) {
                        self.$searchDiv.show();
                        self.$sortByDiv.hide();
                        self.$filterTypeDiv.hide();
                    } else {
                        self.$searchDiv.hide();
                    }
                });
            var $openSort = $('<span>').addClass('btn btn-default kb-data-list-nav-buttons')
                .html('<span class="fa fa-sort-amount-asc" style="color:#666" aria-hidden="true"/>')
                .on('click',function() {
                    if(!self.$sortByDiv.is(':visible')) {
                        self.$sortByDiv.show();
                        self.$searchDiv.hide();
                        self.$filterTypeDiv.hide();
                    } else {
                        self.$sortByDiv.hide();
                    }
                });
            var $openFilter = $('<span>').addClass('btn btn-default kb-data-list-nav-buttons')
                .html('<span class="fa fa-filter" style="color:#666" aria-hidden="true"/>')
                .on('click',function() {
                    if(!self.$filterTypeDiv.is(':visible')) {
                        self.$filterTypeDiv.show();
                        self.$sortByDiv.hide();
                        self.$searchDiv.hide();
                    } else {
                        self.$filterTypeDiv.hide();
                    }
                });
            
            self.$searchInput = $('<input type="text">').addClass('form-control');
            self.$searchDiv = $('<div>').addClass("input-group").css({'margin-bottom':'10px'})
                                .append(self.$searchInput)
                                .append($("<span>").addClass("input-group-addon")
                                            .append($("<span>")
                                                .addClass("glyphicon glyphicon-search")
                                                .css({'cursor':'pointer'})
                                                .on('click',function() {
                                                        self.search();
                                                    })  ));

            self.$sortByDiv = $('<div>').css({'margin':'3px','margin-left':'5px','margin-bottom':'10px'})
                                .append("<small>sort by: </small>")
                                .append($sortByGroup)
                                .append($upOrDown);
            
            self.$filterTypeSelect = $('<select>').addClass("form-control")
                                        .append($('<option value="">'))
                                        .change(function() {
                                            var optionSelected = $(this).find("option:selected");
                                            var typeSelected  = optionSelected.val();
                                            //var textSelected   = optionSelected.text();
                                            self.filterByType(typeSelected);
                                        });
            
            self.$filterTypeDiv = $('<div>').css({'margin':'3px','margin-left':'5px','margin-bottom':'10px'})
                                .append(self.$filterTypeSelect);
                                
                                
            
            var $header = $('<div>').addClass('row').css({'margin':'5px'})
                    .append($('<div>').addClass('col-xs-7').css({'margin':'0px','padding':'0px'})
                        .append($openSearch)
                        .append($openSort)
                        .append($openFilter))
                    .append($('<div>').addClass('col-xs-5').css({'margin':'0px','padding':'0px','text-align':'right'})
                        .append($addDataBtn));
            
            
            self.$sortByDiv.hide();
            self.$searchDiv.hide();
            self.$filterTypeDiv.hide();
            
            var $filterDiv = $('<div>')
                                .append(self.$sortByDiv)
                                .append(self.$searchDiv)
                                .append(self.$filterTypeDiv);
                                
            self.$controllerDiv.append($header).append($filterDiv);
        },
        
        populateAvailableTypes: function() {
            var self = this;
            if (self.availableTypes && self.$filterTypeSelect) {
                
                var types = [];
                for(var type in self.availableTypes) {
                    if(self.availableTypes.hasOwnProperty(type)) {
                        types.push(type);
                    }
                }
                types.sort();
                
                self.$filterTypeSelect.empty();
                self.$filterTypeSelect.append($('<option value="">'));
                for(var i=0; i<types.length; i++) {
                    var countStr = " (".concat(self.availableTypes[types[i]].count).concat(" objects)");
                    self.$filterTypeSelect.append(
                        $('<option value="'+self.availableTypes[types[i]].type+'">')
                            .append(self.availableTypes[types[i]].type + countStr));
                }
            }
        },
        
        
        reverseData: function() {
            var self = this;
            if (!self.objectList) { return; }
            
            self.objectList.reverse();
            self.renderList();
            self.search();
            
            self.hideLoading();
        },
        
        sortData: function(sortfunction) {
            var self = this;
            if (!self.objectList) { return; }
            //should add spinning wait bar ....
            self.showLoading();
            
            self.objectList.sort(sortfunction);
            self.renderList();
            self.search();  // always refilter on the search term search if there is something there
            
            self.hideLoading();
            
            // go back to the top on sort
            self.$mainListDiv.animate({
                scrollTop:0
            }, 300); // fast = 200, slow = 600
        },
        
        
        currentMatch: [],
        currentTerm: '',
        searchFilterOn: false,
        n_filteredObjsRendered: null,
        
        search: function(term, type) {
            var self = this;
            if (!self.objectList) { return; }
            
            if (!term && self.$searchInput) {
                term = self.$searchInput.val();
            }
            
            // if type wasn't selected, then we try to get something that was set
            if (!type) {
                if (self.$filterTypeSelect) {
                    type = self.$filterTypeSelect.find("option:selected").val();
                }
            }
            
            term = term.trim();
            if (term.length>0 || type) {
                self.searchFilterOn = true;
                // todo: should show searching indicator (could take several seconds if there is a lot of data)
                // optimization => we filter existing matches instead of researching everything if the new
                // term starts with the last term searched for
                var newMatch = [];
                if (!self.currentTerm) {
                    // reset if currentTerm is null or empty
                    self.currentMatch = self.objectList;
                } else {
                    if (term.indexOf(self.currentTerm)!==0) {
                        self.currentMatch = self.objectList;
                    }
                }
                // clean the term for regex use
                term = term.replace(/\|/g,'\\|').replace(/\\\\\|/g,'|'); // bars are common in kb ids, so escape them unless we have \\|
                term = term.replace(/\./g,'\\.').replace(/\\\\\./g,'.'); // dots are common in names, so we escape them, but
                                                                         // if a user writes '\\.' we assume they want the regex '.'
                
                var regex = new RegExp(term, 'i');
                
                var n_matches = 0; self.n_filteredObjsRendered = 0;
                for(var k=0; k<self.currentMatch.length; k++) {
                    // [0] : obj_id objid // [1] : obj_name name // [2] : type_string type
                    // [3] : timestamp save_date // [4] : int version // [5] : username saved_by
                    // [6] : ws_id wsid // [7] : ws_name workspace // [8] : string chsum
                    // [9] : int size // [10] : usermeta meta
                    var match = false;
                    var info = self.currentMatch[k].info;
                    if (regex.test(info[1])) { match = true; } // match on name
                    else if (regex.test(info[2].split('.')[1].split('-'))) { match = true; } // match on type name
                    else if (regex.test(info[5])) { match = true; } // match on saved_by user
                    
                    if (!match && info[10]) { // match on metadata values
                        for(var metaKey in info[10]) {
                            if (info[10].hasOwnProperty(metaKey)) {
                                if (regex.test(info[10][metaKey])) { match = true; break; }
                                else if (regex.test(metaKey+"::"+info[10][metaKey])) {
                                    match = true; break; 
                                }
                            }
                        }
                    }
                    
                    
                    if (type) { // if type is defined, then our sort must also filter by the type
                        if (type !== info[2].split('-')[0].split('.')[1]) {
                            match = false; // no match if we are not the selected type!
                        }
                    }
                    
                    if (match) {
                        // matches must always switch to show if they are rendered
                        if (self.currentMatch[k].$div) {
                            self.currentMatch[k].$div.show();
                        }
                        
                        // todo: add check so we only show up to the number we render... switching to this will require that
                        // we revise the renderMore logic...
                        if (n_matches < self.options.objs_to_render_to_start) {
                            self.attachRowElement(self.currentMatch[k]);
                            self.n_filteredObjsRendered++;
                        }
                        
                        newMatch.push(self.currentMatch[k]);
                        n_matches++;
                    }
                    else {
                        if (self.currentMatch[k].$div) {
                            self.currentMatch[k].$div.hide();
                        }
                    }
                }
                self.currentMatch = newMatch; // update the current match
            } else {
                self.searchFilterOn = false;
                // no new search, so show all and render the list
                for(var k=0; k<self.objectList.length; k++) {
                    if (self.objectList[k].$div) {
                        self.objectList[k].$div.show();
                    }
                }
                self.renderList();
            }
            self.currentTerm = term;
        },
        
        
        filterByType: function(type) {
            var self = this;
            self.search(null,type);
        },
        
        getRichData: function(object_info,$moreRow) {
            var self = this;
            var $usernameTd = $moreRow.find(".kb-data-list-username-td");
            self.displayRealName(object_info[5],$usernameTd);
        },
        
        showLoading : function() {
            this.$loadingDiv.show();
            this.$mainPanel.hide();
        },
        hideLoading : function() {
            this.$loadingDiv.hide();
            this.$mainPanel.show();
        },
        
        displayRealName: function(username,$targetSpan) {
	    var self = this;
	    // todo : use globus to populate user names, but we use a hack because of globus CORS headers
	    if (self.ws) { // make sure we are logged in and have some things
		
                if (self.real_name_lookup[username]) {
                    $targetSpan.html(self.real_name_lookup[username]+" ("+username+")");
                } else {
                    self.real_name_lookup[username] = "..."; // set a temporary value so we don't search again
                    $targetSpan.html(username);
                    $.ajax({
                            type: "GET",
                            url: self.options.user_name_fetch_url + username + "&token="+self._attributes.auth.token,
                            dataType:"json",
                            crossDomain : true,
                            success: function(data,res,jqXHR) {
                                if (username in data['data'] && data['data'][username]['fullName']) {
                                    self.real_name_lookup[username] = data['data'][username]['fullName'];
                                    $targetSpan.html(self.real_name_lookup[username]+" ("+username+")");
                                }
                            },
                            error: function(jqXHR, textStatus, errorThrown) {
                                //do nothing
                            }
                        });
                }
	    }
        },
        
        getLandingPageMap: function() {
            this.ws_landing_page_map = window.kbconfig.landing_page_map;
        },
        
        loggedInCallback: function(event, auth) {
            this.ws = new Workspace(this.options.ws_url, auth);
            this.getExampleDataAndRender();
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.ws = null;
            this.isLoggedIn = false;
            return this;
        },
        
        logoColorLookup:function(type) {
            var colors = [
                            '#F44336', //red
                            '#E91E63', //pink
                            '#9C27B0', //purple
                            '#673AB7', //deep purple
                            '#3F51B5', //indigo
                            '#2196F3', //blue
                            '#03A9F4', //light blue
                            '#00BCD4', //cyan
                            '#009688', //teal
                            '#4CAF50', //green
                            '#8BC34A', //lime green
                            '#CDDC39', //lime
                            '#FFEB3B', //yellow
                            '#FFC107', //amber
                            '#FF9800', //orange
                            '#FF5722', //deep orange
                            '#795548', //brown
                            '#9E9E9E', //grey
                            '#607D8B'  //blue grey
                         ];
            
            // first, if there are some colors we want to catch...
            switch (type) {
                case "Genome":
                    return '#2196F3'; //blue
                case "FBAModel":
                    return '#4CAF50'; //green
                case "FBA":
                    return '#F44336'; //red
                case "ContigSet":
                    return '#FF9800'; //orange
                case "ProteomeComparison":
                    return '#3F51B5'; //indigo
                case "Tree":
                    return '#795548'; //brown
            }
            
            // pick one based on the characters
            var code = 0;
            for(var i=0; i<type.length; i++) {
                code += type.charCodeAt(i);
            }
            return colors[ code % colors.length ];
        }
        
    })

})(jQuery);
