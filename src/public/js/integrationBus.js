/*
Copyright 2014 
Author John Hosie 
 
  All rights reserved. This program and the accompanying materials
  are made available under the terms of the Eclipse Public License v1.0
  which accompanies this distribution, and is available at
  http://www.eclipse.org/legal/epl-v10.html
 
  Contributors:
      John Hosie - initial implementation 
*/


/**
 * Get the singleton IntegrationBus object. 
 * @function 
 * @name getIntegrationBus
 * @param {Function} callback function to call once the 
 *                 integration bus is ready i.e. once its data
 *                 has been loaded from the server.
 */
function getIntegrationBus(callback){
    if(IntegrationBus.instance!=undefined) {
        callback(null,IntegrationBus.instance);        
    }
    $.getJSON('/apiv1/integrationbus?depth=7',function(result){
        IntegrationBus.instance=new IntegrationBus(result);
        callback(null,IntegrationBus.instance);
    }).fail(function(error){
        callback(error);
    });
}

/**
 * 
 * Internal constructor.  Use getIntegrationBus function to 
 * ensure singleton use. 
 * @constructor 
 * @private  
 */
IntegrationBus = function(other){
    //ensure singleton use
    if (this.instance!=undefined){
        throw "IntegrationBus must be a singleton";
    };    

    /**
     * type is always set to IntegrationBus. 
     * @member 
     * @name type 
     */
    this.type = "IntegrationBus";    
    this.integrationNodes = [];

    other.integrationNodes.integrationNode.forEach(function(nextIntegrationNode){
        this.integrationNodes.push(new IntegrationNode(nextIntegrationNode));
    },this);
    
};

/**
 * 
 * Internal constructor.  Do not use.  To get an IntegrationNode
 * object, use 
 * getIntegrationBus().integrationNodes[] 
 * @constructor 
 * @private 
 */
IntegrationNode = function(other){
     /** 
     *  
     * type is always set to IntegrationNode. 
     * @member 
     * @name type
     *  
     */
    this.type = "IntegrationNode";
    this.name = other.name;
    this.integrationServers=[];

    other.executionGroups.executionGroup.forEach(function(nextIntegrationServer){
        this.integrationServers.push(new IntegrationServer(nextIntegrationServer));
    },this);
};

/**
 * Internal constructor. Do not use. To get an IntegrationServer 
 * object, use 
 * IntegrationNode.integrationServers[] 
 */
IntegrationServer = function(other){
     /** 
     *  
     * type is always set to IntegrationServer. 
     * @member 
     * @name type
     *  
     */
    this.type = "IntegrationServer";
    this.name = other.name;
    this.applications = [];

    other.applications.application.forEach(function(nextApplication){
        this.applications.push(new Application(nextApplication));
    },this);

};

/**
 * Internal constructor. Do not use. To get an Application
 * object, use IntegrationServer.applications[] 
                                 */
Application = function(other){
     /** 
     *  
     * type is always set to Application. 
     * @member 
     * @name type
     *  
     */
    this.type = "Application";
    this.name = other.name;
    this.messageFlows = [];
    other.messageFlows.messageFlow.forEach(function(nextMessageFlow){
        this.messageFlows.push(new MessageFlow(nextMessageFlow));
    },this);

};

/**
 * Internal constructor. Do not use. To get a MessageFlow 
 * object, use Application.messageFlows[] 
                                 */
MessageFlow = function(other){
     /** 
     *  
     * type is always set to MessageFlow. 
     * @member 
     * @name type
     *  
     */
    this.type = "MessageFlow";
    this.name = other.name;

};
