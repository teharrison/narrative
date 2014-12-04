/**
 *
 *
 *  options should be:
 *      ws_url: ...           
 *      nms_url: ...
 *
 */
var NarrativeManager = function(options, auth, auth_cb) {

    // setup URLs and Clients
    if (!options) {
        console.error("NarrativeManager: options must be defined.");
        return;
    }
    this.config = {};
    this.config.ws_url = null;
    this.config.nms_url = null;
    if (options.ws_url) { this.config.ws_url  = options.ws_url; }
    else if (window.kbconfig && window.kbconfig.urls) {
        this.config.ws_url = window.kbconfig.urls.workspace;
    }
    if (options.nms_url) { this.config.nms_url  = options.nms_url; }
    else if (window.kbconfig && window.kbconfig.urls) {
        this.config.nms_url = window.kbconfig.urls.narrative_method_store;
    }
    
    if (typeof(this.config.ws_url) != "string" || this.config.ws_url.trim().length === 0) {
        this.config.ws_url = "https://kbase.us/services/ws";
    }
    if (typeof(this.config.nms_url) != "string" || this.config.nms_url.trim().length === 0) {
        this.config.nms_url = "https://kbase.us/services/narrative_method_store/rpc";
    }
    this.config.auth    = auth ? auth : { 'token' : '', 'user_id' : ''};
    if (!auth.user_id) {
        if (auth.token) {
            this.config.auth.user_id = auth.token.split('|')[0].split('=')[1];
        }
    }
    this.user_id = this.config.auth.user_id;
    this.config.auth_cb = auth_cb;

    this.ws = new Workspace(this.config.ws_url, this.config.auth, this.config.auth_cb);
    this.nms = new NarrativeMethodStore(this.config.nms_url, this.config.auth, this.config.auth_cb);
    
    /**
     *  creates a new Narrative in the single Narrative, single WS approach
     *
     *  // all are optional ...
     *  params =
     *  {
     *      cells : [
     *          { app: app_id },
     *          { method: method_id },
     *          { markdown: markdown },
     *          { code: code }
     *      ],
     *      parameters : [
     *          {
     *              cell: n,           // indicates index in the cell
     *              step_id: id,
     *              parameter_id: id,  
     *              value: value
     *          }
     *      ],
     *      importData : [
     *          {
     *               ref: ws_reference,  
     *               newName : name
     *          },
     *          ...
     *      ]
     *  }
     *
     *  _callback = function(info) {
     *
     *      info.ws_info = [ .. ]
     *      info.narrative_info = [ .. ]
     *      info.object_info = [ ws_reference : [ .. ] ]
     *      
     *  }
     */
    this.createTempNarrative = function(params, _callback, _error_callback) {
        var self = this;
        var id = new Date().getTime();
        var ws_name = this.user_id + ":" + id;
        var nar_name = "Narrative."+id;
        
        console.log("creating "+name);
        
        var wsMetaData = {
            'narrative' : nar_name,
            'is_temporary' : 'true',
            'pending_shared_users': '[]',
            'rejected_shared_users': '[]'
        };
        
        // 1 - create ws
        self.ws.create_workspace(
            {
                workspace: ws_name,
                description: "",
                meta: wsMetaData
            },
            function(ws_info) {
                console.log("workspace created:");
                console.log(ws_info);
                
                // 2 - create the Narrative object
                var narObjs = self.buildNarrativeObjects(
                    ws_name, params.cells, params.parameters,
                    function(narrativeObject, metadataExternal) {
                        // 3 - save the Narrative object
                        self.ws.save_objects(
                            {
                                workspace: ws_name,
                                objects: [{
                                    type: "KBaseNarrative.Narrative",
                                    data: narrativeObject,
                                    name: nar_name,
                                    meta: metadataExternal,
                                    provenance: [
                                        {
                                            script: "NarrativeManager.js",
                                            description: "Created new Workspace/Narrative bundle."
                                        }
                                    ],
                                    hidden:0
                                }]
                            },
                            function(obj_info_list) {
                                console.log('saved narrative:');
                                console.log(obj_info_list);
                                _callback({ws_info:ws_info, nar_info: obj_info_list[0]});
                            }, function (error) {
                                console.error(error);
                                if(_error_callback) { _error_callback(error); }
                            });
                    },
                    _error_callback
                );
            },
            function(error) {
                console.error(error);
                if(_error_callback) { _error_callback(error); }
            }
        );
    };
    
    /**
     * Makes a temporary narrative permanent by giving it a name
     *
     * params = {
     *  ws_name_or_id: name, // current ws name
     *  new_name: name
     * }
     * 
     */
    this.nameNarrative = function(params, _callback, _error_callback) {
        var self = this;
        if (!params.ws_name_or_id) {
            if (_error_callback) {
                _error_callback("'ws_name_or_id' field not set in params to nameNarrative");
            }
            return;
        }
        if (!params.new_name) {
            if (_error_callback) {
                _error_callback("'new_name' field not set in params to nameNarrative");
            }
            return;
        }
        var wsIdentity = {};
        if(/^([1-9]\d*)$/.test(params.ws_name_or_id)){ wsIdentity['id'] = parseInt(params.ws_name_or_id); }
        else { wsIdentity['workspace'] = params.ws_name_or_id; }
        self.ws.get_workspace_info(
            wsIdentity,
            function(info) {
                console.log('info');
                console.log(info);
                
                // first get narrative name in this workspace from the workspace metadata
                if (!info[8].narrative) {
                    _error_callback("Workspace is not properly configured for 1 workspace, 1 narrative.");
                }
                var narrative = info[8].narrative;
                
                // update the metadata to reflect the new name
                var newMetadata = {
                    is_temporary: 'false',  // set the is_temporary flag to false
                    narrative_nice_name: params.new_name // save the nice name to the workspace
                }
                self.ws.alter_workspace_metadata(
                    {wsi:wsIdentity, 'new': newMetadata},
                    function() {
                        // success, so set the narrative name
                       // self.ws.rename_object
                        
                    },
                    _error_callback
                );
            },
            _error_callback);
    };
    
    
    this.discardTempNarrative = function(params, _callback, _error_callback) {
    };
    
    
    /**
     * 
     */
    this.cleanTempNarratives = function(params, _callback, _error_callback) {
    };
    
    
    this.shareNarrative = function(params, _callback, _error_callback) {
    }; 
    
    
    /**
     *  _callback = function(list) {
     *
     *      list = [
     *          mine: [
     *              {
     *                  ws_info: [...],
     *                  narrative_info: [...],
     *                  ..
     *              },
     *              ...
     *              ]
     *          shared_readable: [ .. ],
     *          shared_writable: [ .. ],
     *          pending: [ .. ],
     *          public: [ .. ]
     *      ]
     *  }
     *
     *
     *  
     */
    this.listNarratives = function(params, _callback, _error_callback) {
    };
    
    
    /*
     *      cells : [
     *          { app: app_id },
     *          { method: method_id },
     *          { markdown: markdown },
     *          { code: code }
     *      ],
     *      parameters : [
     *          {
     *              cell: n,           // indicates index in the cell
     *              step_id: id,
     *              parameter_id: id,  
     *              value: value
     *          }
     *      ],
     */
    
    /* private method to setup the narrative object,
    returns [narrative, metadata]
    */
    this.buildNarrativeObjects = function(ws_name, cells, parameters, _callback, _error_callback) {
        var self = this;
        // first thing first- we need to grap the app/method specs
        self._getSpecs(cells,
            function() {
                // now we can create the metadata and populate the cells
                var metadata = {
                    job_ids: { methods:[], apps:[] },
                    format:'ipynb',
                    creator:self.user_id,
                    ws_name:ws_name,
                    name:"Untitled",
                    type:"KBaseNarrative.Narrative",
                    description:"",
                    data_dependencies:[]
                };
                var cell_data = [];
                if (cells) {
                    for(var c=0; c<cells.length; c++) {
                        if (cells[c].app) {
                            var appCell = self._buildAppCell(cell_data.length, self._specMapping.apps[cells[c].app]);
                            cell_data.push(appCell);
                        } else if (cells[c].method) {
                            var methodCell = self._buildMethodCell(cell_data.length, self._specMapping.methods[cells[c].method]);
                            cell_data.push(methodCell);
                        } else if (cells[c].markdown) {
                            cell_data.push({
                                cell_type: 'markdown',
                                source: cells[c].markdown,
                                metadata: {}
                            });
                        }
                        //else if (cells[c].code) { }
                        else {
                            console.error('cannot add cell '+c+', unrecognized cell content');
                            console.error(cells[c]);
                            if(_error_callback) { _error_callback('cannot add cell '+c+', unrecognized cell content'); }
                        }
                    }
                }
                
                var narrativeObject = {
                    nbformat_minor: 0,
                    worksheets: [ {
                        cells: cell_data,
                        metadata: {}
                    }],
                    metadata: metadata,
                    nbformat:3
                };
                
                // setup external string to string metadata for the WS object
                var metadataExternal = {};
                for(var m in metadata) {
                    if (metadata.hasOwnProperty(m)) {
                        if (typeof metadata[m] === 'string') {
                            metadataExternal[m] = metadata[m];
                        } else {
                            metadataExternal[m] = JSON.stringify(metadata[m]);
                        }
                    }
                }
                _callback(narrativeObject, metadataExternal);
        
            },
            _error_callback
            );
    };
    
    this._buildAppCell = function(pos,spec) {
        var cellId = 'kb-cell-'+pos+'-'+this._uuidgen();
        var cell = {
            cell_type: 'markdown',
            source: "<div id='" + cellId + "'></div>" +
                    "\n<script>" +
                    "$('#" + cellId + "').kbaseNarrativeAppCell({'appSpec' : '" + this._safeJSONStringify(spec) + "', 'cellId' : '" + cellId + "'});" +
                    "</script>",
            metadata: { }
        };
        var cellInfo = {};
        cellInfo[this.KB_TYPE] = this.KB_APP_CELL;
        cellInfo['app'] = spec;
        cellInfo[this.KB_STATE] = [];
        cell.metadata[this.KB_CELL] = cellInfo;
        return cell;
    };
    
    this._buildMethodCell = function(pos,spec) {
        var cellId = 'kb-cell-'+pos+'-'+this._uuidgen();
        var cell = {
            cell_type: 'markdown',
            source: "<div id='" + cellId + "'></div>" +
                    "\n<script>" +
                    "$('#" + cellId + "').kbaseNarrativeMethodCell({'method' : '" + this._safeJSONStringify(spec) + "'});" +
                    "</script>",
            metadata: { }
        };
        var cellInfo = {};
        cellInfo[this.KB_TYPE] = this.KB_FUNCTION_CELL;
        cellInfo['method'] = spec;
        cellInfo[this.KB_STATE] = [];
        cellInfo['widget'] = spec.widgets.input;
        cell.metadata[this.KB_CELL] = cellInfo;
        return cell;
    };
    
    // map the app ID to the spec, map method id to spec
    this._specMapping = {
        apps : {},
        methods : {}
    };
    /** populates the app/method specs **/
    this._getSpecs = function(cells, _callback, _error_callback) {
        var self = this;
        if (cells) {
            var appSpecIds = []; var methodSpecIds = [];
            this._specMapping = { apps : {}, methods : {} }
            for(var c=0; c<cells.length; c++) {
                if (cells[c].app) {
                    appSpecIds.push(cells[c].app);
                } else if (cells[c].method) {
                    methodSpecIds.push(cells[c].method);
                }
            }
            var getSpecsJobs = [];
            if (appSpecIds.length>0) {
                getSpecsJobs.push(
                    self.nms.get_app_spec({ids:appSpecIds},
                        function(appSpecs) {
                            for (var a=0; a<appSpecs.length; a++) {
                                self._specMapping.apps[appSpecIds[a]] = appSpecs[a];
                            }
                        },
                        function(error) {
                            console.error("error getting app specs:");
                            console.error(error);
                            if(_error_callback) { _error_callback(); }
                        }));
            }
            if (methodSpecIds.length>0) {
                getSpecsJobs.push(
                    self.nms.get_method_spec({ids:methodSpecIds},
                        function(methodSpecs) {
                            for (var a=0; a<methodSpecs.length; a++) {
                                self._specMapping.methods[methodSpecIds[a]] = methodSpecs[a];
                            }
                        },
                        function(error) {
                            console.error("error getting method specs:");
                            console.error(error);
                            if(_error_callback) { _error_callback(); }
                        }));
            }
            
            if (getSpecsJobs.length>0) {
                $.when.apply($, getSpecsJobs).done(function() {
                    _callback();
                });
            } else {
                _callback();
            }
        } else {
            _callback();
        }
    };
    
    
    
    // !! copied from kbaseNarrativeWorkspace !!
    this._safeJSONStringify = function(string) {
        var esc = function(s) { 
            return s.replace(/'/g, "&apos;")
                    .replace(/"/g, "&quot;");
        };
        return JSON.stringify(string, function(key, value) {
            return (typeof(value) === 'string') ? esc(value) : value;
        });
    };
    // !! copied from kbaseNarrativeWorkspace !!
    this._uuidgen = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);});
    };
    
    // !! copied from kbaseNarrativeWorkspace !!
    this.KB_CELL= 'kb-cell';
    this.KB_TYPE= 'type';
    this.KB_APP_CELL= 'kb_app';
    this.KB_FUNCTION_CELL= 'function_input';
    this.KB_OUTPUT_CELL= 'function_output';
    this.KB_ERROR_CELL= 'kb_error';
    this.KB_CODE_CELL= 'kb_code';
    this.KB_STATE= 'widget_state';
};



/*

WORKSPACE INFO
0: ws_id id
1: ws_name workspace
2: username owner
3: timestamp moddate,
4: int object
5: permission user_permission
6: permission globalread,
7: lock_status lockstat
8: usermeta metadata

 
*/
 
 
 

