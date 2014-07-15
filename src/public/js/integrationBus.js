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

Integration = (function(){
  /**
   * internal functions to manage the MQTT connnections and 
   * subscription 
   * 
   * @name PubSub 
   * @constructor 
   */
  var PubSub = function(integrationNodeName,host,port){
      this.integrationNodeName = integrationNodeName;
      this.mqttClient = new Messaging.Client(host, port, "i-d:"+integrationNodeName.substring(0,18));

      /** map of topic names to jquery Callbacks objects */
      this.subscriberCallbacks={};    

      /**
       * Register for callback on a specific topic.  Wildcards are not 
       * supported. 
       * @function 
       * @name on 
       * @private 
       * 
       * @param topic {String}
       * @param callback {Function} callback to be invoked when a 
       *                 message is published on the specified topic.
       *                 callback takes a single argument which is an
       *                 object. The type of the object depends on the
       *                 topic.
       *          
       *  
       */
      function on(topic,callback){
          if(this.subscriberCallbacks[topic]==undefined) {
              this.subscriberCallbacks[topic]=$.Callbacks();
          }
          this.subscriberCallbacks[topic].add(callback);
      }
      this.on=on;

      function onMessageArrived(message){
          var topicString = message.destinationName;
          var callbacks = this.subscriberCallbacks[topicString];
          if(callbacks) {
               payloadObj= JSON.parse(message.payloadString);            
               callbacks.fire(payloadObj);
          }        
      }
      this.mqttClient.onMessageArrived = $.proxy(onMessageArrived,this);

      function connect(callback){        
          this.mqttClient.onConnectionLost = function(response){ 
              onError("lost connection to MQTT",response);
          };
          var connectOptions = {
              timeout:5,
              keepAliveInterval : 60,
              useSSL : false,
              onSuccess : $.proxy(function(){
                      this.subscribeToAllTopics(callback);
              },this),
              onFailure: function(responseObject) {
                      onError("failed connecting to MQTT(" + integrationNodeName + ":" + host + ":" + port,
                                             responseObject);
                      callback(responseObject);
              }
          };
          this.mqttClient.connect(connectOptions);
      }
      this.connect=connect;
      
      function subscribeToAllTopics(callback){
          
          var options = {
              qos:0,
              onFailure: function(responseObject) {
                      onError(responseObject);
              }
          };
          var flowStatsTopic = "$SYS/Broker/" + this.integrationNodeName + "/Statistics/JSON/SnapShot/#/applications/#/messageflows/#";
          this.mqttClient.subscribe(flowStatsTopic,options);
          var resourceStatsTopic = "$SYS/Broker/" + this.integrationNodeName + "/Statistics/JSON/Resource/#/";
          this.mqttClient.subscribe(resourceStatsTopic,options);    
      };
      this.subscribeToAllTopics=subscribeToAllTopics;
  };

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
      };

      $.getJSON('/apiv1/integrationbus?depth=7',function(result){
          IntegrationBus.instance=  new IntegrationBus(result);    
          callback(null,IntegrationBus.instance);
          
      }).fail(function(error){
          onError("failed getting JSON for integration bus", error);
          callback(error);
      });
      
  }

  function onError(message,error){
          if(error instanceof String) {
              console.log(message + " : " + error)
          }else{
              console.log(message);
              console.dir(error);
          }
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
      this.host = other.host;
      this.mqtt = other.mqtt;
      this.pubSub = new PubSub( this.name,this.host,this.mqtt);
      this.pubSub.connect(
          function(error){
              if(error) {
                  onError("error connecting to pubSub for " + this.name,error);
              }        
      });

      other.executionGroups.executionGroup.forEach(function(nextIntegrationServer){
          this.integrationServers.push(new IntegrationServer(nextIntegrationServer,this));
      },this);
      
  };

  /**
   * Internal constructor. Do not use. To get an IntegrationServer 
   * object, use 
   * IntegrationNode.integrationServers[] 
   */
  IntegrationServer = function(other,integrationNode){
       /** 
       *  
       * type is always set to IntegrationServer. 
       * @member 
       * @name type
       *  
       */
      this.type = "IntegrationServer";
      this.name = other.name;
      /** provide getter for integration node rather than a
       *  property to avoid cyclic reference propblems   */
      this.getIntegrationNode=function(){
          return integrationNode;
      };

      this.applications = [];
      other.applications.application.forEach(function(nextApplication){
          this.applications.push(new Application(nextApplication,integrationNode));
      },this);

  };

  /**
   * Internal constructor. Do not use. To get an Application
   * object, use IntegrationServer.applications[] 
                                   */
  Application = function(other,integrationNode){
       /** 
       *  
       * type is always set to Application. 
       * @member 
       * @name type
       *  
       */
      this.type = "Application";
      this.name = other.name;
      /** provide getter for integration node rather than a
       *  property to avoid cyclic reference propblems   */
      this.getIntegrationNode=function(){
          return integrationNode;
      };
      this.messageFlows = [];
      other.messageFlows.messageFlow.forEach(function(nextMessageFlow){
          this.messageFlows.push(new MessageFlow(nextMessageFlow,integrationNode));
      },this);

  };

  /**
   * Internal constructor. Do not use. To get a MessageFlow 
   * object, use Application.messageFlows[] 
                                   */
  MessageFlow = function(other,integrationNode){
       /** 
       *  
       * type is always set to MessageFlow. 
       * @member 
       * @name type
       *  
       */
      this.type = "MessageFlow";
      this.name = other.name;
      this.flowStatsTopic=other.flowStatsTopic;
      this.flowStatsEventHandlers=$.Callbacks();

      /** provide getter for integration node rather than a
       *  property to avoid cyclic reference propblems   */
      this.getIntegrationNode=function(){
          return integrationNode;
      };

      //subscribe to accounting and stats for this flow
      integrationNode.pubSub.on(this.flowStatsTopic,$.proxy(onStats,this));
      
      function onStats(stats){
          this.flowStatsEventHandlers.fire(stats);
      };

      /**
       *  Registers a listener for events
       * @method on 
       * @param {String} eventType the name of the event being 
       *        listened for. Possible values are 'resourceStats'
       * 
       * @param {Function} listener function that is called when the 
       *        event fires.  Inside the function this refers to the
       *        MessageFlow object that emitted the event.
       *  
       * Arguments passed to that function depend on the eventType.
       *            messageFlowStats - listener(currentSnapshot) 
       *  
       */
      this.on = function(eventType,callback){
           if(eventType=='messageFlowStats') {
               this.flowStatsEventHandlers.add(callback);
           }
      }

      /** 
       * This event fires whenever a new snapshot of resource 
       * statistics is published. 
       * @event resourceStats 
       * @param {Object} currentSnapshot 
       */

  };

  return{
      getIntegrationBus : getIntegrationBus
  }


})();




