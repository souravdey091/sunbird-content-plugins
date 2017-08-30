angular.module('textbookmetaApp', ['ngTokenField', 'Scope.safeApply']).controller('textbookmetaController', ['$scope', '$timeout', function($scope, $timeout) {    
    $scope.mode = ecEditor.getConfig('editorConfig').mode;
    $scope.metadataCloneObj = {};
    $scope.nodeId = $scope.nodeType = '';
    $scope.showImageIcon = true;
    $scope.boardList = {};
    $scope.gradeList = [];
    $scope.languageList = [];
    $scope.audienceList = [];
    $scope.subjectList = [];


    ecEditor.getService('meta').getConfigOrdinals(function(err, resp) {
        if (!err) {
            $scope.gradeList = resp.data.result.ordinals.gradeLevel;
            $scope.languageList = resp.data.result.ordinals.language;
            $scope.audienceList = resp.data.result.ordinals.audience;
            $scope.subjectList = resp.data.result.ordinals.language;
            //TODO: Replace below list with API resplonse            
            $scope.boardList["CBSE"]  = "CBSE";
            $scope.boardList["NCERT"] = "NCERT";
            $scope.boardList["ICSE"] = "ICSE"
            $scope.boardList["MSCERT"] = "MSCERT";
            $scope.boardList["Other"] = "Others";
            $scope.$safeApply();                   
        }
    });

    $scope.showAssestBrowser = function(){
        ecEditor.dispatchEvent('org.ekstep.assetbrowser:show', {
            type: 'image',
            search_filter: {}, // All composite keys except mediaType
            callback: function(data) { 
                $scope.textbook.appIcon = data.assetMedia.src;
                $scope.$safeApply();
            }
        });
    }

    $scope.initDropdown = function() {
        $timeout(function() {
            $('#board').dropdown('set selected', $scope.textbook.board);
            $('#medium').dropdown('set selected', $scope.textbook.medium);
            $('#subject').dropdown('set selected', $scope.textbook.subject);
            $('#gradeLevel').dropdown('set selected', $scope.textbook.gradeLevel);
            $('#audience').dropdown('set selected', $scope.textbook.audience);
            $('#language').dropdown('set selected', $scope.textbook.language);    
        });
    }
    
    $scope.updateNode = function(){
        if($scope.textbookMetaForm.$valid){ 
            if(_.isUndefined(org.ekstep.collectioneditor.cache.nodesModified[$scope.nodeId])) {
                org.ekstep.collectioneditor.cache.nodesModified[$scope.nodeId] = {};
                org.ekstep.collectioneditor.cache.nodesModified[$scope.nodeId]["isNew"] = $scope.newNode;
                org.ekstep.collectioneditor.cache.nodesModified[$scope.nodeId]["root"] = true;
            }
            if(_.isString($scope.textbook.keywords)){
                $scope.textbook.keywords = $scope.textbook.keywords.split(',');
            }
            if(_.isString($scope.textbook.gradeLevel)){
                $scope.textbook.gradeLevel = [$scope.textbook.gradeLevel];
            }
            if(_.isString($scope.textbook.language)){
                $scope.textbook.language = [$scope.textbook.language];
            }
            if(_.isString($scope.textbook.audience)){
                $scope.textbook.audience = [$scope.textbook.audience];
            }
            org.ekstep.collectioneditor.api.getService('collection').setNodeTitle($scope.textbook.name);
            $scope.textbook.contentType = $scope.nodeType;
            org.ekstep.collectioneditor.cache.nodesModified[$scope.nodeId].metadata = _.assign(org.ekstep.collectioneditor.cache.nodesModified[$scope.nodeId].metadata , $scope.getUpdatedMetadata($scope.metadataCloneObj, $scope.textbook));
            $scope.metadataCloneObj = _.clone($scope.textbook);
            $scope.editMode = false;
            ecEditor.dispatchEvent('org.ekstep.collectioneditor:node:modified');
            $scope.getPath();
            $scope.$safeApply();
        }else{
            ecEditor.dispatchEvent("org.ekstep.toaster:warning", {
                title: 'Please fill in all required fields',
                position: 'topCenter',
                icon: 'fa fa-warning'
            });
            $scope.submitted = true; 
        }
    }

    $scope.getUpdatedMetadata = function(originalMetadata, currentMetadata){
        var metadata = { };
        if(_.isEmpty(originalMetadata)){
            _.forEach(currentMetadata, function(value, key){
                metadata[key] = value;
            });
        }else{
            _.forEach(currentMetadata   , function(value, key){
                if(_.isUndefined(originalMetadata[key])){
                    metadata[key] = value;
                }else if(value != originalMetadata[key]){
                    metadata[key] = value;
                }
            });
        }
        if(_.isUndefined(metadata['name'])){
            metadata['name'] = originalMetadata['name'];
        }
        if(_.isUndefined(metadata['code'])){
            metadata['code'] = $scope.nodeId;
        }
        if(_.isUndefined(metadata['mimeType'])){
            metadata['mimeType'] = "application/vnd.ekstep.content-collection";
        }

        ecEditor.dispatchEvent("content:title:header:update", metadata['name']);

        return metadata;
    }

    $scope.addlesson = function(){
        ecEditor.dispatchEvent("org.ekstep.lessonbrowser:show");
    }

    $scope.onNodeSelect = function(evant, data){
        var selectedConcepts = [];
        $scope.showImageIcon = false;
        $scope.nodeId = data.data.id;
        $scope.nodeType = data.data.objectType;
        $scope.textbook = {};
        $scope.editMode = $scope.newNode = false;
        $scope.editable = org.ekstep.collectioneditor.api.getService('collection').getObjectType(data.data.objectType).editable;
        $scope.defaultImage = ecEditor.resolvePluginResource("org.ekstep.textbookmeta", "1.0", "assets/default.png");

        var activeNode = org.ekstep.collectioneditor.api.getService('collection').getActiveNode();
        $scope.textbook = (_.isUndefined(org.ekstep.collectioneditor.cache.nodesModified[$scope.nodeId])) ? activeNode.data.metadata : _.assign(activeNode.data.metadata, org.ekstep.collectioneditor.cache.nodesModified[$scope.nodeId].metadata);
        if($scope.mode === "Edit" && $scope.editable === true){
            $scope.editMode = true;
            $('.ui.dropdown').dropdown('refresh');
            $scope.metadataCloneObj = _.clone($scope.textbook);
        }
        if(!_.isEmpty(activeNode.data.metadata) && _.has(activeNode.data.metadata, ["name"])){
            $scope.editMode = false;
            $('#board').dropdown('set selected', $scope.textbook.board);
            $('#medium').dropdown('set selected', $scope.textbook.medium);
            $('#subject').dropdown('set selected', $scope.textbook.subject);
            $('#gradeLevel').dropdown('set selected', $scope.textbook.gradeLevel);
            $('#audience').dropdown('set selected', $scope.textbook.audience);
            $('#language').dropdown('set selected', $scope.textbook.language);
            if(!_.isUndefined(activeNode.data.metadata.concepts)){
                $scope.textbook.concepts = activeNode.data.metadata.concepts;
                if($scope.textbook.concepts.length > 0){
                    $scope.textbook.conceptData = '(' + $scope.textbook.concepts.length + ') concepts selected';
                    _.forEach($scope.textbook.concepts, function(concept){
                        selectedConcepts.push(concept.identifier);
                    });
                }else{
                    $scope.textbook.conceptData = '';
                }
            }
            $scope.metadataCloneObj = _.clone(activeNode.data.metadata);
        }else{
            $scope.newNode = true;
        }
        ecEditor.dispatchEvent('org.ekstep.conceptselector:init', {
            element: 'textbookConceptSelector',
            selectedConcepts: selectedConcepts,
            callback: function(data) {
                $scope.textbook.conceptData = '(' + data.length + ') concepts selected';
                $scope.textbook.concepts = _.map(data, function(concept) {
                    return { "identifier" : concept.id , "name" : concept.name} ;
                });
                $scope.$safeApply();
            }
        });
        $scope.showImageIcon = true;
        $scope.getPath();
        $scope.$safeApply();
    }
    ecEditor.addEventListener('org.ekstep.collectioneditor:node:selected:TextBook', $scope.onNodeSelect);

    $scope.getPath = function() {
        $scope.path = [];
        var path = ecEditor.jQuery("#collection-tree").fancytree("getTree").getActiveNode().getKeyPath();
        _.forEach(path.split('/'), function(key) {
            if(key){
                var node = ecEditor.jQuery("#collection-tree").fancytree("getTree").getNodeByKey(key);
                $scope.path.push({'title' : node.title, 'nodeId'  : node.key });
            }
        });
    }

    setTimeout(function(){
        ecEditor.jQuery('.popup-item').popup();
    },0);
    
    $scope.setActiveNode = function(nodeId){
        org.ekstep.collectioneditor.api.getService('collection').setActiveNode(nodeId);
    }

    $scope.generateTelemetry = function(data) {
        if (data) org.ekstep.services.telemetryService.interact({ "type": data.type, "subtype": data.subtype, "target": data.target, "pluginid": "org.ekstep.textbookmeta", "pluginver": "1.0", "objectid": $scope.nodeId, "stage": $scope.nodeId })
    }
}]);
//# sourceURL=textbookmetaApp.js
